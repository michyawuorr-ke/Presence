"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getFirstName, parseIntents, REASON_OPTIONS, PALETTE } from "./shared";
import AttendeeCard from "./AttendeeCard";
import PreEventDiscovery from "./PreEventDiscovery";

interface NetworkingTabProps {
  event: any;
  profile: any;
  isLive: boolean;
  isEnded: boolean;
  registration: any;
}

export default function NetworkingTab({ event, profile, isLive, isEnded, registration }: NetworkingTabProps) {
  const[networkingActive,setNetworkingActive]=useState(false);
  const[auraLoaded,setAuraLoaded]=useState(false);
  const[nodes,setNodes]=useState<any[]>([]);
  const[hostNode,setHostNode]=useState<any>(null);
  const[incoming,setIncoming]=useState<any>(null);
  const[confirmNode,setConfirmNode]=useState<any>(null);
  const[selectedLiveReason,setSelectedLiveReason]=useState("");
  const[liveSearch,setLiveSearch]=useState("");
  const[sentRequests,setSentRequests]=useState<Set<string>>(new Set());
  const[notification,setNotification]=useState<string>("");
  const channelRef=useRef<any>(null);
  const[declinedIds,setDeclinedIds]=useState<Set<string>>(new Set());

  useEffect(()=>{
    if(!profile||auraLoaded)return;
    async function loadAura(){
      const{data:prof}=await supabase.from("guest_profiles").select("aura_active,networking_visible").eq("id",profile.id).single();
      const isActive=prof?.networking_visible??true;
      setNetworkingActive(isActive);
      const{data:sent}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).in("status",["pending","approved"]);
      setSentRequests(new Set((sent||[]).map((r:any)=>r.recipient_id)));
      const{data:declined}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).eq("status","declined");
      setDeclinedIds(new Set((declined||[]).map((r:any)=>r.recipient_id)));
      if(registration?.status==="host"){
        await supabase.from("guest_profiles").update({aura_active:true,networking_visible:true}).eq("id",profile.id);
        setNetworkingActive(true);
      }
      setAuraLoaded(true);
    }
    loadAura();
  },[profile,event,auraLoaded,registration]);

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
    // limit raised to 99 — no artificial cap on visible attendees
    const{data}=await supabase.from("guest_profiles").select("*").eq("event_id",event.id).eq("aura_active",true).eq("networking_visible",true).neq("id",profile.id).limit(99);
    const{data:blockedData}=await supabase.from("guest_blocks").select("blocked_id").eq("blocker_id",profile.id).eq("event_id",event.id);
    const blockedSet=new Set((blockedData||[]).map((b:any)=>b.blocked_id));
    const filtered=(data||[]).filter((n:any)=>!approvedSet.has(n.id)&&!declinedSet.has(n.id)&&!blockedSet.has(n.id));
    setNodes(filtered.map((n:any)=>({...n,networking_intents:parseIntents(n.networking_intents)})));
    if(registration?.status!=="host"){
      const hostRes=await fetch('/api/events/host-profile?event_id='+event.id);
      const hostData=await hostRes.json();
      if(hostData.host)setHostNode(hostData.host);
    }
  },[profile,event,registration]);

  useEffect(()=>{
    if(!isLive||!event||!profile||!networkingActive)return;
    fetchNodes();
    const interval=setInterval(fetchNodes,60000);
    const ch=supabase.channel("aura:"+event.id)
      .on("broadcast",{event:"aura_ignited"},(payload:any)=>{
        setNodes(prev=>{
          if(prev.find((n:any)=>n.id===payload.payload.guest_profile_id))return prev;
          if(payload.payload.guest_profile_id===profile.id)return prev;
          return[...prev,{...payload.payload}];
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
    return()=>{clearInterval(interval);supabase.removeChannel(ch);};
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
    if(!selectedLiveReason)return;
    const reason=selectedLiveReason;
    setConfirmNode(null);
    setSelectedLiveReason("");
    setSentRequests(prev=>new Set(prev).add(node.id));
    const{data:req}=await supabase.from("handshake_requests").insert({requester_id:profile.id,recipient_id:node.id,event_id:event.id,status:"pending",expires_at:event.end_time,reason}).select().single();
    await channelRef.current?.send({type:"broadcast",event:"handshake_requested",payload:{request_id:req?.id,requester_id:profile.id,recipient_id:node.id,requester_name:profile.display_name,reason}});
  }

  async function respondRequest(approved:boolean){
    if(!incoming)return;
    const status=approved?"approved":"declined";
    await supabase.from("handshake_requests").update({status}).eq("id",incoming.request_id);
    if(approved){
      const{error:hsErr}=await supabase.from("handshakes").insert({sender_id:incoming.requester_id,receiver_id:profile.id,status:"accepted"});
      if(hsErr){setNotification("❌ Connect error: "+hsErr.message);setTimeout(()=>setNotification(""),8000);}
      else{setNotification("✓ Handshake created!");}
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
        registration={registration}
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
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.2)}50%{box-shadow:0 0 0 12px rgba(37,99,235,0)}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <p style={{fontSize:"10px",color:PALETTE.orange,letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",margin:"0 0 16px"}}>Live Now</p>

      <input
        value={liveSearch}
        onChange={e=>setLiveSearch(e.target.value)}
        placeholder="Search by name, role, or intent"
        style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#fff",fontSize:"13px",outline:"none",marginBottom:"16px",boxSizing:"border-box"}}
      />

      {notification&&(
        <div style={{background:"rgba(0,0,0,0.8)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",padding:"10px 16px",marginBottom:"16px",animation:"fadeIn 0.4s ease"}}>
          <p style={{color:"#fff",fontSize:"12px",fontWeight:"500",textAlign:"center",lineHeight:"1.4",margin:0}}>{notification}</p>
        </div>
      )}

      {!auraLoaded&&(
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{width:"16px",height:"16px",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:PALETTE.orange,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/>
        </div>
      )}

      {auraLoaded&&(
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {hostNode&&(
            <div style={{background:"linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))",border:"1px solid rgba(212,175,55,0.25)",borderRadius:"14px",padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontSize:"9px",fontWeight:"700",color:PALETTE.gold,letterSpacing:"0.1em",margin:"0 0 4px"}}>★ ORGANIZER</p>
                <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",margin:0}}>{hostNode.display_name}</p>
              </div>
              <button onClick={()=>setConfirmNode({...hostNode,is_host:true})} style={{fontSize:"11px",fontWeight:"600",color:PALETTE.gold,background:"transparent",border:`1px solid rgba(212,175,55,0.4)`,borderRadius:"8px",padding:"6px 12px",cursor:"pointer"}}>Connect</button>
            </div>
          )}
          {networkingActive&&nodes.length===0&&(
            <p style={{color:"#555",fontSize:"14px",textAlign:"center",padding:"60px 0"}}>No one else is networking right now.</p>
          )}
          {networkingActive&&nodes.filter((node:any)=>{
            const q=liveSearch.trim().toLowerCase();
            if(!q)return true;
            return node.display_name?.toLowerCase().includes(q)
              ||node.role_title?.toLowerCase().includes(q)
              ||(node.networking_intents||[]).some((i:string)=>i.toLowerCase().includes(q));
          }).map((node:any)=>(
            <AttendeeCard key={node.id} attendee={node} sent={sentRequests.has(node.id)} onConnect={()=>setConfirmNode(node)} live/>
          ))}
        </div>
      )}

      {confirmNode&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:20}} onClick={()=>{setConfirmNode(null);setSelectedLiveReason("");}}>
          <div style={{background:"#0c0c0f",borderRadius:"24px 24px 0 0",padding:"24px",width:"100%",borderTop:"1px solid rgba(255,255,255,0.05)",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:"10px",color:PALETTE.umber,letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",marginBottom:"8px"}}>Intentional Handshake</p>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <p style={{color:"#fff",fontSize:"18px",fontWeight:"500"}}>Meet {getFirstName(confirmNode.display_name)}?</p>
              {confirmNode.is_host&&<span style={{background:"linear-gradient(135deg,#D4AF37,#b8962e)",color:"#000",fontSize:"10px",fontWeight:"700",padding:"3px 10px",borderRadius:"6px",letterSpacing:"0.05em"}}>ORGANIZER</span>}
            </div>
            <p style={{color:"#666",fontSize:"14px",marginBottom:"4px"}}>{confirmNode.role_title||""}</p>
            {confirmNode.networking_intents?.length>0&&(
              <div style={{margin:"12px 0"}}>
                <p style={{fontSize:"10px",color:"rgba(240,237,232,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"6px"}}>Their interests</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {confirmNode.networking_intents.map((intent:string)=>(
                    <span key={intent} style={{fontSize:"11px",color:PALETTE.orange,background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"5px",padding:"3px 10px",fontWeight:"600"}}>{intent}</span>
                  ))}
                </div>
              </div>
            )}
            <p style={{fontSize:"10px",color:"rgba(240,237,232,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px",marginTop:"8px"}}>Why do you want to connect?</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"4px"}}>
              {REASON_OPTIONS.map(reason=>(
                <button key={reason} onClick={()=>setSelectedLiveReason(reason)} style={{fontSize:"12px",fontWeight:"600",padding:"6px 12px",borderRadius:"8px",cursor:"pointer",background:selectedLiveReason===reason?PALETTE.orange:"transparent",color:selectedLiveReason===reason?"#000":PALETTE.orange,border:`1px solid rgba(226,109,52,0.4)`}}>
                  {reason}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:"12px",marginTop:"16px"}}>
              <button onClick={()=>{setConfirmNode(null);setSelectedLiveReason("");}} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"rgba(240,237,232,0.5)",border:"1px solid rgba(240,237,232,0.15)",fontSize:"13px",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>sendRequest(confirmNode)} disabled={!selectedLiveReason} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:selectedLiveReason?PALETTE.orange:"rgba(240,237,232,0.2)",border:`1px solid rgba(226,109,52,0.4)`,fontSize:"13px",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",cursor:selectedLiveReason?"pointer":"default"}}>
                Send Handshake Request →
              </button>
            </div>
          </div>
        </div>
      )}

      {incoming&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:20}}>
          <div style={{background:"#1a1a1a",borderRadius:"24px 24px 0 0",padding:"28px",width:"100%",animation:"slideUp 0.3s ease"}}>
            <p style={{color:"#fff",fontSize:"18px",fontWeight:"500",marginBottom:"8px"}}>{getFirstName(incoming.requester_name)} wants to connect</p>
            {incoming.reason?(
              <p style={{color:"#666",fontSize:"14px",marginBottom:"28px"}}>Reason: <span style={{color:PALETTE.orange,fontWeight:"600"}}>{incoming.reason}</span></p>
            ):(
              <p style={{color:"#666",fontSize:"14px",marginBottom:"28px"}}>Connection request</p>
            )}
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
