"use client";
import OreetiLogo from "@/components/OreetiLogo";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import Stats from "@/components/home/Stats";
import Hero from "@/components/home/Hero";

import useReveal from "@/components/home/useReveal";
import Problem from "@/components/home/Problem";
import Solution from "@/components/home/Solution";
import ForWho from "@/components/home/ForWho";
export default function Home() {
  useReveal();

  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }} className="marketing">
      <style>{`
        body { max-width: 100% !important; }

        @keyframes heroFade {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-word {
          display: inline-block;
          opacity: 0;
          animation: heroFade 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .problem-card:hover {
          border-color: rgba(138,115,85,0.35) !important;
          background: rgba(44,44,46,0.7) !important;
        }
        .cta-primary:hover { opacity: 0.88 !important; }
        .cta-secondary:hover { color: var(--ivory) !important; border-color: rgba(138,115,85,0.5) !important; }
      `}</style>

      <Nav />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <Hero />
<Stats />
      {/* ── PROBLEM ──────────────────────────────────────────────── */}
<Problem />
      {/* ── INSIGHT ──────────────────────────────────────────────── */}
<Solution />
      {/* ── FOR WHO ──────────────────────────────────────────────── */}
<ForWho />
      {/* ── PHILOSOPHY QUOTE ─────────────────────────────────────── */}
      <section style={{
        padding: "120px 32px",
        borderTop: "1px solid rgba(138,115,85,0.08)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }} data-reveal data-delay="0">
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px,3.5vw,42px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--ivory)",
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
            marginBottom: 32,
          }}>
            "Every great relationship started in a room. Oreeti makes sure the room is ready."
          </p>
          <div style={{
            width: 32, height: 1,
            background: "var(--ember)",
            margin: "0 auto",
          }} />
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 32px 120px",
        textAlign: "center",
        borderTop: "1px solid rgba(138,115,85,0.08)",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }} data-reveal data-delay="0">
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,4.5vw,56px)",
            fontWeight: 500,
            color: "var(--ivory)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            marginBottom: 24,
          }}>
            Your next event deserves a room that works.
          </h2>
          <p style={{
            color: "var(--dusk)", fontSize: 15,
            lineHeight: 1.7, marginBottom: 40,
          }}>
            Host for free. No credit card. No complexity.
          </p>
          <Link href="/login" style={{
            display: "inline-block",
            background: "rgba(226,109,52,0.08)",
            color: "#E26D34",
            padding: "16px 36px",
            borderRadius: 8, border: "1px solid rgba(226,109,52,0.45)", boxShadow: "0 0 20px rgba(226,109,52,0.1), inset 0 0 20px rgba(226,109,52,0.03)",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.03em",
            transition: "opacity 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Activate your room
          </Link>
        </div>
      </section>

      {/* ── GET IN TOUCH ──────────────────────────────────────── */}
      <section style={{ padding: "80px 32px", textAlign: "center", borderTop: "1px solid rgba(138,115,85,0.08)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(138,115,85,0.5)", marginBottom: 16 }}>Contact</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 16 }}>Let's talk.</h2>
          <p style={{ fontSize: 15, color: "var(--dusk)", lineHeight: 1.7, marginBottom: 36 }}>Organizer, investor, or just curious — reach out directly.</p>
          <a href="mailto:hello.oreeti@gmail.com" style={{ display: "inline-block", background: "rgba(226,109,52,0.08)", color: "#E26D34", fontSize: 13, fontWeight: 600, textDecoration: "none", padding: "12px 28px", borderRadius: 8, border: "1px solid rgba(226,109,52,0.45)", boxShadow: "0 0 16px rgba(226,109,52,0.1)", letterSpacing: "0.03em", marginBottom: 20 }}>Get in touch</a>
          <p style={{ margin: 0 }}><a href="mailto:hello.oreeti@gmail.com" style={{ fontSize: 13, color: "rgba(138,115,85,0.6)", textDecoration: "none", letterSpacing: "0.01em" }}>hello.oreeti@gmail.com</a></p>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .problem-grid { grid-template-columns: 1fr !important; }
          .who-grid { grid-template-columns: 1fr !important; }
          .how-steps > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
