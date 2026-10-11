-- Generic connector storage; credentials remain inaccessible to browser roles.
create table if not exists public.narativa_connector_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor text not null check (vendor in ('woocommerce')),
  status text not null default 'not_connected' check (status in ('connected','action_required','not_connected')),
  account_label text,
  encrypted_credentials text not null,
  capabilities text[] not null default '{}',
  last_verified_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, vendor)
);
create index if not exists narativa_connector_connections_user_idx on public.narativa_connector_connections(user_id);
alter table public.narativa_connector_connections enable row level security;
revoke all on table public.narativa_connector_connections from anon, authenticated, public;
grant all on table public.narativa_connector_connections to service_role;
