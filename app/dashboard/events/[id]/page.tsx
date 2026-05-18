"use client";
import{useEffect,useState}from"react";
import{useRouter,useParams}from"next/navigation";
import{supabase}from"@/lib/supabase/client";

export default function EventDetailPage(){
  const[event,setEvent]=useState<any>(null);
  const[ticketTypes,setTicketTypes]=useState<any[]>([]);
  const[stats,setStats]=useState({registrations:0,confirmed:0,pending:0,revenue:0,checkins:0,onAura:0,handshakes:0,unlocked:0});
  const[loading,setLoading]=useState(true);
  const[showAddTicket,setShowAddTicket]=useState(false);
  const[ticketName,setTicketName]=useState("");
  const[ticketPrice,setTicketPrice]=useState("");
  const[ticketQty,setTicketQty]=useState("");
  const[saving,setSaving]=useState(false);
  const[hostLink,setHostLink]=useState("");
  const[timeToLive,setTimeToLive]=useState("");
  const[ending,setEnding]=useState(false);
  const router=useRouter();
  const params=useParams();
  const id=params.id as string;

  useEffect(()=>{
    async function load(){
      const{data:ev}=await supabase.from("events").select("*").eq("id",id).single();
      const{data:tickets}=await supabase.from("ticket_types").select("*").eq("event_id",id);
      setEvent(ev);
      setTicketTypes(tickets??[]);
      if(ev){await loadStats(ev.id);}
      // Check if host already has a link
      const{data:{user}}=await supabase.auth.getUser();
      if(user&&ev?.status==="live"){
        const{data:hostReg}=await supabase.from("registrations").select("guest_access_link").eq("event_id",id).eq("guest_email",user.email).eq("status","host").single();
        if(hostReg)setHostLink(hostReg.guest_access_link);
      }
      setLoading(false);
    }
    load();
  },[id]);

  // Auto go-live countdown
  useEffect(()=>{
    if(!event||event.status!=="scheduled")return;
    const tick=setInterval(async()=>{
      const now=new Date();
      const start=new Date(event.start_time);
      const diff=start.getTime()-now.getTime();
      if(diff<=0){
        clearInterval(tick);
        const{data:{user}}=await supabase.auth.getUser();
        if(user){
          const res=await fetch('/api/events/go-live',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({event_id:id,host_email:user.email}),
          });
          const data=await res.json();
          if(res.ok){
            setEvent((prev:any)=>({...prev,status:'live'}));
            setHostLink(data.host_link);
          }
        }
      }else{
        const h=Math.floor(diff/3600000);
        const m=Math.floor((diff%3600000)/60000);
        const s=Math.floor((diff%60000)/1000);
        setTimeToLive(h>0?h+"h "+m+"m":m>0?m+"m "+s+"s":s+"s");
      }
    },1000);
    return()=>clearInterval(tick);
  },[event,id]);

  async function loadStats(eventId:string){
    const[{count:total},{count:confirmed},{count:checkins},{count:onAura},{count:handshakes},{count:unlocked}]=await Promise.all([
      supabase.from("registrations").select("*",{count:"exact",head:true}).eq("event_id",eventId),
      supabase.from("registrations").select("*",{count:"exact",head:true}).eq("event_id",eventId).eq("status","confirmed"),
      supabase.from("registrations").select("*",{count:"exact",head:true}).eq("event_id",eventId).eq("checked_in",true),
      supabase.from("guest_profiles").select("*",{count:"exact",head:true}).eq("event_id",eventId).eq("aura_active",true),
      supabase.from("handshakes").select("*",{count:"exact",head:true}).eq("event_id",eventId),
      supabase.from("handshakes").select("*",{count:"exact",head:true}).eq("event_id",eventId).eq("networking_status","unlocked"),
    ]);
    const{data:revenueData}=await supabase.from("registrations").select("amount").eq("event_id",eventId).eq("paid",true);
    const revenue=(revenueData||[]).reduce((sum:number,r:any)=>sum+(r.amount||0),0);
    setStats({registrations:total||0,confirmed:confirmed||0,pending:(total||0)-(confirmed||0),revenue,checkins:checkins||0,onAura:onAura||0,handshakes:handshakes||0,unlocked:unlocked||0});
  }

  async function handleEndEvent(){
    setEnding(true);
    await supabase.from("events").update({status:"ended"}).eq("id",id);
    setEvent((prev:any)=>({...prev,status:"ended"}));
    setEnding(false);
  }

  async function handlePublish(){
    await supabase.from("events").update({status:"scheduled"}).eq("id",id);
    setEvent((prev:any)=>({...prev,status:"scheduled"}));
  }

  async function handleAddTicket(){
    if(!ticketName)return;
    setSaving(true);
    const{data}=await supabase.from("ticket_types").insert({
      event_id:id,name:ticketName,
      price:parseFloat(ticketPrice)||0,
      quantity:parseInt(ticketQty)||null,
      is_active:true,
    }).select().single();
    if(data)setTicketTypes([...ticketTypes,data]);
    setTicketName("");setTicketPrice("");setTicketQty("");
    setShowAddTicket(false);setSaving(false);
  }

  function copyLink(text:string){
    const el=document.createElement("textarea");
    el.value=text;el.style.position="fixed";el.style.opacity="0";
    document.body.appendChild(el);el.focus();el.select();
    try{document.execCommand("copy");}catch(e){}
    document.body.removeChild(el);
  }

  function downloadReport(){
    const engagementRate=stats.registrations>0?Math.round((stats.checkins/stats.registrations)*100):0;
    const connectionRate=stats.checkins>0?Math.round((stats.handshakes/stats.checkins)*100):0;
    const unlockRate=stats.handshakes>0?Math.round((stats.unlocked/stats.handshakes)*100):0;
    const activationLevel=stats.handshakes===0?"No networking data recorded.":stats.handshakes<5?"Early connections were made. A great start.":stats.handshakes<20?"Solid networking activity. Your guests were engaged.":stats.handshakes<50?"Strong activation. Your room came alive.":"Exceptional activation. This event created lasting connections.";
    // Clean report - no code artifacts
    const content=[
      "OREETI — EVENT ACTIVATION REPORT",
      "The room, activated.",
      "=".repeat(40),
      "",
      event.title,
      event.venue,
      new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),
      "",
      "━".repeat(40),
      "ATTENDANCE",
      "━".repeat(40),
      "Total Registrations:  "+stats.registrations,
      "Confirmed:            "+stats.confirmed,
      "Checked In:           "+stats.checkins,
      "Attendance Rate:      "+engagementRate+"%",
      stats.revenue>0?"Total Revenue:        KES "+stats.revenue.toLocaleString():"",
      "",
      "━".repeat(40),
      "NETWORKING",
      "━".repeat(40),
      "Guests Who Networked: "+stats.onAura,
      "Handshakes Exchanged: "+stats.handshakes,
      "Profiles Unlocked:    "+stats.unlocked,
      "Connection Rate:      "+connectionRate+"% of attendees connected",
      "Unlock Rate:          "+unlockRate+"% of connections went deeper",
      "",
      "━".repeat(40),
      "ACTIVATION SUMMARY",
      "━".repeat(40),
      activationLevel,
      stats.unlocked>0?"\n"+stats.unlocked+" people walked out with real contact details.":"",
      "",
      "━".repeat(40),
      "Generated by Oreeti · "+new Date().toLocaleDateString("en-KE"),
      "hello.oreeti@gmail.com · The room, activated.",
    ].filter(Boolean).join("\n").trim();
    const blob=new Blob([content],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=event.title.replace(/\s+/g,"-")+"-oreeti-report.txt";
    document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(url);
  }

  if(loading)return<div style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.45)"}}>Loading...</div>;
  if(!event)return<div style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.45)"}}>Event not found</div>;

  const statusColor:any={draft:"rgba(255,255,255,0.45)",scheduled:"#E26D34",live:"#E26D34",ended:"rgba(255,255,255,0.45)"};
  const statusBg:any={draft:"rgba(107,104,128,0.1)",scheduled:"rgba(226,109,52,0.1)",live:"rgba(226,109,52,0.12)",ended:"rgba(107,104,128,0.08)"};
  const registrationLink=`${typeof window!=="undefined"?window.location.origin:""}/register/${event.slug}`;

  const card=(label:string,value:any,color:string="#f1f0f5")=>(
    <div style={{background:"linear-gradient(135deg,rgba(22,20,28,0.95),rgba(18,16,22,0.95))",borderRadius:"12px",padding:"14px",border:"1px solid rgba(255,255,255,0.06)",boxShadow:"var(--shadow-card)"}}>
      <p style={{fontSize:"24px",fontWeight:"700",color,lineHeight:"1",marginBottom:"4px"}}>{value}</p>
      <p style={{fontSize:"11px",color:"rgba(255,255,255,0.45)"}}>{label}</p>
    </div>
  );

  return(
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <button onClick={()=>router.back()} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.45)",fontSize:"16px",cursor:"pointer",marginBottom:"20px",width:"36px",height:"36px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,rgba(22,20,28,0.98),rgba(16,14,20,0.98))",borderRadius:"20px",padding:"20px",marginBottom:"12px",border:"1px solid rgba(255,255,255,0.07)",boxShadow:"var(--shadow-elevated)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
          <h1 style={{fontSize:"20px",fontWeight:"700",color:"#f1f0f5",letterSpacing:"-0.02em",flex:1,marginRight:"12px"}}>{event.title}</h1>
          <span style={{fontSize:"10px",textTransform:"uppercase",fontWeight:"700",color:statusColor[event.status],background:statusBg[event.status],padding:"4px 10px",borderRadius:"8px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{event.status}</span>
        </div>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.45)",marginBottom:"2px"}}>📍 {event.venue}</p>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.45)",marginBottom:"2px"}}>🗓 {new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</p>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.45)"}}>🕐 {new Date(event.start_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})} — {new Date(event.end_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
      </div>

      {/* Actions */}
      <div style={{marginBottom:"12px"}}>

        {event.status==="scheduled"&&(
          <div style={{background:"rgba(226,109,52,0.08)",borderRadius:"14px",padding:"16px",border:"1px solid rgba(226,109,52,0.2)",textAlign:"center"}}>
            <p style={{fontSize:"11px",color:"#E26D34",fontWeight:"600",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"4px"}}>Goes live automatically in</p>
            <p style={{fontSize:"32px",fontWeight:"700",color:"#E26D34",letterSpacing:"-0.02em"}}>{timeToLive||"..."}</p>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.45)",marginTop:"4px"}}>at {new Date(event.start_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
          </div>
        )}
        {event.status==="live"&&(
          <button onClick={handleEndEvent} disabled={ending} style={{width:"100%",padding:"14px",borderRadius:"14px",background:"rgba(248,113,113,0.1)",color:"#f87171",border:"1px solid rgba(248,113,113,0.2)",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
            {ending?"Ending...":"End Event"}
          </button>
        )}
      </div>

      {/* Host networking link */}
      {hostLink&&(
        <div style={{background:"rgba(226,109,52,0.15)",borderRadius:"14px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(226,109,52,0.15)"}}>
          <p style={{fontSize:"11px",color:"#E26D34",fontWeight:"700",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"4px"}}>★ Your Host Link</p>
          <p style={{fontSize:"11px",color:"rgba(255,255,255,0.45)",marginBottom:"12px"}}>Open this to appear as host in your event's networking</p>
          <p style={{fontSize:"11px",color:"#f1f0f5",wordBreak:"break-all",marginBottom:"12px"}}>{hostLink.replace("https://","")}</p>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>copyLink(hostLink)} style={{flex:1,padding:"10px",borderRadius:"10px",background:"rgba(226,109,52,0.15)",color:"#E26D34",border:"1px solid rgba(226,109,52,0.15)",fontSize:"12px",cursor:"pointer",fontWeight:"600"}}>Copy link</button>
            {typeof navigator!=="undefined"&&navigator.share&&<button onClick={()=>navigator.share({title:"My Host Link",url:hostLink})} style={{padding:"10px 16px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.45)",border:"1px solid rgba(255,255,255,0.06)",fontSize:"12px",cursor:"pointer"}}>Share</button>}
          </div>
        </div>
      )}

      {/* Registration link */}
      {event.status!=="draft"&&event.status!=="ended"&&(
        <div style={{background:"rgba(226,109,52,0.12)",borderRadius:"14px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(226,109,52,0.12)"}}>
          <p style={{fontSize:"11px",color:"#E26D34",fontWeight:"700",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"4px"}}>Registration Link</p>
          <p style={{fontSize:"11px",color:"#f1f0f5",wordBreak:"break-all",marginBottom:"12px"}}>{registrationLink.replace("https://","")}</p>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>copyLink(registrationLink)} style={{flex:1,padding:"10px",borderRadius:"10px",background:"rgba(226,109,52,0.12)",color:"#E26D34",border:"1px solid rgba(226,109,52,0.12)",fontSize:"12px",cursor:"pointer",fontWeight:"600"}}>Copy link</button>
            {typeof navigator!=="undefined"&&navigator.share&&<button onClick={()=>navigator.share({title:event.title,text:"Register for "+event.title,url:registrationLink})} style={{padding:"10px 16px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.45)",border:"none",fontSize:"12px",cursor:"pointer"}}>Share</button>}
          </div>
        </div>
      )}

      {/* Gate scanner */}
      {(event.status==="live"||event.status==="ended")&&(
        <div style={{background:"rgba(26,26,36,0.9)",borderRadius:"14px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",marginBottom:"2px"}}>Gate Scanner</p>
            <p style={{fontSize:"12px",color:"rgba(255,255,255,0.45)"}}>Check in guests at entrance</p>
          </div>
          <button onClick={()=>router.push("/dashboard/scanner/"+id)} style={{padding:"10px 16px",borderRadius:"10px",background:"linear-gradient(135deg,#E26D34,#c85a24)",color:"#fff",border:"none",fontSize:"12px",cursor:"pointer",fontWeight:"600"}}>Open →</button>
        </div>
      )}

      {/* Stats */}
      <div style={{background:"linear-gradient(135deg,rgba(22,20,28,0.95),rgba(18,16,22,0.95))",borderRadius:"16px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(255,255,255,0.06)",boxShadow:"var(--shadow-card)"}}>
        <p style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.45)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px"}}>Registrations</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
          {card("Total",stats.registrations)}
          {card("Confirmed",stats.confirmed,"#E26D34")}
          {card("Pending",stats.pending,"#E26D34")}
          {card("Checked In",stats.checkins,"#E26D34")}
        </div>
        {stats.revenue>0&&(
          <div style={{background:"rgba(226,109,52,0.12)",borderRadius:"12px",padding:"14px",border:"1px solid rgba(226,109,52,0.12)"}}>
            <p style={{fontSize:"22px",fontWeight:"700",color:"#E26D34",marginBottom:"2px"}}>KES {stats.revenue.toLocaleString()}</p>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.45)"}}>Total Revenue</p>
          </div>
        )}
      </div>

      {/* Networking stats */}
      <div style={{background:"linear-gradient(135deg,rgba(22,20,28,0.95),rgba(18,16,22,0.95))",borderRadius:"16px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(255,255,255,0.06)",boxShadow:"var(--shadow-card)"}}>
        <p style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.45)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px"}}>Networking</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
          {card("Networking",stats.onAura,"#E26D34")}
          {card("Handshakes",stats.handshakes,"#E26D34")}
          {card("Unlocked",stats.unlocked,"#E26D34")}
        </div>
      </div>

      {/* Ticket types */}
      <div style={{background:"linear-gradient(135deg,rgba(22,20,28,0.95),rgba(18,16,22,0.95))",borderRadius:"16px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(255,255,255,0.06)",boxShadow:"var(--shadow-card)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <p style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.45)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Ticket Types</p>
          <button onClick={()=>setShowAddTicket(!showAddTicket)} style={{padding:"6px 12px",borderRadius:"8px",background:"rgba(226,109,52,0.1)",color:"#E26D34",border:"1px solid rgba(226,109,52,0.2)",fontSize:"12px",cursor:"pointer",fontWeight:"600"}}>+ Add</button>
        </div>
        {showAddTicket&&(
          <div style={{background:"rgba(15,15,19,0.8)",borderRadius:"12px",padding:"14px",marginBottom:"12px",border:"1px solid rgba(255,255,255,0.06)"}}>
            <input value={ticketName} onChange={e=>setTicketName(e.target.value)} placeholder="Ticket name" style={{width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#f1f0f5",fontSize:"13px",outline:"none",marginBottom:"8px",boxSizing:"border-box"}}/>
            <input value={ticketPrice} onChange={e=>setTicketPrice(e.target.value)} placeholder="Price in KES (0 for free)" type="number" style={{width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#f1f0f5",fontSize:"13px",outline:"none",marginBottom:"8px",boxSizing:"border-box"}}/>
            <input value={ticketQty} onChange={e=>setTicketQty(e.target.value)} placeholder="Quantity (empty = unlimited)" type="number" style={{width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#f1f0f5",fontSize:"13px",outline:"none",marginBottom:"12px",boxSizing:"border-box"}}/>
            <button onClick={handleAddTicket} disabled={saving} style={{width:"100%",padding:"10px",borderRadius:"10px",background:"linear-gradient(135deg,#E26D34,#c85a24)",color:"#fff",border:"none",fontSize:"13px",cursor:"pointer",fontWeight:"600"}}>{saving?"Saving...":"Save"}</button>
          </div>
        )}
        {ticketTypes.length===0&&!showAddTicket&&<p style={{color:"rgba(255,255,255,0.45)",fontSize:"13px"}}>No ticket types yet.</p>}
        {ticketTypes.map(t=>(
          <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <p style={{fontSize:"13px",fontWeight:"500",color:"#f1f0f5"}}>{t.name}</p>
            <p style={{fontSize:"13px",color:t.price>0?"#E26D34":"#E26D34",fontWeight:"600"}}>{t.price>0?"KES "+t.price:"Free"}</p>
          </div>
        ))}
      </div>

      {/* Publish - only for draft */}
      {event.status==="draft"&&(
        <div style={{background:"rgba(26,26,36,0.9)",borderRadius:"16px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(226,109,52,0.2)"}}>
          <p style={{fontSize:"12px",color:"rgba(255,255,255,0.45)",marginBottom:"12px"}}>Add ticket types above, then publish your event to open registrations.</p>
          <button onClick={handlePublish} style={{width:"100%",padding:"14px",borderRadius:"14px",background:"linear-gradient(135deg,#E26D34,#c85a24)",color:"#fff",border:"none",fontSize:"14px",fontWeight:"600",cursor:"pointer",boxShadow:"0 8px 24px rgba(226,109,52,0.3)"}}>Publish Event</button>
        </div>
      )}

      {/* Report */}
      <div style={{background:"rgba(26,26,36,0.9)",borderRadius:"16px",padding:"16px",marginBottom:"32px",border:"1px solid rgba(255,255,255,0.06)"}}>
        <p style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.45)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"8px"}}>Activation Report</p>
        <p style={{fontSize:"12px",color:"rgba(255,255,255,0.45)",marginBottom:"14px"}}>Download a summary of registrations and networking activity.</p>
        <button onClick={downloadReport} style={{width:"100%",padding:"12px",borderRadius:"12px",background:"rgba(255,255,255,0.06)",color:"#f1f0f5",border:"1px solid rgba(255,255,255,0.08)",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>⬇ Download Report</button>
      </div>
    </div>
  );
}
