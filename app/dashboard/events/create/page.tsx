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
    if (!title || !venue) {
      alert("Please specify a title and venue.");
      return;
    }

    setLoading(true);
    try {
      const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      const { data, error } = await supabase.from("events").insert({
        title,
        venue,
        description,
        start_time: startTime ? startTime + ":00+03:00" : null,
        end_time: endTime ? endTime + ":00+03:00" : null,
        slug,
        status: "draft",
        host_id: user.id
      }).select("id").single();

      if (error) throw error;

      // Create the host's registration immediately so their guest link is
      // available from the moment the event exists, not just when it goes live.
      const accessToken = Array.from(
        crypto.getRandomValues(new Uint8Array(32))
      ).map((b: number) => b.toString(16).padStart(2, '0')).join('');

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const guestUrl = `${appUrl}/e/${slug}/g/${accessToken}`;

      const { error: regError } = await supabase.from("registrations").insert({
        event_id: data.id,
        event_name: title,
        guest_name: user.email?.split("@")[0] || "Host",
        guest_email: user.email,
        guest_phone: "",
        status: "host",
        amount: 0,
        paid: true,
        access_token: accessToken,
        guest_access_link: guestUrl,
      });

      if (regError) {
        alert("Host registration failed: " + regError.message + "\n\nEvent was created. Event ID: " + data.id);
      }

      // Direct structural redirect into the newly initiated workspace
      router.push(`/dashboard/events/${data.id}`);
    } catch (err: any) {
      alert("Database Insertion Failed: " + (err.message || err));
      setLoading(false);
    }
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
