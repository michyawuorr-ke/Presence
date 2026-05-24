"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventDetailPage() {
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [stats, setStats] = useState({registrations:0, confirmed:0, pending:0, revenue:0, checkins:0, onAura:0, handshakes:0, unlocked:0});
  const [loading, setLoading] = useState(true);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketQty, setTicketQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [hostLink, setHostLink] = useState("");
  const [timeToLive, setTimeToLive] = useState("");
  const [ending, setEnding] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
      const { data: tickets } = await supabase.from("ticket_types").select("*").eq("event_id", id);
      setEvent(ev);
      setTicketTypes(tickets ?? []);
      if (ev) { await loadStats(ev.id); }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && ev?.status === "live") {
        const { data: hostReg } = await supabase.from("registrations").select("guest_access_link").eq("event_id", id).eq("guest_email", user.email).eq("status", "host").single();
        if (hostReg) setHostLink(hostReg.guest_access_link);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!event || event.status !== "scheduled") return;
    const tick = setInterval(async () => {
      const now = new Date();
      const start = new Date(event.start_time);
      const diff = start.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(tick);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await fetch('/api/events/go-live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: id, host_email: user.email }),
          });
          const data = await res.json();
          if (res.ok) {
            setEvent((prev: any) => ({ ...prev, status: 'live' }));
            setHostLink(data.host_link);
          }
        }
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeToLive(h > 0 ? h + "h " + m + "m" : m > 0 ? m + "m " + s + "s" : s + "s");
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [event, id]);

  async function loadStats(eventId: string) {
    const [{ count: total }, { count: confirmed }, { count: checkins }, { count: onAura }, { count: handshakes }, { count: unlocked }] = await Promise.all([
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId),
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "confirmed"),
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("checked_in", true),
      supabase.from("guest_profiles").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("aura_active", true),
      supabase.from("handshakes").select("*", { count: "exact", head: true }).eq("event_id", eventId),
      supabase.from("handshakes").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("networking_status", "unlocked"),
    ]);
    const { data: revenueData } = await supabase.from("registrations").select("amount").eq("event_id", eventId).eq("paid", true);
    const revenue = (revenueData || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    setStats({ registrations: total || 0, confirmed: confirmed || 0, pending: (total || 0) - (confirmed || 0), revenue, checkins: checkins || 0, onAura: onAura || 0, handshakes: handshakes || 0, unlocked: unlocked || 0 });
  }

  async function handleEndEvent() {
    setEnding(true);
    await supabase.from("events").update({ status: "ended" }).eq("id", id);
    setEvent((prev: any) => ({ ...prev, status: "ended" }));
    setEnding(false);
  }

  async function handlePublish() {
    await supabase.from("events").update({ status: "scheduled" }).eq("id", id);
    setEvent((prev: any) => ({ ...prev, status: "scheduled" }));
  }

  async function handleAddTicket() {
    if (!ticketName) return;
    setSaving(true);
    const { data } = await supabase.from("ticket_types").insert({
      event_id: id, name: ticketName,
      price: parseFloat(ticketPrice) || 0,
      quantity: ticketQty ? parseInt(ticketQty) : null,
      is_active: true,
    }).select().single();
    if (data) setTicketTypes([...ticketTypes, data]);
    setTicketName(""); setTicketPrice(""); setTicketQty("");
    setShowAddTicket(false); setSaving(false);
  }

  function copyLink(text: string) {
    const el = document.createElement("textarea");
    el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
    document.body.appendChild(el); el.focus(); el.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(el);
  }

  function downloadReport() {
    const engagementRate = stats.registrations > 0 ? Math.round((stats.checkins / stats.registrations) * 100) : 0;
    const connectionRate = stats.checkins > 0 ? Math.round((stats.handshakes / stats.checkins) * 100) : 0;
    const unlockRate = stats.handshakes > 0 ? Math.round((stats.unlocked / stats.handshakes) * 100) : 0;
    const activationLevel = stats.handshakes === 0 ? "No networking data recorded." : stats.handshakes < 5 ? "Early connections were made. A great start." : stats.handshakes < 20 ? "Solid networking activity. Your guests were engaged." : stats.handshakes < 50 ? "Strong activation. Your room came alive." : "Exceptional activation. This event created lasting connections.";

    const content = [
      "OREETI — EVENT ACTIVATION REPORT",
      "The room, activated.",
      "=".repeat(40), "",
      event.title, event.venue, new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      "", "━".repeat(40), "ATTENDANCE", "━".repeat(40),
      "Total Registrations:  " + stats.registrations, "Confirmed:            " + stats.confirmed,
      "Checked In:           " + stats.checkins, "Attendance Rate:      " + engagementRate + "%",
      stats.revenue > 0 ? "Total Revenue:        KES " + stats.revenue.toLocaleString() : "", "",
      "━".repeat(40), "NETWORKING", "━".repeat(40),
      "Guests Who Networked: " + stats.onAura, "Handshakes Exchanged: " + stats.handshakes,
      "Profiles Unlocked:    " + stats.unlocked, "Connection Rate:      " + connectionRate + "% of attendees connected",
      "Unlock Rate:          " + unlockRate + "% of connections went deeper", "",
      "━".repeat(40), "ACTIVATION SUMMARY", "━".repeat(40),
      activationLevel, stats.unlocked > 0 ? "\n" + stats.unlocked + " people walked out with real contact details." : "", "",
      "━".repeat(40), "Generated by Oreeti · " + new Date().toLocaleDateString("en-KE"),
      "hello.oreeti@gmail.com · The room, activated.",
    ].filter(Boolean).join("\n").trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = event.title.replace(/\s+/g, "-") + "-oreeti-report.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  if (loading) return <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Loading...</div>;
  if (!event) return <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Event not found</div>;

  const statusColor: any = { draft: "rgba(255,255,255,0.4)", scheduled: "#D4AF37", live: "#D4AF37", ended: "rgba(255,255,255,0.3)" };
  const statusBg: any = { draft: "rgba(255,255,255,0.04)", scheduled: "rgba(212,175,55,0.08)", live: "rgba(212,175,55,0.12)", ended: "rgba(255,255,255,0.02)" };
  const registrationLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register/${event.slug}`;

  const card = (label: string, value: any, color: string = "#f3f4f6") => (
    <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255, 255, 255, 0.04)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
      <p style={{ fontSize: "24px", fontWeight: "700", color, lineHeight: "1", marginBottom: "6px" }}>{value}</p>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: "500", letterSpacing: "0.02em" }}>{label}</p>
    </div>
  );

  return (
    <div style={{ padding: "40px 24px 120px 24px", background: "#060608", minHeight: "100vh" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* Unified Luxury Back Navigation */}
        <button onClick={() => router.back()} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: "15px", cursor: "pointer", marginBottom: "24px", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>

        {/* Core Profile Header Card Container */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "24px", padding: "24px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#f3f4f6", letterSpacing: "-0.01em", flex: 1, marginRight: "16px", margin: 0 }}>{event.title}</h1>
            <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: statusColor[event.status], background: statusBg[event.status], padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.08em", border: event.status !== "draft" ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" }}>{event.status}</span>
          </div>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", marginBottom: "16px" }} />
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>📍 {event.venue}</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>🗓 {new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>🕐 {new Date(event.start_time).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })} — {new Date(event.end_time).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>

        {/* Live Automatic Timing Banner */}
        <div style={{ marginBottom: "16px" }}>
          {event.status === "scheduled" && (
            <div style={{ background: "rgba(212,175,55,0.05)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(212,175,55,0.15)", textAlign: "center" }}>
              <p style={{ fontSize: "10px", color: "#D4AF37", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Live Sync Launch Sequence In</p>
              <p style={{ fontSize: "36px", fontWeight: "700", color: "#D4AF37", letterSpacing: "-0.02em", margin: 0 }}>{timeToLive || "..."}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>at {new Date(event.start_time).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          )}
          {event.status === "live" && (
            <button onClick={handleEndEvent} disabled={ending} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "rgba(248,113,113,0.06)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)", fontSize: "14px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.02em" }}>
              {ending ? "Closing Pipeline..." : "End Current Event"}
            </button>
          )}
        </div>

        {/* Host Identity Networking Hub Link */}
        {hostLink && (
          <div style={{ background: "rgba(212,175,55,0.06)", borderRadius: "18px", padding: "18px", marginBottom: "16px", border: "1px solid rgba(212,175,55,0.12)" }}>
            <p style={{ fontSize: "11px", color: "#D4AF37", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>★ Active Host Identification Access</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>Open this terminal to assume verified host credentials in the room</p>
            <p style={{ fontSize: "12px", color: "#93c5fd", wordBreak: "break-all", marginBottom: "16px", fontFamily: "monospace" }}>{hostLink.replace("https://", "")}</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => copyLink(hostLink)} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Copy Host Key</button>
              {typeof navigator !== "undefined" && navigator.share && <button onClick={() => navigator.share({ title: "My Host Link", url: hostLink })} style={{ padding: "12px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", cursor: "pointer" }}>Share</button>}
            </div>
          </div>
        )}

        {/* Global Registration Entry Pipeline */}
        {event.status !== "draft" && event.status !== "ended" && (
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "18px", padding: "18px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>Public Registration Link</p>
            <p style={{ fontSize: "12px", color: "#93c5fd", wordBreak: "break-all", marginBottom: "16px", fontFamily: "monospace" }}>{registrationLink.replace("https://", "")}</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => copyLink(registrationLink)} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", color: "#f3f4f6", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Copy Public Link</button>
              {typeof navigator !== "undefined" && navigator.share && <button onClick={() => navigator.share({ title: event.title, text: "Register for " + event.title, url: registrationLink })} style={{ padding: "12px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "none", fontSize: "12px", cursor: "pointer" }}>Share</button>}
            </div>
          </div>
        )}

        {/* Gate Entry Scanner Interface Strip */}
        {(event.status === "live" || event.status === "ended") && (
          <div style={{ background: "#111015", borderRadius: "16px", padding: "18px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#f1f0f5", margin: "0 0 2px 0" }}>Gate Check-In Terminal</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Verify tickets and manage door registration flows</p>
            </div>
            <button onClick={() => router.push("/dashboard/scanner/" + id)} style={{ padding: "12px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #221b0f, #13100b)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)", fontSize: "12px", cursor: "pointer", fontWeight: "700", letterSpacing: "0.05em" }}>OPEN →</button>
          </div>
        )}

        {/* Operational Statistics Matrix Grid */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)", boxShadow: "0 15px 35px rgba(0,0,0,0.4)" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>Registration Metrics</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            {card("Total Passes Issued", stats.registrations)}
            {card("Confirmed Seats", stats.confirmed, "#D4AF37")}
            {card("Pending Clearance", stats.pending, "rgba(255,255,255,0.6)")}
            {card("Attended Door", stats.checkins, "#D4AF37")}
          </div>
          {stats.revenue > 0 && (
            <div style={{ background: "rgba(212,175,55,0.06)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(212,175,55,0.15)", marginTop: "10px" }}>
              <p style={{ fontSize: "22px", fontWeight: "700", color: "#D4AF37", margin: "0 0 2px 0" }}>KES {stats.revenue.toLocaleString()}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>Total Pipeline Revenue</p>
            </div>
          )}
        </div>

        {/* Aura Engine Engagement Suite */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>Aura Proximity Pipeline Engagement</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {card("Active Nodes", stats.onAura, "#D4AF37")}
            {card("Handshakes", stats.handshakes, "#D4AF37")}
            {card("Unlocked Cards", stats.unlocked, "#D4AF37")}
          </div>
        </div>

        {/* Ticket Tier Management Matrix */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <div style={{ display: "flex", justifycontent: "space-between", alignItems: "center", justifyItems: "center", marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, flex: 1 }}>Ticket Architecture Tiers</p>
            <button onClick={() => setShowAddTicket(!showAddTicket)} style={{ padding: "6px 14px", borderRadius: "8px", background: "rgba(212,175,55,0.08)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
              {showAddTicket ? "Cancel" : "+ Allocate Tier"}
            </button>
          </div>

          {showAddTicket && (
            <div style={{ background: "#0d0c10", borderRadius: "14px", padding: "16px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <input value={ticketName} onChange={e => setTicketName(e.target.value)} placeholder="Tier Name (e.g., VIP Platinum Pass)" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f3f4f6", fontSize: "13px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} />
              <input value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} placeholder="Price in KES (0 for free admission)" type="number" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f3f4f6", fontSize: "13px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} />
              <input value={ticketQty} onChange={e => setTicketQty(e.target.value)} placeholder="Allocated Seat Quantity (Blank = Unlimited)" type="number" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f3f4f6", fontSize: "13px", outline: "none", marginBottom: "14px", boxSizing: "border-box" }} />
              <button onClick={handleAddTicket} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "linear-gradient(135deg, #221b0f, #13100b)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
                {saving ? "Deploying Tier..." : "Save Allocation Profile"}
              </button>
            </div>
          )}

          {ticketTypes.length === 0 && !showAddTicket && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: "8px 0 0 0" }}>No specialized ticket infrastructure declared yet.</p>}
          
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ticketTypes.map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "500", color: "#f3f4f6", margin: "0 0 2px 0" }}>{t.name}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0 }}>{t.quantity ? `Capacity: ${t.quantity} remaining` : "Unlimited Availability"}</p>
                </div>
                <p style={{ fontSize: "14px", color: "#D4AF37", fontWeight: "600", margin: 0 }}>{t.price > 0 ? "KES " + t.price.toLocaleString() : "Free Entry"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Global Pipeline Publishing Module Gateway */}
        {event.status === "draft" && (
          <div style={{ background: "#111015", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 15px 30px rgba(0,0,0,0.4)" }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "16px", lineHeight: "1.5" }}>Confirm all ticket types above are complete. Publishing will open public registrations across the platform.</p>
            <button onClick={handlePublish} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "linear-gradient(135deg, #221b0f, #13100b)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.35)", fontSize: "14px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>Publish Premium Event</button>
          </div>
        )}

        {/* Corporate Activation Export Subsystem */}
        <div style={{ background: "rgba(255,255,255,0.01)", borderRadius: "20px", padding: "20px", marginBottom: "40px", border: "1px solid rgba(255,255,255,0.03)" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Activation Insights Report</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>Download a raw text data metric log tracking entry gates, revenue metrics, and handshake counters.</p>
          <button onClick={downloadReport} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", color: "#f3f4f6", border: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.01em" }}>⬇ Export Performance Manifest</button>
        </div>

      </div>
    </div>
  );
}
