-- Stage 8.6F: canonical BANK_NBFC benchmark history and reviewed 12M relative-strength scoring.

create table if not exists public.market_benchmarks (
  code text primary key,
  name text not null,
  provider_code text not null references public.market_data_providers(code) on delete restrict,
  provider_instrument_id text,
  exchange text,
  trading_symbol text,
  mapping_status text not null default 'UNRESOLVED',
  mapping_evidence jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint market_benchmarks_code_check check (code ~ '^[A-Z0-9_]+$'),
  constraint market_benchmarks_mapping_status_check check (mapping_status in ('VERIFIED','UNRESOLVED','AMBIGUOUS')),
  constraint market_benchmarks_mapping_evidence_object_check check (jsonb_typeof(mapping_evidence) = 'object')
);

create table if not exists public.market_benchmark_price_history (
  id uuid primary key default gen_random_uuid(),
  benchmark_code text not null references public.market_benchmarks(code) on delete restrict,
  provider_code text not null references public.market_data_providers(code) on delete restrict,
  interval text not null,
  period_start timestamptz not null,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric,
  retrieved_at timestamptz not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint market_benchmark_interval_check check (interval in ('ONE_DAY')),
  constraint market_benchmark_provenance_object_check check (jsonb_typeof(provenance) = 'object'),
  unique (benchmark_code, provider_code, interval, period_start)
);

create index if not exists market_benchmark_price_history_lookup_idx
  on public.market_benchmark_price_history (benchmark_code, provider_code, interval, period_start desc);

alter table public.market_benchmarks enable row level security;
alter table public.market_benchmark_price_history enable row level security;

drop policy if exists "Authenticated users can read market benchmarks" on public.market_benchmarks;
create policy "Authenticated users can read market benchmarks"
  on public.market_benchmarks for select to authenticated using (true);

drop policy if exists "Authenticated users can read market benchmark history" on public.market_benchmark_price_history;
create policy "Authenticated users can read market benchmark history"
  on public.market_benchmark_price_history for select to authenticated using (true);

insert into public.market_benchmarks (code, name, provider_code, mapping_status, mapping_evidence)
values (
  'NIFTY_BANK',
  'NIFTY Bank',
  'ANGEL_ONE',
  'UNRESOLVED',
  '{"selection_policy":"Exact Angel One instrument-master alias match only","accepted_aliases":["NIFTY BANK","BANKNIFTY"],"mapping_version":"nifty-bank-v1"}'::jsonb
)
on conflict (code) do update
set name = excluded.name,
    provider_code = excluded.provider_code,
    updated_at = now();

-- The derived metric is stored in market_metric_observations after a validated
-- NIFTY Bank history refresh. Existing piecewise bands remain unchanged.
update public.scoring_model_metric_rules r
set input_kind = 'MARKET',
    preferred_source = 'ANGEL_ONE',
    provider_field_contract = '12M close-to-close HDFCBANK return minus 12M close-to-close NIFTY Bank return, aligned to a common end date',
    rule_state = 'REVIEWED',
    updated_at = now()
from public.scoring_models m
where r.scoring_model_id = m.id
  and m.code = 'PAI_STOCK_SCORE'
  and m.version = 1
  and r.scoring_profile = 'BANK_NBFC'
  and r.dimension_code = 'MOMENTUM'
  and r.input_code = 'RELATIVE_STRENGTH_12M'
  and r.metric_code = 'RELATIVE_STRENGTH_12M';
