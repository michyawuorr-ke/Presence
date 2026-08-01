"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import OreetiLogo from "@/components/OreetiLogo";

type Mode = "landing" | "signup" | "login" | "sent";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.animationDelay = (el.dataset.delay || "0") + "ms";
            el.classList.add("reveal");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// Same gradient depth treatment used across the marketing site — a soft
// radial glow rather than flat black, so the page has the same layered
// feel as /features, /about, etc instead of standing apart from them.
const PAGE_BG: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 24px",
};

function LoginForm() {
  useReveal();
  const searchParams = useSearchParams();
  // Lets other parts of the app (e.g. the post-event "save your history"
  // prompt) link straight into Sign In with the guest's known email
  // pre-filled, instead of dropping them on the landing choice screen to
  // retype something the app already has.
  const prefilledEmail = searchParams.get("email") || "";
  const initialMode = (searchParams.get("mode") as Mode) || "landing";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inp = {
    width: "100%",
    padding: "13px 0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(234,230,223,0.12)",
    color: "var(--ivory)",
    fontSize: "14.5px",
    outline: "none",
    borderRadius: 0,
    boxSizing: "border-box" as const,
    fontFamily: "var(--font-body)",
    letterSpacing: "0.01em",
  };

  async function handleSignup() {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!phone.trim()) { setError("Please enter your M-Pesa phone number"); return; }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setError("Please enter a valid phone number"); return; }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://oreeti.com/auth/callback",
        data: { name, phone },
      },
    });

    if (err) { setError(err.message); setLoading(false); return; }
    await supabase.from("hosts").upsert({ email, name, phone }, { onConflict: "email" });
    setMode("sent");
    setLoading(false);
  }

  async function handleLogin() {
    if (!email.trim()) { setError("Please enter your email"); return; }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://oreeti.com/auth/callback",
      },
    });

    if (err) { setError(err.message); setLoading(false); return; }
    setMode("sent");
    setLoading(false);
  }

  if (mode === "landing") {
    return (
      <main style={PAGE_BG}>
        <div data-reveal style={{ marginBottom: "56px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
          <OreetiLogo size="xs" />
          <p className="eyebrow">The room activated</p>
        </div>
        <div data-reveal data-delay="100" style={{ width: "100%", maxWidth: "300px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <button onClick={() => { setMode("signup"); setError(""); }}
            style={{
              width: "100%", padding: "15px", borderRadius: "12px",
              background: "linear-gradient(135deg, var(--ember), #c9591f)",
              color: "#fff", border: "none", fontSize: "12.5px", fontWeight: "600",
              letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(226,109,52,0.25)",
            }}>
            Create an Account
          </button>
          <button onClick={() => { setMode("login"); setError(""); }}
            style={{ width: "100%", padding: "13px", background: "transparent", color: "var(--ivory-soft)", border: "1px solid rgba(234,230,223,0.1)", borderRadius: "12px", fontSize: "12.5px", fontWeight: "500", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            Sign In
          </button>
        </div>
      </main>
    );
  }

  if (mode === "sent") {
    return (
      <main style={PAGE_BG}>
        <div data-reveal style={{ fontSize: "26px", color: "var(--ember)", marginBottom: "20px" }}>✉</div>
        <h2 data-reveal className="display" style={{ fontSize: "20px", fontWeight: 500, color: "var(--ivory)", textAlign: "center", marginBottom: "10px", letterSpacing: "-0.01em" }}>
          Check your email
        </h2>
        <p data-reveal style={{ color: "var(--ivory-muted)", textAlign: "center", marginBottom: "4px", fontSize: "13.5px" }}>We sent an access verification link to</p>
        <p data-reveal style={{ color: "var(--ember)", textAlign: "center", marginBottom: "36px", fontSize: "14.5px", fontWeight: "500" }}>{email}</p>
        <button onClick={() => { setMode("landing"); setEmail(""); setName(""); setPhone(""); }}
          style={{ background: "transparent", border: "none", color: "var(--ivory-muted)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
          ← Return
        </button>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)", display: "flex", flexDirection: "column", padding: "40px 24px", maxWidth: "420px", margin: "0 auto", justifyContent: "space-between" }}>
      <div>
        <button onClick={() => { setMode("landing"); setError(""); }}
          style={{ background: "none", border: "none", color: "var(--ivory-muted)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", marginBottom: "48px", padding: "0" }}>
          ← Cancel
        </button>

        <div data-reveal style={{ marginBottom: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <OreetiLogo size="xs" />
          <p className="eyebrow">The room activated</p>
          <h1 className="display" style={{ fontSize: "22px", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.01em", marginTop: "12px", marginBottom: "0" }}>
            {mode === "signup" ? "Create Account" : "Sign In"}
          </h1>
        </div>

        <div data-reveal data-delay="80" style={{ display: "flex", flexDirection: "column", gap: "22px", marginBottom: "32px" }}>
          {mode === "signup" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" type="text" style={inp} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" type="email" style={inp} />
          {mode === "signup" && (
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" type="tel" style={inp} />
          )}
        </div>
      </div>

      <div style={{ width: "100%" }}>
        {error && <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "16px", textAlign: "center" }}>{error}</p>}

        <button
          onClick={mode === "signup" ? handleSignup : handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "12px",
            background: loading ? "rgba(234,230,223,0.1)" : "linear-gradient(135deg, var(--ember), #c9591f)",
            color: loading ? "var(--ivory-muted)" : "#fff",
            border: "none",
            fontSize: "12.5px",
            fontWeight: "600",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 8px 24px rgba(226,109,52,0.25)",
          }}
        >
          {loading ? "Processing..." : "Continue →"}
        </button>

        <div style={{ marginTop: "24px", textAlign: "center", padding: "0 16px" }}>
          <p style={{ color: "var(--ivory-muted)", fontSize: "11px", lineHeight: "1.6", letterSpacing: "0.03em", margin: 0 }}>
            By continuing above, you explicitly agree to be bound by Oreeti’s premium{" "}
            <a href="/terms" target="_blank" style={{ color: "var(--ember)", textDecoration: "none", borderBottom: "1px solid rgba(226,109,52,0.35)", fontWeight: "600" }}>Terms of Service</a>
            {" "}and dynamic{" "}
            <a href="/privacy" target="_blank" style={{ color: "var(--ember)", textDecoration: "none", borderBottom: "1px solid rgba(226,109,52,0.35)", fontWeight: "600" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </main>
  );
}

// useSearchParams requires a Suspense boundary in the App Router — without
// this wrapper, the build fails outright (not just a runtime warning).
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
