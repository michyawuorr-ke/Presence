"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getFirstName, INTENTS_BY_GROUP, INTENT_GROUPS, PALETTE } from "./shared";
import AttendeeCard from "./AttendeeCard";
import { useMissedConnections, useInvalidators } from "./queries";

interface MissedConnectionsProps {
  event: any;
  profile: any;
}

const WINDOW_HOURS = 72;

export default function MissedConnections({ event, profile }: MissedConnectionsProps) {
  const [confirmTarget, setConfirmTarget] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [notification, setNotification] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const { data: missed = [], isLoading } = useMissedConnections(event?.id, profile?.id);
  const invalidate = useInvalidators(profile?.id ?? "", event?.id ?? "");

  const endedAt = event?.end_time ? new Date(event.end_time) : null;
  const windowCloses = endedAt ? new Date(endedAt.getTime() + WINDOW_HOURS * 3600000) : null;
  const hoursLeft = windowCloses ? Math.max(0, Math.ceil((windowCloses.getTime() - Date.now()) / 3600000)) : 0;
  const windowOpen = !windowCloses || Date.now() < windowCloses.getTime();

  async function sendConnect(target: any) {
    if (!selectedReason) return;
    const reason = selectedReason;
    setConfirmTarget(null);
    setSelectedReason("");
    setSentIds(prev => new Set(prev).add(target.id));
    // No expires_at — post-event requests aren't time-boxed the way live ones
    // are (nobody's walking away from the venue), they just stop being
    // surfaceable once the 72h missed-connections window itself closes.
    const { error } = await supabase.from("handshake_requests").insert({
      requester_id: profile.id,
      recipient_id: target.id,
      event_id: event.id,
      status: "pending",
      reason,
    });
    if (error) {
      setSentIds(prev => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
      setNotification("Couldn't send that request — try again.");
      setTimeout(() => setNotification(""), 4000);
    } else {
      setNotification(`Request sent to ${getFirstName(target.display_name)}`);
      setTimeout(() => setNotification(""), 4000);
      invalidate.invalidatePending();
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: "24px 20px", textAlign: "center", background: "#0a0a0b", minHeight: "calc(100vh - 100px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#E26D34", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!windowOpen) {
    return (
      <div style={{ padding: "24px 20px", textAlign: "center", background: "#0a0a0b", minHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.2 }}>◎</p>
        <p style={{ fontSize: "16px", color: "#555", marginBottom: "8px" }}>Networking has closed</p>
        <p style={{ fontSize: "14px", color: "#444" }}>Your connections are saved in Connects</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", background: "#0a0a0b", minHeight: "calc(100vh - 100px)" }}>
      <p style={{ fontSize: "10px", color: "#8A7355", letterSpacing: "0.15em", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>People You Missed</p>
      <p style={{ fontSize: "13px", color: "rgba(240,237,232,0.4)", marginBottom: "4px" }}>
        You were both at {event?.title || "this event"} but never connected.
      </p>
      <p style={{ fontSize: "12px", color: PALETTE.orange, marginBottom: "16px" }}>
        {hoursLeft > 0 ? `This window closes in ${hoursLeft}h` : "This window is closing soon"}
      </p>

      {notification && (
        <div style={{ background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
          <p style={{ color: "#E26D34", fontSize: "12px", margin: 0 }}>{notification}</p>
        </div>
      )}

      {missed.length === 0 ? (
        <p style={{ color: "#555", fontSize: "14px", textAlign: "center", padding: "60px 0" }}>
          You've either connected with, or already reached out to, everyone from this event.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {missed.map((a: any) => (
            <AttendeeCard key={a.id} attendee={a} sent={sentIds.has(a.id)} onConnect={() => setConfirmTarget(a)} />
          ))}
        </div>
      )}

      {confirmTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={() => { setConfirmTarget(null); setSelectedReason(""); }}>
          <div style={{ background: "#0c0c0f", borderRadius: "24px 24px 0 0", padding: "24px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)" }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: "10px", color: "#8A7355", letterSpacing: "0.15em", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>Second Chance</p>
            <p style={{ color: "#fff", fontSize: "17px", fontWeight: "500", marginBottom: "4px" }}>Connect with {getFirstName(confirmTarget.display_name)}?</p>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "12px" }}>{confirmTarget.role_title || ""}</p>
            <p style={{ fontSize: "10px", color: "rgba(240,237,232,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Why do you want to connect?</p>
            {INTENT_GROUPS.map(group => (
              <div key={group} style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.16em", color: "#8A7355", textTransform: "uppercase", margin: "0 0 6px" }}>{group}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(INTENTS_BY_GROUP[group] || []).map(intent => (
                    <button key={intent.id} onClick={() => setSelectedReason(intent.id)}
                      style={{
                        fontSize: "12px", fontWeight: "600", padding: "7px 12px", borderRadius: "8px", cursor: "pointer",
                        background: selectedReason === intent.id ? "rgba(226,109,52,0.12)" : "rgba(255,255,255,0.03)",
                        color: selectedReason === intent.id ? "#E26D34" : "rgba(240,237,232,0.5)",
                        border: selectedReason === intent.id ? "1px solid rgba(226,109,52,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      }}>
                      {intent.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => { setConfirmTarget(null); setSelectedReason(""); }} style={{ flex: 1, padding: "11px", borderRadius: "10px", background: "transparent", color: "rgba(240,237,232,0.5)", border: "1px solid rgba(240,237,232,0.15)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => sendConnect(confirmTarget)}
                disabled={!selectedReason}
                style={{ flex: 1, padding: "11px", borderRadius: "10px", background: "transparent", color: selectedReason ? "#E26D34" : "rgba(240,237,232,0.2)", border: "1px solid rgba(226,109,52,0.4)", fontSize: "13px", cursor: selectedReason ? "pointer" : "default", fontWeight: "500" }}
              >
                Send Request →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
