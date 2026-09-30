begin;

do $$
declare
  v_user_id constant uuid := '8b220000-0000-4000-8000-000000000001';
  v_portfolio_id constant uuid := '8b220000-0000-4000-8000-000000000002';
  v_exact_security_id constant uuid := '8b220000-0000-4000-8000-000000000003';
  v_null_security_id constant uuid := '8b220000-0000-4000-8000-000000000004';

  v_exact_identity_id uuid;
  v_exact_identity_repeat uuid;
  v_null_identity_id uuid;
  v_unlinked_identity_id uuid;

  v_archive_id uuid;
  v_archive_repeat uuid;

  v_exact_observation_1 uuid;
  v_exact_observation_1_repeat uuid;
  v_exact_observation_2 uuid;
  v_null_observation uuid;

  v_run jsonb;
  v_members jsonb;
  v_links jsonb;
  v_selection jsonb;
  v_first jsonb;
  v_repeat jsonb;

  v_legacy_runs_before bigint;
  v_legacy_members_before bigint;
  v_legacy_links_before bigint;
  v_legacy_selections_before bigint;
begin
  insert into auth.users (id, email)
  values (v_user_id, 'p8-b2-v3-test@example.invalid');

  insert into public.portfolios (id, user_id, name, base_currency, is_active)
  values (
    v_portfolio_id,
    v_user_id,
    'P8 B2 V3 Test Portfolio',
    'INR',
    true
  );

  insert into public.securities (
    id, symbol, exchange, isin, name, asset_class, instrument_type,
    currency, is_active, creation_source, series
  ) values
  (
    v_exact_security_id,
    'P8EXACT',
    'NSE',
    'INE123A01011',
    'P8 Exact ISIN Equity',
    'EQUITY',
    'COMMON_STOCK',
    'INR',
    true,
    'P8_B2_TEST',
    'EQ'
  ),
  (
    v_null_security_id,
    'P8NULL',
    'NSE',
    null,
    'P8 Current Null ISIN Equity',
    'EQUITY',
    'COMMON_STOCK',
    'INR',
    true,
    'P8_B2_TEST',
    'EQ'
  );

  select count(*) into v_legacy_runs_before
  from public.p8_historical_universe_runs;

  select count(*) into v_legacy_members_before
  from public.p8_historical_universe_members;

  select count(*) into v_legacy_links_before
  from public.p8_historical_universe_member_listing_evidence;

  select count(*) into v_legacy_selections_before
  from public.p8_historical_universe_run_selections;

  v_exact_identity_id := public.append_p8_historical_security_identity_v1(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_isin', 'INE123A01011',
      'issuer_type', 'E',
      'security_type_code', '01',
      'canonical_security_id', v_exact_security_id,
      'canonical_link_basis', 'EXACT_ISIN',
      'canonical_link_symbol', null,
      'link_evidence', jsonb_build_object('basis','fixture-exact-isin'),
      'identity_hash', repeat('a',64),
      'created_by', v_user_id
    )
  );

  v_exact_identity_repeat := public.append_p8_historical_security_identity_v1(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_isin', 'INE123A01011',
      'issuer_type', 'E',
      'security_type_code', '01',
      'canonical_security_id', v_exact_security_id,
      'canonical_link_basis', 'EXACT_ISIN',
      'canonical_link_symbol', null,
      'link_evidence', jsonb_build_object('basis','fixture-exact-isin'),
      'identity_hash', repeat('a',64),
      'created_by', v_user_id
    )
  );

  if v_exact_identity_repeat <> v_exact_identity_id then
    raise exception 'P8-B2 V3 historical identity idempotency failed';
  end if;

  v_null_identity_id := public.append_p8_historical_security_identity_v1(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_isin', 'INE456B01012',
      'issuer_type', 'E',
      'security_type_code', '01',
      'canonical_security_id', v_null_security_id,
      'canonical_link_basis', 'EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN',
      'canonical_link_symbol', 'P8NULL',
      'link_evidence', jsonb_build_object('basis','fixture-unique-current-null-isin-symbol'),
      'identity_hash', repeat('b',64),
      'created_by', v_user_id
    )
  );

  v_unlinked_identity_id := public.append_p8_historical_security_identity_v1(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_isin', 'INE789C01013',
      'issuer_type', 'E',
      'security_type_code', '01',
      'canonical_security_id', null,
      'canonical_link_basis', 'NONE',
      'canonical_link_symbol', null,
      'link_evidence', jsonb_build_object('basis','fixture-historical-only'),
      'identity_hash', repeat('c',64),
      'created_by', v_user_id
    )
  );

  if (select isin from public.securities where id = v_null_security_id) is not null then
    raise exception 'P8-B2 V3 mutated the current null-ISIN security';
  end if;

  if (select isin from public.securities where id = v_exact_security_id)
     is distinct from 'INE123A01011' then
    raise exception 'P8-B2 V3 mutated the exact current security identity';
  end if;

  begin
    perform public.append_p8_historical_security_identity_v1(
      jsonb_build_object(
        'portfolio_id', v_portfolio_id,
        'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
        'historical_isin', 'INE124A01012',
        'issuer_type', 'E',
        'security_type_code', '01',
        'canonical_security_id', v_exact_security_id,
        'canonical_link_basis', 'EXACT_ISIN',
        'identity_hash', repeat('d',64)
      )
    );
    raise exception 'P8-B2 V3 accepted a false exact-ISIN canonical link';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.append_p8_historical_security_identity_v1(
      jsonb_build_object(
        'portfolio_id', v_portfolio_id,
        'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
        'historical_isin', 'INF769K01IC9',
        'issuer_type', 'F',
        'security_type_code', '01',
        'canonical_link_basis', 'NONE',
        'identity_hash', repeat('e',64)
      )
    );
    raise exception 'P8-B2 V3 accepted a non-frozen fund identity into the common-equity registry';
  exception when sqlstate '22023' then null;
  end;

  v_archive_id := public.append_p8_historical_source_archive_v1(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'source_code', 'NSE_CM_MII_SECURITY_MASTER',
      'source_date', '2025-03-31',
      'source_url', 'https://nsearchives.nseindia.com/content/cm/NSE_CM_security_31032025.csv.gz',
      'source_file_name', 'NSE_CM_security_31032025.csv',
      'csv_sha256', repeat('1',64),
      'gzip_sha256', repeat('2',64),
      'source_published_at', null,
      'available_no_later_than_at', '2025-03-31T09:00:00+05:30',
      'availability_proof_basis', 'NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS',
      'availability_proof_reference', 'NSE/MSD/60315;NSE/MSD/67344;NSE_MARKET_TIMINGS',
      'retrieved_at', '2026-09-30T00:00:00Z',
      'archive_hash', repeat('3',64),
      'raw_metadata', jsonb_build_object('fixture',true),
      'created_by', v_user_id
    )
  );

  v_archive_repeat := public.append_p8_historical_source_archive_v1(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'source_code', 'NSE_CM_MII_SECURITY_MASTER',
      'source_date', '2025-03-31',
      'source_url', 'https://nsearchives.nseindia.com/content/cm/NSE_CM_security_31032025.csv.gz',
      'source_file_name', 'NSE_CM_security_31032025.csv',
      'csv_sha256', repeat('1',64),
      'gzip_sha256', repeat('2',64),
      'source_published_at', null,
      'available_no_later_than_at', '2025-03-31T09:00:00+05:30',
      'availability_proof_basis', 'NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS',
      'availability_proof_reference', 'NSE/MSD/60315;NSE/MSD/67344;NSE_MARKET_TIMINGS',
      'retrieved_at', '2026-09-30T00:00:00Z',
      'archive_hash', repeat('3',64),
      'raw_metadata', jsonb_build_object('fixture',true),
      'created_by', v_user_id
    )
  );

  if v_archive_repeat <> v_archive_id then
    raise exception 'P8-B2 V3 source archive idempotency failed';
  end if;

  if (select source_published_at
      from public.p8_historical_source_archives
      where id = v_archive_id) is not null then
    raise exception 'P8-B2 V3 invented an exact source publication timestamp';
  end if;

  begin
    perform public.append_p8_historical_source_archive_v1(
      jsonb_build_object(
        'portfolio_id', v_portfolio_id,
        'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
        'source_code', 'NSE_CM_MII_SECURITY_MASTER',
        'source_date', '2025-03-31',
        'source_url', 'https://nsearchives.nseindia.com/content/cm/NSE_CM_security_31032025.csv.gz',
        'source_file_name', 'NSE_CM_security_31032025.csv',
        'csv_sha256', repeat('4',64),
        'gzip_sha256', repeat('5',64),
        'source_published_at', null,
        'available_no_later_than_at', '2025-03-31T09:01:00+05:30',
        'availability_proof_basis', 'NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS',
        'availability_proof_reference', 'NSE/MSD/60315;NSE/MSD/67344;NSE_MARKET_TIMINGS',
        'retrieved_at', '2026-09-30T00:00:00Z',
        'archive_hash', repeat('6',64)
      )
    );
    raise exception 'P8-B2 V3 accepted an unsupported NSE availability upper bound';
  exception when sqlstate '22023' then null;
  end;

  v_exact_observation_1 := public.append_p8_historical_listing_observation_v3(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_identity_id', v_exact_identity_id,
      'source_archive_id', v_archive_id,
      'source_date', '2025-03-31',
      'exchange', 'NSE',
      'trading_symbol', 'P8EXACT',
      'series', 'EQ',
      'instrument_id', '1001',
      'instrument_name', 'P8 EXACT TEST LIMITED',
      'source_presence_state', 'PRESENT_IN_SECURITY_MASTER',
      'row_hash', repeat('7',64),
      'raw_metadata', jsonb_build_object('row',1)
    )
  );

  v_exact_observation_1_repeat := public.append_p8_historical_listing_observation_v3(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_identity_id', v_exact_identity_id,
      'source_archive_id', v_archive_id,
      'source_date', '2025-03-31',
      'exchange', 'NSE',
      'trading_symbol', 'P8EXACT',
      'series', 'EQ',
      'instrument_id', '1001',
      'instrument_name', 'P8 EXACT TEST LIMITED',
      'source_presence_state', 'PRESENT_IN_SECURITY_MASTER',
      'row_hash', repeat('7',64),
      'raw_metadata', jsonb_build_object('row',1)
    )
  );

  if v_exact_observation_1_repeat <> v_exact_observation_1 then
    raise exception 'P8-B2 V3 listing observation idempotency failed';
  end if;

  v_exact_observation_2 := public.append_p8_historical_listing_observation_v3(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_identity_id', v_exact_identity_id,
      'source_archive_id', v_archive_id,
      'source_date', '2025-03-31',
      'exchange', 'NSE',
      'trading_symbol', 'P8EXACT',
      'series', 'BE',
      'instrument_id', '1002',
      'instrument_name', 'P8 EXACT TEST LIMITED',
      'source_presence_state', 'PRESENT_IN_SECURITY_MASTER',
      'row_hash', repeat('8',64),
      'raw_metadata', jsonb_build_object('row',2)
    )
  );

  v_null_observation := public.append_p8_historical_listing_observation_v3(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_identity_id', v_null_identity_id,
      'source_archive_id', v_archive_id,
      'source_date', '2025-03-31',
      'exchange', 'NSE',
      'trading_symbol', 'P8NULL',
      'series', 'EQ',
      'instrument_id', '2001',
      'instrument_name', 'P8 NULL ISIN TEST LIMITED',
      'source_presence_state', 'PRESENT_IN_SECURITY_MASTER',
      'row_hash', repeat('9',64),
      'raw_metadata', jsonb_build_object('row',3)
    )
  );

  v_run := jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
    'universe_version', 'P8_NSE_HISTORICAL_UNIVERSE_V3',
    'decision_at', '2025-03-31T15:30:00+05:30',
    'decision_date', '2025-03-31',
    'source_cutoff_at', '2025-03-31T15:30:00+05:30',
    'source_archive_id', v_archive_id,
    'source_date', '2025-03-31',
    'resolver_version', 'P8_B2_HISTORICAL_IDENTITY_RESOLVER_V3',
    'run_state', 'READY',
    'global_blocker_reason', null,
    'run_hash', repeat('a',64)
  );

  v_members := jsonb_build_array(
    jsonb_build_object(
      'historical_identity_id', v_exact_identity_id,
      'membership_state', 'ELIGIBLE',
      'reason_code', 'PRESENT_IN_SELECTED_NSE_SECURITY_MASTER'
    ),
    jsonb_build_object(
      'historical_identity_id', v_null_identity_id,
      'membership_state', 'ELIGIBLE',
      'reason_code', 'PRESENT_IN_SELECTED_NSE_SECURITY_MASTER'
    ),
    jsonb_build_object(
      'historical_identity_id', v_unlinked_identity_id,
      'membership_state', 'INELIGIBLE',
      'reason_code', 'ABSENT_FROM_SELECTED_NSE_SECURITY_MASTER'
    )
  );

  v_links := jsonb_build_array(
    jsonb_build_object(
      'historical_identity_id', v_exact_identity_id,
      'listing_observation_id', v_exact_observation_1,
      'evidence_role', 'ELIGIBILITY_SUPPORT'
    ),
    jsonb_build_object(
      'historical_identity_id', v_exact_identity_id,
      'listing_observation_id', v_exact_observation_2,
      'evidence_role', 'SYMBOL_SERIES_VARIANT'
    ),
    jsonb_build_object(
      'historical_identity_id', v_null_identity_id,
      'listing_observation_id', v_null_observation,
      'evidence_role', 'ELIGIBILITY_SUPPORT'
    )
  );

  v_selection := jsonb_build_object(
    'selection_run_id', '8b220000-0000-4000-8000-000000000010',
    'selection_basis', 'P8_B2_INITIAL_MATERIALIZATION',
    'selector_version', 'P8_B2_HISTORICAL_IDENTITY_SELECTOR_V3',
    'selected_by', v_user_id
  );

  v_first := public.append_and_select_p8_historical_universe_v3(
    v_run, v_members, v_links, v_selection
  );

  v_repeat := public.append_and_select_p8_historical_universe_v3(
    v_run, v_members, v_links, v_selection
  );

  if not (v_first->>'run_created')::boolean
     or not (v_first->>'selection_created')::boolean
     or (v_first->>'eligible_count')::integer <> 2
     or (v_first->>'ineligible_count')::integer <> 1
     or (v_first->>'blocked_count')::integer <> 0
     or (v_first->>'evidence_link_count')::integer <> 3
     or (v_repeat->>'run_created')::boolean
     or (v_repeat->>'selection_created')::boolean then
    raise exception 'P8-B2 V3 universe append/select repeatability failed';
  end if;

  if (select count(*)
      from public.current_p8_historical_universe_membership_v3
      where portfolio_id = v_portfolio_id
        and experiment_id = 'P8_EXP_NSE_MONTHLY_6M_V1'
        and decision_date = '2025-03-31') <> 3 then
    raise exception 'P8-B2 V3 current membership view did not resolve all historical identities';
  end if;

  if (select count(*)
      from public.current_p8_historical_universe_member_listing_evidence_v3
      where portfolio_id = v_portfolio_id
        and historical_identity_id = v_exact_identity_id) <> 2 then
    raise exception 'P8-B2 V3 evidence view collapsed same-identity listing variants';
  end if;

  if not exists (
    select 1
    from public.current_p8_historical_universe_membership_v3
    where historical_identity_id = v_unlinked_identity_id
      and canonical_security_id is null
      and membership_state = 'INELIGIBLE'
  ) then
    raise exception 'P8-B2 V3 failed to preserve a historical-only identity without a live security';
  end if;

  begin
    perform public.append_and_select_p8_historical_universe_v3(
      v_run,
      v_members,
      jsonb_build_array(
        jsonb_build_object(
          'historical_identity_id', v_exact_identity_id,
          'listing_observation_id', v_exact_observation_1,
          'evidence_role', 'ELIGIBILITY_SUPPORT'
        ),
        jsonb_build_object(
          'historical_identity_id', v_null_identity_id,
          'listing_observation_id', v_null_observation,
          'evidence_role', 'ELIGIBILITY_SUPPORT'
        )
      ),
      v_selection
    );
    raise exception 'P8-B2 V3 accepted same run hash with changed evidence-link content';
  exception when sqlstate '22023' then null;
  end;

  begin
    update public.p8_historical_security_identities
    set canonical_link_basis = 'NONE'
    where id = v_exact_identity_id;
    raise exception 'P8-B2 V3 historical identity accepted mutation';
  exception when sqlstate '55000' then null;
  end;

  begin
    update public.p8_historical_source_archives
    set source_file_name = 'mutated.csv'
    where id = v_archive_id;
    raise exception 'P8-B2 V3 source archive accepted mutation';
  exception when sqlstate '55000' then null;
  end;

  begin
    update public.p8_historical_listing_observations_v3
    set trading_symbol = 'MUTATED'
    where id = v_exact_observation_1;
    raise exception 'P8-B2 V3 listing observation accepted mutation';
  exception when sqlstate '55000' then null;
  end;

  if (select count(*) from public.p8_historical_universe_runs)
        <> v_legacy_runs_before
     or (select count(*) from public.p8_historical_universe_members)
        <> v_legacy_members_before
     or (select count(*) from public.p8_historical_universe_member_listing_evidence)
        <> v_legacy_links_before
     or (select count(*) from public.p8_historical_universe_run_selections)
        <> v_legacy_selections_before then
    raise exception 'P8-B2 V3 repurposed or wrote into legacy B2 v1/v2 objects';
  end if;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'p8_historical_security_identities',
    'p8_historical_source_archives',
    'p8_historical_listing_observations_v3',
    'p8_historical_universe_runs_v3',
    'p8_historical_universe_members_v3',
    'p8_historical_universe_member_listing_evidence_v3',
    'p8_historical_universe_run_selections_v3'
  ]
  loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table
        and c.relrowsecurity
    ) then
      raise exception 'P8-B2 V3 RLS is not enabled on %', v_table;
    end if;

    if has_table_privilege('anon', format('public.%I',v_table), 'select')
       or has_table_privilege('anon', format('public.%I',v_table), 'insert')
       or has_table_privilege('anon', format('public.%I',v_table), 'update')
       or has_table_privilege('anon', format('public.%I',v_table), 'delete')
       or not has_table_privilege('authenticated', format('public.%I',v_table), 'select')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'insert')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'update')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'delete')
       or not has_table_privilege('service_role', format('public.%I',v_table), 'select') then
      raise exception 'P8-B2 V3 browser/read privilege contract failed on %', v_table;
    end if;
  end loop;

  if exists (
    select 1
    from pg_class c
    where c.oid = 'public.current_p8_historical_universe_run_v3'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) or exists (
    select 1
    from pg_class c
    where c.oid = 'public.current_p8_historical_universe_membership_v3'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) or exists (
    select 1
    from pg_class c
    where c.oid = 'public.current_p8_historical_universe_member_listing_evidence_v3'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) then
    raise exception 'P8-B2 V3 one or more read views are not security_invoker';
  end if;

  if has_function_privilege(
       'authenticated',
       'public.append_p8_historical_security_identity_v1(jsonb)'::regprocedure,
       'execute'
     )
     or has_function_privilege(
       'authenticated',
       'public.append_p8_historical_source_archive_v1(jsonb)'::regprocedure,
       'execute'
     )
     or has_function_privilege(
       'authenticated',
       'public.append_p8_historical_listing_observation_v3(jsonb)'::regprocedure,
       'execute'
     )
     or has_function_privilege(
       'authenticated',
       'public.append_and_select_p8_historical_universe_v3(jsonb,jsonb,jsonb,jsonb)'::regprocedure,
       'execute'
     )
     or not has_function_privilege(
       'service_role',
       'public.append_p8_historical_security_identity_v1(jsonb)'::regprocedure,
       'execute'
     )
     or not has_function_privilege(
       'service_role',
       'public.append_p8_historical_source_archive_v1(jsonb)'::regprocedure,
       'execute'
     )
     or not has_function_privilege(
       'service_role',
       'public.append_p8_historical_listing_observation_v3(jsonb)'::regprocedure,
       'execute'
     )
     or not has_function_privilege(
       'service_role',
       'public.append_and_select_p8_historical_universe_v3(jsonb,jsonb,jsonb,jsonb)'::regprocedure,
       'execute'
     ) then
    raise exception 'P8-B2 V3 service-only function privilege contract failed';
  end if;
end;
$$;

rollback;
