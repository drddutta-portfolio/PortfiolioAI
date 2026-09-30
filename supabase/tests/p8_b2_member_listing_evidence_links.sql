begin;

do $$
declare
  v_portfolio_id constant uuid := '8b210000-0000-4000-8000-000000000002';
  v_security_id constant uuid := '8b210000-0000-4000-8000-000000000003';
  v_observation_1 uuid;
  v_observation_2 uuid;
  v_run jsonb;
  v_members jsonb;
  v_links jsonb;
  v_selection jsonb;
  v_first jsonb;
  v_repeat jsonb;
  v_member_id uuid;
  v_links_before bigint;
begin
  insert into auth.users (id, email)
  values (
    '8b210000-0000-4000-8000-000000000001'::uuid,
    'p8-b2-link-test@example.invalid'
  );

  insert into public.portfolios (id, user_id, name, base_currency, is_active)
  values (
    v_portfolio_id,
    '8b210000-0000-4000-8000-000000000001'::uuid,
    'P8 B2 Link Test Portfolio',
    'INR',
    true
  );

  insert into public.securities (
    id, symbol, exchange, name, asset_class, instrument_type,
    currency, is_active, creation_source, series
  ) values (
    v_security_id,
    'P8LINK',
    'NSE',
    'P8 B2 Link Test Equity',
    'EQUITY',
    'EQUITY',
    'INR',
    true,
    'P8_B2_TEST',
    'EQ'
  );

  v_observation_1 := public.append_p8_listing_observation_v1(jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
    'security_id', v_security_id,
    'exchange', 'NSE',
    'trading_symbol', 'P8LINK',
    'series', 'EQ',
    'currency', 'INR',
    'listing_state', 'LISTED',
    'validity_status', 'PROVEN',
    'valid_from', '2024-01-01',
    'valid_to', null,
    'source_code', 'P8_TEST_OFFICIAL_NSE',
    'source_identity', 'P8-B2-LINK-FIXTURE-EQ',
    'source_published_at', '2024-01-01T00:00:00Z',
    'observed_at', '2024-01-01T00:00:00Z',
    'retrieved_at', '2026-09-30T00:00:00Z',
    'availability_proof', 'IMMUTABLE_PUBLICATION_ARCHIVE',
    'content_hash', repeat('d',64),
    'raw_metadata', jsonb_build_object('instrument_id','1001')
  ));

  v_observation_2 := public.append_p8_listing_observation_v1(jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
    'security_id', v_security_id,
    'exchange', 'NSE',
    'trading_symbol', 'P8LINK',
    'series', 'BE',
    'currency', 'INR',
    'listing_state', 'LISTED',
    'validity_status', 'PROVEN',
    'valid_from', '2024-01-01',
    'valid_to', null,
    'source_code', 'P8_TEST_OFFICIAL_NSE',
    'source_identity', 'P8-B2-LINK-FIXTURE-BE',
    'source_published_at', '2024-01-01T00:00:00Z',
    'observed_at', '2024-01-01T00:00:00Z',
    'retrieved_at', '2026-09-30T00:00:00Z',
    'availability_proof', 'IMMUTABLE_PUBLICATION_ARCHIVE',
    'content_hash', repeat('e',64),
    'raw_metadata', jsonb_build_object('instrument_id','1002')
  ));

  v_run := jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
    'universe_version', 'P8_NSE_HISTORICAL_UNIVERSE_V1',
    'decision_at', '2025-03-31T15:30:00+05:30',
    'decision_date', '2025-03-31',
    'source_cutoff_at', '2025-03-31T15:30:00+05:30',
    'resolver_version', 'P8_B2_LINK_TEST_RESOLVER_V1',
    'run_state', 'READY',
    'global_blocker_reason', null,
    'run_hash', repeat('f',64)
  );

  v_members := jsonb_build_array(jsonb_build_object(
    'security_id', v_security_id,
    'membership_state', 'ELIGIBLE',
    'reason_code', 'PROVEN_LISTED_AT_DECISION'
  ));

  v_links := jsonb_build_array(
    jsonb_build_object(
      'security_id', v_security_id,
      'listing_observation_id', v_observation_1,
      'evidence_role', 'ELIGIBILITY_SUPPORT'
    ),
    jsonb_build_object(
      'security_id', v_security_id,
      'listing_observation_id', v_observation_2,
      'evidence_role', 'SYMBOL_SERIES_VARIANT'
    )
  );

  v_selection := jsonb_build_object(
    'selection_run_id', '8b210000-0000-4000-8000-000000000010',
    'selection_basis', 'P8_B2_INITIAL_MATERIALIZATION',
    'selector_version', 'P8_B2_LINK_TEST_SELECTOR_V1',
    'selected_by', null
  );

  select count(*) into v_links_before
  from public.p8_historical_universe_member_listing_evidence;

  v_first := public.append_and_select_p8_historical_universe_v2(
    v_run, v_members, v_links, v_selection
  );

  v_repeat := public.append_and_select_p8_historical_universe_v2(
    v_run, v_members, v_links, v_selection
  );

  if not (v_first->>'run_created')::boolean
     or not (v_first->>'selection_created')::boolean
     or (v_first->>'evidence_link_count')::integer <> 2
     or (v_repeat->>'run_created')::boolean
     or (v_repeat->>'selection_created')::boolean then
    raise exception 'P8-B2 V2 repeatability contract failed';
  end if;

  select id into v_member_id
  from public.p8_historical_universe_members
  where universe_run_id = (v_first->>'universe_run_id')::uuid
    and security_id = v_security_id;

  if v_member_id is null then
    raise exception 'P8-B2 V2 member was not created';
  end if;

  if (select listing_observation_id
      from public.p8_historical_universe_members
      where id = v_member_id) is not null then
    raise exception 'P8-B2 V2 repurposed the legacy single listing observation pointer';
  end if;

  if (select count(*)
      from public.p8_historical_universe_member_listing_evidence
      where universe_member_id = v_member_id) <> 2 then
    raise exception 'P8-B2 V2 did not preserve all linked listing evidence';
  end if;

  if (select count(*)
      from public.p8_historical_universe_member_listing_evidence) <> v_links_before + 2 then
    raise exception 'P8-B2 V2 duplicated evidence links on repeat';
  end if;

  if not exists (
    select 1
    from public.current_p8_historical_universe_member_listing_evidence_v1
    where universe_member_id = v_member_id
      and series = 'EQ'
      and evidence_role = 'ELIGIBILITY_SUPPORT'
  ) or not exists (
    select 1
    from public.current_p8_historical_universe_member_listing_evidence_v1
    where universe_member_id = v_member_id
      and series = 'BE'
      and evidence_role = 'SYMBOL_SERIES_VARIANT'
  ) then
    raise exception 'P8-B2 V2 canonical evidence-bundle view lost a listing variant';
  end if;

  begin
    update public.p8_historical_universe_member_listing_evidence
    set evidence_role = 'IDENTITY_SUPPORT'
    where universe_member_id = v_member_id
      and listing_observation_id = v_observation_2;
    raise exception 'P8-B2 evidence link accepted mutation';
  exception when sqlstate '55000' then null;
  end;

  begin
    perform public.append_and_select_p8_historical_universe_v2(
      v_run,
      v_members,
      jsonb_build_array(
        jsonb_build_object(
          'security_id', v_security_id,
          'listing_observation_id', v_observation_2,
          'evidence_role', 'SYMBOL_SERIES_VARIANT'
        )
      ),
      v_selection
    );
    raise exception 'P8-B2 V2 accepted same run hash with changed evidence-link content';
  exception when sqlstate '22023' then null;
  end;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_class c
    where c.oid = 'public.current_p8_historical_universe_member_listing_evidence_v1'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) then
    raise exception 'P8-B2 evidence-link view is not security_invoker';
  end if;

  if has_table_privilege(
       'anon',
       'public.p8_historical_universe_member_listing_evidence',
       'select'
     )
     or not has_table_privilege(
       'authenticated',
       'public.p8_historical_universe_member_listing_evidence',
       'select'
     )
     or has_function_privilege(
       'authenticated',
       'public.append_and_select_p8_historical_universe_v2(jsonb,jsonb,jsonb,jsonb)'::regprocedure,
       'execute'
     )
     or not has_function_privilege(
       'service_role',
       'public.append_and_select_p8_historical_universe_v2(jsonb,jsonb,jsonb,jsonb)'::regprocedure,
       'execute'
     ) then
    raise exception 'P8-B2 evidence-link privilege contract failed';
  end if;
end;
$$;

rollback;
