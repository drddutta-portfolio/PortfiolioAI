-- V1-4 Action B reviewed requirement evidence ledger.
-- Development-only additive contract. Existing evidence snapshots/items remain immutable.

create table public.research_evidence_requirement_reviews (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  requirement_code text not null check (btrim(requirement_code) <> ''),
  review_kind text not null check (btrim(review_kind) <> ''),
  decision text not null check (btrim(decision) <> ''),
  source_record_id uuid references public.data_source_records(id) on delete restrict,
  research_document_id uuid references public.research_documents(id) on delete restrict,
  provider_document_id text,
  source_payload_hash text check (
    source_payload_hash is null or source_payload_hash ~ '^[0-9a-f]{64}$'
  ),
  supporting_quote text,
  period_start date,
  period_end date,
  period_type text,
  unit text,
  currency text,
  consolidation_scope text,
  published_at timestamptz,
  retrieved_at timestamptz,
  fresh_through timestamptz,
  review_version text not null check (btrim(review_version) <> ''),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz not null default now(),
  review_hash text not null check (review_hash ~ '^[0-9a-f]{64}$'),
  supersedes_review_id uuid references public.research_evidence_requirement_reviews(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint research_evidence_requirement_reviews_source_anchor_ck check (
    source_record_id is not null
    or research_document_id is not null
    or decision = 'INSUFFICIENT'
  ),
  constraint research_evidence_requirement_reviews_period_order_ck check (
    period_start is null or period_end is null or period_start <= period_end
  ),
  constraint research_evidence_requirement_reviews_quote_ck check (
    supporting_quote is null or btrim(supporting_quote) <> ''
  ),
  constraint research_evidence_requirement_reviews_hash_uq unique (review_hash)
);

create index research_evidence_requirement_reviews_portfolio_security_idx
  on public.research_evidence_requirement_reviews(portfolio_id, security_id, requirement_code, reviewed_at desc, id desc);

create index research_evidence_requirement_reviews_source_record_idx
  on public.research_evidence_requirement_reviews(source_record_id)
  where source_record_id is not null;

create index research_evidence_requirement_reviews_document_idx
  on public.research_evidence_requirement_reviews(research_document_id)
  where research_document_id is not null;

create index research_evidence_requirement_reviews_supersedes_idx
  on public.research_evidence_requirement_reviews(supersedes_review_id)
  where supersedes_review_id is not null;

create trigger research_evidence_requirement_reviews_append_only
before update or delete on public.research_evidence_requirement_reviews
for each row execute function public.reject_research_evidence_snapshot_mutation_v1();

alter table public.research_evidence_requirement_reviews enable row level security;

create policy research_evidence_requirement_reviews_owner_read
on public.research_evidence_requirement_reviews
for select to authenticated
using (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.user_id = (select auth.uid())
  )
);

revoke all on public.research_evidence_requirement_reviews from public, anon, authenticated;
grant select on public.research_evidence_requirement_reviews to authenticated;
grant all on public.research_evidence_requirement_reviews to service_role;

comment on table public.research_evidence_requirement_reviews is
  'Append-only V1-4 requirement-level factual review ledger. Source-bound reviewed facts only; never a readiness override.';
