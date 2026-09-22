-- Stage 5.1: trusted canonical-security onboarding and audited transaction correction.
-- Additive only: imported source evidence is never changed and effective accounting
-- continues to be derived exclusively from ACTIVE transactions.

alter table public.securities
  add column creation_source text not null default 'FOUNDATION'
    check (creation_source ~ '^[A-Z0-9_]+$'),
  add column created_by uuid references auth.users (id) on delete restrict;

alter table public.transactions
  add column corrected_from_transaction_id uuid,
  add column corrected_by uuid references auth.users (id) on delete restrict,
  add column correction_reason text check (
    correction_reason is null or
    (correction_reason = btrim(correction_reason) and length(correction_reason) between 3 and 1000)
  ),
  add constraint transactions_correction_portfolio_fkey
    foreign key (corrected_from_transaction_id, portfolio_id)
    references public.transactions (id, portfolio_id) on delete restrict,
  add constraint transactions_correction_metadata_check check (
    (corrected_from_transaction_id is null and corrected_by is null and correction_reason is null)
    or
    (corrected_from_transaction_id is not null and corrected_by is not null and correction_reason is not null)
  );

-- Make the long-standing reference-master read-only intent explicit at the table
-- privilege layer as well as RLS. Trusted SECURITY DEFINER functions retain access.
revoke all privileges on table public.securities from anon, authenticated;
revoke all privileges on table public.security_identifiers from anon, authenticated;
grant select on table public.securities to authenticated;
grant select on table public.security_identifiers to authenticated;

create unique index transactions_one_active_correction_key
  on public.transactions (corrected_from_transaction_id)
  where corrected_from_transaction_id is not null and accounting_status = 'ACTIVE';

create table public.security_creation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  security_id uuid not null references public.securities (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.transaction_correction_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  original_transaction_id uuid not null references public.transactions (id) on delete restrict,
  corrected_transaction_id uuid not null references public.transactions (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  unique (corrected_transaction_id)
);

alter table public.security_creation_requests enable row level security;
alter table public.transaction_correction_requests enable row level security;
revoke all privileges on table public.security_creation_requests from public, anon, authenticated;
revoke all privileges on table public.transaction_correction_requests from public, anon, authenticated;

create or replace function public.portfolioai_is_valid_isin(p_isin text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  v_digits text := '';
  v_char text;
  v_sum integer := 0;
  v_digit integer;
  v_double boolean := false;
  i integer;
begin
  if p_isin is null or p_isin !~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$' then return false; end if;
  for i in 1..length(p_isin) loop
    v_char := substr(p_isin, i, 1);
    if v_char ~ '[0-9]' then v_digits := v_digits || v_char;
    else v_digits := v_digits || (ascii(v_char) - 55)::text; end if;
  end loop;
  for i in reverse length(v_digits)..1 loop
    v_digit := substr(v_digits, i, 1)::integer;
    if v_double then v_digit := v_digit * 2; end if;
    v_sum := v_sum + (v_digit / 10) + (v_digit % 10);
    v_double := not v_double;
  end loop;
  return v_sum % 10 = 0;
end;
$$;

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

  insert into public.securities(symbol,exchange,isin,name,asset_class,instrument_type,creation_source,created_by)
  values(v_symbol,v_exchange,v_isin,v_name,v_asset,v_instrument,'MANUAL_PORTFOLIOAI',v_user_id) returning id into v_security_id;
  if v_series is not null then
    insert into public.security_identifiers(security_id,identifier_type,identifier_value,provider_code,exchange,is_primary)
    values(v_security_id,'SERIES',v_series,v_exchange,v_exchange,true);
  end if;
  -- No provider token is guessed. A server-side sync can later promote this row
  -- from UNRESOLVED when trusted Angel instrument-master evidence is available.
  insert into public.market_data_instrument_mappings(security_id,provider_code,exchange,trading_symbol,mapping_status,evidence)
  values(v_security_id,'ANGEL_ONE',v_exchange,v_symbol,'UNRESOLVED',jsonb_build_object('source','MANUAL_SECURITY_ONBOARDING','reason','PENDING_TRUSTED_INSTRUMENT_MASTER_MATCH'));
  insert into public.security_creation_requests(user_id,idempotency_key,request_hash,security_id)
  values(v_user_id,p_idempotency_key,v_hash,v_security_id);
  return jsonb_build_object('security_id',v_security_id,'already_created',false,'mapping_status','UNRESOLVED');
end;
$$;

create or replace function public.correct_transaction_v1(
  p_original_transaction_id uuid, p_portfolio_id uuid, p_broker_account_id uuid,
  p_security_id uuid, p_transaction_type text, p_transaction_date date,
  p_quantity numeric, p_unit_price numeric, p_total_charges numeric,
  p_notes text, p_reason text, p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_original public.transactions%rowtype;
  v_existing public.transaction_correction_requests%rowtype;
  v_new_id uuid;
  v_hash text;
  v_available numeric(38,18);
  v_quality text;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if p_transaction_type not in ('BUY','SELL') then raise exception using errcode='22023', message='Only BUY and SELL are supported.'; end if;
  if p_transaction_date is not null and p_transaction_date > current_date then raise exception using errcode='22023', message='A transaction date cannot be later than today.'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception using errcode='22023', message='Quantity must be greater than zero.'; end if;
  if p_unit_price is null or p_unit_price < 0 then raise exception using errcode='22023', message='Execution price must be zero or greater.'; end if;
  if p_total_charges is not null and p_total_charges < 0 then raise exception using errcode='22023', message='Charges cannot be negative.'; end if;
  if p_notes is not null and (p_notes<>btrim(p_notes) or length(p_notes)>1000) then raise exception using errcode='22023', message='Notes must be trimmed and no longer than 1000 characters.'; end if;
  if p_reason is null or length(btrim(p_reason))<3 or length(btrim(p_reason))>1000 then raise exception using errcode='22023', message='A correction reason of 3–1000 characters is required.'; end if;
  if not exists(select 1 from public.portfolios p where p.id=p_portfolio_id and p.user_id=v_user_id and p.is_active)
    then raise exception using errcode='42501', message='Portfolio is unavailable.'; end if;
  if p_broker_account_id is not null and not exists(select 1 from public.broker_accounts a where a.id=p_broker_account_id and a.portfolio_id=p_portfolio_id and a.is_active)
    then raise exception using errcode='22023', message='Broker account does not belong to the selected portfolio.'; end if;
  if not exists(select 1 from public.securities s where s.id=p_security_id and s.is_active)
    then raise exception using errcode='22023', message='Security is unavailable.'; end if;

  v_hash := encode(extensions.digest(concat_ws('|',p_original_transaction_id,p_portfolio_id,p_broker_account_id,p_security_id,p_transaction_type,p_transaction_date,p_quantity,p_unit_price,coalesce(p_total_charges::text,'<null>'),coalesce(p_notes,'<null>'),btrim(p_reason)),'sha256'),'hex');
  select * into v_existing from public.transaction_correction_requests where user_id=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then raise exception using errcode='22023', message='Idempotency key was already used for a different correction.'; end if;
    return jsonb_build_object('transaction_id',v_existing.corrected_transaction_id,'already_created',true);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('correction:'||p_portfolio_id::text,0));
  select * into v_original from public.transactions where id=p_original_transaction_id and portfolio_id=p_portfolio_id for update;
  if not found then raise exception using errcode='42501', message='Transaction is unavailable.'; end if;
  if v_original.accounting_status<>'ACTIVE' then raise exception using errcode='22023', message='Only the current effective transaction can be corrected.'; end if;

  select coalesce(sum(case when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity when transaction_type in ('SELL','TRANSFER_OUT') then -quantity else 0 end),0)
  into v_available from public.transactions
  where portfolio_id=p_portfolio_id and security_id=p_security_id and accounting_status='ACTIVE' and id<>p_original_transaction_id;
  if v_available + (case when p_transaction_type='BUY' then p_quantity else -p_quantity end) < 0 then
    raise exception using errcode='23514', message=format('Correction would create an oversold position from available quantity %s.',v_available);
  end if;
  if p_security_id<>v_original.security_id then
    select coalesce(sum(case when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity when transaction_type in ('SELL','TRANSFER_OUT') then -quantity else 0 end),0)
    into v_available from public.transactions where portfolio_id=p_portfolio_id and security_id=v_original.security_id and accounting_status='ACTIVE' and id<>p_original_transaction_id;
    if v_available<0 then raise exception using errcode='23514', message='Correction would leave the original security oversold.'; end if;
  end if;

  update public.transactions set accounting_status='SUPERSEDED',superseded_at=clock_timestamp(),supersession_reason=btrim(p_reason)
  where id=v_original.id;
  v_quality := case when p_transaction_date is null and p_broker_account_id is null then 'MISSING_DATE_AND_BROKER'
    when p_transaction_date is null then 'MISSING_DATE' when p_broker_account_id is null then 'MISSING_BROKER' else 'COMPLETE' end;
  insert into public.transactions(portfolio_id,broker_account_id,security_id,transaction_type,transaction_date,quantity,unit_price,gross_amount,charges,taxes,net_amount,currency_code,source_type,source_provider,deduplication_key,data_quality_status,accounting_status,notes,corrected_from_transaction_id,corrected_by,correction_reason)
  values(p_portfolio_id,p_broker_account_id,p_security_id,p_transaction_type,p_transaction_date,p_quantity,p_unit_price,p_quantity*p_unit_price,p_total_charges,case when p_total_charges is null then null else 0 end,case when p_total_charges is null then null when p_transaction_type='BUY' then p_quantity*p_unit_price+p_total_charges else p_quantity*p_unit_price-p_total_charges end,'INR','CORRECTION','PORTFOLIOAI','correction:'||v_user_id||':'||p_idempotency_key,v_quality,'ACTIVE',nullif(p_notes,''),v_original.id,v_user_id,btrim(p_reason)) returning id into v_new_id;
  insert into public.transaction_correction_requests(user_id,idempotency_key,request_hash,original_transaction_id,corrected_transaction_id)
  values(v_user_id,p_idempotency_key,v_hash,v_original.id,v_new_id);
  return jsonb_build_object('transaction_id',v_new_id,'already_created',false);
end;
$$;

revoke all on function public.portfolioai_is_valid_isin(text) from public, anon, authenticated;
revoke all on function public.create_manual_security_v1(uuid,text,text,text,text,text,text,text,uuid) from public, anon;
grant execute on function public.create_manual_security_v1(uuid,text,text,text,text,text,text,text,uuid) to authenticated;
revoke all on function public.correct_transaction_v1(uuid,uuid,uuid,uuid,text,date,numeric,numeric,numeric,text,text,uuid) from public, anon;
grant execute on function public.correct_transaction_v1(uuid,uuid,uuid,uuid,text,date,numeric,numeric,numeric,text,text,uuid) to authenticated;

comment on column public.transactions.corrected_from_transaction_id is 'Links the current correction to immutable prior ledger evidence; only ACTIVE rows affect accounting.';
comment on table public.transaction_correction_requests is 'Server-owned idempotency and audit ledger for trusted transaction corrections.';
