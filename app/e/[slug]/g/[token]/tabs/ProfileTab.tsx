"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { cleanUrl, toHref } from "./shared";

interface ProfileTabProps {
  profile: any;
  masterProfile: any;
  event: any;
  onProfileUpdate: (p: any) => void;
  onMasterProfileUpdate: (p: any) => void;
  isEnded: boolean;
  registration: any;
}

function EditProfile({ profile, masterProfile, onSave, onSaveError }: any) {
  // Master profile is the canonical, cross-event identity record.
  // guest_profiles is a secondary, per-event overlay — fall back to
  // it only when the master profile doesn't have a value yet.
  const [displayName, setDisplayName] = useState(masterProfile?.display_name ?? profile?.display_name ?? "");
  const [role, setRole] = useState(masterProfile?.role_title ?? profile?.role_title ?? "");
  const [organisation, setOrganisation] = useState(masterProfile?.organisation ?? profile?.organisation ?? "");
  const [bio, setBio] = useState(masterProfile?.bio ?? profile?.bio ?? "");
  const [linkedin, setLinkedin] = useState(masterProfile?.linkedin_url ?? "");
  const [website, setWebsite] = useState(masterProfile?.website_url ?? "");
  const [portfolio, setPortfolio] = useState(masterProfile?.portfolio_url ?? "");
  const [phone, setPhone] = useState(masterProfile?.phone_number ?? profile?.phone_number ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);

    // Hosts have no masterProfile — save directly to guest_profiles only.
    // Guests with a masterProfile save there first, then sync to guest_profiles.
    if (!masterProfile?.id) {
      if (!profile?.id) {
        setSaving(false);
        onSaveError("Your profile isn't fully loaded yet — please try again in a moment.");
        return;
      }
      // Host path — update guest_profiles directly via API to bypass RLS
      const res = await fetch("/api/events/host-profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_profile_id: profile.id,
          display_name: displayName,
          role_title: role,
          organisation,
          bio,
          linkedin_url: linkedin,
          website_url: website,
          portfolio_url: portfolio,
          phone_number: phone,
        }),
      });
      const json = await res.json();
      setSaving(false);
      if (json.error) {
        onSaveError(json.error);
      } else {
        onSave(masterProfile, json.profile ?? profile);
      }
      return;
    }

    const { data: updatedMaster, error: masterError } = await supabase
      .from("master_profiles")
      .update({
        display_name: displayName,
        role_title: role,
        organisation,
        bio,
        linkedin_url: linkedin,
        website_url: website,
        portfolio_url: portfolio,
        phone_number: phone,
      })
      .eq("id", masterProfile.id)
      .select()
      .single();

    if (masterError || !updatedMaster) {
      setSaving(false);
      onSaveError(masterError?.message || "Couldn't save your profile. Please try again.");
      return;
    }

    let updatedGuest = profile;
    if (profile?.id) {
      const { data, error: guestError } = await supabase
        .from("guest_profiles")
        .update({
          display_name: displayName,
          role_title: role,
          organisation,
          bio,
          // These four previously weren't synced here at all — only saved to
          // master_profiles — so an edit here would show updated on the
          // Profile tab but never reach the Connections tab, which reads
          // guest_profiles, not master_profiles.
          linkedin_url: linkedin,
          website_url: website,
          portfolio_url: portfolio,
          phone_number: phone,
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (guestError) {
        onSaveError("Saved your profile, but this event's attendee card couldn't be refreshed.");
      } else if (data) {
        updatedGuest = data;
      }
    }

    setSaving(false);
    onSave(updatedMaster, updatedGuest);
  }

  const inp = { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fafafa", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" as const };

  return (
    <div style={{ background: "#0c0c0f", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.04)", marginTop: "12px" }}>
      <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" style={inp} />
      <input value={role} onChange={e => setRole(e.target.value)} placeholder="Your role or title" style={inp} />
      <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation" style={inp} />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number (for WhatsApp follow-up)" type="tel" style={inp} />
      <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" style={{ ...inp, minHeight: "60px", resize: "vertical" }} />
      <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={inp} />
      <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" style={inp} />
      <input value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="Portfolio URL" style={inp} />
      <button onClick={save} disabled={saving} style={{ width: "100%", padding: "11px", borderRadius: "10px", background: "transparent", color: saving ? "rgba(240,237,232,0.3)" : "#E26D34", border: saving ? "1px solid rgba(240,237,232,0.1)" : "1px solid rgba(226,109,52,0.35)", fontSize: "13px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

export default function ProfileTab({ profile, masterProfile, event, onProfileUpdate, onMasterProfileUpdate, isEnded, registration }: ProfileTabProps) {
  const [editing, setEditing] = useState(false);
  const [networkingVisible, setNetworkingVisible] = useState(profile?.networking_visible ?? true);
  const [notification, setNotification] = useState("");

  async function toggleVisibility() {
    const next = !networkingVisible;
    setNetworkingVisible(next);
    await supabase.from("guest_profiles").update({ networking_visible: next, aura_active: next }).eq("id", profile.id);
  }

  async function toggleLinkVisibility(key: string) {
    const visibilityColumns: Record<string, keyof typeof profile> = {
      linkedin: "show_linkedin",
      website: "show_website",
      portfolio: "show_portfolio",
      phone: "show_phone",
    };
    const column = visibilityColumns[key];
    if (!column) return;
    const current = Boolean(profile[column]);
    const { data, error } = await supabase
      .from("guest_profiles")
      .update({ [column]: !current })
      .eq("id", profile.id)
      .select()
      .single();
    if (error) {
      // Previously silent — a missing/misnamed column (as happened with
      // show_phone) would fail here with no feedback, so the toggle just
      // never appeared to work with no way to tell why.
      setNotification(`Couldn't update visibility — ${error.message}`);
      setTimeout(() => setNotification(""), 4000);
      return;
    }
    if (data) {
      onProfileUpdate(data);
    }
  }

  const isHost = registration?.status === "host";
  const accent = isHost ? "#D4AF37" : "#E26D34";
  const accentBg = isHost ? "rgba(212,175,55,0.08)" : "rgba(226,109,52,0.08)";
  const accentBorder = isHost ? "rgba(212,175,55,0.15)" : "rgba(226,109,52,0.15)";

  // Master profile is the canonical identity record — prefer it for
  // display, falling back to the per-event guest profile.
  const displayFields = {
    display_name: masterProfile?.display_name ?? profile?.display_name,
    role_title: masterProfile?.role_title ?? profile?.role_title,
    organisation: masterProfile?.organisation ?? profile?.organisation,
    bio: masterProfile?.bio ?? profile?.bio,
  };

  const presenceLinks = [
    { key: "linkedin", label: "LinkedIn", value: masterProfile?.linkedin_url, visible: profile?.show_linkedin ?? true, icon: "in" },
    { key: "website", label: "Website", value: masterProfile?.website_url, visible: profile?.show_website ?? true, icon: "web" },
    { key: "portfolio", label: "Portfolio", value: masterProfile?.portfolio_url, visible: profile?.show_portfolio ?? true, icon: "folio" },
    // Phone defaults to hidden (visible: false fallback) unlike the other
    // three — a phone number is more sensitive than a public profile link,
    // so it should be an opt-in default, not opt-out like the others.
    { key: "phone", label: "Phone", value: masterProfile?.phone_number, visible: profile?.show_phone ?? false, icon: "phone" },
  ];

  return (
    <div style={{ padding: "16px", background: "#08080a", minHeight: "100vh" }}>
      {/* Profile card */}
      <div style={{ background: "#0c0c0f", borderRadius: "22px", padding: "24px", marginBottom: "12px", border: "1px solid " + accentBorder, boxShadow: "0 4px 8px rgba(0,0,0,0.35),0 16px 48px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 50 }}>
          <button onClick={() => setEditing(!editing)} style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: accent, fontSize: "13px" }}>{editing ? "✕" : "✎"}</button>
        </div>
        <p style={{ fontSize: "22px", fontWeight: "700", color: "#f0ede8", letterSpacing: "-0.02em", margin: "0 0 8px", paddingRight: "44px" }}>{displayFields.display_name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
          {displayFields.role_title && <span style={{ fontSize: "9px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: accent, background: accentBg, border: "1px solid " + accentBorder, padding: "3px 8px", borderRadius: "5px" }}>{isHost ? "ORGANIZER" : displayFields.role_title}</span>}
          {displayFields.organisation && <p style={{ fontSize: "13px", color: "rgba(240,237,232,0.45)", margin: 0 }}>{displayFields.role_title && <span style={{ marginRight: "8px", color: "rgba(240,237,232,0.2)" }}>|</span>}{displayFields.organisation}</p>}
        </div>
        {displayFields.bio && <p style={{ fontSize: "13px", color: "rgba(244,244,245,0.65)", lineHeight: "1.6", fontWeight: "300", margin: "0 0 20px" }}>{displayFields.bio}</p>}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "16px", marginTop: "8px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,232,0.35)", marginBottom: "14px" }}>
            Professional Presence
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {presenceLinks.map((link) => {
              const isClickable = link.key !== "phone";
              const href = isClickable && link.value ? toHref(link.value) : "";
              const hasValue = Boolean(link.value);
              return (
                <div key={link.key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "11px 12px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        textDecoration: "none",
                        transition: "background 0.15s ease, border-color 0.15s ease",
                      }}
                    >
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "9px", flexShrink: 0,
                        background: accentBg, border: "1px solid " + accentBorder,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: accent, fontSize: "12px", fontWeight: "700",
                      }}>
                        {link.icon === "in" ? "in" : link.icon === "web" ? "🌐" : "✦"}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: "rgba(240,237,232,0.4)", fontSize: "10px", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "1px" }}>{link.label}</div>
                        <div style={{ color: accent, fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanUrl(link.value)}</div>
                      </div>
                    </a>
                  ) : hasValue ? (
                    <div style={{
                      flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "12px",
                      padding: "11px 12px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "9px", flexShrink: 0,
                        background: accentBg, border: "1px solid " + accentBorder,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: accent, fontSize: "12px", fontWeight: "700",
                      }}>
                        📞
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: "rgba(240,237,232,0.4)", fontSize: "10px", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "1px" }}>{link.label}</div>
                        <div style={{ color: accent, fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.value}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      flex: 1, display: "flex", alignItems: "center", gap: "12px",
                      padding: "11px 12px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)",
                    }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "9px", flexShrink: 0,
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "rgba(240,237,232,0.25)", fontSize: "12px", fontWeight: "700",
                      }}>
                        {link.icon === "in" ? "in" : link.icon === "web" ? "🌐" : link.icon === "phone" ? "📞" : "✦"}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: "rgba(240,237,232,0.4)", fontSize: "10px", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "1px" }}>{link.label}</div>
                        <div style={{ color: "rgba(240,237,232,0.3)", fontSize: "13px" }}>Not added</div>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleLinkVisibility(link.key)}
                    aria-label={link.visible ? `Hide ${link.label}` : `Show ${link.label}`}
                    style={{
                      flexShrink: 0, width: "36px", height: "21px", borderRadius: "11px", border: "none",
                      cursor: "pointer", position: "relative", transition: "background 0.2s",
                      background: link.visible ? accent : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: "2.5px", left: link.visible ? "18px" : "2.5px",
                      width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visibility toggle */}
      <div style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 16px", marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#f1f0f5", margin: 0 }}>Visible to other attendees</p>
          <p style={{ fontSize: "11px", color: "rgba(240,237,232,0.4)", margin: "2px 0 0" }}>{networkingVisible ? "You can be found and connected with" : "Hidden from networking"}</p>
        </div>
        <button onClick={toggleVisibility} style={{ flexShrink: 0, width: "44px", height: "26px", borderRadius: "14px", border: "none", cursor: "pointer", background: networkingVisible ? "#E26D34" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
          <span style={{ position: "absolute", top: "3px", left: networkingVisible ? "22px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </button>
      </div>

      {editing && (
        <EditProfile
          profile={profile}
          masterProfile={masterProfile}
          onSave={(updatedMaster: any, updatedGuest: any) => {
            onMasterProfileUpdate(updatedMaster);
            if (updatedGuest) onProfileUpdate(updatedGuest);
            setEditing(false);
            setNotification("Profile updated");
            setTimeout(() => setNotification(""), 2500);
          }}
          onSaveError={(msg: string) => {
            setNotification(msg);
            setTimeout(() => setNotification(""), 4000);
          }}
        />
      )}

      {notification && <div style={{ background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)", borderRadius: "12px", padding: "10px 14px", marginTop: "12px" }}><p style={{ color: "#E26D34", fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p></div>}
    </div>
  );
}
