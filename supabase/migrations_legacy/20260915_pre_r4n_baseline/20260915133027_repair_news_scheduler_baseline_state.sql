-- Forward-only repair for the final NEWS scheduler schema/state contract.
--
-- This does not schedule, unschedule, or invoke any cron job. It ensures pg_cron
-- exists for databases that have reached this migration and restores the
-- canonical disabled-policy invariant after historical NEWS-policy retirement.

create extension if not exists pg_cron with schema extensions;

do $repair$
begin
  if to_regclass('public.refresh_domain_policies') is null then
    raise exception 'NEWS_BASELINE_REPAIR_PREREQUISITE_MISSING: refresh_domain_policies';
  end if;

  if to_regclass('cron.job') is null then
    raise exception 'NEWS_BASELINE_REPAIR_PREREQUISITE_MISSING: cron.job';
  end if;

  if exists (
    select 1
    from public.refresh_domain_policies
    where is_enabled = true
      and freshness_basis = 'DISABLED'
  ) then
    raise exception 'NEWS_BASELINE_REPAIR_CONFLICT: enabled policy has DISABLED freshness basis';
  end if;
end
$repair$;

alter table public.refresh_domain_policies
  drop constraint if exists refresh_domain_policy_disabled;

update public.refresh_domain_policies
set freshness_basis = 'DISABLED'
where is_enabled = false
  and freshness_basis <> 'DISABLED';

alter table public.refresh_domain_policies
  add constraint refresh_domain_policy_disabled check (
    (is_enabled and freshness_basis <> 'DISABLED')
    or (not is_enabled and freshness_basis = 'DISABLED')
  );

do $repair$
begin
  if exists (
    select 1
    from public.refresh_domain_policies
    where source_code = 'COMPANY_EXCHANGE_FILING'
      and data_domain = 'NEWS'
      and policy_version = 6
      and (
        is_enabled
        or effective_to is null
        or freshness_basis <> 'DISABLED'
      )
  ) then
    raise exception 'NEWS_BASELINE_REPAIR_POSTCONDITION_FAILED: NEWS V6 is not canonically retired';
  end if;
end
$repair$;
