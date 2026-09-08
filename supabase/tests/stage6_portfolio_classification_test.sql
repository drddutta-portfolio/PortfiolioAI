begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(24);

insert into auth.users (id, instance_id, aud, role, email) values
  ('61111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage6-owner@example.test'),
  ('62222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage6-other@example.test');
insert into public.portfolios (id,user_id,name) values
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','61111111-1111-1111-1111-111111111111','Owner'),
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','62222222-2222-2222-2222-222222222222','Other');
insert into public.brokers (id,name,code) values ('6bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Stage Six Broker','STAGE6');
insert into public.broker_accounts (id,portfolio_id,broker_id,account_name) values
  ('6ccccccc-cccc-cccc-cccc-ccccccccccc1','6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Owner account');
insert into public.securities (id,symbol,exchange,name,asset_class,instrument_type) values
  ('6ddddddd-dddd-dddd-dddd-ddddddddddd1','EQUITY6','NSE','Equity Six','EQUITY','STOCK'),
  ('6ddddddd-dddd-dddd-dddd-ddddddddddd2','ETF6','NSE','ETF Six','ETF','ETF'),
  ('6ddddddd-dddd-dddd-dddd-ddddddddddd3','UNSET6','NSE','Unset Six','EQUITY','STOCK');
insert into public.transactions (portfolio_id,broker_account_id,security_id,transaction_type,transaction_date,quantity,unit_price,data_quality_status,source_type,source_provider) values
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6ccccccc-cccc-cccc-cccc-ccccccccccc1','6ddddddd-dddd-dddd-dddd-ddddddddddd1','BUY','2026-01-01',10,100,'COMPLETE','MANUAL','PORTFOLIOAI'),
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6ccccccc-cccc-cccc-cccc-ccccccccccc1','6ddddddd-dddd-dddd-dddd-ddddddddddd2','BUY','2026-01-01',10,100,'COMPLETE','MANUAL','PORTFOLIOAI'),
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6ccccccc-cccc-cccc-cccc-ccccccccccc1','6ddddddd-dddd-dddd-dddd-ddddddddddd3','BUY','2026-01-01',10,100,'COMPLETE','MANUAL','PORTFOLIOAI');

select extensions.ok(not pg_catalog.has_table_privilege('anon','public.themes','SELECT'),'anon cannot read themes');
select extensions.ok(not pg_catalog.has_table_privilege('anon','public.theme_securities','SELECT'),'anon cannot read memberships');
select extensions.ok(pg_catalog.has_table_privilege('authenticated','public.themes','INSERT'),'authenticated can create owner-scoped themes');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.themes','DELETE'),'themes are retired rather than deleted');

select pg_catalog.set_config('request.jwt.claim.sub','61111111-1111-1111-1111-111111111111',true);
set local role authenticated;
insert into public.portfolio_security_settings (portfolio_id,security_id,portfolio_role,target_weight,minimum_weight,maximum_weight)
values
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6ddddddd-dddd-dddd-dddd-ddddddddddd1','OTHER',5.125000,2.500000,7.750000),
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6ddddddd-dddd-dddd-dddd-ddddddddddd2','ETF',null,null,null);
insert into public.themes (id,portfolio_id,name,max_allocation,priority) values
  ('6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Energy transition',12.500000,1),
  ('6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2','6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Manufacturing',null,null);
insert into public.theme_securities (portfolio_id,theme_id,security_id) values
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','6ddddddd-dddd-dddd-dddd-ddddddddddd1'),
  ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2','6ddddddd-dddd-dddd-dddd-ddddddddddd1');
reset role;

select extensions.is((select portfolio_role from public.portfolio_security_settings where security_id='6ddddddd-dddd-dddd-dddd-ddddddddddd1'),'OTHER','explicit OTHER is retained');
select extensions.is((select count(*) from public.portfolio_security_settings where portfolio_id='6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),2::bigint,'settings permit equity and ETF independently');
select extensions.is((select asset_class from public.securities where id='6ddddddd-dddd-dddd-dddd-ddddddddddd2'),'ETF','ETF asset class remains canonical');
select extensions.is((select count(*) from public.theme_securities where security_id='6ddddddd-dddd-dddd-dddd-ddddddddddd1'),2::bigint,'a security may belong to multiple themes');
select extensions.is((select max_allocation from public.themes where id='6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),12.500000::numeric,'theme allocation is exact numeric');

select pg_catalog.set_config('request.jwt.claim.sub','62222222-2222-2222-2222-222222222222',true);
set local role authenticated;
select extensions.is((select count(*) from public.themes),0::bigint,'other owner cannot read themes');
select extensions.is((select count(*) from public.theme_securities),0::bigint,'other owner cannot read memberships');
select extensions.throws_ok($$insert into public.themes (portfolio_id,name) values ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Injected')$$,'42501',null,'other owner cannot create a theme in owner portfolio');
reset role;

select extensions.throws_ok($$insert into public.themes (portfolio_id,name,max_allocation) values ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Invalid allocation',100.000001)$$,'23514',null,'theme allocation above 100 is rejected');
select extensions.throws_ok($$insert into public.portfolio_security_settings (portfolio_id,security_id,portfolio_role) values ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6ddddddd-dddd-dddd-dddd-ddddddddddd1','UNCLASSIFIED')$$,'23514',null,'invalid role is rejected');
select extensions.throws_ok($$update public.portfolio_security_settings set minimum_weight=8 where portfolio_id='6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1' and security_id='6ddddddd-dddd-dddd-dddd-ddddddddddd1'$$,'23514',null,'invalid minimum target maximum order is rejected');
select extensions.throws_ok($$insert into public.theme_securities (portfolio_id,theme_id,security_id) values ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2','6ddddddd-dddd-dddd-dddd-ddddddddddd2')$$,'23503',null,'theme portfolio cannot be crossed');
select extensions.throws_ok($$insert into public.theme_securities (portfolio_id,theme_id,security_id) values ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','00000000-0000-0000-0000-000000000099')$$,'23503',null,'membership requires a canonical security');

insert into public.theme_securities (portfolio_id,theme_id,security_id)
values ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','6ddddddd-dddd-dddd-dddd-ddddddddddd3');
select extensions.is((select count(*) from public.portfolio_security_settings where security_id='6ddddddd-dddd-dddd-dddd-ddddddddddd3'),0::bigint,'an unclassified holding can join a theme without a role row');
select extensions.throws_ok($$insert into public.theme_securities (portfolio_id,theme_id,security_id) values ('6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','6ddddddd-dddd-dddd-dddd-ddddddddddd3')$$,'23505',null,'duplicate same-theme membership is rejected');

update public.portfolio_security_settings set portfolio_role='SATELLITE'
where portfolio_id='6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1' and security_id='6ddddddd-dddd-dddd-dddd-ddddddddddd1';
select extensions.is((select count(*) from public.theme_securities where security_id='6ddddddd-dddd-dddd-dddd-ddddddddddd1'),2::bigint,'role changes preserve all theme memberships');
update public.themes set name='Manufacturing & capital goods' where id='6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2';
select extensions.is((select portfolio_role from public.portfolio_security_settings where security_id='6ddddddd-dddd-dddd-dddd-ddddddddddd1'),'SATELLITE','theme edits do not change primary role');
select extensions.is((select count(*) from public.current_holdings where portfolio_id='6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),3::bigint,'classification changes do not change consolidated holdings');

select pg_catalog.set_config('request.jwt.claim.sub','61111111-1111-1111-1111-111111111111',true);
set local role authenticated;
delete from public.theme_securities where theme_id='6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2';
update public.themes set is_active=false where id='6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2';
reset role;
select extensions.is((select count(*) from public.theme_securities where theme_id='6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'),0::bigint,'owner can remove membership');
select extensions.is((select is_active from public.themes where id='6eeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'),false,'owner can retire theme');

select * from extensions.finish();
rollback;
