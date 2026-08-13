"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import PoliciesSection from "./PoliciesSection";

interface SetupTabProps {
  eventId: string;
  event: any;
  ticketTypes: any[];
  stations: any[];
  onPublish: () => void;
  onEndEvent: () => void;
  ending: boolean;
  onTicketAdded: (t: any) => void;
  onStationAdded: (s: any) => void;
  onStationDeleted: (id: string) => void;
  onTicketDeleted: (id: string) => void;
  timeToLive?: string;
}

const GOLD = "#D4AF37";

export default function SetupTab({ eventId, event, ticketTypes, stations, onPublish, onEndEvent, ending, onTicketAdded, onStationAdded, onStationDeleted, onTicketDeleted, timeToLive }: SetupTabProps) {
  const [ticketName, setTicketName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketQty, setTicketQty] = useState("");
  const [savingTicket, setSavingTicket] = useState(false);

  const [stationName, setStationName] = useState("");
  const [stationSubtitle, setStationSubtitle] = useState("");
  const [savingStation, setSavingStation] = useState(false);

  const [paybill, setPaybill] = useState(event?.paybill_number || "");
  const [account, setAccount] = useState(event?.paybill_account || "");
  const [savingPaybill, setSavingPaybill] = useState(false);
  const [paybillSaved, setPaybillSaved] = useState(false);

  async function addTicket() {
    if (!ticketName) return;
    setSavingTicket(true);
    const { data } = await supabase.from("ticket_types").insert({ event_id: eventId, name: ticketName, price: parseFloat(ticketPrice) || 0, quantity: ticketQty ? parseInt(ticketQty) : null, is_active: true }).select().single();
    if (data) { onTicketAdded(data); setTicketName(""); setTicketPrice(""); setTicketQty(""); }
    setSavingTicket(false);
  }

  async function deleteTicket(id: string) {
    if (!confirm("Delete this ticket type?")) return;
    await supabase.from("ticket_types").delete().eq("id", id);
    onTicketDeleted(id);
  }

  async function addStation() {
    if (!stationName) return;
    setSavingStation(true);
    const { data } = await supabase.from("event_stations").insert({ event_id: eventId, name: stationName, subtitle: stationSubtitle }).select().single();
    if (data) { onStationAdded(data); setStationName(""); setStationSubtitle(""); }
    setSavingStation(false);
  }

  async function savePaybill() {
    setSavingPaybill(true);
    await supabase.from("events").update({ paybill_number: paybill.trim(), paybill_account: account.trim() }).eq("id", eventId);
    setPaybillSaved(true);
    setTimeout(() => setPaybillSaved(false), 2500);
    setSavingPaybill(false);
  }

  const inp = { width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" as const, marginBottom: "8px" };
  const sectionLabel = { fontSize: "10px", fontWeight: "700" as const, letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "12px" };

  return (
    <div style={{ paddingBottom: "48px" }}>

      {/* ── Tickets ── */}
      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ ...sectionLabel, color: GOLD, margin: 0 }}>Ticket Types</p>
          {ticketTypes.length === 0 && <span style={{ fontSize: "11px", color: "#444" }}>None yet</span>}
        </div>

        {ticketTypes.map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px", marginBottom: "6px" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede8", margin: "0 0 2px" }}>{t.name}</p>
              <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>
                {t.price > 0 ? `KES ${Number(t.price).toLocaleString()}` : "Free"}{t.quantity ? ` · ${t.quantity} slots` : ""}
              </p>
            </div>
            <button onClick={() => deleteTicket(t.id)} style={{ background: "transparent", border: "none", color: "#444", fontSize: "16px", cursor: "pointer", padding: "4px 8px" }}>×</button>
          </div>
        ))}

        <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px", marginTop: "8px" }}>
          <input value={ticketName} onChange={e => setTicketName(e.target.value)} placeholder="Ticket name (e.g. General Admission)" style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <input value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} placeholder="Price (KES)" type="number" min="0" style={{ ...inp, marginBottom: 0 }} />
            <input value={ticketQty} onChange={e => setTicketQty(e.target.value)} placeholder="Qty (optional)" type="number" min="1" style={{ ...inp, marginBottom: 0 }} />
          </div>
          <button onClick={addTicket} disabled={!ticketName || savingTicket}
            style={{ width: "100%", marginTop: "10px", padding: "10px", borderRadius: "8px", background: "transparent", border: `1px solid rgba(212,175,55,${ticketName ? "0.4" : "0.1"})`, color: ticketName ? GOLD : "#444", fontSize: "12px", fontWeight: "600", cursor: ticketName ? "pointer" : "not-allowed" }}>
            {savingTicket ? "Adding..." : "+ Add Ticket Type"}
          </button>
        </div>
      </section>

      {/* ── Networking Stations ── */}
      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ ...sectionLabel, color: GOLD, margin: 0 }}>Networking Stations</p>
          {stations.length === 0 && <span style={{ fontSize: "11px", color: "#444" }}>None yet</span>}
        </div>
        <p style={{ fontSize: "12px", color: "#555", marginBottom: "12px" }}>Stations are spots guests choose as their networking base during the event.</p>

        {stations.map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px", marginBottom: "6px" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede8", margin: "0 0 2px" }}>{s.name}</p>
              {s.subtitle && <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>{s.subtitle}</p>}
            </div>
            <button onClick={() => onStationDeleted(s.id)} style={{ background: "transparent", border: "none", color: "#444", fontSize: "16px", cursor: "pointer", padding: "4px 8px" }}>×</button>
          </div>
        ))}

        <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px", marginTop: "8px" }}>
          <input value={stationName} onChange={e => setStationName(e.target.value)} placeholder="Station name (e.g. Main Hall)" style={inp} />
          <input value={stationSubtitle} onChange={e => setStationSubtitle(e.target.value)} placeholder="Description (optional)" style={{ ...inp, marginBottom: 0 }} />
          <button onClick={addStation} disabled={!stationName || savingStation}
            style={{ width: "100%", marginTop: "10px", padding: "10px", borderRadius: "8px", background: "transparent", border: `1px solid rgba(212,175,55,${stationName ? "0.4" : "0.1"})`, color: stationName ? GOLD : "#444", fontSize: "12px", fontWeight: "600", cursor: stationName ? "pointer" : "not-allowed" }}>
            {savingStation ? "Adding..." : "+ Add Station"}
          </button>
        </div>
      </section>

      {/* ── Payment ── */}
      <section>
        <p style={{ ...sectionLabel, color: "#22c55e", marginBottom: "4px" }}>M-Pesa Payment Details</p>
        <p style={{ fontSize: "12px", color: "#555", marginBottom: "12px" }}>Guests pay directly to your paybill. Oreeti records their receipt code and you confirm from the Attendees tab.</p>
        <input value={paybill} onChange={e => setPaybill(e.target.value)} placeholder="Paybill / Till Number" style={inp} />
        <input value={account} onChange={e => setAccount(e.target.value)} placeholder="Account Number (if paybill)" style={inp} />
        <button onClick={savePaybill} disabled={savingPaybill}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
          {savingPaybill ? "Saving..." : paybillSaved ? "✓ Saved" : "Save Payment Details"}
        </button>
      </section>
      {/* ── Publish / End ── */}
      <section style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "24px" }}>
        {event?.status === "draft" && (
          <button onClick={onPublish}
            style={{ width: "100%", padding: "14px", borderRadius: "12px", background: GOLD, color: "#000", border: "none", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.06em", marginBottom: "10px" }}>
            PUBLISH EVENT
          </button>
        )}
        {event?.status === "scheduled" && (
          // No manual "go live" action anymore — live is automatic once
          // start_time arrives (see the auto_go_live cron job). This just
          // shows the host what's coming, same as OverviewTab's countdown.
          <div style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", textAlign: "center", marginBottom: "10px" }}>
            <p style={{ fontSize: "11px", color: "rgba(212,175,55,0.7)", letterSpacing: "0.06em", margin: "0 0 4px" }}>PUBLISHED</p>
            <p style={{ fontSize: "13px", color: GOLD, fontWeight: "600", margin: 0 }}>
              {timeToLive ? `Going live in ${timeToLive}` : "Going live at start time"}
            </p>
          </div>
        )}
        {event?.status === "live" && (
          <button onClick={onEndEvent} disabled={ending}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "transparent", color: "#555", border: "1px solid rgba(255,255,255,0.07)", fontSize: "12px", cursor: "pointer" }}>
            {ending ? "Ending..." : "End Event"}
          </button>
        )}
        {event?.status === "ended" && (
          <p style={{ fontSize: "12px", color: "#444", textAlign: "center", padding: "8px 0" }}>This event has ended.</p>
        )}
      </section>

      {/* ── Policies ── */}
      <section style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "28px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: "16px" }}>Networking & Role Policies</p>
        <PoliciesSection eventId={eventId} />
      </section>

    </div>
  );
}
