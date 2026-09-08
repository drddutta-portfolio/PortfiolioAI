begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(38);

select extensions.has_column('public','data_source_records','published_at','raw evidence has explicit publication time');
select extensions.has_column('public','fundamental_observations','published_at','normalized observations expose publication time without raw-payload access');

insert into auth.users(id,instance_id,aud,role,email) values
('81111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage7-resilience-owner@example.test'),
('82222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stage7-resilience-other@example.test');
insert into public.portfolios(id,user_id,name) values('8aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','81111111-1111-1111-1111-111111111111','Stage 7 resilience');
insert into public.brokers(id,name,code) values('8bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Stage Seven Resilience Broker','STAGE7R');
insert into public.broker_accounts(id,portfolio_id,broker_id,account_name) values('8ccccccc-cccc-cccc-cccc-cccccccccccc','8aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','8bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Owner account');
insert into public.securities(id,symbol,exchange,name,asset_class,instrument_type) values('8ddddddd-dddd-dddd-dddd-dddddddddddd','RESILIENCE','NSE','Resilience Limited','EQUITY','COMMON_STOCK');
insert into public.transactions(portfolio_id,broker_account_id,security_id,transaction_type,transaction_date,quantity,unit_price,data_quality_status,source_type,source_provider) values('8aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','8ccccccc-cccc-cccc-cccc-cccccccccccc','8ddddddd-dddd-dddd-dddd-dddddddddddd','BUY','2026-01-01',10,100,'COMPLETE','MANUAL','PORTFOLIOAI');

insert into public.data_sources(code,name,source_kind,evidence_priority,is_active,entitlement_verified,retention_rights_verified,capabilities) values
('SCREENER_IMPORT','Owner-provided Screener structured export','MANUAL',40,true,true,true,'{"structured_file_import":true,"live_scraping":false}'),
('COMPANY_IR','Approved company investor relations','PUBLIC_WEB',15,true,true,true,'{"official_documents":true}'),
('NSE_FILING','NSE official filing evidence','PUBLIC_WEB',15,true,true,true,'{"official_documents":true}');

insert into public.data_source_records(id,source_code,record_kind,external_record_id,source_observed_at,published_at,retrieved_at,payload_hash,raw_payload,source_url) values
('80000000-0000-0000-0000-000000000001','TRENDLYNE_MCP','FUNDAMENTAL','trend-roce-fy26','2026-04-30T00:00:00Z','2026-05-01T08:30:00Z','2026-05-01T10:00:00Z',repeat('a',64),'{"parameter":"ratios.roce","value":"18.2"}',null),
('80000000-0000-0000-0000-000000000002','SCREENER_IMPORT','FUNDAMENTAL','screener-roce-fy26','2026-04-30T00:00:00Z','2026-05-02T08:30:00Z','2026-05-02T10:00:00Z',repeat('b',64),'{"column":"Ratios.ROCE","original_value":"20.1"}',null),
('80000000-0000-0000-0000-000000000003','COMPANY_IR','RESEARCH_DOCUMENT','ir-annual-report-fy26',null,'2026-05-01T08:30:00Z','2026-05-01T10:00:00Z',repeat('c',64),'{"document_type":"ANNUAL_REPORT"}','https://company.example.test/annual-report-fy26.pdf'),
('80000000-0000-0000-0000-000000000004','TRENDLYNE_MCP','RESEARCH_DOCUMENT','trend-annual-report-fy26',null,'2026-05-01T08:30:00Z','2026-05-02T10:00:00Z',repeat('d',64),'{"document_type":"ANNUAL_REPORT"}','https://trendlyne.example.test/document/123'),
('80000000-0000-0000-0000-000000000005','NSE_FILING','RESEARCH_DOCUMENT','nse-annual-report-fy26',null,'2026-05-01T08:30:00Z','2026-05-03T10:00:00Z',repeat('e',64),'{"document_type":"ANNUAL_REPORT"}','https://nse.example.test/filing/456'),
('80000000-0000-0000-0000-000000000006','SCREENER_IMPORT','FUNDAMENTAL','no-publication-time',null,null,'2026-05-04T10:00:00Z',repeat('f',64),'{"column":"Unknown"}',null);

select extensions.is((select published_at from public.data_source_records where id='80000000-0000-0000-0000-000000000006'),null::timestamptz,'missing publication time remains null');
select extensions.is((select published_at from public.data_source_records where id='80000000-0000-0000-0000-000000000001'),'2026-05-01T08:30:00Z'::timestamptz,'publication time is independently persisted');

insert into public.fundamental_metric_definitions(code,name,value_kind,canonical_unit,statement_scope,freshness_seconds,definition) values('ROCE','Return on capital employed','NUMERIC','PERCENT','DERIVED_PROVIDER_RATIO',7776000,'{"equivalence_requires_formula_review":true}');
insert into public.fundamental_observations(id,security_id,metric_code,source_record_id,source_code,numeric_value,unit,period_start,period_end,period_type,accounting_standard,consolidation_scope,observed_at,published_at,retrieved_at,fresh_until,evidence_status) values
('80000000-0000-0000-0000-000000000101','8ddddddd-dddd-dddd-dddd-dddddddddddd','ROCE','80000000-0000-0000-0000-000000000001','TRENDLYNE_MCP',18.2,'PERCENT','2025-04-01','2026-03-31','YEAR','IND_AS','CONSOLIDATED','2026-04-30T00:00:00Z','2026-05-01T08:30:00Z','2026-05-01T10:00:00Z','2026-08-01T00:00:00Z','CONFLICTING'),
('80000000-0000-0000-0000-000000000102','8ddddddd-dddd-dddd-dddd-dddddddddddd','ROCE','80000000-0000-0000-0000-000000000002','SCREENER_IMPORT',20.1,'PERCENT','2025-04-01','2026-03-31','YEAR','IND_AS','CONSOLIDATED','2026-04-30T00:00:00Z','2026-05-02T08:30:00Z','2026-05-02T10:00:00Z','2026-08-01T00:00:00Z','CONFLICTING'),
('80000000-0000-0000-0000-000000000103','8ddddddd-dddd-dddd-dddd-dddddddddddd','ROCE','80000000-0000-0000-0000-000000000001','TRENDLYNE_MCP',19.0,'PERCENT','2025-04-01','2026-03-31','TTM','IND_AS','CONSOLIDATED','2026-04-30T00:00:00Z','2026-05-01T08:30:00Z','2026-05-01T10:00:00Z','2026-08-01T00:00:00Z','AVAILABLE');
insert into public.fundamental_observation_decisions(security_id,metric_code,period_end,period_type,consolidation_scope,selected_observation_id,decision_basis) values('8ddddddd-dddd-dddd-dddd-dddddddddddd','ROCE','2026-03-31','YEAR','CONSOLIDATED','80000000-0000-0000-0000-000000000101','MANUAL_REVIEW');

select extensions.is((select published_at from public.fundamental_observations where id='80000000-0000-0000-0000-000000000101'),'2026-05-01T08:30:00Z'::timestamptz,'normalized observation retains publication time');
select extensions.is((select period_end from public.fundamental_observations where id='80000000-0000-0000-0000-000000000101'),'2026-03-31'::date,'financial period remains distinct');
select extensions.is((select observed_at from public.fundamental_observations where id='80000000-0000-0000-0000-000000000101'),'2026-04-30T00:00:00Z'::timestamptz,'source observation time remains distinct');
select extensions.is((select retrieved_at from public.fundamental_observations where id='80000000-0000-0000-0000-000000000101'),'2026-05-01T10:00:00Z'::timestamptz,'retrieval time remains distinct');
select extensions.is((select count(*) from public.fundamental_observations where id in ('80000000-0000-0000-0000-000000000101','80000000-0000-0000-0000-000000000102')),2::bigint,'Trendlyne and Screener observations coexist');
select extensions.is((select count(distinct source_code) from public.fundamental_observations where id in ('80000000-0000-0000-0000-000000000101','80000000-0000-0000-0000-000000000102')),2::bigint,'canonical metric retains both source attributions');
select extensions.is((select published_at from public.current_fundamental_observations_v1 where security_id='8ddddddd-dddd-dddd-dddd-dddddddddddd' and metric_code='ROCE'),'2026-05-01T08:30:00Z'::timestamptz,'selected canonical view exposes publication time');

insert into public.fundamental_reconciliation_cases(id,security_id,metric_code,period_start,period_end,period_type,consolidation_scope,unit,accounting_standard,semantic_fingerprint,case_status,reason_code) values('80000000-0000-0000-0000-000000000301','8ddddddd-dddd-dddd-dddd-dddddddddddd','ROCE','2025-04-01','2026-03-31','YEAR','CONSOLIDATED','PERCENT','IND_AS',repeat('9',64),'OPEN','MATERIAL_VALUE_DIFFERENCE');
select extensions.is((select case_status from public.fundamental_reconciliation_cases where id='80000000-0000-0000-0000-000000000301'),'OPEN','fundamental conflict case opens independently of identity reconciliation');
insert into public.fundamental_reconciliation_members(case_id,observation_id,compatibility_status,compatibility_evidence) values
('80000000-0000-0000-0000-000000000301','80000000-0000-0000-0000-000000000101','VERIFIED_EQUIVALENT','{"formula_review":"fixture-equivalent"}'),
('80000000-0000-0000-0000-000000000301','80000000-0000-0000-0000-000000000102','VERIFIED_EQUIVALENT','{"formula_review":"fixture-equivalent"}');
select extensions.is((select count(*) from public.fundamental_reconciliation_members where case_id='80000000-0000-0000-0000-000000000301'),2::bigint,'one case links multiple competing observations');
select extensions.throws_ok($$insert into public.fundamental_reconciliation_members(case_id,observation_id,compatibility_status) values('80000000-0000-0000-0000-000000000301','80000000-0000-0000-0000-000000000103','VERIFIED_EQUIVALENT')$$,'23514','Reconciliation member semantics do not match the case.','semantically incompatible periods cannot enter the conflict');
update public.fundamental_reconciliation_cases set case_status='RESOLVED',resolved_at='2026-05-05T00:00:00Z',resolution_type='SELECTED_OBSERVATION',selected_observation_id='80000000-0000-0000-0000-000000000101',reviewed_by='81111111-1111-1111-1111-111111111111',review_notes='Fixture resolution' where id='80000000-0000-0000-0000-000000000301';
select extensions.is((select case_status from public.fundamental_reconciliation_cases where id='80000000-0000-0000-0000-000000000301'),'RESOLVED','trusted review resolves the case');
select extensions.is((select selected_observation_id from public.fundamental_reconciliation_cases where id='80000000-0000-0000-0000-000000000301'),'80000000-0000-0000-0000-000000000101'::uuid,'resolution references an exact member observation');
select extensions.is((select count(*) from public.fundamental_observations where id in ('80000000-0000-0000-0000-000000000101','80000000-0000-0000-0000-000000000102')),2::bigint,'resolution retains both original observations');
select extensions.is((select count(*) from public.fundamental_reconciliation_events where case_id='80000000-0000-0000-0000-000000000301'),2::bigint,'case opening and resolution are append-only audited events');

insert into public.research_documents(id,security_id,document_type,reporting_period_start,reporting_period_end,reporting_period_type,published_at,canonical_content_hash,identity_basis,identity_status,version_label,identity_evidence) values('80000000-0000-0000-0000-000000000201','8ddddddd-dddd-dddd-dddd-dddddddddddd','ANNUAL_REPORT','2025-04-01','2026-03-31','YEAR','2026-05-01T08:30:00Z',repeat('1',64),'CONTENT_SHA256','VERIFIED','FY2025-26','{"hash_algorithm":"SHA-256"}');
insert into public.research_document_sources(id,research_document_id,source_code,source_record_id,provider_document_id,source_url,source_title,source_version,source_published_at,retrieved_at,content_hash,extraction_method,extraction_version,extraction_provenance,source_status) values
('80000000-0000-0000-0000-000000000211','80000000-0000-0000-0000-000000000201','COMPANY_IR','80000000-0000-0000-0000-000000000003','ir-annual-report-fy26','https://company.example.test/annual-report-fy26.pdf','Annual Report FY26','1','2026-05-01T08:30:00Z','2026-05-01T10:00:00Z',repeat('1',64),'FIXTURE','1','{"automatically_accepted":false}','VERIFIED'),
('80000000-0000-0000-0000-000000000212','80000000-0000-0000-0000-000000000201','TRENDLYNE_MCP','80000000-0000-0000-0000-000000000004','trend-annual-report-fy26','https://trendlyne.example.test/document/123','Annual Report FY26','1','2026-05-01T08:30:00Z','2026-05-02T10:00:00Z',repeat('1',64),'FIXTURE','1','{"automatically_accepted":false}','VERIFIED'),
('80000000-0000-0000-0000-000000000213','80000000-0000-0000-0000-000000000201','NSE_FILING','80000000-0000-0000-0000-000000000005','nse-annual-report-fy26','https://nse.example.test/filing/456','Annual Report FY26','1','2026-05-01T08:30:00Z','2026-05-03T10:00:00Z',repeat('1',64),'FIXTURE','1','{"automatically_accepted":false}','VERIFIED');
select extensions.is((select count(*) from public.research_documents where canonical_content_hash=repeat('1',64)),1::bigint,'one provider-independent document identity is stored');
select extensions.is((select count(*) from public.research_document_sources where research_document_id='80000000-0000-0000-0000-000000000201'),3::bigint,'one document accepts three immutable appearances');
select extensions.is((select count(distinct source_code) from public.research_document_sources where research_document_id='80000000-0000-0000-0000-000000000201'),3::bigint,'company IR, Trendlyne and exchange appearances coexist');
select extensions.throws_ok($$insert into public.research_documents(security_id,document_type,canonical_content_hash,identity_basis,identity_status) values('8ddddddd-dddd-dddd-dddd-dddddddddddd','ANNUAL_REPORT',repeat('1',64),'CONTENT_SHA256','VERIFIED')$$,'23505',null,'content hash deduplicates independently of provider URL');
select extensions.throws_ok($$insert into public.research_document_sources(research_document_id,source_code,source_record_id,provider_document_id,retrieved_at,content_hash,source_status) values('80000000-0000-0000-0000-000000000201','COMPANY_IR','80000000-0000-0000-0000-000000000003','bad-hash','2026-05-04T00:00:00Z',repeat('2',64),'REVIEW_REQUIRED')$$,'23514','Document source content hash conflicts with canonical document identity.','conflicting content hash cannot be attached to a verified document');
insert into public.research_documents(id,security_id,document_type,identity_basis,identity_status,identity_evidence) values
('80000000-0000-0000-0000-000000000202','8ddddddd-dddd-dddd-dddd-dddddddddddd','INVESTOR_PRESENTATION','REVIEW_REQUIRED','REVIEW_REQUIRED','{"title":"Similar title"}'),
('80000000-0000-0000-0000-000000000203','8ddddddd-dddd-dddd-dddd-dddddddddddd','INVESTOR_PRESENTATION','REVIEW_REQUIRED','REVIEW_REQUIRED','{"title":"Similar title"}');
select extensions.is((select count(*) from public.research_documents where identity_status='REVIEW_REQUIRED' and security_id='8ddddddd-dddd-dddd-dddd-dddddddddddd'),2::bigint,'similar titles remain separate uncertain document candidates');
select extensions.throws_ok($$update public.research_documents set version_label='rewritten' where id='80000000-0000-0000-0000-000000000201'$$,'55000','Stage 7 provider evidence is immutable.','canonical document evidence is immutable');
select extensions.throws_ok($$delete from public.research_document_sources where id='80000000-0000-0000-0000-000000000211'$$,'55000','Stage 7 provider evidence is immutable.','document source appearances are immutable');

select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.research_documents','INSERT'),'browser cannot insert canonical documents');
select extensions.ok(not pg_catalog.has_table_privilege('authenticated','public.fundamental_reconciliation_cases','UPDATE'),'browser cannot resolve reconciliation cases directly');
select extensions.ok(pg_catalog.has_function_privilege('service_role','public.resolve_fundamental_reconciliation_case_v1(uuid,text,uuid,uuid,text)','EXECUTE'),'only trusted service operation can execute reconciliation resolution');

select pg_catalog.set_config('request.jwt.claim.sub','81111111-1111-1111-1111-111111111111',true);
set local role authenticated;
select extensions.is((select count(*) from public.research_documents),3::bigint,'owner reads documents for held securities');
select extensions.is((select count(*) from public.research_document_sources),3::bigint,'owner reads document appearances for held securities');
select extensions.is((select count(*) from public.fundamental_reconciliation_cases),1::bigint,'owner reads held-security reconciliation cases');
select extensions.is((select count(*) from public.current_fundamental_observations_v1 where security_id='8ddddddd-dddd-dddd-dddd-dddddddddddd'),1::bigint,'owner reads selected provider-neutral fundamentals');
reset role;

select pg_catalog.set_config('request.jwt.claim.sub','82222222-2222-2222-2222-222222222222',true);
set local role authenticated;
select extensions.is((select count(*) from public.research_documents),0::bigint,'other user cannot read canonical documents');
select extensions.is((select count(*) from public.research_document_sources),0::bigint,'document URLs do not create cross-user disclosure');
select extensions.is((select count(*) from public.fundamental_reconciliation_cases),0::bigint,'other user cannot read fundamental conflict cases');
select extensions.is((select count(*) from public.fundamental_reconciliation_members),0::bigint,'other user cannot read competing observation membership');
select extensions.is((select count(*) from public.current_security_enrichment_v1),0::bigint,'prior Stage 7 aggregate-view disclosure fix remains enforced');
reset role;

select * from extensions.finish();
rollback;
