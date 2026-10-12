-- Secure, server-only foundation for NARATIVA platform operations.
-- Browser roles cannot read or mutate privileged roles, reports, or audit events.
create table if not exists public.platform_admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_admin', 'moderator', 'support', 'ops')),
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_admin_roles_active_role_idx
  on public.platform_admin_roles (role, active);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  book_id uuid references public.books(id) on delete set null,
  reason text not null check (reason in ('copyright', 'safety', 'spam', 'misinformation', 'other')),
  description text not null default '' check (char_length(description) <= 5000),
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_reports_status_created_idx
  on public.content_reports (status, created_at desc);
create index if not exists content_reports_book_id_idx
  on public.content_reports (book_id);

create table if not exists public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  outcome text not null default 'success' check (outcome in ('success', 'denied', 'failure')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists platform_audit_events_created_idx
  on public.platform_audit_events (created_at desc);
create index if not exists platform_audit_events_actor_idx
  on public.platform_audit_events (actor_user_id, created_at desc);

-- Resolve a performance-advisor finding from the existing Etsy OAuth state table.
create index if not exists narativa_etsy_oauth_states_user_id_idx
  on public.narativa_etsy_oauth_states (user_id);

alter table public.platform_admin_roles enable row level security;
alter table public.content_reports enable row level security;
alter table public.platform_audit_events enable row level security;

revoke all on table public.platform_admin_roles from anon, authenticated, public;
revoke all on table public.content_reports from anon, authenticated, public;
revoke all on table public.platform_audit_events from anon, authenticated, public;
grant all on table public.platform_admin_roles to service_role;
grant all on table public.content_reports to service_role;
grant all on table public.platform_audit_events to service_role;

comment on table public.platform_admin_roles is 'Server-only platform roles. Never authorize using user-editable metadata.';
comment on table public.content_reports is 'Server-managed moderation and rights reports; client access is intentionally denied until a report intake endpoint is implemented.';
comment on table public.platform_audit_events is 'Server-only audit trail for privileged platform operations.';
