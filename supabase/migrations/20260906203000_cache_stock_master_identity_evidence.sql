begin;

-- The reviewed V1 commit revalidated every ISIN-resolved transaction by
-- rescanning and reparsing the complete STOCK_MASTER evidence set. For the real
-- workbook that is up to 477 x 599 JSON row inspections. Materialize the exact
-- normalized ticker/ISIN pairs once per invocation, then retain the same exact
-- membership check inside the row validation loop.
do $migration$
declare
  v_definition text;
  v_old_declaration constant text := $old$
  v_existing_row_ids uuid[];
  v_transaction_ids uuid[] := '{}'::uuid[];$old$;
  v_new_declaration constant text := $new$
  v_existing_row_ids uuid[];
  v_transaction_ids uuid[] := '{}'::uuid[];
  v_stock_master_identity_pairs text[] := '{}'::text[];$new$;
  v_old_loop_start constant text := $old$
  for v_row in
    select import_source_rows.*$old$;
  v_new_loop_start constant text := $new$
  select coalesce(
    pg_catalog.array_agg(distinct (
      pg_catalog.upper(pg_catalog.btrim(master_evidence.source_ticker))
      || pg_catalog.chr(31)
      || pg_catalog.upper(pg_catalog.btrim(master_evidence.source_isin))
    )),
    '{}'::text[]
  )
  into v_stock_master_identity_pairs
  from (
    select
      public.portfolioai_import_cell_text(public.portfolioai_import_cell(
        master_row.raw_data, array['TICKER', 'SYMBOL', 'STOCK', 'SCRIP']
      )) as source_ticker,
      public.portfolioai_import_cell_text(public.portfolioai_import_cell(
        master_row.raw_data, array['ISIN', 'ISINCODE']
      )) as source_isin
    from public.import_source_rows as master_row
    where master_row.import_batch_id = v_batch.id
      and master_row.portfolio_id = v_batch.portfolio_id
      and master_row.raw_data ->> 'record_kind' = 'STOCK_MASTER'
  ) as master_evidence
  where master_evidence.source_ticker is not null
    and master_evidence.source_isin is not null;

  for v_row in
    select import_source_rows.*$new$;
  v_old_isin_check constant text := $old$
    elsif v_security_method = 'ISIN' and v_source_isin is not null then
      select count(*) into v_match_count
      from public.securities
      where securities.id = v_security_id and securities.is_active and securities.isin = v_source_isin
        and exists (
          select 1
          from public.import_source_rows as master_row
          where master_row.import_batch_id = v_batch.id
            and master_row.portfolio_id = v_batch.portfolio_id
            and master_row.raw_data ->> 'record_kind' = 'STOCK_MASTER'
            and pg_catalog.upper(pg_catalog.btrim(public.portfolioai_import_cell_text(
              public.portfolioai_import_cell(master_row.raw_data, array['TICKER', 'SYMBOL', 'STOCK', 'SCRIP'])
            ))) = pg_catalog.upper(pg_catalog.btrim(v_source_ticker))
            and pg_catalog.upper(pg_catalog.btrim(public.portfolioai_import_cell_text(
              public.portfolioai_import_cell(master_row.raw_data, array['ISIN', 'ISINCODE'])
            ))) = v_source_isin
        );$old$;
  v_new_isin_check constant text := $new$
    elsif v_security_method = 'ISIN' and v_source_isin is not null then
      select count(*) into v_match_count
      from public.securities
      where securities.id = v_security_id
        and securities.is_active
        and securities.isin = v_source_isin
        and (
          pg_catalog.upper(pg_catalog.btrim(v_source_ticker))
          || pg_catalog.chr(31)
          || v_source_isin
        ) = any (v_stock_master_identity_pairs);$new$;
begin
  select pg_catalog.pg_get_functiondef(
    'public.commit_import_batch_v1(uuid,uuid[])'::regprocedure
  ) into v_definition;

  if pg_catalog.strpos(v_definition, v_old_declaration) = 0
    or pg_catalog.strpos(v_definition, v_old_loop_start) = 0
    or pg_catalog.strpos(v_definition, v_old_isin_check) = 0
  then
    raise exception using
      errcode = '55000',
      message = 'reviewed import commit definition was not found; optimization migration not applied';
  end if;

  if pg_catalog.strpos(v_definition, 'v_stock_master_identity_pairs text[]') <> 0 then
    raise exception using
      errcode = '55000',
      message = 'stock-master evidence cache already exists unexpectedly; optimization migration not applied';
  end if;

  v_definition := pg_catalog.replace(v_definition, v_old_declaration, v_new_declaration);
  v_definition := pg_catalog.replace(v_definition, v_old_loop_start, v_new_loop_start);
  v_definition := pg_catalog.replace(v_definition, v_old_isin_check, v_new_isin_check);
  execute v_definition;
end;
$migration$;

commit;
