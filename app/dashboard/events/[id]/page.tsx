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
      setLoading(false);
    }
    load();
  },[id]);

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
    setStats({
      registrations:total||0,
      confirmed:confirmed||0,
      pending:(total||0)-(confirmed||0),
      revenue,
      checkins:checkins||0,
      onAura:onAura||0,
      handshakes:handshakes||0,
      unlocked:unlocked||0,
    });
  }

  // Auto go-live at start time
  useEffect(()=>{
    if(!event||event.status!=="scheduled")return;
    const tick=setInterval(async()=>{
      const now=new Date();
      const start=new Date(event.start_time);
      const diff=start.getTime()-now.getTime();
      if(diff<=0){
        clearInterval(tick);
        // Auto trigger go live
        const{data:{user}}=await supabase.auth.getUser();
        if(user){
          const res=await fetch('/api/events/go-live',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({event_id:id,host_email:user.email}),
          });
          const data=await res.json();
          if(res.ok){
            setEvent({...event,status:'live'});
            setHostLink(data.host_link);
          }
        }
      }else{
        const mins=Math.floor(diff/60000);
        const secs=Math.floor((diff%60000)/1000);
        setTimeToLive(mins>0?mins+"m "+secs+"s":secs+"s");
      }
    },1000);
    return()=>clearInterval(tick);
  },[event,id]);

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

  function downloadPDF(){
    const engagementRate=stats.registrations>0?Math.round((stats.checkins/stats.registrations)*100):0;
    const connectionRate=stats.checkins>0?Math.round((stats.handshakes/stats.checkins)*100):0;
    const unlockRate=stats.handshakes>0?Math.round((stats.unlocked/stats.handshakes)*100):0;
    const activationLevel=stats.handshakes===0?"No networking data recorded.":stats.handshakes<5?"Early connections were made. A great start.":stats.handshakes<20?"Solid networking activity. Your guests were engaged.":stats.handshakes<50?"Strong activation. Your room came alive.":"Exceptional activation. This event created lasting connections.";
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
      "NETWORKING ACTIVITY",
      "━".repeat(40),
      "Guests Networked: "+stats.onAura,
      "Handshakes Exchanged: "+stats.handshakes,
      "Profiles Unlocked:    "+stats.unlocked,
      "Connection Rate:      "+connectionRate+"% of attendees connected",
      "Unlock Rate:          "+unlockRate+"% of connections went deeper",
      "",
      "━".repeat(40),
      "ACTIVATION SUMMARY",
      "━".repeat(40),
      activationLevel,
      "",
      stats.unlocked>0?stats.unlocked+" people walked out with real contact details —":"",
      stats.unlocked>0?"not a LinkedIn request. A real connection made in person.":"",
      "",
      "━".repeat(40),
      "Generated by Oreeti · "+new Date().toLocaleDateString("en-KE"),
      "hello.oreeti@gmail.com",
      "The room, activated.",
    ].filter(l=>l!==undefined).join("\n").trim();
    const blob=new Blob([content],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=event.title.replace(/\s+/g,"-")+"-oreeti-report.txt";
    document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(url);
  }

  if(loading)return<div style={{textAlign:"center",padding:"60px",color:"#999"}}>Loading...</div>;
  if(!event)return<div style={{textAlign:"center",padding:"60px",color:"#999"}}>Event not found</div>;

  const statusColor:any={draft:"#999",scheduled:"#2563eb",live:"#16a34a",ended:"#666"};
  const registrationLink=`${window.location.origin}/register/${event.slug}`;

  return(
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#999",fontSize:"14px",cursor:"pointer",marginBottom:"24px",padding:"0"}}>← Back</button>

      {/* Header */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
          <h1 style={{fontSize:"22px",fontWeight:"500"}}>{event.title}</h1>
          <span style={{fontSize:"11px",textTransform:"uppercase",fontWeight:"600",color:statusColor[event.status],background:event.status==="live"?"#f0fdf4":"#f9fafb",padding:"4px 10px",borderRadius:"8px"}}>{event.status}</span>
        </div>
        <p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>📍 {event.venue}</p>
        <p style={{fontSize:"14px",color:"#999",marginBottom:"4px"}}>🗓 {new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</p>
        <p style={{fontSize:"14px",color:"#999"}}> 🕐 {new Date(event.start_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})} — {new Date(event.end_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
      </div>

      {(event.status==="live"||event.status==="ended")&&(
        <div style={{background:"#fff",borderRadius:"20px",padding:"20px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{fontSize:"14px",fontWeight:"500",marginBottom:"2px"}}>Gate Scanner</p>
            <p style={{fontSize:"12px",color:"#999"}}>Scan guest tickets at entrance</p>
          </div>
          <button onClick={()=>router.push("/dashboard/scanner/"+id)} style={{padding:"10px 20px",borderRadius:"12px",background:"#000",color:"#fff",border:"none",fontSize:"13px",cursor:"pointer",fontWeight:"500"}}>Open →</button>
        </div>
      )}

      {/* Actions */}
      <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"16px"}}>
        {event.status==="draft"&&(
          <button onClick={()=>supabase.from("events").update({status:"scheduled"}).eq("id",id).then(()=>setEvent({...event,status:"scheduled"}))} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#2563eb",color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>Publish Event</button>
        )}
        {event.status==="scheduled"&&(
          <button onClick={()=>supabase.from("events").update({status:"live"}).eq("id",id).then(()=>setEvent({...event,status:"live"}))} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#16a34a",color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>🟢 Go Live</button>
        )}
        {event.status==="live"&&(
          <button onClick={()=>supabase.from("events").update({status:"ended"}).eq("id",id).then(()=>setEvent({...event,status:"ended"}))} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#ef4444",color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>End Event</button>
        )}
      </div>

      {/* Registration link */}
      {event.status!=="draft"&&(
        <div style={{background:"#f0fdf4",borderRadius:"16px",padding:"16px",marginBottom:"16px",border:"1px solid #bbf7d0"}}>
          <p style={{fontSize:"12px",color:"#16a34a",marginBottom:"8px",fontWeight:"600"}}>REGISTRATION LINK</p>
          <p style={{fontSize:"13px",color:"#333",wordBreak:"break-all",marginBottom:"12px"}}>{registrationLink.replace("https://","")}</p>
          <div style={{display:"flex",gap:"8px"}}>
          <button onClick={()=>copyLink(registrationLink)} style={{padding:"8px 16px",borderRadius:"10px",background:"#16a34a",color:"#fff",border:"none",fontSize:"12px",cursor:"pointer",fontWeight:"500"}}>Copy link</button>
          {typeof navigator!=="undefined"&&navigator.share&&<button onClick={()=>navigator.share({title:event.title,text:"Register for "+event.title,url:registrationLink})} style={{padding:"8px 16px",borderRadius:"10px",background:"#166534",color:"#fff",border:"none",fontSize:"12px",cursor:"pointer",fontWeight:"500"}}>Share</button>}
        </div>
        </div>
      )}

      {/* Stats */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)"}}>
        <p style={{fontSize:"12px",fontWeight:"600",color:"#999",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"16px"}}>Registrations</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
          {[
            {label:"Total",value:stats.registrations},
            {label:"Confirmed",value:stats.confirmed},
            {label:"Pending",value:stats.pending},
            {label:"Checked In",value:stats.checkins},
          ].map(s=>(
            <div key={s.label} style={{background:"#f9fafb",borderRadius:"14px",padding:"16px"}}>
              <p style={{fontSize:"28px",fontWeight:"600",color:"#0a0a0b",marginBottom:"4px"}}>{s.value}</p>
              <p style={{fontSize:"12px",color:"#999"}}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{background:"#f0fdf4",borderRadius:"14px",padding:"16px"}}>
          <p style={{fontSize:"24px",fontWeight:"600",color:"#16a34a",marginBottom:"4px"}}>KES {stats.revenue.toLocaleString()}</p>
          <p style={{fontSize:"12px",color:"#16a34a"}}>Total Revenue</p>
        </div>
      </div>

      {/* Networking stats */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)"}}>
        <p style={{fontSize:"12px",fontWeight:"600",color:"#999",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"16px"}}>Networking</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
          {[
            {label:"Networking",value:stats.onAura},
            {label:"Handshakes",value:stats.handshakes},
            {label:"Unlocked",value:stats.unlocked},
          ].map(s=>(
            <div key={s.label} style={{background:"#f9fafb",borderRadius:"14px",padding:"16px",textAlign:"center"}}>
              <p style={{fontSize:"28px",fontWeight:"600",color:"#0a0a0b",marginBottom:"4px"}}>{s.value}</p>
              <p style={{fontSize:"12px",color:"#999"}}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket types */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <p style={{fontSize:"12px",fontWeight:"600",color:"#999",letterSpacing:"0.1em",textTransform:"uppercase"}}>Ticket Types</p>
          <button onClick={()=>setShowAddTicket(!showAddTicket)} style={{padding:"8px 16px",borderRadius:"12px",background:"#000",color:"#fff",border:"none",fontSize:"12px",cursor:"pointer"}}>+ Add</button>
        </div>
        {showAddTicket&&(
          <div style={{background:"#f9fafb",borderRadius:"14px",padding:"16px",marginBottom:"16px"}}>
            <input value={ticketName} onChange={e=>setTicketName(e.target.value)} placeholder="Ticket name (e.g. General, VIP)" style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"8px",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
            <input value={ticketPrice} onChange={e=>setTicketPrice(e.target.value)} placeholder="Price in KES (0 for free)" type="number" style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"8px",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
            <input value={ticketQty} onChange={e=>setTicketQty(e.target.value)} placeholder="Quantity (leave empty for unlimited)" type="number" style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"12px",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
            <button onClick={handleAddTicket} disabled={saving} style={{width:"100%",padding:"12px",borderRadius:"12px",background:"#000",color:"#fff",border:"none",fontSize:"14px",cursor:"pointer"}}>{saving?"Saving...":"Save ticket type"}</button>
          </div>
        )}
        {ticketTypes.length===0&&!showAddTicket&&<p style={{color:"#999",fontSize:"14px"}}>No ticket types yet.</p>}
        {ticketTypes.map(t=>(
          <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #f3f4f6"}}>
            <p style={{fontSize:"14px",fontWeight:"500"}}>{t.name}</p>
            <p style={{fontSize:"14px",color:t.price>0?"#2563eb":"#16a34a"}}>{t.price>0?"KES "+t.price:"Free"}</p>
          </div>
        ))}
      </div>

      {/* Download Report */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",marginBottom:"32px",border:"1px solid rgba(0,0,0,0.06)"}}>
        <p style={{fontSize:"12px",fontWeight:"600",color:"#999",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>Report</p>
        <p style={{fontSize:"13px",color:"#999",marginBottom:"16px"}}>Download a summary of this event's registrations and networking activity.</p>
        <button onClick={downloadPDF} style={{width:"100%",padding:"14px",borderRadius:"14px",background:"#0a0a0b",color:"#fff",border:"none",fontSize:"14px",fontWeight:"500",cursor:"pointer"}}>⬇ Download Report</button>
      </div>
    </div>
  );
}
