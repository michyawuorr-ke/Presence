import { supabase } from "@/lib/supabase/client";
import type { Role, RolePermissions, EventPolicy, ResolvedPermissions } from "./types";

export type { Role, RolePermissions, EventPolicy, ResolvedPermissions };

// ── Role registry ────────────────────────────────────────────

export async function getAllRoles(): Promise<Role[]> {
  const { data } = await supabase
    .from("roles")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

// ── Resolved permissions for an event ────────────────────────
// Merges role defaults with any per-event overrides.
// This is the single function every part of the app should call
// to understand what a role can do — never branch on role name.

export async function getEventPermissions(eventId: string): Promise<ResolvedPermissions> {
  const { data } = await supabase
    .from("resolved_role_permissions")
    .select("*")
    .eq("event_id", eventId);

  const map: ResolvedPermissions = {};
  for (const row of data ?? []) {
    map[row.role_id] = row as RolePermissions;
  }
  return map;
}

// ── Event policy ─────────────────────────────────────────────

export async function getEventPolicy(eventId: string): Promise<EventPolicy | null> {
  const { data } = await supabase
    .from("event_policies")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertEventPolicy(
  eventId: string,
  patch: Partial<Omit<EventPolicy, "id" | "event_id">>
): Promise<EventPolicy | null> {
  const { data } = await supabase
    .from("event_policies")
    .upsert({ event_id: eventId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "event_id" })
    .select()
    .single();
  return data ?? null;
}

// ── Per-event role override ───────────────────────────────────

export async function upsertRoleOverride(
  eventId: string,
  roleId: string,
  permissions: Partial<Omit<RolePermissions, "role_id" | "label" | "badge">>
) {
  return supabase
    .from("event_role_policies")
    .upsert(
      { event_id: eventId, role_id: roleId, ...permissions, updated_at: new Date().toISOString() },
      { onConflict: "event_id,role_id" }
    );
}

// ── Permission checks ─────────────────────────────────────────
// Use these everywhere instead of `if (role === "vip")`.
// Works for any role — present or future.

export function canBeDiscovered(perms: ResolvedPermissions, roleId: string): boolean {
  return perms[roleId]?.discoverable ?? true;
}

export function canDiscover(perms: ResolvedPermissions, roleId: string): boolean {
  return perms[roleId]?.can_discover ?? true;
}

export function canInitiate(perms: ResolvedPermissions, roleId: string): boolean {
  return perms[roleId]?.can_initiate ?? true;
}

export function receivesRequests(perms: ResolvedPermissions, roleId: string): boolean {
  return perms[roleId]?.receives_requests ?? true;
}

export function bypassesVisibility(perms: ResolvedPermissions, roleId: string): boolean {
  return perms[roleId]?.bypass_visibility ?? false;
}

export function getBadge(perms: ResolvedPermissions, roleId: string): string {
  return perms[roleId]?.badge ?? "👤";
}

export function getLabel(perms: ResolvedPermissions, roleId: string): string {
  return perms[roleId]?.label ?? roleId;
}
