-- PortfolioAI P8-B2 many-to-one listing evidence extension.
-- Repository/local artifact only until separately approved for hosted PortfolioAI Dev.
-- Additive only: preserves all existing P8-B2 foundation objects and immutable rows.

alter table public.p8_historical_universe_members
  add constraint p8_historical_universe_members_scope_uq
  unique (id, portfolio_id, experiment_id, security_id, decision_at);

create table public.p8_historical_universe_member_listing_evidence (
  id uuid primary key default gen_random_uuid(),
  universe_member_id uuid not null,
  portfolio_id uuid not null,
  experiment_id text not null,
  security_id uuid not null,
  decision_at timestamptz not null,
  listing_observation_id uuid not null,
  evidence_role text not null check (
    evidence_role in (
      'ELIGIBILITY_SUPPORT',
      'IDENTITY_SUPPORT',
      'SYMBOL_SERIES_VARIANT',
      'DELISTING_SUPPORT',
      'OTHER_SUPPORT'
    )
  ),
  created_at timestamptz not null default now(),

  constraint p8_member_listing_evidence_member_scope_fk
    foreign key (
      universe_member_id,
      portfolio_id,
      experiment_id,
      security_id,
      decision_at
    )
    references public.p8_historical_universe_members(
      id,
      portfolio_id,
      experiment_id,
      security_id,
      decision_at
    )
    on delete restrict,

  constraint p8_member_listing_evidence_observation_scope_fk
    foreign key (
      listing_observation_id,
      portfolio_id,
      experiment_id,
      security_id
    )
    references public.p8_listing_observations(
      id,
      portfolio_id,
      experiment_id,
      security_id
    )
    on delete restrict,

  constraint p8_member_listing_evidence_uq
    unique (universe_member_id, listing_observation_id, evidence_role)
);

create index p8_member_listing_evidence_observation_idx
  on public.p8_historical_universe_member_listing_evidence(listing_observation_id);

create index p8_member_listing_evidence_security_decision_idx
  on public.p8_historical_universe_member_listing_evidence(
    portfolio_id,
    experiment_id,
    security_id,
    decision_at
  );

create trigger p8_member_listing_evidence_append_only
before update or delete on public.p8_historical_universe_member_listing_evidence
for each row execute function public.reject_p8_historical_universe_mutation_v1();

alter table public.p8_historical_universe_member_listing_evidence enable row level security;

create policy p8_member_listing_evidence_owner_read
on public.p8_historical_universe_member_listing_evidence
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

revoke all on public.p8_historical_universe_member_listing_evidence
from public, anon, authenticated;
grant select on public.p8_historical_universe_member_listing_evidence to authenticated;
grant all on public.p8_historical_universe_member_listing_evidence to service_role;

create view public.current_p8_historical_universe_member_listing_evidence_v1
with (security_invoker = true) as
select
  r.portfolio_id,
  r.experiment_id,
  r.universe_version,
  r.decision_at,
  r.decision_date,
  r.run_hash,
  m.id as universe_member_id,
  m.security_id,
  m.membership_state,
  m.reason_code,
  e.evidence_role,
  o.id as listing_observation_id,
  o.exchange,
  o.trading_symbol,
  o.series,
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
  o.content_hash,
  o.raw_metadata
from public.current_p8_historical_universe_run_v1 r
join public.p8_historical_universe_members m
  on m.universe_run_id = r.id
join public.p8_historical_universe_member_listing_evidence e
  on e.universe_member_id = m.id
join public.p8_listing_observations o
  on o.id = e.listing_observation_id;

revoke all on public.current_p8_historical_universe_member_listing_evidence_v1
from public, anon, authenticated;
grant select on public.current_p8_historical_universe_member_listing_evidence_v1
to authenticated;

create function public.append_and_select_p8_historical_universe_v2(
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
  v_normalized_links jsonb;
  v_stored_links jsonb;

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

  if jsonb_typeof(p_members) <> 'array'
     or jsonb_typeof(p_evidence_links) <> 'array' then
    raise exception using
      errcode='22023',
      message='P8 historical-universe members and evidence links must be JSON arrays.';
  end if;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'security_id', x.security_id,
          'membership_state', x.membership_state,
          'reason_code', x.reason_code
        )
        order by x.security_id
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
    security_id uuid,
    membership_state text,
    reason_code text
  );

  if exists (
    select 1
    from jsonb_to_recordset(p_members) as x(
      security_id uuid,
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

  if (
    select count(*)
    from jsonb_to_recordset(p_members) as x(
      security_id uuid,
      membership_state text,
      reason_code text
    )
  ) <> (
    select count(distinct x.security_id)
    from jsonb_to_recordset(p_members) as x(
      security_id uuid,
      membership_state text,
      reason_code text
    )
  ) then
    raise exception using
      errcode='22023',
      message='P8 V2 requires exactly one universe member per security identity.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'security_id', x.security_id,
        'listing_observation_id', x.listing_observation_id,
        'evidence_role', x.evidence_role
      )
      order by x.security_id, x.listing_observation_id, x.evidence_role
    ),
    '[]'::jsonb
  )
  into v_normalized_links
  from jsonb_to_recordset(p_evidence_links) as x(
    security_id uuid,
    listing_observation_id uuid,
    evidence_role text
  );

  if exists (
    select 1
    from jsonb_to_recordset(p_evidence_links) as x(
      security_id uuid,
      listing_observation_id uuid,
      evidence_role text
    )
    where x.security_id is null
       or x.listing_observation_id is null
       or x.evidence_role not in (
         'ELIGIBILITY_SUPPORT',
         'IDENTITY_SUPPORT',
         'SYMBOL_SERIES_VARIANT',
         'DELISTING_SUPPORT',
         'OTHER_SUPPORT'
       )
       or not exists (
         select 1
         from jsonb_to_recordset(p_members) as m(
           security_id uuid,
           membership_state text,
           reason_code text
         )
         where m.security_id = x.security_id
       )
       or not exists (
         select 1
         from public.p8_listing_observations o
         where o.id = x.listing_observation_id
           and o.portfolio_id = v_portfolio_id
           and o.experiment_id = v_experiment_id
           and o.security_id = x.security_id
       )
  ) then
    raise exception using
      errcode='22023',
      message='Every P8 evidence link must resolve to a same-scope member and listing observation with an approved evidence role.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_members) as m(
      security_id uuid,
      membership_state text,
      reason_code text
    )
    where m.membership_state = 'ELIGIBLE'
      and not exists (
        select 1
        from jsonb_to_recordset(p_evidence_links) as x(
          security_id uuid,
          listing_observation_id uuid,
          evidence_role text
        )
        join public.p8_listing_observations o
          on o.id = x.listing_observation_id
        where x.security_id = m.security_id
          and x.evidence_role = 'ELIGIBILITY_SUPPORT'
          and o.portfolio_id = v_portfolio_id
          and o.experiment_id = v_experiment_id
          and o.security_id = m.security_id
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
  ) then
    raise exception using
      errcode='22023',
      message='Every ELIGIBLE P8 V2 member requires at least one linked proven LISTED observation valid at the decision instant.';
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
        message='Existing P8 V2 universe run could not be resolved after content conflict.';
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
        message='P8 V2 universe run hash was reused for different immutable run metadata.';
    end if;

    v_universe_run_id := v_existing_run.id;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'security_id', m.security_id,
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
        message='P8 V2 universe run hash was reused for different immutable member content.';
    end if;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'security_id', e.security_id,
          'listing_observation_id', e.listing_observation_id,
          'evidence_role', e.evidence_role
        )
        order by e.security_id, e.listing_observation_id, e.evidence_role
      ),
      '[]'::jsonb
    )
    into v_stored_links
    from public.p8_historical_universe_member_listing_evidence e
    join public.p8_historical_universe_members m
      on m.id = e.universe_member_id
    where m.universe_run_id = v_universe_run_id;

    if v_stored_links is distinct from v_normalized_links then
      raise exception using
        errcode='22023',
        message='P8 V2 universe run hash was reused for different immutable evidence-link content.';
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
      null,
      x.membership_state,
      x.reason_code
    from jsonb_to_recordset(p_members) as x(
      security_id uuid,
      membership_state text,
      reason_code text
    );

    insert into public.p8_historical_universe_member_listing_evidence (
      universe_member_id,
      portfolio_id,
      experiment_id,
      security_id,
      decision_at,
      listing_observation_id,
      evidence_role
    )
    select
      m.id,
      v_portfolio_id,
      v_experiment_id,
      x.security_id,
      v_decision_at,
      x.listing_observation_id,
      x.evidence_role
    from jsonb_to_recordset(p_evidence_links) as x(
      security_id uuid,
      listing_observation_id uuid,
      evidence_role text
    )
    join public.p8_historical_universe_members m
      on m.universe_run_id = v_universe_run_id
     and m.security_id = x.security_id;
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
        message='Existing P8 V2 universe selection could not be resolved after idempotency conflict.';
    end if;

    if v_existing_selection.universe_run_id is distinct from v_universe_run_id
       or v_existing_selection.selection_basis is distinct from v_selection_basis
       or v_existing_selection.selector_version is distinct from v_selector_version then
      raise exception using
        errcode='22023',
        message='P8 V2 universe selection idempotency key was reused for a different canonical run.';
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
    'run_state', v_run_state,
    'evidence_link_count', jsonb_array_length(v_normalized_links)
  );
end;
$$;

revoke all on function public.append_and_select_p8_historical_universe_v2(jsonb,jsonb,jsonb,jsonb)
from public, anon, authenticated;
grant execute on function public.append_and_select_p8_historical_universe_v2(jsonb,jsonb,jsonb,jsonb)
to service_role;

comment on table public.p8_historical_universe_member_listing_evidence is
  'Append-only many-to-one bridge preserving every authoritative listing observation that supports one historical ISIN-level universe member.';
comment on view public.current_p8_historical_universe_member_listing_evidence_v1 is
  'Owner-scoped canonical historical-universe member evidence bundle; preserves symbol/series/instrument variants without collapsing them.';
comment on function public.append_and_select_p8_historical_universe_v2(jsonb,jsonb,jsonb,jsonb) is
  'P8-B2 service-only append/select path for ISIN-level members with immutable many-to-one listing evidence.';
