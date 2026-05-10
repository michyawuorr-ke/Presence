"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CreateEventPage() {
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate() {
    if (!title || !venue || !startTime || !endTime) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Ensure host record exists
    await supabase.from("hosts").upsert({
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.name ?? user.email ?? "Host",
    }, { onConflict: "id" });

    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

    const { error: err } = await supabase.from("events").insert({
      host_id: user.id,
      title,
      venue,
      description,
      start_time: startTime+":00+03:00",
      end_time: endTime+":00+03:00",
      is_paid: isPaid,
      status: "draft",
      slug,
      timezone: "Africa/Nairobi",
    });

    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/dashboard/events");
  }

  const inputStyle = {
    width:"100%", padding:"14px", borderRadius:"14px",
    border:"1px solid #e5e7eb", background:"#fff",
    fontSize:"15px", outline:"none", boxSizing:"border-box" as const,
    marginBottom:"16px",
  };

  return (
    <div style={{maxWidth:"520px",margin:"0 auto"}}>
      <button onClick={() => router.back()}
        style={{background:"none",border:"none",color:"#999",fontSize:"14px",
          cursor:"pointer",marginBottom:"24px",padding:"0"}}>
        ← Back
      </button>
      <h1 style={{fontSize:"24px",fontWeight:"500",marginBottom:"32px"}}>Create event</h1>

      <label style={{fontSize:"13px",color:"#666",display:"block",marginBottom:"6px"}}>Event title *</label>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Nairobi Tech Meetup" style={inputStyle} />

      <label style={{fontSize:"13px",color:"#666",display:"block",marginBottom:"6px"}}>Venue *</label>
      <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. iHub, Nairobi" style={inputStyle} />

      <label style={{fontSize:"13px",color:"#666",display:"block",marginBottom:"6px"}}>Description</label>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" style={inputStyle} />

      <label style={{fontSize:"13px",color:"#666",display:"block",marginBottom:"6px"}}>Start time *</label>
      <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />

      <label style={{fontSize:"13px",color:"#666",display:"block",marginBottom:"6px"}}>End time *</label>
      <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />

      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px",
        padding:"16px",borderRadius:"14px",border:"1px solid #e5e7eb",background:"#fff"}}>
        <input type="checkbox" id="paid" checked={isPaid}
          onChange={e => setIsPaid(e.target.checked)}
          style={{width:"18px",height:"18px",cursor:"pointer"}} />
        <label htmlFor="paid" style={{fontSize:"15px",cursor:"pointer"}}>
          This is a paid event
        </label>
      </div>

      {error && <p style={{color:"#ef4444",fontSize:"13px",marginBottom:"16px"}}>{error}</p>}

      <button onClick={handleCreate} disabled={loading}
        style={{width:"100%",padding:"16px",borderRadius:"16px",
          background:loading?"#999":"#000",color:"#fff",border:"none",
          fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
        {loading ? "Creating..." : "Create event"}
      </button>
    </div>
  );
}