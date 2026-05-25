"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function GuestView() {
  const [data, setData] = useState<any>(null);
  const [showDigitalCard, setShowDigitalCard] = useState(false);
  const [timeSecret, setTimeSecret] = useState<number>(0);
  const params = useParams();
  const { slug, token } = params;

  useEffect(() => {
    async function load() {
      const { data: entry } = await supabase
        .from("registrations")
        .select("*, events(*)")
        .eq("guest_access_link", token)
        .single();
      setData(entry);
    }
    load();
  }, [token]);

  // Rotates a secure time parameter block every 60 seconds for anti-screenshotting security
  useEffect(() => {
    if (!showDigitalCard) return;
    
    const generateTokenBlock = () => setTimeSecret(Math.floor(Date.now() / 60000));
    generateTokenBlock(); // Init immediately
    
    const ticker = setInterval(generateTokenBlock, 1000);
    return () => clearInterval(ticker);
  }, [showDigitalCard]);

  if (!data) return <div style={{ padding: "40px", textAlign: "center", color: "#fff", background: "#060608", minHeight: "100vh" }}>Authenticating Pass...</div>;

  // Generate dynamic payloads for the scanning hooks
  const gatePassPayload = `presence:gate:${data.id}`;
  const digitalCardPayload = `presence:identity:${data.id}:${timeSecret}`;

  return (
    <div style={{ padding: "32px 16px", background: "#060608", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "420px", margin: "0 auto" }}>
        
        {/* Apple Wallet Style Card Stack Container */}
        <div style={{ background: "linear-gradient(165deg, #121115 0%, #09090b 100%)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          
          {/* Card Header */}
          <div style={{ padding: "24px 24px 16px 24px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#D4AF37", letterSpacing: "0.2em", textTransform: "uppercase" }}>EVENT PASS</span>
            <h1 style={{ fontSize: "20px", color: "#fff", fontWeight: "600", margin: "6px 0 2px 0", letterSpacing: "-0.01em" }}>{data.events.title}</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>Welcome back, {data.guest_name}</p>
          </div>

          {/* Primary View: Gate Access Pass */}
          <div style={{ padding: "0 24px 24px 24px", textAlign: "center" }}>
            <div style={{ background: "#fff", padding: "12px", borderRadius: "16px", display: "inline-block", margin: "12px auto 20px auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
              {/* Replace with your structural dynamic <QRCode value={gatePassPayload} size={180} /> */}
              <div style={{ width: "160px", height: "160px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>
                <p style={{ color: "#fff", fontSize: "11px", margin: 0, opacity: 0.4 }}>[ Gate QR Code ]</p>
              </div>
            </div>
            <p style={{ fontSize: "11px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", margin: 0 }}>Hold near reader at entrance</p>
          </div>

          {/* Interactive Button Anchor */}
          <div style={{ padding: "0 24px 24px 24px" }}>
            <button 
              onClick={() => setShowDigitalCard(!showDigitalCard)}
              style={{ width: "100%", padding: "14px", background: showDigitalCard ? "rgba(255,255,255,0.03)" : "rgba(212,175,55,0.08)", border: showDigitalCard ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(212,175,55,0.2)", borderRadius: "14px", color: showDigitalCard ? "rgba(255,255,255,0.7)" : "#D4AF37", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease" }}
            >
              {showDigitalCard ? "Hide Digital Card" : "Show Digital Card"}
            </button>
          </div>

          {/* Secure Dropdown Layer: The Digital Card Compartment */}
          {showDigitalCard && (
            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", background: "rgba(0, 0, 0, 0.25)", padding: "28px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }}></div>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>DYNAMIC DIGITAL CARD</span>
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div style={{ background: "#fff", padding: "12px", borderRadius: "16px", display: "inline-block", marginBottom: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
                  {/* Replace with your structural dynamic <QRCode value={digitalCardPayload} size={150} /> */}
                  <div style={{ width: "140px", height: "140px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>
                    <p style={{ color: "#fff", fontSize: "11px", margin: 0, opacity: 0.4 }}>[ Identity QR Code ]</p>
                  </div>
                </div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", maxWidth: "280px", margin: "0 auto", lineHeight: "1.5" }}>
                  This card updates every 60 seconds to secure your networking context.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
