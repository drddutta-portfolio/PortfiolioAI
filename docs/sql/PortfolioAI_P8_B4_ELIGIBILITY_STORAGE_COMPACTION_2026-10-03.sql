-- PortfolioAI P8-B4 eligibility storage compaction
-- Applied to PortfolioAI Dev on 2026-10-03.
-- Development only. Production/main untouched.
--
-- Purpose:
-- Replace the 187 MB expanded B4 eligibility table with compact physical storage,
-- while preserving the original public logical interface through a compatibility view.
--
-- Frozen logical population:
--   289,536 rows
--   289,536 distinct selection fingerprints
--   aggregate fingerprint:
--   5ba943fa1ea2a2e94ead3f58065bc0a848c5a71a84275aa3192240993557e883
--
-- Compact encoding:
--   evidence_domain: 1 FUNDAMENTAL, 2 DOCUMENT
--   exclusion_code:
--     1 INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY
--     2 INELIGIBLE_UNKNOWN_PUBLICATION_TIME
--     3 INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME
--   selection_fingerprint stored as 32-byte bytea
--   original id and created_at preserved exactly
--
-- The compatibility view derives constant/repeated columns without changing values.

create table public.p8_b4_decision_evidence_eligibility_compact (
  historical_identity_id uuid not null
    references public.p8_historical_security_identities(id) on delete restrict,
  decision_at timestamptz not null,
  evidence_domain smallint not null check (evidence_domain in (1,2)),
  exclusion_code smallint not null check (exclusion_code in (1,2,3)),
  selection_fingerprint bytea not null,
  legacy_id uuid not null,
  created_at timestamptz not null,
  primary key (historical_identity_id, decision_at, evidence_domain)
);

alter table public.p8_b4_decision_evidence_eligibility_compact enable row level security;
revoke all on public.p8_b4_decision_evidence_eligibility_compact from anon, authenticated;

-- Source insert used the pre-compaction expanded table.
insert into public.p8_b4_decision_evidence_eligibility_compact (
  historical_identity_id,
  decision_at,
  evidence_domain,
  exclusion_code,
  selection_fingerprint,
  legacy_id,
  created_at
)
select
  historical_identity_id,
  decision_at,
  case evidence_domain when 'FUNDAMENTAL' then 1 else 2 end::smallint,
  case exclusion_reason
    when 'INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY' then 1
    when 'INELIGIBLE_UNKNOWN_PUBLICATION_TIME' then 2
    when 'INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME' then 3
  end::smallint,
  decode(selection_fingerprint,'hex'),
  id,
  created_at
from public.p8_b4_decision_evidence_eligibility;

-- After exact bidirectional equality verification, the expanded table was renamed
-- and this compatibility view took over the original public object name.
create view public.p8_b4_decision_evidence_eligibility
with (security_invoker=true)
as
select
  c.legacy_id as id,
  i.portfolio_id,
  i.experiment_id,
  c.historical_identity_id,
  c.decision_at,
  case c.evidence_domain
    when 1 then 'FUNDAMENTAL'::text
    else 'DOCUMENT'::text
  end as evidence_domain,
  case c.evidence_domain
    when 1 then 'POINT_IN_TIME_FUNDAMENTAL_EVIDENCE'::text
    else 'POINT_IN_TIME_DOCUMENT_EVIDENCE'::text
  end as requirement_code,
  true as required,
  '{}'::uuid[] as eligible_evidence_ids,
  null::uuid as selected_evidence_id,
  case c.exclusion_code
    when 1 then 'INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY'::text
    when 2 then 'INELIGIBLE_UNKNOWN_PUBLICATION_TIME'::text
    when 3 then 'INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME'::text
  end as exclusion_reason,
  c.decision_at as source_cutoff_at,
  'P8_B4_DECISION_ELIGIBILITY_V1'::text as materializer_version,
  encode(c.selection_fingerprint,'hex') as selection_fingerprint,
  c.created_at
from public.p8_b4_decision_evidence_eligibility_compact c
join public.p8_historical_security_identities i
  on i.id = c.historical_identity_id;

revoke all on public.p8_b4_decision_evidence_eligibility from anon, authenticated;

-- The pre-compaction expanded table was dropped only after:
--   old-minus-view = 0
--   view-minus-old = 0
--   row count = 289,536
--   aggregate fingerprint unchanged
--   verified full encrypted R2 backup present
