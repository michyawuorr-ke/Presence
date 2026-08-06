"use client";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", textAlign: "center", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <p style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 28px" }}>
        <span style={{ color: "#ffffff" }}>Or</span>
        <span style={{ color: "#E26D34" }}>ee</span>
        <span style={{ color: "#ffffff" }}>ti</span>
      </p>
      <p style={{ fontSize: "16px", fontWeight: 600, color: "#f0ede8", margin: "0 0 8px" }}>Something went wrong</p>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.6, maxWidth: "280px" }}>
        This page hit an unexpected error. Nothing you've saved was affected.
      </p>
      <button
        onClick={reset}
        style={{ padding: "12px 28px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
