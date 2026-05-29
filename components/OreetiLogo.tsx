"use client";
import React from "react";

interface OreetiLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function OreetiLogo({ size = "md" }: OreetiLogoProps) {
  const scales: Record<string, number> = { sm: 0.42, md: 0.55, lg: 0.7 };
  const s = scales[size] || 0.55;
  const w = Math.round(620 * s);
  const h = Math.round(220 * s); // Expanded total canvas height to prevent clipping

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
        @keyframes pulseUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        .rO{animation:pulseUp 3s ease-in-out infinite;transform-origin:94px 86px;}
        @keyframes breathe{0%,100%{stroke-width:8;opacity:1}50%{stroke-width:11;opacity:0.85}}
        .ee{animation:breathe 2.8s ease-in-out infinite;}
        @keyframes land{0%,72%{r:7;opacity:0.45}84%{r:11;opacity:1}95%{r:7;opacity:1}100%{r:7;opacity:0.45}}
        .idot{animation:land 3.4s ease-in-out infinite;}
      `}</style>

      {/* G-Group Container shifts everything down 30px to guarantee top animation breathing room */}
      <g transform="translate(0, 30)">
        {/* FIRST LETTER: 'O' (Left Half - Ivory Linen) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 52 44 C 22 44, 4 66, 4 92 C 4 118, 22 140, 52 140"
        />

        {/* FIRST LETTER: 'O' (Right Half - Pulsing Amber Orange Accent with Safe Ceiling Space) */}
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

        {/* THIRD & FOURTH LETTERS: 'ee' (Standalone, Wide Bottom Curves, Authentic Open 'e' Space) */}
        <g className="ee">
          {/* First e */}
          <path stroke="#EAE6DF" strokeLinecap="round" strokeLinejoin="round" fill="none"
            d="M 160 98
               L 194 98
               C 194 72, 178 70, 168 72
               C 156 74, 154 88, 156 98
               C 158 114, 170 120, 184 120
               C 194 120, 202 114, 204 104"
          />
          {/* Second e */}
          <path stroke="#EAE6DF" strokeLinecap="round" strokeLinejoin="round" fill="none"
            d="M 212 98
               L 246 98
               C 246 72, 230 70, 220 72
               C 208 74, 206 88, 208 98
               C 210 114, 222 120, 236 120
               C 246 120, 254 114, 256 104"
          />
        </g>

        {/* FIFTH LETTER: 't' (Ivory Linen - Smooth Bottom Curve) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          d="M 272 48 L 272 128 C 272 136, 276 140, 286 140"
        />
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 256 76 L 290 76"
        />

        {/* SIXTH LETTER: 'i' (Stem - Ivory Linen) */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
          d="M 312 86 L 312 140"
        />

        {/* SIXTH LETTER: 'i' (Dot - Pulsing Amber Orange Animation) */}
        <circle className="idot" cx="312" cy="66" r="7" fill="#E26D34" filter="url(#ga)"/>
      </g>
    </svg>
  );
}
