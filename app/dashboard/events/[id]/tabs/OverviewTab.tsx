"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface OverviewTabProps {
  event: any;
  stats: any;
  hostLink: string;
  registrationLink: string;
  scannerLink: string;
  timeToLive: string;
  bannerUrl: string;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingBanner: boolean;
  bannerError: string;
}

const GOLD  = "#D4AF37";
const EMBER = "#E26D34";
const IVORY = "rgba(240,237,232,0.85)";
const DIM   = "rgba(240,237,232,0.35)";
const FAINT = "rgba(255,255,255,0.04)";

const ICONS = {
  registration: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
  host:         `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  scanner:      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
  share:        `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
};

function LinkCard({ label, hint, url, icon }: { label: string; hint: string; url: string; icon: keyof typeof ICONS }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: label, url }).catch(() => {});
    } else {
      copy();
    }
  }

  if (!url) return null;

  return (
    <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 16px", marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <span style={{ display: "flex", alignItems: "center", color: DIM }} dangerouslySetInnerHTML={{ __html: ICONS[icon] }} />
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", color: DIM, textTransform: "uppercase", margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", margin: "0 0 8px" }}>{hint}</p>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: "0 0 10px", wordBreak: "break-all", fontFamily: "monospace" }}>{url}</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={copy}
          style={{ flex: 1, padding: "8px", borderRadius: "8px", background: copied ? "rgba(34,197,94,0.08)" : "rgba(226,109,52,0.08)", border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(226,109,52,0.25)"}`, color: copied ? "#22c55e" : EMBER, fontSize: "11px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.04em" }}>
          {copied ? "✓ Copied" : "Copy Link"}
        </button>
        <button onClick={share}
          style={{ width: "36px", padding: "8px", borderRadius: "8px", background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.25)", color: EMBER, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          dangerouslySetInnerHTML={{ __html: ICONS.share }} />
      </div>
    </div>
  );
}

export default function OverviewTab({
  event, stats, hostLink, registrationLink, scannerLink,
  timeToLive, bannerUrl, onBannerUpload, uploadingBanner, bannerError
}: OverviewTabProps) {

  const isLive  = event?.status === "live";
  const isEnded = event?.status === "ended";
  const isDraft = !isLive && !isEnded;

  // ── Post-event report data ──────────────────────────────────────────────
  // Fetched separately from the live `stats` prop since these numbers only
  // make sense once the event has ended, and computing "most connected
  // person" / scan rate needs per-guest breakdowns the live stat counts don't carry.
  const [reportLoading, setReportLoading] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [topConnector, setTopConnector] = useState<{ name: string; count: number } | null>(null);
  const [scanRate, setScanRate] = useState(0);

  useEffect(() => {
    if (!isEnded || !event?.id) return;
    let cancelled = false;
    async function loadReport() {
      const [{ data: guests }, { data: hs }, { data: unlocks }] = await Promise.all([
        supabase.from("guest_profiles").select("id,display_name,role").eq("event_id", event.id).limit(1000),
        supabase.from("handshakes").select("id,sender_id,receiver_id,created_at").eq("event_id", event.id).limit(1000),
        supabase.from("profile_unlocks").select("handshake_id").eq("event_id", event.id).limit(1000),
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

      // Scan rate — % of connections that were confirmed via an actual QR
      // scan (profile_unlocks writes 2 rows per scan, one per side, so
      // distinct handshake_id is the real scan count, not row count).
      const scannedHandshakeIds = new Set((unlocks || []).map((u: any) => u.handshake_id));
      const totalHandshakes = hs?.length || 0;
      setScanRate(totalHandshakes > 0 ? Math.round((scannedHandshakeIds.size / totalHandshakes) * 100) : 0);

      setReportLoading(false);
    }
    loadReport();
    return () => { cancelled = true; };
  }, [isEnded, event?.id, event?.start_time]);

  // Networking density — connections per attendee. Uses the live handshake
  // count from `stats` (already fixed to be distinct, not double-counted)
  // against the attendee count fetched above.
  const density = attendeeCount > 0 ? (stats.handshakes / attendeeCount).toFixed(1) : "0";

  // Narrative summary — describes what happened, stays descriptive.
  // "Good/bad" judgment now lives separately in buildTakeaways() below,
  // so the two don't get tangled: this says what happened, that says what
  // it might mean for next time.
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

  // Actionable takeaways — unlike the narrative above, these DO use
  // judgment thresholds, deliberately. There's no real cross-event
  // benchmark yet (new product), so these are placeholder targets grounded
  // in general event-networking conventions, not Oreeti-specific data:
  //   - density: ~0.3 connections/attendee is a rough floor for "most
  //     people connected with someone" at a well-run networking event
  //   - scan rate: 50% used as a neutral midpoint, since there's no
  //     external benchmark for this Oreeti-specific mechanic at all
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

  // Stat cards — Ember accent on the two live-energy stats. "Networking"
  // (live visibility count) is dropped once ended since it's a frozen,
  // meaningless number after guests have left — the report section below
  // replaces it with numbers that are actually meaningful post-event.
  const statCards = isEnded ? [
    { label: "Registered", value: stats.registrations,  accent: false },
    { label: "Confirmed",  value: stats.confirmed,       accent: false },
    { label: "Checked In", value: stats.checkins,        accent: false },
    { label: "Connections",value: stats.handshakes,      accent: true  },
    { label: "Revenue",    value: `KES ${(stats.revenue || 0).toLocaleString()}`, accent: false },
  ] : [
    { label: "Registered", value: stats.registrations,  accent: false },
    { label: "Confirmed",  value: stats.confirmed,       accent: false },
    { label: "Checked In", value: stats.checkins,        accent: false },
    { label: "Networking", value: stats.onAura,          accent: true  },
    { label: "Connections",value: stats.handshakes,      accent: true  },
    { label: "Revenue",    value: `KES ${(stats.revenue || 0).toLocaleString()}`, accent: false },
  ];

  return (
    <div style={{ paddingBottom: "48px" }}>

      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        {isLive ? (
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: "#22c55e" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
            LIVE
          </span>
        ) : isEnded ? (
          <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: "#555" }}>✓ ENDED</span>
        ) : (
          <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD }}>◌ DRAFT</span>
        )}
        {timeToLive && isDraft && (
          <span style={{ fontSize: "11px", color: DIM, fontWeight: "500" }}>Goes live in <span style={{ color: GOLD }}>{timeToLive}</span></span>
        )}
      </div>

      {/* Banner */}
      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", marginBottom: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="Banner" style={{ width: "100%", height: "auto", display: "block", maxHeight: "320px", objectFit: "contain" }} />
          : <div style={{ minHeight: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ fontSize: "12px", color: "#333", margin: 0 }}>No banner uploaded</p></div>
        }
        <label style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", color: "#fff", cursor: "pointer", backdropFilter: "blur(8px)" }}>
          {uploadingBanner ? "Uploading..." : "Change Banner"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onBannerUpload} style={{ display: "none" }} />
        </label>
      </div>
      {bannerError && <p style={{ fontSize: "11px", color: EMBER, marginBottom: "12px" }}>{bannerError}</p>}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "28px" }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: s.accent ? "rgba(226,109,52,0.04)" : FAINT,
            border: `1px solid ${s.accent ? "rgba(226,109,52,0.12)" : "rgba(255,255,255,0.04)"}`,
            borderRadius: "12px", padding: "14px 10px", textAlign: "center"
          }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: s.accent ? EMBER : IVORY, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: "9px", color: s.accent ? "rgba(226,109,52,0.6)" : "#555", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Post-event report ── */}
      {isEnded && (
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em", color: DIM, textTransform: "uppercase", marginBottom: "12px" }}>Event Report</p>
          {reportLoading ? (
            <div style={{ height: "180px", borderRadius: "12px", background: FAINT }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

              {/* Narrative summary */}
              <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "16px" }}>
                <p style={{ fontSize: "13px", color: IVORY, lineHeight: "1.6", margin: 0 }}>{narrative}</p>
              </div>

              {/* Actionable takeaways — separate from the narrative above on
                  purpose: that describes what happened, this suggests what
                  to consider for next time. Only shows when there's
                  something worth flagging. */}
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

              {/* Metric cards with interpretive lines */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: IVORY, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{density}</p>
                  <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Connections / Attendee</p>
                  <p style={{ fontSize: "10.5px", color: "rgba(240,237,232,0.4)", margin: 0, lineHeight: "1.4" }}>
                    {attendeeCount > 0 ? `${stats.handshakes} connections across ${attendeeCount} attendees` : "No attendance recorded"}
                  </p>
                </div>
                <div style={{ background: FAINT, border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: IVORY, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{scanRate}%</p>
                  <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Scan Rate</p>
                  <p style={{ fontSize: "10.5px", color: "rgba(240,237,232,0.4)", margin: 0, lineHeight: "1.4" }}>
                    {stats.handshakes > 0 ? "share of connections confirmed in person" : "no connections to measure"}
                  </p>
                </div>
              </div>

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
            </div>
          )}
        </div>
      )}

      {/* Links */}
      <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em", color: DIM, textTransform: "uppercase", marginBottom: "12px" }}>Event Links</p>

      {isLive || isEnded ? (
        <LinkCard label="Registration Link" hint="Share with attendees" url={registrationLink} icon="registration" />
      ) : (
        <div style={{ background: FAINT, border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 16px", marginBottom: "10px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", color: "#333", textTransform: "uppercase", margin: "0 0 4px" }}>Registration Link</p>
          <p style={{ fontSize: "11px", color: "#2a2a2a", margin: 0 }}>Available after publishing</p>
        </div>
      )}

      <LinkCard label="Host Link"       hint="Your personal access to the event" url={hostLink}       icon="host"    />
      <LinkCard label="Check-In Scanner" hint="Open at the door for scanning"      url={scannerLink}   icon="scanner" />
    </div>
  );
}
