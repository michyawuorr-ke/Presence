interface WordmarkProps {
  size?: number;
}

export default function Wordmark({ size = 21 }: WordmarkProps) {
  return (
    <span style={{ fontFamily: "var(--font-display)", fontSize: size, fontWeight: 500, letterSpacing: "-0.01em" }}>
      <span style={{ color: "var(--ivory)" }}>Or</span>
      <span style={{ color: "var(--ember)" }}>ee</span>
      <span style={{ color: "var(--ivory)" }}>ti</span>
    </span>
  );
}
