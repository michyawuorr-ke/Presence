"use client";
import { useState, useEffect } from "react";
import { getAllRoles, getEventPermissions, getEventPolicy, upsertEventPolicy, upsertRoleOverride } from "@/lib/roles";
import type { Role, ResolvedPermissions, EventPolicy } from "@/lib/roles";

const GOLD = "#D4AF37";

const PERMISSION_LABELS: Record<string, { label: string; hint: string }> = {
  discoverable:      { label: "Discoverable",       hint: "Others can find this role in networking" },
  can_discover:      { label: "Can discover others", hint: "This role can browse and find other attendees" },
  can_initiate:      { label: "Can initiate",        hint: "Can send handshake / connection requests" },
  receives_requests: { label: "Receives requests",   hint: "Can receive inbound connection requests" },
  bypass_visibility: { label: "Bypass visibility",   hint: "Ignores the event's default visibility policy" },
};

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as (keyof typeof PERMISSION_LABELS)[];

interface Props {
  eventId: string;
}

export default function PoliciesSection({ eventId }: Props) {
  const [policy, setPolicy] = useState<EventPolicy | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<ResolvedPermissions>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notification, setNotification] = useState("");

  function toast(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }

  useEffect(() => {
    async function load() {
      const [allRoles, eventPerms, eventPolicy] = await Promise.all([
        getAllRoles(),
        getEventPermissions(eventId),
        getEventPolicy(eventId),
      ]);
      setRoles(allRoles);

      // resolved_role_permissions is a view that merges role_permission_defaults
      // with event_role_policies overrides. If no event_role_policies rows exist
      // yet for this event, the view returns nothing and all permission checks
      // fall back to code defaults (bypass_visibility=false, discoverable=true)
      // — meaning VIP bypass and hidden-visibility settings never fire even when
      // toggled in the UI. Fix: seed a row for every role using its defaults,
      // so the view always has something to return for this event.
      if(Object.keys(eventPerms).length===0 && allRoles.length>0){
        await Promise.all(allRoles.filter(r=>r.id!=="organizer").map(r=>
          upsertRoleOverride(eventId, r.id, {})
        ));
        // Re-fetch after seeding so perms state is populated
        const seeded = await getEventPermissions(eventId);
        setPerms(seeded);
      } else {
        setPerms(eventPerms);
      }

      if (eventPolicy) {
        setPolicy(eventPolicy);
      } else {
        // No policy row yet — create the default now so toggles work immediately
        const created = await upsertEventPolicy(eventId, {
          networking_enabled: true,
          default_visibility: "visible",
          mutual_discovery: false,
          self_select_roles: ["attendee"],
        });
        setPolicy(created ?? {
          id: "", event_id: eventId,
          networking_enabled: true,
          default_visibility: "visible",
          mutual_discovery: false,
          self_select_roles: ["attendee"],
        });
      }
    }
    load();
  }, [eventId]);

  async function savePolicy(patch: Partial<EventPolicy>) {
    setSaving("policy");
    const updated = await upsertEventPolicy(eventId, patch);
    if (updated) setPolicy(updated);
    toast("Policy saved");
    setSaving(null);
  }

  async function saveRolePermission(roleId: string, key: string, value: boolean) {
    setSaving(roleId + key);
    // Optimistic update
    setPerms(prev => ({
      ...prev,
      [roleId]: { ...prev[roleId], [key]: value },
    }));
    await upsertRoleOverride(eventId, roleId, { [key]: value });
    toast(`${roles.find(r => r.id === roleId)?.label} updated`);
    setSaving(null);
  }

  function toggleSelfSelect(roleId: string) {
    if (!policy) return;
    const current = policy.self_select_roles ?? [];
    const next = current.includes(roleId)
      ? current.filter(r => r !== roleId)
      : [...current, roleId];
    savePolicy({ self_select_roles: next });
  }

  if (!policy) return <p style={{ color: "#555", fontSize: "13px", padding: "20px 0" }}>Loading policies...</p>;

  // Show all roles except organizer in the permissions panel
  const configurableRoles = roles.filter(r => r.id !== "organizer");

  return (
    <div>
      {notification && (
        <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
          <p style={{ color: GOLD, fontSize: "12px", margin: 0, textAlign: "center" }}>{notification}</p>
        </div>
      )}

      {/* ── Master switches ── */}
      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", margin: "0 0 14px" }}>Networking</p>

        {/* Networking enabled */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <p style={{ fontSize: "13px", color: "#f0ede8", margin: "0 0 2px", fontWeight: "500" }}>Networking enabled</p>
            <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>Guests can discover and connect with each other</p>
          </div>
          <Toggle
            value={policy.networking_enabled}
            onChange={v => savePolicy({ networking_enabled: v })}
            disabled={saving === "policy"}
          />
        </div>

        {/* Default visibility */}
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "12px", color: "#f0ede8", margin: "0 0 8px", fontWeight: "500" }}>Default visibility</p>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["visible", "hidden", "anonymous"] as const).map(v => (
              <button key={v} onClick={() => savePolicy({ default_visibility: v })}
                style={{ flex: 1, padding: "7px 4px", borderRadius: "8px", border: "1px solid", fontSize: "11px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize",
                  background: policy.default_visibility === v ? "rgba(212,175,55,0.1)" : "transparent",
                  borderColor: policy.default_visibility === v ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.07)",
                  color: policy.default_visibility === v ? GOLD : "#555" }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Mutual discovery */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "13px", color: "#f0ede8", margin: "0 0 2px", fontWeight: "500" }}>Mutual discovery</p>
            <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>Both parties must opt in before seeing each other</p>
          </div>
          <Toggle
            value={policy.mutual_discovery}
            onChange={v => savePolicy({ mutual_discovery: v })}
            disabled={saving === "policy"}
          />
        </div>
      </div>

      {/* ── Self-select roles on registration ── */}
      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", margin: "0 0 4px" }}>Registration</p>
        <p style={{ fontSize: "11px", color: "#555", margin: "0 0 12px" }}>Which roles guests can select themselves when registering. Organizer is always host-assigned.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {configurableRoles.map(role => {
            const isSelected = policy.self_select_roles?.includes(role.id);
            return (
              <div key={role.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{role.badge}</span>
                  <span style={{ fontSize: "13px", color: "#f0ede8" }}>{role.label}</span>
                  {role.description && <span style={{ fontSize: "11px", color: "#555" }}>— {role.description}</span>}
                </div>
                <Toggle value={!!isSelected} onChange={() => toggleSelfSelect(role.id)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Per-role permission overrides ── */}
      {configurableRoles.map(role => {
        const rp = perms[role.id];
        if (!rp) return null;
        return (
          <div key={role.id} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "18px" }}>{role.badge}</span>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8", margin: 0 }}>{role.label}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {PERMISSION_KEYS.map(key => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "12px", color: "#f0ede8", margin: "0 0 1px", fontWeight: "500" }}>{PERMISSION_LABELS[key].label}</p>
                    <p style={{ fontSize: "10px", color: "#555", margin: 0 }}>{PERMISSION_LABELS[key].hint}</p>
                  </div>
                  <Toggle
                    value={rp[key as keyof typeof rp] as boolean}
                    onChange={v => saveRolePermission(role.id, key, v)}
                    disabled={saving === role.id + key}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ value, onChange, disabled = false }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      style={{ flexShrink: 0, width: "40px", height: "24px", borderRadius: "12px", border: "none", cursor: disabled ? "default" : "pointer",
        background: value ? "rgba(212,175,55,0.8)" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", opacity: disabled ? 0.5 : 1 }}>
      <span style={{ position: "absolute", top: "3px", left: value ? "19px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}
