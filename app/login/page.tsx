"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://presence-bb5i.vercel.app/auth/callback",
        data: { name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: "32px" }}>
          Presence
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: "300", color: "#fff", textAlign: "center", marginBottom: "16px" }}>
          Check your email
        </h1>
        <p style={{ color: "#666", textAlign: "center", marginBottom: "8px" }}>
          We sent a magic link to
        </p>
        <p style={{ color: "#fff", textAlign: "center", marginBottom: "48px" }}>
          {email}
        </p>
        <p style={{ color: "#444", fontSize: "13px", textAlign: "center" }}>
          Click the link in your email to sign in.
          <br />No password needed.
        </p>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: "32px" }}>
        Presence
      </p>
      <h1 style={{ fontSize: "32px", fontWeight: "300", color: "#fff", textAlign: "center", marginBottom: "8px" }}>
        Welcome back
      </h1>
      <p style={{ color: "#666", textAlign: "center", marginBottom: "48px" }}>
        Enter your email to receive a magic link
      </p>

      <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #222",
            background: "#111",
            color: "#fff",
            fontSize: "16px",
            outline: "none",
          }}
        />
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #222",
            background: "#111",
            color: "#fff",
            fontSize: "16px",
            outline: "none",
          }}
        />
        {error && (
          <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center" }}>
            {error}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            background: loading ? "#333" : "#fff",
            color: "#000",
            fontSize: "15px",
            fontWeight: "500",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </div>

      <p style={{ color: "#444", fontSize: "12px", marginTop: "32px", textAlign: "center" }}>
        No password. No hassle. Just your email.
      </p>
    </main>
  );
}
