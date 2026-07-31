"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getAllRoles } from "@/lib/roles";
import type { Role } from "@/lib/roles";

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

const PAGE_SIZE = 50;

export default function AttendeesTab({ eventId, isLive }: AttendeesTabProps) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "checked_in">("all");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [notification, setNotification] = useState("");
  // Counts are fetched separately from the paginated list — computing them
  // from `registrations` (as before) would only reflect whatever page is
  // currently loaded once pagination is in place, giving a host a wrong
  // total the moment there's more than one page.
  const [counts, setCounts] = useState({ all: 0, pending: 0, confirmed: 0, checked_in: 0 });
  // Introduction: host selects two attendees to connect
  const [introMode, setIntroMode] = useState(false);
  const [introSelected, setIntroSelected] = useState<any[]>([]);
  const [introducing, setIntroducing] = useState(false);

  function toast(msg: string, ms = 2500) {
    setNotification(msg);
    setTimeout(() => setNotification(""), ms);
  }

  // Debounce search input so we're not firing a query on every keystroke —
  // 350ms is enough to let a host finish typing a few characters first.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  function enrich(regs: any[]) {
    // Prefer the name the guest confirmed in onboarding (guest_profiles.display_name)
    // over what was typed at registration (guest_name) — these can differ if the
    // guest corrected their name during onboarding.
    return regs.map((r: any) => ({
      ...r,
      display_name: r.guest_profiles?.display_name || r.guest_name,
      guest_profile_id: r.guest_profiles?.id ?? null,
    }));
  }

  function buildQuery() {
    let q = supabase
      .from("registrations")
      .select("*, ticket_types(name, price), guest_profiles(id, display_name, role)")
      .eq("event_id", eventId)
      .neq("status", "host");
    if (debouncedSearch) {
      // Search server-side across both name and email so results aren't
      // limited to whatever page happens to be loaded.
      q = q.or(`guest_name.ilike.%${debouncedSearch}%,guest_email.ilike.%${debouncedSearch}%`);
    }
    if (filter === "pending")    q = q.eq("status", "pending");
    if (filter === "confirmed")  q = q.eq("status", "confirmed");
    if (filter === "checked_in") q = q.eq("checked_in", true);
    return q.order("created_at", { ascending: false });
  }

  // Loads page 1 fresh — used on mount, on filter/search change, and on
  // realtime updates. Realtime changes reset back to page 1 rather than
  // trying to merge a change into an arbitrary already-loaded page, which
  // keeps the pagination logic simple and correct; check-in-desk updates
  // are infrequent enough that this isn't a real cost.
  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: regs }, allRoles, countsResult] = await Promise.all([
      buildQuery().range(0, PAGE_SIZE - 1),
      getAllRoles(),
      Promise.all([
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).neq("status", "host"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).neq("status", "host").eq("status", "pending"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).neq("status", "host").eq("status", "confirmed"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).neq("status", "host").eq("checked_in", true),
      ]),
    ]);
    const enriched = enrich(regs || []);
    setRegistrations(enriched);
    setHasMore((regs?.length || 0) === PAGE_SIZE);
    setCounts({
      all:        countsResult[0].count ?? 0,
      pending:    countsResult[1].count ?? 0,
      confirmed:  countsResult[2].count ?? 0,
      checked_in: countsResult[3].count ?? 0,
    });
    // Exclude organizer from the assignment dropdown — that's set by host status
    setRoles(allRoles.filter(r => r.id !== "organizer"));
    setLoading(false);
  }, [eventId, debouncedSearch, filter]);

  async function loadMore() {
    setLoadingMore(true);
    const from = registrations.length;
    const { data: regs } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    const enriched = enrich(regs || []);
    setRegistrations(prev => [...prev, ...enriched]);
    setHasMore((regs?.length || 0) === PAGE_SIZE);
    setLoadingMore(false);
  }

  useEffect(() => { load(); }, [load]);

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
    if (!error) { toast(`✓ ${name}'s payment confirmed`); load(); }
    setConfirming(null);
  }

  async function toggleCheckIn(regId: string, current: boolean, name: string) {
    await supabase
      .from("registrations")
      .update({ checked_in: !current, checked_in_at: !current ? new Date().toISOString() : null })
      .eq("id", regId);
    toast(`${!current ? "✓ Checked in" : "↩ Checked out"}: ${name}`);
    load();
  }

  async function updateRole(regId: string, guestProfileId: string | null, newRole: string, name: string) {
    setUpdatingRole(regId);
    // Update both registrations and guest_profiles so networking
    // reads the role without a join every time
    await supabase.from("registrations").update({ role: newRole }).eq("id", regId);
    if (guestProfileId) {
      await supabase.from("guest_profiles").update({ role: newRole }).eq("id", guestProfileId);
    } else {
      // Fallback: update by registration_id in case guest_profile_id wasn't resolved
      await supabase.from("guest_profiles").update({ role: newRole }).eq("registration_id", regId);
    }
    toast(`${name} is now ${roles.find(r => r.id === newRole)?.label ?? newRole}`);
    setUpdatingRole(null);
    load();
  }

  // registrations is already the server-filtered, paginated result —
  // no client-side filtering needed anymore.
  const filtered = registrations;

  async function introduceAttendees() {
    if (introSelected.length !== 2) return;
    setIntroducing(true);
    const [a, b] = introSelected;

    const { data: profiles } = await supabase
      .from("guest_profiles")
      .select("id, registration_id")
      .in("registration_id", [a.id, b.id]);

    const pA = (profiles ?? []).find((p: any) => p.registration_id === a.id);
    const pB = (profiles ?? []).find((p: any) => p.registration_id === b.id);

    if (!pA || !pB) {
      const missing = !pA ? a.display_name : b.display_name;
      toast(`${missing} hasn't completed onboarding yet — they need to enter the event first`);
      setIntroducing(false);
      return;
    }

    const { error } = await supabase.from("host_introductions").insert({
      event_id:   eventId,
      guest_a_id: pA.id,
      guest_b_id: pB.id,
      note:       `${a.display_name} · ${b.display_name}`,
    });

    setIntroducing(false);
    if (error) { toast(`Introduction failed: ${error.message}`); return; }
    toast(`✓ ${a.display_name} and ${b.display_name} will each get an introduction notification`);
    setIntroMode(false);
    setIntroSelected([]);
  }

  function toggleIntroSelect(reg: any) {
    setIntroSelected(prev => {
      if (prev.find((r: any) => r.id === reg.id)) return prev.filter((r: any) => r.id !== reg.id);
      if (prev.length >= 2) return [prev[1], reg];
      return [...prev, reg];
    });
  }

  if (loading) return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <p style={{ color: "#555", fontSize: "13px" }}>Loading attendees...</p>
    </div>
  );

  return (
    <div style={{ paddingBottom: "48px" }}>
      {notification && (
        <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
          <p style={{ color: GOLD, fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p>
        </div>
      )}

      {/* Introduction mode */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", color: GOLD, textTransform: "uppercase", margin: 0 }}>
          {introMode ? `Select 2 attendees to connect (${introSelected.length}/2)` : "Attendees"}
        </p>
        <button onClick={() => { setIntroMode(!introMode); setIntroSelected([]); }}
          style={{ padding: "5px 12px", borderRadius: "8px", background: introMode ? "rgba(212,175,55,0.1)" : "transparent", border: "1px solid rgba(212,175,55,0.25)", color: GOLD, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
          {introMode ? "Cancel" : "Introduce Two"}
        </button>
      </div>

      {introMode && introSelected.length === 2 && (
        <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
          <p style={{ fontSize: "12px", color: GOLD, margin: "0 0 10px", fontWeight: "500" }}>
            Connect <strong>{introSelected[0].guest_name}</strong> with <strong>{introSelected[1].guest_name}</strong>
          </p>
          <button onClick={introduceAttendees} disabled={introducing}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", background: GOLD, border: "none", color: "#000", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
            {introducing ? "Connecting..." : "Confirm Introduction"}
          </button>
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fff", fontSize: "13px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />

      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["all", "pending", "confirmed", "checked_in"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "5px 12px", borderRadius: "20px", border: "1px solid", fontSize: "11px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize",
              background: filter === f ? "rgba(212,175,55,0.1)" : "transparent",
              borderColor: filter === f ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)",
              color: filter === f ? GOLD : "#666" }}>
            {f.replace("_", " ")} {counts[f] > 0 && `(${counts[f]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#444", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>
          {search ? "No attendees match your search" : "No attendees yet"}
        </p>
      ) : (
        <>
          {filtered.map(r => {
            const roleObj = roles.find(x => x.id === r.role);
            const isIntroSelected = introSelected.some((s: any) => s.id === r.id);
            return (
              <div key={r.id}
                onClick={() => introMode && toggleIntroSelect(r)}
                style={{ background: isIntroSelected ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.01)", border: `1px solid ${isIntroSelected ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.04)"}`, borderRadius: "14px", padding: "14px", marginBottom: "8px", cursor: introMode ? "pointer" : "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + check-in badge + role badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "3px" }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#f0ede8", margin: 0 }}>{r.display_name}</p>
                      {r.checked_in && (
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.08em" }}>IN</span>
                      )}
                      {roleObj && roleObj.id !== "attendee" && (
                        <span style={{ fontSize: "9px", fontWeight: "700", color: GOLD, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.08em" }}>
                          {roleObj.badge} {roleObj.label.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: "12px", color: "#555", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.guest_email}</p>

                    {/* Status + ticket + payment receipt */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                      <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em", color: STATUS_COLORS[r.status] || "#666", background: `${STATUS_COLORS[r.status] || "#666"}18`, border: `1px solid ${STATUS_COLORS[r.status] || "#666"}30`, borderRadius: "4px", padding: "2px 7px", textTransform: "uppercase" }}>
                        {r.status}
                      </span>
                      {r.ticket_types?.name && <span style={{ fontSize: "11px", color: "#555" }}>{r.ticket_types.name}</span>}
                      {r.amount > 0 && <span style={{ fontSize: "11px", color: GOLD }}>KES {Number(r.amount).toLocaleString()}</span>}
                      {r.mpesa_receipt && <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{r.mpesa_receipt}</span>}
                    </div>

                    {/* Role selector — reads from DB, not hardcoded */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "10px", color: "#444", letterSpacing: "0.08em", textTransform: "uppercase" }}>Role</span>
                      <select
                        value={r.role || "attendee"}
                        disabled={updatingRole === r.id}
                        onChange={e => updateRole(r.id, Array.isArray(r.guest_profiles) ? r.guest_profiles[0]?.id ?? null : r.guest_profiles?.id ?? null, e.target.value, r.guest_name)}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ede8", fontSize: "11px", borderRadius: "6px", padding: "4px 8px", outline: "none", cursor: "pointer" }}>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.badge} {role.label}
                          </option>
                        ))}
                      </select>
                      {updatingRole === r.id && <span style={{ fontSize: "10px", color: "#555" }}>saving...</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
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
            );
          })}

          {hasMore && (
            <button onClick={loadMore} disabled={loadingMore}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.6)", fontSize: "13px", fontWeight: "500", cursor: loadingMore ? "default" : "pointer", marginTop: "4px" }}>
              {loadingMore ? "Loading..." : "Load more attendees"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
