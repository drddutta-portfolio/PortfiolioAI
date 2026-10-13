-- BANK V1-4 / Development only: atomic one-time execution-grant protections.
-- Does not mint grants, modify evidence, or change the active maintenance scheduler.
-- Existing index (source_code, record_kind, external_record_id, payload_hash)
-- is insufficient because mutable payload_hash permits duplicate logical grant IDs.
-- Precondition census (2026-10-11): 1,993 CONSUMED records, 1,993 distinct external_record_id.
DO $$
BEGIN
 IF EXISTS (
   SELECT 1 FROM public.data_source_records
   WHERE record_kind='P4_EXECUTION_GRANT_CONSUMED'
   GROUP BY external_record_id HAVING count(*)>1
 ) THEN RAISE EXCEPTION 'P4_GRANT_EXISTING_CONSUMPTION_DUPLICATES'; END IF;
 IF EXISTS (
   SELECT 1 FROM public.data_source_records
   WHERE source_code='OWNER_REVIEWED_CLASSIFICATION'
     AND record_kind='P4_EXECUTION_GRANT'
     AND external_record_id LIKE 'V14_KVB_OWNER_MATERIALIZER:%'
   GROUP BY external_record_id HAVING count(*)>1
 ) THEN RAISE EXCEPTION 'KVB_GRANT_REQUEST_DUPLICATES'; END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS v14_kvb_owner_grant_request_identity_unique
 ON public.data_source_records(external_record_id)
 WHERE source_code='OWNER_REVIEWED_CLASSIFICATION'
 AND record_kind='P4_EXECUTION_GRANT'
 AND external_record_id LIKE 'V14_KVB_OWNER_MATERIALIZER:%';
CREATE UNIQUE INDEX IF NOT EXISTS p4_grant_consumption_identity_unique
 ON public.data_source_records(external_record_id)
 WHERE source_code='OWNER_REVIEWED_CLASSIFICATION'
 AND record_kind='P4_EXECUTION_GRANT_CONSUMED';
