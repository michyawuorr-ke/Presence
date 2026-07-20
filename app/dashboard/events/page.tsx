"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const GOLD = "#D4AF37";

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function isUpcoming(start: string | null) {
  if (!start) return false;
  return new Date(start) > new Date();
}

function isMultiDay(start: string | null, end: string | null) {
  if (!start || !end) return false;
  return formatDate(start) !== formatDate(end);
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  live:      { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",  dot: "#4ade80" },
  scheduled: { color: GOLD,      bg: "rgba(212,175,55,0.08)",  border: "rgba(212,175,55,0.2)",  dot: GOLD },
  draft:     { color: "#555",    bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)", dot: "#555" },
  ended:     { color: "#444",    bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.04)", dot: "#444" },
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents]     = useState<any[]>([]);
  const [stats,  setStats]      = useState<Record<string, any>>({});
  const [loading, setLoading]   = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: evs } = await supabase
      .from("events")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false });

    setEvents(evs || []);

    // Load lightweight stats per event
    if (evs?.length) {
      const statsMap: Record<string, any> = {};
      await Promise.all(evs.map(async ev => {
        const { count } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", ev.id)
          .neq("status", "host");
        statsMap[ev.id] = { registrations: count ?? 0 };
      }));
      setStats(statsMap);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const close = () => setMenuOpen(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  async function toggleHide(e: React.MouseEvent, ev: any) {
    e.stopPropagation(); setMenuOpen(null);
    await supabase.from("events").update({ is_hidden: !ev.is_hidden }).eq("id", ev.id);
    setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, is_hidden: !ev.is_hidden } : x));
  }

  async function deleteEvent(e: React.MouseEvent, ev: any) {
    e.stopPropagation(); setMenuOpen(null);
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    await supabase.from("events").delete().eq("id", ev.id);
    setEvents(prev => prev.filter(x => x.id !== ev.id));
  }

  const visible = events.filter(e => !e.is_hidden);
  const hidden  = events.filter(e => e.is_hidden);

  const liveEvents      = visible.filter(e => e.status === "live");
  const upcomingEvents  = visible.filter(e => e.status !== "live" && e.status !== "ended" && isUpcoming(e.start_time));
  const draftEvents     = visible.filter(e => e.status === "draft" || (!e.status && !isUpcoming(e.start_time)));
  const pastEvents      = visible.filter(e => e.status === "ended");

  function EventCard({ ev }: { ev: any }) {
    const sc = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.draft;
    const reg = stats[ev.id]?.registrations ?? 0;
    const multi = isMultiDay(ev.start_time, ev.end_time);
    const isMenu = menuOpen === ev.id;

    return (
      <div
        onClick={() => router.push(`/dashboard/events/${ev.id}`)}
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)",
          border: `1px solid ${sc.border}`,
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "10px",
          cursor: "pointer",
          position: "relative",
          transition: "border-color 0.2s",
        }}
      >
        {/* Banner thumbnail if exists */}
        {ev.banner_url && (
          <div style={{ width: "100%", borderRadius: "10px", overflow: "hidden", marginBottom: "14px", background: "rgba(0,0,0,0.3)" }}>
            <img src={ev.banner_url} alt="" style={{ width: "100%", height: "auto", display: "block", maxHeight: "200px", objectFit: "contain" }} />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Status badge + live dot */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              {ev.status === "live" && (
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.dot, display: "inline-block", flexShrink: 0, boxShadow: `0 0 6px ${sc.dot}` }} />
              )}
              <span style={{ fontSize: "9px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: "4px", padding: "2px 7px" }}>
                {ev.status === "live" ? "Live Now" : ev.status ?? "Draft"}
              </span>
              {reg > 0 && (
                <span style={{ fontSize: "10px", color: "#555", fontWeight: "500" }}>{reg} registered</span>
              )}
            </div>

            {/* Title */}
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#f0ede8", margin: "0 0 6px", letterSpacing: "-0.01em", lineHeight: "1.3" }}>
              {ev.title || "Untitled Event"}
            </h2>

            {/* Venue */}
            {ev.venue && (
              <p style={{ fontSize: "12px", color: "#555", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>📍</span> {ev.venue}
              </p>
            )}

            {/* Date / time */}
            {ev.start_time && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: GOLD, fontWeight: "500" }}>
                  {formatDate(ev.start_time)}
                </span>
                <span style={{ fontSize: "11px", color: "#444" }}>·</span>
                <span style={{ fontSize: "11px", color: "#555" }}>
                  {formatTime(ev.start_time)}
                </span>
                {multi && (
                  <>
                    <span style={{ fontSize: "11px", color: "#333" }}>→</span>
                    <span style={{ fontSize: "11px", color: "#555" }}>{formatDate(ev.end_time)}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Context menu */}
          <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(isMenu ? null : ev.id); }}
              style={{ background: "transparent", border: "none", color: "#444", fontSize: "18px", padding: "4px 8px", cursor: "pointer", lineHeight: 1 }}>
              ⋯
            </button>
            {isMenu && (
              <div style={{ position: "absolute", right: "16px", top: "14px", background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "6px", zIndex: 20, minWidth: "130px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                <button onClick={e => { router.push(`/dashboard/events/${ev.id}`); e.stopPropagation(); }}
                  style={{ display: "block", width: "100%", background: "transparent", border: "none", color: "#f0ede8", padding: "9px 12px", fontSize: "12px", textAlign: "left", cursor: "pointer", borderRadius: "6px" }}>
                  Open
                </button>
                <button onClick={e => toggleHide(e, ev)}
                  style={{ display: "block", width: "100%", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", padding: "9px 12px", fontSize: "12px", textAlign: "left", cursor: "pointer", borderRadius: "6px" }}>
                  {ev.is_hidden ? "Unhide" : "Hide"}
                </button>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
                <button onClick={e => deleteEvent(e, ev)}
                  style={{ display: "block", width: "100%", background: "transparent", border: "none", color: "#ef4444", padding: "9px 12px", fontSize: "12px", textAlign: "left", cursor: "pointer", borderRadius: "6px" }}>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function Section({ title, evs, accent = "#555" }: { title: string; evs: any[]; accent?: string }) {
    if (!evs.length) return null;
    return (
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: accent, textTransform: "uppercase", margin: "0 0 12px" }}>{title}</p>
        {evs.map(ev => <EventCard key={ev.id} ev={ev} />)}
      </div>
    );
  }

  if (loading) return (
    <div style={{ padding: "24px 16px" }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "18px", padding: "18px", marginBottom: "10px" }}>
          <div style={{ height: "12px", width: "40px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", marginBottom: "12px" }} />
          <div style={{ height: "16px", width: "65%", borderRadius: "4px", background: "rgba(255,255,255,0.06)", marginBottom: "10px" }} />
          <div style={{ height: "12px", width: "45%", borderRadius: "4px", background: "rgba(255,255,255,0.03)" }} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <p style={{ fontSize: "19px", fontWeight: "700", letterSpacing: "-0.03em", fontFamily: "'Helvetica Neue',Arial,sans-serif", margin: "0 0 4px" }}><span style={{ color: "#ffffff" }}>Or</span><span style={{ color: "#E26D34" }}>ee</span><span style={{ color: "#ffffff" }}>ti</span></p>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#f0ede8", margin: 0, letterSpacing: "-0.02em" }}>Your Events</h1>
        </div>
        <button
          onClick={() => router.push("/dashboard/events/create")}
          style={{ padding: "10px 18px", borderRadius: "10px", background: "transparent", color: GOLD, border: "1px solid rgba(212,175,55,0.35)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.06em", cursor: "pointer" }}>
          + New
        </button>
      </div>

      {/* Empty state */}
      {visible.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "60px 24px", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "18px" }}>
          <p style={{ fontSize: "32px", margin: "0 0 12px" }}>✦</p>
          <p style={{ fontSize: "14px", color: "#f0ede8", fontWeight: "500", margin: "0 0 6px" }}>No events yet</p>
          <p style={{ fontSize: "12px", color: "#444", margin: "0 0 24px" }}>Create your first event to get started</p>
          <button onClick={() => router.push("/dashboard/events/create")}
            style={{ padding: "10px 24px", borderRadius: "10px", background: "transparent", border: `1px solid rgba(212,175,55,0.35)`, color: GOLD, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            Create Event
          </button>
        </div>
      )}

      <Section title="Live Now"  evs={liveEvents}     accent="#4ade80" />
      <Section title="Upcoming"  evs={upcomingEvents}  accent={GOLD} />
      <Section title="Draft"     evs={draftEvents}     accent="#555" />
      <Section title="Past"      evs={pastEvents}      accent="#444" />

      {/* Hidden */}
      {hidden.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "20px" }}>
          <button onClick={() => setShowHidden(!showHidden)}
            style={{ background: "transparent", border: "none", color: "#444", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: "4px 0", marginBottom: "12px" }}>
            {showHidden ? "▼" : "▶"} Hidden ({hidden.length})
          </button>
          {showHidden && hidden.map(ev => <EventCard key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  );
}
