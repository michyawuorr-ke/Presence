"use client";
import { useEffect, useState } from "react";
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
  const [guestLink, setGuestLink] = useState("");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "waiting" | "success" | "failed">("idle");
  const [checkoutId, setCheckoutId] = useState("");
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

  function normalizePhone(p: string) {
    const d = p.replace(/\D/g, "");
    if (d.startsWith("0") && d.length === 10) return "254" + d.slice(1);
    if (d.startsWith("254")) return d;
    if (d.startsWith("7") && d.length === 9) return "254" + d;
    return d;
  }

  async function pollPayment(cid: string, link: string) {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data: payment } = await supabase.from("payments").select("status").eq("mpesa_receipt", cid).single();
      if (payment?.status === "success") {
        clearInterval(interval);
        setPaymentState("success");
        setGuestLink(link);
        setSuccess(true);
      } else if (payment?.status === "failed" || attempts > 20) {
        clearInterval(interval);
        setPaymentState("failed");
        setError("Payment failed or timed out. Please try again.");
        setSubmitting(false);
      }
    }, 3000);
  }

  async function handleRegister() {
    if (!name || !email) { setError("Please fill in your name and email"); return; }
    const isPaid = Number(selectedTicket?.price) > 0;
    if (isPaid && !phone) { setError("Phone number required for M-Pesa payment"); return; }
    setSubmitting(true);
    setError("");

    const accessToken = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
    const guestUrl = window.location.origin + "/e/" + event.slug + "/g/" + accessToken;
    const totalAmount = Number(selectedTicket?.price ?? 0) * quantity;

    const { data: reg, error: regError } = await supabase.from("registrations").insert({
      event_id: event.id,
      ticket_type_id: selectedTicket?.id,
      guest_name: name,
      guest_email: email,
      guest_phone: phone,
      status: isPaid ? "pending" : "confirmed",
      amount: totalAmount,
      paid: !isPaid,
      access_token: accessToken,
      guest_access_link: guestUrl,
    }).select().single();

    if (regError) { setError(regError.message); setSubmitting(false); return; }

    if (!isPaid) {
      setGuestLink(guestUrl);
      setSuccess(true);
      setSubmitting(false);
      return;
    }

    const norm = normalizePhone(phone);
    const res = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: norm, amount: totalAmount, registration_id: reg.id })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Payment initiation failed"); setSubmitting(false); return; }
    setCheckoutId(data.checkout_request_id);
    setPaymentState("waiting");
    pollPayment(data.checkout_request_id, guestUrl);
  }

  function copyLink(link: string) {
    const el = document.createElement("textarea");
    el.value = link; el.style.position = "fixed"; el.style.opacity = "0";
    document.body.appendChild(el); el.focus(); el.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(el);
  }

  const inp = {
    width: "100%",
    padding: "12px 0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    marginBottom: "16px",
    boxSizing: "border-box" as const,
    borderRadius: 0
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", letterSpacing: "0.1em" }}>LOADING DOORWAY...</p>
    </div>
  );

  if (!event) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.05em" }}>DOMAIN NOT ESTABLISHED</p>
    </div>
  );

  if (paymentState === "waiting") return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "40px" }}>Oreeti</p>
      <div style={{ fontSize: "24px", color: "#E26D34", marginBottom: "24px" }}>📱</div>
      <h1 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", textAlign: "center", marginBottom: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Check your device</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "4px", fontSize: "13px" }}>An M-Pesa prompt has been routed to</p>
      <p style={{ color: "#fff", fontSize: "15px", fontWeight: "500", marginBottom: "32px", letterSpacing: "0.02em" }}>{phone}</p>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", marginBottom: "32px", lineHeight: "1.6", maxWidth: "280px" }}>ENTER YOUR PIN TO AUTHORIZE ACCESS. THIS LEDGER UPDATES DYNAMICALLY.</p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(226,109,52,0.4)" }} />)}
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", marginBottom: "16px" }}>{error}</p>}
      <button onClick={() => { setPaymentState("idle"); setSubmitting(false); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "40px" }}>Oreeti</p>
      <div style={{ fontSize: "24px", color: "#4ade80", marginBottom: "16px" }}>✓</div>
      <h1 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", textAlign: "center", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Pass Secured</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "32px", fontSize: "13px" }}>{event.title}</p>
      
      <div style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "32px 24px", width: "100%", maxWidth: "340px", marginBottom: "32px", boxSizing: "border-box", textAlign: "center" }}>
        <p style={{ fontSize: "11px", color: "#D4AF37", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "600" }}>Pass Dispatched</p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", margin: 0 }}>
          Your unique secure coordinate link has been routed directly to your registered Gmail address.
        </p>
      </div>
      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase", maxWidth: "260px", lineHeight: "1.6" }}>
        Please check your inbox to access your networking card and sync with the room.
      </p>
    </div>
  );

  const isPaid = Number(selectedTicket?.price) > 0;
  const total = Number(selectedTicket?.price ?? 0) * quantity;

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "48px 24px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "48px", textAlign: "center" }}>Oreeti</p>
      <div style={{ maxWidth: "440px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "500", color: "#fff", marginBottom: "8px", letterSpacing: "0.01em" }}>{event.title}</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontSize: "13px" }}>📍 {event.venue}</p>
        <p style={{ color: "rgba(255,255,255,0.3)", marginBottom: "40px", fontSize: "12px", letterSpacing: "0.02em" }}>
          {new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        {ticketTypes.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Select Tier</p>
            {ticketTypes.map(t => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div 
                  key={t.id} 
                  onClick={() => { setSelectedTicket(t); setQuantity(1); }} 
                  style={{ padding: "16px 0", borderBottom: "1px solid " + (isSelected ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)"), marginBottom: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: isSelected ? 1 : 0.45, transition: "all 0.2s" }}
                >
                  <p style={{ color: "#fff", fontSize: "14px", margin: 0, fontWeight: isSelected ? "500" : "400" }}>{t.name}</p>
                  <p style={{ color: t.price > 0 ? "#fff" : "#4ade80", fontSize: "14px", margin: 0, fontWeight: "500" }}>{t.price > 0 ? "KES " + t.price : "Complimentary"}</p>
                </div>
              );
            })}
          </div>
        )}

        {isPaid && (
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Quantity</p>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <p style={{ color: "#fff", fontSize: "16px", fontWeight: "500", minWidth: "24px", textAlign: "center", margin: 0 }}>{quantity}</p>
                <button onClick={() => setQuantity(q => Math.min(10, q + 1))} style={{ width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                Total: <span style={{ color: "#fff", fontWeight: "500" }}>KES {total.toLocaleString()}</span>
              </p>
            </div>
          </div>
        )}

        <div style={{ marginTop: "8px" }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inp} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={isPaid ? "M-Pesa contact (required)" : "Contact phone (optional)"} type="tel" style={inp} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginTop: "16px", marginBottom: "32px" }}>
          <div 
            onClick={() => setConsent(!consent)} 
            style={{ width: "18px", height: "18px", borderRadius: "4px", border: "1px solid " + (consent ? "#E26D34" : "rgba(255,255,255,0.2)"), background: consent ? "#E26D34" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: "2px" }}
          >
            {consent && <span style={{ color: "#000", fontSize: "11px", fontWeight: "700" }}>✓</span>}
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "1.6", margin: 0 }}>
            I agree to the platform{" "}
            <a href="/terms" target="_blank" style={{ color: "#E26D34", textDecoration: "none" }}>Terms of Use</a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" style={{ color: "#E26D34", textDecoration: "none" }}>Privacy Policy</a>
          </p>
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "16px", letterSpacing: "0.01em" }}>{error}</p>}

        <button 
          onClick={handleRegister} 
          disabled={submitting} 
          style={{ width: "100%", padding: "14px", borderRadius: "6px", background: submitting ? "transparent" : "#fff", color: submitting ? "rgba(255,255,255,0.2)" : "#000", border: submitting ? "1px solid rgba(255,255,255,0.08)" : "none", fontSize: "12px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer", transition: "all 0.2s" }}
        >
          {submitting ? "Routing Ledger..." : isPaid ? "Pay KES " + total.toLocaleString() + " via M-Pesa" : "Secure Access Pass"}
        </button>
      </div>
    </div>
  );
}