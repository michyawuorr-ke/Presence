// Shared scanning engine used by both:
//   /dashboard/scanner/[eventId]  — host-authenticated
//   /scan/[eventId]/[token]       — staff token-authenticated
// Each page handles its own auth; this hook owns the QR decode,
// offline queue, and /api/checkin fetch.

import { useRef, useState, useCallback, useEffect } from "react";

export interface ScanResult {
  success: boolean;
  name?: string;
  reason?: string;
  message?: string;
  time?: string;
}

interface UseScannerCoreOptions {
  eventId: string;
  scannerToken: string;
}

export function useScannerCore({ eventId, scannerToken }: UseScannerCoreOptions) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [checkinCount, setCheckinCount] = useState(0);

  const registryRef = useRef<Map<string, any>>(new Map());
  const checkedInRef = useRef<Set<string>>(new Set());
  const offlineQueueRef = useRef<{ regId: string; payload: string; name: string; time: string }[]>([]);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const flushQueue = useCallback(async () => {
    if (offlineQueueRef.current.length === 0) return;
    setSyncing(true);
    const queue = [...offlineQueueRef.current];
    offlineQueueRef.current = [];
    for (const entry of queue) {
      try {
        await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr_payload: entry.payload, event_id: eventId, scanner_token: scannerToken }),
        });
      } catch (_) {
        offlineQueueRef.current.push(entry);
      }
    }
    setSyncing(false);
  }, [eventId, scannerToken]);

  useEffect(() => {
    if (online) flushQueue();
  }, [online, flushQueue]);

  const handleScan = useCallback(async (qrPayload: string) => {
    if (scanning) return;
    setScanning(true);
    setError("");
    const time = new Date().toLocaleTimeString();
    if (!online) {
      offlineQueueRef.current.push({ regId: "", payload: qrPayload, name: "Unknown", time });
      setResult({ success: true, name: "Queued (offline)", message: "Will sync when connection returns", time });
      setCheckinCount(c => c + 1);
      setTimeout(() => { setResult(null); setScanning(false); }, 3000);
      return;
    }
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_payload: qrPayload, event_id: eventId, scanner_token: scannerToken }),
      });
      const body = await res.json();
      setResult({ ...body, time });
      if (body.success) setCheckinCount(c => c + 1);
      setTimeout(() => { setResult(null); setScanning(false); }, 3000);
    } catch (_) {
      offlineQueueRef.current.push({ regId: "", payload: qrPayload, name: "Unknown", time });
      setResult({ success: true, name: "Queued (offline)", message: "Will sync when connection returns", time });
      setCheckinCount(c => c + 1);
      setTimeout(() => { setResult(null); setScanning(false); }, 3000);
    }
  }, [scanning, online, eventId, scannerToken]);

  return {
    result, error, setError,
    scanning, setScanning,
    online, syncing,
    checkinCount,
    registryRef, checkedInRef, offlineQueueRef, scannerRef,
    handleScan, flushQueue,
  };
}
