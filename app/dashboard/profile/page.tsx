'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function OrganizerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [platformValue, setPlatformValue] = useState('');
  const [saving, setSaving] = useState(false);

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

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        display_name: displayName,
        bio: bio,
        organisation: organisation,
        platform_value: platformValue
      }).eq('id', user.id);
    }
    setSaving(false);
    setEditing(false);
  }

  return (
    <div style={{ padding: "24px 16px", background: "#08080a", minHeight: "100vh" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: "32px", textAlign: "center", fontWeight: "600" }}>Organizer Identity</p>

      <div style={{ background: "linear-gradient(160deg, #16151a 0%, #0f0e12 100%)", borderRadius: "28px", padding: "28px 24px 20px 24px", marginBottom: "24px", border: "1px solid rgba(255, 255, 255, 0.04)", position: "relative" }}>
        <button onClick={() => setEditing(!editing)} style={{ position: "absolute", top: "24px", right: "24px", width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255, 255, 255, 0.45)", zIndex: 10 }}>{editing ? "✕" : "✎"}</button>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#1a1813", border: "1px solid rgba(212,175,55,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "600", color: "#D4AF37" }}>{displayName.charAt(0).toUpperCase() || "O"}</div>
          
          {/* Text container with right padding to prevent Edit button overlap */}
          <div style={{ flex: 1, paddingRight: "45px" }}>
            <p style={{ fontSize: "18px", fontWeight: "600", color: "#f3f4f6", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName || "Unnamed Organizer"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", color: "#d4af37", background: "rgba(212,175,55,0.07)", padding: "2px 8px", borderRadius: "20px" }}>ORGANIZER</span>
                {organisation && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{organisation}</span>}
            </div>
          </div>
        </div>

        {bio && <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.55)", margin: "0 0 20px 0" }}>{bio}</p>}
        {platformValue && <p style={{ fontSize: "13px", color: "#93c5fd", margin: 0, textAlign: "center" }}>{platformValue}</p>}
      </div>

      {editing && (
        <div style={{ background: "#111015", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" style={{ width: "100%", padding: "12px", marginBottom: "8px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#fff" }} />
          <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation" style={{ width: "100%", padding: "12px", marginBottom: "8px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#fff" }} />
          <input value={platformValue} onChange={e => setPlatformValue(e.target.value)} placeholder="Website URL" style={{ width: "100%", padding: "12px", marginBottom: "8px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#fff" }} />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short Bio" style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#fff", height: "80px" }} />
          <button onClick={handleSave} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#D4AF37", color: "#000", fontWeight: "700", cursor: "pointer", border: "none" }}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      )}
    </div>
  );
}
