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
