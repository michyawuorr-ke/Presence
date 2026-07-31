"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { rankMatches, rankMatchesChunked, type AttendeeProfile, type InteractionMap } from "@/lib/matching/score";
import { bestIntentPair } from "@/lib/matching/intents";
import { parseIntents, getFirstName, INTENT_MAP } from "./shared";

interface Props {
  profile: any;
  event: any;
  sentRequests: Set<string>;
  onRequestSent: (id: string) => void;
  onRecommended?: (ids: Set<string>) => void;
}

const EMBER = "#E26D34";

export default function MatchRecommendations({ profile, event, sentRequests, onRequestSent, onRecommended }: Props) {
  const [matches, setMatches] = useState<ReturnType<typeof rankMatches>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id || !event?.id) return;

    const [
      { data: attendees },
      { data: connected },
      { data: requested },
      { data: declined },
      { data: blocked },
    ] = await Promise.all([
      supabase
        .from("guest_profiles")
        .select("id,display_name,role_title,organisation,networking_intents,target_station_id,role")
        .eq("event_id", event.id)
        .eq("networking_visible", true)
        .neq("id", profile.id),
      supabase.from("handshakes").select("sender_id,receiver_id")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`),
      supabase.from("handshake_requests").select("recipient_id")
        .eq("requester_id", profile.id).eq("event_id", event.id),
      supabase.from("handshake_requests").select("recipient_id")
        .eq("requester_id", profile.id).eq("event_id", event.id).eq("status", "declined"),
      supabase.from("guest_blocks").select("blocked_id")
        .eq("blocker_id", profile.id).eq("event_id", event.id),
    ]);

    const interactions: InteractionMap = {
      connectedIds: new Set((connected || []).map((h: any) =>
        h.sender_id === profile.id ? h.receiver_id : h.sender_id
      )),
      requestedIds: new Set((requested || []).map((r: any) => r.recipient_id)),
      declinedIds:  new Set((declined  || []).map((r: any) => r.recipient_id)),
      blockedIds:   new Set((blocked   || []).map((b: any) => b.blocked_id)),
    };

    // Top 3 curated picks from ALL networking_visible attendees.
    // These may also appear in the live list — that's intentional.
    // "For You" is a curated lens, the live list is the full room.
    // Chunked rather than synchronous: at 300+ attendees, scoring everyone
    // in one unbroken pass visibly blocks the UI on lower-end Android
    // devices. Chunking yields to the main thread between batches so the
    // screen stays responsive while this runs.
    const ranked = await rankMatchesChunked(
      profile as AttendeeProfile,
      (attendees || []) as AttendeeProfile[],
      interactions,
      3,
    );

    setMatches(ranked);
    setLoading(false);
    if (onRecommended) onRecommended(new Set(ranked.slice(0, 3).map((m: any) => m.profile.id)));
  }, [profile?.id, event?.id]);

  useEffect(() => { load(); }, [load]);

  async function sendRequest(match: ReturnType<typeof rankMatches>[0]) {
    if (sending) return;
    setSending(match.profile.id);
    // Store the RECIPIENT's own intent id (never a baked sentence) so the
    // match reason can be recomputed correctly from each side's own
    // perspective at display time — see intentReasonFromStoredIntent.
    const myIntents = parseIntents(profile?.networking_intents);
    const theirIntents = parseIntents(match.profile.networking_intents);
    const pair = bestIntentPair(myIntents, theirIntents);
    await supabase.from("handshake_requests").insert({
      event_id:     event.id,
      requester_id: profile.id,
      recipient_id: match.profile.id,
      reason:       pair?.other.id ?? null,
      status:       "pending",
    });
    onRequestSent(match.profile.id);
    setSending(null);
  }

  // Don't show if: loading, dismissed, no matches, or no intents set
  const myIntents = parseIntents(profile?.networking_intents);
  if (dismissed || loading || matches.length === 0 || myIntents.length === 0) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: EMBER, textTransform: "uppercase", margin: "0 0 2px" }}>
            ◈ For You
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
            People worth meeting based on your intents
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: "transparent", border: "none", color: "#444", fontSize: "16px", cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}>
          ×
        </button>
      </div>

      {/* Match cards — compact horizontal scroll on mobile */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {matches.map((match, idx) => {
          const isSent    = sentRequests.has(match.profile.id);
          const isSending = sending === match.profile.id;
          const first     = getFirstName(match.profile.display_name);
          const theirIntents = parseIntents(match.profile.networking_intents);

          return (
            <div key={match.profile.id}
              style={{
                background: idx === 0
                  ? "linear-gradient(135deg, rgba(226,109,52,0.07) 0%, rgba(226,109,52,0.02) 100%)"
                  : "rgba(255,255,255,0.015)",
                border: `1px solid ${idx === 0 ? "rgba(226,109,52,0.2)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: "14px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>

              {/* Level 1 reveal: first name + industry + intent pills only */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#f0ede8", margin: 0 }}>
                    {first}
                  </p>
                  {idx === 0 && (
                    <span style={{ fontSize: "8px", fontWeight: "800", color: EMBER, background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.25)", borderRadius: "3px", padding: "1px 5px", letterSpacing: "0.1em", flexShrink: 0 }}>
                      TOP
                    </span>
                  )}
                  {match.profile.role && match.profile.role !== "attendee" && (() => {
                    const ROLE_CHIPS: Record<string,{label:string;color:string;bg:string;border:string}> = {
                      vip:      { label:"VIP",     color:"#D4AF37", bg:"rgba(212,175,55,0.1)",  border:"rgba(212,175,55,0.25)" },
                      speaker:  { label:"Speaker", color:"#E26D34", bg:"rgba(226,109,52,0.1)",  border:"rgba(226,109,52,0.25)" },
                      organizer:{ label:"Host",    color:"#A78BFA", bg:"rgba(167,139,250,0.1)", border:"rgba(167,139,250,0.25)" },
                    };
                    const chip = ROLE_CHIPS[match.profile.role];
                    return chip ? (
                      <span style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.04em", color:chip.color, background:chip.bg, border:"1px solid "+chip.border, borderRadius:"5px", padding:"1px 6px", flexShrink:0 }}>
                        {chip.label}
                      </span>
                    ) : null;
                  })()}
                </div>

                {match.profile.industry && (
                  <p style={{ fontSize: "11px", color: "#8A7355", margin: "0 0 6px", fontWeight: "500" }}>
                    {match.profile.industry}
                  </p>
                )}

                {/* Their intent descriptions — full text not just labels */}
                {theirIntents.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                    {theirIntents.map(id => {
                      const intent = INTENT_MAP[id];
                      return intent ? (
                        <span key={id} style={{ fontSize: "10px", color: "#8A7355", background: "rgba(138,115,85,0.08)", border: "1px solid rgba(138,115,85,0.15)", borderRadius: "4px", padding: "2px 6px", fontWeight: "600" }}>
                          {intent.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Why they match — the intelligent bit */}
                {match.reasons[0] && (
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: "1.5", fontStyle: "italic" }}>
                    {match.reasons[0]}
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => sendRequest(match)}
                disabled={isSent || isSending}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  borderRadius: "9px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: isSent ? "default" : "pointer",
                  background: isSent ? "rgba(255,255,255,0.03)" : "transparent",
                  color: isSent ? "rgba(255,255,255,0.25)" : EMBER,
                  border: isSent ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(226,109,52,0.35)",
                  whiteSpace: "nowrap",
                }}>
                {isSending ? "..." : isSent ? "Sent" : `Meet ${first}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Divider before the full list */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", marginBottom: "4px" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
        <p style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>Everyone in the room</p>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}
