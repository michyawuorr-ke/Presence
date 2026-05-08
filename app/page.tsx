export default function HomePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <p style={{
        fontSize: "11px",
        letterSpacing: "0.3em",
        color: "#666",
        textTransform: "uppercase",
        marginBottom: "32px",
      }}>
        Presence
      </p>
      <h1 style={{
        fontSize: "48px",
        fontWeight: "300",
        color: "#fff",
        textAlign: "center",
        lineHeight: "1.1",
        marginBottom: "16px",
      }}>
        Your event,<br />
        <span style={{ color: "#666" }}>manifested.</span>
      </h1>
      <p style={{
        color: "#555",
        textAlign: "center",
        marginBottom: "48px",
        fontSize: "16px",
      }}>
        Realtime networking. Intentional connections.
      </p>
      <a href="/login" style={{
        background: "#fff",
        color: "#000",
        padding: "16px 48px",
        borderRadius: "24px",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "500",
      }}>
        Host an event
      </a>
    </main>
  );
}
