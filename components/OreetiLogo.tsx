"use client";
import React from "react";

interface OreetiLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function OreetiLogo({ size = "md" }: OreetiLogoProps) {
  const scales: Record<string, number> = { sm: 0.42, md: 0.55, lg: 0.7 };
  const s = scales[size] || 0.55;
  const w = Math.round(660 * s);
  const h = Math.round(180 * s);

  return (
    <svg width={w} height={h} viewBox="0 0 660 180" xmlns="http://www.w3.org/2000/svg" fill="none">
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
        .rO{animation:pulseUp 3s ease-in-out infinite;transform-origin:98px 56px;}
        @keyframes breathe{0%,100%{stroke-width:10.5;opacity:1}50%{stroke-width:12.5;opacity:0.95}}
        .ee{animation:breathe 2.8s ease-in-out infinite;}
        @keyframes land{0%,72%{r:8;opacity:0.45}84%{r:11;opacity:1}95%{r:8;opacity:1}100%{r:8;opacity:0.45}}
        .idot{animation:land 3.4s ease-in-out infinite;}
      `}</style>

      {/* FIRST LETTER: 'O' (Left Half - Balanced Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 56 16 C 24 16, 6 38, 6 64 C 6 90, 24 112, 56 112"
      />

      {/* FIRST LETTER: 'O' (Right Half - Slightly Raised Pulsing Amber Orange) */}
      <g className="rO">
        <path stroke="#E26D34" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
          d="M 60 8 C 92 8, 110 30, 110 56 C 110 82, 92 104, 60 104"
          filter="url(#ga)"
        />
      </g>

      {/* SECOND LETTER: 'r' (Rounded Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 128 112 L 128 34"
      />
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 128 56 C 134 38, 148 30, 166 38"
      />

      {/* THIRD & FOURTH LETTERS: 'ee' (Unified Amber Orange - Inner Loop Kept Intact) */}
      <path className="ee" stroke="#E26D34" strokeLinecap="round" strokeLinejoin="round" fill="none"
        d="M 178 70
           L 208 70
           C 208 46, 194 44, 184 46
           C 174 48, 172 60, 174 68
           C 176 82, 186 90, 198 88
           C 206 86, 210 80, 212 74
           C 214 68, 216 64, 222 66
           L 256 70
           C 256 46, 242 44, 232 46
           C 222 48, 220 60, 222 68
           C 224 82, 234 90, 246 88
           C 254 86, 258 80, 260 74"
      />

      {/* FIFTH LETTER: 't' (Ivory Linen - Elegant Curved Bottom Tail) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 282 20 L 282 96 C 282 108, 286 112, 298 112"
      />
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 264 48 L 302 48"
      />

      {/* SIXTH LETTER: 'i' (Stem - Ivory Linen) */}
      <path stroke="#EAE6DF" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round"
        d="M 326 58 L 326 112"
      />

      {/* SIXTH LETTER: 'i' (Dot - Amber Orange Landing Circle) */}
      <circle className="idot" cx="326" cy="34" r="8" fill="#E26D34" filter="url(#ga)"/>
    </svg>
  );
}
