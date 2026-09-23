begin transaction read only;

with target as (
  select p.id, p.user_id
  from public.portfolios p
  where p.id = :'portfolio_id'::uuid
), registry as (
  select public.get_portfolio_coverage_registry_v1(t.id, t.user_id) as payload
  from target t
), holding_ids as (
  select (record ->> 'securityId')::uuid as security_id
  from registry r
  cross join lateral jsonb_array_elements(r.payload -> 'records') record
), rating_profiles as (
  select coalesce(jsonb_agg(distinct rule.scoring_profile order by rule.scoring_profile), '[]'::jsonb) as payload
  from public.scoring_model_metric_rules rule
  join public.scoring_models model on model.id = rule.scoring_model_id
  where model.code = 'PAI_STOCK_SCORE'
    and model.version = 1
    and rule.input_kind = 'EXTERNAL_RATING'
    and rule.rule_state in ('ACTIVE', 'REVIEWED')
), security_evidence as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'securityId', h.security_id,
    'marketIdentityState', case
      when m.mapping_status = 'VERIFIED' then 'VERIFIED'
      when m.mapping_status = 'AMBIGUOUS' then 'CONFLICTING'
      when m.mapping_status = 'INACTIVE' then 'REVIEW_REQUIRED'
      else 'MISSING'
    end,
    'marketMetricCodes', coalesce(mm.metric_codes, '[]'::jsonb),
    'externalRatings', jsonb_build_object(
      'count', coalesce(er.evidence_count, 0),
      'state', case
        when coalesce(er.evidence_count, 0) = 0 then 'MISSING'
        when er.has_conflict then 'CONFLICTING'
        when er.fresh_until is not null and er.fresh_until >= :'as_of_date'::date then 'FRESH'
        else 'STALE'
      end,
      'freshUntil', er.fresh_until
    ),
    'valuation', jsonb_build_object(
      'count', coalesce(v.evidence_count, 0),
      'state', case
        when coalesce(v.evidence_count, 0) = 0 then 'MISSING'
        when v.has_conflict then 'CONFLICTING'
        when v.fresh_until is not null and v.fresh_until >= :'as_of_date'::date then 'FRESH'
        else 'STALE'
      end,
      'freshUntil', v.fresh_until
    )
  ) order by h.security_id), '[]'::jsonb) as payload
  from holding_ids h
  left join lateral (
    select mapping_status
    from public.market_data_instrument_mappings
    where security_id = h.security_id and provider_code = 'ANGEL_ONE'
    order by updated_at desc
    limit 1
  ) m on true
  left join lateral (
    select jsonb_agg(distinct metric_code order by metric_code) as metric_codes
    from public.market_metric_observations
    where security_id = h.security_id
      and evidence_status = 'AVAILABLE'
      and metric_code in ('PRICE_MOMENTUM_6M', 'PRICE_MOMENTUM_12M', 'MAX_DRAWDOWN_1Y', 'VOLATILITY_1Y', 'RELATIVE_STRENGTH_12M', 'BENCHMARK_RELATIVE_VOLATILITY_1Y')
  ) mm on true
  left join lateral (
    select count(*)::int as evidence_count,
      bool_or(evidence_status in ('CONFLICTING', 'REVIEW_REQUIRED')) as has_conflict,
      max(fresh_until) as fresh_until
    from public.external_rating_observations
    where security_id = h.security_id
  ) er on true
  left join lateral (
    select count(*)::int as evidence_count,
      bool_or(evidence_status in ('CONFLICTING', 'REVIEW_REQUIRED')) as has_conflict,
      max(fresh_until) as fresh_until
    from public.fundamental_observations
    where security_id = h.security_id
      and metric_code in ('MARKET_CAP_PROVIDER_RAW', 'MARKET_CAP', 'PE_TTM', 'PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT', 'PBV_ADJUSTED_PROVIDER', 'EV_EBITDA', 'FCF_YIELD_PERCENT')
  ) v on true
), benchmark_evidence as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'benchmarkCode', b.code,
    'identityState', case when b.mapping_status = 'VERIFIED' then 'VERIFIED' when b.mapping_status = 'AMBIGUOUS' then 'CONFLICTING' else 'MISSING' end,
    'earliestStoredCandle', history.first_candle,
    'latestStoredCandle', history.latest_candle
  ) order by b.code), '[]'::jsonb) as payload
  from public.market_benchmarks b
  left join lateral (
    select min(period_start)::date as first_candle, max(period_start)::date as latest_candle
    from public.market_benchmark_price_history
    where benchmark_code = b.code and provider_code = 'ANGEL_ONE' and interval = 'ONE_DAY'
  ) history on true
  where b.code in ('NIFTY_BANK', 'NIFTY_PHARMA')
)
select jsonb_build_object(
  'version', 'PROGRAM_A_A1_CACHE_SNAPSHOT_V1',
  'asOfDate', :'as_of_date',
  'registry', r.payload,
  'securityEvidence', se.payload,
  'externalRatingRuleProfiles', rp.payload,
  'benchmarkEvidence', be.payload
)::text
from registry r
cross join security_evidence se
cross join rating_profiles rp
cross join benchmark_evidence be;

rollback;
