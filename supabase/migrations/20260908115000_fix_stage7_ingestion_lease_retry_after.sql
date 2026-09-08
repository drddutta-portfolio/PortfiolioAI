-- Stage 7 local lint correction: GREATEST is unqualified PostgreSQL syntax.

create or replace function public.acquire_data_ingestion_lease_v1(p_source_code text, p_operation text, p_lease_holder uuid, p_lease_seconds integer)
returns table(acquired boolean, retry_after timestamptz) language plpgsql set search_path='' as $$
begin
  if p_lease_seconds < 1 or p_lease_seconds > 900 then raise exception 'Invalid lease duration.'; end if;
  insert into public.data_ingestion_leases(source_code, operation, lease_holder, lease_expires_at, updated_at)
  values(p_source_code, p_operation, p_lease_holder, pg_catalog.clock_timestamp()+pg_catalog.make_interval(secs=>p_lease_seconds), pg_catalog.clock_timestamp())
  on conflict(source_code, operation) do update set lease_holder=excluded.lease_holder, lease_expires_at=excluded.lease_expires_at, updated_at=excluded.updated_at
  where (public.data_ingestion_leases.lease_expires_at is null or public.data_ingestion_leases.lease_expires_at <= pg_catalog.clock_timestamp()) and public.data_ingestion_leases.next_allowed_at <= pg_catalog.clock_timestamp();
  return query select l.lease_holder=p_lease_holder, greatest(l.next_allowed_at,l.lease_expires_at) from public.data_ingestion_leases l where l.source_code=p_source_code and l.operation=p_operation;
end $$;

revoke all on function public.acquire_data_ingestion_lease_v1(text,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.acquire_data_ingestion_lease_v1(text,text,uuid,integer) to service_role;
