-- BANK V1-4 append-only numeric ROA source deduplication.
-- Scoped to KVB FY2025-26 accepted delegated numeric reviews, not the wider ledger.
-- Verify no existing duplicates before creating the index.
DO $$
BEGIN
 IF EXISTS (
  SELECT 1 FROM public.research_evidence_requirement_reviews
  WHERE security_id='be55b3cc-0400-45af-84aa-2a95e2c361c5'
    AND requirement_code='ROA_ANNUAL' AND decision='ACCEPTED'
    AND review_kind='DELEGATED_NUMERIC_REVIEW'
  GROUP BY source_record_id HAVING count(*)>1
 ) THEN RAISE EXCEPTION 'KVB_ROA_EXISTING_REVIEW_DUPLICATES'; END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS v14_kvb_roa_same_source_append_once
 ON public.research_evidence_requirement_reviews(source_record_id)
 WHERE security_id='be55b3cc-0400-45af-84aa-2a95e2c361c5'
 AND requirement_code='ROA_ANNUAL'
 AND decision='ACCEPTED'
 AND review_kind='DELEGATED_NUMERIC_REVIEW';
