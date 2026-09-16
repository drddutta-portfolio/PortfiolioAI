-- R4N follow-up: reconcile secondary-exposure persistence with the approved
-- typed lifecycle/provenance contract. Additive and fail-closed; creates no rows.

do $$
begin
  if exists (select 1 from public.research_subprofile_secondary_exposures) then
    raise exception 'Secondary-exposure contract reconciliation requires an empty table; review existing rows before migration.';
  end if;
end;
$$;

alter table public.research_subprofile_secondary_exposures
  add column if not exists assignment_status text not null,
  add column if not exists confidence_state text not null,
  add column if not exists effective_from timestamptz not null,
  add column if not exists effective_to timestamptz,
  add column if not exists reason_code text not null,
  add column if not exists reviewed_by uuid references auth.users(id) on delete restrict,
  add column if not exists reviewed_at timestamptz;

alter table public.research_subprofile_secondary_exposures
  drop constraint if exists research_subprofile_secondary_materiality,
  add constraint research_subprofile_secondary_materiality check (
    materiality_state in ('IMMATERIAL', 'EMERGING', 'MATERIAL', 'DOMINANT', 'UNKNOWN')
  ),
  add constraint research_subprofile_secondary_status check (
    assignment_status in ('PROVISIONAL', 'REVIEWED', 'DISPUTED', 'RETIRED')
  ),
  add constraint research_subprofile_secondary_confidence check (
    confidence_state in ('LOW', 'MEDIUM', 'HIGH')
  ),
  add constraint research_subprofile_secondary_interval check (
    effective_to is null or effective_to > effective_from
  ),
  add constraint research_subprofile_secondary_reason_nonempty check (
    btrim(reason_code) <> ''
  ),
  add constraint research_subprofile_secondary_review_complete check (
    assignment_status <> 'REVIEWED'
    or (
      reviewed_by is not null
      and reviewed_at is not null
      and confidence_state in ('MEDIUM', 'HIGH')
    )
  ),
  add constraint research_subprofile_secondary_retirement_complete check (
    assignment_status <> 'RETIRED' or effective_to is not null
  );

create index if not exists research_subprofile_secondary_reviewed_by_idx
  on public.research_subprofile_secondary_exposures(reviewed_by)
  where reviewed_by is not null;

comment on table public.research_subprofile_secondary_exposures is
  'Append-only, evidence-backed secondary business-model exposure history with explicit lifecycle, materiality, confidence, effective interval and review provenance. It provides overlays and never blends or replaces the primary effective contract.';

do $$
begin
  if exists (
    select 1
    from public.research_subprofile_secondary_exposures
    where assignment_status = 'REVIEWED'
      and (reviewed_by is null or reviewed_at is null or confidence_state not in ('MEDIUM', 'HIGH'))
  ) then
    raise exception 'Reviewed secondary exposures lack required provenance.';
  end if;
end;
$$;
