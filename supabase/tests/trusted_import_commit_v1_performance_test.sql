\timing on
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, instance_id, aud, role, email)
values ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'performance@example.test');

insert into public.portfolios (id, user_id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '33333333-3333-3333-3333-333333333333',
        '477-row performance portfolio');

insert into public.brokers (id, name, code)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Motilal Oswal', 'MOSLPERF');

insert into public.broker_accounts (id, portfolio_id, broker_id, account_name)
values ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Motilal Oswal');

insert into public.securities (id, symbol, exchange, isin, name, asset_class, instrument_type)
select ('dddddddd-dddd-dddd-dddd-' || pg_catalog.lpad(i::text, 12, '0'))::uuid,
       'SEC' || pg_catalog.lpad(i::text, 3, '0'),
       'NSE',
       'IN' || pg_catalog.lpad(i::text, 9, '0') || (i % 10)::text,
       'Performance Security ' || i,
       'EQUITY',
       'STOCK'
from pg_catalog.generate_series(1, 270) as generated(i);

insert into public.import_batches (
  id, portfolio_id, source_type, source_provider, file_format, mapping_version, status,
  total_row_count, valid_row_count, invalid_row_count, ambiguous_row_count
) values (
  '30000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  'PORTFOLIO_HISTORICAL_XLSX', 'LEGACY_WORKBOOK', 'XLSX', 'PORTFOLIOAI_IMPORT_V1',
  'AWAITING_CONFIRMATION', 1076, 477, 0, 0
);

-- Match the real workbook's 599 stock-master evidence rows. Repeated entries are
-- intentional: the trusted check only requires the exact ticker/ISIN pair to exist.
insert into public.import_source_rows (
  id, import_batch_id, portfolio_id, row_number, raw_data, raw_row_hash,
  normalized_data, validation_status, validation_errors, validation_warnings
)
select ('20000000-0000-0000-0000-' || pg_catalog.lpad(i::text, 12, '0'))::uuid,
       '30000000-0000-0000-0000-000000000001',
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
       477 + i,
       pg_catalog.jsonb_build_object(
         'record_kind', 'STOCK_MASTER',
         'cells', pg_catalog.jsonb_build_object(
           'Ticker', pg_catalog.jsonb_build_object(
             'data_type', 'string', 'value', 'SEC' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 3, '0'),
             'formatted_text', 'SEC' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 3, '0'), 'formula', null
           ),
           'ISIN', pg_catalog.jsonb_build_object(
             'data_type', 'string',
             'value', 'IN' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 9, '0') || (((i - 1) % 270) + 1) % 10,
             'formatted_text', 'IN' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 9, '0') || (((i - 1) % 270) + 1) % 10,
             'formula', null
           )
         )
       ),
       pg_catalog.repeat(pg_catalog.substr(pg_catalog.md5(('master-' || i)::text), 1, 1), 64),
       null,
       'IGNORED',
       '[]'::jsonb,
       '[]'::jsonb
from pg_catalog.generate_series(1, 599) as generated(i);

-- Match the real transaction-row volume, security cardinality, and NULL counts.
insert into public.import_source_rows (
  id, import_batch_id, portfolio_id, row_number, raw_data, raw_row_hash,
  normalized_data, resolved_security_id, validation_status, validation_errors,
  validation_warnings, duplicate_status
)
select ('10000000-0000-0000-0000-' || pg_catalog.lpad(i::text, 12, '0'))::uuid,
       '30000000-0000-0000-0000-000000000001',
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
       i,
       pg_catalog.jsonb_build_object(
         'record_kind', 'TRANSACTIONS',
         'cells', pg_catalog.jsonb_build_object(
           'Buy/Sell', pg_catalog.jsonb_build_object('data_type', 'string', 'value', case when i <= 419 then 'BUY' else 'SELL' end, 'formatted_text', case when i <= 419 then 'BUY' else 'SELL' end, 'formula', null),
           'Ticker', pg_catalog.jsonb_build_object('data_type', 'string', 'value', 'SEC' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 3, '0'), 'formatted_text', 'SEC' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 3, '0'), 'formula', null),
           'Units', pg_catalog.jsonb_build_object('data_type', 'string', 'value', '10.125', 'formatted_text', '10.125', 'formula', null),
           'Price/Unit', pg_catalog.jsonb_build_object('data_type', 'string', 'value', '25.50', 'formatted_text', '25.50', 'formula', null),
           'Date', pg_catalog.jsonb_build_object('data_type', case when i <= 296 then 'blank' else 'string' end, 'value', case when i <= 296 then null else '2026-01-31' end, 'formatted_text', case when i <= 296 then null else '2026-01-31' end, 'formula', null),
           'Broker', pg_catalog.jsonb_build_object('data_type', case when i <= 113 then 'blank' else 'string' end, 'value', case when i <= 113 then null else 'Motilal Oswal' end, 'formatted_text', case when i <= 113 then null else 'Motilal Oswal' end, 'formula', null)
         )
       ),
       pg_catalog.repeat(pg_catalog.substr(pg_catalog.md5(('transaction-' || i)::text), 1, 1), 64),
       pg_catalog.jsonb_build_object(
         'record_kind', 'TRANSACTION',
         'transaction_type', case when i <= 419 then 'BUY' else 'SELL' end,
         'transaction_date', case when i <= 296 then null else '2026-01-31' end,
         'broker_account_id', case when i <= 113 then null else 'cccccccc-cccc-cccc-cccc-ccccccccccc3' end,
         'security_id', ('dddddddd-dddd-dddd-dddd-' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 12, '0'))::uuid,
         'source_ticker', 'SEC' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 3, '0'),
         'source_company', 'Performance Security ' || (((i - 1) % 270) + 1),
         'source_broker', case when i <= 113 then null else 'Motilal Oswal' end,
         'quantity', '10.125',
         'unit_price', '25.50',
         'data_quality_status', case
           when i <= 113 then 'MISSING_DATE_AND_BROKER'
           when i <= 296 then 'MISSING_DATE'
           else 'COMPLETE'
         end,
         'security_resolution_method', 'ISIN',
         'source_isin', 'IN' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 9, '0') || (((i - 1) % 270) + 1) % 10
       ),
       ('dddddddd-dddd-dddd-dddd-' || pg_catalog.lpad((((i - 1) % 270) + 1)::text, 12, '0'))::uuid,
       'VALID',
       '[]'::jsonb,
       '[]'::jsonb,
       'NOT_DUPLICATE'
from pg_catalog.generate_series(1, 477) as generated(i);

\if :{?PROFILE}
\echo 'Former correlated STOCK_MASTER validation path'
explain (analyze, buffers)
select count(*)
from public.import_source_rows as transaction_row
where transaction_row.import_batch_id = '30000000-0000-0000-0000-000000000001'
  and transaction_row.normalized_data ->> 'record_kind' = 'TRANSACTION'
  and exists (
    select 1
    from public.import_source_rows as master_row
    where master_row.import_batch_id = transaction_row.import_batch_id
      and master_row.raw_data ->> 'record_kind' = 'STOCK_MASTER'
      and pg_catalog.upper(pg_catalog.btrim(public.portfolioai_import_cell_text(
        public.portfolioai_import_cell(master_row.raw_data, array['TICKER', 'SYMBOL', 'STOCK', 'SCRIP'])
      ))) = pg_catalog.upper(pg_catalog.btrim(transaction_row.normalized_data ->> 'source_ticker'))
      and pg_catalog.upper(pg_catalog.btrim(public.portfolioai_import_cell_text(
        public.portfolioai_import_cell(master_row.raw_data, array['ISIN', 'ISINCODE'])
      ))) = pg_catalog.upper(pg_catalog.btrim(transaction_row.normalized_data ->> 'source_isin'))
  );

\echo 'One-time STOCK_MASTER identity cache path'
explain (analyze, buffers)
select pg_catalog.array_agg(distinct (
  pg_catalog.upper(pg_catalog.btrim(public.portfolioai_import_cell_text(public.portfolioai_import_cell(
    master_row.raw_data, array['TICKER', 'SYMBOL', 'STOCK', 'SCRIP']
  )))) || pg_catalog.chr(31) ||
  pg_catalog.upper(pg_catalog.btrim(public.portfolioai_import_cell_text(public.portfolioai_import_cell(
    master_row.raw_data, array['ISIN', 'ISINCODE']
  ))))
))
from public.import_source_rows as master_row
where master_row.import_batch_id = '30000000-0000-0000-0000-000000000001'
  and master_row.raw_data ->> 'record_kind' = 'STOCK_MASTER';
\endif

select pg_catalog.set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;

\echo '477-row trusted commit benchmark'
select (public.commit_import_batch_v1(
  '30000000-0000-0000-0000-000000000001',
  pg_catalog.array_agg(id order by row_number)
))->>'transaction_count' as transaction_count
from public.import_source_rows
where import_batch_id = '30000000-0000-0000-0000-000000000001'
  and normalized_data ->> 'record_kind' = 'TRANSACTION';

reset role;

select count(*) as committed_transactions
from public.transactions
where import_batch_id = '30000000-0000-0000-0000-000000000001';

rollback;
