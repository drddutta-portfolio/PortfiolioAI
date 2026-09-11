alter table public.stock_recommendation_runs
  add column if not exists ai_interpretation jsonb,
  add column if not exists ai_interpretation_input_hash text,
  add column if not exists ai_interpretation_provider text,
  add column if not exists ai_interpretation_model text,
  add column if not exists ai_interpretation_generated_at timestamptz,
  add column if not exists ai_interpretation_status text,
  add column if not exists ai_interpretation_usage jsonb not null default '{}'::jsonb;

alter table public.stock_recommendation_runs
  drop constraint if exists stock_recommendation_runs_ai_interpretation_status_check;
alter table public.stock_recommendation_runs
  add constraint stock_recommendation_runs_ai_interpretation_status_check
  check (ai_interpretation_status is null or ai_interpretation_status in ('READY','FAILED','STALE'));

create index if not exists stock_recommendation_runs_ai_lookup_idx
  on public.stock_recommendation_runs(portfolio_id, security_id, created_at desc)
  where ai_interpretation_status = 'READY';
