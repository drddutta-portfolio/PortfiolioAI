-- REVIEW ONLY. Not applied; generate a versioned Supabase migration after owner approval.
-- Development project lrgpjimipfkyoqbpsqzz only.
-- Existing financial source records and DELETE operations remain immutable.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
    WHERE t.tgrelid='public.data_source_records'::regclass
      AND t.tgname='data_source_records_immutable'
      AND t.tgfoid='public.portfolioai_reject_stage7_evidence_mutation()'::regprocedure
      AND t.tgenabled='O'
  ) THEN RAISE EXCEPTION 'Expected immutable-evidence guard is not installed'; END IF;
END $$;

CREATE FUNCTION public.portfolioai_guard_source_record_archive_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path=''
AS $$
DECLARE
  expected_index jsonb;
  reference jsonb;
  expected_key text;
BEGIN
  IF TG_OP <> 'UPDATE'
     OR current_user NOT IN ('postgres','service_role')
     OR pg_catalog.current_setting('portfolioai.storage_archive_mode',true)
          IS DISTINCT FROM 'R4_PRIVATE_R2_20261105_V1'
  THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Stage 7 provider evidence is immutable.'; END IF;

  IF OLD.source_code IS DISTINCT FROM 'COMPANY_EXCHANGE_FILING'
     OR OLD.record_kind NOT IN ('RESULTS_R4_BSE_DATED_PDF_REVIEW_V1','RESULTS_R4_DATED_OCR_HEADER_DIAGNOSTIC_V1')
     OR OLD.raw_payload->'diagnostic_only' IS DISTINCT FROM 'true'::jsonb
     OR OLD.raw_payload->>'contract' IS DISTINCT FROM OLD.record_kind
     OR OLD.raw_payload ? 'archive_reference'
     OR (pg_catalog.to_jsonb(NEW)-'raw_payload') IS DISTINCT FROM (pg_catalog.to_jsonb(OLD)-'raw_payload')
     OR EXISTS (SELECT 1 FROM public.fundamental_observations o WHERE o.source_record_id=OLD.id)
  THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Financial/source identities remain immutable.'; END IF;

  IF OLD.record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' THEN
    IF pg_catalog.jsonb_typeof(OLD.raw_payload->'all_sources') IS DISTINCT FROM 'array'
    THEN RAISE EXCEPTION 'Invalid diagnostic source inventory'; END IF;
    expected_index=pg_catalog.jsonb_set(OLD.raw_payload,'{all_sources}',
      (SELECT coalesce(pg_catalog.jsonb_agg(x.value-'header_layouts'-'basis_excerpts' ORDER BY x.ordinality),'[]'::jsonb)
       FROM pg_catalog.jsonb_array_elements(OLD.raw_payload->'all_sources') WITH ORDINALITY x(value,ordinality)));
    expected_key='portfolioai-results/development/v1/quarterly/bse-dated-pdf-review/sha256='||OLD.payload_hash||'/capture.json';
  ELSE
    expected_index=OLD.raw_payload-ARRAY['rows','date_header_candidates','labels_without_amounts','metric_row_geometry','native_fonts','native_unit_spans'];
    expected_key='portfolioai-results/development/v1/quarterly/ocr-header-diagnostics/sha256='||OLD.payload_hash||'/diagnostic.json';
  END IF;
  reference=NEW.raw_payload->'archive_reference';
  IF (NEW.raw_payload-'archive_reference') IS DISTINCT FROM expected_index
     OR pg_catalog.jsonb_typeof(reference) IS DISTINCT FROM 'object'
     OR reference->>'contract' IS DISTINCT FROM 'RESULTS_R4_PRIVATE_R2_PAYLOAD_ARCHIVE_V1'
     OR reference->>'bucket' IS DISTINCT FROM 'portfolioai-history-dev'
     OR reference->>'r2_key' IS DISTINCT FROM expected_key
     OR reference->>'original_payload_sha256' IS DISTINCT FROM OLD.payload_hash
     OR coalesce(reference->>'index_sha256','') !~ '^[a-f0-9]{64}$'
     OR pg_catalog.jsonb_typeof(reference->'original_bytes') IS DISTINCT FROM 'number'
     OR coalesce(reference->>'original_bytes','') !~ '^[1-9][0-9]{0,7}$'
     OR (reference-ARRAY['contract','bucket','r2_key','original_payload_sha256','original_bytes','index_sha256']) IS DISTINCT FROM '{}'::jsonb
  THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Exact private R2 archival index required.'; END IF;
  -- The privileged archival job must verify R2 bytes/hash and retain its plan before this update.
  -- Every read-through consumer independently rechecks original bytes, index hash and exact context.
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.portfolioai_guard_source_record_archive_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portfolioai_guard_source_record_archive_v1() TO postgres,service_role;
CREATE OR REPLACE TRIGGER data_source_records_immutable
BEFORE DELETE OR UPDATE ON public.data_source_records
FOR EACH ROW EXECUTE FUNCTION public.portfolioai_guard_source_record_archive_v1();
COMMIT;
