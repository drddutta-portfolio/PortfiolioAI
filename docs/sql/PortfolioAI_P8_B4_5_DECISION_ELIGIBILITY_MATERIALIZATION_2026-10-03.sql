-- PortfolioAI P8-B4-5 decision-date eligibility materialization
-- Applied to PortfolioAI Dev on 2026-10-03.
-- Development only. Production/main untouched.
--
-- Population:
--   4,524 historical identities
--   32 frozen B2 decision dates
--   2 evidence domains
--   289,536 deterministic eligibility rows
--
-- Fail-closed evidence disposition:
--   captured fundamentals -> INELIGIBLE_UNKNOWN_PUBLICATION_TIME
--   captured documents    -> INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME
--   identities without exact acquired provider evidence -> INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY
--
-- No current-state fallback and no invented publication/source-availability timestamps.

create table if not exists public.p8_b4_decision_evidence_eligibility (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  experiment_id text not null,
  historical_identity_id uuid not null references public.p8_historical_security_identities(id) on delete restrict,
  decision_at timestamptz not null,
  evidence_domain text not null,
  requirement_code text not null,
  required boolean not null default true,
  eligible_evidence_ids uuid[] not null default '{}',
  selected_evidence_id uuid,
  exclusion_reason text,
  source_cutoff_at timestamptz not null,
  materializer_version text not null,
  selection_fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint p8_b4_eligibility_experiment_ck
    check (experiment_id = 'P8_EXP_NSE_MONTHLY_6M_V1'),
  constraint p8_b4_eligibility_domain_ck
    check (evidence_domain in ('FUNDAMENTAL','DOCUMENT')),
  constraint p8_b4_eligibility_fingerprint_ck
    check (selection_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint p8_b4_eligibility_disposition_ck
    check (
      (selected_evidence_id is not null and exclusion_reason is null)
      or
      (selected_evidence_id is null and exclusion_reason is not null)
    )
);

create unique index if not exists p8_b4_eligibility_selection_ux
  on public.p8_b4_decision_evidence_eligibility
  (portfolio_id, experiment_id, historical_identity_id, decision_at, evidence_domain, requirement_code, materializer_version);

create index if not exists p8_b4_eligibility_decision_idx
  on public.p8_b4_decision_evidence_eligibility
  (portfolio_id, experiment_id, decision_at, historical_identity_id);

create index if not exists p8_b4_eligibility_historical_identity_idx
  on public.p8_b4_decision_evidence_eligibility (historical_identity_id);

alter table public.p8_b4_decision_evidence_eligibility enable row level security;
revoke all on public.p8_b4_decision_evidence_eligibility from anon, authenticated;

with capture_flags as (
  select
    (raw_payload->>'historical_identity_id')::uuid as historical_identity_id,
    bool_or(record_kind in ('P8_B4_3_CANARY_FUNDAMENTALS','P8_B4_4_FUNDAMENTALS')) as has_fundamental_capture,
    bool_or(record_kind in ('P8_B4_3_CANARY_DOCUMENTS','P8_B4_4_DOCUMENTS')) as has_document_capture
  from public.data_source_records
  where record_kind in (
    'P8_B4_3_CANARY_FUNDAMENTALS','P8_B4_3_CANARY_DOCUMENTS',
    'P8_B4_4_FUNDAMENTALS','P8_B4_4_DOCUMENTS'
  )
  group by 1
),
pairs as (
  select i.portfolio_id,i.experiment_id,i.id as historical_identity_id,r.decision_at
  from public.p8_historical_security_identities i
  join public.p8_historical_universe_runs_v3 r
    on r.portfolio_id=i.portfolio_id and r.experiment_id=i.experiment_id
  where i.experiment_id='P8_EXP_NSE_MONTHLY_6M_V1'
),
materialized as (
  select p.portfolio_id,p.experiment_id,p.historical_identity_id,p.decision_at,d.evidence_domain,
    case when d.evidence_domain='FUNDAMENTAL'
      then 'POINT_IN_TIME_FUNDAMENTAL_EVIDENCE'
      else 'POINT_IN_TIME_DOCUMENT_EVIDENCE' end as requirement_code,
    true as required,
    '{}'::uuid[] as eligible_evidence_ids,
    null::uuid as selected_evidence_id,
    case
      when d.evidence_domain='FUNDAMENTAL' and coalesce(cf.has_fundamental_capture,false)
        then 'INELIGIBLE_UNKNOWN_PUBLICATION_TIME'
      when d.evidence_domain='DOCUMENT' and coalesce(cf.has_document_capture,false)
        then 'INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME'
      else 'INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY'
    end as exclusion_reason,
    p.decision_at as source_cutoff_at,
    'P8_B4_DECISION_ELIGIBILITY_V1'::text as materializer_version
  from pairs p
  cross join (values ('FUNDAMENTAL'::text),('DOCUMENT'::text)) d(evidence_domain)
  left join capture_flags cf on cf.historical_identity_id=p.historical_identity_id
)
insert into public.p8_b4_decision_evidence_eligibility (
  portfolio_id,experiment_id,historical_identity_id,decision_at,evidence_domain,
  requirement_code,required,eligible_evidence_ids,selected_evidence_id,
  exclusion_reason,source_cutoff_at,materializer_version,selection_fingerprint
)
select m.portfolio_id,m.experiment_id,m.historical_identity_id,m.decision_at,m.evidence_domain,
  m.requirement_code,m.required,m.eligible_evidence_ids,m.selected_evidence_id,
  m.exclusion_reason,m.source_cutoff_at,m.materializer_version,
  encode(digest(concat_ws('|',
    m.materializer_version,m.experiment_id,m.portfolio_id::text,m.historical_identity_id::text,
    to_char(m.decision_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    m.evidence_domain,m.requirement_code,m.exclusion_reason,
    to_char(m.source_cutoff_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  ),'sha256'),'hex')
from materialized m
on conflict (
  portfolio_id,experiment_id,historical_identity_id,decision_at,
  evidence_domain,requirement_code,materializer_version
) do nothing;
