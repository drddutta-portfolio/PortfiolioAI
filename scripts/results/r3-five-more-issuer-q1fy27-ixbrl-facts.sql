-- R3 Results Development: second five Q1 FY27 original issuer Ind-AS filings.
-- Strictly preserves raw value unit INR lakhs, consolidated scope and dates.
-- R2 compact manifest exists and object-size listing readback completed first.
-- Original NSE HTML bytes were not copied (NSE retention rights unverified).
-- Results evidence is REVIEW_PENDING (no canonical observation selection).
WITH sources(symbol,isin,filing,approval_date,revenue_lakhs,profit_lakhs,eps,manifest_sha) AS (
 VALUES
 ('DRREDDY','INE089A01031','INTEGRATED_FILING_INDAS_177024_22072026184701_iXBRL_WEB.html','2026-07-22','809980.00'::numeric,'43560.00'::numeric,'5.33'::numeric,'fbf7bd7c347e3c27cfc7e10009229486ed6172c12303100b5a69e6a86a8ef770'),
 ('AUROPHARMA','INE406A01037','INTEGRATED_FILING_INDAS_182939_05082026211312_iXBRL_WEB.html','2026-08-05','915035.00'::numeric,'103203.00'::numeric,'17.86'::numeric,'2c691ad29b8bd32d917abbfd74c2c849387513d11541ce02bc46799e03a8f51c'),
 ('ETERNAL','INE758T01015','INTEGRATED_FILING_INDAS_177049_22072026191843_iXBRL_WEB.html','2026-07-22','2021100.00'::numeric,'9200.00'::numeric,'0.10'::numeric,'f85a7dcef34870ba57549cfa0468b5be24d243f05ef90a87225df5dc95686524'),
 ('HAL','INE066F01020','INTEGRATED_FILING_INDAS_185601_12082026141946_iXBRL_WEB.html','2026-08-12','551517.00'::numeric,'158966.00'::numeric,'23.77'::numeric,'241fa731243cf606fa8a3b8c7f8d99bffdceb4933198d7190cb899737e3337ca'),
 ('BEL','INE263A01024','INTEGRATED_FILING_INDAS_178593_27072026163840_iXBRL_WEB.html','2026-07-27','554698.00'::numeric,'105453.00'::numeric,'1.44'::numeric,'36c60c6a85132d12380a53069c7951e1d2452bb0a2a25951ec04b715161e1b8e')
), qualified AS MATERIALIZED (
 SELECT s.id security_id,v.*,
    'https://nsearchives.nseindia.com/corporate/ixbrl/'||v.filing AS issuer_url,
    'portfolioai-results/development/v1/quarterly/security_id='||v.isin||
    '/period_end=2026-06-30/source_version='||v.manifest_sha||'/manifest.json' AS r2_key,
    '{}'::jsonb AS placeholder
 FROM sources v JOIN public.securities s ON s.symbol=v.symbol AND s.isin=v.isin AND s.asset_class='EQUITY'
 WHERE NOT EXISTS(SELECT 1 FROM public.fundamental_observations f
   WHERE f.security_id=s.id AND f.period_type='QUARTER' AND f.period_end='2026-06-30'
     AND f.metric_code='OPERATING_REVENUE_QUARTER' AND f.consolidation_scope='CONSOLIDATED')
), records AS MATERIALIZED (
 SELECT q.*,
    jsonb_build_object(
     'security_symbol',q.symbol,'isin',q.isin,'source_kind','ISSUER_INTEGRATED_FILING_INDAS',
     'source_url',q.issuer_url,'reporting_period_start','2026-04-01',
     'reporting_period_end','2026-06-30','reporting_basis','CONSOLIDATED',
     'reporting_currency','INR','original_financial_unit','INR_LAKH',
     'original_revenue_lakhs',q.revenue_lakhs,'original_total_profit_lakhs',q.profit_lakhs,
     'original_diluted_eps_inr',q.eps,'board_approval_date',q.approval_date,
     'publication_timestamp','UNKNOWN','source_bytes_stored',false,
     'source_review','REVIEW_PENDING','r2_bucket','portfolioai-history-dev',
     'r2_key',q.r2_key,'r2_manifest_sha256',q.manifest_sha,
     'r2_listing_verified',true,'original_url_linked',true,
     'extraction_method','EXPLICIT_FIRST_QUARTER_COLUMN'
    ) payload
 FROM qualified q
), insert_source AS (
 INSERT INTO public.data_source_records
 (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
 SELECT 'COMPANY_EXCHANGE_FILING','RESULTS_QUARTERLY_ISSUER_IXBRL_FACTS',
  r.symbol||':'||r.filing,r.issuer_url,encode(digest(r.payload::text,'sha256'),'hex'),r.payload,
  '{"storage":"COMPACT_FACTS_ONLY","original_nse_html_retained":false,"results_state":"REVIEW_PENDING","primary_exchange_filing":true}'::jsonb
 FROM records r
 ON CONFLICT (source_code,record_kind,external_record_id,payload_hash) DO NOTHING
 RETURNING id,external_record_id
), stored AS MATERIALIZED (
 SELECT d.id,d.external_record_id
 FROM public.data_source_records d
 JOIN records r ON d.external_record_id=r.symbol||':'||r.filing
 WHERE d.source_code='COMPANY_EXCHANGE_FILING'
   AND d.record_kind='RESULTS_QUARTERLY_ISSUER_IXBRL_FACTS'
), source_rows AS MATERIALIZED (
 SELECT id,external_record_id FROM insert_source
 UNION
 SELECT id,external_record_id FROM stored
), numbers AS (
 SELECT r.security_id,r.symbol,d.id source_record_id,
    x.metric_code,x.numeric_value,x.unit
 FROM records r
 JOIN source_rows d ON d.external_record_id=r.symbol||':'||r.filing
 CROSS JOIN LATERAL (VALUES
    ('OPERATING_REVENUE_QUARTER',r.revenue_lakhs/100::numeric,'INR_CRORE'),
    ('NET_PROFIT_QUARTER',r.profit_lakhs/100::numeric,'INR_CRORE'),
    ('EPS_DILUTED',r.eps,'INR_PER_SHARE')
 ) x(metric_code,numeric_value,unit)
), observations AS (
 INSERT INTO public.fundamental_observations
 (security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
  period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
 SELECT n.security_id,n.metric_code,n.source_record_id,'COMPANY_EXCHANGE_FILING',n.numeric_value,
 'INR',n.unit,'2026-04-01','2026-06-30','QUARTER','CONSOLIDATED',now(),now()+interval '120 days','AVAILABLE'
 FROM numbers n
 ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING
 RETURNING security_id,metric_code,period_end,numeric_value
)
SELECT (SELECT count(*) FROM qualified) companies_qualified,
       count(*) observations_inserted,count(DISTINCT security_id) stocks_new,
       count(*) FILTER(WHERE metric_code='OPERATING_REVENUE_QUARTER') revenue_rows,
       count(*) FILTER(WHERE metric_code='NET_PROFIT_QUARTER') profit_rows,
       count(*) FILTER(WHERE metric_code='EPS_DILUTED') eps_rows
 FROM observations;