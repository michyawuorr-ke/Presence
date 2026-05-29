"use client";
import React from "react";

interface OreetiLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function OreetiLogo({ size = "md" }: OreetiLogoProps) {
  const scales: Record<string, number> = { sm: 0.42, md: 0.55, lg: 0.7 };
  const s = scales[size] || 0.55;
  const w = Math.round(660 * s);
  const h = Math.round(200 * s);

  return (
    <svg width={w} height={h} viewBox="0 0 660 200" xmlns="http://www.w3.org/2000/svg" fill="none">
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
        .rO{animation:pulseUp 3s ease-in-out infinite;transform-origin:98px 76px;}
        @keyframes breathe{0%,100%{stroke-width:10.5;opacity:1}50%{stroke-width:12.5;opacity:0.95}}
        .ee{animation:breathe 2.8s ease-in-out infinite;}
        @keyframes land{0%,72%{r:8;opacity:0.45}84%{r:11;opacity:1}95%{r:8;opacity:1}100%{r:8;opacity:0.45}}
        .idot{animation:land 3.4s ease-in-out infinite;}
      `}</style>

      {/* FIRST LETTER: 'O' (Left Half - Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 56 36 C 24 36, 6 58, 6 84 C 6 110, 24 132, 56 132"
      />

      {/* FIRST LETTER: 'O' (Right Half - Slightly Raised Pulsing Amber Orange) */}
      <g className="rO">
        <path stroke="#E26D34" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
          d="M 60 28 C 92 28, 110 50, 110 76 C 110 102, 92 124, 60 124"
          filter="url(#ga)"
        />
      </g>

      {/* SECOND LETTER: 'r' (Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 132 132 L 132 54"
      />
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 132 72 C 136 50, 150 48, 168 52"
      />

      {/* THIRD & FOURTH LETTERS: 'ee' (Naturally Conjoined, Perfect Same-Level Alignment, Open Normal Ending Curve) */}
      <g className="ee">
        <path stroke="#EAE6DF" strokeLinecap="round" strokeLinejoin="round" fill="none"
          d="M 174 90
             L 212 90
             C 212 66, 196 64, 186 66
             C 174 68, 172 80, 174 88
             C 176 102, 186 110, 202 110
             C 214 110, 220 100, 222 90
             L 260 90
             C 260 66, 244 64, 234 66
             C 222 68, 220 80, 222 88
             C 224 102, 234 110, 250 110
             C 258 110, 264 102, 264 96"
        />
      </g>

      {/* FIFTH LETTER: 't' (Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 298 40 L 298 116 C 298 128, 302 132, 314 132"
      />
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 280 68 L 318 68"
      />

      {/* SIXTH LETTER: 'i' (Stem) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 342 78 L 342 132"
      />

      {/* SIXTH LETTER: 'i' (Dot - Amber Orange Accent) */}
      <circle className="idot" cx="342" cy="54" r="8" fill="#E26D34" filter="url(#ga)"/>
    </svg>
  );
}
