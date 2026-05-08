"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LivePage() {
  const [stats, setStats] = useState({
    checkins: 0, auraActive: 0, handshakes: 0, unlocks: 0
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

      const [checkins, aura, handshakes, unlocks] = await Promise.all([
        supabase.from("checkins").select("id", {count:"exact"}).in("event_id", ids).eq("is_duplicate", false),
        supabase.from("guest_profiles").select("id", {count:"exact"}).in("event_id", ids).eq("aura_active", true),
        supabase.from("handshakes").select("id", {count:"exact"}).in("event_id", ids),
        supabase.from("profile_unlocks").select("id", {count:"exact"}).in("event_id", ids),
      ]);

      setStats({
        checkins: checkins.count ?? 0,
        auraActive: aura.count ?? 0,
        handshakes: handshakes.count ?? 0,
        unlocks: unlocks.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const card = (label: string, value: number, color = "#0a0a0b", emoji = "") => (
    <div style={{background:"#fff",borderRadius:"20px",padding:"20px",
      border:"1px solid rgba(0,0,0,0.06)",marginBottom:"12px"}}>
      <p style={{fontSize:"13px",color:"#999",marginBottom:"8px"}}>{emoji} {label}</p>
      <p style={{fontSize:"36px",fontWeight:"500",color}}>{value}</p>
    </div>
  );

  if (loading) return <div style={{textAlign:"center",padding:"60px",color:"#999"}}>Loading...</div>;

  return (
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <h1 style={{fontSize:"22px",fontWeight:"500",marginBottom:"24px"}}>Attendance & Networking</h1>
      {card("Total Check-ins", stats.checkins, "#0a0a0b", "🎟")}
      {card("Guests on Aura", stats.auraActive, "#2563eb", "✦")}
      {card("Handshakes", stats.handshakes, "#7c3aed", "🤝")}
      {card("Connections Unlocked", stats.unlocks, "#16a34a", "🔓")}
    </div>
  );
}