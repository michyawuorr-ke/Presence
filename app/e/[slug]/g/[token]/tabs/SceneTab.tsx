"use client";
import { PALETTE } from "./shared";

interface SceneTabProps {
  event: any;
  isLive: boolean;
  isEnded: boolean;
  countdown: { days: number; hours: number; minutes: number; seconds: number };
  networkingCount: number;
  connectionsCount: number;
  onGoNetworking: () => void;
  onViewConnections: () => void;
}

export default function SceneTab({
  event, isLive, isEnded, countdown,
  networkingCount, connectionsCount,
  onGoNetworking, onViewConnections,
}: SceneTabProps) {
  return (
    <div>
      {event?.banner_url && (
        <div style={{ width: "100%", height: "160px", overflow: "hidden", marginBottom: "4px" }}>
          <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
        </div>
      )}
      <div style={{ padding: "24px 20px" }}>
        <p style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "20px", fontFamily: "'Helvetica Neue',Arial,sans-serif" }}>
          <span style={{ color: "#ffffff" }}>Or</span>
          <span style={{ color: PALETTE.orange }}>ee</span>
          <span style={{ color: "#ffffff" }}>ti</span>
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: "500", color: "#f0ede8", marginBottom: "8px", letterSpacing: "-0.03em", lineHeight: "1.15" }}>
          {event?.title}
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(240,237,232,0.5)", marginBottom: "4px" }}>📍 {event?.venue}</p>
        <p style={{ fontSize: "13px", color: "rgba(240,237,232,0.35)", marginBottom: "28px" }}>
          {event && new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}
        </p>

        {isEnded ? (
          <div style={{ background: "linear-gradient(135deg,#0a0a0b,#1a1a1a)", borderRadius: "24px", padding: "28px", marginBottom: "16px", textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: "18px", marginBottom: "8px" }}>Event has ended</p>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>Your connections are saved</p>
            <button onClick={onViewConnections} style={{ padding: "12px 24px", borderRadius: "14px", background: "#fff", color: "#000", border: "none", fontSize: "14px", cursor: "pointer", fontWeight: "500" }}>
              View connections →
            </button>
          </div>
        ) : isLive ? (
          <>
            <div style={{ background: "#0c0c10", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid rgba(240,237,232,0.04)" }}>
              <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.7)}50%{box-shadow:0 0 0 8px rgba(74,222,128,0)}}`}</style>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s infinite" }} />
              <p style={{ color: "#fff", fontSize: "16px", fontWeight: "500", margin: 0 }}>Event is live</p>
            </div>
            <div style={{ background: "#0c0c10", borderRadius: "16px", padding: "20px", marginBottom: "12px", border: "1px solid rgba(240,237,232,0.04)" }}>
              <p style={{ fontSize: "10px", color: PALETTE.orange, marginBottom: "12px", letterSpacing: "0.15em", fontWeight: "600" }}>LIVE NOW</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(226,109,52,0.03)", borderRadius: "10px", padding: "12px 16px", border: "1px solid rgba(226,109,52,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "13px", color: PALETTE.orange, fontWeight: "500", margin: 0 }}>networking now</p>
                  <p style={{ fontSize: "22px", fontWeight: "300", color: PALETTE.orange, margin: 0 }}>{networkingCount}</p>
                </div>
                <div style={{ background: "rgba(226,109,52,0.03)", borderRadius: "10px", padding: "12px 16px", border: "1px solid rgba(226,109,52,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "28px", fontWeight: "700", color: PALETTE.orange, margin: 0 }}>{connectionsCount}</p>
                  <p style={{ fontSize: "12px", color: PALETTE.orange, fontWeight: "500", margin: 0 }}>handshakes exchanged</p>
                </div>
              </div>
              <button onClick={onGoNetworking} style={{ width: "100%", padding: "11px", borderRadius: "10px", background: "transparent", color: PALETTE.orange, border: `1px solid rgba(226,109,52,0.35)`, fontSize: "13px", cursor: "pointer", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Start Networking →
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: "linear-gradient(135deg,#0a0a0b,#1a1a1a)", borderRadius: "24px", padding: "28px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px", letterSpacing: "0.1em" }}>STARTS IN</p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
              {[{ v: countdown.days, l: "Days" }, { v: countdown.hours, l: "Hrs" }, { v: countdown.minutes, l: "Min" }, { v: countdown.seconds, l: "Sec" }].map(({ v, l }) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "32px", fontWeight: "300", color: "#fff", lineHeight: "1", margin: 0 }}>{String(v).padStart(2, "0")}</p>
                  <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
