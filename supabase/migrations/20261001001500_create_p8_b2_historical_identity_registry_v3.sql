-- PortfolioAI P8-B2 historical identity/source-archive remediation foundation.
-- Development/local package only until separately approved for hosted PortfolioAI Dev.
-- Additive only. Preserves the earlier empty B2 v1/v2 objects and does not mutate
-- public.securities, current holdings, transactions, P7 evidence, Production, or main.

create table public.p8_historical_security_identities (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  experiment_id text not null,
  historical_isin text not null,
  issuer_type text not null,
  security_type_code text not null,
  canonical_security_id uuid references public.securities(id) on delete restrict,
  canonical_link_basis text not null check (
    canonical_link_basis in (
      'EXACT_ISIN',
      'EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN',
      'NONE'
    )
  ),
  canonical_link_symbol text,
  link_evidence jsonb not null default '{}'::jsonb,
  identity_hash text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint p8_historical_security_identities_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_historical_security_identities_isin_ck
    check (historical_isin ~ '^IN[E9][A-Z0-9]{4}01[A-Z0-9]{3}$'),
  constraint p8_historical_security_identities_issuer_type_ck
    check (
      issuer_type in ('E','9')
      and issuer_type = substring(historical_isin from 3 for 1)
    ),
  constraint p8_historical_security_identities_security_type_ck
    check (
      security_type_code = '01'
      and security_type_code = substring(historical_isin from 8 for 2)
    ),
  constraint p8_historical_security_identities_link_shape_ck
    check (
      (
        canonical_link_basis = 'NONE'
        and canonical_security_id is null
        and canonical_link_symbol is null
      )
      or
      (
        canonical_link_basis = 'EXACT_ISIN'
        and canonical_security_id is not null
        and canonical_link_symbol is null
      )
      or
      (
        canonical_link_basis = 'EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN'
        and canonical_security_id is not null
        and nullif(btrim(canonical_link_symbol),'') is not null
      )
    ),
  constraint p8_historical_security_identities_hash_ck
    check (identity_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_historical_security_identities_scope_uq
    unique (id, portfolio_id, experiment_id),
  constraint p8_historical_security_identities_isin_uq
    unique (portfolio_id, experiment_id, historical_isin)
);

create index p8_historical_security_identities_canonical_idx
  on public.p8_historical_security_identities
  (portfolio_id, experiment_id, canonical_security_id)
  where canonical_security_id is not null;

create trigger p8_historical_security_identities_append_only
before update or delete on public.p8_historical_security_identities
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_security_identities enable row level security;

create policy p8_historical_security_identities_owner_read
on public.p8_historical_security_identities
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

revoke all on public.p8_historical_security_identities
from public, anon, authenticated;
grant select on public.p8_historical_security_identities to authenticated;
grant all on public.p8_historical_security_identities to service_role;

create table public.p8_historical_source_archives (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  experiment_id text not null,
  source_code text not null,
  source_date date not null,
  source_url text not null,
  source_file_name text not null,
  csv_sha256 text not null,
  gzip_sha256 text not null,
  source_published_at timestamptz,
  available_no_later_than_at timestamptz not null,
  availability_proof_basis text not null check (
    availability_proof_basis in (
      'NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS',
      'EXACT_PUBLICATION_TIMESTAMP'
    )
  ),
  availability_proof_reference text not null,
  retrieved_at timestamptz not null,
  archive_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint p8_historical_source_archives_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_historical_source_archives_source_code_ck
    check (source_code = btrim(source_code) and source_code <> ''),
  constraint p8_historical_source_archives_source_url_ck
    check (source_url = btrim(source_url) and source_url <> ''),
  constraint p8_historical_source_archives_source_file_ck
    check (source_file_name = btrim(source_file_name) and source_file_name <> ''),
  constraint p8_historical_source_archives_csv_hash_ck
    check (csv_sha256 ~ '^[0-9a-f]{64}$'),
  constraint p8_historical_source_archives_gzip_hash_ck
    check (gzip_sha256 ~ '^[0-9a-f]{64}$'),
  constraint p8_historical_source_archives_archive_hash_ck
    check (archive_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_historical_source_archives_reference_ck
    check (
      availability_proof_reference = btrim(availability_proof_reference)
      and availability_proof_reference <> ''
    ),
  constraint p8_historical_source_archives_temporal_order_ck
    check (
      (source_published_at is null or source_published_at <= available_no_later_than_at)
      and available_no_later_than_at <= retrieved_at
    ),
  constraint p8_historical_source_archives_exact_publication_ck
    check (
      availability_proof_basis <> 'EXACT_PUBLICATION_TIMESTAMP'
      or (
        source_published_at is not null
        and source_published_at = available_no_later_than_at
      )
    ),
  constraint p8_historical_source_archives_nse_upper_bound_ck
    check (
      availability_proof_basis <> 'NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS'
      or (
        source_published_at is null
        and (available_no_later_than_at at time zone 'Asia/Kolkata')::date = source_date
        and (available_no_later_than_at at time zone 'Asia/Kolkata')::time = time '09:00:00'
      )
    ),
  constraint p8_historical_source_archives_scope_uq
    unique (id, portfolio_id, experiment_id, source_date),
  constraint p8_historical_source_archives_content_uq
    unique (portfolio_id, experiment_id, archive_hash)
);

create index p8_historical_source_archives_date_idx
  on public.p8_historical_source_archives
  (portfolio_id, experiment_id, source_date, created_at desc);

create trigger p8_historical_source_archives_append_only
before update or delete on public.p8_historical_source_archives
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_source_archives enable row level security;

create policy p8_historical_source_archives_owner_read
on public.p8_historical_source_archives
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

revoke all on public.p8_historical_source_archives
from public, anon, authenticated;
grant select on public.p8_historical_source_archives to authenticated;
grant all on public.p8_historical_source_archives to service_role;

create table public.p8_historical_listing_observations_v3 (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  experiment_id text not null,
  historical_identity_id uuid not null,
  source_archive_id uuid not null,
  source_date date not null,
  exchange text not null,
  trading_symbol text not null,
  series text,
  instrument_id text not null,
  instrument_name text not null,
  source_presence_state text not null check (
    source_presence_state = 'PRESENT_IN_SECURITY_MASTER'
  ),
  row_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint p8_historical_listing_observations_v3_identity_scope_fk
    foreign key (historical_identity_id, portfolio_id, experiment_id)
    references public.p8_historical_security_identities(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_historical_listing_observations_v3_archive_scope_fk
    foreign key (source_archive_id, portfolio_id, experiment_id, source_date)
    references public.p8_historical_source_archives(id, portfolio_id, experiment_id, source_date)
    on delete restrict,
  constraint p8_historical_listing_observations_v3_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_historical_listing_observations_v3_exchange_ck
    check (exchange = btrim(exchange) and exchange ~ '^[A-Z0-9_]+$'),
  constraint p8_historical_listing_observations_v3_symbol_ck
    check (trading_symbol = btrim(trading_symbol) and trading_symbol <> ''),
  constraint p8_historical_listing_observations_v3_instrument_id_ck
    check (instrument_id = btrim(instrument_id) and instrument_id <> ''),
  constraint p8_historical_listing_observations_v3_name_ck
    check (instrument_name = btrim(instrument_name) and instrument_name <> ''),
  constraint p8_historical_listing_observations_v3_hash_ck
    check (row_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_historical_listing_observations_v3_scope_uq
    unique (id, portfolio_id, experiment_id, historical_identity_id),
  constraint p8_historical_listing_observations_v3_row_uq
    unique (
      portfolio_id,
      experiment_id,
      source_archive_id,
      historical_identity_id,
      row_hash
    )
);

create index p8_historical_listing_observations_v3_identity_date_idx
  on public.p8_historical_listing_observations_v3
  (portfolio_id, experiment_id, historical_identity_id, source_date);

create index p8_historical_listing_observations_v3_archive_idx
  on public.p8_historical_listing_observations_v3
  (source_archive_id, historical_identity_id);

create trigger p8_historical_listing_observations_v3_append_only
before update or delete on public.p8_historical_listing_observations_v3
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_listing_observations_v3 enable row level security;

create policy p8_historical_listing_observations_v3_owner_read
on public.p8_historical_listing_observations_v3
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

revoke all on public.p8_historical_listing_observations_v3
from public, anon, authenticated;
grant select on public.p8_historical_listing_observations_v3 to authenticated;
grant all on public.p8_historical_listing_observations_v3 to service_role;

create table public.p8_historical_universe_runs_v3 (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  experiment_id text not null,
  universe_version text not null,
  decision_at timestamptz not null,
  decision_date date not null,
  source_cutoff_at timestamptz not null,
  source_archive_id uuid not null,
  source_date date not null,
  resolver_version text not null,
  run_state text not null check (run_state in ('READY','BLOCKED')),
  global_blocker_reason text,
  eligible_count integer not null check (eligible_count >= 0),
  ineligible_count integer not null check (ineligible_count >= 0),
  blocked_count integer not null check (blocked_count >= 0),
  run_hash text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint p8_historical_universe_runs_v3_portfolio_fk
    foreign key (portfolio_id) references public.portfolios(id) on delete restrict,
  constraint p8_historical_universe_runs_v3_archive_scope_fk
    foreign key (source_archive_id, portfolio_id, experiment_id, source_date)
    references public.p8_historical_source_archives(id, portfolio_id, experiment_id, source_date)
    on delete restrict,
  constraint p8_historical_universe_runs_v3_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_historical_universe_runs_v3_version_ck
    check (universe_version = btrim(universe_version) and universe_version <> ''),
  constraint p8_historical_universe_runs_v3_resolver_ck
    check (resolver_version = btrim(resolver_version) and resolver_version <> ''),
  constraint p8_historical_universe_runs_v3_hash_ck
    check (run_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_historical_universe_runs_v3_cutoff_ck
    check (source_cutoff_at <= decision_at),
  constraint p8_historical_universe_runs_v3_local_date_ck
    check ((decision_at at time zone 'Asia/Kolkata')::date = decision_date),
  constraint p8_historical_universe_runs_v3_source_date_ck
    check (source_date = decision_date),
  constraint p8_historical_universe_runs_v3_state_ck
    check (
      (run_state = 'READY' and global_blocker_reason is null and blocked_count = 0)
      or
      (run_state = 'BLOCKED' and nullif(btrim(global_blocker_reason),'') is not null)
    ),
  constraint p8_historical_universe_runs_v3_scope_uq
    unique (id, portfolio_id, experiment_id, decision_at),
  constraint p8_historical_universe_runs_v3_content_uq
    unique (
      portfolio_id,
      experiment_id,
      universe_version,
      decision_at,
      run_hash
    )
);

create index p8_historical_universe_runs_v3_decision_idx
  on public.p8_historical_universe_runs_v3
  (portfolio_id, experiment_id, decision_at desc, created_at desc);

create trigger p8_historical_universe_runs_v3_append_only
before update or delete on public.p8_historical_universe_runs_v3
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_runs_v3 enable row level security;

create policy p8_historical_universe_runs_v3_owner_read
on public.p8_historical_universe_runs_v3
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

revoke all on public.p8_historical_universe_runs_v3
from public, anon, authenticated;
grant select on public.p8_historical_universe_runs_v3 to authenticated;
grant all on public.p8_historical_universe_runs_v3 to service_role;

create table public.p8_historical_universe_members_v3 (
  id uuid primary key default gen_random_uuid(),
  universe_run_id uuid not null,
  portfolio_id uuid not null,
  experiment_id text not null,
  decision_at timestamptz not null,
  historical_identity_id uuid not null,
  membership_state text not null check (
    membership_state in ('ELIGIBLE','INELIGIBLE','BLOCKED')
  ),
  reason_code text not null,
  created_at timestamptz not null default now(),

  constraint p8_historical_universe_members_v3_run_scope_fk
    foreign key (universe_run_id, portfolio_id, experiment_id, decision_at)
    references public.p8_historical_universe_runs_v3(id, portfolio_id, experiment_id, decision_at)
    on delete restrict,
  constraint p8_historical_universe_members_v3_identity_scope_fk
    foreign key (historical_identity_id, portfolio_id, experiment_id)
    references public.p8_historical_security_identities(id, portfolio_id, experiment_id)
    on delete restrict,
  constraint p8_historical_universe_members_v3_reason_ck
    check (reason_code = btrim(reason_code) and reason_code <> ''),
  constraint p8_historical_universe_members_v3_scope_uq
    unique (id, portfolio_id, experiment_id, historical_identity_id, decision_at),
  constraint p8_historical_universe_members_v3_run_identity_uq
    unique (universe_run_id, historical_identity_id)
);

create index p8_historical_universe_members_v3_identity_idx
  on public.p8_historical_universe_members_v3
  (portfolio_id, experiment_id, historical_identity_id, decision_at);

create trigger p8_historical_universe_members_v3_append_only
before update or delete on public.p8_historical_universe_members_v3
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_members_v3 enable row level security;

create policy p8_historical_universe_members_v3_owner_read
on public.p8_historical_universe_members_v3
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

revoke all on public.p8_historical_universe_members_v3
from public, anon, authenticated;
grant select on public.p8_historical_universe_members_v3 to authenticated;
grant all on public.p8_historical_universe_members_v3 to service_role;

create table public.p8_historical_universe_member_listing_evidence_v3 (
  id uuid primary key default gen_random_uuid(),
  universe_member_id uuid not null,
  portfolio_id uuid not null,
  experiment_id text not null,
  historical_identity_id uuid not null,
  decision_at timestamptz not null,
  listing_observation_id uuid not null,
  evidence_role text not null check (
    evidence_role in (
      'ELIGIBILITY_SUPPORT',
      'IDENTITY_SUPPORT',
      'SYMBOL_SERIES_VARIANT',
      'OTHER_SUPPORT'
    )
  ),
  created_at timestamptz not null default now(),

  constraint p8_historical_universe_member_listing_evidence_v3_member_scope_fk
    foreign key (universe_member_id, portfolio_id, experiment_id, historical_identity_id, decision_at)
    references public.p8_historical_universe_members_v3(id, portfolio_id, experiment_id, historical_identity_id, decision_at)
    on delete restrict,
  constraint p8_historical_universe_member_listing_evidence_v3_observation_scope_fk
    foreign key (listing_observation_id, portfolio_id, experiment_id, historical_identity_id)
    references public.p8_historical_listing_observations_v3(id, portfolio_id, experiment_id, historical_identity_id)
    on delete restrict,
  constraint p8_historical_universe_member_listing_evidence_v3_identity_uq
    unique (universe_member_id, listing_observation_id, evidence_role)
);

create index p8_historical_universe_member_listing_evidence_v3_member_idx
  on public.p8_historical_universe_member_listing_evidence_v3
  (universe_member_id, listing_observation_id);

create trigger p8_historical_universe_member_listing_evidence_v3_append_only
before update or delete on public.p8_historical_universe_member_listing_evidence_v3
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_member_listing_evidence_v3 enable row level security;

create policy p8_historical_universe_member_listing_evidence_v3_owner_read
on public.p8_historical_universe_member_listing_evidence_v3
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

revoke all on public.p8_historical_universe_member_listing_evidence_v3
from public, anon, authenticated;
grant select on public.p8_historical_universe_member_listing_evidence_v3 to authenticated;
grant all on public.p8_historical_universe_member_listing_evidence_v3 to service_role;

create table public.p8_historical_universe_run_selections_v3 (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  experiment_id text not null,
  decision_at timestamptz not null,
  universe_run_id uuid not null,
  selection_run_id uuid not null,
  selection_basis text not null check (
    selection_basis in (
      'P8_B2_INITIAL_MATERIALIZATION',
      'P8_B2_CORRECTIVE_RESELECTION',
      'P8_B2_REPEATABILITY_PROOF'
    )
  ),
  selector_version text not null,
  selected_at timestamptz not null default now(),
  selected_by uuid references auth.users(id) on delete set null,

  constraint p8_historical_universe_run_selections_v3_run_scope_fk
    foreign key (universe_run_id, portfolio_id, experiment_id, decision_at)
    references public.p8_historical_universe_runs_v3(id, portfolio_id, experiment_id, decision_at)
    on delete restrict,
  constraint p8_historical_universe_run_selections_v3_selector_ck
    check (selector_version = btrim(selector_version) and selector_version <> ''),
  constraint p8_historical_universe_run_selections_v3_idempotency_uq
    unique (portfolio_id, experiment_id, selection_run_id, decision_at)
);

create index p8_historical_universe_run_selections_v3_current_idx
  on public.p8_historical_universe_run_selections_v3
  (portfolio_id, experiment_id, decision_at, selected_at desc, id desc);

create trigger p8_historical_universe_run_selections_v3_append_only
before update or delete on public.p8_historical_universe_run_selections_v3
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_run_selections_v3 enable row level security;

create policy p8_historical_universe_run_selections_v3_owner_read
on public.p8_historical_universe_run_selections_v3
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

revoke all on public.p8_historical_universe_run_selections_v3
from public, anon, authenticated;
grant select on public.p8_historical_universe_run_selections_v3 to authenticated;
grant all on public.p8_historical_universe_run_selections_v3 to service_role;

create view public.current_p8_historical_universe_run_v3
with (security_invoker = true) as
select r.*
from public.p8_historical_universe_run_selections_v3 s
join public.p8_historical_universe_runs_v3 r
  on r.id = s.universe_run_id
where not exists (
  select 1
  from public.p8_historical_universe_run_selections_v3 newer
  where newer.portfolio_id = s.portfolio_id
    and newer.experiment_id = s.experiment_id
    and newer.decision_at = s.decision_at
    and (newer.selected_at, newer.id) > (s.selected_at, s.id)
);

revoke all on public.current_p8_historical_universe_run_v3
from public, anon, authenticated;
grant select on public.current_p8_historical_universe_run_v3 to authenticated;
grant select on public.current_p8_historical_universe_run_v3 to service_role;

create view public.current_p8_historical_universe_membership_v3
with (security_invoker = true) as
select
  r.portfolio_id,
  r.experiment_id,
  r.universe_version,
  r.decision_at,
  r.decision_date,
  r.source_cutoff_at,
  r.source_archive_id,
  r.source_date,
  r.resolver_version,
  r.run_state,
  r.global_blocker_reason,
  r.run_hash,
  m.id as universe_member_id,
  m.historical_identity_id,
  i.historical_isin,
  i.canonical_security_id,
  i.canonical_link_basis,
  i.canonical_link_symbol,
  m.membership_state,
  m.reason_code
from public.current_p8_historical_universe_run_v3 r
join public.p8_historical_universe_members_v3 m
  on m.universe_run_id = r.id
join public.p8_historical_security_identities i
  on i.id = m.historical_identity_id;

revoke all on public.current_p8_historical_universe_membership_v3
from public, anon, authenticated;
grant select on public.current_p8_historical_universe_membership_v3 to authenticated;
grant select on public.current_p8_historical_universe_membership_v3 to service_role;

create view public.current_p8_historical_universe_member_listing_evidence_v3
with (security_invoker = true) as
select
  m.portfolio_id,
  m.experiment_id,
  m.decision_at,
  m.universe_run_id,
  m.id as universe_member_id,
  m.historical_identity_id,
  i.historical_isin,
  i.canonical_security_id,
  e.evidence_role,
  o.id as listing_observation_id,
  o.source_archive_id,
  o.source_date,
  o.exchange,
  o.trading_symbol,
  o.series,
  o.instrument_id,
  o.instrument_name,
  o.source_presence_state,
  o.row_hash
from public.p8_historical_universe_members_v3 m
join public.p8_historical_security_identities i
  on i.id = m.historical_identity_id
join public.p8_historical_universe_member_listing_evidence_v3 e
  on e.universe_member_id = m.id
join public.p8_historical_listing_observations_v3 o
  on o.id = e.listing_observation_id
join public.current_p8_historical_universe_run_v3 r
  on r.id = m.universe_run_id;

revoke all on public.current_p8_historical_universe_member_listing_evidence_v3
from public, anon, authenticated;
grant select on public.current_p8_historical_universe_member_listing_evidence_v3 to authenticated;
grant select on public.current_p8_historical_universe_member_listing_evidence_v3 to service_role;

create function public.append_p8_historical_security_identity_v1(
  p_identity jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_existing public.p8_historical_security_identities%rowtype;
  v_security public.securities%rowtype;
  v_portfolio_id uuid := nullif(p_identity->>'portfolio_id','')::uuid;
  v_experiment_id text := nullif(p_identity->>'experiment_id','');
  v_historical_isin text := upper(nullif(p_identity->>'historical_isin',''));
  v_issuer_type text := upper(nullif(p_identity->>'issuer_type',''));
  v_security_type_code text := upper(nullif(p_identity->>'security_type_code',''));
  v_canonical_security_id uuid := nullif(p_identity->>'canonical_security_id','')::uuid;
  v_link_basis text := nullif(p_identity->>'canonical_link_basis','');
  v_link_symbol text := nullif(p_identity->>'canonical_link_symbol','');
  v_link_evidence jsonb := coalesce(p_identity->'link_evidence','{}'::jsonb);
  v_identity_hash text := nullif(p_identity->>'identity_hash','');
  v_created_by uuid := nullif(p_identity->>'created_by','')::uuid;
begin
  if v_portfolio_id is null
     or v_experiment_id is null
     or v_historical_isin is null
     or v_issuer_type is null
     or v_security_type_code is null
     or v_link_basis is null
     or v_identity_hash is null then
    raise exception using
      errcode='22023',
      message='Complete P8 historical identity scope, ISIN classification, link basis, and identity hash are required.';
  end if;

  if v_historical_isin !~ '^IN[E9][A-Z0-9]{4}01[A-Z0-9]{3}$'
     or v_issuer_type <> substring(v_historical_isin from 3 for 1)
     or v_security_type_code <> substring(v_historical_isin from 8 for 2) then
    raise exception using
      errcode='22023',
      message='P8 historical identity must satisfy the frozen IN + E/9 + security-type 01 common-equity rule.';
  end if;

  if v_link_basis = 'NONE' then
    if v_canonical_security_id is not null or v_link_symbol is not null then
      raise exception using
        errcode='22023',
        message='NONE historical identity linkage cannot carry a canonical security or symbol.';
    end if;
  elsif v_link_basis = 'EXACT_ISIN' then
    if v_canonical_security_id is null or v_link_symbol is not null then
      raise exception using
        errcode='22023',
        message='EXACT_ISIN linkage requires only a canonical security id.';
    end if;

    select * into v_security
    from public.securities
    where id = v_canonical_security_id;

    if v_security.id is null
       or v_security.asset_class is distinct from 'EQUITY'
       or upper(coalesce(v_security.isin,'')) <> v_historical_isin then
      raise exception using
        errcode='22023',
        message='EXACT_ISIN linkage does not match a current canonical equity with the same ISIN.';
    end if;
  elsif v_link_basis = 'EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN' then
    if v_canonical_security_id is null or nullif(btrim(v_link_symbol),'') is null then
      raise exception using
        errcode='22023',
        message='Current-null-ISIN linkage requires canonical security id and exact NSE symbol.';
    end if;

    select * into v_security
    from public.securities
    where id = v_canonical_security_id;

    if v_security.id is null
       or v_security.asset_class is distinct from 'EQUITY'
       or v_security.exchange is distinct from 'NSE'
       or v_security.isin is not null
       or v_security.symbol is distinct from v_link_symbol then
      raise exception using
        errcode='22023',
        message='Current-null-ISIN linkage must resolve to one current NSE equity with the exact symbol and no current ISIN.';
    end if;
  else
    raise exception using
      errcode='22023',
      message='Unsupported P8 historical identity canonical link basis.';
  end if;

  insert into public.p8_historical_security_identities (
    portfolio_id,
    experiment_id,
    historical_isin,
    issuer_type,
    security_type_code,
    canonical_security_id,
    canonical_link_basis,
    canonical_link_symbol,
    link_evidence,
    identity_hash,
    created_by
  ) values (
    v_portfolio_id,
    v_experiment_id,
    v_historical_isin,
    v_issuer_type,
    v_security_type_code,
    v_canonical_security_id,
    v_link_basis,
    v_link_symbol,
    v_link_evidence,
    v_identity_hash,
    v_created_by
  )
  on conflict (portfolio_id, experiment_id, historical_isin)
  do nothing
  returning id into v_id;

  if v_id is null then
    select * into v_existing
    from public.p8_historical_security_identities
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and historical_isin = v_historical_isin;

    if v_existing.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 historical identity could not be resolved after idempotency conflict.';
    end if;

    if v_existing.issuer_type is distinct from v_issuer_type
       or v_existing.security_type_code is distinct from v_security_type_code
       or v_existing.canonical_security_id is distinct from v_canonical_security_id
       or v_existing.canonical_link_basis is distinct from v_link_basis
       or v_existing.canonical_link_symbol is distinct from v_link_symbol
       or v_existing.link_evidence is distinct from v_link_evidence
       or v_existing.identity_hash is distinct from v_identity_hash then
      raise exception using
        errcode='22023',
        message='P8 historical identity key was reused for different immutable identity/linkage content.';
    end if;

    v_id := v_existing.id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.append_p8_historical_security_identity_v1(jsonb)
from public, anon, authenticated;
grant execute on function public.append_p8_historical_security_identity_v1(jsonb)
to service_role;

create function public.append_p8_historical_source_archive_v1(
  p_archive jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_existing public.p8_historical_source_archives%rowtype;
  v_portfolio_id uuid := nullif(p_archive->>'portfolio_id','')::uuid;
  v_experiment_id text := nullif(p_archive->>'experiment_id','');
  v_source_code text := nullif(p_archive->>'source_code','');
  v_source_date date := nullif(p_archive->>'source_date','')::date;
  v_source_url text := nullif(p_archive->>'source_url','');
  v_source_file_name text := nullif(p_archive->>'source_file_name','');
  v_csv_sha256 text := nullif(p_archive->>'csv_sha256','');
  v_gzip_sha256 text := nullif(p_archive->>'gzip_sha256','');
  v_source_published_at timestamptz := nullif(p_archive->>'source_published_at','')::timestamptz;
  v_available_no_later_than_at timestamptz := nullif(p_archive->>'available_no_later_than_at','')::timestamptz;
  v_availability_proof_basis text := nullif(p_archive->>'availability_proof_basis','');
  v_availability_proof_reference text := nullif(p_archive->>'availability_proof_reference','');
  v_retrieved_at timestamptz := nullif(p_archive->>'retrieved_at','')::timestamptz;
  v_archive_hash text := nullif(p_archive->>'archive_hash','');
  v_raw_metadata jsonb := coalesce(p_archive->'raw_metadata','{}'::jsonb);
  v_created_by uuid := nullif(p_archive->>'created_by','')::uuid;
begin
  if v_portfolio_id is null
     or v_experiment_id is null
     or v_source_code is null
     or v_source_date is null
     or v_source_url is null
     or v_source_file_name is null
     or v_csv_sha256 is null
     or v_gzip_sha256 is null
     or v_available_no_later_than_at is null
     or v_availability_proof_basis is null
     or v_availability_proof_reference is null
     or v_retrieved_at is null
     or v_archive_hash is null then
    raise exception using
      errcode='22023',
      message='Complete P8 source archive identity, hashes, availability proof, retrieval time, and archive hash are required.';
  end if;

  if v_availability_proof_basis = 'NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS' then
    if v_source_published_at is not null
       or (v_available_no_later_than_at at time zone 'Asia/Kolkata')::date <> v_source_date
       or (v_available_no_later_than_at at time zone 'Asia/Kolkata')::time <> time '09:00:00' then
      raise exception using
        errcode='22023',
        message='NSE before-trading-hours proof must preserve unknown exact publication time and use the frozen 09:00 Asia/Kolkata availability upper bound on the source date.';
    end if;
  elsif v_availability_proof_basis = 'EXACT_PUBLICATION_TIMESTAMP' then
    if v_source_published_at is null
       or v_source_published_at <> v_available_no_later_than_at then
      raise exception using
        errcode='22023',
        message='Exact-publication proof requires source_published_at equal to the availability timestamp.';
    end if;
  else
    raise exception using
      errcode='22023',
      message='Unsupported P8 historical source availability proof basis.';
  end if;

  if v_available_no_later_than_at > v_retrieved_at
     or (v_source_published_at is not null and v_source_published_at > v_available_no_later_than_at) then
    raise exception using
      errcode='22023',
      message='P8 source availability/publication cannot be later than retrieval.';
  end if;

  insert into public.p8_historical_source_archives (
    portfolio_id,
    experiment_id,
    source_code,
    source_date,
    source_url,
    source_file_name,
    csv_sha256,
    gzip_sha256,
    source_published_at,
    available_no_later_than_at,
    availability_proof_basis,
    availability_proof_reference,
    retrieved_at,
    archive_hash,
    raw_metadata,
    created_by
  ) values (
    v_portfolio_id,
    v_experiment_id,
    v_source_code,
    v_source_date,
    v_source_url,
    v_source_file_name,
    v_csv_sha256,
    v_gzip_sha256,
    v_source_published_at,
    v_available_no_later_than_at,
    v_availability_proof_basis,
    v_availability_proof_reference,
    v_retrieved_at,
    v_archive_hash,
    v_raw_metadata,
    v_created_by
  )
  on conflict (portfolio_id, experiment_id, archive_hash)
  do nothing
  returning id into v_id;

  if v_id is null then
    select * into v_existing
    from public.p8_historical_source_archives
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and archive_hash = v_archive_hash;

    if v_existing.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 historical source archive could not be resolved after idempotency conflict.';
    end if;

    if v_existing.source_code is distinct from v_source_code
       or v_existing.source_date is distinct from v_source_date
       or v_existing.source_url is distinct from v_source_url
       or v_existing.source_file_name is distinct from v_source_file_name
       or v_existing.csv_sha256 is distinct from v_csv_sha256
       or v_existing.gzip_sha256 is distinct from v_gzip_sha256
       or v_existing.source_published_at is distinct from v_source_published_at
       or v_existing.available_no_later_than_at is distinct from v_available_no_later_than_at
       or v_existing.availability_proof_basis is distinct from v_availability_proof_basis
       or v_existing.availability_proof_reference is distinct from v_availability_proof_reference
       or v_existing.retrieved_at is distinct from v_retrieved_at
       or v_existing.raw_metadata is distinct from v_raw_metadata then
      raise exception using
        errcode='22023',
        message='P8 source archive hash was reused for different immutable archive/provenance content.';
    end if;

    v_id := v_existing.id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.append_p8_historical_source_archive_v1(jsonb)
from public, anon, authenticated;
grant execute on function public.append_p8_historical_source_archive_v1(jsonb)
to service_role;

create function public.append_p8_historical_listing_observation_v3(
  p_observation jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_existing public.p8_historical_listing_observations_v3%rowtype;
  v_portfolio_id uuid := nullif(p_observation->>'portfolio_id','')::uuid;
  v_experiment_id text := nullif(p_observation->>'experiment_id','');
  v_historical_identity_id uuid := nullif(p_observation->>'historical_identity_id','')::uuid;
  v_source_archive_id uuid := nullif(p_observation->>'source_archive_id','')::uuid;
  v_source_date date := nullif(p_observation->>'source_date','')::date;
  v_exchange text := nullif(p_observation->>'exchange','');
  v_trading_symbol text := nullif(p_observation->>'trading_symbol','');
  v_series text := nullif(p_observation->>'series','');
  v_instrument_id text := nullif(p_observation->>'instrument_id','');
  v_instrument_name text := nullif(p_observation->>'instrument_name','');
  v_presence_state text := coalesce(nullif(p_observation->>'source_presence_state',''),'PRESENT_IN_SECURITY_MASTER');
  v_row_hash text := nullif(p_observation->>'row_hash','');
  v_raw_metadata jsonb := coalesce(p_observation->'raw_metadata','{}'::jsonb);
begin
  if v_portfolio_id is null
     or v_experiment_id is null
     or v_historical_identity_id is null
     or v_source_archive_id is null
     or v_source_date is null
     or v_exchange is null
     or v_trading_symbol is null
     or v_instrument_id is null
     or v_instrument_name is null
     or v_presence_state is null
     or v_row_hash is null then
    raise exception using
      errcode='22023',
      message='Complete P8 historical listing observation identity, source archive, source date, instrument evidence, and row hash are required.';
  end if;

  if not exists (
    select 1
    from public.p8_historical_security_identities i
    where i.id = v_historical_identity_id
      and i.portfolio_id = v_portfolio_id
      and i.experiment_id = v_experiment_id
  ) then
    raise exception using
      errcode='22023',
      message='P8 historical listing observation identity is outside the requested portfolio/experiment scope.';
  end if;

  if not exists (
    select 1
    from public.p8_historical_source_archives a
    where a.id = v_source_archive_id
      and a.portfolio_id = v_portfolio_id
      and a.experiment_id = v_experiment_id
      and a.source_date = v_source_date
  ) then
    raise exception using
      errcode='22023',
      message='P8 historical listing observation source archive/date is outside the requested portfolio/experiment scope.';
  end if;

  insert into public.p8_historical_listing_observations_v3 (
    portfolio_id,
    experiment_id,
    historical_identity_id,
    source_archive_id,
    source_date,
    exchange,
    trading_symbol,
    series,
    instrument_id,
    instrument_name,
    source_presence_state,
    row_hash,
    raw_metadata
  ) values (
    v_portfolio_id,
    v_experiment_id,
    v_historical_identity_id,
    v_source_archive_id,
    v_source_date,
    v_exchange,
    v_trading_symbol,
    v_series,
    v_instrument_id,
    v_instrument_name,
    v_presence_state,
    v_row_hash,
    v_raw_metadata
  )
  on conflict (
    portfolio_id,
    experiment_id,
    source_archive_id,
    historical_identity_id,
    row_hash
  )
  do nothing
  returning id into v_id;

  if v_id is null then
    select * into v_existing
    from public.p8_historical_listing_observations_v3
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and source_archive_id = v_source_archive_id
      and historical_identity_id = v_historical_identity_id
      and row_hash = v_row_hash;

    if v_existing.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 historical listing observation could not be resolved after idempotency conflict.';
    end if;

    if v_existing.source_date is distinct from v_source_date
       or v_existing.exchange is distinct from v_exchange
       or v_existing.trading_symbol is distinct from v_trading_symbol
       or v_existing.series is distinct from v_series
       or v_existing.instrument_id is distinct from v_instrument_id
       or v_existing.instrument_name is distinct from v_instrument_name
       or v_existing.source_presence_state is distinct from v_presence_state
       or v_existing.raw_metadata is distinct from v_raw_metadata then
      raise exception using
        errcode='22023',
        message='P8 historical listing row hash was reused for different immutable listing evidence.';
    end if;

    v_id := v_existing.id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.append_p8_historical_listing_observation_v3(jsonb)
from public, anon, authenticated;
grant execute on function public.append_p8_historical_listing_observation_v3(jsonb)
to service_role;

create function public.append_and_select_p8_historical_universe_v3(
  p_run jsonb,
  p_members jsonb,
  p_evidence_links jsonb,
  p_selection jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_portfolio_id uuid := nullif(p_run->>'portfolio_id','')::uuid;
  v_experiment_id text := nullif(p_run->>'experiment_id','');
  v_universe_version text := nullif(p_run->>'universe_version','');
  v_decision_at timestamptz := nullif(p_run->>'decision_at','')::timestamptz;
  v_decision_date date := nullif(p_run->>'decision_date','')::date;
  v_source_cutoff_at timestamptz := nullif(p_run->>'source_cutoff_at','')::timestamptz;
  v_source_archive_id uuid := nullif(p_run->>'source_archive_id','')::uuid;
  v_source_date date := nullif(p_run->>'source_date','')::date;
  v_resolver_version text := nullif(p_run->>'resolver_version','');
  v_run_state text := nullif(p_run->>'run_state','');
  v_global_blocker_reason text := nullif(p_run->>'global_blocker_reason','');
  v_run_hash text := nullif(p_run->>'run_hash','');

  v_selection_run_id uuid := nullif(p_selection->>'selection_run_id','')::uuid;
  v_selection_basis text := nullif(p_selection->>'selection_basis','');
  v_selector_version text := nullif(p_selection->>'selector_version','');
  v_selected_by uuid := nullif(p_selection->>'selected_by','')::uuid;

  v_archive public.p8_historical_source_archives%rowtype;
  v_normalized_members jsonb;
  v_stored_members jsonb;
  v_normalized_links jsonb;
  v_stored_links jsonb;

  v_universe_run_id uuid;
  v_selection_id uuid;
  v_existing_run public.p8_historical_universe_runs_v3%rowtype;
  v_existing_selection public.p8_historical_universe_run_selections_v3%rowtype;

  v_eligible_count integer;
  v_ineligible_count integer;
  v_blocked_count integer;

  v_run_created boolean := false;
  v_selection_created boolean := false;
begin
  if v_portfolio_id is null
     or v_experiment_id is null
     or v_universe_version is null
     or v_decision_at is null
     or v_decision_date is null
     or v_source_cutoff_at is null
     or v_source_archive_id is null
     or v_source_date is null
     or v_resolver_version is null
     or v_run_state is null
     or v_run_hash is null
     or v_selection_run_id is null
     or v_selection_basis is null
     or v_selector_version is null then
    raise exception using
      errcode='22023',
      message='Complete P8 V3 historical-universe run, source archive, and selection metadata are required.';
  end if;

  if (v_decision_at at time zone 'Asia/Kolkata')::date <> v_decision_date
     or v_source_date <> v_decision_date then
    raise exception using
      errcode='22023',
      message='P8 V3 decision_date/source_date must match decision_at in Asia/Kolkata.';
  end if;

  if v_source_cutoff_at > v_decision_at then
    raise exception using
      errcode='22023',
      message='P8 V3 source cutoff cannot be later than the decision instant.';
  end if;

  select * into v_archive
  from public.p8_historical_source_archives
  where id = v_source_archive_id
    and portfolio_id = v_portfolio_id
    and experiment_id = v_experiment_id
    and source_date = v_source_date;

  if v_archive.id is null then
    raise exception using
      errcode='22023',
      message='P8 V3 run source archive is outside the requested portfolio/experiment/date scope.';
  end if;

  if v_archive.available_no_later_than_at > v_source_cutoff_at
     or v_archive.available_no_later_than_at >= v_decision_at then
    raise exception using
      errcode='22023',
      message='P8 V3 source archive must be provably available before the decision instant and no later than the source cutoff.';
  end if;

  if jsonb_typeof(p_members) <> 'array'
     or jsonb_typeof(p_evidence_links) <> 'array' then
    raise exception using
      errcode='22023',
      message='P8 V3 members and evidence links must be JSON arrays.';
  end if;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'historical_identity_id', x.historical_identity_id,
          'membership_state', x.membership_state,
          'reason_code', x.reason_code
        )
        order by x.historical_identity_id
      ),
      '[]'::jsonb
    ),
    count(*) filter (where x.membership_state = 'ELIGIBLE')::integer,
    count(*) filter (where x.membership_state = 'INELIGIBLE')::integer,
    count(*) filter (where x.membership_state = 'BLOCKED')::integer
  into
    v_normalized_members,
    v_eligible_count,
    v_ineligible_count,
    v_blocked_count
  from jsonb_to_recordset(p_members) as x(
    historical_identity_id uuid,
    membership_state text,
    reason_code text
  );

  if exists (
    select 1
    from jsonb_to_recordset(p_members) as x(
      historical_identity_id uuid,
      membership_state text,
      reason_code text
    )
    where x.historical_identity_id is null
       or x.membership_state not in ('ELIGIBLE','INELIGIBLE','BLOCKED')
       or nullif(btrim(x.reason_code),'') is null
       or not exists (
         select 1
         from public.p8_historical_security_identities i
         where i.id = x.historical_identity_id
           and i.portfolio_id = v_portfolio_id
           and i.experiment_id = v_experiment_id
       )
  ) then
    raise exception using
      errcode='22023',
      message='Every P8 V3 member requires a same-scope historical identity, disposition, and reason code.';
  end if;

  if (
    select count(*)
    from jsonb_to_recordset(p_members) as x(
      historical_identity_id uuid,
      membership_state text,
      reason_code text
    )
  ) <> (
    select count(distinct x.historical_identity_id)
    from jsonb_to_recordset(p_members) as x(
      historical_identity_id uuid,
      membership_state text,
      reason_code text
    )
  ) then
    raise exception using
      errcode='22023',
      message='P8 V3 requires exactly one member per historical identity.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'historical_identity_id', x.historical_identity_id,
        'listing_observation_id', x.listing_observation_id,
        'evidence_role', x.evidence_role
      )
      order by x.historical_identity_id, x.listing_observation_id, x.evidence_role
    ),
    '[]'::jsonb
  )
  into v_normalized_links
  from jsonb_to_recordset(p_evidence_links) as x(
    historical_identity_id uuid,
    listing_observation_id uuid,
    evidence_role text
  );

  if exists (
    select 1
    from jsonb_to_recordset(p_evidence_links) as x(
      historical_identity_id uuid,
      listing_observation_id uuid,
      evidence_role text
    )
    where x.historical_identity_id is null
       or x.listing_observation_id is null
       or x.evidence_role not in (
         'ELIGIBILITY_SUPPORT',
         'IDENTITY_SUPPORT',
         'SYMBOL_SERIES_VARIANT',
         'OTHER_SUPPORT'
       )
       or not exists (
         select 1
         from jsonb_to_recordset(p_members) as m(
           historical_identity_id uuid,
           membership_state text,
           reason_code text
         )
         where m.historical_identity_id = x.historical_identity_id
       )
       or not exists (
         select 1
         from public.p8_historical_listing_observations_v3 o
         where o.id = x.listing_observation_id
           and o.portfolio_id = v_portfolio_id
           and o.experiment_id = v_experiment_id
           and o.historical_identity_id = x.historical_identity_id
           and o.source_archive_id = v_source_archive_id
           and o.source_date = v_source_date
       )
  ) then
    raise exception using
      errcode='22023',
      message='Every P8 V3 evidence link must resolve to a same-scope member and same selected source-archive observation.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_members) as m(
      historical_identity_id uuid,
      membership_state text,
      reason_code text
    )
    where m.membership_state = 'ELIGIBLE'
      and not exists (
        select 1
        from jsonb_to_recordset(p_evidence_links) as x(
          historical_identity_id uuid,
          listing_observation_id uuid,
          evidence_role text
        )
        join public.p8_historical_listing_observations_v3 o
          on o.id = x.listing_observation_id
        where x.historical_identity_id = m.historical_identity_id
          and x.evidence_role = 'ELIGIBILITY_SUPPORT'
          and o.portfolio_id = v_portfolio_id
          and o.experiment_id = v_experiment_id
          and o.historical_identity_id = m.historical_identity_id
          and o.source_archive_id = v_source_archive_id
          and o.source_date = v_source_date
          and o.source_presence_state = 'PRESENT_IN_SECURITY_MASTER'
      )
  ) then
    raise exception using
      errcode='22023',
      message='Every ELIGIBLE P8 V3 member requires linked presence evidence from the selected source archive.';
  end if;

  if v_run_state = 'READY' and v_blocked_count <> 0 then
    raise exception using
      errcode='22023',
      message='READY P8 V3 universe runs cannot contain BLOCKED members.';
  end if;

  if v_run_state = 'READY' and v_eligible_count = 0 then
    raise exception using
      errcode='22023',
      message='READY P8 V3 universe runs require at least one eligible historical identity.';
  end if;

  if v_run_state = 'BLOCKED' and v_global_blocker_reason is null then
    raise exception using
      errcode='22023',
      message='BLOCKED P8 V3 universe runs require a global blocker reason.';
  end if;

  insert into public.p8_historical_universe_runs_v3 (
    portfolio_id,
    experiment_id,
    universe_version,
    decision_at,
    decision_date,
    source_cutoff_at,
    source_archive_id,
    source_date,
    resolver_version,
    run_state,
    global_blocker_reason,
    eligible_count,
    ineligible_count,
    blocked_count,
    run_hash,
    created_by
  ) values (
    v_portfolio_id,
    v_experiment_id,
    v_universe_version,
    v_decision_at,
    v_decision_date,
    v_source_cutoff_at,
    v_source_archive_id,
    v_source_date,
    v_resolver_version,
    v_run_state,
    v_global_blocker_reason,
    v_eligible_count,
    v_ineligible_count,
    v_blocked_count,
    v_run_hash,
    v_selected_by
  )
  on conflict (
    portfolio_id,
    experiment_id,
    universe_version,
    decision_at,
    run_hash
  )
  do nothing
  returning id into v_universe_run_id;

  if v_universe_run_id is null then
    select * into v_existing_run
    from public.p8_historical_universe_runs_v3
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and universe_version = v_universe_version
      and decision_at = v_decision_at
      and run_hash = v_run_hash;

    if v_existing_run.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 V3 universe run could not be resolved after content conflict.';
    end if;

    if v_existing_run.decision_date is distinct from v_decision_date
       or v_existing_run.source_cutoff_at is distinct from v_source_cutoff_at
       or v_existing_run.source_archive_id is distinct from v_source_archive_id
       or v_existing_run.source_date is distinct from v_source_date
       or v_existing_run.resolver_version is distinct from v_resolver_version
       or v_existing_run.run_state is distinct from v_run_state
       or v_existing_run.global_blocker_reason is distinct from v_global_blocker_reason
       or v_existing_run.eligible_count is distinct from v_eligible_count
       or v_existing_run.ineligible_count is distinct from v_ineligible_count
       or v_existing_run.blocked_count is distinct from v_blocked_count then
      raise exception using
        errcode='22023',
        message='P8 V3 universe run hash was reused for different immutable run metadata.';
    end if;

    v_universe_run_id := v_existing_run.id;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'historical_identity_id', m.historical_identity_id,
          'membership_state', m.membership_state,
          'reason_code', m.reason_code
        )
        order by m.historical_identity_id
      ),
      '[]'::jsonb
    )
    into v_stored_members
    from public.p8_historical_universe_members_v3 m
    where m.universe_run_id = v_universe_run_id;

    if v_stored_members is distinct from v_normalized_members then
      raise exception using
        errcode='22023',
        message='P8 V3 universe run hash was reused for different immutable member content.';
    end if;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'historical_identity_id', e.historical_identity_id,
          'listing_observation_id', e.listing_observation_id,
          'evidence_role', e.evidence_role
        )
        order by e.historical_identity_id, e.listing_observation_id, e.evidence_role
      ),
      '[]'::jsonb
    )
    into v_stored_links
    from public.p8_historical_universe_member_listing_evidence_v3 e
    join public.p8_historical_universe_members_v3 m
      on m.id = e.universe_member_id
    where m.universe_run_id = v_universe_run_id;

    if v_stored_links is distinct from v_normalized_links then
      raise exception using
        errcode='22023',
        message='P8 V3 universe run hash was reused for different immutable evidence-link content.';
    end if;
  else
    v_run_created := true;

    insert into public.p8_historical_universe_members_v3 (
      universe_run_id,
      portfolio_id,
      experiment_id,
      decision_at,
      historical_identity_id,
      membership_state,
      reason_code
    )
    select
      v_universe_run_id,
      v_portfolio_id,
      v_experiment_id,
      v_decision_at,
      x.historical_identity_id,
      x.membership_state,
      x.reason_code
    from jsonb_to_recordset(p_members) as x(
      historical_identity_id uuid,
      membership_state text,
      reason_code text
    );

    insert into public.p8_historical_universe_member_listing_evidence_v3 (
      universe_member_id,
      portfolio_id,
      experiment_id,
      historical_identity_id,
      decision_at,
      listing_observation_id,
      evidence_role
    )
    select
      m.id,
      v_portfolio_id,
      v_experiment_id,
      x.historical_identity_id,
      v_decision_at,
      x.listing_observation_id,
      x.evidence_role
    from jsonb_to_recordset(p_evidence_links) as x(
      historical_identity_id uuid,
      listing_observation_id uuid,
      evidence_role text
    )
    join public.p8_historical_universe_members_v3 m
      on m.universe_run_id = v_universe_run_id
     and m.historical_identity_id = x.historical_identity_id;
  end if;

  insert into public.p8_historical_universe_run_selections_v3 (
    portfolio_id,
    experiment_id,
    decision_at,
    universe_run_id,
    selection_run_id,
    selection_basis,
    selector_version,
    selected_by
  ) values (
    v_portfolio_id,
    v_experiment_id,
    v_decision_at,
    v_universe_run_id,
    v_selection_run_id,
    v_selection_basis,
    v_selector_version,
    v_selected_by
  )
  on conflict (portfolio_id, experiment_id, selection_run_id, decision_at)
  do nothing
  returning id into v_selection_id;

  if v_selection_id is null then
    select * into v_existing_selection
    from public.p8_historical_universe_run_selections_v3
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and selection_run_id = v_selection_run_id
      and decision_at = v_decision_at;

    if v_existing_selection.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 V3 universe selection could not be resolved after idempotency conflict.';
    end if;

    if v_existing_selection.universe_run_id is distinct from v_universe_run_id
       or v_existing_selection.selection_basis is distinct from v_selection_basis
       or v_existing_selection.selector_version is distinct from v_selector_version then
      raise exception using
        errcode='22023',
        message='P8 V3 selection idempotency key was reused for different immutable selection content.';
    end if;
  else
    v_selection_created := true;
  end if;

  return jsonb_build_object(
    'universe_run_id', v_universe_run_id,
    'run_created', v_run_created,
    'selection_created', v_selection_created,
    'eligible_count', v_eligible_count,
    'ineligible_count', v_ineligible_count,
    'blocked_count', v_blocked_count,
    'evidence_link_count', jsonb_array_length(v_normalized_links)
  );
end;
$$;

revoke all on function public.append_and_select_p8_historical_universe_v3(jsonb,jsonb,jsonb,jsonb)
from public, anon, authenticated;
grant execute on function public.append_and_select_p8_historical_universe_v3(jsonb,jsonb,jsonb,jsonb)
to service_role;

comment on table public.p8_historical_security_identities is
  'P8-B2 immutable common-equity historical identity registry keyed by historical ISIN, optionally linked to a current canonical security without mutating current security identity.';
comment on table public.p8_historical_source_archives is
  'P8-B2 immutable source-file archive registry preserving hashes, retrieval time, exact publication time when known, and conservative availability upper bounds when only operational availability is proven.';
comment on table public.p8_historical_listing_observations_v3 is
  'P8-B2 immutable line-level historical security-master evidence keyed to P8 historical identity and source archive.';
comment on table public.p8_historical_universe_runs_v3 is
  'P8-B2 V3 immutable decision-instant historical universe run scoped to one proven source archive.';
comment on table public.p8_historical_universe_members_v3 is
  'P8-B2 V3 historical-universe disposition by P8-local historical identity rather than live securities.id.';
comment on table public.p8_historical_universe_member_listing_evidence_v3 is
  'P8-B2 V3 append-only many-to-one listing-evidence bridge for one historical-identity universe member.';
comment on function public.append_p8_historical_security_identity_v1(jsonb) is
  'Service-only idempotent P8-B2 historical identity append path with exact current-link validation and no live security mutation.';
comment on function public.append_p8_historical_source_archive_v1(jsonb) is
  'Service-only idempotent P8-B2 source archive append path preserving unknown exact publication time and explicit availability proof.';
comment on function public.append_p8_historical_listing_observation_v3(jsonb) is
  'Service-only idempotent P8-B2 V3 line-level listing evidence append path.';
comment on function public.append_and_select_p8_historical_universe_v3(jsonb,jsonb,jsonb,jsonb) is
  'Service-only P8-B2 V3 append/select path using P8-local historical identities and one proven source archive per decision date.';
