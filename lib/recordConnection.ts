import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ConnectionStatus = "requested" | "connected" | "declined";
type ConnectionSource = "qr_unlock" | "request" | "card";

// Status only ever moves forward — a 'connected' row is never downgraded
// back to 'requested' or 'declined' by a later, lesser write (e.g. a stale
// duplicate request arriving after two people already connected via QR).
const STATUS_RANK: Record<ConnectionStatus, number> = { declined: 0, requested: 1, connected: 2 };

/**
 * The single place that writes to `connections` (Stage B of the
 * connections merge — see docs/architecture/01-person-model.md). Both
 * `handshakes` and `handshake_requests` still remain the source of truth
 * for reads until Stage D; this only shadow-writes alongside them so the
 * new table can be verified against real data before anything depends on
 * it. Operates on master_profiles ids directly — callers resolve
 * guest_profiles -> master_profile_id (or use a Supabase Auth session,
 * for the card-connection path) before calling this.
 *
 * Best-effort: a failure here does not undo or block the caller's write
 * to the old table, which stays authoritative during this stage. Callers
 * should log a failure, not surface it to the guest as an error.
 */
export async function recordConnection(params: {
  profileAId: string;
  profileBId: string;
  eventId?: string | null;
  status: ConnectionStatus;
  source: ConnectionSource;
  requestedBy?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { profileAId, profileBId, eventId = null, status, source, requestedBy = null } = params;

  if (!profileAId || !profileBId || profileAId === profileBId) {
    return { ok: false, error: "Invalid or self-referential profile ids" };
  }

  // Canonical ordering — the table's check constraint requires a < b, so
  // whichever order the caller passed the two ids in, normalize here
  // rather than pushing that requirement onto every call site.
  const [a, b] = [profileAId, profileBId].sort();

  let query = supabase
    .from("connections")
    .select("id,status")
    .eq("profile_a_id", a)
    .eq("profile_b_id", b);
  // NULL requires .is(), not .eq() — PostgREST treats them differently,
  // and this mirrors the two partial unique indexes on the table itself
  // (one for event_id is not null, one for event_id is null).
  query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);
  const { data: existing, error: selectErr } = await query.maybeSingle();

  if (selectErr) return { ok: false, error: selectErr.message };

  if (!existing) {
    const { error: insertErr } = await supabase.from("connections").insert({
      profile_a_id: a,
      profile_b_id: b,
      event_id: eventId,
      status,
      source,
      requested_by: requestedBy,
      responded_at: status === "connected" || status === "declined" ? new Date().toISOString() : null,
    });
    if (insertErr) return { ok: false, error: insertErr.message };
    return { ok: true };
  }

  // Row already exists for this pair (+event) — only move status forward,
  // never overwrite a 'connected' row with a later 'requested' write.
  if (STATUS_RANK[status] > STATUS_RANK[existing.status as ConnectionStatus]) {
    const { error: updateErr } = await supabase
      .from("connections")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (updateErr) return { ok: false, error: updateErr.message };
  }
  return { ok: true };
}
