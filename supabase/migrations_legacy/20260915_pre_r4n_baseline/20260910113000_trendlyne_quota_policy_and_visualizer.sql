-- Stage 7.2D.2B.3 — owner-confirmed Trendlyne Pro quota and conservative local visualizer.
-- Provider dashboard remains authoritative for billable usage. PortfolioAI intentionally keeps a lower internal daily cap.

update public.provider_ingestion_controls
set daily_internal_attempt_limit = 50,
    actual_provider_quota_status = 'VERIFIED',
    actual_provider_quota = jsonb_build_object(
      'plan', 'Trendlyne Pro',
      'daily_limit', 400,
      'monthly_limit', 2000,
      'monthly_window', 'CALENDAR_MONTH',
      'verification_basis', 'OWNER_CONFIRMED',
      'verified_on', '2026-09-10'
    ),
    policy_version = greatest(policy_version + 1, 2),
    updated_at = clock_timestamp()
where source_code = 'TRENDLYNE_MCP';

create or replace function public.get_provider_quota_summary_v1(
  p_source_code text default 'TRENDLYNE_MCP'
)
returns table(
  source_code text,
  quota_status text,
  plan_name text,
  internal_daily_limit integer,
  internal_daily_used bigint,
  internal_daily_remaining bigint,
  provider_daily_limit integer,
  provider_daily_estimated_used bigint,
  provider_daily_estimated_remaining bigint,
  provider_monthly_limit integer,
  provider_monthly_estimated_used bigint,
  provider_monthly_estimated_remaining bigint,
  day_started_at timestamptz,
  month_started_at timestamptz,
  usage_basis text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.provider_ingestion_controls%rowtype;
  v_day_start timestamptz := date_trunc('day', clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  v_month_start timestamptz := date_trunc('month', clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  v_internal_day bigint;
  v_provider_day bigint;
  v_provider_month bigint;
  v_daily_limit integer;
  v_monthly_limit integer;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;

  select pic.* into c
  from public.provider_ingestion_controls pic
  where pic.source_code = p_source_code;

  if not found then return; end if;

  v_daily_limit := coalesce((c.actual_provider_quota->>'daily_limit')::integer, 0);
  v_monthly_limit := coalesce((c.actual_provider_quota->>'monthly_limit')::integer, 0);

  select coalesce(sum(u.actual_internal_units), 0)::bigint into v_internal_day
  from public.provider_usage_events u
  where u.source_code = p_source_code
    and u.accounting_class = 'PROVIDER_TOOL_ATTEMPT'
    and u.attempted_at >= v_day_start;

  -- Conservative provider-usage estimate. Excludes the known-invalid legacy SEARCH_PARAMETERS pilot.
  -- MCP bootstrap/list operations are already excluded because they use TRANSPORT_BOOTSTRAP accounting.
  select coalesce(sum(u.actual_internal_units), 0)::bigint into v_provider_day
  from public.provider_usage_events u
  where u.source_code = p_source_code
    and u.accounting_class = 'PROVIDER_TOOL_ATTEMPT'
    and u.operation_class <> 'SEARCH_PARAMETERS'
    and u.attempted_at >= v_day_start;

  select coalesce(sum(u.actual_internal_units), 0)::bigint into v_provider_month
  from public.provider_usage_events u
  where u.source_code = p_source_code
    and u.accounting_class = 'PROVIDER_TOOL_ATTEMPT'
    and u.operation_class <> 'SEARCH_PARAMETERS'
    and u.attempted_at >= v_month_start;

  return query select
    c.source_code,
    c.actual_provider_quota_status,
    coalesce(c.actual_provider_quota->>'plan', 'Unknown'),
    c.daily_internal_attempt_limit,
    v_internal_day,
    greatest(c.daily_internal_attempt_limit - v_internal_day, 0)::bigint,
    v_daily_limit,
    v_provider_day,
    greatest(v_daily_limit::bigint - v_provider_day, 0)::bigint,
    v_monthly_limit,
    v_provider_month,
    greatest(v_monthly_limit::bigint - v_provider_month, 0)::bigint,
    v_day_start,
    v_month_start,
    'PortfolioAI estimate from recorded valid provider-tool attempts; excludes known-invalid SEARCH_PARAMETERS and transport bootstrap. Trendlyne dashboard is authoritative.'::text;
end;
$$;

revoke all on function public.get_provider_quota_summary_v1(text) from public;
grant execute on function public.get_provider_quota_summary_v1(text) to authenticated;
