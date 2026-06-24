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
