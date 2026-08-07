-- guest_profiles.master_profile_id
--
-- guest_profiles previously had no durable link back to master_profiles —
-- cross-event identity was reconstructed at read time by matching
-- registrations.guest_email against master_profiles.email (see
-- loadEventConnections in app/home/homeData.ts). That's fragile (case
-- differences, a guest using a different email at a later event silently
-- breaks the merge) and does an extra join on every dashboard load. This
-- column makes the link durable and queryable directly.
--
-- Stage 1 of the person-model migration recorded in
-- docs/architecture/01-person-model.md — additive only, nothing existing
-- changes shape or breaks.

alter table public.guest_profiles
  add column if not exists master_profile_id uuid references public.master_profiles(id);

create index if not exists guest_profiles_master_profile_id_idx
  on public.guest_profiles(master_profile_id);

-- One-time backfill: link every existing guest_profiles row to a
-- master_profiles row where the registration's email matches,
-- case-insensitively. Guests who never created an Oreeti account remain
-- unlinked (master_profile_id stays null) until they do — same
-- limitation the email-matching code had, just no longer silent about it.
update public.guest_profiles gp
set master_profile_id = mp.id
from public.registrations r, public.master_profiles mp
where gp.registration_id = r.id
  and lower(r.guest_email) = lower(mp.email)
  and gp.master_profile_id is null;
