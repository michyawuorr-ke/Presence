"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import OreetiLogo from "@/components/OreetiLogo";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "waiting" | "success" | "failed">("idle");

  const [confirmedToken, setConfirmedToken] = useState("");

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
    if (!acceptedTerms) { setError("You must accept the terms to continue"); return; }
    if (!name || !email) { setError("Please fill in your name and email"); return; }

    setSubmitting(true);
    setError("");

    try {
      const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("");
      const accessToken = Date.now().toString(16) + "-" + randomBytes;
      const guestUrl = window.location.origin + "/e/" + event.slug + "/g/" + accessToken;
      
      setConfirmedToken(accessToken);

      const isFreeEvent = !selectedTicket || Number(selectedTicket.price) <= 0;

      if (isFreeEvent) {
        const { error: freeError } = await supabase.from("registrations").insert({
          event_id: event.id,
          ticket_type_id: selectedTicket?.id || null,
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          status: "confirmed",
          amount: 0,
          paid: true,
          access_token: accessToken,
          guest_access_link: guestUrl,
        });

        if (freeError) throw new Error(freeError.message);
        
        setSuccess(true);
        setSubmitting(false);
        return;
      }

      const totalAmount = Number(selectedTicket?.price ?? 0) * quantity;
      const { data: reg, error: regError } = await supabase.from("registrations").insert({
        event_id: event.id,
        ticket_type_id: selectedTicket?.id,
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
        status: "pending",
        amount: totalAmount,
        paid: false,
        access_token: accessToken,
        guest_access_link: guestUrl,
      }).select().single();

      if (regError) throw new Error(regError.message);

      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), amount: totalAmount, registration_id: reg.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initiation failed");

      setPaymentState("waiting");
      pollPayment(data.checkout_request_id, guestUrl);

    } catch (err) {
      console.error("Registration failed:", err);
      setError((err as any).message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSuccess(false);
    setPaymentState("idle");
    setSubmitting(false);
    setError("");
    setAcceptedTerms(false);
    setConfirmedToken("");
  }

  const inp = {
    width: "100%",
    padding: "14px 0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    marginBottom: "20px",
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
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#E26D34", textTransform: "uppercase", marginBottom: "40px" }}>Oreeti</p>
      <div style={{ fontSize: "24px", color: "#E26D34", marginBottom: "24px" }}>📱</div>
      <h1 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", textAlign: "center", marginBottom: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Check your device</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "4px", fontSize: "13px" }}>An M-Pesa prompt has been routed to</p>
      <p style={{ color: "#fff", fontSize: "15px", fontWeight: "500", marginBottom: "32px", letterSpacing: "0.02em" }}>{phone}</p>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", marginBottom: "32px", lineHeight: "1.6", maxWidth: "280px" }}>ENTER YOUR PIN TO AUTHORIZE ACCESS.</p>
      <button onClick={() => { setPaymentState("idle"); setSubmitting(false); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", padding: "40px 24px", maxWidth: "420px", margin: "0 auto", justifyContent: "space-between", boxSizing: "border-box" }}>
      <style>{`
        .living-tagline { display: none !important; opacity: 0 !important; animation: none !important; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginTop: "auto", marginBottom: "auto" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#E26D34", textTransform: "uppercase", marginBottom: "40px" }}>Oreeti</p>
        <div style={{ fontSize: "24px", color: "#4ade80", marginBottom: "16px" }}>✓</div>
        <h1 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", textAlign: "center", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Pass Secured</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "32px", fontSize: "13px" }}>{event.title}</p>
        <div style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "32px 24px", width: "100%", boxSizing: "border-box", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#E26D34", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "600" }}>Pass Dispatched</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", margin: 0 }}>Your unique secure coordinate link has been locked into your dynamic pass architecture.</p>
        </div>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        <button
          onClick={() => {
            if (confirmedToken) {
              window.location.href = window.location.origin + "/e/" + event.slug + "/g/" + confirmedToken;
            }
          }}
          style={{ width: "100%", padding: "14px", borderRadius: "6px", background: "#fff", color: "#000", border: "none", fontSize: "12px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}
        >
          Enter the Scene →
        </button>
        <button onClick={resetForm} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", padding: "8px" }}>
          ← Return to Registration
        </button>
      </div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", padding: "40px 24px", maxWidth: "420px", margin: "0 auto", justifyContent: "space-between" }}>
      <style>{`
        @keyframes organicFlow {
          0% { opacity: 0; letter-spacing: -0.05em; transform: translateY(12px) scaleY(0.8); filter: blur(4px); }
          60% { opacity: 0.8; letter-spacing: 0.25em; filter: blur(1px); }
          100% { opacity: 1; letter-spacing: 0.2em; transform: translateY(0px) scaleY(1); filter: blur(0px); }
        }
        .living-tagline {
          font-size: 11px;
          color: #E26D34;
          text-transform: uppercase;
          font-weight: 500;
          margin: 0;
          opacity: 0;
          animation: organicFlow 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.4s;
          text-shadow: 0 0 8px rgba(226,109,52,0.2);
        }
      `}</style>

      <div>
        <div style={{ marginBottom: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <OreetiLogo size="sm" />
          <p className="living-tagline">The room activated</p>
          <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "24px", marginBottom: "6px" }}>
            Register
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>Event: {event.title}</p>
        </div>

        {/* HIGH-END MINIMALISTIC TICKET TIER SELECTOR */}
        {ticketTypes.length > 0 && (
          <div style={{ marginBottom: "8px", position: "relative", width: "100%" }}>
            <select
              value={selectedTicket?.id || ""}
              onChange={(e) => {
                const selected = ticketTypes.find(t => t.id === e.target.value);
                setSelectedTicket(selected);
              }}
              style={{
                width: "100%",
                padding: "14px 0",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                borderRadius: 0,
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none"
              }}
            >
              {ticketTypes.map((t) => (
                <option key={t.id} value={t.id} style={{ background: "#000", color: "#fff" }}>
                  {t.name} — {Number(t.price) <= 0 ? "Complimentary" : `${t.price} KES`}
                </option>
              ))}
            </select>
            <div style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: "11px", pointerEvents: "none", letterSpacing: "0.05em" }}>
              [SELECT TIER]
            </div>
          </div>
        )}

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" type="text" style={inp} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" type="email" style={inp} />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="M-Pesa Number" type="tel" style={inp} />
      </div>

      <div style={{ width: "100%", marginBottom: "24px" }}>
        {error && <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "16px", textAlign: "center" }}>{error}</p>}

        <label style={{ display: "flex", alignItems: "center", gap: "12px", color: "rgba(255,255,255,0.7)", fontSize: "12px", marginBottom: "20px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={e => setAcceptedTerms(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#E26D34" }}
          />
          <span>I accept the <a href="/terms" target="_blank" style={{ color: "#E26D34", textDecoration: "none" }}>Terms and Conditions</a></span>
        </label>

        <button
          onClick={handleRegister}
          disabled={submitting || !acceptedTerms}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "6px",
            background: (!acceptedTerms || submitting) ? "rgba(255,255,255,0.15)" : "#fff",
            color: (!acceptedTerms || submitting) ? "rgba(255,255,255,0.3)" : "#000",
            border: "none",
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: (!acceptedTerms || submitting) ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Processing..." : "Register Now →"}
        </button>
      </div>
    </main>
  );
}
