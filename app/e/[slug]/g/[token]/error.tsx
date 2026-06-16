"use client";

import { useEffect } from "react";

export default function GuestRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Guest route error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#FDFBF7",
        padding: "24px",
        fontFamily: "monospace",
        fontSize: "12px",
        lineHeight: "1.6",
        wordBreak: "break-word",
      }}
    >
      <p style={{ color: "#F97316", fontSize: "14px", marginBottom: "16px", fontWeight: "bold" }}>
        DIAGNOSTIC ERROR VIEW (temporary)
      </p>
      <p style={{ color: "#fff", marginBottom: "8px" }}>
        <strong>Message:</strong> {error.message || "(no message)"}
      </p>
      {error.digest && (
        <p style={{ color: "#888", marginBottom: "8px" }}>
          <strong>Digest:</strong> {error.digest}
        </p>
      )}
      <p style={{ color: "#888", marginBottom: "16px" }}>
        <strong>Stack:</strong>
      </p>
      <pre style={{ whiteSpace: "pre-wrap", color: "#aaa", background: "#111", padding: "12px", borderRadius: "8px" }}>
        {error.stack || "(no stack available)"}
      </pre>
      <button
        onClick={reset}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#F97316",
          color: "#000",
          border: "none",
          borderRadius: "8px",
          fontFamily: "monospace",
        }}
      >
        Try again
      </button>
    </div>
  );
}
