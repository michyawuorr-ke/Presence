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
        @keyframes breathe{0%,100%{stroke-width:8;opacity:1}50%{stroke-width:11;opacity:0.85}}
        .ee{animation:breathe 2.8s ease-in-out infinite;}
        @keyframes land{0%,72%{r:7;opacity:0.45}84%{r:11;opacity:1}95%{r:7;opacity:1}100%{r:7;opacity:0.45}}
        .idot{animation:land 3.4s ease-in-out infinite;}
      `}</style>

      {/* G-Group Container for top animation breathing room */}
      <g transform="translate(0, 30)">
        
        {/* FIRST LETTER: 'O' (Left Half - Ivory Linen) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 52 44 C 22 44, 4 66, 4 92 C 4 118, 22 140, 52 140"
        />

        {/* FIRST LETTER: 'O' (Right Half - Controlled Pulse Amber Orange) */}
        <g className="rO">
          <path stroke="#E26D34" strokeWidth="8" strokeLinecap="round"
            d="M 56 36 C 86 36, 104 58, 104 84 C 104 110, 86 132, 56 132"
            filter="url(#ga)"
          />
        </g>

        {/* SECOND LETTER: 'r' (Ivory Linen) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          d="M 118 140 L 118 62"
        />
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 118 82 C 122 66, 136 58, 154 66"
        />

        {/* THIRD & FOURTH LETTERS: 'ee' (True Typographic Open Lowercase Shapes) */}
        <g className="ee">
          {/* First e: Linear horizontal crossbar, crisp top dome, wide flare terminal */}
          <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"
            d="M 160 102 L 194 102 C 194 76, 160 72, 160 98 C 160 124, 192 124, 194 112"
          />
          {/* Second e: Parallel layout tracking perfectly with identical terminal spacing */}
          <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"
            d="M 206 102 L 240 102 C 240 76, 206 72, 206 98 C 206 124, 238 124, 240 112"
          />
        </g>

        {/* FIFTH LETTER: 't' (Ivory Linen - Smooth Ergonomic Bottom Curve) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          d="M 264 48 L 264 128 C 264 136, 268 140, 278 140"
        />
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 248 76 L 282 76"
        />

        {/* SIXTH LETTER: 'i' (Stem - Ivory Linen) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 302 86 L 302 140"
        />

        {/* SIXTH LETTER: 'i' (Dot - Amber Orange Accent) */}
        <circle className="idot" cx="302" cy="66" r="7" fill="#E26D34" filter="url(#ga)"/>
      </g>
    </svg>
  );
}
