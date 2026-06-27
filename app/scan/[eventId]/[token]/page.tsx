"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function PublicScannerPage() {
  const [event, setEvent] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [checkinCount, setCheckinCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const registryRef = useRef<Map<string, any>>(new Map());
  const checkedInRef = useRef<Set<string>>(new Set());
  const offlineQueueRef = useRef<{regId:string;payload:string;name:string;time:string}[]>([]);
  const scannerRef = useRef<any>(null);
  const params = useParams();
  const eventId = params.eventId as string;
  const token = params.token as string;

  const flushQueue = useCallback(async () => {
    if (offlineQueueRef.current.length === 0) return;
    setSyncing(true);
    const queue = [...offlineQueueRef.current];
    offlineQueueRef.current = [];
    for (const entry of queue) {
      try {
        await fetch("/api/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr_payload: entry.payload, event_id: eventId, scanner_token: token }) });
      } catch { offlineQueueRef.current.push(entry); }
    }
    setSyncing(false);
  }, [eventId, token]);

  useEffect(() => {
    const onOnline = () => { setOnline(true); flushQueue(); };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setOnline(navigator.onLine);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [flushQueue]);

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase.from("events").select("id,title,scanner_token,status").eq("id", eventId).single();
      if (!ev || ev.scanner_token !== token) { setAuthError(true); setLoading(false); return; }
      if (ev.status === "ended") { setAuthError(true); setLoading(false); return; }
      setEvent(ev);
      const { data: regs } = await supabase.from("registrations").select("id,guest_name,checked_in,checked_in_at,status,event_id").eq("event_id", eventId).limit(500);
      const registry = new Map();
      let count = 0;
      (regs || []).forEach((r: any) => {
        registry.set(r.id, r);
        if (r.checked_in) { checkedInRef.current.add(r.id); count++; }
      });
      registryRef.current = registry;
      setCheckinCount(count);
      setLoading(false);
    }
    load();
  }, [eventId, token]);

  async function handleCheckin(qrPayload: string) {
    const parts = qrPayload.split(":");
    const regId = parts[2] || "";
    const localReg = registryRef.current.get(regId);
    if (!localReg) { setResult({ success: false, reason: "not_found", message: "Ticket not found" }); return; }
    if (localReg.status === "pending") { setResult({ success: false, reason: "unpaid", message: "Payment pending — entry not permitted", name: localReg.guest_name }); return; }
    if (checkedInRef.current.has(regId)) {
      const reg = registryRef.current.get(regId);
      setResult({ success: false, reason: "already_checked_in", message: "Already checked in", name: reg?.guest_name, time: reg?.checked_in_at });
      return;
    }
    checkedInRef.current.add(regId);
    const checkinTime = new Date().toISOString();
    registryRef.current.set(regId, { ...localReg, checked_in: true, checked_in_at: checkinTime });
    setCheckinCount(prev => prev + 1);
    setResult({ success: true, message: "Welcome", name: localReg.guest_name, time: checkinTime, offline: !online });
    if (online) {
      try {
        const res = await fetch("/api/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr_payload: qrPayload, event_id: eventId, scanner_token: token }) });
        const data = await res.json();
        if (!data.success && data.reason === "already_checked_in") {
          checkedInRef.current.delete(regId);
          registryRef.current.set(regId, localReg);
          setCheckinCount(prev => prev - 1);
          setResult({ success: false, reason: "already_checked_in", message: "Already checked in on another device", name: data.name, time: data.time });
        }
      } catch { offlineQueueRef.current.push({ regId, payload: qrPayload, name: localReg.guest_name, time: checkinTime }); }
    } else {
      offlineQueueRef.current.push({ regId, payload: qrPayload, name: localReg.guest_name, time: checkinTime });
    }
  }

  async function startScanner() {
    setScanning(true); setResult(null); setError("");
    await new Promise(r => setTimeout(r, 500));
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("staff-qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decoded: string) => {
          if (decoded.startsWith("presence:entry:")) {
            await scanner.stop(); setScanning(false); await handleCheckin(decoded);
          }
        }, () => {}
      );
    } catch { setScanning(false); setError("Camera not available. Check permissions."); }
  }

  function stopScanner() { scannerRef.current?.stop().catch(() => {}); setScanning(false); }
  function scanNext() { setResult(null); setError(""); startScanner(); }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(124,106,255,0.1)", border: "1px solid rgba(124,106,255,0.2)" }} />
        <div style={{ height: "12px", width: "120px", borderRadius: "4px", background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );

  if (authError) return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "32px", marginBottom: "16px" }}>⛔</p>
        <p style={{ fontSize: "16px", color: "#f87171", marginBottom: "8px", fontWeight: "600" }}>Invalid scanner link</p>
        <p style={{ fontSize: "13px", color: "#6b6880" }}>This link is invalid or the event has ended.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", padding: "24px 20px", fontFamily: "var(--font-inter),-apple-system,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "15px", fontWeight: "600", color: "#f1f0f5", margin: 0 }}>{event?.title}</p>
          <p style={{ fontSize: "11px", color: "#6b6880", letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>Staff Scanner</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: online ? "#34d399" : "#f87171" }} />
          <span style={{ fontSize: "11px", color: online ? "#34d399" : "#f87171" }}>{online ? "Live" : "Offline"}</span>
        </div>
      </div>

      {!online && (
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: "#fbbf24", margin: 0 }}>⚡ Offline mode — scanning from local registry.</p>
        </div>
      )}

      {syncing && (
        <div style={{ background: "rgba(124,106,255,0.08)", border: "1px solid rgba(124,106,255,0.2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: "#7c6aff", margin: 0 }}>Syncing offline check-ins...</p>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg,rgba(124,106,255,0.15),rgba(124,106,255,0.05))", borderRadius: "20px", padding: "20px", marginBottom: "24px", border: "1px solid rgba(124,106,255,0.2)" }}>
        <p style={{ fontSize: "40px", fontWeight: "700", color: "#7c6aff", lineHeight: "1", marginBottom: "4px" }}>{checkinCount}</p>
        <p style={{ fontSize: "13px", color: "#6b6880", margin: 0 }}>checked in · {registryRef.current.size} registered</p>
      </div>

      {!scanning && !result && (
        <div>
          <button onClick={startScanner} style={{ width: "100%", padding: "18px", borderRadius: "16px", background: "linear-gradient(135deg,#7c6aff,#5b4fd4)", color: "#fff", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", boxShadow: "0 8px 24px rgba(124,106,255,0.3)" }}>Open Camera</button>
          {error && <p style={{ color: "#f87171", fontSize: "13px", textAlign: "center", marginTop: "16px" }}>{error}</p>}
        </div>
      )}

      {scanning && (
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "320px", margin: "0 auto 24px" }}>
            <div id="staff-qr-reader" style={{ width: "100%", borderRadius: "16px", overflow: "hidden", background: "#1a1a24" }} />
            <div style={{ position: "absolute", inset: 0, border: "2px solid #7c6aff", borderRadius: "16px", pointerEvents: "none" }} />
          </div>
          <button onClick={stopScanner} style={{ padding: "12px 32px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", color: "#6b6880", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      {result && (
        <div style={{ textAlign: "center" }}>
          <div style={{ background: result.success ? "rgba(52,211,153,0.1)" : result.reason === "already_checked_in" ? "rgba(124,106,255,0.1)" : "rgba(248,113,113,0.1)", borderRadius: "24px", padding: "40px 24px", marginBottom: "24px", border: "1px solid " + (result.success ? "rgba(52,211,153,0.3)" : result.reason === "already_checked_in" ? "rgba(124,106,255,0.3)" : "rgba(248,113,113,0.3)") }}>
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>{result.success ? "✓" : result.reason === "already_checked_in" ? "↩" : "✗"}</p>
            <p style={{ fontSize: "22px", fontWeight: "600", marginBottom: "8px", color: result.success ? "#34d399" : result.reason === "already_checked_in" ? "#7c6aff" : "#f87171" }}>{result.message}</p>
            {result.name && <p style={{ fontSize: "18px", color: "#f1f0f5", marginBottom: "6px", fontWeight: "500" }}>{result.name}</p>}
            {result.reason === "already_checked_in" && result.time && (
              <p style={{ fontSize: "12px", color: "#6b6880", marginTop: "8px" }}>First scanned at {new Date(result.time).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</p>
            )}
            {result.offline && <p style={{ fontSize: "11px", color: "#fbbf24", marginTop: "8px" }}>⚡ Offline — will sync when connected</p>}
          </div>
          <button onClick={scanNext} style={{ width: "100%", padding: "16px", borderRadius: "16px", background: "linear-gradient(135deg,#7c6aff,#5b4fd4)", color: "#fff", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>Scan Next →</button>
        </div>
      )}
    </div>
  );
}
