-- Stage 5.1 follow-up: series is an attribute of an exchange listing, not a
-- globally unique alternate identifier. The original trusted RPC is replaced
-- without rewriting any security or transaction evidence.
alter table public.securities
  add column series text check (
    series is null or (series = upper(btrim(series)) and series ~ '^[A-Z0-9_-]{1,12}$')
  );

create or replace function public.create_manual_security_v1(
  p_portfolio_id uuid, p_exchange text, p_symbol text, p_name text,
  p_asset_class text, p_instrument_type text, p_isin text,
  p_series text, p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_exchange text := upper(btrim(p_exchange));
  v_symbol text := upper(regexp_replace(btrim(p_symbol), '\s+', '', 'g'));
  v_name text := btrim(p_name);
  v_asset text := upper(btrim(p_asset_class));
  v_instrument text := upper(btrim(p_instrument_type));
  v_isin text := nullif(upper(btrim(p_isin)), '');
  v_series text := nullif(upper(btrim(p_series)), '');
  v_hash text;
  v_existing public.security_creation_requests%rowtype;
  v_security_id uuid;
  v_mapping_status text;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if not exists (select 1 from public.portfolios p where p.id=p_portfolio_id and p.user_id=v_user_id and p.is_active)
    then raise exception using errcode='42501', message='Portfolio is unavailable.'; end if;
  if v_exchange not in ('NSE','BSE') then raise exception using errcode='22023', message='Exchange must be NSE or BSE.'; end if;
  if v_symbol !~ '^[A-Z0-9&._-]{1,40}$' then raise exception using errcode='22023', message='Trading symbol is invalid.'; end if;
  if length(v_name) < 2 or length(v_name) > 200 then raise exception using errcode='22023', message='Security name is invalid.'; end if;
  if v_asset not in ('EQUITY','ETF') then raise exception using errcode='22023', message='Only Indian equities and ETFs are supported here.'; end if;
  if v_instrument not in ('STOCK','ETF') or (v_asset='ETF') <> (v_instrument='ETF') then
    raise exception using errcode='22023', message='Instrument type does not match the asset class.';
  end if;
  if v_isin is not null and not public.portfolioai_is_valid_isin(v_isin) then
    raise exception using errcode='22023', message='ISIN is invalid.';
  end if;
  if v_series is not null and v_series !~ '^[A-Z0-9_-]{1,12}$' then raise exception using errcode='22023', message='Series is invalid.'; end if;

  v_hash := encode(extensions.digest(concat_ws('|',p_portfolio_id,v_exchange,v_symbol,lower(v_name),v_asset,v_instrument,coalesce(v_isin,'<null>'),coalesce(v_series,'<null>')),'sha256'),'hex');
  select * into v_existing from public.security_creation_requests where user_id=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_hash then raise exception using errcode='22023', message='Idempotency key was already used for different security details.'; end if;
    select mapping_status into v_mapping_status from public.market_data_instrument_mappings where security_id=v_existing.security_id and provider_code='ANGEL_ONE';
    return jsonb_build_object('security_id',v_existing.security_id,'already_created',true,'mapping_status',coalesce(v_mapping_status,'UNRESOLVED'));
  end if;

  perform pg_advisory_xact_lock(hashtextextended('security:'||v_exchange||':'||v_symbol,0));
  select id into v_security_id from public.securities where exchange=v_exchange and symbol=v_symbol;
  if v_security_id is not null then raise exception using errcode='23505', message='A security with this exchange and symbol already exists. Select the existing security.'; end if;
  if v_isin is not null then
    select id into v_security_id from public.securities where isin=v_isin;
    if v_security_id is not null then raise exception using errcode='23505', message='A security with this ISIN already exists. Resolve the identity conflict.'; end if;
  end if;

  insert into public.securities(symbol,exchange,isin,name,asset_class,instrument_type,series,creation_source,created_by)
  values(v_symbol,v_exchange,v_isin,v_name,v_asset,v_instrument,v_series,'MANUAL_PORTFOLIOAI',v_user_id) returning id into v_security_id;
  insert into public.market_data_instrument_mappings(security_id,provider_code,exchange,trading_symbol,mapping_status,evidence)
  values(v_security_id,'ANGEL_ONE',v_exchange,v_symbol,'UNRESOLVED',jsonb_build_object('source','MANUAL_SECURITY_ONBOARDING','reason','PENDING_TRUSTED_INSTRUMENT_MASTER_MATCH'));
  insert into public.security_creation_requests(user_id,idempotency_key,request_hash,security_id)
  values(v_user_id,p_idempotency_key,v_hash,v_security_id);
  return jsonb_build_object('security_id',v_security_id,'already_created',false,'mapping_status','UNRESOLVED');
end;
$$;

revoke all on function public.create_manual_security_v1(uuid,text,text,text,text,text,text,text,uuid) from public, anon;
grant execute on function public.create_manual_security_v1(uuid,text,text,text,text,text,text,text,uuid) to authenticated;

comment on column public.securities.series is
  'Normalized exchange listing series (for example NSE EQ); not a globally unique security identifier.';
