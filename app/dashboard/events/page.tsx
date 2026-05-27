"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showHiddenSection, setShowHiddenSection] = useState(false);
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
    const handleOutsideClick = () => setActiveMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  async function toggleHide(e: React.MouseEvent, eventId: string, currentHiddenState: boolean) {
    e.stopPropagation();
    setActiveMenu(null);
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
    setActiveMenu(null);
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

  if (loading) return <div style={{ padding: "40px", color: "#aaa", textAlign: "center", fontSize: "12px", letterSpacing: "0.1em" }}>LOADING USER ECOSYSTEM...</div>;

  const visibleEvents = events.filter(e => !e.is_hidden);
  const hiddenEvents = events.filter(e => e.is_hidden);

  const renderEventItem = (event: any) => {
    const isMenuOpen = activeMenu === event.id;
    return (
      <div
        key={event.id}
        onClick={() => router.push(`/dashboard/events/${event.id}`)}
        style={{
          background: "transparent",
          padding: "20px 0",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "500", margin: 0, color: "#f0ede8", letterSpacing: "0.01em" }}>
                {event.title || "Untitled Event"}
              </h2>
              <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: event.status === "live" ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)", color: event.status === "live" ? "#4ade80" : "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: "600" }}>
                {event.status}
              </span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>📍 {event.venue || "No Venue Specified"}</p>
          </div>

          <div style={{ position: "relative", marginLeft: "16px" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={(e) => { e.preventDefault(); setActiveMenu(isMenuOpen ? null : event.id); }}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "16px", padding: "8px", cursor: "pointer" }}
            >
              ⋯
            </button>
            {isMenuOpen && (
              <div style={{ position: "absolute", right: 0, top: "32px", background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "4px", zIndex: 10, minWidth: "100px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                <button
                  onClick={(e) => toggleHide(e, event.id, !!event.is_hidden)}
                  style={{ display: "block", width: "100%", background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", padding: "8px 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", cursor: "pointer" }}
                >
                  {event.is_hidden ? "Show" : "Hide"}
                </button>
                <button
                  onClick={(e) => deleteEvent(e, event.id)}
                  style={{ display: "block", width: "100%", background: "transparent", border: "none", color: "#ef4444", padding: "8px 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", cursor: "pointer", opacity: 0.8 }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 4px" }}>Your Domains</h1>
          <p style={{ fontSize: "11px", color: "#D4AF37", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: "500", opacity: 0.85 }}>Ecosystem Presence / {visibleEvents.length} Tracks</p>
        </div>
        <button onClick={() => router.push("/dashboard/events/create")} style={{ padding: "8px 16px", borderRadius: "6px", background: "transparent", color: "#E26D34", border: "1px solid rgba(226,109,52,0.45)", fontSize: "12px", fontWeight: "500", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
          + Create Event
        </button>
      </div>

      {visibleEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "24px" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", letterSpacing: "0.02em" }}>No active domains. Create an event to begin.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", marginBottom: "40px" }}>
          {visibleEvents.map(renderEventItem)}
        </div>
      )}

      {hiddenEvents.length > 0 && (
        <div style={{ marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
          <button
            onClick={() => setShowHiddenSection(!showHiddenSection)}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: "4px 0" }}
          >
            {showHiddenSection ? "▼" : "▶"} Hidden Domains ({hiddenEvents.length})
          </button>
          {showHiddenSection && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: "12px", opacity: 0.7 }}>
              {hiddenEvents.map(renderEventItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}