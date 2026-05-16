"use client";
import React from "react";

export default function OreetiLogo({size="md"}:{size?:"sm"|"md"|"lg"}){
  const scales:any={sm:0.55,md:0.75,lg:1};
  const s=scales[size];
  const w=Math.round(620*s);
  const h=Math.round(180*s);

  return(
    <svg width={w} height={h} viewBox="0 0 620 180" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <filter id="ga" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#555"/>
          <stop offset="35%" stopColor="#eee"/>
          <stop offset="50%" stopColor="#fff"/>
          <stop offset="65%" stopColor="#eee"/>
          <stop offset="100%" stopColor="#555"/>
        </linearGradient>
      </defs>

      <style>{`
        @keyframes pulseUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .rO{animation:pulseUp 3s ease-in-out infinite;transform-origin:94px 56px;}
        @keyframes breathe{0%,100%{stroke-width:8;opacity:1}50%{stroke-width:11;opacity:0.85}}
        .ee{animation:breathe 2.8s ease-in-out infinite;}
        @keyframes land{0%,72%{r:7;opacity:0.45}84%{r:11;opacity:1}95%{r:7;opacity:1}100%{r:7;opacity:0.45}}
        .idot{animation:land 3.4s ease-in-out infinite;}
      `}</style>

      {/* LEFT O — white grounded */}
      <path stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
        d="M 52 14 C 22 14, 4 36, 4 62 C 4 88, 22 110, 52 110"
      />

      {/* RIGHT O — amber pulses up */}
      <g className="rO">
        <path stroke="#E26D34" strokeWidth="8" strokeLinecap="round"
          d="M 56 6 C 86 6, 104 28, 104 54 C 104 80, 86 102, 56 102"
          filter="url(#ga)"
        />
      </g>

      {/* r */}
      <path stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
        d="M 118 110 L 118 32"
      />
      <path stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
        d="M 118 52 C 122 36, 136 28, 154 36"
      />

      {/* ee — one continuous stroke, breathes outward */}
      <path className="ee" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" fill="none"
        d="M 162 68
           L 192 68
           C 192 44, 178 42, 168 44
           C 158 46, 156 58, 158 66
           C 160 80, 170 88, 182 86
           C 190 84, 194 78, 196 72
           C 198 66, 200 62, 206 64
           L 240 68
           C 240 44, 226 42, 216 44
           C 206 46, 204 58, 206 66
           C 208 80, 218 88, 230 86
           C 238 84, 242 78, 244 72"
      />

      {/* t */}
      <path stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
        d="M 262 18 L 262 110"
      />
      <path stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
        d="M 246 46 L 280 46"
      />

      {/* i stem */}
      <path stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
        d="M 302 56 L 302 110"
      />

      {/* i dot — amber lands */}
      <circle className="idot" cx="302" cy="36" r="7" fill="#E26D34" filter="url(#ga)"/>

      {/* Tagline */}
      <text x="155" y="148" textAnchor="middle"
        style={{fontFamily:"'Helvetica Neue',Arial,sans-serif",fontSize:"13.5px",letterSpacing:"0.38em",fill:"url(#chrome)",fontWeight:300}}>
        THE ROOM, ACTIVATED.
      </text>
    </svg>
  );
}
