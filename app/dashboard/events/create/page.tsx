"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CreateEventPage() {
  const [form, setForm] = useState({
    title: "", venue: "", description: "",
    start_time: "", end_time: "", is_paid: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate() {
    if (!form.title || !form.venue || !form.start_time || !form.end_time) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

    const { error } = await supabase.from("events").insert({
      host_id: user.id,
      title: form.title,
      venue: form.venue,
      description: form.description,
      start_time: form.start_time,
      end_time: form.end_time,
      is_paid: form.is_paid,
      status: "draft",
      slug,
    });

    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard/events");
  }

  const field = (label: string, key: string, type = "text", required = false) => (
    <div style={{marginBottom:"16px"}}>
      <label style={{display:"block",fontSize:"13px",color:"#666",marginBottom:"6px"}}>
        {label}{required && " *"}
      </label>
      <input type={type} value={(form as any)[key]}
        onChange={(e) => setForm({...form, [key]: e.target.value})}
        style={{width:"100%",padding:"14px",borderRadius:"14px",border:"1px solid #e5e7eb",
          background:"#fff",fontSize:"15px",outline:"none",boxSizing:"border-box"}} />
    </div>
  );

  return (
    <div style={{maxWidth:"520px",margin:"0 auto"}}>
      <button onClick={() => router.back()}
        style={{background:"none",border:"none",color:"#999",fontSize:"14px",cursor:"pointer",marginBottom:"24px"}}>
        ← Back
      </button>
      <h1 style={{fontSize:"24px",fontWeight:"500",marginBottom:"32px"}}>Create event</h1>

      {field("Event title", "title", "text", true)}
      {field("Venue", "venue", "text", true)}
      {field("Description", "description")}
      {field("Start time", "start_time", "datetime-local", true)}
      {field("End time", "end_time", "datetime-local", true)}

      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px",
        padding:"16px",borderRadius:"14px",border:"1px solid #e5e7eb",background:"#fff"}}>
        <input type="checkbox" id="paid" checked={form.is_paid}
          onChange={(e) => setForm({...form, is_paid: e.target.checked})}
          style={{width:"18px",height:"18px",cursor:"pointer"}} />
        <label htmlFor="paid" style={{fontSize:"15px",cursor:"pointer"}}>
          This is a paid event
        </label>
      </div>

      {error && <p style={{color:"#ef4444",fontSize:"13px",marginBottom:"16px"}}>{error}</p>}

      <button onClick={handleCreate} disabled={loading}
        style={{width:"100%",padding:"16px",borderRadius:"16px",background:loading?"#999":"#000",
          color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
        {loading ? "Creating..." : "Create event"}
      </button>
    </div>
  );
}