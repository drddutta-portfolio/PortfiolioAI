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
echo "LOCAL-ONLY: securities + derived reviewed Trendlyne identity evidence + EV_EBITDA definition"
echo

psql "$DB_URL" -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
begin;

do $$
declare
  v_tornt public.securities%rowtype;
  v_parent public.data_source_records%rowtype;
  v_payload jsonb;
  v_peer record;
  v_peer_security_id uuid;
  v_peer_source_id uuid;
begin
  select *
    into strict v_tornt
  from public.securities
  where symbol='TORNTPHARM'
    and exchange='NSE'
    and is_active is true
  order by created_at
  limit 1;

  select *
    into strict v_parent
  from public.data_source_records
  where source_code='TRENDLYNE_MCP'
    and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
  order by retrieved_at desc
  limit 1;

  for v_peer in
    select *
    from (
      values
        ('MANKIND','INE634S01028','Mankind Pharma Limited','Mankind Pharma','543904'),
        ('ERIS','INE406M01024','Eris Lifesciences Limited','Eris Lifesciences','540596'),
        ('EMCURE','INE168P01015','Emcure Pharmaceuticals Limited','Emcure Pharma','544210')
    ) as x(symbol, isin, canonical_name, observed_name, provider_instrument_id)
  loop
    insert into public.securities (
      symbol, exchange, isin, name, asset_class, instrument_type,
      sector_id, industry_id, currency, is_active, creation_source, series
    )
    select
      v_peer.symbol,
      'NSE',
      v_peer.isin,
      v_peer.canonical_name,
      'EQUITY',
      'EQ',
      v_tornt.sector_id,
      v_tornt.industry_id,
      'INR',
      true,
      'H2_LOCAL_VALUATION_PEER',
      'EQ'
    where not exists (
      select 1
      from public.securities s
      where s.symbol=v_peer.symbol
        and s.exchange='NSE'
    );

    select id
      into strict v_peer_security_id
    from public.securities
    where symbol=v_peer.symbol
      and exchange='NSE';

    if exists (
      select 1
      from public.securities
      where id=v_peer_security_id
        and isin is distinct from v_peer.isin
    ) then
      raise exception 'Existing local peer % conflicts with locked H2 ISIN %.', v_peer.symbol, v_peer.isin;
    end if;

    v_payload := jsonb_build_object(
      'derivation_kind','H2_LOCAL_REVIEWED_IDENTITY_PROMOTION',
      'parent_discovery_record_id',v_parent.id,
      'parent_record_kind',v_parent.record_kind,
      'symbol',v_peer.symbol,
      'isin',v_peer.isin,
      'observed_name',v_peer.observed_name,
      'observed_exchange','NSE',
      'observed_symbol',v_peer.symbol,
      'observed_series','EQ',
      'provider_instrument_id',v_peer.provider_instrument_id,
      'review_basis','OWNER_APPROVED_H2_LOCAL_PHARMA_VALUATION_PEER_IDENTITY'
    );

    insert into public.data_source_records (
      source_code,
      ingestion_run_id,
      record_kind,
      external_record_id,
      source_observed_at,
      retrieved_at,
      payload_hash,
      raw_payload,
      source_url,
      terms_snapshot,
      published_at
    )
    select
      'TRENDLYNE_MCP',
      null,
      'PHARMA_VALUATION_PEER_IDENTITY_DERIVED_V1',
      'H2_LOCAL_IDENTITY:' || v_peer.symbol || ':' || v_peer.provider_instrument_id || ':' || v_parent.id::text,
      v_parent.source_observed_at,
      v_parent.retrieved_at,
      encode(digest(v_payload::text, 'sha256'), 'hex'),
      v_payload,
      v_parent.source_url,
      v_parent.terms_snapshot,
      v_parent.published_at
    where not exists (
      select 1
      from public.data_source_records r
      where r.source_code='TRENDLYNE_MCP'
        and r.record_kind='PHARMA_VALUATION_PEER_IDENTITY_DERIVED_V1'
        and r.external_record_id='H2_LOCAL_IDENTITY:' || v_peer.symbol || ':' || v_peer.provider_instrument_id || ':' || v_parent.id::text
    );

    select id
      into strict v_peer_source_id
    from public.data_source_records
    where source_code='TRENDLYNE_MCP'
      and record_kind='PHARMA_VALUATION_PEER_IDENTITY_DERIVED_V1'
      and external_record_id='H2_LOCAL_IDENTITY:' || v_peer.symbol || ':' || v_peer.provider_instrument_id || ':' || v_parent.id::text
    order by created_at
    limit 1;

    if exists (
      select 1
      from public.security_identity_observations i
      where i.security_id=v_peer_security_id
        and i.source_code='TRENDLYNE_MCP'
        and i.evidence_status='MATCHED'
        and i.provider_instrument_id is distinct from v_peer.provider_instrument_id
    ) then
      raise exception 'Existing local matched Trendlyne identity for % conflicts with locked H2 provider instrument id %.',
        v_peer.symbol, v_peer.provider_instrument_id;
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
      v_peer_security_id,
      null,
      v_peer_source_id,
      'TRENDLYNE_MCP',
      v_peer.observed_name,
      v_peer.isin,
      'NSE',
      v_peer.symbol,
      'EQ',
      'MATCHED',
      1.0000,
      v_parent.retrieved_at,
      v_peer.provider_instrument_id
    where not exists (
      select 1
      from public.security_identity_observations i
      where i.source_record_id=v_peer_source_id
        and i.source_code='TRENDLYNE_MCP'
    );
  end loop;
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
\echo 'Derived identity evidence records'
select
  r.record_kind,
  r.external_record_id,
  r.raw_payload->>'symbol' as symbol,
  r.raw_payload->>'provider_instrument_id' as provider_instrument_id,
  r.raw_payload->>'parent_discovery_record_id' as parent_discovery_record_id
from public.data_source_records r
where r.source_code='TRENDLYNE_MCP'
  and r.record_kind='PHARMA_VALUATION_PEER_IDENTITY_DERIVED_V1'
order by case r.raw_payload->>'symbol'
  when 'MANKIND' then 1
  when 'ERIS' then 2
  when 'EMCURE' then 3
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
