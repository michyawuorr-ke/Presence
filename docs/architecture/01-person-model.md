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

## Stage 1 — Done (2026-08-07)

Added the one missing piece that made everything above harder than it needed
to be: `guest_profiles` had no durable FK back to `master_profiles`, so
cross-event identity was reconstructed at read time by matching
`registrations.guest_email` against `master_profiles.email` — fragile (case
differences, a guest using a different email at a later event silently broke
the merge) and an extra join on every dashboard load.

- `supabase/migrations/20260807_add_guest_profiles_master_profile_id.sql` —
  adds `guest_profiles.master_profile_id`, indexes it, backfills existing rows
  by case-insensitive email match. Additive only — nothing existing changes
  shape. **Not yet applied to the database** — run this migration before or
  alongside deploying the code below, since the code now writes to and reads
  from a column that has to exist first.
- `features/entry/submitGuestOnboarding.ts` — sets `master_profile_id` on
  every new guest_profiles row at onboarding time (the master_profiles row is
  already resolved right before this insert, so no extra lookup needed).
- `app/api/events/go-live/route.ts` and `features/entry/bootstrapIdentity.ts`
  — the two places that synthesize a host's guest_profiles row now also
  find-or-create a master_profiles row by the host's email and link it, so a
  host who also attends other events collapses into one person instead of a
  disconnected row per event.
- `app/home/homeData.ts` — `loadEventConnections` rewritten to join on
  `master_profile_id` directly instead of the email round-trip through
  `registrations`. Guests who've never created an account still can't be
  deduplicated across events (same limitation as before), but now that's the
  only reason a connection would be missed — not silent email mismatches too.

**What Stage 1 doesn't touch:** `hosts`/`host_profiles` still exists as its
own table (linking it into `people` is the bigger Stage-2+ work below);
`handshakes`/`handshake_requests` are still two tables; `profile_connections`
is still separate from event-based connections. All of that is still parked
under the trigger condition above — Stage 1 only removes the fragile
email-matching, it doesn't collapse the table count.

**Found but out of scope for Stage 1:** `features/entry/loadEntry.ts` does its
own separate email-match against `master_profiles` for "returning visitor"
recognition when a guest loads their link. Same category of fragility, not
touched here — worth a look next time this area comes up.

## Follow-up — Done (2026-08-07)

Fixed the `loadEntry.ts` case flagged above, partially. It actually had two
separate email-matches with different fixability:

- **Guest already onboarded for this event** — their `guest_profiles` row
  exists and now carries `master_profile_id` (Stage 1), so re-deriving it via
  email was the same avoidable redundancy fixed in `homeData.ts`. Now
  resolves by id directly, with an email-match fallback only for rows
  created before the column existed and never got backfilled.
- **Guest not yet onboarded for this event** — there's no `guest_profiles`
  row yet, so there's no FK to follow. This one is a genuine first-touch
  identity lookup with nothing else to key on (prefilling from a past
  event's master profile) — left as email matching on purpose, not the
  same bug.

**Next up, in order:** link `hosts` itself to `master_profiles` (Stage 1 only
linked the synthetic guest_profiles row a host gets, not the host identity
row itself — same email-only bridge problem, one layer up), then look at
role/status being encoded three ways (`registrations.status`,
`guest_profiles.role`, `hosts` membership) before touching the
connections-table merge, since that merge would otherwise build against a
person-graph that's still half-linked.

## Follow-up — Done (2026-08-07, part 2)

Linked `hosts` to `master_profiles`, same shape as Stage 1:

- `supabase/migrations/20260807b_add_hosts_master_profile_id.sql` — adds
  `hosts.master_profile_id`, indexes it, backfills existing rows by
  case-insensitive email match. **Not yet applied to the database.**
- `app/login/page.tsx` — host signup now finds-or-creates a
  `master_profiles` row by email and sets it on the `hosts` upsert, so the
  link exists from the moment someone signs up as a host, not just via
  backfill.
- `app/api/events/go-live/route.ts` and `features/entry/bootstrapIdentity.ts`
  — the find-or-create-by-email logic Stage 1 added to each of these is now
  a fallback only. Both read `host.master_profile_id` first, since `hosts`
  carries it directly now, and only fall back to the email lookup for a host
  row that predates both this change and the backfill.

A host's dashboard identity and their consumer-app account are now one
person end to end, not two records bridged by "happens to share an email"
at every point that needed to check.

**Next up:** role/status is still encoded three separate ways
(`registrations.status === 'host'`, `guest_profiles.role === 'organizer'`,
and `hosts` table membership) — worth resolving before the connections-table
merge, so that merge builds against a settled person-graph instead of one
that's still ambiguous about what "role" even means.
