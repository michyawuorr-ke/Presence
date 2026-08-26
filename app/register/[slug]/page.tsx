"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Wordmark from "@/components/Wordmark";
import RegistrationForm from "@/components/register/RegistrationForm";
import PaymentWaiting from "@/components/register/PaymentWaiting";
import RegistrationSuccess from "@/components/register/RegistrationSuccess";

function friendlyError(err: unknown, fallback: string): string {
  const msg = (err as any)?.message || "";
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return "Couldn't connect.";
  return msg || fallback;
}

export default function RegisterPage() {
  const [event, setEvent] = useState<any>(null);
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [quantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [currentRegId, setCurrentRegId] = useState("");
  const [paymentState, setPaymentState] = useState<"idle"|"waiting">("idle");
  const [stkFailed, setStkFailed] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState("");
  const [confirmedRegId, setConfirmedRegId] = useState<string|null>(null);
  const [isFreeRegistration, setIsFreeRegistration] = useState(false);
  const [selfSelectRoles, setSelfSelectRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("attendee");
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
      const { data: policy } = await supabase.from("event_policies").select("self_select_roles").eq("event_id", ev.id).maybeSingle();
      const roles = Array.isArray(policy?.self_select_roles) ? policy.self_select_roles : [];
      setSelfSelectRoles(roles);
      if (roles.length && !roles.includes("attendee")) setSelectedRole(roles[0]);
      const { data: hp } = await supabase.from("host_profiles").select("display_name,role_title,organisation,bio,avatar_url,website_url,linkedin_url,twitter_url,show_in_events").eq("host_id", ev.host_id).eq("show_in_events", true).maybeSingle();
      if (hp) setHostProfile(hp);
      setLoading(false);
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (paymentState !== "waiting" || !currentRegId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("registrations").select("status, paid").eq("id", currentRegId).single();
      if (data?.status === "confirmed" && data?.paid) {
        clearInterval(interval);
        setSuccess(true);
        setSubmitting(false);
        isSubmittingRef.current = false;
      }
      if (data?.status === "underpaid") {
        clearInterval(interval);
        setError("Amount paid was less than required. Contact the organizer.");
        setPaymentState("idle");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentState, currentRegId]);

  async function handleRegister() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (!name || !email) { setError("Please fill in your name and email"); isSubmittingRef.current = false; return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, event_id: event?.id, ticket_type_id: selectedTicket?.id || null, role: selectedRole || "attendee", quantity }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
      setConfirmedToken(json.access_token);
      setConfirmedRegId(json.registration_id);
      if (json.is_free) {
        setIsFreeRegistration(true);
        setSuccess(true); setSubmitting(false); isSubmittingRef.current = false; return;
      }
      setCurrentRegId(json.registration_id);
      setPaymentState("waiting");
      if (phone) {
        try {
          const stkRes = await fetch("/api/payments/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, amount: json.total_amount, registration_id: json.registration_id }),
          });
          const stkJson = await stkRes.json();
          if (!stkRes.ok || !stkJson.success) setStkFailed(true);
        } catch { setStkFailed(true); }
      } else { setStkFailed(true); }
    } catch (err) {
      setError(friendlyError(err, "Registration failed. Please try again."));
      setSubmitting(false); isSubmittingRef.current = false;
    }
  }

  async function sendAccessEmail() {
    if (!confirmedRegId || !event?.id) return;
    const res = await fetch("/api/email/access-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_id: confirmedRegId, event_id: event.id }),
    });
    const json = await res.json();
    if (!json.sent && json.error !== "already_sent") throw new Error("send failed");
  }

  function resetForm() {
    setSuccess(false); setPaymentState("idle"); setSubmitting(false);
    isSubmittingRef.current = false; setError(""); setConfirmedToken("");
    setStkFailed(false); setCurrentRegId(""); setName(""); setEmail(""); setPhone("");
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"22px"}}>
      <Wordmark size={26} />
      <div style={{display:"flex",gap:"7px"}}>
        <span className="oreeti-loading-dot" style={{animationDelay:"0s"}} />
        <span className="oreeti-loading-dot" style={{animationDelay:"0.15s"}} />
        <span className="oreeti-loading-dot" style={{animationDelay:"0.3s"}} />
      </div>
    </div>
  );

  if (!event) return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px"}}>Event not found.</p>
    </div>
  );

  if (success) return (
    <RegistrationSuccess
      event={event}
      selectedTicket={selectedTicket}
      isFreeRegistration={isFreeRegistration}
      confirmedToken={confirmedToken}
      onSendEmail={sendAccessEmail}
    />
  );

  if (paymentState === "waiting") return (
    <PaymentWaiting
      phone={phone}
      amount={Number(selectedTicket?.price ?? 0) * quantity}
      stkFailed={stkFailed}
      error={error}
      onReset={resetForm}
    />
  );

  return (
    <RegistrationForm
      event={event}
      hostProfile={hostProfile}
      ticketTypes={ticketTypes}
      selectedTicket={selectedTicket}
      onTicketChange={setSelectedTicket}
      name={name} onName={setName}
      email={email} onEmail={setEmail}
      phone={phone} onPhone={setPhone}
      selfSelectRoles={selfSelectRoles}
      selectedRole={selectedRole} onRole={setSelectedRole}
      submitting={submitting}
      error={error}
      onSubmit={handleRegister}
    />
  );
}
