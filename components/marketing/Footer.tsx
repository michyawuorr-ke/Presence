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
