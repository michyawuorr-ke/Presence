"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Only fields that actually render somewhere (the public card, or a
// guest-facing surface) get a visibility toggle here. Featured Work,
// Availability, Causes, Languages, and Skills were removed — none of
// them display anywhere yet (Skills is deferred for a later release).
const FIELD_GROUPS: { title: string; fields: { key: FieldKey; label: string }[] }[] = [
  {
    title: "Contact Details",
    fields: [
      { key: "showPhone", label: "Phone Number" },
      { key: "showEmail", label: "Email Address" },
      { key: "showLocation", label: "Location" },
    ],
  },
  {
    title: "Professional Identity",
    fields: [
      { key: "showHeadline", label: "Headline" },
      { key: "showBio", label: "Bio" },
    ],
  },
  {
    title: "Links & Socials",
    fields: [
      { key: "showLinkedin", label: "LinkedIn" },
      { key: "showWebsite", label: "Website" },
      { key: "showPortfolio", label: "Portfolio" },
      { key: "showInstagram", label: "Instagram" },
      { key: "showFacebook", label: "Facebook" },
      { key: "showX", label: "X" },
    ],
  },
];

type FieldKey =
  | "showBio" | "showHeadline" | "showLocation"
  | "showLinkedin" | "showWebsite" | "showPortfolio" | "showInstagram" | "showFacebook" | "showX"
  | "showPhone" | "showEmail";

const ALL_KEYS: FieldKey[] = FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key));

// Preset: everything visible.
const PUBLIC_PRESET: Record<FieldKey, boolean> = Object.fromEntries(ALL_KEYS.map(k => [k, true])) as any;

// Preset: professional identity visible, contact details and external
// links held back — a sensible "networking, not cold-contact" default.
const CONNECTIONS_PRESET: Record<FieldKey, boolean> = {
  showBio: true, showHeadline: true,
  showLocation: false,
  showLinkedin: false, showWebsite: false, showPortfolio: false, showInstagram: false,
  showFacebook: false, showX: false,
  showPhone: false, showEmail: false,
};

function matchesPreset(state: Record<FieldKey, boolean>, preset: Record<FieldKey, boolean>) {
  return ALL_KEYS.every(k => state[k] === preset[k]);
}

// Deliberately quiet — a thin outline that fills subtly when on, not a
// bold solid-color pill. Matches the app's restrained accent-color use
// (ember shows up sparingly elsewhere too) instead of a loud switch.
function Switch({ on }: { on: boolean }) {
  return (
    <span aria-hidden style={{
      flexShrink: 0, width: 32, height: 19, borderRadius: 10, position: "relative",
      background: on ? "rgba(226,109,52,0.16)" : "transparent",
      border: `1px solid ${on ? "rgba(226,109,52,0.4)" : "rgba(255,255,255,0.12)"}`,
      transition: "all 0.15s ease",
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 15 : 2, width: 13, height: 13, borderRadius: "50%",
        background: on ? "var(--ember)" : "rgba(255,255,255,0.3)", transition: "left 0.15s ease, background 0.15s ease",
      }} />
    </span>
  );
}

function SettingsRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
      padding: "13px 2px", cursor: "pointer", textAlign: "left",
    }}>
      <span style={{ fontSize: 13, color: "rgba(240,237,232,0.75)" }}>{label}</span>
      <Switch on={on} />
    </button>
  );
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: "9px 10px", borderRadius: 10, border: "none", cursor: "pointer",
      background: active ? "var(--ember)" : "transparent",
      color: active ? "#fff" : "rgba(240,237,232,0.5)",
      fontSize: 12, fontWeight: 600, transition: "all 0.15s ease",
    }}>
      {label}
    </button>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const [showBio, setShowBio] = useState(true);
  const [showHeadline, setShowHeadline] = useState(true);
  const [showKnownFor, setShowKnownFor] = useState(true);
  const [showWhatIDo, setShowWhatIDo] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showOpenTo, setShowOpenTo] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [showLinkedin, setShowLinkedin] = useState(true);
  const [showWebsite, setShowWebsite] = useState(true);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showInstagram, setShowInstagram] = useState(true);
  const [showFacebook, setShowFacebook] = useState(true);
  const [showX, setShowX] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const fieldState: Record<FieldKey, boolean> = {
    showBio, showHeadline, showLocation,
    showLinkedin, showWebsite, showPortfolio, showInstagram, showFacebook, showX,
    showPhone, showEmail,
  };
  const setters: Record<FieldKey, (v: boolean) => void> = {
    showBio: setShowBio, showHeadline: setShowHeadline,
    showLocation: setShowLocation,
    showLinkedin: setShowLinkedin, showWebsite: setShowWebsite, showPortfolio: setShowPortfolio,
    showInstagram: setShowInstagram, showFacebook: setShowFacebook, showX: setShowX,
    showPhone: setShowPhone, showEmail: setShowEmail,
  };

  const mode = useMemo(() => {
    if (matchesPreset(fieldState, PUBLIC_PRESET)) return "public";
    if (matchesPreset(fieldState, CONNECTIONS_PRESET)) return "connections";
    return "custom";
  }, [fieldState]);

  const didLoad = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setShowLocation(data.show_location ?? true);
        setShowOpenTo(data.show_open_to ?? true);
        setShowInterests(data.show_interests ?? true);
        setShowLinkedin(data.show_linkedin ?? true);
        setShowWebsite(data.show_website ?? true);
        setShowPortfolio(data.show_portfolio ?? true);
        setShowInstagram(data.show_instagram ?? true);
        setShowFacebook(data.show_facebook ?? true);
        setShowX(data.show_x ?? true);
        setShowPhone(data.show_phone ?? false);
        setShowEmail(data.show_email ?? false);

        const loadedState: Record<FieldKey, boolean> = {
          showBio: data.show_bio ?? true, showHeadline: data.show_headline ?? true,
          showLocation: data.show_location ?? true,
          showLinkedin: data.show_linkedin ?? true, showWebsite: data.show_website ?? true,
          showPortfolio: data.show_portfolio ?? true, showInstagram: data.show_instagram ?? true,
          showFacebook: data.show_facebook ?? true, showX: data.show_x ?? true,
          showPhone: data.show_phone ?? false, showEmail: data.show_email ?? false,
        };
        if (!matchesPreset(loadedState, PUBLIC_PRESET) && !matchesPreset(loadedState, CONNECTIONS_PRESET)) {
          setCustomOpen(true);
        }
      }
      setLoading(false);
      setTimeout(() => { didLoad.current = true; }, 0);
    }
    load();
  }, [router]);

  async function persist(overrides?: Partial<Record<FieldKey, boolean>>) {
    if (!profile?.id) return;
    const merged = { ...fieldState, ...overrides };
    const { error } = await supabase
      .from("master_profiles")
      .update({
        show_bio: merged.showBio, show_headline: merged.showHeadline, show_known_for: showKnownFor,
        show_what_i_do: showWhatIDo, show_location: merged.showLocation,
        show_open_to: showOpenTo, show_interests: showInterests,
        show_linkedin: merged.showLinkedin, show_website: merged.showWebsite, show_portfolio: merged.showPortfolio,
        show_instagram: merged.showInstagram, show_facebook: merged.showFacebook, show_x: merged.showX,
        show_phone: merged.showPhone, show_email: merged.showEmail,
      })
      .eq("id", profile.id);
    setToast(error ? "Couldn't save." : "Saved");
    setTimeout(() => setToast(""), 2000);
  }

  useEffect(() => {
    if (!didLoad.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { persist(); }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBio, showHeadline, showLocation,
      showLinkedin, showWebsite, showPortfolio, showInstagram, showFacebook, showX,
      showPhone, showEmail]);

  function applyPreset(preset: Record<FieldKey, boolean>) {
    ALL_KEYS.forEach(k => setters[k](preset[k]));
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
      setToast(result.error || "Couldn't delete your account.");
      setTimeout(() => setToast(""), 4000);
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
          <a href="/home/profile" style={{ color: "var(--ivory-muted)", fontSize: 11.5, textDecoration: "none" }}>Back to profile</a>
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
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ember)", margin: "0 0 4px" }}>Profile Visibility</p>
          <p style={{ fontSize: 11.5, color: "rgba(240,237,232,0.35)", margin: "0 0 16px", lineHeight: 1.5 }}>
            Your name and role are always visible when someone views your profile.
          </p>

          <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 12, background: "rgba(0,0,0,0.2)", marginBottom: customOpen ? 20 : 0 }}>
            <SegmentButton label="Public" active={mode === "public" && !customOpen} onClick={() => { applyPreset(PUBLIC_PRESET); setCustomOpen(false); }} />
            <SegmentButton label="Connections" active={mode === "connections" && !customOpen} onClick={() => { applyPreset(CONNECTIONS_PRESET); setCustomOpen(false); }} />
            <SegmentButton label="Custom" active={customOpen} onClick={() => setCustomOpen(true)} />
          </div>

          {!customOpen && (
            <p style={{ fontSize: 11.5, color: "rgba(240,237,232,0.3)", margin: "10px 0 0", lineHeight: 1.5 }}>
              {mode === "public"
                ? "Your profile is visible to anyone who scans your QR."
                : "Contact details and links are hidden until you connect with someone."}
            </p>
          )}

          {customOpen && FIELD_GROUPS.map(group => (
            <div key={group.title} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.3)", margin: "16px 0 2px" }}>
                {group.title}
              </p>
              {group.fields.map(f => (
                <SettingsRow key={f.key} label={f.label} on={fieldState[f.key]} onToggle={() => setters[f.key](!fieldState[f.key])} />
              ))}
            </div>
          ))}
        </div>

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

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,20,22,0.95)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
          padding: "9px 18px", fontSize: 12, color: "rgba(240,237,232,0.85)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 50,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
