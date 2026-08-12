"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { isHostRegistration } from "@/lib/hostRole";
import { getFirstName, parseIntents, REASON_OPTIONS, PALETTE, INTENTS_BY_GROUP, INTENT_GROUPS, INTENT_MAP } from "./shared";
import AttendeeCard from "./AttendeeCard";
import PreEventDiscovery from "./PreEventDiscovery";
import MatchRecommendations from "./MatchRecommendations";
import MissedConnections from "./MissedConnections";
import { List, type RowComponentProps } from "react-window";

interface NetworkingTabProps {
  event: any;
  profile: any;
  isLive: boolean;
  isEnded: boolean;
  registration: any;
}

// Row height is fixed rather than measured. Guests are capped at 2 intent
// pills (enforced elsewhere), so on typical phone widths the card never
// wraps past what this height accounts for — a fixed height keeps
// react-window's scroll math cheap, which matters more here than pixel-
// perfect sizing for the rare edge case.
const ROW_HEIGHT = 112;

type NodeRowProps = {
  filteredNodes: any[];
  sentRequests: Set<string>;
  onConnect: (node: any) => void;
};

// react-window's rowComponent must be a stable, named component — not
// defined inline inside NetworkingTab's render — or it gets recreated
// every render and react-window can't reuse row instances while scrolling.
function NodeRow({ index, style, filteredNodes, sentRequests, onConnect }: RowComponentProps<NodeRowProps>) {
  const node = filteredNodes[index];
  if (!node) return null;
  return (
    <div style={{ ...style, paddingBottom: "8px", boxSizing: "border-box" }}>
      <AttendeeCard attendee={node} sent={sentRequests.has(node.id)} onConnect={() => onConnect(node)} live />
    </div>
  );
}

export default function NetworkingTab({ event, profile, isLive, isEnded, registration }: NetworkingTabProps) {
  const[networkingActive,setNetworkingActive]=useState(false);

  const[auraLoaded,setAuraLoaded]=useState(false);
  const[nodes,setNodes]=useState<any[]>([]);
  const[hostNode,setHostNode]=useState<any>(null);
  const[confirmNode,setConfirmNode]=useState<any>(null);
  const[selectedLiveReason,setSelectedLiveReason]=useState("");
  const[liveSearch,setLiveSearch]=useState("");
  const[sentRequests,setSentRequests]=useState<Set<string>>(new Set());
  const[notification,setNotification]=useState<string>("");
  const channelRef=useRef<any>(null);
  const[declinedIds,setDeclinedIds]=useState<Set<string>>(new Set());
  const[rolesMap,setRolesMap]=useState<Record<string,any>>({});
  const rolesMapRef=useRef<Record<string,any>>({});

  useEffect(()=>{
    if(!profile||auraLoaded)return;
    async function loadAura(){
      const{data:prof}=await supabase.from("guest_profiles").select("aura_active,networking_visible").eq("id",profile.id).single();
      const isActive=prof?.networking_visible??false;
      setNetworkingActive(isActive);
      const{data:sent}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).in("status",["pending","approved"]);
      setSentRequests(new Set((sent||[]).map((r:any)=>r.recipient_id)));
      const{data:declined}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).eq("status","declined");
      setDeclinedIds(new Set((declined||[]).map((r:any)=>r.recipient_id)));
      if(isHostRegistration(registration)){
        // Hosts are always active — set state immediately without DB round-trip
        // (the server already created their guest_profiles row with networking_visible=true)
        setNetworkingActive(true);
      }
      setAuraLoaded(true);
    }
    loadAura();
  },[profile,event,auraLoaded,registration]);

  const fetchNodes=useCallback(async()=>{
    if(!profile||!event)return;
    // Hosts are always considered active in the networking view
    const{data:approved}=await supabase.from("handshakes").select("sender_id,receiver_id").eq("event_id",event.id).or("sender_id.eq."+profile.id+",receiver_id.eq."+profile.id).limit(500);
    const approvedSet=new Set<string>();
    (approved||[]).forEach((h:any)=>{
      if(h.sender_id!==profile.id)approvedSet.add(h.sender_id);
      if(h.receiver_id!==profile.id)approvedSet.add(h.receiver_id);
    });
    const{data:sentReqs}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).eq("status","pending");
    const sentSet=new Set((sentReqs||[]).map((r:any)=>r.recipient_id));
    const{data:declinedReqs}=await supabase.from("handshake_requests").select("recipient_id").eq("requester_id",profile.id).eq("event_id",event.id).eq("status","declined");
    // Also fetch approved connections to exclude from live list (they appear in Connections tab)
    const{data:approvedReqs}=await supabase.from("handshake_requests").select("recipient_id,requester_id").eq("event_id",event.id).eq("status","approved").or("requester_id.eq."+profile.id+",recipient_id.eq."+profile.id);
    const declinedSet=new Set((declinedReqs||[]).map((r:any)=>r.recipient_id));
    // Also add approved handshake_requests to approvedSet (handshakes table may be empty)
    (approvedReqs||[]).forEach((h:any)=>{
      if(h.requester_id!==profile.id)approvedSet.add(h.requester_id);
      if(h.recipient_id!==profile.id)approvedSet.add(h.recipient_id);
    });
    setDeclinedIds(declinedSet);
    setSentRequests(sentSet);
    // load event policy + resolved permissions + roles (for badge lookup) in parallel
    const[{data:eventPolicy},{data:allPerms},{data:allRoles}]=await Promise.all([
      supabase.from("event_policies").select("networking_enabled,default_visibility").eq("event_id",event.id).maybeSingle(),
      supabase.from("resolved_role_permissions").select("role_id,discoverable,bypass_visibility").eq("event_id",event.id),
      supabase.from("roles").select("id,badge,label"),
    ]);
    const newRolesMap=Object.fromEntries((allRoles||[]).map((r:any)=>[r.id,r]));
    setRolesMap(newRolesMap);
    rolesMapRef.current=newRolesMap;

    // If resolved_role_permissions returned nothing (RLS may block anon reads
    // on the view), fall back to reading event_role_policies directly.
    let effectivePerms = allPerms;
    if (!effectivePerms || effectivePerms.length === 0) {
      const { data: rawPolicies } = await supabase
        .from("event_role_policies")
        .select("role_id,discoverable,bypass_visibility,can_discover")
        .eq("event_id", event.id);
      if (rawPolicies && rawPolicies.length > 0) effectivePerms = rawPolicies;
    }

    // Ensure we always have a policy row — upsert defaults if none exists yet.
    // This means the host never needs to visit the Policies tab first for
    // basic behaviour (networking enabled, default visible) to work correctly.
    let policy = eventPolicy;
    if (!policy) {
      await supabase.from("event_policies").upsert({
        event_id: event.id,
        networking_enabled: true,
        default_visibility: "visible",
      }, { onConflict: "event_id", ignoreDuplicates: true });
      policy = { networking_enabled: true, default_visibility: "visible" };
    }
    if(policy?.networking_enabled===false){setNodes([]);return;}

    const permsByRole=Object.fromEntries((effectivePerms||[]).map((p:any)=>[p.role_id,p]));
    const defaultVisibility=policy?.default_visibility??"visible";

    // limit raised to 99 — no artificial cap on visible attendees
    const{data}=await supabase.from("guest_profiles").select("*").eq("event_id",event.id).eq("networking_visible",true).neq("id",profile.id).limit(99);
    const{data:blockedData}=await supabase.from("guest_blocks").select("blocked_id").eq("blocker_id",profile.id).eq("event_id",event.id);
    const blockedSet=new Set((blockedData||[]).map((b:any)=>b.blocked_id));

    const myPerms=permsByRole[profile.role??"attendee"];
    const iCanDiscover=myPerms?.can_discover!==false;


    const filtered=(data||[]).filter((n:any)=>{
      if(approvedSet.has(n.id)||declinedSet.has(n.id)||blockedSet.has(n.id)){
            return false;
      }
      const theirPerms=permsByRole[n.role??"attendee"];
      if(theirPerms?.discoverable===false){
            return false;
      }
      if(defaultVisibility==="hidden"&&!theirPerms?.bypass_visibility){
            return false;
      }
      if(!iCanDiscover){
            return false;
      }
      return true;
    });
    setNodes(filtered.map((n:any)=>({...n,networking_intents:parseIntents(n.networking_intents),role_badge:newRolesMap[n.role]?.badge??null})));
    if(registration?.status!=="host"){
      const hostRes=await fetch('/api/events/host-profile?event_id='+event.id);
      const hostData=await hostRes.json();
      if(hostData.host)setHostNode(hostData.host);
    }
  },[profile,event,registration]);

  useEffect(()=>{
    if(!isLive||!event||!profile||!networkingActive)return;
    fetchNodes(); // initial load only — realtime channels below handle all updates
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
      // Incoming requests are surfaced reliably in the Connections tab
      // (usePendingRequests — a plain DB query, not tied to being on this
      // screen at the right second). No local popup needed here anymore.
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
      .subscribe((status)=>{
        if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){
          setTimeout(()=>{ try{ ch.subscribe(); fetchNodes(); }catch(_){} },3000);
        }
      });
    channelRef.current=ch;

    // When the host upgrades a guest's role (e.g. attendee → VIP), the
    // guest_profiles row is updated. Re-fetch nodes so the new role badge
    // and permission (bypass_visibility etc.) take effect immediately —
    // without the upgraded guest needing to refresh their screen.
    let roleRetryTimer: ReturnType<typeof setTimeout>|null=null;
    const roleChangeCh=supabase.channel("role-change:"+event.id)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"guest_profiles",filter:"event_id=eq."+event.id},(payload:any)=>{
        // Update the node in-place if it's already visible, or re-fetch
        // in case visibility changed (e.g. newly bypass_visibility VIP
        // should appear even when default_visibility=hidden).
        setNodes(prev=>{
          const idx=prev.findIndex((n:any)=>n.id===payload.new.id);
          if(idx===-1){
            // Node wasn't visible before — re-fetch to apply new permissions
            fetchNodes();
            return prev;
          }
          const updated=[...prev];
          const rb=rolesMapRef.current[payload.new.role]?.badge??null;
          updated[idx]={...updated[idx],...payload.new,networking_intents:parseIntents(payload.new.networking_intents),role_badge:rb};
          return updated;
        });
      })
      .subscribe();

    // When the host changes event_policies (e.g. flips default_visibility
    // to hidden mid-event), re-run the full node fetch so the new policy
    // is applied immediately to every guest's screen — no refresh needed.
    const policyCh=supabase.channel("policy-change:"+event.id)
      .on("postgres_changes",{event:"*",schema:"public",table:"event_policies",filter:"event_id=eq."+event.id},()=>{
        fetchNodes();
      })
      .subscribe();

    return()=>{
      supabase.removeChannel(ch);
      supabase.removeChannel(roleChangeCh);
      supabase.removeChannel(policyCh);
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
    if(!selectedLiveReason)return;
    const reason=selectedLiveReason;
    setConfirmNode(null);
    setSelectedLiveReason("");
    setSentRequests(prev=>new Set(prev).add(node.id));
    const{data:req}=await supabase.from("handshake_requests").insert({requester_id:profile.id,recipient_id:node.id,event_id:event.id,status:"pending",expires_at:event.end_time,reason}).select().single();
    await channelRef.current?.send({type:"broadcast",event:"handshake_requested",payload:{request_id:req?.id,requester_id:profile.id,recipient_id:node.id,requester_name:profile.display_name,reason}});
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
      <MissedConnections event={event} profile={profile} />
    );
  }

  // Filtering was previously recomputed inline inside .filter().map() on
  // every render (including on every keystroke in the search box). Memoizing
  // it means typing in the search field doesn't re-run the filter+scan over
  // every node on each character when nothing else about `nodes` changed.
  const filteredNodes = useMemo(() => {
    const q = liveSearch.trim().toLowerCase();
    return nodes.filter((node: any) => {
      // Never show people the current guest has already declined
      if (declinedIds.has(node.id)) return false;
      if (!q) return true;
      return node.display_name?.toLowerCase().includes(q)
        || node.role_title?.toLowerCase().includes(q)
        || (node.networking_intents || []).some((i: string) => i.toLowerCase().includes(q));
    });
  }, [nodes, declinedIds, liveSearch]);

  return(
    <div style={{background:"linear-gradient(160deg,#0f0f13 0%,#12101a 100%)",minHeight:"calc(100vh - 100px)",position:"relative",padding:"16px"}}>
      <style>{`
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.2)}50%{box-shadow:0 0 0 12px rgba(37,99,235,0)}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <p style={{fontSize:"10px",color:PALETTE.orange,letterSpacing:"0.15em",fontWeight:"600",textTransform:"uppercase",margin:"0 0 16px"}}>Live Now</p>

      <MatchRecommendations
        profile={profile}
        event={event}
        sentRequests={sentRequests}
        onRequestSent={id => setSentRequests(prev => new Set([...prev, id]))}

      />

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
                {hostNode.events_count > 0 && <p style={{fontSize:"10px",color:"rgba(212,175,55,0.6)",margin:"2px 0 0"}}>{hostNode.events_count} event{hostNode.events_count !== 1 ? "s" : ""} hosted</p>}
              </div>
              <button onClick={()=>setConfirmNode({...hostNode,is_host:true})} style={{fontSize:"11px",fontWeight:"600",color:PALETTE.gold,background:"transparent",border:`1px solid rgba(212,175,55,0.4)`,borderRadius:"8px",padding:"6px 12px",cursor:"pointer"}}>Connect</button>
            </div>
          )}
        </div>
      )}

      {auraLoaded&&networkingActive&&filteredNodes.length===0&&(
        <p style={{color:"#555",fontSize:"14px",textAlign:"center",padding:"60px 0"}}>No one else is networking right now.</p>
      )}

      {/* Virtualized — only mounts the rows actually visible in the
          viewport, instead of every AttendeeCard for every guest at once.
          Without this, 200 live guests means 200 mounted DOM subtrees,
          which visibly stutters on lower-end Android devices. */}
      {auraLoaded&&networkingActive&&filteredNodes.length>0&&(
        <div style={{height:"calc(100vh - 320px)",minHeight:"300px"}}>
          <List<NodeRowProps>
            rowComponent={NodeRow}
            rowCount={filteredNodes.length}
            rowHeight={ROW_HEIGHT}
            rowProps={{ filteredNodes, sentRequests, onConnect: setConfirmNode }}
          />
        </div>
      )}

      {confirmNode&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:50}} onClick={()=>{setConfirmNode(null);setSelectedLiveReason("");}}>
          <div style={{background:"#0c0c0f",borderRadius:"24px 24px 0 0",padding:"24px",paddingBottom:"calc(24px + env(safe-area-inset-bottom))",width:"100%",borderTop:"1px solid rgba(255,255,255,0.05)",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
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
                  {confirmNode.networking_intents.map((intent:string)=>{
                    const iObj=(INTENT_MAP as any)[intent];
                    return <span key={intent} style={{fontSize:"11px",color:PALETTE.orange,background:"rgba(226,109,52,0.08)",border:"1px solid rgba(226,109,52,0.2)",borderRadius:"5px",padding:"3px 10px",fontWeight:"600"}}>{iObj?.label??intent}</span>;
                  })}
                </div>
              </div>
            )}
            <p style={{fontSize:"10px",color:"rgba(240,237,232,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"12px",marginTop:"8px"}}>Why do you want to connect?</p>
            {INTENT_GROUPS.map(group=>(
              <div key={group} style={{marginBottom:"10px"}}>
                <p style={{fontSize:"9px",fontWeight:"700",letterSpacing:"0.16em",color:"#8A7355",textTransform:"uppercase",margin:"0 0 6px"}}>{group}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {(INTENTS_BY_GROUP[group]||[]).map(intent=>(
                    <button key={intent.id} onClick={()=>setSelectedLiveReason(intent.id)}
                      style={{fontSize:"12px",fontWeight:"600",padding:"7px 12px",borderRadius:"8px",cursor:"pointer",
                        background:selectedLiveReason===intent.id?"rgba(226,109,52,0.12)":"rgba(255,255,255,0.03)",
                        color:selectedLiveReason===intent.id?PALETTE.orange:"rgba(240,237,232,0.5)",
                        border:selectedLiveReason===intent.id?"1px solid rgba(226,109,52,0.4)":"1px solid rgba(255,255,255,0.07)"}}>
                      {intent.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:"12px",marginTop:"16px"}}>
              <button onClick={()=>{setConfirmNode(null);setSelectedLiveReason("");}} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:"rgba(240,237,232,0.5)",border:"1px solid rgba(240,237,232,0.15)",fontSize:"13px",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>sendRequest(confirmNode)} disabled={!selectedLiveReason} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",color:selectedLiveReason?PALETTE.orange:"rgba(240,237,232,0.2)",border:`1px solid rgba(226,109,52,0.4)`,fontSize:"13px",fontWeight:"500",letterSpacing:"0.08em",textTransform:"uppercase",cursor:selectedLiveReason?"pointer":"default"}}>
                Send Request →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
