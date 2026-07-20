"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SettingsTabProps {
  event: any;
  onEventUpdate: (e: any) => void;
}

const GOLD = "#D4AF37";

export default function SettingsTab({ event, onEventUpdate }: SettingsTabProps) {
  const router = useRouter();
  const [title, setTitle] = useState(event?.title || "");
  const [venue, setVenue] = useState(event?.venue || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startTime, setStartTime] = useState(event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : "");
  const [endTime, setEndTime] = useState(event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!title || !venue) { setError("Title and venue are required."); return; }
    if (!startTime || !endTime) { setError("Both start and end times are required."); return; }
    if (new Date(endTime) <= new Date(startTime)) { setError("End must be after start."); return; }
    setError(""); setSaving(true);
    const { data, error: err } = await supabase.from("events")
      .update({ title, venue, description, start_time: startTime + ":00+03:00", end_time: endTime + ":00+03:00" })
      .eq("id", event.id)
      .select()
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    // Merge the saved fields back but preserve the event's current status —
    // saving details must never override ended/live status
    if (data) {
      onEventUpdate({ ...event, ...data, status: event.status });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    }
  }

  const inp = { width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" as const, marginBottom: "10px" };
  const label = { fontSize: "10px", fontWeight: "700" as const, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#555", display: "block" as const, marginBottom: "6px" };

  return (
    <div style={{ paddingBottom: "48px" }}>
      <section style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: "16px" }}>Event Details</p>

        <label style={label}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" style={inp} />

        <label style={label}>Venue</label>
        <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue name" style={inp} />

        <label style={label}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" style={{ ...inp, minHeight: "80px", resize: "vertical" }} />

        <label style={label}>Event Starts</label>
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} />

        <label style={label}>Event Ends</label>
        <input type="datetime-local" value={endTime} min={startTime || undefined} onChange={e => setEndTime(e.target.value)} style={inp} />
        <p style={{ fontSize: "11px", color: "#444", marginBottom: "16px", marginTop: "-4px" }}>For multi-day events, pick a later end date.</p>

        {error && <p style={{ fontSize: "12px", color: "#D4AF37", marginBottom: "12px" }}>{error}</p>}

        <button onClick={save} disabled={saving}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", color: GOLD, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </section>

      {/* Danger zone */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "24px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: "#666", textTransform: "uppercase", marginBottom: "12px" }}>Danger Zone</p>
        <button
          onClick={() => { if (confirm("Delete this event? This cannot be undone.")) { supabase.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", event.id).then(() => router.push("/dashboard/events")); } }}
          style={{ width: "100%", padding: "11px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.6)", fontSize: "12px", cursor: "pointer" }}>
          Delete Event
        </button>
      </section>
    </div>
  );
}
