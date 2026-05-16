"use client";
import{useEffect,useState}from"react";
import{useRouter}from"next/navigation";
import{supabase}from"@/lib/supabase/client";

export default function EventsPage(){
  const[events,setEvents]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[showHidden,setShowHidden]=useState(false);
  const router=useRouter();

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");return;}
      const{data}=await supabase.from("events").select("*").eq("host_id",user.id).order("start_time",{ascending:false});
      setEvents(data??[]);
      setLoading(false);
    }
    load();
  },[router]);

  async function toggleHide(e:any,eventId:string,current:boolean){
    e.stopPropagation();
    await supabase.from("events").update({is_hidden:!current}).eq("id",eventId);
    setEvents(prev=>prev.map(ev=>ev.id===eventId?{...ev,is_hidden:!current}:ev));
  }

  async function deleteEvent(e:any,eventId:string,status:string){
    e.stopPropagation();
    if(status==="live"){return;}
    if(!confirm("Delete this event? This cannot be undone."))return;
    const{error}=await supabase.from("events").update({deleted_at:new Date().toISOString(),is_hidden:true}).eq("id",eventId);
    if(error){alert("Could not delete: "+error.message);return;}
    setEvents(prev=>prev.filter(ev=>ev.id!==eventId));
  }

  const statusColor:any={draft:"#6b6880",scheduled:"#7c6aff",live:"#34d399",ended:"#6b6880"};
  const statusBg:any={draft:"rgba(107,104,128,0.1)",scheduled:"rgba(124,106,255,0.1)",live:"rgba(52,211,153,0.1)",ended:"rgba(107,104,128,0.1)"};

  if(loading)return<div style={{textAlign:"center",padding:"60px",color:"#6b6880"}}>Loading...</div>;

  const visible=events.filter(e=>!e.is_hidden&&!e.deleted_at);
  const hidden=events.filter(e=>e.is_hidden&&!e.deleted_at);
  // deleted events are filtered out of both

  function EventCard({event}:{event:any}){
    return(
      <div style={{background:"rgba(26,26,36,0.9)",borderRadius:"16px",padding:"16px",marginBottom:"8px",border:"1px solid rgba(255,255,255,0.06)",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}} onClick={()=>router.push("/dashboard/events/"+event.id)}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <h2 style={{fontSize:"15px",fontWeight:"700",color:"#ffffff",letterSpacing:"-0.01em"}}>{event.title}</h2>
              <span style={{fontSize:"10px",fontWeight:"600",color:statusColor[event.status],background:statusBg[event.status],padding:"2px 8px",borderRadius:"6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{event.status}</span>
            </div>
            <p style={{fontSize:"12px",color:"#6b6880",marginBottom:"2px"}}>📍 {event.venue}</p>
            <p style={{fontSize:"12px",color:"#6b6880"}}>🗓 {new Date(event.start_time).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})} · {new Date(event.start_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px",marginLeft:"12px"}}>
            <button onClick={(e)=>toggleHide(e,event.id,event.is_hidden)} style={{fontSize:"10px",color:event.is_hidden?"#34d399":"#6b6880",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"4px 8px",cursor:"pointer"}}>
              {event.is_hidden?"Show":"Hide"}
            </button>
            {event.status!=="live"&&(
              <button onClick={(e)=>deleteEvent(e,event.id,event.status)} style={{fontSize:"10px",color:"#f87171",background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:"6px",padding:"4px 8px",cursor:"pointer"}}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
        <h1 style={{fontSize:"20px",fontWeight:"700",color:"#f1f0f5",letterSpacing:"-0.02em"}}>Your Events</h1>
        <button onClick={()=>router.push("/dashboard/events/create")} style={{padding:"8px 16px",borderRadius:"12px",background:"linear-gradient(135deg,#E26D34,#c85a24)",color:"#fff",border:"none",fontSize:"13px",cursor:"pointer",fontWeight:"600",boxShadow:"0 4px 12px rgba(226,109,52,0.3)"}}>+ New event</button>
      </div>

      {visible.length===0&&hidden.length===0&&(
        <div style={{textAlign:"center",padding:"80px 0"}}>
          <p style={{fontSize:"32px",marginBottom:"16px",opacity:0.3}}>✦</p>
          <p style={{fontSize:"15px",color:"#f1f0f5",marginBottom:"8px",fontWeight:"500"}}>No events yet</p>
          <p style={{fontSize:"13px",color:"#6b6880"}}>Create your first event to get started</p>
        </div>
      )}

      {visible.map(event=><EventCard key={event.id} event={event}/>)}

      {hidden.length>0&&(
        <div style={{marginTop:"24px"}}>
          <button onClick={()=>setShowHidden(!showHidden)} style={{background:"none",border:"none",color:"#6b6880",fontSize:"12px",cursor:"pointer",marginBottom:"12px",display:"flex",alignItems:"center",gap:"6px"}}>
            {showHidden?"▾":"▸"} {hidden.length} hidden event{hidden.length>1?"s":""}
          </button>
          {showHidden&&hidden.map(event=><EventCard key={event.id} event={event}/>)}
        </div>
      )}
    </div>
  );
}
