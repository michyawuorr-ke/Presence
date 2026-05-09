"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [guestLink, setGuestLink] = useState("");
  const [error, setError] = useState("");
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase.from("events").select("*").eq("slug", slug).single();
      if (!ev) { setLoading(false); return; }
      setEvent(ev);
      const { data: tickets } = await supabase.from("ticket_types").select("*").eq("event_id", ev.id).eq("is_active", true);
      setTicketTypes(tickets ?? []);
      if (tickets?.length) setSelectedTicket(tickets[0]);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleRegister() {
    if (!name || !email) { setError("Please fill in your name and email"); return; }
    setSubmitting(true);
    setError("");
    const accessToken = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2,"0")).join("");
    const { data: reg, error: regError } = await supabase.from("registrations").insert({
      event_id: event.id,
      ticket_type_id: selectedTicket?.id,
      guest_name: name,
      guest_email: email,
      guest_phone: phone,
      status: "confirmed",
      amount: selectedTicket?.price ?? 0,
      paid: true,
      access_token: accessToken,
      guest_access_link: window.location.origin + "/e/" + event.slug + "/g/" + accessToken,
    }).select().single();
    if (regError) { setError(regError.message); setSubmitting(false); return; }
    setGuestLink(window.location.origin + "/e/" + event.slug + "/g/" + accessToken);
    setSuccess(true);
    setSubmitting(false);
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#666"}}>Loading...</p>
    </div>
  );

  if (!event) return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#666"}}>Event not found</p>
    </div>
  );

  if (success) return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"32px"}}>Presence</p>
      <p style={{fontSize:"40px",marginBottom:"16px"}}>✓</p>
      <h1 style={{fontSize:"24px",fontWeight:"300",color:"#fff",textAlign:"center",marginBottom:"8px"}}>You are in.</h1>
      <p style={{color:"#666",textAlign:"center",marginBottom:"32px"}}>{event.title}</p>
      <div style={{background:"#111",borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"360px",marginBottom:"24px"}}>
        <p style={{fontSize:"12px",color:"#666",marginBottom:"8px"}}>YOUR EXPERIENCE LINK</p>
        <p style={{fontSize:"13px",color:"#fff",wordBreak:"break-all",marginBottom:"16px"}}>{guestLink}</p>
        <button onClick={() => navigator.clipboard.writeText(guestLink)}
          style={{width:"100%",padding:"12px",borderRadius:"12px",background:"#fff",color:"#000",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>
          Copy link
        </button>
      </div>
      <p style={{color:"#444",fontSize:"13px",textAlign:"center"}}>Save this link. It is your ticket and networking pass.</p>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#000",padding:"40px 24px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"40px",textAlign:"center"}}>Presence</p>
      <div style={{maxWidth:"480px",margin:"0 auto"}}>
        <h1 style={{fontSize:"28px",fontWeight:"300",color:"#fff",marginBottom:"8px"}}>{event.title}</h1>
        <p style={{color:"#666",marginBottom:"4px"}}>📍 {event.venue}</p>
        <p style={{color:"#555",marginBottom:"32px",fontSize:"14px"}}>
          {new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </p>

        {ticketTypes.length > 0 && (
          <div style={{marginBottom:"24px"}}>
            <p style={{fontSize:"13px",color:"#666",marginBottom:"12px"}}>SELECT TICKET</p>
            {ticketTypes.map(t => (
              <div key={t.id} onClick={() => setSelectedTicket(t)}
                style={{padding:"16px",borderRadius:"14px",border:"1px solid " + (selectedTicket?.id === t.id ? "#fff" : "#222"),
                  marginBottom:"8px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{color:"#fff",fontSize:"15px"}}>{t.name}</p>
                <p style={{color: t.price > 0 ? "#60a5fa" : "#4ade80",fontSize:"15px",fontWeight:"500"}}>
                  {t.price > 0 ? "KES " + t.price : "Free"}
                </p>
              </div>
            ))}
          </div>
        )}

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
          style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px solid #222",background:"#111",
            color:"#fff",fontSize:"15px",outline:"none",marginBottom:"12px",boxSizing:"border-box"}} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email"
          style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px solid #222",background:"#111",
            color:"#fff",fontSize:"15px",outline:"none",marginBottom:"12px",boxSizing:"border-box"}} />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone 07XXXXXXXX" type="tel"
          style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px solid #222",background:"#111",
            color:"#fff",fontSize:"15px",outline:"none",marginBottom:"24px",boxSizing:"border-box"}} />

        {error && <p style={{color:"#ef4444",fontSize:"13px",marginBottom:"16px"}}>{error}</p>}

        <button onClick={handleRegister} disabled={submitting}
          style={{width:"100%",padding:"16px",borderRadius:"16px",background:submitting?"#333":"#fff",
            color:"#000",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
          {submitting ? "Registering..." : selectedTicket?.price > 0 ? "Buy ticket KES " + selectedTicket.price : "Get free ticket"}
        </button>
      </div>
    </div>
  );
}