-- Owner-approved, evidence-backed correction: NSE identifies BBOX / Black Box
-- Limited / INE676A01027 as an equity security, not an ETF. This guarded data
-- migration is a no-op in seedless environments and records immutable audit data
-- when the reviewed production identity is present.
do $migration$
declare
  v_security_id uuid;
  v_portfolio_id uuid;
  v_owner uuid;
  v_request_id uuid;
begin
  select id into v_security_id from public.securities
  where exchange='NSE' and symbol='BBOX' and asset_class='ETF' and instrument_type='ETF';
  if v_security_id is null then return; end if;
  select portfolio_id into strict v_portfolio_id from public.current_holdings
  where security_id=v_security_id and current_quantity<>0;
  select user_id into strict v_owner from public.portfolios where id=v_portfolio_id;
  insert into public.security_classification_correction_requests(
    portfolio_id,security_id,requested_by,proposed_asset_class,proposed_instrument_type,reason,evidence_reference
  ) values (
    v_portfolio_id,v_security_id,v_owner,'EQUITY','COMMON_STOCK',
    'Correct erroneous ETF classification after owner review of canonical exchange evidence.',
    'NSE filing: BBOX; Black Box Limited; ISIN INE676A01027; class of security Equity. https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_142218_11022026231438_iXBRL_WEB.html'
  ) returning id into v_request_id;
  perform public.apply_security_classification_correction_v1(v_request_id,v_owner,'Owner-approved deterministic NSE identity correction applied by versioned migration.');
end;
$migration$;
