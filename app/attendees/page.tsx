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
              headline: "Open the Networking tab.",
              body: "The Networking tab shows other attendees who are visible right now. You see their first name, role, and intent badges. You can set your own visibility — or stay invisible entirely.",
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
              body: "You appear in the Scene. Other attendees see your first name, role, and intent badges. Enough context for someone to reach out — nothing you wouldn't write on a name tag.",
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
