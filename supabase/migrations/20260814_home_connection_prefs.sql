-- home_archived_connections / home_deleted_connections
--
-- Per-viewer preferences for the Connects tab on /home, mirroring the
-- existing home_archived_events table exactly. Neither touches the
-- underlying connection data (handshakes/profile_connections/etc) at
-- all — this only controls what one person sees in their own list.
--
-- Archive is reversible (a "hide, but I can bring it back" toggle, same
-- as events). Delete is a separate, one-way action — no unhide path is
-- exposed in the UI for it, confirmed before use, same pattern as
-- deleting a ticket type or an event elsewhere in the dashboard.

create table if not exists public.home_archived_connections (
  email text not null,
  connection_id text not null,
  created_at timestamptz not null default now(),
  primary key (email, connection_id)
);

create table if not exists public.home_deleted_connections (
  email text not null,
  connection_id text not null,
  created_at timestamptz not null default now(),
  primary key (email, connection_id)
);
