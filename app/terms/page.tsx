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
