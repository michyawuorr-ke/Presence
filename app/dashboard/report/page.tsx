"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TicketsAndRevenuePage() {
  const [pendingRegs, setPendingRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadFinancialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: hostEvents } = await supabase
        .from("events")
        .select("id, title")
        .eq("host_id", user.id);

      if (!hostEvents || hostEvents.length === 0) return;
      const eventIds = hostEvents.map(e => e.id);

      const { data: regs } = await supabase
        .from("registrations")
        .select("id, event_id, guest_name, guest_email, guest_phone, amount, status, mpesa_receipt, ticket_type_id")
        .in("event_id", eventIds);

      const processed = (regs || []).map((r: any) => ({
        ...r,
        eventName: hostEvents.find(e => e.id === r.event_id)?.title || "Event",
        tierName: "Standard Pass"
      }));
      setPendingRegs(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleApprove = async (regId: string) => {
    setProcessingId(regId);
    try {
      await supabase.from("registrations").update({ status: "confirmed", paid: true }).eq("id", regId);
      await loadFinancialData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmed = pendingRegs.filter(r => r.status === "confirmed" || r.paid === true);
  const gross = confirmed.reduce((sum, r) => sum + (r.amount || 0), 0);
  const awaitingClearance = pendingRegs.filter(r => r.status === "pending_verification" || r.status === "pending");

  if (loading) return (<div style={{ background: "#000", minHeight: "100vh", padding: "40px 24px" }}><div style={{ maxWidth: "680px", margin: "0 auto" }}><div style={{ height: "20px", width: "35%", borderRadius: "6px", background: "rgba(255,255,255,0.04)", marginBottom: "8px" }}/><div style={{ height: "14px", width: "20%", borderRadius: "4px", background: "rgba(255,255,255,0.03)", marginBottom: "32px" }}/><div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", marginBottom: "32px", height: "100px" }}/><div style={{ height: "80px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", marginBottom: "10px" }}/><div style={{ height: "80px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", marginBottom: "10px" }}/><div style={{ height: "80px", borderRadius: "12px", background: "rgba(255,255,255,0.02)" }}/></div></div>);

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: "40px 24px", color: "#fff" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#F59E0B", textTransform: "uppercase" }}>Oreeti Workspace</p>
          <h1 style={{ fontSize: "24px", fontWeight: "600", margin: "4px 0 0 0" }}>Tickets & Revenue</h1>
        </div>

        <div style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Gross Volume (Escrow Balance)</span>
          <span style={{ display: "block", fontSize: "24px", fontWeight: "700", color: "#F59E0B", fontFamily: "monospace", marginTop: "4px" }}>{gross.toLocaleString()} KES</span>
        </div>

        <h2 style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "16px" }}>Live Entry Feed ({awaitingClearance.length} Pending)</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {awaitingClearance.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No tickets currently awaiting clearance.</p>
          ) : (
            awaitingClearance.map(reg => (
              <div key={reg.id} style={{ background: "#060608", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "14px", fontWeight: "500" }}>{reg.guest_name}</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{reg.guest_phone}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "12px", color: "#F59E0B" }}>{reg.tierName}</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", fontFamily: "monospace" }}>{reg.amount} KES</span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
                  Ref: <span style={{ fontFamily: "monospace", color: "#fff" }}>{reg.mpesa_receipt || "AWAITING"}</span>
                </div>
                <button onClick={() => handleApprove(reg.id)} disabled={processingId === reg.id} style={{ width: "100%", padding: "12px", background: "#fff", color: "#000", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}>
                  {processingId === reg.id ? "Approving..." : "Verify & Approve Entrance"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
