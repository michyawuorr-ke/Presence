"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function GuestExperience() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"scene" | "networking" | "ticket" | "profile">("scene");
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const { slug, token } = params;

  useEffect(() => {
    async function load() {
      const { data: entry, error } = await supabase
        .from("registrations")
        .select("*, events(*)")
        .ilike("guest_access_link", `%${token}`)
        .single();
      
      if (entry) setData(entry);
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return <div style={{ minHeight: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Authenticating Pass...</div>;
  if (!data) return <div style={{ minHeight: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: "14px" }}>Pass Invalid or Expired</div>;

  return (
    <div style={{ background: "#060608", minHeight: "100vh", color: "#f3f4f6", padding: "24px 16px 120px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "420px", margin: "0 auto" }}>
        
        {/* Dynamic Context Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#D4AF37", letterSpacing: "0.2em" }}>{data.events.title}</span>
        </div>

        {/* Tab 1: The Scene */}
        {activeTab === "scene" && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.02em" }}>The Scene</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>You are securely checked into the atmosphere. Physical discovery updates are handled live.</p>
            <div style={{ marginTop: "40px", padding: "32px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px dashed rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>Atmospheric discovery engine ready</p>
            </div>
          </div>
        )}

        {/* Tab 2: Networking */}
        {activeTab === "networking" && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.02em" }}>Aura Connections</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>Mutual proximity-validated connection hub.</p>
            <div style={{ marginTop: "24px", padding: "20px", background: "#111015", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p style={{ fontSize: "14px", fontWeight: "500", color: "#D4AF37" }}>Opt-In Presence</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Activate mutual radar scanning to link profiles.</p>
            </div>
          </div>
        )}

        {/* Tab 3: Ticket Pass */}
        {activeTab === "ticket" && (
          <div style={{ background: "linear-gradient(165deg, #121115 0%, #09090b 100%)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#D4AF37", letterSpacing: "0.15em" }}>VERIFIED PASS</span>
            <h3 style={{ fontSize: "20px", fontWeight: "600", margin: "6px 0" }}>{data.guest_name}</h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "24px" }}>{data.ticket_type_id ? "Premium Admission" : "General Access"}</p>
            <div style={{ background: "#fff", padding: "12px", borderRadius: "16px", display: "inline-block", margin: "0 auto 16px auto", width: "160px", height: "160px" }}>
              <div style={{ width: "100%", height: "100%", background: "#1a1a1a", borderRadius: "8px" }} />
            </div>
          </div>
        )}

        {/* Tab 4: Profile */}
        {activeTab === "profile" && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.02em" }}>Guest Identity</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "24px" }}>Manage your temporary session card details.</p>
            <input defaultValue={data.guest_name} style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", color: "#fff", fontSize: "15px", outline: "none" }} placeholder="Your Display Name" />
          </div>
        )}

        {/* 40% Thumb-Zone Ergonomic Navigation Law Bar */}
        <div style={{ position: "fixed", bottom: "24px", left: "16px", right: "16px", background: "rgba(14, 13, 18, 0.85)", backdropFilter: "blur(20px)", borderRadius: "20px", padding: "8px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", zIndex: 100 }}>
          {[
            { id: "scene", label: "Scene", icon: "✨" },
            { id: "networking", label: "Radar", icon: "📡" },
            { id: "ticket", label: "Pass", icon: "🎟️" },
            { id: "profile", label: "Profile", icon: "👤" }
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ flex: 1, background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "12px 0", cursor: "pointer", outline: "none" }}>
                <span style={{ fontSize: "18px", opacity: isSel ? 1 : 0.4 }}>{tab.icon}</span>
                <span style={{ fontSize: "10px", fontWeight: "600", color: isSel ? "#D4AF37" : "rgba(255,255,255,0.3)" }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
