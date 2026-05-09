"use client";
import{useEffect,useState}from"react";
import{useParams}from"next/navigation";
import{supabase}from"@/lib/supabase/client";

type Screen="splash"|"identity"|"scene";

export default function GuestEntryPage(){
  const[screen,setScreen]=useState<Screen>("splash");
  const[registration,setRegistration]=useState<any>(null);
  const[profile,setProfile]=useState<any>(null);
  const[event,setEvent]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const params=useParams();
  const token=params.token as string;
  const slug=params.slug as string;

  useEffect(()=>{
    async function load(){
      const{data:reg}=await supabase.from("registrations").select("*").eq("access_token",token).single();
      setRegistration(reg);
      const{data:ev}=await supabase.from("events").select("*").eq("id",reg.event_id).single();
      setEvent(ev);
      const{data:prof}=await supabase.from("guest_profiles").select("*").eq("registration_id",reg.id).single();
      if(prof)setProfile(prof);
      setLoading(false);
    }
    load();
  },[token]);

  useEffect(()=>{
    if(loading)return;
    const timer=setTimeout(()=>{
      if(profile)setScreen("scene");
      else setScreen("identity");
    },2200);
    return()=>clearTimeout(timer);
  },[loading,profile]);

  if(screen==="splash")return<Splash/>;
  if(screen==="identity")return<Identity registration={registration} event={event} onComplete={(p:any)=>{setProfile(p);setScreen("scene");}}/>;
  return<Scene event={event} registration={registration} profile={profile} onProfileUpdate={setProfile}/>;
}

function Splash(){
  return(
    <div style={{position:"fixed",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <style>{`@keyframes fi{from{opacity:0;letter-spacing:0.1em}to{opacity:1;letter-spacing:0.25em}}`}</style>
      <p style={{color:"#fff",fontSize:"18px",fontWeight:"300",letterSpacing:"0.25em",textTransform:"uppercase",animation:"fi 1.4s ease forwards"}}>Presence Manifested</p>
    </div>
  );
}

function Identity({registration,event,onComplete}:any){
  const[mode,setMode]=useState<"professional"|"creative">("professional");
  const[displayName,setDisplayName]=useState(registration?.guest_name??"");
  const[roleTitle,setRoleTitle]=useState("");
  const[organisation,setOrganisation]=useState("");
  const[bio,setBio]=useState("");
  const[platformType,setPlatformType]=useState("linkedin");
  const[platformValue,setPlatformValue]=useState("");
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const isPro=mode==="professional";

  async function save(){
    setSaving(true);
    const{data,error:err}=await supabase.from("guest_profiles").insert({
      registration_id:registration.id,event_id:registration.event_id,
      identity_mode:mode,display_name:displayName,role_title:roleTitle,
      organisation,bio,platform_type:platformType,platform_value:platformValue,
    }).select().single();
    if(err){setError(err.message);setSaving(false);return;}
    onComplete(data);
  }

  const inp={width:"100%",padding:"14px",borderRadius:"14px",border:"1px solid #222",background:"#111",color:"#fff",fontSize:"15px",outline:"none",marginBottom:"12px",boxSizing:"border-box" as const};

  return(
    <div style={{minHeight:"100vh",background:"#000",padding:"40px 24px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>Presence</p>
      <h1 style={{fontSize:"24px",fontWeight:"300",color:"#fff",marginBottom:"8px",textAlign:"center"}}>Who are you here as?</h1>
      <p style={{color:"#555",textAlign:"center",marginBottom:"32px",fontSize:"14px"}}>{event?.title}</p>
      <div style={{display:"flex",gap:"8px",marginBottom:"32px",background:"#111",borderRadius:"16px",padding:"4px"}}>
        <button onClick={()=>{setMode("professional");setPlatformType("linkedin");}} style={{flex:1,padding:"12px",borderRadius:"12px",border:"none",cursor:"pointer",background:isPro?"#2563eb":"transparent",color:isPro?"#fff":"#666",fontSize:"14px",fontWeight:"500"}}>Professional</button>
      </div>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={inp}/>
      <input value={roleTitle} onChange={e=>setRoleTitle(e.target.value)} placeholder={isPro?"Job title (e.g. Product Manager)":"Creative role (e.g. Filmmaker)"} style={inp}/>
      <input value={organisation} onChange={e=>setOrganisation(e.target.value)} placeholder={isPro?"Company / Organisation":"Studio / Collective (optional)"} style={inp}/>
      <input value={bio} onChange={e=>setBio(e.target.value)} placeholder={isPro?"Short bio":"Your vibe"} style={inp}/>
      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
        {(isPro?[{v:"linkedin",l:"LinkedIn"},{v:"gmail",l:"Gmail"}]:[{v:"tiktok",l:"TikTok"},{v:"instagram",l:"Instagram"}]).map(p=>(
          <button key={p.v} onClick={()=>setPlatformType(p.v)} style={{flex:1,padding:"10px",borderRadius:"12px",border:"1px solid "+(platformType===p.v?"#fff":"#222"),background:"transparent",color:platformType===p.v?"#fff":"#666",fontSize:"13px",cursor:"pointer"}}>{p.l}</button>
        ))}
      </div>
      <input value={platformValue} onChange={e=>setPlatformValue(e.target.value)} placeholder={platformType==="linkedin"?"LinkedIn URL":platformType==="gmail"?"Gmail address":platformType==="tiktok"?"@TikTok handle":"@Instagram handle"} style={{...inp,marginTop:"8px"}}/>
      {error&&<p style={{color:"#ef4444",fontSize:"13px",marginBottom:"12px"}}>{error}</p>}
      <button onClick={save} disabled={saving} style={{width:"100%",padding:"16px",borderRadius:"16px",background:saving?"#333":isPro?"#2563eb":"#7c3aed",color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>{saving?"Saving...":"Enter the scene →"}</button>
    </div>
  );
}

function Scene({event,registration,profile,onProfileUpdate}:any){
  const[tab,setTab]=useState("scene");
  const[editing,setEditing]=useState(false);
  const[countdown,setCountdown]=useState({days:0,hours:0,minutes:0,seconds:0,isOver:false});
  const[auraCount,setAuraCount]=useState(0);
  const[handshakeCount,setHandshakeCount]=useState(0);
  const[broadcasts,setBroadcasts]=useState<any[]>([]);
  const[isLive,setIsLive]=useState(false);
  const[isEnded,setIsEnded]=useState(false);
  const[fiveMin,setFiveMin]=useState(false);

  useEffect(()=>{
    const iv=setInterval(()=>{
      const now=new Date().getTime();
      const start=new Date(event.start_time).getTime();
      const end=new Date(event.end_time).getTime();
      const diff=start-now;
      const toEnd=end-now;
      setIsLive(now>=start&&now<end);
      setIsEnded(now>=end);
      setFiveMin(toEnd>0&&toEnd<=5*60*1000);
      if(diff<=0){setCountdown({days:0,hours:0,minutes:0,seconds:0,isOver:true});}
      else{setCountdown({days:Math.floor(diff/(1000*60*60*24)),hours:Math.floor((diff%(1000*60*60*24))/(1000*60*60)),minutes:Math.floor((diff%(1000*60*60))/(1000*60)),seconds:Math.floor((diff%(1000*60))/1000),isOver:false});}
    },1000);
    return()=>clearInterval(iv);
  },[event]);

  useEffect(()=>{
    async function loadStats(){
      const[a,h,m]=await Promise.all([
        supabase.from("guest_profiles").select("id",{count:"exact"}).eq("event_id",event.id).eq("aura_active",true),
        supabase.from("handshakes").select("id",{count:"exact"}).eq("event_id",event.id),
        supabase.from("broadcast_messages").select("*").eq("event_id",event.id).order("sent_at",{ascending:false}).limit(5),
      ]);
      setAuraCount(a.count??0);
      setHandshakeCount(h.count??0);
      setBroadcasts(m.data??[]);
    }
    loadStats();
    const iv=setInterval(loadStats,60000);
    return()=>clearInterval(iv);
  },[event]);

  const isPro=profile?.identity_mode==="professional";
  const accent=isPro?"#2563eb":"#7c3aed";
  const nav=[{id:"scene",l:"Scene",e:"✦"},{id:"aura",l:"Aura",e:"◎"},{id:"ticket",l:"Ticket",e:"🎟"},{id:"profile",l:"Profile",e:"◐"},{id:"archive",l:"Archive",e:"◇"}];

  return(
    <div style={{minHeight:"100vh",background:"#fafafa",paddingBottom:"80px"}}>
      {fiveMin&&<div style={{background:"#f59e0b",padding:"12px 20px",textAlign:"center"}}><p style={{color:"#000",fontSize:"13px",fontWeight:"500"}}>⏱ Event ends in 5 minutes — finalise your connections</p></div>}

      {tab==="scene"&&(
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"24px"}}>Presence</p>
          <h1 style={{fontSize:"26px",fontWeight:"500",color:"#0a0a0b",marginBottom:"4px"}}>{event?.title}</h1>
          <p style={{fontSize:"14px",color:"#666",marginBottom:"2px"}}>📍 {event?.venue}</p>
          <p style={{fontSize:"14px",color:"#999",marginBottom:"24px"}}>{event&&new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long"})}</p>
          {isEnded?(
            <div style={{background:"#000",borderRadius:"20px",padding:"24px",marginBottom:"16px",textAlign:"center"}}>
              <p style={{color:"#fff",fontSize:"18px",marginBottom:"8px"}}>Event has ended</p>
              <p style={{color:"#666",fontSize:"14px",marginBottom:"16px"}}>Thank you for being present</p>
              <button onClick={()=>setTab("archive")} style={{padding:"12px 24px",borderRadius:"14px",background:"#fff",color:"#000",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>View your connections →</button>
            </div>
          ):isLive?(
            <div style={{background:"#000",borderRadius:"20px",padding:"20px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>
              <p style={{color:"#fff",fontSize:"16px"}}>Event is live</p>
            </div>
          ):(
            <div style={{background:"#000",borderRadius:"20px",padding:"24px",marginBottom:"16px"}}>
              <p style={{fontSize:"12px",color:"#666",marginBottom:"16px",letterSpacing:"0.1em"}}>STARTS IN</p>
              <div style={{display:"flex",gap:"16px",justifyContent:"center"}}>
                {[{v:countdown.days,l:"Days"},{v:countdown.hours,l:"Hrs"},{v:countdown.minutes,l:"Min"},{v:countdown.seconds,l:"Sec"}].map(({v,l})=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <p style={{fontSize:"32px",fontWeight:"300",color:"#fff",lineHeight:"1"}}>{String(v).padStart(2,"0")}</p>
                    <p style={{fontSize:"11px",color:"#666",marginTop:"4px"}}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{background:"#fff",borderRadius:"20px",padding:"20px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)"}}>
            <p style={{fontSize:"12px",color:"#999",marginBottom:"12px",letterSpacing:"0.1em"}}>LIVE NETWORKING</p>
            <div style={{display:"flex",gap:"24px"}}>
              <div><p style={{fontSize:"28px",fontWeight:"500",color:accent}}>{auraCount}</p><p style={{fontSize:"12px",color:"#999"}}>on Aura</p></div>
              <div style={{width:"1px",background:"#f3f4f6"}}/>
              <div><p style={{fontSize:"28px",fontWeight:"500",color:accent}}>{handshakeCount}</p><p style={{fontSize:"12px",color:"#999"}}>handshakes</p></div>
            </div>
          </div>
          {broadcasts.length>0&&(
            <div>
              <p style={{fontSize:"12px",color:"#999",marginBottom:"12px",letterSpacing:"0.1em"}}>FROM THE HOST</p>
              {broadcasts.map((b:any)=>(
                <div key={b.id} style={{background:"#fff",borderRadius:"16px",padding:"16px",marginBottom:"8px",border:"1px solid rgba(0,0,0,0.06)"}}>
                  <p style={{fontSize:"14px",color:"#0a0a0b"}}>{b.content}</p>
                  <p style={{fontSize:"11px",color:"#999",marginTop:"8px"}}>{new Date(b.sent_at).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="aura"&&(
        <div style={{padding:"24px 20px",textAlign:"center"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px"}}>Aura</p>
            <div style={{padding:"60px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◎</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Aura is not yet active</p>
              <p style={{fontSize:"14px",color:"#999"}}>Networking opens when the event starts</p>
            </div>
          ):isEnded?(
            <div style={{padding:"60px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◎</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Aura has closed</p>
              <p style={{fontSize:"14px",color:"#999"}}>Your connections are saved in Archive</p>
            </div>
          ):(
            <div style={{padding:"40px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◎</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Aura is ready</p>
              <p style={{fontSize:"14px",color:"#999",marginBottom:"32px"}}>Full Aura system coming soon</p>
              <div style={{background:"#fff",borderRadius:"20px",padding:"20px",border:"1px solid rgba(0,0,0,0.06)"}}>
                <p style={{fontSize:"28px",fontWeight:"500",color:accent,marginBottom:"4px"}}>{auraCount}</p>
                <p style={{fontSize:"13px",color:"#999"}}>guests currently on Aura</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="ticket"&&(
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>Your Ticket</p>
          <div style={{background:"#fff",borderRadius:"24px",padding:"32px",border:"1px solid rgba(0,0,0,0.06)",textAlign:"center",marginBottom:"16px"}}>
            <h2 style={{fontSize:"20px",fontWeight:"500",marginBottom:"4px"}}>{event?.title}</h2>
            <p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>📍 {event?.venue}</p>
            <p style={{fontSize:"14px",color:"#999",marginBottom:"24px"}}>{event&&new Date(event.start_time).toLocaleDateString()}</p>
            <div style={{background:"#000",borderRadius:"16px",padding:"32px",marginBottom:"16px"}}>
              <p style={{color:"#fff",fontSize:"14px",marginBottom:"8px"}}>Entry QR</p>
              <p style={{color:"#555",fontSize:"12px",marginBottom:"16px"}}>Show at entrance</p>
              <p style={{color:"#444",fontSize:"10px",wordBreak:"break-all"}}>{registration?.id}</p>
            </div>
            <p style={{fontSize:"12px",color:"#999"}}>QR image generation coming in next update</p>
          </div>
        </div>
      )}

      {tab==="profile"&&(
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>Your Profile</p>
          <div style={{background:"#fff",borderRadius:"24px",padding:"24px",border:"1px solid rgba(0,0,0,0.06)",marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"20px"}}>
              <div style={{width:"48px",height:"48px",borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <p style={{color:"#fff",fontSize:"18px",fontWeight:"500"}}>{profile?.display_name?.charAt(0)?.toUpperCase()}</p>
              </div>
              <div>
                <p style={{fontSize:"18px",fontWeight:"500"}}>{profile?.display_name}</p>
                <p style={{fontSize:"13px",color:accent}}>{isPro?"Professional":"Creative"}</p>
              </div>
            </div>
            {profile?.role_title&&<p style={{fontSize:"14px",color:"#333",marginBottom:"4px"}}>{profile.role_title}</p>}
            {profile?.organisation&&<p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>{profile.organisation}</p>}
            {profile?.bio&&<p style={{fontSize:"14px",color:"#999",marginTop:"12px"}}>{profile.bio}</p>}
            {profile?.platform_value&&<p style={{fontSize:"13px",color:accent,marginTop:"12px"}}>{profile.platform_type}: {profile.platform_value}</p>}
          </div>
          {editing&&<EditProfile profile={profile} accent={accent} onSave={(p:any)=>{onProfileUpdate(p);setEditing(false);}}/>}
        </div>
      )}

      {tab==="archive"&&(
        <div style={{padding:"24px 20px",textAlign:"center"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px"}}>Archive</p>
            <div style={{padding:"60px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◇</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Archive unlocks after the event</p>
              <p style={{fontSize:"14px",color:"#999"}}>Your connections will appear here</p>
            </div>
          ):(
            <div style={{padding:"40px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◇</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Your connections</p>
              <p style={{fontSize:"14px",color:"#999"}}>Full archive coming in next update</p>
            </div>
          )}
        </div>
      )}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(0,0,0,0.06)",display:"flex",padding:"8px 0 20px"}}>
        {nav.map(item=>(
          <button key={item.id} onClick={()=>{setTab(item.id);setEditing(false);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",background:"none",border:"none",cursor:"pointer",padding:"8px 0"}}>
            <span style={{fontSize:"18px",opacity:tab===item.id?1:0.4}}>{item.e}</span>
            <span style={{fontSize:"10px",color:tab===item.id?accent:"#999",fontWeight:tab===item.id?"600":"400"}}>{item.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EditProfile({profile,accent,onSave}:any){
  const[mode,setMode]=useState(profile?.identity_mode??"professional");
  const[displayName,setDisplayName]=useState(profile?.display_name??"");
  const[roleTitle,setRoleTitle]=useState(profile?.role_title??"");
  const[organisation,setOrganisation]=useState(profile?.organisation??"");
  const[bio,setBio]=useState(profile?.bio??"");
  const[platformType,setPlatformType]=useState(profile?.platform_type??"linkedin");
  const[platformValue,setPlatformValue]=useState(profile?.platform_value??"");
  const[saving,setSaving]=useState(false);
  const isPro=mode==="professional";

  async function save(){
    setSaving(true);
    const{data}=await supabase.from("guest_profiles").update({
      identity_mode:mode,display_name:displayName,role_title:roleTitle,
      organisation,bio,platform_type:platformType,platform_value:platformValue,
      identity_last_changed_at:new Date().toISOString(),
    }).eq("id",profile.id).select().single();
    if(data)onSave(data);
    setSaving(false);
  }

  const inp={width:"100%",padding:"12px",borderRadius:"12px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",marginBottom:"10px",boxSizing:"border-box" as const};

  return(
    <div style={{background:"#f9fafb",borderRadius:"20px",padding:"20px"}}>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",background:"#fff",borderRadius:"12px",padding:"4px"}}>
        <button onClick={()=>{setMode("professional");setPlatformType("linkedin");}} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",background:isPro?"#2563eb":"transparent",color:isPro?"#fff":"#999",fontSize:"13px"}}>Professional</button>
      </div>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={inp}/>
      <input value={roleTitle} onChange={e=>setRoleTitle(e.target.value)} placeholder={isPro?"Job title":"Creative role"} style={inp}/>
      <input value={organisation} onChange={e=>setOrganisation(e.target.value)} placeholder={isPro?"Company":"Studio / Collective"} style={inp}/>
      <input value={bio} onChange={e=>setBio(e.target.value)} placeholder={isPro?"Short bio":"Your vibe"} style={inp}/>
      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
        {(isPro?[{v:"linkedin",l:"LinkedIn"},{v:"gmail",l:"Gmail"}]:[{v:"tiktok",l:"TikTok"},{v:"instagram",l:"Instagram"}]).map(p=>(
          <button key={p.v} onClick={()=>setPlatformType(p.v)} style={{flex:1,padding:"8px",borderRadius:"10px",border:"1px solid "+(platformType===p.v?"#000":"#e5e7eb"),background:"transparent",color:platformType===p.v?"#000":"#999",fontSize:"12px",cursor:"pointer"}}>{p.l}</button>
        ))}
      </div>
      <input value={platformValue} onChange={e=>setPlatformValue(e.target.value)} placeholder={platformType==="linkedin"?"LinkedIn URL":platformType==="gmail"?"Gmail":platformType==="tiktok"?"@TikTok":"@Instagram"} style={inp}/>
      <button onClick={save} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:"14px",background:saving?"#999":isPro?"#2563eb":"#7c3aed",color:"#fff",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>{saving?"Saving...":"Save changes"}</button>
    </div>
  );
}
