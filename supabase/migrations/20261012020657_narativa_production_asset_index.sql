-- Cover the production job output asset foreign key flagged by the performance advisor.
create index if not exists production_jobs_output_asset_id_idx on public.production_jobs (output_asset_id);
