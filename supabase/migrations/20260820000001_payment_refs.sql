alter table public.registrations
  add column if not exists payment_ref text unique,
  add column if not exists amount_expected numeric,
  add column if not exists paid_at timestamptz;

create index if not exists registrations_payment_ref_idx
  on public.registrations(payment_ref);
