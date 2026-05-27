import React from 'react';
import Link from 'next/link';
import OreetiLogo from "@/components/OreetiLogo";

export default function Home() {
  return (
    <div style={{ 
      backgroundColor: '#000', 
      color: '#fff', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      padding: '40px 24px',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif'
    }}>
      {/* Structural Styles for Living Organism Flow */}
      <style>{`
        @keyframes organicFlow {
          0% {
            opacity: 0;
            letter-spacing: -0.05em;
            transform: translateY(12px) scaleY(0.8);
            filter: blur(4px);
          }
          60% {
            opacity: 0.8;
            letter-spacing: 0.25em;
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            letter-spacing: 0.2em;
            transform: translateY(0px) scaleY(1);
            filter: blur(0px);
          }
        }
        .living-tagline {
          font-size: 11px;
          color: #E26D34;
          text-transform: uppercase;
          font-weight: 500;
          margin: 0;
          opacity: 0;
          animation: organicFlow 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.4s;
          text-shadow: 0 0 8px rgba(226,109,52,0.2);
        }
      `}</style>

      {/* Top Section: Branding with Organic Flow Tagline */}
      <div style={{ marginTop: '56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <OreetiLogo size="sm" />
        <p className="living-tagline">
          The room activated
        </p>
      </div>

      {/* Center Space */}
      <div style={{ flexGrow: 1 }} />

      {/* Raised Bottom Interactive Area */}
      <div style={{ 
        width: '100%', 
        maxWidth: '300px', 
        margin: '0 auto 64px auto', /* Raised from 20px to 64px to clear frame space */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        
        <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
          <div style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '6px', 
            background: 'transparent', 
            color: '#E26D34', 
            border: '1px solid rgba(226,109,52,0.45)', 
            fontSize: '12px', 
            fontWeight: '500', 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase', 
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            Create an Account
          </div>
        </Link>

        <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
          <div style={{ 
            width: '100%', 
            padding: '12px', 
            background: 'transparent', 
            color: 'rgba(255,255,255,0.4)', 
            border: 'none', 
            fontSize: '12px', 
            fontWeight: '500', 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase', 
            textAlign: 'center'
          }}>
            Sign In
          </div>
        </Link>

        <p style={{ 
          color: "rgba(255,255,255,0.2)", 
          fontSize: "10px", 
          marginTop: "32px", 
          textAlign: "center", 
          lineHeight: "1.6", 
          letterSpacing: "0.02em", 
          maxWidth: "260px",
          marginBottom: 0
        }}>
          By continuing you agree to our{" "}
          <a href="/terms" target="_blank" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            Terms
          </a>
          {" "}and{" "}
          <a href="/privacy" target="_blank" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            Privacy
          </a>
        </p>

      </div>
    </div>
  );
}
