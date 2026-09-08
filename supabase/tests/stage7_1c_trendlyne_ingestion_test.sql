begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(14);

select extensions.has_column('public','security_identity_observations','provider_instrument_id','provider identity evidence retains stable instrument id');
select extensions.is((select retention_rights_verified from public.data_sources where code='TRENDLYNE_MCP'),true,'owner-approved retention rights are explicit');
select extensions.is((select configuration#>>'{activation,approval_source}' from public.data_sources where code='TRENDLYNE_MCP'),'OWNER_APPROVED_STAGE_7_1C','activation records its approval source');
select extensions.is((select configuration#>>'{activation,approved_by}' from public.data_sources where code='TRENDLYNE_MCP'),'PORTFOLIO_OWNER','activation records the approving actor class');
select extensions.is((select definition->>'price_authority' from public.fundamental_metric_definitions where code='MARKET_CAP_PROVIDER_RAW'),'false','Trendlyne market cap cannot become price authority');
select extensions.is((select definition->>'selection' from public.fundamental_metric_definitions where code='PBV_ADJUSTED_PROVIDER'),'QUARANTINE','adjusted PBV remains quarantined');
select extensions.is((select canonical_unit from public.fundamental_metric_definitions where code='SHAREHOLDING_PROMOTER_PLEDGE_PERCENT'),'PERCENT_OF_PROMOTER_HOLDING','promoter pledge denominator is explicit');
select extensions.ok(not exists(select 1 from public.fundamental_metric_definitions where code in ('EBITDA','OPERATING_PROFIT','PBV','FCF','NET_DEBT','TOTAL_DEBT','CASH','EV_EBITDA','CAPEX','INTEREST_COVERAGE')),'unverified metrics are not introduced');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.data_sources','UPDATE'),'browser cannot activate a provider');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.security_identity_observations','INSERT'),'browser cannot insert provider identity evidence');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.fundamental_observations','INSERT'),'browser cannot insert fundamental evidence');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.research_document_sources','INSERT'),'browser cannot insert document appearances');

insert into public.securities(id,symbol,exchange,isin,name,asset_class,instrument_type) values
('91dddddd-dddd-dddd-dddd-dddddddddddd','TLTEST','NSE','INE123A01016','Trendlyne Test Limited','EQUITY','COMMON_STOCK');
insert into public.data_source_records(id,source_code,record_kind,external_record_id,payload_hash,raw_payload) values
('91000000-0000-0000-0000-000000000001','TRENDLYNE_MCP','SECURITY_IDENTITY','1001',repeat('a',64),'{"stock_id":"1001"}'),
('91000000-0000-0000-0000-000000000002','TRENDLYNE_MCP','SECURITY_IDENTITY','1001-replay',repeat('b',64),'{"stock_id":"1001"}');
insert into public.security_identity_observations(security_id,source_record_id,source_code,provider_instrument_id,evidence_status) values
('91dddddd-dddd-dddd-dddd-dddddddddddd','91000000-0000-0000-0000-000000000001','TRENDLYNE_MCP','1001','MATCHED');
select extensions.throws_ok($$insert into public.security_identity_observations(security_id,source_record_id,source_code,provider_instrument_id,evidence_status) values('91dddddd-dddd-dddd-dddd-dddddddddddd','91000000-0000-0000-0000-000000000002','TRENDLYNE_MCP','1001','MATCHED')$$,'23505',null,'one provider instrument cannot be verified twice or mapped elsewhere');
select extensions.throws_ok($$update public.security_identity_observations set evidence_status='REJECTED' where provider_instrument_id='1001'$$,'55000','Stage 7 provider evidence is immutable.','verified identity evidence remains immutable');

select * from extensions.finish();
rollback;
