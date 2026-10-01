-- Additive performance index for P8-B3 corporate-action identity lookup. No row mutation.
create index if not exists p8_historical_listing_obs_v3_action_lookup_idx
  on public.p8_historical_listing_observations_v3 (
    portfolio_id,
    experiment_id,
    trading_symbol,
    historical_identity_id,
    source_date
  )
  include (series);
