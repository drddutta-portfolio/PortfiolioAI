-- Stage 7.2D.2B.4 — align owner-confirmed fundamentals refresh with the intended monthly strategy.
-- The prior TTM policy was 7 days. PortfolioAI's approved strategy is roughly monthly per held stock.
-- This migration versions the policy rather than mutating history and reconciles refresh-state rows
-- whose canonical required fundamentals are already expired.

update public.refresh_domain_policies
set effective_to = clock_timestamp()
where source_code = 'TRENDLYNE_MCP'
  and data_domain = 'TTM_FUNDAMENTALS'
  and effective_to is null;

insert into public.refresh_domain_policies(
  source_code,
  data_domain,
  policy_version,
  is_enabled,
  freshness_seconds,
  freshness_basis,
  cooldown_seconds,
  retry_schedule_seconds,
  definition,
  effective_from,
  effective_to
)
values (
  'TRENDLYNE_MCP',
  'TTM_FUNDAMENTALS',
  2,
  true,
  2592000,
  'ELAPSED_TIME',
  0,
  array[30,120,600]::integer[],
  jsonb_build_object(
    'description', 'TTM fundamentals',
    'strategy', 'MONTHLY_OWNER_CONFIRMED',
    'stage', '7.2D.2B.4'
  ),
  clock_timestamp(),
  null
)
on conflict (source_code, data_domain, policy_version) do update
set is_enabled = excluded.is_enabled,
    freshness_seconds = excluded.freshness_seconds,
    freshness_basis = excluded.freshness_basis,
    cooldown_seconds = excluded.cooldown_seconds,
    retry_schedule_seconds = excluded.retry_schedule_seconds,
    definition = excluded.definition,
    effective_from = excluded.effective_from,
    effective_to = null;

-- A refresh-state row must not claim FRESH when the canonical research observations that
-- support the refresh contract are already expired. Re-open only those TTM states whose
-- required seven-metric snapshot has no complete fresh set.
with required_codes(metric_code) as (
  values
    ('MARKET_CAP_PROVIDER_RAW'),
    ('PE_TTM'),
    ('PBV_ADJUSTED_PROVIDER'),
    ('REVENUE_TTM'),
    ('NET_PROFIT_TTM'),
    ('CFO_ANNUAL'),
    ('ROE_ANNUAL')
), incomplete as (
  select srs.security_id
  from public.security_refresh_states srs
  where srs.source_code = 'TRENDLYNE_MCP'
    and srs.data_domain = 'TTM_FUNDAMENTALS'
    and exists (
      select 1
      from required_codes rc
      where not exists (
        select 1
        from public.fundamental_observations fo
        where fo.security_id = srs.security_id
          and fo.source_code = 'TRENDLYNE_MCP'
          and fo.metric_code = rc.metric_code
          and fo.evidence_status in ('AVAILABLE','CONFLICTING')
          and fo.fresh_until > clock_timestamp()
      )
    )
)
update public.security_refresh_states srs
set fresh_until = null,
    next_eligible_refresh_at = clock_timestamp(),
    refresh_status = 'STALE'
from incomplete i
where srs.source_code = 'TRENDLYNE_MCP'
  and srs.data_domain = 'TTM_FUNDAMENTALS'
  and srs.security_id = i.security_id;
