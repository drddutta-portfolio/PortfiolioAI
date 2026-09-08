begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(25);

insert into auth.users(id,instance_id,aud,role,email) values
('71111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage6c-owner@example.test'),
('72222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage6c-other@example.test');
insert into public.portfolios(id,user_id,name) values
('7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','71111111-1111-1111-1111-111111111111','Stage 6 completion owner'),
('7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','72222222-2222-2222-2222-222222222222','Stage 6 completion other');
insert into public.brokers(id,name,code) values('7bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Stage 6 Completion Broker','STAGE6C');
insert into public.broker_accounts(id,portfolio_id,broker_id,account_name) values
('7ccccccc-cccc-cccc-cccc-ccccccccccc1','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','7bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Owner');
insert into public.securities(id,symbol,exchange,name,asset_class,instrument_type) values
('7ddddddd-dddd-dddd-dddd-ddddddddddd1','VOID6','NSE','Void Test','EQUITY','STOCK'),
('7ddddddd-dddd-dddd-dddd-ddddddddddd2','CLASS6','NSE','Classification Test','ETF','ETF');
insert into public.transactions(id,portfolio_id,broker_account_id,security_id,transaction_type,transaction_date,quantity,unit_price,data_quality_status,source_type) values
('70000000-0000-0000-0000-000000000001','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','7ccccccc-cccc-cccc-cccc-ccccccccccc1','7ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-01',10,100,'COMPLETE','MANUAL'),
('70000000-0000-0000-0000-000000000002','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','7ccccccc-cccc-cccc-cccc-ccccccccccc1','7ddddddd-dddd-dddd-dddd-ddddddddddd1','SELL','2026-02-01',4,120,'COMPLETE','MANUAL'),
('70000000-0000-0000-0000-000000000003','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','7ccccccc-cccc-cccc-cccc-ccccccccccc1','7ddddddd-dddd-dddd-dddd-ddddddddddd2','BUY','2026-01-01',2,50,'COMPLETE','MANUAL');

select extensions.ok(not has_table_privilege('authenticated','public.transactions','UPDATE'),'browser still cannot update transactions');
select extensions.ok(not has_table_privilege('authenticated','public.transaction_accounting_events','INSERT'),'browser cannot forge accounting events');
select extensions.ok(has_function_privilege('authenticated','public.void_transaction_v1(uuid,uuid,text,uuid)','EXECUTE'),'authenticated can invoke trusted void RPC');
select extensions.ok(has_function_privilege('authenticated','public.restore_transaction_v1(uuid,uuid,text,uuid)','EXECUTE'),'authenticated can invoke trusted restore RPC');
select extensions.ok(not has_function_privilege('authenticated','public.apply_security_classification_correction_v1(uuid,uuid,text)','EXECUTE'),'browser cannot apply canonical classification changes');

select set_config('request.jwt.claim.sub','71111111-1111-1111-1111-111111111111',true);
set local role authenticated;
select extensions.throws_ok($$select public.void_transaction_v1('70000000-0000-0000-0000-000000000001','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Remove acquisition','70000000-0000-0000-0000-000000000011')$$,'23514',null,'voiding a required buy is rejected as oversold');
select public.void_transaction_v1('70000000-0000-0000-0000-000000000002','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Sell entered by mistake','70000000-0000-0000-0000-000000000012');
select public.void_transaction_v1('70000000-0000-0000-0000-000000000002','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Sell entered by mistake','70000000-0000-0000-0000-000000000012');
reset role;
select extensions.is((select accounting_status from public.transactions where id='70000000-0000-0000-0000-000000000002'),'REVERSED','void moves original to REVERSED');
select extensions.is((select current_quantity from public.current_holdings where security_id='7ddddddd-dddd-dddd-dddd-ddddddddddd1'),10::numeric,'holdings rebuild from remaining ACTIVE ledger');
select extensions.is((select count(*) from public.transaction_accounting_events where transaction_id='70000000-0000-0000-0000-000000000002'),1::bigint,'legitimate controlled VOID audit-event INSERT succeeds and retry is idempotent');
select extensions.is((select reason from public.transaction_accounting_events where transaction_id='70000000-0000-0000-0000-000000000002'),'Sell entered by mistake','void reason is audited');
set local role authenticated;
select public.restore_transaction_v1('70000000-0000-0000-0000-000000000002','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Transaction verified as valid','70000000-0000-0000-0000-000000000013');
reset role;
select extensions.is((select accounting_status from public.transactions where id='70000000-0000-0000-0000-000000000002'),'ACTIVE','restore returns transaction to ACTIVE');
select extensions.is((select current_quantity from public.current_holdings where security_id='7ddddddd-dddd-dddd-dddd-ddddddddddd1'),6::numeric,'restored ledger recalculates holdings');
select extensions.is((select count(*) from public.transaction_accounting_events where transaction_id='70000000-0000-0000-0000-000000000002'),2::bigint,'void history remains after restore');

set local role authenticated;
insert into public.security_classification_correction_requests(id,portfolio_id,security_id,requested_by,proposed_asset_class,proposed_instrument_type,reason,evidence_reference)
values('7eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','7ddddddd-dddd-dddd-dddd-ddddddddddd2','71111111-1111-1111-1111-111111111111','EQUITY','COMMON_STOCK','Exchange evidence corrects classification','NSE reviewed filing');
reset role;
select extensions.is((select request_status from public.security_classification_correction_requests where id='7eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),'PENDING','owner can submit pending correction request');
select public.apply_security_classification_correction_v1('7eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','71111111-1111-1111-1111-111111111111','Trusted administrator reviewed exchange evidence');
select extensions.is((select asset_class from public.securities where id='7ddddddd-dddd-dddd-dddd-ddddddddddd2'),'EQUITY','trusted service applies canonical asset class');
select extensions.is((select instrument_type from public.securities where id='7ddddddd-dddd-dddd-dddd-ddddddddddd2'),'COMMON_STOCK','trusted service applies canonical instrument type');
select extensions.is((select old_asset_class||'>'||new_asset_class from public.security_classification_changes where request_id='7eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),'ETF>EQUITY','immutable change history retains old and new class');
select extensions.is((select request_status from public.security_classification_correction_requests where id='7eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),'APPLIED','request records applied review state');
select extensions.throws_ok(
  $$update public.transaction_accounting_events set reason='Mutated' where transaction_id='70000000-0000-0000-0000-000000000002'$$,
  '55000',
  'Applied audit evidence is immutable.',
  'trusted operational role cannot UPDATE transaction audit history'
);
select extensions.throws_ok(
  $$delete from public.transaction_accounting_events where transaction_id='70000000-0000-0000-0000-000000000002'$$,
  '55000',
  'Applied audit evidence is immutable.',
  'trusted operational role cannot DELETE transaction audit history'
);
select extensions.throws_ok(
  $$update public.security_classification_changes set evidence_reference='Mutated' where request_id='7eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'$$,
  '55000',
  'Applied audit evidence is immutable.',
  'trusted operational role cannot UPDATE applied classification history'
);
select extensions.throws_ok(
  $$delete from public.security_classification_changes where request_id='7eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'$$,
  '55000',
  'Applied audit evidence is immutable.',
  'trusted operational role cannot DELETE applied classification history'
);

select set_config('request.jwt.claim.sub','72222222-2222-2222-2222-222222222222',true);
set local role authenticated;
select extensions.is((select count(*) from public.transaction_accounting_events),0::bigint,'other owner cannot read accounting events');
select extensions.is((select count(*) from public.security_classification_correction_requests),0::bigint,'other owner cannot read correction requests');
select extensions.throws_ok($$select public.void_transaction_v1('70000000-0000-0000-0000-000000000002','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Cross owner attempt','70000000-0000-0000-0000-000000000014')$$,'42501','Portfolio is unavailable.','cross-owner void is rejected');
reset role;

select * from extensions.finish();
rollback;
