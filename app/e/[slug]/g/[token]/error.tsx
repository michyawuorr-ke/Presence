"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", textAlign: "center" }}>
      <p style={{ fontSize: "28px", margin: "0 0 16px" }}>✦</p>
      <p style={{ fontSize: "16px", fontWeight: "600", color: "#f0ede8", margin: "0 0 8px" }}>Something went wrong</p>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: "1.6", maxWidth: "280px" }}>
        Your connection may have dropped or the event is loading. Try again — your progress is saved.
      </p>
      <button
        onClick={reset}
        style={{ padding: "12px 28px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(226,109,52,0.4)", color: "#E26D34", fontSize: "13px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.06em" }}>
        Try Again
      </button>
    </div>
  );
}
