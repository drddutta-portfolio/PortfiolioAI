-- Stage 7 resilience add-on: publication time, provider-independent research documents,
-- source appearances, and dedicated fundamental-observation reconciliation.

alter table public.data_source_records
  add column published_at timestamptz;

alter table public.fundamental_observations
  add column published_at timestamptz;

comment on column public.data_source_records.published_at is
  'Time the source published the evidence, when supplied. Distinct from its financial period, source observation/as-of time, and PortfolioAI retrieval time.';
comment on column public.fundamental_observations.published_at is
  'Normalized publication time copied from attributable source evidence when supplied; null is preserved when unavailable.';

create table public.research_documents (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete restrict,
  document_type text not null check (document_type in (
    'ANNUAL_REPORT',
    'QUARTERLY_RESULT',
    'INVESTOR_PRESENTATION',
    'EARNINGS_CALL',
    'SHAREHOLDING_FILING',
    'EXCHANGE_REGULATORY_FILING',
    'OTHER'
  )),
  reporting_period_start date,
  reporting_period_end date,
  reporting_period_type text check (reporting_period_type is null or reporting_period_type in ('QUARTER','HALF_YEAR','YEAR','TTM')),
  published_at timestamptz,
  canonical_content_hash text check (canonical_content_hash is null or canonical_content_hash ~ '^[a-f0-9]{64}$'),
  authoritative_identifier_scheme text check (authoritative_identifier_scheme is null or authoritative_identifier_scheme ~ '^[A-Z0-9_]+$'),
  authoritative_identifier text check (authoritative_identifier is null or (authoritative_identifier=btrim(authoritative_identifier) and authoritative_identifier<>'')),
  metadata_identity_hash text check (metadata_identity_hash is null or metadata_identity_hash ~ '^[a-f0-9]{64}$'),
  identity_basis text not null check (identity_basis in ('CONTENT_SHA256','AUTHORITATIVE_IDENTIFIER','VERIFIED_METADATA','REVIEW_REQUIRED')),
  identity_status text not null check (identity_status in ('VERIFIED','REVIEW_REQUIRED')),
  version_label text,
  external_storage_reference text,
  identity_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(identity_evidence)='object'),
  created_at timestamptz not null default now(),
  constraint research_document_period_check check (reporting_period_end is null or reporting_period_start is null or reporting_period_end>=reporting_period_start),
  constraint research_document_authoritative_identity_check check (
    (authoritative_identifier_scheme is null)=(authoritative_identifier is null)
  ),
  constraint research_document_identity_basis_check check (
    (identity_basis='CONTENT_SHA256' and canonical_content_hash is not null)
    or (identity_basis='AUTHORITATIVE_IDENTIFIER' and authoritative_identifier_scheme is not null and authoritative_identifier is not null)
    or (identity_basis='VERIFIED_METADATA' and metadata_identity_hash is not null)
    or (identity_basis='REVIEW_REQUIRED' and identity_status='REVIEW_REQUIRED')
  ),
  constraint research_document_verified_identity_check check (
    identity_status<>'VERIFIED' or identity_basis<>'REVIEW_REQUIRED'
  )
);

create unique index research_documents_content_hash_key
  on public.research_documents(canonical_content_hash)
  where canonical_content_hash is not null;
create unique index research_documents_authoritative_identifier_key
  on public.research_documents(authoritative_identifier_scheme,authoritative_identifier)
  where authoritative_identifier_scheme is not null and authoritative_identifier is not null;
create unique index research_documents_metadata_identity_key
  on public.research_documents(security_id,metadata_identity_hash)
  where metadata_identity_hash is not null;
create index research_documents_security_period_idx
  on public.research_documents(security_id,document_type,reporting_period_end desc);

create table public.research_document_sources (
  id uuid primary key default gen_random_uuid(),
  research_document_id uuid not null references public.research_documents(id) on delete restrict,
  source_code text not null references public.data_sources(code) on delete restrict,
  source_record_id uuid not null references public.data_source_records(id) on delete restrict,
  provider_document_id text,
  source_url text,
  source_title text,
  source_version text,
  source_published_at timestamptz,
  retrieved_at timestamptz not null,
  content_hash text check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$'),
  extraction_method text,
  extraction_version text,
  extraction_provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(extraction_provenance)='object'),
  source_status text not null check (source_status in ('OBSERVED','VERIFIED','REVIEW_REQUIRED','FAILED','REJECTED')),
  created_at timestamptz not null default now(),
  constraint research_document_source_reference_check check (
    provider_document_id is not null or source_url is not null or content_hash is not null
  ),
  constraint research_document_source_provider_id_check check (
    provider_document_id is null or (provider_document_id=btrim(provider_document_id) and provider_document_id<>'')
  ),
  constraint research_document_source_url_check check (
    source_url is null or (source_url=btrim(source_url) and source_url<>'')
  ),
  constraint research_document_source_dedup_key unique nulls not distinct (
    source_code,provider_document_id,source_url,content_hash
  )
);
create index research_document_sources_document_idx on public.research_document_sources(research_document_id);
create index research_document_sources_source_record_idx on public.research_document_sources(source_record_id);

create or replace function public.portfolioai_validate_research_document_source()
returns trigger language plpgsql set search_path='' as $$
declare
  v_record_source text;
  v_canonical_hash text;
begin
  select source_code into v_record_source from public.data_source_records where id=new.source_record_id;
  if v_record_source is distinct from new.source_code then
    raise exception using errcode='23514',message='Document source must match its immutable source record.';
  end if;
  select canonical_content_hash into v_canonical_hash from public.research_documents where id=new.research_document_id;
  if v_canonical_hash is not null and new.content_hash is not null and v_canonical_hash<>new.content_hash then
    raise exception using errcode='23514',message='Document source content hash conflicts with canonical document identity.';
  end if;
  return new;
end $$;
revoke execute on function public.portfolioai_validate_research_document_source() from public,anon,authenticated;
create trigger research_document_sources_validate
before insert on public.research_document_sources
for each row execute function public.portfolioai_validate_research_document_source();

create trigger research_documents_immutable
before update or delete on public.research_documents
for each row execute function public.portfolioai_reject_stage7_evidence_mutation();
create trigger research_document_sources_immutable
before update or delete on public.research_document_sources
for each row execute function public.portfolioai_reject_stage7_evidence_mutation();

create table public.fundamental_reconciliation_cases (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete restrict,
  metric_code text not null references public.fundamental_metric_definitions(code) on delete restrict,
  period_start date,
  period_end date,
  period_type text check (period_type is null or period_type in ('POINT_IN_TIME','QUARTER','HALF_YEAR','YEAR','TTM')),
  consolidation_scope text check (consolidation_scope is null or consolidation_scope in ('STANDALONE','CONSOLIDATED','UNKNOWN')),
  unit text,
  accounting_standard text,
  semantic_fingerprint text not null check (semantic_fingerprint ~ '^[a-f0-9]{64}$'),
  case_status text not null default 'OPEN' check (case_status in ('PENDING_COMPATIBILITY','OPEN','RESOLVED','REJECTED')),
  reason_code text not null check (reason_code ~ '^[A-Z0-9_]+$'),
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_type text check (resolution_type is null or resolution_type in ('SELECTED_OBSERVATION','CONFIRMED_EQUIVALENT','RETAINED_CONFLICT','REJECTED_CASE')),
  selected_observation_id uuid references public.fundamental_observations(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete restrict,
  review_notes text,
  constraint fundamental_reconciliation_period_check check (period_end is null or period_start is null or period_end>=period_start),
  constraint fundamental_reconciliation_resolution_check check (
    (case_status in ('PENDING_COMPATIBILITY','OPEN') and resolved_at is null and resolution_type is null and selected_observation_id is null and reviewed_by is null)
    or (case_status in ('RESOLVED','REJECTED') and resolved_at is not null and resolution_type is not null and reviewed_by is not null)
  ),
  constraint fundamental_reconciliation_selected_resolution_check check (
    (resolution_type='SELECTED_OBSERVATION' and selected_observation_id is not null)
    or resolution_type is distinct from 'SELECTED_OBSERVATION'
  )
);
create index fundamental_reconciliation_cases_lookup_idx
  on public.fundamental_reconciliation_cases(security_id,metric_code,period_end,case_status);
create unique index fundamental_reconciliation_one_active_semantic_case
  on public.fundamental_reconciliation_cases(security_id,metric_code,semantic_fingerprint)
  where case_status in ('PENDING_COMPATIBILITY','OPEN');

create table public.fundamental_reconciliation_members (
  case_id uuid not null references public.fundamental_reconciliation_cases(id) on delete restrict,
  observation_id uuid not null references public.fundamental_observations(id) on delete restrict,
  compatibility_status text not null check (compatibility_status in ('VERIFIED_EQUIVALENT','PENDING_REVIEW')),
  compatibility_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(compatibility_evidence)='object'),
  added_at timestamptz not null default now(),
  primary key(case_id,observation_id)
);
create index fundamental_reconciliation_members_observation_idx on public.fundamental_reconciliation_members(observation_id);

create or replace function public.portfolioai_validate_fundamental_reconciliation_member()
returns trigger language plpgsql set search_path='' as $$
declare
  v_case public.fundamental_reconciliation_cases;
  v_observation public.fundamental_observations;
begin
  select * into strict v_case from public.fundamental_reconciliation_cases where id=new.case_id;
  select * into strict v_observation from public.fundamental_observations where id=new.observation_id;
  if v_case.security_id<>v_observation.security_id
    or v_case.metric_code<>v_observation.metric_code
    or v_case.period_start is distinct from v_observation.period_start
    or v_case.period_end is distinct from v_observation.period_end
    or v_case.period_type is distinct from v_observation.period_type
    or v_case.consolidation_scope is distinct from v_observation.consolidation_scope
    or v_case.unit is distinct from v_observation.unit
    or v_case.accounting_standard is distinct from v_observation.accounting_standard then
    raise exception using errcode='23514',message='Reconciliation member semantics do not match the case.';
  end if;
  if v_case.case_status='OPEN' and new.compatibility_status<>'VERIFIED_EQUIVALENT' then
    raise exception using errcode='23514',message='Open conflict cases require verified semantic equivalence.';
  end if;
  return new;
end $$;
revoke execute on function public.portfolioai_validate_fundamental_reconciliation_member() from public,anon,authenticated;
create trigger fundamental_reconciliation_members_validate
before insert on public.fundamental_reconciliation_members
for each row execute function public.portfolioai_validate_fundamental_reconciliation_member();

create table public.fundamental_reconciliation_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.fundamental_reconciliation_cases(id) on delete restrict,
  event_type text not null check (event_type in ('OPENED','UPDATED')),
  prior_state jsonb,
  resulting_state jsonb not null,
  changed_by uuid references auth.users(id) on delete restrict,
  changed_at timestamptz not null default now(),
  constraint fundamental_reconciliation_event_shape check (
    (event_type='OPENED' and prior_state is null) or (event_type='UPDATED' and prior_state is not null)
  )
);

create or replace function public.portfolioai_audit_fundamental_reconciliation_case()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.fundamental_reconciliation_events(case_id,event_type,prior_state,resulting_state,changed_by)
  values(new.id,case when tg_op='INSERT' then 'OPENED' else 'UPDATED' end,case when tg_op='INSERT' then null else to_jsonb(old) end,to_jsonb(new),auth.uid());
  return new;
end $$;
revoke execute on function public.portfolioai_audit_fundamental_reconciliation_case() from public,anon,authenticated;
create trigger fundamental_reconciliation_cases_audit
after insert or update on public.fundamental_reconciliation_cases
for each row execute function public.portfolioai_audit_fundamental_reconciliation_case();
create trigger fundamental_reconciliation_cases_no_delete
before delete on public.fundamental_reconciliation_cases
for each row execute function public.portfolioai_reject_stage7_evidence_mutation();
create trigger fundamental_reconciliation_members_immutable
before update or delete on public.fundamental_reconciliation_members
for each row execute function public.portfolioai_reject_stage7_evidence_mutation();
create trigger fundamental_reconciliation_events_immutable
before update or delete on public.fundamental_reconciliation_events
for each row execute function public.portfolioai_reject_stage7_evidence_mutation();

create or replace function public.portfolioai_validate_fundamental_reconciliation_resolution()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.case_status in ('RESOLVED','REJECTED') and old.case_status in ('PENDING_COMPATIBILITY','OPEN') then
    if (select count(*) from public.fundamental_reconciliation_members m where m.case_id=new.id and m.compatibility_status='VERIFIED_EQUIVALENT')<2 then
      raise exception using errcode='23514',message='A fundamental reconciliation requires at least two semantically equivalent observations.';
    end if;
    if new.selected_observation_id is not null and not exists(
      select 1 from public.fundamental_reconciliation_members m where m.case_id=new.id and m.observation_id=new.selected_observation_id
    ) then
      raise exception using errcode='23514',message='Selected reconciliation observation must be a case member.';
    end if;
  elsif new.case_status is distinct from old.case_status then
    raise exception using errcode='23514',message='Unsupported fundamental reconciliation state transition.';
  end if;
  return new;
end $$;
revoke execute on function public.portfolioai_validate_fundamental_reconciliation_resolution() from public,anon,authenticated;
create trigger fundamental_reconciliation_cases_validate_resolution
before update on public.fundamental_reconciliation_cases
for each row execute function public.portfolioai_validate_fundamental_reconciliation_resolution();

create or replace function public.resolve_fundamental_reconciliation_case_v1(
  p_case_id uuid,
  p_resolution_type text,
  p_selected_observation_id uuid,
  p_reviewed_by uuid,
  p_review_notes text
)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.fundamental_reconciliation_cases
  set case_status=case when p_resolution_type='REJECTED_CASE' then 'REJECTED' else 'RESOLVED' end,
      resolution_type=p_resolution_type,
      selected_observation_id=p_selected_observation_id,
      resolved_at=pg_catalog.clock_timestamp(),
      reviewed_by=p_reviewed_by,
      review_notes=p_review_notes
  where id=p_case_id and case_status in ('PENDING_COMPATIBILITY','OPEN');
  if not found then raise exception 'Open fundamental reconciliation case not found.'; end if;
end $$;
revoke all on function public.resolve_fundamental_reconciliation_case_v1(uuid,text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.resolve_fundamental_reconciliation_case_v1(uuid,text,uuid,uuid,text) to service_role;

alter table public.research_documents enable row level security;
alter table public.research_document_sources enable row level security;
alter table public.fundamental_reconciliation_cases enable row level security;
alter table public.fundamental_reconciliation_members enable row level security;
alter table public.fundamental_reconciliation_events enable row level security;

revoke all on table public.research_documents,public.research_document_sources,public.fundamental_reconciliation_cases,public.fundamental_reconciliation_members,public.fundamental_reconciliation_events from anon,authenticated;
grant select on table public.research_documents,public.research_document_sources,public.fundamental_reconciliation_cases,public.fundamental_reconciliation_members,public.fundamental_reconciliation_events to authenticated;

create policy "Users read held research documents" on public.research_documents for select to authenticated using(exists(
  select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id
  where t.security_id=research_documents.security_id and p.user_id=(select auth.uid())
));
create policy "Users read held research document sources" on public.research_document_sources for select to authenticated using(exists(
  select 1 from public.research_documents d join public.transactions t on t.security_id=d.security_id join public.portfolios p on p.id=t.portfolio_id
  where d.id=research_document_sources.research_document_id and p.user_id=(select auth.uid())
));
create policy "Users read held fundamental reconciliation cases" on public.fundamental_reconciliation_cases for select to authenticated using(exists(
  select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id
  where t.security_id=fundamental_reconciliation_cases.security_id and p.user_id=(select auth.uid())
));
create policy "Users read held fundamental reconciliation members" on public.fundamental_reconciliation_members for select to authenticated using(exists(
  select 1 from public.fundamental_reconciliation_cases c join public.transactions t on t.security_id=c.security_id join public.portfolios p on p.id=t.portfolio_id
  where c.id=fundamental_reconciliation_members.case_id and p.user_id=(select auth.uid())
));
create policy "Users read held fundamental reconciliation events" on public.fundamental_reconciliation_events for select to authenticated using(exists(
  select 1 from public.fundamental_reconciliation_cases c join public.transactions t on t.security_id=c.security_id join public.portfolios p on p.id=t.portfolio_id
  where c.id=fundamental_reconciliation_events.case_id and p.user_id=(select auth.uid())
));

create or replace view public.current_fundamental_observations_v1 with (security_invoker=true) as
select d.security_id,d.metric_code,d.period_end,d.period_type,d.consolidation_scope,o.numeric_value,o.text_value,o.boolean_value,o.date_value,o.currency,o.unit,o.source_code,o.observed_at,o.retrieved_at,o.fresh_until,
case when o.evidence_status='CONFLICTING' then 'CONFLICTING' when o.fresh_until<=now() then 'STALE' else 'AVAILABLE' end as freshness_status,
o.published_at
from public.fundamental_observation_decisions d
join public.fundamental_observations o on o.id=d.selected_observation_id;

grant select on table public.current_fundamental_observations_v1 to authenticated;

comment on table public.research_documents is 'Provider-independent immutable document identity and metadata only; large document bodies remain in approved external/object storage.';
comment on table public.research_document_sources is 'Immutable provider/source appearances for one canonical research document. URLs are provenance, never canonical document identity.';
comment on table public.fundamental_reconciliation_cases is 'Dedicated review state for semantically compatible competing fundamental observations; security identity reconciliation remains separate.';
comment on table public.fundamental_reconciliation_members is 'Immutable links to competing observations. Membership never overwrites or deletes financial evidence.';
