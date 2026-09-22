-- Stage 8.3 — explicit reviewed scoring-profile assignments and first bank-metric promotion.
-- This migration is additive and idempotent. It does not activate the scoring model,
-- create a stock score run, call Trendlyne, or change portfolio roles.

create table if not exists public.security_scoring_profile_assignments (
  security_id uuid primary key references public.securities(id) on delete cascade,
  scoring_profile_code text not null references public.scoring_profiles(code) on delete restrict,
  assignment_status text not null default 'REVIEWED',
  assignment_basis text not null,
  source_reference text,
  assigned_at timestamptz not null default clock_timestamp(),
  reviewed_at timestamptz,
  notes text,
  constraint security_scoring_profile_assignment_status check (assignment_status in ('PROVISIONAL','REVIEWED','RETIRED')),
  constraint security_scoring_profile_assignment_basis_nonempty check (length(trim(assignment_basis)) > 0)
);

alter table public.security_scoring_profile_assignments enable row level security;

create policy security_scoring_profile_assignments_authenticated_read
  on public.security_scoring_profile_assignments
  for select to authenticated using (true);

comment on table public.security_scoring_profile_assignments is
  'Explicit reviewed scoring-profile assignments used when trusted sector/industry enrichment is unavailable or requires override. These assignments affect scoring methodology only and never portfolio membership or Core/Satellite role.';

-- HDFCBANK is the owner-reviewed Bank/NBFC pilot. Production sector enrichment is
-- currently unavailable, so preserve the intended lender methodology explicitly.
insert into public.security_scoring_profile_assignments(
  security_id, scoring_profile_code, assignment_status, assignment_basis,
  source_reference, reviewed_at, notes
)
select
  s.id,
  'BANK_NBFC',
  'REVIEWED',
  'OWNER_REVIEWED_STAGE_8_PILOT',
  'Stage_8_1_Bank_NBFC_Scoring_Contract.md',
  clock_timestamp(),
  'Use Bank/NBFC scoring methodology until trusted sector enrichment becomes available; future sector evidence may confirm or supersede this assignment through a reviewed migration.'
from public.securities s
where s.symbol='HDFCBANK'
on conflict (security_id) do update set
  scoring_profile_code=excluded.scoring_profile_code,
  assignment_status=excluded.assignment_status,
  assignment_basis=excluded.assignment_basis,
  source_reference=excluded.source_reference,
  reviewed_at=excluded.reviewed_at,
  notes=excluded.notes;

-- Promote only the three exact labels verified from the immutable HDFCBANK
-- BANK_SCORING_CONTRACT_DISCOVERY capture. The guard requires the captured response
-- itself to contain both the exact provider label and exact HDFCBANK value.
-- Reporting period end is intentionally left null because the provider result did
-- not state a safe exact quarter-end date for these fields.
with candidate_source as (
  select dsr.id as source_record_id, dsr.retrieved_at, dsr.raw_payload
  from public.data_source_records dsr
  join public.securities s on s.id = (dsr.raw_payload->>'security_id')::uuid
  where dsr.source_code='TRENDLYNE_MCP'
    and dsr.record_kind='BANK_SCORING_CONTRACT_DISCOVERY'
    and s.symbol='HDFCBANK'
    and dsr.raw_payload->>'security_symbol'='HDFCBANK'
    and dsr.raw_payload->>'result' like '%Gross NPA ratio Qtr %%'
    and dsr.raw_payload->>'result' like '%HDFCBANK:1.17%'
    and dsr.raw_payload->>'result' like '%Net NPA ratio % Qtr%'
    and dsr.raw_payload->>'result' like '%HDFCBANK:0.41%'
    and dsr.raw_payload->>'result' like '%EPS Qtr YoY Growth %%'
    and dsr.raw_payload->>'result' like '%HDFCBANK:18.37%'
  order by dsr.retrieved_at desc
  limit 1
), security as (
  select id as security_id from public.securities where symbol='HDFCBANK' limit 1
), promoted(metric_code,numeric_value,unit,period_type) as (
  values
    ('GROSS_NPA_PERCENT'::text, 1.17::numeric, 'PERCENT'::text, 'QUARTER'::text),
    ('NET_NPA_PERCENT'::text, 0.41::numeric, 'PERCENT'::text, 'QUARTER'::text),
    ('EPS_GROWTH_YOY'::text, 18.37::numeric, 'PERCENT'::text, 'QUARTER'::text)
)
insert into public.fundamental_observations(
  security_id, metric_code, source_record_id, source_code, numeric_value,
  unit, period_start, period_end, period_type, consolidation_scope,
  retrieved_at, fresh_until, evidence_status
)
select
  s.security_id,
  p.metric_code,
  c.source_record_id,
  'TRENDLYNE_MCP',
  p.numeric_value,
  p.unit,
  null,
  null,
  p.period_type,
  'UNKNOWN',
  c.retrieved_at,
  c.retrieved_at + interval '90 days',
  'AVAILABLE'
from candidate_source c
cross join security s
cross join promoted p
where not exists (
  select 1
  from public.fundamental_observations fo
  where fo.security_id=s.security_id
    and fo.metric_code=p.metric_code
    and fo.source_code='TRENDLYNE_MCP'
    and fo.source_record_id=c.source_record_id
    and fo.period_type=p.period_type
    and fo.period_end is null
);
