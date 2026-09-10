-- Stage 8 — versioned stock scoring, heatmap evidence and external agency ratings foundation.
-- Additive only. No live score is activated by this migration.

create table if not exists public.rating_agencies (
  code text primary key,
  name text not null,
  country_code text,
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  constraint rating_agency_code_shape check (code ~ '^[A-Z0-9_]+$')
);

insert into public.rating_agencies(code,name,country_code,website_url) values
  ('CRISIL','CRISIL Ratings','IN','https://www.crisilratings.com'),
  ('ICRA','ICRA Limited','IN','https://www.icra.in'),
  ('CARE','CARE Ratings','IN','https://www.careratings.com'),
  ('INDIA_RATINGS','India Ratings & Research','IN','https://www.indiaratings.co.in'),
  ('FITCH','Fitch Ratings',null,'https://www.fitchratings.com'),
  ('MOODYS','Moody''s Ratings',null,'https://www.moodys.com'),
  ('SP_GLOBAL','S&P Global Ratings',null,'https://www.spglobal.com/ratings')
on conflict (code) do update set
  name=excluded.name,
  country_code=excluded.country_code,
  website_url=excluded.website_url,
  is_active=true;

create table if not exists public.external_rating_observations (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete cascade,
  agency_code text not null references public.rating_agencies(code) on delete restrict,
  instrument_type text,
  instrument_description text,
  rating_symbol text not null,
  outlook text,
  rating_action text,
  rating_date date,
  source_url text not null,
  source_record_id uuid references public.data_source_records(id) on delete set null,
  retrieved_at timestamptz not null default clock_timestamp(),
  fresh_until timestamptz not null,
  evidence_status text not null default 'AVAILABLE',
  created_at timestamptz not null default clock_timestamp(),
  constraint external_rating_symbol_nonempty check (length(trim(rating_symbol)) > 0),
  constraint external_rating_source_nonempty check (length(trim(source_url)) > 0),
  constraint external_rating_evidence_status check (evidence_status in ('AVAILABLE','PROVISIONAL','STALE','CONFLICTING','AMBIGUOUS','REVIEW_REQUIRED'))
);

create index if not exists external_rating_observations_security_idx
  on public.external_rating_observations(security_id, agency_code, rating_date desc nulls last, retrieved_at desc);

create table if not exists public.scoring_models (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version integer not null,
  name text not null,
  status text not null default 'DRAFT',
  methodology jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  activated_at timestamptz,
  retired_at timestamptz,
  unique(code,version),
  constraint scoring_model_code_shape check (code ~ '^[A-Z0-9_]+$'),
  constraint scoring_model_version_positive check (version > 0),
  constraint scoring_model_status check (status in ('DRAFT','ACTIVE','RETIRED')),
  constraint scoring_model_methodology_object check (jsonb_typeof(methodology)='object')
);

create table if not exists public.scoring_model_dimensions (
  id uuid primary key default gen_random_uuid(),
  scoring_model_id uuid not null references public.scoring_models(id) on delete cascade,
  scoring_profile text not null,
  dimension_code text not null,
  weight numeric(8,4) not null,
  minimum_coverage numeric(6,4) not null default 0.6000,
  display_order integer not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(scoring_model_id,scoring_profile,dimension_code),
  constraint scoring_profile_shape check (scoring_profile ~ '^[A-Z0-9_]+$'),
  constraint scoring_dimension_shape check (dimension_code ~ '^[A-Z0-9_]+$'),
  constraint scoring_dimension_weight check (weight >= 0 and weight <= 100),
  constraint scoring_dimension_coverage check (minimum_coverage >= 0 and minimum_coverage <= 1),
  constraint scoring_dimension_display_order check (display_order > 0)
);

create table if not exists public.stock_score_runs (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete cascade,
  scoring_model_id uuid not null references public.scoring_models(id) on delete restrict,
  scoring_profile text not null,
  as_of_date date not null,
  run_state text not null default 'PARTIAL',
  overall_score numeric(6,2),
  evidence_coverage numeric(6,4) not null default 0,
  evidence_confidence numeric(6,2) not null default 0,
  freshness_factor numeric(6,4) not null default 1,
  evidence_quality_factor numeric(6,4) not null default 1,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  unique(security_id,scoring_model_id,scoring_profile,as_of_date),
  constraint stock_score_run_state check (run_state in ('PARTIAL','SCORABLE','FINAL','FAILED')),
  constraint stock_score_overall_range check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  constraint stock_score_coverage_range check (evidence_coverage >= 0 and evidence_coverage <= 1),
  constraint stock_score_confidence_range check (evidence_confidence >= 0 and evidence_confidence <= 100),
  constraint stock_score_freshness_range check (freshness_factor >= 0 and freshness_factor <= 1),
  constraint stock_score_quality_factor_range check (evidence_quality_factor >= 0 and evidence_quality_factor <= 1),
  constraint stock_score_summary_object check (jsonb_typeof(summary)='object')
);

create index if not exists stock_score_runs_security_idx
  on public.stock_score_runs(security_id, as_of_date desc, created_at desc);

create table if not exists public.stock_dimension_scores (
  id uuid primary key default gen_random_uuid(),
  score_run_id uuid not null references public.stock_score_runs(id) on delete cascade,
  dimension_code text not null,
  dimension_weight numeric(8,4) not null,
  raw_score numeric(6,2),
  weighted_contribution numeric(8,4),
  evidence_coverage numeric(6,4) not null default 0,
  confidence numeric(6,2) not null default 0,
  heat_state text not null default 'INSUFFICIENT',
  rationale jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  unique(score_run_id,dimension_code),
  constraint stock_dimension_raw_range check (raw_score is null or (raw_score >= 0 and raw_score <= 100)),
  constraint stock_dimension_weight_range check (dimension_weight >= 0 and dimension_weight <= 100),
  constraint stock_dimension_coverage_range check (evidence_coverage >= 0 and evidence_coverage <= 1),
  constraint stock_dimension_confidence_range check (confidence >= 0 and confidence <= 100),
  constraint stock_dimension_heat_state check (heat_state in ('STRONG','POSITIVE','NEUTRAL','WEAK','RISK','INSUFFICIENT')),
  constraint stock_dimension_rationale_object check (jsonb_typeof(rationale)='object')
);

create table if not exists public.stock_metric_score_inputs (
  id uuid primary key default gen_random_uuid(),
  dimension_score_id uuid not null references public.stock_dimension_scores(id) on delete cascade,
  metric_code text,
  fundamental_observation_id uuid references public.fundamental_observations(id) on delete restrict,
  external_rating_observation_id uuid references public.external_rating_observations(id) on delete restrict,
  input_label text not null,
  observed_numeric_value numeric,
  observed_text_value text,
  normalized_score numeric(6,2),
  metric_weight numeric(8,4) not null,
  contribution numeric(8,4),
  input_state text not null default 'AVAILABLE',
  normalization_rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  constraint stock_metric_score_range check (normalized_score is null or (normalized_score >= 0 and normalized_score <= 100)),
  constraint stock_metric_weight_range check (metric_weight >= 0 and metric_weight <= 100),
  constraint stock_metric_input_state check (input_state in ('AVAILABLE','STALE','CONFLICTING','INSUFFICIENT','NOT_APPLICABLE')),
  constraint stock_metric_rule_object check (jsonb_typeof(normalization_rule)='object'),
  constraint stock_metric_one_evidence_source check (
    num_nonnulls(fundamental_observation_id, external_rating_observation_id) <= 1
  )
);

create index if not exists stock_metric_score_inputs_dimension_idx
  on public.stock_metric_score_inputs(dimension_score_id);

-- Seed the V1 model as DRAFT only. Activation requires a later explicit migration after HDFCBANK validation.
insert into public.scoring_models(code,version,name,status,methodology)
values (
  'PAI_STOCK_SCORE',
  1,
  'PortfolioAI Stock Score V1',
  'DRAFT',
  jsonb_build_object(
    'overall_minimum_weight_coverage',0.70,
    'dimension_minimum_coverage',0.60,
    'heatmap_thresholds',jsonb_build_object('STRONG',80,'POSITIVE',65,'NEUTRAL',50,'WEAK',35,'RISK',0),
    'confidence_formula','coverage_percent * freshness_factor * evidence_quality_factor',
    'user_controls_portfolio_role',true,
    'core_stock_design_max',35
  )
)
on conflict (code,version) do nothing;

with m as (
  select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1
), rows(scoring_profile,dimension_code,weight,display_order) as (
  values
    ('GENERAL','QUALITY',15,1),('GENERAL','GROWTH',18,2),('GENERAL','CAPITAL_EFFICIENCY',12,3),('GENERAL','CASH_FLOW',12,4),('GENERAL','BALANCE_SHEET_CREDIT',10,5),('GENERAL','VALUATION',13,6),('GENERAL','MOMENTUM',10,7),('GENERAL','OWNERSHIP_GOVERNANCE',5,8),('GENERAL','RISK',5,9),
    ('BANK_NBFC','QUALITY',18,1),('BANK_NBFC','GROWTH',15,2),('BANK_NBFC','CAPITAL_EFFICIENCY',12,3),('BANK_NBFC','CASH_FLOW',0,4),('BANK_NBFC','BALANCE_SHEET_CREDIT',20,5),('BANK_NBFC','VALUATION',15,6),('BANK_NBFC','MOMENTUM',10,7),('BANK_NBFC','OWNERSHIP_GOVERNANCE',5,8),('BANK_NBFC','RISK',5,9)
)
insert into public.scoring_model_dimensions(scoring_model_id,scoring_profile,dimension_code,weight,display_order)
select m.id,r.scoring_profile,r.dimension_code,r.weight,r.display_order from m cross join rows r
on conflict (scoring_model_id,scoring_profile,dimension_code) do nothing;

alter table public.rating_agencies enable row level security;
alter table public.external_rating_observations enable row level security;
alter table public.scoring_models enable row level security;
alter table public.scoring_model_dimensions enable row level security;
alter table public.stock_score_runs enable row level security;
alter table public.stock_dimension_scores enable row level security;
alter table public.stock_metric_score_inputs enable row level security;

-- Research/scoring evidence is non-personal market data; authenticated users may read it.
-- All writes remain service-side because no INSERT/UPDATE/DELETE policies are granted.
create policy rating_agencies_authenticated_read on public.rating_agencies for select to authenticated using (true);
create policy external_rating_observations_authenticated_read on public.external_rating_observations for select to authenticated using (true);
create policy scoring_models_authenticated_read on public.scoring_models for select to authenticated using (true);
create policy scoring_model_dimensions_authenticated_read on public.scoring_model_dimensions for select to authenticated using (true);
create policy stock_score_runs_authenticated_read on public.stock_score_runs for select to authenticated using (true);
create policy stock_dimension_scores_authenticated_read on public.stock_dimension_scores for select to authenticated using (true);
create policy stock_metric_score_inputs_authenticated_read on public.stock_metric_score_inputs for select to authenticated using (true);

comment on table public.external_rating_observations is 'Immutable-style evidence rows for instrument-level external credit ratings and rating actions.';
comment on table public.stock_score_runs is 'Versioned deterministic stock scoring runs. Historical runs are retained against their scoring model version.';
comment on table public.stock_metric_score_inputs is 'Audit trail of the exact observations/rating evidence and normalization rules used by a dimension score.';