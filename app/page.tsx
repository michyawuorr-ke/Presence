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
      {/* Top Section: Branding with Amber-Orange Floating Tagline */}
      <div style={{ marginTop: '56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <OreetiLogo size="sm" />
        <p style={{ 
          fontSize: '11px', 
          letterSpacing: '0.2em', 
          color: '#E26D34', 
          textTransform: 'uppercase', 
          fontWeight: '500', 
          animation: 'pulse 2s infinite ease-in-out',
          margin: 0
        }}>
          The room activated
        </p>
        
        {/* Simple CSS block for the floating/breathing animation effect */}
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; transform: translateY(0px); }
            50% { opacity: 1; transform: translateY(-2px); }
            100% { opacity: 0.6; transform: translateY(0px); }
          }
        `}</style>
      </div>

      {/* Center Space */}
      <div style={{ flexGrow: 1 }} />

      {/* Bottom 40% Interactive Area */}
      <div style={{ 
        width: '100%', 
        maxWidth: '300px', 
        margin: '0 auto 20px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        
        {/* Core Actions */}
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

        {/* Clear Option to Read External Legal Files */}
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
