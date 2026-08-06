"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { rankMatches, type AttendeeProfile, type InteractionMap } from "@/lib/matching/score";
import { parseIntents, getFirstName, INTENT_MAP } from "./shared";

interface ForYouTabProps {
  profile: any;
  event: any;
  registration: any;
}

const EMBER = "#E26D34";

export default function ForYouTab({ profile, event, registration }: ForYouTabProps) {
  const [matches, setMatches] = useState<ReturnType<typeof rankMatches>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState("");

  function toast(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  const load = useCallback(async () => {
    if (!profile?.id || !event?.id) return;
    setLoading(true);

    // Fetch all active attendees
    const { data: attendees } = await supabase
      .from("guest_profiles")
      .select("id,display_name,role_title,organisation,bio,networking_intents,target_station_id,role")
      .eq("event_id", event.id)
      .eq("aura_active", true)
      .eq("networking_visible", true)
      .neq("id", profile.id);

    // Fetch interaction history
    const [
      { data: connected },
      { data: requested },
      { data: received },
      { data: blocked },
    ] = await Promise.all([
      supabase.from("handshakes").select("sender_id,receiver_id")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`).limit(1000),
      supabase.from("handshake_requests").select("recipient_id")
        .eq("requester_id", profile.id).limit(1000),
      supabase.from("handshake_requests").select("requester_id")
        .eq("recipient_id", profile.id).eq("status", "declined").limit(1000),
      supabase.from("guest_blocks").select("blocked_id")
        .eq("blocker_id", profile.id).eq("event_id", event.id).limit(1000),
    ]);

    const interactions: InteractionMap = {
      connectedIds: new Set([
        ...(connected || []).map((h: any) =>
          h.sender_id === profile.id ? h.receiver_id : h.sender_id
        ),
      ]),
      requestedIds:  new Set((requested || []).map((r: any) => r.recipient_id)),
      declinedIds:   new Set((received  || []).map((r: any) => r.requester_id)),
      blockedIds:    new Set((blocked   || []).map((b: any) => b.blocked_id)),
    };

    const ranked = rankMatches(
      profile as AttendeeProfile,
      (attendees || []) as AttendeeProfile[],
      interactions,
      8,
    );

    setMatches(ranked);
    setLoading(false);
  }, [profile?.id, event?.id]);

  useEffect(() => { load(); }, [load]);

  async function sendRequest(match: ReturnType<typeof rankMatches>[0]) {
    if (!profile?.id || sending) return;
    setSending(match.profile.id);

    const { error } = await supabase.from("handshake_requests").insert({
      event_id:     event.id,
      requester_id: profile.id,
      recipient_id: match.profile.id,
      reason:       match.intentReason ?? "Oreeti match",
      status:       "pending",
    });

    if (!error) {
      setSent(prev => new Set([...prev, match.profile.id]));
      toast(`Request sent to ${getFirstName(match.profile.display_name)}`);
    } else {
      toast("Couldn't send request — try again");
    }
    setSending(null);
  }

  const myIntents = parseIntents(profile?.networking_intents);

  if (loading) return (
    <div style={{ padding: "32px 16px" }}>
      <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: EMBER, textTransform: "uppercase", margin: "0 0 16px" }}>Finding Your Matches</p>
      {[1,2,3].map(i => (
        <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", marginBottom: "10px" }}>
          <div style={{ height: "13px", width: "45%", borderRadius: "4px", background: "rgba(255,255,255,0.06)", marginBottom: "10px" }} />
          <div style={{ height: "11px", width: "30%", borderRadius: "4px", background: "rgba(255,255,255,0.04)", marginBottom: "14px" }} />
          <div style={{ height: "10px", width: "80%", borderRadius: "4px", background: "rgba(255,255,255,0.03)" }} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "0 0 48px" }}>
      {notification && (
        <div style={{ background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
          <p style={{ color: EMBER, fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p>
        </div>
      )}

      {/* My intents context */}
      {myIntents.length > 0 && (
        <div style={{ background: "rgba(226,109,52,0.04)", border: "1px solid rgba(226,109,52,0.1)", borderRadius: "12px", padding: "12px 14px", marginBottom: "20px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: EMBER, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>You're here for</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {myIntents.map(id => {
              const intent = INTENT_MAP[id];
              return (
                <div key={id} style={{ background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "8px", padding: "5px 10px" }}>
                  <p style={{ fontSize: "11px", fontWeight: "600", color: EMBER, margin: 0 }}>{intent?.label ?? id}</p>
                  {intent?.description && (
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0", lineHeight: "1.4" }}>{intent.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {matches.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "28px", margin: "0 0 12px" }}>◎</p>
          <p style={{ fontSize: "14px", color: "#f0ede8", fontWeight: "500", margin: "0 0 6px" }}>No matches yet</p>
          <p style={{ fontSize: "12px", color: "#444", margin: 0, lineHeight: "1.6" }}>
            Matches appear as more people activate their networking presence. Check back in a few minutes.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: EMBER, textTransform: "uppercase", margin: "0 0 14px" }}>
            {matches.length} People Worth Meeting Tonight
          </p>
          {matches.map((match, idx) => {
            const isSent    = sent.has(match.profile.id);
            const isSending = sending === match.profile.id;
            const first     = getFirstName(match.profile.display_name);
            const theirIntents = parseIntents(match.profile.networking_intents);

            return (
              <div key={match.profile.id}
                style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${idx === 0 ? "rgba(226,109,52,0.2)" : "rgba(255,255,255,0.05)"}`, borderRadius: "16px", padding: "16px", marginBottom: "10px", position: "relative" }}>

                {/* Top pick indicator */}
                {idx === 0 && (
                  <div style={{ position: "absolute", top: "12px", right: "12px", fontSize: "9px", fontWeight: "800", color: EMBER, background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.25)", borderRadius: "4px", padding: "2px 7px", letterSpacing: "0.12em" }}>
                    TOP MATCH
                  </div>
                )}

                {/* Name + role */}
                <div style={{ paddingRight: idx === 0 ? "80px" : "0", marginBottom: "6px" }}>
                  <p style={{ fontSize: "15px", fontWeight: "600", color: "#f0ede8", margin: "0 0 2px" }}>
                    {match.profile.display_name}
                    {match.profile.role_badge && match.profile.role !== "attendee" && (
                      <span style={{ marginLeft: "6px", fontSize: "12px" }}>{match.profile.role_badge}</span>
                    )}
                  </p>
                  {(match.profile.role_title || match.profile.organisation) && (
                    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                      {match.profile.role_title}
                      {match.profile.role_title && match.profile.organisation ? " · " : ""}
                      {match.profile.organisation}
                    </p>
                  )}
                </div>

                {/* Their intents with full description */}
                {theirIntents.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                    {theirIntents.map(id => {
                      const intent = INTENT_MAP[id];
                      return (
                        <span key={id} style={{ fontSize: "10px", color: "#8A7355", background: "rgba(138,115,85,0.08)", border: "1px solid rgba(138,115,85,0.18)", borderRadius: "5px", padding: "2px 7px", fontWeight: "600" }}>
                          {intent?.label ?? id}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Match reason */}
                {match.reasons.length > 0 && (
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: "1.5", fontStyle: "italic" }}>
                    "{match.reasons[0]}"
                  </p>
                )}

                {/* Connect CTA */}
                <button
                  onClick={() => sendRequest(match)}
                  disabled={isSent || isSending}
                  style={{
                    width: "100%", padding: "9px", borderRadius: "9px", fontSize: "12px", fontWeight: "600",
                    cursor: isSent ? "default" : "pointer", letterSpacing: "0.06em",
                    background: isSent ? "rgba(255,255,255,0.03)" : "transparent",
                    color: isSent ? "rgba(255,255,255,0.3)" : EMBER,
                    border: isSent ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(226,109,52,0.35)",
                  }}>
                  {isSending ? "Sending..." : isSent ? "Request Sent" : `Connect with ${first}`}
                </button>
              </div>
            );
          })}

          <p style={{ fontSize: "11px", color: "#333", textAlign: "center", marginTop: "20px", lineHeight: "1.5" }}>
            Matches update as more people join the room.{"\n"}You can also browse everyone in the Networking tab.
          </p>
        </>
      )}
    </div>
  );
}
