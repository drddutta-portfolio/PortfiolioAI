create table if not exists public.recommendation_profile_policies (
  profile_code text not null references public.scoring_profiles(code) on delete cascade,
  policy_version integer not null default 1,
  status text not null default 'DRAFT' check (status in ('DRAFT','REVIEWED','ACTIVE','RETIRED')),
  min_score_ready_coverage numeric not null default 0.70 check (min_score_ready_coverage between 0 and 1),
  core_min_score numeric null check (core_min_score between 0 and 100),
  satellite_min_score numeric null check (satellite_min_score between 0 and 100),
  watch_min_score numeric null check (watch_min_score between 0 and 100),
  mandatory_dimension_floors jsonb not null default '{}'::jsonb,
  caution_rules jsonb not null default '{}'::jsonb,
  sector_focus jsonb not null default '{}'::jsonb,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_code, policy_version)
);

alter table public.recommendation_profile_policies enable row level security;
drop policy if exists recommendation_profile_policies_authenticated_read on public.recommendation_profile_policies;
create policy recommendation_profile_policies_authenticated_read
  on public.recommendation_profile_policies for select to authenticated using (true);

create table if not exists public.stock_recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  security_id uuid not null references public.securities(id) on delete cascade,
  scoring_profile_code text not null references public.scoring_profiles(code),
  recommendation_policy_version integer not null,
  source_score_run_id uuid null references public.stock_score_runs(id) on delete set null,
  run_state text not null default 'PREVIEW' check (run_state in ('PREVIEW','OFFICIAL','SUPERSEDED')),
  overall_score numeric null check (overall_score between 0 and 100),
  score_ready_coverage numeric null check (score_ready_coverage between 0 and 1),
  evidence_confidence numeric null check (evidence_confidence between 0 and 100),
  suggested_role text not null check (suggested_role in ('CORE_CANDIDATE','SATELLITE_CANDIDATE','WATCH','AVOID','INSUFFICIENT')),
  action_bias text null check (action_bias is null or action_bias in ('ACCUMULATE','HOLD','REDUCE','EXIT_CANDIDATE','WAIT')),
  current_user_role text null,
  current_weight numeric null,
  suggested_weight_min numeric null,
  suggested_weight_max numeric null,
  change_signal text null check (change_signal is null or change_signal in ('UPGRADE','DOWNGRADE','UNCHANGED','INITIAL')),
  persistence_count integer not null default 1 check (persistence_count >= 1),
  rationale jsonb not null default '{}'::jsonb,
  ai_summary text null,
  created_at timestamptz not null default now(),
  foreign key (scoring_profile_code, recommendation_policy_version)
    references public.recommendation_profile_policies(profile_code, policy_version)
);

create index if not exists stock_recommendation_runs_lookup_idx
  on public.stock_recommendation_runs(portfolio_id, security_id, created_at desc);

alter table public.stock_recommendation_runs enable row level security;
drop policy if exists stock_recommendation_runs_owner_read on public.stock_recommendation_runs;
create policy stock_recommendation_runs_owner_read
  on public.stock_recommendation_runs for select to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()));

insert into public.recommendation_profile_policies (
  profile_code, policy_version, status, min_score_ready_coverage,
  core_min_score, satellite_min_score, watch_min_score,
  mandatory_dimension_floors, caution_rules, sector_focus, notes
) values (
  'BANK_NBFC', 1, 'DRAFT', 0.70,
  78, 65, 50,
  '{"CORE_CANDIDATE":{"QUALITY":70,"GROWTH":60,"BALANCE_SHEET_CREDIT":75,"VALUATION":50,"RISK":60},"SATELLITE_CANDIDATE":{"QUALITY":55,"GROWTH":45,"BALANCE_SHEET_CREDIT":60,"VALUATION":35,"RISK":45}}'::jsonb,
  '{"MOMENTUM":{"below":40,"label":"Weak market momentum"},"OWNERSHIP_GOVERNANCE":{"below":50,"label":"Ownership / governance caution"}}'::jsonb,
  '{"primary":["QUALITY","GROWTH","BALANCE_SHEET_CREDIT","VALUATION","RISK"],"context":["CAPITAL_EFFICIENCY","MOMENTUM","OWNERSHIP_GOVERNANCE"],"not_applicable":["CASH_FLOW"]}'::jsonb,
  'HDFCBANK reference-stock pilot. Draft until model validation; sector/business-profile specific and never changes the user-selected role automatically.'
)
on conflict (profile_code, policy_version) do update set
  status = excluded.status,
  min_score_ready_coverage = excluded.min_score_ready_coverage,
  core_min_score = excluded.core_min_score,
  satellite_min_score = excluded.satellite_min_score,
  watch_min_score = excluded.watch_min_score,
  mandatory_dimension_floors = excluded.mandatory_dimension_floors,
  caution_rules = excluded.caution_rules,
  sector_focus = excluded.sector_focus,
  notes = excluded.notes,
  updated_at = now();

insert into public.recommendation_profile_policies (profile_code, policy_version, status, sector_focus, notes)
select code, 1, 'DRAFT',
  case code
    when 'IT_TECH' then '{"primary":["QUALITY","GROWTH","CASH_FLOW","VALUATION"],"context":["CAPITAL_EFFICIENCY","MOMENTUM","OWNERSHIP_GOVERNANCE","RISK"]}'::jsonb
    when 'AUTO_COMPONENTS' then '{"primary":["QUALITY","GROWTH","CAPITAL_EFFICIENCY","CASH_FLOW","VALUATION"],"context":["BALANCE_SHEET_CREDIT","MOMENTUM","OWNERSHIP_GOVERNANCE","RISK"]}'::jsonb
    when 'PHARMA_HEALTHCARE' then '{"primary":["QUALITY","GROWTH","CASH_FLOW","BALANCE_SHEET_CREDIT","VALUATION"],"context":["CAPITAL_EFFICIENCY","MOMENTUM","OWNERSHIP_GOVERNANCE","RISK"]}'::jsonb
    when 'CONSUMER_FMCG' then '{"primary":["QUALITY","GROWTH","CAPITAL_EFFICIENCY","VALUATION"],"context":["CASH_FLOW","BALANCE_SHEET_CREDIT","MOMENTUM","OWNERSHIP_GOVERNANCE","RISK"]}'::jsonb
    when 'INDUSTRIALS_CAPITAL_GOODS' then '{"primary":["QUALITY","GROWTH","CAPITAL_EFFICIENCY","CASH_FLOW","BALANCE_SHEET_CREDIT"],"context":["VALUATION","MOMENTUM","OWNERSHIP_GOVERNANCE","RISK"]}'::jsonb
    when 'ENERGY_UTILITIES' then '{"primary":["CASH_FLOW","BALANCE_SHEET_CREDIT","VALUATION","RISK"],"context":["QUALITY","GROWTH","CAPITAL_EFFICIENCY","MOMENTUM","OWNERSHIP_GOVERNANCE"]}'::jsonb
    when 'METALS_COMMODITIES' then '{"primary":["CASH_FLOW","BALANCE_SHEET_CREDIT","VALUATION","RISK"],"context":["QUALITY","GROWTH","CAPITAL_EFFICIENCY","MOMENTUM","OWNERSHIP_GOVERNANCE"]}'::jsonb
    when 'INFRA_CONSTRUCTION' then '{"primary":["GROWTH","CASH_FLOW","BALANCE_SHEET_CREDIT","RISK"],"context":["QUALITY","CAPITAL_EFFICIENCY","VALUATION","MOMENTUM","OWNERSHIP_GOVERNANCE"]}'::jsonb
    when 'REAL_ESTATE' then '{"primary":["CASH_FLOW","BALANCE_SHEET_CREDIT","VALUATION","RISK"],"context":["QUALITY","GROWTH","CAPITAL_EFFICIENCY","MOMENTUM","OWNERSHIP_GOVERNANCE"]}'::jsonb
    when 'FIN_SERVICES_NON_LENDER' then '{"primary":["QUALITY","GROWTH","BALANCE_SHEET_CREDIT","VALUATION","RISK"],"context":["CAPITAL_EFFICIENCY","CASH_FLOW","MOMENTUM","OWNERSHIP_GOVERNANCE"]}'::jsonb
    else '{"primary":["QUALITY","GROWTH","VALUATION","RISK"],"context":["CAPITAL_EFFICIENCY","CASH_FLOW","BALANCE_SHEET_CREDIT","MOMENTUM","OWNERSHIP_GOVERNANCE"]}'::jsonb
  end,
  'Sector-specific policy scaffold only. Thresholds intentionally unset until a reference stock validates this profile.'
from public.scoring_profiles
where code <> 'BANK_NBFC'
on conflict (profile_code, policy_version) do nothing;