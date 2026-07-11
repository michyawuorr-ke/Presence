"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { getFirstName, cleanUrl } from "./shared";
import {
  useConnections,
  usePendingRequests,
  useSavedNotes,
  useIncomingSignals,
  useEventStations,
  useInvalidators,
} from "./queries";

interface ConnectionsTabProps {
  profile: any;
  event: any;
  registration: any;
  isEnded: boolean;
}

export default function ConnectionsTab({ profile, event, registration, isEnded }: ConnectionsTabProps) {
  const [scanning, setScanning] = useState(false);
  const [scanTarget, setScanTarget] = useState<any>(null); // null = general "scan anyone" mode
  const scannerRef = useRef<any>(null);
  const [signalTarget, setSignalTarget] = useState<any>(null);
  const [signalStationId, setSignalStationId] = useState("");
  const [signalCustomLocation, setSignalCustomLocation] = useState("");
  const [signalSentIds, setSignalSentIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const [memoryTarget, setMemoryTarget] = useState<any>(null);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [memorySaving, setMemorySaving] = useState(false);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  // ── Cached queries ─────────────────────────────────────────────────────────
  const { data: connections = [] } = useConnections(profile?.id);
  const { data: pendingRequests = [] } = usePendingRequests(profile?.id, event?.id);
  const { data: savedNotes = {} } = useSavedNotes(profile?.id);
  const { data: incomingSignals = [] } = useIncomingSignals(profile?.id, event?.id);
  const { data: eventStations = [] } = useEventStations(event?.id);
  const invalidate = useInvalidators(profile?.id, event?.id);

  // Derive unlocked set from connections (every handshake = unlocked)
  const unlockedSet = new Set(connections.map((c: any) => c.id));

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  async function respondToPending(requestId: string, requesterId: string, approve: boolean, name: string) {
    const { error: updateErr } = await supabase.from("handshake_requests").update({ status: approve ? "approved" : "declined" }).eq("id", requestId);
    if (updateErr) { showToast("❌ " + updateErr.message, 5000); return; }
    if (approve) {
      const { error: hsErr } = await supabase.from("handshakes").insert({ sender_id: requesterId, receiver_id: profile.id, status: "accepted" });
      if (hsErr) { showToast("❌ " + hsErr.message, 5000); }
      else showToast(`Connected with ${getFirstName(name)}`);
    } else {
      showToast(`Declined ${getFirstName(name)}`);
    }
    invalidate.invalidatePending();
    invalidate.invalidateConnections();
  }

  async function dismissSignal(signalId: string) {
    await supabase.from("meetup_signals").update({ status: "acknowledged" }).eq("id", signalId);
    invalidate.invalidateSignals();
  }

  async function sendSignalMeetup() {
    if (!signalTarget || !profile || !event) return;
    if (!signalStationId && !signalCustomLocation.trim()) return;
    await supabase.from("meetup_signals").insert({ event_id: event.id, sender_id: profile.id, recipient_id: signalTarget.id, station_id: signalStationId || null, custom_location: signalStationId ? null : signalCustomLocation.trim(), status: "pending" });
    setSignalSentIds(prev => new Set(prev).add(signalTarget.id));
    showToast(`Meetup signal sent to ${getFirstName(signalTarget.display_name)}`);
    setSignalTarget(null); setSignalStationId(""); setSignalCustomLocation("");
  }

  async function saveMemoryNote() {
    if (!memoryTarget || !profile) return;
    setMemorySaving(true);
    await supabase.from("connection_notes").upsert({ handshake_id: memoryTarget.handshakeId, author_id: profile.id, about_id: memoryTarget.id, note: memoryDraft, updated_at: new Date().toISOString() }, { onConflict: "handshake_id,author_id,about_id" });
    invalidate.invalidateNotes();
    setMemorySaving(false);
    setMemoryTarget(null);
  }

  async function startScan(conn: any | null) {
    setScanTarget(conn); setScanning(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 200, height: 200 } }, async (decoded: string) => {
        if (decoded.startsWith("presence:unlock:")) {
          try { await scanner.stop(); } catch (_) { }
          setScanning(false);
          const res = await fetch("/api/handshakes/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scanner_registration_id: registration.id, target_registration_id: decoded }) });
          const body = await res.json().catch(() => ({}));
          if (res.ok) {
            const unlockedProfile = body.profile ?? conn;
            if (unlockedProfile?.id) setUnlocked(prev => new Set([...prev, unlockedProfile.id]));
            setScanTarget(null);
            showToast(body.already ? `You're already connected with ${getFirstName(unlockedProfile?.display_name || "them")}` : `Connected with ${getFirstName(unlockedProfile?.display_name || "them")}!`);
            if (unlockedProfile) { setMemoryTarget(unlockedProfile); setMemoryDraft(""); }
            invalidate.invalidateConnections();
          } else {
            showToast("❌ " + (body.error || "Could not scan that code."), 5000);
          }
        }
      }, () => { });
    } catch (err: any) {
      setScanning(false);
      showToast("Camera not available — check permissions.", 5000);
    }
  }

  function stopScan() { scannerRef.current?.stop().catch(() => { }); setScanning(false); setScanTarget(null); }

  return (
    <div style={{ padding: "16px", background: "#08080a", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 16px" }}>
        <p style={{ fontSize: "18px", fontWeight: "700", color: "#f0ede8", margin: 0 }}>Connections</p>
        <button onClick={() => startScan(null)} style={{ background: "rgba(226,109,52,0.15)", color: "#E26D34", border: "1px solid rgba(226,109,52,0.3)", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Scan to Connect</button>
      </div>

      {toast && <div style={{ background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "12px", padding: "10px 14px", marginBottom: "12px" }}><p style={{ color: "#E26D34", fontSize: "12px", margin: 0, textAlign: "center" }}>{toast}</p></div>}

      {/* Incoming meetup signals */}
      {incomingSignals.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: "#E26D34", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Meetup Signals</p>
          {incomingSignals.map((s: any) => (
            <div key={s.id} style={{ background: "rgba(226,109,52,0.06)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "14px", padding: "14px", marginBottom: "8px" }}>
              <p style={{ fontSize: "13px", color: "#f1f0f5", margin: 0 }}><span style={{ fontWeight: "600" }}>{s.senderName}</span> wants to meet at <span style={{ color: "#E26D34", fontWeight: "600" }}>{s.locationLabel}</span></p>
              <button onClick={() => dismissSignal(s.id)} style={{ marginTop: "8px", fontSize: "11px", fontWeight: "600", color: "#E26D34", background: "transparent", border: "1px solid rgba(226,109,52,0.3)", borderRadius: "8px", padding: "5px 10px", cursor: "pointer" }}>Got it</button>
            </div>
          ))}
        </div>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: "#E26D34", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Wants To Connect</p>
          {(pendingRequests as any[]).map((r: any) => (
            <div key={r.requestId} style={{ background: "rgba(226,109,52,0.06)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#f1f0f5", margin: 0 }}>{r.display_name}</p>
                {r.role_title && <p style={{ fontSize: "12px", color: "#888", margin: "2px 0 0" }}>{r.role_title}</p>}
                {r.reason && <span style={{ display: "inline-block", fontSize: "10px", color: "#E26D34", background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "5px", padding: "2px 7px", fontWeight: "600", marginTop: "6px" }}>{r.reason}</span>}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => respondToPending(r.requestId, r.id, false, r.display_name)} style={{ fontSize: "11px", color: "rgba(240,237,232,0.5)", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}>Decline</button>
                <button onClick={() => respondToPending(r.requestId, r.id, true, r.display_name)} style={{ fontSize: "11px", fontWeight: "600", color: "#000", background: "#E26D34", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}>Accept</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connections */}
      <div>
        <p style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Connections</p>
        {connections.length === 0 ? (
          <p style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>{isEnded ? "No connections from this event" : "Connect with people to see them here"}</p>
        ) : (
          (connections as any[]).map((c: any) => {
            const isUnlocked = unlockedSet.has(c.id) || unlocked.has(c.id);
            const signalSent = signalSentIds.has(c.id);
            const hasNote = !!(savedNotes as any)[c.id];
            return (
              <div key={c.id} style={{ background: isUnlocked ? "rgba(226,109,52,0.08)" : "rgba(26,26,36,0.9)", borderRadius: "14px", padding: "14px", marginBottom: "8px", border: isUnlocked ? "1px solid rgba(226,109,52,0.25)" : "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "1px", color: "#f1f0f5" }}>{c.display_name}</p>
                    {c.role_title && <p style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>{c.role_title}</p>}
                    {isUnlocked && c.organisation && <p style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>{c.organisation}</p>}
                    {isUnlocked && (
                      <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {c.show_linkedin && c.linkedin_url && (
                          <p style={{ fontSize: "13px", color: "#E26D34", margin: 0 }}>
                            LinkedIn · {cleanUrl(c.linkedin_url)}
                          </p>
                        )}
                        {c.show_website && c.website_url && (
                          <p style={{ fontSize: "13px", color: "#E26D34", margin: 0 }}>
                            Website · {cleanUrl(c.website_url)}
                          </p>
                        )}
                        {c.show_portfolio && c.portfolio_url && (
                          <p style={{ fontSize: "13px", color: "#E26D34", margin: 0 }}>
                            Portfolio · {cleanUrl(c.portfolio_url)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {!isUnlocked && <button onClick={() => startScan(c)} style={{ background: "rgba(226,109,52,0.15)", color: "#E26D34", border: "1px solid rgba(226,109,52,0.15)", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", marginLeft: "8px" }}>Scan to unlock</button>}
                  {isUnlocked && <span style={{ fontSize: "10px", color: "#E26D34", fontWeight: "600", marginLeft: "8px", background: "rgba(226,109,52,0.12)", padding: "2px 8px", borderRadius: "6px" }}>✓ Unlocked</span>}
                </div>
                {isUnlocked && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <button onClick={() => setSignalTarget(c)} disabled={signalSent} style={{ flex: 1, padding: "8px", borderRadius: "8px", background: signalSent ? "rgba(255,255,255,0.03)" : "transparent", border: signalSent ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(226,109,52,0.3)", color: signalSent ? "rgba(240,237,232,0.3)" : "#E26D34", fontSize: "12px", fontWeight: "600", cursor: signalSent ? "default" : "pointer" }}>{signalSent ? "Meetup signal sent" : "Signal Meetup →"}</button>
                    <button onClick={() => { setMemoryTarget(c); setMemoryDraft((savedNotes as any)[c.id] || ""); }} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: hasNote ? "#E26D34" : "rgba(240,237,232,0.4)", fontSize: "12px", cursor: "pointer" }}>{hasNote ? "📝 Note" : "+ Note"}</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Signal meetup sheet */}
      {signalTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={() => setSignalTarget(null)}>
          <div style={{ background: "#0c0c0f", borderRadius: "24px 24px 0 0", padding: "24px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)" }} onClick={e => e.stopPropagation()}>
            <p style={{ color: "#fff", fontSize: "17px", fontWeight: "500", marginBottom: "4px" }}>Where should you meet {getFirstName(signalTarget.display_name)}?</p>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>Pick a station or write your own spot</p>
            {(eventStations as any[]).length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>{(eventStations as any[]).map((s: any) => <button key={s.id} onClick={() => { setSignalStationId(s.id); setSignalCustomLocation(""); }} style={{ textAlign: "left", padding: "10px 12px", borderRadius: "8px", background: signalStationId === s.id ? "rgba(226,109,52,0.1)" : "rgba(255,255,255,0.02)", border: signalStationId === s.id ? "1px solid rgba(226,109,52,0.4)" : "1px solid rgba(255,255,255,0.06)", color: signalStationId === s.id ? "#E26D34" : "#ccc", fontSize: "13px", cursor: "pointer" }}>{s.name}</button>)}</div>}
            <input value={signalCustomLocation} onChange={e => { setSignalCustomLocation(e.target.value); if (e.target.value) setSignalStationId(""); }} placeholder="Or type your own meetup spot" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "#fff", fontSize: "13px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setSignalTarget(null)} style={{ flex: 1, padding: "11px", borderRadius: "10px", background: "transparent", color: "rgba(240,237,232,0.5)", border: "1px solid rgba(240,237,232,0.15)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button onClick={sendSignalMeetup} disabled={!signalStationId && !signalCustomLocation.trim()} style={{ flex: 2, padding: "11px", borderRadius: "10px", background: "transparent", color: (!signalStationId && !signalCustomLocation.trim()) ? "rgba(240,237,232,0.2)" : "#E26D34", border: "1px solid rgba(226,109,52,0.4)", fontSize: "13px", cursor: (!signalStationId && !signalCustomLocation.trim()) ? "default" : "pointer", fontWeight: "500" }}>Send Signal →</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner */}
      {scanning && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <p style={{ color: "#fff", fontSize: "14px", marginBottom: "4px", fontWeight: "500" }}>{scanTarget ? `Scanning for ${scanTarget.display_name}'s Networking QR` : "Scan their Networking QR to connect"}</p>
          <p style={{ color: "#888", fontSize: "12px", marginBottom: "20px" }}>Point your camera at their QR code</p>
          <div id="qr-reader" style={{ width: "260px", height: "260px", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }} />
          <button onClick={stopScan} style={{ marginTop: "28px", padding: "11px 28px", borderRadius: "50px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      {/* Memory note */}
      {memoryTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={() => setMemoryTarget(null)}>
          <div style={{ background: "linear-gradient(165deg,#F5EFE3,#EDE4D3)", borderRadius: "24px 24px 0 0", padding: "28px 24px", width: "100%", boxShadow: "0 -20px 60px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <p style={{ fontSize: "10px", color: "#8a7355", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "700", margin: 0 }}>Private Note</p>
              <button onClick={() => setMemoryTarget(null)} style={{ background: "none", border: "none", color: "#8a7355", fontSize: "13px", cursor: "pointer", padding: 0 }}>✕</button>
            </div>
            <p style={{ fontSize: "19px", fontWeight: "600", color: "#2a2118", margin: "6px 0 2px", fontFamily: "Georgia, serif" }}>{memoryTarget.display_name}</p>
            <p style={{ fontSize: "12px", color: "#8a7355", margin: "0 0 20px" }}>{event?.title}{event?.venue ? ` · ${event.venue}` : ""}</p>
            <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(138,115,85,0.15)" }}>
              <textarea value={memoryDraft} onChange={e => setMemoryDraft(e.target.value)} placeholder={"Where you met...\nWhat you talked about...\nFollow up..."} style={{ width: "100%", minHeight: "110px", background: "transparent", border: "none", outline: "none", resize: "none", color: "#2a2118", fontSize: "14px", lineHeight: "1.7", fontFamily: "Georgia, serif", boxSizing: "border-box" }} autoFocus />
            </div>
            <button onClick={saveMemoryNote} disabled={memorySaving} style={{ width: "100%", marginTop: "16px", padding: "13px", borderRadius: "12px", background: "#2a2118", color: "#F5EFE3", border: "none", fontSize: "13px", fontWeight: "600", cursor: memorySaving ? "default" : "pointer", opacity: memorySaving ? 0.6 : 1 }}>{memorySaving ? "Saving..." : "Save to memory"}</button>
            <button onClick={() => setMemoryTarget(null)} style={{ width: "100%", marginTop: "8px", padding: "10px", background: "transparent", border: "none", color: "#8a7355", fontSize: "12px", cursor: "pointer" }}>Skip for now</button>
          </div>
        </div>
      )}
    </div>
  );
}
