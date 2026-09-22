alter table public.recommendation_profile_policies
  add column if not exists weight_policy jsonb not null default '{}'::jsonb;

update public.recommendation_profile_policies
set weight_policy = '{
  "single_stock_max": 6,
  "core": {
    "high": [4, 6],
    "standard": [3, 4.5],
    "cautious": [2, 3]
  },
  "satellite": {
    "standard": [1, 2.5],
    "cautious": [0.5, 1.5]
  },
  "watch": [0, 1],
  "avoid": [0, 0],
  "high_conviction_score": 85,
  "caution_score": 72,
  "momentum_caution_below": 40,
  "risk_caution_below": 50,
  "momentum_cap": 4,
  "risk_cap": 3,
  "profile_concentration_soft_cap": 25,
  "profile_concentration_hard_cap": 35,
  "min_profile_coverage_for_concentration": 70
}'::jsonb,
updated_at = now()
where profile_code = 'BANK_NBFC' and policy_version = 1;

update public.recommendation_profile_policies
set weight_policy = '{
  "single_stock_max": 6,
  "profile_concentration_soft_cap": 25,
  "profile_concentration_hard_cap": 35,
  "min_profile_coverage_for_concentration": 70
}'::jsonb,
updated_at = now()
where profile_code <> 'BANK_NBFC' and policy_version = 1 and weight_policy = '{}'::jsonb;

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
           count(*)::integer as total_position_count
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
    (select total_position_count from totals)::integer;
end;
$$;

grant execute on function public.get_portfolio_profile_weight_context_v1(uuid, uuid, text) to authenticated;
