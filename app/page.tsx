import React from 'react';
import Link from 'next/link';

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
      {/* Upper Third: Brand Architecture */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '14px', 
          letterSpacing: '0.3em', 
          color: '#E26D34', 
          textTransform: 'uppercase', 
          fontWeight: '600',
          margin: 0 
        }}>
          OREETI
        </h1>
        <p style={{ 
          fontSize: '11px', 
          color: 'rgba(255,255,255,0.3)', 
          marginTop: '12px', 
          letterSpacing: '0.05em' 
        }}>
          SOVEREIGN NETWORKING SYSTEMS
        </p>
      </div>

      {/* Middle Third: Minimal Ambient Graphic */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexGrow: 1
      }}>
        <div style={{ 
          width: '1px', 
          height: '80px', 
          background: 'linear-gradient(to bottom, transparent, rgba(226,109,52,0.4), transparent)' 
        }} />
      </div>

      {/* Lower 40%: Ergonomic Interaction Zone */}
      <div style={{ 
        width: '100%', 
        maxWidth: '340px', 
        margin: '0 auto 20px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: '#fff', 
            color: '#000', 
            textAlign: 'center', 
            padding: '16px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            fontWeight: '600', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            transition: 'background 0.2s'
          }}>
            Access Console
          </div>
        </Link>

        <Link href="/register/live" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: 'transparent', 
            color: '#fff', 
            border: '1px solid rgba(255,255,255,0.15)', 
            textAlign: 'center', 
            padding: '16px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            fontWeight: '600', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            transition: 'border 0.2s'
          }}>
            Register Presence
          </div>
        </Link>

        <p style={{ 
          color: 'rgba(255,255,255,0.2)', 
          fontSize: '9px', 
          textAlign: 'center', 
          letterSpacing: '0.02em', 
          marginTop: '16px',
          lineHeight: '1.5'
        }}>
          By interacting with this space you establish a sovereign data-sharing handshake.
        </p>
      </div>
    </div>
  );
}
