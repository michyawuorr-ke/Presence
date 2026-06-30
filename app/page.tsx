"use client";
import OreetiLogo from "@/components/OreetiLogo";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import Stats from "@/components/home/Stats";

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
            <span className="hero-word" style={{ animationDelay: "0.2s" }}>Every event</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.38s" }}>you organise</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.54s" }}>should</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.7s" }}>create</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.86s" }}>value.</span>
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
            Oreeti is the networking layer that makes it happen — intentional connections, inside your event, every time.
          </p>

          <div style={{
            display: "flex", gap: 12, justifyContent: "center",
            flexWrap: "wrap",
            opacity: 0,
            animation: "heroFade 0.8s ease forwards 1.3s",
          }}>
            <Link href="/login" className="cta-primary" style={{
              background: "rgba(226,109,52,0.08)",
              color: "#E26D34",
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
      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(138,115,85,0.12)", borderBottom: "1px solid rgba(138,115,85,0.12)", padding: "36px 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, background: "transparent" }} className="stats-grid">
          {[{ value: "5 min", sub: "to set up your event" }, { value: "M-Pesa", sub: "ticket payments built in" }, { value: "1 link", sub: "your ticket, profile, and networking" }, { value: "1 scan", sub: "unlocks a full profile" }].map((s, i) => (
            <div key={i} style={{ padding: "20px 16px", background: "transparent", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(16px,2vw,24px)", fontWeight: 500, color: "#E26D34", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "rgba(138,115,85,0.7)", letterSpacing: "0.04em", margin: 0, lineHeight: 1.5, maxWidth: 120 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

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
            The right person was in that room. You just never found each other.
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
              title: "No way to know who's there.",
              body: "You arrive with no idea who else is in the room. You can't find the right person if you don't know they exist.",
            },
            {
              n: "02",
              title: "You filled the room. The rest was left to chance.",
              body: "Whether the right conversations happened remained the one thing you couldn't see.",
            },
            {
              n: "03",
              title: "No structure to make it happen.",
              body: "The right people were in the same room. But without infrastructure to connect them, they leave strangers. The opportunity closes when the venue empties.",
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
              detail: "The Networking tab shows live attendee discovery. Browse professional context, set intent badges, and signal openness to connection — on your own terms.",
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
              Magic link entry. M-Pesa ticketing. Real-time activation dashboards. See who's in the room, what connections are forming, and what the energy looks like — while it's happening.
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

	  <Stats />
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
