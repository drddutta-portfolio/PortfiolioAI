-- Forward-only reconciliation for the confirmed production NEWS policy defect.
-- This migration never schedules, unschedules or invokes a cron job.

do $repair$
begin
  if to_regclass('public.refresh_domain_policies') is null then
    raise exception 'NEWS_REPAIR_PREREQUISITE_MISSING: refresh_domain_policies';
  end if;

  if not exists (
    select 1
    from public.refresh_domain_policies
    where source_code = 'COMPANY_EXCHANGE_FILING'
      and data_domain = 'NEWS'
      and policy_version = 6
      and effective_to is not null
  ) then
    raise exception 'NEWS_REPAIR_PREREQUISITE_MISSING: closed NEWS V6';
  end if;

  if not exists (
    select 1
    from public.refresh_domain_policies
    where source_code = 'COMPANY_EXCHANGE_FILING'
      and data_domain = 'NEWS'
      and policy_version = 7
      and is_enabled = true
      and effective_to is null
      and freshness_basis <> 'DISABLED'
  ) then
    raise exception 'NEWS_REPAIR_CONFLICT: active NEWS V7 is unavailable';
  end if;

  if exists (
    select 1
    from public.refresh_domain_policies
    where is_enabled = true
      and freshness_basis = 'DISABLED'
  ) then
    raise exception 'NEWS_REPAIR_CONFLICT: enabled policy has DISABLED freshness';
  end if;
end;
$repair$;

alter table public.refresh_domain_policies
  drop constraint if exists refresh_domain_policy_disabled;

update public.refresh_domain_policies
set is_enabled = false,
    freshness_basis = 'DISABLED'
where source_code = 'COMPANY_EXCHANGE_FILING'
  and data_domain = 'NEWS'
  and policy_version = 6
  and effective_to is not null
  and (is_enabled or freshness_basis <> 'DISABLED');

update public.refresh_domain_policies
set freshness_basis = 'DISABLED'
where is_enabled = false
  and freshness_basis <> 'DISABLED';

alter table public.refresh_domain_policies
  add constraint refresh_domain_policy_disabled check (
    (is_enabled and freshness_basis <> 'DISABLED')
    or (not is_enabled and freshness_basis = 'DISABLED')
  ) not valid;

alter table public.refresh_domain_policies
  validate constraint refresh_domain_policy_disabled;

do $repair$
begin
  if exists (
    select 1
    from public.refresh_domain_policies
    where source_code = 'COMPANY_EXCHANGE_FILING'
      and data_domain = 'NEWS'
      and policy_version = 6
      and (is_enabled or effective_to is null or freshness_basis <> 'DISABLED')
  ) then
    raise exception 'NEWS_REPAIR_POSTCONDITION_FAILED: NEWS V6 is not canonically retired';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.refresh_domain_policies'::regclass
      and conname = 'refresh_domain_policy_disabled'
      and convalidated
  ) then
    raise exception 'NEWS_REPAIR_POSTCONDITION_FAILED: invariant is not validated';
  end if;
end;
$repair$;
