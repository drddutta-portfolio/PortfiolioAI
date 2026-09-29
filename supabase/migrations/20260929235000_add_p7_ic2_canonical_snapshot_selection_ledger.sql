-- P7-IC IC2 canonical current-selection remediation.
-- Repository-only Stage 2 artifact. Development application is separately approval-gated.
--
-- This migration preserves immutable research evidence snapshots/items and introduces
-- a separate append-only selection history so a previously existing deterministic
-- snapshot can become canonical again without being duplicated or mutated.

alter table public.research_evidence_snapshots
  add constraint research_evidence_snapshots_id_portfolio_security_uq
  unique (id, portfolio_id, security_id);

create table public.research_evidence_snapshot_selections (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  snapshot_id uuid not null,
  selection_run_id uuid not null,
  execution_grant_id uuid references public.data_source_records(id) on delete restrict,
  evaluation_as_of timestamptz not null,
  source_cutoff_at timestamptz not null,
  selection_basis text not null check (
    selection_basis in (
      'BACKFILL_CURRENT_VIEW',
      'MATERIALIZED_RECONCILIATION',
      'CORRECTIVE_RESELECTION',
      'REPEATABILITY_PROOF'
    )
  ),
  materializer_version text not null,
  selected_at timestamptz not null default now(),
  selected_by uuid references auth.users(id) on delete set null,
  constraint research_evidence_snapshot_selections_snapshot_scope_fk
    foreign key (snapshot_id, portfolio_id, security_id)
    references public.research_evidence_snapshots(id, portfolio_id, security_id)
    on delete restrict,
  constraint research_evidence_snapshot_selections_portfolio_run_security_uq
    unique (portfolio_id, selection_run_id, security_id),
  constraint research_evidence_snapshot_selections_cutoff_lte_evaluation_ck
    check (source_cutoff_at <= evaluation_as_of)
);

create index research_evidence_snapshot_selections_current_idx
  on public.research_evidence_snapshot_selections
  (portfolio_id, security_id, selected_at desc, id desc);

create index research_evidence_snapshot_selections_snapshot_idx
  on public.research_evidence_snapshot_selections(snapshot_id);

create index research_evidence_snapshot_selections_execution_grant_idx
  on public.research_evidence_snapshot_selections(execution_grant_id)
  where execution_grant_id is not null;

create trigger research_evidence_snapshot_selections_append_only
before update or delete on public.research_evidence_snapshot_selections
for each row execute function public.reject_research_evidence_snapshot_mutation_v1();

alter table public.research_evidence_snapshot_selections enable row level security;

create policy research_evidence_snapshot_selections_owner_read
on public.research_evidence_snapshot_selections
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.user_id = (select auth.uid())
  )
);

revoke all on public.research_evidence_snapshot_selections from public, anon, authenticated;
grant select on public.research_evidence_snapshot_selections to authenticated;

-- Backfill the exact current projection before replacing the view. This intentionally
-- preserves observable current behavior; correction happens only in a later, separately
-- authorized reconciliation campaign.
do $$
declare
  v_backfill_run_id constant uuid := 'f2b00000-0000-4000-8000-000000000001';
  v_backfill_at timestamptz := clock_timestamp();
  v_expected bigint;
  v_inserted bigint;
begin
  select count(*) into v_expected
  from public.current_research_evidence_snapshot_v1;

  insert into public.research_evidence_snapshot_selections (
    portfolio_id,
    security_id,
    snapshot_id,
    selection_run_id,
    execution_grant_id,
    evaluation_as_of,
    source_cutoff_at,
    selection_basis,
    materializer_version,
    selected_at,
    selected_by
  )
  select
    s.portfolio_id,
    s.security_id,
    s.id,
    v_backfill_run_id,
    null,
    v_backfill_at,
    v_backfill_at,
    'BACKFILL_CURRENT_VIEW',
    'P7_IC2_SELECTION_LEDGER_BACKFILL_V1',
    v_backfill_at,
    null
  from public.current_research_evidence_snapshot_v1 s;

  get diagnostics v_inserted = row_count;

  if v_inserted <> v_expected then
    raise exception using
      errcode = '55000',
      message = format(
        'P7 IC2 selection backfill mismatch: expected %s rows, inserted %s rows.',
        v_expected,
        v_inserted
      );
  end if;
end;
$$;

create or replace view public.current_research_evidence_snapshot_v1
with (security_invoker = true) as
select s.*
from public.research_evidence_snapshot_selections sel
join public.research_evidence_snapshots s
  on s.id = sel.snapshot_id
where not exists (
  select 1
  from public.research_evidence_snapshot_selections newer
  where newer.portfolio_id = sel.portfolio_id
    and newer.security_id = sel.security_id
    and (newer.selected_at, newer.id) > (sel.selected_at, sel.id)
);

revoke all on public.current_research_evidence_snapshot_v1 from public, anon, authenticated;
grant select on public.current_research_evidence_snapshot_v1 to authenticated;

create function public.append_and_select_research_evidence_snapshot_v2(
  p_snapshot jsonb,
  p_items jsonb,
  p_selection jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_snapshot_id uuid;
  v_selection_id uuid;
  v_existing_snapshot public.research_evidence_snapshots%rowtype;
  v_existing_selection public.research_evidence_snapshot_selections%rowtype;
  v_submitted_items jsonb;
  v_stored_items jsonb;
  v_snapshot_created boolean := false;
  v_selection_created boolean := false;
  v_portfolio_id uuid := (p_snapshot->>'portfolio_id')::uuid;
  v_security_id uuid := (p_snapshot->>'security_id')::uuid;
  v_snapshot_as_of_date date := (p_snapshot->>'as_of_date')::date;
  v_selection_run_id uuid := nullif(p_selection->>'selection_run_id','')::uuid;
  v_execution_grant_id uuid := nullif(p_selection->>'execution_grant_id','')::uuid;
  v_evaluation_as_of timestamptz := nullif(p_selection->>'evaluation_as_of','')::timestamptz;
  v_source_cutoff_at timestamptz := nullif(p_selection->>'source_cutoff_at','')::timestamptz;
  v_selection_basis text := p_selection->>'selection_basis';
  v_materializer_version text := p_selection->>'materializer_version';
  v_selected_by uuid := nullif(p_selection->>'selected_by','')::uuid;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode='22023', message='Snapshot items must be a non-empty array.';
  end if;

  if v_selection_run_id is null
     or v_evaluation_as_of is null
     or v_source_cutoff_at is null
     or nullif(v_selection_basis,'') is null
     or nullif(v_materializer_version,'') is null then
    raise exception using
      errcode='22023',
      message='Selection run, evaluation time, source cutoff, basis, and materializer version are required.';
  end if;

  if v_source_cutoff_at > v_evaluation_as_of then
    raise exception using errcode='22023', message='Source cutoff cannot be later than evaluation time.';
  end if;

  if v_snapshot_as_of_date <> (v_evaluation_as_of at time zone 'UTC')::date then
    raise exception using
      errcode='22023',
      message='Snapshot as_of_date must equal the UTC date of evaluation_as_of.';
  end if;

  select jsonb_agg(to_jsonb(x) order by x.requirement_code)
  into v_submitted_items
  from jsonb_to_recordset(p_items) as x(
    requirement_code text,
    metric_code text,
    required boolean,
    minimum_history integer,
    freshness_policy text,
    benchmark_authority text[],
    applicability text,
    evidence_state text,
    candidate_evidence_ids uuid[],
    selected_evidence_id uuid,
    evidence_as_of_date date,
    retrieved_at timestamptz,
    fresh_through date,
    source_provider text,
    raw_source_record_id uuid,
    normalized_value jsonb,
    validation_state text,
    canonical_selection_state text,
    reason_code text,
    recommended_remediation_action text
  );

  if v_submitted_items is null then
    raise exception using errcode='22023', message='Snapshot items could not be normalized for verification.';
  end if;

  if exists (
    select 1
    from public.research_evidence_snapshot_selections r
    where r.portfolio_id = v_portfolio_id
      and r.selection_run_id = v_selection_run_id
      and (
        r.evaluation_as_of <> v_evaluation_as_of
        or r.source_cutoff_at <> v_source_cutoff_at
        or r.selection_basis <> v_selection_basis
        or r.materializer_version <> v_materializer_version
      )
  ) then
    raise exception using
      errcode='22023',
      message='Selection run metadata is inconsistent with prior selections in the same run.';
  end if;

  insert into public.research_evidence_snapshots (
    portfolio_id,
    security_id,
    as_of_date,
    methodology_authority,
    methodology_version,
    profile_code,
    subprofile_code,
    requirement_registry_version,
    snapshot_status,
    snapshot_hash,
    created_by
  ) values (
    v_portfolio_id,
    v_security_id,
    v_snapshot_as_of_date,
    p_snapshot->>'methodology_authority',
    p_snapshot->>'methodology_version',
    p_snapshot->>'profile_code',
    nullif(p_snapshot->>'subprofile_code',''),
    p_snapshot->>'requirement_registry_version',
    p_snapshot->>'snapshot_status',
    p_snapshot->>'snapshot_hash',
    nullif(p_snapshot->>'created_by','')::uuid
  )
  on conflict (
    security_id,
    as_of_date,
    methodology_authority,
    methodology_version,
    requirement_registry_version,
    snapshot_hash
  )
  do nothing
  returning id into v_snapshot_id;

  if v_snapshot_id is null then
    select * into v_existing_snapshot
    from public.research_evidence_snapshots
    where portfolio_id = v_portfolio_id
      and security_id = v_security_id
      and as_of_date = v_snapshot_as_of_date
      and methodology_authority = p_snapshot->>'methodology_authority'
      and methodology_version = p_snapshot->>'methodology_version'
      and requirement_registry_version = p_snapshot->>'requirement_registry_version'
      and snapshot_hash = p_snapshot->>'snapshot_hash';

    if v_existing_snapshot.id is null then
      raise exception using
        errcode='55000',
        message='Existing deterministic snapshot could not be resolved in the requested portfolio after uniqueness conflict.';
    end if;

    if v_existing_snapshot.profile_code is distinct from p_snapshot->>'profile_code'
       or v_existing_snapshot.subprofile_code is distinct from nullif(p_snapshot->>'subprofile_code','')
       or v_existing_snapshot.snapshot_status is distinct from p_snapshot->>'snapshot_status' then
      raise exception using
        errcode='22023',
        message='Submitted snapshot metadata does not match the stored immutable snapshot.';
    end if;

    v_snapshot_id := v_existing_snapshot.id;

    select jsonb_agg(
      to_jsonb(i) - 'id' - 'snapshot_id' - 'created_at'
      order by i.requirement_code
    )
    into v_stored_items
    from public.research_evidence_snapshot_items i
    where i.snapshot_id = v_snapshot_id;

    if v_stored_items is distinct from v_submitted_items then
      raise exception using
        errcode='22023',
        message='Submitted snapshot items do not match the stored immutable snapshot content.';
    end if;
  else
    v_snapshot_created := true;

    insert into public.research_evidence_snapshot_items (
      snapshot_id,
      requirement_code,
      metric_code,
      required,
      minimum_history,
      freshness_policy,
      benchmark_authority,
      applicability,
      evidence_state,
      candidate_evidence_ids,
      selected_evidence_id,
      evidence_as_of_date,
      retrieved_at,
      fresh_through,
      source_provider,
      raw_source_record_id,
      normalized_value,
      validation_state,
      canonical_selection_state,
      reason_code,
      recommended_remediation_action
    )
    select
      v_snapshot_id,
      x.requirement_code,
      x.metric_code,
      x.required,
      x.minimum_history,
      x.freshness_policy,
      x.benchmark_authority,
      x.applicability,
      x.evidence_state,
      x.candidate_evidence_ids,
      x.selected_evidence_id,
      x.evidence_as_of_date,
      x.retrieved_at,
      x.fresh_through,
      x.source_provider,
      x.raw_source_record_id,
      x.normalized_value,
      x.validation_state,
      x.canonical_selection_state,
      x.reason_code,
      x.recommended_remediation_action
    from jsonb_to_recordset(p_items) as x(
      requirement_code text,
      metric_code text,
      required boolean,
      minimum_history integer,
      freshness_policy text,
      benchmark_authority text[],
      applicability text,
      evidence_state text,
      candidate_evidence_ids uuid[],
      selected_evidence_id uuid,
      evidence_as_of_date date,
      retrieved_at timestamptz,
      fresh_through date,
      source_provider text,
      raw_source_record_id uuid,
      normalized_value jsonb,
      validation_state text,
      canonical_selection_state text,
      reason_code text,
      recommended_remediation_action text
    );
  end if;

  insert into public.research_evidence_snapshot_selections (
    portfolio_id,
    security_id,
    snapshot_id,
    selection_run_id,
    execution_grant_id,
    evaluation_as_of,
    source_cutoff_at,
    selection_basis,
    materializer_version,
    selected_by
  ) values (
    v_portfolio_id,
    v_security_id,
    v_snapshot_id,
    v_selection_run_id,
    v_execution_grant_id,
    v_evaluation_as_of,
    v_source_cutoff_at,
    v_selection_basis,
    v_materializer_version,
    v_selected_by
  )
  on conflict (portfolio_id, selection_run_id, security_id)
  do nothing
  returning id into v_selection_id;

  if v_selection_id is null then
    select * into v_existing_selection
    from public.research_evidence_snapshot_selections
    where portfolio_id = v_portfolio_id
      and selection_run_id = v_selection_run_id
      and security_id = v_security_id;

    if v_existing_selection.id is null then
      raise exception using
        errcode='55000',
        message='Existing selection could not be resolved after idempotency conflict.';
    end if;

    if v_existing_selection.snapshot_id <> v_snapshot_id
       or v_existing_selection.portfolio_id <> v_portfolio_id then
      raise exception using
        errcode='22023',
        message='Selection idempotency key was reused for different canonical content.';
    end if;

    v_selection_id := v_existing_selection.id;
  else
    v_selection_created := true;
  end if;

  return jsonb_build_object(
    'snapshot_id', v_snapshot_id,
    'selection_id', v_selection_id,
    'snapshot_created', v_snapshot_created,
    'snapshot_reused', not v_snapshot_created,
    'selection_created', v_selection_created,
    'selection_reused', not v_selection_created
  );
end;
$$;

revoke all on function public.append_and_select_research_evidence_snapshot_v2(jsonb,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.append_and_select_research_evidence_snapshot_v2(jsonb,jsonb,jsonb)
  to service_role;
