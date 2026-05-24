'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function OrganizerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [platformValue, setPlatformValue] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setOrganisation(data.organisation || '');
        setPlatformValue(data.platform_value || '');
      }
    }
    loadProfile();
  }, []);

  return (
    <div style={{ padding: "24px 16px", background: "#08080a", minHeight: "100vh" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: "32px", textAlign: "center", fontWeight: "600" }}>
        Organizer Identity
      </p>

      {/* ── Premium Luxury Profile Card (Matches Reference Screenshot Perfectly) ── */}
      <div style={{
        background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)",
        borderRadius: "28px",
        padding: "28px 24px 20px 24px",
        marginBottom: "24px",
        border: "1px solid rgba(255, 255, 255, 0.04)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Luxury Background Ambient Glow */}
        <div style={{
          position: "absolute",
          top: "-80px",
          left: "-40px",
          width: "220px",
          height: "220px",
          background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 75%)",
          pointerEvents: "none"
        }} />

        {/* Floating Absolute Top-Right Circle Edit Button */}
        <button 
          onClick={() => setEditing(!editing)} 
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255, 255, 255, 0.45)",
            fontSize: "15px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 10
          }}
        >
          {editing ? "✕" : "✎"}
        </button>

        {/* Profile Details Header Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg, #221b0f, #13100b)",
            border: "1px solid rgba(212,175,55,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            fontWeight: "600",
            color: "#D4AF37",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
            {displayName.charAt(0).toUpperCase() || "O"}
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingRight: "40px" }}>
            <p style={{ fontSize: "21px", fontWeight: "600", color: "#f3f4f6", letterSpacing: "-0.01em", margin: "0 0 6px" }}>
              {displayName || "Unnamed Organizer"}
            </p>
            
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{
                display: "inline-block",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#d4af37",
                background: "rgba(212,175,55,0.07)",
                border: "1px solid rgba(212,175,55,0.18)",
                padding: "3px 10px",
                borderRadius: "20px",
              }}>
                ORGANIZER
              </span>

              {organisation && (
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", fontWeight: "400", marginLeft: "4px" }}>
                  {organisation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio Frame */}
        {bio && (
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.55)", margin: "0 0 24px 0" }}>
            {bio}
          </p>
        )}

        {/* Full-width Divider Line */}
        <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.04)", margin: "0 -24px 16px -24px" }} />

        {/* Isolated Premium Center Link Footer Row */}
        {platformValue && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </span>
            <span style={{ fontSize: "14px", color: "#93c5fd", fontWeight: "500", letterSpacing: "-0.01em" }}>
              {platformValue}
            </span>
          </div>
        )}
      </div>

      {/* Editing Dropdown Inputs — Rendered below card when active */}
      {editing && (
        <div style={{ background: "#111015", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <input className="premium-input-well" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" />
          <input className="premium-input-well" value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation / Company" />
          <input className="premium-input-well" value={platformValue} onChange={e => setPlatformValue(e.target.value)} placeholder="Website link URL" />
          <textarea className="premium-input-well" value={bio} onChange={e => setBio(e.target.value)} placeholder="Short Bio" style={{ minHeight: "80px", resize: "none" }} />
        </div>
      )}
    </div>
  );
}
