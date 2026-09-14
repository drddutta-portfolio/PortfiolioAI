create or replace function public.get_portfolio_coverage_registry_v1(
  p_portfolio_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.portfolios p
    where p.id = p_portfolio_id
      and p.user_id = p_user_id
  ) then
    raise exception 'PORTFOLIO_NOT_AUTHORIZED' using errcode = '42501';
  end if;

  with holdings as (
    select ch.portfolio_id, ch.security_id, ch.current_quantity, s.symbol, s.asset_class
    from public.current_holdings ch
    join public.securities s on s.id = ch.security_id
    where ch.portfolio_id = p_portfolio_id
      and ch.current_quantity > 0
  ), latest_refresh as (
    select security_id, data_domain, source_code, refresh_status, fresh_until, next_eligible_refresh_at,
           last_safe_error_code, updated_at,
           row_number() over (partition by security_id, data_domain order by updated_at desc, source_code) as rn
    from public.security_refresh_states
    where security_id in (select security_id from holdings)
  ), refresh as (
    select security_id,
      max(source_code) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_source,
      max(refresh_status) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_status,
      max(fresh_until) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_next_refresh,
      max(last_safe_error_code) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_error,
      max(source_code) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_source,
      max(refresh_status) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_status,
      max(fresh_until) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_next_refresh,
      max(source_code) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_source,
      max(refresh_status) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_status,
      max(fresh_until) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_next_refresh,
      max(source_code) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_source,
      max(refresh_status) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_status,
      max(fresh_until) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_next_refresh
    from latest_refresh
    where rn = 1
    group by security_id
  ), fundamentals as (
    select security_id,
           count(*)::int as observation_count,
           max(fresh_until) as evidence_fresh_until,
           bool_or(evidence_status = 'CONFLICTING') as has_conflicting_evidence
    from public.fundamental_observations
    where security_id in (select security_id from holdings)
    group by security_id
  ), decisions as (
    select security_id,
           count(*) filter (where selected_observation_id is not null)::int as selected_decision_count,
           max(decided_at) filter (where selected_observation_id is not null) as latest_decision_at
    from public.fundamental_observation_decisions
    where security_id in (select security_id from holdings)
    group by security_id
  ), documents as (
    select security_id,
           count(*)::int as document_count,
           max(coalesce(published_at, created_at)) as latest_document_at
    from public.research_documents
    where security_id in (select security_id from holdings)
    group by security_id
  ), market_history as (
    select security_id,
           count(*)::int as candle_count,
           min(period_start) as first_candle_at,
           max(period_start) as latest_candle_at,
           max(retrieved_at) as latest_retrieved_at
    from public.market_price_history
    where security_id in (select security_id from holdings)
      and provider_code = 'ANGEL_ONE'
      and interval = 'ONE_DAY'
    group by security_id
  ), scoring_assignment_ranked as (
    select a.*,
           row_number() over (
             partition by a.security_id
             order by coalesce(a.reviewed_at, a.assigned_at) desc nulls last, a.assigned_at desc
           ) as rn
    from public.security_scoring_profile_assignments a
    where a.security_id in (select security_id from holdings)
  ), score_ranked as (
    select sr.*,
           row_number() over (partition by sr.security_id order by sr.created_at desc, sr.id desc) as rn
    from public.stock_score_runs sr
    where sr.security_id in (select security_id from holdings)
  ), recommendation_ranked as (
    select rr.*,
           row_number() over (partition by rr.security_id order by rr.created_at desc, rr.id desc) as rn
    from public.stock_recommendation_runs rr
    where rr.portfolio_id = p_portfolio_id
      and rr.security_id in (select security_id from holdings)
  ), records as (
    select h.symbol,
      jsonb_build_object(
        'portfolioId', h.portfolio_id,
        'securityId', h.security_id,
        'symbol', h.symbol,
        'assetClass', h.asset_class,
        'currentQuantity', h.current_quantity::text,
        'classification', jsonb_build_object(
          'sector', e.sector,
          'industry', e.industry,
          'marketCapCategory', e.market_cap_category,
          'enrichmentState', e.enrichment_state,
          'freshUntil', e.fresh_until
        ),
        'identityCoverage', jsonb_build_object(
          'state', case
            when r.identity_status = 'FRESH' then 'FRESH'
            when r.identity_error is not null then 'REVIEW_REQUIRED'
            else 'MISSING'
          end,
          'sourceCode', r.identity_source,
          'freshUntil', r.identity_fresh_until,
          'nextEligibleRefreshAt', r.identity_next_refresh,
          'estimatedProviderCalls', 0
        ),
        'fundamentalsCoverage', jsonb_build_object(
          'state', case
            when coalesce(f.observation_count, 0) = 0 then 'MISSING'
            when coalesce(f.has_conflicting_evidence, false) and coalesce(d.selected_decision_count, 0) = 0 then 'CONFLICTING'
            when r.fundamentals_status = 'FRESH' then 'FRESH'
            else 'STALE'
          end,
          'sourceCode', coalesce(r.fundamentals_source, 'TRENDLYNE_MCP'),
          'freshUntil', coalesce(r.fundamentals_fresh_until, f.evidence_fresh_until),
          'nextEligibleRefreshAt', r.fundamentals_next_refresh,
          'estimatedProviderCalls', 0,
          'observationCount', coalesce(f.observation_count, 0),
          'selectedDecisionCount', coalesce(d.selected_decision_count, 0),
          'hasConflictingEvidence', coalesce(f.has_conflicting_evidence, false),
          'latestDecisionAt', d.latest_decision_at
        ),
        'ownershipCoverage', jsonb_build_object(
          'state', case
            when r.ownership_status = 'FRESH' then 'FRESH'
            when r.ownership_status = 'STALE' then 'STALE'
            else 'MISSING'
          end,
          'sourceCode', r.ownership_source,
          'freshUntil', r.ownership_fresh_until,
          'nextEligibleRefreshAt', r.ownership_next_refresh,
          'estimatedProviderCalls', 0
        ),
        'documentsCoverage', jsonb_build_object(
          'state', case
            when coalesce(doc.document_count, 0) = 0 then 'MISSING'
            when r.documents_status = 'FRESH' then 'FRESH'
            else 'STALE'
          end,
          'sourceCode', r.documents_source,
          'freshUntil', r.documents_fresh_until,
          'nextEligibleRefreshAt', r.documents_next_refresh,
          'estimatedProviderCalls', 0,
          'documentCount', coalesce(doc.document_count, 0),
          'latestDocumentAt', doc.latest_document_at
        ),
        'marketHistoryCoverage', jsonb_build_object(
          'state', case
            when coalesce(mh.candle_count, 0) = 0 then 'MISSING'
            when mh.candle_count >= 200 then 'FRESH'
            else 'STALE'
          end,
          'sourceCode', case when coalesce(mh.candle_count, 0) > 0 then 'ANGEL_ONE' else null end,
          'freshUntil', null,
          'nextEligibleRefreshAt', null,
          'estimatedProviderCalls', 0,
          'candleCount', coalesce(mh.candle_count, 0),
          'firstCandleAt', mh.first_candle_at,
          'latestCandleAt', mh.latest_candle_at,
          'latestRetrievedAt', mh.latest_retrieved_at
        ),
        'scoringProfileAssignment', case when spa.security_id is null then null else jsonb_build_object(
          'profileCode', spa.scoring_profile_code,
          'assignmentStatus', spa.assignment_status,
          'assignmentBasis', spa.assignment_basis,
          'assignedAt', spa.assigned_at,
          'reviewedAt', spa.reviewed_at
        ) end,
        'latestScoreRun', case when scr.id is null then null else jsonb_build_object(
          'id', scr.id,
          'scoringProfile', scr.scoring_profile,
          'runState', scr.run_state,
          'evidenceCoverage', scr.evidence_coverage,
          'evidenceConfidence', scr.evidence_confidence,
          'asOfDate', scr.as_of_date,
          'createdAt', scr.created_at
        ) end,
        'latestRecommendationRun', case when rec.id is null then null else jsonb_build_object(
          'id', rec.id,
          'sourceScoreRunId', rec.source_score_run_id,
          'runState', rec.run_state,
          'transitionStatus', rec.transition_status,
          'scoreReadyCoverage', rec.score_ready_coverage,
          'evidenceConfidence', rec.evidence_confidence,
          'createdAt', rec.created_at
        ) end,
        'sizingPersistenceAvailable', false
      ) as record
    from holdings h
    left join public.current_security_enrichment_v1 e on e.security_id = h.security_id
    left join refresh r on r.security_id = h.security_id
    left join fundamentals f on f.security_id = h.security_id
    left join decisions d on d.security_id = h.security_id
    left join documents doc on doc.security_id = h.security_id
    left join market_history mh on mh.security_id = h.security_id
    left join scoring_assignment_ranked spa on spa.security_id = h.security_id and spa.rn = 1
    left join score_ranked scr on scr.security_id = h.security_id and scr.rn = 1
    left join recommendation_ranked rec on rec.security_id = h.security_id and rec.rn = 1
  )
  select jsonb_build_object(
    'registryVersion', 'PORTFOLIO_COVERAGE_V1',
    'generatedAt', clock_timestamp(),
    'providerCalls', 0,
    'budgetConsumed', 0,
    'records', coalesce(jsonb_agg(record order by symbol), '[]'::jsonb)
  )
  into v_result
  from records;

  return v_result;
end;
$$;

revoke all on function public.get_portfolio_coverage_registry_v1(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_portfolio_coverage_registry_v1(uuid, uuid) to service_role;
