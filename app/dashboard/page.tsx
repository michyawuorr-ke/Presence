import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
      <p style={{ fontSize: "11px", letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: "32px" }}>
        Presence
      </p>
      <h1 style={{ fontSize: "32px", fontWeight: "300", color: "#fff", textAlign: "center", marginBottom: "16px" }}>
        Welcome
      </h1>
      <p style={{ color: "#666", textAlign: "center", marginBottom: "8px" }}>
        Signed in as
      </p>
      <p style={{ color: "#fff", textAlign: "center", marginBottom: "48px" }}>
        {user.email}
      </p>
      <p style={{ color: "#444", fontSize: "14px", textAlign: "center" }}>
        Host dashboard coming in next step...
      </p>
    </main>
  );
}
