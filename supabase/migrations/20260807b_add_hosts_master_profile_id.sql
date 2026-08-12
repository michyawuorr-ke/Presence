-- hosts.master_profile_id
--
-- Same gap as guest_profiles before Stage 1, one layer up: hosts had no
-- durable link to master_profiles either — a host's dashboard identity
-- (hosts.id) and their consumer-app identity (master_profiles.id) were
-- only ever bridged by "happens to share an email," checked fresh
-- wherever it mattered (go-live, bootstrapIdentity). This column makes
-- that link durable and queryable directly, same as guest_profiles got.

alter table public.hosts
  add column if not exists master_profile_id uuid references public.master_profiles(id);

create index if not exists hosts_master_profile_id_idx
  on public.hosts(master_profile_id);

-- One-time backfill: link every existing hosts row to a master_profiles
-- row where the email matches, case-insensitively. A host who's never
-- attended an event as a guest (so never triggered a master_profiles
-- row) remains unlinked until they do, or until they next log in and
-- app/login/page.tsx creates one.
update public.hosts h
set master_profile_id = mp.id
from public.master_profiles mp
where lower(h.email) = lower(mp.email)
  and h.master_profile_id is null;
