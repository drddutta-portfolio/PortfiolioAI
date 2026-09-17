-- R4N Gate E local-only fixture for the owner-reviewed TORNTPHARM assignment.
-- SAFETY: run only against the local Supabase database on 127.0.0.1:54322.
-- This script deliberately asserts the known disposable local TORNTPHARM UUID
-- and the explicitly reviewed local user email; it aborts elsewhere.
-- It creates no evidence, scores, recommendations, provider calls or scheduler state.

begin;

do $$
declare
  v_security_id uuid;
  v_reviewer_id uuid;
  v_reviewer_count integer;
  v_assignment_id uuid;
  v_existing_count integer;
  v_reviewed_at timestamptz := '2026-09-17 18:30:00+05:30'::timestamptz;
begin
  select id into v_security_id
  from public.securities
  where upper(symbol) = 'TORNTPHARM'
    and upper(exchange) = 'NSE';

  if v_security_id is null then
    raise exception 'Local TORNTPHARM/NSE security not found; fixture aborted.';
  end if;

  if v_security_id <> 'a4000000-0000-0000-0000-000000000002'::uuid then
    raise exception 'Local-only safety guard failed: unexpected TORNTPHARM security id %. Fixture aborted.', v_security_id;
  end if;

  select count(*), min(id)
    into v_reviewer_count, v_reviewer_id
  from auth.users
  where lower(email) = 'dr.d.dutta@gmail.com';

  if v_reviewer_count <> 1 or v_reviewer_id is null then
    raise exception 'Expected exactly one local reviewer auth user dr.d.dutta@gmail.com; found %. Fixture aborted.', v_reviewer_count;
  end if;

  if not exists (
    select 1
    from public.transactions t
    join public.portfolios p on p.id = t.portfolio_id
    where t.security_id = v_security_id
      and p.user_id = v_reviewer_id
  ) then
    raise exception 'Expected local reviewer does not own a portfolio containing TORNTPHARM; fixture aborted.';
  end if;

  if not exists (
    select 1 from public.research_subprofile_contracts
    where parent_profile_code = 'PHARMA'
      and parent_profile_version = 'PHARMA_V1'
      and subprofile_code = 'DOMESTIC_FORMULATIONS'
      and subprofile_version = 'DOMESTIC_FORMULATIONS_V1'
  ) or not exists (
    select 1 from public.research_subprofile_contracts
    where parent_profile_code = 'PHARMA'
      and parent_profile_version = 'PHARMA_V1'
      and subprofile_code = 'GLOBAL_GENERICS'
      and subprofile_version = 'GLOBAL_GENERICS_V1'
  ) or not exists (
    select 1 from public.research_subprofile_contracts
    where parent_profile_code = 'PHARMA'
      and parent_profile_version = 'PHARMA_V1'
      and subprofile_code = 'CDMO_CRAMS'
      and subprofile_version = 'CDMO_CRAMS_V1'
  ) then
    raise exception 'Required PHARMA_V1 subprofile contracts are unavailable; fixture aborted.';
  end if;

  select count(*) into v_existing_count
  from public.research_subprofile_assignments
  where security_id = v_security_id
    and parent_profile_code = 'PHARMA';

  if v_existing_count > 0 then
    select id into v_assignment_id
    from public.research_subprofile_assignments
    where security_id = v_security_id
      and parent_profile_code = 'PHARMA'
      and parent_profile_version = 'PHARMA_V1'
      and subprofile_code = 'DOMESTIC_FORMULATIONS'
      and subprofile_version = 'DOMESTIC_FORMULATIONS_V1'
      and assignment_status = 'REVIEWED'
      and confidence_state = 'HIGH'
      and effective_from = '2026-03-31 00:00:00+00'::timestamptz
      and effective_to is null
    limit 1;

    if v_assignment_id is null or v_existing_count <> 1 then
      raise exception 'Conflicting local research-subprofile assignment already exists; fixture aborted.';
    end if;
  else
    insert into public.research_subprofile_assignments (
      security_id,
      parent_profile_code,
      parent_profile_version,
      subprofile_code,
      subprofile_version,
      assignment_status,
      confidence_state,
      assignment_basis,
      source_reference,
      source_record_id,
      effective_from,
      effective_to,
      reviewed_by,
      reviewed_at,
      created_by
    ) values (
      v_security_id,
      'PHARMA',
      'PHARMA_V1',
      'DOMESTIC_FORMULATIONS',
      'DOMESTIC_FORMULATIONS_V1',
      'REVIEWED',
      'HIGH',
      'OWNER_REVIEWED_GATE_E_2026_09_17',
      'TORNTPHARM_AR_2025_26; TORNTPHARM_AR_2024_25; TORNTPHARM_Q4_FY25_26_EARNINGS_CALL',
      null,
      '2026-03-31 00:00:00+00'::timestamptz,
      null,
      v_reviewer_id,
      v_reviewed_at,
      v_reviewer_id
    )
    returning id into v_assignment_id;
  end if;

  if exists (
    select 1 from public.research_subprofile_secondary_exposures
    where assignment_id = v_assignment_id
      and not (
        (subprofile_code = 'GLOBAL_GENERICS' and subprofile_version = 'GLOBAL_GENERICS_V1' and materiality_state = 'MATERIAL' and assignment_status = 'REVIEWED' and confidence_state = 'MEDIUM')
        or
        (subprofile_code = 'CDMO_CRAMS' and subprofile_version = 'CDMO_CRAMS_V1' and materiality_state = 'EMERGING' and assignment_status = 'REVIEWED' and confidence_state = 'MEDIUM')
      )
  ) then
    raise exception 'Unexpected local secondary exposure already exists; fixture aborted.';
  end if;

  insert into public.research_subprofile_secondary_exposures (
    assignment_id,
    parent_profile_code,
    parent_profile_version,
    subprofile_code,
    subprofile_version,
    materiality_state,
    evidence_basis,
    source_reference,
    assignment_status,
    confidence_state,
    effective_from,
    effective_to,
    reason_code,
    reviewed_by,
    reviewed_at
  )
  select
    v_assignment_id,
    'PHARMA',
    'PHARMA_V1',
    'GLOBAL_GENERICS',
    'GLOBAL_GENERICS_V1',
    'MATERIAL',
    'Issuer-defined US and Germany generic businesses; comparable FY2025-26 standalone revenue share is approximately 12.05 percent.',
    'TORNTPHARM_AR_2025_26; TORNTPHARM_Q2_FY25_26_EARNINGS_CALL',
    'REVIEWED',
    'MEDIUM',
    '2026-03-31 00:00:00+00'::timestamptz,
    null,
    'ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10',
    v_reviewer_id,
    v_reviewed_at
  where not exists (
    select 1 from public.research_subprofile_secondary_exposures
    where assignment_id = v_assignment_id
      and subprofile_code = 'GLOBAL_GENERICS'
      and subprofile_version = 'GLOBAL_GENERICS_V1'
  );

  insert into public.research_subprofile_secondary_exposures (
    assignment_id,
    parent_profile_code,
    parent_profile_version,
    subprofile_code,
    subprofile_version,
    materiality_state,
    evidence_basis,
    source_reference,
    assignment_status,
    confidence_state,
    effective_from,
    effective_to,
    reason_code,
    reviewed_by,
    reviewed_at
  )
  select
    v_assignment_id,
    'PHARMA',
    'PHARMA_V1',
    'CDMO_CRAMS',
    'CDMO_CRAMS_V1',
    'EMERGING',
    'Owner-reviewed qualitative V1 override based on issuer disclosure describing emerging international CDMO capability and a meaningful entry/expansion opportunity into the CDMO segment.',
    'TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29; TORNTPHARM_AR_2025_26',
    'REVIEWED',
    'MEDIUM',
    '2026-03-31 00:00:00+00'::timestamptz,
    null,
    'OWNER_REVIEWED_STRATEGIC_EMERGING_CDMO_CAPABILITY',
    v_reviewer_id,
    v_reviewed_at
  where not exists (
    select 1 from public.research_subprofile_secondary_exposures
    where assignment_id = v_assignment_id
      and subprofile_code = 'CDMO_CRAMS'
      and subprofile_version = 'CDMO_CRAMS_V1'
  );

  if (select count(*) from public.research_subprofile_secondary_exposures where assignment_id = v_assignment_id) <> 2 then
    raise exception 'Expected exactly two reviewed local secondary exposures; fixture aborted.';
  end if;

  raise notice 'LOCAL ONLY: TORNTPHARM reviewed Gate E assignment fixture is present with assignment id %.', v_assignment_id;
end;
$$;

commit;

select
  s.symbol,
  a.subprofile_code as primary_subprofile,
  a.assignment_status,
  a.confidence_state,
  a.effective_from,
  se.subprofile_code as secondary_subprofile,
  se.materiality_state,
  se.confidence_state as secondary_confidence,
  se.assignment_status as secondary_status
from public.research_subprofile_assignments a
join public.securities s on s.id = a.security_id
left join public.research_subprofile_secondary_exposures se on se.assignment_id = a.id
where a.security_id = 'a4000000-0000-0000-0000-000000000002'::uuid
  and a.parent_profile_code = 'PHARMA'
order by se.subprofile_code;
