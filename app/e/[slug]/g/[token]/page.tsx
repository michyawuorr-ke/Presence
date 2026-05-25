"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function GuestExperienceEngine() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"scene" | "networking" | "ticket" | "profile">("scene");
  const [loading, setLoading] = useState(true);
  
  // Real-time Anonymous Scene Metrics
  const [auraActiveCount, setAuraActiveCount] = useState(0);
  const [handshakeCount, setHandshakeCount] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const params = useParams();
  const { slug, token } = params;

  // Real-time Context & Aggregation Engine
  async function syncSceneMetrics(eventId: string) {
    setMetricsLoading(true);
    try {
      const [auraRes, handshakeRes] = await Promise.all([
        supabase.from("guest_profiles").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("aura_active", true),
        supabase.from("handshakes").select("id", { count: "exact", head: true }).eq("event_id", eventId)
      ]);
      setAuraActiveCount(auraRes.count ?? 0);
      setHandshakeCount(handshakeRes.count ?? 0);
    } catch (err) {
      console.error("Metrics sync failure", err);
    }
    setMetricsLoading(false);
  }

  useEffect(() => {
    async function initExperience() {
      const { data: entry } = await supabase
        .from("registrations")
        .select(`
          *,
          events(*)
        `)
        .ilike("guest_access_link", `%${token}`)
        .single();
      
      if (entry?.events) {
        setData(entry);
        await syncSceneMetrics(entry.event_id);
      }
      setLoading(false);
    }
    initExperience();
  }, [token]);

  // Keep numbers fresh whenever user switches back to the Scene
  useEffect(() => {
    if (data?.event_id && activeTab === "scene") {
      syncSceneMetrics(data.event_id);
    }
  }, [activeTab]);

  // Helper to format date/time into a premium minimalist string
  const formatEventTime = (startStr: string, endStr: string) => {
    if (!startStr) return "";
    const start = new Date(startStr);
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    
    const formattedDate = start.toLocaleDateString('en-US', dateOptions);
    const formattedStart = start.toLocaleTimeString('en-US', timeOptions);
    
    if (endStr) {
      const end = new Date(endStr);
      const formattedEnd = end.toLocaleTimeString('en-US', timeOptions);
      return `${formattedDate} • ${formattedStart} - ${formattedEnd}`;
    }
    return `${formattedDate} • ${formattedStart}`;
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: "system-ui" }}>Syncing Atmosphere Context...</div>;
  if (!data || !data.events) return <div style={{ minHeight: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: "14px", fontFamily: "system-ui" }}>Pass Link Invalid or Expired</div>;

  return (
    <div style={{ background: "#060608", minHeight: "100vh", color: "#fff", padding: "32px 16px 140px 16px", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "420px", margin: "0 auto" }}>

        {/* ========================================================= */}
        {/* TAB 1: THE SCENE */}
        {activeTab === "scene" && (
          <div>
            {/* Context Metadata Block */}
            <div style={{ marginBottom: "36px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "24px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#D4AF37", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>YOU ARE CHECKED IN</span>
              <h1 style={{ fontSize: "26px", fontWeight: "600", margin: "0 0 10px 0", letterSpacing: "-0.02em", color: "#fff", lineHeight: "1.2" }}>
                {data.events.title}
              </h1>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
                  <span>📍</span>
                  <span>{data.events.venue || "Venue Room Framework"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>
                  <span>🕒</span>
                  <span>{formatEventTime(data.events.start_time, data.events.end_time)}</span>
                </div>
              </div>
            </div>

            {/* Atmospheric Velocity Metrics Block */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Room Density</h3>
                {metricsLoading && <span style={{ fontSize: "11px", color: "#D4AF37" }}>syncing...</span>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Metric Item 1: Active Networkers */}
                <div style={{ background: "linear-gradient(145deg, #121116 0%, #09090c 100%)", borderRadius: "20px", padding: "22px 20px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: "500" }}>⚡ Actively Networking</p>
                    <span style={{ fontSize: "28px", fontWeight: "500", color: "#fff", fontFamily: "monospace" }}>{auraActiveCount}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: "6px 0 0 0", lineHeight: "1.4" }}>Minds currently projecting an active Aura visibility signal.</p>
                </div>

                {/* Metric Item 2: Handshakes Exchanged */}
                <div style={{ background: "linear-gradient(145deg, #121116 0%, #09090b 100%)", borderRadius: "20px", padding: "22px 20px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: "500" }}>🤝 Handshakes Exchanged</p>
                    <span style={{ fontSize: "28px", fontWeight: "500", color: "#D4AF37", fontFamily: "monospace" }}>{handshakeCount}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: "6px 0 0 0", lineHeight: "1.4" }}>Successful mutual handshake profiles unlocked inside the space.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PLACEHOLDER STATES FOR OTHER TABS */}
        {activeTab === "networking" && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <h3>Radar Networking Framework</h3>
            <p style={{ fontSize: "13px" }}>Ready for integration stage.</p>
          </div>
        )}

        {activeTab === "ticket" && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <h3>Secure QR Access Ticket</h3>
            <p style={{ fontSize: "13px" }}>Ready for integration stage.</p>
          </div>
        )}

        {activeTab === "profile" && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <h3>Identity Configuration Profile</h3>
            <p style={{ fontSize: "13px" }}>Ready for integration stage.</p>
          </div>
        )}

        {/* ========================================================= */}
        {/* RIGID 40% ERGONOMIC THUMB-ZONE NAVIGATION BAR */}
        <div style={{ position: "fixed", bottom: "28px", left: "16px", right: "16px", background: "rgba(11, 10, 14, 0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "24px", padding: "6px 10px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", zIndex: 1000, boxShadow: "0 20px 40px rgba(0,0,0,0.7)" }}>
          {[
            { id: "scene", label: "Scene", icon: "✨" },
            { id: "networking", label: "Radar", icon: "📡" },
            { id: "ticket", label: "Pass", icon: "🎟️" },
            { id: "profile", label: "Profile", icon: "👤" }
          ].map((t) => {
            const isSelected = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ flex: 1, background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 0", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
                <span style={{ fontSize: "18px", opacity: isSelected ? 1 : 0.35, transform: isSelected ? "scale(1.08)" : "scale(1)", transition: "all 0.2s ease" }}>{t.icon}</span>
                <span style={{ fontSize: "10px", fontWeight: "600", color: isSelected ? "#D4AF37" : "rgba(255,255,255,0.3)", transition: "all 0.2s ease", letterSpacing: "0.02em" }}>{t.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
