"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

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
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: "52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        transition: "background 0.3s, border-color 0.3s",
        background: scrolled ? "rgba(10,10,12,0.92)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(138,115,85,0.12)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 44 44" fill="none">
            <path d="M10 22C10 15.373 15.373 10 22 10" stroke="#EAE6DF" strokeWidth="4" strokeLinecap="round"/>
            <path d="M34 22C34 28.627 28.627 34 22 34" stroke="#E26D34" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="22" cy="10" r="2.5" fill="#E26D34"/>
          </svg>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#EAE6DF", letterSpacing: "-0.03em" }}>Oreeti</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }} className="mkt-desktop-links">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              color: "rgba(234,230,223,0.45)", fontSize: "12px", fontWeight: "500",
              textDecoration: "none", letterSpacing: "0.01em",
            }}>{l.label}</Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Link href="/login" className="mkt-signin-link" style={{
            color: "rgba(234,230,223,0.45)", fontSize: "12px", fontWeight: "500",
            textDecoration: "none", padding: "6px 10px",
          }}>Sign in</Link>
          <Link href="/login" style={{
            background: "transparent", color: "rgba(234,230,223,0.7)",
            fontSize: "12px", fontWeight: "500", textDecoration: "none",
            padding: "6px 13px", borderRadius: "6px",
            border: "1px solid rgba(234,230,223,0.15)",
            letterSpacing: "0.01em", whiteSpace: "nowrap",
          }}>Get started</Link>
          <button onClick={() => setOpen(!open)} className="mkt-hamburger"
            style={{ display: "none", background: "none", border: "none", color: "#EAE6DF", cursor: "pointer", padding: "4px" }}
            aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {open ? (
                <><line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
              ) : (
                <><line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div style={{
          position: "fixed", top: "52px", left: 0, right: 0, zIndex: 199,
          background: "rgba(10,10,12,0.97)", borderBottom: "1px solid rgba(138,115,85,0.15)",
          padding: "16px 20px 24px", backdropFilter: "blur(20px)",
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              display: "block", color: "rgba(234,230,223,0.65)", fontSize: "15px",
              fontWeight: "500", textDecoration: "none", padding: "12px 0",
              borderBottom: "1px solid rgba(138,115,85,0.08)",
            }}>{l.label}</Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} style={{
            display: "block", marginTop: "16px",
            background: "rgba(226,109,52,0.12)", border: "1px solid rgba(226,109,52,0.25)",
            color: "#E26D34", textAlign: "center", padding: "12px",
            borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none",
          }}>Get started</Link>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .mkt-desktop-links { display: none !important; }
          .mkt-signin-link   { display: none !important; }
          .mkt-hamburger     { display: flex !important; }
        }
      `}</style>
    </>
  );
}
