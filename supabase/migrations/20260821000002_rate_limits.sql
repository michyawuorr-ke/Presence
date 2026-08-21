-- The previous rate limiter used an in-memory Map inside the API route's
-- module scope. On Vercel, each concurrent request can be served by a
-- different serverless instance, each with its own separate memory — so
-- under real concurrent load (many people registering/checking in around
-- the same time at an event), the "limit" was effectively not enforced:
-- a burst of requests just spread across instances that each started
-- counting from zero. This moves the counter into Postgres, which is
-- shared across every instance, so the limit is actually real.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  reset_at timestamptz not null
);

-- Atomic check-and-increment. Returns true if the request is allowed.
-- Using a single function call (not a select-then-update from the app)
-- avoids a race window between reading the count and writing it back
-- under concurrent requests hitting the same key at once.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limits (key, count, reset_at)
  values (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
  on conflict (key) do update
    set count = case
          when public.rate_limits.reset_at < v_now then 1
          else public.rate_limits.count + 1
        end,
        reset_at = case
          when public.rate_limits.reset_at < v_now then v_now + (p_window_seconds || ' seconds')::interval
          else public.rate_limits.reset_at
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Old rows never get read again once their window passes — cheap to
-- clean up periodically rather than growing forever.
create index if not exists rate_limits_reset_at_idx on public.rate_limits (reset_at);
