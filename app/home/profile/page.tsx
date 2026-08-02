"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { generateUniqueSlug } from "../slug";
import QRCode from "qrcode";
import TagInput from "./TagInput";

const inp = { width: "100%", padding: "13px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "var(--ivory)", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" as const, fontFamily: "var(--font-body)" };
const sectionLabel = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--ember)", margin: "0 0 4px" };
const sectionSub = { fontSize: "11.5px", color: "rgba(240,237,232,0.35)", margin: "0 0 18px", lineHeight: 1.5 };

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 18, padding: "22px 20px", marginBottom: 16,
    }}>
      <p style={sectionLabel}>{title}</p>
      {sub && <p style={sectionSub}>{sub}</p>}
      {children}
    </div>
  );
}

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
      padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.015)",
    }}>
      <span style={{ fontSize: 12.5, color: "rgba(240,237,232,0.8)" }}>{l}</span>
      <Toggle on={on} onClick={() => set(!on)} />
    </div>
  );
}

export default function HomeProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Identity
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  // Professional presence
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
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
        setSkills(data.skills ?? []);
        setInterests(data.interests ?? []);
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
    QRCode.toDataURL(url, { errorCorrectionLevel: "H", margin: 1, width: 400 })
      .then(d => { if (!cancelled) setQrDataUrl(d); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [profile?.slug]);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);

    let slug = profile.slug;
    if (!slug && displayName.trim()) {
      slug = await generateUniqueSlug(displayName, profile.id);
    }

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

  function copyLink() {
    if (!profile?.slug) return;
    navigator.clipboard.writeText(`https://oreeti.com/u/${profile.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "oreeti-qr.png";
    a.click();
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 1000px 600px at 50% -15%, rgba(226,109,52,0.1), transparent 60%), var(--base)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 100px" }}>
        <a href="/home" style={{ display: "inline-block", marginBottom: 28, color: "var(--ivory-muted)", fontSize: 11.5, textDecoration: "none" }}>← Back</a>

        {/* ── QR hero — the actual point of this page, deserves top billing
            rather than being a footnote after ten form fields. ── */}
        <div style={{
          position: "relative", textAlign: "center", padding: "40px 28px 32px", marginBottom: 28,
          borderRadius: 28, overflow: "hidden",
          background: "linear-gradient(165deg, rgba(226,109,52,0.1), rgba(212,175,55,0.04) 60%, transparent)",
          border: "1px solid rgba(226,109,52,0.18)",
          boxShadow: "0 24px 60px -20px rgba(226,109,52,0.25)",
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(212,175,55,0.85)", margin: "0 0 22px" }}>
            Your Universal Identity
          </p>

          {profile?.slug && qrDataUrl ? (
            <div style={{
              width: 208, height: 208, margin: "0 auto 22px", borderRadius: 22,
              background: "#fff", padding: 14, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.5)",
            }}>
              <img src={qrDataUrl} alt="Your Oreeti QR code" style={{ width: "100%", height: "100%", display: "block" }} />
            </div>
          ) : (
            <div style={{ width: 208, height: 208, margin: "0 auto 22px", borderRadius: 22, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 11.5, color: "var(--dusk)", padding: "0 20px", textAlign: "center" }}>Save your profile below to generate your QR</p>
            </div>
          )}

          {profile?.slug && (
            <>
              <p style={{ fontSize: 13.5, color: "var(--ivory)", fontWeight: 600, margin: "0 0 3px" }}>oreeti.com/u/{profile.slug}</p>
              <p style={{ fontSize: 12, color: "var(--dusk)", margin: "0 0 20px" }}>Any camera. Any scanner. Anywhere.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={copyLink} style={{
                  padding: "9px 18px", borderRadius: 11, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--ivory)",
                }}>
                  {copied ? "Copied ✓" : "Copy Link"}
                </button>
                <button onClick={downloadQr} style={{
                  padding: "9px 18px", borderRadius: 11, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: "rgba(226,109,52,0.12)", border: "1px solid rgba(226,109,52,0.3)", color: "var(--ember)",
                }}>
                  Download QR
                </button>
              </div>
            </>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,4vw,24px)", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          Your professional identity.
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 12.5, margin: "0 0 24px" }}>Not tied to any one event — this is who you are, everywhere.</p>

        <Section title="Identity">
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" style={inp} />
          <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Headline — e.g. Product Designer building things people love" style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="Role" style={{ ...inp, marginBottom: 0 }} />
            <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation" style={{ ...inp, marginBottom: 0 }} />
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" style={{ ...inp, minHeight: "72px", resize: "vertical" as const, marginTop: 12, marginBottom: 0 }} />
        </Section>

        <Section title="Professional Presence">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Industry" style={{ ...inp, marginBottom: 0 }} />
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram URL" style={{ ...inp, marginBottom: 0 }} />
          </div>
          <p style={{ fontSize: 10.5, color: "rgba(240,237,232,0.3)", margin: "0 0 6px" }}>Skills</p>
          <div style={{ marginBottom: 14 }}>
            <TagInput tags={skills} onChange={setSkills} placeholder="Type a skill, press Enter" />
          </div>
          <p style={{ fontSize: 10.5, color: "rgba(240,237,232,0.3)", margin: "0 0 6px" }}>Interested In</p>
          <div style={{ marginBottom: 14 }}>
            <TagInput tags={interests} onChange={setInterests} placeholder="Type an interest, press Enter" />
          </div>
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" style={inp} />
          <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={inp} />
          <input value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="Portfolio URL" style={{ ...inp, marginBottom: 0 }} />
        </Section>

        <Section title="Contact">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={{ ...inp, marginBottom: 0 }} />
        </Section>

        <Section title="Who Can See This" sub="Your name, headline, and role are always visible when someone views your profile.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <PrivacyRow l="Bio" on={showBio} set={setShowBio} />
            <PrivacyRow l="Headline" on={showHeadline} set={setShowHeadline} />
            <PrivacyRow l="Skills" on={showSkills} set={setShowSkills} />
            <PrivacyRow l="Interests" on={showInterests} set={setShowInterests} />
            <PrivacyRow l="LinkedIn" on={showLinkedin} set={setShowLinkedin} />
            <PrivacyRow l="Website" on={showWebsite} set={setShowWebsite} />
            <PrivacyRow l="Portfolio" on={showPortfolio} set={setShowPortfolio} />
            <PrivacyRow l="Instagram" on={showInstagram} set={setShowInstagram} />
            <PrivacyRow l="Phone" on={showPhone} set={setShowPhone} />
            <PrivacyRow l="Email" on={showEmail} set={setShowEmail} />
          </div>
        </Section>

        {notification && (
          <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "12px", background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.2)" }}>
            <p style={{ color: "var(--ember)", fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", padding: "15px", borderRadius: "14px",
          background: saving ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, var(--ember), #c9591f)",
          color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em",
          textTransform: "uppercase" as const, cursor: saving ? "default" : "pointer",
          boxShadow: saving ? "none" : "0 12px 28px -8px rgba(226,109,52,0.4)",
        }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
