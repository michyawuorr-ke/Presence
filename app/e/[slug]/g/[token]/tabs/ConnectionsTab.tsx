"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { getFirstName, cleanUrl, toHref, toWhatsAppHref, parseIntents } from "./shared";
import { INTENT_MAP, intentReasonFromStoredIntent } from "@/lib/matching/intents";
import DisclosureSheet from "./DisclosureSheet";
import AcceptDisclosureSheet from "./AcceptDisclosureSheet";
import {
  useConnections, usePendingRequests, useSavedNotes, useIncomingSignals,
  useEventStations, useInvalidators, useIntroductions,
} from "./queries";
import { dualWriteConnectionRequest } from "@/lib/dualWriteConnection";

interface ConnectionsTabProps {
  profile: any;
  event: any;
  registration: any;
  isEnded: boolean;
}

const EMBER = "#E26D34";
const DUSK  = "#8A7355";

export default function ConnectionsTab({ profile, event, registration, isEnded }: ConnectionsTabProps) {
  const [scanning,             setScanning]             = useState(false);
  const [scanTarget,           setScanTarget]           = useState<any>(null);
  const scannerRef                                       = useRef<any>(null);
  const [signalTarget,         setSignalTarget]         = useState<any>(null);
  const [signalStationId,      setSignalStationId]      = useState("");
  const [signalCustomLocation, setSignalCustomLocation] = useState("");
  const [signalSentIds,        setSignalSentIds]        = useState<Set<string>>(new Set());
  const [toast,                setToast]                = useState("");
  const [memoryTarget,         setMemoryTarget]         = useState<any>(null);
  const [memoryDraft,          setMemoryDraft]          = useState("");
  const [memorySaving,         setMemorySaving]         = useState(false);
  const [unlocked,             setUnlocked]             = useState<Set<string>>(new Set());
  const [disclosureTarget,     setDisclosureTarget]     = useState<any>(null);
  const [acceptDisclosureTarget, setAcceptDisclosureTarget] = useState<any>(null);

  const { data: connections   = [] } = useConnections(profile?.id, event?.id);
  const { data: pendingRequests = [] } = usePendingRequests(profile?.id, event?.id);
  const { data: savedNotes    = {} } = useSavedNotes(profile?.id);
  const { data: incomingSignals = [] } = useIncomingSignals(profile?.id, event?.id);
  const { data: eventStations = [] } = useEventStations(event?.id);
  const { data: introductions = [] } = useIntroductions(profile?.id, event?.id);
  const invalidate = useInvalidators(profile?.id, event?.id);

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  // ── Respond to pending handshake requests ────────────────────────────────
  async function respondToPending(requestId: string, requesterId: string, approve: boolean, name: string) {
    const { error } = await supabase.from("handshake_requests")
      .update({ status: approve ? "approved" : "declined" })
      .eq("id", requestId);
    if (error) { showToast("❌ " + error.message, 5000); return; }
    if (approve) {
      const { error: hsError } = await supabase.from("handshakes")
        .insert({ sender_id: requesterId, receiver_id: profile.id, event_id: event.id, status: "accepted" });
      if (hsError) {
        // The request is now marked "approved" but the actual connection
        // row failed to write — this used to be silently discarded, which
        // meant the UI showed "Connected with X" and the request looked
        // accepted, but no handshakes row existed. Roll the request status
        // back to pending so it isn't left in an inconsistent state where
        // it can never be retried (an "approved" request doesn't show up
        // in the pending list anymore, so the guest would have no way to
        // try accepting again).
        await supabase.from("handshake_requests").update({ status: "pending" }).eq("id", requestId);
        showToast("❌ Couldn't complete the connection — please try again", 5000);
        invalidate.invalidatePending();
        return;
      }
      showToast(`Connected with ${getFirstName(name)}`);
      dualWriteConnectionRequest({
        accessToken: registration?.access_token,
        requesterGuestProfileId: profile.id,
        recipientGuestProfileId: requesterId,
        eventId: event.id,
        status: "connected",
      });
    } else {
      showToast(`Declined ${getFirstName(name)}`);
      dualWriteConnectionRequest({
        accessToken: registration?.access_token,
        requesterGuestProfileId: profile.id,
        recipientGuestProfileId: requesterId,
        eventId: event.id,
        status: "declined",
      });
    }
    invalidate.invalidatePending();
    invalidate.invalidateConnections();
  }

  // ── Signal meetup ─────────────────────────────────────────────────────────
  async function sendSignalMeetup() {
    if (!signalTarget || !profile || !event) return;
    if (!signalStationId && !signalCustomLocation.trim()) return;
    await supabase.from("meetup_signals").insert({
      event_id: event.id, sender_id: profile.id, recipient_id: signalTarget.id,
      station_id: signalStationId || null,
      custom_location: signalStationId ? null : signalCustomLocation.trim(),
      status: "pending",
    });
    setSignalSentIds(prev => new Set(prev).add(signalTarget.id));
    showToast(`Meetup signal sent to ${getFirstName(signalTarget.display_name)}`);
    setSignalTarget(null); setSignalStationId(""); setSignalCustomLocation("");
  }

  // ── Dismiss incoming meetup signal ────────────────────────────────────────
  async function dismissSignal(signalId: string) {
    await supabase.from("meetup_signals").update({ status: "acknowledged" }).eq("id", signalId);
    invalidate.invalidateSignals();
  }

  // ── Memory note ───────────────────────────────────────────────────────────
  async function saveMemoryNote() {
    if (!memoryTarget || !profile) return;
    setMemorySaving(true);
    await supabase.from("connection_notes").upsert({
      handshake_id: memoryTarget.handshakeId, author_id: profile.id,
      about_id: memoryTarget.id, note: memoryDraft,
      updated_at: new Date().toISOString(),
    }, { onConflict: "handshake_id,author_id,about_id" });
    invalidate.invalidateNotes();
    setMemorySaving(false);
    setMemoryTarget(null);
  }

  // ── QR Scanner ────────────────────────────────────────────────────────────
  async function startScan(conn: any | null) {
    setScanTarget(conn); setScanning(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 200, height: 200 } },
        async (decoded: string) => {
          if (!decoded.startsWith("presence:unlock:")) return;
          try { await scanner.stop(); } catch (_) { }
          setScanning(false);
          const res = await fetch("/api/handshakes/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scanner_registration_id: registration.id, scanner_access_token: registration.access_token, target_registration_id: decoded }),
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok) {
            const unlockedProfile = body.profile ?? conn;
            if (unlockedProfile?.id) setUnlocked(prev => new Set([...prev, unlockedProfile.id]));
            setScanTarget(null);
            invalidate.invalidateConnections();
            if (body.unlock_id && unlockedProfile) {
              setDisclosureTarget({ profile: unlockedProfile, unlockId: body.unlock_id });
            } else {
              showToast(body.already
                ? `Already connected with ${getFirstName(unlockedProfile?.display_name)}`
                : `Connected with ${getFirstName(unlockedProfile?.display_name)}!`);
            }
          } else {
            showToast("❌ " + (body.error || "Could not scan that code."), 5000);
          }
        }, () => {}
      );
    } catch {
      setScanning(false);
      showToast("Camera not available — check permissions.", 5000);
    }
  }

  function stopScan() {
    scannerRef.current?.stop().catch(() => {});
    setScanning(false); setScanTarget(null);
  }

  // ── Host introductions ────────────────────────────────────────────────────
  async function acknowledgeIntroduction(introId: string, isA: boolean) {
    await supabase.from("host_introductions").update({ [isA ? "status_a" : "status_b"]: "seen" }).eq("id", introId);
    invalidate.invalidateIntroductions();
  }

  async function connectFromIntro(introId: string, isA: boolean, otherId: string) {
    await supabase.from("handshake_requests").insert({
      event_id: event.id, requester_id: profile.id, recipient_id: otherId,
      reason: "Host introduction", status: "pending",
    });
    await supabase.from("host_introductions").update({ [isA ? "status_a" : "status_b"]: "connected" }).eq("id", introId);
    invalidate.invalidateIntroductions();
    showToast("Connection request sent");
    dualWriteConnectionRequest({
      accessToken: registration?.access_token,
      requesterGuestProfileId: profile.id,
      recipientGuestProfileId: otherId,
      eventId: event.id,
      status: "requested",
    });
  }

  return (
    <div style={{ padding: "16px", background: "#08080a", minHeight: "100vh" }}>

      {/* Toast */}
      {toast && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "10px 14px", marginBottom: "12px" }}>
          <p style={{ color: "#f0ede8", fontSize: "12px", margin: 0, textAlign: "center" }}>{toast}</p>
        </div>
      )}

      {/* Header + Scan CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 4px" }}>
        <p style={{ fontSize: "18px", fontWeight: "700", color: "#f0ede8", margin: 0 }}>
          {isEnded ? "Your Recap" : "Connections"}
        </p>
        {!isEnded && (
          <button onClick={() => startScan(null)}
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            Scan to Connect
          </button>
        )}
      </div>
      {isEnded && (
        <p style={{ fontSize: "13px", color: "rgba(240,237,232,0.4)", margin: "0 0 16px" }}>
          You made <span style={{ color: EMBER, fontWeight: "600" }}>{connections.length}</span> connection{connections.length === 1 ? "" : "s"} at {event?.title || "this event"}.
        </p>
      )}
      {!isEnded && <div style={{ marginBottom: "12px" }} />}

      {/* ── Host introductions ── */}
      {(introductions as any[]).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: DUSK, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Introductions from Host</p>
          {(introductions as any[]).map((intro: any) => {
            const other = intro.other;
            if (!other) return null;
            const firstName = getFirstName(other.display_name);
            const intents = parseIntents(other.networking_intents);
            return (
              <div key={intro.id} style={{ background: "rgba(138,115,85,0.06)", border: "1px solid rgba(138,115,85,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span>🛡</span>
                  <p style={{ fontSize: "11px", color: DUSK, fontWeight: "600", margin: 0 }}>The host thinks you should meet {firstName}</p>
                </div>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#f0ede8", margin: "0 0 2px" }}>{firstName}</p>
                {other.industry && <p style={{ fontSize: "11px", color: DUSK, margin: "0 0 8px", fontWeight: "500" }}>{other.industry}</p>}
                {intents.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "14px" }}>
                    {intents.map((id: string) => {
                      const intent = (INTENT_MAP as any)[id];
                      return intent ? (
                        <span key={id} style={{ fontSize: "10px", color: DUSK, background: "rgba(138,115,85,0.1)", border: "1px solid rgba(138,115,85,0.2)", borderRadius: "5px", padding: "2px 7px", fontWeight: "600" }}>{intent.label}</span>
                      ) : null;
                    })}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => acknowledgeIntroduction(intro.id, intro.isA)}
                    style={{ flex: 1, padding: "9px", borderRadius: "9px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer" }}>
                    Not now
                  </button>
                  <button onClick={() => connectFromIntro(intro.id, intro.isA, other.id)}
                    style={{ flex: 2, padding: "9px", borderRadius: "9px", background: "rgba(226,109,52,0.08)", border: `1px solid rgba(226,109,52,0.3)`, color: EMBER, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                    Connect with {firstName}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Incoming meetup signals ── */}
      {(incomingSignals as any[]).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: DUSK, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Meetup Signals</p>
          {(incomingSignals as any[]).map((s: any) => (
            <div key={s.id} style={{ background: "rgba(226,109,52,0.04)", border: "1px solid rgba(226,109,52,0.15)", borderRadius: "14px", padding: "14px", marginBottom: "8px" }}>
              <p style={{ fontSize: "13px", color: "#f1f0f5", margin: 0 }}>
                <span style={{ fontWeight: "600" }}>{s.senderName}</span> wants to meet at <span style={{ color: EMBER, fontWeight: "600" }}>{s.locationLabel}</span>
              </p>
              <button onClick={() => dismissSignal(s.id)}
                style={{ marginTop: "8px", fontSize: "11px", fontWeight: "500", color: "rgba(255,255,255,0.5)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "5px 10px", cursor: "pointer" }}>
                Got it
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Pending requests ── */}
      {(pendingRequests as any[]).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: DUSK, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Wants To Connect</p>
          {(pendingRequests as any[]).map((r: any) => (
            <div key={r.requestId} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ minWidth: 0 }}>
                {/* Level 1 reveal on pending request — first name only */}
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#f1f0f5", margin: "0 0 2px" }}>{getFirstName(r.display_name)}</p>
                {r.reason && (()=>{
                  // r.reason is the stored intent id (the recipient's own
                  // intent that the request responded to). Recompute the
                  // full sentence from the current viewer's own intents so
                  // it's never a leftover of the sender's perspective.
                  const myIntents = parseIntents(profile?.networking_intents);
                  const computed = intentReasonFromStoredIntent(r.reason, myIntents, getFirstName(r.display_name));
                  const label = computed ?? (INTENT_MAP as any)[r.reason]?.label ?? null;
                  return label ? (
                    <span style={{ display: "inline-block", fontSize: "10px", color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "5px", padding: "2px 7px", fontWeight: "500", marginTop: "4px" }}>
                      {label}
                    </span>
                  ) : null;
                })()}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => respondToPending(r.requestId, r.id, false, r.display_name)}
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}>
                  Decline
                </button>
                <button onClick={() => respondToPending(r.requestId, r.id, true, r.display_name)}
                  style={{ fontSize: "11px", fontWeight: "600", color: "#000", background: "#fff", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}>
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Connections list ── */}
      <div>
        <p style={{ fontSize: "10px", fontWeight: "600", color: DUSK, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Connections</p>
        {connections.length === 0 ? (
          <p style={{ color: "#444", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
            {isEnded ? "No connections from this event" : "Connect with people to see them here"}
          </p>
        ) : (connections as any[]).map((c: any) => {
          const isUnlocked = c.qrUnlocked || unlocked.has(c.id);
          const signalSent = signalSentIds.has(c.id);
          const hasNote    = !!(savedNotes as any)[c.id];
          const intents    = parseIntents(c.networking_intents);

          return (
            <div key={c.id} style={{ background: "rgba(26,26,36,0.9)", borderRadius: "14px", padding: "14px", marginBottom: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Level 2: full name + industry + intents */}
                  <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px", color: "#f1f0f5" }}>{c.display_name}</p>
                  {c.industry && <p style={{ fontSize: "11px", color: DUSK, margin: "0 0 6px", fontWeight: "500" }}>{c.industry}</p>}

                  {intents.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                      {intents.map((id: string) => {
                        const intent = (INTENT_MAP as any)[id];
                        return intent ? (
                          <span key={id} style={{ fontSize: "10px", color: DUSK, background: "rgba(138,115,85,0.1)", border: "1px solid rgba(138,115,85,0.2)", borderRadius: "5px", padding: "2px 7px", fontWeight: "600" }}>
                            {intent.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Level 3: after QR scan — role, org, links */}
                  {isUnlocked && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "10px", marginTop: "4px" }}>
                      {c.role_title && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>{c.role_title}</p>}
                      {c.organisation && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>{c.organisation}</p>}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {c.show_phone && c.phone_number && (
                          <a href={toWhatsAppHref(c.phone_number)} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "6px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ width: "18px", height: "18px", borderRadius: "5px", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0 }}>💬</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>WhatsApp {c.phone_number}</span>
                          </a>
                        )}
                        {c.show_linkedin && c.linkedin_url && (
                          <a href={toHref(c.linkedin_url)} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "6px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ width: "18px", height: "18px", borderRadius: "5px", background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: EMBER, flexShrink: 0 }}>in</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanUrl(c.linkedin_url)}</span>
                          </a>
                        )}
                        {c.show_website && c.website_url && (
                          <a href={toHref(c.website_url)} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "6px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ width: "18px", height: "18px", borderRadius: "5px", background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0 }}>🌐</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanUrl(c.website_url)}</span>
                          </a>
                        )}
                        {c.show_portfolio && c.portfolio_url && (
                          <a href={toHref(c.portfolio_url)} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "6px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ width: "18px", height: "18px", borderRadius: "5px", background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0 }}>✦</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanUrl(c.portfolio_url)}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0, marginLeft: "10px" }}>
                  {!isUnlocked && !isEnded && (
                    <button onClick={() => startScan(c)}
                      style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
                      Scan to unlock
                    </button>
                  )}
                  {isUnlocked && (
                    <span style={{ fontSize: "9px", color: DUSK, fontWeight: "600", background: "rgba(138,115,85,0.08)", border: "1px solid rgba(138,115,85,0.15)", padding: "3px 8px", borderRadius: "5px", letterSpacing: "0.08em" }}>
                      QR Unlocked
                    </span>
                  )}
                </div>
              </div>

              {/* Note — visible inline once saved, not just editable */}
              {hasNote && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "12px", paddingTop: "10px" }}>
                  <p style={{ fontSize: "12px", color: "rgba(240,237,232,0.55)", lineHeight: "1.5", margin: 0, whiteSpace: "pre-wrap" }}>
                    {(savedNotes as any)[c.id]}
                  </p>
                </div>
              )}

              {/* Post-event, request/accept connections (no scan) get an
                  explicit opt-in prompt instead of auto-revealing contact
                  details — accepting the request only means "we're
                  connected," not "here's my contact info." Only shows
                  once, until answered (share or skip both count). */}
              {isEnded && !isUnlocked && !c.acceptDisclosurePrompted && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "12px", paddingTop: "12px" }}>
                  <p style={{ fontSize: "12.5px", color: "rgba(240,237,232,0.6)", margin: "0 0 8px" }}>Share contact details with {getFirstName(c.display_name)}?</p>
                  <button onClick={() => setAcceptDisclosureTarget(c)}
                    style={{ width: "100%", padding: "10px", borderRadius: "9px", background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.3)", color: EMBER, fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}>
                    Choose what to share
                  </button>
                </div>
              )}

              {/* Actions — Signal Meetup before scan (live only), Note always */}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {!isUnlocked && !isEnded && (
                  <button onClick={() => setSignalTarget(c)} disabled={signalSent}
                    style={{
                      flex: 1, padding: "9px", borderRadius: "8px", fontSize: "12px", fontWeight: "600",
                      cursor: signalSent ? "default" : "pointer",
                      background: signalSent ? "rgba(255,255,255,0.02)" : "rgba(226,109,52,0.08)",
                      border: signalSent ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(226,109,52,0.3)",
                      color: signalSent ? "rgba(255,255,255,0.25)" : EMBER,
                      animation: !signalSent ? "pulseGlow 2.5s ease-in-out infinite" : "none",
                    }}>
                    {signalSent ? "Signal sent" : "Signal Meetup"}
                  </button>
                )}
                <button onClick={() => { setMemoryTarget(c); setMemoryDraft((savedNotes as any)[c.id] || ""); }}
                  style={{ flex: (isUnlocked || isEnded) ? 1 : 0, flexShrink: 0, padding: "9px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: hasNote ? DUSK : "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer" }}>
                  {hasNote ? "✎ Edit note" : "+ Note"}
                </button>
              </div>

              <style>{`@keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(226,109,52,0)} 50%{box-shadow:0 0 0 4px rgba(226,109,52,0.15)} }`}</style>
            </div>
          );
        })}
      </div>

      {/* ── Signal meetup sheet ── */}
      {signalTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={() => setSignalTarget(null)}>
          <div style={{ background: "#0c0c0f", borderRadius: "24px 24px 0 0", padding: "24px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)" }} onClick={e => e.stopPropagation()}>
            <p style={{ color: "#fff", fontSize: "17px", fontWeight: "500", marginBottom: "4px" }}>Where should you meet {getFirstName(signalTarget.display_name)}?</p>
            <p style={{ color: "#555", fontSize: "13px", marginBottom: "16px" }}>Pick a station or write your own spot</p>
            {(eventStations as any[]).map((s: any) => (
              <button key={s.id} onClick={() => { setSignalStationId(s.id); setSignalCustomLocation(""); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "6px", background: signalStationId === s.id ? "rgba(226,109,52,0.1)" : "rgba(255,255,255,0.02)", border: signalStationId === s.id ? "1px solid rgba(226,109,52,0.4)" : "1px solid rgba(255,255,255,0.06)", color: signalStationId === s.id ? EMBER : "#ccc", fontSize: "13px", cursor: "pointer" }}>
                {s.name}
              </button>
            ))}
            <input value={signalCustomLocation} onChange={e => { setSignalCustomLocation(e.target.value); if (e.target.value) setSignalStationId(""); }}
              placeholder="Or type your own meetup spot"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "#fff", fontSize: "13px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setSignalTarget(null)} style={{ flex: 1, padding: "11px", borderRadius: "10px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button onClick={sendSignalMeetup} disabled={!signalStationId && !signalCustomLocation.trim()}
                style={{ flex: 2, padding: "11px", borderRadius: "10px", background: "transparent", color: (!signalStationId && !signalCustomLocation.trim()) ? "rgba(255,255,255,0.2)" : EMBER, border: "1px solid rgba(226,109,52,0.4)", fontSize: "13px", cursor: (!signalStationId && !signalCustomLocation.trim()) ? "default" : "pointer", fontWeight: "500" }}>
                Send Signal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Scanner overlay ── */}
      {scanning && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <p style={{ color: "#fff", fontSize: "14px", marginBottom: "4px", fontWeight: "500" }}>
            {scanTarget ? `Scanning for ${getFirstName(scanTarget.display_name)}'s QR` : "Scan their Networking QR to connect"}
          </p>
          <p style={{ color: "#555", fontSize: "12px", marginBottom: "20px" }}>Point your camera at their QR code</p>
          <div id="qr-reader" style={{ width: "260px", height: "260px", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }} />
          <button onClick={stopScan} style={{ marginTop: "28px", padding: "11px 28px", borderRadius: "50px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      {/* ── Memory note sheet ── */}
      {memoryTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={() => setMemoryTarget(null)}>
          <div style={{ background: "linear-gradient(165deg,#F5EFE3,#EDE4D3)", borderRadius: "24px 24px 0 0", padding: "28px 24px", paddingBottom: "calc(28px + env(safe-area-inset-bottom))", width: "100%", boxShadow: "0 -20px 60px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <p style={{ fontSize: "10px", color: "#8a7355", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "700", margin: 0 }}>Private Note</p>
              <button onClick={() => setMemoryTarget(null)} style={{ background: "none", border: "none", color: "#8a7355", fontSize: "13px", cursor: "pointer", padding: 0 }}>✕</button>
            </div>
            <p style={{ fontSize: "19px", fontWeight: "600", color: "#2a2118", margin: "6px 0 2px", fontFamily: "Georgia, serif" }}>{memoryTarget.display_name}</p>
            <p style={{ fontSize: "12px", color: "#8a7355", margin: "0 0 20px" }}>{event?.title}</p>
            <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(138,115,85,0.15)" }}>
              <textarea value={memoryDraft} onChange={e => setMemoryDraft(e.target.value)} placeholder={"Where you met...\nWhat you talked about...\nFollow up..."} style={{ width: "100%", minHeight: "110px", background: "transparent", border: "none", outline: "none", resize: "none", color: "#2a2118", fontSize: "14px", lineHeight: "1.7", fontFamily: "Georgia, serif", boxSizing: "border-box" }} autoFocus />
            </div>
            <button onClick={saveMemoryNote} disabled={memorySaving} style={{ width: "100%", marginTop: "16px", padding: "13px", borderRadius: "12px", background: "#2a2118", color: "#F5EFE3", border: "none", fontSize: "13px", fontWeight: "600", cursor: memorySaving ? "default" : "pointer", opacity: memorySaving ? 0.6 : 1 }}>
              {memorySaving ? "Saving..." : "Save to memory"}
            </button>
            <button onClick={() => setMemoryTarget(null)} style={{ width: "100%", marginTop: "8px", padding: "10px", background: "transparent", border: "none", color: "#8a7355", fontSize: "12px", cursor: "pointer" }}>Skip for now</button>
          </div>
        </div>
      )}

      {/* ── Per-connection disclosure sheet (post-scan) ── */}
      {disclosureTarget && profile && (
        <DisclosureSheet
          unlockId={disclosureTarget.unlockId}
          ownerId={profile.id}
          viewerId={disclosureTarget.profile.id}
          viewerName={disclosureTarget.profile.display_name ?? "them"}
          myProfile={profile}
          onSave={() => {
            setDisclosureTarget(null);
            showToast(`Shared with ${getFirstName(disclosureTarget.profile.display_name)}`);
          }}
          onSkip={() => setDisclosureTarget(null)}
        />
      )}

      {/* ── Per-connection disclosure sheet (post-event accept) ── */}
      {acceptDisclosureTarget && profile && (
        <AcceptDisclosureSheet
          ownerId={profile.id}
          viewerId={acceptDisclosureTarget.id}
          viewerName={acceptDisclosureTarget.display_name ?? "them"}
          myProfile={profile}
          onSave={() => {
            showToast(`Shared with ${getFirstName(acceptDisclosureTarget.display_name)}`);
            setAcceptDisclosureTarget(null);
            invalidate.invalidateConnections();
          }}
          onSkip={() => {
            setAcceptDisclosureTarget(null);
            invalidate.invalidateConnections();
          }}
        />
      )}
    </div>
  );
}
