-- Canonical source-of-truth reconciliation for the production N5 scheduler state.
-- This migration intentionally contains no secret values. The three Vault secrets
-- named below must be provisioned out-of-band before scheduler execution:
--   portfolioai_nse_news_scheduler_token
--   portfolioai_publishable_key
--   portfolioai_api_url
--
-- Production already has this state. This file exists so a fresh environment and
-- the canonical repository describe the same scheduler/security contract.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.verify_news_pipeline_scheduler_token_v1(p_token text)
returns boolean
language sql
security definer
set search_path = 'public', 'vault'
as $function$
  select coalesce(
    p_token is not null
    and exists (
      select 1
      from vault.decrypted_secrets s
      where s.name = 'portfolioai_nse_news_scheduler_token'
        and s.decrypted_secret = p_token
    ),
    false
  );
$function$;

revoke all on function public.verify_news_pipeline_scheduler_token_v1(text) from public, anon, authenticated;
grant execute on function public.verify_news_pipeline_scheduler_token_v1(text) to service_role;

create or replace function public.invoke_nse_news_pipeline_scheduled_v1()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_scheduler_token text;
  v_publishable_key text;
  v_api_url text;
  v_portfolio record;
  v_request_id bigint;
  v_enqueued integer := 0;
  v_freshness_seconds integer;
  v_min_interval_seconds integer;
begin
  select rdp.freshness_seconds
    into v_freshness_seconds
  from public.refresh_domain_policies rdp
  where rdp.source_code = 'COMPANY_EXCHANGE_FILING'
    and rdp.data_domain = 'NEWS'
    and rdp.is_enabled = true
    and rdp.effective_to is null
    and coalesce((rdp.definition ->> 'scheduler_allowed')::boolean, false) = true
  order by rdp.policy_version desc
  limit 1;

  if v_freshness_seconds is null then
    raise exception 'NSE_NEWS_SCHEDULER_POLICY_NOT_ACTIVE';
  end if;

  -- One-minute grace prevents cron jitter from turning a */30 cadence into hourly.
  v_min_interval_seconds := greatest(v_freshness_seconds - 60, 0);

  select decrypted_secret into v_scheduler_token
  from vault.decrypted_secrets
  where name = 'portfolioai_nse_news_scheduler_token';

  select decrypted_secret into v_publishable_key
  from vault.decrypted_secrets
  where name = 'portfolioai_publishable_key';

  select decrypted_secret into v_api_url
  from vault.decrypted_secrets
  where name = 'portfolioai_api_url';

  if v_scheduler_token is null or v_publishable_key is null or v_api_url is null then
    raise exception 'NSE_NEWS_SCHEDULER_CONFIGURATION_INCOMPLETE';
  end if;

  for v_portfolio in
    select p.id
    from public.portfolios p
    order by p.created_at asc
  loop
    if exists (
      select 1
      from public.data_ingestion_runs r
      where r.portfolio_id = v_portfolio.id
        and r.source_code = 'COMPANY_EXCHANGE_FILING'
        and r.operation = 'NSE_NEWS_PIPELINE'
        and r.status = 'SUCCEEDED'
        and r.metadata ->> 'action' = 'SCHEDULED_RUN'
        and r.started_at > clock_timestamp() - make_interval(secs => v_min_interval_seconds)
    ) then
      continue;
    end if;

    select net.http_post(
      url := rtrim(v_api_url, '/') || '/functions/v1/run-nse-news-pipeline',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_publishable_key,
        'apikey', v_publishable_key,
        'x-portfolioai-scheduler-token', v_scheduler_token
      ),
      body := jsonb_build_object(
        'action', 'SCHEDULED_RUN',
        'portfolioId', v_portfolio.id::text
      ),
      timeout_milliseconds := 120000
    ) into v_request_id;

    if v_request_id is null then
      raise exception 'NSE_NEWS_SCHEDULER_ENQUEUE_FAILED';
    end if;

    v_enqueued := v_enqueued + 1;
  end loop;

  return v_enqueued;
end;
$function$;

revoke all on function public.invoke_nse_news_pipeline_scheduled_v1() from public, anon, authenticated;
grant execute on function public.invoke_nse_news_pipeline_scheduled_v1() to service_role;

-- Reconcile the active NEWS policy to V7 without creating duplicate active rows.
do $block$
declare
  v_current_version integer;
  v_definition jsonb;
  v_freshness_basis text;
  v_cooldown_seconds integer;
  v_retry_schedule_seconds integer[];
begin
  select policy_version, definition, freshness_basis, cooldown_seconds, retry_schedule_seconds
    into v_current_version, v_definition, v_freshness_basis, v_cooldown_seconds, v_retry_schedule_seconds
  from public.refresh_domain_policies
  where source_code = 'COMPANY_EXCHANGE_FILING'
    and data_domain = 'NEWS'
    and effective_to is null
  order by policy_version desc
  limit 1;

  if v_current_version is null then
    raise exception 'NSE_NEWS_BASE_POLICY_MISSING';
  end if;

  if v_current_version < 7 then
    update public.refresh_domain_policies
      set effective_to = clock_timestamp(), is_enabled = false
    where source_code = 'COMPANY_EXCHANGE_FILING'
      and data_domain = 'NEWS'
      and effective_to is null;

    insert into public.refresh_domain_policies(
      source_code, data_domain, policy_version, is_enabled, freshness_seconds,
      freshness_basis, cooldown_seconds, retry_schedule_seconds,
      effective_from, effective_to, definition
    ) values (
      'COMPANY_EXCHANGE_FILING', 'NEWS', 7, true, 1800,
      coalesce(v_freshness_basis, 'ELAPSED_TIME'), coalesce(v_cooldown_seconds, 30), coalesce(v_retry_schedule_seconds, '{}'::integer[]),
      clock_timestamp(), null,
      coalesce(v_definition, '{}'::jsonb) || jsonb_build_object(
        'stage', 'N5',
        'mode', 'AUTOMATED_NSE_NEWS_PIPELINE',
        'dry_run_allowed', true,
        'manual_run_allowed', false,
        'scheduler_allowed', true,
        'scheduler_cadence_minutes', 30,
        'scheduler_activation_approved', true,
        'scheduler_activation_requires_separate_approval', true,
        'external_fetches_allowed', true,
        'normalization_enabled', true,
        'linked_document_capture_enabled', true,
        'linked_document_parsing_enabled', true,
        'deterministic_classification_enabled', true,
        'max_linked_document_fetches_per_run', 3,
        'max_linked_document_work_items_per_run', 3,
        'max_matched_items_per_run', 100,
        'max_feed_bytes', 1048576,
        'max_document_bytes', 5242880,
        'max_pdf_pages', 12,
        'max_extracted_text_chars', 20000,
        'parser_version', 'nse-rss-v1',
        'classifier_version', 'nse-importance-tone-v1',
        'extraction_version', 'unpdf@1.8.1',
        'provider_budget_reservations', 0,
        'ocr_enabled', false,
        'ai_enabled', false
      )
    );
  elsif v_current_version = 7 then
    update public.refresh_domain_policies
      set is_enabled = true,
          freshness_seconds = 1800,
          definition = definition || jsonb_build_object(
            'manual_run_allowed', false,
            'scheduler_allowed', true,
            'scheduler_cadence_minutes', 30,
            'provider_budget_reservations', 0,
            'ocr_enabled', false,
            'ai_enabled', false
          )
    where source_code = 'COMPANY_EXCHANGE_FILING'
      and data_domain = 'NEWS'
      and policy_version = 7
      and effective_to is null;
  else
    -- Never roll a newer policy backwards.
    null;
  end if;
end;
$block$;

-- Idempotently reconcile both production schedules.
do $block$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'portfolioai-n5-nse-news-30min' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'portfolioai-n5-nse-news-30min',
    '*/30 * * * *',
    'select public.invoke_nse_news_pipeline_scheduled_v1();'
  );

  select jobid into v_job_id from cron.job where jobname = 'portfolioai-news-evidence-classification-30min' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'portfolioai-news-evidence-classification-30min',
    '5,35 * * * *',
    'select public.reclassify_unclassified_news_from_stored_evidence_v1(100);'
  );
end;
$block$;
