"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { generateUniqueSlug } from "../slug";
import QRCode from "qrcode";
import TagInput from "./TagInput";
import MultiSelectChips from "./MultiSelectChips";
import { OPEN_TO_OPTIONS, AVAILABILITY_OPTIONS } from "./profileOptions";

const inp = { width: "100%", padding: "13px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "var(--ivory)", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" as const, fontFamily: "var(--font-body)" };
const sectionLabel = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--ember)", margin: "0 0 4px" };
const sectionSub = { fontSize: "11.5px", color: "rgba(240,237,232,0.35)", margin: "0 0 18px", lineHeight: 1.5 };
const tagLabel = { fontSize: "10.5px", color: "rgba(240,237,232,0.3)", margin: "0 0 6px" };

// Real card elevation — shadow + subtle gradient border rather than a
// flat rectangle, so consecutive sections read as distinct cards rather
// than one continuous form. Fewer, denser sections (4, not 6+) so the
// page reads as a profile with real content groupings, not a settings list.
function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "linear-gradient(165deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20, padding: "24px 22px", marginBottom: 18,
      boxShadow: "0 16px 32px -20px rgba(0,0,0,0.5)",
    }}>
      <p style={sectionLabel}>{title}</p>
      {sub && <p style={sectionSub}>{sub}</p>}
      {children}
    </div>
  );
}

export default function HomeProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Identity
  const [avatarUrl, setAvatarUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [knownFor, setKnownFor] = useState("");
  // What you do
  const [whatIDo, setWhatIDo] = useState("");
  const [featuredWork, setFeaturedWork] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  // Connect
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [causes, setCauses] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");

  // Privacy toggles
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
      setUserId(session.user.id);
      const email = session.user.email.toLowerCase();
      const { data, error } = await supabase
        .from("master_profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Failed to load master_profiles:", error);
        setNotification("Couldn't load your profile — " + error.message);
        setLoading(false);
        return;
      }
      if (!data) {
        console.error("No master_profiles row found for", email);
        setNotification("We couldn't find your profile. Try signing out and back in.");
        setLoading(false);
        return;
      }

      setProfile(data);
      setAvatarUrl(data.avatar_url ?? "");
      setDisplayName(data.display_name ?? "");
      setHeadline(data.headline ?? "");
      setBio(data.bio ?? "");
      setOrganisation(data.organisation ?? "");
      setRoleTitle(data.role_title ?? "");
      setKnownFor(data.known_for ?? "");
      setWhatIDo(data.what_i_do ?? "");
      setFeaturedWork(data.featured_work ?? "");
      setIndustry(data.industry ?? "");
      setLocation(data.location ?? "");
      setSkills(data.skills ?? []);
      setOpenTo(data.open_to ?? []);
      setAvailability(data.availability ?? []);
      setInterests(data.interests ?? []);
      setCauses(data.causes ?? []);
      setLanguages(data.languages ?? []);
      setPortfolio(data.portfolio_url ?? "");
      setWebsite(data.website_url ?? "");
      setLinkedin(data.linkedin_url ?? "");
      setInstagram(data.instagram_url ?? "");
      setPhone(data.phone_number ?? "");
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId || !profile?.id) return;

    if (file.size > 3 * 1024 * 1024) {
      setNotification("Image must be under 3MB");
      setTimeout(() => setNotification(""), 4000);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotification("Please select an image file");
      setTimeout(() => setNotification(""), 4000);
      return;
    }

    setAvatarUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setNotification("Upload failed — " + uploadError.message);
      setTimeout(() => setNotification(""), 4000);
      setAvatarUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    // Bust cache so the browser doesn't show the old image
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    const { error: saveError } = await supabase
      .from("master_profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (saveError) {
      setNotification("Uploaded but couldn't save — " + saveError.message);
      setTimeout(() => setNotification(""), 4000);
    } else {
      setAvatarUrl(urlWithBust);
      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
      setNotification("Photo updated");
      setTimeout(() => setNotification(""), 2500);
    }

    setAvatarUploading(false);
  }

  async function handleSave() {
    if (!profile?.id) {
      setNotification("Couldn't save — your profile didn't load correctly. Try refreshing the page.");
      setTimeout(() => setNotification(""), 5000);
      return;
    }
    setSaving(true);

    let slug = profile.slug;
    if (!slug && displayName.trim()) {
      slug = await generateUniqueSlug(displayName, profile.id);
    }

    const { data, error } = await supabase
      .from("master_profiles")
      .update({
        avatar_url: avatarUrl,
        display_name: displayName, headline, bio, organisation, role_title: roleTitle, known_for: knownFor,
        what_i_do: whatIDo, featured_work: featuredWork, industry, location, skills,
        open_to: openTo, availability, interests, causes, languages,
        portfolio_url: portfolio, website_url: website, linkedin_url: linkedin,
        phone_number: phone, instagram_url: instagram,
        slug,
        show_bio: showBio, show_headline: showHeadline, show_known_for: showKnownFor,
        show_what_i_do: showWhatIDo, show_featured_work: showFeaturedWork, show_location: showLocation,
        show_skills: showSkills, show_open_to: showOpenTo, show_availability: showAvailability,
        show_interests: showInterests, show_causes: showCauses, show_languages: showLanguages,
        show_linkedin: showLinkedin, show_website: showWebsite, show_portfolio: showPortfolio,
        show_instagram: showInstagram, show_phone: showPhone, show_email: showEmail,
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
          {/* Avatar upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 26, color: "rgba(240,237,232,0.2)" }}>👤</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "rgba(240,237,232,0.4)", margin: "0 0 8px" }}>
                Profile photo · max 3MB
              </p>
              <label style={{
                display: "inline-block", padding: "9px 18px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: avatarUploading ? "rgba(240,237,232,0.3)" : "var(--ivory)",
                fontSize: 12, fontWeight: 500, cursor: avatarUploading ? "not-allowed" : "pointer",
              }}>
                {avatarUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" style={inp} />
          <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Headline — e.g. Product Designer building things people love" style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="Role" style={{ ...inp, marginBottom: 0 }} />
            <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation" style={{ ...inp, marginBottom: 0 }} />
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" style={{ ...inp, minHeight: "72px", resize: "vertical" as const, marginTop: 12 }} />
          <input value={knownFor} onChange={e => setKnownFor(e.target.value)} placeholder="Known for — e.g. Building communities through technology" style={{ ...inp, marginBottom: 0 }} />
        </Section>

        <Section title="What You Do" sub="Titles rarely explain what someone actually does — this does.">
          <textarea value={whatIDo} onChange={e => setWhatIDo(e.target.value)} placeholder="What you do — e.g. Building networking products for live experiences." style={{ ...inp, minHeight: "56px", resize: "vertical" as const }} />
          <input value={featuredWork} onChange={e => setFeaturedWork(e.target.value)} placeholder="Featured work — one thing you're proud of" style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Industry" style={{ ...inp, marginBottom: 0 }} />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" style={{ ...inp, marginBottom: 0 }} />
          </div>
          <p style={tagLabel}>Skills</p>
          <TagInput tags={skills} onChange={setSkills} placeholder="Type a skill, press Enter" />
        </Section>

        <Section title="Connect" sub="How and why people should reach out.">
          <p style={tagLabel}>Open To</p>
          <div style={{ marginBottom: 16 }}>
            <MultiSelectChips options={OPEN_TO_OPTIONS} selected={openTo} onChange={setOpenTo} />
          </div>
          <p style={tagLabel}>Available For — At Events</p>
          <div style={{ marginBottom: 16 }}>
            <MultiSelectChips options={AVAILABILITY_OPTIONS} selected={availability} onChange={setAvailability} />
          </div>
          <p style={tagLabel}>Interested In</p>
          <div style={{ marginBottom: 14 }}>
            <TagInput tags={interests} onChange={setInterests} placeholder="Type an interest, press Enter" />
          </div>
          <p style={tagLabel}>Causes</p>
          <div style={{ marginBottom: 14 }}>
            <TagInput tags={causes} onChange={setCauses} placeholder="A cause you care about, press Enter" />
          </div>
          <p style={tagLabel}>Languages</p>
          <div style={{ marginBottom: 16 }}>
            <TagInput tags={languages} onChange={setLanguages} placeholder="A language you speak, press Enter" />
          </div>
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" style={inp} />
          <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={inp} />
          <input value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="Portfolio URL" style={inp} />
          <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram URL" style={inp} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={{ ...inp, marginBottom: 0 }} />
        </Section>

        <a href="/home/profile/settings" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderRadius: 16, marginBottom: 18, textDecoration: "none",
          background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ivory)", margin: "0 0 2px" }}>Privacy & Account</p>
            <p style={{ fontSize: 11.5, color: "rgba(240,237,232,0.35)", margin: 0 }}>Control what's visible, manage your account</p>
          </div>
          <span style={{ color: "var(--ember)", fontSize: 16 }}>→</span>
        </a>

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
