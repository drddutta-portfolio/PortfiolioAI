-- Development-only news scheduler recovery. Credentials must be separately provisioned in Vault.
create table if not exists public.portfolio_news_refresh_settings (
 portfolio_id uuid primary key references public.portfolios(id) on delete cascade,
 interval_hours smallint not null default 6 check (interval_hours in (1,3,6,12)),
 updated_at timestamptz not null default now()
);
alter table public.portfolio_news_refresh_settings enable row level security;
grant select,insert,update on public.portfolio_news_refresh_settings to authenticated;
create policy news_refresh_owner_select on public.portfolio_news_refresh_settings for select to authenticated
using (exists(select 1 from public.portfolios p where p.id=portfolio_id and p.user_id=(select auth.uid())));
create policy news_refresh_owner_insert on public.portfolio_news_refresh_settings for insert to authenticated
with check (exists(select 1 from public.portfolios p where p.id=portfolio_id and p.user_id=(select auth.uid())));
create policy news_refresh_owner_update on public.portfolio_news_refresh_settings for update to authenticated
using (exists(select 1 from public.portfolios p where p.id=portfolio_id and p.user_id=(select auth.uid())))
with check (exists(select 1 from public.portfolios p where p.id=portfolio_id and p.user_id=(select auth.uid())));

create or replace function public.news_refresh_status_v1(p_portfolio_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare n integer; t timestamptz; s text;
begin
 if auth.uid() is null or not exists(select 1 from public.portfolios where id=p_portfolio_id and user_id=auth.uid()) then
 raise exception 'NEWS_PORTFOLIO_ACCESS_DENIED' using errcode='42501'; end if;
 select coalesce(r.interval_hours,6) into n from public.portfolios p
 left join public.portfolio_news_refresh_settings r on r.portfolio_id=p.id where p.id=p_portfolio_id;
 select started_at,status into t,s from public.data_ingestion_runs
 where portfolio_id=p_portfolio_id and operation='NSE_NEWS_PIPELINE'
 and metadata->>'action'='SCHEDULED_RUN' order by started_at desc limit 1;
 return jsonb_build_object('interval_hours',n,'last_run_at',t,'last_run_status',s,
 'health',case when t is null then 'NEVER_RUN' when s='FAILED' then 'FAILED'
 when s='PARTIAL' then 'PARTIAL' when s='RUNNING' then 'RUNNING'
 when t < now()-make_interval(hours=>n+1) then 'STALE' else 'CURRENT' end);
end $fn$;
revoke all on function public.news_refresh_status_v1(uuid) from public,anon,authenticated;
grant execute on function public.news_refresh_status_v1(uuid) to authenticated;

-- Runs hourly but invokes per-portfolio only when the selected interval is due.
create or replace function public.invoke_nse_news_pipeline_scheduled_v1()
returns integer language plpgsql security definer set search_path='' as $fn$
declare token text; anon_key text; api_url text; p record; latest timestamptz; request_id bigint; dispatched integer:=0;
begin
 if not exists(select 1 from public.refresh_domain_policies r
 where r.data_domain='NEWS' and r.source_code='COMPANY_EXCHANGE_FILING' and r.is_enabled
 and r.effective_to is null and (r.definition->>'scheduler_allowed')::boolean=true) then
 raise exception 'NSE_NEWS_SCHEDULER_POLICY_NOT_ACTIVE'; end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='portfolioai_nse_news_scheduler_token';
 select decrypted_secret into anon_key from vault.decrypted_secrets where name='portfolioai_publishable_key';
 select decrypted_secret into api_url from vault.decrypted_secrets where name='portfolioai_api_url';
 if nullif(token,'') is null or nullif(anon_key,'') is null or nullif(api_url,'') is null then
 raise exception 'NSE_NEWS_SCHEDULER_CONFIGURATION_INCOMPLETE'; end if;
 for p in select pf.id,coalesce(ns.interval_hours,6) as interval_hours
 from public.portfolios pf left join public.portfolio_news_refresh_settings ns on ns.portfolio_id=pf.id
 where pf.is_active order by pf.created_at loop
 select max(started_at) into latest from public.data_ingestion_runs
 where portfolio_id=p.id and operation='NSE_NEWS_PIPELINE' and metadata->>'action'='SCHEDULED_RUN';
 if latest is not null and latest>now()-make_interval(hours=>p.interval_hours) then continue; end if;
 select net.http_post(
 url:=rtrim(api_url,'/')||'/functions/v1/run-nse-news-pipeline',
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||anon_key,
 'apikey',anon_key,'x-portfolioai-scheduler-token',token),
 body:=jsonb_build_object('action','SCHEDULED_RUN','portfolioId',p.id::text),
 timeout_milliseconds:=120000) into request_id;
 if request_id is null then raise exception 'NEWS_SCHEDULER_ENQUEUE_FAILED'; end if;
 dispatched:=dispatched+1;
 end loop;
 return dispatched;
end $fn$;
revoke all on function public.invoke_nse_news_pipeline_scheduled_v1() from public,anon,authenticated;
grant execute on function public.invoke_nse_news_pipeline_scheduled_v1() to service_role;
do $schedule$
declare j bigint;
begin
 for j in select jobid from cron.job where jobname in
 ('portfolioai-n5-nse-news-30min','portfolioai-news-evidence-classification-30min',
 'portfolioai-n5-nse-news-hourly','portfolioai-news-evidence-classification-hourly')
 loop perform cron.unschedule(j); end loop;
 perform cron.schedule('portfolioai-n5-nse-news-hourly','0 * * * *',
 'select public.invoke_nse_news_pipeline_scheduled_v1();');
 perform cron.schedule('portfolioai-news-evidence-classification-hourly','5 * * * *',
 'select public.reclassify_unclassified_news_from_stored_evidence_v1(100);');
end $schedule$;
