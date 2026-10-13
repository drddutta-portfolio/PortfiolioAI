-- Applied to PortfolioAI Development via supported Supabase migration 2026-10-11.
-- Restricted to the OWNER_NUMERIC_REVIEW kind actually approved by the
-- existing v14-reviewed-evidence.ts validator; the earlier proposed index
-- used DELEGATED_NUMERIC_REVIEW and did not cover this admission route.
CREATE UNIQUE INDEX IF NOT EXISTS v14_kvb_roa_owner_review_same_source_unique
ON public.research_evidence_requirement_reviews (source_record_id)
WHERE security_id='be55b3cc-0400-45af-84aa-2a95e2c361c5'
  AND requirement_code='ROA_ANNUAL'
  AND decision='ACCEPTED'
  AND review_kind='OWNER_NUMERIC_REVIEW';
-- Rollback (only if retiring this feature): DROP INDEX IF EXISTS public.v14_kvb_roa_owner_review_same_source_unique;
