-- PortfolioAI P8-B3 market history / corporate-action foundation.
-- Development/local package only until separately approved for hosted PortfolioAI Dev.
-- Additive only. Does not mutate public.market_price_history, public.market_price_latest,
-- public.market_benchmark_price_history, public.securities, P8-B2 data, Production, or main.
--
-- Core doctrine:
--   1. Preserve raw source evidence.
--   2. Never infer a corporate action from a price discontinuity.
--   3. Store normalization/adjustment as separate versioned derived facts.
--   4. Unknown/ambiguous terms remain BLOCKED.

create function public.reject_p8_b3_market_mutation_v1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'P8-B3 historical market evidence is append-only';
end;
$$;

revoke all on function public.reject_p8_b3_market_mutation_v1() from public, anon, authenticated;
grant execute on function public.reject_p8_b3_market_mutation_v1() to service_role;

create table public.p8_b3_source_archives (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  experiment_id text not null,
  source_kind text not null check (
    source_kind in (
      'NSE_CM_BHAVCOPY_LEGACY',
      'NSE_CM_BHAVCOPY_UDIFF',
      'NSE_CORPORATE_ACTIONS',
      'NSE_INDICES_NIFTY500_TRI'
    )
  ),
  source_period_start date not null,
  source_period_end date not null,
  source_url text not null,
  source_file_name text,
  content_sha256 text not null,
  compressed_sha256 text,
  source_published_at timestamptz,
  retrieved_at timestamptz not null,
  source_contract_version text not null,
  archive_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint p8_b3_source_archives_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_b3_source_archives_period_ck
    check (source_period_end >= source_period_start),
  constraint p8_b3_source_archives_url_ck
    check (source_url = btrim(source_url) and source_url <> ''),
  constraint p8_b3_source_archives_file_ck
    check (source_file_name is null or nullif(btrim(source_file_name),'') is not null),
  constraint p8_b3_source_archives_content_hash_ck
    check (content_sha256 ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_source_archives_compressed_hash_ck
    check (compressed_sha256 is null or compressed_sha256 ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_source_archives_contract_ck
    check (source_contract_version = btrim(source_contract_version) and source_contract_version <> ''),
  constraint p8_b3_source_archives_archive_hash_ck
    check (archive_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_source_archives_time_ck
    check (source_published_at is null or source_published_at <= retrieved_at),
  constraint p8_b3_source_archives_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_b3_source_archives_content_uq
    unique (portfolio_id, experiment_id, source_kind, archive_hash)
);

create index p8_b3_source_archives_period_idx
  on public.p8_b3_source_archives
  (portfolio_id, experiment_id, source_kind, source_period_start, source_period_end);

create trigger p8_b3_source_archives_append_only
before update or delete on public.p8_b3_source_archives
for each row execute function public.reject_p8_b3_market_mutation_v1();

alter table public.p8_b3_source_archives enable row level security;

create policy p8_b3_source_archives_owner_read
on public.p8_b3_source_archives
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.user_id = (select auth.uid())
  )
);

revoke all on public.p8_b3_source_archives from public, anon, authenticated;
grant select on public.p8_b3_source_archives to authenticated;
grant all on public.p8_b3_source_archives to service_role;

create table public.p8_b3_raw_market_price_observations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  experiment_id text not null,
  historical_identity_id uuid not null,
  source_archive_id uuid not null,
  trade_date date not null,
  exchange text not null default 'NSE',
  trading_symbol text not null,
  series text,
  source_format text not null check (
    source_format in ('LEGACY_BHAVCOPY','UDIFF_BHAVCOPY')
  ),
  previous_close numeric,
  open numeric,
  high numeric,
  low numeric,
  close numeric not null,
  last_price numeric,
  volume numeric,
  traded_value numeric,
  trade_count bigint,
  row_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint p8_b3_raw_market_price_identity_fk
    foreign key (historical_identity_id, portfolio_id, experiment_id)
    references public.p8_historical_security_identities(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_raw_market_price_archive_fk
    foreign key (source_archive_id, portfolio_id, experiment_id)
    references public.p8_b3_source_archives(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_raw_market_price_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_b3_raw_market_price_exchange_ck
    check (exchange = 'NSE'),
  constraint p8_b3_raw_market_price_symbol_ck
    check (trading_symbol = btrim(trading_symbol) and trading_symbol <> ''),
  constraint p8_b3_raw_market_price_series_ck
    check (series is null or nullif(btrim(series),'') is not null),
  constraint p8_b3_raw_market_price_nonnegative_ck
    check (
      (previous_close is null or previous_close >= 0)
      and (open is null or open >= 0)
      and (high is null or high >= 0)
      and (low is null or low >= 0)
      and close >= 0
      and (last_price is null or last_price >= 0)
      and (volume is null or volume >= 0)
      and (traded_value is null or traded_value >= 0)
      and (trade_count is null or trade_count >= 0)
    ),
  constraint p8_b3_raw_market_price_high_low_ck
    check (high is null or low is null or high >= low),
  constraint p8_b3_raw_market_price_hash_ck
    check (row_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_raw_market_price_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_b3_raw_market_price_row_uq
    unique (
      portfolio_id,
      experiment_id,
      source_archive_id,
      historical_identity_id,
      row_hash
    )
);

create index p8_b3_raw_market_price_identity_date_idx
  on public.p8_b3_raw_market_price_observations
  (portfolio_id, experiment_id, historical_identity_id, trade_date);

create index p8_b3_raw_market_price_archive_idx
  on public.p8_b3_raw_market_price_observations
  (source_archive_id, historical_identity_id);

create trigger p8_b3_raw_market_price_observations_append_only
before update or delete on public.p8_b3_raw_market_price_observations
for each row execute function public.reject_p8_b3_market_mutation_v1();

alter table public.p8_b3_raw_market_price_observations enable row level security;

create policy p8_b3_raw_market_price_observations_owner_read
on public.p8_b3_raw_market_price_observations
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.user_id = (select auth.uid())
  )
);

revoke all on public.p8_b3_raw_market_price_observations from public, anon, authenticated;
grant select on public.p8_b3_raw_market_price_observations to authenticated;
grant all on public.p8_b3_raw_market_price_observations to service_role;

create table public.p8_b3_corporate_action_observations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  experiment_id text not null,
  source_archive_id uuid not null,
  historical_identity_id uuid,
  identity_resolution_state text not null check (
    identity_resolution_state in ('RESOLVED','UNRESOLVED','AMBIGUOUS')
  ),
  raw_symbol text not null,
  raw_company_name text,
  raw_series text,
  raw_purpose text not null,
  face_value numeric,
  ex_date date,
  record_date date,
  book_closure_start date,
  book_closure_end date,
  observation_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint p8_b3_corporate_action_archive_fk
    foreign key (source_archive_id, portfolio_id, experiment_id)
    references public.p8_b3_source_archives(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_corporate_action_identity_fk
    foreign key (historical_identity_id, portfolio_id, experiment_id)
    references public.p8_historical_security_identities(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_corporate_action_identity_state_ck
    check (
      (identity_resolution_state = 'RESOLVED' and historical_identity_id is not null)
      or
      (identity_resolution_state in ('UNRESOLVED','AMBIGUOUS') and historical_identity_id is null)
    ),
  constraint p8_b3_corporate_action_symbol_ck
    check (raw_symbol = btrim(raw_symbol) and raw_symbol <> ''),
  constraint p8_b3_corporate_action_purpose_ck
    check (raw_purpose = btrim(raw_purpose) and raw_purpose <> ''),
  constraint p8_b3_corporate_action_face_value_ck
    check (face_value is null or face_value >= 0),
  constraint p8_b3_corporate_action_book_dates_ck
    check (
      book_closure_start is null
      or book_closure_end is null
      or book_closure_end >= book_closure_start
    ),
  constraint p8_b3_corporate_action_hash_ck
    check (observation_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_corporate_action_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_b3_corporate_action_observation_uq
    unique (portfolio_id, experiment_id, source_archive_id, observation_hash)
);

create index p8_b3_corporate_action_identity_date_idx
  on public.p8_b3_corporate_action_observations
  (portfolio_id, experiment_id, historical_identity_id, ex_date)
  where historical_identity_id is not null;

create index p8_b3_corporate_action_symbol_date_idx
  on public.p8_b3_corporate_action_observations
  (portfolio_id, experiment_id, raw_symbol, ex_date);

create trigger p8_b3_corporate_action_observations_append_only
before update or delete on public.p8_b3_corporate_action_observations
for each row execute function public.reject_p8_b3_market_mutation_v1();

alter table public.p8_b3_corporate_action_observations enable row level security;

create policy p8_b3_corporate_action_observations_owner_read
on public.p8_b3_corporate_action_observations
for select
to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = (select auth.uid())
  )
);

revoke all on public.p8_b3_corporate_action_observations from public, anon, authenticated;
grant select on public.p8_b3_corporate_action_observations to authenticated;
grant all on public.p8_b3_corporate_action_observations to service_role;

create table public.p8_b3_corporate_action_normalizations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  experiment_id text not null,
  corporate_action_observation_id uuid not null,
  historical_identity_id uuid,
  normalization_version text not null,
  action_type text not null check (
    action_type in (
      'CASH_DIVIDEND',
      'SPLIT',
      'BONUS',
      'RIGHTS',
      'MERGER',
      'DEMERGER',
      'SYMBOL_CHANGE',
      'DELISTING',
      'OTHER'
    )
  ),
  normalization_state text not null check (
    normalization_state in ('READY','BLOCKED')
  ),
  effective_date date,
  normalized_terms jsonb not null default '{}'::jsonb,
  blocker_reason text,
  normalization_hash text not null,
  created_at timestamptz not null default now(),

  constraint p8_b3_action_normalization_observation_fk
    foreign key (corporate_action_observation_id, portfolio_id, experiment_id)
    references public.p8_b3_corporate_action_observations(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_action_normalization_identity_fk
    foreign key (historical_identity_id, portfolio_id, experiment_id)
    references public.p8_historical_security_identities(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_action_normalization_version_ck
    check (normalization_version = btrim(normalization_version) and normalization_version <> ''),
  constraint p8_b3_action_normalization_state_ck
    check (
      (
        normalization_state = 'READY'
        and historical_identity_id is not null
        and effective_date is not null
        and action_type <> 'OTHER'
        and blocker_reason is null
        and normalized_terms <> '{}'::jsonb
      )
      or
      (
        normalization_state = 'BLOCKED'
        and nullif(btrim(blocker_reason),'') is not null
      )
    ),
  constraint p8_b3_action_normalization_hash_ck
    check (normalization_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_action_normalization_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_b3_action_normalization_content_uq
    unique (
      portfolio_id,
      experiment_id,
      corporate_action_observation_id,
      normalization_version,
      normalization_hash
    )
);

create index p8_b3_action_normalization_identity_date_idx
  on public.p8_b3_corporate_action_normalizations
  (portfolio_id, experiment_id, historical_identity_id, effective_date)
  where historical_identity_id is not null;

create trigger p8_b3_corporate_action_normalizations_append_only
before update or delete on public.p8_b3_corporate_action_normalizations
for each row execute function public.reject_p8_b3_market_mutation_v1();

alter table public.p8_b3_corporate_action_normalizations enable row level security;

create policy p8_b3_corporate_action_normalizations_owner_read
on public.p8_b3_corporate_action_normalizations
for select
to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = (select auth.uid())
  )
);

revoke all on public.p8_b3_corporate_action_normalizations from public, anon, authenticated;
grant select on public.p8_b3_corporate_action_normalizations to authenticated;
grant all on public.p8_b3_corporate_action_normalizations to service_role;

create table public.p8_b3_adjustment_factors (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  experiment_id text not null,
  historical_identity_id uuid not null,
  corporate_action_normalization_id uuid not null,
  effective_date date not null,
  adjustment_version text not null,
  factor_state text not null check (factor_state in ('READY','BLOCKED')),
  share_factor numeric,
  price_back_adjustment_factor numeric,
  cash_distribution_per_share numeric,
  total_return_link_factor numeric,
  reference_price numeric,
  blocker_reason text,
  calculation_inputs jsonb not null default '{}'::jsonb,
  factor_hash text not null,
  created_at timestamptz not null default now(),

  constraint p8_b3_adjustment_factor_identity_fk
    foreign key (historical_identity_id, portfolio_id, experiment_id)
    references public.p8_historical_security_identities(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_adjustment_factor_normalization_fk
    foreign key (corporate_action_normalization_id, portfolio_id, experiment_id)
    references public.p8_b3_corporate_action_normalizations(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_adjustment_factor_version_ck
    check (adjustment_version = btrim(adjustment_version) and adjustment_version <> ''),
  constraint p8_b3_adjustment_factor_numbers_ck
    check (
      (share_factor is null or share_factor > 0)
      and (price_back_adjustment_factor is null or price_back_adjustment_factor > 0)
      and (cash_distribution_per_share is null or cash_distribution_per_share >= 0)
      and (total_return_link_factor is null or total_return_link_factor > 0)
      and (reference_price is null or reference_price > 0)
    ),
  constraint p8_b3_adjustment_factor_state_ck
    check (
      (
        factor_state = 'READY'
        and blocker_reason is null
        and (
          share_factor is not null
          or price_back_adjustment_factor is not null
          or total_return_link_factor is not null
        )
      )
      or
      (
        factor_state = 'BLOCKED'
        and nullif(btrim(blocker_reason),'') is not null
      )
    ),
  constraint p8_b3_adjustment_factor_hash_ck
    check (factor_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_adjustment_factor_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_b3_adjustment_factor_content_uq
    unique (
      portfolio_id,
      experiment_id,
      corporate_action_normalization_id,
      adjustment_version,
      factor_hash
    )
);

create index p8_b3_adjustment_factor_identity_date_idx
  on public.p8_b3_adjustment_factors
  (portfolio_id, experiment_id, historical_identity_id, effective_date);

create trigger p8_b3_adjustment_factors_append_only
before update or delete on public.p8_b3_adjustment_factors
for each row execute function public.reject_p8_b3_market_mutation_v1();

alter table public.p8_b3_adjustment_factors enable row level security;

create policy p8_b3_adjustment_factors_owner_read
on public.p8_b3_adjustment_factors
for select
to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = (select auth.uid())
  )
);

revoke all on public.p8_b3_adjustment_factors from public, anon, authenticated;
grant select on public.p8_b3_adjustment_factors to authenticated;
grant all on public.p8_b3_adjustment_factors to service_role;

create table public.p8_b3_adjusted_market_price_series (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  experiment_id text not null,
  historical_identity_id uuid not null,
  raw_price_observation_id uuid not null,
  trade_date date not null,
  adjustment_version text not null,
  series_state text not null check (series_state in ('READY','BLOCKED')),
  cumulative_price_factor numeric,
  adjusted_open numeric,
  adjusted_high numeric,
  adjusted_low numeric,
  adjusted_close numeric,
  daily_price_return numeric,
  daily_total_return numeric,
  total_return_index numeric,
  blocker_reason text,
  lineage jsonb not null default '{}'::jsonb,
  series_hash text not null,
  created_at timestamptz not null default now(),

  constraint p8_b3_adjusted_series_identity_fk
    foreign key (historical_identity_id, portfolio_id, experiment_id)
    references public.p8_historical_security_identities(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_adjusted_series_raw_price_fk
    foreign key (raw_price_observation_id, portfolio_id, experiment_id)
    references public.p8_b3_raw_market_price_observations(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_adjusted_series_version_ck
    check (adjustment_version = btrim(adjustment_version) and adjustment_version <> ''),
  constraint p8_b3_adjusted_series_numbers_ck
    check (
      (cumulative_price_factor is null or cumulative_price_factor > 0)
      and (adjusted_open is null or adjusted_open >= 0)
      and (adjusted_high is null or adjusted_high >= 0)
      and (adjusted_low is null or adjusted_low >= 0)
      and (adjusted_close is null or adjusted_close >= 0)
      and (total_return_index is null or total_return_index > 0)
    ),
  constraint p8_b3_adjusted_series_high_low_ck
    check (adjusted_high is null or adjusted_low is null or adjusted_high >= adjusted_low),
  constraint p8_b3_adjusted_series_state_ck
    check (
      (
        series_state = 'READY'
        and blocker_reason is null
        and cumulative_price_factor is not null
        and adjusted_close is not null
      )
      or
      (
        series_state = 'BLOCKED'
        and nullif(btrim(blocker_reason),'') is not null
      )
    ),
  constraint p8_b3_adjusted_series_hash_ck
    check (series_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_adjusted_series_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_b3_adjusted_series_content_uq
    unique (
      portfolio_id,
      experiment_id,
      raw_price_observation_id,
      adjustment_version,
      series_hash
    )
);

create index p8_b3_adjusted_series_identity_date_idx
  on public.p8_b3_adjusted_market_price_series
  (portfolio_id, experiment_id, historical_identity_id, trade_date, adjustment_version);

create trigger p8_b3_adjusted_market_price_series_append_only
before update or delete on public.p8_b3_adjusted_market_price_series
for each row execute function public.reject_p8_b3_market_mutation_v1();

alter table public.p8_b3_adjusted_market_price_series enable row level security;

create policy p8_b3_adjusted_market_price_series_owner_read
on public.p8_b3_adjusted_market_price_series
for select
to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = (select auth.uid())
  )
);

revoke all on public.p8_b3_adjusted_market_price_series from public, anon, authenticated;
grant select on public.p8_b3_adjusted_market_price_series to authenticated;
grant all on public.p8_b3_adjusted_market_price_series to service_role;

create table public.p8_b3_benchmark_total_return_history (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  experiment_id text not null,
  source_archive_id uuid not null,
  benchmark_version text not null,
  benchmark_code text not null,
  trade_date date not null,
  total_return_index numeric not null,
  net_total_return_index numeric,
  row_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint p8_b3_benchmark_archive_fk
    foreign key (source_archive_id, portfolio_id, experiment_id)
    references public.p8_b3_source_archives(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_b3_benchmark_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_b3_benchmark_version_ck
    check (benchmark_version = btrim(benchmark_version) and benchmark_version <> ''),
  constraint p8_b3_benchmark_code_ck
    check (benchmark_code = 'NIFTY_500'),
  constraint p8_b3_benchmark_values_ck
    check (
      total_return_index > 0
      and (net_total_return_index is null or net_total_return_index > 0)
    ),
  constraint p8_b3_benchmark_hash_ck
    check (row_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b3_benchmark_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_b3_benchmark_row_uq
    unique (
      portfolio_id,
      experiment_id,
      benchmark_version,
      benchmark_code,
      trade_date,
      row_hash
    )
);

create index p8_b3_benchmark_date_idx
  on public.p8_b3_benchmark_total_return_history
  (portfolio_id, experiment_id, benchmark_version, trade_date);

create trigger p8_b3_benchmark_total_return_history_append_only
before update or delete on public.p8_b3_benchmark_total_return_history
for each row execute function public.reject_p8_b3_market_mutation_v1();

alter table public.p8_b3_benchmark_total_return_history enable row level security;

create policy p8_b3_benchmark_total_return_history_owner_read
on public.p8_b3_benchmark_total_return_history
for select
to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = (select auth.uid())
  )
);

revoke all on public.p8_b3_benchmark_total_return_history from public, anon, authenticated;
grant select on public.p8_b3_benchmark_total_return_history to authenticated;
grant all on public.p8_b3_benchmark_total_return_history to service_role;

create view public.current_p8_b3_market_coverage_v1
with (security_invoker = true)
as
select
  portfolio_id,
  experiment_id,
  historical_identity_id,
  min(trade_date) as first_trade_date,
  max(trade_date) as last_trade_date,
  count(*) as raw_observation_count
from public.p8_b3_raw_market_price_observations
group by portfolio_id, experiment_id, historical_identity_id;

create view public.current_p8_b3_corporate_action_coverage_v1
with (security_invoker = true)
as
select
  o.portfolio_id,
  o.experiment_id,
  o.historical_identity_id,
  count(*) as observation_count,
  count(*) filter (where n.normalization_state = 'READY') as ready_normalization_count,
  count(*) filter (where n.normalization_state = 'BLOCKED') as blocked_normalization_count
from public.p8_b3_corporate_action_observations o
left join public.p8_b3_corporate_action_normalizations n
  on n.corporate_action_observation_id = o.id
group by o.portfolio_id, o.experiment_id, o.historical_identity_id;

revoke all on public.current_p8_b3_market_coverage_v1 from public, anon;
revoke all on public.current_p8_b3_corporate_action_coverage_v1 from public, anon;
grant select on public.current_p8_b3_market_coverage_v1 to authenticated, service_role;
grant select on public.current_p8_b3_corporate_action_coverage_v1 to authenticated, service_role;
