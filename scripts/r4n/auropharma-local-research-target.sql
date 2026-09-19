\set ON_ERROR_STOP on
\pset pager off

BEGIN;

\echo ''
\echo '=== G8 PRE-REQUISITE · AUROPHARMA LOCAL RESEARCH TARGET ==='
\echo 'Local-only scope: canonical security + NSE listing + one synthetic opening-position ownership link.'
\echo 'Research evidence writes: 0'
\echo ''

DO $fixture$
DECLARE
  v_target_portfolio_count integer;
  v_portfolio_id uuid;
  v_security_id uuid;
  v_torntpharm_sector_id uuid;
  v_hdfc_before numeric;
  v_torntpharm_before numeric;
  v_hdfc_after numeric;
  v_torntpharm_after numeric;
  v_conflicting_isin_count integer;
  v_primary_listing_conflict_count integer;
BEGIN
  /*
   * Local-development guard:
   * target only the one ordinary local portfolio that currently holds BOTH
   * HDFCBANK and TORNTPHARM. This is intentionally not a generic portfolio seed.
   */
  SELECT count(*), min(candidate.portfolio_id::text)::uuid
  INTO v_target_portfolio_count, v_portfolio_id
  FROM (
    SELECT ch.portfolio_id
    FROM public.current_holdings ch
    JOIN public.securities s ON s.id = ch.security_id
    WHERE ch.current_quantity > 0
      AND s.symbol IN ('HDFCBANK', 'TORNTPHARM')
    GROUP BY ch.portfolio_id
    HAVING count(DISTINCT s.symbol) = 2
  ) candidate;

  IF v_target_portfolio_count <> 1 OR v_portfolio_id IS NULL THEN
    RAISE EXCEPTION 'LOCAL_FIXTURE_TARGET_PORTFOLIO_NOT_UNIQUE';
  END IF;

  SELECT ch.current_quantity
  INTO v_hdfc_before
  FROM public.current_holdings ch
  JOIN public.securities s ON s.id = ch.security_id
  WHERE ch.portfolio_id = v_portfolio_id
    AND s.symbol = 'HDFCBANK';

  SELECT ch.current_quantity
  INTO v_torntpharm_before
  FROM public.current_holdings ch
  JOIN public.securities s ON s.id = ch.security_id
  WHERE ch.portfolio_id = v_portfolio_id
    AND s.symbol = 'TORNTPHARM';

  IF v_hdfc_before IS NULL OR v_torntpharm_before IS NULL THEN
    RAISE EXCEPTION 'LOCAL_FIXTURE_REFERENCE_HOLDINGS_REQUIRED';
  END IF;

  /*
   * Reuse only the already-local Pharma sector classification from TORNTPHARM.
   * Do not infer/copy an industry and do not create classification evidence.
   */
  SELECT sector_id
  INTO v_torntpharm_sector_id
  FROM public.securities
  WHERE exchange = 'NSE'
    AND symbol = 'TORNTPHARM'
    AND is_active
  LIMIT 1;

  IF v_torntpharm_sector_id IS NULL THEN
    RAISE EXCEPTION 'LOCAL_FIXTURE_TORNTPHARM_PHARMA_SECTOR_REQUIRED';
  END IF;

  SELECT count(*)
  INTO v_conflicting_isin_count
  FROM public.securities
  WHERE isin = 'INE406A01037'
    AND NOT (exchange = 'NSE' AND symbol = 'AUROPHARMA');

  IF v_conflicting_isin_count > 0 THEN
    RAISE EXCEPTION 'AUROPHARMA_ISIN_CONFLICT';
  END IF;

  SELECT id
  INTO v_security_id
  FROM public.securities
  WHERE exchange = 'NSE'
    AND symbol = 'AUROPHARMA'
  LIMIT 1;

  IF v_security_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.securities
      WHERE id = v_security_id
        AND (
          isin IS DISTINCT FROM 'INE406A01037'
          OR name <> 'Aurobindo Pharma Limited'
          OR asset_class <> 'EQUITY'
          OR currency <> 'INR'
          OR NOT is_active
        )
    ) THEN
      RAISE EXCEPTION 'AUROPHARMA_EXISTING_SECURITY_CONFLICT';
    END IF;
  ELSE
    INSERT INTO public.securities (
      symbol,
      exchange,
      isin,
      name,
      asset_class,
      instrument_type,
      sector_id,
      industry_id,
      currency,
      is_active,
      creation_source,
      series
    )
    VALUES (
      'AUROPHARMA',
      'NSE',
      'INE406A01037',
      'Aurobindo Pharma Limited',
      'EQUITY',
      'EQUITY',
      v_torntpharm_sector_id,
      NULL,
      'INR',
      true,
      'LOCAL_G8_FIXTURE',
      'EQ'
    )
    RETURNING id INTO v_security_id;
  END IF;

  SELECT count(*)
  INTO v_primary_listing_conflict_count
  FROM public.security_listings
  WHERE security_id = v_security_id
    AND is_primary
    AND is_active
    AND NOT (
      exchange = 'NSE'
      AND trading_symbol = 'AUROPHARMA'
      AND series = 'EQ'
    );

  IF v_primary_listing_conflict_count > 0 THEN
    RAISE EXCEPTION 'AUROPHARMA_PRIMARY_LISTING_CONFLICT';
  END IF;

  INSERT INTO public.security_listings (
    security_id,
    exchange,
    trading_symbol,
    series,
    currency,
    is_primary,
    is_active
  )
  SELECT
    v_security_id,
    'NSE',
    'AUROPHARMA',
    'EQ',
    'INR',
    true,
    true
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.security_listings
    WHERE security_id = v_security_id
      AND exchange = 'NSE'
      AND trading_symbol = 'AUROPHARMA'
      AND series = 'EQ'
      AND is_active
  );

  /*
   * Research Coverage enumerates current_holdings.
   * The local ownership link is deliberately synthetic:
   * - quantity = 1 only to make the local target enumerable;
   * - no transaction date;
   * - no broker account;
   * - no unit price / gross amount / charges / taxes / net amount;
   * - NEEDS_REVIEW;
   * - explicit LOCAL_G8_FIXTURE provenance.
   *
   * It is NOT a claimed trade, cost basis, valuation or research fact.
   */
  IF NOT EXISTS (
    SELECT 1
    FROM public.current_holdings
    WHERE portfolio_id = v_portfolio_id
      AND security_id = v_security_id
      AND current_quantity > 0
  ) THEN
    INSERT INTO public.transactions (
      portfolio_id,
      broker_account_id,
      security_id,
      transaction_type,
      transaction_date,
      executed_at,
      quantity,
      unit_price,
      gross_amount,
      charges,
      taxes,
      net_amount,
      currency_code,
      source_type,
      source_provider,
      deduplication_key,
      data_quality_status,
      accounting_status,
      notes
    )
    VALUES (
      v_portfolio_id,
      NULL,
      v_security_id,
      'OPENING_POSITION',
      NULL,
      NULL,
      1,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      'INR',
      'LOCAL_G8_FIXTURE',
      'PORTFOLIOAI',
      'LOCAL_G8_FIXTURE:AUROPHARMA',
      'NEEDS_REVIEW',
      'ACTIVE',
      '[LOCAL TEST ONLY] Synthetic ownership link so AUROPHARMA appears in localhost Research Coverage for G8 second-company validation. No trade date, price, cost basis or research evidence is asserted.'
    );
  END IF;

  /*
   * Preserve the two pre-existing local reference holdings exactly.
   */
  SELECT ch.current_quantity
  INTO v_hdfc_after
  FROM public.current_holdings ch
  JOIN public.securities s ON s.id = ch.security_id
  WHERE ch.portfolio_id = v_portfolio_id
    AND s.symbol = 'HDFCBANK';

  SELECT ch.current_quantity
  INTO v_torntpharm_after
  FROM public.current_holdings ch
  JOIN public.securities s ON s.id = ch.security_id
  WHERE ch.portfolio_id = v_portfolio_id
    AND s.symbol = 'TORNTPHARM';

  IF v_hdfc_after IS DISTINCT FROM v_hdfc_before THEN
    RAISE EXCEPTION 'HDFCBANK_HOLDING_CHANGED';
  END IF;

  IF v_torntpharm_after IS DISTINCT FROM v_torntpharm_before THEN
    RAISE EXCEPTION 'TORNTPHARM_HOLDING_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.current_holdings ch
    JOIN public.securities s ON s.id = ch.security_id
    WHERE ch.portfolio_id = v_portfolio_id
      AND s.symbol = 'AUROPHARMA'
      AND ch.current_quantity > 0
  ) THEN
    RAISE EXCEPTION 'AUROPHARMA_CURRENT_HOLDING_NOT_CREATED';
  END IF;
END
$fixture$;

\echo 'Fixture mutation: PASS'
\echo 'Expected Research Coverage evidence state for AUROPHARMA: MISSING (no evidence fabricated)'
\echo ''

SELECT
  s.symbol,
  s.name,
  s.asset_class,
  sec.name AS sector,
  ch.current_quantity,
  CASE
    WHEN s.symbol = 'AUROPHARMA' THEN 'LOCAL_G8_RESEARCH_TARGET'
    ELSE 'PRE_EXISTING_REFERENCE'
  END AS fixture_role
FROM public.current_holdings ch
JOIN public.securities s ON s.id = ch.security_id
LEFT JOIN public.sectors sec ON sec.id = s.sector_id
WHERE ch.portfolio_id = (
  SELECT candidate.portfolio_id
  FROM (
    SELECT ch2.portfolio_id
    FROM public.current_holdings ch2
    JOIN public.securities s2 ON s2.id = ch2.security_id
    WHERE ch2.current_quantity > 0
      AND s2.symbol IN ('HDFCBANK', 'TORNTPHARM')
    GROUP BY ch2.portfolio_id
    HAVING count(DISTINCT s2.symbol) = 2
  ) candidate
  LIMIT 1
)
AND s.symbol IN ('HDFCBANK', 'TORNTPHARM', 'AUROPHARMA')
ORDER BY s.symbol;

\echo ''
\echo 'Research evidence rows inserted by this fixture: 0'
\echo 'Subprofile assignment rows inserted by this fixture: 0'
\echo 'Score/recommendation rows inserted by this fixture: 0'

COMMIT;

\echo ''
\echo '=== AUROPHARMA LOCAL RESEARCH TARGET READY ==='
