-- Stage 5: trusted, idempotent manual BUY/SELL entry.
-- Accounting lots are rebuilt on demand in the deterministic application engine;
-- source transactions remain the only authoritative financial records.

create table public.manual_transaction_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  transaction_id uuid not null references public.transactions (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint manual_transaction_requests_user_key unique (user_id, idempotency_key)
);

comment on table public.manual_transaction_requests is
  'Server-owned replay ledger for trusted manual transaction submission; it is not browser writable.';

alter table public.manual_transaction_requests enable row level security;
revoke all privileges on table public.manual_transaction_requests from public, anon, authenticated;

create index manual_transaction_requests_transaction_idx
  on public.manual_transaction_requests (transaction_id);

create or replace function public.create_manual_transaction_v1(
  p_portfolio_id uuid,
  p_broker_account_id uuid,
  p_security_id uuid,
  p_transaction_type text,
  p_transaction_date date,
  p_quantity numeric,
  p_unit_price numeric,
  p_total_charges numeric,
  p_notes text,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.manual_transaction_requests%rowtype;
  v_transaction_id uuid;
  v_available numeric(38,18);
  v_hash text;
  v_quality text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'An idempotency key is required.';
  end if;
  if p_transaction_type not in ('BUY', 'SELL') then
    raise exception using errcode = '22023', message = 'Only BUY and SELL are supported.';
  end if;
  if p_transaction_date is null or p_transaction_date > current_date then
    raise exception using errcode = '22023', message = 'A valid transaction date not later than today is required.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception using errcode = '22023', message = 'Quantity must be greater than zero.';
  end if;
  if p_unit_price is null or p_unit_price < 0 then
    raise exception using errcode = '22023', message = 'Execution price must be zero or greater.';
  end if;
  if p_total_charges is not null and p_total_charges < 0 then
    raise exception using errcode = '22023', message = 'Charges cannot be negative.';
  end if;
  if p_notes is not null and (p_notes <> btrim(p_notes) or length(p_notes) > 1000) then
    raise exception using errcode = '22023', message = 'Notes must be trimmed and no longer than 1000 characters.';
  end if;
  if not exists (
    select 1 from public.portfolios p
    where p.id = p_portfolio_id and p.user_id = v_user_id and p.is_active
  ) then
    raise exception using errcode = '42501', message = 'Portfolio is unavailable.';
  end if;
  if not exists (
    select 1 from public.broker_accounts a
    where a.id = p_broker_account_id and a.portfolio_id = p_portfolio_id and a.is_active
  ) then
    raise exception using errcode = '22023', message = 'Broker account does not belong to the selected portfolio.';
  end if;
  if not exists (select 1 from public.securities s where s.id = p_security_id and s.is_active) then
    raise exception using errcode = '22023', message = 'Security is unavailable.';
  end if;

  v_hash := encode(extensions.digest(
    concat_ws('|', p_portfolio_id, p_broker_account_id, p_security_id, p_transaction_type,
      p_transaction_date, p_quantity, p_unit_price, coalesce(p_total_charges::text, '<null>'), coalesce(p_notes, '<null>')),
    'sha256'), 'hex');
  select * into v_existing from public.manual_transaction_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was already used for different transaction details.';
    end if;
    return jsonb_build_object('transaction_id', v_existing.transaction_id, 'already_created', true);
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_portfolio_id::text || ':' || p_security_id::text, 0));
  select coalesce(sum(case
    when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity
    when transaction_type in ('SELL','TRANSFER_OUT') then -quantity
    else 0 end), 0)
  into v_available
  from public.transactions
  where portfolio_id = p_portfolio_id and security_id = p_security_id and accounting_status = 'ACTIVE';
  if p_transaction_type = 'SELL' and p_quantity > v_available then
    raise exception using errcode = '23514', message = format('Sell quantity exceeds available quantity (%s).', v_available);
  end if;

  v_quality := 'COMPLETE';
  insert into public.transactions (
    portfolio_id, broker_account_id, security_id, transaction_type, transaction_date,
    quantity, unit_price, gross_amount, charges, taxes, net_amount, currency_code,
    source_type, source_provider, deduplication_key, data_quality_status, accounting_status, notes
  ) values (
    p_portfolio_id, p_broker_account_id, p_security_id, p_transaction_type, p_transaction_date,
    p_quantity, p_unit_price, p_quantity * p_unit_price, p_total_charges,
    case when p_total_charges is null then null else 0 end,
    case when p_total_charges is null then null when p_transaction_type = 'BUY'
      then p_quantity * p_unit_price + p_total_charges else p_quantity * p_unit_price - p_total_charges end,
    'INR', 'MANUAL', 'PORTFOLIOAI', 'manual:' || v_user_id || ':' || p_idempotency_key,
    v_quality, 'ACTIVE', nullif(p_notes, '')
  ) returning id into v_transaction_id;

  insert into public.manual_transaction_requests (user_id, idempotency_key, request_hash, transaction_id)
  values (v_user_id, p_idempotency_key, v_hash, v_transaction_id);
  return jsonb_build_object('transaction_id', v_transaction_id, 'already_created', false);
end;
$$;

revoke execute on function public.create_manual_transaction_v1(uuid,uuid,uuid,text,date,numeric,numeric,numeric,text,uuid)
  from public, anon;
grant execute on function public.create_manual_transaction_v1(uuid,uuid,uuid,text,date,numeric,numeric,numeric,text,uuid)
  to authenticated;
