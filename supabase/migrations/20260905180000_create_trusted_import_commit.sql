-- Trusted V1 commit path from reviewed staging evidence into the immutable ledger.
-- Browser roles retain read-only access to public.transactions.

create function public.portfolioai_normalize_import_token(p_value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select pg_catalog.regexp_replace(pg_catalog.upper(pg_catalog.btrim(p_value)), '[^A-Z0-9]', '', 'g');
$$;

create function public.portfolioai_import_cell(p_raw_data jsonb, p_aliases text[])
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select cell.value
  from pg_catalog.jsonb_each(
    case
      when pg_catalog.jsonb_typeof(p_raw_data -> 'cells') = 'object' then p_raw_data -> 'cells'
      else '{}'::jsonb
    end
  ) as cell(key, value)
  where public.portfolioai_normalize_import_token(cell.key) = any (p_aliases)
  order by pg_catalog.array_position(p_aliases, public.portfolioai_normalize_import_token(cell.key))
  limit 1;
$$;

create function public.portfolioai_import_cell_text(p_cell jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_cell is null or p_cell -> 'value' = 'null'::jsonb then null
    when pg_catalog.jsonb_typeof(p_cell -> 'value') in ('string', 'number')
      then nullif(pg_catalog.btrim(p_cell ->> 'value'), '')
    else null
  end;
$$;

create function public.portfolioai_import_date(p_cell jsonb)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_text text;
  v_match text[];
  v_result date;
begin
  if p_cell is null
    or nullif(p_cell ->> 'formula', '') is not null
    or p_cell -> 'value' = 'null'::jsonb
  then
    return null;
  end if;

  v_text := public.portfolioai_import_cell_text(p_cell);
  if v_text is null then
    raise exception using errcode = '22007', message = 'source transaction date is not valid text evidence';
  end if;

  if (p_cell ->> 'data_type') = 'date' and v_text ~ '^\d{4}-\d{2}-\d{2}' then
    v_text := pg_catalog.left(v_text, 10);
  end if;

  v_match := pg_catalog.regexp_match(v_text, '^(\d{4})-(\d{2})-(\d{2})$');
  if v_match is not null then
    begin
      v_result := pg_catalog.make_date(v_match[1]::integer, v_match[2]::integer, v_match[3]::integer);
    exception when datetime_field_overflow then
      raise exception using errcode = '22007', message = 'source transaction date is invalid';
    end;
    return v_result;
  end if;

  v_match := pg_catalog.regexp_match(v_text, '^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$');
  if v_match is not null then
    begin
      v_result := pg_catalog.make_date(v_match[3]::integer, v_match[2]::integer, v_match[1]::integer);
    exception when datetime_field_overflow then
      raise exception using errcode = '22007', message = 'source transaction date is invalid';
    end;
    return v_result;
  end if;

  raise exception using errcode = '22007', message = 'source transaction date is ambiguous or unsupported';
end;
$$;

revoke execute on function public.portfolioai_normalize_import_token(text) from public, anon, authenticated, service_role;
revoke execute on function public.portfolioai_import_cell(jsonb, text[]) from public, anon, authenticated, service_role;
revoke execute on function public.portfolioai_import_cell_text(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.portfolioai_import_date(jsonb) from public, anon, authenticated, service_role;

create function public.commit_import_batch_v1(
  p_import_batch_id uuid,
  p_approved_source_row_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_batch public.import_batches%rowtype;
  v_row public.import_source_rows%rowtype;
  v_existing_row_ids uuid[];
  v_transaction_ids uuid[] := '{}'::uuid[];
  v_approved_count integer;
  v_position integer := 0;
  v_normalized jsonb;
  v_side_cell jsonb;
  v_ticker_cell jsonb;
  v_quantity_cell jsonb;
  v_price_cell jsonb;
  v_broker_cell jsonb;
  v_date_cell jsonb;
  v_source_ticker text;
  v_source_broker text;
  v_transaction_type text;
  v_numeric_text text;
  v_exact_numeric numeric;
  v_normalized_numeric numeric;
  v_quantity numeric(38, 18);
  v_unit_price numeric(38, 18);
  v_transaction_date date;
  v_broker_account_id uuid;
  v_expected_broker_account_id uuid;
  v_security_id uuid;
  v_security_method text;
  v_source_isin text;
  v_data_quality_status text;
  v_transaction_id uuid;
  v_match_count integer;
  v_now timestamptz := pg_catalog.statement_timestamp();
begin
  if v_caller is null then
    raise exception using errcode = '42501', message = 'authentication is required';
  end if;

  if p_import_batch_id is null
    or p_approved_source_row_ids is null
    or pg_catalog.cardinality(p_approved_source_row_ids) = 0
    or pg_catalog.array_position(p_approved_source_row_ids, null) is not null
  then
    raise exception using errcode = '22023', message = 'a batch and at least one approved source row are required';
  end if;

  select count(distinct approved_id), count(*)
  into v_approved_count, v_match_count
  from pg_catalog.unnest(p_approved_source_row_ids) as approved(approved_id);
  if v_approved_count <> v_match_count then
    raise exception using errcode = '22023', message = 'approved source row IDs must be unique';
  end if;

  select import_batches.*
  into v_batch
  from public.import_batches
  join public.portfolios on portfolios.id = import_batches.portfolio_id
  where import_batches.id = p_import_batch_id
    and portfolios.user_id = v_caller
  for update of import_batches;

  if not found then
    raise exception using errcode = '42501', message = 'import batch not found or not owned by caller';
  end if;

  if v_batch.status = 'COMMITTED' then
    select pg_catalog.array_agg(transactions.import_source_row_id order by import_source_rows.row_number),
           pg_catalog.array_agg(transactions.id order by import_source_rows.row_number)
    into v_existing_row_ids, v_transaction_ids
    from public.transactions
    join public.import_source_rows
      on import_source_rows.id = transactions.import_source_row_id
     and import_source_rows.import_batch_id = transactions.import_batch_id
     and import_source_rows.portfolio_id = transactions.portfolio_id
    where transactions.import_batch_id = v_batch.id;

    if v_existing_row_ids is distinct from p_approved_source_row_ids then
      raise exception using errcode = '22023', message = 'committed batch row selection does not match this retry';
    end if;

    return pg_catalog.jsonb_build_object(
      'import_batch_id', v_batch.id,
      'status', 'COMMITTED',
      'transaction_count', coalesce(pg_catalog.cardinality(v_transaction_ids), 0),
      'transaction_ids', pg_catalog.to_jsonb(coalesce(v_transaction_ids, '{}'::uuid[])),
      'already_committed', true
    );
  end if;

  if v_batch.status <> 'AWAITING_CONFIRMATION' then
    raise exception using errcode = '55000', message = 'import batch is not awaiting confirmation';
  end if;

  if v_batch.mapping_version <> 'PORTFOLIOAI_IMPORT_V1'
    or v_batch.source_type not in ('PORTFOLIO_HISTORICAL_XLSX', 'GENERIC_CSV')
    or v_batch.source_provider not in ('LEGACY_WORKBOOK', 'GENERIC_CSV')
  then
    raise exception using errcode = '22023', message = 'batch mapping or source is not approved for V1 commit';
  end if;

  for v_row in
    select import_source_rows.*
    from public.import_source_rows
    where import_source_rows.import_batch_id = v_batch.id
      and import_source_rows.portfolio_id = v_batch.portfolio_id
      and import_source_rows.id = any (p_approved_source_row_ids)
    order by import_source_rows.row_number
    for update
  loop
    v_position := v_position + 1;
    if p_approved_source_row_ids[v_position] <> v_row.id then
      raise exception using errcode = '22023', message = 'approved source row IDs must be in source-row order';
    end if;

    if v_row.validation_status <> 'VALID'
      or v_row.validation_errors <> '[]'::jsonb
      or v_row.normalized_data is null
      or pg_catalog.jsonb_typeof(v_row.normalized_data) <> 'object'
      or v_row.raw_row_hash is null
      or v_row.raw_data ->> 'record_kind' <> 'TRANSACTION'
      or v_row.normalized_data ->> 'record_kind' <> 'TRANSACTION'
      or pg_catalog.jsonb_typeof(v_row.raw_data -> 'cells') <> 'object'
      or v_row.raw_data -> 'cells' = '{}'::jsonb
      or v_row.duplicate_of_transaction_id is not null
      or coalesce(v_row.duplicate_status, 'NOT_DUPLICATE') <> 'NOT_DUPLICATE'
    then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s is not valid approved V1 evidence', v_row.id);
    end if;

    v_normalized := v_row.normalized_data;
    v_side_cell := public.portfolioai_import_cell(v_row.raw_data, array['BUYSELL', 'TYPE', 'TRANSACTIONTYPE']);
    v_ticker_cell := public.portfolioai_import_cell(v_row.raw_data, array['TICKER', 'SYMBOL', 'STOCK', 'SCRIP']);
    v_quantity_cell := public.portfolioai_import_cell(v_row.raw_data, array['UNITS', 'QUANTITY', 'QTY', 'NETUNITS', 'TOTALUNITS', 'TOTALQUANTITY', 'CURRENTQUANTITY']);
    v_price_cell := public.portfolioai_import_cell(v_row.raw_data, array['PRICEUNIT', 'PRICEPERUNIT', 'UNITPRICE', 'PRICE']);
    v_broker_cell := public.portfolioai_import_cell(v_row.raw_data, array['BROKER', 'BROKERNAME', 'ACCOUNT']);
    v_date_cell := public.portfolioai_import_cell(v_row.raw_data, array['DATE', 'TRANSACTIONDATE', 'TRADEDATE']);

    if nullif(v_side_cell ->> 'formula', '') is not null
      or public.portfolioai_import_cell_text(v_side_cell) is null
    then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s has invalid transaction-type evidence', v_row.id);
    end if;
    v_transaction_type := pg_catalog.upper(public.portfolioai_import_cell_text(v_side_cell));
    if v_transaction_type not in ('BUY', 'SELL')
      or v_normalized ->> 'transaction_type' is distinct from v_transaction_type
    then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s transaction type is invalid or changed', v_row.id);
    end if;

    if nullif(v_ticker_cell ->> 'formula', '') is not null then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s has formula-derived security evidence', v_row.id);
    end if;
    v_source_ticker := public.portfolioai_import_cell_text(v_ticker_cell);
    if v_source_ticker is null
      or v_normalized ->> 'source_ticker' is distinct from v_source_ticker
    then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s security evidence is missing or changed', v_row.id);
    end if;

    if nullif(v_quantity_cell ->> 'formula', '') is not null then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s has formula-derived quantity', v_row.id);
    end if;
    begin
      v_numeric_text := pg_catalog.replace(public.portfolioai_import_cell_text(v_quantity_cell), ',', '');
      v_exact_numeric := v_numeric_text::numeric;
      v_normalized_numeric := (v_normalized ->> 'quantity')::numeric;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s quantity is not numeric(38,18)', v_row.id);
    end;
    if v_exact_numeric is null or v_exact_numeric <= 0
      or pg_catalog.scale(v_exact_numeric) > 18
      or pg_catalog.abs(v_exact_numeric) >= 100000000000000000000::numeric
      or v_normalized_numeric is distinct from v_exact_numeric
      or pg_catalog.scale(v_normalized_numeric) > 18
      or pg_catalog.abs(v_normalized_numeric) >= 100000000000000000000::numeric
    then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s quantity is invalid or changed', v_row.id);
    end if;
    v_quantity := v_exact_numeric;

    if v_price_cell is null
      or v_price_cell -> 'value' = 'null'::jsonb
      or nullif(v_price_cell ->> 'formula', '') is not null
    then
      v_unit_price := null;
      v_exact_numeric := null;
    else
      begin
        v_numeric_text := pg_catalog.replace(public.portfolioai_import_cell_text(v_price_cell), ',', '');
        v_exact_numeric := v_numeric_text::numeric;
      exception when invalid_text_representation or numeric_value_out_of_range then
        raise exception using errcode = '22023', message = pg_catalog.format('source row %s price is not numeric(38,18)', v_row.id);
      end;
      if v_exact_numeric < 0
        or pg_catalog.scale(v_exact_numeric) > 18
        or pg_catalog.abs(v_exact_numeric) >= 100000000000000000000::numeric
      then
        raise exception using errcode = '22023', message = pg_catalog.format('source row %s price is outside non-negative numeric(38,18)', v_row.id);
      end if;
      v_unit_price := v_exact_numeric;
    end if;
    begin
      v_normalized_numeric := (v_normalized ->> 'unit_price')::numeric;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s normalized price is invalid', v_row.id);
    end;
    if v_normalized_numeric is distinct from v_exact_numeric
      or (v_normalized_numeric is not null and (
        pg_catalog.scale(v_normalized_numeric) > 18
        or pg_catalog.abs(v_normalized_numeric) >= 100000000000000000000::numeric
      ))
    then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s price was changed after parsing', v_row.id);
    end if;

    v_transaction_date := public.portfolioai_import_date(v_date_cell);
    if (v_normalized ->> 'transaction_date')::date is distinct from v_transaction_date then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s transaction date was changed after parsing', v_row.id);
    end if;

    v_security_id := nullif(v_normalized ->> 'security_id', '')::uuid;
    v_security_method := v_normalized ->> 'security_resolution_method';
    v_source_isin := nullif(pg_catalog.upper(pg_catalog.btrim(v_normalized ->> 'source_isin')), '');
    if v_security_id is null or v_security_id is distinct from v_row.resolved_security_id then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s has inconsistent security resolution', v_row.id);
    end if;

    if v_security_method = 'SYMBOL' then
      select count(*) into v_match_count
      from public.securities
      where securities.is_active
        and pg_catalog.upper(pg_catalog.btrim(securities.symbol)) = pg_catalog.upper(pg_catalog.btrim(v_source_ticker));
      if v_match_count = 1 and not exists (
        select 1 from public.securities
        where securities.id = v_security_id
          and securities.is_active
          and pg_catalog.upper(pg_catalog.btrim(securities.symbol)) = pg_catalog.upper(pg_catalog.btrim(v_source_ticker))
      ) then
        v_match_count := 0;
      end if;
    elsif v_security_method = 'IDENTIFIER' then
      select count(distinct security_identifiers.security_id) into v_match_count
      from public.security_identifiers
      join public.securities on securities.id = security_identifiers.security_id and securities.is_active
      where pg_catalog.upper(pg_catalog.btrim(security_identifiers.identifier_value)) = pg_catalog.upper(pg_catalog.btrim(v_source_ticker));
      if v_match_count = 1 and not exists (
        select 1
        from public.security_identifiers
        join public.securities on securities.id = security_identifiers.security_id and securities.is_active
        where security_identifiers.security_id = v_security_id
          and pg_catalog.upper(pg_catalog.btrim(security_identifiers.identifier_value)) = pg_catalog.upper(pg_catalog.btrim(v_source_ticker))
      ) then
        v_match_count := 0;
      end if;
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
        );
    else
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s security resolution method is not independently verifiable', v_row.id);
    end if;
    if v_match_count <> 1 then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s security does not match trusted reference evidence', v_row.id);
    end if;

    v_source_broker := case
      when nullif(v_broker_cell ->> 'formula', '') is null
        then public.portfolioai_import_cell_text(v_broker_cell)
      else null
    end;
    v_broker_account_id := nullif(v_normalized ->> 'broker_account_id', '')::uuid;
    select count(*), (pg_catalog.array_agg(broker_accounts.id order by broker_accounts.id))[1]
      into v_match_count, v_expected_broker_account_id
      from public.broker_accounts
      join public.brokers on brokers.id = broker_accounts.broker_id
      where broker_accounts.portfolio_id = v_batch.portfolio_id
        and broker_accounts.is_active
        and brokers.is_active
        and v_source_broker is not null
        and (
          public.portfolioai_normalize_import_token(v_source_broker) = any (array[
            public.portfolioai_normalize_import_token(broker_accounts.account_name),
            public.portfolioai_normalize_import_token(brokers.name),
            public.portfolioai_normalize_import_token(brokers.code),
            public.portfolioai_normalize_import_token(coalesce(brokers.api_provider, ''))
          ])
          or (public.portfolioai_normalize_import_token(v_source_broker) = 'MOTILAL'
            and public.portfolioai_normalize_import_token(brokers.code) = 'MOSL')
        );
    if v_match_count <> 1 then
      v_expected_broker_account_id := null;
    end if;
    if v_broker_account_id is distinct from v_expected_broker_account_id then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s broker account does not match this portfolio and source evidence', v_row.id);
    end if;

    v_data_quality_status := case
      when v_transaction_date is null and v_broker_account_id is null then 'MISSING_DATE_AND_BROKER'
      when v_transaction_date is null then 'MISSING_DATE'
      when v_broker_account_id is null then 'MISSING_BROKER'
      else 'COMPLETE'
    end;
    if v_normalized ->> 'data_quality_status' is distinct from v_data_quality_status then
      raise exception using errcode = '22023', message = pg_catalog.format('source row %s data-quality status is inconsistent', v_row.id);
    end if;

    insert into public.transactions (
      portfolio_id, broker_account_id, security_id, transaction_type, transaction_date,
      source_sequence, quantity, unit_price, currency_code, source_type, source_provider,
      import_batch_id, import_source_row_id, data_quality_status, accounting_status
    ) values (
      v_batch.portfolio_id, v_broker_account_id, v_security_id, v_transaction_type, v_transaction_date,
      v_row.row_number, v_quantity, v_unit_price, 'INR', v_batch.source_type, v_batch.source_provider,
      v_batch.id, v_row.id, v_data_quality_status, 'ACTIVE'
    ) returning id into v_transaction_id;
    v_transaction_ids := pg_catalog.array_append(v_transaction_ids, v_transaction_id);
  end loop;

  if v_position <> pg_catalog.cardinality(p_approved_source_row_ids) then
    raise exception using errcode = '22023', message = 'one or more approved source rows do not belong to this batch and portfolio';
  end if;

  update public.import_batches
  set status = 'COMMITTED', confirmed_at = v_now, committed_at = v_now, failure_details = null
  where id = v_batch.id;

  return pg_catalog.jsonb_build_object(
    'import_batch_id', v_batch.id,
    'status', 'COMMITTED',
    'transaction_count', pg_catalog.cardinality(v_transaction_ids),
    'transaction_ids', pg_catalog.to_jsonb(v_transaction_ids),
    'already_committed', false
  );
end;
$$;

comment on function public.commit_import_batch_v1(uuid, uuid[]) is
  'Atomically commits ordered, approved V1 import rows after independently revalidating ownership, immutable evidence, reference mappings, and lineage.';

revoke all on function public.commit_import_batch_v1(uuid, uuid[]) from public, anon, service_role;
revoke all on function public.commit_import_batch_v1(uuid, uuid[]) from authenticated;
grant execute on function public.commit_import_batch_v1(uuid, uuid[]) to authenticated;
