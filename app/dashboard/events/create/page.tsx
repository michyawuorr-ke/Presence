"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { HOST_REGISTRATION_STATUS } from "@/lib/hostRole";

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate() {
    setError("");
    if (!title.trim() || !venue.trim()) {
      setError("Event title and venue are required.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Please set both a start and end date/time.");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError("End must be after start. For a multi-day event, pick a later end date.");
      return;
    }

    setLoading(true);
    try {
      const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: host, error: hostError } = await supabase
        .from("hosts")
        .select("id")
        .eq("email", user.email)
        .single();

      if (hostError || !host) throw new Error("Host record not found.");

      const { data, error: evErr } = await supabase.from("events").insert({
        title: title.trim(),
        venue: venue.trim(),
        description: description.trim(),
        start_time: startTime + ":00+03:00",
        end_time: endTime + ":00+03:00",
        slug,
        status: "draft",
        host_id: host.id,
        // Explicit rather than relying on the column's DB default —
        // UpcomingEvents, /events, and /home/discover all require this to
        // be true before an event shows up anywhere, and nothing else in
        // the creation or publish flow ever set it. Whatever the actual
        // default was, it silently made every published event invisible.
        is_public: true,
      }).select("id").single();

      if (evErr) throw evErr;

      const accessToken = Array.from(
        crypto.getRandomValues(new Uint8Array(32))
      ).map((b: number) => b.toString(16).padStart(2, "0")).join("");

      await supabase.from("registrations").insert({
        event_id: data.id,
        guest_name: user.email?.split("@")[0] || "Host",
        guest_email: user.email,
        guest_phone: "",
        status: HOST_REGISTRATION_STATUS,
        amount: 0,
        paid: true,
        access_token: accessToken,
      });

      router.push(`/dashboard/events/${data.id}?tab=setup`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inp = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "15px 16px",
    borderRadius: "12px",
    color: "#f0ede8",
    outline: "none",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  const canSubmit = title.trim() && venue.trim() && startTime && endTime && !loading;

  return (
    <div style={{ minHeight: "100vh", background: "#060608", color: "#f0ede8", padding: "24px 20px 80px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        <button
          onClick={() => router.back()}
          style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", marginBottom: "28px", fontSize: "13px", fontWeight: "500", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}
        >
          Back
        </button>

        <h1 style={{ fontSize: "26px", fontWeight: "700", letterSpacing: "-0.02em", margin: "0 0 4px" }}>New Event</h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "36px" }}>
          Keep it simple — details like tickets and stations come after.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "700" }}>Event Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Nairobi Founders Summit"
              style={inp}
            />
          </div>

          {/* Venue */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "700" }}>Venue</label>
            <input
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. Radisson Blu, Nairobi"
              style={inp}
            />
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "700" }}>Description <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: "400" }}>· optional</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this event about?"
              rows={3}
              style={{ ...inp, resize: "vertical", minHeight: "80px" }}
            />
          </div>

          {/* Dates */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "10px", color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "700" }}>Starts</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                style={{ ...inp, colorScheme: "dark" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "10px", color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "700" }}>Ends</label>
              <input
                type="datetime-local"
                value={endTime}
                min={startTime || undefined}
                onChange={e => setEndTime(e.target.value)}
                style={{ ...inp, colorScheme: "dark" }}
              />
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                Multi-day events are supported — just pick a later end date.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", padding: "12px 14px" }}>
              <p style={{ color: "#f87171", fontSize: "12px", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            style={{
              marginTop: "8px",
              padding: "16px",
              borderRadius: "14px",
              background: canSubmit ? "linear-gradient(135deg,#221b0f,#13100b)" : "rgba(255,255,255,0.03)",
              color: canSubmit ? "#D4AF37" : "rgba(255,255,255,0.2)",
              fontWeight: "700",
              fontSize: "14px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              border: canSubmit ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.05)",
              transition: "all 0.2s",
              width: "100%",
            }}
          >
            {loading ? "Creating..." : "Create Event"}
          </button>

        </div>
      </div>
    </div>
  );
}
