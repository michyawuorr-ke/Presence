"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      flexShrink: 0, width: "34px", height: "20px", borderRadius: "10px", border: "none",
      cursor: "pointer", position: "relative", transition: "background 0.2s",
      background: on ? "var(--ember)" : "rgba(255,255,255,0.1)",
    }}>
      <span style={{ position: "absolute", top: "2.5px", left: on ? "16.5px" : "2.5px", width: "15px", height: "15px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

function PrivacyRow({ l, on, set }: { l: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{ fontSize: 13, color: "rgba(240,237,232,0.85)" }}>{l}</span>
      <Toggle on={on} onClick={() => set(!on)} />
    </div>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [showBio, setShowBio] = useState(true);
  const [showHeadline, setShowHeadline] = useState(true);
  const [showKnownFor, setShowKnownFor] = useState(true);
  const [showWhatIDo, setShowWhatIDo] = useState(true);
  const [showFeaturedWork, setShowFeaturedWork] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showSkills, setShowSkills] = useState(true);
  const [showOpenTo, setShowOpenTo] = useState(true);
  const [showAvailability, setShowAvailability] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [showCauses, setShowCauses] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);
  const [showLinkedin, setShowLinkedin] = useState(true);
  const [showWebsite, setShowWebsite] = useState(true);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showInstagram, setShowInstagram] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { router.push("/login"); return; }
      const { data } = await supabase
        .from("master_profiles")
        .select("*")
        .eq("email", session.user.email.toLowerCase())
        .maybeSingle();

      if (data) {
        setProfile(data);
        setShowBio(data.show_bio ?? true);
        setShowHeadline(data.show_headline ?? true);
        setShowKnownFor(data.show_known_for ?? true);
        setShowWhatIDo(data.show_what_i_do ?? true);
        setShowFeaturedWork(data.show_featured_work ?? true);
        setShowLocation(data.show_location ?? true);
        setShowSkills(data.show_skills ?? true);
        setShowOpenTo(data.show_open_to ?? true);
        setShowAvailability(data.show_availability ?? true);
        setShowInterests(data.show_interests ?? true);
        setShowCauses(data.show_causes ?? true);
        setShowLanguages(data.show_languages ?? true);
        setShowLinkedin(data.show_linkedin ?? true);
        setShowWebsite(data.show_website ?? true);
        setShowPortfolio(data.show_portfolio ?? true);
        setShowInstagram(data.show_instagram ?? true);
        setShowPhone(data.show_phone ?? false);
        setShowEmail(data.show_email ?? false);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("master_profiles")
      .update({
        show_bio: showBio, show_headline: showHeadline, show_known_for: showKnownFor,
        show_what_i_do: showWhatIDo, show_featured_work: showFeaturedWork, show_location: showLocation,
        show_skills: showSkills, show_open_to: showOpenTo, show_availability: showAvailability,
        show_interests: showInterests, show_causes: showCauses, show_languages: showLanguages,
        show_linkedin: showLinkedin, show_website: showWebsite, show_portfolio: showPortfolio,
        show_instagram: showInstagram, show_phone: showPhone, show_email: showEmail,
      })
      .eq("id", profile.id);
    setSaving(false);
    setNotification(error ? "Couldn't save — " + error.message : "Saved");
    setTimeout(() => setNotification(""), 3000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setDeleting(false); return; }

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ authUserId: session.user.id }),
    });
    const result = await res.json();

    if (!res.ok) {
      setDeleting(false);
      setNotification(result.error || "Couldn't delete your account. Please try again.");
      setTimeout(() => setNotification(""), 6000);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -15%, rgba(226,109,52,0.06), transparent 60%), var(--base)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <a href="/home/profile" style={{ color: "var(--ivory-muted)", fontSize: 11.5, textDecoration: "none" }}>← Back to profile</a>
          <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "var(--ivory-muted)", fontSize: 11.5, letterSpacing: "0.04em", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,4vw,24px)", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          Settings
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 12.5, margin: "0 0 28px" }}>Privacy controls and account management.</p>

        <div style={{
          background: "linear-gradient(165deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "24px 22px", marginBottom: 20,
          boxShadow: "0 16px 32px -20px rgba(0,0,0,0.5)",
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ember)", margin: "0 0 4px" }}>Who Can See This</p>
          <p style={{ fontSize: 11.5, color: "rgba(240,237,232,0.35)", margin: "0 0 18px", lineHeight: 1.5 }}>
            Your name, headline, and role are always visible when someone views your profile.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrivacyRow l="Bio" on={showBio} set={setShowBio} />
            <PrivacyRow l="Headline" on={showHeadline} set={setShowHeadline} />
            <PrivacyRow l="Featured Work" on={showFeaturedWork} set={setShowFeaturedWork} />
            <PrivacyRow l="Location" on={showLocation} set={setShowLocation} />
            <PrivacyRow l="Skills" on={showSkills} set={setShowSkills} />
            <PrivacyRow l="Availability" on={showAvailability} set={setShowAvailability} />
            <PrivacyRow l="Causes" on={showCauses} set={setShowCauses} />
            <PrivacyRow l="Languages" on={showLanguages} set={setShowLanguages} />
            <PrivacyRow l="LinkedIn" on={showLinkedin} set={setShowLinkedin} />
            <PrivacyRow l="Website" on={showWebsite} set={setShowWebsite} />
            <PrivacyRow l="Portfolio" on={showPortfolio} set={setShowPortfolio} />
            <PrivacyRow l="Instagram" on={showInstagram} set={setShowInstagram} />
            <PrivacyRow l="Phone" on={showPhone} set={setShowPhone} />
            <PrivacyRow l="Email" on={showEmail} set={setShowEmail} />
          </div>
        </div>

        {notification && (
          <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "12px", background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)" }}>
            <p style={{ color: "var(--ember)", fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", padding: "14px", borderRadius: "14px", marginBottom: 40,
          background: saving ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, var(--ember), #c9591f)",
          color: "#fff", border: "none", fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.04em",
          textTransform: "uppercase" as const, cursor: saving ? "default" : "pointer",
        }}>
          {saving ? "Saving..." : "Save Privacy Settings"}
        </button>

        {/* Danger zone — kept visually distinct and separate, never mixed
            in with the privacy controls above. */}
        <div style={{ border: "1px solid rgba(239,68,68,0.25)", borderRadius: 18, padding: "20px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ef4444", margin: "0 0 8px" }}>Danger Zone</p>
          <p style={{ fontSize: 12, color: "rgba(240,237,232,0.5)", margin: "0 0 16px", lineHeight: 1.5 }}>
            Permanently deletes your profile and login. This cannot be undone. Past connections you made stay visible to the other person, but no longer link back to you.
          </p>

          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{
              padding: "10px 18px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
            }}>
              Delete My Account
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 12, color: "rgba(240,237,232,0.7)", margin: "0 0 10px" }}>
                Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10, marginBottom: 12,
                  border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)",
                  color: "var(--ivory)", fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }} style={{
                  flex: 1, padding: "11px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--ivory-muted)",
                }}>
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || deleting}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: deleteInput === "DELETE" ? "pointer" : "default",
                    background: deleteInput === "DELETE" ? "#ef4444" : "rgba(239,68,68,0.15)",
                    border: "none", color: deleteInput === "DELETE" ? "#fff" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
