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
  // Defaults to true (public) to match the DB column default — matters for
  // events created before this column existed, which will have it null
  // until explicitly saved otherwise.
  const [isPublic, setIsPublic] = useState(event?.is_public ?? true);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  async function toggleVisibility() {
    setVisibilitySaving(true);
    const next = !isPublic;
    const { data, error: err } = await supabase.from("events")
      .update({ is_public: next })
      .eq("id", event.id)
      .select()
      .single();
    setVisibilitySaving(false);
    if (!err && data) {
      setIsPublic(next);
      onEventUpdate({ ...event, ...data, status: event.status });
    }
  }

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

      {/* Visibility */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "24px", marginBottom: "24px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: "12px" }}>Visibility</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "13px", color: "#f0ede8", margin: "0 0 3px", fontWeight: "500" }}>List in public directory</p>
            <p style={{ fontSize: "11.5px", color: "#666", margin: 0, lineHeight: "1.4" }}>
              {isPublic
                ? "Anyone can find this event on Oreeti before it starts. Turn off for invite-only."
                : "Only people with your registration link can find this event."}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={visibilitySaving}
            aria-label={isPublic ? "Make event private" : "Make event public"}
            style={{
              flexShrink: 0, width: "44px", height: "26px", borderRadius: "13px", border: "none",
              cursor: visibilitySaving ? "default" : "pointer", position: "relative", transition: "background 0.2s",
              background: isPublic ? GOLD : "rgba(255,255,255,0.1)", opacity: visibilitySaving ? 0.6 : 1,
            }}
          >
            <span style={{
              position: "absolute", top: "3px", left: isPublic ? "22px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%", background: "#0a0a0b",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
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
