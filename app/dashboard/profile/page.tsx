"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const GOLD = "#D4AF37";

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export default function HostProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile]       = useState<any>(null);
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [notification, setNotification] = useState("");
  const [eventCount, setEventCount] = useState(0);

  // form fields
  const [displayName,  setDisplayName]  = useState("");
  const [roleTitle,    setRoleTitle]    = useState("");
  const [organisation, setOrganisation] = useState("");
  const [bio,          setBio]          = useState("");
  const [website,      setWebsite]      = useState("");
  const [linkedin,     setLinkedin]     = useState("");
  const [twitter,      setTwitter]      = useState("");
  const [showInEvents, setShowInEvents] = useState(true);

  function toast(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  function hydrate(p: any) {
    setDisplayName(p.display_name  ?? "");
    setRoleTitle(p.role_title      ?? "");
    setOrganisation(p.organisation ?? "");
    setBio(p.bio                   ?? "");
    setWebsite(p.website_url       ?? "");
    setLinkedin(p.linkedin_url     ?? "");
    setTwitter(p.twitter_url       ?? "");
    setShowInEvents(p.show_in_events ?? true);
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: hp }, { count }] = await Promise.all([
        supabase.from("host_profiles").select("*").eq("host_id", user.id).maybeSingle(),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("host_id", user.id),
      ]);

      const p = hp ?? {};
      setProfile(p);
      setEventCount(count ?? 0);
      hydrate(p);
    }
    load();
  }, [router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast("Image must be under 3 MB"); return; }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `avatars/host-${user.id}.${ext}`;
    const { error } = await supabase.storage.from("event-assets").upload(path, file, { upsert: true });
    if (error) { toast("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-assets").getPublicUrl(path);
    await supabase.from("host_profiles").upsert({ host_id: user.id, avatar_url: urlData.publicUrl }, { onConflict: "host_id" });
    setProfile((p: any) => ({ ...p, avatar_url: urlData.publicUrl }));
    setUploading(false);
    toast("Photo updated");
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      host_id:      user.id,
      display_name: displayName,
      role_title:   roleTitle,
      organisation,
      bio,
      website_url:  website,
      linkedin_url: linkedin,
      twitter_url:  twitter,
      show_in_events: showInEvents,
      updated_at:   new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("host_profiles")
      .upsert(payload, { onConflict: "host_id" })
      .select()
      .single();
    setSaving(false);
    if (error) { toast("Save failed: " + error.message); return; }
    setProfile(data);
    setEditing(false);
    toast("Profile saved");
  }

  const initials = displayName?.trim().split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "O";

  const links = [
    { key: "website",  icon: "🌐", value: website,  label: cleanUrl(website)  },
    { key: "linkedin", icon: "💼", value: linkedin, label: cleanUrl(linkedin) },
    { key: "twitter",  icon: "𝕏",  value: twitter,  label: twitter.replace(/^@/, "")  },
  ].filter(l => l.value?.trim());

  const inp = {
    width: "100%", padding: "11px 0", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.07)", color: "#fff", fontSize: "14px",
    outline: "none", boxSizing: "border-box" as const, marginBottom: "4px",
  };

  if (!profile) return (
    <div style={{ minHeight: "100vh", background: "#08080a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#08080a", color: "#f0ede8", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, background: "rgba(8,8,10,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)", zIndex: 30, padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px", maxWidth: "480px", margin: "0 auto" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer", padding: "4px" }}>←</button>
          <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", margin: 0 }}>Organizer Profile</p>
          <button onClick={() => editing ? handleSave() : setEditing(true)}
            style={{ background: "none", border: `1px solid rgba(212,175,55,${editing ? "0.5" : "0.2"})`, borderRadius: "8px", color: editing ? GOLD : "#555", fontSize: "11px", fontWeight: "600", padding: "5px 12px", cursor: "pointer", letterSpacing: "0.06em" }}>
            {saving ? "Saving..." : editing ? "Save" : "Edit"}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 16px 60px" }}>
        {notification && (
          <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", textAlign: "center" }}>
            <p style={{ color: GOLD, fontSize: "12px", margin: 0 }}>{notification}</p>
          </div>
        )}

        {/* ── Profile card ── */}
        <div style={{ background: "linear-gradient(160deg, rgba(212,175,55,0.05) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: "20px", padding: "24px", marginBottom: "16px", position: "relative" }}>

          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                onClick={() => editing && fileRef.current?.click()}
                style={{ width: "64px", height: "64px", borderRadius: "50%", border: `1px solid rgba(212,175,55,${editing ? "0.5" : "0.25"})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: editing ? "pointer" : "default", background: "rgba(212,175,55,0.06)" }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: "22px", fontWeight: "600", color: GOLD, letterSpacing: "-0.02em" }}>{initials}</span>
                }
              </div>
              {editing && (
                <div onClick={() => fileRef.current?.click()}
                  style={{ position: "absolute", bottom: 0, right: 0, width: "20px", height: "20px", borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "10px" }}>
                  {uploading ? "…" : "✎"}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} style={{ display: "none" }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <p style={{ fontSize: "18px", fontWeight: "700", color: "#f0ede8", margin: 0, letterSpacing: "-0.02em" }}>
                  {displayName || "Your Name"}
                </p>
                <span style={{ fontSize: "9px", fontWeight: "800", color: GOLD, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.12em", flexShrink: 0 }}>
                  🛡 ORGANIZER
                </span>
              </div>
              {(roleTitle || organisation) && (
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
                  {roleTitle}{roleTitle && organisation ? " · " : ""}{organisation}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {bio && !editing && (
            <p style={{ fontSize: "13px", lineHeight: "1.65", color: "rgba(255,255,255,0.55)", margin: "0 0 20px", fontWeight: "300" }}>{bio}</p>
          )}

          {/* Links */}
          {links.length > 0 && !editing && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "16px" }}>
              {links.map(l => (
                <a key={l.key} href={l.key === "twitter" ? `https://x.com/${l.label}` : l.value} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                  <span style={{ fontSize: "14px", width: "20px", textAlign: "center" }}>{l.icon}</span>
                  <span style={{ fontSize: "12px", color: GOLD }}>{l.label}</span>
                </a>
              ))}
            </div>
          )}

          {/* Stats row */}
          {!editing && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "16px", marginTop: links.length ? "16px" : "0" }}>
              <div>
                <p style={{ fontSize: "18px", fontWeight: "700", color: "#f0ede8", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{eventCount}</p>
                <p style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Events Hosted</p>
              </div>
              <div style={{ flex: 1 }} />
              {/* Show in events toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>Visible on event pages</p>
                <button onClick={async () => {
                  const next = !showInEvents;
                  setShowInEvents(next);
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) await supabase.from("host_profiles").upsert({ host_id: user.id, show_in_events: next }, { onConflict: "host_id" });
                }}
                  style={{ width: "36px", height: "22px", borderRadius: "11px", border: "none", cursor: "pointer", background: showInEvents ? "rgba(212,175,55,0.8)" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: "3px", left: showInEvents ? "17px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Edit form ── */}
        {editing && (
          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", margin: "0 0 16px" }}>Identity</p>
            <input value={displayName}  onChange={e => setDisplayName(e.target.value)}  placeholder="Your full name"       style={inp} />
            <input value={roleTitle}    onChange={e => setRoleTitle(e.target.value)}    placeholder="Role or title"        style={inp} />
            <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation / Studio" style={inp} />
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio (2–3 lines)" rows={3}
              style={{ ...inp, resize: "vertical", minHeight: "70px", marginTop: "4px" }} />

            <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", margin: "20px 0 16px" }}>Links</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", width: "20px", textAlign: "center", flexShrink: 0 }}>🌐</span>
              <input value={website}  onChange={e => setWebsite(e.target.value)}  placeholder="Website URL"  style={{ ...inp, marginBottom: 0 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", width: "20px", textAlign: "center", flexShrink: 0 }}>💼</span>
              <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={{ ...inp, marginBottom: 0 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px", width: "20px", textAlign: "center", flexShrink: 0 }}>𝕏</span>
              <input value={twitter}  onChange={e => setTwitter(e.target.value)}  placeholder="@handle"      style={{ ...inp, marginBottom: 0 }} />
            </div>

            <button onClick={handleSave} disabled={saving}
              style={{ width: "100%", marginTop: "24px", padding: "12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", color: GOLD, fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <button onClick={() => { setEditing(false); hydrate(profile); }}
              style={{ width: "100%", marginTop: "8px", padding: "10px", borderRadius: "10px", background: "transparent", border: "none", color: "#555", fontSize: "12px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
