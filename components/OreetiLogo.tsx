"use client";
import React from "react";

interface OreetiLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function OreetiLogo({ size = "md" }: OreetiLogoProps) {
  const scales: Record<string, number> = { sm: 0.42, md: 0.55, lg: 0.7 };
  const s = scales[size] || 0.55;
  const w = Math.round(620 * s);
  const h = Math.round(220 * s);

  return (
    <svg width={w} height={h} viewBox="0 0 620 220" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <filter id="ga" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <style>{`
        @keyframes pulseUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .rO{animation:pulseUp 3s ease-in-out infinite;transform-origin:94px 86px;}
        @keyframes breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.85;transform:scale(1.02)}}
        .ee{animation:breathe 2.8s ease-in-out infinite;transform-origin:200px 120px;}
        @keyframes land{0%,72%{r:7;opacity:0.45}84%{r:11;opacity:1}95%{r:7;opacity:1}100%{r:7;opacity:0.45}}
        .idot{animation:land 3.4s ease-in-out infinite;}
        .brand-text {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 500;
          font-size: 78px;
          letter-spacing: -0.04em;
        }
      `}</style>

      {/* G-Group Container shifts everything down to guarantee top animation breathing room */}
      <g transform="translate(0, 30)">
        
        {/* FIRST LETTER: 'O' (Left Half - Ivory Linen) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 52 44 C 22 44, 4 66, 4 92 C 4 118, 22 140, 52 140"
        />

        {/* FIRST LETTER: 'O' (Right Half - Subdued Pulsing Amber Orange Accent) */}
        <g className="rO">
          <path stroke="#E26D34" strokeWidth="8" strokeLinecap="round"
            d="M 56 36 C 86 36, 104 58, 104 84 C 104 110, 86 132, 56 132"
            filter="url(#ga)"
          />
        </g>

        {/* REST OF BRAND TYPE: 'r', 'ee', 't', 'i' rendered via premium system font geometry */}
        {/* 'r' - Ivory Linen */}
        <text x="114" y="124" fill="#EAE6DF" className="brand-text">r</text>

        {/* 'ee' - Standalone, Flawless Keyboard Geometry with Breathing Animation */}
        <g className="ee">
          <text x="144" y="124" fill="#EAE6DF" className="brand-text">e</text>
          <text x="186" y="124" fill="#EAE6DF" className="brand-text">e</text>
        </g>

        {/* 't' - Ivory Linen */}
        <text x="232" y="124" fill="#EAE6DF" className="brand-text">t</text>

        {/* 'i' (Stem) - Ivory Linen */}
        <text x="260" y="124" fill="#EAE6DF" className="brand-text">ı</text>

        {/* SIXTH LETTER: 'i' (Dot - Pulsing Amber Orange Animation) */}
        <circle className="idot" cx="269" cy="62" r="7" fill="#E26D34" filter="url(#ga)"/>
      </g>
    </svg>
  );
}
