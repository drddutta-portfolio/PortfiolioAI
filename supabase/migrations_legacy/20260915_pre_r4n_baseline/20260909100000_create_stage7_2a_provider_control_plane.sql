-- Stage 7.2A: provider safety control plane. No provider data is fetched by this migration.

alter table public.data_ingestion_runs
  add column portfolio_id uuid references public.portfolios(id) on delete restrict,
  add column orchestration_type text check (orchestration_type is null or orchestration_type ~ '^[A-Z0-9_]+$'),
  add column trigger_source text check (trigger_source is null or trigger_source in ('OWNER','MANUAL','SCHEDULED','EVENT','RETRY','PILOT')),
  add column estimated_call_count integer check (estimated_call_count is null or estimated_call_count >= 0),
  add column reserved_call_count integer check (reserved_call_count is null or reserved_call_count >= 0),
  add column attempted_call_count integer check (attempted_call_count is null or attempted_call_count >= 0),
  add column accepted_count integer check (accepted_count is null or accepted_count >= 0),
  add column conflicting_count integer check (conflicting_count is null or conflicting_count >= 0),
  add column rejected_count integer check (rejected_count is null or rejected_count >= 0),
  add column skipped_count integer check (skipped_count is null or skipped_count >= 0),
  add column policy_version integer check (policy_version is null or policy_version > 0);

create index data_ingestion_runs_portfolio_started_idx
  on public.data_ingestion_runs(portfolio_id, started_at desc) where portfolio_id is not null;

create table public.provider_ingestion_controls (
  source_code text primary key references public.data_sources(code) on delete restrict,
  ingestion_enabled boolean not null default false,
  scheduler_enabled boolean not null default false,
  daily_internal_attempt_limit integer not null check (daily_internal_attempt_limit > 0),
  rolling_internal_attempt_limit integer not null check (rolling_internal_attempt_limit > 0),
  rolling_window_days integer not null default 30 check (rolling_window_days between 1 and 365),
  per_run_internal_attempt_limit integer not null check (per_run_internal_attempt_limit > 0),
  concurrency_limit integer not null check (concurrency_limit between 1 and 100),
  warning_threshold numeric(5,4) not null check (warning_threshold > 0 and warning_threshold < 1),
  caution_threshold numeric(5,4) not null check (caution_threshold > warning_threshold and caution_threshold < 1),
  conservation_threshold numeric(5,4) not null check (conservation_threshold > caution_threshold and conservation_threshold < 1),
  hard_stop_threshold numeric(5,4) not null default 1 check (hard_stop_threshold >= conservation_threshold and hard_stop_threshold <= 1),
  consecutive_failure_threshold integer not null check (consecutive_failure_threshold > 0),
  actual_provider_quota_status text not null default 'UNKNOWN' check (actual_provider_quota_status in ('UNKNOWN','VERIFIED')),
  actual_provider_quota jsonb,
  policy_version integer not null check (policy_version > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete restrict,
  constraint provider_control_quota_shape check ((actual_provider_quota_status='UNKNOWN' and actual_provider_quota is null) or (actual_provider_quota_status='VERIFIED' and jsonb_typeof(actual_provider_quota)='object'))
);

insert into public.provider_ingestion_controls(
  source_code,ingestion_enabled,scheduler_enabled,daily_internal_attempt_limit,
  rolling_internal_attempt_limit,rolling_window_days,per_run_internal_attempt_limit,
  concurrency_limit,warning_threshold,caution_threshold,conservation_threshold,
  hard_stop_threshold,consecutive_failure_threshold,policy_version
) values ('TRENDLYNE_MCP',true,false,100,1500,30,40,1,0.6000,0.7500,0.9000,1.0000,5,1);

create table public.provider_control_events (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.data_sources(code) on delete restrict,
  control_name text not null check (control_name ~ '^[A-Z0-9_]+$'),
  previous_value jsonb,
  new_value jsonb not null,
  actor_id uuid references auth.users(id) on delete restrict,
  actor_kind text not null check (actor_kind in ('SERVICE_ROLE','DATABASE_ADMIN')),
  reason text not null check (reason=btrim(reason) and reason<>'' and length(reason)<=500),
  expires_at timestamptz,
  policy_version integer not null check (policy_version > 0),
  created_at timestamptz not null default now()
);
create index provider_control_events_source_created_idx on public.provider_control_events(source_code,created_at desc);

create table public.provider_budget_reservations (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.data_sources(code) on delete restrict,
  ingestion_run_id uuid not null references public.data_ingestion_runs(id) on delete restrict,
  reservation_key text not null check (reservation_key=btrim(reservation_key) and reservation_key<>'' and length(reservation_key)<=200),
  estimated_units integer not null check (estimated_units > 0),
  consumed_units integer not null default 0 check (consumed_units >= 0),
  failed_units integer not null default 0 check (failed_units >= 0),
  released_units integer not null default 0 check (released_units >= 0),
  status text not null default 'RESERVED' check (status in ('RESERVED','SETTLED','EXPIRED')),
  reserved_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  settled_at timestamptz,
  policy_version integer not null check (policy_version > 0),
  constraint provider_budget_reservation_key unique(source_code,reservation_key),
  constraint provider_budget_reservation_totals check (consumed_units+failed_units+released_units <= estimated_units),
  constraint provider_budget_reservation_state check ((status='RESERVED' and settled_at is null) or (status<>'RESERVED' and settled_at is not null))
);
create index provider_budget_reservations_active_idx on public.provider_budget_reservations(source_code,expires_at) where status='RESERVED';

create table public.data_ingestion_run_items (
  id uuid primary key default gen_random_uuid(),
  ingestion_run_id uuid not null references public.data_ingestion_runs(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  data_domain text not null check (data_domain ~ '^[A-Z0-9_]+$'),
  status text not null default 'PLANNED' check (status in ('PLANNED','SKIPPED_FRESH','SKIPPED_BUDGET','ATTEMPTED','ACCEPTED','UNCHANGED','CONFLICTING','REJECTED','FAILED')),
  safe_reason_code text check (safe_reason_code is null or safe_reason_code ~ '^[A-Z0-9_]+$'),
  attempted_call_count integer not null default 0 check (attempted_call_count >= 0),
  accepted_record_count integer not null default 0 check (accepted_record_count >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  constraint data_ingestion_run_items_key unique(ingestion_run_id,security_id,data_domain),
  constraint data_ingestion_run_item_completion check ((status in ('PLANNED','ATTEMPTED') and completed_at is null) or (status not in ('PLANNED','ATTEMPTED') and completed_at is not null))
);
create index data_ingestion_run_items_security_idx on public.data_ingestion_run_items(security_id,data_domain,completed_at desc);

create table public.provider_usage_events (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.data_sources(code) on delete restrict,
  ingestion_run_id uuid references public.data_ingestion_runs(id) on delete restrict,
  run_item_id uuid references public.data_ingestion_run_items(id) on delete restrict,
  security_id uuid references public.securities(id) on delete restrict,
  data_domain text check (data_domain is null or data_domain ~ '^[A-Z0-9_]+$'),
  operation_class text not null check (operation_class ~ '^[A-Z0-9_]+$'),
  accounting_class text not null check (accounting_class in ('PROVIDER_TOOL_ATTEMPT','TRANSPORT_BOOTSTRAP')),
  estimated_internal_units integer not null default 1 check (estimated_internal_units >= 0),
  actual_internal_units integer not null check (actual_internal_units >= 0),
  provider_reported_units numeric,
  attempted_at timestamptz not null,
  completed_at timestamptz,
  outcome text not null check (outcome in ('SUCCEEDED','FAILED','CANCELLED','UNKNOWN')),
  safe_error_code text check (safe_error_code is null or safe_error_code ~ '^[A-Z0-9_]+$'),
  retry_attempt integer not null default 0 check (retry_attempt >= 0),
  idempotency_key text not null check (idempotency_key=btrim(idempotency_key) and idempotency_key<>''),
  created_at timestamptz not null default now(),
  constraint provider_usage_events_key unique(source_code,idempotency_key),
  constraint provider_usage_failed_counts check (accounting_class<>'PROVIDER_TOOL_ATTEMPT' or actual_internal_units=1)
);
create index provider_usage_events_source_attempt_idx on public.provider_usage_events(source_code,attempted_at desc);

create table public.refresh_domain_policies (
  source_code text not null references public.data_sources(code) on delete restrict,
  data_domain text not null check (data_domain ~ '^[A-Z0-9_]+$'),
  policy_version integer not null check (policy_version > 0),
  is_enabled boolean not null default true,
  freshness_seconds integer check (freshness_seconds is null or freshness_seconds > 0),
  freshness_basis text not null check (freshness_basis in ('ELAPSED_TIME','BUSINESS_DAY_APPROXIMATION','EVENT_WITH_BACKSTOP','DISABLED')),
  cooldown_seconds integer not null default 0 check (cooldown_seconds >= 0),
  retry_schedule_seconds integer[] not null default '{}'::integer[],
  definition jsonb not null default '{}'::jsonb check (jsonb_typeof(definition)='object'),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  primary key(source_code,data_domain,policy_version),
  constraint refresh_domain_policy_dates check (effective_to is null or effective_to>effective_from),
  constraint refresh_domain_policy_disabled check ((is_enabled and freshness_basis<>'DISABLED') or (not is_enabled and freshness_basis='DISABLED'))
);
create unique index refresh_domain_policies_current_key on public.refresh_domain_policies(source_code,data_domain) where effective_to is null;

insert into public.refresh_domain_policies(source_code,data_domain,policy_version,is_enabled,freshness_seconds,freshness_basis,cooldown_seconds,retry_schedule_seconds,definition) values
('TRENDLYNE_MCP','VERIFIED_IDENTITY',1,true,15552000,'ELAPSED_TIME',0,array[30,120,600],'{"description":"Verified provider identity"}'),
('TRENDLYNE_MCP','TTM_FUNDAMENTALS',1,true,604800,'ELAPSED_TIME',0,array[30,120,600],'{"description":"TTM fundamentals"}'),
('TRENDLYNE_MCP','ANNUAL_FUNDAMENTALS',1,true,7776000,'ELAPSED_TIME',0,array[30,120,600],'{"description":"Annual metrics"}'),
('TRENDLYNE_MCP','QUARTERLY_FUNDAMENTALS',1,true,2592000,'ELAPSED_TIME',0,array[30,120,600],'{"description":"Quarterly metrics"}'),
('TRENDLYNE_MCP','VALUATION_EVIDENCE',1,true,86400,'BUSINESS_DAY_APPROXIMATION',0,array[30,120,600],'{"business_day_implementation":"BOUNDED_24_HOUR_APPROXIMATION","price_authority":false}'),
('TRENDLYNE_MCP','OWNERSHIP',1,true,3888000,'ELAPSED_TIME',0,array[30,120,600],'{"description":"Aggregate ownership"}'),
('TRENDLYNE_MCP','DOCUMENT_DISCOVERY',1,true,604800,'EVENT_WITH_BACKSTOP',0,array[30,120,600],'{"event_trigger_implemented":false,"backstop_days":7}'),
('TRENDLYNE_MCP','RAW_MARKET_CAP',1,true,86400,'BUSINESS_DAY_APPROXIMATION',0,array[30,120,600],'{"business_day_implementation":"BOUNDED_24_HOUR_APPROXIMATION","price_authority":false}'),
('TRENDLYNE_MCP','NEWS',1,false,null,'DISABLED',0,'{}','{"stage":"7.2A"}'),
('TRENDLYNE_MCP','CORPORATE_EVENTS',1,false,null,'DISABLED',0,'{}','{"stage":"7.2A","reason":"PROVIDER_MODE_NOT_RELIABLE"}'),
('TRENDLYNE_MCP','TECHNICAL_MARKET_DATA',1,false,null,'DISABLED',0,'{}','{"stage":"7.2A","current_price_authority":"ANGEL_ONE"}');

create table public.security_refresh_states (
  source_code text not null references public.data_sources(code) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  data_domain text not null check (data_domain ~ '^[A-Z0-9_]+$'),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_evidence_change_at timestamptz,
  fresh_until timestamptz,
  next_eligible_refresh_at timestamptz,
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  last_safe_error_code text check (last_safe_error_code is null or last_safe_error_code ~ '^[A-Z0-9_]+$'),
  last_run_id uuid references public.data_ingestion_runs(id) on delete restrict,
  refresh_status text not null default 'MISSING' check (refresh_status in ('MISSING','FRESH','STALE','COOLDOWN','FAILED_WITH_CACHE','FAILED_NO_CACHE')),
  updated_at timestamptz not null default now(),
  primary key(source_code,security_id,data_domain)
);

create or replace function public.portfolioai_reject_provider_audit_mutation()
returns trigger language plpgsql set search_path='' as $$ begin
  raise exception using errcode='55000',message='Provider accounting and audit events are append-only.';
end $$;

create trigger provider_control_events_immutable before update or delete on public.provider_control_events for each row execute function public.portfolioai_reject_provider_audit_mutation();
create trigger provider_usage_events_immutable before update or delete on public.provider_usage_events for each row execute function public.portfolioai_reject_provider_audit_mutation();

create or replace function public.set_provider_ingestion_control_v1(p_source_code text,p_changes jsonb,p_reason text,p_expires_at timestamptz default null)
returns public.provider_ingestion_controls language plpgsql security definer set search_path='' as $$
declare before_row public.provider_ingestion_controls%rowtype; after_row public.provider_ingestion_controls%rowtype; key text; allowed constant text[]:=array['ingestion_enabled','scheduler_enabled','daily_internal_attempt_limit','rolling_internal_attempt_limit','rolling_window_days','per_run_internal_attempt_limit','concurrency_limit','warning_threshold','caution_threshold','conservation_threshold','hard_stop_threshold','consecutive_failure_threshold'];
begin
  if jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb or p_reason is null or btrim(p_reason)='' then raise exception 'Invalid provider control change.'; end if;
  if exists(select 1 from jsonb_object_keys(p_changes) k where not (k=any(allowed))) then raise exception 'Unsupported provider control.'; end if;
  select * into before_row from public.provider_ingestion_controls where source_code=p_source_code for update;
  if not found then raise exception 'Provider control not found.'; end if;
  update public.provider_ingestion_controls set
    ingestion_enabled=coalesce((p_changes->>'ingestion_enabled')::boolean,ingestion_enabled),scheduler_enabled=coalesce((p_changes->>'scheduler_enabled')::boolean,scheduler_enabled),
    daily_internal_attempt_limit=coalesce((p_changes->>'daily_internal_attempt_limit')::integer,daily_internal_attempt_limit),rolling_internal_attempt_limit=coalesce((p_changes->>'rolling_internal_attempt_limit')::integer,rolling_internal_attempt_limit),rolling_window_days=coalesce((p_changes->>'rolling_window_days')::integer,rolling_window_days),per_run_internal_attempt_limit=coalesce((p_changes->>'per_run_internal_attempt_limit')::integer,per_run_internal_attempt_limit),concurrency_limit=coalesce((p_changes->>'concurrency_limit')::integer,concurrency_limit),
    warning_threshold=coalesce((p_changes->>'warning_threshold')::numeric,warning_threshold),caution_threshold=coalesce((p_changes->>'caution_threshold')::numeric,caution_threshold),conservation_threshold=coalesce((p_changes->>'conservation_threshold')::numeric,conservation_threshold),hard_stop_threshold=coalesce((p_changes->>'hard_stop_threshold')::numeric,hard_stop_threshold),consecutive_failure_threshold=coalesce((p_changes->>'consecutive_failure_threshold')::integer,consecutive_failure_threshold),
    policy_version=policy_version+1,updated_at=clock_timestamp(),updated_by=auth.uid() where source_code=p_source_code returning * into after_row;
  for key in select jsonb_object_keys(p_changes) loop
    insert into public.provider_control_events(source_code,control_name,previous_value,new_value,actor_id,actor_kind,reason,expires_at,policy_version)
    values(p_source_code,upper(key),to_jsonb(before_row)->key,to_jsonb(after_row)->key,auth.uid(),'SERVICE_ROLE',p_reason,p_expires_at,after_row.policy_version);
  end loop;
  return after_row;
end $$;

create or replace function public.reserve_provider_budget_v1(
  p_source_code text,p_ingestion_run_id uuid,p_reservation_key text,p_estimated_units integer,p_reservation_seconds integer default 900
) returns table(reservation_id uuid,reserved boolean,reason_code text,policy_version integer)
language plpgsql security definer set search_path='' as $$
declare c public.provider_ingestion_controls%rowtype; existing public.provider_budget_reservations%rowtype;
  daily_used bigint; rolling_used bigint; active_reserved bigint; run_reserved bigint; active_runs bigint; new_id uuid;
begin
  if p_estimated_units<1 or p_reservation_seconds<1 or p_reservation_seconds>3600 then raise exception 'Invalid provider budget reservation.'; end if;
  select * into c from public.provider_ingestion_controls where source_code=p_source_code for update;
  if not found then return query select null::uuid,false,'CONTROL_NOT_CONFIGURED'::text,null::integer; return; end if;
  select * into existing from public.provider_budget_reservations where source_code=p_source_code and reservation_key=p_reservation_key;
  if found then return query select existing.id,existing.status='RESERVED','IDEMPOTENT_REPLAY'::text,existing.policy_version; return; end if;
  update public.provider_budget_reservations set status='EXPIRED',settled_at=clock_timestamp(),released_units=estimated_units-consumed_units-failed_units
    where source_code=p_source_code and status='RESERVED' and expires_at<=clock_timestamp();
  if not c.ingestion_enabled then return query select null::uuid,false,'INGESTION_DISABLED'::text,c.policy_version; return; end if;
  select coalesce(sum(actual_internal_units),0) into daily_used from public.provider_usage_events where source_code=p_source_code and accounting_class='PROVIDER_TOOL_ATTEMPT' and attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  select coalesce(sum(actual_internal_units),0) into rolling_used from public.provider_usage_events where source_code=p_source_code and accounting_class='PROVIDER_TOOL_ATTEMPT' and attempted_at>=clock_timestamp()-make_interval(days=>c.rolling_window_days);
  select coalesce(sum(estimated_units-consumed_units-failed_units-released_units),0),count(distinct ingestion_run_id) into active_reserved,active_runs from public.provider_budget_reservations where source_code=p_source_code and status='RESERVED' and expires_at>clock_timestamp();
  select coalesce(sum(estimated_units),0) into run_reserved from public.provider_budget_reservations where source_code=p_source_code and ingestion_run_id=p_ingestion_run_id and status in ('RESERVED','SETTLED');
  if run_reserved+p_estimated_units>c.per_run_internal_attempt_limit then return query select null::uuid,false,'PER_RUN_LIMIT'::text,c.policy_version; return; end if;
  if daily_used+active_reserved+p_estimated_units>c.daily_internal_attempt_limit then return query select null::uuid,false,'DAILY_LIMIT'::text,c.policy_version; return; end if;
  if rolling_used+active_reserved+p_estimated_units>c.rolling_internal_attempt_limit then return query select null::uuid,false,'ROLLING_LIMIT'::text,c.policy_version; return; end if;
  if active_runs>=c.concurrency_limit and not exists(select 1 from public.provider_budget_reservations where source_code=p_source_code and ingestion_run_id=p_ingestion_run_id and status='RESERVED' and expires_at>clock_timestamp()) then return query select null::uuid,false,'CONCURRENCY_LIMIT'::text,c.policy_version; return; end if;
  insert into public.provider_budget_reservations(source_code,ingestion_run_id,reservation_key,estimated_units,expires_at,policy_version)
    values(p_source_code,p_ingestion_run_id,p_reservation_key,p_estimated_units,clock_timestamp()+make_interval(secs=>p_reservation_seconds),c.policy_version) returning id into new_id;
  return query select new_id,true,'RESERVED'::text,c.policy_version;
end $$;

create or replace function public.settle_provider_budget_v1(p_reservation_id uuid,p_consumed_units integer,p_failed_units integer,p_released_units integer)
returns table(reservation_id uuid,status text,consumed_units integer,failed_units integer,released_units integer)
language plpgsql security definer set search_path='' as $$
declare r public.provider_budget_reservations%rowtype;
begin
  if least(p_consumed_units,p_failed_units,p_released_units)<0 then raise exception 'Invalid provider budget settlement.'; end if;
  select * into r from public.provider_budget_reservations where id=p_reservation_id for update;
  if not found then raise exception 'Provider budget reservation not found.'; end if;
  if r.status<>'RESERVED' then
    if r.consumed_units<>p_consumed_units or r.failed_units<>p_failed_units or r.released_units<>p_released_units then raise exception 'Provider budget reservation already settled differently.'; end if;
    return query select r.id,r.status,r.consumed_units,r.failed_units,r.released_units; return;
  end if;
  if p_consumed_units+p_failed_units+p_released_units<>r.estimated_units then raise exception 'Settlement must account for every reserved unit.'; end if;
  update public.provider_budget_reservations set consumed_units=p_consumed_units,failed_units=p_failed_units,released_units=p_released_units,status='SETTLED',settled_at=clock_timestamp() where id=r.id
    returning * into r;
  return query select r.id,r.status,r.consumed_units,r.failed_units,r.released_units;
end $$;

create or replace function public.record_provider_usage_event_v1(
  p_source_code text,p_ingestion_run_id uuid,p_run_item_id uuid,p_security_id uuid,p_data_domain text,p_operation_class text,
  p_accounting_class text,p_estimated_internal_units integer,p_actual_internal_units integer,p_attempted_at timestamptz,
  p_completed_at timestamptz,p_outcome text,p_safe_error_code text,p_retry_attempt integer,p_idempotency_key text
) returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid;
begin
  insert into public.provider_usage_events(source_code,ingestion_run_id,run_item_id,security_id,data_domain,operation_class,accounting_class,estimated_internal_units,actual_internal_units,attempted_at,completed_at,outcome,safe_error_code,retry_attempt,idempotency_key)
  values(p_source_code,p_ingestion_run_id,p_run_item_id,p_security_id,p_data_domain,p_operation_class,p_accounting_class,p_estimated_internal_units,p_actual_internal_units,p_attempted_at,p_completed_at,p_outcome,p_safe_error_code,p_retry_attempt,p_idempotency_key)
  on conflict(source_code,idempotency_key) do nothing returning id into result_id;
  if result_id is null then select id into result_id from public.provider_usage_events where source_code=p_source_code and idempotency_key=p_idempotency_key; end if;
  return result_id;
end $$;

create or replace function public.record_refresh_item_result_v1(p_run_item_id uuid,p_status text,p_safe_reason_code text,p_attempted_call_count integer,p_accepted_record_count integer,p_metadata jsonb default '{}'::jsonb)
returns public.data_ingestion_run_items language plpgsql security definer set search_path='' as $$
declare item public.data_ingestion_run_items%rowtype;
begin
  if p_status not in ('SKIPPED_FRESH','SKIPPED_BUDGET','ACCEPTED','UNCHANGED','CONFLICTING','REJECTED','FAILED') or p_attempted_call_count<0 or p_accepted_record_count<0 or jsonb_typeof(p_metadata)<>'object' then raise exception 'Invalid refresh item result.'; end if;
  select * into item from public.data_ingestion_run_items where id=p_run_item_id for update;
  if not found then raise exception 'Refresh item not found.'; end if;
  if item.completed_at is not null then
    if item.status<>p_status or item.safe_reason_code is distinct from p_safe_reason_code or item.attempted_call_count<>p_attempted_call_count or item.accepted_record_count<>p_accepted_record_count then raise exception 'Refresh item already completed differently.'; end if;
    return item;
  end if;
  update public.data_ingestion_run_items set status=p_status,safe_reason_code=p_safe_reason_code,attempted_call_count=p_attempted_call_count,accepted_record_count=p_accepted_record_count,metadata=p_metadata,completed_at=clock_timestamp() where id=p_run_item_id returning * into item;
  return item;
end $$;

create or replace function public.get_provider_operational_summary_v1(p_source_code text default 'TRENDLYNE_MCP')
returns table(source_code text,provider_name text,ingestion_enabled boolean,scheduler_enabled boolean,daily_internal_attempt_limit integer,daily_observed_usage bigint,rolling_internal_attempt_limit integer,rolling_observed_usage bigint,daily_remaining bigint,rolling_remaining bigint,utilization_state text,active_reservations bigint,active_orchestrations bigint,last_successful_run_at timestamptz,last_failed_run_at timestamptz,latest_safe_error text,actual_provider_quota_status text,policy_version integer)
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  return query select c.source_code,d.name,c.ingestion_enabled,c.scheduler_enabled,c.daily_internal_attempt_limit,
    coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::bigint,
    c.rolling_internal_attempt_limit,coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=clock_timestamp()-make_interval(days=>c.rolling_window_days)),0)::bigint,
    greatest(c.daily_internal_attempt_limit-coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0),0)::bigint,
    greatest(c.rolling_internal_attempt_limit-coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=clock_timestamp()-make_interval(days=>c.rolling_window_days)),0),0)::bigint,
    case when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.hard_stop_threshold then 'HARD_STOP' when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.conservation_threshold then 'CONSERVATION' when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.caution_threshold then 'CAUTION' when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.warning_threshold then 'WARNING' else 'NORMAL' end,
    (select count(*) from public.provider_budget_reservations r where r.source_code=c.source_code and r.status='RESERVED' and r.expires_at>clock_timestamp()),
    (select count(distinct r.ingestion_run_id) from public.provider_budget_reservations r where r.source_code=c.source_code and r.status='RESERVED' and r.expires_at>clock_timestamp()),
    (select max(r.completed_at) from public.data_ingestion_runs r where r.source_code=c.source_code and r.status='SUCCEEDED'),
    (select max(r.completed_at) from public.data_ingestion_runs r where r.source_code=c.source_code and r.status='FAILED'),
    (select r.error_summary from public.data_ingestion_runs r where r.source_code=c.source_code and r.error_summary is not null order by r.completed_at desc nulls last limit 1),
    c.actual_provider_quota_status,c.policy_version
  from public.provider_ingestion_controls c join public.data_sources d on d.code=c.source_code where c.source_code=p_source_code;
end $$;

alter table public.provider_ingestion_controls enable row level security;
alter table public.provider_control_events enable row level security;
alter table public.provider_budget_reservations enable row level security;
alter table public.provider_usage_events enable row level security;
alter table public.data_ingestion_run_items enable row level security;
alter table public.refresh_domain_policies enable row level security;
alter table public.security_refresh_states enable row level security;

revoke all on table public.provider_ingestion_controls,public.provider_control_events,public.provider_budget_reservations,public.provider_usage_events,public.data_ingestion_run_items,public.refresh_domain_policies,public.security_refresh_states from anon,authenticated;
revoke insert,update,delete,truncate on table public.provider_ingestion_controls from service_role;
grant select on table public.provider_ingestion_controls to service_role;
revoke all on function public.set_provider_ingestion_control_v1(text,jsonb,text,timestamptz),public.reserve_provider_budget_v1(text,uuid,text,integer,integer),public.settle_provider_budget_v1(uuid,integer,integer,integer),public.record_provider_usage_event_v1(text,uuid,uuid,uuid,text,text,text,integer,integer,timestamptz,timestamptz,text,text,integer,text),public.record_refresh_item_result_v1(uuid,text,text,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.set_provider_ingestion_control_v1(text,jsonb,text,timestamptz),public.reserve_provider_budget_v1(text,uuid,text,integer,integer),public.settle_provider_budget_v1(uuid,integer,integer,integer),public.record_provider_usage_event_v1(text,uuid,uuid,uuid,text,text,text,integer,integer,timestamptz,timestamptz,text,text,integer,text),public.record_refresh_item_result_v1(uuid,text,text,integer,integer,jsonb) to service_role;
revoke all on function public.get_provider_operational_summary_v1(text) from public,anon;
grant execute on function public.get_provider_operational_summary_v1(text) to authenticated,service_role;

comment on table public.provider_ingestion_controls is 'PortfolioAI internal provider safety controls. Limits are not provider contractual quotas.';
comment on table public.provider_usage_events is 'Append-only internal provider-call accounting without credentials, headers, or request payloads.';
comment on table public.security_refresh_states is 'Mutable operational refresh projection; immutable evidence remains authoritative.';
comment on function public.get_provider_operational_summary_v1(text) is 'Safe authenticated operational summary; actual provider quota remains UNKNOWN until independently verified.';
