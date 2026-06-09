"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventDetailPage() {
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [stats, setStats] = useState({registrations:0, confirmed:0, pending:0, revenue:0, checkins:0, onAura:0, handshakes:0, unlocked:0});
  const [pendingRegs, setPendingRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ticket Form Configuration
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketQty, setTicketQty] = useState("");
  const [saving, setSaving] = useState(false);

  // Colorless Networking Stations State
  const [stations, setStations] = useState<any[]>([]);
  const [stationName, setStationName] = useState("");
  const [stationSubtitle, setStationSubtitle] = useState("");
  const [savingStation, setSavingStation] = useState(false);

  // Banner Upload State
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [hostLink, setHostLink] = useState("");
  const [timeToLive, setTimeToLive] = useState("");
  const [ending, setEnding] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  async function loadStations() {
    const { data } = await supabase
      .from("event_stations")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: true });
    setStations(data || []);
  }

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
      const { data: tickets } = await supabase.from("ticket_types").select("*").eq("event_id", id);
      setEvent(ev);
      setTicketTypes(tickets ?? []);
      if (ev) { 
        setBannerUrl(ev.banner_url || "");
        await loadStats(ev.id); 
        await loadStations();
      }

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
  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingBanner(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/banner_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('event-banners')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-banners')
        .getPublicUrl(filePath);

      await supabase.from('events').update({ banner_url: publicUrl }).eq('id', id);
      setBannerUrl(publicUrl);
      setEvent((prev: any) => prev ? { ...prev, banner_url: publicUrl } : prev);
    } catch (err) {
      console.error("Banner deployment system error details:", err); alert("Upload Error: " + ((err as any).message || JSON.stringify(err)));
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleAddStation(e: React.FormEvent) {
    e.preventDefault();
    if (!stationName) return;
    setSavingStation(true);
    try {
      const { data, error } = await supabase.from("event_stations").insert({
        event_id: id,
        name: stationName,
        subtitle: stationSubtitle
      }).select().single();

      if (!error && data) {
        setStations([...stations, data]);
        setStationName("");
        setStationSubtitle("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStation(false);
    }
  }

  async function handleDeleteStation(stationId: string) {
    const { error } = await supabase.from("event_stations").delete().eq("id", stationId);
    if (!error) setStations(prev => prev.filter(s => s.id !== stationId));
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
    const activationLevel = stats.handshakes === 0 ? "No networking data recorded." : stats.handshakes < 5 ? "Early connections were made." : stats.handshakes < 20 ? "Solid networking activity." : stats.handshakes < 50 ? "Strong activation. Your room came alive." : "Exceptional activation.";

    const content = [
      "OREETI — EVENT ACTIVATION REPORT",
      "The room, activated.",
      "=".repeat(40), "",
      event.title, event.venue, new Date(event.start_time).toLocaleDateString("en-KE"),
      "", "ATTENDANCE",
      "Total Registrations:  " + stats.registrations,
      "Checked In:           " + stats.checkins, "Attendance Rate:      " + engagementRate + "%",
      "", "NETWORKING",
      "Guests Who Networked: " + stats.onAura, "Handshakes Exchanged: " + stats.handshakes,
      "Connection Rate:      " + connectionRate + "%",
      "", "ACTIVATION SUMMARY", activationLevel
    ].join("\n").trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = event.title.replace(/\s+/g, "-") + "-report.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  if (loading) return <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Loading Workspace...</div>;
  if (!event) return <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Event Missing</div>;

  const statusColor: any = { draft: "rgba(255,255,255,0.4)", scheduled: "#D4AF37", live: "#D4AF37", ended: "rgba(255,255,255,0.3)" };
  const statusBg: any = { draft: "rgba(255,255,255,0.04)", scheduled: "rgba(212,175,55,0.08)", live: "rgba(212,175,55,0.12)", ended: "rgba(255,255,255,0.02)" };
  const registrationLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register/${event.slug}`;

  const card = (label: string, value: any, color: string = "#f3f4f6") => (
    <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
      <p style={{ fontSize: "24px", fontWeight: "700", color, lineHeight: "1", marginBottom: "6px" }}>{value}</p>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: "500", letterSpacing: "0.02em" }}>{label}</p>
    </div>
  );

  return (
    <div style={{ background: "#060608", minHeight: "100vh", color: "#f3f4f6" }}>
      
      {/* PERFECT COVERAGE BANNER VIEWPORT */}
      <div style={{ width: "100%", height: "220px", background: "#0a0a0c", position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {(bannerUrl || event?.banner_url) ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <img src={bannerUrl || event?.banner_url} alt="Event Banner" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            <button onClick={async () => { if(confirm("Remove banner layout?")) { try { await supabase.from("events").update({ banner_url: null }).eq("id", id); setBannerUrl(""); setEvent((prev: any) => prev ? { ...prev, banner_url: null } : prev); } catch(e){} } }} style={{ position: "absolute", top: "16px", right: "16px", backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>Clear Canvas ×</button>
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <label style={{ padding: "10px 22px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "20px", fontSize: "11px", cursor: "pointer", color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>
              {uploadingBanner ? "Uploading..." : "+ Add Banner Image"}
              <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: "none" }} />
            </label>
          </div>
        )}
      </div>

      {/* CORE 600px CONTROL HOUSING */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 24px 120px 24px" }}>

        <button onClick={() => router.back()} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: "15px", cursor: "pointer", marginBottom: "24px", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>

        {/* METADATA BLOCK */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "24px", padding: "24px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#f3f4f6", letterSpacing: "-0.01em", flex: 1, marginRight: "16px", margin: 0 }}>{event.title}</h1>
            <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: statusColor[event.status], background: statusBg[event.status], padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.08em", border: event.status !== "draft" ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(255,255,255,0.05)" }}>{event.status}</span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>📍 {event.venue}</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0 }}>🗓 {new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
        </div>

        {/* LIFECYCLE CONTROLLER */}
        <div style={{ marginBottom: "16px" }}>
          {event.status === "scheduled" && (
            <div style={{ background: "rgba(212,175,55,0.05)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(212,175,55,0.15)", textAlign: "center" }}>
              <p style={{ fontSize: "10px", color: "#D4AF37", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Live Sync Launch Sequence In</p>
              <p style={{ fontSize: "36px", fontWeight: "700", color: "#D4AF37", margin: 0 }}>{timeToLive || "..."}</p>
            </div>
          )}
          {event.status === "live" && (
            <button onClick={handleEndEvent} disabled={ending} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "rgba(248,113,113,0.06)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              {ending ? "Closing Pipeline..." : "End Current Event"}
            </button>
          )}
        </div>

        {/* HOST LINKS */}
        {hostLink && (
          <div style={{ background: "rgba(212,175,55,0.06)", borderRadius: "18px", padding: "18px", marginBottom: "16px", border: "1px solid rgba(212,175,55,0.12)" }}>
            <p style={{ fontSize: "11px", color: "#D4AF37", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>★ Verified Host Credentials</p>
            <p style={{ fontSize: "12px", color: "#93c5fd", wordBreak: "break-all", marginBottom: "12px", fontFamily: "monospace" }}>{hostLink.replace("https://", "")}</p>
            <button onClick={() => copyLink(hostLink)} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Copy Host Key Link</button>
          </div>
        )}

        {event.status !== "draft" && event.status !== "ended" && (
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "18px", padding: "18px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>Registration Gateway Link</p>
            <p style={{ fontSize: "12px", color: "#93c5fd", wordBreak: "break-all", marginBottom: "12px", fontFamily: "monospace" }}>{registrationLink.replace("https://", "")}</p>
            <button onClick={() => copyLink(registrationLink)} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", color: "#f3f4f6", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Copy Registration Link</button>
          </div>
        )}

        {(event.status === "live" || event.status === "ended") && (
          <div style={{ background: "#111015", borderRadius: "16px", padding: "18px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#f1f0f5", margin: 0 }}>Gate Access Scanner</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0 }}>Check in inbound arrivals</p>
            </div>
            <button onClick={() => router.push("/dashboard/scanner/" + id)} style={{ padding: "12px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #221b0f, #13100b)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>Open Scanner →</button>
          </div>
        )}

        {/* REGISTRATION COUNTERS */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>Telemetry Metrics</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {card("Total Registrations", stats.registrations)}
            {card("Checked In", stats.checkins, "#D4AF37")}
          </div>
        </div>

        {/* NETWORKING METRICS */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>Aura Interaction Data</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {card("Active", stats.onAura, "#D4AF37")}
            {card("Handshakes", stats.handshakes, "#D4AF37")}
            {card("Unlocked", stats.unlocked, "#D4AF37")}
          </div>
        </div>

        {/* 2. NEW ZONE: SIMPLIFIED NETWORKING STATIONS SECTION (CENTERED STACK) */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>Physical Networking Stations</p>
          
          {/* Colorless repeating entry row form fields */}
          <form onSubmit={handleAddStation} style={{ display: "flex", flexWrap: "wrap", gap: "8px", background: "rgba(255,255,255,0.01)", padding: "12px", borderRadius: "12px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.03)" }}>
            <input value={stationName} onChange={e => setStationName(e.target.value)} placeholder="Station Name (e.g. Zone A)" style={{ flex: "1 1 180px", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", background: "#060608", color: "#fff", fontSize: "12px", outline: "none" }} required />
            <input value={stationSubtitle} onChange={e => setStationSubtitle(e.target.value)} placeholder="Subtitle Context (e.g. Fashion & Design)" style={{ flex: "2 1 240px", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", background: "#060608", color: "#fff", fontSize: "12px", outline: "none" }} />
            <button type="submit" disabled={savingStation} style={{ padding: "0 16px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", marginLeft: "auto" }}>
              {savingStation ? "Anchoring..." : "+ Anchor Station"}
            </button>
          </form>

          {/* Render Active Anchored Stations Without Hard Inner Borders */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {stations.map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px" }}>
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: "600", margin: "0 0 2px 0", color: "#f3f4f6" }}>{s.name}</h4>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: 0 }}>{s.subtitle || "Ambient Location Matrix"}</p>
                </div>
                <button onClick={() => handleDeleteStation(s.id)} style={{ background: "transparent", border: "none", color: "rgba(248,113,113,0.45)", fontSize: "11px", cursor: "pointer" }}>Remove</button>
              </div>
            ))}
            {stations.length === 0 && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: "4px 0 0 0" }}>No physical routing zones mapped into this venue layout yet.</p>}
          </div>
        </div>

        {/* TICKET TYPES MANAGEMENT */}
        <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, flex: 1 }}>Ticket Access Tiers</p>
            <button onClick={() => setShowAddTicket(!showAddTicket)} style={{ padding: "6px 14px", borderRadius: "8px", background: "rgba(212,175,55,0.08)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
              {showAddTicket ? "Cancel" : "+ Add"}
            </button>
          </div>

          {showAddTicket && (
            <div style={{ background: "#0d0c10", borderRadius: "14px", padding: "16px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <input value={ticketName} onChange={e => setTicketName(e.target.value)} placeholder="Ticket name" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f3f4f6", fontSize: "13px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} />
              <input value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} placeholder="Price in KES (0 for free)" type="number" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f3f4f6", fontSize: "13px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} />
              <input value={ticketQty} onChange={e => setTicketQty(e.target.value)} placeholder="Quantity (empty = unlimited)" type="number" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f3f4f6", fontSize: "13px", outline: "none", marginBottom: "14px", boxSizing: "border-box" }} />
              <button onClick={handleAddTicket} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "linear-gradient(135deg, #221b0f, #13100b)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
                Save Tier
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            {ticketTypes.map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "500", color: "#f3f4f6", margin: "0 0 2px 0" }}>{t.name}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0 }}>{t.quantity ? `Quantity: ${t.quantity}` : "Unlimited Available"}</p>
                </div>
                <p style={{ fontSize: "14px", color: "#D4AF37", fontWeight: "600", margin: 0 }}>{t.price > 0 ? "KES " + t.price.toLocaleString() : "Free Access"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RECRUITMENT PUBLISH DRAWER */}
        {event.status === "draft" && (
          <div style={{ background: "#111015", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(212,175,55,0.2)" }}>
            <button onClick={handlePublish} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "linear-gradient(135deg, #221b0f, #13100b)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.35)", fontSize: "14px", fontWeight: "700", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>Publish Activation</button>
          </div>
        )}

        {/* EXPORT WORKSPACE */}
        {/* TICKETS & REVENUE HUB NAVIGATION ACCESS */}
        <button 
          onClick={() => router.push(`/dashboard/events/${id}/tickets`)}
          style={{ 
            width: "100%", 
            padding: "16px", 
            background: "rgba(212, 175, 55, 0.03)", 
            border: "1px solid rgba(212, 175, 55, 0.2)", 
            borderRadius: "14px", 
            color: "#D4AF37", 
            fontWeight: "600", 
            fontSize: "13px", 
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer", 
            marginTop: "12px",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "8px" 
          }}
        >
          🎫 Tickets & Revenue Hub →
        </button>

      </div>
    </div>
  );
}
