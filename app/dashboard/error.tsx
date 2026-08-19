"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#08080a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", textAlign: "center" }}>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", margin: "0 0 28px" }}>
        Couldn't connect.
      </p>
      <button onClick={reset}
        style={{ padding: "12px 28px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
        Reload
      </button>
    </div>
  );
}
