export default function Solution() {
	  return (
		      <>

      <section style={{
        padding: "100px 32px",
        borderTop: "1px solid rgba(138,115,85,0.08)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }} data-reveal data-delay="0">
          <p className="eyebrow" style={{ marginBottom: 20 }}>A new idea</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px,4.5vw,60px)",
            fontWeight: 500,
            color: "var(--ivory)",
            lineHeight: 1.12,
            letterSpacing: "-0.025em",
            margin: "0 0 28px",
          }}>
            What if the room itself became the network?
          </h2>
          <p style={{
            fontSize: 16,
            color: "var(--dusk)",
            lineHeight: 1.75,
            maxWidth: 560,
            margin: "0 auto",
          }}>
            Oreeti is not a badge scanner. It is not a contact exchange. It is not another app you open once and forget. It is the operating system for the social layer of your event.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div data-reveal data-delay="0" style={{ marginBottom: 72 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>How it works</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px,3.5vw,44px)",
            fontWeight: 500,
            color: "var(--ivory)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 480,
          }}>
            Three moments that change everything.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }} className="how-steps">
          {[
            {
              step: "Register",
              headline: "Arrive with intent.",
              detail: "Guests register before the event and build their professional profile. No forms at the door. No name-tag confusion. You walk in already known.",
              accent: "var(--dusk)",
            },
            {
              step: "Discover",
              headline: "See who's in the room.",
              detail: "The Networking tab shows live attendee discovery. Browse professional context, set intent badges, and signal openness to connection — on your own terms.",
              accent: "var(--dusk)",
            },
            {
              step: "Connect",
              headline: "A QR scan that means something.",
              detail: "A mutual handshake request followed by a live QR scan. Both parties have chosen each other. That's not friction — that's meaning.",
              accent: "var(--ember)",
            },
          ].map((item, i) => (
            <div
              key={item.step}
              data-reveal
              data-delay={String(i * 120)}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: 32,
                padding: "44px 0",
                borderBottom: "1px solid rgba(138,115,85,0.1)",
                alignItems: "start",
              }}
            >
              <div>
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(138,115,85,0.4)",
                  margin: "0 0 6px",
                }}>
                  0{i + 1}
                </p>
                <p style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: item.accent,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: 0,
                }}>
                  {item.step}
                </p>
              </div>
              <div>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(18px,2.5vw,30px)",
                  fontWeight: 500,
                  color: "var(--ivory)",
                  letterSpacing: "-0.015em",
                  margin: "0 0 12px",
                  lineHeight: 1.2,
                }}>
                  {item.headline}
                </h3>
                <p style={{ color: "var(--dusk)", fontSize: 14, lineHeight: 1.75, margin: 0, maxWidth: 520 }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </>
        );
}
