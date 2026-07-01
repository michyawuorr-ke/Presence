import React from "react";

const items = [
  {
    n: "01",
    title: "No visibility into who’s in the room.",
    body: "You arrive at events with no map of people. The right connection exists, but remains invisible.",
  },
  {
    n: "02",
    title: "Networking depends on chance.",
    body: "Even in crowded rooms, meaningful interactions happen randomly — not intentionally.",
  },
  {
    n: "03",
    title: "No system to close the loop.",
    body: "After the event ends, opportunities disappear instead of becoming structured connections.",
  },
];

export default function Problem() {
  return (
    <section style={{ padding: "120px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 72 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(138,115,85,0.7)" }}>
          The problem with events
        </p>

        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px,4vw,52px)",
          fontWeight: 500,
          color: "var(--ivory)",
        }}>
          The right person is often in the room. You just never find them.
        </h2>
      </div>

      <div className="problem-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1,
        background: "rgba(138,115,85,0.08)",
        borderRadius: 16,
        overflow: "hidden",
      }}>
        {items.map((item) => (
          <div key={item.n} style={{
            background: "var(--obsidian)",
            padding: "42px 32px",
          }}>
            <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(138,115,85,0.5)" }}>
              {item.n}
            </p>
            <h3 style={{ color: "var(--ivory)" }}>{item.title}</h3>
            <p style={{ color: "var(--dusk)" }}>{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
