"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import QRCode from "qrcode";

interface SceneViewProps {
  event: any;
  registration: any;
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

// Renders the post-onboarding attendee experience (Scene / Networking / Ticket / Profile tabs).
// Expects real database rows passed in by the parent page — not reconstructed onboarding form state.
export default function SceneView({ event, registration, profile, onProfileUpdate }: SceneViewProps) {
  return (
    <Scene
      event={event}
      registration={registration}
      profile={profile}
      onProfileUpdate={onProfileUpdate}
    />
  );
}

// ==========================================
// YOUR EXACT UNTOUCHED EMBEDDED FUNCTIONAL TABS BELOW

// Re-injecting exact scope utility logic for the historical engine
type Tab = "scene" | "networking" | "ticket" | "profile";

function getFirstName(fullName: string) {
  if (!fullName) return "Friend";
  return fullName.trim().split(" ")[0];
}

function cleanUrl(url: string) {
  if (!url) return "";
  return url.replace(/^(https?:\/\/)?(www\.)?/, "");
}

function generatePositions(count: number) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const radius = 90 + Math.random() * 30;
    positions.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }
  return positions;
}
  
// ==========================================
function Scene({event,registration,profile,onProfileUpdate}:any){
const[entryQR,setEntryQR]=useState("");
const[networkingQR,setNetworkingQR]=useState("");
  useEffect(()=>{
  if(!registration)return;
  async function genQRs(){
    // Generate signed QR payloads via API
    const res=await fetch('/api/qr/generate?reg_id='+registration.id).catch(()=>null);
    if(res?.ok){
      const{entryPayload,unlockPayload}=await res.json();
      QRCode.toDataURL(entryPayload,{errorCorrectionLevel:"H",margin:2,width:256}).then(setEntryQR).catch(console.error);
      QRCode.toDataURL(unlockPayload,{errorCorrectionLevel:"H",margin:2,width:256}).then(setNetworkingQR).catch(console.error);
    }else{
      // Fallback to unsigned (backward compat)
      QRCode.toDataURL("presence:entry:"+registration.id,{errorCorrectionLevel:"H",margin:2,width:256}).then(setEntryQR).catch(console.error);
      QRCode.toDataURL("presence:unlock:"+registration.id,{errorCorrectionLevel:"H",margin:2,width:256}).then(setNetworkingQR).catch(console.error);
    }
  }
  genQRs();
},[registration]);
const[tab,setTab]=useState<Tab>("scene");
  const[editing,setEditing]=useState(false);
  const[countdown,setCountdown]=useState({days:0,hours:0,minutes:0,seconds:0});
  const[networkingCount,setNetworkingCount]=useState(0);
  const[connectionsCount,setConnectionsCount]=useState(0);
  const[fiveMin,setFiveMin]=useState(false);
  const[eventStatus,setEventStatus]=useState(event?.status||"");
  const[pendingCount,setPendingCount]=useState(0);
  const isLive=eventStatus==="live";
  const isEnded=eventStatus==="ended";
  const nav=[
    {id:"scene",l:"Scene",e:"✦"},
    {id:"networking",l:"Networking",e:"◎"},
    {id:"ticket",l:"Ticket",e:"🎟"},
    {id:"profile",l:"Profile",e:"◐",badge:pendingCount}
  ];

  useEffect(()=>{
    if(!profile||!event)return;
    async function loadPendingCount(){
      const{count}=await supabase.from("handshake_requests").select("*",{count:"exact",head:true}).eq("recipient_id",profile.id).eq("event_id",event.id).eq("status","pending").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      setPendingCount(count||0);
    }
    loadPendingCount();
    const ch=supabase.channel("nav-pending:"+profile.id)
      .on("postgres_changes",{event:"*",schema:"public",table:"handshake_requests"},(payload:any)=>{
        if(payload.new?.recipient_id===profile.id||payload.old?.recipient_id===profile.id)loadPendingCount();
      })
      .subscribe();
    return()=>{supabase.removeChannel(ch);};
  },[profile,event]);

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
      const{data:eventGuests,count:nc}=await supabase.from("guest_profiles").select("id",{count:"exact"}).eq("event_id",event.id).eq("aura_active",true);
      setNetworkingCount(nc||0);
      const{data:allEventGuestIds}=await supabase.from("guest_profiles").select("id").eq("event_id",event.id);
      const ids=(allEventGuestIds||[]).map((g:any)=>g.id);
      if(ids.length===0){setConnectionsCount(0);return;}
      const{count:cc}=await supabase.from("handshakes").select("*",{count:"exact",head:true}).or(`sender_id.in.(${ids.join(",")}),receiver_id.in.(${ids.join(",")})`);
      setConnectionsCount(cc||0);
    }
    fetchCounts();
    const interval=setInterval(fetchCounts,15000);
    // Realtime subscription for instant count updates.
    // handshakes has no event_id column to filter on server-side, so we
    // subscribe unfiltered and just trigger a fresh scoped refetch.
    const hsCh=supabase.channel("handshakes-count:"+event.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"handshakes"},()=>fetchCounts())
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"guest_profiles",filter:"event_id=eq."+event.id},()=>fetchCounts())
      .subscribe();
    return()=>{clearInterval(interval);supabase.removeChannel(hsCh);};
  },[event]);

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg,#0a0a0c 0%,#0f0d14 40%,#0a0a0c 100%)",paddingBottom:"100px",fontFamily:"var(--font-inter),-apple-system,sans-serif"}}>
      {fiveMin&&<div style={{background:"#E26D34",padding:"12px 20px",textAlign:"center"}}><p style={{color:"#000",fontSize:"13px",fontWeight:"500"}}>⏱ Event ends in 5 minutes</p></div>}

      {tab==="scene"&&(
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"18px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"20px",fontFamily:"'Helvetica Neue',Arial,sans-serif"}}><span style={{color:"#ffffff"}}>Or</span><span style={{color:"#E26D34"}}>ee</span><span style={{color:"#ffffff"}}>ti</span></p>
          <h1 style={{fontSize:"28px",fontWeight:"500",color:"#f0ede8",marginBottom:"8px",letterSpacing:"-0.03em",lineHeight:"1.15"}}>{event?.title}</h1>
          <p style={{fontSize:"13px",color:"rgba(240,237,232,0.5)",marginBottom:"4px",letterSpacing:"0.01em"}}>📍 {event?.venue}</p>
          <p style={{fontSize:"13px",color:"rgba(240,237,232,0.35)",marginBottom:"28px",letterSpacing:"0.01em"}}>{event&&new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long"})}</p>
          
          {isEnded?(
            <div style={{background:"linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 100%)",borderRadius:"24px",padding:"28px",marginBottom:"16px",textAlign:"center",boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
              <p style={{color:"#fff",fontSize:"18px",marginBottom:"8px"}}>Event has ended</p>
              <p style={{color:"#666",fontSize:"14px",marginBottom:"16px"}}>Your connections are saved</p>
              <button onClick={()=>setTab("profile")} style={{padding:"12px 24px",borderRadius:"14px",background:"#fff",color:"#000",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>View connections →</button>
            </div>
          ):isLive?(
            <div style={{background:"#0c0c10",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"10px",border:"1px solid rgba(240,237,232,0.04)"}}>
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
            <div style={{background:"#0c0c10",borderRadius:"16px",padding:"20px",marginBottom:"12px",border:"1px solid rgba(240,237,232,0.04)",boxShadow:"var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.04)",backdropFilter:"blur(20px)"}}>
              <p style={{fontSize:"10px",color:"#E26D34",marginBottom:"12px",letterSpacing:"0.15em",fontWeight:"600"}}>LIVE NOW</p>
              <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"}}>
                <div style={{background:"rgba(226,109,52,0.03)",borderRadius:"10px",padding:"12px 16px",border:"1px solid rgba(226,109,52,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <p style={{fontSize:"13px",color:"#E26D34",fontWeight:"500",margin:0,letterSpacing:"0.02em"}}>networking now</p>
                  <p style={{fontSize:"22px",fontWeight:"300",color:"#E26D34",lineHeight:"1",margin:0}}>{networkingCount}</p>
                </div>
                <div style={{background:"rgba(226,109,52,0.03)",borderRadius:"10px",padding:"12px 16px",border:"1px solid rgba(226,109,52,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <p style={{fontSize:"28px",fontWeight:"700",color:"#E26D34",lineHeight:"1",marginBottom:"2px"}}>{connectionsCount}</p>
                  <p style={{fontSize:"12px",color:"#E26D34",fontWeight:"500"}}>handshakes exchanged</p>
                </div>
              </div>
              <button onClick={()=>setTab("networking")} style={{width:"100%",padding:"11px",borderRadius:"10px",background:"transparent",color:"#E26D34",border:"1px solid rgba(226,109,52,0.35)",fontSize:"13px",cursor:"pointer",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.2s ease"}}>Start Networking →</button>
            </div>
          )}
        </div>
      )}

      {tab==="networking"&&(
        <NetworkingTab event={event} profile={profile} isLive={isLive} isEnded={isEnded} registration={registration}/>
      )}

      {tab==="ticket"&&(
        <div style={{padding:"12px"}}>
          <p style={{fontSize:"10px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"12px",textAlign:"center"}}>Your Ticket</p>
          <div style={{background:"#141416",borderRadius:"20px",padding:"20px",border:"1px solid rgba(240,237,232,0.05)",boxShadow:"0 12px 40px rgba(0,0,0,0.5)",textAlign:"center",marginBottom:"8px"}}>
            <h2 style={{fontSize:"17px",fontWeight:"600",marginBottom:"2px"}}>{event?.title}</h2>
            <p style={{fontSize:"12px",color:"#666",marginBottom:"2px"}}>📍 {event?.venue}</p>
            <p style={{fontSize:"12px",color:"#999",marginBottom:"16px"}}>{event&&new Date(event.start_time).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}</p>
            <div style={{background:"#000",borderRadius:"10px",padding:"12px",marginBottom:"8px"}}>
              <p style={{color:"#fff",fontSize:"12px",fontWeight:"500",marginBottom:"4px"}}>Entry QR</p>
              <p style={{color:"#555",fontSize:"11px",marginBottom:"12px"}}>Show at entrance</p>
              {entryQR?<img src={entryQR} style={{width:"130px",height:"130px",margin:"0 auto",display:"block"}}/>:<p style={{color:"#666",fontSize:"12px"}}>Generating...</p>}
            </div>
            <details style={{background:"#111",borderRadius:"10px",padding:"12px",border:"1px solid rgba(240,237,232,0.03)"}}>
              <summary style={{listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}>
                <div>
                  <p style={{color:"#fff",fontSize:"12px",fontWeight:"500",margin:0}}>Networking QR</p>
                  <p style={{color:"#555",fontSize:"11px",margin:"4px 0 0"}}>For profile unlocks</p>
                </div>
                <span style={{fontSize:"11px",color:"#FFBF00",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",background:"rgba(255,255,255,0.05)",padding:"4px 8px",borderRadius:"6px"}}>Toggle ⊙</span>
              </summary>
              <div style={{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                {networkingQR?<img src={networkingQR} style={{width:"130px",height:"130px",margin:"0 auto",display:"block"}}/>:<p style={{color:"#666",fontSize:"12px"}}>Generating...</p>}
              </div>
            </details>
          </div>
        </div>
      )}

      {tab==="profile"&&(
        <ProfileTab profile={profile} event={event} onProfileUpdate={onProfileUpdate} isEnded={isEnded} registration={registration}/>
      )}

      <div style={{position:"fixed",bottom:"8px",left:"8px",right:"8px",background:"rgba(15,15,19,0.92)",backdropFilter:"blur(32px)",borderRadius:"20px",border:"1px solid rgba(255,255,255,0.08)",display:"flex",padding:"8px 4px",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
        {nav.map(item=>(
          <button key={item.id} onClick={()=>{setTab(item.id as Tab);setEditing(false);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",background:tab===item.id?"rgba(226,109,52,0.1)":"none",border:"none",cursor:"pointer",padding:"8px 4px",borderRadius:"12px",transition:"all 0.15s ease",boxShadow:tab===item.id?"inset 0 0 0 1px rgba(226,109,52,0.15)":"none",position:"relative"}}>
            <span style={{fontSize:"16px",opacity:tab===item.id?1:0.35,transform:tab===item.id?"scale(1.1)":"scale(1)",transition:"all 0.2s",position:"relative"}}>
              {item.e}
              {!!item.badge&&item.badge>0&&(
                <span style={{position:"absolute",top:"-6px",right:"-10px",background:"#E26D34",color:"#000",fontSize:"9px",fontWeight:"700",borderRadius:"9px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",lineHeight:1}}>{item.badge>9?"9+":item.badge}</span>
              )}
            </span>
            <span style={{fontSize:"11px",color:tab===item.id?"#E26D34":"#999",fontWeight:tab===item.id?"600":"400",letterSpacing:"0.02em"}}>{item.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function parseIntents(raw:any):string[]{
  if(Array.isArray(raw))return raw;
  if(typeof raw==="string"&&raw.trim()){
    try{
      const parsed=JSON.parse(raw);
      return Array.isArray(parsed)?parsed:[];
    }catch{
      return[];
    }
  }
  return[];
}

function PreEventDiscovery({event,profile,sentRequests,setSentRequests}:any){
  const[attendees,setAttendees]=useState<any[]>([]);
  const[stations,setStations]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[confirmTarget,setConfirmTarget]=useState<any>(null);
  const[notification,setNotification]=useState("");

  useEffect(()=>{
    if(!event||!profile)return;
    let cancelled=false;
    async function load(){
      const[{data:guests},{data:st}]=await Promise.all([
        supabase.from("guest_profiles").select("id,display_name,role_title,organisation,networking_intents,target_station_id").eq("event_id",event.id).eq("networking_visible",true).neq("id",profile.id),
        supabase.from("event_stations").select("id,name").eq("event_id",event.id),
      ]);
      if(cancelled)return;
      setAttendees((guests||[]).map((g:any)=>({...g,networking_intents:parseIntents(g.networking_intents)})));
      setStations(st||[]);
      setLoading(false);
    }
    load();
    return()=>{cancelled=true;};
  },[event,profile]);

  async function sendConnect(target:any){
    setConfirmTarget(null);
    setSentRequests((prev:Set<string>)=>new Set(prev).add(target.id));
    const{error}=await supabase.from("handshake_requests").insert({
      requester_id:profile.id,
      recipient_id:target.id,
      event_id:event.id,
      status:"pending",
      expires_at:event.end_time,
    });
    if(error){
      // Roll back optimistic state if the insert genuinely failed
      setSentRequests((prev:Set<string>)=>{
        const next=new Set(prev);
        next.delete(target.id);
        return next;
      });
      setNotification("Couldn't send that request — try again.");
      setTimeout(()=>setNotification(""),4000);
    }else{
      setNotification(`Request sent to ${getFirstName(target.display_name)}`);
      setTimeout(()=>setNotification(""),4000);
    }
  }

  if(loading){
    return(
      <div style={{padding:"24px 20px",textAlign:"center",background:"#0a0a0b",minHeight:"calc(100vh - 100px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:"16px",height:"16px",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:"#E26D34",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const stationless=attendees.filter((a:any)=>!a.target_station_id);
  const grouped=stations
    .map((s:any)=>({...s,attendees:attendees.filter((a:any)=>a.target_station_id===s.id)}))
    .filter((s:any)=>s.attendees.length>0);

  return(
    <div style={{padding:"20px 16px",background:"#0a0a0b",minHeight:"calc(100vh - 100px)"}}>
      <p style={{fontSize:"10px",color:"#E26D34",letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",marginBottom:"4px"}}>Before The Event</p>
      <p style={{fontSize:"13px",color:"rgba(240,237,232,0.4)",marginBottom:"20px"}}>See who's coming and where they'll be.</p>

      {notification&&(
        <div style={{background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px"}}>
          <p style={{color:"#E26D34",fontSize:"12px",margin:0}}>{notification}</p>
        </div>
      )}

      {attendees.length===0?(
        <p style={{color:"#555",fontSize:"14px",textAlign:"center",padding:"60px 0"}}>No other attendees registered yet.</p>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          {grouped.map((station:any)=>(
            <div key={station.id}>
              <p style={{fontSize:"11px",fontWeight:"700",color:"rgba(240,237,232,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"10px"}}>{station.name}</p>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {station.attendees.map((a:any)=>(
                  <AttendeeCard key={a.id} attendee={a} sent={sentRequests.has(a.id)} onConnect={()=>setConfirmTarget(a)}/>
                ))}
              </div>
            </div>
          ))}
          {stationless.length>0&&(
            <div>
              <p style={{fontSize:"11px",fontWeight:"700",color:"rgba(240,237,232,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"10px"}}>No Station Selected</p>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {stationless.map((a:any)=>(
                  <AttendeeCard key={a.id} attendee={a} sent={sentRequests.has(a.id)} onConnect={()=>setConfirmTarget(a)}/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {confirmTarget&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:30}} onClick={()=>setConfirmTarget(null)}>
          <div style={{background:"#0c0c0f",borderRadius:"24px 24px 0 0",padding:"24px",width:"100%",borderTop:"1px solid rgba(255,255,255,0.05)"}} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:"10px",color:"#E26D34",letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",marginBottom:"8px"}}>Intentional Handshake</p>
            <p style={{color:"#fff",fontSize:"17px",fontWeight:"500",marginBottom:"4px"}}>Meet {getFirstName(confirmTarget.display_name)}?</p>
            <p style={{color:"#666",fontSize:"13px",marginBottom:"12px"}}>{confirmTarget.role_title||""}</p>
            {confirmTarget.networking_intents?.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"20px"}}>
                {confirmTarget.networking_intents.map((intent:string)=>(
                  <span key={intent} style={{fontSize:"11px",color:"#E26D34",background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"5px",padding:"3px 10px",fontWeight:"600"}}>{intent}</span>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:"12px"}}>
              <button onClick={()=>setConfirmTarget(null)} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"rgba(240,237,232,0.5)",border:"1px solid rgba(240,237,232,0.15)",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>sendConnect(confirmTarget)} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"#E26D34",border:"1px solid rgba(226,109,52,0.4)",fontSize:"13px",cursor:"pointer",fontWeight:"500"}}>Send Handshake Request →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendeeCard({attendee,sent,onConnect,live}:any){
  return(
    <div style={{background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"14px",padding:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            {live&&<span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#4ade80",display:"inline-block",animation:"pulse 2s infinite",flexShrink:0}}/>}
            <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",margin:0}}>{attendee.display_name}</p>
          </div>
          {attendee.role_title&&<p style={{fontSize:"12px",color:"#888",margin:"2px 0 0"}}>{attendee.role_title}{attendee.organisation?` · ${attendee.organisation}`:""}</p>}
          {attendee.networking_intents?.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"8px"}}>
              {attendee.networking_intents.map((intent:string)=>(
                <span key={intent} style={{fontSize:"10px",color:"#E26D34",background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.18)",borderRadius:"5px",padding:"2px 7px",fontWeight:"600"}}>{intent}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onConnect}
          disabled={sent}
          style={{flexShrink:0,fontSize:"11px",fontWeight:"600",color:sent?"rgba(240,237,232,0.3)":"#E26D34",background:sent?"rgba(255,255,255,0.03)":"transparent",border:sent?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(226,109,52,0.35)",borderRadius:"8px",padding:"6px 12px",cursor:sent?"default":"pointer"}}
        >
          {sent?"Sent":"Connect"}
        </button>
      </div>
    </div>
  );
}

function NetworkingTab({event,profile,isLive,isEnded,registration}:any){
  const[networkingActive,setNetworkingActive]=useState(false);
  const[auraLoaded,setAuraLoaded]=useState(false);
  const isHostUser=registration?.status==="host";
  const[nodes,setNodes]=useState<any[]>([]);
  const[hostNode,setHostNode]=useState<any>(null);
  const[incoming,setIncoming]=useState<any>(null);
  const[confirmNode,setConfirmNode]=useState<any>(null);
  const[sentRequests,setSentRequests]=useState<Set<string>>(new Set());
  const[notification,setNotification]=useState<string>("");
  const channelRef=useRef<any>(null);

  const[declinedIds,setDeclinedIds]=useState<Set<string>>(new Set());

  // Load aura state from DB on mount
  useEffect(()=>{
    if(!profile||auraLoaded)return;
    async function loadAura(){
      const{data:prof}=await supabase.from("guest_profiles").select("aura_active").eq("id",profile.id).single();
      if(prof?.aura_active)setNetworkingActive(true);
      // Load already-sent requests
      const{data:sent}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).in("status",["pending","approved"]);
      setSentRequests(new Set((sent||[]).map((r:any)=>r.recipient_id)));
      // Load declined requests (where I was requester and got declined)
      const{data:declined}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).eq("status","declined");
      setDeclinedIds(new Set((declined||[]).map((r:any)=>r.recipient_id)));
      // Host auto-starts networking
      if(registration?.status==="host"&&!prof?.aura_active){
        await supabase.from("guest_profiles").update({aura_active:true}).eq("id",profile.id);
        setNetworkingActive(true);
      }
      setAuraLoaded(true);
    }
    loadAura();
  },[profile,event,auraLoaded]);

  const fetchNodes=useCallback(async()=>{
    if(!profile||!event)return;
    const{data:approved}=await supabase.from("handshakes").select("sender_id,receiver_id").or("sender_id.eq."+profile.id+",receiver_id.eq."+profile.id);
    const approvedSet=new Set<string>();
    (approved||[]).forEach((h:any)=>{
      if(h.sender_id!==profile.id)approvedSet.add(h.sender_id);
      if(h.receiver_id!==profile.id)approvedSet.add(h.receiver_id);
    });
    const{data:sentReqs}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).in("status",["pending","approved"]);
    const sentSet=new Set((sentReqs||[]).map((r:any)=>r.recipient_id));
    const{data:declinedReqs}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).eq("status","declined");
    const declinedSet=new Set((declinedReqs||[]).map((r:any)=>r.recipient_id));
    setDeclinedIds(declinedSet);
    setSentRequests(sentSet);
    const{data}=await supabase.from("guest_profiles").select("*").eq("event_id",event.id).eq("aura_active",true).eq("networking_visible",true).neq("id",profile.id).limit(8);
    // Also fetch blocked users to hide them from aura
    const{data:blockedData}=await supabase.from("guest_blocks").select("blocked_id").eq("blocker_id",profile.id).eq("event_id",event.id);
    const blockedSet=new Set((blockedData||[]).map((b:any)=>b.blocked_id));
    const filtered=(data||[]).filter((n:any)=>!approvedSet.has(n.id)&&!declinedSet.has(n.id)&&!blockedSet.has(n.id));
    setNodes(filtered.map((n:any)=>({...n,networking_intents:parseIntents(n.networking_intents)})));

    // Fetch host VIP node
    // Only show host star to non-host users
    if(registration?.status!=="host"){
      const hostRes=await fetch('/api/events/host-profile?event_id='+event.id);
      const hostData=await hostRes.json();
      if(hostData.host){
        setHostNode(hostData.host);
      }
    }
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
      .on("broadcast",{event:"handshake_declined"},(payload:any)=>{
        if(payload.payload.requester_id===profile.id){
          setNodes(prev=>prev.filter((n:any)=>n.id!==payload.payload.recipient_id));
          setDeclinedIds(prev=>new Set([...prev,payload.payload.recipient_id]));
        }
      })
      .on("broadcast",{event:"handshake_approved"},(payload:any)=>{
        if(payload.payload.requester_id===profile.id){
          setNotification("✓ Connected with "+getFirstName(payload.payload.recipient_name)+"! Open Profile tab → tap Scan to unlock their full profile");
          setTimeout(()=>setNotification(""),10000);
          fetchNodes();
        }else if(payload.payload.recipient_id===profile.id){
          setNotification("✓ Connected with "+getFirstName(payload.payload.requester_name)+"! Open Profile tab → tap Scan to unlock their full profile");
          setTimeout(()=>setNotification(""),10000);
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
    if(sentRequests.has(node.id)||declinedIds.has(node.id))return;
    setConfirmNode(null);
    setSentRequests(prev=>new Set(prev).add(node.id));
    const{data:req}=await supabase.from("handshake_requests").insert({requester_id:profile.id,recipient_id:node.id,event_id:event.id,status:"pending",expires_at:event.end_time}).select().single();
    await channelRef.current?.send({type:"broadcast",event:"handshake_requested",payload:{request_id:req?.id,requester_id:profile.id,recipient_id:node.id,requester_name:profile.display_name}});
  }

  async function respondRequest(approved:boolean){
    if(!incoming)return;
    const status=approved?"approved":"declined";
    await supabase.from("handshake_requests").update({status}).eq("id",incoming.request_id);
    if(approved){
      const{error:hsErr}=await supabase.from("handshakes").insert({sender_id:incoming.requester_id,receiver_id:profile.id,status:"accepted"});
      if(hsErr){setNotification("❌ Connect error: "+hsErr.message);setTimeout(()=>setNotification(""),8000);}else{setNotification("✓ Handshake created!");}
      await channelRef.current?.send({type:"broadcast",event:"handshake_approved",payload:{requester_id:incoming.requester_id,recipient_id:profile.id,requester_name:incoming.requester_name,recipient_name:profile.display_name}});
    }
    setIncoming(null);
    fetchNodes();
  }

  if(!isLive&&!isEnded){
    return(
      <PreEventDiscovery
        event={event}
        profile={profile}
        sentRequests={sentRequests}
        setSentRequests={setSentRequests}
      />
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
    <div style={{background:"linear-gradient(160deg,#0f0f13 0%,#12101a 100%)",minHeight:"calc(100vh - 100px)",position:"relative",padding:"16px"}}>
      <style>{`
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(226,109,52,0.2)}50%{box-shadow:0 0 0 12px rgba(37,99,235,0)}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
        <p style={{fontSize:"10px",color:"#E26D34",letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",margin:0}}>Live Now</p>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"20px",padding:"6px 12px"}}>
          <p style={{color:"#fff",fontSize:"12px",margin:0}}>{nodes.length} nearby</p>
        </div>
      </div>

      {notification&&(
        <div style={{background:"rgba(0,0,0,0.8)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",padding:"10px 16px",marginBottom:"16px",animation:"fadeIn 0.4s ease"}}>
          <p style={{color:"#fff",fontSize:"12px",fontWeight:"500",textAlign:"center",lineHeight:"1.4",margin:0}}>{notification}</p>
        </div>
      )}

      {!auraLoaded&&registration?.status!=="host"&&(
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{width:"16px",height:"16px",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:"#E26D34",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/>
        </div>
      )}
      {auraLoaded&&!networkingActive&&registration?.status!=="host"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px",textAlign:"center"}}>
          <p style={{fontSize:"48px",marginBottom:"16px",opacity:0.2}}>◎</p>
          <p style={{color:"#fff",fontSize:"18px",fontWeight:"300",marginBottom:"8px"}}>Networking Off</p>
          <p style={{color:"#555",fontSize:"14px",marginBottom:"40px"}}>Nobody can see you</p>
          <button onClick={startNetworking} style={{padding:"16px 40px",borderRadius:"50px",background:"#fff",color:"#000",border:"none",fontSize:"16px",fontWeight:"600",cursor:"pointer"}}>Start Networking</button>
        </div>
      )}

      {(networkingActive||registration?.status==="host")&&(
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {hostNode&&(
            <div style={{background:"linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))",border:"1px solid rgba(212,175,55,0.25)",borderRadius:"14px",padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontSize:"9px",fontWeight:"700",color:"#D4AF37",letterSpacing:"0.1em",margin:"0 0 4px"}}>★ ORGANIZER</p>
                <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",margin:0}}>{hostNode.display_name}</p>
              </div>
              <button onClick={()=>setConfirmNode({...hostNode,is_host:true})} style={{fontSize:"11px",fontWeight:"600",color:"#D4AF37",background:"transparent",border:"1px solid rgba(212,175,55,0.4)",borderRadius:"8px",padding:"6px 12px",cursor:"pointer"}}>Connect</button>
            </div>
          )}
          {networkingActive&&nodes.length===0&&(
            <p style={{color:"#555",fontSize:"14px",textAlign:"center",padding:"60px 0"}}>No one else is networking right now.</p>
          )}
          {networkingActive&&nodes.map((node:any)=>(
            <AttendeeCard key={node.id} attendee={node} sent={sentRequests.has(node.id)} onConnect={()=>setConfirmNode(node)} live/>
          ))}
        </div>
      )}

      {networkingActive&&(
        <div style={{display:"flex",justifyContent:"center",marginTop:"20px"}}>
          <button onClick={stopNetworking} style={{padding:"10px 24px",borderRadius:"50px",background:"rgba(255,255,255,0.06)",color:"#666",border:"1px solid rgba(255,255,255,0.08)",fontSize:"13px",cursor:"pointer",letterSpacing:"0.02em"}}>Turn off</button>
        </div>
      )}

      {confirmNode&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:20}} onClick={()=>setConfirmNode(null)}>
          <div style={{background:"#0c0c0f",borderRadius:"24px 24px 0 0",padding:"24px",width:"100%",borderTop:"1px solid rgba(255,255,255,0.05)",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:"10px",color:"#E26D34",letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",marginBottom:"8px"}}>Intentional Handshake</p>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <p style={{color:"#fff",fontSize:"18px",fontWeight:"500"}}>Meet {getFirstName(confirmNode.display_name)}?</p>
              {confirmNode.is_host&&<span style={{background:"linear-gradient(135deg,#D4AF37,#b8962e)",color:"#000",fontSize:"10px",fontWeight:"700",padding:"3px 10px",borderRadius:"6px",letterSpacing:"0.05em"}}>ORGANIZER</span>}
            </div>
            <p style={{color:"#666",fontSize:"14px",marginBottom:"4px"}}>{confirmNode.role_title||""}</p>
            {confirmNode.is_host&&<p style={{color:"#E26D34",fontSize:"12px",marginBottom:"8px"}}>★ Event organizer</p>}
            {confirmNode.networking_intents?.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px",margin:"12px 0"}}>
                {confirmNode.networking_intents.map((intent:string)=>(
                  <span key={intent} style={{fontSize:"11px",color:"#E26D34",background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"5px",padding:"3px 10px",fontWeight:"600"}}>{intent}</span>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:"12px",marginTop:"16px"}}>
              <button onClick={()=>setConfirmNode(null)} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"rgba(240,237,232,0.5)",border:"1px solid rgba(240,237,232,0.15)",fontSize:"13px",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>sendRequest(confirmNode)} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"#E26D34",border:"1px solid rgba(226,109,52,0.4)",fontSize:"13px",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>Send Handshake Request →</button>
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

function ProfileTab({profile,event,onProfileUpdate,isEnded,registration}:any){
  const[editing,setEditing]=useState(false);
  const[connections,setConnections]=useState<any[]>([]);
  const[unlocked,setUnlocked]=useState<Set<string>>(new Set());
  const[scanning,setScanning]=useState(false);
  const[scanTarget,setScanTarget]=useState<any>(null);
  const[scanMsg,setScanMsg]=useState("");
  const scannerRef=useRef<any>(null);
  const[blocked,setBlocked]=useState<Set<string>>(new Set());
  const[reportMsg,setReportMsg]=useState("");
  const[pendingRequests,setPendingRequests]=useState<any[]>([]);
  const[networkingVisible,setNetworkingVisible]=useState(profile?.networking_visible??true);
  const[signalTarget,setSignalTarget]=useState<any>(null);
  const[signalStationId,setSignalStationId]=useState("");
  const[signalCustomLocation,setSignalCustomLocation]=useState("");
  const[signalSentIds,setSignalSentIds]=useState<Set<string>>(new Set());
  const[eventStations,setEventStations]=useState<any[]>([]);
  const[signalNotification,setSignalNotification]=useState("");
  const[incomingSignals,setIncomingSignals]=useState<any[]>([]);

  useEffect(()=>{
    if(!profile||!event)return;
    let cancelled=false;
    async function loadIncomingSignals(){
      const{data:signals}=await supabase.from("meetup_signals").select("id,sender_id,station_id,custom_location,status").eq("recipient_id",profile.id).eq("event_id",event.id).eq("status","pending");
      if(cancelled||!signals||signals.length===0){if(!cancelled)setIncomingSignals([]);return;}
      const senderIds=signals.map((s:any)=>s.sender_id);
      const stationIds=signals.map((s:any)=>s.station_id).filter(Boolean);
      const[{data:senders},{data:stations}]=await Promise.all([
        supabase.from("guest_profiles").select("id,display_name").in("id",senderIds),
        stationIds.length>0?supabase.from("event_stations").select("id,name").in("id",stationIds):Promise.resolve({data:[]}),
      ]);
      if(cancelled)return;
      setIncomingSignals(signals.map((s:any)=>({
        ...s,
        senderName:(senders||[]).find((p:any)=>p.id===s.sender_id)?.display_name||"Someone",
        locationLabel:s.custom_location||(stations||[]).find((st:any)=>st.id===s.station_id)?.name||"a meetup spot",
      })));
    }
    loadIncomingSignals();
    const ch=supabase.channel("incoming-signals:"+profile.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"meetup_signals"},(payload:any)=>{
        if(payload.new.recipient_id===profile.id)loadIncomingSignals();
      })
      .subscribe();
    return()=>{cancelled=true;supabase.removeChannel(ch);};
  },[profile,event]);

  async function dismissSignal(signalId:string){
    setIncomingSignals(prev=>prev.filter(s=>s.id!==signalId));
    await supabase.from("meetup_signals").update({status:"acknowledged"}).eq("id",signalId);
  }

  useEffect(()=>{
    if(!event)return;
    supabase.from("event_stations").select("id,name").eq("event_id",event.id).then(({data})=>{if(data)setEventStations(data);});
  },[event]);

  async function sendSignalMeetup(){
    if(!signalTarget||!profile||!event)return;
    if(!signalStationId&&!signalCustomLocation.trim())return;
    const station=eventStations.find((s:any)=>s.id===signalStationId);
    const{error}=await supabase.from("meetup_signals").insert({
      event_id:event.id,
      sender_id:profile.id,
      recipient_id:signalTarget.id,
      station_id:signalStationId||null,
      custom_location:signalStationId?null:signalCustomLocation.trim(),
      status:"pending",
    });
    if(!error){
      setSignalSentIds(prev=>new Set(prev).add(signalTarget.id));
      setSignalNotification(`Meetup signal sent to ${getFirstName(signalTarget.display_name)}`);
      setTimeout(()=>setSignalNotification(""),4000);
    }
    setSignalTarget(null);
    setSignalStationId("");
    setSignalCustomLocation("");
  }

  async function toggleVisibility(){
    const next=!networkingVisible;
    setNetworkingVisible(next);
    await supabase.from("guest_profiles").update({networking_visible:next}).eq("id",profile.id);
  }

  useEffect(()=>{
    if(!profile||!event)return;
    let cancelled=false;
    async function loadPending(){
      const{data:reqs}=await supabase.from("handshake_requests").select("id,requester_id").eq("recipient_id",profile.id).eq("event_id",event.id).eq("status","pending").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      if(cancelled||!reqs||reqs.length===0){if(!cancelled)setPendingRequests([]);return;}
      const{data:requesters}=await supabase.from("guest_profiles").select("id,display_name,role_title,networking_intents").in("id",reqs.map((r:any)=>r.requester_id));
      if(cancelled)return;
      setPendingRequests(reqs.map((r:any)=>{
        const requester=(requesters||[]).find((p:any)=>p.id===r.requester_id);
        return requester?{requestId:r.id,...requester,networking_intents:parseIntents(requester.networking_intents)}:{requestId:r.id};
      }).filter((r:any)=>r.id&&r.display_name));
    }
    loadPending();
    const ch=supabase.channel("pending-requests:"+profile.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"handshake_requests"},(payload:any)=>{
        if(payload.new.recipient_id===profile.id)loadPending();
      })
      .subscribe();
    return()=>{cancelled=true;supabase.removeChannel(ch);};
  },[profile,event]);

  async function respondToPending(requestId:string,requesterId:string,approve:boolean){
    setPendingRequests(prev=>prev.filter(r=>r.requestId!==requestId));
    await supabase.from("handshake_requests").update({status:approve?"approved":"declined"}).eq("id",requestId);
    if(approve){
      await supabase.from("handshakes").insert({sender_id:requesterId,receiver_id:profile.id,status:"accepted"});
    }
  }

  useEffect(()=>{
    if(!profile||!event)return;
    async function loadConnections(){
      const{data:handshakes}=await supabase.from("handshakes").select("id,sender_id,receiver_id,status").or("sender_id.eq."+profile.id+",receiver_id.eq."+profile.id);
      const connectedIds=(handshakes||[]).map((h:any)=>h.sender_id===profile.id?h.receiver_id:h.sender_id);
      // handshakes has no per-side "unlocked" state in the real schema, so
      // every established handshake is treated as already connected/visible.
      // A separate, explicit unlock-status feature can be layered on later
      // if partial visibility is wanted again.
      setUnlocked(new Set(connectedIds));
      if(connectedIds.length===0){setConnections([]);return;}
      const{data:profiles}=await supabase.from("guest_profiles").select("*").in("id",connectedIds);
      setConnections(profiles||[]);
    }
    loadConnections();
    // Realtime - reload when a handshake involving this profile changes.
    // handshakes has no event_id to filter on server-side, so we subscribe
    // unfiltered and check membership in the callback instead.
    const ch=supabase.channel("profile-handshakes:"+profile.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"handshakes"},(payload:any)=>{
        if(payload.new.sender_id===profile.id||payload.new.receiver_id===profile.id){
          loadConnections();
        }
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"handshakes"},(payload:any)=>{
        if(payload.new.sender_id===profile.id||payload.new.receiver_id===profile.id){
          loadConnections();
        }
      })
      .subscribe();
    return()=>{supabase.removeChannel(ch);};
  },[profile,event]);

  async function blockUser(connId:string){
    if(!profile||!event)return;
    await supabase.from("guest_blocks").insert({
      event_id:event.id,
      blocker_id:profile.id,
      blocked_id:connId,
    });
    setBlocked(prev=>new Set([...prev,connId]));
    setReportMsg("User blocked");
    setTimeout(()=>setReportMsg(""),3000);
  }

  async function reportUser(connId:string,name:string){
    if(!profile||!event)return;
    const reason=prompt("Why are you reporting "+name+"? (harassment, spam, inappropriate)");
    if(!reason)return;
    await supabase.from("guest_reports").insert({
      event_id:event.id,
      reporter_id:profile.id,
      reported_id:connId,
      reason,
    });
    setReportMsg("Report submitted. Thank you.");
    setTimeout(()=>setReportMsg(""),3000);
  }

  async function startScan(conn:any){
    setScanTarget(conn);
    setScanning(true);
    setScanMsg("");
    await new Promise(r=>setTimeout(r,500));
    const{Html5Qrcode}=await import("html5-qrcode");
    const scanner=new Html5Qrcode("qr-reader");
    scannerRef.current=scanner;
    try{
    scanner.start(
        {facingMode:"environment"},
        {fps:10,qrbox:{width:200,height:200}},
        async(decoded:string)=>{
          if(decoded.startsWith("presence:unlock:")){
            const targetRegId=decoded.replace("presence:unlock:","");
            await scanner.stop();
            setScanning(false);
            setScanMsg("Unlocking...");
            const res=await fetch("/api/handshakes/unlock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scanner_registration_id:registration.id,target_registration_id:targetRegId})});
            if(res.ok){
              setUnlocked(prev=>new Set([...prev,conn.id]));
              setScanMsg("✅ Profile unlocked!");
              setScanTarget(null);
            }else{
              setScanMsg("❌ Could not unlock. Make sure you are connected first.");
            }
            setTimeout(()=>setScanMsg(""),3000);
          }
        },
        ()=>{}
      ).catch((err:any)=>{console.error(err);setScanning(false);setScanMsg("Camera not available — check permissions");});
    }catch(err){setScanning(false);setScanMsg("Could not start camera");}
  }

  function stopScan(){
    scannerRef.current?.stop().catch(()=>{});
    setScanning(false);
    setScanTarget(null);
  }

  const isHost=registration?.status==="host";
  const accent=isHost?"#D4AF37":"#E26D34";
  const accentBg=isHost?"rgba(212,175,55,0.08)":"rgba(226,109,52,0.08)";
  const accentBorder=isHost?"rgba(212,175,55,0.15)":"rgba(226,109,52,0.15)";

  return(
    <div style={{padding:"16px",background:"#08080a",minHeight:"100vh"}}>

      {/* ── Premium profile card ── */}
      <div style={{
        background:"#0c0c0f",
        borderRadius:"22px",padding:"24px",marginBottom:"12px",
        border: "1px solid " + accentBorder,
        boxShadow:"0 1px 0 rgba(255,255,255,0.05) inset,0 4px 8px rgba(0,0,0,0.35),0 16px 48px rgba(0,0,0,0.5)",
        position:"relative",overflow:"hidden"
      }}>
        {/* Top edge shimmer */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:"1px",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.04) 30%,rgba(255,255,255,0.04) 70%,transparent)",pointerEvents:"none"}}/>

        {/* Upper Right Edit Action Button — High zIndex to clear container overlay */}
        <div style={{position:"absolute",top:"20px",right:"20px",zIndex:50}}>
          <button onClick={()=>setEditing(!editing)} style={{
            width:"32px",height:"32px",borderRadius:"9px",
            background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",color:accent,fontSize:"13px"
          }}>{editing?"✕":"✎"}</button>
        </div>

        {/* Card Body Content */}
        <div>
          {/* 1. Name: Deeply Prominent */}
          <p style={{fontSize:"22px",fontWeight:"700",color:"#f0ede8",letterSpacing:"-0.02em",margin:"0 0 8px",paddingRight:"44px"}}>{profile?.display_name}</p>

          {/* 2. Professional Row: Role & Organisation horizontally aligned */}
          <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",marginBottom:"18px"}}>
            {profile?.role_title && (
              <span style={{
                display:"inline-block",
                fontSize:"9px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",
                color: accent,
                background: accentBg,
                border: "1px solid " + accentBorder,
                padding:"3px 8px",borderRadius:"5px"
              }}>{isHost ? "ORGANIZER" : profile.role_title}</span>
            )}
            {profile?.organisation && (
              <p style={{fontSize:"13px",color:"rgba(240,237,232,0.45)",margin:0,fontWeight:"400"}}>
                {profile.role_title && <span style={{marginRight:"8px",color:"rgba(240,237,232,0.2)"}}>|</span>}
                {profile.organisation}
              </p>
            )}
          </div>

          {/* 3. Bio Space */}
          {profile?.bio && (
            <p style={{fontSize:"13px",color:"rgba(244,244,245,0.65)",lineHeight:"1.6",fontWeight:"300",margin:"0 0 20px",letterSpacing:"0.01em"}}>
              {profile.bio}
            </p>
          )}

          {/* 4. Social / Platform Link Row — Active Clickable Anchor with Icon */}
          {profile?.platform_value && (
            <a 
              href={profile.platform_value.startsWith('http') ? profile.platform_value : 'https://' + profile.platform_value}
              target="_blank"
              rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:"8px",paddingTop:"14px",borderTop:"1px solid rgba(255,255,255,0.03)",textDecoration:"none",cursor:"pointer",width:"100%"}}
            >
              <div style={{
                width:"24px",height:"24px",borderRadius:"6px",flexShrink:0,
                background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"11px",color:"#FFBF00"
              }}>↗</div>
              <span style={{fontSize:"12px",color:accent,opacity:0.75}}>{cleanUrl(profile.platform_value)}</span>
            </a>
          )}
        </div>
      </div>

      <div style={{background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"14px",padding:"14px 16px",marginTop:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
        <div style={{minWidth:0}}>
          <p style={{fontSize:"13px",fontWeight:"600",color:"#f1f0f5",margin:0}}>Visible to other attendees</p>
          <p style={{fontSize:"11px",color:"rgba(240,237,232,0.4)",margin:"2px 0 0"}}>{networkingVisible?"You can be found and connected with":"You're hidden from networking — no one can see or connect with you"}</p>
        </div>
        <button
          onClick={toggleVisibility}
          style={{flexShrink:0,width:"44px",height:"26px",borderRadius:"14px",border:"none",cursor:"pointer",background:networkingVisible?"#E26D34":"rgba(255,255,255,0.1)",position:"relative",transition:"background 0.2s"}}
        >
          <span style={{position:"absolute",top:"3px",left:networkingVisible?"22px":"3px",width:"20px",height:"20px",borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
        </button>
      </div>

      {editing && (
        <EditProfile 
          profile={profile} 
          onSave={(p: any) => {
            onProfileUpdate(p);
            setEditing(false);
          }} 
        />
      )}

      {incomingSignals.length>0&&(
        <div style={{marginTop:"16px"}}>
          <p style={{fontSize:"10px",fontWeight:"600",color:"#E26D34",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px"}}>Meetup Signals</p>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {incomingSignals.map((s:any)=>(
              <div key={s.id} style={{background:"rgba(226,109,52,0.06)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"14px",padding:"14px"}}>
                <p style={{fontSize:"13px",color:"#f1f0f5",margin:0}}><span style={{fontWeight:"600"}}>{s.senderName}</span> wants to meet you at <span style={{color:"#E26D34",fontWeight:"600"}}>{s.locationLabel}</span></p>
                <button onClick={()=>dismissSignal(s.id)} style={{marginTop:"8px",fontSize:"11px",fontWeight:"600",color:"#E26D34",background:"transparent",border:"1px solid rgba(226,109,52,0.3)",borderRadius:"8px",padding:"5px 10px",cursor:"pointer"}}>Got it</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length>0&&(
        <div style={{marginTop:"16px"}}>
          <p style={{fontSize:"10px",fontWeight:"600",color:"#E26D34",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px"}}>Wants To Connect</p>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {pendingRequests.map((r:any)=>(
              <div key={r.requestId} style={{background:"rgba(226,109,52,0.06)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"14px",padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",margin:0}}>{r.display_name}</p>
                  {r.role_title&&<p style={{fontSize:"12px",color:"#888",margin:"2px 0 0"}}>{r.role_title}</p>}
                </div>
                <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                  <button onClick={()=>respondToPending(r.requestId,r.id,false)} style={{fontSize:"11px",color:"rgba(240,237,232,0.5)",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"6px 10px",cursor:"pointer"}}>Decline</button>
                  <button onClick={()=>respondToPending(r.requestId,r.id,true)} style={{fontSize:"11px",fontWeight:"600",color:"#000",background:"#E26D34",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer"}}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:"16px"}}>
        <p style={{fontSize:"10px",fontWeight:"600",color:"rgba(255,255,255,0.45)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px"}}>Connections</p>
        {connections.length===0?(
          <p style={{color:"#999",fontSize:"14px",textAlign:"center",padding:"40px 0"}}>
            {isEnded?"No connections from this event":"Connect with people to see them here"}
          </p>
        ):(
          connections.map((c:any)=>{const isUnlocked=unlocked.has(c.id);const signalSent=signalSentIds.has(c.id);return(
            <div key={c.id} style={{background:isUnlocked?"rgba(226,109,52,0.08)":"rgba(26,26,36,0.9)",borderRadius:"14px",padding:"14px",marginBottom:"8px",border:isUnlocked?"1px solid rgba(226,109,52,0.25)":"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <p style={{fontSize:"14px",fontWeight:"600",marginBottom:"1px",color:"#f1f0f5"}}>{c.display_name}</p>
                  {c.role_title&&<p style={{fontSize:"13px",color:"#666",marginBottom:"2px"}}>{c.role_title}</p>}
                  {isUnlocked&&c.organisation&&<p style={{fontSize:"13px",color:"#999",marginBottom:"8px"}}>{c.organisation}</p>}
                  {isUnlocked&&c.platform_value&&<p style={{fontSize:"13px",color:"#E26D34",marginTop:"4px"}}>{cleanUrl(c.platform_value)}</p>}
                </div>
                {!isUnlocked&&<button onClick={()=>startScan(c)} style={{background:"rgba(226,109,52,0.15)",color:"#E26D34",border:"1px solid rgba(226,109,52,0.15)",borderRadius:"8px",padding:"5px 10px",fontSize:"11px",fontWeight:"600",cursor:"pointer",whiteSpace:"nowrap",marginLeft:"8px"}}>Scan to unlock</button>}
                {isUnlocked&&<span style={{fontSize:"10px",color:"#E26D34",fontWeight:"600",marginLeft:"8px",background:"rgba(226,109,52,0.12)",padding:"2px 8px",borderRadius:"6px"}}>✓ Unlocked</span>}
              </div>
              {isUnlocked&&(
                <button
                  onClick={()=>setSignalTarget(c)}
                  disabled={signalSent}
                  style={{marginTop:"10px",width:"100%",padding:"8px",borderRadius:"8px",background:signalSent?"rgba(255,255,255,0.03)":"transparent",border:signalSent?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(226,109,52,0.3)",color:signalSent?"rgba(240,237,232,0.3)":"#E26D34",fontSize:"12px",fontWeight:"600",cursor:signalSent?"default":"pointer"}}
                >
                  {signalSent?"Meetup signal sent":"Signal Meetup →"}
                </button>
              )}
            </div>
          );}
          )
        )}
      </div>

      {signalNotification&&(
        <div style={{background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"12px",padding:"10px 14px",marginTop:"12px"}}>
          <p style={{color:"#E26D34",fontSize:"12px",margin:0,textAlign:"center"}}>{signalNotification}</p>
        </div>
      )}

      {signalTarget&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:50}} onClick={()=>setSignalTarget(null)}>
          <div style={{background:"#0c0c0f",borderRadius:"24px 24px 0 0",padding:"24px",width:"100%",borderTop:"1px solid rgba(255,255,255,0.05)"}} onClick={e=>e.stopPropagation()}>
            <p style={{color:"#fff",fontSize:"17px",fontWeight:"500",marginBottom:"4px"}}>Where should you meet {getFirstName(signalTarget.display_name)}?</p>
            <p style={{color:"#666",fontSize:"13px",marginBottom:"16px"}}>Pick a station or write your own spot</p>
            {eventStations.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"12px"}}>
                {eventStations.map((s:any)=>(
                  <button
                    key={s.id}
                    onClick={()=>{setSignalStationId(s.id);setSignalCustomLocation("");}}
                    style={{textAlign:"left",padding:"10px 12px",borderRadius:"8px",background:signalStationId===s.id?"rgba(226,109,52,0.1)":"rgba(255,255,255,0.02)",border:signalStationId===s.id?"1px solid rgba(226,109,52,0.4)":"1px solid rgba(255,255,255,0.06)",color:signalStationId===s.id?"#E26D34":"#ccc",fontSize:"13px",cursor:"pointer"}}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <input
              value={signalCustomLocation}
              onChange={e=>{setSignalCustomLocation(e.target.value);if(e.target.value)setSignalStationId("");}}
              placeholder="Or type your own meetup spot"
              style={{width:"100%",padding:"10px 12px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)",color:"#fff",fontSize:"13px",outline:"none",marginBottom:"20px",boxSizing:"border-box"}}
            />
            <div style={{display:"flex",gap:"12px"}}>
              <button onClick={()=>setSignalTarget(null)} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"rgba(240,237,232,0.5)",border:"1px solid rgba(240,237,232,0.15)",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
              <button
                onClick={sendSignalMeetup}
                disabled={!signalStationId&&!signalCustomLocation.trim()}
                style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:(!signalStationId&&!signalCustomLocation.trim())?"rgba(240,237,232,0.2)":"#E26D34",border:"1px solid rgba(226,109,52,0.4)",fontSize:"13px",cursor:(!signalStationId&&!signalCustomLocation.trim())?"default":"pointer",fontWeight:"500"}}
              >
                Send Signal →
              </button>
            </div>
          </div>
        </div>
      )}
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

  const inp={width:"100%",padding:"12px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)",color:"#fafafa",fontSize:"14px",outline:"none",marginBottom:"12px",boxSizing:"border-box" as const};

  return(
    <div style={{background:"#0c0c0f",borderRadius:"20px",padding:"20px",border:"1px solid rgba(255,255,255,0.04)",marginTop:"12px"}}>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={inp}/>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Your role or title" style={inp}/>
      <input value={organisation} onChange={e=>setOrganisation(e.target.value)} placeholder="Organisation" style={inp}/>
      <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Short bio" style={{...inp,minHeight:"60px",resize:"vertical"}}/>
      <input value={link} onChange={e=>setLink(e.target.value)} placeholder="LinkedIn, Instagram, or your website" style={inp}/>
      <button onClick={save} disabled={saving} style={{width:"100%",padding:"11px",borderRadius:"10px",background:"transparent",color:saving?"rgba(240,237,232,0.3)":"#E26D34",border:saving?"1px solid rgba(240,237,232,0.1)":"1px solid rgba(226,109,52,0.35)",fontSize:"13px",cursor:saving?"not-allowed":"pointer",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.2s ease"}}>{saving?"Saving...":"Save changes"}</button>
    </div>
  );
}
