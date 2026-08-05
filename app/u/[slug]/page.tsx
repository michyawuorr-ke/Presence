"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { buildVCard, downloadVCardFile, toHref } from "@/lib/vcard";
import OreetiMark from "@/components/OreetiMark";

interface PublicProfile {
  id: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  organisation: string | null;
  role_title: string | null;
  location: string | null;
  industry: string | null;
  skills: string[] | null;
  interests: string[] | null;
  linkedin_url: string | null;
  website_url: string | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  phone_number: string | null;
  email: string | null;
  slug: string;
  show_bio: boolean;
  show_headline: boolean;
  show_location: boolean;
  show_skills: boolean;
  show_interests: boolean;
  show_linkedin: boolean;
  show_website: boolean;
  show_portfolio: boolean;
  show_instagram: boolean;
  show_phone: boolean;
  show_email: boolean;
}

/** Soft initials mark — this app has no avatar photo storage for
 * master_profiles, so every read-only card (this one and the owner-facing
 * identity card) uses the same gradient initials treatment. */
function Avatar({ name, size = 88 }: { name: string; size?: number }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", margin: "0 auto",
      background: "linear-gradient(135deg, rgba(226,109,52,0.3), rgba(212,175,55,0.2))",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.36, color: "rgba(255,255,255,0.55)" }}>
        {initial}
      </span>
    </div>
  );
}

/** A teaser card for content that's hidden from anonymous scanners — blurs
 * the real content underneath (rather than omitting it) so there's
 * something to be curious about, with a lock badge signaling why it's
 * illegible and a tap target that opens the unlock CTA. */
function LockedCard({ title, children, onTap }: { title: string; children: React.ReactNode; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{
      display: "block", width: "100%", textAlign: "left", cursor: "pointer",
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16, padding: "16px 18px", marginBottom: 10, position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.35)" }}>{title}</span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>🔒</span>
      </div>
      <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }} aria-hidden="true">
        {children}
      </div>
    </button>
  );
}

function toWaHref(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [viewerMasterProfileId, setViewerMasterProfileId] = useState<string | null>(null);
  const [connectState, setConnectState] = useState<"idle" | "connecting" | "connected" | "self" | "error">("idle");

  // Reciprocal "Send Details Back" quick-contact form — the anonymous-
  // scanner path that doesn't require creating an account.
  const [quickFormOpen, setQuickFormOpen] = useState(false);
  const [qcName, setQcName] = useState("");
  const [qcPhone, setQcPhone] = useState("");
  const [qcSubmitting, setQcSubmitting] = useState(false);
  const [qcDone, setQcDone] = useState(false);
  const [qcError, setQcError] = useState("");

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

  async function submitQuickContact() {
    if (!profile || !qcName.trim() || !qcPhone.trim()) return;
    setQcSubmitting(true);
    setQcError("");
    try {
      const res = await fetch("/api/connect/quick-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ master_profile_id: profile.id, name: qcName.trim(), phone: qcPhone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setQcError(json.error || "Couldn't send your details. Please try again."); setQcSubmitting(false); return; }
      setQcDone(true);
    } catch {
      setQcError("Couldn't send your details. Please try again.");
    }
    setQcSubmitting(false);
  }

  function handleSaveContact() {
    if (!profile) return;
    const vcard = buildVCard({
      name: profile.display_name,
      organisation: profile.organisation,
      role: profile.role_title,
      phone: profile.show_phone ? profile.phone_number : null,
      email: profile.show_email ? profile.email : null,
      location: profile.show_location ? profile.location : null,
      portfolio: profile.show_portfolio ? profile.portfolio_url : null,
      website: profile.show_website ? profile.website_url : null,
      linkedin: profile.show_linkedin ? profile.linkedin_url : null,
      note: profile.show_bio ? profile.bio : null,
      oreetiUrl: `https://oreeti.com/u/${profile.slug}`,
    });
    downloadVCardFile(vcard, `${profile.display_name.trim().replace(/\s+/g, "-").toLowerCase()}.vcf`);
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

  // Anyone with an established relationship to this profile — the owner
  // themselves, or a viewer who's already connected — sees everything in
  // full. Everyone else (an anonymous scanner, or a logged-in viewer who
  // hasn't connected yet) sees the gated experience.
  const isUnlocked = connectState === "self" || connectState === "connected";
  const isAnonymous = !viewerMasterProfileId;

  const roleOrgLine = [profile.role_title, profile.organisation].filter(Boolean).join(" · ");
  const hasTeaserContent = Boolean(
    (profile.show_skills && profile.skills?.length) ||
    (profile.show_interests && profile.interests?.length) ||
    (profile.show_linkedin && profile.linkedin_url) ||
    (profile.show_website && profile.website_url) ||
    (profile.show_portfolio && profile.portfolio_url) ||
    (profile.show_instagram && profile.instagram_url)
  );

  const links = [
    { label: "LinkedIn", url: profile.linkedin_url, show: profile.show_linkedin },
    { label: "Website", url: profile.website_url, show: profile.show_website },
    { label: "Portfolio", url: profile.portfolio_url, show: profile.show_portfolio },
    { label: "Instagram", url: profile.instagram_url, show: profile.show_instagram },
  ].filter(l => l.url && l.show);

  function scrollToUnlock() {
    document.getElementById("oreeti-unlock-cta")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* Brand mark — so it's evident this is an Oreeti card even before
            anyone reads a word of it. */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, opacity: 0.9 }}>
          <OreetiMark size={26} />
        </div>

        {/* ---------------------------------------------------------------
            A. PUBLIC HERO — always unlocked, regardless of viewer state.
        --------------------------------------------------------------- */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Avatar name={profile.display_name} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, color: "var(--ivory)", margin: "18px 0 4px", letterSpacing: "-0.01em" }}>
            {profile.display_name}
          </h1>
          {profile.show_headline && profile.headline && (
            <p style={{ fontSize: 13.5, color: "var(--ember)", margin: "0 0 4px" }}>{profile.headline}</p>
          )}
          {roleOrgLine && (
            <p style={{ fontSize: 13, color: "var(--dusk)", margin: 0 }}>{roleOrgLine}</p>
          )}
          {isUnlocked && profile.show_bio && profile.bio && (
            <p style={{ fontSize: 14, color: "rgba(240,237,232,0.75)", lineHeight: 1.65, margin: "16px 0 0" }}>{profile.bio}</p>
          )}
        </div>

        {/* Primary quick action — works with no account and no app. */}
        <button onClick={handleSaveContact} style={{
          width: "100%", padding: 15, borderRadius: 14, marginBottom: isUnlocked ? 28 : 22,
          background: "linear-gradient(135deg, var(--ember), #c9591f)", color: "#fff", border: "none",
          fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer",
          boxShadow: "0 12px 28px -8px rgba(226,109,52,0.4)",
        }}>
          Save Contact
        </button>

        {/* -----------------------------------------------------------
            B. TEASER / LOCKED CONTENT — only for anonymous scanners
            without an established connection. Connected viewers and
            the owner see this content unblurred instead, below.
        ----------------------------------------------------------- */}
        {!isUnlocked && hasTeaserContent && (
          <div style={{ marginBottom: 22 }}>
            {profile.show_skills && profile.skills && profile.skills.length > 0 && (
              <LockedCard title="Skills" onTap={scrollToUnlock}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {profile.skills.map(s => <span key={s} style={{ fontSize: 11.5, color: "var(--ivory)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "5px 11px", borderRadius: 20 }}>{s}</span>)}
                </div>
              </LockedCard>
            )}
            {profile.show_interests && profile.interests && profile.interests.length > 0 && (
              <LockedCard title="Interested In" onTap={scrollToUnlock}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {profile.interests.map(s => <span key={s} style={{ fontSize: 11.5, color: "var(--ember)", background: "rgba(226,109,52,0.06)", border: "1px solid rgba(226,109,52,0.2)", padding: "5px 11px", borderRadius: 20 }}>{s}</span>)}
                </div>
              </LockedCard>
            )}
            {links.length > 0 && (
              <LockedCard title="Social Links & Portfolio" onTap={scrollToUnlock}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {links.map(l => <div key={l.label} style={{ fontSize: 13, color: "var(--ivory)" }}>{l.label} — oreeti.com/••••••</div>)}
                </div>
              </LockedCard>
            )}
            <button onClick={scrollToUnlock} style={{
              width: "100%", padding: "12px", borderRadius: 12, marginTop: 4,
              background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.25)",
              color: "var(--ember)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}>
              🔒 Unlock Full Profile & Interactive Links
            </button>
          </div>
        )}

        {/* Unlocked view — connected viewers and the owner see full bio
            (rendered above) plus real, tappable links and tags. */}
        {isUnlocked && (
          <>
            {profile.show_skills && profile.skills && profile.skills.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", textAlign: "center", marginBottom: 8 }}>Skills</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {profile.skills.map(s => <span key={s} style={{ fontSize: 11.5, color: "var(--ivory)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "5px 11px", borderRadius: 20 }}>{s}</span>)}
                </div>
              </div>
            )}
            {profile.show_interests && profile.interests && profile.interests.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", textAlign: "center", marginBottom: 8 }}>Interested In</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {profile.interests.map(s => <span key={s} style={{ fontSize: 11.5, color: "var(--ember)", background: "rgba(226,109,52,0.06)", border: "1px solid rgba(226,109,52,0.2)", padding: "5px 11px", borderRadius: 20 }}>{s}</span>)}
                </div>
              </div>
            )}
            {profile.show_phone && profile.phone_number && (
              <a href={toWaHref(profile.phone_number)} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--ivory)", fontSize: 13, textDecoration: "none", textAlign: "center", marginBottom: 8 }}>
                💬 WhatsApp
              </a>
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
          </>
        )}

        {/* -----------------------------------------------------------
            REGISTRATION AS A TWO-WAY VALUE EXCHANGE
        ----------------------------------------------------------- */}
        {isAnonymous && (
          <div id="oreeti-unlock-cta" style={{
            background: "linear-gradient(165deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "22px 20px", marginBottom: 20,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ember)", margin: "0 0 4px" }}>
              Send Your Details Back — 1-Tap
            </p>
            <p style={{ fontSize: 12, color: "rgba(240,237,232,0.5)", margin: "0 0 16px", lineHeight: 1.5 }}>
              Reciprocate connection with {profile.display_name.split(" ")[0]} — a scan shouldn't be one-sided.
            </p>

            {!quickFormOpen ? (
              <button onClick={() => setQuickFormOpen(true)} style={{
                width: "100%", padding: 13, borderRadius: 12, marginBottom: 10,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--ivory)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}>
                Send my name & number back
              </button>
            ) : qcDone ? (
              <p style={{ fontSize: 13, color: "#22c55e", textAlign: "center", margin: "0 0 10px" }}>✓ Sent — {profile.display_name.split(" ")[0]} will see your details.</p>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <input value={qcName} onChange={e => setQcName(e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "var(--ivory)", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
                <input value={qcPhone} onChange={e => setQcPhone(e.target.value)} placeholder="Your phone number" type="tel" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "var(--ivory)", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
                {qcError && <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 10px" }}>{qcError}</p>}
                <button onClick={submitQuickContact} disabled={qcSubmitting || !qcName.trim() || !qcPhone.trim()} style={{
                  width: "100%", padding: 13, borderRadius: 12,
                  background: qcSubmitting ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, var(--ember), #c9591f)",
                  color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.03em",
                  textTransform: "uppercase", cursor: qcSubmitting ? "default" : "pointer",
                }}>
                  {qcSubmitting ? "Sending..." : "Send my details"}
                </button>
              </div>
            )}

            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(240,237,232,0.3)", margin: "12px 0" }}>or</div>

            <p style={{ fontSize: 12, color: "rgba(240,237,232,0.55)", margin: "0 0 12px", lineHeight: 1.5, textAlign: "center" }}>
              Create your free Oreeti Digital Card to automatically share your details back and stay connected.
            </p>
            <a href="/login?mode=landing" style={{
              display: "block", width: "100%", padding: 13, borderRadius: 12, boxSizing: "border-box",
              background: "transparent", border: "1px solid rgba(226,109,52,0.35)",
              color: "var(--ember)", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.03em",
              textTransform: "uppercase", textDecoration: "none", textAlign: "center",
            }}>
              Claim Your Free Oreeti Card
            </a>
          </div>
        )}

        {isAnonymous && hasTeaserContent && !isUnlocked && (
          <p style={{ fontSize: 11.5, color: "rgba(240,237,232,0.4)", textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
            Create a free Oreeti account to view {profile.display_name.split(" ")[0]}'s skills, interests, and social channels.
          </p>
        )}

        {/* Existing account → connect flow, unchanged for logged-in
            viewers who already have their own Oreeti profile. */}
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
        ) : null}

        {/* -----------------------------------------------------------
            BOTTOM BANNER
        ----------------------------------------------------------- */}
        {isAnonymous && (
          <a href="/login?mode=landing" style={{
            display: "block", textAlign: "center", marginTop: 32, padding: "14px 16px",
            borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)",
            textDecoration: "none",
          }}>
            <p style={{ fontSize: 12.5, color: "var(--ivory-muted)", margin: 0 }}>
              Impressed? <span style={{ color: "var(--ember)", fontWeight: 600 }}>Create your own custom Oreeti card in 30 seconds.</span>
            </p>
          </a>
        )}
      </div>
    </div>
  );
}
