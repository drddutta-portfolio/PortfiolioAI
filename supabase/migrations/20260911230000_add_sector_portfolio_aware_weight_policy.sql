alter table public.recommendation_profile_policies
  add column if not exists weight_policy jsonb not null default '{}'::jsonb;

update public.recommendation_profile_policies
set weight_policy = '{
  "single_stock_max": 6,
  "core": {
    "high": [4, 6],
    "standard": [3, 4.5],
    "cautious": [2, 3]
  },
  "satellite": {
    "standard": [1, 2.5],
    "cautious": [0.5, 1.5]
  },
  "watch": [0, 1],
  "avoid": [0, 0],
  "high_conviction_score": 85,
  "caution_score": 72,
  "momentum_caution_below": 40,
  "risk_caution_below": 50,
  "momentum_cap": 4,
  "risk_cap": 3,
  "profile_concentration_soft_cap": 25,
  "profile_concentration_hard_cap": 35,
  "min_profile_coverage_for_concentration": 70
}'::jsonb,
updated_at = now()
where profile_code = 'BANK_NBFC' and policy_version = 1;

update public.recommendation_profile_policies
set weight_policy = '{
  "single_stock_max": 6,
  "profile_concentration_soft_cap": 25,
  "profile_concentration_hard_cap": 35,
  "min_profile_coverage_for_concentration": 70
}'::jsonb,
updated_at = now()
where profile_code <> 'BANK_NBFC' and policy_version = 1 and weight_policy = '{}'::jsonb;
