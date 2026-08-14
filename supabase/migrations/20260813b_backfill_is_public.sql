-- Backfill is_public for existing events
--
-- Nothing in event creation or the publish flow ever set is_public, so
-- every event created before this fix relies on whatever the column's
-- database default was — and given three separate discovery surfaces
-- (UpcomingEvents, /events, /home/discover) all require is_public = true
-- before showing anything, any event not created with it explicitly true
-- has been invisible everywhere regardless of status. This fixes existing
-- events; app/dashboard/events/create/page.tsx now sets it explicitly for
-- new ones going forward.
--
-- Scoped to non-draft events only — a host's in-progress draft shouldn't
-- suddenly become publicly listed by this backfill.

update public.events
set is_public = true
where is_public is distinct from true
  and status <> 'draft';
