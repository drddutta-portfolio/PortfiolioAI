-- Curated PortfolioAI local operational defaults V1.
-- Candidate only. Local schedulers remain disabled unless explicitly opted in.
do $candidate$
begin
  if coalesce(current_setting('portfolioai.enable_local_schedulers', true), 'off') <> 'on' then
    raise notice 'PortfolioAI local scheduler defaults skipped; opt-in setting is not on.';
    return;
  end if;

  if to_regclass('cron.job') is null then
    raise exception 'PORTFOLIOAI_LOCAL_SCHEDULER_PREREQUISITE_MISSING';
  end if;

  perform cron.schedule(
    'portfolioai-n5-nse-news-30min',
    '*/30 * * * *',
    'select public.invoke_nse_news_pipeline_scheduled_v1();'
  );
  perform cron.schedule(
    'portfolioai-news-evidence-classification-30min',
    '5,35 * * * *',
    'select public.reclassify_unclassified_news_from_stored_evidence_v1(100);'
  );
end
$candidate$;
