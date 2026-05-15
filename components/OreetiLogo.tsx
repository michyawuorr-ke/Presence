import React from "react";

const OREETI_COLORS = {
  base: "#403A35",
  accent: "#E26D34",
};

const SW = 3.5;

export default function OreetiLogo({
  size = "md",
  theme = "dark",
}: {
  size?: "sm" | "md" | "lg";
  theme?: "dark" | "light";
}) {
  const scales: any = { sm: 0.5, md: 0.75, lg: 1 };
  const s = scales[size];
  const base = theme === "dark" ? "#f1f0f5" : OREETI_COLORS.base;
  const accent = OREETI_COLORS.accent;

  return (
    <svg
      width={320 * s}
      height={60 * s}
      viewBox="0 0 320 60"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g
        stroke={base}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* O - left letter */}
        <ellipse cx="22" cy="35" rx="16" ry="20" stroke={base} />

        {/* r */}
        <line x1="50" y1="55" x2="50" y2="20" stroke={base} />
        <path d="M 50 28 Q 58 18 70 22" stroke={base} />

        {/* ee ligature - two e's connected */}
        {/* First e */}
        <path d="M 78 35 Q 78 18 90 18 Q 102 18 102 30 L 78 30" stroke={base} />
        <path d="M 78 30 Q 80 45 94 44" stroke={base} />
        {/* Ligature bridge between ee */}
        <path d="M 94 30 Q 106 22 114 30" stroke={accent} strokeWidth={SW + 0.5} />
        {/* Second e */}
        <path d="M 106 35 Q 106 18 118 18 Q 130 18 130 30 L 106 30" stroke={base} />
        <path d="M 106 30 Q 108 45 122 44" stroke={base} />

        {/* t */}
        <line x1="148" y1="12" x2="148" y2="55" stroke={base} />
        <line x1="138" y1="24" x2="160" y2="24" stroke={base} />

        {/* i stem */}
        <line x1="172" y1="30" x2="172" y2="55" stroke={base} />
      </g>

      {/* i dot - accent filled */}
      <rect
        x="168"
        y="16"
        width="8"
        height="8"
        rx="4"
        fill={accent}
      />

      {/* O right - accent activated */}
      <ellipse
        cx="196"
        cy="35"
        rx="16"
        ry="20"
        stroke={accent}
        strokeWidth={SW}
        fill="none"
        strokeLinecap="round"
      />

      {/* Tagline */}
      <text
        x="160"
        y="58"
        textAnchor="middle"
        fontSize="7"
        letterSpacing="3"
        fill={OREETI_COLORS.accent}
        fontFamily="-apple-system,sans-serif"
        opacity="0.7"
      >
        THE ROOM, ACTIVATED.
      </text>
    </svg>
  );
}
