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

const LINK_ICONS: Record<string, string> = {
  registration: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  host: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  scanner: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
};

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
        <span style={{ display:"flex",alignItems:"center",color:GOLD }} dangerouslySetInnerHTML={{__html:LINK_ICONS[icon]??LINK_ICONS.registration}}/>
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

      {/* Links — registration only shown after publishing */}
      <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: "12px" }}>Event Links</p>

      {isLive || isEnded ? (
        <LinkCard
          label="Registration Link"
          hint="Share with people who want to attend"
          url={registrationLink}
          icon="registration"
        />
      ) : (
        <div style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 16px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ display:"flex",alignItems:"center",color:"#444" }} dangerouslySetInnerHTML={{__html:LINK_ICONS.registration}}/>
            <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: "#444", textTransform: "uppercase", margin: 0 }}>Registration Link</p>
          </div>
          <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>Available after publishing — go to Setup to publish</p>
        </div>
      )}

      <LinkCard
        label="Host Link"
        hint="Your personal access to the event scene"
        url={hostLink}
        icon="host"
      />
      <LinkCard
        label="Check-In Scanner"
        hint="Open on a device at the door for scanning"
        url={scannerLink}
        icon="scanner"
      />
    </div>
  );
}
