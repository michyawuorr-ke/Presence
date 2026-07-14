"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface OverviewTabProps {
  event: any;
  stats: any;
  hostLink: string;
  timeToLive: string;
  onEventUpdate: (e: any) => void;
  onGoLive: () => void;
  onEndEvent: () => void;
  ending: boolean;
}

function copyText(text: string) {
  const el = document.createElement("textarea");
  el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
  document.body.appendChild(el); el.focus(); el.select();
  try { document.execCommand("copy"); } catch (_) {}
  document.body.removeChild(el);
}

export default function OverviewTab({ event, stats, hostLink, timeToLive, onEventUpdate, onGoLive, onEndEvent, ending }: OverviewTabProps) {
  const [bannerUrl, setBannerUrl] = useState(event?.banner_url || "");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const registrationLink = typeof window !== "undefined" ? `${window.location.origin}/register/${event.slug}` : "";

  function copy(text: string, key: string) {
    copyText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setBannerError("JPG, PNG or WebP only."); return; }
    if (file.size > 5 * 1024 * 1024) { setBannerError("Max 5MB."); return; }
    setBannerError(""); setUploadingBanner(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${event.id}/banner_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-banners").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("event-banners").getPublicUrl(path);
      await supabase.from("events").update({ banner_url: publicUrl }).eq("id", event.id);
      setBannerUrl(publicUrl);
      onEventUpdate({ ...event, banner_url: publicUrl });
    } catch { setBannerError("Upload failed."); }
    finally { setUploadingBanner(false); }
  }

  async function removeBanner() {
    if (!confirm("Remove banner?")) return;
    await supabase.from("events").update({ banner_url: null }).eq("id", event.id);
    setBannerUrl(""); onEventUpdate({ ...event, banner_url: null });
  }

  const statCard = (label: string, value: any, accent = "#f3f4f6") => (
    <div style={{ background: "linear-gradient(160deg,#16151a,#0f0e12)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
      <p style={{ fontSize: "24px", fontWeight: "700", color: accent, lineHeight: 1, marginBottom: "6px" }}>{value}</p>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: "500", letterSpacing: "0.02em", margin: 0 }}>{label}</p>
    </div>
  );

  return (
    <div style={{ padding: "0 16px 120px" }}>
      {/* Banner */}
      <div style={{ width: "100%", height: "180px", background: "#0a0a0c", position: "relative", overflow: "hidden", borderRadius: "16px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
        {bannerUrl ? (
          <>
            <img src={bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            <button onClick={removeBanner} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", padding: "5px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer" }}>Remove ×</button>
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <label style={{ padding: "9px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "20px", fontSize: "11px", cursor: "pointer", color: "rgba(255,255,255,0.35)" }}>
              {uploadingBanner ? "Uploading..." : "+ Add Banner"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerUpload} style={{ display: "none" }} />
            </label>
            {bannerError && <p style={{ fontSize: "11px", color: "#f87171", margin: 0 }}>{bannerError}</p>}
          </div>
        )}
      </div>

      {/* Event card */}
      <div style={{ background: "linear-gradient(160deg,#16151a,#0f0e12)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#f3f4f6", margin: 0, flex: 1, marginRight: "12px" }}>{event.title}</h1>
          <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: event.status === "live" ? "#D4AF37" : event.status === "ended" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)", background: event.status === "live" ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.08em", border: event.status === "live" ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" }}>{event.status}</span>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: "0 0 4px" }}>📍 {event.venue}</p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
          🗓 {new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          {event.end_time && new Date(event.end_time).toDateString() !== new Date(event.start_time).toDateString() && (
            <span> → {new Date(event.end_time).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
          )}
        </p>
      </div>

      {/* Live countdown */}
      {event.status === "scheduled" && timeToLive && (
        <div style={{ background: "rgba(212,175,55,0.05)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(212,175,55,0.15)", textAlign: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", color: "#D4AF37", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Goes live in</p>
          <p style={{ fontSize: "36px", fontWeight: "700", color: "#D4AF37", margin: 0 }}>{timeToLive}</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {statCard("Registered", stats.registrations)}
        {statCard("Checked in", stats.checkins, "#D4AF37")}
        {statCard("On Aura", stats.onAura, "#E26D34")}
        {statCard("Connections", stats.handshakes, "#a78bfa")}
      </div>

      {/* Links */}
      {(hostLink || registrationLink) && (
        <div style={{ background: "linear-gradient(160deg,#16151a,#0f0e12)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>Links</p>
          {registrationLink && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "0 0 2px" }}>Registration page</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", margin: 0, fontFamily: "monospace" }}>/register/{event.slug}</p>
              </div>
              <button onClick={() => copy(registrationLink, "reg")} style={{ padding: "6px 14px", borderRadius: "8px", background: copied === "reg" ? "rgba(226,109,52,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: copied === "reg" ? "#E26D34" : "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap" }}>
                {copied === "reg" ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
          {hostLink && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "12px", color: "#D4AF37", margin: "0 0 2px" }}>Your host link</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", margin: 0 }}>Enter as organizer</p>
              </div>
              <button onClick={() => copy(hostLink, "host")} style={{ padding: "6px 14px", borderRadius: "8px", background: copied === "host" ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: copied === "host" ? "#D4AF37" : "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap" }}>
                {copied === "host" ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {event.status === "draft" && (
        <button onClick={onGoLive} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "linear-gradient(135deg,#221b0f,#13100b)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.35)", fontSize: "14px", fontWeight: "700", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
          Publish Event
        </button>
      )}
      {event.status === "live" && (
        <button onClick={onEndEvent} disabled={ending} style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "transparent", color: "rgba(248,113,113,0.6)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "16px" }}>
          {ending ? "Ending..." : "End Event"}
        </button>
      )}
    </div>
  );
}
