begin;

do $$
declare
  v_indexdef text;
begin
  select indexdef
    into v_indexdef
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'p8_historical_listing_observations_v3'
    and indexname = 'p8_historical_listing_obs_v3_action_lookup_idx';

  if v_indexdef is null then
    raise exception 'P8-B3 action identity lookup index is missing';
  end if;

  if position('(portfolio_id, experiment_id, trading_symbol, historical_identity_id, source_date)' in v_indexdef) = 0 then
    raise exception 'P8-B3 action identity lookup index key contract failed: %', v_indexdef;
  end if;

  if position('INCLUDE (series)' in upper(v_indexdef)) = 0 then
    raise exception 'P8-B3 action identity lookup index INCLUDE contract failed: %', v_indexdef;
  end if;
end;
$$;

rollback;
