\set ON_ERROR_STOP on
\pset pager off

BEGIN;

\echo ''
\echo '=== G9.2 · AUROPHARMA LOCAL CANONICAL RESEARCH ACTIVATION ==='
\echo 'LOCAL ONLY: reviewed PHARMA_V1 assignment + API Emerging secondary exposure.'
\echo 'Numeric scoring/recommendation/position sizing writes: 0'
\echo ''

DO $g92$
DECLARE
  v_security_id uuid;
  v_reviewer_id uuid;
  v_assignment_id uuid;
  v_assignment_count integer;
  v_secondary_count integer;
  v_torn_assignment_id uuid;
  v_reviewed_at timestamptz := '2026-09-20 01:30:00+05:30'::timestamptz;
BEGIN
  -- Hard local-fixture identity guard. Production AUROPHARMA must never satisfy this.
  SELECT id INTO v_security_id
  FROM public.securities
  WHERE upper(symbol) = 'AUROPHARMA'
    AND upper(exchange) = 'NSE'
    AND isin = 'INE406A01037'
    AND creation_source = 'LOCAL_G8_FIXTURE'
    AND is_active
  LIMIT 1;

  IF v_security_id IS NULL THEN
    RAISE EXCEPTION 'G9.2 local-only guard failed: expected LOCAL_G8_FIXTURE AUROPHARMA/NSE security.';
  END IF;

  SELECT id INTO v_reviewer_id
  FROM auth.users
  WHERE lower(email) = 'dr.d.dutta@gmail.com'
  LIMIT 1;

  IF v_reviewer_id IS NULL OR (
    SELECT count(*) FROM auth.users WHERE lower(email) = 'dr.d.dutta@gmail.com'
  ) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one local reviewer auth user dr.d.dutta@gmail.com.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.transactions t
    JOIN public.portfolios p ON p.id = t.portfolio_id
    WHERE t.security_id = v_security_id
      AND p.user_id = v_reviewer_id
      AND p.is_active
  ) THEN
    RAISE EXCEPTION 'Local reviewer does not own an active portfolio containing AUROPHARMA.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.research_subprofile_contracts
    WHERE parent_profile_code = 'PHARMA'
      AND parent_profile_version = 'PHARMA_V1'
      AND subprofile_code = 'GLOBAL_GENERICS'
      AND subprofile_version = 'GLOBAL_GENERICS_V1'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.research_subprofile_contracts
    WHERE parent_profile_code = 'PHARMA'
      AND parent_profile_version = 'PHARMA_V1'
      AND subprofile_code = 'API_BULK_DRUGS'
      AND subprofile_version = 'API_BULK_DRUGS_V1'
  ) THEN
    RAISE EXCEPTION 'Required G9.2 PHARMA_V1 contracts are unavailable.';
  END IF;

  -- TORNTPHARM is the existing local Pharma reference and must stay untouched.
  SELECT a.id INTO v_torn_assignment_id
  FROM public.research_subprofile_assignments a
  JOIN public.securities s ON s.id = a.security_id
  WHERE upper(s.symbol) = 'TORNTPHARM'
    AND upper(s.exchange) = 'NSE'
    AND a.parent_profile_code = 'PHARMA'
    AND a.parent_profile_version = 'PHARMA_V1'
    AND a.subprofile_code = 'DOMESTIC_FORMULATIONS'
    AND a.assignment_status = 'REVIEWED'
    AND a.effective_to IS NULL
  LIMIT 1;

  IF v_torn_assignment_id IS NULL THEN
    RAISE EXCEPTION 'Validated local TORNTPHARM reviewed Primary assignment is required before G9.2.';
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
    RAISE EXCEPTION 'Validated local TORNTPHARM Global Generics Material Overlay is required before G9.2.';
  END IF;

  SELECT count(*) INTO v_assignment_count
  FROM public.research_subprofile_assignments
  WHERE security_id = v_security_id
    AND parent_profile_code = 'PHARMA';

  IF v_assignment_count = 0 THEN
    INSERT INTO public.research_subprofile_assignments (
      security_id,
      parent_profile_code,
      parent_profile_version,
      subprofile_code,
      subprofile_version,
      assignment_status,
      confidence_state,
      assignment_basis,
      source_reference,
      source_record_id,
      effective_from,
      effective_to,
      reviewed_by,
      reviewed_at,
      created_by
    ) VALUES (
      v_security_id,
      'PHARMA',
      'PHARMA_V1',
      'GLOBAL_GENERICS',
      'GLOBAL_GENERICS_V1',
      'REVIEWED',
      'HIGH',
      'G9_2_LOCAL_OWNER_VALIDATED_CANONICAL_ACTIVATION',
      'AUROPHARMA_G8_1_CLASSIFICATION_EVIDENCE_LOCK_V1',
      NULL,
      '2026-03-31 00:00:00+00'::timestamptz,
      NULL,
      v_reviewer_id,
      v_reviewed_at,
      v_reviewer_id
    )
    RETURNING id INTO v_assignment_id;
  ELSIF v_assignment_count = 1 THEN
    SELECT id INTO v_assignment_id
    FROM public.research_subprofile_assignments
    WHERE security_id = v_security_id
      AND parent_profile_code = 'PHARMA'
      AND parent_profile_version = 'PHARMA_V1'
      AND subprofile_code = 'GLOBAL_GENERICS'
      AND subprofile_version = 'GLOBAL_GENERICS_V1'
      AND assignment_status = 'REVIEWED'
      AND confidence_state = 'HIGH'
      AND assignment_basis = 'G9_2_LOCAL_OWNER_VALIDATED_CANONICAL_ACTIVATION'
      AND source_reference = 'AUROPHARMA_G8_1_CLASSIFICATION_EVIDENCE_LOCK_V1'
      AND effective_from = '2026-03-31 00:00:00+00'::timestamptz
      AND effective_to IS NULL
      AND reviewed_by = v_reviewer_id
      AND reviewed_at = v_reviewed_at
      AND created_by = v_reviewer_id;

    IF v_assignment_id IS NULL THEN
      RAISE EXCEPTION 'Existing AUROPHARMA PHARMA assignment conflicts with the reviewed G9.2 activation decision.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Expected zero or one exact AUROPHARMA PHARMA assignment; found %.', v_assignment_count;
  END IF;

  -- Biosimilars must remain unresolved and therefore absent from active reviewed authority.
  IF EXISTS (
    SELECT 1
    FROM public.research_subprofile_assignments
    WHERE security_id = v_security_id
      AND parent_profile_code = 'PHARMA'
      AND subprofile_code = 'BIOPHARMA_BIOSIMILARS'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'BIOPHARMA_BIOSIMILARS must not exist as an active reviewed AUROPHARMA Primary assignment.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_assignment_id
      AND subprofile_code <> 'API_BULK_DRUGS'
  ) THEN
    RAISE EXCEPTION 'Unexpected AUROPHARMA secondary exposure exists before G9.2 activation.';
  END IF;

  INSERT INTO public.research_subprofile_secondary_exposures (
    assignment_id,
    parent_profile_code,
    parent_profile_version,
    subprofile_code,
    subprofile_version,
    materiality_state,
    evidence_basis,
    source_reference,
    assignment_status,
    confidence_state,
    effective_from,
    effective_to,
    reason_code,
    reviewed_by,
    reviewed_at
  )
  SELECT
    v_assignment_id,
    'PHARMA',
    'PHARMA_V1',
    'API_BULK_DRUGS',
    'API_BULK_DRUGS_V1',
    'EMERGING',
    'FY25/FY26 reviewed consolidated API revenue share remains above the Emerging lower bound and below the Material Overlay threshold.',
    'AUROPHARMA_G8_1_CLASSIFICATION_EVIDENCE_LOCK_V1',
    'REVIEWED',
    'HIGH',
    '2026-03-31 00:00:00+00'::timestamptz,
    NULL,
    'G8_1_REVIEWED_API_EMERGING_ECONOMIC_SHARE',
    v_reviewer_id,
    v_reviewed_at
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_assignment_id
      AND subprofile_code = 'API_BULK_DRUGS'
      AND subprofile_version = 'API_BULK_DRUGS_V1'
  );

  SELECT count(*) INTO v_secondary_count
  FROM public.research_subprofile_secondary_exposures
  WHERE assignment_id = v_assignment_id;

  IF v_secondary_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one AUROPHARMA reviewed secondary exposure; found %.', v_secondary_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_assignment_id
      AND subprofile_code = 'BIOPHARMA_BIOSIMILARS'
      AND assignment_status = 'REVIEWED'
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'BIOPHARMA_BIOSIMILARS must not exist as an active reviewed AUROPHARMA secondary exposure.';
  END IF;

  -- Persistence-layer isolation: same subprofile name, separate security/assignment authority and role.
  IF v_assignment_id = v_torn_assignment_id THEN
    RAISE EXCEPTION 'AUROPHARMA and TORNTPHARM must never share the same assignment id.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.research_subprofile_secondary_exposures
    WHERE assignment_id = v_assignment_id
      AND subprofile_code = 'GLOBAL_GENERICS'
  ) THEN
    RAISE EXCEPTION 'AUROPHARMA Global Generics Primary must not also exist as its own secondary exposure.';
  END IF;

  RAISE NOTICE 'LOCAL ONLY: AUROPHARMA G9.2 canonical assignment resolved as %, TORNTPHARM assignment remains %.', v_assignment_id, v_torn_assignment_id;
END
$g92$;

\echo ''
\echo '=== G9.2 POST-PERSISTENCE ASSERTION VIEW ==='

SELECT
  s.symbol,
  a.id AS assignment_id,
  a.subprofile_code AS primary_subprofile,
  a.assignment_status,
  a.confidence_state,
  a.effective_from,
  se.subprofile_code AS secondary_subprofile,
  se.materiality_state,
  se.assignment_status AS secondary_status
FROM public.research_subprofile_assignments a
JOIN public.securities s ON s.id = a.security_id
LEFT JOIN public.research_subprofile_secondary_exposures se ON se.assignment_id = a.id
WHERE upper(s.symbol) IN ('TORNTPHARM', 'AUROPHARMA')
  AND a.parent_profile_code = 'PHARMA'
  AND a.assignment_status = 'REVIEWED'
  AND a.effective_to IS NULL
ORDER BY s.symbol, se.subprofile_code;

COMMIT;

\echo ''
\echo 'G9.2 local canonical persistence: COMMITTED'
\echo 'Production write: 0'
\echo 'Score/recommendation/position-sizing writes: 0'
