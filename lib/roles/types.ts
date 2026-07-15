// ─────────────────────────────────────────────────────────────
// Role types — derived from the database, never hardcoded.
// Adding a new role (Sponsor, Media, etc.) requires only a DB
// insert into `roles` + `role_permission_defaults`. No changes
// needed here or anywhere else in the codebase.
// ─────────────────────────────────────────────────────────────

export interface Role {
  id: string;         // e.g. 'attendee', 'speaker', 'vip'
  label: string;      // e.g. 'VIP', 'Speaker'
  badge: string;      // e.g. '⭐', '🎤'
  description: string | null;
  sort_order: number;
  is_system: boolean;
}

export interface RolePermissions {
  role_id: string;
  label: string;
  badge: string;
  discoverable: boolean;      // Others can find this role in discovery
  can_discover: boolean;      // This role can find others
  can_initiate: boolean;      // Can send handshake requests
  receives_requests: boolean; // Can receive handshake requests
  bypass_visibility: boolean; // Ignores event default_visibility setting
}

export interface EventPolicy {
  id: string;
  event_id: string;
  networking_enabled: boolean;
  default_visibility: "visible" | "hidden" | "anonymous";
  mutual_discovery: boolean;
  self_select_roles: string[]; // role ids available on registration form
}

export interface ResolvedPermissions {
  [role_id: string]: RolePermissions;
}
