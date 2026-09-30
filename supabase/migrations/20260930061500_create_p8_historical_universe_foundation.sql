-- PortfolioAI P8-B2 historical universe and listing-validity foundation.
-- Repository/local artifact only until separately approved for hosted PortfolioAI Dev.
-- Additive only: does not rewrite securities, security_listings, transactions, P7 evidence,
-- current classifications, current methodology assignments, or historical run records.

create function public.reject_p8_historical_universe_mutation_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'P8 historical-universe evidence is append-only and cannot be updated or deleted.';
end;
$$;

revoke all on function public.reject_p8_historical_universe_mutation_v1()
from public, anon, authenticated;

create table public.p8_listing_observations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  experiment_id text not null,
  security_id uuid not null references public.securities(id) on delete restrict,
  exchange text not null,
  trading_symbol text not null,
  series text,
  currency text not null default 'INR',
  listing_state text not null check (
    listing_state in ('LISTED','DELISTED','SUSPENDED','UNKNOWN')
  ),
  validity_status text not null check (
    validity_status in ('PROVEN','UNKNOWN')
  ),
  valid_from date,
  valid_to date,
  source_code text not null,
  source_identity text not null,
  source_published_at timestamptz,
  observed_at timestamptz,
  retrieved_at timestamptz not null,
  availability_proof text not null check (
    availability_proof in ('CONTEMPORANEOUS_CAPTURE','IMMUTABLE_PUBLICATION_ARCHIVE')
  ),
  content_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint p8_listing_observations_experiment_nonempty_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_listing_observations_exchange_ck
    check (exchange = btrim(exchange) and exchange ~ '^[A-Z0-9_]+$'),
  constraint p8_listing_observations_symbol_ck
    check (trading_symbol = btrim(trading_symbol) and trading_symbol <> ''),
  constraint p8_listing_observations_currency_ck
    check (currency ~ '^[A-Z]{3}$'),
  constraint p8_listing_observations_source_code_ck
    check (source_code = btrim(source_code) and source_code <> ''),
  constraint p8_listing_observations_source_identity_ck
    check (source_identity = btrim(source_identity) and source_identity <> ''),
  constraint p8_listing_observations_hash_ck
    check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_listing_observations_dates_ck
    check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint p8_listing_observations_proven_validity_ck
    check (validity_status <> 'PROVEN' or valid_from is not null),
  constraint p8_listing_observations_archive_publication_ck
    check (
      availability_proof <> 'IMMUTABLE_PUBLICATION_ARCHIVE'
      or source_published_at is not null
    ),
  constraint p8_listing_observations_publish_retrieve_ck
    check (source_published_at is null or retrieved_at >= source_published_at),
  constraint p8_listing_observations_scope_uq
    unique (id, portfolio_id, experiment_id, security_id),
  constraint p8_listing_observations_identity_uq
    unique (
      portfolio_id,
      experiment_id,
      security_id,
      source_code,
      source_identity,
      content_hash
    )
);

create index p8_listing_observations_security_validity_idx
  on public.p8_listing_observations
  (portfolio_id, experiment_id, security_id, valid_from, valid_to);

create index p8_listing_observations_source_idx
  on public.p8_listing_observations
  (source_code, source_identity);

create trigger p8_listing_observations_append_only
before update or delete on public.p8_listing_observations
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_listing_observations enable row level security;

create policy p8_listing_observations_owner_read
on public.p8_listing_observations
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

revoke all on public.p8_listing_observations from public, anon, authenticated;
grant select on public.p8_listing_observations to authenticated;
grant all on public.p8_listing_observations to service_role;

create table public.p8_historical_universe_runs (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  experiment_id text not null,
  universe_version text not null,
  decision_at timestamptz not null,
  decision_date date not null,
  source_cutoff_at timestamptz not null,
  resolver_version text not null,
  run_state text not null check (run_state in ('READY','BLOCKED')),
  global_blocker_reason text,
  eligible_count integer not null check (eligible_count >= 0),
  ineligible_count integer not null check (ineligible_count >= 0),
  blocked_count integer not null check (blocked_count >= 0),
  run_hash text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint p8_historical_universe_runs_experiment_ck
    check (experiment_id = btrim(experiment_id) and experiment_id <> ''),
  constraint p8_historical_universe_runs_version_ck
    check (universe_version = btrim(universe_version) and universe_version <> ''),
  constraint p8_historical_universe_runs_resolver_ck
    check (resolver_version = btrim(resolver_version) and resolver_version <> ''),
  constraint p8_historical_universe_runs_hash_ck
    check (run_hash ~ '^[0-9a-f]{64}$'),
  constraint p8_historical_universe_runs_cutoff_ck
    check (source_cutoff_at <= decision_at),
  constraint p8_historical_universe_runs_local_date_ck
    check ((decision_at at time zone 'Asia/Kolkata')::date = decision_date),
  constraint p8_historical_universe_runs_state_ck
    check (
      (run_state = 'READY' and global_blocker_reason is null and blocked_count = 0)
      or
      (run_state = 'BLOCKED' and nullif(btrim(global_blocker_reason),'') is not null)
    ),
  constraint p8_historical_universe_runs_scope_uq
    unique (id, portfolio_id, experiment_id, decision_at),
  constraint p8_historical_universe_runs_content_uq
    unique (
      portfolio_id,
      experiment_id,
      universe_version,
      decision_at,
      run_hash
    )
);

create index p8_historical_universe_runs_decision_idx
  on public.p8_historical_universe_runs
  (portfolio_id, experiment_id, decision_at desc, created_at desc);

create trigger p8_historical_universe_runs_append_only
before update or delete on public.p8_historical_universe_runs
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_runs enable row level security;

create policy p8_historical_universe_runs_owner_read
on public.p8_historical_universe_runs
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

revoke all on public.p8_historical_universe_runs from public, anon, authenticated;
grant select on public.p8_historical_universe_runs to authenticated;
grant all on public.p8_historical_universe_runs to service_role;

create table public.p8_historical_universe_members (
  id uuid primary key default gen_random_uuid(),
  universe_run_id uuid not null,
  portfolio_id uuid not null,
  experiment_id text not null,
  decision_at timestamptz not null,
  security_id uuid not null references public.securities(id) on delete restrict,
  listing_observation_id uuid,
  membership_state text not null check (
    membership_state in ('ELIGIBLE','INELIGIBLE','BLOCKED')
  ),
  reason_code text not null,
  created_at timestamptz not null default now(),

  constraint p8_historical_universe_members_run_scope_fk
    foreign key (universe_run_id, portfolio_id, experiment_id, decision_at)
    references public.p8_historical_universe_runs(id, portfolio_id, experiment_id, decision_at)
    on delete restrict,
  constraint p8_historical_universe_members_observation_scope_fk
    foreign key (listing_observation_id, portfolio_id, experiment_id, security_id)
    references public.p8_listing_observations(id, portfolio_id, experiment_id, security_id)
    on delete restrict,
  constraint p8_historical_universe_members_reason_ck
    check (reason_code = btrim(reason_code) and reason_code <> ''),
  constraint p8_historical_universe_members_run_security_uq
    unique (universe_run_id, security_id)
);

create index p8_historical_universe_members_security_idx
  on public.p8_historical_universe_members
  (portfolio_id, experiment_id, security_id, decision_at);

create index p8_historical_universe_members_observation_idx
  on public.p8_historical_universe_members(listing_observation_id)
  where listing_observation_id is not null;

create trigger p8_historical_universe_members_append_only
before update or delete on public.p8_historical_universe_members
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_members enable row level security;

create policy p8_historical_universe_members_owner_read
on public.p8_historical_universe_members
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

revoke all on public.p8_historical_universe_members from public, anon, authenticated;
grant select on public.p8_historical_universe_members to authenticated;
grant all on public.p8_historical_universe_members to service_role;

create table public.p8_historical_universe_run_selections (
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

  constraint p8_historical_universe_run_selections_run_scope_fk
    foreign key (universe_run_id, portfolio_id, experiment_id, decision_at)
    references public.p8_historical_universe_runs(id, portfolio_id, experiment_id, decision_at)
    on delete restrict,
  constraint p8_historical_universe_run_selections_selector_ck
    check (selector_version = btrim(selector_version) and selector_version <> ''),
  constraint p8_historical_universe_run_selections_idempotency_uq
    unique (portfolio_id, experiment_id, selection_run_id, decision_at)
);

create index p8_historical_universe_run_selections_current_idx
  on public.p8_historical_universe_run_selections
  (portfolio_id, experiment_id, decision_at, selected_at desc, id desc);

create trigger p8_historical_universe_run_selections_append_only
before update or delete on public.p8_historical_universe_run_selections
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_run_selections enable row level security;

create policy p8_historical_universe_run_selections_owner_read
on public.p8_historical_universe_run_selections
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

revoke all on public.p8_historical_universe_run_selections from public, anon, authenticated;
grant select on public.p8_historical_universe_run_selections to authenticated;
grant all on public.p8_historical_universe_run_selections to service_role;

create view public.current_p8_historical_universe_run_v1
with (security_invoker = true) as
select r.*
from public.p8_historical_universe_run_selections s
join public.p8_historical_universe_runs r
  on r.id = s.universe_run_id
where not exists (
  select 1
  from public.p8_historical_universe_run_selections newer
  where newer.portfolio_id = s.portfolio_id
    and newer.experiment_id = s.experiment_id
    and newer.decision_at = s.decision_at
    and (newer.selected_at, newer.id) > (s.selected_at, s.id)
);

revoke all on public.current_p8_historical_universe_run_v1
from public, anon, authenticated;
grant select on public.current_p8_historical_universe_run_v1 to authenticated;

create view public.current_p8_historical_universe_membership_v1
with (security_invoker = true) as
select
  r.portfolio_id,
  r.experiment_id,
  r.universe_version,
  r.decision_at,
  r.decision_date,
  r.source_cutoff_at,
  r.resolver_version,
  r.run_state,
  r.global_blocker_reason,
  r.run_hash,
  m.security_id,
  m.membership_state,
  m.reason_code,
  m.listing_observation_id,
  o.exchange,
  o.trading_symbol,
  o.series,
  o.currency,
  o.listing_state,
  o.validity_status,
  o.valid_from,
  o.valid_to,
  o.source_code,
  o.source_identity,
  o.source_published_at,
  o.observed_at,
  o.retrieved_at,
  o.availability_proof,
  o.content_hash
from public.current_p8_historical_universe_run_v1 r
join public.p8_historical_universe_members m
  on m.universe_run_id = r.id
left join public.p8_listing_observations o
  on o.id = m.listing_observation_id;

revoke all on public.current_p8_historical_universe_membership_v1
from public, anon, authenticated;
grant select on public.current_p8_historical_universe_membership_v1 to authenticated;

create function public.append_p8_listing_observation_v1(
  p_observation jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_existing public.p8_listing_observations%rowtype;
  v_portfolio_id uuid := nullif(p_observation->>'portfolio_id','')::uuid;
  v_experiment_id text := nullif(p_observation->>'experiment_id','');
  v_security_id uuid := nullif(p_observation->>'security_id','')::uuid;
  v_exchange text := nullif(p_observation->>'exchange','');
  v_trading_symbol text := nullif(p_observation->>'trading_symbol','');
  v_series text := nullif(p_observation->>'series','');
  v_currency text := coalesce(nullif(p_observation->>'currency',''),'INR');
  v_listing_state text := nullif(p_observation->>'listing_state','');
  v_validity_status text := nullif(p_observation->>'validity_status','');
  v_valid_from date := nullif(p_observation->>'valid_from','')::date;
  v_valid_to date := nullif(p_observation->>'valid_to','')::date;
  v_source_code text := nullif(p_observation->>'source_code','');
  v_source_identity text := nullif(p_observation->>'source_identity','');
  v_source_published_at timestamptz := nullif(p_observation->>'source_published_at','')::timestamptz;
  v_observed_at timestamptz := nullif(p_observation->>'observed_at','')::timestamptz;
  v_retrieved_at timestamptz := nullif(p_observation->>'retrieved_at','')::timestamptz;
  v_availability_proof text := nullif(p_observation->>'availability_proof','');
  v_content_hash text := nullif(p_observation->>'content_hash','');
  v_raw_metadata jsonb := coalesce(p_observation->'raw_metadata','{}'::jsonb);
begin
  if v_portfolio_id is null
     or v_experiment_id is null
     or v_security_id is null
     or v_exchange is null
     or v_trading_symbol is null
     or v_listing_state is null
     or v_validity_status is null
     or v_source_code is null
     or v_source_identity is null
     or v_retrieved_at is null
     or v_availability_proof is null
     or v_content_hash is null then
    raise exception using
      errcode='22023',
      message='Complete P8 listing observation identity, provenance, retrieval time, availability proof, and content hash are required.';
  end if;

  if v_validity_status = 'PROVEN' and v_valid_from is null then
    raise exception using
      errcode='22023',
      message='PROVEN listing validity requires an explicit valid_from date; unknown dates must remain UNKNOWN.';
  end if;

  insert into public.p8_listing_observations (
    portfolio_id, experiment_id, security_id, exchange, trading_symbol, series,
    currency, listing_state, validity_status, valid_from, valid_to,
    source_code, source_identity, source_published_at, observed_at, retrieved_at,
    availability_proof, content_hash, raw_metadata
  ) values (
    v_portfolio_id, v_experiment_id, v_security_id, v_exchange, v_trading_symbol, v_series,
    v_currency, v_listing_state, v_validity_status, v_valid_from, v_valid_to,
    v_source_code, v_source_identity, v_source_published_at, v_observed_at, v_retrieved_at,
    v_availability_proof, v_content_hash, v_raw_metadata
  )
  on conflict (
    portfolio_id,
    experiment_id,
    security_id,
    source_code,
    source_identity,
    content_hash
  )
  do nothing
  returning id into v_id;

  if v_id is null then
    select * into v_existing
    from public.p8_listing_observations
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and security_id = v_security_id
      and source_code = v_source_code
      and source_identity = v_source_identity
      and content_hash = v_content_hash;

    if v_existing.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 listing observation could not be resolved after idempotency conflict.';
    end if;

    if v_existing.exchange is distinct from v_exchange
       or v_existing.trading_symbol is distinct from v_trading_symbol
       or v_existing.series is distinct from v_series
       or v_existing.currency is distinct from v_currency
       or v_existing.listing_state is distinct from v_listing_state
       or v_existing.validity_status is distinct from v_validity_status
       or v_existing.valid_from is distinct from v_valid_from
       or v_existing.valid_to is distinct from v_valid_to
       or v_existing.source_published_at is distinct from v_source_published_at
       or v_existing.observed_at is distinct from v_observed_at
       or v_existing.retrieved_at is distinct from v_retrieved_at
       or v_existing.availability_proof is distinct from v_availability_proof
       or v_existing.raw_metadata is distinct from v_raw_metadata then
      raise exception using
        errcode='22023',
        message='P8 listing observation idempotency key was reused for different immutable content.';
    end if;

    v_id := v_existing.id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.append_p8_listing_observation_v1(jsonb)
from public, anon, authenticated;
grant execute on function public.append_p8_listing_observation_v1(jsonb)
to service_role;

create function public.append_and_select_p8_historical_universe_v1(
  p_run jsonb,
  p_members jsonb,
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
  v_resolver_version text := nullif(p_run->>'resolver_version','');
  v_run_state text := nullif(p_run->>'run_state','');
  v_global_blocker_reason text := nullif(p_run->>'global_blocker_reason','');
  v_run_hash text := nullif(p_run->>'run_hash','');

  v_selection_run_id uuid := nullif(p_selection->>'selection_run_id','')::uuid;
  v_selection_basis text := nullif(p_selection->>'selection_basis','');
  v_selector_version text := nullif(p_selection->>'selector_version','');
  v_selected_by uuid := nullif(p_selection->>'selected_by','')::uuid;

  v_normalized_members jsonb;
  v_stored_members jsonb;
  v_universe_run_id uuid;
  v_selection_id uuid;
  v_existing_run public.p8_historical_universe_runs%rowtype;
  v_existing_selection public.p8_historical_universe_run_selections%rowtype;
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
     or v_resolver_version is null
     or v_run_state is null
     or v_run_hash is null
     or v_selection_run_id is null
     or v_selection_basis is null
     or v_selector_version is null then
    raise exception using
      errcode='22023',
      message='Complete P8 historical-universe run and canonical-selection metadata are required.';
  end if;

  if (v_decision_at at time zone 'Asia/Kolkata')::date <> v_decision_date then
    raise exception using
      errcode='22023',
      message='decision_date must match decision_at in Asia/Kolkata.';
  end if;

  if v_source_cutoff_at > v_decision_at then
    raise exception using
      errcode='22023',
      message='Historical-universe source cutoff cannot be later than the decision instant.';
  end if;

  if jsonb_typeof(p_members) <> 'array' then
    raise exception using
      errcode='22023',
      message='P8 historical-universe members must be a JSON array.';
  end if;

  select
    coalesce(jsonb_agg(to_jsonb(x) order by x.security_id), '[]'::jsonb),
    count(*) filter (where x.membership_state = 'ELIGIBLE')::integer,
    count(*) filter (where x.membership_state = 'INELIGIBLE')::integer,
    count(*) filter (where x.membership_state = 'BLOCKED')::integer
  into
    v_normalized_members,
    v_eligible_count,
    v_ineligible_count,
    v_blocked_count
  from jsonb_to_recordset(p_members) as x(
    security_id uuid,
    listing_observation_id uuid,
    membership_state text,
    reason_code text
  );

  if exists (
    select 1
    from jsonb_to_recordset(p_members) as x(
      security_id uuid,
      listing_observation_id uuid,
      membership_state text,
      reason_code text
    )
    where x.security_id is null
       or x.membership_state not in ('ELIGIBLE','INELIGIBLE','BLOCKED')
       or nullif(btrim(x.reason_code),'') is null
  ) then
    raise exception using
      errcode='22023',
      message='Every P8 universe member requires security identity, disposition, and explicit reason code.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_members) as x(
      security_id uuid,
      listing_observation_id uuid,
      membership_state text,
      reason_code text
    )
    where x.membership_state = 'ELIGIBLE'
      and (
        x.listing_observation_id is null
        or not exists (
          select 1
          from public.p8_listing_observations o
          where o.id = x.listing_observation_id
            and o.portfolio_id = v_portfolio_id
            and o.experiment_id = v_experiment_id
            and o.security_id = x.security_id
            and o.listing_state = 'LISTED'
            and o.validity_status = 'PROVEN'
            and o.valid_from is not null
            and o.valid_from <= v_decision_date
            and (o.valid_to is null or o.valid_to >= v_decision_date)
            and nullif(o.source_identity,'') is not null
            and o.content_hash ~ '^[0-9a-f]{64}$'
            and (
              o.availability_proof = 'IMMUTABLE_PUBLICATION_ARCHIVE'
              or (
                o.availability_proof = 'CONTEMPORANEOUS_CAPTURE'
                and o.retrieved_at < v_decision_at
              )
            )
        )
      )
  ) then
    raise exception using
      errcode='22023',
      message='ELIGIBLE universe membership requires a same-scope, proven LISTED observation valid at the decision instant. Unknown validity cannot be inferred.';
  end if;

  if v_run_state = 'READY' and v_blocked_count <> 0 then
    raise exception using
      errcode='22023',
      message='READY universe runs cannot contain BLOCKED members.';
  end if;

  if v_run_state = 'READY' and v_eligible_count = 0 then
    raise exception using
      errcode='22023',
      message='READY universe runs require at least one eligible security.';
  end if;

  if v_run_state = 'BLOCKED' and v_global_blocker_reason is null then
    raise exception using
      errcode='22023',
      message='BLOCKED universe runs require a global blocker reason.';
  end if;

  insert into public.p8_historical_universe_runs (
    portfolio_id, experiment_id, universe_version, decision_at, decision_date,
    source_cutoff_at, resolver_version, run_state, global_blocker_reason,
    eligible_count, ineligible_count, blocked_count, run_hash, created_by
  ) values (
    v_portfolio_id, v_experiment_id, v_universe_version, v_decision_at, v_decision_date,
    v_source_cutoff_at, v_resolver_version, v_run_state, v_global_blocker_reason,
    v_eligible_count, v_ineligible_count, v_blocked_count, v_run_hash, v_selected_by
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
    from public.p8_historical_universe_runs
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and universe_version = v_universe_version
      and decision_at = v_decision_at
      and run_hash = v_run_hash;

    if v_existing_run.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 universe run could not be resolved after content conflict.';
    end if;

    if v_existing_run.decision_date is distinct from v_decision_date
       or v_existing_run.source_cutoff_at is distinct from v_source_cutoff_at
       or v_existing_run.resolver_version is distinct from v_resolver_version
       or v_existing_run.run_state is distinct from v_run_state
       or v_existing_run.global_blocker_reason is distinct from v_global_blocker_reason
       or v_existing_run.eligible_count is distinct from v_eligible_count
       or v_existing_run.ineligible_count is distinct from v_ineligible_count
       or v_existing_run.blocked_count is distinct from v_blocked_count then
      raise exception using
        errcode='22023',
        message='P8 universe run hash was reused for different immutable run metadata.';
    end if;

    v_universe_run_id := v_existing_run.id;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'security_id', m.security_id,
          'listing_observation_id', m.listing_observation_id,
          'membership_state', m.membership_state,
          'reason_code', m.reason_code
        )
        order by m.security_id
      ),
      '[]'::jsonb
    )
    into v_stored_members
    from public.p8_historical_universe_members m
    where m.universe_run_id = v_universe_run_id;

    if v_stored_members is distinct from v_normalized_members then
      raise exception using
        errcode='22023',
        message='P8 universe run hash was reused for different immutable member content.';
    end if;
  else
    v_run_created := true;

    insert into public.p8_historical_universe_members (
      universe_run_id, portfolio_id, experiment_id, decision_at,
      security_id, listing_observation_id, membership_state, reason_code
    )
    select
      v_universe_run_id,
      v_portfolio_id,
      v_experiment_id,
      v_decision_at,
      x.security_id,
      x.listing_observation_id,
      x.membership_state,
      x.reason_code
    from jsonb_to_recordset(p_members) as x(
      security_id uuid,
      listing_observation_id uuid,
      membership_state text,
      reason_code text
    );
  end if;

  insert into public.p8_historical_universe_run_selections (
    portfolio_id, experiment_id, decision_at, universe_run_id,
    selection_run_id, selection_basis, selector_version, selected_by
  ) values (
    v_portfolio_id, v_experiment_id, v_decision_at, v_universe_run_id,
    v_selection_run_id, v_selection_basis, v_selector_version, v_selected_by
  )
  on conflict (portfolio_id, experiment_id, selection_run_id, decision_at)
  do nothing
  returning id into v_selection_id;

  if v_selection_id is null then
    select * into v_existing_selection
    from public.p8_historical_universe_run_selections
    where portfolio_id = v_portfolio_id
      and experiment_id = v_experiment_id
      and selection_run_id = v_selection_run_id
      and decision_at = v_decision_at;

    if v_existing_selection.id is null then
      raise exception using
        errcode='55000',
        message='Existing P8 universe selection could not be resolved after idempotency conflict.';
    end if;

    if v_existing_selection.universe_run_id is distinct from v_universe_run_id
       or v_existing_selection.selection_basis is distinct from v_selection_basis
       or v_existing_selection.selector_version is distinct from v_selector_version then
      raise exception using
        errcode='22023',
        message='P8 universe selection idempotency key was reused for a different canonical run.';
    end if;

    v_selection_id := v_existing_selection.id;
  else
    v_selection_created := true;
  end if;

  return jsonb_build_object(
    'universe_run_id', v_universe_run_id,
    'selection_id', v_selection_id,
    'run_created', v_run_created,
    'run_reused', not v_run_created,
    'selection_created', v_selection_created,
    'selection_reused', not v_selection_created,
    'eligible_count', v_eligible_count,
    'ineligible_count', v_ineligible_count,
    'blocked_count', v_blocked_count,
    'run_state', v_run_state
  );
end;
$$;

revoke all on function public.append_and_select_p8_historical_universe_v1(jsonb,jsonb,jsonb)
from public, anon, authenticated;
grant execute on function public.append_and_select_p8_historical_universe_v1(jsonb,jsonb,jsonb)
to service_role;

comment on table public.p8_listing_observations is
  'Append-only P8 historical listing/delisting evidence. Unknown validity remains unknown; current security state is never projected backward.';
comment on table public.p8_historical_universe_runs is
  'Immutable P8 decision-instant universe reconstruction or explicit global blocker.';
comment on table public.p8_historical_universe_members is
  'Immutable security-level eligibility/ineligibility/blocker disposition within a P8 historical universe run.';
comment on table public.p8_historical_universe_run_selections is
  'Append-only canonical selection history for P8 historical universe runs.';
comment on view public.current_p8_historical_universe_membership_v1 is
  'Owner-scoped canonical P8 historical universe membership by decision instant; no current-holdings or current-active fallback.';
