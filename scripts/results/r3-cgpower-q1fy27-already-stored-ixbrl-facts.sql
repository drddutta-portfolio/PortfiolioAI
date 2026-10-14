WITH original AS MATERIALIZED (
 SELECT d.id AS source_record_id,d.raw_payload->>'identity_fragment' fragment
 FROM public.data_source_records d
 WHERE d.source_code='NSE_OFFICIAL'
   AND d.record_kind='V1_4_G02_REGISTERED_OFFICIAL_ORIGINAL'
   AND d.raw_payload->>'title'='Q1_FY2027_CONSOLIDATED_INDAS'
   AND d.raw_payload->>'symbol'='CGPOWER'
   AND d.raw_payload->>'original_sha256' ~ '^[a-f0-9]{64}$'
   AND d.raw_payload->>'original_bytes_verified_at' IS NOT NULL
   AND d.raw_payload->>'r2_object_key' LIKE 'portfolioai-history/development/v1-4/g02/originals/%'
), candidate AS MATERIALIZED (
 SELECT original.source_record_id,
        replace(m.value[1],',','')::numeric/100 AS value_crore
 FROM original CROSS JOIN LATERAL regexp_match(original.fragment,
   'Revenue from operations[[:space:]]+([0-9,]+[.][0-9]{2})','i') m(value)
 WHERE original.fragment LIKE '%NSE Symbol%CGPOWER%'
   AND original.fragment LIKE '%Reporting Type%Quarterly%'
   AND original.fragment LIKE '%Reporting Quarter%First quarter%'
   AND original.fragment LIKE '%Nature of report standalone or consolidated%Consolidated%'
   AND original.fragment LIKE '%Amount in (Lakhs)%'
   AND original.fragment LIKE '%Date of end of reporting period%30-06-2026%'
), inserted AS (
 INSERT INTO public.fundamental_observations (
  security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
  period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
 SELECT s.id,'OPERATING_REVENUE_QUARTER',c.source_record_id,'NSE_OFFICIAL',
 c.value_crore,'INR','INR_CRORE','2026-06-30','QUARTER','CONSOLIDATED',
 now(),now()+interval '120 days','AVAILABLE'
 FROM candidate c JOIN public.securities s ON s.symbol='CGPOWER' AND s.asset_class='EQUITY'
 WHERE c.value_crore>=0 AND c.value_crore<100000000
 AND NOT EXISTS(
 SELECT 1 FROM public.fundamental_observations f
 WHERE f.security_id=s.id AND f.metric_code='OPERATING_REVENUE_QUARTER'
 AND f.period_end='2026-06-30' AND f.period_type='QUARTER' AND f.consolidation_scope='CONSOLIDATED')
 ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING
 RETURNING security_id,metric_code,numeric_value,period_end,source_record_id,source_code
)
SELECT * FROM inserted;