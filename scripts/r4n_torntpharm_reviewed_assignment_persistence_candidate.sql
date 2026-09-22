-- R4N Gate E — TORNTPHARM reviewed-assignment persistence candidate.
-- SAFETY DEFAULT: this script ROLLS BACK unless psql variable commit_authorized=true is supplied.
-- It is parameterized so the exact same logic can be validated against localhost first.
-- DO NOT run against production until a fresh read-only production preflight and explicit owner authorization.
--
-- Required psql variables:
--   target_security_id  UUID for TORNTPHARM in the target environment
--   reviewer_email      reviewer auth.users email in the target environment
--   reviewed_at         ISO-8601 timestamp chosen for the human-review provenance
-- Optional:
--   commit_authorized   boolean; defaults to false (ROLLBACK)
--
-- Example LOCAL dry-run only:
-- psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--   -v target_security_id='a4000000-0000-0000-0000-000000000002' \
--   -v reviewer_email='dr.d.dutta@gmail.com' \
--   -v reviewed_at='2026-09-17T13:00:00Z' \
--   -v commit_authorized=false \
--   -f scripts/r4n_torntpharm_reviewed_assignment_persistence_candidate.sql

\if :{?target_security_id}
\else
  \echo 'ERROR: target_security_id is required.'
  \quit
\endif

\if :{?reviewer_email}
\else
  \echo 'ERROR: reviewer_email is required.'
  \quit
\endif

\if :{?reviewed_at}
\else
  \echo 'ERROR: reviewed_at is required.'
  \quit
\endif

\if :{?commit_authorized}
\else
  \set commit_authorized false
\endif

select set_config('r4n.target_security_id', :'target_security_id', false);
select set_config('r4n.reviewer_email', :'reviewer_email', false);
select set_config('r4n.reviewed_at', :'reviewed_at', false);

begin;

do $$
declare
  v_security_id uuid := current_setting('r4n.target_security_id')::uuid;
  v_reviewer_email text := lower(current_setting('r4n.reviewer_email'));
  v_reviewed_at timestamptz := current_setting('r4n.reviewed_at')::timestamptz;
  v_reviewer_id uuid;
  v_reviewer_count integer;
  v_assignment_id uuid;
  v_assignment_count integer;
  v_secondary_count integer;
begin
  -- Identity must resolve to TORNTPHARM / NSE exactly in the target environment.
  if not exists (
    select 1
    from public.securities s
    where s.id = v_security_id
      and upper(s.symbol) = 'TORNTPHARM'
      and upper(s.exchange) = 'NSE'
  ) then
    raise exception 'Target security id % is not TORNTPHARM/NSE; persistence aborted.', v_security_id;
  end if;

  -- Reviewer identity must resolve uniquely inside the target environment.
  select count(*) into v_reviewer_count
  from auth.users
  where lower(email) = v_reviewer_email;

  if v_reviewer_count <> 1 then
    raise exception 'Expected exactly one auth reviewer for %, found %; persistence aborted.', v_reviewer_email, v_reviewer_count;
  end if;

  select id into v_reviewer_id
  from auth.users
  where lower(email) = v_reviewer_email;

  -- Reviewer must own at least one portfolio containing the target security.
  if not exists (
    select 1
    from public.transactions t
    join public.portfolios p on p.id = t.portfolio_id
    where t.security_id = v_security_id
      and p.user_id = v_reviewer_id
  ) then
    raise exception 'Reviewer % does not own a portfolio containing TORNTPHARM; persistence aborted.', v_reviewer_email;
  end if;

  -- Required immutable contracts must exist exactly.
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
    raise exception 'Required PHARMA_V1 contracts are unavailable; persistence aborted.';
  end if;

  -- Idempotent primary assignment handling.
  select count(*) into v_assignment_count
  from public.research_subprofile_assignments
  where security_id = v_security_id
    and parent_profile_code = 'PHARMA';

  if v_assignment_count = 0 then
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
    ) returning id into v_assignment_id;
  elsif v_assignment_count = 1 then
    select id into v_assignment_id
    from public.research_subprofile_assignments
    where security_id = v_security_id
      and parent_profile_code = 'PHARMA'
      and parent_profile_version = 'PHARMA_V1'
      and subprofile_code = 'DOMESTIC_FORMULATIONS'
      and subprofile_version = 'DOMESTIC_FORMULATIONS_V1'
      and assignment_status = 'REVIEWED'
      and confidence_state = 'HIGH'
      and assignment_basis = 'OWNER_REVIEWED_GATE_E_2026_09_17'
      and source_reference = 'TORNTPHARM_AR_2025_26; TORNTPHARM_AR_2024_25; TORNTPHARM_Q4_FY25_26_EARNINGS_CALL'
      and source_record_id is null
      and effective_from = '2026-03-31 00:00:00+00'::timestamptz
      and effective_to is null
      and reviewed_by = v_reviewer_id
      and reviewed_at = v_reviewed_at
      and created_by = v_reviewer_id;

    if v_assignment_id is null then
      raise exception 'Existing TORNTPHARM PHARMA assignment does not exactly match the reviewed Gate E decision; persistence aborted.';
    end if;
  else
    raise exception 'Found % TORNTPHARM PHARMA assignments; expected 0 or one exact idempotent match. Persistence aborted.', v_assignment_count;
  end if;

  -- Reject any unexpected secondary exposure before inserting missing approved rows.
  if exists (
    select 1
    from public.research_subprofile_secondary_exposures se
    where se.assignment_id = v_assignment_id
      and se.subprofile_code not in ('GLOBAL_GENERICS', 'CDMO_CRAMS')
  ) then
    raise exception 'Unexpected secondary exposure exists for the reviewed TORNTPHARM assignment; persistence aborted.';
  end if;

  -- Existing approved rows must match exactly if already present.
  if exists (
    select 1
    from public.research_subprofile_secondary_exposures se
    where se.assignment_id = v_assignment_id
      and se.subprofile_code = 'GLOBAL_GENERICS'
      and not (
        se.parent_profile_code = 'PHARMA'
        and se.parent_profile_version = 'PHARMA_V1'
        and se.subprofile_version = 'GLOBAL_GENERICS_V1'
        and se.materiality_state = 'MATERIAL'
        and se.assignment_status = 'REVIEWED'
        and se.confidence_state = 'MEDIUM'
        and se.effective_from = '2026-03-31 00:00:00+00'::timestamptz
        and se.effective_to is null
        and se.reason_code = 'ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10'
        and se.source_reference = 'TORNTPHARM_AR_2025_26; TORNTPHARM_Q2_FY25_26_EARNINGS_CALL'
        and se.reviewed_by = v_reviewer_id
        and se.reviewed_at = v_reviewed_at
      )
  ) then
    raise exception 'Existing GLOBAL_GENERICS secondary row conflicts with the approved Gate E decision; persistence aborted.';
  end if;

  if exists (
    select 1
    from public.research_subprofile_secondary_exposures se
    where se.assignment_id = v_assignment_id
      and se.subprofile_code = 'CDMO_CRAMS'
      and not (
        se.parent_profile_code = 'PHARMA'
        and se.parent_profile_version = 'PHARMA_V1'
        and se.subprofile_version = 'CDMO_CRAMS_V1'
        and se.materiality_state = 'EMERGING'
        and se.assignment_status = 'REVIEWED'
        and se.confidence_state = 'MEDIUM'
        and se.effective_from = '2026-03-31 00:00:00+00'::timestamptz
        and se.effective_to is null
        and se.reason_code = 'OWNER_REVIEWED_STRATEGIC_EMERGING_CDMO_CAPABILITY'
        and se.source_reference = 'TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29; TORNTPHARM_AR_2025_26'
        and se.reviewed_by = v_reviewer_id
        and se.reviewed_at = v_reviewed_at
      )
  ) then
    raise exception 'Existing CDMO_CRAMS secondary row conflicts with the approved Gate E decision; persistence aborted.';
  end if;

  insert into public.research_subprofile_secondary_exposures (
    assignment_id, parent_profile_code, parent_profile_version,
    subprofile_code, subprofile_version, materiality_state,
    evidence_basis, source_reference, assignment_status,
    confidence_state, effective_from, effective_to,
    reason_code, reviewed_by, reviewed_at
  )
  select
    v_assignment_id, 'PHARMA', 'PHARMA_V1',
    'GLOBAL_GENERICS', 'GLOBAL_GENERICS_V1', 'MATERIAL',
    'Issuer-defined US and Germany generic businesses; comparable FY2025-26 standalone revenue share is approximately 12.05 percent.',
    'TORNTPHARM_AR_2025_26; TORNTPHARM_Q2_FY25_26_EARNINGS_CALL',
    'REVIEWED', 'MEDIUM', '2026-03-31 00:00:00+00'::timestamptz, null,
    'ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10', v_reviewer_id, v_reviewed_at
  where not exists (
    select 1 from public.research_subprofile_secondary_exposures
    where assignment_id = v_assignment_id
      and subprofile_code = 'GLOBAL_GENERICS'
      and subprofile_version = 'GLOBAL_GENERICS_V1'
  );

  insert into public.research_subprofile_secondary_exposures (
    assignment_id, parent_profile_code, parent_profile_version,
    subprofile_code, subprofile_version, materiality_state,
    evidence_basis, source_reference, assignment_status,
    confidence_state, effective_from, effective_to,
    reason_code, reviewed_by, reviewed_at
  )
  select
    v_assignment_id, 'PHARMA', 'PHARMA_V1',
    'CDMO_CRAMS', 'CDMO_CRAMS_V1', 'EMERGING',
    'Owner-reviewed qualitative V1 override based on issuer disclosure describing emerging international CDMO capability and a meaningful entry/expansion opportunity into the CDMO segment.',
    'TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29; TORNTPHARM_AR_2025_26',
    'REVIEWED', 'MEDIUM', '2026-03-31 00:00:00+00'::timestamptz, null,
    'OWNER_REVIEWED_STRATEGIC_EMERGING_CDMO_CAPABILITY', v_reviewer_id, v_reviewed_at
  where not exists (
    select 1 from public.research_subprofile_secondary_exposures
    where assignment_id = v_assignment_id
      and subprofile_code = 'CDMO_CRAMS'
      and subprofile_version = 'CDMO_CRAMS_V1'
  );

  select count(*) into v_secondary_count
  from public.research_subprofile_secondary_exposures
  where assignment_id = v_assignment_id;

  if v_secondary_count <> 2 then
    raise exception 'Expected exactly two approved secondary rows after persistence candidate; found %. Persistence aborted.', v_secondary_count;
  end if;
end;
$$;

select
  s.symbol,
  s.exchange,
  a.id as assignment_id,
  a.subprofile_code as primary_subprofile,
  a.assignment_status,
  a.confidence_state,
  a.effective_from,
  a.reviewed_at,
  se.subprofile_code as secondary_subprofile,
  se.materiality_state,
  se.confidence_state as secondary_confidence,
  se.assignment_status as secondary_status
from public.research_subprofile_assignments a
join public.securities s on s.id = a.security_id
left join public.research_subprofile_secondary_exposures se on se.assignment_id = a.id
where a.security_id = current_setting('r4n.target_security_id')::uuid
  and a.parent_profile_code = 'PHARMA'
order by se.subprofile_code;

\if :commit_authorized
  \echo 'COMMIT AUTHORIZED BY CALLER VARIABLE: committing transaction.'
  commit;
\else
  \echo 'SAFE DEFAULT: commit_authorized=false; rolling back transaction.'
  rollback;
\endif
