-- Stage 6 completion: audited transaction void/restore and canonical security
-- classification correction requests. Financial rows remain browser read-only.

create table public.transaction_accounting_events (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  transaction_id uuid not null,
  event_type text not null check (event_type in ('VOID', 'RESTORE')),
  prior_accounting_status text not null check (prior_accounting_status in ('ACTIVE', 'REVERSED')),
  resulting_accounting_status text not null check (resulting_accounting_status in ('ACTIVE', 'REVERSED')),
  reason text not null check (reason = btrim(reason) and length(reason) between 3 and 1000),
  performed_by uuid not null references auth.users (id) on delete restrict,
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  constraint transaction_accounting_events_transaction_portfolio_fkey
    foreign key (transaction_id, portfolio_id)
    references public.transactions (id, portfolio_id) on delete restrict,
  unique (performed_by, idempotency_key)
);

comment on table public.transaction_accounting_events is
  'Append-only audit evidence for trusted transaction void and restore operations. It never replaces or deletes the original transaction.';

alter table public.transaction_accounting_events enable row level security;
revoke all privileges on table public.transaction_accounting_events from public, anon, authenticated;
grant select on table public.transaction_accounting_events to authenticated;

create policy "Users can read transaction accounting events in their portfolios"
on public.transaction_accounting_events for select to authenticated
using (exists (
  select 1 from public.portfolios
  where portfolios.id = transaction_accounting_events.portfolio_id
    and portfolios.user_id = (select auth.uid())
));

create function public.portfolioai_assert_effective_quantity_valid(
  p_portfolio_id uuid,
  p_security_id uuid,
  p_excluded_transaction_id uuid default null,
  p_included_transaction_id uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_quantity numeric(38,18);
begin
  select coalesce(sum(case
    when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity
    when transaction_type in ('SELL','TRANSFER_OUT') then -quantity
    else 0 end), 0)
  into v_quantity
  from public.transactions
  where portfolio_id = p_portfolio_id
    and security_id = p_security_id
    and (
      (accounting_status = 'ACTIVE' and id is distinct from p_excluded_transaction_id)
      or id = p_included_transaction_id
    );
  if v_quantity < 0 then
    raise exception using errcode = '23514',
      message = format('The operation would create an oversold position from effective quantity %s.', v_quantity);
  end if;
end;
$$;

revoke execute on function public.portfolioai_assert_effective_quantity_valid(uuid,uuid,uuid,uuid)
from public, anon, authenticated;

create function public.void_transaction_v1(
  p_transaction_id uuid, p_portfolio_id uuid, p_reason text, p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.transactions%rowtype;
  v_existing public.transaction_accounting_events%rowtype;
  v_hash text;
  v_event_id uuid;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if p_reason is null or length(btrim(p_reason)) < 3 or length(btrim(p_reason)) > 1000 then
    raise exception using errcode='22023', message='A removal reason of 3–1000 characters is required.';
  end if;
  if not exists(select 1 from public.portfolios where id=p_portfolio_id and user_id=v_user_id and is_active) then
    raise exception using errcode='42501', message='Portfolio is unavailable.';
  end if;
  v_hash := encode(extensions.digest(concat_ws('|','VOID',p_transaction_id,p_portfolio_id,btrim(p_reason)),'sha256'),'hex');
  select * into v_existing from public.transaction_accounting_events
  where performed_by=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then raise exception using errcode='22023', message='Idempotency key was already used for a different accounting action.'; end if;
    return jsonb_build_object('transaction_id',v_existing.transaction_id,'event_id',v_existing.id,'already_applied',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('transaction-accounting:'||p_portfolio_id::text,0));
  select * into v_transaction from public.transactions where id=p_transaction_id and portfolio_id=p_portfolio_id for update;
  if not found then raise exception using errcode='42501', message='Transaction is unavailable.'; end if;
  if v_transaction.accounting_status<>'ACTIVE' then raise exception using errcode='22023', message='Only an active transaction can be removed.'; end if;
  if v_transaction.transaction_type not in ('BUY','SELL') then raise exception using errcode='22023', message='Only active BUY and SELL transactions can be removed.'; end if;
  perform public.portfolioai_assert_effective_quantity_valid(p_portfolio_id,v_transaction.security_id,p_transaction_id,null);
  update public.transactions set accounting_status='REVERSED' where id=p_transaction_id;
  insert into public.transaction_accounting_events(portfolio_id,transaction_id,event_type,prior_accounting_status,resulting_accounting_status,reason,performed_by,idempotency_key,request_hash)
  values(p_portfolio_id,p_transaction_id,'VOID','ACTIVE','REVERSED',btrim(p_reason),v_user_id,p_idempotency_key,v_hash)
  returning id into v_event_id;
  return jsonb_build_object('transaction_id',p_transaction_id,'event_id',v_event_id,'already_applied',false);
end;
$$;

create function public.restore_transaction_v1(
  p_transaction_id uuid, p_portfolio_id uuid, p_reason text, p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.transactions%rowtype;
  v_existing public.transaction_accounting_events%rowtype;
  v_hash text;
  v_event_id uuid;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if p_reason is null or length(btrim(p_reason)) < 3 or length(btrim(p_reason)) > 1000 then
    raise exception using errcode='22023', message='A restoration reason of 3–1000 characters is required.';
  end if;
  if not exists(select 1 from public.portfolios where id=p_portfolio_id and user_id=v_user_id and is_active) then
    raise exception using errcode='42501', message='Portfolio is unavailable.';
  end if;
  v_hash := encode(extensions.digest(concat_ws('|','RESTORE',p_transaction_id,p_portfolio_id,btrim(p_reason)),'sha256'),'hex');
  select * into v_existing from public.transaction_accounting_events
  where performed_by=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then raise exception using errcode='22023', message='Idempotency key was already used for a different accounting action.'; end if;
    return jsonb_build_object('transaction_id',v_existing.transaction_id,'event_id',v_existing.id,'already_applied',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('transaction-accounting:'||p_portfolio_id::text,0));
  select * into v_transaction from public.transactions where id=p_transaction_id and portfolio_id=p_portfolio_id for update;
  if not found then raise exception using errcode='42501', message='Transaction is unavailable.'; end if;
  if v_transaction.accounting_status<>'REVERSED' or v_transaction.transaction_type not in ('BUY','SELL') then
    raise exception using errcode='22023', message='Only a previously voided BUY or SELL transaction can be restored.';
  end if;
  if not exists(select 1 from public.transaction_accounting_events where transaction_id=p_transaction_id and portfolio_id=p_portfolio_id and event_type='VOID') then
    raise exception using errcode='22023', message='The transaction has no trusted void history.';
  end if;
  perform public.portfolioai_assert_effective_quantity_valid(p_portfolio_id,v_transaction.security_id,null,p_transaction_id);
  update public.transactions set accounting_status='ACTIVE' where id=p_transaction_id;
  insert into public.transaction_accounting_events(portfolio_id,transaction_id,event_type,prior_accounting_status,resulting_accounting_status,reason,performed_by,idempotency_key,request_hash)
  values(p_portfolio_id,p_transaction_id,'RESTORE','REVERSED','ACTIVE',btrim(p_reason),v_user_id,p_idempotency_key,v_hash)
  returning id into v_event_id;
  return jsonb_build_object('transaction_id',p_transaction_id,'event_id',v_event_id,'already_applied',false);
end;
$$;

revoke all on function public.void_transaction_v1(uuid,uuid,text,uuid) from public, anon;
revoke all on function public.restore_transaction_v1(uuid,uuid,text,uuid) from public, anon;
grant execute on function public.void_transaction_v1(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.restore_transaction_v1(uuid,uuid,text,uuid) to authenticated;

create table public.security_classification_correction_requests (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  requested_by uuid not null references auth.users(id) on delete restrict,
  proposed_asset_class text not null check (proposed_asset_class in ('EQUITY','ETF','MUTUAL_FUND','GOLD','SILVER','BOND','CASH','OTHER')),
  proposed_instrument_type text not null check (proposed_instrument_type = btrim(proposed_instrument_type) and proposed_instrument_type <> ''),
  reason text not null check (reason = btrim(reason) and length(reason) between 3 and 1000),
  evidence_reference text not null check (evidence_reference = btrim(evidence_reference) and length(evidence_reference) between 3 and 2000),
  request_status text not null default 'PENDING' check (request_status in ('PENDING','APPLIED','REJECTED')),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  review_notes text check (review_notes is null or (review_notes=btrim(review_notes) and length(review_notes) between 3 and 1000)),
  created_at timestamptz not null default now(),
  constraint security_classification_review_state_check check (
    (request_status='PENDING' and reviewed_by is null and reviewed_at is null and review_notes is null)
    or (request_status<>'PENDING' and reviewed_by is not null and reviewed_at is not null and review_notes is not null)
  )
);

create table public.security_classification_changes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.security_classification_correction_requests(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  old_asset_class text not null,
  new_asset_class text not null,
  old_instrument_type text not null,
  new_instrument_type text not null,
  evidence_reference text not null,
  applied_by uuid not null references auth.users(id) on delete restrict,
  applied_at timestamptz not null default now()
);

alter table public.security_classification_correction_requests enable row level security;
alter table public.security_classification_changes enable row level security;
revoke all privileges on table public.security_classification_correction_requests from public, anon, authenticated;
revoke all privileges on table public.security_classification_changes from public, anon, authenticated;
grant select, insert on public.security_classification_correction_requests to authenticated;
grant select on public.security_classification_changes to authenticated;

create policy "Users can read their classification correction requests" on public.security_classification_correction_requests
for select to authenticated using (requested_by=(select auth.uid()) and exists(select 1 from public.portfolios where id=portfolio_id and user_id=(select auth.uid())));
create policy "Users can submit classification correction requests" on public.security_classification_correction_requests
for insert to authenticated with check (
  requested_by=(select auth.uid()) and request_status='PENDING' and reviewed_by is null and reviewed_at is null
  and exists(select 1 from public.portfolios where id=portfolio_id and user_id=(select auth.uid()))
  and exists(select 1 from public.current_holdings where portfolio_id=security_classification_correction_requests.portfolio_id and security_id=security_classification_correction_requests.security_id and current_quantity<>0)
);
create policy "Users can read applied classification changes" on public.security_classification_changes
for select to authenticated using (exists(
  select 1 from public.security_classification_correction_requests request
  join public.portfolios portfolio on portfolio.id=request.portfolio_id
  where request.id=security_classification_changes.request_id and portfolio.user_id=(select auth.uid())
));

create function public.apply_security_classification_correction_v1(
  p_request_id uuid, p_reviewer uuid, p_review_notes text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_request public.security_classification_correction_requests%rowtype;
  v_security public.securities%rowtype;
  v_change_id uuid;
begin
  if p_reviewer is null or not exists(select 1 from auth.users where id=p_reviewer) then raise exception using errcode='22023', message='A valid reviewer is required.'; end if;
  if p_review_notes is null or length(btrim(p_review_notes))<3 or length(btrim(p_review_notes))>1000 then raise exception using errcode='22023', message='Review notes of 3–1000 characters are required.'; end if;
  select * into v_request from public.security_classification_correction_requests where id=p_request_id for update;
  if not found then raise exception using errcode='22023', message='Classification correction request is unavailable.'; end if;
  if v_request.request_status<>'PENDING' then raise exception using errcode='22023', message='Only a pending correction request can be applied.'; end if;
  select * into strict v_security from public.securities where id=v_request.security_id for update;
  update public.securities set asset_class=v_request.proposed_asset_class, instrument_type=v_request.proposed_instrument_type where id=v_security.id;
  update public.security_classification_correction_requests set request_status='APPLIED',reviewed_by=p_reviewer,reviewed_at=clock_timestamp(),review_notes=btrim(p_review_notes) where id=v_request.id;
  insert into public.security_classification_changes(request_id,security_id,old_asset_class,new_asset_class,old_instrument_type,new_instrument_type,evidence_reference,applied_by)
  values(v_request.id,v_security.id,v_security.asset_class,v_request.proposed_asset_class,v_security.instrument_type,v_request.proposed_instrument_type,v_request.evidence_reference,p_reviewer)
  returning id into v_change_id;
  return jsonb_build_object('request_id',v_request.id,'change_id',v_change_id,'security_id',v_security.id);
end;
$$;

revoke all on function public.apply_security_classification_correction_v1(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.apply_security_classification_correction_v1(uuid,uuid,text) to service_role;

