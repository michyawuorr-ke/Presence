"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TicketsPage() {
  const [stats, setStats] = useState({
    total: 0, confirmed: 0, pending: 0, failed: 0, revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: events } = await supabase
        .from("events").select("id").eq("host_id", user.id);
      if (!events?.length) { setLoading(false); return; }
      const ids = events.map((e: any) => e.id);
      const { data: regs } = await supabase
        .from("registrations").select("*").in("event_id", ids);
      if (!regs) { setLoading(false); return; }
      setStats({
        total: regs.length,
        confirmed: regs.filter((r: any) => r.status === "confirmed").length,
        pending: regs.filter((r: any) => r.status === "pending_payment").length,
        failed: regs.filter((r: any) => r.status === "failed").length,
        revenue: regs.filter((r: any) => r.paid).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0),
      });
      setLoading(false);
    }
    load();
  }, []);

  const card = (label: string, value: string | number, color = "#0a0a0b") => (
    <div style={{background:"#fff",borderRadius:"20px",padding:"20px",
      border:"1px solid rgba(0,0,0,0.06)",marginBottom:"12px"}}>
      <p style={{fontSize:"13px",color:"#999",marginBottom:"8px"}}>{label}</p>
      <p style={{fontSize:"28px",fontWeight:"500",color}}>{value}</p>
    </div>
  );

  if (loading) return (<div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}><div style={{ height: "22px", width: "40%", borderRadius: "6px", background: "rgba(255,255,255,0.04)", marginBottom: "24px" }}/><div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "20px", marginBottom: "12px", height: "88px" }}/><div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "20px", marginBottom: "12px", height: "88px" }}/><div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "20px", marginBottom: "12px", height: "88px" }}/><div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "20px", marginBottom: "12px", height: "88px" }}/><div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "20px", height: "88px" }}/></div>);

  return (
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <h1 style={{fontSize:"22px",fontWeight:"500",marginBottom:"24px"}}>Tickets & Revenue</h1>
      {card("Total Registrations", stats.total)}
      {card("Confirmed", stats.confirmed, "#16a34a")}
      {card("Pending Payment", stats.pending, "#d97706")}
      {card("Failed", stats.failed, "#ef4444")}
      {card("Total Revenue", "KES " + stats.revenue.toLocaleString(), "#2563eb")}
    </div>
  );
}