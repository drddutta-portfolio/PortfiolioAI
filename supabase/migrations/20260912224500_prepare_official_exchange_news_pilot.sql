-- Stage N3C preparation: official exchange news pilot and tone-ready cached feed.
-- Repository preparation only until explicitly approved for production application.

alter table public.news_items
  add column tone_state text not null default 'UNCLASSIFIED'
    check (tone_state in ('POSITIVE','NEUTRAL','NEGATIVE','UNCLASSIFIED')),
  add column tone_method text not null default 'UNCLASSIFIED'
    check (tone_method in ('DETERMINISTIC','AI_ASSISTED','SOURCE_PROVIDED','UNCLASSIFIED')),
  add column tone_confidence numeric(5,4)
    check (tone_confidence is null or (tone_confidence >= 0 and tone_confidence <= 1)),
  add column tone_reason text
    check (tone_reason is null or (tone_reason=btrim(tone_reason) and tone_reason<>'' and length(tone_reason)<=1000));

comment on column public.news_items.tone_state is 'Direction of the reported event for visual scanning only; never a Buy/Sell recommendation.';
comment on column public.news_items.tone_method is 'Provenance method used to assign tone. N3C raw ingestion leaves this UNCLASSIFIED.';
comment on column public.news_items.tone_confidence is 'Optional bounded 0..1 confidence for a classified tone.';
comment on column public.news_items.tone_reason is 'Short evidence-grounded explanation of tone assignment; not investment advice.';

-- Reuse the existing authoritative public primary-filing source instead of creating a transport-specific source.
update public.data_sources
set capabilities = capabilities || '{"news":true,"nse_rss":true}'::jsonb,
    configuration = configuration || '{"news_transport_policy":{"nse_rss":"PILOT_ONLY","bse_undocumented_api":"DISALLOWED"}}'::jsonb,
    updated_at = now()
where code='COMPANY_EXCHANGE_FILING';

insert into public.refresh_domain_policies(
  source_code,data_domain,policy_version,is_enabled,freshness_seconds,freshness_basis,
  cooldown_seconds,retry_schedule_seconds,definition,effective_from
) values (
  'COMPANY_EXCHANGE_FILING','NEWS',1,true,1800,'ELAPSED_TIME',0,'{}'::integer[],
  '{"stage":"N3C","mode":"OWNER_CONTROLLED_NSE_RSS_PILOT_ONLY","scheduler_allowed":false,"normalization_enabled":false,"tone_classification_enabled":false,"transport":"NSE_RSS","feed":"CORPORATE_ANNOUNCEMENTS","max_external_fetches_per_pilot":1}'::jsonb,
  now()
);

-- Keep the existing V1 feed contract stable; V2 adds tone fields for later Dashboard use.
create or replace function public.get_portfolio_news_feed_v2(
  p_portfolio_id uuid,
  p_security_ids uuid[] default null,
  p_limit integer default 40,
  p_before timestamptz default null
)
returns table(
  news_item_id uuid,
  security_id uuid,
  symbol text,
  company_name text,
  headline text,
  category text,
  importance_state text,
  tone_state text,
  tone_method text,
  tone_confidence numeric,
  tone_reason text,
  published_at timestamptz,
  publication_precision text,
  source_name text,
  source_url text,
  first_seen_at timestamptz
)
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception using errcode='22023', message='Invalid news feed limit.';
  end if;

  if not exists (
    select 1 from public.portfolios p
    where p.id=p_portfolio_id and p.user_id=(select auth.uid())
  ) then
    raise exception using errcode='42501', message='Portfolio not found or not owned by caller.';
  end if;

  if p_security_ids is not null and exists (
    select 1 from unnest(p_security_ids) requested_security_id
    where not exists (
      select 1 from public.current_holdings ch
      where ch.portfolio_id=p_portfolio_id
        and ch.security_id=requested_security_id
        and ch.current_quantity>0
    )
  ) then
    raise exception using errcode='42501', message='News scope contains a non-held security.';
  end if;

  return query
  select
    n.id,
    n.security_id,
    s.symbol,
    s.name,
    n.headline,
    n.category,
    n.importance_state,
    n.tone_state,
    n.tone_method,
    n.tone_confidence,
    n.tone_reason,
    n.published_at,
    n.publication_precision,
    n.primary_source_name,
    n.primary_source_url,
    n.first_seen_at
  from public.news_items n
  join public.securities s on s.id=n.security_id
  where n.is_active
    and exists (
      select 1 from public.current_holdings ch
      where ch.portfolio_id=p_portfolio_id
        and ch.security_id=n.security_id
        and ch.current_quantity>0
    )
    and (p_security_ids is null or n.security_id=any(p_security_ids))
    and (p_before is null or coalesce(n.published_at,n.first_seen_at)<p_before)
  order by n.published_at desc nulls last, n.first_seen_at desc
  limit p_limit;
end $$;

revoke all on function public.get_portfolio_news_feed_v2(uuid,uuid[],integer,timestamptz) from public, anon;
grant execute on function public.get_portfolio_news_feed_v2(uuid,uuid[],integer,timestamptz) to authenticated;

comment on function public.get_portfolio_news_feed_v2(uuid,uuid[],integer,timestamptz) is 'Owner-scoped cached portfolio news feed with tone provenance. Never triggers external ingestion.';
