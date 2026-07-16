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
}

const GOLD = "#D4AF37";

function LinkCard({ label, hint, url, icon }: { label: string; hint: string; url: string; icon: string }) {
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
    <div style={{ background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: "14px", padding: "14px 16px", marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "14px" }}>{icon}</span>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: "11px", color: "#444", margin: "0 0 10px" }}>{hint}</p>
      <p style={{ fontSize: "11px", color: "#555", margin: "0 0 10px", wordBreak: "break-all", fontFamily: "monospace" }}>{url}</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={copy}
          style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(212,175,55,0.25)", color: copied ? "#22c55e" : GOLD, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <button onClick={share}
          style={{ width: "36px", padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(212,175,55,0.25)", color: GOLD, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ↑
        </button>
      </div>
    </div>
  );
}

export default function OverviewTab({
  event, stats, hostLink, registrationLink, scannerLink,
  timeToLive, bannerUrl, onBannerUpload, uploadingBanner, bannerError
}: OverviewTabProps) {

  const isLive      = event?.status === "live";
  const isEnded     = event?.status === "ended";
  const isDraft     = !isLive && !isEnded;

  const statusColor = isLive ? "#22c55e" : isEnded ? "#555" : GOLD;
  const statusLabel = isLive ? "● LIVE" : isEnded ? "✓ ENDED" : "◌ DRAFT";

  const statCards = [
    { label: "Registered", value: stats.registrations },
    { label: "Confirmed",  value: stats.confirmed },
    { label: "Checked In", value: stats.checkins },
    { label: "Networking", value: stats.onAura },
    { label: "Handshakes", value: stats.handshakes },
    { label: "Revenue",    value: `KES ${(stats.revenue || 0).toLocaleString()}` },
  ];

  return (
    <div style={{ paddingBottom: "48px" }}>

      {/* Status + countdown */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: statusColor }}>{statusLabel}</span>
        {timeToLive && isDraft && (
          <span style={{ fontSize: "12px", color: GOLD, fontWeight: "500" }}>Goes live in {timeToLive}</span>
        )}
      </div>

      {/* Banner */}
      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", marginBottom: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="Banner" style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
          : <p style={{ fontSize: "12px", color: "#333", margin: 0 }}>No banner uploaded</p>
        }
        <label style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", color: "#fff", cursor: "pointer", backdropFilter: "blur(8px)" }}>
          {uploadingBanner ? "Uploading..." : "Change Banner"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onBannerUpload} style={{ display: "none" }} />
        </label>
      </div>
      {bannerError && <p style={{ fontSize: "11px", color: "#E26D34", marginBottom: "12px" }}>{bannerError}</p>}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "24px" }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px 10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#f0ede8", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Links */}
      <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: "12px" }}>Event Links</p>

      <LinkCard
        label="Registration Link"
        hint="Share this with people who want to attend"
        url={registrationLink}
        icon="🎟"
      />
      <LinkCard
        label="Host Link"
        hint="Your personal access to the event scene"
        url={hostLink}
        icon="🛡"
      />
      <LinkCard
        label="Check-In Scanner"
        hint="Open on a device at the door for scanning"
        url={scannerLink}
        icon="📷"
      />
    </div>
  );
}
