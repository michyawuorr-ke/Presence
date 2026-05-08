"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ReportPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("events").select("*")
        .eq("host_id", user.id)
        .eq("status", "ended")
        .order("created_at", { ascending: false });
      setEvents(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{textAlign:"center",padding:"60px",color:"#999"}}>Loading...</div>;

  return (
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <h1 style={{fontSize:"22px",fontWeight:"500",marginBottom:"8px"}}>Post-Event Reports</h1>
      <p style={{fontSize:"14px",color:"#999",marginBottom:"24px"}}>
        Reports are available after events end.
      </p>

      {events.length === 0 && (
        <div style={{textAlign:"center",padding:"80px 0",color:"#999"}}>
          <p style={{fontSize:"32px",marginBottom:"16px"}}>📊</p>
          <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>No ended events yet</p>
          <p style={{fontSize:"14px"}}>Reports appear here after your events end</p>
        </div>
      )}

      {(events as any[]).map((event) => (
        <div key={event.id}
          style={{background:"#fff",borderRadius:"20px",padding:"20px",
            marginBottom:"12px",border:"1px solid rgba(0,0,0,0.06)"}}>
          <h2 style={{fontSize:"16px",fontWeight:"500",marginBottom:"8px"}}>{event.title}</h2>
          <p style={{fontSize:"13px",color:"#666",marginBottom:"16px"}}>
            {event.venue} · {new Date(event.start_time).toLocaleDateString()}
          </p>
          <button
            style={{padding:"10px 20px",borderRadius:"12px",background:"#000",
              color:"#fff",border:"none",fontSize:"13px",cursor:"pointer"}}>
            Download Report (PDF)
          </button>
        </div>
      ))}
    </div>
  );
}