-- R3 Results Development: three more Q1 FY27 original issuer Ind-AS filings.
-- Strictly preserves raw value unit INR lakhs, consolidated scope and dates.
-- R2 compact manifest exists and object-size listing readback completed first.
-- Original NSE HTML bytes were not copied (NSE retention rights unverified).
-- Results evidence is REVIEW_PENDING (no canonical observation selection).
WITH sources(symbol,isin,filing,approval_date,revenue_lakhs,profit_lakhs,eps,manifest_sha) AS (
 VALUES
 ('GRASIM','INE047A01021','INTEGRATED_FILING_INDAS_185618_12082026144441_iXBRL_WEB.html','2026-08-12','4871620.00'::numeric,'384628.00'::numeric,'31.60'::numeric,'b489abfb775bd6803747961f8c3a49f9f90e4536513ee43a9bb95faffd3853e0'),
 ('HINDALCO','INE038A01020','INTEGRATED_FILING_INDAS_183733_07082026172455_iXBRL_WEB.html','2026-08-07','8482500.00'::numeric,'701300.00'::numeric,'31.51'::numeric,'6bd1b30e5cff68acbe1aca83ccab777d08da56d9f9989ebf12861f7bd7fd60d7'),
 ('CIPLA','INE059A01026','INTEGRATED_FILING_INDAS_177481_23072026183436_iXBRL_WEB.html','2026-07-23','711928.00'::numeric,'78555.00'::numeric,'9.76'::numeric,'58bffcdf7986a6df2afa187565f37b54c8869b477d9c65210f2ee71ae3592c7f')
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