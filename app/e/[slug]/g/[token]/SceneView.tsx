"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import QRCode from "qrcode";
import SceneTab from "./tabs/SceneTab";
import NetworkingTab from "./tabs/NetworkingTab";
import TicketTab from "./tabs/TicketTab";
import ProfileTab from "./tabs/ProfileTab";
import ConnectionsTab from "./tabs/ConnectionsTab";
import { usePendingCount, useIntroductions } from "./tabs/queries";

type Tab = "scene" | "networking" | "ticket" | "connections" | "profile";

interface SceneViewProps {
  event: any;
  registration: any;
  profile: any;
  masterProfile: any;
  onProfileUpdate: (profile: any) => void;
  onMasterProfileUpdate: (masterProfile: any) => void;
}

export default function SceneView({ event, registration, profile, masterProfile, onProfileUpdate, onMasterProfileUpdate }: SceneViewProps) {
  const [tab, setTab] = useState<Tab>("scene");
  const [editing, setEditing] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [networkingCount, setNetworkingCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [qrScanCount, setQrScanCount] = useState(0);
  const [fiveMin, setFiveMin] = useState(false);
  const [eventStatus, setEventStatus] = useState(event?.status || "");
  const [entryQR, setEntryQR] = useState("");
  const [networkingQR, setNetworkingQR] = useState("");
  const [qrError, setQrError] = useState(false);

  // Cached pending count for nav badge — no manual effect needed
  const { data: pendingCount = 0 } = usePendingCount(profile?.id, event?.id);
  const { data: introductions = [] } = useIntroductions(profile?.id, event?.id);
  const connectionsBadge = pendingCount + (introductions as any[]).length;

  const isLive = eventStatus === "live";
  const isEnded = eventStatus === "ended";

  const nav = [
    { id: "scene", l: "Scene", e: "✦" },
    { id: "networking", l: "Networking", e: "◎" },
    { id: "ticket", l: "Ticket", e: "◈" },
    { id: "connections", l: "Connects", e: "⬡", badge: connectionsBadge },
    { id: "profile", l: "Profile", e: "◐" },
  ];

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
      // Was previously `< 300000` with no lower bound — once end_time passed,
      // the diff went negative and stayed under 300000 forever, so this
      // banner never turned itself off after an event ended. Bounding it to
      // (0, 300000) means it's only true in the actual final 5 minutes.
      const msToEnd = e2.getTime() - n.getTime();
      setFiveMin(msToEnd > 0 && msToEnd < 300000);
    }, 1000);
    return () => { clearInterval(tick); supabase.removeChannel(evCh); };
  }, [event]);

  // Live counts
  useEffect(() => {
    if (!event) return;
    async function fetchCounts() {
      const { data: eventGuests, count: nc } = await supabase.from("guest_profiles").select("id", { count: "exact" }).eq("event_id", event.id).eq("networking_visible", true);
      setNetworkingCount(nc || 0);
      const { data: allEventGuestIds } = await supabase.from("guest_profiles").select("id").eq("event_id", event.id);
      const ids = (allEventGuestIds || []).map((g: any) => g.id);
      setAttendeeCount(ids.length);
      if (ids.length === 0) { setConnectionsCount(0); setQrScanCount(0); return; }
      const { count: cc } = await supabase.from("handshakes").select("*", { count: "exact", head: true }).or(`sender_id.in.(${ids.join(",")}),receiver_id.in.(${ids.join(",")})`);
      setConnectionsCount(cc || 0);
      // profile_unlocks writes two rows per scan (one per side of the mutual
      // unlock), so distinct handshake_id is the actual scan count, not row count.
      const { data: unlockRows } = await supabase.from("profile_unlocks").select("handshake_id").eq("event_id", event.id);
      const distinctScans = new Set((unlockRows || []).map((r: any) => r.handshake_id));
      setQrScanCount(distinctScans.size);
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    const hsCh = supabase.channel("handshakes-count:" + event.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "handshakes" }, () => fetchCounts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "guest_profiles", filter: "event_id=eq." + event.id }, () => fetchCounts())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "guest_profiles", filter: "event_id=eq." + event.id }, () => fetchCounts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profile_unlocks", filter: "event_id=eq." + event.id }, () => fetchCounts())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(hsCh); };
  }, [event]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg,#0a0a0c 0%,#0f0d14 40%,#0a0a0c 100%)", paddingBottom: "calc(80px + env(safe-area-inset-bottom))", fontFamily: "var(--font-inter),-apple-system,sans-serif" }}>
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
          attendeeCount={attendeeCount}
          qrScanCount={qrScanCount}
          masterProfile={masterProfile}
          onGoNetworking={() => setTab("networking")}
          onViewConnections={() => setTab("connections")}
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
          registration={registration}
          entryQR={entryQR}
          networkingQR={networkingQR}
          qrError={qrError}
          isEnded={isEnded}
          onGoToScene={() => setTab("scene")}
          onGoToConnections={() => setTab("connections")}
        />
      )}

      {tab === "connections" && (
        <ConnectionsTab
          profile={profile}
          event={event}
          registration={registration}
          isEnded={isEnded}
        />
      )}

      {tab === "profile" && (
        <ProfileTab
          profile={profile}
	  masterProfile={masterProfile}
          event={event}
          onProfileUpdate={onProfileUpdate}
          onMasterProfileUpdate={onMasterProfileUpdate}
          isEnded={isEnded}
          registration={registration}
        />
      )}

      {/* ── Bottom Navigation ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(8,8,10,0.96)",
        backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        zIndex: 40,
      }}>
        <div style={{ display: "flex", padding: "0 4px", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
          {nav.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id}
                onClick={() => { setTab(item.id as Tab); setEditing(false); }}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: "10px 4px 6px", position: "relative", outline: "none" }}>
                {/* Active — slim ember line at very top */}
                <div style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: active ? "22px" : "0px", height: "2px",
                  background: "#E26D34", borderRadius: "0 0 2px 2px",
                  transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
                }} />
                {/* Icon */}
                <span style={{ fontSize: "17px", lineHeight: 1, opacity: active ? 1 : 0.28, transform: active ? "translateY(-1px)" : "none", transition: "all 0.2s", position: "relative" }}>
                  {item.e}
                  {!!item.badge && item.badge > 0 && (
                    <span style={{ position: "absolute", top: "-5px", right: "-8px", background: "#E26D34", color: "#000", fontSize: "8px", fontWeight: "800", borderRadius: "8px", minWidth: "14px", height: "14px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                {/* Label */}
                <span style={{ fontSize: "10px", color: active ? "#f0ede8" : "rgba(255,255,255,0.28)", fontWeight: active ? "600" : "400", letterSpacing: "0.03em", transition: "all 0.2s" }}>{item.l}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
