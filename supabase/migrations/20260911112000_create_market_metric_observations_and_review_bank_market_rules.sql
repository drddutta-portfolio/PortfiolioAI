-- Stage 8.6E: provider-independent derived market evidence for deterministic scoring.
-- Raw OHLCV remains in market_price_history. Derived metrics are auditable, refreshable
-- observations and never replace Angel One as the market-price authority.

create table if not exists public.market_metric_observations (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete restrict,
  provider_code text not null references public.market_data_providers(code) on delete restrict,
  metric_code text not null,
  numeric_value numeric not null,
  unit text not null,
  as_of_date date not null,
  lookback_start date,
  lookback_end date not null,
  retrieved_at timestamptz not null default now(),
  fresh_until timestamptz not null,
  evidence_status text not null default 'AVAILABLE',
  derivation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint market_metric_code_check check (metric_code in (
    'PRICE_MOMENTUM_12M',
    'PRICE_MOMENTUM_6M',
    'RELATIVE_STRENGTH_12M',
    'MAX_DRAWDOWN_1Y',
    'VOLATILITY_1Y'
  )),
  constraint market_metric_unit_check check (unit in ('PERCENT','PERCENTAGE_POINTS','PERCENT_ABSOLUTE_DRAWDOWN')),
  constraint market_metric_evidence_status_check check (evidence_status in ('AVAILABLE','CONFLICTING','REJECTED','REVIEW_REQUIRED')),
  constraint market_metric_derivation_object_check check (jsonb_typeof(derivation) = 'object'),
  constraint market_metric_window_check check (lookback_start is null or lookback_start <= lookback_end),
  unique (security_id, provider_code, metric_code, as_of_date)
);

create index if not exists market_metric_observations_security_metric_idx
  on public.market_metric_observations (security_id, metric_code, as_of_date desc, retrieved_at desc);

alter table public.market_metric_observations enable row level security;

drop policy if exists "Users can read market metrics for their securities" on public.market_metric_observations;
create policy "Users can read market metrics for their securities"
  on public.market_metric_observations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.transactions t
      join public.portfolios p on p.id = t.portfolio_id
      where t.security_id = market_metric_observations.security_id
        and p.user_id = auth.uid()
    )
  );

-- Historical refresh uses the same provider-wide lease mechanism as Stage 4.
alter table public.market_data_operation_leases
  drop constraint if exists market_data_operation_leases_operation_check;
alter table public.market_data_operation_leases
  add constraint market_data_operation_leases_operation_check
  check (operation in ('REFRESH_PRICES','SYNC_MAPPINGS','REFRESH_HISTORY'));

-- BANK_NBFC pilot: two absolute momentum measures are independently scoreable from
-- Angel One daily closes. Relative strength still requires a benchmark series.
update public.scoring_model_metric_rules r
set rule_state = 'REVIEWED'
from public.scoring_models m
where r.scoring_model_id = m.id
  and m.code = 'PAI_STOCK_SCORE'
  and m.version = 1
  and r.scoring_profile = 'BANK_NBFC'
  and r.dimension_code = 'MOMENTUM'
  and r.input_code in ('PRICE_MOMENTUM_12M','PRICE_MOMENTUM_6M')
  and r.input_kind = 'MARKET';

-- Drawdown is absolute and can be scored directly. Volatility remains pending until
-- the intended Bank/NBFC benchmark/peer comparison series is available.
update public.scoring_model_metric_rules r
set rule_state = 'REVIEWED'
from public.scoring_models m
where r.scoring_model_id = m.id
  and m.code = 'PAI_STOCK_SCORE'
  and m.version = 1
  and r.scoring_profile = 'BANK_NBFC'
  and r.dimension_code = 'RISK'
  and r.input_code = 'MAX_DRAWDOWN_1Y'
  and r.input_kind = 'MARKET';
