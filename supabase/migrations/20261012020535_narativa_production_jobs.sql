-- Private production job tracking for AI-generated visual and audio assets.
create table if not exists public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  capability text not null check (capability in ('image', 'speech', 'video', 'model_3d')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  provider text not null,
  model text not null,
  prompt_hash text,
  output_asset_id uuid references public.book_assets(id) on delete set null,
  output_storage_path text,
  output_content_type text,
  error_code text,
  usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists production_jobs_owner_created_idx on public.production_jobs (owner_id, created_at desc);
create index if not exists production_jobs_book_created_idx on public.production_jobs (book_id, created_at desc);
create index if not exists production_jobs_status_created_idx on public.production_jobs (status, created_at desc);
create index if not exists production_jobs_capability_created_idx on public.production_jobs (owner_id, capability, created_at desc);

alter table public.production_jobs enable row level security;
drop policy if exists production_jobs_read_owner on public.production_jobs;
create policy production_jobs_read_owner on public.production_jobs
  for select to authenticated using (owner_id = (select auth.uid()));
revoke all on table public.production_jobs from anon, authenticated, public;
grant select on table public.production_jobs to authenticated;
grant all on table public.production_jobs to service_role;
comment on table public.production_jobs is 'Server-managed production jobs for private AI assets. Browser clients can only read their own jobs; prompts are not stored.';
