begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(19);

insert into auth.users (id,instance_id,aud,role,email) values
 ('51111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage51-owner@example.test'),
 ('52222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage51-other@example.test');
insert into public.portfolios(id,user_id,name) values
 ('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','51111111-1111-1111-1111-111111111111','Stage 5.1 owner'),
 ('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','52222222-2222-2222-2222-222222222222','Stage 5.1 other');
insert into public.brokers(id,name,code) values ('5bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Stage 5.1 Broker','STAGE51');
insert into public.broker_accounts(id,portfolio_id,broker_id,account_name) values
 ('5ccccccc-cccc-cccc-cccc-ccccccccccc1','5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','5bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Owner'),
 ('5ccccccc-cccc-cccc-cccc-ccccccccccc2','5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','5bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Other');
insert into public.securities(id,symbol,exchange,name,asset_class,instrument_type) values
 ('5ddddddd-dddd-dddd-dddd-ddddddddddd1','BASE51','NSE','Base Stage 5.1','EQUITY','STOCK');

select extensions.ok(not has_table_privilege('authenticated','public.securities','INSERT'),'browser cannot insert securities');
select extensions.ok(not has_table_privilege('authenticated','public.transactions','UPDATE'),'browser cannot update ledger');
select extensions.ok(has_function_privilege('authenticated','public.create_manual_security_v1(uuid,text,text,text,text,text,text,text,uuid)','EXECUTE'),'security RPC is authenticated');
select extensions.ok(has_function_privilege('authenticated','public.correct_transaction_v1(uuid,uuid,uuid,uuid,text,date,numeric,numeric,numeric,text,text,uuid)','EXECUTE'),'correction RPC is authenticated');

select set_config('request.jwt.claim.sub','51111111-1111-1111-1111-111111111111',true);
set local role authenticated;
select public.create_manual_security_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','nse',' new51 ','New Security 51','EQUITY','STOCK',null,'EQ','50000000-0000-0000-0000-000000000001');
select public.create_manual_security_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','NSE','NEW51','New Security 51','EQUITY','STOCK',null,'EQ','50000000-0000-0000-0000-000000000001');
reset role;
select extensions.is((select count(*) from public.securities where symbol='NEW51'),1::bigint,'normalized creation is idempotent');
select extensions.is((select creation_source from public.securities where symbol='NEW51'),'MANUAL_PORTFOLIOAI','security provenance is recorded');
select extensions.is((select mapping_status from public.market_data_instrument_mappings m join public.securities s on s.id=m.security_id where s.symbol='NEW51'),'UNRESOLVED','provider mapping remains unresolved');
set local role authenticated;
select public.create_manual_security_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','NSE','REL51','Valid ISIN Security','EQUITY','STOCK','INE002A01018','EQ','50000000-0000-0000-0000-000000000005');
reset role;
select extensions.is((select isin from public.securities where symbol='REL51'),'INE002A01018','valid ISIN checksum is accepted');
select extensions.throws_ok($$set local role authenticated; select public.create_manual_security_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','BSE','REL52','Duplicate ISIN','EQUITY','STOCK','INE002A01018',null,'50000000-0000-0000-0000-000000000006')$$,'23505',null,'duplicate ISIN is rejected');
select extensions.throws_ok($$set local role authenticated; select public.create_manual_security_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','NSE','NEW51','Duplicate','EQUITY','STOCK',null,'EQ','50000000-0000-0000-0000-000000000002')$$,'23505',null,'duplicate normalized symbol is rejected');
select extensions.throws_ok($$set local role authenticated; select public.create_manual_security_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','NSE','BADISIN','Bad ISIN','EQUITY','STOCK','INE555A00001','EQ','50000000-0000-0000-0000-000000000003')$$,'22023','ISIN is invalid.','invalid ISIN checksum is rejected');
select extensions.throws_ok($$set local role authenticated; select public.create_manual_security_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','NSE','OTHER51','Other','EQUITY','STOCK',null,'EQ','50000000-0000-0000-0000-000000000004')$$,'42501','Portfolio is unavailable.','cross-user creation is rejected');
reset role;

set local role authenticated;
select public.create_manual_transaction_v1('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','5ccccccc-cccc-cccc-cccc-ccccccccccc1','5ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-01',10,100,5,'Original','50000000-0000-0000-0000-000000000010');
reset role;
set local role authenticated;
select public.correct_transaction_v1((select id from public.transactions where notes='Original'),'5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','5ccccccc-cccc-cccc-cccc-ccccccccccc1','5ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-02',12,101,6,'Corrected','Data entry mistake','50000000-0000-0000-0000-000000000011');
select public.correct_transaction_v1((select id from public.transactions where notes='Original'),'5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','5ccccccc-cccc-cccc-cccc-ccccccccccc1','5ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-02',12,101,6,'Corrected','Data entry mistake','50000000-0000-0000-0000-000000000011');
reset role;
select extensions.is((select accounting_status from public.transactions where notes='Original'),'SUPERSEDED','original is retained as superseded');
select extensions.is((select accounting_status from public.transactions where notes='Corrected'),'ACTIVE','correction is effective');
select extensions.is((select quantity from public.transactions where notes='Corrected'),12::numeric,'corrected exact quantity is stored');
select extensions.ok((select corrected_from_transaction_id is not null from public.transactions where notes='Corrected'),'correction lineage is stored');
select extensions.is((select correction_reason from public.transactions where notes='Corrected'),'Data entry mistake','correction reason is stored');
select extensions.is((select count(*) from public.transactions where notes='Corrected'),1::bigint,'correction retry is idempotent');
select extensions.throws_ok($$set local role authenticated; select public.correct_transaction_v1((select id from public.transactions where notes='Corrected'),'5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','5ccccccc-cccc-cccc-cccc-ccccccccccc2','5ddddddd-dddd-dddd-dddd-ddddddddddd1','SELL','2026-01-03',1,1,0,null,'Cross user','50000000-0000-0000-0000-000000000012')$$,'42501','Portfolio is unavailable.','cross-user correction is rejected');
reset role;

select * from extensions.finish();
rollback;
