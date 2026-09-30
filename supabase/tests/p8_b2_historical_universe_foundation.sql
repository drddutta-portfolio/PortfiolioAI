begin;

do $$
declare
  v_portfolio_id uuid;
  v_security_id uuid;
  v_security_active_before boolean;
  v_observation_id uuid;
  v_observation_id_repeat uuid;
  v_run jsonb;
  v_members jsonb;
  v_selection jsonb;
  v_first jsonb;
  v_repeat jsonb;
  v_runs_before bigint;
  v_members_before bigint;
  v_selections_before bigint;
begin
  select ch.portfolio_id, ch.security_id, s.is_active
    into v_portfolio_id, v_security_id, v_security_active_before
  from public.current_holdings ch
  join public.securities s on s.id = ch.security_id
  where ch.current_quantity > 0
    and s.asset_class = 'EQUITY'
  limit 1;

  if v_portfolio_id is null or v_security_id is null then
    raise exception 'P8-B2 test requires one existing held equity fixture';
  end if;

  v_observation_id := public.append_p8_listing_observation_v1(jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
    'security_id', v_security_id,
    'exchange', 'NSE',
    'trading_symbol', 'P8TEST',
    'series', 'EQ',
    'currency', 'INR',
    'listing_state', 'LISTED',
    'validity_status', 'PROVEN',
    'valid_from', '2020-01-01',
    'valid_to', null,
    'source_code', 'P8_TEST_OFFICIAL_NSE',
    'source_identity', 'P8-B2-LISTING-FIXTURE-1',
    'source_published_at', '2020-01-02T00:00:00Z',
    'observed_at', '2020-01-01T00:00:00Z',
    'retrieved_at', '2026-09-30T00:00:00Z',
    'availability_proof', 'IMMUTABLE_PUBLICATION_ARCHIVE',
    'content_hash', repeat('a',64),
    'raw_metadata', jsonb_build_object('fixture', true)
  ));

  v_observation_id_repeat := public.append_p8_listing_observation_v1(jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
    'security_id', v_security_id,
    'exchange', 'NSE',
    'trading_symbol', 'P8TEST',
    'series', 'EQ',
    'currency', 'INR',
    'listing_state', 'LISTED',
    'validity_status', 'PROVEN',
    'valid_from', '2020-01-01',
    'valid_to', null,
    'source_code', 'P8_TEST_OFFICIAL_NSE',
    'source_identity', 'P8-B2-LISTING-FIXTURE-1',
    'source_published_at', '2020-01-02T00:00:00Z',
    'observed_at', '2020-01-01T00:00:00Z',
    'retrieved_at', '2026-09-30T00:00:00Z',
    'availability_proof', 'IMMUTABLE_PUBLICATION_ARCHIVE',
    'content_hash', repeat('a',64),
    'raw_metadata', jsonb_build_object('fixture', true)
  ));

  if v_observation_id_repeat <> v_observation_id then
    raise exception 'P8-B2 listing observation idempotency failed';
  end if;

  select count(*) into v_runs_before from public.p8_historical_universe_runs;
  select count(*) into v_members_before from public.p8_historical_universe_members;
  select count(*) into v_selections_before from public.p8_historical_universe_run_selections;

  v_run := jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
    'universe_version', 'P8_NSE_HISTORICAL_UNIVERSE_V1',
    'decision_at', '2025-03-31T15:30:00+05:30',
    'decision_date', '2025-03-31',
    'source_cutoff_at', '2025-03-31T15:30:00+05:30',
    'resolver_version', 'P8_B2_TEST_RESOLVER_V1',
    'run_state', 'READY',
    'global_blocker_reason', null,
    'run_hash', repeat('b',64)
  );

  v_members := jsonb_build_array(jsonb_build_object(
    'security_id', v_security_id,
    'listing_observation_id', v_observation_id,
    'membership_state', 'ELIGIBLE',
    'reason_code', 'PROVEN_LISTED_AT_DECISION'
  ));

  v_selection := jsonb_build_object(
    'selection_run_id', '22222222-2222-4222-8222-222222222222',
    'selection_basis', 'P8_B2_INITIAL_MATERIALIZATION',
    'selector_version', 'P8_B2_TEST_SELECTOR_V1',
    'selected_by', null
  );

  v_first := public.append_and_select_p8_historical_universe_v1(v_run, v_members, v_selection);
  v_repeat := public.append_and_select_p8_historical_universe_v1(v_run, v_members, v_selection);

  if not (v_first->>'run_created')::boolean
     or not (v_first->>'selection_created')::boolean
     or (v_repeat->>'run_created')::boolean
     or (v_repeat->>'selection_created')::boolean then
    raise exception 'P8-B2 universe append/select repeatability contract failed';
  end if;

  if (select count(*) from public.p8_historical_universe_runs) <> v_runs_before + 1
     or (select count(*) from public.p8_historical_universe_members) <> v_members_before + 1
     or (select count(*) from public.p8_historical_universe_run_selections) <> v_selections_before + 1 then
    raise exception 'P8-B2 universe content or selection was duplicated';
  end if;

  if not exists (
    select 1
    from public.current_p8_historical_universe_membership_v1
    where portfolio_id = v_portfolio_id
      and experiment_id = 'P8_EXP_NSE_MONTHLY_6M_V1'
      and decision_date = '2025-03-31'
      and security_id = v_security_id
      and membership_state = 'ELIGIBLE'
      and validity_status = 'PROVEN'
  ) then
    raise exception 'P8-B2 canonical historical membership view did not resolve the selected run';
  end if;

  if (select is_active from public.securities where id = v_security_id)
     is distinct from v_security_active_before then
    raise exception 'P8-B2 changed current securities.is_active';
  end if;

  begin
    perform public.append_p8_listing_observation_v1(jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'security_id', v_security_id,
      'exchange', 'NSE',
      'trading_symbol', 'P8UNKNOWN',
      'listing_state', 'LISTED',
      'validity_status', 'PROVEN',
      'valid_from', null,
      'source_code', 'P8_TEST_OFFICIAL_NSE',
      'source_identity', 'P8-B2-UNKNOWN-DATE',
      'retrieved_at', '2026-09-30T00:00:00Z',
      'availability_proof', 'CONTEMPORANEOUS_CAPTURE',
      'content_hash', repeat('c',64)
    ));
    raise exception 'P8-B2 accepted invented PROVEN validity without valid_from';
  exception when sqlstate '22023' then null;
  end;

  begin
    update public.p8_listing_observations
      set trading_symbol = 'MUTATED'
    where id = v_observation_id;
    raise exception 'P8-B2 append-only listing observation accepted mutation';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_class c
    where c.oid = 'public.current_p8_historical_universe_run_v1'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) then
    raise exception 'P8-B2 current universe run view is not security_invoker';
  end if;

  if exists (
    select 1
    from pg_class c
    where c.oid = 'public.current_p8_historical_universe_membership_v1'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) then
    raise exception 'P8-B2 current universe membership view is not security_invoker';
  end if;

  if has_table_privilege('anon','public.p8_listing_observations','select')
     or has_table_privilege('anon','public.p8_historical_universe_runs','select')
     or has_table_privilege('anon','public.p8_historical_universe_members','select')
     or has_table_privilege('anon','public.p8_historical_universe_run_selections','select')
     or not has_table_privilege('authenticated','public.p8_listing_observations','select')
     or not has_table_privilege('authenticated','public.p8_historical_universe_runs','select')
     or not has_table_privilege('authenticated','public.p8_historical_universe_members','select')
     or not has_table_privilege('authenticated','public.p8_historical_universe_run_selections','select')
     or has_function_privilege('authenticated','public.append_p8_listing_observation_v1(jsonb)'::regprocedure,'execute')
     or has_function_privilege('authenticated','public.append_and_select_p8_historical_universe_v1(jsonb,jsonb,jsonb)'::regprocedure,'execute')
     or not has_function_privilege('service_role','public.append_p8_listing_observation_v1(jsonb)'::regprocedure,'execute')
     or not has_function_privilege('service_role','public.append_and_select_p8_historical_universe_v1(jsonb,jsonb,jsonb)'::regprocedure,'execute') then
    raise exception 'P8-B2 privilege contract failed';
  end if;
end;
$$;

rollback;
