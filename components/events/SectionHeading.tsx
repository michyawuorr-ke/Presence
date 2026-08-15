export default function SectionHeading({ eyebrow, title }: { eyebrow: string; title?: string }) {
  return (
    <div style={{ marginBottom: 20 }} data-reveal>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ember)", margin: title ? "0 0 4px" : 0 }}>
        {eyebrow}
      </p>
      {title && (
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ivory)", margin: 0, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      )}
    </div>
  );
}
