begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(13);

insert into auth.users (id, instance_id, aud, role, email) values
  ('31111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage5-owner@example.test'),
  ('32222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage5-other@example.test');
insert into public.portfolios (id,user_id,name) values
  ('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','31111111-1111-1111-1111-111111111111','Owner'),
  ('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','32222222-2222-2222-2222-222222222222','Other');
insert into public.brokers (id,name,code) values ('3bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Test Broker','STAGE5');
insert into public.broker_accounts (id,portfolio_id,broker_id,account_name) values
  ('3ccccccc-cccc-cccc-cccc-ccccccccccc1','3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','3bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Owner account'),
  ('3ccccccc-cccc-cccc-cccc-ccccccccccc2','3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','3bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Other account');
insert into public.securities (id,symbol,exchange,isin,name,asset_class,instrument_type)
values ('3ddddddd-dddd-dddd-dddd-ddddddddddd1','STAGE5','NSE','INE555A00001','Stage Five Ltd','EQUITY','STOCK');

select extensions.ok(not pg_catalog.has_function_privilege('anon','public.create_manual_transaction_v1(uuid,uuid,uuid,text,date,numeric,numeric,numeric,text,uuid)','EXECUTE'),'anon cannot execute manual write');
select extensions.ok(pg_catalog.has_function_privilege('authenticated','public.create_manual_transaction_v1(uuid,uuid,uuid,text,date,numeric,numeric,numeric,text,uuid)','EXECUTE'),'authenticated can execute only the RPC');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.transactions','INSERT'),'browser cannot insert transactions directly');

select pg_catalog.set_config('request.jwt.claim.sub','31111111-1111-1111-1111-111111111111',true);
set local role authenticated;
select public.create_manual_transaction_v1('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','3ccccccc-cccc-cccc-cccc-ccccccccccc1','3ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-01',10.125,100.20,12.34,'Exact purchase','30000000-0000-0000-0000-000000000001');
reset role;

select extensions.is((select count(*) from public.transactions where source_type='MANUAL'),1::bigint,'manual BUY is inserted once');
select extensions.is((select quantity from public.transactions where source_type='MANUAL'),10.125::numeric,'quantity persists exactly');
select extensions.is((select unit_price from public.transactions where source_type='MANUAL'),100.20::numeric,'price persists exactly');
select extensions.is((select charges from public.transactions where source_type='MANUAL'),12.34::numeric,'charges persist exactly');
select extensions.is((select source_provider from public.transactions where source_type='MANUAL'),'PORTFOLIOAI','manual provenance is explicit');

set local role authenticated;
select public.create_manual_transaction_v1('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','3ccccccc-cccc-cccc-cccc-ccccccccccc1','3ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-01',10.125,100.20,12.34,'Exact purchase','30000000-0000-0000-0000-000000000001');
reset role;
select extensions.is((select count(*) from public.transactions where source_type='MANUAL'),1::bigint,'identical retry is idempotent');

set local role authenticated;
select extensions.throws_ok($$select public.create_manual_transaction_v1('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','3ccccccc-cccc-cccc-cccc-ccccccccccc2','3ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-02',1,1,0,null,'30000000-0000-0000-0000-000000000002')$$,'42501','Portfolio is unavailable.','caller cannot inject another portfolio');
select extensions.throws_ok($$select public.create_manual_transaction_v1('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','3ccccccc-cccc-cccc-cccc-ccccccccccc2','3ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-02',1,1,0,null,'30000000-0000-0000-0000-000000000003')$$,'22023','Broker account does not belong to the selected portfolio.','account must belong to portfolio');
select extensions.throws_ok($$select public.create_manual_transaction_v1('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','3ccccccc-cccc-cccc-cccc-ccccccccccc1','3ddddddd-dddd-dddd-dddd-ddddddddddd1','SELL','2026-01-03',99,1,0,null,'30000000-0000-0000-0000-000000000004')$$,'23514',null,'oversell is rejected');
select extensions.throws_ok($$select public.create_manual_transaction_v1('3aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','3ccccccc-cccc-cccc-cccc-ccccccccccc1','3ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-03',0,1,0,null,'30000000-0000-0000-0000-000000000005')$$,'22023','Quantity must be greater than zero.','zero quantity is rejected');
reset role;

select * from extensions.finish();
rollback;
