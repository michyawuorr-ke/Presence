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
      const{data}=await supabase.from("events").select("*").eq("host_id",user.id).order("created_at",{ascending:false});
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

  if(loading)return<div style={{textAlign:"center",padding:"60px",color:"#999"}}>Loading...</div>;

  const visible=events.filter(e=>!e.is_hidden);
  const hidden=events.filter(e=>e.is_hidden);
  const statusColor:any={draft:"#999",scheduled:"#2563eb",live:"#16a34a",ended:"#666"};

  function EventCard({event}:{event:any}){
    return(
      <div style={{background:"rgba(26,26,36,0.9)",borderRadius:"16px",padding:"16px",marginBottom:"8px",border:"1px solid rgba(255,255,255,0.06)",cursor:"pointer",opacity:event.is_hidden?0.4:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
          <div style={{flex:1}} onClick={()=>router.push("/dashboard/events/"+event.id)}>
            <h2 style={{fontSize:"15px",fontWeight:"600",marginBottom:"4px",color:"#f1f0f5"}}>{event.title}</h2>
            <p style={{fontSize:"12px",color:"#6b6880",marginBottom:"2px"}}>📍 {event.venue}</p>
            <p style={{fontSize:"12px",color:"#6b6880"}}>🗓 {new Date(event.start_time).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"8px",marginLeft:"12px"}}>
            <span style={{fontSize:"11px",textTransform:"uppercase",fontWeight:"600",color:statusColor[event.status]}}>{event.status}</span>
            <button
              onClick={(e)=>toggleHide(e,event.id,event.is_hidden)}
              style={{fontSize:"11px",color:event.is_hidden?"#16a34a":"#999",background:"none",border:"1px solid "+(event.is_hidden?"#16a34a":"#e5e7eb"),borderRadius:"8px",padding:"4px 10px",cursor:"pointer"}}
            >
              {event.is_hidden?"Show":"Hide"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
        <h1 style={{fontSize:"20px",fontWeight:"700",color:"#f1f0f5",letterSpacing:"-0.02em"}}>Your Events</h1>
        <button onClick={()=>router.push("/dashboard/events/create")} style={{padding:"8px 16px",borderRadius:"12px",background:"linear-gradient(135deg,#7c6aff,#5b4fd4)",color:"#fff",border:"none",fontSize:"13px",cursor:"pointer",fontWeight:"600",boxShadow:"0 4px 12px rgba(124,106,255,0.3)"}}>+ New event</button>
      </div>

      {visible.length===0&&hidden.length===0&&(
        <div style={{textAlign:"center",padding:"80px 0",color:"#999"}}>
          <p style={{fontSize:"32px",marginBottom:"16px"}}>✦</p>
          <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>No events yet</p>
          <p style={{fontSize:"14px"}}>Create your first event to get started</p>
        </div>
      )}

      {visible.map(event=><EventCard key={event.id} event={event}/>)}

      {hidden.length>0&&(
        <div style={{marginTop:"24px"}}>
          <button onClick={()=>setShowHidden(!showHidden)} style={{background:"none",border:"none",color:"#999",fontSize:"13px",cursor:"pointer",marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
            {showHidden?"▾":"▸"} {hidden.length} hidden event{hidden.length>1?"s":""}
          </button>
          {showHidden&&hidden.map(event=><EventCard key={event.id} event={event}/>)}
        </div>
      )}
    </div>
  );
}
