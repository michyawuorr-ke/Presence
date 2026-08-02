"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface PublicProfile {
  id: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  organisation: string | null;
  role_title: string | null;
  industry: string | null;
  skills: string[] | null;
  interests: string[] | null;
  linkedin_url: string | null;
  website_url: string | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  phone_number: string | null;
  email: string | null;
  show_bio: boolean;
  show_headline: boolean;
  show_skills: boolean;
  show_interests: boolean;
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

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
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

      if (session?.user?.email) {
        const email = session.user.email.toLowerCase();
        setViewerEmail(email);
        const { data: viewerProf } = await supabase
          .from("master_profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (viewerProf) {
          setViewerMasterProfileId(viewerProf.id);
          if (viewerProf.id === prof.id) setConnectState("self");
          else {
            // Check if already connected — don't show "Connect" if so.
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
    // Instant, not request-based — opening someone's personal profile link
    // and tapping Connect is itself the consent, same principle as an
    // in-person QR scan being instant rather than request-then-accept.
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

  const links = [
    { label: "LinkedIn", url: profile.linkedin_url, show: profile.show_linkedin },
    { label: "Website", url: profile.website_url, show: profile.show_website },
    { label: "Portfolio", url: profile.portfolio_url, show: profile.show_portfolio },
    { label: "Instagram", url: profile.instagram_url, show: profile.show_instagram },
  ].filter(l => l.url && l.show);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "56px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 84, height: 84, borderRadius: "50%", margin: "0 auto 20px",
            background: "linear-gradient(135deg, rgba(226,109,52,0.3), rgba(212,175,55,0.2))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "rgba(255,255,255,0.5)" }}>
              {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
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

        {profile.show_skills && profile.skills && profile.skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", textAlign: "center", marginBottom: 8 }}>Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {profile.skills.map(s => (
                <span key={s} style={{ fontSize: 11.5, color: "var(--ivory)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "5px 11px", borderRadius: 20 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {profile.show_interests && profile.interests && profile.interests.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", textAlign: "center", marginBottom: 8 }}>Interested In</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {profile.interests.map(s => (
                <span key={s} style={{ fontSize: 11.5, color: "var(--ember)", background: "rgba(226,109,52,0.06)", border: "1px solid rgba(226,109,52,0.2)", padding: "5px 11px", borderRadius: 20 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {links.map(l => (
              <a key={l.label} href={toHref(l.url!)} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--ivory)", fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                {l.label}
              </a>
            ))}
          </div>
        )}

        {/* Connect action — branches on whether the viewer is a logged-in
            Oreeti user or not, per the vision doc's two flows. */}
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
          // Viewer has no Oreeti account (or isn't logged in) — the
          // web-fallback flow from the vision doc: they can view the
          // profile fully, but creating an account is required to save
          // the connection, which is the actual growth loop mechanism.
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
