"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      // Fixed: Order by created_at instead of start_time so drafts (which lack dates) don't disappear
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });
        
      setEvents(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleHide(e: any, eventId: string, current: boolean) {
    e.stopPropagation();
    await supabase.from("events").update({ is_hidden: !current }).eq("id", eventId);
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, is_hidden: !current } : ev));
  }

  async function deleteEvent(e: any, eventId: string, status: string) {
    e.stopPropagation();
    if (status === "live") return;
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").update({ deleted_at: new Date().toISOString(), is_hidden: true }).eq("id", eventId);
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <p style={{ color: "var(--text-tertiary)", fontSize: "13px", letterSpacing: "0.05em" }}>Loading...</p>
    </div>
  );

  const statusMeta: any = {
    draft: { color: "var(--text-tertiary)", bg: "rgba(255,255,255,0.04)", label: "Draft" },
    scheduled: { color: "#E26D34", bg: "rgba(226,109,52,0.08)", label: "Scheduled" },
    live: { color: "#4ade80", bg: "rgba(74,222,128,0.08)", label: "Live" },
    ended: { color: "var(--text-tertiary)", bg: "rgba(255,255,255,0.04)", label: "Ended" },
  };

  const visible = events.filter(e => !e.is_hidden && !e.deleted_at);
  const hidden = events.filter(e => e.is_hidden && !e.deleted_at);

  function EventCard({ event }: { event: any }) {
    const meta = statusMeta[event.status] || statusMeta.draft;
    return (
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "8px",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        cursor: "pointer",
        opacity: event.is_hidden ? 0.4 : 1,
        transition: "all 0.15s",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }} onClick={() => router.push("/dashboard/events/" + event.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", letterSpacing: "-0.01em", margin: 0 }}>{event.title}</h2>
              <span style={{ fontSize: "10px", fontWeight: "600", color: meta.color, background: meta.bg, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "0 0 2px" }}>📍 {event.venue || "TBD"}</p>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: 0 }}>
              {event.start_time ? new Date(event.start_time).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "No Date Assigned"}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "12px", flexShrink: 0 }}>
            <button onClick={(e) => toggleHide(e, event.id, event.is_hidden)} style={{ fontSize: "10px", color: "var(--text-tertiary)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "3px 8px", cursor: "pointer" }}>
              {event.is_hidden ? "Show" : "Hide"}
            </button>
            {event.status !== "live" && (
              <button onClick={(e) => deleteEvent(e, event.id, event.status)} style={{ fontSize: "10px", color: "#f87171", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)", borderRadius: "6px", padding: "3px 8px", cursor: "pointer" }}>Delete</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.02em", margin: "0 0 2px" }}>Your Events</h1>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: 0 }}>{visible.length} active</p>
        </div>
        <button onClick={() => router.push("/dashboard/events/create")} style={{ padding: "9px 18px", borderRadius: "12px", background: "#E26D34", color: "#fff", border: "none", fontSize: "13px", cursor: "pointer", fontWeight: "600", boxShadow: "var(--shadow-accent)", letterSpacing: "-0.01em" }}>+ New event</button>
      </div>

      {visible.length === 0 && hidden.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.15 }}>✦</p>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: "500" }}>No events yet</p>
          <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>Create your first event to get started</p>
        </div>
      )}

      {visible.map(event => <EventCard key={event.id} event={event} />)}

      {hidden.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <button onClick={() => setShowHidden(!showHidden)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "12px", cursor: "pointer", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
            <span style={{ fontSize: "10px" }}>{showHidden ? "▾" : "▸"}</span>
            {hidden.length} hidden event{hidden.length > 1 ? "s" : ""}
          </button>
          {showHidden && hidden.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}
