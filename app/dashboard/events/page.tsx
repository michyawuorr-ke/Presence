"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadEvents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function toggleHide(e: React.MouseEvent, eventId: string, currentHiddenState: boolean) {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_hidden: !currentHiddenState })
        .eq("id", eventId);
      
      if (error) throw error;
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, is_hidden: !currentHiddenState } : ev));
    } catch (err) {
      alert("Failed to update visibility");
    }
  }

  async function deleteEvent(e: React.MouseEvent, eventId: string) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err) {
      alert("Failed to delete event. Check RLS policies.");
    }
  }

  if (loading) return <div style={{ padding: "40px", color: "#aaa", textAlign: "center" }}>Loading your dashboard...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#fff" }}>Your Events</h1>
          <p style={{ fontSize: "12px", color: "#666" }}>Managed events ({events.length})</p>
        </div>
        <button onClick={() => router.push("/dashboard/events/create")} style={{ padding: "10px 16px", borderRadius: "8px", background: "#E26D34", color: "#fff", border: "none", fontWeight: "600", cursor: "pointer" }}>
          + Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#111", borderRadius: "12px" }}>
          <p style={{ color: "#aaa" }}>No events found. Click Create Event to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {events.map(event => (
            <div 
              key={event.id} 
              onClick={() => router.push(`/dashboard/events/${event.id}`)}
              style={{ background: "#111", padding: "16px", borderRadius: "14px", border: "1px solid #222", cursor: "pointer", opacity: event.is_hidden ? 0.5 : 1, transition: "all 0.2s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#fff" }}>{event.title || "Untitled Event"}</h2>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: event.status === "live" ? "rgba(74,222,128,0.1)" : "#222", color: event.status === "live" ? "#4ade80" : "#aaa" }}>
                      {event.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 0" }}>📍 {event.venue || "No Venue Specified"}</p>
                </div>
                
                <div style={{ display: "flex", gap: "8px", marginLeft: "12px" }}>
                  <button onClick={(e) => toggleHide(e, event.id, !!event.is_hidden)} style={{ background: "#222", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>
                    {event.is_hidden ? "Show" : "Hide"}
                  </button>
                  <button onClick={(e) => deleteEvent(e, event.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
