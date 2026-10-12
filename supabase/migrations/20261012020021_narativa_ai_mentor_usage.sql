-- Privacy-minimizing audit of AI Mentor usage. Prompts and manuscript text are never stored here.
create table if not exists public.ai_mentor_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text not null,
  status text not null check (status in ('success', 'failed', 'rate_limited', 'not_configured')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  error_code text,
  created_at timestamptz not null default now()
);
create index if not exists ai_mentor_usage_user_created_idx on public.ai_mentor_usage (user_id, created_at desc);
create index if not exists ai_mentor_usage_created_idx on public.ai_mentor_usage (created_at desc);
alter table public.ai_mentor_usage enable row level security;
revoke all on table public.ai_mentor_usage from anon, authenticated, public;
grant all on table public.ai_mentor_usage to service_role;
comment on table public.ai_mentor_usage is 'Server-only AI Mentor usage audit. Stores token counts and outcome, never prompt or manuscript content.';
