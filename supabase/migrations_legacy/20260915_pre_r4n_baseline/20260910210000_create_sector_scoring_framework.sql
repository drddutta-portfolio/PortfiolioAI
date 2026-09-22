-- Stage 8.2 — sector-aware scoring framework for non-financial equities.
-- Additive only. The PAI_STOCK_SCORE V1 model remains DRAFT.

create table if not exists public.scoring_profiles (
  code text primary key,
  name text not null,
  parent_profile_code text references public.scoring_profiles(code) on delete restrict,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  constraint scoring_profile_code_shape check (code ~ '^[A-Z0-9_]+$')
);

insert into public.scoring_profiles(code,name,parent_profile_code,description) values
  ('GENERAL','General Equity',null,'Fallback profile for non-lender listed equities.'),
  ('BANK_NBFC','Banks / NBFCs',null,'Lender-specific profile using asset quality, capital adequacy and credit strength.'),
  ('IT_TECH','IT / Technology','GENERAL','Asset-light technology and IT services businesses.'),
  ('INDUSTRIALS_CAPITAL_GOODS','Industrials / Capital Goods','GENERAL','Engineering, industrial and capital-goods businesses.'),
  ('CONSUMER_FMCG','Consumer / FMCG','GENERAL','Consumer staples, discretionary and branded consumption businesses.'),
  ('PHARMA_HEALTHCARE','Pharma / Healthcare','GENERAL','Pharma, healthcare and life-sciences businesses.'),
  ('AUTO_COMPONENTS','Auto / Auto Components','GENERAL','Automotive OEM and component businesses.'),
  ('ENERGY_UTILITIES','Energy / Utilities','GENERAL','Power, oil, gas and utility businesses.'),
  ('METALS_COMMODITIES','Metals / Commodities','GENERAL','Commodity-linked metals, mining and materials businesses.'),
  ('INFRA_CONSTRUCTION','Infrastructure / Construction','GENERAL','Infrastructure, EPC and construction businesses.'),
  ('REAL_ESTATE','Real Estate','GENERAL','Property developers and real-estate operating businesses.'),
  ('FIN_SERVICES_NON_LENDER','Financial Services (Non-Lender)','GENERAL','Asset managers, exchanges, insurers and other non-lender financial companies.')
on conflict (code) do update set name=excluded.name,parent_profile_code=excluded.parent_profile_code,description=excluded.description,is_active=true;

create table if not exists public.scoring_profile_sector_rules (
  id uuid primary key default gen_random_uuid(),
  scoring_profile_code text not null references public.scoring_profiles(code) on delete cascade,
  sector_pattern text not null,
  industry_pattern text,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  unique(scoring_profile_code,sector_pattern,industry_pattern),
  constraint scoring_profile_sector_priority_positive check (priority > 0)
);

insert into public.scoring_profile_sector_rules(scoring_profile_code,sector_pattern,industry_pattern,priority) values
  ('BANK_NBFC','BANK%',null,10),('BANK_NBFC','%NBFC%',null,10),('BANK_NBFC','%FINANCE%','%LENDING%',10),
  ('IT_TECH','%IT%',null,30),('IT_TECH','%TECHNOLOGY%',null,30),('IT_TECH','%SOFTWARE%',null,30),
  ('INDUSTRIALS_CAPITAL_GOODS','%INDUSTRIAL%',null,40),('INDUSTRIALS_CAPITAL_GOODS','%CAPITAL GOODS%',null,40),('INDUSTRIALS_CAPITAL_GOODS','%ENGINEERING%',null,40),
  ('CONSUMER_FMCG','%FMCG%',null,40),('CONSUMER_FMCG','%CONSUMER%',null,40),
  ('PHARMA_HEALTHCARE','%PHARMA%',null,40),('PHARMA_HEALTHCARE','%HEALTHCARE%',null,40),
  ('AUTO_COMPONENTS','%AUTO%',null,40),('AUTO_COMPONENTS','%AUTOMOBILE%',null,40),
  ('ENERGY_UTILITIES','%POWER%',null,40),('ENERGY_UTILITIES','%ENERGY%',null,40),('ENERGY_UTILITIES','%UTILIT%',null,40),('ENERGY_UTILITIES','%OIL%',null,40),('ENERGY_UTILITIES','%GAS%',null,40),
  ('METALS_COMMODITIES','%METAL%',null,40),('METALS_COMMODITIES','%MINING%',null,40),('METALS_COMMODITIES','%COMMODIT%',null,40),
  ('INFRA_CONSTRUCTION','%INFRA%',null,40),('INFRA_CONSTRUCTION','%CONSTRUCTION%',null,40),('INFRA_CONSTRUCTION','%EPC%',null,40),
  ('REAL_ESTATE','%REAL ESTATE%',null,40),('REAL_ESTATE','%REALTY%',null,40),
  ('FIN_SERVICES_NON_LENDER','%FINANCIAL SERVICES%',null,80),('FIN_SERVICES_NON_LENDER','%INSURANCE%',null,40),('FIN_SERVICES_NON_LENDER','%ASSET MANAGEMENT%',null,40)
on conflict do nothing;

create table if not exists public.scoring_profile_dimension_overrides (
  id uuid primary key default gen_random_uuid(),
  scoring_model_id uuid not null references public.scoring_models(id) on delete cascade,
  scoring_profile_code text not null references public.scoring_profiles(code) on delete cascade,
  dimension_code text not null,
  weight numeric(8,4) not null,
  rationale text,
  created_at timestamptz not null default clock_timestamp(),
  unique(scoring_model_id,scoring_profile_code,dimension_code),
  constraint scoring_profile_dimension_weight_range check (weight >= 0 and weight <= 100)
);

with m as (select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1),
profiles(code) as (values ('IT_TECH'),('INDUSTRIALS_CAPITAL_GOODS'),('CONSUMER_FMCG'),('PHARMA_HEALTHCARE'),('AUTO_COMPONENTS'),('ENERGY_UTILITIES'),('METALS_COMMODITIES'),('INFRA_CONSTRUCTION'),('REAL_ESTATE'),('FIN_SERVICES_NON_LENDER')),
base as (select dimension_code,weight from public.scoring_model_dimensions d,m where d.scoring_model_id=m.id and d.scoring_profile='GENERAL')
insert into public.scoring_profile_dimension_overrides(scoring_model_id,scoring_profile_code,dimension_code,weight,rationale)
select m.id,p.code,b.dimension_code,b.weight,'Starts from GENERAL V1; sector-specific weight changes require explicit reviewed migrations.' from m cross join profiles p cross join base b
on conflict (scoring_model_id,scoring_profile_code,dimension_code) do nothing;

-- Metric-level GENERAL contract. Sector overlays inherit these inputs unless a later reviewed override marks them NOT_APPLICABLE or changes weight.
with m as (select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1), r(dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order) as (
values
('QUALITY','ROE_ANNUAL','FUNDAMENTAL','ROE_ANNUAL','TRENDLYNE_MCP','ROE_A',35,'HIGHER_BETTER','DRAFT','{"type":"piecewise","unit":"PERCENT","bands":[{"gte":22,"score":100},{"gte":17,"score":80},{"gte":13,"score":60},{"gte":9,"score":40},{"lt":9,"score":20}]}'::jsonb,1),
('QUALITY','OPM_TTM','FUNDAMENTAL','OPM_TTM','TRENDLYNE_MCP','OPM TTM %',30,'HIGHER_BETTER','REVIEWED','{"type":"relative_plus_absolute","state":"REQUIRES_SECTOR_CONTEXT"}'::jsonb,2),
('QUALITY','EARNINGS_CONSISTENCY','DERIVED',null,'PORTFOLIOAI',null,35,'CUSTOM','PENDING_SOURCE','{"type":"history_consistency","inputs":["EPS_GROWTH_HISTORY","PAT_GROWTH_HISTORY"]}'::jsonb,3),
('GROWTH','REVENUE_GROWTH_3Y','DERIVED','REVENUE_TTM','TRENDLYNE_MCP',null,35,'HIGHER_BETTER','PENDING_SOURCE','{"type":"cagr","years":3,"state":"REQUIRES_HISTORY"}'::jsonb,1),
('GROWTH','PAT_GROWTH_3Y','DERIVED','NET_PROFIT_TTM','TRENDLYNE_MCP',null,35,'HIGHER_BETTER','PENDING_SOURCE','{"type":"cagr","years":3,"state":"REQUIRES_HISTORY"}'::jsonb,2),
('GROWTH','EPS_GROWTH_3Y','DERIVED','EPS_DILUTED','TRENDLYNE_MCP',null,30,'HIGHER_BETTER','PENDING_SOURCE','{"type":"cagr","years":3,"state":"REQUIRES_HISTORY"}'::jsonb,3),
('CAPITAL_EFFICIENCY','ROCE_ANNUAL','FUNDAMENTAL','ROCE_ANNUAL','TRENDLYNE_MCP','ROCE Ann. %',60,'HIGHER_BETTER','REVIEWED','{"type":"piecewise","unit":"PERCENT","bands":[{"gte":25,"score":100},{"gte":20,"score":80},{"gte":15,"score":60},{"gte":10,"score":40},{"lt":10,"score":20}]}'::jsonb,1),
('CAPITAL_EFFICIENCY','ROE_ANNUAL','FUNDAMENTAL','ROE_ANNUAL','TRENDLYNE_MCP','ROE_A',40,'HIGHER_BETTER','DRAFT','{"type":"piecewise","unit":"PERCENT","bands":[{"gte":22,"score":100},{"gte":17,"score":80},{"gte":13,"score":60},{"gte":9,"score":40},{"lt":9,"score":20}]}'::jsonb,2),
('CASH_FLOW','CFO_TO_EBITDA','DERIVED',null,'PORTFOLIOAI',null,55,'HIGHER_BETTER','PENDING_SOURCE','{"type":"ratio","formula":"CFO_ANNUAL / EBITDA_ANNUAL","state":"REQUIRES_MATCHED_PERIODS"}'::jsonb,1),
('CASH_FLOW','FCF_CONVERSION','DERIVED',null,'PORTFOLIOAI',null,45,'HIGHER_BETTER','PENDING_SOURCE','{"type":"ratio","state":"REQUIRES_CAPEX_AND_CFO_HISTORY"}'::jsonb,2),
('BALANCE_SHEET_CREDIT','NET_DEBT_TO_EBITDA','DERIVED',null,'TRENDLYNE_MCP',null,45,'LOWER_BETTER','PENDING_SOURCE','{"type":"piecewise","state":"REQUIRES_VERIFIED_FIELD"}'::jsonb,1),
('BALANCE_SHEET_CREDIT','INTEREST_COVERAGE','FUNDAMENTAL',null,'TRENDLYNE_MCP',null,35,'HIGHER_BETTER','PENDING_SOURCE','{"type":"piecewise","state":"REQUIRES_VERIFIED_FIELD"}'::jsonb,2),
('BALANCE_SHEET_CREDIT','EXTERNAL_LONG_TERM_RATING','EXTERNAL_RATING',null,'RATING_AGENCIES','instrument-level long-term rating',20,'ORDINAL','DRAFT','{"type":"rating_ordinal","optional":true,"absence":"INSUFFICIENT_NOT_NEGATIVE"}'::jsonb,3),
('VALUATION','PE_TTM_RELATIVE','DERIVED','PE_TTM','TRENDLYNE_MCP','PE_TTM',45,'RELATIVE','DRAFT','{"type":"relative_percentile","benchmark":"SECTOR_PEER_AND_5Y_SELF","lower_is_better":true,"state":"REQUIRES_BENCHMARK_SERIES"}'::jsonb,1),
('VALUATION','PBV_RELATIVE','DERIVED',null,'TRENDLYNE_MCP',null,25,'RELATIVE','PENDING_SOURCE','{"type":"relative_percentile","benchmark":"SECTOR_PEER_AND_5Y_SELF","lower_is_better":true}'::jsonb,2),
('VALUATION','FCF_YIELD','DERIVED',null,'PORTFOLIOAI',null,30,'HIGHER_BETTER','PENDING_SOURCE','{"type":"yield","state":"REQUIRES_FCF_AND_MARKET_CAP"}'::jsonb,3),
('MOMENTUM','PRICE_MOMENTUM_12M','MARKET','PRICE_MOMENTUM_12M','ANGEL_ONE',null,40,'HIGHER_BETTER','PENDING_SOURCE','{"type":"piecewise","unit":"PERCENT"}'::jsonb,1),
('MOMENTUM','PRICE_MOMENTUM_6M','MARKET','PRICE_MOMENTUM_6M','ANGEL_ONE',null,30,'HIGHER_BETTER','PENDING_SOURCE','{"type":"piecewise","unit":"PERCENT"}'::jsonb,2),
('MOMENTUM','RELATIVE_STRENGTH_12M','DERIVED','RELATIVE_STRENGTH_12M','ANGEL_ONE',null,30,'HIGHER_BETTER','PENDING_SOURCE','{"type":"relative_strength","benchmark":"NIFTY_OR_SECTOR_INDEX"}'::jsonb,3),
('OWNERSHIP_GOVERNANCE','INSTITUTIONAL_OWNERSHIP_TREND','DERIVED',null,'TRENDLYNE_MCP',null,50,'CUSTOM','PENDING_SOURCE','{"type":"trend","state":"REQUIRES_4Q_HISTORY"}'::jsonb,1),
('OWNERSHIP_GOVERNANCE','PROMOTER_PLEDGE','FUNDAMENTAL','SHAREHOLDING_PROMOTER_PLEDGE_PERCENT','TRENDLYNE_MCP',null,30,'LOWER_BETTER','DRAFT','{"type":"piecewise","unit":"PERCENT_OF_PROMOTER_HOLDING","absence_policy":"NOT_APPLICABLE_IF_NO_PROMOTER"}'::jsonb,2),
('OWNERSHIP_GOVERNANCE','INSIDER_GOVERNANCE_SIGNAL','DERIVED',null,'TRENDLYNE_MCP',null,20,'CUSTOM','PENDING_SOURCE','{"type":"event_score","state":"REQUIRES_EVENT_CONTRACT"}'::jsonb,3),
('RISK','MAX_DRAWDOWN_1Y','MARKET','MAX_DRAWDOWN_1Y','ANGEL_ONE',null,35,'LOWER_BETTER','PENDING_SOURCE','{"type":"piecewise","unit":"PERCENT_ABSOLUTE_DRAWDOWN"}'::jsonb,1),
('RISK','VOLATILITY_1Y','MARKET','VOLATILITY_1Y','ANGEL_ONE',null,25,'LOWER_BETTER','PENDING_SOURCE','{"type":"relative_percentile","benchmark":"SECTOR_OR_NIFTY","lower_is_better":true}'::jsonb,2),
('RISK','BALANCE_SHEET_RISK','DERIVED',null,'PORTFOLIOAI',null,25,'CUSTOM','PENDING_SOURCE','{"type":"composite","inputs":["NET_DEBT_TO_EBITDA","INTEREST_COVERAGE"]}'::jsonb,3),
('RISK','EVIDENCE_CONFLICT_PENALTY','DERIVED',null,'PORTFOLIOAI',null,15,'CUSTOM','DRAFT','{"type":"evidence_penalty","higher_score_means_lower_risk":true}'::jsonb,4)
)
insert into public.scoring_model_metric_rules(scoring_model_id,scoring_profile,dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order)
select m.id,'GENERAL',r.dimension_code,r.input_code,r.input_kind,r.metric_code,r.preferred_source,r.provider_field_contract,r.metric_weight,r.direction,r.rule_state,r.normalization_rule,r.display_order from m cross join r
on conflict (scoring_model_id,scoring_profile,dimension_code,input_code) do nothing;

create table if not exists public.scoring_profile_metric_overrides (
  id uuid primary key default gen_random_uuid(),
  scoring_model_id uuid not null references public.scoring_models(id) on delete cascade,
  scoring_profile_code text not null references public.scoring_profiles(code) on delete cascade,
  dimension_code text not null,
  input_code text not null,
  applicability text not null default 'INHERIT',
  weight_multiplier numeric(8,4) not null default 1,
  rationale text,
  created_at timestamptz not null default clock_timestamp(),
  unique(scoring_model_id,scoring_profile_code,dimension_code,input_code),
  constraint scoring_profile_metric_applicability check (applicability in ('INHERIT','REQUIRED','OPTIONAL','NOT_APPLICABLE')),
  constraint scoring_profile_metric_multiplier_positive check (weight_multiplier >= 0 and weight_multiplier <= 5)
);

-- Initial sector overlays are intentionally conservative. They tune applicability/weight without inventing new numeric formulas.
with m as (select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1), o(profile,dimension_code,input_code,applicability,multiplier,rationale) as (
values
('IT_TECH','CASH_FLOW','FCF_CONVERSION','REQUIRED',1.25,'Cash conversion is especially important for asset-light technology businesses.'),
('IT_TECH','BALANCE_SHEET_CREDIT','NET_DEBT_TO_EBITDA','OPTIONAL',0.60,'Leverage usually carries lower weight for net-cash IT businesses.'),
('INDUSTRIALS_CAPITAL_GOODS','CASH_FLOW','CFO_TO_EBITDA','REQUIRED',1.30,'Working-capital conversion is critical for industrials and capital goods.'),
('INDUSTRIALS_CAPITAL_GOODS','BALANCE_SHEET_CREDIT','NET_DEBT_TO_EBITDA','REQUIRED',1.20,'Leverage matters materially for capital-intensive industrial businesses.'),
('CONSUMER_FMCG','QUALITY','OPM_TTM','REQUIRED',1.20,'Margin durability is a core consumer-quality signal.'),
('CONSUMER_FMCG','CASH_FLOW','FCF_CONVERSION','REQUIRED',1.20,'Consumer franchises should convert earnings to cash consistently.'),
('PHARMA_HEALTHCARE','QUALITY','OPM_TTM','REQUIRED',1.10,'Operating margin durability is material for pharma/healthcare.'),
('PHARMA_HEALTHCARE','RISK','EVIDENCE_CONFLICT_PENALTY','REQUIRED',1.10,'Regulatory and evidence conflicts require explicit risk visibility.'),
('AUTO_COMPONENTS','GROWTH','REVENUE_GROWTH_3Y','REQUIRED',1.10,'Cycle-adjusted multi-year revenue growth matters for auto businesses.'),
('AUTO_COMPONENTS','CASH_FLOW','CFO_TO_EBITDA','REQUIRED',1.20,'Working-capital and capex intensity require stronger cash conversion review.'),
('ENERGY_UTILITIES','BALANCE_SHEET_CREDIT','NET_DEBT_TO_EBITDA','REQUIRED',1.35,'Leverage is a primary risk factor in utilities and energy.'),
('ENERGY_UTILITIES','GROWTH','EPS_GROWTH_3Y','OPTIONAL',0.70,'Earnings growth can be distorted by regulated/cyclical structures.'),
('METALS_COMMODITIES','VALUATION','PE_TTM_RELATIVE','OPTIONAL',0.60,'Point-in-cycle P/E can be misleading for commodity businesses.'),
('METALS_COMMODITIES','BALANCE_SHEET_CREDIT','NET_DEBT_TO_EBITDA','REQUIRED',1.30,'Balance-sheet strength is central across commodity cycles.'),
('INFRA_CONSTRUCTION','CASH_FLOW','CFO_TO_EBITDA','REQUIRED',1.35,'Receivables and working capital are central for EPC/infrastructure.'),
('INFRA_CONSTRUCTION','BALANCE_SHEET_CREDIT','INTEREST_COVERAGE','REQUIRED',1.25,'Debt servicing capacity is a major infrastructure risk input.'),
('REAL_ESTATE','BALANCE_SHEET_CREDIT','NET_DEBT_TO_EBITDA','REQUIRED',1.40,'Leverage is a primary real-estate risk signal.'),
('REAL_ESTATE','VALUATION','PE_TTM_RELATIVE','OPTIONAL',0.50,'P/E is often less informative than asset/NAV-style valuation for real estate.'),
('FIN_SERVICES_NON_LENDER','CASH_FLOW','CFO_TO_EBITDA','NOT_APPLICABLE',0,'Industrial cash-flow conversion is not generally meaningful for insurers/asset managers/exchanges.'),
('FIN_SERVICES_NON_LENDER','BALANCE_SHEET_CREDIT','NET_DEBT_TO_EBITDA','OPTIONAL',0.50,'Leverage interpretation varies materially across non-lender financial services.')
)
insert into public.scoring_profile_metric_overrides(scoring_model_id,scoring_profile_code,dimension_code,input_code,applicability,weight_multiplier,rationale)
select m.id,o.profile,o.dimension_code,o.input_code,o.applicability,o.multiplier,o.rationale from m cross join o
on conflict (scoring_model_id,scoring_profile_code,dimension_code,input_code) do nothing;

alter table public.scoring_profiles enable row level security;
alter table public.scoring_profile_sector_rules enable row level security;
alter table public.scoring_profile_dimension_overrides enable row level security;
alter table public.scoring_profile_metric_overrides enable row level security;

create policy scoring_profiles_authenticated_read on public.scoring_profiles for select to authenticated using (true);
create policy scoring_profile_sector_rules_authenticated_read on public.scoring_profile_sector_rules for select to authenticated using (true);
create policy scoring_profile_dimension_overrides_authenticated_read on public.scoring_profile_dimension_overrides for select to authenticated using (true);
create policy scoring_profile_metric_overrides_authenticated_read on public.scoring_profile_metric_overrides for select to authenticated using (true);

comment on table public.scoring_profiles is 'Sector-aware scoring profiles. GENERAL is the fallback for non-lender equities; BANK_NBFC is separate.';
comment on table public.scoring_profile_metric_overrides is 'Sector-specific applicability and weighting overlays on GENERAL metric rules. No score is activated by these rows.';