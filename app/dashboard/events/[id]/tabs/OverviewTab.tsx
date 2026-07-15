"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface OverviewTabProps {
  event: any;
  stats: any;
  hostLink: string;
  timeToLive: string;
  bannerUrl: string;
  onGoLive: () => void;
  onEndEvent: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingBanner: boolean;
  bannerError: string;
  ending: boolean;
}

const GOLD = "#D4AF37";

export default function OverviewTab({
  event, stats, hostLink, timeToLive, bannerUrl,
  onGoLive, onEndEvent, onBannerUpload, uploadingBanner, bannerError, ending
}: OverviewTabProps) {
  const [copied, setCopied] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const isScheduled = event?.status === "scheduled";
  const isLive = event?.status === "live";
  const isEnded = event?.status === "ended";
  const isDraft = event?.status === "draft" || !event?.status;

  const statusColor = isLive ? "#22c55e" : isScheduled ? GOLD : isEnded ? "#666" : "#888";
  const statusLabel = isLive ? "● LIVE" : isScheduled ? "◎ SCHEDULED" : isEnded ? "✓ ENDED" : "◌ DRAFT";

  const statCards = [
    { label: "Registered", value: stats.registrations },
    { label: "Confirmed", value: stats.confirmed },
    { label: "Checked In", value: stats.checkins },
    { label: "Networking", value: stats.onAura },
    { label: "Handshakes", value: stats.handshakes },
    { label: "Revenue", value: `KES ${(stats.revenue || 0).toLocaleString()}` },
  ];

  return (
    <div style={{ padding: "0 0 48px" }}>
      {/* Status + countdown */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: statusColor }}>{statusLabel}</span>
        {timeToLive && <span style={{ fontSize: "12px", color: GOLD, fontWeight: "500" }}>Goes live in {timeToLive}</span>}
      </div>

      {/* Banner */}
      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", marginBottom: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="Banner" style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
          : <p style={{ fontSize: "12px", color: "#444", margin: 0 }}>No banner uploaded</p>
        }
        <label style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", color: "#fff", cursor: "pointer", backdropFilter: "blur(8px)" }}>
          {uploadingBanner ? "Uploading..." : "Change Banner"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onBannerUpload} style={{ display: "none" }} />
        </label>
      </div>
      {bannerError && <p style={{ fontSize: "11px", color: GOLD, marginBottom: "12px" }}>{bannerError}</p>}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px 10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#f0ede8", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Host link */}
      {hostLink && (
        <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontSize: "10px", color: GOLD, fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>Your Host Link</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "0 0 12px", wordBreak: "break-all" }}>{hostLink}</p>
          <button onClick={() => copy(hostLink)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(212,175,55,0.3)", color: GOLD, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            {copied ? "✓ Copied" : "Copy Host Link"}
          </button>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {isDraft && (
          <button onClick={onGoLive} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: GOLD, color: "#000", border: "none", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.06em" }}>
            PUBLISH EVENT
          </button>
        )}
        {isLive && (
          <button onClick={onEndEvent} disabled={ending} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", cursor: "pointer" }}>
            {ending ? "Ending..." : "End Event"}
          </button>
        )}
      </div>
    </div>
  );
}
