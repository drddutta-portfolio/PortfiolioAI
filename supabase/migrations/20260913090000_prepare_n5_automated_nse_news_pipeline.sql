-- Stage N5 preparation: consolidated automated NSE news pipeline.
-- Repository preparation only. Applying this migration does NOT enable the scheduler
-- and does NOT authorize a live write run. It enables one owner-controlled dry run.

create table if not exists public.news_pipeline_leases (
  source_code text not null references public.data_sources(code) on delete restrict,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  lease_holder uuid not null,
  acquired_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  cooldown_until timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (source_code, portfolio_id),
  constraint news_pipeline_lease_expiry check (expires_at > acquired_at)
);

alter table public.news_pipeline_leases enable row level security;
revoke all on table public.news_pipeline_leases from public, anon, authenticated;

create or replace function public.acquire_news_pipeline_lease_v1(
  p_source_code text,
  p_portfolio_id uuid,
  p_lease_holder uuid,
  p_lease_seconds integer default 240
)
returns table(acquired boolean, retry_after integer)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_retry integer := 0;
begin
  if p_source_code is null or p_portfolio_id is null or p_lease_holder is null or p_lease_seconds < 30 or p_lease_seconds > 900 then
    raise exception using errcode='22023', message='Invalid news-pipeline lease request.';
  end if;

  insert into public.news_pipeline_leases(source_code,portfolio_id,lease_holder,acquired_at,expires_at,cooldown_until,updated_at)
  values(p_source_code,p_portfolio_id,p_lease_holder,v_now,v_now+make_interval(secs=>p_lease_seconds),v_now,v_now)
  on conflict(source_code,portfolio_id) do update
    set lease_holder=excluded.lease_holder,
        acquired_at=excluded.acquired_at,
        expires_at=excluded.expires_at,
        cooldown_until=excluded.cooldown_until,
        updated_at=excluded.updated_at
  where public.news_pipeline_leases.expires_at <= v_now
    and public.news_pipeline_leases.cooldown_until <= v_now;

  if exists(
    select 1 from public.news_pipeline_leases
    where source_code=p_source_code and portfolio_id=p_portfolio_id and lease_holder=p_lease_holder
  ) then
    return query select true,0;
    return;
  end if;

  select greatest(1,ceil(extract(epoch from greatest(expires_at,cooldown_until)-v_now))::integer)
  into v_retry
  from public.news_pipeline_leases
  where source_code=p_source_code and portfolio_id=p_portfolio_id;
  return query select false,coalesce(v_retry,1);
end $$;

create or replace function public.release_news_pipeline_lease_v1(
  p_source_code text,
  p_portfolio_id uuid,
  p_lease_holder uuid,
  p_cooldown_seconds integer default 30
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_updated integer;
begin
  if p_cooldown_seconds < 0 or p_cooldown_seconds > 3600 then
    raise exception using errcode='22023', message='Invalid news-pipeline cooldown.';
  end if;
  update public.news_pipeline_leases
  set expires_at=clock_timestamp(),
      cooldown_until=clock_timestamp()+make_interval(secs=>p_cooldown_seconds),
      updated_at=clock_timestamp()
  where source_code=p_source_code and portfolio_id=p_portfolio_id and lease_holder=p_lease_holder;
  get diagnostics v_updated=row_count;
  return v_updated=1;
end $$;

revoke all on function public.acquire_news_pipeline_lease_v1(text,uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.release_news_pipeline_lease_v1(text,uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.acquire_news_pipeline_lease_v1(text,uuid,uuid,integer) to service_role;
grant execute on function public.release_news_pipeline_lease_v1(text,uuid,uuid,integer) to service_role;

-- Stable source-record identities for the consolidated path. Pilot record kinds are
-- intentionally excluded so prior validated evidence remains untouched.
create unique index if not exists data_source_records_nse_automation_external_key
  on public.data_source_records(source_code,record_kind,external_record_id)
  where record_kind in (
    'NSE_NEWS_RSS_RESPONSE',
    'NSE_NEWS_LINKED_DOCUMENT',
    'NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION'
  );

update public.refresh_domain_policies
set effective_to=now()
where source_code='COMPANY_EXCHANGE_FILING'
  and data_domain='NEWS'
  and effective_to is null;

insert into public.refresh_domain_policies(
  source_code,data_domain,policy_version,is_enabled,freshness_seconds,freshness_basis,
  cooldown_seconds,retry_schedule_seconds,definition,effective_from
) values (
  'COMPANY_EXCHANGE_FILING','NEWS',6,true,1800,'ELAPSED_TIME',30,'{}'::integer[],
  '{
    "stage":"N5",
    "mode":"AUTOMATED_NSE_NEWS_PIPELINE",
    "dry_run_allowed":true,
    "manual_run_allowed":false,
    "scheduler_allowed":false,
    "external_fetches_allowed":true,
    "normalization_enabled":true,
    "linked_document_capture_enabled":true,
    "linked_document_parsing_enabled":true,
    "deterministic_classification_enabled":true,
    "max_linked_document_fetches_per_run":3,
    "max_linked_document_work_items_per_run":3,
    "max_matched_items_per_run":100,
    "max_feed_bytes":1048576,
    "max_document_bytes":5242880,
    "max_pdf_pages":12,
    "max_extracted_text_chars":20000,
    "parser_version":"nse-rss-v1",
    "classifier_version":"nse-importance-tone-v1",
    "extraction_version":"unpdf@1.8.1",
    "ocr_enabled":false,
    "ai_enabled":false,
    "provider_budget_reservations":0,
    "scheduler_activation_requires_separate_approval":true
  }'::jsonb,
  now()
);

comment on table public.news_pipeline_leases is 'Service-only concurrency lease for consolidated official NSE news ingestion. No browser access.';
comment on function public.acquire_news_pipeline_lease_v1(text,uuid,uuid,integer) is 'Service-only atomic lease acquisition for NSE news orchestration.';
comment on function public.release_news_pipeline_lease_v1(text,uuid,uuid,integer) is 'Service-only release/cooldown for NSE news orchestration.';
