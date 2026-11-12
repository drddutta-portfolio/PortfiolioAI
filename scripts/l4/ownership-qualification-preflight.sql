-- L4 Development-only, read-only ownership qualification preflight.
-- Authority: latest research_evidence_snapshot_selections and immutable source records.
-- This file NEVER creates reviews, sets FRESH, or materializes READY.
-- Run in Supabase SQL editor against verified DEVELOPMENT project only.
-- Results are a candidate census, NOT an evidence-admission decision.
BEGIN TRANSACTION READ ONLY;

WITH latest AS (
  SELECT DISTINCT ON (portfolio_id, security_id)
    portfolio_id, security_id, snapshot_id
  FROM public.research_evidence_snapshot_selections
  ORDER BY portfolio_id, security_id, selected_at DESC, id DESC
),
candidates AS (
  SELECT l.portfolio_id,l.security_id,i.id,i.requirement_code,
         i.evidence_state,i.validation_state,i.reason_code,
         i.canonical_selection_state,i.normalized_value,
         r.id AS source_id,r.source_code,r.payload_hash,
         r.published_at,r.retrieved_at,r.raw_payload
  FROM latest l
  JOIN public.research_evidence_snapshot_items i ON i.snapshot_id=l.snapshot_id
  LEFT JOIN public.data_source_records r ON r.id=i.raw_source_record_id
  WHERE i.requirement_code IN ('OWNERSHIP_TREND_4Q','OWNERSHIP_GOVERNANCE')
    AND i.evidence_state='REVIEW_REQUIRED'
),
observations AS (
  SELECT c.id,c.requirement_code,k.key AS series_name,
         x.value->>'quarter' AS period_label,
         x.value->>'value' AS value_text,
         x.ordinality AS ordinal
  FROM candidates c
  CROSS JOIN LATERAL jsonb_each(
    CASE WHEN jsonb_typeof(c.normalized_value->'series')='object'
         THEN c.normalized_value->'series' ELSE '{}'::jsonb END
  ) k
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(k.value)='array' THEN k.value ELSE '[]'::jsonb END
  ) WITH ORDINALITY x(value, ordinality)
),
per_candidate AS (
  SELECT c.id,c.requirement_code,c.source_id,
         c.source_code,c.published_at,c.retrieved_at,c.payload_hash,
         c.raw_payload->>'security_id'=c.security_id::text AS identity_matches,
         c.raw_payload ? 'result' AS raw_result_retained,
         c.evidence_state,c.validation_state,c.reason_code,c.canonical_selection_state,
         COUNT(o.ordinal) AS observation_count,
         COUNT(o.ordinal) FILTER (
           WHERE o.period_label IS NULL OR o.value_text IS NULL
              OR o.period_label !~ '^(Mar|Jun|Sep|Dec) [0-9]{4}$'
              OR o.value_text !~ '^[0-9]+([.][0-9]+)?$'
         ) AS invalid_observations,
         COUNT(o.ordinal) FILTER (
           WHERE o.value_text ~ '^[0-9]+([.][0-9]+)?$'
             AND o.value_text::numeric > 100
         ) AS out_of_range_observations,
         COUNT(o.ordinal) FILTER (WHERE o.series_name='Promoter') AS promoter_count,
         COUNT(o.ordinal) FILTER (WHERE o.series_name='Institutional') AS institutional_count,
         COUNT(DISTINCT o.period_label) FILTER (WHERE o.series_name='Promoter') AS promoter_distinct_quarters,
         COUNT(DISTINCT o.period_label) FILTER (WHERE o.series_name='Institutional') AS institutional_distinct_quarters,
         COUNT(o.ordinal) FILTER (
           WHERE o.series_name='Promoter' AND o.period_label IS NOT NULL
             AND c.raw_payload->>'result' LIKE '%'||o.period_label||'%'
         ) AS promoter_labels_present_in_source
  FROM candidates c
  LEFT JOIN observations o ON o.id=c.id
  GROUP BY c.id,c.requirement_code,c.source_id,c.source_code,c.published_at,
           c.retrieved_at,c.payload_hash,c.raw_payload,c.security_id,
           c.evidence_state,c.validation_state,c.reason_code,c.canonical_selection_state
)
SELECT requirement_code,COUNT(*) AS candidates,
       SUM(observation_count) AS normalized_observations,
       SUM(invalid_observations) AS invalid_observations,
       SUM(out_of_range_observations) AS out_of_range_observations,
       COUNT(*) FILTER (WHERE source_id IS NOT NULL
         AND source_code='TRENDLYNE_MCP'
         AND payload_hash ~ '^[0-9a-f]{64}$'
         AND retrieved_at<=now()
         AND identity_matches AND raw_result_retained) AS source_identity_and_metadata_preflight,
       COUNT(*) FILTER (WHERE promoter_count>=4 AND institutional_count>=4
         AND promoter_distinct_quarters>=4 AND institutional_distinct_quarters>=4) AS minimum_distinct_quarters,
       COUNT(*) FILTER (WHERE promoter_labels_present_in_source=promoter_count) AS promoter_labels_in_retained_result,
       COUNT(*) FILTER (WHERE published_at IS NOT NULL) AS source_publication_timestamps,
       COUNT(*) FILTER (WHERE reason_code='NORMALIZED_INPUT_CONTRACT_NOT_PROVEN'
         AND validation_state='FAIL_CLOSED' AND canonical_selection_state='NO_SELECTION') AS fail_closed
FROM per_candidate
GROUP BY requirement_code
ORDER BY requirement_code;

-- Important: Source-text label checks are only presence checks.
-- DO NOT treat them as exact value replay, publication-time proof,
-- signed original document evidence, governance event evidence, or
-- source-authority/reviewer approval. Canonical admission remains separate.
COMMIT;
