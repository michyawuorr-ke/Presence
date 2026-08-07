# Person Model — Identity Fragmentation

## The Four-Table Problem

One real person can exist as up to four different rows depending on context:

| Table | Purpose | Keyed By |
|-------|---------|----------|
| `master_profiles` | Cross-event identity, auth anchor | `auth_user_id` (= `auth.uid()`) |
| `registrations` | Ticket + credential + access token | `access_token` (guest URL) |
| `guest_profiles` | Per-event networking card + visibility | `registration_id` |
| `hosts` + `host_profiles` | Separate host identity system | `hosts.id` ≠ `auth.uid()` |

## Known Gotchas

- `hosts.id` is NOT the same as `auth.uid()` — go-live joins them via email
- A host entering their own event requires synthesizing a fake `registrations` +
  `guest_profiles` row so they can use the guest-facing UI (see `go-live/route.ts`)
- `loadMyConnections` must reconcile across all three tables by email to
  deduplicate one person who appeared at multiple events
- Profile edit has three different save paths depending on which identity
  bucket the user is currently in
- Any route doing `getUser()` auth must decide which ID to verify against —
  `auth.uid()`, `master_profiles.auth_user_id`, or `hosts.id` — none are the same

## Canonical Mapping ## Why It Happened

Built event-first. `registrations` was the first table — a ticket record.
`guest_profiles` bolted on for networking identity. `master_profiles` added
later for cross-event persistence. `hosts/host_profiles` predates all of them
as a separate product surface. Each addition solved an immediate problem without
refactoring the previous layer.

## Migration Plan (Parked)

The clean architecture is one `people` table with `registrations` as a pure
ticket record (FK to `people`), `guest_profiles` as a per-event overlay (FK to
`people`), and hosts as people with a `host` role — no separate table.

**Trigger to execute:** first major scale event that causes a live incident from
this complexity, or first second contributor who can't reason about the model
without a 30-minute explanation.

**Cost:** full schema migration, data backfills, FK changes, RLS rewrites, every
query touching these four tables. Requires dark window or dual-write transition.
