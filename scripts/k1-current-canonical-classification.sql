-- Gate K · K1
-- Read-only current canonical classification snapshot for the active portfolio.
--
-- Usage example with psql:
--   psql "$DATABASE_URL" -Atf scripts/k1-current-canonical-classification.sql --     > artifacts/k1-current-canonical-classification.json
--
-- This file performs SELECTs only. It does not mutate classification,
-- evidence, scores, recommendations, schedulers, or portfolio state.

with active_portfolio as (
  select id
  from public.portfolios
  where is_active = true
  order by created_at
  limit 1
),
sector_decision as (
  select
    d.security_id,
    o.source_code,
    o.retrieved_at,
    o.evidence_status
  from public.security_attribute_decisions d
  join public.security_attribute_observations o
    on o.id = d.selected_observation_id
  where d.attribute_code = 'SECTOR'
),
industry_decision as (
  select
    d.security_id,
    o.source_code,
    o.retrieved_at,
    o.evidence_status
  from public.security_attribute_decisions d
  join public.security_attribute_observations o
    on o.id = d.selected_observation_id
  where d.attribute_code = 'INDUSTRY'
),
rows as (
  select
    s.symbol,
    s.id as security_id,
    s.isin,
    s.exchange,
    s.asset_class,
    s.instrument_type,
    e.sector,
    e.industry,
    e.enrichment_state,
    sd.source_code as sector_source,
    sd.evidence_status as sector_evidence_state,
    id.source_code as industry_source,
    id.evidence_status as industry_evidence_state
  from public.current_holdings h
  join active_portfolio ap
    on ap.id = h.portfolio_id
  join public.securities s
    on s.id = h.security_id
  left join public.current_security_enrichment_v1 e
    on e.security_id = h.security_id
  left join sector_decision sd
    on sd.security_id = h.security_id
  left join industry_decision id
    on id.security_id = h.security_id
  where h.current_quantity > 0
    and s.asset_class = 'EQUITY'
    and s.exchange = 'NSE'
)
select jsonb_pretty(
  jsonb_build_object(
    'contract', 'PORTFOLIOAI_K1_CURRENT_CANONICAL_CLASSIFICATION_V1',
    'generatedAt', clock_timestamp(),
    'rowCount', count(*),
    'rows', jsonb_agg(
      jsonb_build_object(
        'symbol', symbol,
        'securityId', security_id,
        'isin', isin,
        'exchange', exchange,
        'assetClass', asset_class,
        'instrumentType', instrument_type,
        'sector', sector,
        'industry', industry,
        'enrichmentState', enrichment_state,
        'sectorSource', sector_source,
        'sectorEvidenceState', sector_evidence_state,
        'industrySource', industry_source,
        'industryEvidenceState', industry_evidence_state
      )
      order by symbol
    )
  )
)
from rows;
