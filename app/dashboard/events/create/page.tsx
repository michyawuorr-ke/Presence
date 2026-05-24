"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    setLoading(true);
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("events").insert({
      title, venue, description,
      start_time: startTime + ":00+03:00",
      end_time: endTime + ":00+03:00",
      slug, status: "draft",
      organizer_id: user?.id
    });
    router.push("/dashboard/events");
  }

  return (
    <div style={{ padding: "40px 24px", background: "#060608", minHeight: "100vh", color: "#f3f4f6" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", marginBottom: "32px", fontSize: "14px" }}>← Back</button>
        
        <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.02em" }}>New Activation</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "40px" }}>Define the event parameters.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <input placeholder="Event Title" value={title} onChange={e => setTitle(e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "12px", color: "#fff", outline: "none" }} />
          <input placeholder="Venue" value={venue} onChange={e => setVenue(e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "12px", color: "#fff", outline: "none" }} />
          <textarea placeholder="Event Description" value={description} onChange={e => setDescription(e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "12px", color: "#fff", outline: "none", minHeight: "100px" }} />
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>Start Time</label>
              <input type="datetime-local" onChange={e => setStartTime(e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "10px", color: "#fff", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>End Time</label>
              <input type="datetime-local" onChange={e => setEndTime(e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "10px", color: "#fff", outline: "none" }} />
            </div>
          </div>

          <button onClick={handleCreate} disabled={loading} style={{ marginTop: "20px", background: "#D4AF37", border: "none", padding: "16px", borderRadius: "12px", color: "#000", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>
            {loading ? "Initializing..." : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
