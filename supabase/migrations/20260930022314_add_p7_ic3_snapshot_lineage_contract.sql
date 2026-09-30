-- P7-IC IC3 canonical snapshot-lineage contract.
-- Additive only: existing immutable snapshots/items and IC2 selection history are preserved.

alter table public.research_evidence_snapshot_selections
  drop constraint research_evidence_snapshot_selections_selection_basis_check;

alter table public.research_evidence_snapshot_selections
  add constraint research_evidence_snapshot_selections_selection_basis_check
  check (selection_basis in (
    'BACKFILL_CURRENT_VIEW',
    'MATERIALIZED_RECONCILIATION',
    'CORRECTIVE_RESELECTION',
    'REPEATABILITY_PROOF',
    'IC3_CANONICAL_MATERIALIZATION'
  ));

create table public.research_evidence_snapshot_lineage (
  snapshot_id uuid primary key,
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  classification_authority text not null,
  classification_version text not null,
  methodology_role text not null,
  assignment_authority text not null,
  assignment_id text not null,
  assignment_version text not null,
  created_at timestamptz not null default now(),
  constraint research_evidence_snapshot_lineage_snapshot_scope_fk
    foreign key (snapshot_id, portfolio_id, security_id)
    references public.research_evidence_snapshots(id, portfolio_id, security_id)
    on delete restrict
);

create index research_evidence_snapshot_lineage_portfolio_security_idx
  on public.research_evidence_snapshot_lineage(portfolio_id, security_id);

create trigger research_evidence_snapshot_lineage_append_only
before update or delete on public.research_evidence_snapshot_lineage
for each row execute function public.reject_research_evidence_snapshot_mutation_v1();

alter table public.research_evidence_snapshot_lineage enable row level security;

create policy research_evidence_snapshot_lineage_owner_read
on public.research_evidence_snapshot_lineage
for select to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = (select auth.uid())
  )
);

revoke all on public.research_evidence_snapshot_lineage from public, anon, authenticated;
grant select on public.research_evidence_snapshot_lineage to authenticated;
grant all on public.research_evidence_snapshot_lineage to service_role;

create view public.current_research_evidence_snapshot_lineage_v1
with (security_invoker = true) as
select
  s.*,
  l.classification_authority,
  l.classification_version,
  l.methodology_role,
  l.assignment_authority,
  l.assignment_id,
  l.assignment_version
from public.current_research_evidence_snapshot_v1 s
join public.research_evidence_snapshot_lineage l on l.snapshot_id = s.id;

revoke all on public.current_research_evidence_snapshot_lineage_v1 from public, anon, authenticated;
grant select on public.current_research_evidence_snapshot_lineage_v1 to authenticated;

create function public.append_and_select_research_evidence_snapshot_v3(
  p_snapshot jsonb,
  p_items jsonb,
  p_selection jsonb,
  p_lineage jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_snapshot_id uuid;
  v_existing public.research_evidence_snapshot_lineage%rowtype;
begin
  if p_selection->>'selection_basis' <> 'IC3_CANONICAL_MATERIALIZATION' then
    raise exception using errcode='22023', message='V3 requires IC3_CANONICAL_MATERIALIZATION selection basis.';
  end if;

  if nullif(p_lineage->>'classification_authority','') is null
     or nullif(p_lineage->>'classification_version','') is null
     or nullif(p_lineage->>'methodology_role','') is null
     or nullif(p_lineage->>'assignment_authority','') is null
     or nullif(p_lineage->>'assignment_id','') is null
     or nullif(p_lineage->>'assignment_version','') is null then
    raise exception using errcode='22023', message='Complete IC3 snapshot lineage is required.';
  end if;

  v_result := public.append_and_select_research_evidence_snapshot_v2(
    p_snapshot, p_items, p_selection
  );
  v_snapshot_id := (v_result->>'snapshot_id')::uuid;

  insert into public.research_evidence_snapshot_lineage (
    snapshot_id, portfolio_id, security_id,
    classification_authority, classification_version, methodology_role,
    assignment_authority, assignment_id, assignment_version
  ) values (
    v_snapshot_id,
    (p_snapshot->>'portfolio_id')::uuid,
    (p_snapshot->>'security_id')::uuid,
    p_lineage->>'classification_authority',
    p_lineage->>'classification_version',
    p_lineage->>'methodology_role',
    p_lineage->>'assignment_authority',
    p_lineage->>'assignment_id',
    p_lineage->>'assignment_version'
  ) on conflict (snapshot_id) do nothing;

  select * into v_existing
  from public.research_evidence_snapshot_lineage
  where snapshot_id = v_snapshot_id;

  if v_existing.portfolio_id is distinct from (p_snapshot->>'portfolio_id')::uuid
     or v_existing.security_id is distinct from (p_snapshot->>'security_id')::uuid
     or v_existing.classification_authority is distinct from p_lineage->>'classification_authority'
     or v_existing.classification_version is distinct from p_lineage->>'classification_version'
     or v_existing.methodology_role is distinct from p_lineage->>'methodology_role'
     or v_existing.assignment_authority is distinct from p_lineage->>'assignment_authority'
     or v_existing.assignment_id is distinct from p_lineage->>'assignment_id'
     or v_existing.assignment_version is distinct from p_lineage->>'assignment_version' then
    raise exception using errcode='22023', message='Submitted IC3 lineage does not match immutable snapshot lineage.';
  end if;

  return v_result || jsonb_build_object('lineage_recorded', true);
end;
$$;

revoke all on function public.append_and_select_research_evidence_snapshot_v3(jsonb,jsonb,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.append_and_select_research_evidence_snapshot_v3(jsonb,jsonb,jsonb,jsonb)
  to service_role;

comment on table public.research_evidence_snapshot_lineage is
  'Append-only IC3 lineage companion for immutable canonical research evidence snapshots.';
comment on view public.current_research_evidence_snapshot_lineage_v1 is
  'Owner-scoped canonical IC3 snapshot boundary with complete classification/methodology/assignment lineage.';
