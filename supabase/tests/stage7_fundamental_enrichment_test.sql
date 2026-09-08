begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(23);

select extensions.has_table('public','data_source_records','raw evidence table exists');
select extensions.is((select is_active from public.data_sources where code='TRENDLYNE_MCP'),true,'owner-approved Trendlyne adapter is active after Stage 7.1C migration');
select extensions.is((select entitlement_verified from public.data_sources where code='TRENDLYNE_MCP'),true,'Trendlyne entitlement is explicitly recorded after owner approval');
select extensions.is((select large_cap_max_rank from public.market_cap_classification_policies where code='SEBI_AMFI_FULL_MARKET_CAP_RANK_V1'),100,'large-cap boundary is rank 100');
select extensions.is((select mid_cap_max_rank from public.market_cap_classification_policies where code='SEBI_AMFI_FULL_MARKET_CAP_RANK_V1'),250,'mid-cap boundary is rank 250');
select extensions.throws_ok($$insert into public.market_cap_classification_policies(code,version,name,effective_from,large_cap_max_rank,mid_cap_max_rank,minimum_universe_size) values('BAD',1,'Bad',current_date,100,90,251)$$,'23514',null,'invalid rank boundaries are rejected');

insert into auth.users(id,instance_id,aud,role,email) values
('71111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage7-owner@example.test'),
('72222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage7-other@example.test');
insert into public.portfolios(id,user_id,name) values('7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','71111111-1111-1111-1111-111111111111','Stage 7 owner');
insert into public.brokers(id,name,code) values('7bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Stage Seven Broker','STAGE7');
insert into public.broker_accounts(id,portfolio_id,broker_id,account_name) values('7ccccccc-cccc-cccc-cccc-cccccccccccc','7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','7bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Owner account');
insert into public.securities(id,symbol,exchange,isin,name,asset_class,instrument_type) values('7ddddddd-dddd-dddd-dddd-dddddddddddd','STAGE7','NSE','INE123A01016','STAGE7','EQUITY','COMMON_STOCK');
insert into public.security_listings(id,security_id,exchange,trading_symbol,series,is_primary) values('7eeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','7ddddddd-dddd-dddd-dddd-dddddddddddd','NSE','STAGE7','EQ',true);
insert into public.transactions(portfolio_id,broker_account_id,security_id,transaction_type,transaction_date,quantity,unit_price,data_quality_status,source_type,source_provider) values('7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','7ccccccc-cccc-cccc-cccc-cccccccccccc','7ddddddd-dddd-dddd-dddd-dddddddddddd','BUY','2026-01-01',10,100,'COMPLETE','MANUAL','PORTFOLIOAI');
insert into public.data_source_records(id,source_code,record_kind,external_record_id,payload_hash,raw_payload) values('70000000-0000-0000-0000-000000000001','STOCK_MASTER','SECURITY_ENRICHMENT','STAGE7',repeat('a',64),'{"company":"Stage Seven Limited"}');

select extensions.throws_ok($$insert into public.data_source_records(source_code,record_kind,payload_hash,raw_payload) values('STOCK_MASTER','TEST','bad','{}')$$,'23514',null,'invalid evidence hash is rejected');
select extensions.throws_ok($$insert into public.data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload) values('STOCK_MASTER','SECURITY_ENRICHMENT','STAGE7',repeat('a',64),'{}')$$,'23505',null,'unchanged provider records are deduplicated');

insert into public.security_attribute_observations(id,security_id,source_record_id,source_code,attribute_code,text_value,normalized_value,observed_at,fresh_until) values
('70000000-0000-0000-0000-000000000011','7ddddddd-dddd-dddd-dddd-dddddddddddd','70000000-0000-0000-0000-000000000001','STOCK_MASTER','COMPANY_NAME','Stage Seven Limited','STAGE SEVEN LIMITED',now(),now()+interval '30 days'),
('70000000-0000-0000-0000-000000000012','7ddddddd-dddd-dddd-dddd-dddddddddddd','70000000-0000-0000-0000-000000000001','STOCK_MASTER','SECTOR','Financial Services','FINANCIAL_SERVICES',now(),now()+interval '30 days'),
('70000000-0000-0000-0000-000000000013','7ddddddd-dddd-dddd-dddd-dddddddddddd','70000000-0000-0000-0000-000000000001','STOCK_MASTER','INDUSTRY','Capital Markets','CAPITAL_MARKETS',now(),now()+interval '30 days');
insert into public.security_attribute_decisions(security_id,attribute_code,selected_observation_id,decision_basis) values
('7ddddddd-dddd-dddd-dddd-dddddddddddd','COMPANY_NAME','70000000-0000-0000-0000-000000000011','EVIDENCE_PRIORITY'),
('7ddddddd-dddd-dddd-dddd-dddddddddddd','SECTOR','70000000-0000-0000-0000-000000000012','EVIDENCE_PRIORITY'),
('7ddddddd-dddd-dddd-dddd-dddddddddddd','INDUSTRY','70000000-0000-0000-0000-000000000013','EVIDENCE_PRIORITY');

select extensions.throws_ok($$insert into public.fundamental_observations(security_id,metric_code,source_record_id,source_code,numeric_value,text_value,fresh_until) values('7ddddddd-dddd-dddd-dddd-dddddddddddd','MARKET_CAP','70000000-0000-0000-0000-000000000001','STOCK_MASTER',100,'invalid',now())$$,'23514',null,'fundamental observations require exactly one typed value');
insert into public.market_cap_classification_observations(id,security_id,source_record_id,source_code,market_cap,currency,capitalization_basis,as_of_date,full_market_cap_rank,fresh_until) values('70000000-0000-0000-0000-000000000021','7ddddddd-dddd-dddd-dddd-dddddddddddd','70000000-0000-0000-0000-000000000001','STOCK_MASTER',123456789,'INR','FULL',current_date,100,now()+interval '2 days');
insert into public.market_cap_category_assessments(security_id,policy_code,policy_version,selected_observation_id,category,rank_used,assessment_status,reason_code) values('7ddddddd-dddd-dddd-dddd-dddddddddddd','SEBI_AMFI_FULL_MARKET_CAP_RANK_V1',1,'70000000-0000-0000-0000-000000000021','LARGE_CAP',100,'AVAILABLE','TRUSTED_FULL_RANK');

select extensions.throws_ok($$update public.data_source_records set raw_payload='{}' where id='70000000-0000-0000-0000-000000000001'$$,'55000','Stage 7 provider evidence is immutable.','raw provider evidence cannot be overwritten');
select extensions.throws_ok($$delete from public.market_cap_classification_observations where id='70000000-0000-0000-0000-000000000021'$$,'55000','Stage 7 provider evidence is immutable.','normalized financial evidence cannot be deleted');

select extensions.is((select enrichment_state from public.current_security_enrichment_v1 where security_id='7ddddddd-dddd-dddd-dddd-dddddddddddd'),'AVAILABLE','complete selected evidence is available');
select extensions.is((select company_name from public.current_security_enrichment_v1 where security_id='7ddddddd-dddd-dddd-dddd-dddddddddddd'),'Stage Seven Limited','selected company evidence is projected');
select extensions.is((select sector from public.current_security_enrichment_v1 where security_id='7ddddddd-dddd-dddd-dddd-dddddddddddd'),'Financial Services','selected sector evidence is projected');
select extensions.is((select market_cap_category from public.current_security_enrichment_v1 where security_id='7ddddddd-dddd-dddd-dddd-dddddddddddd'),'LARGE_CAP','rank policy result is projected separately from market-cap value');
select extensions.is((select count(*) from public.transactions where portfolio_id='7aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),1::bigint,'enrichment does not alter the ledger');

select pg_catalog.set_config('request.jwt.claim.sub','71111111-1111-1111-1111-111111111111',true);
set local role authenticated;
select extensions.is((select count(*) from public.current_security_enrichment_v1),1::bigint,'owner can read enrichment for a held security');
reset role;
select pg_catalog.set_config('request.jwt.claim.sub','72222222-2222-2222-2222-222222222222',true);
set local role authenticated;
select extensions.is((select count(*) from public.current_security_enrichment_v1),0::bigint,'another user cannot read global evidence outside their portfolio history');
reset role;

select extensions.ok(not pg_catalog.has_table_privilege('anon','public.data_source_records','SELECT'),'anon cannot read raw provider evidence');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.data_source_records','INSERT'),'browser clients cannot insert raw provider evidence');
select extensions.ok(pg_catalog.has_function_privilege('service_role','public.acquire_data_ingestion_lease_v1(text,text,uuid,integer)','EXECUTE'),'service role controls ingestion leases');
select extensions.ok(not pg_catalog.has_function_privilege('authenticated','public.apply_fundamental_observation_decision_v1(uuid,text,text)','EXECUTE'),'browser clients cannot select canonical fundamentals');
select extensions.ok(pg_catalog.has_table_privilege('authenticated','public.current_security_enrichment_v1','SELECT'),'authenticated users can query the RLS-filtered cache view');

select * from extensions.finish();
rollback;
