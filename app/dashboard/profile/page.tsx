"use client";
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

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setOrganisation(data.organisation || '');
        setPlatformValue(data.platform_value || '');
      } else {
        // Create an empty reference profile state so it renders gracefully if new
        setProfile({});
      }
    } catch (err) {
      console.error(err);
      setProfile({});
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName,
        bio: bio,
        organisation: organisation,
        platform_value: platformValue
      });
      setProfile({ display_name: displayName, bio, organisation, platform_value: platformValue });
    }
    setSaving(false);
    setEditing(false);
  }

  if (!profile) return <div style={{ padding: "40px", color: "#D4AF37", textAlign: "center", fontSize: "12px", letterSpacing: "0.1em" }}>LOADING IDENTITY...</div>;

  return (
    <div style={{ padding: "32px 16px", background: "#000", minHeight: "100vh" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "40px", textAlign: "center", fontWeight: "500" }}>
        Organizer Identity
      </p>

      <div style={{ background: "transparent", padding: "0 0 24px 0", marginBottom: "32px", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", position: "relative" }}>
        <button 
          onClick={() => setEditing(!editing)} 
          style={{ position: "absolute", top: "0", right: "0", width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255, 255, 255, 0.6)", zIndex: 10, fontSize: "12px" }}
        >
          {editing ? "✕" : "✎"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(212,175,55,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "400", color: "#D4AF37", letterSpacing: "0.02em" }}>
            {displayName.charAt(0).toUpperCase() || "O"}
          </div>
          <div style={{ flex: 1, paddingRight: "45px" }}>
            <p style={{ fontSize: "16px", fontWeight: "500", color: "#f0ede8", margin: "0 0 6px", letterSpacing: "0.01em" }}>
              {displayName || "Unnamed Organizer"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", color: "#D4AF37", textTransform: "uppercase" }}>
                ORGANIZER
              </span>
              {organisation && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.01em" }}>{organisation}</span>}
            </div>
          </div>
        </div>

        {bio && <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.45)", margin: "0 0 16px 0", fontWeight: "400" }}>{bio}</p>}
        {platformValue && <p style={{ fontSize: "12px", color: "#D4AF37", margin: 0, letterSpacing: "0.04em" }}>{platformValue}</p>}
      </div>

      {editing && (
        <div style={{ background: "transparent", marginTop: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
            <input 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              placeholder="Display Name" 
              style={{ width: "100%", padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "14px", borderRadius: 0, outline: "none" }} 
            />
            <input 
              value={organisation} 
              onChange={e => setOrganisation(e.target.value)} 
              placeholder="Organisation" 
              style={{ width: "100%", padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "14px", borderRadius: 0, outline: "none" }} 
            />
            <input 
              value={platformValue} 
              onChange={e => setPlatformValue(e.target.value)} 
              placeholder="Website URL" 
              style={{ width: "100%", padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "14px", borderRadius: 0, outline: "none" }} 
            />
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              placeholder="Short Bio" 
              style={{ width: "100%", padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "14px", height: "70px", resize: "none", borderRadius: 0, outline: "none" }} 
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "transparent", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.45)", fontWeight: "500", fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}