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
          <h1 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 4px" }}>Your Domains</h1>
          <p style={{ fontSize: "11px", color: "#D4AF37", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: "500", opacity: 0.85 }}>Ecosystem Presence / {events.length} Tracks</p>
        </div>
        <button onClick={() => router.push("/dashboard/events/create")} style={{ padding: "8px 16px", borderRadius: "6px", background: "transparent", color: "#E26D34", border: "1px solid rgba(226,109,52,0.45)", fontSize: "12px", fontWeight: "500", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}>
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
              style={{ background: "transparent", padding: "20px 0", borderRadius: "0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", opacity: event.is_hidden ? 0.35 : 1, transition: "all 0.2s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: "15px", fontWeight: "500", margin: 0, color: "#f0ede8", letterSpacing: "0.01em" }}>{event.title || "Untitled Event"}</h2>
                    <span style={{ fontSize: "10px", padding: "0 0 0 8px", background: "transparent", color: event.status === "live" ? "#4ade80" : "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "600" }}>
                      {event.status}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>📍 {event.venue || "No Venue Specified"}</p>
                </div>
                
                <div style={{ display: "flex", gap: "8px", marginLeft: "12px" }}>
                  <button onClick={(e) => toggleHide(e, event.id, !!event.is_hidden)} style={{ background: "transparent", color: "rgba(255,255,255,0.3)", border: "none", padding: "4px 8px", fontSize: "11px", fontWeight: "500", letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" }}>
                    {event.is_hidden ? "Show" : "Hide"}
                  </button>
                  <button onClick={(e) => deleteEvent(e, event.id)} style={{ background: "transparent", color: "rgba(239,68,68,0.4)", border: "none", padding: "4px 8px", fontSize: "11px", fontWeight: "500", letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" }}>
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
