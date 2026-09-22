-- R4N production-compatible forward reconciliation.
-- Additive only: no assignments, scoring activation, scheduler change or ledger repair.

do $$
declare
  present_count integer;
begin
  select count(*) into present_count
  from unnest(array[
    to_regclass('public.research_subprofile_contracts'),
    to_regclass('public.research_subprofile_assignments'),
    to_regclass('public.research_subprofile_secondary_exposures')
  ]) relation_oid
  where relation_oid is not null;

  if present_count not in (0, 3) then
    raise exception 'Partial R4N research-subprofile schema detected; forward reconciliation aborted.';
  end if;
end;
$$;

-- R4N — global, versioned research-subprofile authority.
-- Schema only: this migration deliberately seeds contract definitions but creates
-- no security assignments and does not activate scoring or recommendations.

create extension if not exists btree_gist with schema extensions;

create table if not exists public.research_subprofile_contracts (
  parent_profile_code text not null,
  parent_profile_version text not null,
  subprofile_code text not null,
  subprofile_version text not null,
  display_name text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint research_subprofile_contracts_pkey primary key (
    parent_profile_code, parent_profile_version, subprofile_code, subprofile_version
  ),
  constraint research_subprofile_contract_codes check (
    parent_profile_code ~ '^[A-Z][A-Z0-9_]*$'
    and parent_profile_version ~ '^[A-Z][A-Z0-9_]*$'
    and subprofile_code ~ '^[A-Z][A-Z0-9_]*$'
    and subprofile_version ~ '^[A-Z][A-Z0-9_]*$'
  ),
  constraint research_subprofile_contract_display_name_nonempty check (btrim(display_name) <> '')
);

create table if not exists public.research_subprofile_assignments (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete restrict,
  parent_profile_code text not null,
  parent_profile_version text not null,
  subprofile_code text not null,
  subprofile_version text not null,
  assignment_status text not null,
  confidence_state text not null,
  assignment_basis text not null,
  source_reference text not null,
  source_record_id uuid references public.data_source_records(id) on delete restrict,
  effective_from timestamptz not null,
  effective_to timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  retired_by uuid references auth.users(id) on delete restrict,
  retired_at timestamptz,
  retirement_reason text,
  effective_period tstzrange generated always as (tstzrange(effective_from, effective_to, '[)')) stored,
  constraint research_subprofile_assignments_contract_fkey foreign key (
    parent_profile_code, parent_profile_version, subprofile_code, subprofile_version
  ) references public.research_subprofile_contracts (
    parent_profile_code, parent_profile_version, subprofile_code, subprofile_version
  ) on delete restrict,
  constraint research_subprofile_assignment_status check (assignment_status in ('PROVISIONAL', 'REVIEWED', 'DISPUTED', 'RETIRED')),
  constraint research_subprofile_assignment_confidence check (confidence_state in ('LOW', 'MEDIUM', 'HIGH')),
  constraint research_subprofile_assignment_interval check (effective_to is null or effective_to > effective_from),
  constraint research_subprofile_assignment_basis_nonempty check (btrim(assignment_basis) <> ''),
  constraint research_subprofile_assignment_source_nonempty check (btrim(source_reference) <> ''),
  constraint research_subprofile_assignment_review_complete check (
    (assignment_status <> 'REVIEWED')
    or (reviewed_by is not null and reviewed_at is not null and confidence_state in ('MEDIUM', 'HIGH'))
  ),
  constraint research_subprofile_assignment_retirement_complete check (
    (assignment_status <> 'RETIRED')
    or (effective_to is not null and retired_by is not null and retired_at is not null and nullif(btrim(coalesce(retirement_reason, '')), '') is not null)
  ),
  constraint research_subprofile_assignments_no_reviewed_overlap exclude using gist (
    security_id with =,
    parent_profile_code with =,
    effective_period with &&
  ) where (assignment_status in ('REVIEWED', 'RETIRED'))
);

create table if not exists public.research_subprofile_secondary_exposures (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.research_subprofile_assignments(id) on delete restrict,
  parent_profile_code text not null,
  parent_profile_version text not null,
  subprofile_code text not null,
  subprofile_version text not null,
  materiality_state text not null,
  evidence_basis text not null,
  source_reference text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint research_subprofile_secondary_contract_fkey foreign key (
    parent_profile_code, parent_profile_version, subprofile_code, subprofile_version
  ) references public.research_subprofile_contracts (
    parent_profile_code, parent_profile_version, subprofile_code, subprofile_version
  ) on delete restrict,
  constraint research_subprofile_secondary_assignment_key unique (assignment_id, subprofile_code, subprofile_version),
  constraint research_subprofile_secondary_materiality check (materiality_state in ('UNASSESSED', 'IMMATERIAL', 'MATERIAL')),
  constraint research_subprofile_secondary_evidence_nonempty check (btrim(evidence_basis) <> ''),
  constraint research_subprofile_secondary_source_nonempty check (btrim(source_reference) <> '')
);

create index if not exists research_subprofile_assignments_security_id_idx
  on public.research_subprofile_assignments(security_id);
create unique index if not exists research_subprofile_assignments_idempotency_key
  on public.research_subprofile_assignments(
    security_id, parent_profile_code, parent_profile_version,
    subprofile_code, subprofile_version, assignment_status, effective_from
  );
create index if not exists research_subprofile_assignments_source_record_id_idx
  on public.research_subprofile_assignments(source_record_id)
  where source_record_id is not null;
create index if not exists research_subprofile_assignments_reviewed_by_idx
  on public.research_subprofile_assignments(reviewed_by)
  where reviewed_by is not null;
create index if not exists research_subprofile_assignments_created_by_idx
  on public.research_subprofile_assignments(created_by)
  where created_by is not null;
create index if not exists research_subprofile_assignments_retired_by_idx
  on public.research_subprofile_assignments(retired_by)
  where retired_by is not null;
create index if not exists research_subprofile_secondary_assignment_id_idx
  on public.research_subprofile_secondary_exposures(assignment_id);

create or replace function public.protect_research_subprofile_assignment_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.assignment_status <> 'REVIEWED'
    or new.assignment_status <> 'RETIRED'
    or new.effective_to is null
    or new.effective_to <= old.effective_from
    or new.id is distinct from old.id
    or new.security_id is distinct from old.security_id
    or new.parent_profile_code is distinct from old.parent_profile_code
    or new.parent_profile_version is distinct from old.parent_profile_version
    or new.subprofile_code is distinct from old.subprofile_code
    or new.subprofile_version is distinct from old.subprofile_version
    or new.confidence_state is distinct from old.confidence_state
    or new.assignment_basis is distinct from old.assignment_basis
    or new.source_reference is distinct from old.source_reference
    or new.source_record_id is distinct from old.source_record_id
    or new.effective_from is distinct from old.effective_from
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.retired_by is null
    or new.retired_at is null
    or nullif(btrim(new.retirement_reason), '') is null
  then
    raise exception 'Reviewed research-subprofile history is append-only; only an audited retirement transition is allowed.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create or replace trigger research_subprofile_assignments_protect_history
before update on public.research_subprofile_assignments
for each row execute function public.protect_research_subprofile_assignment_history();

create or replace function public.reject_research_subprofile_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Research-subprofile history is immutable and cannot be deleted.' using errcode = '22023';
end;
$$;

create or replace trigger research_subprofile_assignments_reject_delete
before delete on public.research_subprofile_assignments
for each row execute function public.reject_research_subprofile_delete();

create or replace trigger research_subprofile_secondary_reject_delete
before delete on public.research_subprofile_secondary_exposures
for each row execute function public.reject_research_subprofile_delete();

create or replace function public.validate_research_subprofile_secondary_exposure()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  primary_assignment public.research_subprofile_assignments%rowtype;
begin
  select * into primary_assignment
  from public.research_subprofile_assignments
  where id = new.assignment_id;

  if not found
    or new.parent_profile_code is distinct from primary_assignment.parent_profile_code
    or new.parent_profile_version is distinct from primary_assignment.parent_profile_version
    or (new.subprofile_code, new.subprofile_version)
      = (primary_assignment.subprofile_code, primary_assignment.subprofile_version)
  then
    raise exception 'Secondary exposure must share the parent contract and differ from the primary subprofile.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace trigger research_subprofile_secondary_validate
before insert on public.research_subprofile_secondary_exposures
for each row execute function public.validate_research_subprofile_secondary_exposure();

alter table public.research_subprofile_contracts enable row level security;
alter table public.research_subprofile_assignments enable row level security;
alter table public.research_subprofile_secondary_exposures enable row level security;

revoke all on table public.research_subprofile_contracts from public, anon, authenticated, service_role;
revoke all on table public.research_subprofile_assignments from public, anon, authenticated, service_role;
revoke all on table public.research_subprofile_secondary_exposures from public, anon, authenticated, service_role;

grant select on table public.research_subprofile_contracts to authenticated, service_role;
grant select on table public.research_subprofile_assignments to authenticated, service_role;
grant select on table public.research_subprofile_secondary_exposures to authenticated, service_role;
grant insert on table public.research_subprofile_assignments to service_role;
grant update (assignment_status, effective_to, retired_by, retired_at, retirement_reason)
  on table public.research_subprofile_assignments to service_role;
grant insert on table public.research_subprofile_secondary_exposures to service_role;

drop policy if exists research_subprofile_contracts_authenticated_read on public.research_subprofile_contracts;

create policy research_subprofile_contracts_authenticated_read
  on public.research_subprofile_contracts
  for select to authenticated
  using (true);

drop policy if exists research_subprofile_assignments_held_security_read on public.research_subprofile_assignments;

create policy research_subprofile_assignments_held_security_read
  on public.research_subprofile_assignments
  for select to authenticated
  using (
    exists (
      select 1
      from public.transactions t
      join public.portfolios p on p.id = t.portfolio_id
      where t.security_id = research_subprofile_assignments.security_id
        and p.user_id = (select auth.uid())
    )
  );

drop policy if exists research_subprofile_secondary_held_security_read on public.research_subprofile_secondary_exposures;

create policy research_subprofile_secondary_held_security_read
  on public.research_subprofile_secondary_exposures
  for select to authenticated
  using (
    exists (
      select 1
      from public.research_subprofile_assignments a
      join public.transactions t on t.security_id = a.security_id
      join public.portfolios p on p.id = t.portfolio_id
      where a.id = research_subprofile_secondary_exposures.assignment_id
        and p.user_id = (select auth.uid())
    )
  );

revoke execute on function public.protect_research_subprofile_assignment_history() from public, anon, authenticated;
revoke execute on function public.reject_research_subprofile_delete() from public, anon, authenticated;
revoke execute on function public.validate_research_subprofile_secondary_exposure() from public, anon, authenticated;

insert into public.research_subprofile_contracts(
  parent_profile_code, parent_profile_version, subprofile_code, subprofile_version, display_name
)
values
  ('PHARMA', 'PHARMA_V1', 'API_BULK_DRUGS', 'API_BULK_DRUGS_V1', 'API / Bulk Drugs'),
  ('PHARMA', 'PHARMA_V1', 'DOMESTIC_FORMULATIONS', 'DOMESTIC_FORMULATIONS_V1', 'Domestic Formulations'),
  ('PHARMA', 'PHARMA_V1', 'GLOBAL_GENERICS', 'GLOBAL_GENERICS_V1', 'Global Generics'),
  ('PHARMA', 'PHARMA_V1', 'BIOPHARMA_BIOSIMILARS', 'BIOPHARMA_BIOSIMILARS_V1', 'Biopharma / Biosimilars'),
  ('PHARMA', 'PHARMA_V1', 'CDMO_CRAMS', 'CDMO_CRAMS_V1', 'CDMO / CRAMS')
on conflict do nothing;

comment on table public.research_subprofile_contracts is
  'Immutable registered research-methodology subprofile versions; separate from application-wide security classification.';
comment on table public.research_subprofile_assignments is
  'Global canonical research-subprofile assignment history keyed by security id. Non-resolved states must block subprofile readiness, scoring and recommendation.';
comment on table public.research_subprofile_secondary_exposures is
  'Evidence-backed secondary business-model exposures. They provide overlays and never blend or replace the primary effective contract.';


do $$
declare
  invalid_contract_count integer;
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.research_subprofile_assignments'::regclass
      and conname = 'research_subprofile_assignments_no_reviewed_overlap'
  ) then
    raise exception 'R4N reviewed-assignment overlap protection is unavailable.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'research_subprofile_assignments'
      and policyname = 'research_subprofile_assignments_held_security_read'
  ) then
    raise exception 'R4N held-security assignment read policy is unavailable.';
  end if;

  select count(*) into invalid_contract_count
  from (values
    ('PHARMA', 'PHARMA_V1', 'API_BULK_DRUGS', 'API_BULK_DRUGS_V1', 'API / Bulk Drugs'),
    ('PHARMA', 'PHARMA_V1', 'DOMESTIC_FORMULATIONS', 'DOMESTIC_FORMULATIONS_V1', 'Domestic Formulations'),
    ('PHARMA', 'PHARMA_V1', 'GLOBAL_GENERICS', 'GLOBAL_GENERICS_V1', 'Global Generics'),
    ('PHARMA', 'PHARMA_V1', 'BIOPHARMA_BIOSIMILARS', 'BIOPHARMA_BIOSIMILARS_V1', 'Biopharma / Biosimilars'),
    ('PHARMA', 'PHARMA_V1', 'CDMO_CRAMS', 'CDMO_CRAMS_V1', 'CDMO / CRAMS')
  ) expected(parent_profile_code, parent_profile_version, subprofile_code, subprofile_version, display_name)
  left join public.research_subprofile_contracts actual
    using (parent_profile_code, parent_profile_version, subprofile_code, subprofile_version)
  where actual.display_name is distinct from expected.display_name;

  if invalid_contract_count <> 0 then
    raise exception 'R4N research-subprofile contract registry conflicts with the approved V1 contract.';
  end if;
end;
$$;
