-- Production-compatible forward repair for the confirmed ambiguous return-column alias.
-- The function signature, calculation, ownership check and authorization boundary are preserved.

do $repair$
begin
  if to_regprocedure('public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)') is null then
    raise exception 'PORTFOLIO_WEIGHT_REPAIR_PREREQUISITE_MISSING';
  end if;
end;
$repair$;

-- Forward-only lint/correctness repair. The function contract and authorization
-- behavior are unchanged; only the totals CTE alias is made unambiguous.

create or replace function public.get_portfolio_profile_weight_context_v1(
  p_portfolio_id uuid,
  p_security_id uuid,
  p_profile_code text
)
returns table(
  current_weight numeric,
  same_profile_weight numeric,
  reviewed_assignment_coverage numeric,
  reviewed_assignment_count integer,
  total_position_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.portfolios p
    where p.id = p_portfolio_id and p.user_id = v_user
  ) then
    raise exception 'Portfolio access denied' using errcode = '42501';
  end if;

  return query
  with valued as (
    select
      h.security_id,
      h.current_quantity,
      mpl.price,
      (h.current_quantity * mpl.price)::numeric as market_value
    from public.current_holdings h
    join public.market_price_latest mpl
      on mpl.security_id = h.security_id
     and mpl.provider_code = 'ANGEL_ONE'
    where h.portfolio_id = p_portfolio_id
      and h.current_quantity > 0
      and mpl.price is not null
  ), totals as (
    select coalesce(sum(market_value), 0)::numeric as total_market_value,
           count(*)::integer as position_count
    from valued
  ), weighted as (
    select
      v.security_id,
      case when t.total_market_value > 0 then (v.market_value / t.total_market_value * 100)::numeric else 0::numeric end as weight
    from valued v cross join totals t
  ), assignments as (
    select a.security_id, a.scoring_profile_code
    from public.security_scoring_profile_assignments a
    where a.assignment_status = 'REVIEWED'
      and a.security_id in (select security_id from valued)
  )
  select
    coalesce((select w.weight from weighted w where w.security_id = p_security_id), 0)::numeric,
    coalesce((select sum(w.weight) from weighted w join assignments a on a.security_id = w.security_id where a.scoring_profile_code = p_profile_code), 0)::numeric,
    coalesce((select sum(w.weight) from weighted w join assignments a on a.security_id = w.security_id), 0)::numeric,
    coalesce((select count(*) from assignments), 0)::integer,
    (select t.position_count from totals t)::integer;
end;
$$;

revoke all on function public.get_portfolio_profile_weight_context_v1(uuid, uuid, text)
  from public, anon;
grant execute on function public.get_portfolio_profile_weight_context_v1(uuid, uuid, text)
  to authenticated, service_role;


do $repair$
begin
  if strpos(
    pg_get_functiondef('public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure),
    'count(*)::integer as total_position_count'
  ) > 0 then
    raise exception 'PORTFOLIO_WEIGHT_REPAIR_POSTCONDITION_FAILED: ambiguous alias remains';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'PORTFOLIO_WEIGHT_REPAIR_POSTCONDITION_FAILED: execute grants differ';
  end if;
end;
$repair$;
