-- PortfolioAI P8-B4 repository/local schema proposal
-- Date: 2026-10-03
-- Environment: Development design only
-- IMPORTANT: This file is NOT an applied migration. It must not be executed against hosted
-- PortfolioAI Dev until the hosted migration is separately authorized.
--
-- Design goals:
--  * append-only point-in-time historical evidence
--  * exact historical_identity_id + historical ISIN binding
--  * publication/availability provenance required for eligibility
--  * restatements amend rather than overwrite
--  * owner-scoped reads, service-only writes
--  * no live/current fundamental table mutation

begin;

create table if not exists public.p8_b4_fundamental_observations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  experiment_id text not null,
  historical_identity_id uuid not null references public.p8_historical_security_identities(id) on delete restrict,
  historical_isin text not null,
  metric_code text not null,
  source_code text not null,
  provider_entity_id text,
  source_record_id text,
  reporting_period_start date,
  reporting_period_end date,
  reporting_period_type text,
  fiscal_basis text,
  accounting_standard text,
  consolidation_scope text,
  raw_value text,
  raw_unit text,
  raw_currency text,
  raw_scale text,
  normalized_value text,
  normalized_unit text,
  normalized_currency text,
  transformation_version text,
  published_at timestamptz,
  source_available_at timestamptz,
  observed_at timestamptz,
  retrieved_at timestamptz not null,
  availability_state text not null,
  evidence_status text not null,
  source_hash text not null,
  row_hash text not null,
  supersedes_observation_id uuid references public.p8_b4_fundamental_observations(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint p8_b4_fundamental_experiment_ck
    check (experiment_id = 'P8_EXP_NSE_MONTHLY_6M_V1'),
  constraint p8_b4_fundamental_isin_ck
    check (historical_isin ~ '^INE[A-Z0-9]{9}$'),
  constraint p8_b4_fundamental_source_hash_ck
    check (source_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b4_fundamental_row_hash_ck
    check (row_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b4_fundamental_availability_ck
    check (availability_state in (
      'ELIGIBLE',
      'INELIGIBLE_UNKNOWN_PUBLICATION_TIME',
      'INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME',
      'INELIGIBLE_NOT_STRICTLY_BEFORE_DECISION',
      'INELIGIBLE_IDENTITY_MISMATCH',
      'UNASSESSED'
    )),
  constraint p8_b4_fundamental_not_self_supersede_ck
    check (supersedes_observation_id is null or supersedes_observation_id <> id)
);

create unique index if not exists p8_b4_fundamental_row_hash_ux
  on public.p8_b4_fundamental_observations (portfolio_id, experiment_id, row_hash);

create index if not exists p8_b4_fundamental_identity_period_idx
  on public.p8_b4_fundamental_observations
  (portfolio_id, experiment_id, historical_identity_id, reporting_period_end, metric_code);

create index if not exists p8_b4_fundamental_publication_idx
  on public.p8_b4_fundamental_observations
  (portfolio_id, experiment_id, historical_identity_id, published_at, source_available_at);

create table if not exists public.p8_b4_research_documents (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  experiment_id text not null,
  historical_identity_id uuid not null references public.p8_historical_security_identities(id) on delete restrict,
  historical_isin text not null,
  document_type text not null,
  reporting_period_start date,
  reporting_period_end date,
  reporting_period_type text,
  source_code text not null,
  source_url text,
  source_reference text,
  provider_document_id text,
  published_at timestamptz,
  source_available_at timestamptz,
  retrieved_at timestamptz not null,
  canonical_content_hash text,
  metadata_identity_hash text not null,
  version_label text,
  amendment_of_document_id uuid references public.p8_b4_research_documents(id) on delete restrict,
  source_status text not null,
  row_hash text not null,
  created_at timestamptz not null default now(),
  constraint p8_b4_document_experiment_ck
    check (experiment_id = 'P8_EXP_NSE_MONTHLY_6M_V1'),
  constraint p8_b4_document_isin_ck
    check (historical_isin ~ '^INE[A-Z0-9]{9}$'),
  constraint p8_b4_document_content_hash_ck
    check (canonical_content_hash is null or canonical_content_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b4_document_metadata_hash_ck
    check (metadata_identity_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b4_document_row_hash_ck
    check (row_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_b4_document_not_self_amend_ck
    check (amendment_of_document_id is null or amendment_of_document_id <> id)
);

create unique index if not exists p8_b4_document_row_hash_ux
  on public.p8_b4_research_documents (portfolio_id, experiment_id, row_hash);

create index if not exists p8_b4_document_identity_period_idx
  on public.p8_b4_research_documents
  (portfolio_id, experiment_id, historical_identity_id, reporting_period_end, document_type);

create index if not exists p8_b4_document_publication_idx
  on public.p8_b4_research_documents
  (portfolio_id, experiment_id, historical_identity_id, published_at, source_available_at);

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

-- Append-only protection. The hosted migration should install these trigger functions
-- in a non-exposed schema if the final execution package uses trigger enforcement.
-- This proposal intentionally does not create SECURITY DEFINER functions.

alter table public.p8_b4_fundamental_observations enable row level security;
alter table public.p8_b4_research_documents enable row level security;
alter table public.p8_b4_decision_evidence_eligibility enable row level security;

revoke all on public.p8_b4_fundamental_observations from anon, authenticated;
revoke all on public.p8_b4_research_documents from anon, authenticated;
revoke all on public.p8_b4_decision_evidence_eligibility from anon, authenticated;

-- Read grants/policies must be added in the eventual hosted migration only after
-- matching the repository's canonical owner-scoped portfolio policy. Writes remain
-- service-only and append-only. No UPDATE/DELETE policy should be created.

rollback;
