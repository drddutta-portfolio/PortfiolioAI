-- Stage 7A: provider-neutral provenance, ingestion control, and security identity.

create table public.data_sources (
  code text primary key check (code ~ '^[A-Z0-9_]+$'),
  name text not null check (name = btrim(name) and name <> ''),
  source_kind text not null check (source_kind in ('INTERNAL_MASTER','SUBSCRIPTION_API','BROKER_API','PUBLIC_WEB','MANUAL')),
  evidence_priority integer not null check (evidence_priority between 1 and 1000),
  is_active boolean not null default false,
  entitlement_verified boolean not null default false,
  retention_rights_verified boolean not null default false,
  capabilities jsonb not null default '{}'::jsonb check (jsonb_typeof(capabilities) = 'object'),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.data_sources (code, name, source_kind, evidence_priority, is_active, entitlement_verified, retention_rights_verified, capabilities)
values
  ('STOCK_MASTER', 'PortfolioAI stock master', 'INTERNAL_MASTER', 10, true, true, true, '{"identity":true,"classification":true}'::jsonb),
  ('TRENDLYNE_MCP', 'Trendlyne MCP', 'SUBSCRIPTION_API', 20, false, false, false, '{"planned_primary_structured_provider":true,"schema_inspection_required":true}'::jsonb),
  ('ANGEL_ONE', 'Angel One SmartAPI', 'BROKER_API', 30, true, true, false, '{"identity":true,"eod_prices":true,"market_cap_unverified":true}'::jsonb),
  ('CONTROLLED_PUBLIC_WEB', 'Controlled public web evidence', 'PUBLIC_WEB', 90, false, true, false, '{"allowlist_required":true}'::jsonb);

create table public.data_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.data_sources(code) on delete restrict,
  operation text not null check (operation ~ '^[A-Z0-9_]+$'),
  requested_by uuid references auth.users(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('RUNNING','SUCCEEDED','PARTIAL','FAILED','SKIPPED_FRESH','CONFIGURATION_PENDING')),
  requested_count integer not null default 0 check (requested_count >= 0),
  cached_count integer not null default 0 check (cached_count >= 0),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  unchanged_count integer not null default 0 check (unchanged_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  error_summary text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  constraint data_ingestion_run_completion_check check ((status = 'RUNNING' and completed_at is null) or (status <> 'RUNNING' and completed_at is not null))
);

create table public.data_source_records (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.data_sources(code) on delete restrict,
  ingestion_run_id uuid references public.data_ingestion_runs(id) on delete set null,
  record_kind text not null check (record_kind ~ '^[A-Z0-9_]+$'),
  external_record_id text,
  source_observed_at timestamptz,
  retrieved_at timestamptz not null default now(),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  raw_payload jsonb not null check (jsonb_typeof(raw_payload) in ('object','array')),
  source_url text,
  terms_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(terms_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  constraint data_source_records_dedup_key unique nulls not distinct (source_code, record_kind, external_record_id, payload_hash)
);

create table public.data_ingestion_leases (
  source_code text not null references public.data_sources(code) on delete restrict,
  operation text not null check (operation ~ '^[A-Z0-9_]+$'),
  lease_holder uuid,
  lease_expires_at timestamptz,
  next_allowed_at timestamptz not null default '-infinity'::timestamptz,
  updated_at timestamptz not null default now(),
  primary key (source_code, operation),
  constraint data_ingestion_lease_state_check check ((lease_holder is null and lease_expires_at is null) or (lease_holder is not null and lease_expires_at is not null))
);

create table public.security_listings (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete restrict,
  exchange text not null check (exchange ~ '^[A-Z0-9_]+$'),
  trading_symbol text not null check (trading_symbol = btrim(trading_symbol) and trading_symbol <> ''),
  series text,
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint security_listing_identity_key unique nulls not distinct (exchange, trading_symbol, series),
  constraint security_listing_dates_check check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
create unique index security_listings_one_primary_key on public.security_listings(security_id) where is_primary and is_active;

insert into public.security_listings (security_id, exchange, trading_symbol, series, currency, is_primary)
select id, exchange, symbol, nullif(series, ''), currency, true from public.securities
on conflict do nothing;

create table public.security_identity_observations (
  id uuid primary key default gen_random_uuid(),
  security_id uuid references public.securities(id) on delete restrict,
  listing_id uuid references public.security_listings(id) on delete restrict,
  source_record_id uuid not null references public.data_source_records(id) on delete restrict,
  source_code text not null references public.data_sources(code) on delete restrict,
  observed_name text,
  observed_isin text check (observed_isin is null or observed_isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  observed_exchange text,
  observed_symbol text,
  observed_series text,
  evidence_status text not null default 'OBSERVED' check (evidence_status in ('OBSERVED','MATCHED','AMBIGUOUS','CONFLICTING','REJECTED')),
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  observed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint security_identity_observation_source_key unique (source_record_id, source_code)
);

create table public.security_reconciliation_cases (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null references public.data_source_records(id) on delete restrict,
  case_status text not null default 'OPEN' check (case_status in ('OPEN','RESOLVED','REJECTED')),
  reason_code text not null check (reason_code ~ '^[A-Z0-9_]+$'),
  resolved_security_id uuid references public.securities(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  constraint security_reconciliation_resolution_check check ((case_status = 'OPEN' and reviewed_by is null and reviewed_at is null) or (case_status <> 'OPEN' and reviewed_by is not null and reviewed_at is not null))
);

create table public.security_reconciliation_candidates (
  case_id uuid not null references public.security_reconciliation_cases(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  match_basis text not null check (match_basis in ('ISIN_EXACT','EXCHANGE_SYMBOL_EXACT','NAME_SIMILARITY','MANUAL')),
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  primary key (case_id, security_id)
);

create or replace function public.acquire_data_ingestion_lease_v1(p_source_code text, p_operation text, p_lease_holder uuid, p_lease_seconds integer)
returns table(acquired boolean, retry_after timestamptz) language plpgsql set search_path='' as $$
begin
  if p_lease_seconds < 1 or p_lease_seconds > 900 then raise exception 'Invalid lease duration.'; end if;
  insert into public.data_ingestion_leases(source_code, operation, lease_holder, lease_expires_at, updated_at)
  values(p_source_code, p_operation, p_lease_holder, pg_catalog.clock_timestamp()+pg_catalog.make_interval(secs=>p_lease_seconds), pg_catalog.clock_timestamp())
  on conflict(source_code, operation) do update set lease_holder=excluded.lease_holder, lease_expires_at=excluded.lease_expires_at, updated_at=excluded.updated_at
  where (public.data_ingestion_leases.lease_expires_at is null or public.data_ingestion_leases.lease_expires_at <= pg_catalog.clock_timestamp()) and public.data_ingestion_leases.next_allowed_at <= pg_catalog.clock_timestamp();
  return query select l.lease_holder=p_lease_holder, pg_catalog.greatest(l.next_allowed_at,l.lease_expires_at) from public.data_ingestion_leases l where l.source_code=p_source_code and l.operation=p_operation;
end $$;

create or replace function public.release_data_ingestion_lease_v1(p_source_code text, p_operation text, p_lease_holder uuid, p_cooldown_seconds integer)
returns boolean language plpgsql set search_path='' as $$ declare changed integer; begin
  if p_cooldown_seconds < 0 or p_cooldown_seconds > 86400 then raise exception 'Invalid cooldown duration.'; end if;
  update public.data_ingestion_leases set lease_holder=null, lease_expires_at=null, next_allowed_at=pg_catalog.clock_timestamp()+pg_catalog.make_interval(secs=>p_cooldown_seconds), updated_at=pg_catalog.clock_timestamp()
  where source_code=p_source_code and operation=p_operation and lease_holder=p_lease_holder;
  get diagnostics changed=row_count; return changed=1;
end $$;

create trigger data_sources_set_audit_timestamps before insert or update on public.data_sources for each row execute function public.portfolioai_set_audit_timestamps();
create trigger security_listings_set_audit_timestamps before insert or update on public.security_listings for each row execute function public.portfolioai_set_audit_timestamps();

alter table public.data_sources enable row level security;
alter table public.data_ingestion_runs enable row level security;
alter table public.data_source_records enable row level security;
alter table public.data_ingestion_leases enable row level security;
alter table public.security_listings enable row level security;
alter table public.security_identity_observations enable row level security;
alter table public.security_reconciliation_cases enable row level security;
alter table public.security_reconciliation_candidates enable row level security;

revoke all on table public.data_sources, public.data_ingestion_runs, public.data_source_records, public.data_ingestion_leases, public.security_listings, public.security_identity_observations, public.security_reconciliation_cases, public.security_reconciliation_candidates from anon, authenticated;
grant select on table public.data_sources, public.security_listings, public.security_identity_observations to authenticated;
create policy "Authenticated users can read data source metadata" on public.data_sources for select to authenticated using (true);
create policy "Users can read listings for held securities" on public.security_listings for select to authenticated using (exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=security_listings.security_id and p.user_id=(select auth.uid())));
create policy "Users can read identity evidence for held securities" on public.security_identity_observations for select to authenticated using (exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=security_identity_observations.security_id and p.user_id=(select auth.uid())));

revoke all on function public.acquire_data_ingestion_lease_v1(text,text,uuid,integer), public.release_data_ingestion_lease_v1(text,text,uuid,integer) from public, anon, authenticated;
grant execute on function public.acquire_data_ingestion_lease_v1(text,text,uuid,integer), public.release_data_ingestion_lease_v1(text,text,uuid,integer) to service_role;

comment on table public.data_source_records is 'Immutable provider/raw observations deduplicated by source identity and SHA-256 payload hash.';
comment on table public.security_reconciliation_cases is 'Ambiguous identities are quarantined for explicit review; they are never guessed into the canonical security master.';
comment on table public.data_sources is 'TRENDLYNE_MCP is planned as the primary structured provider but remains inactive until subscribed methods, entitlement, and retention rights are verified.';
