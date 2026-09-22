-- Stage 7C: versioned market-cap policy, reconciliation thresholds, and cache-only read models.

create table public.market_cap_classification_policies (
  code text not null, version integer not null check(version>0), name text not null,
  effective_from date not null, effective_to date, is_active boolean not null default false,
  large_cap_max_rank integer not null, mid_cap_max_rank integer not null,
  minimum_universe_size integer not null default 251,
  conflict_same_date_percent numeric(10,6) not null default 1.0,
  conflict_adjacent_date_percent numeric(10,6) not null default 5.0,
  definition jsonb not null default '{}'::jsonb check(jsonb_typeof(definition)='object'), created_at timestamptz not null default now(),
  primary key(code,version),
  constraint market_cap_policy_rank_check check(large_cap_max_rank>0 and mid_cap_max_rank>large_cap_max_rank and minimum_universe_size>=mid_cap_max_rank),
  constraint market_cap_policy_date_check check(effective_to is null or effective_to>=effective_from)
);
insert into public.market_cap_classification_policies(code,version,name,effective_from,is_active,large_cap_max_rank,mid_cap_max_rank,minimum_universe_size,conflict_same_date_percent,conflict_adjacent_date_percent,definition)
values('SEBI_AMFI_FULL_MARKET_CAP_RANK_V1',1,'SEBI/AMFI full market-cap rank bands',current_date,true,100,250,251,1,5,'{"large_cap":"rank 1-100","mid_cap":"rank 101-250","small_cap":"rank 251+","insufficient_evidence":"no trusted complete rank evidence","conflict_tolerance_policy":"MARKET_CAP_CONFLICT_TOLERANCE_V1","tolerances_are_operational_review_thresholds_not_financial_estimates":true}'::jsonb);

create table public.market_cap_classification_observations (
  id uuid primary key default gen_random_uuid(), security_id uuid not null references public.securities(id) on delete restrict,
  source_record_id uuid not null references public.data_source_records(id) on delete restrict, source_code text not null references public.data_sources(code) on delete restrict,
  market_cap numeric(38,6) not null check(market_cap>=0), currency text not null check(currency ~ '^[A-Z]{3}$'),
  capitalization_basis text not null check(capitalization_basis in ('FULL','FREE_FLOAT')),
  as_of_date date not null, observed_at timestamptz, retrieved_at timestamptz not null default now(), fresh_until timestamptz not null,
  universe_code text, full_market_cap_rank integer check(full_market_cap_rank is null or full_market_cap_rank>0),
  comparable_status text not null default 'AVAILABLE' check(comparable_status in ('AVAILABLE','STALE','CONFLICTING','REJECTED')),
  created_at timestamptz not null default now(),
  unique(security_id,source_code,as_of_date,capitalization_basis,source_record_id)
);

create table public.market_cap_category_assessments (
  security_id uuid not null references public.securities(id) on delete restrict,
  policy_code text not null, policy_version integer not null,
  selected_observation_id uuid references public.market_cap_classification_observations(id) on delete restrict,
  category text not null check(category in ('LARGE_CAP','MID_CAP','SMALL_CAP','INSUFFICIENT_EVIDENCE','CONFLICTING')),
  rank_used integer check(rank_used is null or rank_used>0), assessment_status text not null check(assessment_status in ('AVAILABLE','STALE','UNAVAILABLE','CONFLICTING')),
  assessed_at timestamptz not null default now(), reason_code text not null check(reason_code ~ '^[A-Z0-9_]+$'), evidence jsonb not null default '{}'::jsonb check(jsonb_typeof(evidence)='object'),
  primary key(security_id,policy_code,policy_version), foreign key(policy_code,policy_version) references public.market_cap_classification_policies(code,version) on delete restrict
);

create or replace view public.current_security_identity_v1 with (security_invoker=true) as
select s.id as security_id,s.name,s.isin,s.asset_class,s.instrument_type,l.id as listing_id,l.exchange,l.trading_symbol,l.series,l.currency
from public.securities s left join lateral(select sl.* from public.security_listings sl where sl.security_id=s.id and sl.is_active order by sl.is_primary desc,sl.created_at asc limit 1) l on true;

create or replace view public.current_security_classification_v1 with (security_invoker=true) as
select s.id as security_id,
  coalesce(max(o.text_value) filter(where d.attribute_code='COMPANY_NAME'),s.name) as company_name,
  max(o.text_value) filter(where d.attribute_code='SECTOR') as sector,
  max(o.text_value) filter(where d.attribute_code='INDUSTRY') as industry,
  min(o.fresh_until) as fresh_until,
  bool_or(o.evidence_status='CONFLICTING') as has_conflict
from public.securities s left join public.security_attribute_decisions d on d.security_id=s.id left join public.security_attribute_observations o on o.id=d.selected_observation_id
group by s.id,s.name;

create or replace view public.current_fundamental_observations_v1 with (security_invoker=true) as
select d.security_id,d.metric_code,d.period_end,d.period_type,d.consolidation_scope,o.numeric_value,o.text_value,o.boolean_value,o.date_value,o.currency,o.unit,o.source_code,o.observed_at,o.retrieved_at,o.fresh_until,
case when o.evidence_status='CONFLICTING' then 'CONFLICTING' when o.fresh_until<=now() then 'STALE' else 'AVAILABLE' end as freshness_status
from public.fundamental_observation_decisions d join public.fundamental_observations o on o.id=d.selected_observation_id;

create or replace view public.current_market_cap_category_v1 with (security_invoker=true) as
select a.security_id,a.policy_code,a.policy_version,a.category,a.rank_used,a.assessment_status,a.assessed_at,a.reason_code,o.market_cap,o.currency,o.capitalization_basis,o.as_of_date,o.source_code,o.fresh_until
from public.market_cap_category_assessments a left join public.market_cap_classification_observations o on o.id=a.selected_observation_id
where (a.policy_code,a.policy_version) in (select p.code,p.version from public.market_cap_classification_policies p where p.is_active);

create or replace view public.current_security_enrichment_v1 with (security_invoker=true) as
select i.security_id,i.name as canonical_name,c.company_name,c.sector,c.industry,m.market_cap,m.currency as market_cap_currency,m.capitalization_basis,m.as_of_date as market_cap_as_of_date,m.category as market_cap_category,m.rank_used as market_cap_rank,m.source_code as market_cap_source,
case
 when coalesce(c.has_conflict,false) or m.assessment_status='CONFLICTING' then 'FAILED'
 when c.sector is null and c.industry is null and m.category is null then 'UNAVAILABLE'
 when (c.fresh_until is not null and c.fresh_until<=now()) or m.assessment_status='STALE' or (m.fresh_until is not null and m.fresh_until<=now()) then 'STALE'
 when c.sector is not null and c.industry is not null and m.category in ('LARGE_CAP','MID_CAP','SMALL_CAP') then 'AVAILABLE'
 else 'PARTIAL' end as enrichment_state,
least(c.fresh_until,m.fresh_until) as fresh_until
from public.current_security_identity_v1 i left join public.current_security_classification_v1 c on c.security_id=i.security_id left join public.current_market_cap_category_v1 m on m.security_id=i.security_id;

create or replace view public.portfolio_enrichment_coverage_v1 with (security_invoker=true) as
select p.id as portfolio_id,count(distinct t.security_id)::integer as security_count,
count(distinct t.security_id) filter(where e.enrichment_state='AVAILABLE')::integer as available_count,
count(distinct t.security_id) filter(where e.enrichment_state='PARTIAL')::integer as partial_count,
count(distinct t.security_id) filter(where e.enrichment_state='UNAVAILABLE')::integer as unavailable_count,
count(distinct t.security_id) filter(where e.enrichment_state='STALE')::integer as stale_count,
count(distinct t.security_id) filter(where e.enrichment_state='FAILED')::integer as failed_count
from public.portfolios p join public.transactions t on t.portfolio_id=p.id and t.accounting_status='ACTIVE' left join public.current_security_enrichment_v1 e on e.security_id=t.security_id
group by p.id;

alter table public.market_cap_classification_policies enable row level security; alter table public.market_cap_classification_observations enable row level security; alter table public.market_cap_category_assessments enable row level security;
revoke all on table public.market_cap_classification_policies,public.market_cap_classification_observations,public.market_cap_category_assessments from anon,authenticated;
grant select on table public.market_cap_classification_policies,public.market_cap_classification_observations,public.market_cap_category_assessments to authenticated;
grant select on table public.current_security_identity_v1,public.current_security_classification_v1,public.current_fundamental_observations_v1,public.current_market_cap_category_v1,public.current_security_enrichment_v1,public.portfolio_enrichment_coverage_v1 to authenticated;
create policy "Authenticated users read market cap policies" on public.market_cap_classification_policies for select to authenticated using(true);
create policy "Users read held market cap evidence" on public.market_cap_classification_observations for select to authenticated using(exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=market_cap_classification_observations.security_id and p.user_id=(select auth.uid())));
create policy "Users read held market cap assessments" on public.market_cap_category_assessments for select to authenticated using(exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=market_cap_category_assessments.security_id and p.user_id=(select auth.uid())));

comment on table public.market_cap_classification_policies is 'SEBI/AMFI rank policy is versioned separately from current market-cap observations. Conflict tolerances decide review routing only.';
comment on view public.current_security_enrichment_v1 is 'Cache-only selected enrichment. Normal Dashboard reads never require a live provider call.';
