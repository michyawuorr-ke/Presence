"use client";
import React from "react";

interface OreetiLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
}

export default function OreetiLogo({ size = "md" }: OreetiLogoProps) {
  const scales: Record<string, number> = { xs: 0.28, sm: 0.42, md: 0.55, lg: 0.7 };
  const s = scales[size] || 0.55;
  // Tightened to the actual glyph bounding box (letters span roughly
  // x:0-313, y:62-174 inside the old 620x220 canvas) plus a small margin,
  // instead of the original viewBox which had ~300px of dead space to the
  // right and ~60px above the letters — that empty space is what was
  // making the rendered logo look oversized/misaligned wherever it sat
  // next to other elements, since containers size around the full box,
  // not the visible ink.
  const viewW = 335;
  const viewH = 140;
  const w = Math.round(viewW * s);
  const h = Math.round(viewH * s);

  return (
    <svg width={w} height={h} viewBox={`-10 44 ${viewW} ${viewH}`} xmlns="http://www.w3.org/2000/svg" fill="none">
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
        @keyframes breathe{0%,100%{stroke-width:10;opacity:1}50%{stroke-width:13;opacity:0.85}}
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

        {/* SECOND LETTER: 'r' (Ivory Linen) — stem at x-height (y86, matching
            e/i) with the shoulder drawn as ONE continuous path from the
            stem, not two separate paths — the two-path version left a
            visible disconnected gap between the stem and the arch, which
            read as a stray floating mark rather than part of the letter. */}
        <path stroke="#EAE6DF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"
          d="M 118 140 L 118 90 C 118 84, 124 80, 134 80 C 142 80, 148 83, 153 88"
        />

        {/* THIRD & FOURTH LETTERS: 'ee' (True Typographic Open Lowercase Shapes)
            Shifted down 16 units from the original coordinates so both bowls
            actually sit on the same y=140 baseline as O/r/t/i — previously
            they ended at y=124, floating visibly above the rest of the word. */}
        <g className="ee">
          {/* First e */}
          <path stroke="#EAE6DF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"
            d="M 160 118 L 194 118 C 194 92, 160 88, 160 114 C 160 140, 192 140, 194 128"
          />
          {/* Second e */}
          <path stroke="#EAE6DF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"
            d="M 206 118 L 240 118 C 240 92, 206 88, 206 114 C 206 140, 238 140, 240 128"
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
        <circle className="idot" cx="302" cy="74" r="7" fill="#E26D34" filter="url(#ga)"/>
      </g>
    </svg>
  );
}
