\set ON_ERROR_STOP on
\pset pager off

BEGIN READ ONLY;

\echo ''
\echo '=== G9.3 · PHARMA_V1 PERSISTED-DATA ISOLATION REGRESSION ==='

DO $g93$
DECLARE
  v_torn_security_id uuid;
  v_auro_security_id uuid;
  v_torn_assignment_id uuid;
  v_auro_assignment_id uuid;
BEGIN
  SELECT id INTO v_torn_security_id
  FROM public.securities
  WHERE upper(symbol) = 'TORNTPHARM' AND upper(exchange) = 'NSE'
  LIMIT 1;

  SELECT id INTO v_auro_security_id
  FROM public.securities
  WHERE upper(symbol) = 'AUROPHARMA'
    AND upper(exchange) = 'NSE'
    AND creation_source = 'LOCAL_G8_FIXTURE'
  LIMIT 1;

  IF v_torn_security_id IS NULL OR v_auro_security_id IS NULL THEN
    RAISE EXCEPTION 'G9.3 requires both local Pharma reference securities.';
  END IF;

  SELECT id INTO v_torn_assignment_id
  FROM public.research_subprofile_assignments
  WHERE security_id = v_torn_security_id
    AND parent_profile_code = 'PHARMA'
    AND parent_profile_version = 'PHARMA_V1'
    AND subprofile_code = 'DOMESTIC_FORMULATIONS'
    AND assignment_status = 'REVIEWED'
    AND effective_to IS NULL
  LIMIT 1;

  SELECT id INTO v_auro_assignment_id
  FROM public.research_subprofile_assignments
  WHERE security_id = v_auro_security_id
    AND parent_profile_code = 'PHARMA'
    AND parent_profile_version = 'PHARMA_V1'
    AND subprofile_code = 'GLOBAL_GENERICS'
    AND assignment_status = 'REVIEWED'
    AND effective_to IS NULL
  LIMIT 1;

  IF v_torn_assignment_id IS NULL THEN
    RAISE EXCEPTION 'TORNTPHARM reviewed Domestic Primary assignment missing.';
  END IF;

  IF v_auro_assignment_id IS NULL THEN
    RAISE EXCEPTION 'AUROPHARMA reviewed Global Generics Primary assignment missing.';
  END IF;

  IF v_torn_assignment_id = v_auro_assignment_id THEN
    RAISE EXCEPTION 'Cross-company assignment identity leakage detected.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_torn_assignment_id
      AND subprofile_code = 'GLOBAL_GENERICS'
      AND materiality_state = 'MATERIAL'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'TORNTPHARM Global Generics Material Overlay missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_torn_assignment_id
      AND subprofile_code = 'CDMO_CRAMS'
      AND materiality_state = 'EMERGING'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'TORNTPHARM CDMO Emerging Watch missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_auro_assignment_id
      AND subprofile_code = 'API_BULK_DRUGS'
      AND materiality_state = 'EMERGING'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'AUROPHARMA API Emerging Watch missing.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_auro_assignment_id
      AND subprofile_code = 'GLOBAL_GENERICS'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'AUROPHARMA Global Generics Primary leaked into secondary authority.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_auro_assignment_id
      AND subprofile_code = 'API_BULK_DRUGS'
      AND materiality_state = 'MATERIAL'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'AUROPHARMA API Emerging exposure was promoted to Material.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.research_subprofile_assignments
    WHERE security_id = v_auro_security_id
      AND subprofile_code = 'BIOPHARMA_BIOSIMILARS'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_auro_assignment_id
      AND subprofile_code = 'BIOPHARMA_BIOSIMILARS'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'AUROPHARMA Biosimilars must remain absent from active reviewed authority.';
  END IF;

  RAISE NOTICE 'G9.3 persisted-data isolation regression: PASS';
END
$g93$;

ROLLBACK;

\echo 'Read-only regression complete · database writes: 0'
