"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TicketsAndRevenuePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [pendingRegs, setPendingRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadFinancialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: hostEvents } = await supabase
        .from("events")
        .select("id, title, venue, start_time")
        .eq("host_id", user.id);

      if (!hostEvents || hostEvents.length === 0) {
        setEvents([]);
        setPendingRegs([]);
        return;
      }

      setEvents(hostEvents);
      const eventIds = hostEvents.map(e => e.id);

      // Expanded selection to capture phone and complete purchase tracks
      const { data: regs } = await supabase
        .from("registrations")
        .select(`
          id,
          event_id,
          guest_name,
          guest_email,
          guest_phone,
          amount,
          status,
          mpesa_receipt,
          ticket_type_id
        `)
        .in("event_id", eventIds);

      const { data: tiers } = await supabase
        .from("ticket_types")
        .select("id, name")
        .in("event_id", eventIds);

      const tierMap = (tiers || []).reduce((acc: any, t: any) => {
        acc[t.id] = t.name;
        return acc;
      }, {});

      const processedRegs = (regs || []).map((r: any) => ({
        ...r,
        eventName: hostEvents.find(e => e.id === r.event_id)?.title || "Unknown Event",
        tierName: tierMap[r.ticket_type_id] || "Standard Pass"
      }));

      setPendingRegs(processedRegs);
    } catch (err) {
      console.error("Ledger processing error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleApproveRegistration = async (regId: string) => {
    setProcessingId(regId);
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ status: "confirmed", paid: true })
        .eq("id", regId);

      if (error) throw error;
      await loadFinancialData();
    } catch (err) {
      console.error("Failed to approve access pass:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmedRegs = pendingRegs.filter(r => r.status === "confirmed" || r.paid === true);
  const grossRevenue = confirmedRegs.reduce((sum, r) => sum + (r.amount || 0), 0);
  const platformFee = grossRevenue * 0.05;
  const hostPayout = grossRevenue * 0.95;

  const awaitingClearance = pendingRegs.filter(r => r.status === "pending_verification");

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.2em" }}>OPENING SECURE LEDGER...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: "40px 24px", color: "#fff", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#F59E0B", textTransform: "uppercase", marginBottom: "8px" }}>Oreeti Managed Workspace</p>
          <h1 style={{ fontSize: "24px", fontWeight: "600", letterSpacing: "-0.02em", margin: 0 }}>Tickets & Revenue</h1>
        </div>

        {/* Custodial Balance Card */}
        <div style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "24px", padding: "28px", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "16px" }}>Escrow Payout Manifest (DTB Paybill)</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "24px", marginBottom: "24px" }}>
            <div>
              <span style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "4px" }}>Gross Ticket Volume</span>
              <span style={{ fontSize: "22px", fontWeight: "700", fontFamily: "monospace" }}>{grossRevenue.toLocaleString()} KES</span>
            </div>
            <div>
              <span style={{ display: "block", color: "#F59E0B", fontSize: "12px", marginBottom: "4px" }}>Your Net Balance (95%)</span>
              <span style={{ fontSize: "22px", fontWeight: "700", fontFamily: "monospace", color: "#F59E0B" }}>{hostPayout.toLocaleString()} KES</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>Oreeti Infrastructure Processing Fee (5%)</span>
            <span style={{ fontFamily: "monospace", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>-{platformFee.toLocaleString()} KES</span>
          </div>
        </div>

        {/* Live Ledger Feed */}
        <div>
          <h2 style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>
            Live Entry Feed ({awaitingClearance.length} Pending)
          </h2>

          {awaitingClearance.length === 0 ? (
            <div style={{ border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "20px", padding: "48px 24px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>All pipelines clear. Tap an individual ticket row to review details instantly.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {awaitingClearance.map((reg) => (
                <div key={reg.id} style={{ background: "#060608", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "18px", padding: "24px" }}>
                  
                  {/* Detailed Guest Grid Layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "16px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "2px" }}>Guest Identity</span>
                      <span style={{ fontSize: "15px", fontWeight: "500", color: "#fff", display: "block" }}>{reg.guest_name}</span>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>{reg.guest_phone || "No Phone Registered"}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "2px" }}>Ticket Tier</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#F59E0B" }}>{reg.tierName}</span>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "block" }}>{reg.eventName}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Transaction Reference</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", fontFamily: "monospace", color: "#fff" }}>{reg.mpesa_receipt || "AWAITING CODE"}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Amount Stated</span>
                      <span style={{ fontSize: "16px", fontWeight: "700", fontFamily: "monospace", color: "#fff" }}>{reg.amount} KES</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApproveRegistration(reg.id)}
                    disabled={processingId === reg.id}
                    style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#fff", color: "#000", fontWeight: "600", fontSize: "12px", border: "none", letterSpacing: "0.03em", textTransform: "uppercase", cursor: processingId === reg.id ? "not-allowed" : "pointer" }}
                  >
                    {processingId === reg.id ? "Authorizing Entrance Pass..." : "Verify & Approve Entrance"}
                  </button>
                  
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
