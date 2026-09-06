begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(33);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other@example.test');

insert into public.portfolios (id, user_id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Owner portfolio'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'Other portfolio');

insert into public.brokers (id, name, code)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Motilal Oswal', 'MOSL');

insert into public.broker_accounts (id, portfolio_id, broker_id, account_name)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Primary'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Other');

insert into public.securities (id, symbol, exchange, isin, name, asset_class, instrument_type)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'ALPHA', 'NSE', 'INE000A00001', 'Alpha Ltd', 'EQUITY', 'STOCK'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'BETA', 'NSE', 'INE000B00002', 'Beta Ltd', 'EQUITY', 'STOCK');

create function pg_temp.make_batch(
  p_batch_id uuid,
  p_portfolio_id uuid default 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
)
returns void
language sql
as $$
  insert into public.import_batches (
    id, portfolio_id, source_type, source_provider, file_format, mapping_version, status
  ) values (
    p_batch_id, p_portfolio_id, 'PORTFOLIO_HISTORICAL_XLSX', 'LEGACY_WORKBOOK',
    'XLSX', 'PORTFOLIOAI_IMPORT_V1', 'AWAITING_CONFIRMATION'
  );
$$;

create function pg_temp.make_row(
  p_row_id uuid,
  p_batch_id uuid,
  p_row_number integer,
  p_side text default 'BUY',
  p_quantity text default '10',
  p_price text default '25.50',
  p_date text default '2026-01-31',
  p_broker text default 'Motilal',
  p_broker_account_id uuid default 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  p_security_id uuid default 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  p_security_method text default 'SYMBOL',
  p_source_isin text default null,
  p_portfolio_id uuid default 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
)
returns void
language plpgsql
as $$
declare
  v_quality text := case
    when p_date is null and p_broker_account_id is null then 'MISSING_DATE_AND_BROKER'
    when p_date is null then 'MISSING_DATE'
    when p_broker_account_id is null then 'MISSING_BROKER'
    else 'COMPLETE'
  end;
begin
  insert into public.import_source_rows (
    id, import_batch_id, portfolio_id, row_number, raw_data, raw_row_hash,
    normalized_data, resolved_security_id, validation_status, validation_errors,
    validation_warnings, duplicate_status
  ) values (
    p_row_id, p_batch_id, p_portfolio_id, p_row_number,
    pg_catalog.jsonb_build_object(
      'original_sheet_name', 'TRANSACTIONS', 'original_row_number', p_row_number,
      'record_kind', 'TRANSACTIONS',
      'cells', pg_catalog.jsonb_build_object(
        'Buy/Sell', pg_catalog.jsonb_build_object('data_type', 'string', 'value', p_side, 'formatted_text', p_side, 'formula', null),
        'Ticker', pg_catalog.jsonb_build_object('data_type', 'string', 'value', 'ALPHA', 'formatted_text', 'ALPHA', 'formula', null),
        'Units', pg_catalog.jsonb_build_object('data_type', 'string', 'value', p_quantity, 'formatted_text', p_quantity, 'formula', null),
        'Price/Unit', pg_catalog.jsonb_build_object('data_type', 'string', 'value', p_price, 'formatted_text', p_price, 'formula', null),
        'Date', pg_catalog.jsonb_build_object('data_type', case when p_date is null then 'blank' else 'string' end, 'value', p_date, 'formatted_text', p_date, 'formula', null),
        'Broker', pg_catalog.jsonb_build_object('data_type', case when p_broker is null then 'blank' else 'string' end, 'value', p_broker, 'formatted_text', p_broker, 'formula', null)
      )
    ),
    pg_catalog.repeat(pg_catalog.substr(pg_catalog.md5(p_row_id::text), 1, 1), 64),
    pg_catalog.jsonb_build_object(
      'record_kind', 'TRANSACTION', 'transaction_type', p_side,
      'transaction_date', p_date, 'broker_account_id', p_broker_account_id,
      'security_id', p_security_id, 'source_ticker', 'ALPHA',
      'source_company', 'Alpha Ltd', 'source_broker', p_broker,
      'quantity', p_quantity, 'unit_price', p_price,
      'data_quality_status', v_quality, 'security_resolution_method', p_security_method,
      'source_isin', p_source_isin
    ),
    p_security_id, 'VALID', '[]'::jsonb, '[]'::jsonb, 'NOT_DUPLICATE'
  );
end;
$$;

create function pg_temp.make_stock_master_row(
  p_row_id uuid,
  p_batch_id uuid,
  p_row_number integer,
  p_ticker text,
  p_isin text
)
returns void
language sql
as $$
  insert into public.import_source_rows (
    id, import_batch_id, portfolio_id, row_number, raw_data, raw_row_hash,
    validation_status, validation_errors, validation_warnings
  ) values (
    p_row_id, p_batch_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p_row_number,
    pg_catalog.jsonb_build_object(
      'record_kind', 'STOCK_MASTER',
      'cells', pg_catalog.jsonb_build_object(
        'Ticker', pg_catalog.jsonb_build_object('data_type', 'string', 'value', p_ticker, 'formatted_text', p_ticker, 'formula', null),
        'ISIN', pg_catalog.jsonb_build_object('data_type', 'string', 'value', p_isin, 'formatted_text', p_isin, 'formula', null)
      )
    ),
    pg_catalog.repeat(pg_catalog.substr(pg_catalog.md5(p_row_id::text), 1, 1), 64),
    'IGNORED', '[]'::jsonb, '[]'::jsonb
  );
$$;

select pg_temp.make_batch('20000000-0000-0000-0000-000000000001');
select pg_temp.make_row('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1);
select pg_temp.make_row('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 2, p_side => 'SELL');
select pg_temp.make_row('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 3, p_date => null);
select pg_temp.make_row('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 4, p_broker => null, p_broker_account_id => null);
select pg_temp.make_row('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 5, p_date => null, p_broker => null, p_broker_account_id => null);

select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select public.commit_import_batch_v1(
  '20000000-0000-0000-0000-000000000001',
  array[
    '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000005'
  ]::uuid[]
);
reset role;

select extensions.is((select count(*) from public.transactions where import_batch_id = '20000000-0000-0000-0000-000000000001'), 5::bigint, 'owner commits all five approved rows');
select extensions.is((select count(*) from public.transactions where transaction_type = 'BUY' and import_batch_id = '20000000-0000-0000-0000-000000000001'), 4::bigint, 'BUY maps exactly');
select extensions.is((select count(*) from public.transactions where transaction_type = 'SELL' and import_batch_id = '20000000-0000-0000-0000-000000000001'), 1::bigint, 'SELL maps exactly');
select extensions.is((select count(*) from public.transactions where transaction_date is null and import_batch_id = '20000000-0000-0000-0000-000000000001'), 2::bigint, 'NULL dates remain NULL');
select extensions.is((select count(*) from public.transactions where broker_account_id is null and import_batch_id = '20000000-0000-0000-0000-000000000001'), 2::bigint, 'NULL broker accounts remain NULL');
select extensions.is((select count(*) from public.transactions where transaction_date is null and broker_account_id is null and import_batch_id = '20000000-0000-0000-0000-000000000001'), 1::bigint, 'both nullable fields remain NULL together');
select extensions.is((select status from public.import_batches where id = '20000000-0000-0000-0000-000000000001'), 'COMMITTED', 'successful batch is committed');
select extensions.ok((select confirmed_at = committed_at and committed_at is not null from public.import_batches where id = '20000000-0000-0000-0000-000000000001'), 'confirmation and commit timestamps are atomic');

select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select public.commit_import_batch_v1(
  '20000000-0000-0000-0000-000000000001',
  array[
    '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000005'
  ]::uuid[]
);
reset role;
select extensions.is((select count(*) from public.transactions where import_batch_id = '20000000-0000-0000-0000-000000000001'), 5::bigint, 'retry is idempotent');

select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000001', array['10000000-0000-0000-0000-000000000001']::uuid[])$$,
  '22023', 'committed batch row selection does not match this retry', 'retry cannot substitute the committed source-row selection'
);
reset role;

select extensions.ok(not pg_catalog.has_function_privilege('anon', 'public.commit_import_batch_v1(uuid,uuid[])', 'EXECUTE'), 'anon cannot execute commit RPC');
select extensions.ok(not pg_catalog.has_function_privilege('service_role', 'public.commit_import_batch_v1(uuid,uuid[])', 'EXECUTE'), 'service role has no RPC execute grant');
select extensions.ok(pg_catalog.has_function_privilege('authenticated', 'public.commit_import_batch_v1(uuid,uuid[])', 'EXECUTE'), 'authenticated role can execute commit RPC');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated', 'public.transactions', 'INSERT'), 'browser cannot directly insert transactions');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated', 'public.transactions', 'UPDATE'), 'browser cannot directly update transactions');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated', 'public.transactions', 'DELETE'), 'browser cannot directly delete transactions');

select pg_temp.make_batch('20000000-0000-0000-0000-000000000002');
select pg_temp.make_row('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 1);
select pg_catalog.set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000002', array['10000000-0000-0000-0000-000000000006']::uuid[])$$,
  '42501', 'import batch not found or not owned by caller', 'different user cannot commit owner batch'
);
reset role;

select pg_temp.make_batch('20000000-0000-0000-0000-000000000003');
select pg_temp.make_row('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', 1, p_quantity => '0');
select pg_temp.make_row('10000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 2);
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000003', array['10000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000008']::uuid[])$$,
  '22023', 'source row 10000000-0000-0000-0000-000000000007 quantity is invalid or changed', 'invalid quantity rejects commit'
);
reset role;
select extensions.is((select count(*) from public.transactions where import_batch_id = '20000000-0000-0000-0000-000000000003'), 0::bigint, 'partial failure rolls back all ledger inserts');
select extensions.is((select status from public.import_batches where id = '20000000-0000-0000-0000-000000000003'), 'AWAITING_CONFIRMATION', 'partial failure leaves batch uncommitted');

select pg_temp.make_batch('20000000-0000-0000-0000-000000000008');
select pg_temp.make_row('10000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000008', 1, p_price => '-0.01');
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000008', array['10000000-0000-0000-0000-000000000013']::uuid[])$$,
  '22023', 'source row 10000000-0000-0000-0000-000000000013 price is outside non-negative numeric(38,18)', 'invalid supplied price rejects commit'
);
reset role;

select pg_temp.make_batch('20000000-0000-0000-0000-000000000004');
select pg_temp.make_row('10000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004', 1, p_security_id => 'dddddddd-dddd-dddd-dddd-ddddddddddd2');
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000004', array['10000000-0000-0000-0000-000000000009']::uuid[])$$,
  '22023', 'source row 10000000-0000-0000-0000-000000000009 security does not match trusted reference evidence', 'client cannot substitute a security'
);
reset role;

select pg_temp.make_batch('20000000-0000-0000-0000-000000000005');
select pg_temp.make_row('10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000005', 1, p_broker_account_id => 'cccccccc-cccc-cccc-cccc-ccccccccccc2');
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000005', array['10000000-0000-0000-0000-000000000010']::uuid[])$$,
  '22023', 'source row 10000000-0000-0000-0000-000000000010 broker account does not match this portfolio and source evidence', 'cross-portfolio broker account is rejected'
);
reset role;

select pg_temp.make_batch('20000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');
select pg_temp.make_row('10000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000006', 1, p_broker_account_id => 'cccccccc-cccc-cccc-cccc-ccccccccccc2', p_portfolio_id => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000002', array['10000000-0000-0000-0000-000000000011']::uuid[])$$,
  '22023', 'one or more approved source rows do not belong to this batch and portfolio', 'cross-portfolio source row is rejected'
);
reset role;

select extensions.throws_ok(
  $$update public.import_source_rows set validation_warnings = '["changed"]' where id = '10000000-0000-0000-0000-000000000001'$$,
  'P0001', 'committed import source rows are immutable', 'committed source evidence remains immutable'
);
select extensions.throws_ok(
  $$update public.import_batches set status = 'FAILED' where id = '20000000-0000-0000-0000-000000000001'$$,
  'P0001', 'committed import batches are immutable', 'committed batch remains immutable'
);

select pg_catalog.set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select extensions.is((select count(*) from public.transactions), 0::bigint, 'RLS hides owner transactions from another user');
reset role;
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.is((select count(*) from public.transactions), 5::bigint, 'RLS exposes owner transactions to owner');
reset role;

select extensions.is((select count(*) from public.transactions where import_source_row_id = '10000000-0000-0000-0000-000000000001'), 1::bigint, 'one source row creates at most one V1 transaction');
select extensions.ok((select count(*) = count(distinct import_source_row_id) from public.transactions where import_batch_id = '20000000-0000-0000-0000-000000000001'), 'committed lineage is unique');

select pg_temp.make_batch('20000000-0000-0000-0000-000000000009');
select pg_temp.make_row(
  '10000000-0000-0000-0000-000000000014',
  '20000000-0000-0000-0000-000000000009',
  1,
  p_security_method => 'ISIN',
  p_source_isin => 'INE000A00001'
);
select pg_temp.make_stock_master_row(
  '10000000-0000-0000-0000-000000000015',
  '20000000-0000-0000-0000-000000000009',
  2,
  'ALPHA',
  'INE000A00001'
);
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select public.commit_import_batch_v1(
  '20000000-0000-0000-0000-000000000009',
  array['10000000-0000-0000-0000-000000000014']::uuid[]
);
reset role;
select extensions.is(
  (select count(*) from public.transactions where import_batch_id = '20000000-0000-0000-0000-000000000009'),
  1::bigint,
  'cached stock-master identity evidence accepts an exact ticker and ISIN pair'
);
select extensions.is(
  (select status from public.import_batches where id = '20000000-0000-0000-0000-000000000009'),
  'COMMITTED',
  'ISIN-validated commit remains atomic'
);

select pg_temp.make_batch('20000000-0000-0000-0000-000000000010');
select pg_temp.make_row(
  '10000000-0000-0000-0000-000000000016',
  '20000000-0000-0000-0000-000000000010',
  1,
  p_security_method => 'ISIN',
  p_source_isin => 'INE000A00001'
);
select pg_temp.make_stock_master_row(
  '10000000-0000-0000-0000-000000000017',
  '20000000-0000-0000-0000-000000000010',
  2,
  'BETA',
  'INE000A00001'
);
select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.commit_import_batch_v1('20000000-0000-0000-0000-000000000010', array['10000000-0000-0000-0000-000000000016']::uuid[])$$,
  '22023',
  'source row 10000000-0000-0000-0000-000000000016 security does not match trusted reference evidence',
  'cached stock-master evidence cannot validate a different ticker'
);
reset role;

select * from extensions.finish();
rollback;
