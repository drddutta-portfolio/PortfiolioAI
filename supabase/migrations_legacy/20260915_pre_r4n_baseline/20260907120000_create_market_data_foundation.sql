-- Stage 4: provider-independent market-data identity, current prices, and OHLCV foundation.
-- This migration is intentionally additive. It must not be applied without explicit approval.

create table public.market_data_providers (
  code text primary key check (code ~ '^[A-Z0-9_]+$'),
  name text not null check (name = btrim(name) and name <> ''),
  is_active boolean not null default true,
  capabilities jsonb not null default '{}'::jsonb check (jsonb_typeof(capabilities) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.market_data_providers (code, name, capabilities)
values ('ANGEL_ONE', 'Angel One SmartAPI', '{"latest_prices":true,"daily_ohlcv":true,"batch_quote_limit":50}'::jsonb);

create table public.market_data_instrument_mappings (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities (id) on delete restrict,
  provider_code text not null references public.market_data_providers (code) on delete restrict,
  provider_instrument_id text,
  exchange text,
  trading_symbol text,
  provider_instrument_type text,
  mapping_status text not null check (mapping_status in ('VERIFIED', 'UNRESOLVED', 'AMBIGUOUS', 'INACTIVE')),
  match_basis text check (match_basis is null or match_basis in ('EXCHANGE_SYMBOL_EXACT', 'ISIN_EXACT', 'MANUAL_VERIFIED')),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  instrument_master_as_of date,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_data_mapping_complete_check check (
    (mapping_status = 'VERIFIED'
      and provider_instrument_id is not null
      and exchange is not null
      and trading_symbol is not null
      and match_basis is not null
      and verified_at is not null)
    or mapping_status <> 'VERIFIED'
  ),
  constraint market_data_mapping_exchange_check check (exchange is null or exchange ~ '^[A-Z0-9_]+$'),
  constraint market_data_mapping_instrument_id_check check (
    provider_instrument_id is null or provider_instrument_id = btrim(provider_instrument_id)
  ),
  constraint market_data_mapping_trading_symbol_check check (
    trading_symbol is null or (trading_symbol = btrim(trading_symbol) and trading_symbol <> '')
  ),
  constraint market_data_mapping_security_provider_key unique (security_id, provider_code)
);

alter table public.market_data_instrument_mappings
  add constraint market_data_mapping_composite_identity_key unique (id, security_id, provider_code);

create index market_data_instrument_mappings_status_idx
  on public.market_data_instrument_mappings (provider_code, mapping_status);
create unique index market_data_mapping_provider_identity_key
  on public.market_data_instrument_mappings (provider_code, exchange, provider_instrument_id)
  where provider_instrument_id is not null;

create table public.market_price_latest (
  security_id uuid not null references public.securities (id) on delete restrict,
  provider_code text not null references public.market_data_providers (code) on delete restrict,
  mapping_id uuid not null,
  price numeric(38, 18) not null check (price >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  price_timestamp timestamptz,
  retrieved_at timestamptz not null default now(),
  market_session_status text not null default 'UNKNOWN'
    check (market_session_status in ('OPEN', 'CLOSED', 'PRE_OPEN', 'POST_CLOSE', 'UNKNOWN')),
  previous_close numeric(38, 18) check (previous_close is null or previous_close >= 0),
  day_open numeric(38, 18) check (day_open is null or day_open >= 0),
  day_high numeric(38, 18) check (day_high is null or day_high >= 0),
  day_low numeric(38, 18) check (day_low is null or day_low >= 0),
  provenance jsonb not null check (jsonb_typeof(provenance) = 'object'),
  primary key (security_id, provider_code),
  constraint market_price_latest_mapping_identity_key unique (mapping_id),
  constraint market_price_latest_mapping_consistency_fk
    foreign key (mapping_id, security_id, provider_code)
    references public.market_data_instrument_mappings (id, security_id, provider_code) on delete restrict,
  constraint market_price_latest_day_range_check check (
    day_low is null or day_high is null or day_low <= day_high
  )
);

create index market_price_latest_retrieved_at_idx on public.market_price_latest (retrieved_at desc);

create table public.market_price_history (
  security_id uuid not null references public.securities (id) on delete restrict,
  provider_code text not null references public.market_data_providers (code) on delete restrict,
  mapping_id uuid not null,
  interval text not null check (interval in ('ONE_DAY')),
  period_start timestamptz not null,
  open numeric(38, 18) not null check (open >= 0),
  high numeric(38, 18) not null check (high >= 0),
  low numeric(38, 18) not null check (low >= 0),
  close numeric(38, 18) not null check (close >= 0),
  adjusted_close numeric(38, 18) check (adjusted_close is null or adjusted_close >= 0),
  volume numeric(38, 0) check (volume is null or volume >= 0),
  retrieved_at timestamptz not null default now(),
  provenance jsonb not null check (jsonb_typeof(provenance) = 'object'),
  primary key (security_id, provider_code, interval, period_start),
  constraint market_price_history_range_check check (low <= high and open between low and high and close between low and high),
  constraint market_price_history_mapping_consistency_fk
    foreign key (mapping_id, security_id, provider_code)
    references public.market_data_instrument_mappings (id, security_id, provider_code) on delete restrict
);

create index market_price_history_security_period_idx
  on public.market_price_history (security_id, period_start desc);

create table public.market_data_refresh_runs (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  provider_code text not null references public.market_data_providers (code) on delete restrict,
  requested_by uuid not null references auth.users (id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'SKIPPED_FRESH')),
  requested_security_count integer not null check (requested_security_count >= 0),
  cached_security_count integer not null default 0 check (cached_security_count >= 0),
  fetched_security_count integer not null default 0 check (fetched_security_count >= 0),
  unresolved_security_count integer not null default 0 check (unresolved_security_count >= 0),
  failed_security_count integer not null default 0 check (failed_security_count >= 0),
  error_summary text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create index market_data_refresh_runs_portfolio_started_idx
  on public.market_data_refresh_runs (portfolio_id, started_at desc);

create table public.market_data_mapping_reviews (
  id uuid primary key default gen_random_uuid(),
  mapping_id uuid not null references public.market_data_instrument_mappings (id) on delete restrict,
  security_id uuid not null references public.securities (id) on delete restrict,
  provider_code text not null references public.market_data_providers (code) on delete restrict,
  proposed_provider_instrument_id text,
  proposed_exchange text,
  proposed_trading_symbol text,
  proposed_provider_instrument_type text,
  proposed_mapping_status text not null check (proposed_mapping_status in ('VERIFIED', 'UNRESOLVED', 'AMBIGUOUS', 'INACTIVE')),
  proposed_match_basis text check (proposed_match_basis is null or proposed_match_basis in ('EXCHANGE_SYMBOL_EXACT', 'ISIN_EXACT', 'MANUAL_VERIFIED')),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  detected_at timestamptz not null default now(),
  review_status text not null default 'PENDING' check (review_status in ('PENDING', 'APPLIED', 'REJECTED')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete restrict,
  review_notes text,
  constraint market_data_mapping_review_status_key unique (mapping_id, review_status),
  constraint market_data_mapping_review_mapping_consistency_fk
    foreign key (mapping_id, security_id, provider_code)
    references public.market_data_instrument_mappings (id, security_id, provider_code) on delete restrict,
  constraint market_data_mapping_review_state_check check (
    (review_status = 'PENDING' and reviewed_at is null and reviewed_by is null)
    or (review_status <> 'PENDING' and reviewed_at is not null and reviewed_by is not null)
  )
);

create table public.market_data_operation_leases (
  provider_code text not null references public.market_data_providers (code) on delete restrict,
  operation text not null check (operation in ('REFRESH_PRICES', 'SYNC_MAPPINGS')),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  lease_holder uuid,
  lease_expires_at timestamptz,
  next_allowed_at timestamptz not null default '-infinity'::timestamptz,
  updated_at timestamptz not null default now(),
  primary key (provider_code, operation),
  constraint market_data_operation_lease_state_check check (
    (lease_holder is null and lease_expires_at is null)
    or (lease_holder is not null and lease_expires_at is not null)
  )
);

create or replace function public.acquire_market_data_operation_lease(
  p_portfolio_id uuid,
  p_provider_code text,
  p_operation text,
  p_lease_holder uuid,
  p_lease_seconds integer
)
returns table (acquired boolean, retry_after timestamptz)
language plpgsql
set search_path = ''
as $$
begin
  if p_lease_seconds < 1 or p_lease_seconds > 900 then
    raise exception 'Invalid lease duration.';
  end if;

  insert into public.market_data_operation_leases (
    portfolio_id, provider_code, operation, lease_holder, lease_expires_at, updated_at
  ) values (
    p_portfolio_id, p_provider_code, p_operation, p_lease_holder,
    pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_lease_seconds), pg_catalog.clock_timestamp()
  )
  on conflict (provider_code, operation) do update
    set portfolio_id = excluded.portfolio_id,
        lease_holder = excluded.lease_holder,
        lease_expires_at = excluded.lease_expires_at,
        updated_at = excluded.updated_at
    where (public.market_data_operation_leases.lease_expires_at is null
           or public.market_data_operation_leases.lease_expires_at <= pg_catalog.clock_timestamp())
      and public.market_data_operation_leases.next_allowed_at <= pg_catalog.clock_timestamp();

  return query
  select leases.lease_holder = p_lease_holder,
         pg_catalog.greatest(leases.next_allowed_at, leases.lease_expires_at)
  from public.market_data_operation_leases as leases
  where leases.provider_code = p_provider_code
    and leases.operation = p_operation;
end;
$$;

create or replace function public.release_market_data_operation_lease(
  p_portfolio_id uuid,
  p_provider_code text,
  p_operation text,
  p_lease_holder uuid,
  p_cooldown_seconds integer
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  changed integer;
begin
  if p_cooldown_seconds < 1 or p_cooldown_seconds > 86400 then
    raise exception 'Invalid cooldown duration.';
  end if;

  update public.market_data_operation_leases
  set lease_holder = null,
      lease_expires_at = null,
      next_allowed_at = pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_cooldown_seconds),
      updated_at = pg_catalog.clock_timestamp()
  where provider_code = p_provider_code
    and operation = p_operation
    and portfolio_id = p_portfolio_id
    and lease_holder = p_lease_holder;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke all on function public.acquire_market_data_operation_lease(uuid, text, text, uuid, integer) from public, anon, authenticated;
revoke all on function public.release_market_data_operation_lease(uuid, text, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.acquire_market_data_operation_lease(uuid, text, text, uuid, integer) to service_role;
grant execute on function public.release_market_data_operation_lease(uuid, text, text, uuid, integer) to service_role;

create trigger market_data_providers_set_audit_timestamps
before insert or update on public.market_data_providers
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger market_data_instrument_mappings_set_audit_timestamps
before insert or update on public.market_data_instrument_mappings
for each row execute function public.portfolioai_set_audit_timestamps();

alter table public.market_data_providers enable row level security;
alter table public.market_data_instrument_mappings enable row level security;
alter table public.market_price_latest enable row level security;
alter table public.market_price_history enable row level security;
alter table public.market_data_refresh_runs enable row level security;
alter table public.market_data_mapping_reviews enable row level security;
alter table public.market_data_operation_leases enable row level security;

revoke all privileges on table public.market_data_providers from anon, authenticated;
revoke all privileges on table public.market_data_instrument_mappings from anon, authenticated;
revoke all privileges on table public.market_price_latest from anon, authenticated;
revoke all privileges on table public.market_price_history from anon, authenticated;
revoke all privileges on table public.market_data_refresh_runs from anon, authenticated;
revoke all privileges on table public.market_data_mapping_reviews from anon, authenticated;
revoke all privileges on table public.market_data_operation_leases from anon, authenticated;

grant select on table public.market_data_providers to authenticated;
grant select on table public.market_data_instrument_mappings to authenticated;
grant select on table public.market_price_latest to authenticated;
grant select on table public.market_price_history to authenticated;
grant select on table public.market_data_refresh_runs to authenticated;
grant select on table public.market_data_mapping_reviews to authenticated;

create policy "Authenticated users can read market data providers"
on public.market_data_providers for select to authenticated using (true);

create policy "Users can read mappings for securities in their portfolios"
on public.market_data_instrument_mappings for select to authenticated using (
  exists (
    select 1 from public.transactions
    join public.portfolios on portfolios.id = transactions.portfolio_id
    where transactions.security_id = market_data_instrument_mappings.security_id
      and transactions.accounting_status = 'ACTIVE'
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can read latest prices for securities in their portfolios"
on public.market_price_latest for select to authenticated using (
  exists (
    select 1 from public.transactions
    join public.portfolios on portfolios.id = transactions.portfolio_id
    where transactions.security_id = market_price_latest.security_id
      and transactions.accounting_status = 'ACTIVE'
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can read price history for securities in their portfolios"
on public.market_price_history for select to authenticated using (
  exists (
    select 1 from public.transactions
    join public.portfolios on portfolios.id = transactions.portfolio_id
    where transactions.security_id = market_price_history.security_id
      and transactions.accounting_status = 'ACTIVE'
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can read their own market refresh runs"
on public.market_data_refresh_runs for select to authenticated using (
  exists (
    select 1 from public.portfolios
    where portfolios.id = market_data_refresh_runs.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can read mapping reviews for securities in their portfolios"
on public.market_data_mapping_reviews for select to authenticated using (
  exists (
    select 1 from public.transactions
    join public.portfolios on portfolios.id = transactions.portfolio_id
    where transactions.security_id = market_data_mapping_reviews.security_id
      and transactions.accounting_status = 'ACTIVE'
      and portfolios.user_id = (select auth.uid())
  )
);

comment on table public.market_data_instrument_mappings is
  'Provider instrument identity is kept separate from canonical securities. VERIFIED mappings require exact canonical exchange/symbol evidence, exact ISIN evidence, or manual verification.';
comment on table public.market_price_latest is
  'Provider observation cache. price_timestamp is provider/exchange observation time; retrieved_at is PortfolioAI retrieval time.';
comment on table public.market_price_history is
  'Provider-independent daily OHLCV foundation. Stage 4 creates the model but does not run technical or risk engines.';
comment on table public.market_data_refresh_runs is
  'Auditable server-side refresh attempts; provider credentials and tokens are never stored here.';
comment on table public.market_data_mapping_reviews is
  'Quarantine for provider identity changes. A VERIFIED mapping remains unchanged until a separately reviewed transition is applied.';
comment on table public.market_data_operation_leases is
  'Server-only provider-wide distributed leases and cooldowns. Browser roles have no table or function privileges.';
