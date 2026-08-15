import Wordmark from "@/components/Wordmark";
import React from "react";
import Link from "next/link";

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
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(138,115,85,0.12)", padding: "48px 20px 32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexWrap: "wrap", gap: "40px", marginBottom: "40px",
        }}>
          <div style={{ maxWidth: "220px" }}>
            <div style={{ marginBottom: "12px" }}>
              <Wordmark size={16} />
            </div>
            <p style={{ fontSize: "13px", color: "rgba(138,115,85,0.8)", lineHeight: "1.65", margin: "0 0 8px" }}>
              The networking layer for live events.
            </p>
            <p style={{ fontSize: "11px", color: "rgba(138,115,85,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
              Nairobi, Kenya
            </p>
          </div>

          <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
            {cols.map(col => (
              <div key={col.heading}>
                <p style={{
                  fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "rgba(138,115,85,0.4)", margin: "0 0 14px",
                }}>{col.heading}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                  {col.links.map(l => (
                    <Link key={l.href} href={l.href} style={{
                      color: "rgba(234,230,223,0.4)", fontSize: "13px", textDecoration: "none",
                    }}>{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <p style={{
                fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(138,115,85,0.4)", margin: "0 0 14px",
              }}>Get started</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <Link href="/login" style={{ color: "rgba(234,230,223,0.4)", fontSize: "13px", textDecoration: "none" }}>Create account</Link>
                <Link href="/login" style={{ color: "rgba(234,230,223,0.4)", fontSize: "13px", textDecoration: "none" }}>Sign in</Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid rgba(138,115,85,0.08)", paddingTop: "20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "8px",
        }}>
          <p style={{ fontSize: "11px", color: "rgba(138,115,85,0.35)", margin: 0 }}>© 2026 Oreeti. All rights reserved.</p>
          <p style={{ fontSize: "11px", color: "rgba(138,115,85,0.25)", margin: 0, fontStyle: "italic" }}>The room, activated.</p>
        </div>
      </div>
    </footer>
  );
}
