"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { generateUniqueSlug } from "../slug";
import QRCode from "qrcode";
import TagInput from "./TagInput";
import MultiSelectChips from "./MultiSelectChips";
import { AVAILABILITY_OPTIONS } from "./profileOptions";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";

// ---------------------------------------------------------------------------
// The card reuses the app's existing dark theme tokens (var(--base),
// var(--ivory), var(--ember), etc) and mirrors the visual language already
// established by the public /u/[slug] card — gradient avatar circle, glass
// rows, ember accent — rather than inventing a separate light theme, so it
// reads as part of the same product instead of a bolted-on screen.
// ---------------------------------------------------------------------------
const inp = { width: "100%", padding: "13px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "var(--ivory)", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" as const, fontFamily: "var(--font-body)" };
const sectionLabel = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--ember)", margin: "0 0 4px" };
const sectionSub = { fontSize: "11.5px", color: "rgba(240,237,232,0.35)", margin: "0 0 18px", lineHeight: 1.5 };
const tagLabel = { fontSize: "10.5px", color: "rgba(240,237,232,0.3)", margin: "0 0 6px" };

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

/** Turns a raw value into a real href, adding https:// only when the value
 * looks like a bare domain rather than an already-complete URL. */
function toHref(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function mapsHref(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

/** wa.me needs the number in international format with no +, spaces, or
 * leading zeros — just the digits (country code included). This strips
 * everything else; it can't guess a missing country code, so numbers saved
 * without one (e.g. a bare local "0712...") will need it added manually. */
function waHref(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

/** No avatar_url column exists on master_profiles, and adding one is out of
 * scope here — so identity uses the same gradient initials mark the public
 * /u/[slug] card already uses, for visual consistency across the app. */
function InitialsAvatar({ name, size = 96 }: { name: string; size?: number }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, rgba(226,109,52,0.3), rgba(212,175,55,0.2))",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.36, color: "rgba(255,255,255,0.55)" }}>
        {initial}
      </span>
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href: string }) {
  return (
    <a href={href} target={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8,
        borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        textDecoration: "none",
      }}>
      <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(240,237,232,0.35)" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 13.5, color: "var(--ivory)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      </div>
    </a>
  );
}

function LinkedInGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ivory)" strokeWidth="1.6" opacity={0.75}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" />
      <line x1="7.2" y1="10" x2="7.2" y2="17" />
      <circle cx="7.2" cy="6.6" r="0.9" fill="var(--ivory)" stroke="none" />
      <path d="M11.2 17v-4.2c0-1.6 1-2.6 2.4-2.6s2.2 1 2.2 2.6V17" />
    </svg>
  );
}
function InstagramGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ivory)" strokeWidth="1.6" opacity={0.75}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="6" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="var(--ivory)" stroke="none" />
    </svg>
  );
}
function WebsiteGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ivory)" strokeWidth="1.6" opacity={0.75}>
      <circle cx="12" cy="12" r="9.5" />
      <ellipse cx="12" cy="12" rx="4" ry="9.5" />
      <line x1="2.5" y1="12" x2="21.5" y2="12" />
    </svg>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
      {children}
    </a>
  );
}

export default function HomeProfilePage({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [showMore, setShowMore] = useState(false);

  // Identity
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

  // Renders the QR onto a canvas rather than straight to a data URL so the
  // real Oreeti mark (same SVG as components/OreetiMark, rasterized) can be
  // drawn in the center afterward — at errorCorrectionLevel "H" the code
  // tolerates up to ~30% obstruction, so a compact mark still scans
  // reliably while making the code recognizably ours before anyone even
  // opens their camera.
  useEffect(() => {
    if (!profile?.slug) { setQrDataUrl(null); return; }
    let cancelled = false;
    const url = `https://oreeti.com/u/${profile.slug}`;
    const canvas = document.createElement("canvas");

    const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 140" fill="none">
      <path stroke="#EAE6DF" stroke-width="10" stroke-linecap="round" d="M 52 14 C 22 14, 4 36, 4 62 C 4 88, 22 110, 52 110" />
      <path stroke="#E26D34" stroke-width="10" stroke-linecap="round" d="M 56 6 C 86 6, 104 28, 104 54 C 104 80, 86 102, 56 102" />
    </svg>`;
    const markImg = new Image();
    const markLoaded = new Promise<void>(resolve => {
      markImg.onload = () => resolve();
      markImg.onerror = () => resolve();
    });
    markImg.src = `data:image/svg+xml;base64,${btoa(markSvg)}`;

    Promise.all([
      QRCode.toCanvas(canvas, url, { errorCorrectionLevel: "H", margin: 1, width: 400 }),
      markLoaded,
    ])
      .then(() => {
        if (cancelled) return;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const size = canvas.width;
          const cx = size / 2, cy = size / 2;
          const markH = size * 0.2;
          const markW = markH * (108 / 140);
          const pad = markH * 0.28;

          ctx.fillStyle = "#ffffff";
          const bw = markW + pad * 2, bh = markH + pad * 2;
          const bx = cx - bw / 2, by = cy - bh / 2;
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function") {
            (ctx as any).roundRect(bx, by, bw, bh, bh * 0.2);
          } else {
            ctx.rect(bx, by, bw, bh);
          }
          ctx.fill();

          if (markImg.complete && markImg.naturalWidth > 0) {
            ctx.drawImage(markImg, cx - markW / 2, cy - markH / 2, markW, markH);
          }
        }
        setQrDataUrl(canvas.toDataURL());
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [profile?.slug]);


  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
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
    const path = `${profile.id}/avatar.${ext}`;
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
    const { error: saveError } = await supabase
      .from("master_profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);
    if (saveError) {
      setNotification("Uploaded but couldn't save — " + saveError.message);
      setTimeout(() => setNotification(""), 4000);
    } else {
      setAvatarUrl(publicUrl + "?t=" + Date.now());
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
      setMode("view");
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

  /** Builds a real vCard 3.0 file from exactly the fields shown on the
   * card — same source of truth, same privacy toggles — so "Save Contact"
   * never leaks something the person chose to hide. */
  function downloadVCard() {
    if (!displayName) return;
    const vcard = buildVCard({
      name: displayName,
      organisation: organisation || null,
      role: roleTitle || null,
      phone: showPhone && phone ? phone : null,
      email: showEmail && profile?.email ? profile.email : null,
      location: showLocation && location ? location : null,
      portfolio: showPortfolio && portfolio ? portfolio : null,
      website: showWebsite && website ? website : null,
      linkedin: showLinkedin && linkedin ? linkedin : null,
      note: showBio && bio ? bio : null,
      oreetiUrl: profile?.slug ? `https://oreeti.com/u/${profile.slug}` : null,
    });
    downloadVCardFile(vcard, `${displayName.trim().replace(/\s+/g, "-").toLowerCase()}.vcf`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: embedded ? "40vh" : "100vh", background: embedded ? "transparent" : "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Loading...</p>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // EDIT MODE — only Identity + Contact & Links (the fields that
  // actually appear on the card) are shown up front. Everything else
  // (skills, interests, causes, languages, open to, availability, known
  // for, what I do, featured work, industry) never shows on the card,
  // so it's tucked behind "More details" instead of cluttering the
  // primary edit flow. Still fully editable, still saved the same way.
  // -------------------------------------------------------------------
  if (mode === "edit") {
    return (
      <div style={{ minHeight: embedded ? "auto" : "100vh", background: embedded ? "transparent" : "radial-gradient(ellipse 1000px 600px at 50% -15%, rgba(226,109,52,0.1), transparent 60%), var(--base)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: embedded ? "0 0 60px" : "40px 24px 100px" }}>
          <button onClick={() => setMode("view")} style={{ display: "inline-block", marginBottom: 28, color: "var(--ivory-muted)", fontSize: 11.5, background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Back to card</button>


          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,4vw,24px)", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
            Edit your identity.
          </h1>
          <p style={{ color: "var(--dusk)", fontSize: 12.5, margin: "0 0 24px" }}>These fields are what show up on your card.</p>

          <Section title="Identity">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 22, color: "rgba(240,237,232,0.2)" }}>👤</span>
                }
              </div>
              <label style={{ display: "inline-block", padding: "9px 18px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: avatarUploading ? "rgba(240,237,232,0.3)" : "var(--ivory)", fontSize: 12, fontWeight: 500, cursor: avatarUploading ? "not-allowed" : "pointer" }}>
                {avatarUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} style={{ display: "none" }} />
              </label>
            </div>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" style={inp} />
            <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Headline — e.g. Product Designer building things people love" style={inp} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="Role" style={{ ...inp, marginBottom: 0 }} />
              <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation" style={{ ...inp, marginBottom: 0 }} />
            </div>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" style={{ ...inp, minHeight: "72px", resize: "vertical" as const, marginTop: 12, marginBottom: 0 }} />
          </Section>

          <Section title="Contact & Links" sub="Shown on your card as tappable rows and icons.">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={inp} />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" style={inp} />
            <input value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="Portfolio URL" style={inp} />
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" style={inp} />
            <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={inp} />
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram URL" style={{ ...inp, marginBottom: 0 }} />
          </Section>

          <button onClick={() => setShowMore(s => !s)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
            background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16,
            padding: "14px 18px", marginBottom: showMore ? 12 : 18, cursor: "pointer",
          }}>
            <span style={{ fontSize: 12.5, color: "var(--ivory-muted)" }}>More details <span style={{ color: "rgba(240,237,232,0.35)" }}>— not shown on your card</span></span>
            <span style={{ color: "var(--ember)", fontSize: 13 }}>{showMore ? "Hide ▴" : "Show ▾"}</span>
          </button>

          {showMore && (
            <>
              <Section title="More About You" sub="Kept for future use — none of this appears on your card.">
                <input value={featuredWork} onChange={e => setFeaturedWork(e.target.value)} placeholder="Featured work" style={inp} />
                <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Industry" style={{ ...inp, marginBottom: 14 }} />
                <p style={tagLabel}>Skills</p>
                <TagInput tags={skills} onChange={setSkills} placeholder="Type a skill, press Enter" />
              </Section>

              <Section title="Connect Preferences" sub="Used elsewhere in Oreeti's networking features.">
                <p style={tagLabel}>Available For — At Events</p>
                <div style={{ marginBottom: 16 }}>
                  <MultiSelectChips options={AVAILABILITY_OPTIONS} selected={availability} onChange={setAvailability} />
                </div>
                <p style={tagLabel}>Causes</p>
                <div style={{ marginBottom: 14 }}>
                  <TagInput tags={causes} onChange={setCauses} placeholder="A cause you care about, press Enter" />
                </div>
                <p style={tagLabel}>Languages</p>
                <div>
                  <TagInput tags={languages} onChange={setLanguages} placeholder="A language you speak, press Enter" />
                </div>
              </Section>
            </>
          )}

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

  // -------------------------------------------------------------------
  // VIEW MODE — the identity card.
  // -------------------------------------------------------------------
  const roleOrgLine = [roleTitle, organisation].filter(Boolean).join(" · ");

  const contactRows = [
    showPhone && phone && { icon: "📞", label: "Phone", value: phone, href: telHref(phone) },
    // Derived from the same phone number, not a separate field — no new
    // column needed. Kept behind the same showPhone toggle as Phone itself,
    // since hiding your number should hide this too.
    showPhone && phone && { icon: "💬", label: "WhatsApp", value: phone, href: waHref(phone) },
    showEmail && profile?.email && { icon: "✉️", label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    showLocation && location && { icon: "📍", label: "Location", value: location, href: mapsHref(location) },
    showPortfolio && portfolio && { icon: "🌐", label: "Portfolio", value: portfolio.replace(/^https?:\/\//i, ""), href: toHref(portfolio) },
  ].filter(Boolean) as { icon: string; label: string; value: string; href: string }[];

  const socials = [
    showLinkedin && linkedin && { label: "LinkedIn", href: toHref(linkedin), glyph: <LinkedInGlyph /> },
    showInstagram && instagram && { label: "Instagram", href: toHref(instagram), glyph: <InstagramGlyph /> },
    showWebsite && website && { label: "Website", href: toHref(website), glyph: <WebsiteGlyph /> },
  ].filter(Boolean) as { label: string; href: string; glyph: React.ReactNode }[];

  return (
    <div style={{ minHeight: embedded ? "auto" : "100vh", background: embedded ? "transparent" : "radial-gradient(ellipse 1000px 600px at 50% -15%, rgba(226,109,52,0.08), transparent 60%), var(--base)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: embedded ? "0 0 40px" : "28px 24px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: embedded ? "flex-end" : "space-between", marginBottom: 24 }}>
          {!embedded && <a href="/home" style={{ color: "var(--dusk)", fontSize: 12, textDecoration: "none" }}>← Back</a>}
          <button onClick={() => setMode("edit")} style={{ background: "none", border: "none", color: "var(--ember)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            Edit
          </button>
        </div>

        {/* Identity */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* Cover banner */}
          <div style={{
            height: 110, borderRadius: "18px 18px 0 0", marginBottom: 0,
            background: "linear-gradient(135deg, rgba(226,109,52,0.55) 0%, rgba(212,175,55,0.25) 50%, rgba(30,20,10,0.6) 100%), linear-gradient(180deg, #1a0f05 0%, #2a1508 100%)",
          }} />
          {/* Avatar overlapping the banner */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: -48, marginBottom: 14 }}>
            <div style={{ borderRadius: "50%", border: "3px solid var(--base)", background: "var(--base)", lineHeight: 0 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
                : <InitialsAvatar name={displayName} />
              }
            </div>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.01em", margin: "0 0 6px" }}>
            {displayName || "Your name"}
          </h1>
          {showHeadline && headline && (
            <p style={{ fontSize: 13.5, color: "var(--ember)", margin: "0 0 4px" }}>{headline}</p>
          )}
          {showBio && bio && (
            <p style={{ fontSize: 13.5, color: "rgba(240,237,232,0.7)", lineHeight: 1.65, margin: "10px 0" }}>{bio}</p>
          )}
          {roleOrgLine && (
            <p style={{ fontSize: 13, color: "var(--dusk)", margin: "6px 0 0" }}>{roleOrgLine}</p>
          )}
        </div>

        {/* Contact */}
        {contactRows.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {contactRows.map(row => <ContactRow key={row.label} {...row} />)}
          </div>
        )}

        {/* Social */}
        {socials.length > 0 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: 26,
            padding: "8px 0 24px",
          }}>
            {socials.map(s => (
              <SocialIcon key={s.label} href={s.href} label={s.label}>{s.glyph}</SocialIcon>
            ))}
          </div>
        )}

        {/* QR — white surface, since a QR needs a light background to scan reliably */}
        <div style={{ textAlign: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {profile?.slug && qrDataUrl ? (
            <>
              <button onClick={() => setPresenting(true)} aria-label="Present QR code full-screen" style={{
                width: 176, height: 176, margin: "24px auto 8px", borderRadius: 18,
                background: "#fff", padding: 12, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.5)",
                border: "none", cursor: "pointer", display: "block",
              }}>
                <img src={qrDataUrl} alt="Your Oreeti QR code" style={{ width: "100%", height: "100%", display: "block" }} />
              </button>
              <p style={{ fontSize: 10.5, color: "rgba(240,237,232,0.3)", margin: "0 0 12px" }}>Tap to present — hides everything else on screen</p>
              <p style={{ fontSize: 11.5, color: "var(--dusk)", margin: "0 0 12px" }}>oreeti.com/u/{profile.slug}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
                <button onClick={copyLink} style={{ background: "none", border: "none", color: "var(--dusk)", fontSize: 11.5, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  {copied ? "Copied ✓" : "Copy link"}
                </button>
                <button onClick={downloadQr} style={{ background: "none", border: "none", color: "var(--dusk)", fontSize: 11.5, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  Save QR
                </button>
                <button onClick={downloadVCard} style={{ background: "none", border: "none", color: "var(--dusk)", fontSize: 11.5, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  Save Contact
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 12, color: "var(--dusk)", padding: "24px 0" }}>Save your profile to generate your QR code.</p>
          )}
        </div>

        {/* Full-screen "Present" mode — the only thing on screen when
            handing your phone to someone or holding it up to be scanned
            is the QR itself and your name. Nothing else from the card
            (bio, phone, links) is visible, so a bystander glancing at
            the screen can't read anything they haven't earned by
            actually scanning. */}
        {presenting && qrDataUrl && (
          <div onClick={() => setPresenting(false)} style={{
            position: "fixed", inset: 0, background: "#fff", zIndex: 9999,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "pointer",
          }}>
            <button onClick={() => setPresenting(false)} aria-label="Close" style={{
              position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%",
              background: "rgba(27,26,23,0.06)", border: "none", color: "#1B1A17", fontSize: 16, cursor: "pointer",
            }}>
              ✕
            </button>
            <img src={qrDataUrl} alt="Your Oreeti QR code" style={{ width: "min(78vw, 340px)", height: "min(78vw, 340px)" }} />
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#1B1A17", margin: "24px 0 4px" }}>{displayName}</p>
            <p style={{ fontSize: 12.5, color: "#8A8474" }}>Scan to connect on Oreeti</p>
          </div>
        )}

        {notification && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <p style={{ color: "var(--ember)", fontSize: 12, margin: 0 }}>{notification}</p>
          </div>
        )}
      </div>
    </div>
  );
}
