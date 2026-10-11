-- NARATIVA Etsy OAuth token/state storage. Secrets and tokens are never exposed to browser clients.
create table if not exists public.narativa_etsy_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_code_verifier text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists narativa_etsy_oauth_states_expiry_idx on public.narativa_etsy_oauth_states (expires_at);
create table if not exists public.narativa_etsy_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor text not null default 'etsy' check (vendor = 'etsy'),
  status text not null default 'connected' check (status in ('connected', 'action_required')),
  encrypted_access_token text not null,
  encrypted_refresh_token text not null,
  token_expires_at timestamptz not null,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_error text,
  unique (user_id, vendor)
);
create index if not exists narativa_etsy_connections_user_idx on public.narativa_etsy_connections (user_id);
alter table public.narativa_etsy_oauth_states enable row level security;
alter table public.narativa_etsy_connections enable row level security;
revoke all on table public.narativa_etsy_oauth_states from anon, authenticated, public;
revoke all on table public.narativa_etsy_connections from anon, authenticated, public;
grant all on table public.narativa_etsy_oauth_states to service_role;
grant all on table public.narativa_etsy_connections to service_role;
