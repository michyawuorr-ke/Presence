"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import OreetiLogo from "@/components/OreetiLogo";

type Mode = "landing" | "signup" | "login" | "sent";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("landing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inp = {
    width: "100%",
    padding: "12px 0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    borderRadius: 0,
    boxSizing: "border-box" as const,
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
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
        emailRedirectTo: "https://presence-bb5i.vercel.app/auth/callback",
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
        emailRedirectTo: "https://presence-bb5i.vercel.app/auth/callback",
      },
    });

    if (err) { setError(err.message); setLoading(false); return; }
    setMode("sent");
    setLoading(false);
  }

  if (mode === "landing") {
    return (
      <main style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ marginBottom: "56px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <OreetiLogo size="xs" />
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#E26D34", textTransform: "uppercase", fontWeight: "500", opacity: 0.9 }}>
            The room activated
          </p>
        </div>
        <div style={{ width: "100%", maxWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <button onClick={() => { setMode("signup"); setError(""); }} style={{ width: "100%", padding: "14px", borderRadius: "6px", background: "transparent", color: "#E26D34", border: "1px solid rgba(226,109,52,0.45)", fontSize: "12px", fontWeight: "500", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            Create an Account
          </button>
          <button onClick={() => { setMode("login"); setError(""); }} style={{ width: "100%", padding: "12px", background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", fontSize: "12px", fontWeight: "500", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            Sign In
          </button>
        </div>
      </main>
    );
  }

  if (mode === "sent") {
    return (
      <main style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ fontSize: "24px", color: "#E26D34", marginBottom: "24px", opacity: 0.85 }}>✉</div>
        <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", textAlign: "center", marginBottom: "8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Check your email</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "4px", fontSize: "13px" }}>We sent an access verification link to</p>
        <p style={{ color: "#E26D34", textAlign: "center", marginBottom: "32px", fontSize: "14px", fontWeight: "500" }}>{email}</p>
        <button onClick={() => { setMode("landing"); setEmail(""); setName(""); setPhone(""); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
          ← Return
        </button>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", padding: "40px 24px", maxWidth: "420px", margin: "0 auto", justifyContent: "space-between" }}>
      <div>
        <button onClick={() => { setMode("landing"); setError(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", marginBottom: "48px", padding: "0" }}>
          ← Cancel
        </button>
        
        <div style={{ marginBottom: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <OreetiLogo size="xs" />
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#E26D34", textTransform: "uppercase", fontWeight: "500", opacity: 0.9 }}>
            The room activated
          </p>
          <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "16px", marginBottom: "6px" }}>
            {mode === "signup" ? "Create Account" : "Sign In"}
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
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
            padding: "14px",
            borderRadius: "6px",
            background: loading ? "rgba(255,255,255,0.15)" : "#fff",
            color: loading ? "rgba(255,255,255,0.3)" : "#000",
            border: "none",
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Processing..." : "Continue →"}
        </button>

        <div style={{ marginTop: "24px", textAlign: "center", padding: "0 16px" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", lineHeight: "1.6", letterSpacing: "0.03em", margin: 0 }}>
            By continuing above, you explicitly agree to be bound by Oreeti’s premium{" "}
            <a href="/terms" target="_blank" style={{ color: "#E26D34", textDecoration: "none", borderBottom: "1px solid rgba(226,109,52,0.4)", fontWeight: "600" }}>Terms of Service</a>
            {" "}and dynamic{" "}
            <a href="/privacy" target="_blank" style={{ color: "#E26D34", textDecoration: "none", borderBottom: "1px solid rgba(226,109,52,0.4)", fontWeight: "600" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
