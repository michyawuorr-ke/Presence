export default function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }} data-reveal>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ember)", margin: "0 0 4px" }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ivory)", margin: 0, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
    </div>
  );
}
