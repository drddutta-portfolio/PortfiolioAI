#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }

case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*|postgresql://*@localhost:54322/*|postgres://*@localhost:54322/*)
    ;;
  *)
    echo "ERROR: Refusing to run: H2 peer setup is LOCAL-ONLY and requires localhost/127.0.0.1 port 54322." >&2
    exit 1
    ;;
esac

echo "H2 local Pharma valuation peer setup"
echo "LOCAL-ONLY: securities + reviewed Trendlyne identities + EV_EBITDA definition"
echo

psql "$DB_URL" -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
begin;

do $$
declare
  v_tornt public.securities%rowtype;
  v_source_id uuid;
  v_source_retrieved_at timestamptz;
begin
  select *
    into strict v_tornt
  from public.securities
  where symbol='TORNTPHARM'
    and exchange='NSE'
    and is_active is true
  order by created_at
  limit 1;

  select id, retrieved_at
    into strict v_source_id, v_source_retrieved_at
  from public.data_source_records
  where source_code='TRENDLYNE_MCP'
    and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
  order by retrieved_at desc
  limit 1;

  insert into public.securities (
    symbol, exchange, isin, name, asset_class, instrument_type,
    sector_id, industry_id, currency, is_active, creation_source, series
  )
  select
    x.symbol,
    'NSE',
    x.isin,
    x.name,
    'EQUITY',
    'EQ',
    v_tornt.sector_id,
    v_tornt.industry_id,
    'INR',
    true,
    'H2_LOCAL_VALUATION_PEER',
    'EQ'
  from (
    values
      ('MANKIND','INE634S01028','Mankind Pharma Limited'),
      ('ERIS','INE406M01024','Eris Lifesciences Limited'),
      ('EMCURE','INE168P01015','Emcure Pharmaceuticals Limited')
  ) as x(symbol, isin, name)
  where not exists (
    select 1
    from public.securities s
    where s.symbol=x.symbol
      and s.exchange='NSE'
  );

  if exists (
    select 1
    from public.securities s
    join (
      values
        ('MANKIND','INE634S01028'),
        ('ERIS','INE406M01024'),
        ('EMCURE','INE168P01015')
    ) as x(symbol, isin)
      on x.symbol=s.symbol
    where s.exchange='NSE'
      and s.isin is distinct from x.isin
  ) then
    raise exception 'Existing local peer security conflicts with locked H2 ISIN.';
  end if;

  insert into public.security_identity_observations (
    security_id,
    listing_id,
    source_record_id,
    source_code,
    observed_name,
    observed_isin,
    observed_exchange,
    observed_symbol,
    observed_series,
    evidence_status,
    confidence,
    observed_at,
    provider_instrument_id
  )
  select
    s.id,
    null,
    v_source_id,
    'TRENDLYNE_MCP',
    x.observed_name,
    x.isin,
    'NSE',
    x.symbol,
    'EQ',
    'MATCHED',
    1.0000,
    v_source_retrieved_at,
    x.provider_instrument_id
  from (
    values
      ('MANKIND','INE634S01028','Mankind Pharma','543904'),
      ('ERIS','INE406M01024','Eris Lifesciences','540596'),
      ('EMCURE','INE168P01015','Emcure Pharma','544210')
  ) as x(symbol, isin, observed_name, provider_instrument_id)
  join public.securities s
    on s.symbol=x.symbol
   and s.exchange='NSE'
  where not exists (
    select 1
    from public.security_identity_observations i
    where i.security_id=s.id
      and i.source_code='TRENDLYNE_MCP'
      and i.provider_instrument_id=x.provider_instrument_id
      and i.evidence_status='MATCHED'
  );

  if exists (
    select 1
    from public.security_identity_observations i
    join public.securities s on s.id=i.security_id
    join (
      values
        ('MANKIND','543904'),
        ('ERIS','540596'),
        ('EMCURE','544210')
    ) as x(symbol, provider_instrument_id)
      on x.symbol=s.symbol
    where i.source_code='TRENDLYNE_MCP'
      and i.evidence_status='MATCHED'
      and i.provider_instrument_id is distinct from x.provider_instrument_id
  ) then
    raise exception 'Existing local matched Trendlyne identity conflicts with locked H2 provider instrument id.';
  end if;
end $$;

insert into public.fundamental_metric_definitions (
  code,
  name,
  value_kind,
  canonical_unit,
  statement_scope,
  freshness_seconds,
  definition,
  is_active
)
select
  'EV_EBITDA',
  'Enterprise value to EBITDA annual',
  'NUMERIC',
  'RATIO',
  'VALUATION',
  86400,
  jsonb_build_object(
    'provider','TRENDLYNE_MCP',
    'selection','REVIEWED',
    'period_type','ANNUAL',
    'provider_label','EV Per EBITDA Ann.',
    'mapping_version','pharma-valuation-h2-v1',
    'semantic_guard','VALUATION_MULTIPLE_NOT_EBITDA_AMOUNT'
  ),
  true
where not exists (
  select 1
  from public.fundamental_metric_definitions
  where code='EV_EBITDA'
);

do $$
begin
  if not exists (
    select 1
    from public.fundamental_metric_definitions
    where code='EV_EBITDA'
      and value_kind='NUMERIC'
      and canonical_unit='RATIO'
      and statement_scope='VALUATION'
      and freshness_seconds=86400
      and is_active is true
      and definition->>'provider_label'='EV Per EBITDA Ann.'
  ) then
    raise exception 'EV_EBITDA definition does not match locked H2 valuation contract.';
  end if;
end $$;

commit;

\echo
\echo 'Local peer securities'
select symbol, exchange, isin, name, asset_class, instrument_type, creation_source, series
from public.securities
where symbol in ('TORNTPHARM','MANKIND','ERIS','EMCURE')
order by case symbol
  when 'TORNTPHARM' then 1
  when 'MANKIND' then 2
  when 'ERIS' then 3
  when 'EMCURE' then 4
end;

\echo
\echo 'Reviewed Trendlyne identities'
select
  s.symbol,
  i.provider_instrument_id,
  i.observed_isin,
  i.observed_symbol,
  i.evidence_status,
  i.confidence
from public.security_identity_observations i
join public.securities s on s.id=i.security_id
where i.source_code='TRENDLYNE_MCP'
  and s.symbol in ('MANKIND','ERIS','EMCURE')
order by case s.symbol
  when 'MANKIND' then 1
  when 'ERIS' then 2
  when 'EMCURE' then 3
end;

\echo
\echo 'Locked valuation metric definitions'
select code, name, canonical_unit, statement_scope, freshness_seconds, definition->>'provider_label' as provider_label
from public.fundamental_metric_definitions
where code in ('PE_TTM','EV_EBITDA')
order by code;

\echo
\echo 'Valuation observations remain intentionally absent at setup stage'
select count(*) as valuation_observations
from public.fundamental_observations f
join public.securities s on s.id=f.security_id
where s.symbol in ('TORNTPHARM','MANKIND','ERIS','EMCURE')
  and f.metric_code in ('PE_TTM','EV_EBITDA');
SQL

echo
echo "PASS: local-only H2 peer/identity/metric setup completed."
echo "No provider call was made. No production database was contacted."
echo "No fundamental valuation observation was created."
