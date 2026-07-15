"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

interface AttendeesTabProps {
  eventId: string;
  isLive: boolean;
}

const GOLD = "#D4AF37";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#22c55e",
  pending: GOLD,
  cancelled: "#666",
};

export default function AttendeesTab({ eventId, isLive }: AttendeesTabProps) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "checked_in">("all");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [notification, setNotification] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("registrations")
      .select("*, ticket_types(name, price)")
      .eq("event_id", eventId)
      .neq("status", "host")
      .order("created_at", { ascending: false });
    setRegistrations(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  // Realtime updates
  useEffect(() => {
    const ch = supabase.channel("attendees:" + eventId)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations", filter: `event_id=eq.${eventId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId, load]);

  async function confirmPayment(regId: string, name: string) {
    setConfirming(regId);
    const { error } = await supabase
      .from("registrations")
      .update({ status: "confirmed", paid: true })
      .eq("id", regId);
    if (!error) {
      setNotification(`✓ ${name}'s payment confirmed`);
      setTimeout(() => setNotification(""), 3000);
      load();
    }
    setConfirming(null);
  }

  async function toggleCheckIn(regId: string, current: boolean, name: string) {
    const { error } = await supabase
      .from("registrations")
      .update({ checked_in: !current, checked_in_at: !current ? new Date().toISOString() : null })
      .eq("id", regId);
    if (!error) {
      setNotification(`${!current ? "✓ Checked in" : "↩ Checked out"}: ${name}`);
      setTimeout(() => setNotification(""), 2500);
      load();
    }
  }

  const filtered = registrations.filter(r => {
    const matchSearch = !search || r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.guest_email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "pending" ? r.status === "pending" :
      filter === "confirmed" ? r.status === "confirmed" :
      filter === "checked_in" ? r.checked_in === true : true;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: registrations.length,
    pending: registrations.filter(r => r.status === "pending").length,
    confirmed: registrations.filter(r => r.status === "confirmed").length,
    checked_in: registrations.filter(r => r.checked_in).length,
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}><p style={{ color: "#555", fontSize: "13px" }}>Loading attendees...</p></div>;

  return (
    <div style={{ paddingBottom: "48px" }}>
      {notification && (
        <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
          <p style={{ color: GOLD, fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p>
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fff", fontSize: "13px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
      />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["all", "pending", "confirmed", "checked_in"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "5px 12px", borderRadius: "20px", border: "1px solid", fontSize: "11px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize",
              background: filter === f ? "rgba(212,175,55,0.1)" : "transparent",
              borderColor: filter === f ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)",
              color: filter === f ? GOLD : "#666",
            }}>
            {f.replace("_", " ")} {counts[f] > 0 && <span style={{ opacity: 0.7 }}>({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p style={{ color: "#444", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>
          {search ? "No attendees match your search" : "No attendees yet"}
        </p>
      ) : filtered.map(r => (
        <div key={r.id} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "14px", padding: "14px", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#f0ede8", margin: 0 }}>{r.guest_name}</p>
                {r.checked_in && <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.1em" }}>IN</span>}
              </div>
              <p style={{ fontSize: "12px", color: "#555", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.guest_email}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em", color: STATUS_COLORS[r.status] || "#666", background: `${STATUS_COLORS[r.status]}18`, border: `1px solid ${STATUS_COLORS[r.status]}30`, borderRadius: "4px", padding: "2px 7px", textTransform: "uppercase" }}>
                  {r.status}
                </span>
                {r.ticket_types?.name && <span style={{ fontSize: "11px", color: "#555" }}>{r.ticket_types.name}</span>}
                {r.amount > 0 && <span style={{ fontSize: "11px", color: GOLD }}>KES {r.amount.toLocaleString()}</span>}
                {r.mpesa_receipt && <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{r.mpesa_receipt}</span>}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
              {r.status === "pending" && r.mpesa_receipt && (
                <button onClick={() => confirmPayment(r.id, r.guest_name)} disabled={confirming === r.id}
                  style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: GOLD, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                  {confirming === r.id ? "..." : "Confirm ✓"}
                </button>
              )}
              {isLive && r.status === "confirmed" && (
                <button onClick={() => toggleCheckIn(r.id, r.checked_in, r.guest_name)}
                  style={{ padding: "6px 12px", borderRadius: "8px", background: r.checked_in ? "rgba(255,255,255,0.04)" : "rgba(34,197,94,0.08)", border: r.checked_in ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(34,197,94,0.25)", color: r.checked_in ? "#555" : "#22c55e", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                  {r.checked_in ? "Undo" : "Check In"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
