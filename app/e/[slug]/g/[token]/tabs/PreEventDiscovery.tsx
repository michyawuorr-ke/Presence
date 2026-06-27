"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getFirstName, parseIntents, REASON_OPTIONS } from "./shared";
import AttendeeCard from "./AttendeeCard";

interface PreEventDiscoveryProps {
  event: any;
  profile: any;
  sentRequests: Set<string>;
  setSentRequests: (fn: (prev: Set<string>) => Set<string>) => void;
  registration: any;
}

export default function PreEventDiscovery({ event, profile, sentRequests, setSentRequests, registration }: PreEventDiscoveryProps) {
  const[attendees,setAttendees]=useState<any[]>([]);
  const[stations,setStations]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[confirmTarget,setConfirmTarget]=useState<any>(null);
  const[selectedReason,setSelectedReason]=useState("");
  const[notification,setNotification]=useState("");
  const[hostNode,setHostNode]=useState<any>(null);
  const[search,setSearch]=useState("");

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
      if(registration?.status!=="host"){
        const hostRes=await fetch('/api/events/host-profile?event_id='+event.id);
        const hostData=await hostRes.json();
        if(!cancelled&&hostData.host)setHostNode(hostData.host);
      }
    }
    load();
    return()=>{cancelled=true;};
  },[event,profile,registration]);

  async function sendConnect(target:any){
    if(!selectedReason)return;
    const reason=selectedReason;
    setConfirmTarget(null);
    setSelectedReason("");
    setSentRequests((prev:Set<string>)=>new Set(prev).add(target.id));
    const{error}=await supabase.from("handshake_requests").insert({
      requester_id:profile.id,
      recipient_id:target.id,
      event_id:event.id,
      status:"pending",
      expires_at:event.end_time,
      reason,
    });
    if(error){
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

  const q=search.trim().toLowerCase();
  const matchesSearch=(a:any)=>{
    if(!q)return true;
    const stationName=stations.find((s:any)=>s.id===a.target_station_id)?.name||"";
    return a.display_name?.toLowerCase().includes(q)
      ||a.role_title?.toLowerCase().includes(q)
      ||stationName.toLowerCase().includes(q)
      ||(a.networking_intents||[]).some((i:string)=>i.toLowerCase().includes(q));
  };

  const stationless=attendees.filter((a:any)=>!a.target_station_id&&matchesSearch(a));
  const grouped=stations
    .map((s:any)=>({...s,attendees:attendees.filter((a:any)=>a.target_station_id===s.id&&matchesSearch(a))}))
    .filter((s:any)=>s.attendees.length>0);

  return(
    <div style={{padding:"20px 16px",background:"#0a0a0b",minHeight:"calc(100vh - 100px)"}}>
      <p style={{fontSize:"10px",color:"#8A7355",letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",marginBottom:"4px"}}>Before The Event</p>
      <p style={{fontSize:"13px",color:"rgba(240,237,232,0.4)",marginBottom:"16px"}}>See who's coming and where they'll be.</p>

      <input
        value={search}
        onChange={e=>setSearch(e.target.value)}
        placeholder="Search by name, role, station, or intent"
        style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)",color:"#fff",fontSize:"13px",outline:"none",marginBottom:"16px",boxSizing:"border-box"}}
      />

      {notification&&(
        <div style={{background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px"}}>
          <p style={{color:"#E26D34",fontSize:"12px",margin:0}}>{notification}</p>
        </div>
      )}

      {hostNode&&!q&&(
        <div style={{marginBottom:"20px"}}>
          <p style={{fontSize:"11px",fontWeight:"700",color:"#D4AF37",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"10px"}}>Organizer</p>
          <div style={{background:"linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))",border:"1px solid rgba(212,175,55,0.25)",borderRadius:"14px",padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{fontSize:"9px",fontWeight:"700",color:"#D4AF37",letterSpacing:"0.1em",margin:"0 0 4px"}}>★ ORGANIZER</p>
              <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",margin:0}}>{hostNode.display_name}</p>
            </div>
            <button onClick={()=>setConfirmTarget({...hostNode,is_host:true})} style={{fontSize:"11px",fontWeight:"600",color:"#D4AF37",background:"transparent",border:"1px solid rgba(212,175,55,0.4)",borderRadius:"8px",padding:"6px 12px",cursor:"pointer"}}>Connect</button>
          </div>
        </div>
      )}

      {attendees.length===0?(
        <p style={{color:"#555",fontSize:"14px",textAlign:"center",padding:"60px 0"}}>No other attendees registered yet.</p>
      ):grouped.length===0&&stationless.length===0?(
        <p style={{color:"#555",fontSize:"14px",textAlign:"center",padding:"60px 0"}}>No attendees match your search.</p>
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
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:30}} onClick={()=>{setConfirmTarget(null);setSelectedReason("");}}>
          <div style={{background:"#0c0c0f",borderRadius:"24px 24px 0 0",padding:"24px",width:"100%",borderTop:"1px solid rgba(255,255,255,0.05)"}} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:"10px",color:"#8A7355",letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",marginBottom:"8px"}}>Intentional Handshake</p>
            <p style={{color:"#fff",fontSize:"17px",fontWeight:"500",marginBottom:"4px"}}>Meet {getFirstName(confirmTarget.display_name)}?</p>
            <p style={{color:"#666",fontSize:"13px",marginBottom:"12px"}}>{confirmTarget.role_title||""}</p>
            {confirmTarget.networking_intents?.length>0&&(
              <div style={{marginBottom:"16px"}}>
                <p style={{fontSize:"10px",color:"rgba(240,237,232,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"6px"}}>Their interests</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {confirmTarget.networking_intents.map((intent:string)=>(
                    <span key={intent} style={{fontSize:"11px",color:"#E26D34",background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"5px",padding:"3px 10px",fontWeight:"600"}}>{intent}</span>
                  ))}
                </div>
              </div>
            )}
            <p style={{fontSize:"10px",color:"rgba(240,237,232,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>Why do you want to connect?</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"20px"}}>
              {REASON_OPTIONS.map(reason=>(
                <button
                  key={reason}
                  onClick={()=>setSelectedReason(reason)}
                  style={{fontSize:"12px",fontWeight:"600",padding:"6px 12px",borderRadius:"8px",cursor:"pointer",background:selectedReason===reason?"#E26D34":"transparent",color:selectedReason===reason?"#000":"#E26D34",border:"1px solid rgba(226,109,52,0.4)"}}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:"12px"}}>
              <button onClick={()=>{setConfirmTarget(null);setSelectedReason("");}} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"rgba(240,237,232,0.5)",border:"1px solid rgba(240,237,232,0.15)",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
              <button
                onClick={()=>sendConnect(confirmTarget)}
                disabled={!selectedReason}
                style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:selectedReason?"#E26D34":"rgba(240,237,232,0.2)",border:"1px solid rgba(226,109,52,0.4)",fontSize:"13px",cursor:selectedReason?"pointer":"default",fontWeight:"500"}}
              >
                Send Handshake Request →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
