"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function GuestView() {
  const [data, setData] = useState<any>(null);
  const params = useParams();
  const { slug, token } = params;

  useEffect(() => {
    async function load() {
      const { data: entry } = await supabase
        .from("registrations")
        .select("*, events(*)")
        .ilike("guest_access_link", `%${token}`)
        .single();
      setData(entry);
    }
    load();
  }, [token]);

  if (!data) return <div style={{ padding: "40px", textAlign: "center", color: "#fff" }}>Authenticating...</div>;

  return (
    <div style={{ padding: "40px 24px", background: "#060608", minHeight: "100vh" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", color: "#fff", marginBottom: "8px" }}>{data.events.title}</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px" }}>
          Welcome, {data.guest_name}. Your profile is active.
        </p>
      </div>
    </div>
  );
}
