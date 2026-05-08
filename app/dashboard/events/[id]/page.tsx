"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EventDetailPage() {
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketQty, setTicketQty] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
      const { data: tickets } = await supabase.from("ticket_types").select("*").eq("event_id", id);
      setEvent(ev);
      setTicketTypes(tickets ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handlePublish() {
    await supabase.from("events").update({ status: "scheduled" }).eq("id", id);
    setEvent({ ...event, status: "scheduled" });
  }

  async function handleEnd() {
    await supabase.from("events").update({ status: "ended" }).eq("id", id);
    setEvent({ ...event, status: "ended" });
  }

  async function handleAddTicket() {
    if (!ticketName) return;
    setSaving(true);
    const { data } = await supabase.from("ticket_types").insert({
      event_id: id,
      name: ticketName,
      price: parseFloat(ticketPrice) || 0,
      quantity: parseInt(ticketQty) || null,
      currency: "KES",
    }).select().single();
    if (data) setTicketTypes([...ticketTypes, data]);
    setTicketName(""); setTicketPrice(""); setTicketQty("");
    setShowAddTicket(false);
    setSaving(false);
  }

  if (loading) return <div style={{textAlign:"center",padding:"60px",color:"#999"}}>Loading...</div>;
  if (!event) return <div style={{textAlign:"center",padding:"60px",color:"#999"}}>Event not found</div>;

  const statusColor: any = { draft:"#999", scheduled:"#2563eb", live:"#16a34a", ended:"#666" };
  const registrationLink = `${window.location.origin}/register/${event.slug}`;

  return (
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <button onClick={() => router.back()}
        style={{background:"none",border:"none",color:"#999",fontSize:"14px",cursor:"pointer",marginBottom:"24px",padding:"0"}}>
        ← Back
      </button>

      {/* Event header */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
          <h1 style={{fontSize:"22px",fontWeight:"500"}}>{event.title}</h1>
          <span style={{fontSize:"11px",textTransform:"uppercase",fontWeight:"500",color:statusColor[event.status]}}>
            {event.status}
          </span>
        </div>
        <p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>📍 {event.venue}</p>
        <p style={{fontSize:"14px",color:"#999",marginBottom:"4px"}}>
          🗓 {new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
        </p>
        <p style={{fontSize:"14px",color:"#999",marginBottom:"16px"}}>
          🕐 {new Date(event.start_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})} — {new Date(event.end_time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}
        </p>
        {event.description && <p style={{fontSize:"14px",color:"#555"}}>{event.description}</p>}
      </div>

      {/* Registration link */}
      {event.status !== "draft" && (
        <div style={{background:"#f0fdf4",borderRadius:"16px",padding:"16px",marginBottom:"16px",border:"1px solid #bbf7d0"}}>
          <p style={{fontSize:"12px",color:"#16a34a",marginBottom:"8px",fontWeight:"500"}}>REGISTRATION LINK</p>
          <p style={{fontSize:"13px",color:"#333",wordBreak:"break-all",marginBottom:"12px"}}>{registrationLink}</p>
          <button onClick={() => navigator.clipboard.writeText(registrationLink)}
            style={{padding:"8px 16px",borderRadius:"10px",background:"#16a34a",color:"#fff",border:"none",fontSize:"12px",cursor:"pointer"}}>
            Copy link
          </button>
        </div>
      )}

      {/* Ticket types */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",marginBottom:"16px",border:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <h2 style={{fontSize:"16px",fontWeight:"500"}}>Ticket Types</h2>
          <button onClick={() => setShowAddTicket(!showAddTicket)}
            style={{padding:"8px 16px",borderRadius:"12px",background:"#000",color:"#fff",border:"none",fontSize:"12px",cursor:"pointer"}}>
            + Add
          </button>
        </div>

        {showAddTicket && (
          <div style={{background:"#f9fafb",borderRadius:"14px",padding:"16px",marginBottom:"16px"}}>
            <input value={ticketName} onChange={e => setTicketName(e.target.value)}
              placeholder="Ticket name (e.g. General, VIP)"
              style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"8px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
            <input value={ticketPrice} onChange={e => setTicketPrice(e.target.value)}
              placeholder="Price in KES (0 for free)"
              type="number"
              style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"8px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
            <input value={ticketQty} onChange={e => setTicketQty(e.target.value)}
              placeholder="Quantity (leave empty for unlimited)"
              type="number"
              style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"12px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
            <button onClick={handleAddTicket} disabled={saving}
              style={{width:"100%",padding:"12px",borderRadius:"12px",background:"#000",color:"#fff",border:"none",fontSize:"14px",cursor:"pointer"}}>
              {saving ? "Saving..." : "Save ticket type"}
            </button>
          </div>
        )}

        {ticketTypes.length === 0 && !showAddTicket && (
          <p style={{color:"#999",fontSize:"14px"}}>No ticket types yet. Add one above.</p>
        )}

        {ticketTypes.map((t) => (
          <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #f3f4f6"}}>
            <p style={{fontSize:"14px",fontWeight:"500"}}>{t.name}</p>
            <p style={{fontSize:"14px",color: t.price > 0 ? "#2563eb" : "#16a34a"}}>
              {t.price > 0 ? "KES " + t.price : "Free"}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {event.status === "draft" && (
          <button onClick={handlePublish}
            style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#2563eb",color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
            Publish Event
          </button>
        )}
        {event.status === "scheduled" && (
          <button onClick={() => supabase.from("events").update({status:"live"}).eq("id",id).then(() => setEvent({...event,status:"live"}))}
            style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#16a34a",color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
            Go Live
          </button>
        )}
        {event.status === "live" && (
          <button onClick={handleEnd}
            style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#ef4444",color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
            End Event
          </button>
        )}
      </div>
    </div>
  );
}