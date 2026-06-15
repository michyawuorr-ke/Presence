"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [manualMpesaCode, setManualMpesaCode] = useState("");
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [currentRegId, setCurrentRegId] = useState("");
  const [paymentState, setPaymentState] = useState<"idle"|"waiting"|"success"|"failed">("idle");
  const [confirmedToken, setConfirmedToken] = useState("");
  const isSubmittingRef = useRef(false);
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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (!name || !email) { setError("Please fill in your name and email"); isSubmittingRef.current = false; return; }
    setSubmitting(true);
    setError("");
    try {
      const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,"0")).join("");
      const accessToken = Date.now().toString(16) + "-" + randomBytes;
      const guestUrl = window.location.origin + "/e/" + event?.slug + "/g/" + accessToken;
      setConfirmedToken(accessToken);
      const isFreeEvent = !selectedTicket || Number(selectedTicket.price) <= 0;
      if (isFreeEvent) {
        const { error: freeError } = await supabase.from("registrations").insert({
          event_id: event?.id, ticket_type_id: selectedTicket?.id || null,
          guest_name: name, guest_email: email, guest_phone: phone,
          status: "confirmed", amount: 0, paid: true,
          access_token: accessToken, guest_access_link: guestUrl,
        });
        if (freeError) throw new Error(freeError.message);
        setSuccess(true); setSubmitting(false); isSubmittingRef.current = false; return;
      }
      const totalAmount = Number(selectedTicket?.price ?? 0) * quantity;
      const { data: reg, error: regError } = await supabase.from("registrations").insert({
        event_id: event?.id, ticket_type_id: selectedTicket?.id,
        guest_name: name, guest_email: email, guest_phone: phone,
        status: "pending", amount: totalAmount, paid: false,
        access_token: accessToken, guest_access_link: guestUrl,
      }).select().single();
      if (regError) throw new Error(regError.message);
      setCurrentRegId(reg.id);
      setPaymentState("waiting");
    } catch (err) {
      setError((err as any).message || "Registration failed. Please try again.");
      setSubmitting(false); isSubmittingRef.current = false;
    }
  }

  async function handleManualCodeSubmit() {
    if (!manualMpesaCode.trim()) { setError("Please enter your M-Pesa confirmation code"); return; }
    setIsSavingCode(true); setError("");
    try {
      const { error: updateError } = await supabase.from("registrations")
        .update({ mpesa_receipt: manualMpesaCode.trim(), status: "pending" })
        .eq("id", currentRegId);
      if (updateError) throw new Error(updateError.message);
      setSuccess(true); isSubmittingRef.current = false;
    } catch (err) {
      setError((err as any).message || "Failed to save code. Please try again.");
    } finally { setIsSavingCode(false); }
  }

  function resetForm() {
    setSuccess(false); setPaymentState("idle"); setSubmitting(false);
    isSubmittingRef.current = false; setError(""); setConfirmedToken("");
    setManualMpesaCode(""); setCurrentRegId(""); setName(""); setEmail(""); setPhone("");
  }

  const inp = {
    width:"100%", padding:"14px 0", background:"transparent",
    border:"1px solid transparent", borderBottom:"1px solid rgba(255,255,255,0.08)",
    color:"#fff", fontSize:"14px", outline:"none", marginBottom:"20px",
    boxSizing:"border-box" as const, borderRadius:0
  };

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"rgba(255,255,255,0.3)",fontSize:"12px",letterSpacing:"0.1em"}}>LOADING DOORWAY...</p>
    </div>
  );

  if (!event) return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px"}}>Event not found.</p>
    </div>
  );

  if (success) return (
    <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",background:"#0a0a0a"}}>
      <div style={{maxWidth:"380px",width:"100%",padding:"40px 24px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"24px",textAlign:"center"}}>
        <div style={{fontSize:"36px",color:"#40e0d0",marginBottom:"16px"}}>✓</div>
        <h2 style={{fontSize:"24px",fontWeight:"400",color:"#f5f5f5",marginBottom:"6px"}}>You're In</h2>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:"24px"}}>{event?.title}</p>
        <p style={{color:"#a3a3a3",fontSize:"14px",lineHeight:"1.5",marginBottom:"32px"}}>
          Your registration is received. The host will confirm your payment shortly.
        </p>
        <div style={{background:"rgba(0,0,0,0.15)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"14px",padding:"24px",marginBottom:"36px",textAlign:"left"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px",fontSize:"13px"}}>
            <span style={{color:"rgba(255,255,255,0.4)"}}>Ticket:</span>
            <span style={{color:"#f5f5f5",fontWeight:"500"}}>{selectedTicket?.name || "General"}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px"}}>
            <span style={{color:"rgba(255,255,255,0.4)"}}>Status:</span>
            <span style={{color:"#D4AF37",fontWeight:"500"}}>Pending Verification</span>
          </div>
        </div>
        <button onClick={() => { if (confirmedToken) window.location.href = window.location.origin + "/e/" + event?.slug + "/g/" + confirmedToken; }}
          style={{width:"100%",padding:"16px",background:"rgba(255,255,255,0.05)",color:"#f5f5f5",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"12px",fontSize:"13px",fontWeight:"600",letterSpacing:"0.05em",textTransform:"uppercase",cursor:"pointer"}}>
          Enter Event
        </button>
      </div>
    </main>
  );

  if (paymentState === "waiting") return (
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div style={{maxWidth:"420px",width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"28px",marginBottom:"12px"}}>📲</div>
          <h2 style={{fontSize:"20px",fontWeight:"400",color:"#f5f5f5",marginBottom:"8px"}}>Complete Payment</h2>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:"13px"}}>Send payment then enter your M-Pesa code below</p>
        </div>

        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px",marginBottom:"24px"}}>
          {event?.paybill_number && (
            <>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px",fontSize:"13px"}}>
                <span style={{color:"rgba(255,255,255,0.4)"}}>{event.paybill_account ? "Paybill No:" : "Till No:"}</span>
                <span style={{color:"#fff",fontWeight:"700",fontSize:"18px",letterSpacing:"0.06em"}}>{event.paybill_number}</span>
              </div>
              {event.paybill_account && (
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px",fontSize:"13px"}}>
                  <span style={{color:"rgba(255,255,255,0.4)"}}>Account:</span>
                  <span style={{color:"#fff",fontWeight:"600"}}>{event.paybill_account}</span>
                </div>
              )}
            </>
          )}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"14px",borderTop: event?.paybill_number ? "1px solid rgba(255,255,255,0.05)" : "none",paddingTop: event?.paybill_number ? "10px" : "0",marginTop: event?.paybill_number ? "4px" : "0"}}>
            <span style={{color:"rgba(255,255,255,0.4)"}}>Amount:</span>
            <span style={{color:"#D4AF37",fontWeight:"700",fontSize:"16px"}}>KES {Number(selectedTicket?.price ?? 0) * quantity}</span>
          </div>
        </div>

        <input value={manualMpesaCode} onChange={e => setManualMpesaCode(e.target.value.toUpperCase())}
          placeholder="M-Pesa Code e.g. QHX7K2P3AB" type="text"
          style={{...inp, textAlign:"center", letterSpacing:"0.12em", fontSize:"16px", marginBottom:"12px"}} />

        {error && <p style={{color:"#ef4444",fontSize:"12px",marginBottom:"12px",textAlign:"center"}}>{error}</p>}

        <button onClick={handleManualCodeSubmit} disabled={isSavingCode}
          style={{width:"100%",padding:"14px",borderRadius:"6px",background:isSavingCode?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.06)",color:isSavingCode?"rgba(255,255,255,0.2)":"#ffffff",border:"1px solid rgba(255,255,255,0.15)",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase" as const,cursor:isSavingCode?"not-allowed":"pointer",marginBottom:"16px"}}>
          {isSavingCode ? "Saving..." : "I Have Paid — Submit Code"}
        </button>

        <button onClick={resetForm}
          style={{display:"block",width:"100%",background:"none",border:"none",color:"rgba(255,255,255,0.2)",fontSize:"11px",cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase" as const,textAlign:"center" as const}}>
          Start Over
        </button>
      </div>
    </main>
  );

  return (
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",padding:"40px 24px",maxWidth:"420px",margin:"0 auto",justifyContent:"space-between"}}>
      <style>{`
        @keyframes organicFlow {
          0%{opacity:0;letter-spacing:-0.05em;transform:translateY(12px) scaleY(0.8);filter:blur(4px);}
          60%{opacity:0.8;letter-spacing:0.25em;filter:blur(1px);}
          100%{opacity:1;letter-spacing:0.2em;transform:translateY(0px) scaleY(1);filter:blur(0px);}
        }
        .living-tagline{font-size:11px;color:transparent;text-transform:uppercase;font-weight:500;margin:0;opacity:0;animation:organicFlow 1.6s cubic-bezier(0.25,1,0.5,1) forwards;animation-delay:0.4s;text-shadow:0 0 8px rgba(226,109,52,0.2);}
      `}</style>
      <div>
        <div style={{marginBottom:"40px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"}}>
          <p className="living-tagline">The room activated</p>
          <h1 style={{fontSize:"18px",fontWeight:"600",color:"#fff",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"24px",marginBottom:"6px"}}>Register</h1>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:"14px",margin:0}}>Event: {event.title}</p>
        </div>
        {ticketTypes.length > 0 && (
          <div style={{marginBottom:"8px",position:"relative",width:"100%"}}>
            <select value={selectedTicket?.id||""} onChange={e => setSelectedTicket(ticketTypes.find(t => t.id===e.target.value))} disabled={submitting}
              style={{width:"100%",padding:"14px 0",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:"14px",outline:"none",borderRadius:0,cursor:submitting?"not-allowed":"pointer",appearance:"none",WebkitAppearance:"none"}}>
              {ticketTypes.map(t => (
                <option key={t.id} value={t.id} style={{background:"#000",color:"#fff"}}>
                  {t.name} — {Number(t.price)<=0?"Complimentary":`${t.price} KES`}
                </option>
              ))}
            </select>
            <div style={{position:"absolute",right:"0",top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.25)",fontSize:"11px",pointerEvents:"none"}}>[SELECT TIER]</div>
          </div>
        )}
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name" type="text" disabled={submitting} style={inp}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" type="email" disabled={submitting} style={inp}/>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="M-Pesa Number" type="tel" disabled={submitting} style={inp}/>
      </div>
      <div style={{width:"100%",marginBottom:"24px"}}>
        {error && <p style={{color:"#ef4444",fontSize:"12px",marginBottom:"16px",textAlign:"center"}}>{error}</p>}
        <button onClick={handleRegister} disabled={submitting}
          style={{width:"100%",padding:"14px",borderRadius:"6px",background:submitting?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.06)",color:submitting?"rgba(255,255,255,0.2)":"#ffffff",border:"1px solid rgba(255,255,255,0.15)",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",cursor:submitting?"not-allowed":"pointer"}}>
          {submitting?"Processing...":"Register"}
        </button>
        <p style={{lineHeight:"1.5",fontSize:"11px",color:"rgba(255,255,255,0.3)",textAlign:"center",marginTop:"16px",marginBottom:"0"}}>
          By continuing, you agree to our <a href="/terms" target="_blank" style={{color:"#888",textDecoration:"none"}}>Terms of Use</a> and <a href="/privacy" target="_blank" style={{color:"#888",textDecoration:"none"}}>Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
