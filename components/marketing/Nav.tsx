"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import OreetiLogo from "@/components/OreetiLogo";

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
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "background 0.4s, border-color 0.4s",
        background: scrolled ? "rgba(10,10,12,0.88)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(138,115,85,0.12)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 32px",
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <OreetiLogo size="sm" />
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 36 }} className="desktop-nav">
            {links.map(l => (
              <Link key={l.href} href={l.href} style={{
                color: "rgba(234,230,223,0.55)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EAE6DF")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(234,230,223,0.55)")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{
              color: "rgba(234,230,223,0.55)",
              fontSize: 13, fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#EAE6DF")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(234,230,223,0.55)")}
            >
              Sign in
            </Link>
            <Link href="/login" style={{
              background: "#E26D34",
              color: "#EAE6DF",
              fontSize: 12, fontWeight: 600,
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 6,
              letterSpacing: "0.04em",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Get started
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              style={{
                display: "none", background: "none", border: "none",
                color: "#EAE6DF", cursor: "pointer", padding: 4,
              }}
              className="mobile-menu-btn"
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                {open
                  ? <><line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
                  : <><line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
                }
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
          background: "rgba(10,10,12,0.97)",
          borderBottom: "1px solid rgba(138,115,85,0.15)",
          padding: "24px 32px 32px",
          backdropFilter: "blur(20px)",
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                color: "rgba(234,230,223,0.7)",
                fontSize: 15, fontWeight: 500,
                textDecoration: "none",
                padding: "12px 0",
                borderBottom: "1px solid rgba(138,115,85,0.1)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
