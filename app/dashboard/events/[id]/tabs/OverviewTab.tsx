"use client";
import { useState } from "react";

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
  onGoToInsights: () => void;
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
  timeToLive, bannerUrl, onBannerUpload, uploadingBanner, bannerError, onGoToInsights
}: OverviewTabProps) {

  const isLive      = event?.status === "live";
  const isEnded     = event?.status === "ended";
  const isScheduled = event?.status === "scheduled";
  // Was `!isLive && !isEnded` — meant "draft" before "scheduled" existed as
  // a status, so a genuinely published (scheduled) event still read as
  // draft here: the badge said DRAFT and the registration link stayed
  // hidden behind a "available after publishing" placeholder even though
  // it had been published. Exact match now instead of a negation that
  // silently swallowed the new middle state.
  const isDraft     = event?.status === "draft";

  // Stat cards — Ember accent on the two live-energy stats. Density and
  // Scan Rate used to live here, computed from the same numbers now shown
  // as QR Handshakes / Connections Created on the Insights tab — that made
  // this grid redundant with itself across two screens. Removed rather
  // than kept "for completeness"; nothing is lost, the raw numbers they
  // were computed from are one tab away.
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
        ) : isScheduled ? (
          <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD }}>◐ UPCOMING</span>
        ) : (
          <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD }}>◌ DRAFT</span>
        )}
        {timeToLive && isScheduled && (
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
        <button onClick={onGoToInsights} style={{ width: "100%", background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "12px", padding: "12px 14px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", cursor: "pointer", textAlign: "left" }}>
          <p style={{ fontSize: "12px", color: "rgba(240,237,232,0.75)", margin: 0 }}>Who was in the room, top connector, and takeaways for next time</p>
          <span style={{ fontSize: "11px", fontWeight: "700", color: GOLD, whiteSpace: "nowrap" }}>See Insights →</span>
        </button>
      )}

      {/* Links */}
      <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em", color: DIM, textTransform: "uppercase", marginBottom: "12px" }}>Event Links</p>

      {isScheduled || isLive || isEnded ? (
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
