-- Stage 7B: taxonomy, normalized observations, selections, and audited correction requests.

create table public.classification_taxonomies (
  code text not null,
  version integer not null check (version > 0),
  name text not null,
  level_names text[] not null,
  is_active boolean not null default false,
  effective_from date not null,
  definition jsonb not null default '{}'::jsonb check (jsonb_typeof(definition)='object'),
  created_at timestamptz not null default now(),
  primary key(code,version)
);
insert into public.classification_taxonomies(code,version,name,level_names,is_active,effective_from,definition)
values('PORTFOLIOAI_INDUSTRY_V1',1,'PortfolioAI sector and industry taxonomy',array['SECTOR','INDUSTRY'],true,current_date,'{"status":"mapping_values_pending_stock_master_inspection"}'::jsonb);

create table public.classification_source_mappings (
  id uuid primary key default gen_random_uuid(), source_code text not null references public.data_sources(code) on delete restrict,
  taxonomy_code text not null, taxonomy_version integer not null, source_sector text, source_industry text,
  sector_id uuid references public.sectors(id) on delete restrict, industry_id uuid references public.industries(id) on delete restrict,
  mapping_status text not null check(mapping_status in ('VERIFIED','AMBIGUOUS','REJECTED')),
  evidence jsonb not null default '{}'::jsonb check(jsonb_typeof(evidence)='object'), reviewed_at timestamptz, reviewed_by uuid references auth.users(id) on delete restrict,
  foreign key(taxonomy_code,taxonomy_version) references public.classification_taxonomies(code,version) on delete restrict,
  unique nulls not distinct(source_code,taxonomy_code,taxonomy_version,source_sector,source_industry)
);

create table public.security_attribute_observations (
  id uuid primary key default gen_random_uuid(), security_id uuid not null references public.securities(id) on delete restrict,
  source_record_id uuid not null references public.data_source_records(id) on delete restrict, source_code text not null references public.data_sources(code) on delete restrict,
  attribute_code text not null check(attribute_code in ('COMPANY_NAME','SECTOR','INDUSTRY')),
  text_value text not null check(text_value=btrim(text_value) and text_value<>''), normalized_value text,
  observed_at timestamptz, valid_from date, valid_to date, retrieved_at timestamptz not null default now(),
  fresh_until timestamptz not null, evidence_status text not null default 'AVAILABLE' check(evidence_status in ('AVAILABLE','STALE','CONFLICTING','REJECTED')),
  created_at timestamptz not null default now(), unique(source_record_id,security_id,attribute_code)
);

create table public.security_attribute_decisions (
  security_id uuid not null references public.securities(id) on delete restrict, attribute_code text not null check(attribute_code in ('COMPANY_NAME','SECTOR','INDUSTRY')),
  selected_observation_id uuid not null references public.security_attribute_observations(id) on delete restrict,
  decision_basis text not null check(decision_basis in ('EVIDENCE_PRIORITY','MANUAL_REVIEW','CORRECTION')),
  decided_at timestamptz not null default now(), decided_by uuid references auth.users(id) on delete restrict, notes text,
  primary key(security_id,attribute_code)
);

create table public.fundamental_metric_definitions (
  code text primary key check(code ~ '^[A-Z0-9_]+$'), name text not null, value_kind text not null check(value_kind in ('NUMERIC','TEXT','BOOLEAN','DATE')),
  canonical_unit text, statement_scope text, freshness_seconds integer not null check(freshness_seconds > 0), definition jsonb not null default '{}'::jsonb check(jsonb_typeof(definition)='object'), is_active boolean not null default true
);
insert into public.fundamental_metric_definitions(code,name,value_kind,canonical_unit,statement_scope,freshness_seconds) values
('MARKET_CAP','Market capitalization','NUMERIC','INR','POINT_IN_TIME',86400),
('REVENUE','Revenue','NUMERIC','INR','INCOME_STATEMENT',7776000),
('NET_INCOME','Net income','NUMERIC','INR','INCOME_STATEMENT',7776000),
('EPS_DILUTED','Diluted earnings per share','NUMERIC','INR_PER_SHARE','INCOME_STATEMENT',7776000),
('SHAREHOLDING_PROMOTER_PERCENT','Promoter shareholding','NUMERIC','PERCENT','SHAREHOLDING',7776000);

create table public.fundamental_observations (
  id uuid primary key default gen_random_uuid(), security_id uuid not null references public.securities(id) on delete restrict,
  metric_code text not null references public.fundamental_metric_definitions(code) on delete restrict,
  source_record_id uuid not null references public.data_source_records(id) on delete restrict, source_code text not null references public.data_sources(code) on delete restrict,
  numeric_value numeric(38,18), text_value text, boolean_value boolean, date_value date, currency text check(currency is null or currency ~ '^[A-Z]{3}$'), unit text,
  period_start date, period_end date, period_type text check(period_type is null or period_type in ('POINT_IN_TIME','QUARTER','HALF_YEAR','YEAR','TTM')),
  accounting_standard text, consolidation_scope text check(consolidation_scope is null or consolidation_scope in ('STANDALONE','CONSOLIDATED','UNKNOWN')),
  observed_at timestamptz, retrieved_at timestamptz not null default now(), fresh_until timestamptz not null,
  evidence_status text not null default 'AVAILABLE' check(evidence_status in ('AVAILABLE','STALE','CONFLICTING','REJECTED')),
  created_at timestamptz not null default now(),
  constraint fundamental_exactly_one_value check(num_nonnulls(numeric_value,text_value,boolean_value,date_value)=1),
  unique nulls not distinct(security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id)
);

create table public.fundamental_observation_decisions (
  security_id uuid not null references public.securities(id) on delete restrict, metric_code text not null references public.fundamental_metric_definitions(code) on delete restrict,
  period_end date, period_type text, consolidation_scope text,
  selected_observation_id uuid not null references public.fundamental_observations(id) on delete restrict,
  decision_basis text not null check(decision_basis in ('EVIDENCE_PRIORITY','RECONCILED_EQUIVALENT','MANUAL_REVIEW','CORRECTION')),
  decided_at timestamptz not null default now(), decided_by uuid references auth.users(id) on delete restrict, notes text,
  unique nulls not distinct(security_id,metric_code,period_end,period_type,consolidation_scope)
);

create table public.security_enrichment_correction_requests (
  id uuid primary key default gen_random_uuid(), security_id uuid not null references public.securities(id) on delete restrict,
  portfolio_id uuid not null references public.portfolios(id) on delete restrict, requested_by uuid not null references auth.users(id) on delete restrict,
  target_kind text not null check(target_kind in ('ATTRIBUTE','FUNDAMENTAL','IDENTITY','MARKET_CAP_CATEGORY')), target_code text not null,
  proposed_value jsonb not null check(jsonb_typeof(proposed_value)='object'), reason text not null check(reason=btrim(reason) and reason<>''),
  request_status text not null default 'PENDING' check(request_status in ('PENDING','APPLIED','REJECTED')),
  reviewed_by uuid references auth.users(id) on delete restrict, reviewed_at timestamptz, review_notes text, created_at timestamptz not null default now(),
  constraint enrichment_correction_review_check check((request_status='PENDING' and reviewed_by is null and reviewed_at is null) or (request_status<>'PENDING' and reviewed_by is not null and reviewed_at is not null))
);

create or replace function public.apply_security_attribute_decision_v1(p_observation_id uuid,p_basis text,p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$ declare o public.security_attribute_observations; begin
  select * into o from public.security_attribute_observations where id=p_observation_id; if not found then raise exception 'Observation not found.'; end if;
  insert into public.security_attribute_decisions(security_id,attribute_code,selected_observation_id,decision_basis,decided_by,notes)
  values(o.security_id,o.attribute_code,o.id,p_basis,auth.uid(),p_notes) on conflict(security_id,attribute_code) do update set selected_observation_id=excluded.selected_observation_id,decision_basis=excluded.decision_basis,decided_at=now(),decided_by=excluded.decided_by,notes=excluded.notes;
end $$;

create or replace function public.apply_fundamental_observation_decision_v1(p_observation_id uuid,p_basis text,p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$ declare o public.fundamental_observations; begin
  select * into o from public.fundamental_observations where id=p_observation_id; if not found then raise exception 'Observation not found.'; end if;
  insert into public.fundamental_observation_decisions(security_id,metric_code,period_end,period_type,consolidation_scope,selected_observation_id,decision_basis,decided_by,notes)
  values(o.security_id,o.metric_code,o.period_end,o.period_type,o.consolidation_scope,o.id,p_basis,auth.uid(),p_notes)
  on conflict(security_id,metric_code,period_end,period_type,consolidation_scope) do update set selected_observation_id=excluded.selected_observation_id,decision_basis=excluded.decision_basis,decided_at=now(),decided_by=excluded.decided_by,notes=excluded.notes;
end $$;

create or replace function public.submit_security_enrichment_correction_v1(p_portfolio_id uuid,p_security_id uuid,p_target_kind text,p_target_code text,p_proposed_value jsonb,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$ declare v_user uuid:=auth.uid(); v_id uuid; begin
  if v_user is null or not exists(select 1 from public.portfolios p where p.id=p_portfolio_id and p.user_id=v_user) then raise exception 'Not authorized.'; end if;
  if not exists(select 1 from public.transactions t where t.portfolio_id=p_portfolio_id and t.security_id=p_security_id) then raise exception 'Security is not in the portfolio history.'; end if;
  insert into public.security_enrichment_correction_requests(security_id,portfolio_id,requested_by,target_kind,target_code,proposed_value,reason)
  values(p_security_id,p_portfolio_id,v_user,p_target_kind,p_target_code,p_proposed_value,p_reason) returning id into v_id; return v_id;
end $$;

create or replace function public.apply_security_enrichment_correction_v1(p_request_id uuid,p_apply boolean,p_review_notes text)
returns void language plpgsql security definer set search_path='' as $$ begin
  update public.security_enrichment_correction_requests set request_status=case when p_apply then 'APPLIED' else 'REJECTED' end,reviewed_by=auth.uid(),reviewed_at=now(),review_notes=p_review_notes where id=p_request_id and request_status='PENDING';
  if not found then raise exception 'Pending correction request not found.'; end if;
end $$;

alter table public.classification_taxonomies enable row level security; alter table public.classification_source_mappings enable row level security;
alter table public.security_attribute_observations enable row level security; alter table public.security_attribute_decisions enable row level security;
alter table public.fundamental_metric_definitions enable row level security; alter table public.fundamental_observations enable row level security; alter table public.fundamental_observation_decisions enable row level security;
alter table public.security_enrichment_correction_requests enable row level security;
revoke all on table public.classification_taxonomies,public.classification_source_mappings,public.security_attribute_observations,public.security_attribute_decisions,public.fundamental_metric_definitions,public.fundamental_observations,public.fundamental_observation_decisions,public.security_enrichment_correction_requests from anon,authenticated;
grant select on table public.classification_taxonomies,public.fundamental_metric_definitions,public.security_attribute_observations,public.security_attribute_decisions,public.fundamental_observations,public.fundamental_observation_decisions,public.security_enrichment_correction_requests to authenticated;
create policy "Authenticated users read taxonomies" on public.classification_taxonomies for select to authenticated using(true);
create policy "Authenticated users read metric definitions" on public.fundamental_metric_definitions for select to authenticated using(true);
create policy "Users read held security attributes" on public.security_attribute_observations for select to authenticated using(exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=security_attribute_observations.security_id and p.user_id=(select auth.uid())));
create policy "Users read held attribute decisions" on public.security_attribute_decisions for select to authenticated using(exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=security_attribute_decisions.security_id and p.user_id=(select auth.uid())));
create policy "Users read held fundamentals" on public.fundamental_observations for select to authenticated using(exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=fundamental_observations.security_id and p.user_id=(select auth.uid())));
create policy "Users read held fundamental decisions" on public.fundamental_observation_decisions for select to authenticated using(exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=fundamental_observation_decisions.security_id and p.user_id=(select auth.uid())));
create policy "Users read own enrichment corrections" on public.security_enrichment_correction_requests for select to authenticated using(requested_by=(select auth.uid()) and exists(select 1 from public.portfolios p where p.id=portfolio_id and p.user_id=(select auth.uid())));
revoke all on function public.apply_security_attribute_decision_v1(uuid,text,text),public.apply_fundamental_observation_decision_v1(uuid,text,text),public.apply_security_enrichment_correction_v1(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.apply_security_attribute_decision_v1(uuid,text,text),public.apply_fundamental_observation_decision_v1(uuid,text,text),public.apply_security_enrichment_correction_v1(uuid,boolean,text) to service_role;
revoke all on function public.submit_security_enrichment_correction_v1(uuid,uuid,text,text,jsonb,text) from public,anon;
grant execute on function public.submit_security_enrichment_correction_v1(uuid,uuid,text,text,jsonb,text) to authenticated;
