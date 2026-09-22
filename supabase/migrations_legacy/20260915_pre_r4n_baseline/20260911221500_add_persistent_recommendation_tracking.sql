alter table public.recommendation_profile_policies
  add column if not exists persistence_rules jsonb not null default '{"upgrade_confirmations":2,"downgrade_confirmations":2}'::jsonb;

update public.recommendation_profile_policies
set persistence_rules = '{"upgrade_confirmations":2,"downgrade_confirmations":2}'::jsonb,
    updated_at = now()
where profile_code = 'BANK_NBFC' and policy_version = 1;

alter table public.stock_recommendation_runs
  add column if not exists evaluation_key text,
  add column if not exists transition_status text;

update public.stock_recommendation_runs
set transition_status = case
  when suggested_role = 'INSUFFICIENT' then 'EVIDENCE_PENDING'
  when transition_status is null then 'INITIAL'
  else transition_status
end
where transition_status is null;

alter table public.stock_recommendation_runs
  alter column transition_status set default 'INITIAL';

alter table public.stock_recommendation_runs
  drop constraint if exists stock_recommendation_runs_transition_status_check;
alter table public.stock_recommendation_runs
  add constraint stock_recommendation_runs_transition_status_check
  check (transition_status in ('INITIAL','STABLE','EVIDENCE_PENDING','PENDING_UPGRADE','CONFIRMED_UPGRADE','PENDING_DOWNGRADE','CONFIRMED_DOWNGRADE'));

create unique index if not exists stock_recommendation_runs_preview_eval_uq
  on public.stock_recommendation_runs(portfolio_id, security_id, scoring_profile_code, recommendation_policy_version, evaluation_key)
  where run_state = 'PREVIEW' and evaluation_key is not null;

create or replace function public.record_recommendation_preview_v1(
  p_portfolio_id uuid,
  p_security_id uuid,
  p_scoring_profile_code text,
  p_policy_version integer,
  p_evaluation_key text,
  p_overall_score numeric,
  p_score_ready_coverage numeric,
  p_evidence_confidence numeric,
  p_suggested_role text,
  p_current_user_role text,
  p_current_weight numeric,
  p_rationale jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  suggested_role text,
  change_signal text,
  transition_status text,
  persistence_count integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing public.stock_recommendation_runs%rowtype;
  v_previous_distinct public.stock_recommendation_runs%rowtype;
  v_policy public.recommendation_profile_policies%rowtype;
  v_consecutive integer := 1;
  v_change text := 'INITIAL';
  v_transition text := 'INITIAL';
  v_upgrade_required integer := 2;
  v_downgrade_required integer := 2;
  v_current_rank integer;
  v_previous_rank integer;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_evaluation_key is null or length(trim(p_evaluation_key)) < 8 then
    raise exception 'Evaluation key is required';
  end if;

  if p_suggested_role not in ('CORE_CANDIDATE','SATELLITE_CANDIDATE','WATCH','AVOID','INSUFFICIENT') then
    raise exception 'Unsupported suggested role';
  end if;

  if not exists (
    select 1 from public.portfolios p
    where p.id = p_portfolio_id and p.user_id = v_user
  ) then
    raise exception 'Portfolio access denied' using errcode = '42501';
  end if;

  select * into v_policy
  from public.recommendation_profile_policies rp
  where rp.profile_code = p_scoring_profile_code
    and rp.policy_version = p_policy_version
    and rp.status in ('DRAFT','REVIEWED','ACTIVE');

  if not found then
    raise exception 'Recommendation policy is unavailable';
  end if;

  select * into v_existing
  from public.stock_recommendation_runs r
  where r.portfolio_id = p_portfolio_id
    and r.security_id = p_security_id
    and r.scoring_profile_code = p_scoring_profile_code
    and r.recommendation_policy_version = p_policy_version
    and r.run_state = 'PREVIEW'
    and r.evaluation_key = p_evaluation_key
  order by r.created_at desc
  limit 1;

  if found then
    return query select v_existing.id, v_existing.suggested_role, v_existing.change_signal,
      v_existing.transition_status, v_existing.persistence_count, v_existing.created_at;
    return;
  end if;

  v_upgrade_required := greatest(1, coalesce((v_policy.persistence_rules->>'upgrade_confirmations')::integer, 2));
  v_downgrade_required := greatest(1, coalesce((v_policy.persistence_rules->>'downgrade_confirmations')::integer, 2));

  if p_suggested_role = 'INSUFFICIENT' then
    v_change := 'UNCHANGED';
    v_transition := 'EVIDENCE_PENDING';
    v_consecutive := 1;
  else
    select * into v_previous_distinct
    from public.stock_recommendation_runs r
    where r.portfolio_id = p_portfolio_id
      and r.security_id = p_security_id
      and r.run_state in ('PREVIEW','OFFICIAL')
      and r.suggested_role <> 'INSUFFICIENT'
      and r.suggested_role <> p_suggested_role
    order by r.created_at desc
    limit 1;

    select count(*)::integer into v_consecutive
    from public.stock_recommendation_runs r
    where r.portfolio_id = p_portfolio_id
      and r.security_id = p_security_id
      and r.run_state in ('PREVIEW','OFFICIAL')
      and r.suggested_role = p_suggested_role
      and (v_previous_distinct.id is null or r.created_at > v_previous_distinct.created_at);
    v_consecutive := v_consecutive + 1;

    if v_previous_distinct.id is null then
      if exists (
        select 1 from public.stock_recommendation_runs r
        where r.portfolio_id = p_portfolio_id and r.security_id = p_security_id
          and r.run_state in ('PREVIEW','OFFICIAL') and r.suggested_role = p_suggested_role
      ) then
        v_change := 'UNCHANGED';
        v_transition := 'STABLE';
      else
        v_change := 'INITIAL';
        v_transition := 'INITIAL';
      end if;
    else
      v_current_rank := case p_suggested_role
        when 'CORE_CANDIDATE' then 4
        when 'SATELLITE_CANDIDATE' then 3
        when 'WATCH' then 2
        when 'AVOID' then 1
        else 0 end;
      v_previous_rank := case v_previous_distinct.suggested_role
        when 'CORE_CANDIDATE' then 4
        when 'SATELLITE_CANDIDATE' then 3
        when 'WATCH' then 2
        when 'AVOID' then 1
        else 0 end;

      if v_current_rank > v_previous_rank then
        v_change := 'UPGRADE';
        v_transition := case when v_consecutive >= v_upgrade_required then 'CONFIRMED_UPGRADE' else 'PENDING_UPGRADE' end;
      elsif v_current_rank < v_previous_rank then
        v_change := 'DOWNGRADE';
        v_transition := case when v_consecutive >= v_downgrade_required then 'CONFIRMED_DOWNGRADE' else 'PENDING_DOWNGRADE' end;
      else
        v_change := 'UNCHANGED';
        v_transition := 'STABLE';
      end if;
    end if;
  end if;

  insert into public.stock_recommendation_runs (
    portfolio_id, security_id, scoring_profile_code, recommendation_policy_version,
    run_state, overall_score, score_ready_coverage, evidence_confidence, suggested_role,
    current_user_role, current_weight, change_signal, transition_status, persistence_count,
    rationale, evaluation_key
  ) values (
    p_portfolio_id, p_security_id, p_scoring_profile_code, p_policy_version,
    'PREVIEW', p_overall_score, p_score_ready_coverage, p_evidence_confidence, p_suggested_role,
    p_current_user_role, p_current_weight, v_change, v_transition, v_consecutive,
    coalesce(p_rationale, '{}'::jsonb), p_evaluation_key
  )
  returning stock_recommendation_runs.id, stock_recommendation_runs.suggested_role,
    stock_recommendation_runs.change_signal, stock_recommendation_runs.transition_status,
    stock_recommendation_runs.persistence_count, stock_recommendation_runs.created_at
  into id, suggested_role, change_signal, transition_status, persistence_count, created_at;

  return next;
end;
$$;

revoke all on function public.record_recommendation_preview_v1(uuid,uuid,text,integer,text,numeric,numeric,numeric,text,text,numeric,jsonb) from public;
grant execute on function public.record_recommendation_preview_v1(uuid,uuid,text,integer,text,numeric,numeric,numeric,text,text,numeric,jsonb) to authenticated;
