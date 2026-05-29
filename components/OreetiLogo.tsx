"use client";
import React from "react";

interface OreetiLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function OreetiLogo({ size = "md" }: OreetiLogoProps) {
  const scales: Record<string, number> = { sm: 0.42, md: 0.55, lg: 0.7 };
  const s = scales[size] || 0.55;
  const w = Math.round(620 * s);
  const h = Math.round(180 * s);

  return (
    <svg width={w} height={h} viewBox="0 0 620 180" xmlns="http://www.w3.org/2000/svg" fill="none">
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
        @keyframes pulseUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .rO{animation:pulseUp 3s ease-in-out infinite;transform-origin:94px 56px;}
        @keyframes breathe{0%,100%{stroke-width:8;opacity:1}50%{stroke-width:11;opacity:0.85}}
        .ee{animation:breathe 2.8s ease-in-out infinite;}
        @keyframes land{0%,72%{r:7;opacity:0.45}84%{r:11;opacity:1}95%{r:7;opacity:1}100%{r:7;opacity:0.45}}
        .idot{animation:land 3.4s ease-in-out infinite;}
      `}</style>

      {/* FIRST LETTER: 'O' (Left Half - Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
        d="M 52 14 C 22 14, 4 36, 4 62 C 4 88, 22 110, 52 110"
      />

      {/* FIRST LETTER: 'O' (Right Half - Slightly Raised Pulsing Amber Orange) */}
      <g className="rO">
        <path stroke="#E26D34" strokeWidth="8" strokeLinecap="round"
          d="M 56 6 C 86 6, 104 28, 104 54 C 104 80, 86 102, 56 102"
          filter="url(#ga)"
        />
      </g>

      {/* SECOND LETTER: 'r' (Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
        d="M 118 110 L 118 32"
      />
      <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
        d="M 118 52 C 122 36, 136 28, 154 36"
      />

      {/* THIRD & FOURTH LETTERS: 'ee' (Completely Standalone, Separated Lowercase Shapes - Ivory Linen) */}
      <g className="ee">
        {/* First e - Isolated structural loop */}
        <path stroke="#EAE6DF" strokeLinecap="round" strokeLinejoin="round" fill="none"
          d="M 160 68
             L 190 68
             C 190 44, 176 42, 166 44
             C 156 46, 154 58, 156 66
             C 158 80, 168 88, 180 86
             C 188 84, 192 78, 194 72"
        />
        {/* Second e - Shifted with explicit negative space gap to break the connection entirely */}
        <path stroke="#EAE6DF" strokeLinecap="round" strokeLinejoin="round" fill="none"
          d="M 210 68
             L 240 68
             C 240 44, 226 42, 216 44
             C 206 46, 204 58, 206 66
             C 208 80, 218 88, 230 86
             C 238 84, 242 78, 244 72"
        />
      </g>

      {/* FIFTH LETTER: 't' (Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
        d="M 262 18 L 262 98 C 262 106, 266 110, 276 110"
      />
      <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
        d="M 246 46 L 280 46"
      />

      {/* SIXTH LETTER: 'i' (Stem - Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round"
        d="M 302 56 L 302 110"
      />

      {/* SIXTH LETTER: 'i' (Dot - Pulsing Amber Orange) */}
      <circle className="idot" cx="302" cy="36" r="7" fill="#E26D34" filter="url(#ga)"/>
    </svg>
  );
}
