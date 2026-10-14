-- R3 Results Development: five Q1 FY27 original issuer-authored Ind-AS filings.
-- Strictly preserves raw value unit INR lakhs, consolidated scope and dates.
-- R2 compact manifest exists and object-size listing readback completed first.
-- Original NSE HTML bytes were not copied (NSE retention rights unverified).
-- Results evidence is REVIEW_PENDING (no canonical observation selection).
WITH sources(symbol,isin,filing,approval_date,revenue_lakhs,profit_lakhs,eps,manifest_sha) AS (
 VALUES
 ('HCLTECH','INE860A01027','INTEGRATED_FILING_INDAS_174185_13072026192058_iXBRL_WEB.html','2026-07-13','3457900.00'::numeric,'462600.00'::numeric,'17.06'::numeric,'ec2a0df7ff28fb4b677699a9307aa7208e4c18e59cc5c58990839e9db06ccded'),
 ('INFY','INE009A01021','INTEGRATED_FILING_INDAS_177385_23072026174446_iXBRL_WEB.html','2026-07-23','4821100.00'::numeric,'777500.00'::numeric,'19.17'::numeric,'4c674391c49b79182b378fe8ef4d418ac1da82ed099b12bfe5ffb0a456202b39'),
 ('BHARTIARTL','INE397D01024','INTEGRATED_FILING_INDAS_182434_04082026202135_iXBRL_WEB.html','2026-08-04','5853910.00'::numeric,'1001160.00'::numeric,'13.37'::numeric,'decd63ecb304e887549654349c382a5b373e00fc06f338c503c0eb40956bd1a0'),
 ('HINDUNILVR','INE030A01027','INTEGRATED_FILING_INDAS_179457_28072026194155_iXBRL_WEB.html','2026-07-28','1734100.00'::numeric,'268000.00'::numeric,'11.38'::numeric,'257effd6371d6200f16b3c213e0d71ac2bd723ba89e4068ca2bd39e548ed4e9d'),
 ('RELIANCE','INE002A01018','INTEGRATED_FILING_INDAS_175608_17072026195004_iXBRL_WEB.html','2026-07-17','31185000.00'::numeric,'2319600.00'::numeric,'15.48'::numeric,'b471264b12e56afdf33c8555b30f485efef1b1038a48717999d3276c7dd6a594')
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