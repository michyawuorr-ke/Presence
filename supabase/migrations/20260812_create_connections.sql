-- connections
--
-- Stage A of the connections-table merge (see "Connections Merge — Staged
-- Plan" in docs/architecture/01-person-model.md). This table replaces
-- handshakes + handshake_requests + profile_connections once the full
-- staged migration completes — but this migration only CREATES it.
-- Nothing reads from or writes to it yet; the three old tables remain
-- fully authoritative until Stage D. Purely additive, zero risk.
--
-- Both endpoints reference master_profiles, not guest_profiles — possible
-- now that every guest_profiles/hosts row reliably carries
-- master_profile_id (see Stage 1 and the hosts follow-up above). event_id
-- distinguishes event-scoped connections (QR-unlock, in-event requests)
-- from cross-event card connections (/u/[slug]): null for the latter.
--
-- status/source fold handshakes and handshake_requests into one state
-- machine: a request starts as 'requested', becomes 'connected' on
-- approval (an update, not a second row in a second table) or 'declined'.
-- A QR-unlock connection is created directly as 'connected' since it's
-- mutual and instant.

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references public.master_profiles(id),
  profile_b_id uuid not null references public.master_profiles(id),
  status text not null default 'connected',
  source text not null,
  event_id uuid references public.events(id),
  requested_by uuid references public.master_profiles(id),
  created_at timestamptz not null default now(),
  responded_at timestamptz,

  constraint connections_distinct_profiles check (profile_a_id <> profile_b_id),
  -- Canonical ordering (a < b) so the same pair can never be stored as both
  -- (A,B) and (B,A) — one row represents the relationship regardless of
  -- who's "sender" or "receiver"; requested_by carries direction instead.
  constraint connections_ordered_pair check (profile_a_id < profile_b_id),
  constraint connections_status_check check (status in ('requested','connected','declined')),
  constraint connections_source_check check (source in ('qr_unlock','request','card'))
);

-- Same pair can have multiple event-scoped connections (met at two
-- different events — this is exactly what My Connections aggregates), but
-- only one card connection (event_id null) per pair. Two partial indexes
-- because Postgres treats every NULL as distinct in a plain unique index,
-- which would let duplicate card connections slip through otherwise.
create unique index if not exists connections_pair_event_idx
  on public.connections(profile_a_id, profile_b_id, event_id)
  where event_id is not null;

create unique index if not exists connections_pair_card_idx
  on public.connections(profile_a_id, profile_b_id)
  where event_id is null;

create index if not exists connections_profile_a_idx on public.connections(profile_a_id);
create index if not exists connections_profile_b_idx on public.connections(profile_b_id);

-- RLS enabled with zero policies = deny-all for anon/authenticated,
-- service-role only. Intentional for this stage — nothing should read or
-- write this table directly yet, and the real access model (route through
-- an API with access_token verification, vs. a scoped guest JWT so RLS can
-- do the enforcement itself) is a Stage B decision, not this one.
alter table public.connections enable row level security;
