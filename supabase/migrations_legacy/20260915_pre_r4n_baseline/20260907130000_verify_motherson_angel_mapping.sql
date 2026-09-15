-- Stage 4: approve the previously ambiguous Angel One identity for MOTHERSON.
--
-- Deterministic evidence:
--   * PortfolioAI canonical security: NSE / MOTHERSON / INE775A01035.
--   * The immutable import evidence resolved both source rows by that ISIN and
--     names Samvardhana Motherson International Limited.
--   * NSE circular CML64158 identifies that ISIN and symbol as NSE series EQ.
--   * Therefore Angel One MOTHERSON-EQ token 4204 is the matching instrument;
--     MOTHERSON-D1 token 25510 is not the canonical EQ-series instrument.
--
-- The guarded assertions make this migration fail closed if canonical identity,
-- portfolio ownership, candidate evidence, or mapping state differs remotely.

do $migration$
declare
  v_security_id constant uuid := '9d28c14f-9035-4028-a8d7-128886031b00';
  v_mapping_id uuid;
  v_review_id uuid;
  v_reviewer uuid;
  v_affected integer;
begin
  perform 1
  from public.securities
  where id = v_security_id
    and symbol = 'MOTHERSON'
    and exchange = 'NSE'
    and isin = 'INE775A01035'
    and asset_class = 'EQUITY'
    and instrument_type = 'COMMON_STOCK';
  if not found then
    raise exception 'MOTHERSON canonical security evidence does not match the reviewed identity';
  end if;

  select mapping.id
  into strict v_mapping_id
  from public.market_data_instrument_mappings mapping
  where mapping.security_id = v_security_id
    and mapping.provider_code = 'ANGEL_ONE'
    and mapping.mapping_status = 'AMBIGUOUS'
    and exists (
      select 1
      from jsonb_array_elements(mapping.evidence -> 'candidates') candidate
      where candidate ->> 'token' = '25510'
        and candidate ->> 'symbol' = 'MOTHERSON-D1'
        and candidate ->> 'exchange' = 'NSE'
    )
    and exists (
      select 1
      from jsonb_array_elements(mapping.evidence -> 'candidates') candidate
      where candidate ->> 'token' = '4204'
        and candidate ->> 'symbol' = 'MOTHERSON-EQ'
        and candidate ->> 'exchange' = 'NSE'
    );

  select owner.user_id
  into strict v_reviewer
  from (
    select distinct portfolio.user_id
    from public.transactions transaction_row
    join public.portfolios portfolio on portfolio.id = transaction_row.portfolio_id
    where transaction_row.security_id = v_security_id
      and transaction_row.accounting_status = 'ACTIVE'
  ) owner;

  insert into public.market_data_mapping_reviews (
    mapping_id,
    security_id,
    provider_code,
    proposed_provider_instrument_id,
    proposed_exchange,
    proposed_trading_symbol,
    proposed_provider_instrument_type,
    proposed_mapping_status,
    proposed_match_basis,
    evidence,
    review_status
  ) values (
    v_mapping_id,
    v_security_id,
    'ANGEL_ONE',
    '4204',
    'NSE',
    'MOTHERSON-EQ',
    null,
    'VERIFIED',
    'MANUAL_VERIFIED',
    jsonb_build_object(
      'decision', 'NSE_SERIES_EQ_EXACT',
      'canonical_isin', 'INE775A01035',
      'canonical_exchange', 'NSE',
      'canonical_symbol', 'MOTHERSON',
      'authoritative_source', 'https://nsearchives.nseindia.com/content/circulars/CML64158.pdf',
      'authoritative_identity', jsonb_build_object(
        'company', 'Samvardhana Motherson International Limited',
        'symbol', 'MOTHERSON',
        'series', 'EQ',
        'isin', 'INE775A01035'
      ),
      'accepted_candidate', jsonb_build_object('token', '4204', 'exchange', 'NSE', 'trading_symbol', 'MOTHERSON-EQ'),
      'excluded_candidate', jsonb_build_object('token', '25510', 'exchange', 'NSE', 'trading_symbol', 'MOTHERSON-D1', 'reason', 'series is not EQ')
    ),
    'PENDING'
  )
  returning id into v_review_id;

  update public.market_data_instrument_mappings
  set provider_instrument_id = '4204',
      exchange = 'NSE',
      trading_symbol = 'MOTHERSON-EQ',
      provider_instrument_type = null,
      mapping_status = 'VERIFIED',
      match_basis = 'MANUAL_VERIFIED',
      verified_at = clock_timestamp(),
      evidence = evidence || jsonb_build_object(
        'manual_resolution', jsonb_build_object(
          'review_id', v_review_id,
          'decision', 'NSE_SERIES_EQ_EXACT',
          'canonical_isin', 'INE775A01035',
          'authoritative_source', 'https://nsearchives.nseindia.com/content/circulars/CML64158.pdf',
          'accepted_token', '4204',
          'accepted_trading_symbol', 'MOTHERSON-EQ',
          'excluded_token', '25510',
          'excluded_trading_symbol', 'MOTHERSON-D1'
        )
      )
  where id = v_mapping_id
    and security_id = v_security_id
    and provider_code = 'ANGEL_ONE'
    and mapping_status = 'AMBIGUOUS';
  get diagnostics v_affected = row_count;
  if v_affected <> 1 then
    raise exception 'Expected exactly one ambiguous MOTHERSON mapping to be approved, updated %', v_affected;
  end if;

  update public.market_data_mapping_reviews
  set review_status = 'APPLIED',
      reviewed_at = clock_timestamp(),
      reviewed_by = v_reviewer,
      review_notes = 'Portfolio owner approved deterministic NSE series/ISIN resolution for Stage 4.'
  where id = v_review_id
    and review_status = 'PENDING';
  get diagnostics v_affected = row_count;
  if v_affected <> 1 then
    raise exception 'Expected exactly one MOTHERSON review audit row to be applied, updated %', v_affected;
  end if;
end
$migration$;
