#!/bin/bash
# Oreeti marketing website deploy script
# Run from inside your Presence repo root

mkdir -p app
cat > app/globals.css << 'OREETI_EOF_MARKER'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --base:     #0a0a0c;
  --obsidian: #2C2C2E;
  --ember:    #E26D34;
  --gold:     #D4AF37;
  --dusk:     #8A7355;
  --ivory:    #EAE6DF;

  --ember-dim:    rgba(226,109,52,0.08);
  --ember-border: rgba(226,109,52,0.18);
  --gold-dim:     rgba(212,175,55,0.08);
  --gold-border:  rgba(212,175,55,0.2);
  --dusk-border:  rgba(138,115,85,0.2);
  --ivory-soft:   rgba(234,230,223,0.55);
  --ivory-muted:  rgba(234,230,223,0.3);

  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

html { font-size: 14px; scroll-behavior: smooth; }

body {
  background-color: var(--base);
  color: var(--ivory);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  max-width: 480px;
  margin: 0 auto;
  overflow-x: hidden;
}

/* Marketing pages get full width */
body.marketing {
  max-width: 100%;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
input, textarea, button { font-family: var(--font-body); }
::-webkit-scrollbar { display: none; }

/* ─── Premium Form System (product) ─────────────────────────────────── */
.premium-form-group { margin-bottom: 24px; }

.premium-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--dusk);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.premium-input {
  width: 100%;
  background: var(--obsidian);
  border: 1px solid var(--dusk-border);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--ivory);
  font-size: 14px;
  transition: border-color 0.2s;
  outline: none;
}

.premium-input:focus { border-color: var(--ember); }

/* ─── Scroll reveal ──────────────────────────────────────────────────── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.reveal {
  opacity: 0;
  animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
}

/* ─── Typography helpers ─────────────────────────────────────────────── */
.display { font-family: var(--font-display); }
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dusk);
}
OREETI_EOF_MARKER

mkdir -p app
cat > app/layout.tsx << 'OREETI_EOF_MARKER'
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Oreeti — The room, activated.",
    template: "%s | Oreeti",
  },
  description: "Oreeti is the live event activation platform for professional connection. HMAC-signed QR check-in, M-Pesa ticketing, and consent-first networking — built for East Africa.",
  keywords: ["event networking", "event technology", "M-Pesa ticketing", "Nairobi events", "professional networking", "live events Africa"],
  openGraph: {
    title: "Oreeti — The room, activated.",
    description: "The infrastructure for meaningful connection at real-world events.",
    url: "https://oreeti.com",
    siteName: "Oreeti",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti — The room, activated.",
    description: "The infrastructure for meaningful connection at real-world events.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://oreeti.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        fontFamily: "var(--font-inter),-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        background: "#0a0a0c",
        color: "#EAE6DF",
      }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
OREETI_EOF_MARKER

mkdir -p app
cat > app/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import OreetiLogo from "@/components/OreetiLogo";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

/* ── ambient node-connection canvas ──────────────────────────────── */
function ConnectionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const NODE_COUNT = 28;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1.5,
      pulse: Math.random() * Math.PI * 2,
    }));

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // update
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.018;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const MAX = 140;
          if (dist < MAX) {
            const alpha = (1 - dist / MAX) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(138,115,85,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // nodes
      nodes.forEach(n => {
        const glow = Math.sin(n.pulse) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * glow, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(234,230,223,${0.25 * glow})`;
        ctx.fill();
      });

      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        opacity: 0.7,
        pointerEvents: "none",
      }}
    />
  );
}

/* ── scroll reveal hook ─────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = el.dataset.delay || "0";
            el.style.animationDelay = delay + "ms";
            el.classList.add("reveal");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── stat counter ───────────────────────────────────────────────── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(28px,4vw,44px)",
        fontWeight: 500,
        color: "var(--ivory)",
        letterSpacing: "-0.02em",
        margin: "0 0 6px",
        lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--dusk)",
        margin: 0,
        fontWeight: 500,
      }}>
        {label}
      </p>
    </div>
  );
}

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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 32px 80px",
        overflow: "hidden",
        textAlign: "center",
      }}>
        <ConnectionCanvas />

        {/* radial gradient base */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(44,44,46,0.45) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          <p className="eyebrow" style={{
            marginBottom: 32,
            opacity: 0,
            animation: "heroFade 0.6s ease forwards 0.1s",
          }}>
            Event intelligence · Built for Africa
          </p>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(38px,6.5vw,82px)",
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: "var(--ivory)",
            margin: "0 0 28px",
          }}>
            <span className="hero-word" style={{ animationDelay: "0.2s" }}>The room</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.38s", fontStyle: "italic" }}>knows</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.54s" }}>who</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.7s" }}>you</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.86s" }}>should</span>{" "}
            <span className="hero-word" style={{ animationDelay: "1.0s" }}>meet.</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px,1.8vw,19px)",
            color: "var(--dusk)",
            lineHeight: 1.65,
            maxWidth: 520,
            margin: "0 auto 48px",
            opacity: 0,
            animation: "heroFade 0.8s ease forwards 1.1s",
          }}>
            Oreeti turns events into living networks — where every handshake is intentional, every connection is earned, and the room activates around you.
          </p>

          <div style={{
            display: "flex", gap: 12, justifyContent: "center",
            flexWrap: "wrap",
            opacity: 0,
            animation: "heroFade 0.8s ease forwards 1.3s",
          }}>
            <Link href="/login" className="cta-primary" style={{
              background: "var(--ember)",
              color: "var(--ivory)",
              padding: "14px 28px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.03em",
              transition: "opacity 0.2s",
            }}>
              Host your first event
            </Link>
            <Link href="/features" className="cta-secondary" style={{
              background: "transparent",
              color: "var(--dusk)",
              padding: "14px 28px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.03em",
              border: "1px solid rgba(138,115,85,0.25)",
              transition: "color 0.2s, border-color 0.2s",
            }}>
              See how it works
            </Link>
          </div>
        </div>

        {/* scroll hint */}
        <div style={{
          position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
          opacity: 0,
          animation: "heroFade 1s ease forwards 1.8s",
        }}>
          <div style={{
            width: 1, height: 48,
            background: "linear-gradient(to bottom, rgba(138,115,85,0.5), transparent)",
            margin: "0 auto",
          }} />
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.12)",
        borderBottom: "1px solid rgba(138,115,85,0.12)",
        padding: "48px 32px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 32,
        }} className="stats-grid" data-reveal data-delay="0">
          <Stat value="60s" label="QR window" />
          <Stat value="0" label="Passwords" />
          <Stat value="100%" label="Consent-first" />
          <Stat value="M-Pesa" label="Native payments" />
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────── */}
      <section style={{ padding: "120px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div data-reveal data-delay="0" style={{ marginBottom: 72, textAlign: "center" }}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>The problem with events</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,4vw,52px)",
            fontWeight: 500,
            color: "var(--ivory)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 640,
            margin: "0 auto",
          }}>
            You leave with a pocket full of cards you&apos;ll never open.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 1,
          background: "rgba(138,115,85,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }} className="problem-grid">
          {[
            {
              n: "01",
              title: "The forgettable handshake",
              body: "You meet someone interesting. You exchange details in the noise. By Monday, you've forgotten their name and they've forgotten yours.",
            },
            {
              n: "02",
              title: "The awkward approach",
              body: "Breaking into a conversation at a conference feels like interrupting. Most people leave without speaking to half the people they intended to.",
            },
            {
              n: "03",
              title: "The wasted room",
              body: "Every event puts the right people in the same space. But without infrastructure, the connections never happen. The room goes quiet.",
            },
          ].map((item, i) => (
            <div
              key={item.n}
              className="problem-card"
              data-reveal
              data-delay={String(i * 100)}
              style={{
                background: "var(--obsidian)",
                padding: "40px 32px",
                transition: "background 0.25s, border-color 0.25s",
                border: "1px solid transparent",
                cursor: "default",
              }}
            >
              <p style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "rgba(138,115,85,0.45)",
                marginBottom: 20,
                textTransform: "uppercase",
              }}>
                {item.n}
              </p>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--ivory)",
                marginBottom: 14,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}>
                {item.title}
              </h3>
              <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── INSIGHT ──────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 32px",
        borderTop: "1px solid rgba(138,115,85,0.08)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }} data-reveal data-delay="0">
          <p className="eyebrow" style={{ marginBottom: 20 }}>A new idea</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px,4.5vw,60px)",
            fontWeight: 500,
            color: "var(--ivory)",
            lineHeight: 1.12,
            letterSpacing: "-0.025em",
            margin: "0 0 28px",
          }}>
            What if the room itself became the network?
          </h2>
          <p style={{
            fontSize: 16,
            color: "var(--dusk)",
            lineHeight: 1.75,
            maxWidth: 560,
            margin: "0 auto",
          }}>
            Oreeti is not a badge scanner. It is not a contact exchange. It is not another app you open once and forget. It is the operating system for the social layer of your event.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div data-reveal data-delay="0" style={{ marginBottom: 72 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>How it works</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px,3.5vw,44px)",
            fontWeight: 500,
            color: "var(--ivory)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 480,
          }}>
            Three moments that change everything.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }} className="how-steps">
          {[
            {
              step: "Register",
              headline: "Arrive with intent.",
              detail: "Guests register before the event and build their professional profile. No forms at the door. No name-tag confusion. You walk in already known.",
              accent: "var(--dusk)",
            },
            {
              step: "Discover",
              headline: "See who's in the room.",
              detail: "The Scene tab shows live attendee discovery. Browse professional context, set intent badges, and signal openness to connection — on your own terms.",
              accent: "var(--dusk)",
            },
            {
              step: "Connect",
              headline: "A QR scan that means something.",
              detail: "A mutual handshake request followed by a live QR scan. Both parties have chosen each other. That's not friction — that's meaning.",
              accent: "var(--ember)",
            },
          ].map((item, i) => (
            <div
              key={item.step}
              data-reveal
              data-delay={String(i * 120)}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: 32,
                padding: "44px 0",
                borderBottom: "1px solid rgba(138,115,85,0.1)",
                alignItems: "start",
              }}
            >
              <div>
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(138,115,85,0.4)",
                  margin: "0 0 6px",
                }}>
                  0{i + 1}
                </p>
                <p style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: item.accent,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: 0,
                }}>
                  {item.step}
                </p>
              </div>
              <div>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(18px,2.5vw,30px)",
                  fontWeight: 500,
                  color: "var(--ivory)",
                  letterSpacing: "-0.015em",
                  margin: "0 0 12px",
                  lineHeight: 1.2,
                }}>
                  {item.headline}
                </h3>
                <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, margin: 0, maxWidth: 520 }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOR WHO ──────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 32px",
        borderTop: "1px solid rgba(138,115,85,0.08)",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div data-reveal data-delay="0" style={{ marginBottom: 64, textAlign: "center" }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Who it&apos;s for</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px,3.5vw,44px)",
            fontWeight: 500,
            color: "var(--ivory)",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}>
            Built for two kinds of ambition.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }} className="who-grid">
          {/* Organizers */}
          <div data-reveal data-delay="0" style={{
            background: "var(--obsidian)",
            borderRadius: 16,
            padding: "48px 40px",
            border: "1px solid rgba(212,175,55,0.1)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 200, height: 200,
              background: "radial-gradient(circle at top right, rgba(212,175,55,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--gold)", marginBottom: 20,
            }}>
              Organizers
            </p>
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px,2.5vw,32px)",
              fontWeight: 500,
              color: "var(--ivory)",
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              marginBottom: 20,
            }}>
              Your event, elevated.
            </h3>
            <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>
              Magic link check-in. M-Pesa ticketing. Real-time activation dashboards. See who's in the room, what connections are forming, and what the energy looks like — while it's happening.
            </p>
            <Link href="/organizers" style={{
              color: "var(--gold)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.04em",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
              For organizers →
            </Link>
          </div>

          {/* Attendees */}
          <div data-reveal data-delay="100" style={{
            background: "var(--obsidian)",
            borderRadius: 16,
            padding: "48px 40px",
            border: "1px solid rgba(138,115,85,0.12)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 200, height: 200,
              background: "radial-gradient(circle at top right, rgba(138,115,85,0.05) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--dusk)", marginBottom: 20,
            }}>
              Attendees
            </p>
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px,2.5vw,32px)",
              fontWeight: 500,
              color: "var(--ivory)",
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              marginBottom: 20,
            }}>
              Connect without the chase.
            </h3>
            <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>
              Your profile lives in the room. Browse intent. Signal openness. Request a connection. When both sides want it, a scan makes it real. No apps to download. No awkward cold approaches.
            </p>
            <Link href="/attendees" style={{
              color: "rgba(234,230,223,0.6)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.04em",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
              For attendees →
            </Link>
          </div>
        </div>
      </section>

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
            background: "var(--ember)",
            color: "var(--ivory)",
            padding: "16px 36px",
            borderRadius: 8,
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
OREETI_EOF_MARKER

mkdir -p app
cat > app/sitemap.ts << 'OREETI_EOF_MARKER'
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://oreeti.com";
  const now = new Date();

  return [
    { url: base,                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/features`,      lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/organizers`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/attendees`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
  ];
}
OREETI_EOF_MARKER

mkdir -p app
cat > app/robots.ts << 'OREETI_EOF_MARKER'
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/features", "/organizers", "/attendees", "/faq", "/privacy", "/terms"],
        disallow: ["/dashboard/", "/api/", "/auth/", "/e/", "/register/"],
      },
    ],
    sitemap: "https://oreeti.com/sitemap.xml",
  };
}
OREETI_EOF_MARKER

mkdir -p components/marketing
cat > components/marketing/Nav.tsx << 'OREETI_EOF_MARKER'
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import OreetiLogo from "@/components/OreetiLogo";

const links = [
  { href: "/about",      label: "About" },
  { href: "/features",   label: "Features" },
  { href: "/organizers", label: "Organizers" },
  { href: "/attendees",  label: "Attendees" },
  { href: "/faq",        label: "FAQ" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "background 0.4s, border-color 0.4s",
        background: scrolled ? "rgba(10,10,12,0.88)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(138,115,85,0.12)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 32px",
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <OreetiLogo size="sm" />
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 36 }} className="desktop-nav">
            {links.map(l => (
              <Link key={l.href} href={l.href} style={{
                color: "rgba(234,230,223,0.55)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EAE6DF")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(234,230,223,0.55)")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{
              color: "rgba(234,230,223,0.55)",
              fontSize: 13, fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#EAE6DF")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(234,230,223,0.55)")}
            >
              Sign in
            </Link>
            <Link href="/login" style={{
              background: "#E26D34",
              color: "#EAE6DF",
              fontSize: 12, fontWeight: 600,
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 6,
              letterSpacing: "0.04em",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Get started
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              style={{
                display: "none", background: "none", border: "none",
                color: "#EAE6DF", cursor: "pointer", padding: 4,
              }}
              className="mobile-menu-btn"
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                {open
                  ? <><line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
                  : <><line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
                }
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
          background: "rgba(10,10,12,0.97)",
          borderBottom: "1px solid rgba(138,115,85,0.15)",
          padding: "24px 32px 32px",
          backdropFilter: "blur(20px)",
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                color: "rgba(234,230,223,0.7)",
                fontSize: 15, fontWeight: 500,
                textDecoration: "none",
                padding: "12px 0",
                borderBottom: "1px solid rgba(138,115,85,0.1)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
OREETI_EOF_MARKER

mkdir -p components/marketing
cat > components/marketing/Footer.tsx << 'OREETI_EOF_MARKER'
import React from "react";
import Link from "next/link";
import OreetiLogo from "@/components/OreetiLogo";

const cols = [
  {
    heading: "Product",
    links: [
      { label: "Features",   href: "/features" },
      { label: "Organizers", href: "/organizers" },
      { label: "Attendees",  href: "/attendees" },
      { label: "FAQ",        href: "/faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",   href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms",   href: "/terms" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Create account", href: "/login" },
      { label: "Sign in",        href: "/login" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(138,115,85,0.14)",
      padding: "64px 32px 40px",
      maxWidth: 1200, margin: "0 auto",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr repeat(3,auto)",
        gap: 48,
        marginBottom: 56,
      }} className="footer-grid">

        {/* Brand column */}
        <div>
          <OreetiLogo size="sm" />
          <p style={{
            marginTop: 20,
            color: "var(--dusk)",
            fontSize: 13,
            lineHeight: 1.7,
            maxWidth: 260,
          }}>
            The infrastructure for meaningful connection at real-world events.
          </p>
          <p style={{
            marginTop: 12,
            color: "rgba(138,115,85,0.5)",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            Nairobi, Kenya
          </p>
        </div>

        {cols.map(col => (
          <div key={col.heading}>
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(138,115,85,0.6)",
              marginBottom: 16,
              margin: "0 0 16px",
            }}>
              {col.heading}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map(l => (
                <Link key={l.href} href={l.href} style={{
                  color: "rgba(234,230,223,0.45)",
                  fontSize: 13,
                  fontWeight: 400,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#EAE6DF")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(234,230,223,0.45)")}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        borderTop: "1px solid rgba(138,115,85,0.1)",
        paddingTop: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <p style={{ color: "rgba(138,115,85,0.5)", fontSize: 12, margin: 0 }}>
          © 2025 Oreeti. All rights reserved.
        </p>
        <p style={{ color: "rgba(138,115,85,0.4)", fontSize: 11, margin: 0, letterSpacing: "0.04em" }}>
          The room, activated.
        </p>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
OREETI_EOF_MARKER

mkdir -p app/about
cat > app/about/layout.tsx << 'OREETI_EOF_MARKER'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Built in Nairobi because the room was too quiet. The story behind Oreeti — the live event networking platform for East Africa.",
  openGraph: {
    title: "About Oreeti",
    description: "Built in Nairobi because the room was too quiet.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
OREETI_EOF_MARKER

mkdir -p app/about
cat > app/about/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React, { useEffect } from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

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
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function AboutPage() {
  useReveal();
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />

      {/* Hero */}
      <section style={{
        padding: "160px 32px 100px",
        maxWidth: 900, margin: "0 auto",
        textAlign: "center",
      }}>
        <p className="eyebrow reveal" style={{ marginBottom: 20 }}>Our story</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px,5.5vw,68px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          margin: "0 0 28px",
        }}
          data-reveal
        >
          Built because the room was <em>too quiet.</em>
        </h1>
        <p style={{
          fontSize: 17,
          color: "var(--dusk)",
          lineHeight: 1.75,
          maxWidth: 560,
          margin: "0 auto",
        }}
          data-reveal data-delay="100"
        >
          Oreeti started with a simple observation: events bring the right people together and then do almost nothing to help them actually meet.
        </p>
      </section>

      {/* Origin */}
      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.1)",
        padding: "100px 32px",
        maxWidth: 800, margin: "0 auto",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          {[
            {
              eyebrow: "The observation",
              text: "Across events in Nairobi, Kampala, Lagos — the same pattern repeated. Hundreds of people in a room. Dozens of potential partnerships, friendships, collaborations. And almost none of them happening. Not because people didn't want to connect. Because the room gave them no infrastructure to do it.",
            },
            {
              eyebrow: "The insight",
              text: "Networking doesn't fail because people are antisocial. It fails because the tools are wrong. Business cards are passive. LinkedIn at events is awkward. Cold approaches feel risky. What people need is a layer of intelligence built into the event itself — one that reduces friction, signals intent, and makes the first move feel safe.",
            },
            {
              eyebrow: "The decision",
              text: "We decided to build the operating system for the social layer of events. Not another ticketing platform. Not a generic networking app. A purpose-built infrastructure for the specific moment when the right people are in the same place at the same time.",
            },
          ].map((item, i) => (
            <div key={item.eyebrow} data-reveal data-delay={String(i * 100)}>
              <p className="eyebrow" style={{ marginBottom: 16 }}>{item.eyebrow}</p>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(17px,2vw,22px)",
                fontWeight: 400,
                color: "var(--ivory)",
                lineHeight: 1.7,
                letterSpacing: "-0.01em",
              }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.1)",
        padding: "100px 32px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div data-reveal style={{ marginBottom: 64 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>What we believe</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px,3.5vw,44px)",
            fontWeight: 500,
            color: "var(--ivory)",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            maxWidth: 480,
          }}>
            Four convictions that shape everything we build.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 2,
          background: "rgba(138,115,85,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }} className="values-grid">
          {[
            { title: "Consent is design.", body: "Every connection at Oreeti requires both parties to want it. That's not just an ethical position — it's a product decision. Forced connections aren't connections." },
            { title: "Friction is not the enemy.", body: "The right amount of intentionality makes connections more meaningful. We reduce anxiety, not effort. A handshake that takes 30 seconds is worth more than one that took 30 milliseconds." },
            { title: "The room matters.", body: "Oreeti is built for physical spaces. Real events. Real presence. The digital layer should amplify the room, not replace it." },
            { title: "Africa first.", body: "We build for M-Pesa before Stripe. For Nairobi before New York. For the specific texture of professional events in East Africa — and then we scale." },
          ].map((v, i) => (
            <div key={v.title} data-reveal data-delay={String(i * 80)} style={{
              background: "var(--obsidian)",
              padding: "44px 40px",
            }}>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--ivory)",
                marginBottom: 14,
                fontStyle: "italic",
                lineHeight: 1.25,
              }}>
                {v.title}
              </h3>
              <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Where we are */}
      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.08)",
        padding: "100px 32px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }} data-reveal>
          <p className="eyebrow" style={{ marginBottom: 20 }}>Where we are</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px,3.5vw,44px)",
            fontWeight: 500,
            color: "var(--ivory)",
            letterSpacing: "-0.02em",
            marginBottom: 20,
            lineHeight: 1.15,
          }}>
            Early. Intentional. Building.
          </h2>
          <p style={{ color: "var(--dusk)", fontSize: 15, lineHeight: 1.75 }}>
            Oreeti is an early-stage product built by a solo founder in Nairobi. We are not trying to be everything to everyone. We are trying to be the best possible infrastructure for meaningful professional connection at African events — and to do it with the level of craft that the problem deserves.
          </p>
        </div>
      </section>

      <Footer />
      <style>{`
        @media (max-width: 640px) {
          .values-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
OREETI_EOF_MARKER

mkdir -p app/features
cat > app/features/layout.tsx << 'OREETI_EOF_MARKER'
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "Features", description: "Every layer of the Oreeti platform — HMAC-signed QR check-in, M-Pesa ticketing, consent-first networking, and post-event intelligence.", openGraph: { title: "Oreeti Features", description: "The complete infrastructure for live event activation." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
OREETI_EOF_MARKER

mkdir -p app/features
cat > app/features/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React, { useEffect } from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

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

const features = [
  {
    category: "Entry",
    headline: "HMAC-signed rotating QR check-in.",
    body: "Every attendee's QR code rotates every 60 seconds, cryptographically signed. Forgery is impossible. Entry is instant. The experience begins the moment they walk through the door.",
    detail: "No paper lists. No manual entry. Organizers scan from any device.",
  },
  {
    category: "Discovery",
    headline: "Live attendee presence in the Scene.",
    body: "The Scene tab shows who's in the room right now — first name, role, organisation, and the intent badges they've set. Discover context before the conversation.",
    detail: "Visibility is always in the attendee's control.",
  },
  {
    category: "Connection",
    headline: "Mutual handshake requests.",
    body: "Connection requires both parties to want it. An attendee sends a request with a reason. The recipient chooses to accept. Only then does the QR scan happen.",
    detail: "Consent is the feature. Not an afterthought.",
  },
  {
    category: "Payments",
    headline: "M-Pesa STK Push ticketing.",
    body: "Sell tickets with a single phone prompt. Guests pay via M-Pesa directly. Funds reconcile automatically. Organizers receive event revenue with a 5% platform fee.",
    detail: "Production paybill. Real money. No workarounds.",
  },
  {
    category: "Intelligence",
    headline: "Signal meetups.",
    body: "Organizers can schedule curated meetup moments mid-event. Attendees signal interest and get matched. The room activates on demand.",
    detail: "Energy management for event hosts.",
  },
  {
    category: "Privacy",
    headline: "Three visibility states.",
    body: "Every attendee controls their presence: Invisible (no one sees you), Visible (first name + initial only), Unlocked (full profile — only for mutual connections).",
    detail: "Your data surfaces only where you choose.",
  },
  {
    category: "Memory",
    headline: "Private connection notes.",
    body: "After a handshake, each person gets a private notepad for that connection. Context that lives with the relationship — not in a screenshot you'll never find.",
    detail: "Memory built into the infrastructure.",
  },
  {
    category: "Insight",
    headline: "Post-event activation report.",
    body: "When the event ends, organizers receive a full report: registrations, check-ins, connection activity, networking intensity. Not vanity metrics — signal.",
    detail: "Know what actually happened in the room.",
  },
];

export default function FeaturesPage() {
  useReveal();
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />

      <section style={{ padding: "160px 32px 80px", maxWidth: 900, margin: "0 auto" }}>
        <p className="eyebrow reveal" style={{ marginBottom: 20 }}>What Oreeti does</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px,5.5vw,68px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          margin: "0 0 24px",
          maxWidth: 700,
        }}
          data-reveal
        >
          Every layer of the room, engineered.
        </h1>
        <p style={{
          fontSize: 17, color: "var(--dusk)", lineHeight: 1.75, maxWidth: 520,
        }}
          data-reveal data-delay="100"
        >
          Oreeti is not a collection of features. It is a system. Each capability is designed to work with every other, from the moment a guest registers to the moment they leave.
        </p>
      </section>

      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.1)",
        maxWidth: 1100, margin: "0 auto",
        padding: "0 32px 120px",
      }}>
        {features.map((f, i) => (
          <div
            key={f.category}
            data-reveal
            data-delay={String((i % 3) * 80)}
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr auto",
              gap: "32px 48px",
              padding: "56px 0",
              borderBottom: "1px solid rgba(138,115,85,0.08)",
              alignItems: "start",
            }}
            className="feature-row"
          >
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: i === 2 ? "var(--ember)" : "rgba(138,115,85,0.5)",
                margin: 0,
              }}>
                {f.category}
              </p>
            </div>
            <div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px,2.2vw,28px)",
                fontWeight: 500,
                color: "var(--ivory)",
                letterSpacing: "-0.015em",
                lineHeight: 1.2,
                marginBottom: 14,
              }}>
                {f.headline}
              </h2>
              <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                {f.body}
              </p>
            </div>
            <div style={{ paddingTop: 4, minWidth: 180 }}>
              <p style={{
                fontSize: 12,
                color: "rgba(138,115,85,0.5)",
                lineHeight: 1.6,
                fontStyle: "italic",
                margin: 0,
              }}>
                {f.detail}
              </p>
            </div>
          </div>
        ))}
      </section>

      <Footer />
      <style>{`
        @media (max-width: 860px) {
          .feature-row { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </div>
  );
}
OREETI_EOF_MARKER

mkdir -p app/organizers
cat > app/organizers/layout.tsx << 'OREETI_EOF_MARKER'
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "For Organizers", description: "Host events that actually connect people. M-Pesa ticketing, magic link check-in, real-time dashboards, and post-event activation reports.", openGraph: { title: "Oreeti for Organizers", description: "The event you imagined, finally possible." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
OREETI_EOF_MARKER

mkdir -p app/organizers
cat > app/organizers/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.animationDelay = (el.dataset.delay || "0") + "ms";
          el.classList.add("reveal");
          io.unobserve(el);
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function OrganizersPage() {
  useReveal();
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />

      {/* Hero */}
      <section style={{ padding: "160px 32px 100px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <p className="eyebrow reveal" style={{ marginBottom: 20, color: "var(--gold)" }}>
          For organizers
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px,5.5vw,68px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          margin: "0 0 28px",
        }}
          data-reveal
        >
          The event you imagined, finally possible.
        </h1>
        <p style={{
          fontSize: 17, color: "var(--dusk)", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 48px",
        }}
          data-reveal data-delay="100"
        >
          Oreeti gives organizers a complete operating layer — from guest registration to real-time activation to post-event intelligence. All in one place.
        </p>
        <Link href="/login" data-reveal data-delay="200" style={{
          display: "inline-block",
          background: "var(--gold)",
          color: "#0a0a0c",
          padding: "14px 28px",
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "0.04em",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Create your first event
        </Link>
      </section>

      {/* What you get */}
      <section style={{
        borderTop: "1px solid rgba(212,175,55,0.1)",
        padding: "100px 32px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <p className="eyebrow" data-reveal style={{ marginBottom: 12 }}>What you get</p>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(24px,3.5vw,44px)",
          fontWeight: 500,
          color: "var(--ivory)",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          maxWidth: 480,
          marginBottom: 64,
        }}
          data-reveal data-delay="80"
        >
          Infrastructure that disappears into the experience.
        </h2>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            {
              title: "Event creation in minutes.",
              body: "Title, description, date, venue, banner image, ticket types, capacity. Draft it. Preview it. Publish when ready. Your event page goes live with a shareable link.",
            },
            {
              title: "M-Pesa ticketing that just works.",
              body: "Guests pay via STK Push. You see payments reconcile in real time. At 5% platform fee, you keep 95% of every ticket sold — paid directly to your account.",
            },
            {
              title: "Magic link check-in.",
              body: "No app required for your door team. Open the scanner on any browser, scan a guest's rotating QR, and they're checked in. It takes under 3 seconds.",
            },
            {
              title: "Live event dashboard.",
              body: "During the event, watch registrations, check-ins, and networking activity happen in real time. See which parts of your event are generating energy — and which aren't.",
            },
            {
              title: "Post-event activation report.",
              body: "After the event ends, you receive a complete picture: total registrations, check-in rate, connections made, handshake volume, and more. Data that tells you what actually happened.",
            },
          ].map((item, i) => (
            <div key={item.title} data-reveal data-delay={String(i * 80)} style={{
              padding: "44px 0",
              borderBottom: "1px solid rgba(138,115,85,0.08)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "center",
            }} className="org-row">
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px,2.2vw,28px)",
                fontWeight: 500,
                color: "var(--ivory)",
                letterSpacing: "-0.015em",
                lineHeight: 1.25,
                margin: 0,
              }}>
                {item.title}
              </h3>
              <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing clarity */}
      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.08)",
        padding: "100px 32px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }} data-reveal>
          <p className="eyebrow" style={{ marginBottom: 20, color: "var(--gold)" }}>Pricing</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,4vw,52px)",
            fontWeight: 500,
            color: "var(--ivory)",
            letterSpacing: "-0.025em",
            marginBottom: 20,
            lineHeight: 1.1,
          }}>
            Free to host. 5% on paid tickets.
          </h2>
          <p style={{ color: "var(--dusk)", fontSize: 15, lineHeight: 1.75, marginBottom: 40 }}>
            Creating an event costs nothing. Free events are always free. For paid events, we take 5% and you keep 95%. No subscription. No hidden fees.
          </p>
          <Link href="/login" style={{
            display: "inline-block",
            border: "1px solid rgba(212,175,55,0.3)",
            color: "var(--gold)",
            padding: "13px 28px",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            letterSpacing: "0.04em",
            transition: "background 0.2s, border-color 0.2s",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(212,175,55,0.08)";
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
            }}
          >
            Start for free →
          </Link>
        </div>
      </section>

      <Footer />
      <style>{`
        @media (max-width: 640px) {
          .org-row { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </div>
  );
}
OREETI_EOF_MARKER

mkdir -p app/attendees
cat > app/attendees/layout.tsx << 'OREETI_EOF_MARKER'
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "For Attendees", description: "Connect without the chase. Oreeti gives you a professional presence at the event and full control over who sees it, when.", openGraph: { title: "Oreeti for Attendees", description: "You control what the room knows about you." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
OREETI_EOF_MARKER

mkdir -p app/attendees
cat > app/attendees/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React, { useEffect } from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.animationDelay = (el.dataset.delay || "0") + "ms";
          el.classList.add("reveal");
          io.unobserve(el);
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function AttendeesPage() {
  useReveal();
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />

      <section style={{ padding: "160px 32px 100px", maxWidth: 900, margin: "0 auto" }}>
        <p className="eyebrow reveal" style={{ marginBottom: 20 }}>For attendees</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px,5.5vw,68px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          margin: "0 0 28px",
          maxWidth: 700,
        }}
          data-reveal
        >
          You control what the room knows about you.
        </h1>
        <p style={{
          fontSize: 17, color: "var(--dusk)", lineHeight: 1.75, maxWidth: 520,
        }}
          data-reveal data-delay="100"
        >
          Oreeti gives you a professional presence at the event — and the power to decide exactly who sees it, when.
        </p>
      </section>

      {/* How it feels */}
      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.1)",
        padding: "100px 32px",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(22px,3vw,38px)",
          fontWeight: 500,
          color: "var(--ivory)",
          letterSpacing: "-0.02em",
          marginBottom: 64,
          lineHeight: 1.2,
        }}
          data-reveal
        >
          The attendee experience, moment by moment.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {[
            {
              moment: "Before you arrive",
              headline: "Register and set your profile.",
              body: "You receive a unique event link. You register with your name and contact — then build a professional profile: role, organisation, a short bio, and one link. This is your presence in the room.",
            },
            {
              moment: "When you arrive",
              headline: "Your QR is your ticket.",
              body: "Open the event link on your phone. Your rotating QR code is ready. The door team scans it. You're checked in instantly. No printed tickets. No queues.",
            },
            {
              moment: "In the room",
              headline: "Browse the Scene.",
              body: "The Scene tab shows other attendees who are visible right now. You see their first name, role, organisation, and intent badges. You can set your own visibility — or stay invisible entirely.",
            },
            {
              moment: "When it feels right",
              headline: "Send a handshake request.",
              body: "Tap someone's profile. Add a reason — a genuine one. They receive the request and decide whether to accept. If they do, you both scan each other's QR. The connection is mutual and real.",
            },
            {
              moment: "After the event",
              headline: "Your connections stay.",
              body: "Everyone you connected with is in your networking tab. Full profiles, private notes, and the context you built — preserved after the event ends.",
            },
          ].map((item, i) => (
            <div key={item.moment} data-reveal data-delay={String(i * 80)} style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: 40,
              paddingBottom: 48,
              borderBottom: "1px solid rgba(138,115,85,0.08)",
            }} className="att-row">
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "rgba(138,115,85,0.5)", margin: 0,
                }}>
                  {item.moment}
                </p>
              </div>
              <div>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(18px,2.2vw,26px)",
                  fontWeight: 500,
                  color: "var(--ivory)",
                  letterSpacing: "-0.015em",
                  lineHeight: 1.25,
                  marginBottom: 12,
                }}>
                  {item.headline}
                </h3>
                <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visibility system */}
      <section style={{
        borderTop: "1px solid rgba(138,115,85,0.08)",
        padding: "100px 32px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div data-reveal style={{ marginBottom: 56, textAlign: "center" }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Your visibility</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px,3vw,38px)",
            fontWeight: 500,
            color: "var(--ivory)",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}>
            Three states. Always your choice.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 2,
          background: "rgba(138,115,85,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }} className="vis-grid">
          {[
            {
              state: "Invisible",
              headline: "You're in the room. The room doesn't know.",
              body: "Networking is off. Nobody sees your profile. You attend the event entirely on your own terms.",
            },
            {
              state: "Visible",
              headline: "First name and initial. Nothing more.",
              body: "You appear in the Scene. Other attendees see your first name, first initial, and intent badges. Enough context for someone to reach out — nothing you wouldn't write on a name tag.",
            },
            {
              state: "Unlocked",
              headline: "Full profile — earned, not extracted.",
              body: "When you mutually connect with someone and complete a QR scan, your full profile unlocks for that person only. They see everything you chose to share. Nobody else.",
            },
          ].map((v, i) => (
            <div key={v.state} data-reveal data-delay={String(i * 80)} style={{
              background: "var(--obsidian)",
              padding: "44px 32px",
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: i === 2 ? "var(--ember)" : "rgba(138,115,85,0.5)",
                marginBottom: 16,
              }}>
                {v.state}
              </p>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 500,
                color: "var(--ivory)",
                marginBottom: 12,
                lineHeight: 1.3,
                fontStyle: "italic",
              }}>
                {v.headline}
              </h3>
              <p style={{ color: "var(--dusk)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <style>{`
        @media (max-width: 640px) {
          .att-row { grid-template-columns: 1fr !important; gap: 16px !important; }
          .vis-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
OREETI_EOF_MARKER

mkdir -p app/faq
cat > app/faq/layout.tsx << 'OREETI_EOF_MARKER'
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "FAQ", description: "Everything worth asking about Oreeti — pricing, how networking works, data privacy, and more.", openGraph: { title: "Oreeti FAQ", description: "Everything worth asking." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
OREETI_EOF_MARKER

mkdir -p app/faq
cat > app/faq/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React, { useEffect, useState } from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.animationDelay = (el.dataset.delay || "0") + "ms";
          el.classList.add("reveal");
          io.unobserve(el);
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const faqs = [
  {
    category: "The basics",
    items: [
      {
        q: "What exactly is Oreeti?",
        a: "Oreeti is a live event activation platform — the infrastructure that turns a passive audience into an active network. It handles guest registration, ticketing, check-in, and in-event connection, all within a single experience guests access from their phone browser. No app download required.",
      },
      {
        q: "How is Oreeti different from a ticketing platform?",
        a: "Ticketing platforms stop at the door. Oreeti starts there. We handle ticketing — but the core product is what happens inside the event: the discovery, the connections, the activation. We are less interested in who bought a ticket than in who met someone worth knowing.",
      },
      {
        q: "How is Oreeti different from LinkedIn or business card apps?",
        a: "LinkedIn is an archive. Business card apps are digital clipboards. Oreeti is a live, context-aware layer that only exists during the event. Connections are mutual, verified by physical presence, and earned through intent — not just a follow.",
      },
    ],
  },
  {
    category: "For organizers",
    items: [
      {
        q: "What does it cost to use Oreeti?",
        a: "Creating events and running free events costs nothing. For paid events, Oreeti takes a 5% platform fee on ticket sales. There is no subscription, no monthly fee, and no charge per attendee on free events.",
      },
      {
        q: "How do guest payments work?",
        a: "Guests pay via M-Pesa STK Push — a prompt is sent directly to their phone. Payments reconcile automatically. You see the status in your dashboard in real time.",
      },
      {
        q: "Do guests need to download an app?",
        a: "No. Guests access the entire experience — registration, profile, ticket, networking, QR code — through a standard browser link. Nothing to download, nothing to install.",
      },
      {
        q: "Can I see what's happening during my event?",
        a: "Yes. Your organizer dashboard shows registrations, check-ins, and networking activity in real time. You can see check-in rates, connections forming, and the overall energy of the room as it happens.",
      },
    ],
  },
  {
    category: "For attendees",
    items: [
      {
        q: "What can other people see about me?",
        a: "Only what you choose. If networking is off, you're invisible. If it's on, other attendees see your first name and first initial only. Your full profile — role, organisation, bio, and links — is only visible to someone you've mutually connected with and scanned.",
      },
      {
        q: "What is a handshake?",
        a: "A handshake is a mutual connection. You send a request with a reason. If the other person accepts, you both scan each other's QR code to confirm. Both parties have to want the connection — that's what makes it meaningful.",
      },
      {
        q: "What happens to my connections after the event ends?",
        a: "They stay. Your connections, notes, and unlocked profiles are preserved permanently after the event ends. The room closes, but the relationships don't.",
      },
    ],
  },
  {
    category: "Privacy",
    items: [
      {
        q: "Who can see my data?",
        a: "Organizers can see your registration details (name, email, ticket type, check-in status). They cannot see your networking activity or who you connected with. Full profile details are only ever visible to people you have mutually connected with.",
      },
      {
        q: "Does Oreeti sell or share my data?",
        a: "No. We do not sell your data. We do not share it with advertisers. We share data with infrastructure providers (Supabase, Vercel, Safaricom) solely to operate the platform. Read our privacy policy for the full picture.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid rgba(138,115,85,0.1)",
      cursor: "pointer",
    }}
      onClick={() => setOpen(!open)}
    >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 0", gap: 16,
      }}>
        <p style={{
          fontSize: 15, fontWeight: 500, color: "var(--ivory)", margin: 0, lineHeight: 1.4,
        }}>
          {q}
        </p>
        <div style={{
          width: 20, height: 20, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.25s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          color: "var(--dusk)",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      {open && (
        <p style={{
          color: "var(--dusk)", fontSize: 14, lineHeight: 1.75,
          margin: "0 0 24px", paddingRight: 36,
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  useReveal();
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />

      <section style={{ padding: "160px 32px 80px", maxWidth: 800, margin: "0 auto" }}>
        <p className="eyebrow reveal" style={{ marginBottom: 20 }}>Questions</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px,5vw,60px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          margin: "0 0 24px",
        }}
          data-reveal
        >
          Everything worth asking.
        </h1>
        <p style={{
          fontSize: 16, color: "var(--dusk)", lineHeight: 1.75,
        }}
          data-reveal data-delay="100"
        >
          If you have a question not answered here, email <a href="mailto:hello.oreeti@gmail.com" style={{ color: "var(--ivory)", textDecoration: "none", borderBottom: "1px solid rgba(234,230,223,0.2)" }}>hello.oreeti@gmail.com</a>
        </p>
      </section>

      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px 120px" }}>
        {faqs.map((group, gi) => (
          <div key={group.category} data-reveal data-delay={String(gi * 80)} style={{ marginBottom: 64 }}>
            <p className="eyebrow" style={{ marginBottom: 24 }}>{group.category}</p>
            {group.items.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
OREETI_EOF_MARKER

mkdir -p app/privacy
cat > app/privacy/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

const sections = [
  { title: "Our commitment", body: "Oreeti is built on consent. Everything about how we handle data reflects our core belief: connection should be intentional, not extracted. We collect only what we need, share only what you choose, and protect everything in between." },
  { title: "What we collect", body: "From organizers: name, email address, and M-Pesa phone number for payouts. From guests: name, email, and optionally phone number at registration. Guests also create a profile with display name, role, organisation, bio, and one link. We collect event interaction data: networking activity, connections, handshakes, QR scans, and check-in status." },
  { title: "What we do not collect", body: "We do not collect M-Pesa PINs or payment card details. We do not collect location data. We do not collect device contacts. We do not run advertising trackers. We do not build behavioral profiles for third-party use." },
  { title: "How your profile works", body: "Your guest profile has three visibility states. Invisible: networking is off, nobody sees you. Visible: networking is on, other active guests see your first name and initial only. Unlocked: you have mutually connected and completed a QR scan — full profile visible only to that person. You control your visibility at all times." },
  { title: "Who can see what", body: "Other guests see your first name and initial only when you are networking. Full profile details are only visible to guests you have mutually unlocked. Organizers can see your registration details: name, email, phone, ticket type, and check-in status. Organizers cannot see your networking activity or who you connected with." },
  { title: "Payments and financial data", body: "Ticket payments are processed via M-Pesa through Safaricom Daraja. We store payment status and M-Pesa receipt numbers for reconciliation only. We do not store full M-Pesa account details. Organizer payout details are stored securely and used only for transferring ticket revenue." },
  { title: "Data storage and security", body: "Your data is stored on Supabase infrastructure with row-level security — each user can only access data they are permitted to see. API routes are rate-limited and inputs are sanitized. All data is transmitted over HTTPS. Authentication is handled via secure magic links — no passwords stored." },
  { title: "Data sharing", body: "We do not sell your data. We do not share your data with advertisers. We share data with infrastructure providers (Supabase, Vercel, Safaricom) solely to operate the platform. We may share anonymized aggregated data for product research." },
  { title: "Your rights", body: "You have the right to access, correct, or delete the data we hold about you. You have the right to withdraw consent for data processing. To exercise these rights email hello.oreeti@gmail.com with subject 'Data Request'." },
  { title: "Cookies", body: "Oreeti uses minimal cookies for authentication only. No tracking cookies. No advertising cookies. No third-party analytics that follow you across other websites." },
  { title: "Children", body: "Oreeti is not intended for users under 18 years of age. We do not knowingly collect data from minors." },
  { title: "Changes", body: "We may update this policy as Oreeti evolves. We will notify you of significant changes via email." },
  { title: "Contact", body: "For privacy questions or data requests email hello.oreeti@gmail.com. We aim to respond within 48 hours." },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />
      <section style={{ padding: "160px 32px 80px", maxWidth: 760, margin: "0 auto" }}>
        <p className="eyebrow" style={{ marginBottom: 20 }}>Legal</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px,4.5vw,52px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          margin: "0 0 16px",
        }}>
          Privacy Policy
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 13 }}>Last updated: 2025</p>
      </section>

      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 32px 120px" }}>
        {sections.map((s, i) => (
          <div key={s.title} style={{
            padding: "40px 0",
            borderBottom: "1px solid rgba(138,115,85,0.08)",
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "rgba(138,115,85,0.5)",
              margin: "0 0 12px",
            }}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 500,
              color: "var(--ivory)",
              marginBottom: 14,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}>
              {s.title}
            </h2>
            <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              {s.body}
            </p>
          </div>
        ))}
      </section>
      <Footer />
    </div>
  );
}
OREETI_EOF_MARKER

mkdir -p app/terms
cat > app/terms/page.tsx << 'OREETI_EOF_MARKER'
"use client";
import React from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

const sections = [
  { title: "What Oreeti is", body: "Oreeti is a live event activation platform — not a social network, not a ticketing company. We give event organizers the infrastructure to turn passive attendance into intentional human connection. Guests connect in real time, on the ground, at the event. Oreeti makes that possible without pressure, awkwardness, or friction. The room, activated." },
  { title: "Who these terms apply to", body: "These terms apply to two types of users: Organizers who create and manage events on Oreeti, and Guests who register and participate in events. By using Oreeti in any capacity you agree to these terms." },
  { title: "Organizer responsibilities", body: "As an organizer you are responsible for the events you create. You must ensure your events comply with Kenyan law. You are responsible for communicating clearly with your guests about the Oreeti experience. You must not create events intended to deceive, harm, or defraud attendees. Oreeti reserves the right to remove events that violate these terms without notice." },
  { title: "Guest experience", body: "Guests join events via a unique access link. Each guest creates a profile visible only within that event. Networking is opt-in — guests choose when to become visible to others. Full profile details are only revealed through mutual consent: both guests must connect and complete a QR scan. Guests can turn off networking at any time to become invisible." },
  { title: "Ticketing and payments", body: "Oreeti supports both free and paid events. For paid events, ticket purchases are processed via M-Pesa. Oreeti charges a 5% platform fee on all paid ticket sales. This fee covers payment processing, platform infrastructure, and guest experience tools. The remaining amount is transferred to the organizer. All payments are final unless the event is cancelled by the organizer. In case of disputes contact hello.oreeti@gmail.com." },
  { title: "Event lifecycle", body: "Events move through four stages: Draft, Scheduled, Live, and Ended. Once an event ends no new connections can be made. Existing connections and profile unlocks are preserved permanently. Organizers can access their event report and data after the event ends." },
  { title: "Post-event data", body: "After an event ends organizers receive an activation report summarizing registrations, check-ins, networking activity, and connections made. Guest personal data in reports may only be used for legitimate post-event follow-up and not for marketing without consent." },
  { title: "Prohibited conduct", body: "You must not use Oreeti to harass, spam, or intimidate other users. You must not create fake profiles or impersonate others. You must not attempt to extract or scrape data from the platform. You must not use Oreeti for any unlawful purpose. Violations may result in immediate removal." },
  { title: "Intellectual property", body: "Oreeti, its name, logo, and tagline 'The room, activated.' are brand property and may not be reproduced without permission. Content you create on Oreeti — your profile, bio, and links — remains yours." },
  { title: "Limitation of liability", body: "Oreeti is provided as-is. We are not liable for losses arising from failed payments, missed connections, or data loss. Our total liability to any user shall not exceed the amount paid to Oreeti in the preceding 3 months." },
  { title: "Governing law", body: "These terms are governed by the laws of Kenya. Any disputes shall be resolved under Kenyan jurisdiction." },
  { title: "Contact", body: "For questions about these terms email hello.oreeti@gmail.com. We aim to respond within 48 hours." },
];

export default function TermsPage() {
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />
      <section style={{ padding: "160px 32px 80px", maxWidth: 760, margin: "0 auto" }}>
        <p className="eyebrow" style={{ marginBottom: 20 }}>Legal</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px,4.5vw,52px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          margin: "0 0 16px",
        }}>
          Terms of Use
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 13 }}>Last updated: 2025</p>
      </section>

      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 32px 120px" }}>
        {sections.map((s, i) => (
          <div key={s.title} style={{
            padding: "40px 0",
            borderBottom: "1px solid rgba(138,115,85,0.08)",
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "rgba(138,115,85,0.5)",
              margin: "0 0 12px",
            }}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 500,
              color: "var(--ivory)",
              marginBottom: 14,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}>
              {s.title}
            </h2>
            <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              {s.body}
            </p>
          </div>
        ))}
      </section>
      <Footer />
    </div>
  );
}
OREETI_EOF_MARKER

git add -A
git commit -m "feat: unified marketing website — all public pages under oreeti.com"
git push origin main
echo "Done."