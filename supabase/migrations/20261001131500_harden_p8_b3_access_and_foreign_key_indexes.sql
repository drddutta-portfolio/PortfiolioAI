-- PortfolioAI P8-B3 hosted-foundation hardening.
-- Additive remediation after the initial B3 schema application.
-- No data mutation. No Production/main change.
--
-- Goals:
--   1. Keep B3 evidence/internal coverage relations service-role only until a
--      later explicitly approved UI/read-model exposure stage.
--   2. Add covering indexes in the exact FK column order so large B3 loads do
--      not create avoidable FK lookup/deletion-check scans.
--   3. Preserve RLS policies as defense-in-depth for future exposure.

-- ---------------------------------------------------------------------------
-- Access hardening: remove current authenticated GraphQL/REST visibility.
-- ---------------------------------------------------------------------------

revoke select on public.p8_b3_source_archives from authenticated;
revoke select on public.p8_b3_raw_market_price_observations from authenticated;
revoke select on public.p8_b3_corporate_action_observations from authenticated;
revoke select on public.p8_b3_corporate_action_normalizations from authenticated;
revoke select on public.p8_b3_adjustment_factors from authenticated;
revoke select on public.p8_b3_adjusted_market_price_series from authenticated;
revoke select on public.p8_b3_benchmark_total_return_history from authenticated;

revoke select on public.current_p8_b3_market_coverage_v1 from authenticated;
revoke select on public.current_p8_b3_corporate_action_coverage_v1 from authenticated;

grant select on public.p8_b3_source_archives to service_role;
grant select on public.p8_b3_raw_market_price_observations to service_role;
grant select on public.p8_b3_corporate_action_observations to service_role;
grant select on public.p8_b3_corporate_action_normalizations to service_role;
grant select on public.p8_b3_adjustment_factors to service_role;
grant select on public.p8_b3_adjusted_market_price_series to service_role;
grant select on public.p8_b3_benchmark_total_return_history to service_role;

grant select on public.current_p8_b3_market_coverage_v1 to service_role;
grant select on public.current_p8_b3_corporate_action_coverage_v1 to service_role;

-- ---------------------------------------------------------------------------
-- Exact FK covering indexes.
--
-- PostgreSQL can use an index for FK maintenance efficiently when the leading
-- index columns match the referencing FK columns in order. Existing analytical
-- indexes remain untouched; these are integrity/performance indexes.
-- ---------------------------------------------------------------------------

create index p8_b3_source_archives_created_by_fk_idx
  on public.p8_b3_source_archives (created_by);

create index p8_b3_raw_market_price_identity_fk_idx
  on public.p8_b3_raw_market_price_observations
  (historical_identity_id, portfolio_id, experiment_id);

create index p8_b3_raw_market_price_archive_fk_idx
  on public.p8_b3_raw_market_price_observations
  (source_archive_id, portfolio_id, experiment_id);

create index p8_b3_corporate_action_archive_fk_idx
  on public.p8_b3_corporate_action_observations
  (source_archive_id, portfolio_id, experiment_id);

create index p8_b3_corporate_action_identity_fk_idx
  on public.p8_b3_corporate_action_observations
  (historical_identity_id, portfolio_id, experiment_id);

create index p8_b3_action_normalization_observation_fk_idx
  on public.p8_b3_corporate_action_normalizations
  (corporate_action_observation_id, portfolio_id, experiment_id);

create index p8_b3_action_normalization_identity_fk_idx
  on public.p8_b3_corporate_action_normalizations
  (historical_identity_id, portfolio_id, experiment_id);

create index p8_b3_adjustment_factor_identity_fk_idx
  on public.p8_b3_adjustment_factors
  (historical_identity_id, portfolio_id, experiment_id);

create index p8_b3_adjustment_factor_normalization_fk_idx
  on public.p8_b3_adjustment_factors
  (corporate_action_normalization_id, portfolio_id, experiment_id);

create index p8_b3_adjusted_series_identity_fk_idx
  on public.p8_b3_adjusted_market_price_series
  (historical_identity_id, portfolio_id, experiment_id);

create index p8_b3_adjusted_series_raw_price_fk_idx
  on public.p8_b3_adjusted_market_price_series
  (raw_price_observation_id, portfolio_id, experiment_id);

create index p8_b3_benchmark_archive_fk_idx
  on public.p8_b3_benchmark_total_return_history
  (source_archive_id, portfolio_id, experiment_id);
