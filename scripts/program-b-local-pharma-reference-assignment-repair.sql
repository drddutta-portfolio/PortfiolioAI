\set ON_ERROR_STOP on
\pset pager off

BEGIN;

DO $program_b_c1$
DECLARE
  v_reviewer_id uuid;
  v_security_id uuid;
  v_assignment_id uuid;
  v_existing_count integer;
  v_inserted integer := 0;
  v_reused integer := 0;
  v_reference record;
  v_exposure record;
  v_reviewed_at constant timestamptz := '2026-09-24 00:00:00+05:30';
BEGIN
  -- The shell runner requires the exact local CLI database URL. PostgreSQL sees
  -- the Docker network address internally, so fixture provenance provides the
  -- second independent guard inside the transaction.
  IF current_database() <> 'postgres' THEN
    RAISE EXCEPTION 'Program B C1 refuses to run outside the local Supabase database.';
  END IF;

  SELECT id INTO v_reviewer_id
  FROM auth.users
  WHERE lower(email) = 'dr.d.dutta@gmail.com';

  IF v_reviewer_id IS NULL OR (
    SELECT count(*) FROM auth.users WHERE lower(email) = 'dr.d.dutta@gmail.com'
  ) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one local owner/reviewer account.';
  END IF;

  FOR v_reference IN
    SELECT * FROM (VALUES
      ('BIOCON', 'INE376G01013', 'LOCAL_G10_3_FIXTURE', 'BIOPHARMA_BIOSIMILARS', 'BIOPHARMA_BIOSIMILARS_V1', 'BIOCON_G10_3_BIOPHARMA_BIOSIMILARS_CLASSIFICATION_LOCK_V1', 'G10_3_OWNER_APPROVED_CLASSIFICATION_LOCK'),
      ('SYNGENE', 'INE398R01022', 'LOCAL_G10_4_FIXTURE', 'CDMO_CRAMS', 'CDMO_CRAMS_V1', 'SYNGENE_G10_4_CDMO_CRAMS_CLASSIFICATION_LOCK_V1', 'G10_4_OWNER_APPROVED_CLASSIFICATION_LOCK')
    ) AS x(symbol, isin, creation_source, primary_code, primary_version, source_reference, assignment_basis)
  LOOP
    SELECT id INTO v_security_id
    FROM public.securities
    WHERE upper(symbol) = v_reference.symbol
      AND upper(exchange) = 'NSE'
      AND isin = v_reference.isin
      AND creation_source = v_reference.creation_source
      AND is_active;

    IF v_security_id IS NULL THEN
      RAISE EXCEPTION 'Exact guarded local identity missing for %.', v_reference.symbol;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.research_subprofile_contracts
      WHERE parent_profile_code = 'PHARMA'
        AND parent_profile_version = 'PHARMA_V1'
        AND subprofile_code = v_reference.primary_code
        AND subprofile_version = v_reference.primary_version
    ) THEN
      RAISE EXCEPTION 'Required PHARMA_V1 contract missing for %.', v_reference.primary_code;
    END IF;

    SELECT count(*) INTO v_existing_count
    FROM public.research_subprofile_assignments
    WHERE security_id = v_security_id
      AND parent_profile_code = 'PHARMA'
      AND effective_to IS NULL;

    IF v_existing_count = 0 THEN
      INSERT INTO public.research_subprofile_assignments (
        security_id, parent_profile_code, parent_profile_version,
        subprofile_code, subprofile_version, assignment_status,
        confidence_state, assignment_basis, source_reference,
        effective_from, effective_to, reviewed_by, reviewed_at, created_by
      ) VALUES (
        v_security_id, 'PHARMA', 'PHARMA_V1',
        v_reference.primary_code, v_reference.primary_version, 'REVIEWED',
        'HIGH', v_reference.assignment_basis, v_reference.source_reference,
        '2026-03-31 00:00:00+00', NULL, v_reviewer_id, v_reviewed_at, v_reviewer_id
      ) RETURNING id INTO v_assignment_id;
      v_inserted := v_inserted + 1;
    ELSIF v_existing_count = 1 THEN
      SELECT id INTO v_assignment_id
      FROM public.research_subprofile_assignments
      WHERE security_id = v_security_id
        AND parent_profile_code = 'PHARMA'
        AND parent_profile_version = 'PHARMA_V1'
        AND subprofile_code = v_reference.primary_code
        AND subprofile_version = v_reference.primary_version
        AND assignment_status = 'REVIEWED'
        AND confidence_state = 'HIGH'
        AND assignment_basis = v_reference.assignment_basis
        AND source_reference = v_reference.source_reference
        AND effective_from = '2026-03-31 00:00:00+00'
        AND effective_to IS NULL;
      IF v_assignment_id IS NULL THEN
        RAISE EXCEPTION 'Conflicting active Pharma assignment exists for %.', v_reference.symbol;
      END IF;
      v_reused := v_reused + 1;
    ELSE
      RAISE EXCEPTION 'Multiple active Pharma assignments exist for %.', v_reference.symbol;
    END IF;

    IF v_reference.symbol = 'BIOCON' THEN
      FOR v_exposure IN
        SELECT * FROM (VALUES
          ('CDMO_CRAMS', 'CDMO_CRAMS_V1', 'MATERIAL', 'G10_3_REVIEWED_CRDMO_MATERIAL_OVERLAY'),
          ('GLOBAL_GENERICS', 'GLOBAL_GENERICS_V1', 'MATERIAL', 'G10_3_REVIEWED_GENERICS_MATERIAL_OVERLAY')
        ) AS e(code, version, materiality, reason_code)
      LOOP
        IF NOT EXISTS (
          SELECT 1 FROM public.research_subprofile_contracts
          WHERE parent_profile_code = 'PHARMA'
            AND parent_profile_version = 'PHARMA_V1'
            AND subprofile_code = v_exposure.code
            AND subprofile_version = v_exposure.version
        ) THEN
          RAISE EXCEPTION 'Required overlay contract missing for %.', v_exposure.code;
        END IF;

        IF EXISTS (
          SELECT 1 FROM public.research_subprofile_secondary_exposures
          WHERE assignment_id = v_assignment_id
            AND subprofile_code = v_exposure.code
            AND NOT (
              subprofile_version = v_exposure.version
              AND materiality_state = v_exposure.materiality
              AND assignment_status = 'REVIEWED'
              AND effective_to IS NULL
            )
        ) THEN
          RAISE EXCEPTION 'Conflicting BIOCON secondary exposure exists for %.', v_exposure.code;
        END IF;

        INSERT INTO public.research_subprofile_secondary_exposures (
          assignment_id, parent_profile_code, parent_profile_version,
          subprofile_code, subprofile_version, materiality_state,
          evidence_basis, source_reference, assignment_status,
          confidence_state, effective_from, effective_to, reason_code,
          reviewed_by, reviewed_at
        )
        SELECT
          v_assignment_id, 'PHARMA', 'PHARMA_V1',
          v_exposure.code, v_exposure.version, v_exposure.materiality,
          'Gate J G10.3 owner-approved classification lock.', v_reference.source_reference,
          'REVIEWED', 'HIGH', '2026-03-31 00:00:00+00', NULL,
          v_exposure.reason_code, v_reviewer_id, v_reviewed_at
        WHERE NOT EXISTS (
          SELECT 1 FROM public.research_subprofile_secondary_exposures
          WHERE assignment_id = v_assignment_id
            AND subprofile_code = v_exposure.code
            AND subprofile_version = v_exposure.version
        );
      END LOOP;
    ELSIF EXISTS (
      SELECT 1 FROM public.research_subprofile_secondary_exposures
      WHERE assignment_id = v_assignment_id
    ) THEN
      RAISE EXCEPTION 'SYNGENE must not have a reviewed secondary exposure in the G10.4 lock.';
    END IF;
  END LOOP;

  RAISE NOTICE 'Program B C1 local repair: assignments inserted %, reused %.', v_inserted, v_reused;
END
$program_b_c1$;

SELECT s.symbol, s.exchange, s.isin, a.id AS assignment_id,
       a.parent_profile_version AS methodology, a.subprofile_code AS primary_subprofile,
       a.assignment_status, a.effective_from, a.effective_to,
       coalesce(array_agg(se.subprofile_code ORDER BY se.subprofile_code)
         FILTER (WHERE se.id IS NOT NULL), ARRAY[]::text[]) AS secondary_exposures
FROM public.securities s
JOIN public.research_subprofile_assignments a ON a.security_id = s.id
LEFT JOIN public.research_subprofile_secondary_exposures se ON se.assignment_id = a.id
WHERE s.symbol IN ('TORNTPHARM', 'ALIVUS', 'AUROPHARMA', 'BIOCON', 'SYNGENE')
  AND a.parent_profile_version = 'PHARMA_V1'
  AND a.assignment_status = 'REVIEWED'
  AND a.effective_to IS NULL
GROUP BY s.symbol, s.exchange, s.isin, a.id, a.parent_profile_version,
         a.subprofile_code, a.assignment_status, a.effective_from, a.effective_to
ORDER BY s.symbol;

COMMIT;
