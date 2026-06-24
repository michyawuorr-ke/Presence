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
