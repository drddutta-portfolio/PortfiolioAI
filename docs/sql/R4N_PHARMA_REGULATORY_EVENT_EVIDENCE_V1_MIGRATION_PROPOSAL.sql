-- PROPOSAL ONLY — DO NOT APPLY.
-- R4N / Gate F review artifact.
-- Intentionally stored under docs/sql rather than supabase/migrations so normal
-- Supabase migration tooling cannot apply it accidentally.
--
-- Proposed contract:
--   PHARMA_REGULATORY_EVENT_EVIDENCE_V1
-- Purpose:
--   Append-only, site-specific regulatory-event evidence for
--   PHARMA_REGULATORY_SITE_STATUS.
--
-- This proposal must receive separate owner approval, migration-version
-- assignment, local replay validation, RLS/grant validation, and production
-- preflight before it can become an executable migration.

begin;

do $preflight$
begin
  if to_regclass('public.research_regulatory_event_observations') is not null then
    raise exception 'PROPOSAL_CONFLICT: research_regulatory_event_observations already exists';
  end if;

  if to_regclass('public.securities') is null
     or to_regclass('public.data_sources') is null
     or to_regclass('public.data_source_records') is null then
    raise exception 'PROPOSAL_PREREQUISITE_MISSING: canonical evidence tables';
  end if;

  if to_regprocedure('public.portfolioai_reject_stage7_evidence_mutation()') is null then
    raise exception 'PROPOSAL_PREREQUISITE_MISSING: immutable evidence trigger function';
  end if;

  if exists (
    select 1
    from public.data_sources
    where code = 'US_FDA_OFFICIAL'
      and (
        source_kind <> 'PUBLIC_WEB'
        or evidence_priority <> 10
        or is_active
        or entitlement_verified
        or retention_rights_verified
      )
  ) then
    raise exception 'PROPOSAL_CONFLICT: existing US_FDA_OFFICIAL registry row has different semantics';
  end if;
end
$preflight$;

-- Proposed registry entry only. It remains inactive and rights-unverified until
-- a later gate explicitly reviews activation/retention semantics.
insert into public.data_sources (
  code,
  name,
  source_kind,
  evidence_priority,
  is_active,
  entitlement_verified,
  retention_rights_verified,
  capabilities,
  configuration
)
values (
  'US_FDA_OFFICIAL',
  'U.S. Food and Drug Administration official regulatory evidence',
  'PUBLIC_WEB',
  10,
  false,
  false,
  false,
  jsonb_build_object(
    'official_regulator', true,
    'pharma_regulatory_events', true,
    'site_specific_evidence', true
  ),
  jsonb_build_object(
    'activation_state', 'PROPOSAL_ONLY',
    'retention_scope', 'metadata_and_reviewed_public_facts_only'
  )
)
on conflict (code) do nothing;

create table public.research_regulatory_event_observations (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null,
  metric_code text not null,
  regulator_code text not null,
  facility_key text not null,
  facility_name text not null,
  regulatory_chain_id text not null,
  event_date date not null,
  event_state text not null,
  scope text not null,
  source_record_id uuid not null,
  source_code text not null,
  source_artifact_code text not null,
  source_reference text not null,
  retrieved_at timestamptz not null default clock_timestamp(),
  evidence_status text not null default 'AVAILABLE',
  created_at timestamptz not null default clock_timestamp(),

  constraint research_reg_event_metric_v1
    check (metric_code = 'PHARMA_REGULATORY_SITE_STATUS'),
  constraint research_reg_event_regulator_v1
    check (regulator_code = 'US_FDA'),
  constraint research_reg_event_state_v1
    check (event_state in ('WARNING_LETTER_ACTIVE', 'WARNING_LETTER_CLOSED_OUT')),
  constraint research_reg_event_scope_v1
    check (scope = 'SITE_SPECIFIC'),
  constraint research_reg_event_facility_key_nonempty
    check (length(btrim(facility_key)) > 0),
  constraint research_reg_event_facility_name_nonempty
    check (length(btrim(facility_name)) > 0),
  constraint research_reg_event_chain_nonempty
    check (length(btrim(regulatory_chain_id)) > 0),
  constraint research_reg_event_artifact_nonempty
    check (length(btrim(source_artifact_code)) > 0),
  constraint research_reg_event_reference_nonempty
    check (length(btrim(source_reference)) > 0),
  constraint research_reg_event_evidence_status
    check (evidence_status in ('AVAILABLE', 'STALE', 'CONFLICTING', 'REJECTED')),

  constraint research_reg_event_security_fkey
    foreign key (security_id)
    references public.securities(id)
    on delete restrict,
  constraint research_reg_event_source_record_fkey
    foreign key (source_record_id)
    references public.data_source_records(id)
    on delete restrict,
  constraint research_reg_event_source_code_fkey
    foreign key (source_code)
    references public.data_sources(code)
    on delete restrict,

  constraint research_reg_event_source_code_v1
    check (source_code = 'US_FDA_OFFICIAL'),

  constraint research_reg_event_logical_identity
    unique (
      security_id,
      metric_code,
      regulator_code,
      facility_key,
      regulatory_chain_id,
      event_date,
      event_state,
      source_artifact_code
    )
);

comment on table public.research_regulatory_event_observations is
  'PROPOSED V1 append-only site-specific regulatory-event evidence. No company-wide regulatory state may be inferred from one facility chain.';

create index research_reg_event_security_date_idx
  on public.research_regulatory_event_observations(security_id, event_date desc);

create index research_reg_event_facility_chain_idx
  on public.research_regulatory_event_observations(
    security_id,
    regulator_code,
    facility_key,
    regulatory_chain_id,
    event_date desc
  );

create trigger research_regulatory_event_observations_immutable
before update or delete on public.research_regulatory_event_observations
for each row execute function public.portfolioai_reject_stage7_evidence_mutation();

alter table public.research_regulatory_event_observations enable row level security;

create policy "Users read held regulatory event evidence"
on public.research_regulatory_event_observations
for select
to authenticated
using (
  exists (
    select 1
    from public.transactions t
    join public.portfolios p on p.id = t.portfolio_id
    where t.security_id = research_regulatory_event_observations.security_id
      and p.user_id = (select auth.uid())
  )
);

revoke all on table public.research_regulatory_event_observations
  from public, anon, authenticated;
grant select on table public.research_regulatory_event_observations
  to authenticated;
grant all on table public.research_regulatory_event_observations
  to service_role;

create view public.current_research_regulatory_site_state_v1
with (security_invoker = true)
as
select distinct on (
  security_id,
  regulator_code,
  facility_key,
  regulatory_chain_id
)
  security_id,
  metric_code,
  regulator_code,
  facility_key,
  facility_name,
  regulatory_chain_id,
  event_date,
  event_state,
  scope,
  source_record_id,
  source_code,
  source_artifact_code,
  source_reference,
  retrieved_at,
  evidence_status
from public.research_regulatory_event_observations
order by
  security_id,
  regulator_code,
  facility_key,
  regulatory_chain_id,
  event_date desc,
  created_at desc;

revoke all on table public.current_research_regulatory_site_state_v1
  from public, anon;
grant select on table public.current_research_regulatory_site_state_v1
  to authenticated, service_role;

-- Proposed postconditions. A future executable migration should preserve these
-- checks and add pgTAP coverage before any deployment.
do $postconditions$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.research_regulatory_event_observations'::regclass) then
    raise exception 'PROPOSAL_POSTCONDITION_FAILED: RLS disabled';
  end if;

  if has_table_privilege('authenticated', 'public.research_regulatory_event_observations', 'INSERT')
     or has_table_privilege('authenticated', 'public.research_regulatory_event_observations', 'UPDATE')
     or has_table_privilege('authenticated', 'public.research_regulatory_event_observations', 'DELETE') then
    raise exception 'PROPOSAL_POSTCONDITION_FAILED: authenticated mutation grant';
  end if;
end
$postconditions$;

-- Deliberately rollback: this file is a design proposal, not a migration.
rollback;
