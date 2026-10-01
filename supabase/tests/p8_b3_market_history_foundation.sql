begin;

do $$
declare
  v_user_id constant uuid := '8b230000-0000-4000-8000-000000000001';
  v_portfolio_id constant uuid := '8b230000-0000-4000-8000-000000000002';
  v_security_id constant uuid := '8b230000-0000-4000-8000-000000000003';

  v_identity_id uuid;
  v_price_archive_id uuid := gen_random_uuid();
  v_price_row_id uuid := gen_random_uuid();
  v_action_archive_id uuid := gen_random_uuid();
  v_action_id uuid := gen_random_uuid();
  v_normalization_id uuid := gen_random_uuid();
  v_factor_id uuid := gen_random_uuid();
  v_adjusted_id uuid := gen_random_uuid();
  v_benchmark_archive_id uuid := gen_random_uuid();
  v_benchmark_row_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email)
  values (v_user_id, 'p8-b3-test@example.invalid');

  insert into public.portfolios (id, user_id, name, base_currency, is_active)
  values (v_portfolio_id, v_user_id, 'P8 B3 Test Portfolio', 'INR', true);

  insert into public.securities (
    id, symbol, exchange, isin, name, asset_class, instrument_type,
    currency, is_active, creation_source, series
  ) values (
    v_security_id,
    'P8B3TEST',
    'NSE',
    'INE123A01011',
    'P8 B3 Test Equity',
    'EQUITY',
    'COMMON_STOCK',
    'INR',
    true,
    'P8_B3_TEST',
    'EQ'
  );

  v_identity_id := public.append_p8_historical_security_identity_v1(
    jsonb_build_object(
      'portfolio_id', v_portfolio_id,
      'experiment_id', 'P8_EXP_NSE_MONTHLY_6M_V1',
      'historical_isin', 'INE123A01011',
      'issuer_type', 'E',
      'security_type_code', '01',
      'canonical_security_id', v_security_id,
      'canonical_link_basis', 'EXACT_ISIN',
      'canonical_link_symbol', null,
      'link_evidence', jsonb_build_object('fixture',true),
      'identity_hash', repeat('a',64),
      'created_by', v_user_id
    )
  );

  insert into public.p8_b3_source_archives (
    id, portfolio_id, experiment_id, source_kind,
    source_period_start, source_period_end,
    source_url, source_file_name,
    content_sha256, compressed_sha256,
    source_published_at, retrieved_at,
    source_contract_version, archive_hash, raw_metadata, created_by
  ) values (
    v_price_archive_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    'NSE_CM_BHAVCOPY_LEGACY',
    '2024-03-14',
    '2024-03-14',
    'https://www.nseindia.com/all-reports',
    'cm14MAR2024bhav.csv.zip',
    repeat('1',64),
    repeat('2',64),
    null,
    '2026-10-01T00:00:00Z',
    'P8_B3_NSE_BHAVCOPY_V1',
    repeat('3',64),
    jsonb_build_object('fixture',true),
    v_user_id
  );

  insert into public.p8_b3_raw_market_price_observations (
    id, portfolio_id, experiment_id, historical_identity_id,
    source_archive_id, trade_date, exchange, trading_symbol, series,
    source_format, previous_close, open, high, low, close, last_price,
    volume, traded_value, trade_count, row_hash, raw_metadata
  ) values (
    v_price_row_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    v_identity_id,
    v_price_archive_id,
    '2024-03-14',
    'NSE',
    'P8B3TEST',
    'EQ',
    'LEGACY_BHAVCOPY',
    100,
    101,
    105,
    99,
    102,
    102,
    1000,
    102000,
    100,
    repeat('4',64),
    jsonb_build_object('fixture',true)
  );

  insert into public.p8_b3_source_archives (
    id, portfolio_id, experiment_id, source_kind,
    source_period_start, source_period_end,
    source_url, source_file_name,
    content_sha256, compressed_sha256,
    source_published_at, retrieved_at,
    source_contract_version, archive_hash, raw_metadata, created_by
  ) values (
    v_action_archive_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    'NSE_CORPORATE_ACTIONS',
    '2024-03-01',
    '2024-03-31',
    'https://www.nseindia.com/companies-listing/corporate-filings-actions',
    'fixture-corporate-actions.csv',
    repeat('5',64),
    null,
    null,
    '2026-10-01T00:00:00Z',
    'P8_B3_NSE_CORPORATE_ACTIONS_V1',
    repeat('6',64),
    jsonb_build_object('fixture',true),
    v_user_id
  );

  insert into public.p8_b3_corporate_action_observations (
    id, portfolio_id, experiment_id, source_archive_id,
    historical_identity_id, identity_resolution_state,
    raw_symbol, raw_company_name, raw_series, raw_purpose,
    face_value, ex_date, record_date,
    observation_hash, raw_metadata
  ) values (
    v_action_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    v_action_archive_id,
    v_identity_id,
    'RESOLVED',
    'P8B3TEST',
    'P8 B3 Test Equity',
    'EQ',
    'Face Value Split (Sub-Division) - From Rs 10/- Per Share To Rs 2/- Per Share',
    2,
    '2024-03-15',
    '2024-03-15',
    repeat('7',64),
    jsonb_build_object('fixture',true)
  );

  insert into public.p8_b3_corporate_action_normalizations (
    id, portfolio_id, experiment_id,
    corporate_action_observation_id, historical_identity_id,
    normalization_version, action_type, normalization_state,
    effective_date, normalized_terms, blocker_reason, normalization_hash
  ) values (
    v_normalization_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    v_action_id,
    v_identity_id,
    'P8_B3_ACTION_NORMALIZATION_V1',
    'SPLIT',
    'READY',
    '2024-03-15',
    jsonb_build_object('old_face_value',10,'new_face_value',2),
    null,
    repeat('8',64)
  );

  insert into public.p8_b3_adjustment_factors (
    id, portfolio_id, experiment_id, historical_identity_id,
    corporate_action_normalization_id, effective_date,
    adjustment_version, factor_state,
    share_factor, price_back_adjustment_factor,
    cash_distribution_per_share, total_return_link_factor,
    reference_price, blocker_reason, calculation_inputs, factor_hash
  ) values (
    v_factor_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    v_identity_id,
    v_normalization_id,
    '2024-03-15',
    'P8_B3_ADJUSTMENT_V1',
    'READY',
    5,
    0.2,
    null,
    null,
    null,
    null,
    jsonb_build_object('old_face_value',10,'new_face_value',2),
    repeat('9',64)
  );

  insert into public.p8_b3_adjusted_market_price_series (
    id, portfolio_id, experiment_id, historical_identity_id,
    raw_price_observation_id, trade_date, adjustment_version,
    series_state, cumulative_price_factor,
    adjusted_open, adjusted_high, adjusted_low, adjusted_close,
    daily_price_return, daily_total_return, total_return_index,
    blocker_reason, lineage, series_hash
  ) values (
    v_adjusted_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    v_identity_id,
    v_price_row_id,
    '2024-03-14',
    'P8_B3_ADJUSTMENT_V1',
    'READY',
    0.2,
    20.2,
    21,
    19.8,
    20.4,
    null,
    null,
    null,
    null,
    jsonb_build_object('factor_id',v_factor_id),
    repeat('b',64)
  );

  insert into public.p8_b3_source_archives (
    id, portfolio_id, experiment_id, source_kind,
    source_period_start, source_period_end,
    source_url, source_file_name,
    content_sha256, compressed_sha256,
    source_published_at, retrieved_at,
    source_contract_version, archive_hash, raw_metadata, created_by
  ) values (
    v_benchmark_archive_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    'NSE_INDICES_NIFTY500_TRI',
    '2024-03-01',
    '2024-03-31',
    'https://www.niftyindices.com/reports/historical-data',
    'fixture-nifty500-tri.csv',
    repeat('c',64),
    null,
    null,
    '2026-10-01T00:00:00Z',
    'P8_NIFTY500_TRI_V1',
    repeat('d',64),
    jsonb_build_object('fixture',true),
    v_user_id
  );

  insert into public.p8_b3_benchmark_total_return_history (
    id, portfolio_id, experiment_id, source_archive_id,
    benchmark_version, benchmark_code, trade_date,
    total_return_index, net_total_return_index,
    row_hash, raw_metadata
  ) values (
    v_benchmark_row_id,
    v_portfolio_id,
    'P8_EXP_NSE_MONTHLY_6M_V1',
    v_benchmark_archive_id,
    'P8_NIFTY500_TRI_V1',
    'NIFTY_500',
    '2024-03-14',
    25000,
    null,
    repeat('e',64),
    jsonb_build_object('fixture',true)
  );

  if (select count(*) from public.current_p8_b3_market_coverage_v1
      where portfolio_id = v_portfolio_id
        and historical_identity_id = v_identity_id) <> 1 then
    raise exception 'P8-B3 market coverage view failed';
  end if;

  begin
    insert into public.p8_b3_corporate_action_normalizations (
      portfolio_id, experiment_id, corporate_action_observation_id,
      historical_identity_id, normalization_version, action_type,
      normalization_state, effective_date, normalized_terms,
      blocker_reason, normalization_hash
    ) values (
      v_portfolio_id,
      'P8_EXP_NSE_MONTHLY_6M_V1',
      v_action_id,
      v_identity_id,
      'P8_B3_ACTION_NORMALIZATION_V1',
      'OTHER',
      'READY',
      '2024-03-15',
      jsonb_build_object('invented',true),
      null,
      repeat('f',64)
    );
    raise exception 'P8-B3 accepted OTHER as READY normalization';
  exception when check_violation then null;
  end;

  begin
    insert into public.p8_b3_corporate_action_normalizations (
      portfolio_id, experiment_id, corporate_action_observation_id,
      historical_identity_id, normalization_version, action_type,
      normalization_state, effective_date, normalized_terms,
      blocker_reason, normalization_hash
    ) values (
      v_portfolio_id,
      'P8_EXP_NSE_MONTHLY_6M_V1',
      v_action_id,
      null,
      'P8_B3_ACTION_NORMALIZATION_V1',
      'DEMERGER',
      'BLOCKED',
      null,
      '{}'::jsonb,
      null,
      repeat('0',64)
    );
    raise exception 'P8-B3 accepted BLOCKED normalization without a reason';
  exception when check_violation then null;
  end;

  begin
    update public.p8_b3_raw_market_price_observations
    set close = 999
    where id = v_price_row_id;
    raise exception 'P8-B3 raw market evidence accepted mutation';
  exception when sqlstate '55000' then null;
  end;

  begin
    update public.p8_b3_corporate_action_observations
    set raw_purpose = 'mutated'
    where id = v_action_id;
    raise exception 'P8-B3 corporate-action evidence accepted mutation';
  exception when sqlstate '55000' then null;
  end;

  begin
    update public.p8_b3_adjustment_factors
    set price_back_adjustment_factor = 0.5
    where id = v_factor_id;
    raise exception 'P8-B3 derived adjustment accepted mutation';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'p8_b3_source_archives',
    'p8_b3_raw_market_price_observations',
    'p8_b3_corporate_action_observations',
    'p8_b3_corporate_action_normalizations',
    'p8_b3_adjustment_factors',
    'p8_b3_adjusted_market_price_series',
    'p8_b3_benchmark_total_return_history'
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
      raise exception 'P8-B3 RLS is not enabled on %', v_table;
    end if;

    if has_table_privilege('anon', format('public.%I',v_table), 'select')
       or has_table_privilege('anon', format('public.%I',v_table), 'insert')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'insert')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'update')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'delete')
       or not has_table_privilege('authenticated', format('public.%I',v_table), 'select')
       or not has_table_privilege('service_role', format('public.%I',v_table), 'select') then
      raise exception 'P8-B3 privilege contract failed on %', v_table;
    end if;
  end loop;

  if exists (
    select 1 from pg_class c
    where c.oid = 'public.current_p8_b3_market_coverage_v1'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) or exists (
    select 1 from pg_class c
    where c.oid = 'public.current_p8_b3_corporate_action_coverage_v1'::regclass
      and not ('security_invoker=true' = any(c.reloptions))
  ) then
    raise exception 'P8-B3 read views are not security_invoker';
  end if;
end;
$$;

rollback;
