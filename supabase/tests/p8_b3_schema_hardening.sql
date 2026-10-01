begin;

do $$
declare
  v_table text;
  v_view text;
  v_fk record;
begin
  -- B3 base tables remain RLS-enabled but are not exposed directly to anon or authenticated.
  foreach v_table in array array[
    'p8_b3_source_archives',
    'p8_b3_raw_market_price_observations',
    'p8_b3_corporate_action_observations',
    'p8_b3_corporate_action_normalizations',
    'p8_b3_adjustment_factors',
    'p8_b3_adjusted_market_price_series',
    'p8_b3_benchmark_total_return_history'
  ]
  loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table
        and c.relkind = 'r'
        and c.relrowsecurity
    ) then
      raise exception 'P8-B3 hardening: RLS is not enabled on %', v_table;
    end if;

    if has_table_privilege('anon', format('public.%I',v_table), 'select')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'select')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'insert')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'update')
       or has_table_privilege('authenticated', format('public.%I',v_table), 'delete')
       or not has_table_privilege('service_role', format('public.%I',v_table), 'select')
       or not has_table_privilege('service_role', format('public.%I',v_table), 'insert') then
      raise exception 'P8-B3 hardening: privilege contract failed on %', v_table;
    end if;
  end loop;

  foreach v_view in array array[
    'current_p8_b3_market_coverage_v1',
    'current_p8_b3_corporate_action_coverage_v1'
  ]
  loop
    if has_table_privilege('anon', format('public.%I',v_view), 'select')
       or has_table_privilege('authenticated', format('public.%I',v_view), 'select')
       or not has_table_privilege('service_role', format('public.%I',v_view), 'select') then
      raise exception 'P8-B3 hardening: view privilege contract failed on %', v_view;
    end if;

    if not exists (
      select 1
      from pg_class c
      where c.oid = format('public.%I',v_view)::regclass
        and 'security_invoker=true' = any(c.reloptions)
    ) then
      raise exception 'P8-B3 hardening: view % is not security_invoker', v_view;
    end if;
  end loop;

  -- Every B3 foreign key must have a usable covering index whose leading
  -- key columns exactly match the referencing FK column order.
  for v_fk in
    select
      con.oid as constraint_oid,
      con.conname,
      con.conrelid,
      con.conkey
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where con.contype = 'f'
      and n.nspname = 'public'
      and rel.relname like 'p8_b3_%'
  loop
    if not exists (
      select 1
      from pg_index idx
      where idx.indrelid = v_fk.conrelid
        and idx.indisvalid
        and idx.indisready
        and idx.indpred is null
        and idx.indexprs is null
        and (
          select array_agg(idx.indkey[position]::smallint order by position)
          from generate_series(
            0,
            cardinality(v_fk.conkey) - 1
          ) as positions(position)
        ) = v_fk.conkey
    ) then
      raise exception 'P8-B3 hardening: FK % has no exact leading covering index', v_fk.conname;
    end if;
  end loop;

  if has_function_privilege('public','public.reject_p8_b3_market_mutation_v1()','execute')
     or has_function_privilege('anon','public.reject_p8_b3_market_mutation_v1()','execute')
     or has_function_privilege('authenticated','public.reject_p8_b3_market_mutation_v1()','execute')
     or not has_function_privilege('service_role','public.reject_p8_b3_market_mutation_v1()','execute') then
    raise exception 'P8-B3 hardening: mutation rejection function privilege contract failed';
  end if;
end;
$$;

do $$
begin
  -- The hardening migration must not insert data.
  if (select count(*) from public.p8_b3_source_archives) <> 0
     or (select count(*) from public.p8_b3_raw_market_price_observations) <> 0
     or (select count(*) from public.p8_b3_corporate_action_observations) <> 0
     or (select count(*) from public.p8_b3_corporate_action_normalizations) <> 0
     or (select count(*) from public.p8_b3_adjustment_factors) <> 0
     or (select count(*) from public.p8_b3_adjusted_market_price_series) <> 0
     or (select count(*) from public.p8_b3_benchmark_total_return_history) <> 0 then
    raise exception 'P8-B3 hardening: expected empty local B3 tables after replay';
  end if;
end;
$$;

rollback;
