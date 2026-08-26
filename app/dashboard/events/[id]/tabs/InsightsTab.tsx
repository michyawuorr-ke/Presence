"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface InsightsTabProps {
  event: any;
  stats: any;
}

const GOLD  = "#D4AF37";
const IVORY = "rgba(240,237,232,0.85)";
const FAINT = "rgba(255,255,255,0.04)";

// This tab is the organizer's "story" home — the interpretive layer, as
// opposed to Overview's plain glance-and-go numbers. Top Connector, the
// narrative summary, and takeaways moved here from Overview so that tab
// could stay a fast snapshot instead of a scroll. Composition breakdown
// (industry/intent across attendees), per-attendee engagement, and an
// exportable report are the planned next additions to this same tab —
// building here means an organizer has one place to go for the full
// picture, rather than it being scattered across Overview and Attendees.
export default function InsightsTab({ event, stats }: InsightsTabProps) {
  const isEnded = event?.status === "ended";

  const [loading, setLoading] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [topConnector, setTopConnector] = useState<{ name: string; count: number } | null>(null);
  const [scanRate, setScanRate] = useState(0);
  // Connection Activity (spec §2) — the request lifecycle, distinct from
  // the `handshakes` table (a handshake is a CONFIRMED connection; it can
  // be created either by a request being approved, or directly via a QR
  // scan/card add that never went through the request flow at all — see
  // lib/recordConnection.ts's `source` field). Both numbers are real and
  // can legitimately differ; showing both rather than forcing them to
  // match is more honest than collapsing them into one figure.
  const [requestStats, setRequestStats] = useState({ total: 0, accepted: 0, pending: 0, declined: 0 });
  const [qrHandshakeCount, setQrHandshakeCount] = useState(0);

  useEffect(() => {
    if (!isEnded || !event?.id) return;
    let cancelled = false;
    async function loadInsights() {
      const [{ data: guests }, { data: hs }, { data: unlocks }, { data: requests }] = await Promise.all([
        supabase.from("guest_profiles").select("id,display_name,role").eq("event_id", event.id).limit(1000),
        supabase.from("handshakes").select("id,sender_id,receiver_id,created_at").eq("event_id", event.id).limit(1000),
        supabase.from("profile_unlocks").select("handshake_id").eq("event_id", event.id).limit(1000),
        supabase.from("handshake_requests").select("id,status").eq("event_id", event.id).limit(1000),
      ]);
      if (cancelled) return;

      const attendees = (guests || []).filter((g: any) => g.role !== "organizer");
      setAttendeeCount(attendees.length);

      // Most connected person — count appearances per guest across all handshakes
      const countByGuest = new Map<string, number>();
      (hs || []).forEach((h: any) => {
        countByGuest.set(h.sender_id, (countByGuest.get(h.sender_id) || 0) + 1);
        countByGuest.set(h.receiver_id, (countByGuest.get(h.receiver_id) || 0) + 1);
      });
      let top: { name: string; count: number } | null = null;
      countByGuest.forEach((count, guestId) => {
        if (!top || count > top.count) {
          const g = attendees.find((a: any) => a.id === guestId);
          if (g) top = { name: g.display_name, count };
        }
      });
      setTopConnector(top);

      // Scan rate — % of connections confirmed via an actual QR scan
      // (profile_unlocks writes 2 rows per scan, one per side, so distinct
      // handshake_id is the real scan count, not row count).
      const scannedHandshakeIds = new Set((unlocks || []).map((u: any) => u.handshake_id));
      const totalHandshakes = hs?.length || 0;
      setScanRate(totalHandshakes > 0 ? Math.round((scannedHandshakeIds.size / totalHandshakes) * 100) : 0);
      setQrHandshakeCount(scannedHandshakeIds.size);

      const reqs = requests || [];
      setRequestStats({
        total: reqs.length,
        accepted: reqs.filter((r: any) => r.status === "approved").length,
        pending: reqs.filter((r: any) => r.status === "pending").length,
        declined: reqs.filter((r: any) => r.status === "declined").length,
      });

      setLoading(false);
    }
    loadInsights();
    return () => { cancelled = true; };
  }, [isEnded, event?.id]);

  // Narrative summary — describes what happened, stays descriptive.
  // "Good/bad" judgment lives separately in buildTakeaways() below, so the
  // two don't get tangled: this says what happened, that says what it
  // might mean for next time.
  function buildNarrative(): string {
    if (attendeeCount === 0) return "No attendance data was recorded for this event.";
    const parts: string[] = [];
    parts.push(`${attendeeCount} ${attendeeCount === 1 ? "person" : "people"} attended ${event?.title || "this event"}.`);
    if (stats.handshakes === 0) {
      parts.push("No connections were made during the event.");
    } else {
      parts.push(`Guests made ${stats.handshakes} connection${stats.handshakes === 1 ? "" : "s"}${scanRate > 0 ? `, ${scanRate}% of them confirmed through an in-person QR scan` : ""}.`);
      if (topConnector) {
        parts.push(`${topConnector.name} connected with the most people, at ${topConnector.count}.`);
      }
    }
    return parts.join(" ");
  }
  const narrative = buildNarrative();

  // Acceptance rate = accepted / all requests SENT (pending + declined
  // included in the denominator, not just decided ones) — matches the
  // spec's own worked example: 218 accepted / 327 total = 66.7%.
  const acceptanceRate = requestStats.total > 0 ? Math.round((requestStats.accepted / requestStats.total) * 100) : 0;

  // Actionable takeaways — unlike the narrative above, these DO use
  // judgment thresholds, deliberately. There's no real cross-event
  // benchmark yet (new product), so these are placeholder targets grounded
  // in general event-networking conventions, not Oreeti-specific data.
  // Revisit both once there's enough real event data to replace them with
  // actual medians instead of estimates.
  function buildTakeaways(): string[] {
    if (attendeeCount === 0 || stats.handshakes === 0) return [];
    const out: string[] = [];
    const densityNum = attendeeCount > 0 ? stats.handshakes / attendeeCount : 0;

    if (densityNum < 0.3) {
      out.push("Connections per attendee was below typical for a networking-focused event — consider a structured icebreaker or longer networking window next time.");
    }
    if (scanRate < 50 && stats.handshakes >= 3) {
      out.push("Fewer than half of connections were confirmed with an in-person scan — clearer signage or a designated networking area may help guests find each other on the floor.");
    }
    if (topConnector && densityNum > 0 && topConnector.count > densityNum * 4) {
      out.push(`Networking activity was concentrated in a few people — ${topConnector.name} connected far more than average, which may mean most guests need more encouragement or structure to start conversations.`);
    }
    return out;
  }
  const takeaways = buildTakeaways();

  if (!isEnded) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>Insights become available once this event ends.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ paddingBottom: "48px" }}>
        <div style={{ height: "80px", borderRadius: "14px", background: FAINT, marginBottom: "10px" }} />
        <div style={{ height: "60px", borderRadius: "14px", background: FAINT }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "48px", display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* Connection Activity — spec §2. "Attendance tells you who came.
          Connections tell you what happened." This is the request
          lifecycle (sent/accepted/pending), distinct from QR handshakes
          (an in-person scan confirming a connection) and from Connections
          Created (the `handshakes` table total — every confirmed
          connection, whichever path created it: an approved request, a
          direct QR scan, or a card add). These numbers can legitimately
          differ from each other; that's real, not a bug to reconcile. */}
      <div>
        <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em", color: "rgba(240,237,232,0.35)", textTransform: "uppercase", marginBottom: "10px" }}>Connection Activity</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px 10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: IVORY, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{requestStats.total}</p>
            <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Requests</p>
          </div>
          <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "12px", padding: "14px 10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#22c55e", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{requestStats.accepted}</p>
            <p style={{ fontSize: "9px", color: "rgba(34,197,94,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Accepted</p>
          </div>
          <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px 10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: IVORY, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{requestStats.pending}</p>
            <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Pending</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px" }}>
            <p style={{ fontSize: "22px", fontWeight: "700", color: IVORY, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{qrHandshakeCount}</p>
            <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>QR Handshakes</p>
          </div>
          <div style={{ background: "rgba(226,109,52,0.04)", border: "1px solid rgba(226,109,52,0.15)", borderRadius: "12px", padding: "14px" }}>
            <p style={{ fontSize: "22px", fontWeight: "700", color: "#E26D34", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{stats.handshakes}</p>
            <p style={{ fontSize: "9px", color: "rgba(226,109,52,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Connections Created</p>
          </div>
        </div>
        <div style={{ marginTop: "8px", background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", color: GOLD, textTransform: "uppercase", margin: 0 }}>Acceptance Rate</p>
          <p style={{ fontSize: "16px", fontWeight: "700", color: GOLD, margin: 0 }}>{acceptanceRate}%</p>
        </div>
      </div>

      {/* Narrative summary */}
      <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "16px" }}>
        <p style={{ fontSize: "13px", color: IVORY, lineHeight: "1.6", margin: 0 }}>{narrative}</p>
      </div>

      {/* Actionable takeaways — only shows when there's something worth flagging */}
      {takeaways.length > 0 && (
        <div style={{ background: "rgba(226,109,52,0.04)", border: "1px solid rgba(226,109,52,0.15)", borderRadius: "14px", padding: "16px" }}>
          <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", color: "#E26D34", textTransform: "uppercase", margin: "0 0 10px" }}>For Your Next Event</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {takeaways.map((t, i) => (
              <p key={i} style={{ fontSize: "12.5px", color: "rgba(240,237,232,0.75)", lineHeight: "1.55", margin: 0 }}>• {t}</p>
            ))}
          </div>
        </div>
      )}

      {/* Top Connector */}
      <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "12px", padding: "14px 16px" }}>
        <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", color: GOLD, textTransform: "uppercase", margin: "0 0 4px" }}>Most Connected</p>
        {topConnector ? (
          <p style={{ fontSize: "14px", color: IVORY, margin: 0 }}>
            {topConnector.name} — <span style={{ color: GOLD, fontWeight: "700" }}>{topConnector.count}</span> connection{topConnector.count === 1 ? "" : "s"}
          </p>
        ) : (
          <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>No connections were made at this event.</p>
        )}
      </div>

      {/* Still to build, in order: Intent breakdown (§3), Industry
          cross-interaction (§5), Intent→Connection (§4), Activation
          refinement using aura_active (§1), then the funnel (§7) with
          Discovered People omitted — no view/discovery event is logged
          anywhere yet, so that step needs new instrumentation before it
          can show a real number; deferred per explicit decision, not an
          oversight. Location/area analytics (§6) dropped entirely — the
          only location data that exists is opt-in meetup-signal proposals,
          not actual foot traffic, so an "activity by area" chart would
          overclaim what's actually measured. */}
    </div>
  );
}
