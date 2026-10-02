-- PortfolioAI P8 historical bulk-storage retirement.
-- Development-only migration. Requires:
--   1. Verified full PortfolioAI Dev PostgreSQL backup in Cloudflare R2.
--   2. Canonical R2 Parquet export + runtime projection PASS.
--   3. Explicit owner approval.
--
-- No CASCADE is used. Dependencies are retired explicitly and fail-closed.

do $$
begin
  if to_regclass('public.p8_b3_raw_market_price_observations') is null
     or to_regclass('public.p8_historical_listing_observations_v3') is null
     or to_regclass('public.p8_historical_universe_member_listing_evidence_v3') is null
     or to_regclass('public.p8_historical_universe_members_v3') is null then
    raise exception using
      errcode='55000',
      message='Required P8 bulk historical relations are missing; retirement aborted.';
  end if;

  if exists (select 1 from public.p8_b3_adjusted_market_price_series limit 1) then
    raise exception using
      errcode='55000',
      message='Adjusted market-price rows already exist; P8 raw-price retirement requires a separate migration.';
  end if;

  if exists (select 1 from public.p8_b3_corporate_action_normalizations limit 1)
     or exists (select 1 from public.p8_b3_adjustment_factors limit 1) then
    raise exception using
      errcode='55000',
      message='B3 normalization/factor rows exist; P8 bulk retirement aborted.';
  end if;
end
$$;

drop view if exists public.current_p8_historical_universe_member_listing_evidence_v3;
drop view if exists public.current_p8_historical_universe_membership_v3;
drop view if exists public.current_p8_b3_market_coverage_v1;

drop function if exists public.append_and_select_p8_historical_universe_v3(jsonb, jsonb, jsonb, jsonb);
drop function if exists public.append_p8_historical_listing_observation_v3(jsonb);

alter table public.p8_b3_adjusted_market_price_series
  drop constraint if exists p8_b3_adjusted_series_raw_price_fk;

-- Until B3 adjusted-series materialization is redesigned around R2 object identity,
-- prevent accidental orphaned inserts into the still-empty adjusted-series table.
alter table public.p8_b3_adjusted_market_price_series
  add constraint p8_b3_adjusted_series_external_history_gate_ck
  check (false) not valid;

drop table public.p8_historical_universe_member_listing_evidence_v3;
drop table public.p8_historical_universe_members_v3;
drop table public.p8_historical_listing_observations_v3;
drop table public.p8_b3_raw_market_price_observations;

create or replace function public.append_p8_historical_listing_observation_v3(p_observation jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using
    errcode='55000',
    message='P8 historical listing persistence has moved out of PostgreSQL; use the approved R2 historical pipeline.';
end
$$;

create or replace function public.append_and_select_p8_historical_universe_v3(
  p_run jsonb,
  p_members jsonb,
  p_evidence_links jsonb,
  p_selection jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using
    errcode='55000',
    message='P8 historical-universe bulk persistence has moved out of PostgreSQL; use the approved R2 historical pipeline.';
end
$$;

comment on function public.append_p8_historical_listing_observation_v3(jsonb)
is 'Fail-closed compatibility stub after P8 historical listing evidence moved to Cloudflare R2.';

comment on function public.append_and_select_p8_historical_universe_v3(jsonb, jsonb, jsonb, jsonb)
is 'Fail-closed compatibility stub after P8 historical universe bulk data moved to Cloudflare R2.';

comment on constraint p8_b3_adjusted_series_external_history_gate_ck
on public.p8_b3_adjusted_market_price_series
is 'Fail-closed gate: adjusted-series writes remain blocked until the R2-backed raw-price identity contract is implemented.';
