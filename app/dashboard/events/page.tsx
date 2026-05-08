"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("events").select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });
      setEvents(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <div style={{textAlign:"center",padding:"60px",color:"#999"}}>Loading...</div>;

  return (
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
        <h1 style={{fontSize:"22px",fontWeight:"500"}}>Your Events</h1>
        <button onClick={() => router.push("/dashboard/events/create")}
          style={{padding:"10px 20px",borderRadius:"14px",background:"#000",color:"#fff",border:"none",fontSize:"13px",cursor:"pointer"}}>
          + New event
        </button>
      </div>
      {events.length === 0 && (
        <div style={{textAlign:"center",padding:"80px 0",color:"#999"}}>
          <p style={{fontSize:"32px",marginBottom:"16px"}}>✦</p>
          <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>No events yet</p>
          <p style={{fontSize:"14px"}}>Create your first event to get started</p>
        </div>
      )}
      {events.map((event) => (
        <div key={event.id} onClick={() => router.push("/dashboard/events/" + event.id)}
          style={{background:"#fff",borderRadius:"20px",padding:"20px",marginBottom:"12px",
            border:"1px solid rgba(0,0,0,0.06)",cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
            <h2 style={{fontSize:"16px",fontWeight:"500"}}>{event.title}</h2>
            <span style={{fontSize:"11px",textTransform:"uppercase",color:"#999"}}>{event.status}</span>
          </div>
          <p style={{fontSize:"13px",color:"#666",marginBottom:"4px"}}>📍 {event.venue}</p>
          <p style={{fontSize:"13px",color:"#999"}}>🗓 {new Date(event.start_time).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}