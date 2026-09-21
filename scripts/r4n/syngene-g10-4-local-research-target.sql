\set ON_ERROR_STOP on
\pset pager off

BEGIN;

\echo ''
\echo '=== G10.4 CHECKPOINT A · SYNGENE LOCAL RESEARCH TARGET ==='
\echo 'Local-only scope: identity/routing + optional synthetic ownership link.'
\echo 'Research evidence writes: 0'
\echo 'Subprofile assignment writes: 0'
\echo 'Score/recommendation writes: 0'
\echo ''

DO $fixture$
DECLARE
  v_target_user_id uuid;
  v_portfolio_id uuid;
  v_security_id uuid;
  v_pharma_sector_id uuid;
  v_before_count integer;
  v_after_count integer;
  v_had_syngene boolean;
BEGIN
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE lower(email) = 'dr.d.dutta@gmail.com'
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'LOCAL_G10_4_APP_USER_NOT_FOUND';
  END IF;

  SELECT id INTO v_portfolio_id
  FROM public.portfolios
  WHERE is_active
    AND user_id = v_target_user_id
  ORDER BY created_at, id
  LIMIT 1;

  IF v_portfolio_id IS NULL THEN
    RAISE EXCEPTION 'LOCAL_G10_4_ACTIVE_PORTFOLIO_NOT_FOUND';
  END IF;

  SELECT count(*) INTO v_before_count
  FROM public.current_holdings
  WHERE portfolio_id = v_portfolio_id
    AND current_quantity > 0;

  SELECT EXISTS (
    SELECT 1
    FROM public.current_holdings ch
    JOIN public.securities s ON s.id = ch.security_id
    WHERE ch.portfolio_id = v_portfolio_id
      AND ch.current_quantity > 0
      AND s.exchange = 'NSE'
      AND s.symbol = 'SYNGENE'
  ) INTO v_had_syngene;

  SELECT sector_id INTO v_pharma_sector_id
  FROM public.securities
  WHERE exchange = 'NSE'
    AND symbol = 'TORNTPHARM'
    AND is_active
  LIMIT 1;

  IF v_pharma_sector_id IS NULL THEN
    RAISE EXCEPTION 'LOCAL_G10_4_TORNTPHARM_PHARMA_SECTOR_REQUIRED';
  END IF;

  SELECT id INTO v_security_id
  FROM public.securities
  WHERE exchange = 'NSE'
    AND symbol = 'SYNGENE'
  LIMIT 1;

  IF v_security_id IS NULL THEN
    INSERT INTO public.securities (
      symbol, exchange, isin, name, asset_class, instrument_type,
      sector_id, industry_id, currency, is_active, creation_source, series
    )
    VALUES (
      'SYNGENE', 'NSE', 'INE398R01022', 'Syngene International Limited',
      'EQUITY', 'EQUITY', v_pharma_sector_id, NULL, 'INR', true,
      'LOCAL_G10_4_FIXTURE', 'EQ'
    )
    RETURNING id INTO v_security_id;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.securities
      WHERE id = v_security_id
        AND (
          isin IS NOT NULL AND isin <> 'INE398R01022'
          OR sector_id IS NOT NULL AND sector_id <> v_pharma_sector_id
          OR asset_class <> 'EQUITY'
          OR currency <> 'INR'
          OR NOT is_active
        )
    ) THEN
      RAISE EXCEPTION 'LOCAL_G10_4_SYNGENE_IDENTITY_CONFLICT';
    END IF;

    UPDATE public.securities
    SET isin = COALESCE(isin, 'INE398R01022'),
        name = CASE WHEN name = 'SYNGENE' OR name IS NULL THEN 'Syngene International Limited' ELSE name END,
        sector_id = COALESCE(sector_id, v_pharma_sector_id),
        instrument_type = COALESCE(instrument_type, 'EQUITY'),
        series = COALESCE(series, 'EQ')
    WHERE id = v_security_id;
  END IF;

  INSERT INTO public.security_listings (
    security_id, exchange, trading_symbol, series, currency, is_primary, is_active
  )
  SELECT v_security_id, 'NSE', 'SYNGENE', 'EQ', 'INR', true, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.security_listings
    WHERE security_id = v_security_id
      AND exchange = 'NSE'
      AND trading_symbol = 'SYNGENE'
      AND series = 'EQ'
      AND is_active
  );

  IF NOT v_had_syngene THEN
    INSERT INTO public.transactions (
      portfolio_id, broker_account_id, security_id, transaction_type,
      transaction_date, executed_at, quantity, unit_price, gross_amount,
      charges, taxes, net_amount, currency_code, source_type, source_provider,
      deduplication_key, data_quality_status, accounting_status, notes
    )
    VALUES (
      v_portfolio_id, NULL, v_security_id, 'OPENING_POSITION',
      NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 'INR',
      'LOCAL_G10_4_FIXTURE', 'PORTFOLIOAI', 'LOCAL_G10_4_FIXTURE:SYNGENE',
      'NEEDS_REVIEW', 'ACTIVE',
      '[LOCAL TEST ONLY] Synthetic ownership link so SYNGENE appears in localhost Research Coverage for G10.4 Checkpoint A visual review. No trade, price, cost basis, research evidence, classification assignment, score or recommendation is asserted.'
    );
  END IF;

  SELECT count(*) INTO v_after_count
  FROM public.current_holdings
  WHERE portfolio_id = v_portfolio_id
    AND current_quantity > 0;

  IF (v_had_syngene AND v_after_count <> v_before_count)
     OR (NOT v_had_syngene AND v_after_count <> v_before_count + 1) THEN
    RAISE EXCEPTION 'LOCAL_G10_4_HOLDING_COUNT_UNEXPECTED';
  END IF;
END
$fixture$;

COMMIT;

\echo ''
\echo '=== SYNGENE G10.4 LOCAL RESEARCH TARGET READY ==='
\echo 'Research evidence rows inserted: 0'
\echo 'Subprofile assignment rows inserted: 0'
\echo 'Score/recommendation rows inserted: 0'
