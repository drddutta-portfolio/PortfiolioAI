-- PortfolioAI Post-D P4 terminal readiness V2 materialization.
-- Development-only operational script. Invoke only against project
-- lrgpjimipfkyoqbpsqzz. This is an append-only data reconciliation; it does not
-- change schema and does not overwrite the V1 terminal evidence.

begin;

do $$
begin
  if not exists (
    select 1
    from public.portfolios
    where id = '6193a4aa-3235-4057-bddc-209fcf443fc2'::uuid
  ) then
    raise exception 'P4_DEV_PORTFOLIO_NOT_FOUND';
  end if;
end
$$;

with v1 as (
  select distinct on ((raw_payload->>'security_id')::uuid)
         (raw_payload->>'security_id')::uuid as security_id,
         raw_payload,
         retrieved_at
  from public.data_source_records
  where record_kind = 'P4B_TERMINAL_READINESS'
    and raw_payload->>'project_ref' = 'lrgpjimipfkyoqbpsqzz'
    and raw_payload->>'portfolio_id' = '6193a4aa-3235-4057-bddc-209fcf443fc2'
  order by (raw_payload->>'security_id')::uuid, retrieved_at desc
),
profile_ready as (
  select security_id
  from public.research_subprofile_assignments
  where assignment_status = 'REVIEWED'
    and effective_to is null
  union
  select security_id
  from public.security_scoring_profile_assignments
  where assignment_status = 'REVIEWED'
),
payloads as (
  select v1.security_id,
         jsonb_build_object(
           'contract', 'PORTFOLIOAI_POST_D_P4_TERMINAL_READINESS_V2',
           'environment', 'PortfolioAI Dev',
           'project_ref', 'lrgpjimipfkyoqbpsqzz',
           'portfolio_id', '6193a4aa-3235-4057-bddc-209fcf443fc2',
           'security_id', v1.security_id,
           'symbol', v1.raw_payload->>'symbol',
           'asset_class', v1.raw_payload->>'asset_class',
           'evaluated_at', v1.raw_payload->>'evaluated_at',
           'overall_state', case
             when v1.raw_payload->>'asset_class' <> 'EQUITY' then 'NOT_APPLICABLE'
             when v1.raw_payload#>>'{domains,research_evidence,state}' = 'BLOCKED' then 'BLOCKED'
             when pr.security_id is null then 'OWNER_DEFERRED'
             else 'READY'
           end,
           'domains', jsonb_build_object(
             'identity_eligibility', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,trendlyne_identity,state}',
               'reason', v1.raw_payload#>>'{domains,trendlyne_identity,reason}',
               'angel_mapping_state', v1.raw_payload#>>'{domains,angel_mapping,state}'
             ),
             'classification_methodology', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,classification,state}',
               'reason', v1.raw_payload#>>'{domains,classification,reason}',
               'sector', v1.raw_payload#>>'{domains,classification,sector}',
               'industry', v1.raw_payload#>>'{domains,classification,industry}',
               'routing_rule', 'INDUSTRY_FIRST_FAIL_CLOSED'
             ),
             'current_price', v1.raw_payload->'domains'->'current_price',
             'historical_price_benchmark', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,market_history,state}',
               'reason', v1.raw_payload#>>'{domains,market_history,reason}',
               'history_rows', v1.raw_payload#>>'{domains,market_history,rows}',
               'derived_metric_state', v1.raw_payload#>>'{domains,derived_market_metrics,state}',
               'derived_metric_reason', v1.raw_payload#>>'{domains,derived_market_metrics,reason}',
               'available_metric_count', v1.raw_payload#>>'{domains,derived_market_metrics,available_metric_count}',
               'benchmark_state', 'NOT_APPLICABLE',
               'benchmark_reason', 'BENCHMARK_EXECUTION_EXCLUDED_BY_APPROVED_P4_CONTRACT'
             ),
             'fundamental_evidence', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,research_evidence,state}',
               'reason', v1.raw_payload#>>'{domains,research_evidence,reason}',
               'fresh', v1.raw_payload#>>'{domains,research_evidence,fundamentals_fresh}'
             ),
             'valuation_evidence', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,research_evidence,state}',
               'reason', v1.raw_payload#>>'{domains,research_evidence,reason}',
               'semantic_boundary', 'PROVIDER_VALUATION_EVIDENCE_ONLY_NO_P5_SCORE'
             ),
             'ownership_governance_evidence', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,research_evidence,state}',
               'reason', v1.raw_payload#>>'{domains,research_evidence,reason}',
               'fresh', v1.raw_payload#>>'{domains,research_evidence,ownership_fresh}'
             ),
             'documents', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,research_evidence,state}',
               'reason', v1.raw_payload#>>'{domains,research_evidence,reason}',
               'fresh', v1.raw_payload#>>'{domains,research_evidence,document_discovery_fresh}'
             ),
             'freshness_conflict', jsonb_build_object(
               'state', v1.raw_payload#>>'{domains,research_evidence,state}',
               'reason', v1.raw_payload#>>'{domains,research_evidence,reason}',
               'classification_conflict', false,
               'missing_values_coerced_to_zero', false
             ),
             'profile_readiness', jsonb_build_object(
               'state', case
                 when v1.raw_payload->>'asset_class' <> 'EQUITY' then 'NOT_APPLICABLE'
                 when pr.security_id is not null then 'READY'
                 else 'OWNER_DEFERRED'
               end,
               'reason', case
                 when v1.raw_payload->>'asset_class' <> 'EQUITY' then 'COMPANY_RESEARCH_NOT_APPLICABLE'
                 when pr.security_id is not null then null
                 else 'METHODOLOGY_PROFILE_RESOLUTION_DEFERRED_TO_P5'
               end,
               'p5_execution_authorized', false
             )
           )
         ) as payload
  from v1
  left join profile_ready pr on pr.security_id = v1.security_id
),
inserted as (
  insert into public.data_source_records (
    id,
    source_code,
    record_kind,
    external_record_id,
    retrieved_at,
    payload_hash,
    raw_payload,
    terms_snapshot
  )
  select gen_random_uuid(),
         'OWNER_REVIEWED_CLASSIFICATION',
         'P4_TERMINAL_READINESS_V2',
         'P4V2:' || security_id::text,
         now(),
         encode(digest(convert_to(payload::text, 'UTF8'), 'sha256'), 'hex'),
         payload,
         jsonb_build_object(
           'mode', 'POST_D_P4_FINAL_TERMINAL_RECONCILIATION_V2',
           'owner_checkpoint', '4B',
           'production_impact', false,
           'unknown_allowed', false,
           'p5_authorized', false
         )
  from payloads
  on conflict (source_code, record_kind, external_record_id, payload_hash)
  do nothing
  returning id
)
select count(*) as inserted_records from inserted;

do $$
declare
  record_count integer;
  unknown_count integer;
  domain_count integer;
begin
  select count(distinct external_record_id),
         count(*) filter (where raw_payload::text like '%"UNKNOWN"%'),
         min((select count(*) from jsonb_object_keys(raw_payload->'domains')))
  into record_count, unknown_count, domain_count
  from public.data_source_records
  where record_kind = 'P4_TERMINAL_READINESS_V2';

  if record_count <> 248 then
    raise exception 'P4_V2_TERMINAL_COUNT_MISMATCH:%', record_count;
  end if;
  if unknown_count <> 0 then
    raise exception 'P4_V2_UNKNOWN_STATE_COUNT:%', unknown_count;
  end if;
  if domain_count <> 10 then
    raise exception 'P4_V2_DOMAIN_COUNT_MISMATCH:%', domain_count;
  end if;
end
$$;

commit;
