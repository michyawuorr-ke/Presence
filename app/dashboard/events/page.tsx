"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        
        // Querying host_id precisely as revealed by our database blueprint
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("host_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [router]);

  if (loading) return <div style={{ padding: "40px", color: "#aaa" }}>Loading events...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>Your Events</h1>
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>Total managed: {events.length}</p>

      {events.length === 0 ? (
        <p style={{ color: "#aaa" }}>No events found.</p>
      ) : (
        events.map(event => (
          <div key={event.id} style={{ background: "#111", padding: "16px", borderRadius: "12px", marginBottom: "8px", border: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>{event.title}</h2>
                <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>📍 {event.venue}</p>
              </div>
              <span style={{ fontSize: "11px", background: event.status === "scheduled" ? "rgba(226,109,52,0.15)" : "#222", color: event.status === "scheduled" ? "#E26D34" : "#aaa", padding: "4px 8px", borderRadius: "6px", fontWeight: "600" }}>
                {event.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
