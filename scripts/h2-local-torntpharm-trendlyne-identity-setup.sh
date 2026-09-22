#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }

case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*|postgresql://*@localhost:54322/*|postgres://*@localhost:54322/*) ;;
  *) echo "ERROR: LOCAL-ONLY script requires localhost/127.0.0.1 port 54322." >&2; exit 1 ;;
esac

echo "H2 local TORNTPHARM Trendlyne identity setup"
echo "ZERO PROVIDER CALLS: derives reviewed identity from captured H2 discovery evidence"
echo

psql "$DB_URL" -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
begin;

do $$
declare
  v_security_id uuid;
  v_parent public.data_source_records%rowtype;
  v_payload jsonb;
  v_source_id uuid;
begin
  select id into strict v_security_id
  from public.securities
  where symbol='TORNTPHARM'
    and exchange='NSE'
    and is_active is true
  order by created_at
  limit 1;

  select * into strict v_parent
  from public.data_source_records
  where source_code='TRENDLYNE_MCP'
    and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
  order by retrieved_at desc
  limit 1;

  if exists (
    select 1
    from public.security_identity_observations i
    where i.security_id=v_security_id
      and i.source_code='TRENDLYNE_MCP'
      and i.evidence_status='MATCHED'
      and i.provider_instrument_id is distinct from '1409'
  ) then
    raise exception 'Existing matched TORNTPHARM Trendlyne identity conflicts with locked provider instrument id 1409.';
  end if;

  if exists (
    select 1
    from public.security_identity_observations i
    where i.security_id=v_security_id
      and i.source_code='TRENDLYNE_MCP'
      and i.evidence_status='MATCHED'
      and i.provider_instrument_id='1409'
  ) then
    return;
  end if;

  v_payload := jsonb_build_object(
    'derivation_kind','H2_LOCAL_REVIEWED_IDENTITY_PROMOTION',
    'parent_discovery_record_id',v_parent.id,
    'parent_record_kind',v_parent.record_kind,
    'symbol','TORNTPHARM',
    'observed_name','Torrent Pharma',
    'observed_exchange','NSE',
    'observed_symbol','TORNTPHARM',
    'observed_series','EQ',
    'provider_instrument_id','1409',
    'review_basis','H2_CAPTURED_VALUATION_DISCOVERY_REFERENCE_IDENTITY'
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
    'PHARMA_VALUATION_TARGET_IDENTITY_DERIVED_V1',
    'H2_LOCAL_IDENTITY:TORNTPHARM:1409:' || v_parent.id::text,
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
      and r.record_kind='PHARMA_VALUATION_TARGET_IDENTITY_DERIVED_V1'
      and r.external_record_id='H2_LOCAL_IDENTITY:TORNTPHARM:1409:' || v_parent.id::text
  );

  select id into strict v_source_id
  from public.data_source_records
  where source_code='TRENDLYNE_MCP'
    and record_kind='PHARMA_VALUATION_TARGET_IDENTITY_DERIVED_V1'
    and external_record_id='H2_LOCAL_IDENTITY:TORNTPHARM:1409:' || v_parent.id::text
  order by created_at
  limit 1;

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
  values (
    v_security_id,
    null,
    v_source_id,
    'TRENDLYNE_MCP',
    'Torrent Pharma',
    null,
    'NSE',
    'TORNTPHARM',
    'EQ',
    'MATCHED',
    1.0000,
    v_parent.retrieved_at,
    '1409'
  );
end $$;

commit;

select
  s.symbol,
  i.provider_instrument_id,
  i.observed_symbol,
  i.evidence_status,
  i.confidence,
  r.record_kind,
  r.raw_payload->>'parent_discovery_record_id' as parent_discovery_record_id
from public.security_identity_observations i
join public.securities s on s.id=i.security_id
join public.data_source_records r on r.id=i.source_record_id
where s.symbol='TORNTPHARM'
  and i.source_code='TRENDLYNE_MCP'
  and i.evidence_status='MATCHED'
order by i.created_at desc;
SQL

echo
echo "PASS: local TORNTPHARM Trendlyne identity is ready."
echo "No provider call was made. Production was not contacted."
