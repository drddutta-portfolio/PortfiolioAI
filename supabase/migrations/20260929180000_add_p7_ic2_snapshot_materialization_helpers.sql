-- Service-only cache projection and atomic append helper for P7-IC IC2.

create function public.p7_ic2_cache_facts_v1(p_portfolio_id uuid)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  with held as (
    select s.id, s.symbol, s.isin, s.exchange
    from public.current_holdings h
    join public.securities s on s.id = h.security_id
    where h.portfolio_id = p_portfolio_id
      and h.current_quantity > 0
      and s.asset_class = 'EQUITY'
  ), histories as (
    select h.security_id, count(*) filter (where h.interval = 'ONE_DAY') as sessions,
           max(h.period_start) filter (where h.interval = 'ONE_DAY') as latest_session,
           max(h.retrieved_at) as retrieved_at
    from public.market_price_history h join held on held.id = h.security_id
    group by h.security_id
  ), benchmark_histories as (
    select b.code, b.mapping_status, b.provider_code, b.provider_instrument_id, b.verified_at,
           count(h.*) filter (where h.interval = 'ONE_DAY') as sessions,
           max(h.period_start) filter (where h.interval = 'ONE_DAY') as latest_session,
           max(h.retrieved_at) as retrieved_at
    from public.market_benchmarks b
    left join public.market_benchmark_price_history h on h.benchmark_code = b.code
    group by b.code, b.mapping_status, b.provider_code, b.provider_instrument_id, b.verified_at
  )
  select jsonb_build_object(
    'portfolioId', p_portfolio_id,
    'generatedAt', now(),
    'securities', coalesce((select jsonb_agg(to_jsonb(held) order by symbol) from held), '[]'::jsonb),
    'observations', coalesce((select jsonb_agg(to_jsonb(o) order by o.security_id,o.metric_code,o.period_end,o.id)
      from public.fundamental_observations o join held on held.id=o.security_id), '[]'::jsonb),
    'sourceRecords', coalesce((select jsonb_agg(jsonb_build_object(
      'id',r.id,'source_code',r.source_code,'record_kind',r.record_kind,'retrieved_at',r.retrieved_at,'raw_payload',r.raw_payload
    ) order by r.retrieved_at,r.id)
      from public.data_source_records r
      where r.raw_payload->>'security_id' in (select id::text from held)
        and (r.raw_payload ? 'p7_ic2_normalized_evidence' or r.raw_payload ? 'p7_ic2_ownership_history')), '[]'::jsonb),
    'histories', coalesce((select jsonb_agg(to_jsonb(histories) order by security_id) from histories), '[]'::jsonb),
    'benchmarks', coalesce((select jsonb_agg(to_jsonb(benchmark_histories) order by code) from benchmark_histories), '[]'::jsonb)
  );
$$;

create function public.append_research_evidence_snapshot_v1(p_snapshot jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode='22023', message='Snapshot items must be a non-empty array.';
  end if;

  insert into public.research_evidence_snapshots (
    portfolio_id,security_id,as_of_date,methodology_authority,methodology_version,
    profile_code,subprofile_code,requirement_registry_version,snapshot_status,snapshot_hash,created_by
  ) values (
    (p_snapshot->>'portfolio_id')::uuid,(p_snapshot->>'security_id')::uuid,(p_snapshot->>'as_of_date')::date,
    p_snapshot->>'methodology_authority',p_snapshot->>'methodology_version',p_snapshot->>'profile_code',
    nullif(p_snapshot->>'subprofile_code',''),p_snapshot->>'requirement_registry_version',
    p_snapshot->>'snapshot_status',p_snapshot->>'snapshot_hash',nullif(p_snapshot->>'created_by','')::uuid
  )
  on conflict (security_id,as_of_date,methodology_authority,methodology_version,requirement_registry_version,snapshot_hash)
  do nothing returning id into v_id;

  if v_id is null then
    select id into v_id from public.research_evidence_snapshots
    where security_id=(p_snapshot->>'security_id')::uuid
      and as_of_date=(p_snapshot->>'as_of_date')::date
      and methodology_authority=p_snapshot->>'methodology_authority'
      and methodology_version=p_snapshot->>'methodology_version'
      and requirement_registry_version=p_snapshot->>'requirement_registry_version'
      and snapshot_hash=p_snapshot->>'snapshot_hash';
    return v_id;
  end if;

  insert into public.research_evidence_snapshot_items (
    snapshot_id,requirement_code,metric_code,required,minimum_history,freshness_policy,benchmark_authority,
    applicability,evidence_state,candidate_evidence_ids,selected_evidence_id,evidence_as_of_date,retrieved_at,
    fresh_through,source_provider,raw_source_record_id,normalized_value,validation_state,
    canonical_selection_state,reason_code,recommended_remediation_action
  )
  select v_id,x.requirement_code,x.metric_code,x.required,x.minimum_history,x.freshness_policy,x.benchmark_authority,
    x.applicability,x.evidence_state,x.candidate_evidence_ids,x.selected_evidence_id,x.evidence_as_of_date,x.retrieved_at,
    x.fresh_through,x.source_provider,x.raw_source_record_id,x.normalized_value,x.validation_state,
    x.canonical_selection_state,x.reason_code,x.recommended_remediation_action
  from jsonb_to_recordset(p_items) as x(
    requirement_code text,metric_code text,required boolean,minimum_history integer,freshness_policy text,
    benchmark_authority text[],applicability text,evidence_state text,candidate_evidence_ids uuid[],selected_evidence_id uuid,
    evidence_as_of_date date,retrieved_at timestamptz,fresh_through date,source_provider text,raw_source_record_id uuid,
    normalized_value jsonb,validation_state text,canonical_selection_state text,reason_code text,recommended_remediation_action text
  );
  return v_id;
end;
$$;

revoke all on function public.p7_ic2_cache_facts_v1(uuid) from public,anon,authenticated;
revoke all on function public.append_research_evidence_snapshot_v1(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.p7_ic2_cache_facts_v1(uuid) to service_role;
grant execute on function public.append_research_evidence_snapshot_v1(jsonb,jsonb) to service_role;
