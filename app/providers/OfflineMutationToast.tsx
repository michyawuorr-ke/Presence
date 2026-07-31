"use client";
import { useEffect, useState } from "react";
import { MUTATION_FAILED_EVENT } from "./QueryProvider";

// Listens for the custom event QueryProvider's MutationCache dispatches
// when a mutation ultimately fails (after retries are exhausted — see the
// comment in QueryProvider.tsx). This is deliberately separate from each
// screen's own local toast state (ConnectionsTab, NetworkingTab, etc all
// have their own showToast already) — this one specifically catches the
// case those can't: an action that was queued while offline and only
// fails later, after the component that triggered it may have already
// unmounted or moved to a different screen.
export default function OfflineMutationToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function handleFailure(e: Event) {
      const detail = (e as CustomEvent).detail;
      setMessage("Something didn't go through — " + (detail?.message || "please try again"));
      setTimeout(() => setMessage(null), 6000);
    }
    window.addEventListener(MUTATION_FAILED_EVENT, handleFailure);
    return () => window.removeEventListener(MUTATION_FAILED_EVENT, handleFailure);
  }, []);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(90px + env(safe-area-inset-bottom))",
        left: "16px",
        right: "16px",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(20,16,14,0.95)",
          border: "1px solid rgba(226,109,52,0.3)",
          borderRadius: "12px",
          padding: "12px 16px",
          maxWidth: "420px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        <p style={{ color: "#f0ede8", fontSize: "13px", margin: 0, textAlign: "center" }}>
          ⚠ {message}
        </p>
      </div>
    </div>
  );
}
