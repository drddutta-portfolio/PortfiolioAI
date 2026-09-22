\set ON_ERROR_STOP on
\pset pager off

BEGIN;

\echo ''
\echo '=== G10.1 CHECKPOINT B · ALIVUS LOCAL REVIEWED ASSIGNMENT ==='
\echo 'LOCAL ONLY: owner-locked API Primary + CDMO Emerging Watch.'
\echo 'Score/recommendation persistence writes: 0'
\echo ''

DO $g101b$
DECLARE
  v_security_id uuid;
  v_reviewer_id uuid;
  v_assignment_id uuid;
  v_assignment_count integer;
  v_reviewed_at timestamptz := '2026-09-21 10:12:00+05:30'::timestamptz;
BEGIN
  SELECT id INTO v_security_id
  FROM public.securities
  WHERE upper(symbol) = 'ALIVUS'
    AND upper(exchange) = 'NSE'
    AND isin = 'INE03Q201024'
    AND is_active
  LIMIT 1;

  IF v_security_id IS NULL THEN
    RAISE EXCEPTION 'G10.1 Checkpoint B requires the local ALIVUS Research target fixture first.';
  END IF;

  SELECT id INTO v_reviewer_id
  FROM auth.users
  WHERE lower(email) = 'dr.d.dutta@gmail.com'
  LIMIT 1;

  IF v_reviewer_id IS NULL OR (
    SELECT count(*) FROM auth.users WHERE lower(email) = 'dr.d.dutta@gmail.com'
  ) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one local owner/reviewer auth user.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.research_subprofile_contracts
    WHERE parent_profile_code = 'PHARMA'
      AND parent_profile_version = 'PHARMA_V1'
      AND subprofile_code = 'API_BULK_DRUGS'
      AND subprofile_version = 'API_BULK_DRUGS_V1'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.research_subprofile_contracts
    WHERE parent_profile_code = 'PHARMA'
      AND parent_profile_version = 'PHARMA_V1'
      AND subprofile_code = 'CDMO_CRAMS'
      AND subprofile_version = 'CDMO_CRAMS_V1'
  ) THEN
    RAISE EXCEPTION 'Required PHARMA_V1 API/CDMO contracts are unavailable locally.';
  END IF;

  SELECT count(*) INTO v_assignment_count
  FROM public.research_subprofile_assignments
  WHERE security_id = v_security_id
    AND parent_profile_code = 'PHARMA'
    AND effective_to IS NULL;

  IF v_assignment_count = 0 THEN
    INSERT INTO public.research_subprofile_assignments (
      security_id, parent_profile_code, parent_profile_version,
      subprofile_code, subprofile_version, assignment_status,
      confidence_state, assignment_basis, source_reference, source_record_id,
      effective_from, effective_to, reviewed_by, reviewed_at, created_by
    ) VALUES (
      v_security_id, 'PHARMA', 'PHARMA_V1',
      'API_BULK_DRUGS', 'API_BULK_DRUGS_V1', 'REVIEWED',
      'HIGH', 'G10_1_OWNER_VALIDATED_CLASSIFICATION_LOCK',
      'ALIVUS_G10_1_API_CLASSIFICATION_LOCK_V1', NULL,
      '2026-03-31 00:00:00+00'::timestamptz, NULL,
      v_reviewer_id, v_reviewed_at, v_reviewer_id
    ) RETURNING id INTO v_assignment_id;
  ELSIF v_assignment_count = 1 THEN
    SELECT id INTO v_assignment_id
    FROM public.research_subprofile_assignments
    WHERE security_id = v_security_id
      AND parent_profile_code = 'PHARMA'
      AND parent_profile_version = 'PHARMA_V1'
      AND subprofile_code = 'API_BULK_DRUGS'
      AND subprofile_version = 'API_BULK_DRUGS_V1'
      AND assignment_status = 'REVIEWED'
      AND confidence_state = 'HIGH'
      AND source_reference = 'ALIVUS_G10_1_API_CLASSIFICATION_LOCK_V1'
      AND effective_to IS NULL;

    IF v_assignment_id IS NULL THEN
      RAISE EXCEPTION 'Existing ALIVUS active Pharma assignment conflicts with the G10.1 classification lock.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Expected zero or one active ALIVUS Pharma assignment; found %.', v_assignment_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_assignment_id
      AND subprofile_code <> 'CDMO_CRAMS'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'Unexpected ALIVUS active secondary exposure exists.';
  END IF;

  INSERT INTO public.research_subprofile_secondary_exposures (
    assignment_id, parent_profile_code, parent_profile_version,
    subprofile_code, subprofile_version, materiality_state, evidence_basis,
    source_reference, assignment_status, confidence_state,
    effective_from, effective_to, reason_code, reviewed_by, reviewed_at
  )
  SELECT
    v_assignment_id, 'PHARMA', 'PHARMA_V1',
    'CDMO_CRAMS', 'CDMO_CRAMS_V1', 'EMERGING',
    'Issuer-disclosed CDMO business mix is 6% in FY25 and 7% in FY26: above Emerging lower bound, below Material Overlay threshold.',
    'ALIVUS_G10_1_API_CLASSIFICATION_LOCK_V1', 'REVIEWED', 'HIGH',
    '2026-03-31 00:00:00+00'::timestamptz, NULL,
    'G10_1_CDMO_EMERGING_6_TO_7_PERCENT', v_reviewer_id, v_reviewed_at
  WHERE NOT EXISTS (
    SELECT 1 FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_assignment_id
      AND subprofile_code = 'CDMO_CRAMS'
      AND effective_to IS NULL
  );

  IF (
    SELECT count(*) FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_assignment_id AND effective_to IS NULL
  ) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active ALIVUS secondary exposure.';
  END IF;
END
$g101b$;

SELECT
  s.symbol,
  a.subprofile_code AS primary_subprofile,
  a.assignment_status,
  a.confidence_state,
  se.subprofile_code AS secondary_subprofile,
  se.materiality_state,
  se.assignment_status AS secondary_status
FROM public.research_subprofile_assignments a
JOIN public.securities s ON s.id = a.security_id
LEFT JOIN public.research_subprofile_secondary_exposures se ON se.assignment_id = a.id
WHERE upper(s.symbol) = 'ALIVUS'
  AND a.parent_profile_code = 'PHARMA'
  AND a.assignment_status = 'REVIEWED'
  AND a.effective_to IS NULL;

COMMIT;

\echo ''
\echo 'G10.1 Checkpoint B local assignment: COMMITTED'
\echo 'Production write: 0'
\echo 'Score/recommendation persistence writes: 0'
