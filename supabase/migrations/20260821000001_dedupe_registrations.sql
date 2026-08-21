-- Prevents duplicate registrations for the same person at the same event.
-- Without this, a double-tap on "Register" or a retry after a dropped
-- connection (more likely at a real event with many people on a shared
-- wifi/hotspot) could silently create multiple registration rows for one
-- guest — each with its own access link, confusing them about which one
-- is real and inflating registration counts.
--
-- Existing duplicates (if any) are collapsed to the earliest registration
-- before the constraint is added, so this migration is safe to run even
-- if duplicates already exist in production data.

delete from public.registrations a
using public.registrations b
where a.event_id = b.event_id
  and a.guest_email = b.guest_email
  and a.id > b.id;

create unique index if not exists registrations_event_email_unique
  on public.registrations (event_id, guest_email);
