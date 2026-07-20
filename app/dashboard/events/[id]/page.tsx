"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import OverviewTab from "./tabs/OverviewTab";
import AttendeesTab from "./tabs/AttendeesTab";
import SetupTab from "./tabs/SetupTab";
import SettingsTab from "./tabs/SettingsTab";

type Tab = "overview" | "attendees" | "setup" | "settings";

const GOLD = "#D4AF37";

export default function EventDashboardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [tab, setTab] = useState<Tab>((searchParams?.get("tab") as Tab) ?? "overview");
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [stats, setStats] = useState({ registrations: 0, confirmed: 0, checkins: 0, onAura: 0, handshakes: 0, revenue: 0 });
  const [hostLink, setHostLink] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [scannerLink, setScannerLink] = useState("");
  const [scannerToken, setScannerToken] = useState("");
  const [timeToLive, setTimeToLive] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [ending, setEnding] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  const load = useCallback(async () => {
    const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
    if (!ev) { router.push("/dashboard/events"); return; }
    setEvent(ev);
    setBannerUrl(ev.banner_url || "");

    const { data: tix } = await supabase.from("ticket_types").select("*").eq("event_id", id).order("created_at");
    setTicketTypes(tix || []);

    const { data: st } = await supabase.from("event_stations").select("*").eq("event_id", id).order("created_at");
    setStations(st || []);

    const { data: regs } = await supabase.from("registrations").select("status,paid,checked_in,amount").eq("event_id", id);
    const { data: hs } = await supabase.from("handshakes").select("id").eq("event_id", id);
    const { data: gp } = await supabase.from("guest_profiles").select("aura_active").eq("event_id", id);
    setStats({
      registrations: regs?.filter(r => r.status !== "host").length || 0,
      confirmed: regs?.filter(r => r.status === "confirmed").length || 0,
      checkins: regs?.filter(r => r.checked_in).length || 0,
      onAura: gp?.filter(g => g.aura_active).length || 0,
      handshakes: hs?.length || 0,
      revenue: regs?.reduce((s, r) => s + (r.paid ? (r.amount || 0) : 0), 0) || 0,
    });

    const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "");

    // Registration link (public — what you share for people to register)
    setRegistrationLink(`${origin}/register/${ev.slug}`);

    // Scanner link (for check-in staff)
    setScannerLink(`${origin}/dashboard/scanner/${ev.id}`);

    // Host link (host's personal access to the event scene)
    const { data: hostReg } = await supabase
      .from("registrations")
      .select("access_token")
      .eq("event_id", id)
      .eq("status", "host")
      .single();
    if (hostReg?.access_token) {
      setHostLink(`${origin}/e/${ev.slug}/g/${hostReg.access_token}`);
    }

    const { data: hp } = await supabase.from("host_profiles").select("*").limit(1).single();
    setHostProfile(hp);

    if (ev.start_time && ev.status === "scheduled") {
      const diff = new Date(ev.start_time).getTime() - Date.now();
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeToLive(h > 0 ? `${h}h ${m}m` : `${m}m`);
      }
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function handleGoLive() {
    await supabase.from("events").update({ status: "live" }).eq("id", id);
    // Ensure an event_policies row exists so networking policies are enforced.
    // Uses upsert so re-publishing doesn't overwrite any existing config.
    await supabase.from("event_policies").upsert(
      { event_id: id, networking_enabled: true, default_visibility: "visible", mutual_discovery: false, self_select_roles: ["attendee"] },
      { onConflict: "event_id", ignoreDuplicates: true }
    );
    load();
  }

  async function handleEndEvent() {
    if (!confirm("End this event? Guests will no longer be able to network.")) return;
    setEnding(true);
    await supabase.from("events").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
    setEnding(false);
    load();
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setBannerError("Image must be under 5MB"); return; }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) { setBannerError("Only JPEG, PNG, or WebP images allowed"); return; }
    setUploadingBanner(true); setBannerError("");
    try {
      const path = `banners/${id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("event-assets").upload(path, file, { upsert: true });
      if (upErr) { setBannerError(`Upload failed: ${upErr.message}`); setUploadingBanner(false); return; }
      const { data: urlData } = supabase.storage.from("event-assets").getPublicUrl(path);
      const { error: updateErr } = await supabase.from("events").update({ banner_url: urlData.publicUrl }).eq("id", id);
      if (updateErr) { setBannerError(`Saved image but couldn't update event: ${updateErr.message}`); }
      else { setBannerUrl(urlData.publicUrl); }
    } catch (err: any) {
      setBannerError("Upload failed — check your connection and try again");
    }
    setUploadingBanner(false);
  }

  const nav: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "attendees", label: "Attendees" },
    { id: "setup", label: "Setup" },
    { id: "settings", label: "Settings" },
  ];

  if (!event) {
    return (
      <div style={{ minHeight: "100vh", background: "#08080a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08080a", color: "#f0ede8", fontFamily: "Inter, sans-serif" }}>
      {/* Top bar */}
      <header style={{ position: "sticky", top: 0, background: "rgba(8,8,10,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)", zIndex: 30, padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px", maxWidth: "480px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <button onClick={() => router.push("/dashboard/events")} style={{ background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer", padding: "4px", flexShrink: 0 }}>←</button>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "#f0ede8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
          </div>
          {/* Host profile avatar */}
          <button onClick={() => setShowProfile(!showProfile)}
            style={{ width: "32px", height: "32px", borderRadius: "50%", background: `rgba(212,175,55,0.12)`, border: `1px solid rgba(212,175,55,0.25)`, color: GOLD, fontSize: "12px", fontWeight: "700", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hostProfile?.display_name?.[0]?.toUpperCase() || "H"}
          </button>
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", maxWidth: "480px", margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", borderBottom: tab === n.id ? `2px solid ${GOLD}` : "2px solid transparent", color: tab === n.id ? GOLD : "#555", fontSize: "11px", fontWeight: tab === n.id ? "700" : "500", cursor: "pointer", letterSpacing: "0.06em", transition: "all 0.2s" }}>
              {n.label}
              {n.id === "attendees" && pendingCount > 0 && (
                <span style={{ marginLeft: "4px", background: GOLD, color: "#000", borderRadius: "10px", fontSize: "9px", fontWeight: "800", padding: "1px 5px" }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Host profile slide-down */}
      {showProfile && (
        <div style={{ position: "fixed", top: "52px", right: "16px", background: "#111", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "14px", padding: "16px", zIndex: 40, minWidth: "200px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede8", margin: "0 0 2px" }}>{hostProfile?.display_name || "Host"}</p>
          <p style={{ fontSize: "11px", color: "#555", margin: "0 0 14px" }}>{hostProfile?.organisation || ""}</p>
          <button onClick={() => { router.push("/dashboard/profile"); setShowProfile(false); }}
            style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "transparent", border: `1px solid rgba(212,175,55,0.2)`, color: GOLD, fontSize: "11px", cursor: "pointer", marginBottom: "6px" }}>
            Edit Profile
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#555", fontSize: "11px", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      )}

      {/* Tab content */}
      <main style={{ padding: "20px 16px", maxWidth: "480px", margin: "0 auto" }}>
        {tab === "overview" && (
          <OverviewTab event={event} stats={stats} hostLink={hostLink}
            registrationLink={registrationLink} scannerLink={scannerLink}
            timeToLive={timeToLive} bannerUrl={bannerUrl}
            onBannerUpload={handleBannerUpload}
            uploadingBanner={uploadingBanner} bannerError={bannerError} />
        )}
        {tab === "attendees" && <AttendeesTab eventId={id} isLive={event.status === "live"} />}
        {tab === "setup" && (
          <SetupTab eventId={id} event={event} ticketTypes={ticketTypes} stations={stations}
            onGoLive={handleGoLive}
            onEndEvent={handleEndEvent}
            ending={ending}
            onTicketAdded={t => setTicketTypes(prev => [...prev, t])}
            onTicketDeleted={tid => setTicketTypes(prev => prev.filter(t => t.id !== tid))}
            onStationAdded={s => setStations(prev => [...prev, s])}
            onStationDeleted={sid => { supabase.from("event_stations").delete().eq("id", sid).then(() => setStations(prev => prev.filter(s => s.id !== sid))); }}
          />
        )}
        {tab === "settings" && <SettingsTab event={event} onEventUpdate={setEvent} />}
      </main>
    </div>
  );
}
