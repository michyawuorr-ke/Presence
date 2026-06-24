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
              title: "Ongoing connection summary.",
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
