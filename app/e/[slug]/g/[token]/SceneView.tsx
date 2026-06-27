"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import QRCode from "qrcode";
import SceneTab from "./tabs/SceneTab";
import NetworkingTab from "./tabs/NetworkingTab";
import TicketTab from "./tabs/TicketTab";
import ProfileTab from "./tabs/ProfileTab";

type Tab = "scene" | "networking" | "ticket" | "profile";

interface SceneViewProps {
  event: any;
  registration: any;
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

export default function SceneView({ event, registration, profile, onProfileUpdate }: SceneViewProps) {
  const [tab, setTab] = useState<Tab>("scene");
  const [editing, setEditing] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [networkingCount, setNetworkingCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [fiveMin, setFiveMin] = useState(false);
  const [eventStatus, setEventStatus] = useState(event?.status || "");
  const [pendingCount, setPendingCount] = useState(0);
  const [entryQR, setEntryQR] = useState("");
  const [networkingQR, setNetworkingQR] = useState("");
  const [qrError, setQrError] = useState(false);

  const isLive = eventStatus === "live";
  const isEnded = eventStatus === "ended";

  const nav = [
    { id: "scene", l: "Scene", e: "✦" },
    { id: "networking", l: "Networking", e: "◎" },
    { id: "ticket", l: "Ticket", e: "🎟" },
    { id: "profile", l: "Profile", e: "◐", badge: pendingCount },
  ];

  // Pending count for nav badge
  useEffect(() => {
    if (!profile || !event) return;
    async function loadPendingCount() {
      const { count } = await supabase.from("handshake_requests").select("*", { count: "exact", head: true }).eq("recipient_id", profile.id).eq("event_id", event.id).eq("status", "pending").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      setPendingCount(count || 0);
    }
    loadPendingCount();
    const ch = supabase.channel("nav-pending:" + profile.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "handshake_requests" }, (payload: any) => {
        if (payload.new?.recipient_id === profile.id || payload.old?.recipient_id === profile.id) loadPendingCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, event]);

  // QR generation with 60s rotation
  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    async function genQRs() {
      const res = await fetch("/api/qr/generate?reg_id=" + registration.id).catch(() => null);
      if (cancelled) return;
      if (res?.ok) {
        const { entryPayload, unlockPayload } = await res.json();
        if (cancelled) return;
        setQrError(false);
        if (!entryQR) QRCode.toDataURL(entryPayload, { errorCorrectionLevel: "H", margin: 2, width: 256 }).then(d => !cancelled && setEntryQR(d)).catch(console.error);
        QRCode.toDataURL(unlockPayload, { errorCorrectionLevel: "H", margin: 2, width: 256 }).then(d => !cancelled && setNetworkingQR(d)).catch(console.error);
      } else {
        setQrError(true);
      }
    }
    genQRs();
    const interval = setInterval(genQRs, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [registration]);

  // Event status + countdown
  useEffect(() => {
    if (!event) return;
    setEventStatus(event.status);
    supabase.from("events").select("status").eq("id", event.id).single().then(({ data }) => { if (data) setEventStatus(data.status); });
    const evCh = supabase.channel("event-status:" + event.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter: "id=eq." + event.id }, (p) => { setEventStatus(p.new.status); })
      .subscribe();
    const tick = setInterval(() => {
      const n = new Date();
      const s = new Date(event.start_time);
      const e2 = new Date(event.end_time);
      const diff = s.getTime() - n.getTime();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
      if (e2.getTime() - n.getTime() < 300000) setFiveMin(true);
    }, 1000);
    return () => { clearInterval(tick); supabase.removeChannel(evCh); };
  }, [event]);

  // Live counts
  useEffect(() => {
    if (!event) return;
    async function fetchCounts() {
      const { data: eventGuests, count: nc } = await supabase.from("guest_profiles").select("id", { count: "exact" }).eq("event_id", event.id).eq("aura_active", true);
      setNetworkingCount(nc || 0);
      const { data: allEventGuestIds } = await supabase.from("guest_profiles").select("id").eq("event_id", event.id);
      const ids = (allEventGuestIds || []).map((g: any) => g.id);
      if (ids.length === 0) { setConnectionsCount(0); return; }
      const { count: cc } = await supabase.from("handshakes").select("*", { count: "exact", head: true }).or(`sender_id.in.(${ids.join(",")}),receiver_id.in.(${ids.join(",")})`);
      setConnectionsCount(cc || 0);
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    const hsCh = supabase.channel("handshakes-count:" + event.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "handshakes" }, () => fetchCounts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "guest_profiles", filter: "event_id=eq." + event.id }, () => fetchCounts())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(hsCh); };
  }, [event]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg,#0a0a0c 0%,#0f0d14 40%,#0a0a0c 100%)", paddingBottom: "100px", fontFamily: "var(--font-inter),-apple-system,sans-serif" }}>
      <style>{`
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.7)}50%{box-shadow:0 0 0 8px rgba(74,222,128,0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {fiveMin && (
        <div style={{ background: "#E26D34", padding: "12px 20px", textAlign: "center" }}>
          <p style={{ color: "#000", fontSize: "13px", fontWeight: "500", margin: 0 }}>⏱ Event ends in 5 minutes</p>
        </div>
      )}

      {tab === "scene" && (
        <SceneTab
          event={event}
          isLive={isLive}
          isEnded={isEnded}
          countdown={countdown}
          networkingCount={networkingCount}
          connectionsCount={connectionsCount}
          onGoNetworking={() => setTab("networking")}
          onViewConnections={() => setTab("profile")}
        />
      )}

      {tab === "networking" && (
        <NetworkingTab
          event={event}
          profile={profile}
          isLive={isLive}
          isEnded={isEnded}
          registration={registration}
        />
      )}

      {tab === "ticket" && (
        <TicketTab
          event={event}
          entryQR={entryQR}
          networkingQR={networkingQR}
          qrError={qrError}
        />
      )}

      {tab === "profile" && (
        <ProfileTab
          profile={profile}
          event={event}
          onProfileUpdate={onProfileUpdate}
          isEnded={isEnded}
          registration={registration}
        />
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: "8px", left: "8px", right: "8px", background: "rgba(15,15,19,0.92)", backdropFilter: "blur(32px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", padding: "8px 4px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 40 }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id as Tab); setEditing(false); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: tab === item.id ? "rgba(226,109,52,0.1)" : "none", border: "none", cursor: "pointer", padding: "8px 4px", borderRadius: "12px", transition: "all 0.15s ease", boxShadow: tab === item.id ? "inset 0 0 0 1px rgba(226,109,52,0.15)" : "none", position: "relative" }}>
            <span style={{ fontSize: "16px", opacity: tab === item.id ? 1 : 0.35, transform: tab === item.id ? "scale(1.1)" : "scale(1)", transition: "all 0.2s", position: "relative" }}>
              {item.e}
              {!!item.badge && item.badge > 0 && (
                <span style={{ position: "absolute", top: "-6px", right: "-10px", background: "#E26D34", color: "#000", fontSize: "9px", fontWeight: "700", borderRadius: "9px", minWidth: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", lineHeight: 1 }}>
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </span>
            <span style={{ fontSize: "11px", color: tab === item.id ? "#E26D34" : "#999", fontWeight: tab === item.id ? "600" : "400", letterSpacing: "0.02em" }}>{item.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
