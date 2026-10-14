-- Results R3 limited primary-filing recovery: HDFCBANK Q1 FY27 standalone.
-- No new tables and no changes to V1-4 selections or scores.
-- Manual source qualification: issuer-authored exchange filing (HDFC Bank, SGX,
-- 18 July 2026), cross-checked against NSE official iXBRL presentation.
-- Original binary is NOT stored; payload_hash hashes only the compact
-- extraction manifest, not the original file. Source timestamp UNKNOWN.
-- Standalone, INR Lakhs in iXBRL (divide by 100 for INR crore), unaudited.
-- Bank NII derived from (79,36,278 - 45,82,883) lakhs = 33,533.95 Cr;
-- Profit after tax = 19,05,972 lakhs = 19,059.72 Cr;
-- PPOP = 28,16,806 lakhs = 28,168.06 Cr; diluted EPS = INR 12.35;
-- Gross NPA 1.17%, Net NPA 0.41%.
-- Must remain "Review pending" until an independent source-file readback
-- and an authorized selection decision; R3 UI does not infer a V1-4 score.
BEGIN;
INSERT INTO public.fundamental_metric_definitions
(code,name,value_kind,canonical_unit,statement_scope,freshness_seconds,definition)
VALUES
('NET_INTEREST_INCOME_QUARTER','Net interest income, quarterly','NUMERIC','INR_CRORE','BANKING',10368000,
 '{"results_scope":"QUARTERLY","formula":"total interest earned minus interest expended","no_v1_4_scoring_override":true}'::jsonb),
('NET_PROFIT_QUARTER','Net profit after tax, quarterly','NUMERIC','INR_CRORE','INCOME_STATEMENT',10368000,
 '{"results_scope":"QUARTERLY","no_v1_4_scoring_override":true}'::jsonb)
ON CONFLICT (code) DO NOTHING;

WITH payload AS (
 SELECT jsonb_build_object(
  'issuer','HDFC Bank Limited',
  'canonical_symbol','HDFCBANK',
  'canonical_isin','INE040A01034',
  'reporting_period_start','2026-04-01',
  'reporting_period_end','2026-06-30',
  'reporting_basis','STANDALONE',
  'status','UNAUDITED',
  'issuer_document_date','2026-07-18',
  'original_bytes_stored',false,
  'original_publication_timestamp','UNKNOWN',
  'cross_check_url','https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_BANKING_175753_18072026160136_iXBRL_WEB.html',
  'nse_cross_check_kind','iXBRL banking financials',
  'input_unit','INR_LAKH',
  'metric_extractions',jsonb_build_object(
    'NET_INTEREST_INCOME_QUARTER','33533.95',
    'NET_PROFIT_QUARTER','19059.72',
    'OPERATING_PROFIT_QUARTER','28168.06',
    'EPS_DILUTED','12.35',
    'GROSS_NPA_PERCENT','1.17',
    'NET_NPA_PERCENT','0.41'
  ),
  'warning','Compact issuer filing extraction, not independently original-byte-verified; all observations unselected'
 ) AS body
), source_insert AS (
 INSERT INTO public.data_source_records
 (source_code, record_kind, external_record_id, source_url, payload_hash,raw_payload,terms_snapshot)
 SELECT 'COMPANY_EXCHANGE_FILING', 'RESULTS_QUARTERLY_ORIGINAL_FILING_EXTRACT',
        'HDFCBANK:2026-06-30:STANDALONE:SGX896797',
        'https://links.sgx.com/FileOpen/SGXForeign%20SE%20BM%2018072026.ashx?App=Announcement&FileID=896797',
        encode(digest(payload.body::text,'sha256'),'hex'),
        payload.body,
        jsonb_build_object('source','Issuer-authored exchange filing','retention','Compact extracted facts only; no original bytes retained')
 FROM payload
 ON CONFLICT (source_code,record_kind,external_record_id,payload_hash) DO NOTHING
 RETURNING id
), source_row AS (
 SELECT id FROM source_insert
 UNION ALL
 SELECT d.id FROM public.data_source_records d,payload p
 WHERE d.source_code='COMPANY_EXCHANGE_FILING'
 AND d.record_kind='RESULTS_QUARTERLY_ORIGINAL_FILING_EXTRACT'
 AND d.external_record_id='HDFCBANK:2026-06-30:STANDALONE:SGX896797'
 AND d.payload_hash=encode(digest(p.body::text,'sha256'),'hex')
 LIMIT 1
), facts(metric_code,value,unit) AS (
 VALUES
 ('NET_INTEREST_INCOME_QUARTER',33533.95::numeric,'Cr'),
 ('NET_PROFIT_QUARTER',19059.72::numeric,'Cr'),
 ('OPERATING_PROFIT_QUARTER',28168.06::numeric,'Cr'),
 ('EPS_DILUTED',12.35::numeric,'INR_PER_SHARE'),
 ('GROSS_NPA_PERCENT',1.17::numeric,'PERCENT'),
 ('NET_NPA_PERCENT',0.41::numeric,'PERCENT')
)
INSERT INTO public.fundamental_observations (
 security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
 period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status,
 accounting_standard)
SELECT s.id,f.metric_code,d.id,'COMPANY_EXCHANGE_FILING',f.value,'INR',f.unit,
 DATE '2026-04-01',DATE '2026-06-30','QUARTER','STANDALONE',now(),now()+interval '120 days',
 'AVAILABLE','INDIAN_GAAP'
FROM facts f CROSS JOIN source_row d
JOIN public.securities s ON s.symbol='HDFCBANK' AND s.isin='INE040A01034'
ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING;
COMMIT;
-- After commit, independently read back every inserted metric and its source
-- URL. Selection count is intentionally unchanged and no scores are updated.
