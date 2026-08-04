"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import QRCode from "qrcode";
import { Phone, Mail, MapPin, Globe, Linkedin, Instagram, MessageCircle } from "lucide-react";
import OreetiMark from "@/components/OreetiMark";

interface PublicProfile {
  id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  organisation: string | null;
  role_title: string | null;
  location: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  phone_number: string | null;
  email: string | null;
  show_bio: boolean;
  show_headline: boolean;
  show_location: boolean;
  show_linkedin: boolean;
  show_website: boolean;
  show_portfolio: boolean;
  show_instagram: boolean;
  show_phone: boolean;
  show_email: boolean;
}

function toHref(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Tap-to-action rows: each one fires the native handler directly —
// tel: opens the dialer, mailto: opens mail, maps opens directions,
// no intermediate "are you sure" step. This is the whole point of a
// digital card over a printed one.
function ActionRow({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px", borderRadius: 14,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        color: "var(--ivory)", textDecoration: "none", fontSize: 13.5,
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(226,109,52,0.1)", color: "var(--ember)",
      }}>
        {icon}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </a>
  );
}

// Social icons — tap opens that exact account directly, icon-only,
// no raw URL text anywhere on the card.
function SocialIcon({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        width: 42, height: 42, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        color: "var(--ivory)",
      }}
    >
      {icon}
    </a>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [viewerMasterProfileId, setViewerMasterProfileId] = useState<string | null>(null);
  const [connectState, setConnectState] = useState<"idle" | "connecting" | "connected" | "self" | "error">("idle");

  useEffect(() => {
    async function load() {
      const [{ data: prof }, { data: { session } }] = await Promise.all([
        supabase.from("master_profiles").select("*").eq("slug", slug).maybeSingle(),
        supabase.auth.getSession(),
      ]);

      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      QRCode.toDataURL(`https://oreeti.com/u/${prof.slug}`, { errorCorrectionLevel: "H", margin: 1, width: 400 })
        .then(setQrDataUrl)
        .catch(() => {});

      if (session?.user?.email) {
        const email = session.user.email.toLowerCase();
        const { data: viewerProf } = await supabase
          .from("master_profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (viewerProf) {
          setViewerMasterProfileId(viewerProf.id);
          if (viewerProf.id === prof.id) setConnectState("self");
          else {
            const { data: existing } = await supabase
              .from("profile_connections")
              .select("id")
              .or(`and(sender_id.eq.${viewerProf.id},receiver_id.eq.${prof.id}),and(sender_id.eq.${prof.id},receiver_id.eq.${viewerProf.id})`)
              .maybeSingle();
            if (existing) setConnectState("connected");
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleConnect() {
    if (!viewerMasterProfileId || !profile) return;
    setConnectState("connecting");
    const { error } = await supabase.from("profile_connections").insert({
      sender_id: viewerMasterProfileId,
      receiver_id: profile.id,
    });
    setConnectState(error ? "error" : "connected");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: "var(--ivory)", fontSize: 16, marginBottom: 8 }}>This profile doesn't exist.</p>
        <a href="/" style={{ color: "var(--ember)", fontSize: 13, textDecoration: "none" }}>Go to Oreeti →</a>
      </div>
    );
  }

  // Direct-action contact rows — only the ones the person has both
  // filled in AND chosen to show.
  const actions = [
    profile.show_phone && profile.phone_number && {
      key: "phone", icon: <Phone size={15} />, label: profile.phone_number, href: `tel:${profile.phone_number}`,
    },
    profile.show_email && profile.email && {
      key: "email", icon: <Mail size={15} />, label: profile.email, href: `mailto:${profile.email}`,
    },
    profile.show_location && profile.location && {
      key: "location", icon: <MapPin size={15} />, label: profile.location,
      href: `https://maps.google.com/?q=${encodeURIComponent(profile.location)}`,
    },
    profile.show_website && profile.website_url && {
      key: "website", icon: <Globe size={15} />, label: profile.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      href: toHref(profile.website_url),
    },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; label: string; href: string }[];

  // Social icons — direct link to the exact account/profile, icon only.
  const socials = [
    profile.show_linkedin && profile.linkedin_url && { key: "linkedin", label: "LinkedIn", icon: <Linkedin size={18} />, href: toHref(profile.linkedin_url) },
    profile.show_instagram && profile.instagram_url && { key: "instagram", label: "Instagram", icon: <Instagram size={18} />, href: toHref(profile.instagram_url) },
    profile.show_portfolio && profile.portfolio_url && { key: "portfolio", label: "Portfolio", icon: <Globe size={18} />, href: toHref(profile.portfolio_url) },
    profile.show_phone && profile.phone_number && {
      key: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={18} />,
      href: `https://wa.me/${profile.phone_number.replace(/[^\d]/g, "")}`,
    },
  ].filter(Boolean) as { key: string; label: string; icon: React.ReactNode; href: string }[];

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "28px 20px 60px" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, opacity: 0.85 }}>
          <OreetiMark size={22} />
        </div>

        {/* Identity */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{
            width: 92, height: 92, borderRadius: "50%", margin: "0 auto 18px", overflow: "hidden",
            background: "linear-gradient(135deg, rgba(226,109,52,0.3), rgba(212,175,55,0.2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "rgba(255,255,255,0.5)" }}>
                {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, color: "var(--ivory)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            {profile.display_name}
          </h1>
          {profile.show_headline && profile.headline && (
            <p style={{ fontSize: 13.5, color: "var(--ember)", margin: "0 0 4px" }}>{profile.headline}</p>
          )}
          {(profile.role_title || profile.organisation) && (
            <p style={{ fontSize: 13, color: "var(--dusk)", margin: 0 }}>
              {profile.role_title}{profile.role_title && profile.organisation ? " · " : ""}{profile.organisation}
            </p>
          )}
        </div>

        {profile.show_bio && profile.bio && (
          <p style={{ fontSize: 14, color: "rgba(240,237,232,0.75)", lineHeight: 1.65, textAlign: "center", marginBottom: 24 }}>
            {profile.bio}
          </p>
        )}

        {/* Tap-to-action contact rows */}
        {actions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
            {actions.map(a => <ActionRow key={a.key} icon={a.icon} label={a.label} href={a.href} />)}
          </div>
        )}

        {/* Social icons */}
        {socials.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 28 }}>
            {socials.map(s => <SocialIcon key={s.key} href={s.href} label={s.label} icon={s.icon} />)}
          </div>
        )}

        {/* QR code */}
        {qrDataUrl && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <div style={{ width: 132, height: 132, borderRadius: 16, background: "#fff", padding: 10, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.5)" }}>
              <img src={qrDataUrl} alt="Scan to open this profile" style={{ width: "100%", height: "100%", display: "block" }} />
            </div>
          </div>
        )}

        {/* Connect action */}
        {connectState === "self" ? (
          <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--dusk)" }}>This is your own profile.</p>
        ) : connectState === "connected" ? (
          <p style={{ textAlign: "center", fontSize: 13, color: "#22c55e" }}>✓ Connected</p>
        ) : viewerMasterProfileId ? (
          <button onClick={handleConnect} disabled={connectState === "connecting"} style={{
            width: "100%", padding: 14, borderRadius: 14,
            background: connectState === "connecting" ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, var(--ember), #c9591f)",
            color: "#fff", border: "none", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
            textTransform: "uppercase", cursor: connectState === "connecting" ? "default" : "pointer",
          }}>
            {connectState === "connecting" ? "Connecting..." : connectState === "error" ? "Try again" : "Connect"}
          </button>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12.5, color: "var(--ivory-muted)", marginBottom: 14, lineHeight: 1.5 }}>
              Create a free Oreeti account to save this connection and get your own profile to share.
            </p>
            <a href={`/login?mode=landing`} style={{
              display: "block", width: "100%", padding: 14, borderRadius: 14, boxSizing: "border-box",
              background: "linear-gradient(135deg, var(--ember), #c9591f)",
              color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
              textTransform: "uppercase", textDecoration: "none",
            }}>
              Create Free Account
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
