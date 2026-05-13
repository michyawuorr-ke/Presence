"use client";
import{useEffect,useState,useRef,useCallback}from"react";
import{useParams}from"next/navigation";
import{supabase}from"@/lib/supabase/client";
import QRCode from"qrcode";

type Screen="splash"|"identity"|"scene";
type Tab="scene"|"networking"|"ticket"|"profile";

function cleanUrl(url:string){
  if(!url)return"";
  return url.replace("https://","").replace("http://","").replace("www.","");
}

function copyToClipboard(text:string){
  const el=document.createElement("textarea");
  el.value=text;
  el.style.position="fixed";
  el.style.opacity="0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try{document.execCommand("copy");}catch(e){}
  document.body.removeChild(el);
}

function getFirstName(name:string){
  if(!name)return"";
  return name.split(" ")[0];
}

function generatePositions(count:number){
  const zones=[
    {x:15,y:20},{x:75,y:15},{x:85,y:45},{x:70,y:75},
    {x:30,y:80},{x:10,y:55},{x:50,y:25},{x:45,y:65},
  ];
  return zones.slice(0,count).map(z=>({
    x:z.x+(Math.random()*10-5),
    y:z.y+(Math.random()*10-5),
  }));
}

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
  const[displayName,setDisplayName]=useState("");
  const[role,setRole]=useState("");
  const[organisation,setOrganisation]=useState("");
  const[bio,setBio]=useState("");
  const[link,setLink]=useState("");
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");

  async function save(){
    if(!displayName.trim()){setError("Name is required");return;}
    setSaving(true);
    setError("");
    const{data,error:err}=await supabase.from("guest_profiles").insert({
      registration_id:registration.id,
      event_id:registration.event_id,
      display_name:displayName,
      role_title:role,
      organisation,
      bio,
      platform_type:"link",
      platform_value:link,
      aura_active:false,
    }).select().single();
    if(err){setError(err.message);setSaving(false);return;}
    onComplete(data);
  }

  const inp={width:"100%",padding:"14px",borderRadius:"14px",border:"1px solid #333",background:"#111",color:"#fff",fontSize:"15px",outline:"none",marginBottom:"12px",boxSizing:"border-box" as const};

  return(
    <div style={{minHeight:"100vh",background:"#000",color:"#fff",padding:"40px 20px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>Set up your profile</p>
      <div style={{maxWidth:"400px",margin:"0 auto"}}>
        <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={inp}/>
        <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Your role or title" style={inp}/>
        <input value={organisation} onChange={e=>setOrganisation(e.target.value)} placeholder="Organisation (optional)" style={inp}/>
        <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Short bio (optional)" style={{...inp,minHeight:"80px",resize:"vertical"}}/>
        <input value={link} onChange={e=>setLink(e.target.value)} placeholder="LinkedIn, Instagram, or your website (optional)" style={{...inp,border:"1px solid "+(link?"#4ade80":"#333")}}/>
        {error&&<p style={{color:"#ef4444",fontSize:"13px",marginBottom:"12px"}}>{error}</p>}
        <button onClick={save} disabled={saving||!displayName.trim()} style={{width:"100%",padding:"16px",borderRadius:"16px",background:saving||!displayName.trim()?"#333":"#fff",color:saving||!displayName.trim()?"#666":"#000",border:"none",fontSize:"15px",cursor:saving||!displayName.trim()?"not-allowed":"pointer",fontWeight:"600",marginTop:"8px"}}>{saving?"Saving...":"Continue →"}</button>
      </div>
    </div>
  );
}

function Scene({event,registration,profile,onProfileUpdate}:any){
const[entryQR,setEntryQR]=useState("");
const[networkingQR,setNetworkingQR]=useState("");
  useEffect(()=>{if(!registration)return;QRCode.toDataURL("presence:entry:"+registration.id,{errorCorrectionLevel:"H",margin:2,width:256}).then(setEntryQR).catch(console.error);QRCode.toDataURL("presence:unlock:"+registration.id,{errorCorrectionLevel:"H",margin:2,width:256}).then(setNetworkingQR).catch(console.error);},[registration]);
const[tab,setTab]=useState<Tab>("scene");
  const[editing,setEditing]=useState(false);
  const[countdown,setCountdown]=useState({days:0,hours:0,minutes:0,seconds:0});
  const[networkingCount,setNetworkingCount]=useState(0);
  const[connectionsCount,setConnectionsCount]=useState(0);
  const[fiveMin,setFiveMin]=useState(false);
  const[eventStatus,setEventStatus]=useState(event?.status||"");
  const isLive=eventStatus==="live";
  const isEnded=eventStatus==="ended";
  const nav=[
    {id:"scene",l:"Scene",e:"✦"},
    {id:"networking",l:"Networking",e:"◎"},
    {id:"ticket",l:"Ticket",e:"🎟"},
    {id:"profile",l:"Profile",e:"◐"}
  ];

  useEffect(()=>{
    if(!event)return;
    setEventStatus(event.status);
    supabase.from("events").select("status").eq("id",event.id).single().then(({data})=>{if(data)setEventStatus(data.status);});
    const evCh=supabase.channel("event-status:"+event.id).on("postgres_changes",{event:"UPDATE",schema:"public",table:"events",filter:"id=eq."+event.id},(p)=>{setEventStatus(p.new.status);}).subscribe();
    const tick=setInterval(()=>{
      const n=new Date();
      const s=new Date(event.start_time);
      const e2=new Date(event.end_time);
      const diff=s.getTime()-n.getTime();
      if(diff>0){
        setCountdown({
          days:Math.floor(diff/86400000),
          hours:Math.floor((diff%86400000)/3600000),
          minutes:Math.floor((diff%3600000)/60000),
          seconds:Math.floor((diff%60000)/1000),
        });
      }
      const toEnd=e2.getTime()-n.getTime();
      if(toEnd>0&&toEnd<300000)setFiveMin(true);
    },1000);
    return()=>{clearInterval(tick);supabase.removeChannel(evCh);};
  },[event]);

  useEffect(()=>{
    if(!event)return;
    async function fetchCounts(){
      const{count:nc}=await supabase.from("guest_profiles").select("*",{count:"exact",head:true}).eq("event_id",event.id).eq("aura_active",true);
      setNetworkingCount(nc||0);
      const{count:cc}=await supabase.from("handshakes").select("*",{count:"exact",head:true}).eq("event_id",event.id);
      setConnectionsCount(cc||0);
    }
    fetchCounts();
    const interval=setInterval(fetchCounts,30000);
    return()=>clearInterval(interval);
  },[event]);

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(to bottom, #f8f9fa 0%, #f1f3f5 100%)",paddingBottom:"100px",fontFamily:"-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif"}}>
      {fiveMin&&<div style={{background:"#f59e0b",padding:"12px 20px",textAlign:"center"}}><p style={{color:"#000",fontSize:"13px",fontWeight:"500"}}>⏱ Event ends in 5 minutes</p></div>}

      {tab==="scene"&&(
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"10px",letterSpacing:"0.4em",color:"#999",textTransform:"uppercase",marginBottom:"20px",fontWeight:"600"}}>PRESENCE</p>
          <h1 style={{fontSize:"30px",fontWeight:"600",color:"#0a0a0b",marginBottom:"8px",letterSpacing:"-0.02em",lineHeight:"1.1"}}>{event?.title}</h1>
          <p style={{fontSize:"14px",color:"#666",marginBottom:"2px"}}>📍 {event?.venue}</p>
          <p style={{fontSize:"14px",color:"#999",marginBottom:"32px"}}>{event&&new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long"})}</p>
          
          {isEnded?(
            <div style={{background:"linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 100%)",borderRadius:"24px",padding:"28px",marginBottom:"16px",textAlign:"center",boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
              <p style={{color:"#fff",fontSize:"18px",marginBottom:"8px"}}>Event has ended</p>
              <p style={{color:"#666",fontSize:"14px",marginBottom:"16px"}}>Your connections are saved</p>
              <button onClick={()=>setTab("profile")} style={{padding:"12px 24px",borderRadius:"14px",background:"#fff",color:"#000",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>View connections →</button>
            </div>
          ):isLive?(
            <div style={{background:"linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 100%)",borderRadius:"24px",padding:"20px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
              <span style={{width:"10px",height:"10px",borderRadius:"50%",background:"#4ade80",display:"inline-block",boxShadow:"0 0 0 0 rgba(74,222,128,0.7)",animation:"pulse 2s infinite"}}/><style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.7)}50%{box-shadow:0 0 0 8px rgba(74,222,128,0)}}`}</style>
              <p style={{color:"#fff",fontSize:"16px",fontWeight:"500"}}>Event is live</p>
            </div>
          ):(
            <div style={{background:"linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 100%)",borderRadius:"24px",padding:"28px",marginBottom:"16px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
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
          
          {isLive&&(
            <div style={{background:"#ffffff",borderRadius:"24px",padding:"28px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.08)",boxShadow:"0 2px 8px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)"}}>
              <p style={{fontSize:"12px",color:"#999",marginBottom:"16px",letterSpacing:"0.1em"}}>LIVE NOW</p>
              <div style={{display:"flex",gap:"24px",marginBottom:"20px"}}>
                <div><p style={{fontSize:"36px",fontWeight:"700",color:"#2563eb",lineHeight:"1"}}>{networkingCount}</p><p style={{fontSize:"12px",color:"#999"}}>networking now</p></div>
                <div style={{width:"1px",background:"#f3f4f6"}}/>
                <div><p style={{fontSize:"36px",fontWeight:"700",color:"#2563eb",lineHeight:"1"}}>{connectionsCount}</p><p style={{fontSize:"12px",color:"#999"}}>connections</p></div>
              </div>
              <button onClick={()=>setTab("networking")} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",color:"#fff",border:"none",fontSize:"15px",cursor:"pointer",fontWeight:"600",boxShadow:"0 4px 12px rgba(37,99,235,0.3)",transition:"transform 0.2s,box-shadow 0.2s"}}>Start Networking →</button>
            </div>
          )}
        </div>
      )}

      {tab==="networking"&&(
        <NetworkingTab event={event} profile={profile} isLive={isLive} isEnded={isEnded}/>
      )}

      {tab==="ticket"&&(
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>Your Ticket</p>
          <div style={{background:"#fff",borderRadius:"24px",padding:"32px",border:"1px solid rgba(0,0,0,0.06)",textAlign:"center",marginBottom:"16px",boxShadow:"0 4px 16px rgba(0,0,0,0.04)"}}>
            <h2 style={{fontSize:"20px",fontWeight:"500",marginBottom:"4px"}}>{event?.title}</h2>
            <p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>📍 {event?.venue}</p>
            <p style={{fontSize:"14px",color:"#999",marginBottom:"24px"}}>{event&&new Date(event.start_time).toLocaleDateString()}</p>
            <div style={{background:"#000",borderRadius:"16px",padding:"32px",marginBottom:"16px"}}>
              <p style={{color:"#fff",fontSize:"14px",marginBottom:"8px"}}>Entry QR</p>
              <p style={{color:"#555",fontSize:"12px",marginBottom:"16px"}}>Show at entrance</p>
              {entryQR?<img src={entryQR} style={{width:"200px",height:"200px",margin:"0 auto"}}/>:<p style={{color:"#666"}}>Generating...</p>}
            </div>
            <div style={{background:"#1a1a1a",borderRadius:"16px",padding:"32px",marginTop:"24px"}}><p style={{color:"#fff",fontSize:"14px",marginBottom:"8px"}}>Networking QR</p><p style={{color:"#555",fontSize:"12px",marginBottom:"16px"}}>For profile unlocks after connecting</p>{networkingQR?<img src={networkingQR} style={{width:"200px",height:"200px",margin:"0 auto"}}/>:<p style={{color:"#666"}}>Generating...</p>}</div>
          </div>
        </div>
      )}

      {tab==="profile"&&(
        <ProfileTab profile={profile} event={event} onProfileUpdate={onProfileUpdate} isEnded={isEnded}/>
      )}

      <div style={{position:"fixed",bottom:"12px",left:"12px",right:"12px",background:"rgba(255,255,255,0.95)",backdropFilter:"blur(32px)",borderRadius:"24px",border:"1px solid rgba(0,0,0,0.08)",display:"flex",padding:"16px 8px",boxShadow:"0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)"}}>
        {nav.map(item=>(
          <button key={item.id} onClick={()=>{setTab(item.id as Tab);setEditing(false);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",background:tab===item.id?"rgba(37,99,235,0.08)":"none",border:"none",cursor:"pointer",padding:"12px 8px",borderRadius:"14px",transition:"all 0.3s ease"}}>
            <span style={{fontSize:"20px",opacity:tab===item.id?1:0.35,transform:tab===item.id?"scale(1.1)":"scale(1)",transition:"all 0.2s"}}>{item.e}</span>
            <span style={{fontSize:"11px",color:tab===item.id?"#2563eb":"#999",fontWeight:tab===item.id?"600":"400",letterSpacing:"0.02em"}}>{item.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NetworkingTab({event,profile,isLive,isEnded}:any){
  const[networkingActive,setNetworkingActive]=useState(profile?.aura_active||false);
  const[nodes,setNodes]=useState<any[]>([]);
  const[incoming,setIncoming]=useState<any>(null);
  const[confirmNode,setConfirmNode]=useState<any>(null);
  const[sentRequests,setSentRequests]=useState<Set<string>>(new Set());
  const[notification,setNotification]=useState<string>("");
  const channelRef=useRef<any>(null);

  const fetchNodes=useCallback(async()=>{
    if(!profile||!event)return;
    const{data:approved}=await supabase.from("handshakes").select("guest_profile_id_a,guest_profile_id_b").eq("event_id",event.id).or("guest_profile_id_a.eq."+profile.id+",guest_profile_id_b.eq."+profile.id);
    const approvedSet=new Set<string>();
    (approved||[]).forEach((h:any)=>{
      if(h.guest_profile_id_a!==profile.id)approvedSet.add(h.guest_profile_id_a);
      if(h.guest_profile_id_b!==profile.id)approvedSet.add(h.guest_profile_id_b);
    });
    const{data}=await supabase.from("guest_profiles").select("*").eq("event_id",event.id).eq("aura_active",true).neq("id",profile.id).limit(8);
    const filtered=(data||[]).filter((n:any)=>!approvedSet.has(n.id));
    const positions=generatePositions(filtered.length);
    setNodes(filtered.map((n:any,i:number)=>({...n,...positions[i]})));
    setSentRequests(new Set());
  },[profile,event]);

  useEffect(()=>{
    if(!isLive||!event||!profile||!networkingActive)return;
    fetchNodes();
    const interval=setInterval(fetchNodes,60000);
    const ch=supabase.channel("aura:"+event.id)
      .on("broadcast",{event:"aura_ignited"},(payload:any)=>{
        setNodes(prev=>{
          if(prev.find((n:any)=>n.id===payload.payload.guest_profile_id))return prev;
          if(payload.payload.guest_profile_id===profile.id)return prev;
          const pos=generatePositions(1)[0];
          return[...prev,{...payload.payload,...pos}].slice(0,8);
        });
      })
      .on("broadcast",{event:"aura_invisible"},(payload:any)=>{
        setNodes(prev=>prev.filter((n:any)=>n.id!==payload.payload.guest_profile_id));
      })
      .on("broadcast",{event:"handshake_requested"},(payload:any)=>{
        if(payload.payload.recipient_id===profile.id){
          setIncoming(payload.payload);
          setTimeout(()=>setIncoming(null),300000);
        }
      })
      .on("broadcast",{event:"handshake_approved"},(payload:any)=>{
        if(payload.payload.requester_id===profile.id||payload.payload.recipient_id===profile.id){
          setNotification(getFirstName(payload.payload.requester_name)+" connected with "+getFirstName(payload.payload.recipient_name));
          setTimeout(()=>setNotification(""),8000);
          fetchNodes();
        }
      })
      .subscribe();
    channelRef.current=ch;
    return()=>{
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  },[isLive,event,profile,networkingActive,fetchNodes]);

  async function startNetworking(){
    setNetworkingActive(true);
    await supabase.from("guest_profiles").update({aura_active:true}).eq("id",profile.id);
    await supabase.from("aura_status_logs").insert({guest_profile_id:profile.id,event_id:event.id,action:"ignited"});
    await channelRef.current?.send({type:"broadcast",event:"aura_ignited",payload:{guest_profile_id:profile.id,display_name:profile.display_name}});
  }

  async function stopNetworking(){
    await supabase.from("guest_profiles").update({aura_active:false}).eq("id",profile.id);
    await supabase.from("aura_status_logs").insert({guest_profile_id:profile.id,event_id:event.id,action:"invisible"});
    await channelRef.current?.send({type:"broadcast",event:"aura_invisible",payload:{guest_profile_id:profile.id}});
    setNetworkingActive(false);
  }

  async function sendRequest(node:any){
    if(sentRequests.has(node.id))return;
    setConfirmNode(null);
    setSentRequests(prev=>new Set(prev).add(node.id));
    const{data:req}=await supabase.from("handshake_requests").insert({requester_id:profile.id,recipient_id:node.id,event_id:event.id,status:"pending"}).select().single();
    await channelRef.current?.send({type:"broadcast",event:"handshake_requested",payload:{request_id:req?.id,requester_id:profile.id,recipient_id:node.id,requester_name:profile.display_name}});
  }

  async function respondRequest(approved:boolean){
    if(!incoming)return;
    const status=approved?"approved":"declined";
    await supabase.from("handshake_requests").update({status}).eq("id",incoming.request_id);
    if(approved){
      await supabase.from("handshakes").insert({event_id:event.id,guest_profile_id_a:incoming.requester_id,guest_profile_id_b:profile.id,networking_status:"connected"});
      await channelRef.current?.send({type:"broadcast",event:"handshake_approved",payload:{requester_id:incoming.requester_id,recipient_id:profile.id,requester_name:incoming.requester_name,recipient_name:profile.display_name}});
    }
    setIncoming(null);
    fetchNodes();
  }

  if(!isLive&&!isEnded){
    return(
      <div style={{padding:"24px 20px",textAlign:"center",background:"#0a0a0b",minHeight:"calc(100vh - 100px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <p style={{fontSize:"48px",marginBottom:"16px",opacity:0.2}}>◎</p>
        <p style={{fontSize:"16px",color:"#555",marginBottom:"8px"}}>Networking opens when event starts</p>
      </div>
    );
  }

  if(isEnded){
    return(
      <div style={{padding:"24px 20px",textAlign:"center",background:"#0a0a0b",minHeight:"calc(100vh - 100px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <p style={{fontSize:"48px",marginBottom:"16px",opacity:0.2}}>◎</p>
        <p style={{fontSize:"16px",color:"#555",marginBottom:"8px"}}>Networking has closed</p>
        <p style={{fontSize:"14px",color:"#444"}}>Your connections are saved in Profile</p>
      </div>
    );
  }

  return(
    <div style={{background:"#0a0a0b",minHeight:"calc(100vh - 100px)",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-8px)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.4)}50%{box-shadow:0 0 0 12px rgba(37,99,235,0)}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"300px",height:"300px",background:"radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>

      <div style={{position:"absolute",top:"16px",right:"16px",background:"rgba(255,255,255,0.08)",borderRadius:"20px",padding:"6px 12px"}}>
        <p style={{color:"#fff",fontSize:"12px"}}>{nodes.length} nearby</p>
      </div>

      {notification&&(
        <div style={{position:"absolute",top:"24px",left:"50%",transform:"translateX(-50%)",background:"rgba(74,222,128,0.25)",border:"2px solid rgba(74,222,128,0.5)",borderRadius:"24px",padding:"12px 24px",animation:"fadeIn 0.4s ease",zIndex:10,boxShadow:"0 4px 12px rgba(74,222,128,0.2)"}}>
          <p style={{color:"#4ade80",fontSize:"15px",fontWeight:"500",whiteSpace:"nowrap"}}>{notification}</p>
        </div>
      )}

      {!networkingActive&&(
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",backdropFilter:"blur(20px)",zIndex:5}}>
          <p style={{fontSize:"48px",marginBottom:"16px",opacity:0.2}}>◎</p>
          <p style={{color:"#fff",fontSize:"18px",fontWeight:"300",marginBottom:"8px"}}>Networking Off</p>
          <p style={{color:"#555",fontSize:"14px",marginBottom:"40px"}}>Nobody can see you</p>
          <button onClick={startNetworking} style={{padding:"16px 40px",borderRadius:"50px",background:"#fff",color:"#000",border:"none",fontSize:"16px",fontWeight:"600",cursor:"pointer"}}>Start Networking</button>
        </div>
      )}

      {networkingActive&&nodes.map((node:any)=>{
        const isSent=sentRequests.has(node.id);
        const firstName=getFirstName(node.display_name);
        return(
          <div key={node.id} style={{position:"absolute",left:node.x+"%",top:node.y+"%",transform:"translate(-50%,-50%)",animation:"float 4s ease-in-out infinite",zIndex:2}}>
            <button onClick={()=>!isSent&&setConfirmNode(node)} style={{width:"56px",height:"56px",borderRadius:"50%",background:"#2563eb",border:"none",cursor:isSent?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",animation:"pulse 2s infinite",opacity:isSent?0.5:1}}>
              <span style={{color:"#fff",fontSize:"13px",fontWeight:"500"}}>{firstName.charAt(0)}</span>
            </button>
            <p style={{color:"#fff",fontSize:"11px",textAlign:"center",marginTop:"6px",opacity:0.7}}>{isSent?"sent":firstName}</p>
          </div>
        );
      })}

      {networkingActive&&(
        <div style={{position:"absolute",bottom:"24px",left:"50%",transform:"translateX(-50%)"}}>
          <button onClick={stopNetworking} style={{padding:"12px 28px",borderRadius:"50px",background:"rgba(255,255,255,0.08)",color:"#fff",border:"1px solid rgba(255,255,255,0.15)",fontSize:"14px",cursor:"pointer"}}>Stop Networking</button>
        </div>
      )}

      {confirmNode&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:20}} onClick={()=>setConfirmNode(null)}>
          <div style={{background:"#1a1a1a",borderRadius:"24px 24px 0 0",padding:"28px",width:"100%",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
            <p style={{color:"#fff",fontSize:"18px",fontWeight:"500",marginBottom:"8px"}}>Connect with {getFirstName(confirmNode.display_name)}?</p>
            <p style={{color:"#666",fontSize:"14px",marginBottom:"28px"}}>{confirmNode.role_title||""}</p>
            <div style={{display:"flex",gap:"12px"}}>
              <button onClick={()=>setConfirmNode(null)} style={{flex:1,padding:"14px",borderRadius:"14px",background:"#333",color:"#fff",border:"none",fontSize:"15px",cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>sendRequest(confirmNode)} style={{flex:1,padding:"14px",borderRadius:"14px",background:"#fff",color:"#000",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>Send Request →</button>
            </div>
          </div>
        </div>
      )}

      {incoming&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:20}}>
          <div style={{background:"#1a1a1a",borderRadius:"24px 24px 0 0",padding:"28px",width:"100%",animation:"slideUp 0.3s ease"}}>
            <p style={{color:"#fff",fontSize:"18px",fontWeight:"500",marginBottom:"8px"}}>{getFirstName(incoming.requester_name)} wants to connect</p>
            <p style={{color:"#666",fontSize:"14px",marginBottom:"28px"}}>Connection request</p>
            <div style={{display:"flex",gap:"12px"}}>
              <button onClick={()=>respondRequest(false)} style={{flex:1,padding:"14px",borderRadius:"14px",background:"#333",color:"#fff",border:"none",fontSize:"15px",cursor:"pointer"}}>Decline</button>
              <button onClick={()=>respondRequest(true)} style={{flex:1,padding:"14px",borderRadius:"14px",background:"#4ade80",color:"#000",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>Approve ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({profile,event,onProfileUpdate,isEnded}:any){
  const[editing,setEditing]=useState(false);
  const[connections,setConnections]=useState<any[]>([]);

  useEffect(()=>{
    if(!profile||!event)return;
    async function loadConnections(){
      const{data:handshakes}=await supabase.from("handshakes").select("guest_profile_id_a,guest_profile_id_b").eq("event_id",event.id).or("guest_profile_id_a.eq."+profile.id+",guest_profile_id_b.eq."+profile.id);
      const connectedIds=(handshakes||[]).map((h:any)=>h.guest_profile_id_a===profile.id?h.guest_profile_id_b:h.guest_profile_id_a);
      if(connectedIds.length===0){setConnections([]);return;}
      const{data:profiles}=await supabase.from("guest_profiles").select("*").in("id",connectedIds);
      setConnections(profiles||[]);
    }
    loadConnections();
  },[profile,event]);

  return(
    <div style={{padding:"24px 20px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>Your Profile</p>
      
      <div style={{background:"#fff",borderRadius:"24px",padding:"24px",border:"1px solid rgba(0,0,0,0.06)",marginBottom:"16px",boxShadow:"0 4px 16px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"20px"}}>
          <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <p style={{color:"#fff",fontSize:"18px",fontWeight:"500"}}>{profile?.display_name?.charAt(0)?.toUpperCase()}</p>
          </div>
          <div>
            <p style={{fontSize:"18px",fontWeight:"500"}}>{profile?.display_name}</p>
            {profile?.role_title&&<p style={{fontSize:"13px",color:"#666"}}>{profile.role_title}</p>}
          </div>
        </div>
        {profile?.organisation&&<p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>{profile.organisation}</p>}
        {profile?.bio&&<p style={{fontSize:"14px",color:"#999",marginTop:"12px"}}>{profile.bio}</p>}
        {profile?.platform_value&&<p style={{fontSize:"13px",color:"#2563eb",marginTop:"12px"}}>{cleanUrl(profile.platform_value)}</p>}
        <button onClick={()=>setEditing(!editing)} style={{width:"100%",marginTop:"16px",padding:"12px",borderRadius:"12px",background:"#2563eb",color:"#fff",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>{editing?"Cancel":"Edit Profile"}</button>
      </div>

      {editing&&<EditProfile profile={profile} onSave={(p:any)=>{onProfileUpdate(p);setEditing(false);}}/>}

      <div style={{marginTop:"32px"}}>
        <h2 style={{fontSize:"16px",fontWeight:"500",marginBottom:"16px"}}>Your Connections</h2>
        {connections.length===0?(
          <p style={{color:"#999",fontSize:"14px",textAlign:"center",padding:"40px 0"}}>
            {isEnded?"No connections from this event":"Connect with people to see them here"}
          </p>
        ):(
          connections.map((c:any)=>{const isUnlocked=false;return(
            <div key={c.id} style={{background:"#fff",borderRadius:"20px",padding:"18px",marginBottom:"10px",border:"1px solid rgba(0,0,0,0.06)",boxShadow:"0 2px 8px rgba(0,0,0,0.03)"}}>
              <p style={{fontSize:"15px",fontWeight:"500",marginBottom:"2px"}}>{c.display_name}</p>
              {c.role_title&&<p style={{fontSize:"13px",color:"#666",marginBottom:"2px"}}>{c.role_title}</p>}
              {isUnlocked&&c.organisation&&<p style={{fontSize:"13px",color:"#999",marginBottom:"8px"}}>{c.organisation}</p>}
              {isUnlocked&&c.platform_value&&<p style={{fontSize:"13px",color:"#2563eb"}}>{cleanUrl(c.platform_value)}</p>}
            </div>
          );}
          )
        )}
      </div>
    </div>
  );
}

function EditProfile({profile,onSave}:any){
  const[displayName,setDisplayName]=useState(profile?.display_name??"");
  const[role,setRole]=useState(profile?.role_title??"");
  const[organisation,setOrganisation]=useState(profile?.organisation??"");
  const[bio,setBio]=useState(profile?.bio??"");
  const[link,setLink]=useState(profile?.platform_value??"");
  const[saving,setSaving]=useState(false);

  async function save(){
    setSaving(true);
    const{data}=await supabase.from("guest_profiles").update({
      display_name:displayName,
      role_title:role,
      organisation,
      bio,
      platform_type:"link",
      platform_value:link,
    }).eq("id",profile.id).select().single();
    if(data)onSave(data);
    setSaving(false);
  }

  const inp={width:"100%",padding:"12px",borderRadius:"12px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",marginBottom:"10px",boxSizing:"border-box" as const};

  return(
    <div style={{background:"#f9fafb",borderRadius:"20px",padding:"20px"}}>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={inp}/>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Your role or title" style={inp}/>
      <input value={organisation} onChange={e=>setOrganisation(e.target.value)} placeholder="Organisation" style={inp}/>
      <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Short bio" style={{...inp,minHeight:"60px",resize:"vertical"}}/>
      <input value={link} onChange={e=>setLink(e.target.value)} placeholder="LinkedIn, Instagram, or your website" style={inp}/>
      <button onClick={save} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:"14px",background:saving?"#999":"#2563eb",color:"#fff",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>{saving?"Saving...":"Save changes"}</button>
    </div>
  );
}
