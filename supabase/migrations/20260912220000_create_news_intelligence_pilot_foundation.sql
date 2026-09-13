-- Stage N3 preparation: additive Portfolio News Intelligence foundation.
-- This migration is intentionally NOT applied by repository creation alone.
-- It prepares a manual/pilot NEWS policy but does not mutate provider scheduler controls.

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete restrict,
  canonical_key text not null unique check (canonical_key=btrim(canonical_key) and canonical_key<>'' and length(canonical_key)<=128),
  headline text not null check (headline=btrim(headline) and headline<>'' and length(headline)<=1000),
  summary text check (summary is null or (summary=btrim(summary) and summary<>'' and length(summary)<=4000)),
  category text not null default 'UNCLASSIFIED' check (category in (
    'RESULTS','CORPORATE_ACTION','REGULATORY','MANAGEMENT','ORDER_CONTRACT',
    'FUND_RAISE','MA_INVESTMENT','CREDIT_RATING','SHAREHOLDING_INSIDER',
    'LITIGATION_GOVERNANCE','GENERAL','UNCLASSIFIED'
  )),
  importance_state text not null default 'UNCLASSIFIED' check (importance_state in ('UNCLASSIFIED','ROUTINE','NOTABLE','IMPORTANT')),
  published_at timestamptz,
  publication_precision text not null default 'UNKNOWN' check (publication_precision in ('DATETIME','DATE','UNKNOWN')),
  primary_source_name text check (primary_source_name is null or (primary_source_name=btrim(primary_source_name) and primary_source_name<>'' and length(primary_source_name)<=300)),
  primary_source_url text check (primary_source_url is null or (primary_source_url=btrim(primary_source_url) and primary_source_url ~ '^https://')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_items_seen_order check (last_seen_at>=first_seen_at)
);

create index news_items_security_published_idx on public.news_items(security_id,published_at desc nulls last);
create index news_items_security_first_seen_idx on public.news_items(security_id,first_seen_at desc);
create index news_items_importance_published_idx on public.news_items(importance_state,published_at desc nulls last);

create table public.news_source_appearances (
  id uuid primary key default gen_random_uuid(),
  news_item_id uuid not null references public.news_items(id) on delete restrict,
  source_code text not null references public.data_sources(code) on delete restrict,
  data_source_record_id uuid not null references public.data_source_records(id) on delete restrict,
  provider_record_id text check (provider_record_id is null or (provider_record_id=btrim(provider_record_id) and provider_record_id<>'' and length(provider_record_id)<=500)),
  provider_security_identity text not null check (provider_security_identity=btrim(provider_security_identity) and provider_security_identity<>'' and length(provider_security_identity)<=500),
  publisher_name text check (publisher_name is null or (publisher_name=btrim(publisher_name) and publisher_name<>'' and length(publisher_name)<=300)),
  source_url text check (source_url is null or (source_url=btrim(source_url) and source_url ~ '^https://')),
  headline_as_received text not null check (headline_as_received=btrim(headline_as_received) and headline_as_received<>'' and length(headline_as_received)<=1000),
  summary_as_received text check (summary_as_received is null or (summary_as_received=btrim(summary_as_received) and summary_as_received<>'' and length(summary_as_received)<=4000)),
  published_at timestamptz,
  retrieved_at timestamptz not null,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  dedupe_key text not null check (dedupe_key=btrim(dedupe_key) and dedupe_key<>'' and length(dedupe_key)<=1000),
  created_at timestamptz not null default now(),
  constraint news_source_appearances_dedupe unique(source_code,dedupe_key)
);

create index news_source_appearances_item_retrieved_idx on public.news_source_appearances(news_item_id,retrieved_at desc);
create index news_source_appearances_raw_record_idx on public.news_source_appearances(data_source_record_id);

alter table public.news_items enable row level security;
alter table public.news_source_appearances enable row level security;

-- Browser users do not receive direct table access. Dashboard reads go through the bounded RPC below.
revoke all on table public.news_items, public.news_source_appearances from anon, authenticated;

create or replace function public.get_portfolio_news_feed_v1(
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

revoke all on function public.get_portfolio_news_feed_v1(uuid,uuid[],integer,timestamptz) from public, anon;
grant execute on function public.get_portfolio_news_feed_v1(uuid,uuid[],integer,timestamptz) to authenticated;

-- Retire the original disabled NEWS policy and introduce a manual/pilot-safe V2.
update public.refresh_domain_policies
set effective_to=now()
where source_code='TRENDLYNE_MCP'
  and data_domain='NEWS'
  and effective_to is null;

insert into public.refresh_domain_policies(
  source_code,data_domain,policy_version,is_enabled,freshness_seconds,freshness_basis,
  cooldown_seconds,retry_schedule_seconds,definition,effective_from
) values (
  'TRENDLYNE_MCP','NEWS',2,true,3600,'ELAPSED_TIME',0,'{}'::integer[],
  '{"stage":"N3","mode":"OWNER_CONTROLLED_PILOT_ONLY","scheduler_allowed":false,"normal_target_cadence_seconds":3600,"max_business_calls_per_pilot":1,"normalization_enabled":false}'::jsonb,
  now()
);

-- N3 deliberately does not update provider_ingestion_controls directly.
-- The pilot function refuses to run unless scheduler_enabled is already false.
-- Any future provider-control mutation must use the audited Stage 7.2A control path.

comment on table public.news_items is 'Normalized security-centric cached news. N3 pilot does not populate this table until the live provider response contract is reviewed.';
comment on table public.news_source_appearances is 'Provider/source lineage for normalized news items. Browser clients have no direct access.';
comment on function public.get_portfolio_news_feed_v1(uuid,uuid[],integer,timestamptz) is 'Read-only owner-scoped cached news feed. Never triggers provider ingestion.';
