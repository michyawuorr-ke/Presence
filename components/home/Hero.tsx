import Link from "next/link";

export default function Hero() {
	  return (

      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 32px 80px",
        overflow: "hidden",
        textAlign: "center",
      }}>


        {/* radial gradient base */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(44,44,46,0.45) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          <p className="eyebrow" style={{
            marginBottom: 32,
            opacity: 0,
            animation: "heroFade 0.6s ease forwards 0.1s",
          }}>
          </p>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(38px,6.5vw,82px)",
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: "var(--ivory)",
            margin: "0 0 28px",
          }}>
            <span className="hero-word" style={{ animationDelay: "0.2s" }}>Every event</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.38s" }}>you organise</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.54s" }}>should</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.7s" }}>create</span>{" "}
            <span className="hero-word" style={{ animationDelay: "0.86s" }}>value.</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px,1.8vw,19px)",
            color: "var(--dusk)",
            lineHeight: 1.65,
            maxWidth: 520,
            margin: "0 auto 48px",
            opacity: 0,
            animation: "heroFade 0.8s ease forwards 1.1s",
          }}>
            Oreeti is the networking layer that makes it happen — intentional connections, inside your event, every time.
          </p>

          <div style={{
            display: "flex", gap: 12, justifyContent: "center",
            flexWrap: "wrap",
            opacity: 0,
            animation: "heroFade 0.8s ease forwards 1.3s",
          }}>
            <Link href="/login" className="cta-primary" style={{
              background: "rgba(226,109,52,0.08)",
              color: "#E26D34",
              padding: "14px 28px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.03em",
              transition: "opacity 0.2s",
            }}>
              Host your first event
            </Link>
            <Link href="/features" className="cta-secondary" style={{
              background: "transparent",
              color: "var(--dusk)",
              padding: "14px 28px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.03em",
              border: "1px solid rgba(138,115,85,0.25)",
              transition: "color 0.2s, border-color 0.2s",
            }}>
              See how it works
            </Link>
          </div>
        </div>

        {/* scroll hint */}
        <div style={{
          position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
          opacity: 0,
          animation: "heroFade 1s ease forwards 1.8s",
        }}>
          <div style={{
            width: 1, height: 48,
            background: "linear-gradient(to bottom, rgba(138,115,85,0.5), transparent)",
            margin: "0 auto",
          }} />
        </div>

      </section>
        );
}
