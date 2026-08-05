-- profile_contact_requests
--
-- Captures the "Send Details Back" quick-contact form on the public
-- /u/[slug] card. Unlike profile_connections (which links two existing
-- master_profiles rows), the person submitting this form has no account —
-- they're an anonymous scanner reciprocating their name and phone number
-- after scanning someone else's Oreeti QR. This is intentionally a
-- separate, minimal table rather than an extension of profile_connections,
-- since a name+phone from a stranger is a much weaker, unverified signal
-- than an authenticated connection and shouldn't be conflated with one.
--
-- Card owners see submissions via a service-role API route today; a
-- dedicated inbox UI is a natural next step but out of scope here.

create table if not exists public.profile_contact_requests (
  id uuid primary key default gen_random_uuid(),
  master_profile_id uuid not null references public.master_profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  viewed_at timestamptz
);

create index if not exists profile_contact_requests_master_profile_id_idx
  on public.profile_contact_requests(master_profile_id);

alter table public.profile_contact_requests enable row level security;

-- Anyone (including anonymous scanners) can submit a request — this is a
-- public-facing form with no auth wall by design. Writes only go through
-- the /api/connect/quick-contact route using the service role key, so this
-- policy is a backstop, not the primary write path.
create policy "Anyone can submit a contact request"
  on public.profile_contact_requests
  for insert
  to anon, authenticated
  with check (true);

-- Only the card owner (matched by their logged-in email against the
-- referenced master_profiles row) can read requests addressed to them.
create policy "Owner can view their own contact requests"
  on public.profile_contact_requests
  for select
  to authenticated
  using (
    master_profile_id in (
      select id from public.master_profiles
      where email = lower(auth.jwt() ->> 'email')
    )
  );
