"use client";
import Wordmark from "@/components/Wordmark";

// Catches errors thrown by the root layout itself (not just page content),
// which app/error.tsx can't do — Next.js requires this file to render its
// own <html>/<body> since the real root layout has failed to render.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0c", color: "#EAE6DF", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 28px" }}>
            <span style={{ color: "#ffffff" }}>Or</span>
            <span style={{ color: "#E26D34" }}>ee</span>
            <span style={{ color: "#ffffff" }}>ti</span>
          </p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#f0ede8", margin: "0 0 8px" }}>Something went wrong</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.6, maxWidth: "280px" }}>
            The app hit an unexpected error loading. Try reloading — if it keeps happening, let us know.
          </p>
          <button
            onClick={reset}
            style={{ padding: "12px 28px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
