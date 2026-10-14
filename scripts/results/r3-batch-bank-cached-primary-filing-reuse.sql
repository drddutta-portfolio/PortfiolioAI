-- Results R3: idempotent, cached original-iXBRL bank metrics reuse.
-- Scope: compact issuer primary-filing capture already stored in Development.
-- Do not change V1-4 decisions or selected observations. No provider calls.
-- Original file hash, quarter and accounting scope must be present. Captures
-- marked NOT_ADMITTED in V1-4 remain REVIEW PENDING on the Results UI.
-- Only unit-unambiguous EPS and NPA percentage fields are admitted; PAT is
-- deliberately excluded because the historic capture lacks a qualified unit.
WITH filing AS MATERIALIZED (
 SELECT DISTINCT ON (d.raw_payload->>'symbol', x->>'originalSha256',x->>'reportingQuarterEnd',x->>'consolidationLabel')
    d.raw_payload->>'symbol' symbol, x AS doc,
    x->>'originalSha256' original_sha, x->>'reportingQuarterEnd' period_label,
    to_date(x->>'reportingQuarterEnd','DD-MON-YYYY') period_end,
    upper(x->>'consolidationLabel') scope, x->>'originalUrl' source_url
 FROM public.data_source_records d CROSS JOIN LATERAL jsonb_array_elements(d.raw_payload->'filings') x
 WHERE d.source_code='COMPANY_EXCHANGE_FILING' AND d.record_kind='V1_4_BANK_PRIMARY_FILING_CAPTURE'
 AND x->>'type'='Integrated Filing- Financials'
 AND x->>'originalSha256' ~ '^[a-f0-9]{64}$'
 AND x->>'reportingQuarterEnd' ~ '^(30-JUN|30-SEP|31-DEC|31-MAR)-20[0-9]{2}$'
 AND upper(x->>'consolidationLabel') IN ('STANDALONE','CONSOLIDATED')
 AND x->>'originalUrl' LIKE 'https://nsearchives.nseindia.com/corporate/ixbrl/%'
 ORDER BY d.raw_payload->>'symbol',x->>'originalSha256',x->>'reportingQuarterEnd',x->>'consolidationLabel',x->>'broadcastDateLiteral' NULLS LAST
), values_raw AS MATERIALIZED (
 SELECT f.*, lower(cell->>1) label,cell->>2 raw_value,cell->>3 second_value,
 CASE WHEN lower(cell->>1)='diluted earnings per share after extraordinary items' AND extract(month FROM f.period_end)<>3
      THEN 'EPS_DILUTED'
      WHEN lower(cell->>1)='% of gross npas' THEN 'GROSS_NPA_PERCENT'
      WHEN lower(cell->>1)='% of net npas' THEN 'NET_NPA_PERCENT'
      ELSE NULL END metric_code
 FROM filing f CROSS JOIN LATERAL jsonb_array_elements(f.doc->'literalTableCells') cell
 WHERE jsonb_typeof(cell)='array'
), candidates AS MATERIALIZED (
 SELECT DISTINCT f.symbol,f.original_sha,f.period_end,f.scope,f.source_url,f.metric_code,
      replace(f.raw_value,',','')::numeric AS value,
      CASE WHEN f.metric_code='EPS_DILUTED' THEN 'INR_PER_SHARE' ELSE 'PERCENT' END unit
 FROM values_raw f
 WHERE f.metric_code IS NOT NULL
 AND f.raw_value=f.second_value
 AND replace(f.raw_value,',','') ~ '^[0-9]+([.][0-9]+)?$'
 AND replace(f.second_value,',','') ~ '^[0-9]+([.][0-9]+)?$'
), qualified AS MATERIALIZED (
 SELECT c.*,s.id security_id
 FROM candidates c JOIN public.securities s ON s.symbol=c.symbol AND s.asset_class='EQUITY'
 WHERE NOT EXISTS (
  SELECT 1 FROM candidates c2
  WHERE c2.symbol=c.symbol AND c2.period_end=c.period_end AND c2.scope=c.scope AND c2.metric_code=c.metric_code
  AND c2.value<>c.value
 )
 AND NOT EXISTS (
   SELECT 1 FROM public.fundamental_observations prior
   WHERE prior.security_id=s.id AND prior.period_type='QUARTER'
   AND prior.period_end=c.period_end AND prior.metric_code=c.metric_code
   AND prior.consolidation_scope=c.scope
 )
), manifest AS MATERIALIZED (
 SELECT DISTINCT symbol,original_sha,period_end,scope,source_url,
   jsonb_build_object(
    'source','Prior issuer-file capture, reused without another download',
    'symbol',symbol,'original_file_sha256',original_sha,'period_end',period_end,
    'consolidation_scope',scope,'source_url',source_url,
    'source_canonical_selection',false,'results_verification','REVIEW_PENDING',
    'original_bytes_retrieved_this_run',false,
    'original_file_unit_for_absolute_financials','NOT_PROVEN',
    'source_record_type','V1_4_BANK_PRIMARY_FILING_CAPTURE'
   ) payload
 FROM qualified
), new_source AS (
 INSERT INTO public.data_source_records
  (source_code,record_kind,external_record_id,payload_hash,raw_payload,source_url,terms_snapshot)
 SELECT 'COMPANY_EXCHANGE_FILING','RESULTS_QUARTERLY_BANK_CACHE_REUSE',
  m.symbol||':'||m.original_sha,
  encode(digest(m.payload::text,'sha256'),'hex'),
  m.payload,m.source_url,
  '{"retention":"COMPACT_ONLY","basis":"EXISTING_CACHED_PRIMARY_FILING","results_state":"REVIEW_PENDING"}'::jsonb
 FROM manifest m
 ON CONFLICT (source_code,record_kind,external_record_id,payload_hash) DO NOTHING
 RETURNING id,external_record_id
), original_source AS MATERIALIZED (
 SELECT r.id,r.external_record_id FROM public.data_source_records r
 WHERE r.source_code='COMPANY_EXCHANGE_FILING' AND r.record_kind='RESULTS_QUARTERLY_BANK_CACHE_REUSE'
 AND r.external_record_id IN (SELECT symbol||':'||original_sha FROM manifest)
 UNION ALL
 SELECT id,external_record_id FROM new_source
), observations AS (
 INSERT INTO public.fundamental_observations (
   security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
   period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
 SELECT q.security_id,q.metric_code,r.id,'COMPANY_EXCHANGE_FILING',
  q.value,'INR',q.unit,q.period_end,'QUARTER',q.scope,now(),
  now()+interval '120 days','AVAILABLE'
 FROM qualified q
 JOIN original_source r ON r.external_record_id=q.symbol||':'||q.original_sha
 ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING
 RETURNING security_id,metric_code,period_end
)
SELECT count(*) AS observations_inserted,
count(DISTINCT security_id) AS newly_covered_banks,
count(DISTINCT (security_id,period_end)) AS bank_quarter_pairs,
count(*) FILTER (WHERE metric_code='EPS_DILUTED') AS eps,
count(*) FILTER (WHERE metric_code='GROSS_NPA_PERCENT') AS gross_npa,
count(*) FILTER (WHERE metric_code='NET_NPA_PERCENT') AS net_npa
FROM observations;