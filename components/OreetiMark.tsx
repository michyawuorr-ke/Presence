"use client";
import React from "react";

interface OreetiMarkProps {
  size?: number; // pixel height, width scales proportionally
}

// Static (non-animated) version of just the "O" from OreetiLogo — the full
// wordmark's pulsing/breathing animation reads as busy at small corner
// sizes; a calm static mark is the better fit there.
export default function OreetiMark({ size = 32 }: OreetiMarkProps) {
  const w = Math.round(size * (108 / 140));
  return (
    <svg width={w} height={size} viewBox="0 0 108 140" xmlns="http://www.w3.org/2000/svg" fill="none">
      <path stroke="#EAE6DF" strokeWidth="10" strokeLinecap="round"
        d="M 52 14 C 22 14, 4 36, 4 62 C 4 88, 22 110, 52 110"
      />
      <path stroke="#E26D34" strokeWidth="10" strokeLinecap="round"
        d="M 56 6 C 86 6, 104 28, 104 54 C 104 80, 86 102, 56 102"
      />
    </svg>
  );
}
