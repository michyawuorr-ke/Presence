-- auto_go_live
--
-- Event Status Flow: draft -> scheduled -> live -> ended (see
-- docs/architecture — the "Publish Event" dashboard button moves an event
-- draft -> scheduled; this is what moves scheduled -> live automatically
-- when start_time arrives, with no host action needed.
--
-- pg_cron was already the established pattern for exactly this kind of
-- event-status transition in the original schema, so this follows that
-- same approach rather than introducing a new mechanism (e.g. a Vercel
-- cron hitting an API route).
--
-- NOTE: pg_cron must be enabled for this project before this migration can
-- run — on Supabase this is usually a one-time toggle in
-- Database -> Extensions in the dashboard (not always grantable via plain
-- SQL depending on plan/permissions). If this migration fails on
-- `create extension`, enable pg_cron there first, then re-run.

create extension if not exists pg_cron with schema extensions;

create or replace function public.auto_go_live()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Safety net: ensure every event about to go live has an event_policies
  -- row, in case one reached "scheduled" through a path that skipped the
  -- dashboard Publish button's upsert (e.g. app/api/events/go-live/route.ts,
  -- which sets scheduled but doesn't touch event_policies). Live networking
  -- with no policies row is a worse failure than a redundant upsert here.
  insert into event_policies (event_id, networking_enabled, default_visibility, mutual_discovery, self_select_roles)
  select id, true, 'visible', false, array['attendee']
  from events
  where status = 'scheduled'
    and start_time <= now()
    and id not in (select event_id from event_policies)
  on conflict (event_id) do nothing;

  update events
  set status = 'live'
  where status = 'scheduled'
    and start_time <= now();
end;
$$;

-- Re-running this migration should replace the existing schedule, not
-- duplicate it.
select cron.unschedule('auto-go-live') where exists (
  select 1 from cron.job where jobname = 'auto-go-live'
);

select cron.schedule(
  'auto-go-live',
  '* * * * *', -- every minute — events go live within 60s of start_time
  $$ select public.auto_go_live(); $$
);
