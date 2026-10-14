-- Read original issuer-authored CGPOWER financial-result excerpts backed
-- by pre-existing R2 verified originals. Only explicitly labelled quarter
-- values for revenue from operations; no YTD/annual data admitted.
-- Results-only observations, not V1-4 canonical selections.
WITH originals AS MATERIALIZED (
 SELECT d.id AS source_record_id,d.raw_payload->>'title' AS title,
        d.raw_payload->>'identity_fragment' AS fragment
 FROM public.data_source_records d
 WHERE d.source_code='COMPANY_EXCHANGE_FILING'
   AND d.record_kind='V1_4_G02_REGISTERED_OFFICIAL_ORIGINAL'
   AND d.raw_payload->>'symbol'='CGPOWER'
   AND d.raw_payload->>'original_sha256' ~ '^[a-f0-9]{64}$'
   AND d.raw_payload->>'original_bytes_verified_at' IS NOT NULL
   AND d.raw_payload->>'r2_object_key' LIKE 'portfolioai-history/development/v1-4/g02/originals/%'
   AND d.raw_payload->>'financial_admission'='false'
   AND d.raw_payload->>'title' IN (
     'Audited Consolidated Financial Results for the Year ended 31st March, 2026',
     'Consolidated Financial Results for the quarter ended 31st December, 2025'
   )
), extracted AS MATERIALIZED (
 SELECT o.source_record_id,o.title,rm.vals,
 CASE WHEN o.title='Audited Consolidated Financial Results for the Year ended 31st March, 2026'
      THEN ARRAY['2026-03-31','2025-12-31','2025-03-31']::date[]
      ELSE ARRAY['2025-12-31','2025-09-30','2024-12-31']::date[] END AS dates
 FROM originals o
 CROSS JOIN LATERAL regexp_match(
   o.fragment,
   'Revenue from operations[[:space:]]+([0-9,]+[.][0-9]{2})[[:space:]]+([0-9,]+[.][0-9]{2})[[:space:]]+([0-9,]+[.][0-9]{2})','i'
 ) rm(vals)
 WHERE o.fragment ~* 'STATEMENT OF (UNAUDITED )?CONSOLIDATED FINANCIAL RESULTS'
 AND o.fragment ~* 'in crores unless specified'
 AND CASE WHEN o.title='Audited Consolidated Financial Results for the Year ended 31st March, 2026'
     THEN o.fragment ~ '31[.]03[.]2026[[:space:]]+31[.]12[.]2025[[:space:]]+31[.]03[.]2025'
     ELSE o.fragment ~ '31[.]12[.]2025[[:space:]]+30[.]09[.]2025[[:space:]]+31[.]12[.]2024'
     END
), candidates AS MATERIALIZED (
 SELECT e.source_record_id,e.title,period.dt AS period_end,
    replace(e.vals[period.idx],',','')::numeric AS amount
 FROM extracted e
 CROSS JOIN LATERAL (VALUES (1,e.dates[1]),(2,e.dates[2]),(3,e.dates[3])) period(idx,dt)
 WHERE (e.title='Audited Consolidated Financial Results for the Year ended 31st March, 2026'
   AND period.dt IN ('2025-03-31','2026-03-31'))
 OR (e.title='Consolidated Financial Results for the quarter ended 31st December, 2025'
   AND period.dt IN ('2025-09-30','2025-12-31'))
), qualified AS MATERIALIZED (
 SELECT s.id AS security_id,c.*
 FROM candidates c JOIN public.securities s ON s.symbol='CGPOWER' AND s.asset_class='EQUITY'
 WHERE c.amount>=0 AND c.amount < 100000000
 AND NOT EXISTS (
  SELECT 1 FROM public.fundamental_observations f WHERE f.security_id=s.id
  AND f.metric_code='OPERATING_REVENUE_QUARTER' AND f.period_type='QUARTER'
  AND f.period_end=c.period_end AND f.consolidation_scope='CONSOLIDATED'
 )
), inserted AS (
 INSERT INTO public.fundamental_observations
 (security_id,metric_code,source_record_id,source_code,numeric_value,
  currency,unit,period_end,period_type,consolidation_scope,
  retrieved_at,fresh_until,evidence_status)
 SELECT security_id,'OPERATING_REVENUE_QUARTER',source_record_id,'COMPANY_EXCHANGE_FILING',
 amount,'INR','INR_CRORE',period_end,'QUARTER','CONSOLIDATED',
 now(),now()+interval '120 days','AVAILABLE'
 FROM qualified
 ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING
 RETURNING security_id,metric_code,period_end,numeric_value,source_record_id
)
SELECT * FROM inserted ORDER BY period_end;