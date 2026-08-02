"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { generateUniqueSlug } from "../slug";
import QRCode from "qrcode";

const inp = { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "var(--ivory)", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" as const, fontFamily: "var(--font-body)" };
const label = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(138,115,85,0.7)", margin: "0 0 10px" };

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      flexShrink: 0, width: "36px", height: "21px", borderRadius: "11px", border: "none",
      cursor: "pointer", position: "relative", transition: "background 0.2s",
      background: on ? "var(--ember)" : "rgba(255,255,255,0.1)",
    }}>
      <span style={{ position: "absolute", top: "2.5px", left: on ? "18px" : "2.5px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

export default function HomeProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Identity
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  // Professional presence
  const [industry, setIndustry] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  // Contact
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  // Privacy toggles
  const [showBio, setShowBio] = useState(true);
  const [showHeadline, setShowHeadline] = useState(true);
  const [showSkills, setShowSkills] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
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
        setDisplayName(data.display_name ?? "");
        setHeadline(data.headline ?? "");
        setBio(data.bio ?? "");
        setOrganisation(data.organisation ?? "");
        setRoleTitle(data.role_title ?? "");
        setIndustry(data.industry ?? "");
        setSkillsInput((data.skills ?? []).join(", "));
        setInterestsInput((data.interests ?? []).join(", "));
        setPortfolio(data.portfolio_url ?? "");
        setWebsite(data.website_url ?? "");
        setLinkedin(data.linkedin_url ?? "");
        setPhone(data.phone_number ?? "");
        setInstagram(data.instagram_url ?? "");
        setShowBio(data.show_bio ?? true);
        setShowHeadline(data.show_headline ?? true);
        setShowSkills(data.show_skills ?? true);
        setShowInterests(data.show_interests ?? true);
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

  useEffect(() => {
    if (!profile?.slug) { setQrDataUrl(null); return; }
    let cancelled = false;
    const url = `https://oreeti.com/u/${profile.slug}`;
    // Same settings as the existing event QR generation in SceneView.tsx —
    // errorCorrectionLevel H tolerates real-world scan conditions (angle,
    // partial obstruction, screen glare) better than the lower levels.
    QRCode.toDataURL(url, { errorCorrectionLevel: "H", margin: 2, width: 256 })
      .then(d => { if (!cancelled) setQrDataUrl(d); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [profile?.slug]);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);

    // Slug only generated once, on first save that has a real name to work
    // from — never regenerated afterward even if the name changes later,
    // since the URL may already be shared or printed.
    let slug = profile.slug;
    if (!slug && displayName.trim()) {
      slug = await generateUniqueSlug(displayName, profile.id);
    }

    const skills = skillsInput.split(",").map(s => s.trim()).filter(Boolean);
    const interests = interestsInput.split(",").map(s => s.trim()).filter(Boolean);

    const { data, error } = await supabase
      .from("master_profiles")
      .update({
        display_name: displayName, headline, bio, organisation, role_title: roleTitle,
        industry, skills, interests,
        portfolio_url: portfolio, website_url: website, linkedin_url: linkedin,
        phone_number: phone, instagram_url: instagram,
        slug,
        show_bio: showBio, show_headline: showHeadline, show_skills: showSkills, show_interests: showInterests,
        show_linkedin: showLinkedin, show_website: showWebsite, show_portfolio: showPortfolio, show_instagram: showInstagram,
        show_phone: showPhone, show_email: showEmail,
      })
      .eq("id", profile.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      setNotification("Couldn't save — " + error.message);
    } else {
      setProfile(data);
      setNotification("Saved");
    }
    setTimeout(() => setNotification(""), 3000);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.06), transparent), var(--base)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 100px" }}>
        <a href="/home" style={{ display: "inline-block", marginBottom: 24, color: "var(--ivory-muted)", fontSize: 11.5, textDecoration: "none" }}>← Back</a>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,4vw,28px)", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          Your professional identity.
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 13, margin: "0 0 32px" }}>Not tied to any one event — this is who you are, everywhere.</p>

        {/* Identity */}
        <p style={label}>Identity</p>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" style={inp} />
        <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Headline (e.g. Product Designer building things people love)" style={inp} />
        <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="Role / title" style={inp} />
        <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation" style={inp} />
        <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" style={{ ...inp, minHeight: "70px", resize: "vertical" as const }} />

        {/* Professional presence */}
        <p style={{ ...label, marginTop: "28px" }}>Professional Presence</p>
        <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Industry" style={inp} />
        <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Skills, comma separated" style={inp} />
        <input value={interestsInput} onChange={e => setInterestsInput(e.target.value)} placeholder="Interests, comma separated" style={inp} />
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" style={inp} />
        <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={inp} />
        <input value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="Portfolio URL" style={inp} />
        <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram URL" style={inp} />

        {/* Contact */}
        <p style={{ ...label, marginTop: "28px" }}>Contact</p>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={inp} />

        {/* Privacy */}
        <p style={{ ...label, marginTop: "28px" }}>Who can see this</p>
        <p style={{ fontSize: 11.5, color: "rgba(240,237,232,0.35)", margin: "0 0 14px", lineHeight: 1.5 }}>
          Controls what shows on your public profile page. Your name, headline, and role are always visible when someone views your profile.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { l: "Bio", on: showBio, set: setShowBio },
            { l: "Headline", on: showHeadline, set: setShowHeadline },
            { l: "Skills", on: showSkills, set: setShowSkills },
            { l: "Interests", on: showInterests, set: setShowInterests },
            { l: "LinkedIn", on: showLinkedin, set: setShowLinkedin },
            { l: "Website", on: showWebsite, set: setShowWebsite },
            { l: "Portfolio", on: showPortfolio, set: setShowPortfolio },
            { l: "Instagram", on: showInstagram, set: setShowInstagram },
            { l: "Phone", on: showPhone, set: setShowPhone },
            { l: "Email", on: showEmail, set: setShowEmail },
          ].map(row => (
            <div key={row.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ivory)" }}>{row.l}</span>
              <Toggle on={row.on} onClick={() => row.set(!row.on)} />
            </div>
          ))}
        </div>

        {notification && (
          <div style={{ marginTop: "20px", padding: "10px 14px", borderRadius: "12px", background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)" }}>
            <p style={{ color: "var(--ember)", fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", marginTop: "24px", padding: "14px", borderRadius: "14px",
          background: saving ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, var(--ember), #c9591f)",
          color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em",
          textTransform: "uppercase" as const, cursor: saving ? "default" : "pointer",
        }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {profile?.slug && (
          <div style={{ marginTop: "28px", textAlign: "center", padding: "24px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.7)", margin: "0 0 16px" }}>Your Universal QR</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Your Oreeti QR code" style={{ width: 180, height: 180, borderRadius: 12, background: "#fff", padding: 10, margin: "0 auto 16px" }} />
            ) : (
              <div style={{ width: 180, height: 180, borderRadius: 12, background: "rgba(255,255,255,0.03)", margin: "0 auto 16px" }} />
            )}
            <p style={{ fontSize: 12, color: "var(--dusk)", margin: "0 0 4px" }}>
              Works anywhere — any camera, any scanner.
            </p>
            <p style={{ fontSize: 13, color: "var(--ember)", margin: 0, wordBreak: "break-all" }}>oreeti.com/u/{profile.slug}</p>
          </div>
        )}
      </div>
    </div>
  );
}
