-- Stage 4 recovery: PostgreSQL GREATEST is special syntax and cannot be schema-qualified.
-- This migration replaces only the server-only lease acquisition function.

create or replace function public.acquire_market_data_operation_lease(
  p_portfolio_id uuid,
  p_provider_code text,
  p_operation text,
  p_lease_holder uuid,
  p_lease_seconds integer
)
returns table (acquired boolean, retry_after timestamptz)
language plpgsql
set search_path = ''
as $$
begin
  if p_lease_seconds < 1 or p_lease_seconds > 900 then
    raise exception 'Invalid lease duration.';
  end if;

  insert into public.market_data_operation_leases (
    portfolio_id, provider_code, operation, lease_holder, lease_expires_at, updated_at
  ) values (
    p_portfolio_id, p_provider_code, p_operation, p_lease_holder,
    pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_lease_seconds), pg_catalog.clock_timestamp()
  )
  on conflict (provider_code, operation) do update
    set portfolio_id = excluded.portfolio_id,
        lease_holder = excluded.lease_holder,
        lease_expires_at = excluded.lease_expires_at,
        updated_at = excluded.updated_at
    where (public.market_data_operation_leases.lease_expires_at is null
           or public.market_data_operation_leases.lease_expires_at <= pg_catalog.clock_timestamp())
      and public.market_data_operation_leases.next_allowed_at <= pg_catalog.clock_timestamp();

  return query
  select leases.lease_holder = p_lease_holder,
         greatest(leases.next_allowed_at, leases.lease_expires_at)
  from public.market_data_operation_leases as leases
  where leases.provider_code = p_provider_code
    and leases.operation = p_operation;
end;
$$;

revoke all on function public.acquire_market_data_operation_lease(uuid, text, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.acquire_market_data_operation_lease(uuid, text, text, uuid, integer) to service_role;
