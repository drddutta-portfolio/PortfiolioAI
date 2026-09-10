insert into public.data_sources (
  code, name, source_kind, evidence_priority, is_active,
  entitlement_verified, retention_rights_verified, capabilities, configuration
) values (
  'COMPANY_EXCHANGE_FILING',
  'Company / exchange primary filing',
  'PUBLIC_WEB',
  15,
  true,
  true,
  true,
  '{"fundamentals":true,"quarterly_business_updates":true,"primary_evidence":true}'::jsonb,
  '{"retention_scope":"metadata_and_extracted_public_facts_only","document_body_retained":false}'::jsonb
)
on conflict (code) do update set
  name = excluded.name,
  source_kind = excluded.source_kind,
  evidence_priority = excluded.evidence_priority,
  is_active = excluded.is_active,
  entitlement_verified = excluded.entitlement_verified,
  retention_rights_verified = excluded.retention_rights_verified,
  capabilities = excluded.capabilities,
  configuration = excluded.configuration,
  updated_at = now();

insert into public.fundamental_metric_definitions (
  code, name, value_kind, canonical_unit, statement_scope,
  freshness_seconds, definition, is_active
) values
(
  'ADVANCES_GROWTH_YOY',
  'Gross Advances Growth YoY',
  'NUMERIC',
  'PERCENT',
  'BANKING',
  10368000,
  '{"provider":"COMPANY_EXCHANGE_FILING","selection":"REVIEWED","period_type":"QUARTER","provider_label":"Gross advances - Period end YoY growth %","mapping_version":"bank-primary-filing-v1","semantic_note":"Period-end gross advances year-on-year growth; do not substitute advances under management."}'::jsonb,
  true
),
(
  'DEPOSITS_GROWTH_YOY',
  'Deposits Growth YoY',
  'NUMERIC',
  'PERCENT',
  'BANKING',
  10368000,
  '{"provider":"COMPANY_EXCHANGE_FILING","selection":"REVIEWED","period_type":"QUARTER","provider_label":"Deposits - Period end YoY growth %","mapping_version":"bank-primary-filing-v1","semantic_note":"Period-end total deposits year-on-year growth."}'::jsonb,
  true
)
on conflict (code) do update set
  name = excluded.name,
  value_kind = excluded.value_kind,
  canonical_unit = excluded.canonical_unit,
  statement_scope = excluded.statement_scope,
  freshness_seconds = excluded.freshness_seconds,
  definition = excluded.definition,
  is_active = excluded.is_active;

with payload as (
  select jsonb_build_object(
    'issuer', 'HDFC Bank Limited',
    'symbol', 'HDFCBANK',
    'period_end', '2026-06-30',
    'filing_type', 'Quarterly business update',
    'gross_advances_period_end_inr_billion', 30610,
    'gross_advances_yoy_percent', 15.4,
    'deposits_period_end_inr_billion', 31705,
    'deposits_yoy_percent', 14.7,
    'prior_gross_advances_period_end_inr_billion', 26532,
    'prior_deposits_period_end_inr_billion', 27641,
    'semantic_scope', 'Period-end reported business volumes; extracted public facts only',
    'source_note', 'HDFC Bank company disclosure / exchange filing, also furnished as SEC Form 6-K exhibit'
  ) as raw_payload
), inserted as (
  insert into public.data_source_records (
    source_code, record_kind, external_record_id, source_observed_at,
    retrieved_at, payload_hash, raw_payload, source_url, terms_snapshot, published_at
  )
  select
    'COMPANY_EXCHANGE_FILING',
    'QUARTERLY_BUSINESS_UPDATE',
    'HDFCBANK:2026-06-30:BUSINESS_UPDATE',
    '2026-06-30T00:00:00Z'::timestamptz,
    now(),
    encode(digest(raw_payload::text, 'sha256'), 'hex'),
    raw_payload,
    'https://www.sec.gov/Archives/edgar/data/1144967/000119312526295655/d937986dex99.htm',
    '{"public_facts_only":true,"document_body_retained":false,"source_class":"issuer_exchange_disclosure"}'::jsonb,
    '2026-07-04T00:00:00Z'::timestamptz
  from payload
  on conflict (source_code, record_kind, external_record_id, payload_hash) do nothing
  returning id
), source_record as (
  select id from inserted
  union all
  select dsr.id
  from public.data_source_records dsr, payload
  where dsr.source_code = 'COMPANY_EXCHANGE_FILING'
    and dsr.record_kind = 'QUARTERLY_BUSINESS_UPDATE'
    and dsr.external_record_id = 'HDFCBANK:2026-06-30:BUSINESS_UPDATE'
    and dsr.payload_hash = encode(digest(payload.raw_payload::text, 'sha256'), 'hex')
  limit 1
), target_security as (
  select id
  from public.securities
  where symbol = 'HDFCBANK' and asset_class = 'EQUITY'
  order by created_at asc
  limit 1
)
insert into public.fundamental_observations (
  security_id, metric_code, source_record_id, source_code, numeric_value,
  currency, unit, period_start, period_end, period_type, accounting_standard,
  consolidation_scope, observed_at, retrieved_at, fresh_until, evidence_status, published_at
)
select
  s.id,
  v.metric_code,
  r.id,
  'COMPANY_EXCHANGE_FILING',
  v.numeric_value,
  null,
  'PERCENT',
  null,
  '2026-06-30'::date,
  'QUARTER',
  null,
  'STANDALONE',
  '2026-06-30T00:00:00Z'::timestamptz,
  now(),
  '2026-10-28T00:00:00Z'::timestamptz,
  'AVAILABLE',
  '2026-07-04T00:00:00Z'::timestamptz
from target_security s
cross join source_record r
cross join (values
  ('ADVANCES_GROWTH_YOY'::text, 15.4::numeric),
  ('DEPOSITS_GROWTH_YOY'::text, 14.7::numeric)
) as v(metric_code, numeric_value)
on conflict (security_id, metric_code, source_code, period_end, period_type, consolidation_scope, source_record_id)
do update set
  numeric_value = excluded.numeric_value,
  unit = excluded.unit,
  observed_at = excluded.observed_at,
  retrieved_at = excluded.retrieved_at,
  fresh_until = excluded.fresh_until,
  evidence_status = excluded.evidence_status,
  published_at = excluded.published_at;

update public.scoring_model_metric_rules r
set
  preferred_source = 'COMPANY_EXCHANGE_FILING',
  provider_field_contract = case
    when r.input_code = 'ADVANCES_GROWTH_YOY' then 'Gross advances - Period end YoY growth %'
    when r.input_code = 'DEPOSITS_GROWTH_YOY' then 'Deposits - Period end YoY growth %'
    else r.provider_field_contract
  end,
  rule_state = 'REVIEWED',
  updated_at = now()
from public.scoring_models m
where r.scoring_model_id = m.id
  and m.code = 'PAI_STOCK_SCORE'
  and m.version = 1
  and r.scoring_profile = 'BANK_NBFC'
  and r.dimension_code = 'GROWTH'
  and r.input_code in ('ADVANCES_GROWTH_YOY', 'DEPOSITS_GROWTH_YOY');
