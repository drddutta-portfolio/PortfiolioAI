


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."acquire_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) RETURNS TABLE("acquired" boolean, "retry_after" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if p_lease_seconds < 1 or p_lease_seconds > 900 then raise exception 'Invalid lease duration.'; end if;
  insert into public.data_ingestion_leases(source_code, operation, lease_holder, lease_expires_at, updated_at)
  values(p_source_code, p_operation, p_lease_holder, pg_catalog.clock_timestamp()+pg_catalog.make_interval(secs=>p_lease_seconds), pg_catalog.clock_timestamp())
  on conflict(source_code, operation) do update set lease_holder=excluded.lease_holder, lease_expires_at=excluded.lease_expires_at, updated_at=excluded.updated_at
  where (public.data_ingestion_leases.lease_expires_at is null or public.data_ingestion_leases.lease_expires_at <= pg_catalog.clock_timestamp()) and public.data_ingestion_leases.next_allowed_at <= pg_catalog.clock_timestamp();
  return query select l.lease_holder=p_lease_holder, greatest(l.next_allowed_at,l.lease_expires_at) from public.data_ingestion_leases l where l.source_code=p_source_code and l.operation=p_operation;
end $$;


ALTER FUNCTION "public"."acquire_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."acquire_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) RETURNS TABLE("acquired" boolean, "retry_after" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."acquire_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."acquire_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_lease_seconds" integer DEFAULT 240) RETURNS TABLE("acquired" boolean, "retry_after" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_now timestamptz := clock_timestamp();
  v_retry integer := 0;
begin
  if p_source_code is null or p_portfolio_id is null or p_lease_holder is null or p_lease_seconds < 30 or p_lease_seconds > 900 then
    raise exception using errcode='22023', message='Invalid news-pipeline lease request.';
  end if;

  insert into public.news_pipeline_leases(source_code,portfolio_id,lease_holder,acquired_at,expires_at,cooldown_until,updated_at)
  values(p_source_code,p_portfolio_id,p_lease_holder,v_now,v_now+make_interval(secs=>p_lease_seconds),v_now,v_now)
  on conflict(source_code,portfolio_id) do update
    set lease_holder=excluded.lease_holder,
        acquired_at=excluded.acquired_at,
        expires_at=excluded.expires_at,
        cooldown_until=excluded.cooldown_until,
        updated_at=excluded.updated_at
  where public.news_pipeline_leases.expires_at <= v_now
    and public.news_pipeline_leases.cooldown_until <= v_now;

  if exists(
    select 1 from public.news_pipeline_leases
    where source_code=p_source_code and portfolio_id=p_portfolio_id and lease_holder=p_lease_holder
  ) then
    return query select true,0;
    return;
  end if;

  select greatest(1,ceil(extract(epoch from greatest(expires_at,cooldown_until)-v_now))::integer)
  into v_retry
  from public.news_pipeline_leases
  where source_code=p_source_code and portfolio_id=p_portfolio_id;
  return query select false,coalesce(v_retry,1);
end $$;


ALTER FUNCTION "public"."acquire_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_lease_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."acquire_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_lease_seconds" integer) IS 'Service-only atomic lease acquisition for NSE news orchestration.';



CREATE OR REPLACE FUNCTION "public"."apply_fundamental_observation_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$ declare o public.fundamental_observations; begin
  select * into o from public.fundamental_observations where id=p_observation_id; if not found then raise exception 'Observation not found.'; end if;
  insert into public.fundamental_observation_decisions(security_id,metric_code,period_end,period_type,consolidation_scope,selected_observation_id,decision_basis,decided_by,notes)
  values(o.security_id,o.metric_code,o.period_end,o.period_type,o.consolidation_scope,o.id,p_basis,auth.uid(),p_notes)
  on conflict(security_id,metric_code,period_end,period_type,consolidation_scope) do update set selected_observation_id=excluded.selected_observation_id,decision_basis=excluded.decision_basis,decided_at=now(),decided_by=excluded.decided_by,notes=excluded.notes;
end $$;


ALTER FUNCTION "public"."apply_fundamental_observation_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_security_attribute_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$ declare o public.security_attribute_observations; begin
  select * into o from public.security_attribute_observations where id=p_observation_id; if not found then raise exception 'Observation not found.'; end if;
  insert into public.security_attribute_decisions(security_id,attribute_code,selected_observation_id,decision_basis,decided_by,notes)
  values(o.security_id,o.attribute_code,o.id,p_basis,auth.uid(),p_notes) on conflict(security_id,attribute_code) do update set selected_observation_id=excluded.selected_observation_id,decision_basis=excluded.decision_basis,decided_at=now(),decided_by=excluded.decided_by,notes=excluded.notes;
end $$;


ALTER FUNCTION "public"."apply_security_attribute_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_security_classification_correction_v1"("p_request_id" "uuid", "p_reviewer" "uuid", "p_review_notes" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_request public.security_classification_correction_requests%rowtype;
  v_security public.securities%rowtype;
  v_change_id uuid;
begin
  if p_reviewer is null or not exists(select 1 from auth.users where id=p_reviewer) then raise exception using errcode='22023', message='A valid reviewer is required.'; end if;
  if p_review_notes is null or length(btrim(p_review_notes))<3 or length(btrim(p_review_notes))>1000 then raise exception using errcode='22023', message='Review notes of 3–1000 characters are required.'; end if;
  select * into v_request from public.security_classification_correction_requests where id=p_request_id for update;
  if not found then raise exception using errcode='22023', message='Classification correction request is unavailable.'; end if;
  if v_request.request_status<>'PENDING' then raise exception using errcode='22023', message='Only a pending correction request can be applied.'; end if;
  select * into strict v_security from public.securities where id=v_request.security_id for update;
  update public.securities set asset_class=v_request.proposed_asset_class, instrument_type=v_request.proposed_instrument_type where id=v_security.id;
  update public.security_classification_correction_requests set request_status='APPLIED',reviewed_by=p_reviewer,reviewed_at=clock_timestamp(),review_notes=btrim(p_review_notes) where id=v_request.id;
  insert into public.security_classification_changes(request_id,security_id,old_asset_class,new_asset_class,old_instrument_type,new_instrument_type,evidence_reference,applied_by)
  values(v_request.id,v_security.id,v_security.asset_class,v_request.proposed_asset_class,v_security.instrument_type,v_request.proposed_instrument_type,v_request.evidence_reference,p_reviewer)
  returning id into v_change_id;
  return jsonb_build_object('request_id',v_request.id,'change_id',v_change_id,'security_id',v_security.id);
end;
$$;


ALTER FUNCTION "public"."apply_security_classification_correction_v1"("p_request_id" "uuid", "p_reviewer" "uuid", "p_review_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_security_enrichment_correction_v1"("p_request_id" "uuid", "p_apply" boolean, "p_review_notes" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$ begin
  update public.security_enrichment_correction_requests set request_status=case when p_apply then 'APPLIED' else 'REJECTED' end,reviewed_by=auth.uid(),reviewed_at=now(),review_notes=p_review_notes where id=p_request_id and request_status='PENDING';
  if not found then raise exception 'Pending correction request not found.'; end if;
end $$;


ALTER FUNCTION "public"."apply_security_enrichment_correction_v1"("p_request_id" "uuid", "p_apply" boolean, "p_review_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."commit_import_batch_v1"("p_import_batch_id" "uuid", "p_approved_source_row_ids" "uuid"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_caller uuid := auth.uid();
  v_batch public.import_batches%rowtype;
  v_row public.import_source_rows%rowtype;
  v_existing_row_ids uuid[];
  v_transaction_ids uuid[] := '{}'::uuid[];
  v_stock_master_identity_pairs text[] := '{}'::text[];
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
      or v_row.raw_data ->> 'record_kind' <> 'TRANSACTIONS'
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
      where securities.id = v_security_id
        and securities.is_active
        and securities.isin = v_source_isin
        and (
          pg_catalog.upper(pg_catalog.btrim(v_source_ticker))
          || pg_catalog.chr(31)
          || v_source_isin
        ) = any (v_stock_master_identity_pairs);
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


ALTER FUNCTION "public"."commit_import_batch_v1"("p_import_batch_id" "uuid", "p_approved_source_row_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."commit_import_batch_v1"("p_import_batch_id" "uuid", "p_approved_source_row_ids" "uuid"[]) IS 'Atomically commits ordered, approved V1 import rows after independently revalidating ownership, immutable evidence, reference mappings, and lineage.';



CREATE OR REPLACE FUNCTION "public"."correct_transaction_v1"("p_original_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_reason" "text", "p_idempotency_key" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_original public.transactions%rowtype;
  v_existing public.transaction_correction_requests%rowtype;
  v_new_id uuid;
  v_hash text;
  v_available numeric(38,18);
  v_quality text;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if p_transaction_type not in ('BUY','SELL') then raise exception using errcode='22023', message='Only BUY and SELL are supported.'; end if;
  if p_transaction_date is not null and p_transaction_date > current_date then raise exception using errcode='22023', message='A transaction date cannot be later than today.'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception using errcode='22023', message='Quantity must be greater than zero.'; end if;
  if p_unit_price is null or p_unit_price < 0 then raise exception using errcode='22023', message='Execution price must be zero or greater.'; end if;
  if p_total_charges is not null and p_total_charges < 0 then raise exception using errcode='22023', message='Charges cannot be negative.'; end if;
  if p_notes is not null and (p_notes<>btrim(p_notes) or length(p_notes)>1000) then raise exception using errcode='22023', message='Notes must be trimmed and no longer than 1000 characters.'; end if;
  if p_reason is null or length(btrim(p_reason))<3 or length(btrim(p_reason))>1000 then raise exception using errcode='22023', message='A correction reason of 3–1000 characters is required.'; end if;
  if not exists(select 1 from public.portfolios p where p.id=p_portfolio_id and p.user_id=v_user_id and p.is_active)
    then raise exception using errcode='42501', message='Portfolio is unavailable.'; end if;
  if p_broker_account_id is not null and not exists(select 1 from public.broker_accounts a where a.id=p_broker_account_id and a.portfolio_id=p_portfolio_id and a.is_active)
    then raise exception using errcode='22023', message='Broker account does not belong to the selected portfolio.'; end if;
  if not exists(select 1 from public.securities s where s.id=p_security_id and s.is_active)
    then raise exception using errcode='22023', message='Security is unavailable.'; end if;

  v_hash := encode(extensions.digest(concat_ws('|',p_original_transaction_id,p_portfolio_id,p_broker_account_id,p_security_id,p_transaction_type,p_transaction_date,p_quantity,p_unit_price,coalesce(p_total_charges::text,'<null>'),coalesce(p_notes,'<null>'),btrim(p_reason)),'sha256'),'hex');
  select * into v_existing from public.transaction_correction_requests where user_id=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then raise exception using errcode='22023', message='Idempotency key was already used for a different correction.'; end if;
    return jsonb_build_object('transaction_id',v_existing.corrected_transaction_id,'already_created',true);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('correction:'||p_portfolio_id::text,0));
  select * into v_original from public.transactions where id=p_original_transaction_id and portfolio_id=p_portfolio_id for update;
  if not found then raise exception using errcode='42501', message='Transaction is unavailable.'; end if;
  if v_original.accounting_status<>'ACTIVE' then raise exception using errcode='22023', message='Only the current effective transaction can be corrected.'; end if;

  select coalesce(sum(case when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity when transaction_type in ('SELL','TRANSFER_OUT') then -quantity else 0 end),0)
  into v_available from public.transactions
  where portfolio_id=p_portfolio_id and security_id=p_security_id and accounting_status='ACTIVE' and id<>p_original_transaction_id;
  if v_available + (case when p_transaction_type='BUY' then p_quantity else -p_quantity end) < 0 then
    raise exception using errcode='23514', message=format('Correction would create an oversold position from available quantity %s.',v_available);
  end if;
  if p_security_id<>v_original.security_id then
    select coalesce(sum(case when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity when transaction_type in ('SELL','TRANSFER_OUT') then -quantity else 0 end),0)
    into v_available from public.transactions where portfolio_id=p_portfolio_id and security_id=v_original.security_id and accounting_status='ACTIVE' and id<>p_original_transaction_id;
    if v_available<0 then raise exception using errcode='23514', message='Correction would leave the original security oversold.'; end if;
  end if;

  update public.transactions set accounting_status='SUPERSEDED',superseded_at=clock_timestamp(),supersession_reason=btrim(p_reason)
  where id=v_original.id;
  v_quality := case when p_transaction_date is null and p_broker_account_id is null then 'MISSING_DATE_AND_BROKER'
    when p_transaction_date is null then 'MISSING_DATE' when p_broker_account_id is null then 'MISSING_BROKER' else 'COMPLETE' end;
  insert into public.transactions(portfolio_id,broker_account_id,security_id,transaction_type,transaction_date,quantity,unit_price,gross_amount,charges,taxes,net_amount,currency_code,source_type,source_provider,deduplication_key,data_quality_status,accounting_status,notes,corrected_from_transaction_id,corrected_by,correction_reason)
  values(p_portfolio_id,p_broker_account_id,p_security_id,p_transaction_type,p_transaction_date,p_quantity,p_unit_price,p_quantity*p_unit_price,p_total_charges,case when p_total_charges is null then null else 0 end,case when p_total_charges is null then null when p_transaction_type='BUY' then p_quantity*p_unit_price+p_total_charges else p_quantity*p_unit_price-p_total_charges end,'INR','CORRECTION','PORTFOLIOAI','correction:'||v_user_id||':'||p_idempotency_key,v_quality,'ACTIVE',nullif(p_notes,''),v_original.id,v_user_id,btrim(p_reason)) returning id into v_new_id;
  insert into public.transaction_correction_requests(user_id,idempotency_key,request_hash,original_transaction_id,corrected_transaction_id)
  values(v_user_id,p_idempotency_key,v_hash,v_original.id,v_new_id);
  return jsonb_build_object('transaction_id',v_new_id,'already_created',false);
end;
$$;


ALTER FUNCTION "public"."correct_transaction_v1"("p_original_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_reason" "text", "p_idempotency_key" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_manual_security_v1"("p_portfolio_id" "uuid", "p_exchange" "text", "p_symbol" "text", "p_name" "text", "p_asset_class" "text", "p_instrument_type" "text", "p_isin" "text", "p_series" "text", "p_idempotency_key" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_user_id uuid := auth.uid();
  v_exchange text := upper(btrim(p_exchange));
  v_symbol text := upper(regexp_replace(btrim(p_symbol), '\s+', '', 'g'));
  v_name text := btrim(p_name);
  v_asset text := upper(btrim(p_asset_class));
  v_instrument text := upper(btrim(p_instrument_type));
  v_isin text := nullif(upper(btrim(p_isin)), '');
  v_series text := nullif(upper(btrim(p_series)), '');
  v_hash text;
  v_existing public.security_creation_requests%rowtype;
  v_security_id uuid;
  v_mapping_status text;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if not exists (select 1 from public.portfolios p where p.id=p_portfolio_id and p.user_id=v_user_id and p.is_active)
    then raise exception using errcode='42501', message='Portfolio is unavailable.'; end if;
  if v_exchange not in ('NSE','BSE') then raise exception using errcode='22023', message='Exchange must be NSE or BSE.'; end if;
  if v_symbol !~ '^[A-Z0-9&._-]{1,40}$' then raise exception using errcode='22023', message='Trading symbol is invalid.'; end if;
  if length(v_name) < 2 or length(v_name) > 200 then raise exception using errcode='22023', message='Security name is invalid.'; end if;
  if v_asset not in ('EQUITY','ETF') then raise exception using errcode='22023', message='Only Indian equities and ETFs are supported here.'; end if;
  if v_instrument not in ('STOCK','ETF') or (v_asset='ETF') <> (v_instrument='ETF') then
    raise exception using errcode='22023', message='Instrument type does not match the asset class.';
  end if;
  if v_isin is not null and not public.portfolioai_is_valid_isin(v_isin) then
    raise exception using errcode='22023', message='ISIN is invalid.';
  end if;
  if v_series is not null and v_series !~ '^[A-Z0-9_-]{1,12}$' then raise exception using errcode='22023', message='Series is invalid.'; end if;

  v_hash := encode(extensions.digest(concat_ws('|',p_portfolio_id,v_exchange,v_symbol,lower(v_name),v_asset,v_instrument,coalesce(v_isin,'<null>'),coalesce(v_series,'<null>')),'sha256'),'hex');
  select * into v_existing from public.security_creation_requests where user_id=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_hash then raise exception using errcode='22023', message='Idempotency key was already used for different security details.'; end if;
    select mapping_status into v_mapping_status from public.market_data_instrument_mappings where security_id=v_existing.security_id and provider_code='ANGEL_ONE';
    return jsonb_build_object('security_id',v_existing.security_id,'already_created',true,'mapping_status',coalesce(v_mapping_status,'UNRESOLVED'));
  end if;

  perform pg_advisory_xact_lock(hashtextextended('security:'||v_exchange||':'||v_symbol,0));
  select id into v_security_id from public.securities where exchange=v_exchange and symbol=v_symbol;
  if v_security_id is not null then raise exception using errcode='23505', message='A security with this exchange and symbol already exists. Select the existing security.'; end if;
  if v_isin is not null then
    select id into v_security_id from public.securities where isin=v_isin;
    if v_security_id is not null then raise exception using errcode='23505', message='A security with this ISIN already exists. Resolve the identity conflict.'; end if;
  end if;

  insert into public.securities(symbol,exchange,isin,name,asset_class,instrument_type,series,creation_source,created_by)
  values(v_symbol,v_exchange,v_isin,v_name,v_asset,v_instrument,v_series,'MANUAL_PORTFOLIOAI',v_user_id) returning id into v_security_id;
  insert into public.market_data_instrument_mappings(security_id,provider_code,exchange,trading_symbol,mapping_status,evidence)
  values(v_security_id,'ANGEL_ONE',v_exchange,v_symbol,'UNRESOLVED',jsonb_build_object('source','MANUAL_SECURITY_ONBOARDING','reason','PENDING_TRUSTED_INSTRUMENT_MASTER_MATCH'));
  insert into public.security_creation_requests(user_id,idempotency_key,request_hash,security_id)
  values(v_user_id,p_idempotency_key,v_hash,v_security_id);
  return jsonb_build_object('security_id',v_security_id,'already_created',false,'mapping_status','UNRESOLVED');
end;
$_$;


ALTER FUNCTION "public"."create_manual_security_v1"("p_portfolio_id" "uuid", "p_exchange" "text", "p_symbol" "text", "p_name" "text", "p_asset_class" "text", "p_instrument_type" "text", "p_isin" "text", "p_series" "text", "p_idempotency_key" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_manual_transaction_v1"("p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_idempotency_key" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.manual_transaction_requests%rowtype;
  v_transaction_id uuid;
  v_available numeric(38,18);
  v_hash text;
  v_quality text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'An idempotency key is required.';
  end if;
  if p_transaction_type not in ('BUY', 'SELL') then
    raise exception using errcode = '22023', message = 'Only BUY and SELL are supported.';
  end if;
  if p_transaction_date is null or p_transaction_date > current_date then
    raise exception using errcode = '22023', message = 'A valid transaction date not later than today is required.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception using errcode = '22023', message = 'Quantity must be greater than zero.';
  end if;
  if p_unit_price is null or p_unit_price < 0 then
    raise exception using errcode = '22023', message = 'Execution price must be zero or greater.';
  end if;
  if p_total_charges is not null and p_total_charges < 0 then
    raise exception using errcode = '22023', message = 'Charges cannot be negative.';
  end if;
  if p_notes is not null and (p_notes <> btrim(p_notes) or length(p_notes) > 1000) then
    raise exception using errcode = '22023', message = 'Notes must be trimmed and no longer than 1000 characters.';
  end if;
  if not exists (
    select 1 from public.portfolios p
    where p.id = p_portfolio_id and p.user_id = v_user_id and p.is_active
  ) then
    raise exception using errcode = '42501', message = 'Portfolio is unavailable.';
  end if;
  if not exists (
    select 1 from public.broker_accounts a
    where a.id = p_broker_account_id and a.portfolio_id = p_portfolio_id and a.is_active
  ) then
    raise exception using errcode = '22023', message = 'Broker account does not belong to the selected portfolio.';
  end if;
  if not exists (select 1 from public.securities s where s.id = p_security_id and s.is_active) then
    raise exception using errcode = '22023', message = 'Security is unavailable.';
  end if;

  v_hash := encode(extensions.digest(
    concat_ws('|', p_portfolio_id, p_broker_account_id, p_security_id, p_transaction_type,
      p_transaction_date, p_quantity, p_unit_price, coalesce(p_total_charges::text, '<null>'), coalesce(p_notes, '<null>')),
    'sha256'), 'hex');
  select * into v_existing from public.manual_transaction_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was already used for different transaction details.';
    end if;
    return jsonb_build_object('transaction_id', v_existing.transaction_id, 'already_created', true);
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_portfolio_id::text || ':' || p_security_id::text, 0));
  select coalesce(sum(case
    when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity
    when transaction_type in ('SELL','TRANSFER_OUT') then -quantity
    else 0 end), 0)
  into v_available
  from public.transactions
  where portfolio_id = p_portfolio_id and security_id = p_security_id and accounting_status = 'ACTIVE';
  if p_transaction_type = 'SELL' and p_quantity > v_available then
    raise exception using errcode = '23514', message = format('Sell quantity exceeds available quantity (%s).', v_available);
  end if;

  v_quality := 'COMPLETE';
  insert into public.transactions (
    portfolio_id, broker_account_id, security_id, transaction_type, transaction_date,
    quantity, unit_price, gross_amount, charges, taxes, net_amount, currency_code,
    source_type, source_provider, deduplication_key, data_quality_status, accounting_status, notes
  ) values (
    p_portfolio_id, p_broker_account_id, p_security_id, p_transaction_type, p_transaction_date,
    p_quantity, p_unit_price, p_quantity * p_unit_price, p_total_charges,
    case when p_total_charges is null then null else 0 end,
    case when p_total_charges is null then null when p_transaction_type = 'BUY'
      then p_quantity * p_unit_price + p_total_charges else p_quantity * p_unit_price - p_total_charges end,
    'INR', 'MANUAL', 'PORTFOLIOAI', 'manual:' || v_user_id || ':' || p_idempotency_key,
    v_quality, 'ACTIVE', nullif(p_notes, '')
  ) returning id into v_transaction_id;

  insert into public.manual_transaction_requests (user_id, idempotency_key, request_hash, transaction_id)
  values (v_user_id, p_idempotency_key, v_hash, v_transaction_id);
  return jsonb_build_object('transaction_id', v_transaction_id, 'already_created', false);
end;
$$;


ALTER FUNCTION "public"."create_manual_transaction_v1"("p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_idempotency_key" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_portfolio_coverage_registry_v1"("p_portfolio_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.portfolios p
    where p.id = p_portfolio_id
      and p.user_id = p_user_id
  ) then
    raise exception 'PORTFOLIO_NOT_AUTHORIZED' using errcode = '42501';
  end if;

  with holdings as (
    select ch.portfolio_id, ch.security_id, ch.current_quantity, s.symbol, s.asset_class
    from public.current_holdings ch
    join public.securities s on s.id = ch.security_id
    where ch.portfolio_id = p_portfolio_id
      and ch.current_quantity > 0
  ), latest_refresh as (
    select security_id, data_domain, source_code, refresh_status, fresh_until, next_eligible_refresh_at,
           last_safe_error_code, updated_at,
           row_number() over (partition by security_id, data_domain order by updated_at desc, source_code) as rn
    from public.security_refresh_states
    where security_id in (select security_id from holdings)
  ), refresh as (
    select security_id,
      max(source_code) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_source,
      max(refresh_status) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_status,
      max(fresh_until) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_next_refresh,
      max(last_safe_error_code) filter (where data_domain = 'VERIFIED_IDENTITY' and rn = 1) as identity_error,
      max(source_code) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_source,
      max(refresh_status) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_status,
      max(fresh_until) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'TTM_FUNDAMENTALS' and rn = 1) as fundamentals_next_refresh,
      max(source_code) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_source,
      max(refresh_status) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_status,
      max(fresh_until) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'OWNERSHIP' and rn = 1) as ownership_next_refresh,
      max(source_code) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_source,
      max(refresh_status) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_status,
      max(fresh_until) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_fresh_until,
      max(next_eligible_refresh_at) filter (where data_domain = 'DOCUMENT_DISCOVERY' and rn = 1) as documents_next_refresh
    from latest_refresh
    where rn = 1
    group by security_id
  ), fundamentals as (
    select security_id,
           count(*)::int as observation_count,
           max(fresh_until) as evidence_fresh_until,
           bool_or(evidence_status = 'CONFLICTING') as has_conflicting_evidence
    from public.fundamental_observations
    where security_id in (select security_id from holdings)
    group by security_id
  ), decisions as (
    select security_id,
           count(*) filter (where selected_observation_id is not null)::int as selected_decision_count,
           max(decided_at) filter (where selected_observation_id is not null) as latest_decision_at
    from public.fundamental_observation_decisions
    where security_id in (select security_id from holdings)
    group by security_id
  ), documents as (
    select security_id,
           count(*)::int as document_count,
           max(coalesce(published_at, created_at)) as latest_document_at
    from public.research_documents
    where security_id in (select security_id from holdings)
    group by security_id
  ), market_history as (
    select security_id,
           count(*)::int as candle_count,
           min(period_start) as first_candle_at,
           max(period_start) as latest_candle_at,
           max(retrieved_at) as latest_retrieved_at
    from public.market_price_history
    where security_id in (select security_id from holdings)
      and provider_code = 'ANGEL_ONE'
      and interval = 'ONE_DAY'
    group by security_id
  ), scoring_assignment_ranked as (
    select a.*,
           row_number() over (
             partition by a.security_id
             order by coalesce(a.reviewed_at, a.assigned_at) desc nulls last, a.assigned_at desc
           ) as rn
    from public.security_scoring_profile_assignments a
    where a.security_id in (select security_id from holdings)
  ), score_ranked as (
    select sr.*,
           row_number() over (partition by sr.security_id order by sr.created_at desc, sr.id desc) as rn
    from public.stock_score_runs sr
    where sr.security_id in (select security_id from holdings)
  ), recommendation_ranked as (
    select rr.*,
           row_number() over (partition by rr.security_id order by rr.created_at desc, rr.id desc) as rn
    from public.stock_recommendation_runs rr
    where rr.portfolio_id = p_portfolio_id
      and rr.security_id in (select security_id from holdings)
  ), records as (
    select h.symbol,
      jsonb_build_object(
        'portfolioId', h.portfolio_id,
        'securityId', h.security_id,
        'symbol', h.symbol,
        'assetClass', h.asset_class,
        'currentQuantity', h.current_quantity::text,
        'classification', jsonb_build_object(
          'sector', e.sector,
          'industry', e.industry,
          'marketCapCategory', e.market_cap_category,
          'enrichmentState', e.enrichment_state,
          'freshUntil', e.fresh_until
        ),
        'identityCoverage', jsonb_build_object(
          'state', case
            when r.identity_status = 'FRESH' then 'FRESH'
            when r.identity_error is not null then 'REVIEW_REQUIRED'
            else 'MISSING'
          end,
          'sourceCode', r.identity_source,
          'freshUntil', r.identity_fresh_until,
          'nextEligibleRefreshAt', r.identity_next_refresh,
          'estimatedProviderCalls', 0
        ),
        'fundamentalsCoverage', jsonb_build_object(
          'state', case
            when coalesce(f.observation_count, 0) = 0 then 'MISSING'
            when coalesce(f.has_conflicting_evidence, false) and coalesce(d.selected_decision_count, 0) = 0 then 'CONFLICTING'
            when r.fundamentals_status = 'FRESH' then 'FRESH'
            else 'STALE'
          end,
          'sourceCode', coalesce(r.fundamentals_source, 'TRENDLYNE_MCP'),
          'freshUntil', coalesce(r.fundamentals_fresh_until, f.evidence_fresh_until),
          'nextEligibleRefreshAt', r.fundamentals_next_refresh,
          'estimatedProviderCalls', 0,
          'observationCount', coalesce(f.observation_count, 0),
          'selectedDecisionCount', coalesce(d.selected_decision_count, 0),
          'hasConflictingEvidence', coalesce(f.has_conflicting_evidence, false),
          'latestDecisionAt', d.latest_decision_at
        ),
        'ownershipCoverage', jsonb_build_object(
          'state', case
            when r.ownership_status = 'FRESH' then 'FRESH'
            when r.ownership_status = 'STALE' then 'STALE'
            else 'MISSING'
          end,
          'sourceCode', r.ownership_source,
          'freshUntil', r.ownership_fresh_until,
          'nextEligibleRefreshAt', r.ownership_next_refresh,
          'estimatedProviderCalls', 0
        ),
        'documentsCoverage', jsonb_build_object(
          'state', case
            when coalesce(doc.document_count, 0) = 0 then 'MISSING'
            when r.documents_status = 'FRESH' then 'FRESH'
            else 'STALE'
          end,
          'sourceCode', r.documents_source,
          'freshUntil', r.documents_fresh_until,
          'nextEligibleRefreshAt', r.documents_next_refresh,
          'estimatedProviderCalls', 0,
          'documentCount', coalesce(doc.document_count, 0),
          'latestDocumentAt', doc.latest_document_at
        ),
        'marketHistoryCoverage', jsonb_build_object(
          'state', case
            when coalesce(mh.candle_count, 0) = 0 then 'MISSING'
            when mh.candle_count >= 200 then 'FRESH'
            else 'STALE'
          end,
          'sourceCode', case when coalesce(mh.candle_count, 0) > 0 then 'ANGEL_ONE' else null end,
          'freshUntil', null,
          'nextEligibleRefreshAt', null,
          'estimatedProviderCalls', 0,
          'candleCount', coalesce(mh.candle_count, 0),
          'firstCandleAt', mh.first_candle_at,
          'latestCandleAt', mh.latest_candle_at,
          'latestRetrievedAt', mh.latest_retrieved_at
        ),
        'scoringProfileAssignment', case when spa.security_id is null then null else jsonb_build_object(
          'profileCode', spa.scoring_profile_code,
          'assignmentStatus', spa.assignment_status,
          'assignmentBasis', spa.assignment_basis,
          'assignedAt', spa.assigned_at,
          'reviewedAt', spa.reviewed_at
        ) end,
        'latestScoreRun', case when scr.id is null then null else jsonb_build_object(
          'id', scr.id,
          'scoringProfile', scr.scoring_profile,
          'runState', scr.run_state,
          'evidenceCoverage', scr.evidence_coverage,
          'evidenceConfidence', scr.evidence_confidence,
          'asOfDate', scr.as_of_date,
          'createdAt', scr.created_at
        ) end,
        'latestRecommendationRun', case when rec.id is null then null else jsonb_build_object(
          'id', rec.id,
          'sourceScoreRunId', rec.source_score_run_id,
          'runState', rec.run_state,
          'transitionStatus', rec.transition_status,
          'scoreReadyCoverage', rec.score_ready_coverage,
          'evidenceConfidence', rec.evidence_confidence,
          'createdAt', rec.created_at
        ) end,
        'sizingPersistenceAvailable', false
      ) as record
    from holdings h
    left join public.current_security_enrichment_v1 e on e.security_id = h.security_id
    left join refresh r on r.security_id = h.security_id
    left join fundamentals f on f.security_id = h.security_id
    left join decisions d on d.security_id = h.security_id
    left join documents doc on doc.security_id = h.security_id
    left join market_history mh on mh.security_id = h.security_id
    left join scoring_assignment_ranked spa on spa.security_id = h.security_id and spa.rn = 1
    left join score_ranked scr on scr.security_id = h.security_id and scr.rn = 1
    left join recommendation_ranked rec on rec.security_id = h.security_id and rec.rn = 1
  )
  select jsonb_build_object(
    'registryVersion', 'PORTFOLIO_COVERAGE_V1',
    'generatedAt', clock_timestamp(),
    'providerCalls', 0,
    'budgetConsumed', 0,
    'records', coalesce(jsonb_agg(record order by symbol), '[]'::jsonb)
  )
  into v_result
  from records;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."get_portfolio_coverage_registry_v1"("p_portfolio_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_portfolio_news_feed_v1"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[] DEFAULT NULL::"uuid"[], "p_limit" integer DEFAULT 40, "p_before" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("news_item_id" "uuid", "security_id" "uuid", "symbol" "text", "company_name" "text", "headline" "text", "category" "text", "importance_state" "text", "published_at" timestamp with time zone, "publication_precision" "text", "source_name" "text", "source_url" "text", "first_seen_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception using errcode='22023', message='Invalid news feed limit.';
  end if;

  if not exists (
    select 1 from public.portfolios p
    where p.id=p_portfolio_id and p.user_id=(select auth.uid())
  ) then
    raise exception using errcode='42501', message='Portfolio not found or not owned by caller.';
  end if;

  if p_security_ids is not null and exists (
    select 1 from unnest(p_security_ids) requested_security_id
    where not exists (
      select 1 from public.current_holdings ch
      where ch.portfolio_id=p_portfolio_id
        and ch.security_id=requested_security_id
        and ch.current_quantity>0
    )
  ) then
    raise exception using errcode='42501', message='News scope contains a non-held security.';
  end if;

  return query
  select
    n.id,
    n.security_id,
    s.symbol,
    s.name,
    n.headline,
    n.category,
    n.importance_state,
    n.published_at,
    n.publication_precision,
    n.primary_source_name,
    n.primary_source_url,
    n.first_seen_at
  from public.news_items n
  join public.securities s on s.id=n.security_id
  where n.is_active
    and exists (
      select 1 from public.current_holdings ch
      where ch.portfolio_id=p_portfolio_id
        and ch.security_id=n.security_id
        and ch.current_quantity>0
    )
    and (p_security_ids is null or n.security_id=any(p_security_ids))
    and (p_before is null or coalesce(n.published_at,n.first_seen_at)<p_before)
  order by n.published_at desc nulls last, n.first_seen_at desc
  limit p_limit;
end $$;


ALTER FUNCTION "public"."get_portfolio_news_feed_v1"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_portfolio_news_feed_v1"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) IS 'Read-only owner-scoped cached news feed. Never triggers provider ingestion.';



CREATE OR REPLACE FUNCTION "public"."get_portfolio_news_feed_v2"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[] DEFAULT NULL::"uuid"[], "p_limit" integer DEFAULT 40, "p_before" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("news_item_id" "uuid", "security_id" "uuid", "symbol" "text", "company_name" "text", "headline" "text", "category" "text", "importance_state" "text", "tone_state" "text", "tone_method" "text", "tone_confidence" numeric, "tone_reason" "text", "published_at" timestamp with time zone, "publication_precision" "text", "source_name" "text", "source_url" "text", "first_seen_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception using errcode='22023', message='Invalid news feed limit.';
  end if;

  if not exists (
    select 1 from public.portfolios p
    where p.id=p_portfolio_id and p.user_id=(select auth.uid())
  ) then
    raise exception using errcode='42501', message='Portfolio not found or not owned by caller.';
  end if;

  if p_security_ids is not null and exists (
    select 1 from unnest(p_security_ids) requested_security_id
    where not exists (
      select 1 from public.current_holdings ch
      where ch.portfolio_id=p_portfolio_id
        and ch.security_id=requested_security_id
        and ch.current_quantity>0
    )
  ) then
    raise exception using errcode='42501', message='News scope contains a non-held security.';
  end if;

  return query
  select
    n.id,
    n.security_id,
    s.symbol,
    s.name,
    n.headline,
    n.category,
    n.importance_state,
    n.tone_state,
    n.tone_method,
    n.tone_confidence,
    n.tone_reason,
    n.published_at,
    n.publication_precision,
    n.primary_source_name,
    n.primary_source_url,
    n.first_seen_at
  from public.news_items n
  join public.securities s on s.id=n.security_id
  where n.is_active
    and exists (
      select 1 from public.current_holdings ch
      where ch.portfolio_id=p_portfolio_id
        and ch.security_id=n.security_id
        and ch.current_quantity>0
    )
    and (p_security_ids is null or n.security_id=any(p_security_ids))
    and (p_before is null or coalesce(n.published_at,n.first_seen_at)<p_before)
  order by n.published_at desc nulls last, n.first_seen_at desc
  limit p_limit;
end $$;


ALTER FUNCTION "public"."get_portfolio_news_feed_v2"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_portfolio_news_feed_v2"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) IS 'Owner-scoped cached portfolio news feed with tone provenance. Never triggers external ingestion.';



CREATE OR REPLACE FUNCTION "public"."get_portfolio_profile_weight_context_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_profile_code" "text") RETURNS TABLE("current_weight" numeric, "same_profile_weight" numeric, "reviewed_assignment_coverage" numeric, "reviewed_assignment_count" integer, "total_position_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.portfolios p
    where p.id = p_portfolio_id and p.user_id = v_user
  ) then
    raise exception 'Portfolio access denied' using errcode = '42501';
  end if;

  return query
  with valued as (
    select
      h.security_id,
      h.current_quantity,
      mpl.price,
      (h.current_quantity * mpl.price)::numeric as market_value
    from public.current_holdings h
    join public.market_price_latest mpl
      on mpl.security_id = h.security_id
     and mpl.provider_code = 'ANGEL_ONE'
    where h.portfolio_id = p_portfolio_id
      and h.current_quantity > 0
      and mpl.price is not null
  ), totals as (
    select coalesce(sum(market_value), 0)::numeric as total_market_value,
           count(*)::integer as position_count
    from valued
  ), weighted as (
    select
      v.security_id,
      case when t.total_market_value > 0 then (v.market_value / t.total_market_value * 100)::numeric else 0::numeric end as weight
    from valued v cross join totals t
  ), assignments as (
    select a.security_id, a.scoring_profile_code
    from public.security_scoring_profile_assignments a
    where a.assignment_status = 'REVIEWED'
      and a.security_id in (select security_id from valued)
  )
  select
    coalesce((select w.weight from weighted w where w.security_id = p_security_id), 0)::numeric,
    coalesce((select sum(w.weight) from weighted w join assignments a on a.security_id = w.security_id where a.scoring_profile_code = p_profile_code), 0)::numeric,
    coalesce((select sum(w.weight) from weighted w join assignments a on a.security_id = w.security_id), 0)::numeric,
    coalesce((select count(*) from assignments), 0)::integer,
    (select t.position_count from totals t)::integer;
end;
$$;


ALTER FUNCTION "public"."get_portfolio_profile_weight_context_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_profile_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_provider_operational_summary_v1"("p_source_code" "text" DEFAULT 'TRENDLYNE_MCP'::"text") RETURNS TABLE("source_code" "text", "provider_name" "text", "ingestion_enabled" boolean, "scheduler_enabled" boolean, "daily_internal_attempt_limit" integer, "daily_observed_usage" bigint, "rolling_internal_attempt_limit" integer, "rolling_observed_usage" bigint, "daily_remaining" bigint, "rolling_remaining" bigint, "utilization_state" "text", "active_reservations" bigint, "active_orchestrations" bigint, "last_successful_run_at" timestamp with time zone, "last_failed_run_at" timestamp with time zone, "latest_safe_error" "text", "actual_provider_quota_status" "text", "policy_version" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  return query select c.source_code,d.name,c.ingestion_enabled,c.scheduler_enabled,c.daily_internal_attempt_limit,
    coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::bigint,
    c.rolling_internal_attempt_limit,coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=clock_timestamp()-make_interval(days=>c.rolling_window_days)),0)::bigint,
    greatest(c.daily_internal_attempt_limit-coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0),0)::bigint,
    greatest(c.rolling_internal_attempt_limit-coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=clock_timestamp()-make_interval(days=>c.rolling_window_days)),0),0)::bigint,
    case when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.hard_stop_threshold then 'HARD_STOP' when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.conservation_threshold then 'CONSERVATION' when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.caution_threshold then 'CAUTION' when coalesce((select sum(u.actual_internal_units) from public.provider_usage_events u where u.source_code=c.source_code and u.accounting_class='PROVIDER_TOOL_ATTEMPT' and u.attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),0)::numeric/c.daily_internal_attempt_limit>=c.warning_threshold then 'WARNING' else 'NORMAL' end,
    (select count(*) from public.provider_budget_reservations r where r.source_code=c.source_code and r.status='RESERVED' and r.expires_at>clock_timestamp()),
    (select count(distinct r.ingestion_run_id) from public.provider_budget_reservations r where r.source_code=c.source_code and r.status='RESERVED' and r.expires_at>clock_timestamp()),
    (select max(r.completed_at) from public.data_ingestion_runs r where r.source_code=c.source_code and r.status='SUCCEEDED'),
    (select max(r.completed_at) from public.data_ingestion_runs r where r.source_code=c.source_code and r.status='FAILED'),
    (select r.error_summary from public.data_ingestion_runs r where r.source_code=c.source_code and r.error_summary is not null order by r.completed_at desc nulls last limit 1),
    c.actual_provider_quota_status,c.policy_version
  from public.provider_ingestion_controls c join public.data_sources d on d.code=c.source_code where c.source_code=p_source_code;
end $$;


ALTER FUNCTION "public"."get_provider_operational_summary_v1"("p_source_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_provider_operational_summary_v1"("p_source_code" "text") IS 'Safe authenticated operational summary; actual provider quota remains UNKNOWN until independently verified.';



CREATE OR REPLACE FUNCTION "public"."get_provider_quota_summary_v1"("p_source_code" "text" DEFAULT 'TRENDLYNE_MCP'::"text") RETURNS TABLE("source_code" "text", "quota_status" "text", "plan_name" "text", "internal_daily_limit" integer, "internal_daily_used" bigint, "internal_daily_remaining" bigint, "provider_daily_limit" integer, "provider_daily_estimated_used" bigint, "provider_daily_estimated_remaining" bigint, "provider_monthly_limit" integer, "provider_monthly_estimated_used" bigint, "provider_monthly_estimated_remaining" bigint, "day_started_at" timestamp with time zone, "month_started_at" timestamp with time zone, "usage_basis" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  c public.provider_ingestion_controls%rowtype;
  v_day_start timestamptz := date_trunc('day', clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  v_month_start timestamptz := date_trunc('month', clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  v_internal_day bigint;
  v_provider_day bigint;
  v_provider_month bigint;
  v_daily_limit integer;
  v_monthly_limit integer;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;

  select pic.* into c
  from public.provider_ingestion_controls pic
  where pic.source_code = p_source_code;

  if not found then return; end if;

  v_daily_limit := coalesce((c.actual_provider_quota->>'daily_limit')::integer, 0);
  v_monthly_limit := coalesce((c.actual_provider_quota->>'monthly_limit')::integer, 0);

  select coalesce(sum(u.actual_internal_units), 0)::bigint into v_internal_day
  from public.provider_usage_events u
  where u.source_code = p_source_code
    and u.accounting_class = 'PROVIDER_TOOL_ATTEMPT'
    and u.attempted_at >= v_day_start;

  -- Conservative provider-usage estimate. Excludes the known-invalid legacy SEARCH_PARAMETERS pilot.
  -- MCP bootstrap/list operations are already excluded because they use TRANSPORT_BOOTSTRAP accounting.
  select coalesce(sum(u.actual_internal_units), 0)::bigint into v_provider_day
  from public.provider_usage_events u
  where u.source_code = p_source_code
    and u.accounting_class = 'PROVIDER_TOOL_ATTEMPT'
    and u.operation_class <> 'SEARCH_PARAMETERS'
    and u.attempted_at >= v_day_start;

  select coalesce(sum(u.actual_internal_units), 0)::bigint into v_provider_month
  from public.provider_usage_events u
  where u.source_code = p_source_code
    and u.accounting_class = 'PROVIDER_TOOL_ATTEMPT'
    and u.operation_class <> 'SEARCH_PARAMETERS'
    and u.attempted_at >= v_month_start;

  return query select
    c.source_code,
    c.actual_provider_quota_status,
    coalesce(c.actual_provider_quota->>'plan', 'Unknown'),
    c.daily_internal_attempt_limit,
    v_internal_day,
    greatest(c.daily_internal_attempt_limit - v_internal_day, 0)::bigint,
    v_daily_limit,
    v_provider_day,
    greatest(v_daily_limit::bigint - v_provider_day, 0)::bigint,
    v_monthly_limit,
    v_provider_month,
    greatest(v_monthly_limit::bigint - v_provider_month, 0)::bigint,
    v_day_start,
    v_month_start,
    'PortfolioAI estimate from recorded valid provider-tool attempts; excludes known-invalid SEARCH_PARAMETERS and transport bootstrap. Trendlyne dashboard is authoritative.'::text;
end;
$$;


ALTER FUNCTION "public"."get_provider_quota_summary_v1"("p_source_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invoke_amfi_market_cap_refresh_v1"("p_action" "text" DEFAULT 'DRY_RUN'::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault', 'net'
    AS $$
declare
  v_token text;
  v_api_url text;
  v_publishable_key text;
  v_request_id bigint;
begin
  if p_action not in ('DRY_RUN','RUN') then raise exception 'INVALID_ACTION'; end if;

  select decrypted_secret into v_token from vault.decrypted_secrets
  where name='portfolioai_amfi_market_cap_refresh_token' limit 1;
  select decrypted_secret into v_api_url from vault.decrypted_secrets
  where name='portfolioai_api_url' limit 1;
  select decrypted_secret into v_publishable_key from vault.decrypted_secrets
  where name='portfolioai_publishable_key' limit 1;

  if v_token is null or v_api_url is null or v_publishable_key is null then
    raise exception 'AMFI_REFRESH_CONFIGURATION_INCOMPLETE';
  end if;

  select net.http_post(
    url := v_api_url || '/functions/v1/refresh-amfi-market-cap-classification',
    headers := jsonb_build_object(
      'Content-Type','application/json','apikey',v_publishable_key,
      'Authorization','Bearer ' || v_publishable_key,
      'x-portfolioai-amfi-token',v_token
    ),
    body := jsonb_build_object('action',p_action),
    timeout_milliseconds := 120000
  ) into v_request_id;
  return v_request_id;
end;
$$;


ALTER FUNCTION "public"."invoke_amfi_market_cap_refresh_v1"("p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invoke_nse_news_pipeline_scheduled_v1"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_scheduler_token text;
  v_publishable_key text;
  v_api_url text;
  v_portfolio record;
  v_request_id bigint;
  v_enqueued integer := 0;
  v_freshness_seconds integer;
  v_min_interval_seconds integer;
begin
  select rdp.freshness_seconds
    into v_freshness_seconds
  from public.refresh_domain_policies rdp
  where rdp.source_code = 'COMPANY_EXCHANGE_FILING'
    and rdp.data_domain = 'NEWS'
    and rdp.is_enabled = true
    and rdp.effective_to is null
    and coalesce((rdp.definition ->> 'scheduler_allowed')::boolean, false) = true
  order by rdp.policy_version desc
  limit 1;

  if v_freshness_seconds is null then
    raise exception 'NSE_NEWS_SCHEDULER_POLICY_NOT_ACTIVE';
  end if;

  -- One-minute grace prevents cron jitter from turning a */30 cadence into hourly.
  v_min_interval_seconds := greatest(v_freshness_seconds - 60, 0);

  select decrypted_secret into v_scheduler_token
  from vault.decrypted_secrets
  where name = 'portfolioai_nse_news_scheduler_token';

  select decrypted_secret into v_publishable_key
  from vault.decrypted_secrets
  where name = 'portfolioai_publishable_key';

  select decrypted_secret into v_api_url
  from vault.decrypted_secrets
  where name = 'portfolioai_api_url';

  if v_scheduler_token is null or v_publishable_key is null or v_api_url is null then
    raise exception 'NSE_NEWS_SCHEDULER_CONFIGURATION_INCOMPLETE';
  end if;

  for v_portfolio in
    select p.id
    from public.portfolios p
    order by p.created_at asc
  loop
    if exists (
      select 1
      from public.data_ingestion_runs r
      where r.portfolio_id = v_portfolio.id
        and r.source_code = 'COMPANY_EXCHANGE_FILING'
        and r.operation = 'NSE_NEWS_PIPELINE'
        and r.status = 'SUCCEEDED'
        and r.metadata ->> 'action' = 'SCHEDULED_RUN'
        and r.started_at > clock_timestamp() - make_interval(secs => v_min_interval_seconds)
    ) then
      continue;
    end if;

    select net.http_post(
      url := rtrim(v_api_url, '/') || '/functions/v1/run-nse-news-pipeline',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_publishable_key,
        'apikey', v_publishable_key,
        'x-portfolioai-scheduler-token', v_scheduler_token
      ),
      body := jsonb_build_object(
        'action', 'SCHEDULED_RUN',
        'portfolioId', v_portfolio.id::text
      ),
      timeout_milliseconds := 120000
    ) into v_request_id;

    if v_request_id is null then
      raise exception 'NSE_NEWS_SCHEDULER_ENQUEUE_FAILED';
    end if;

    v_enqueued := v_enqueued + 1;
  end loop;

  return v_enqueued;
end;
$$;


ALTER FUNCTION "public"."invoke_nse_news_pipeline_scheduled_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invoke_trendlyne_classification_refresh_v1"("p_action" "text" DEFAULT 'DRY_RUN'::"text", "p_limit" integer DEFAULT 40) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault', 'net'
    AS $$
declare
  v_token text;
  v_api_url text;
  v_publishable_key text;
  v_request_id bigint;
begin
  if p_action not in ('DRY_RUN','RUN') then raise exception 'INVALID_ACTION'; end if;
  if p_limit < 1 or p_limit > 40 then raise exception 'INVALID_LIMIT'; end if;

  select decrypted_secret into v_token from vault.decrypted_secrets
  where name='portfolioai_trendlyne_classification_refresh_token' limit 1;
  select decrypted_secret into v_api_url from vault.decrypted_secrets
  where name='portfolioai_api_url' limit 1;
  select decrypted_secret into v_publishable_key from vault.decrypted_secrets
  where name='portfolioai_publishable_key' limit 1;

  if v_token is null or v_api_url is null or v_publishable_key is null then
    raise exception 'TRENDLYNE_CLASSIFICATION_REFRESH_CONFIGURATION_INCOMPLETE';
  end if;

  select net.http_post(
    url := v_api_url || '/functions/v1/refresh-trendlyne-classification',
    headers := jsonb_build_object(
      'Content-Type','application/json','apikey',v_publishable_key,
      'Authorization','Bearer ' || v_publishable_key,
      'x-portfolioai-classification-token',v_token
    ),
    body := jsonb_build_object('action',p_action,'limit',p_limit),
    timeout_milliseconds := 120000
  ) into v_request_id;
  return v_request_id;
end;
$$;


ALTER FUNCTION "public"."invoke_trendlyne_classification_refresh_v1"("p_action" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_assert_effective_quantity_valid"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_excluded_transaction_id" "uuid" DEFAULT NULL::"uuid", "p_included_transaction_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare v_quantity numeric(38,18);
begin
  select coalesce(sum(case
    when transaction_type in ('BUY','OPENING_POSITION','TRANSFER_IN','BONUS') then quantity
    when transaction_type in ('SELL','TRANSFER_OUT') then -quantity
    else 0 end), 0)
  into v_quantity
  from public.transactions
  where portfolio_id = p_portfolio_id
    and security_id = p_security_id
    and (
      (accounting_status = 'ACTIVE' and id is distinct from p_excluded_transaction_id)
      or id = p_included_transaction_id
    );
  if v_quantity < 0 then
    raise exception using errcode = '23514',
      message = format('The operation would create an oversold position from effective quantity %s.', v_quantity);
  end if;
end;
$$;


ALTER FUNCTION "public"."portfolioai_assert_effective_quantity_valid"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_excluded_transaction_id" "uuid", "p_included_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_audit_enrichment_decision"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.enrichment_decision_events(decision_kind,security_id,operation,old_decision,new_decision,changed_by)
  values(case when tg_table_name='security_attribute_decisions' then 'SECURITY_ATTRIBUTE' else 'FUNDAMENTAL' end,
    coalesce(new.security_id,old.security_id),tg_op,case when tg_op='INSERT' then null else to_jsonb(old) end,case when tg_op='DELETE' then null else to_jsonb(new) end,auth.uid());
  return coalesce(new,old);
end $$;


ALTER FUNCTION "public"."portfolioai_audit_enrichment_decision"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_audit_fundamental_reconciliation_case"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.fundamental_reconciliation_events(case_id,event_type,prior_state,resulting_state,changed_by)
  values(new.id,case when tg_op='INSERT' then 'OPENED' else 'UPDATED' end,case when tg_op='INSERT' then null else to_jsonb(old) end,to_jsonb(new),auth.uid());
  return new;
end $$;


ALTER FUNCTION "public"."portfolioai_audit_fundamental_reconciliation_case"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_import_cell"("p_raw_data" "jsonb", "p_aliases" "text"[]) RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."portfolioai_import_cell"("p_raw_data" "jsonb", "p_aliases" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_import_cell_text"("p_cell" "jsonb") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  select case
    when p_cell is null or p_cell -> 'value' = 'null'::jsonb then null
    when pg_catalog.jsonb_typeof(p_cell -> 'value') in ('string', 'number')
      then nullif(pg_catalog.btrim(p_cell ->> 'value'), '')
    else null
  end;
$$;


ALTER FUNCTION "public"."portfolioai_import_cell_text"("p_cell" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_import_date"("p_cell" "jsonb") RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "public"."portfolioai_import_date"("p_cell" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_is_valid_isin"("p_isin" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $_$
declare
  v_digits text := '';
  v_char text;
  v_sum integer := 0;
  v_digit integer;
  v_double boolean := false;
begin
  if p_isin is null or p_isin !~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$' then return false; end if;
  for i in 1..length(p_isin) loop
    v_char := substr(p_isin, i, 1);
    if v_char ~ '[0-9]' then v_digits := v_digits || v_char;
    else v_digits := v_digits || (ascii(v_char) - 55)::text; end if;
  end loop;
  for i in reverse length(v_digits)..1 loop
    v_digit := substr(v_digits, i, 1)::integer;
    if v_double then v_digit := v_digit * 2; end if;
    v_sum := v_sum + (v_digit / 10) + (v_digit % 10);
    v_double := not v_double;
  end loop;
  return v_sum % 10 = 0;
end;
$_$;


ALTER FUNCTION "public"."portfolioai_is_valid_isin"("p_isin" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_normalize_import_token"("p_value" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    SET "search_path" TO ''
    AS $$
  select pg_catalog.regexp_replace(pg_catalog.upper(pg_catalog.btrim(p_value)), '[^A-Z0-9]', '', 'g');
$$;


ALTER FUNCTION "public"."portfolioai_normalize_import_token"("p_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_protect_committed_import_batch"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if old.status = 'COMMITTED' then
    raise exception 'committed import batches are immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."portfolioai_protect_committed_import_batch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_protect_import_source_row"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'INSERT' then
    if exists (
      select 1
      from public.import_batches
      where import_batches.id = new.import_batch_id
        and import_batches.portfolio_id = new.portfolio_id
        and import_batches.status = 'COMMITTED'
    ) then
      raise exception 'committed import source rows are immutable';
    end if;

    new.created_at := pg_catalog.now();
  elsif tg_op = 'DELETE' then
    if exists (
      select 1
      from public.import_batches
      where import_batches.id = old.import_batch_id
        and import_batches.portfolio_id = old.portfolio_id
        and import_batches.status = 'COMMITTED'
    ) then
      raise exception 'committed import source rows are immutable';
    end if;

    return old;
  else
    if exists (
      select 1
      from public.import_batches
      where import_batches.id = old.import_batch_id
        and import_batches.portfolio_id = old.portfolio_id
        and import_batches.status = 'COMMITTED'
    ) then
      raise exception 'committed import source rows are immutable';
    end if;

    if new.import_batch_id is distinct from old.import_batch_id
      or new.portfolio_id is distinct from old.portfolio_id
      or new.row_number is distinct from old.row_number
      or new.raw_data is distinct from old.raw_data
      or new.raw_row_hash is distinct from old.raw_row_hash
    then
      raise exception 'original import source row fields are immutable';
    end if;

    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."portfolioai_protect_import_source_row"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_reject_audit_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  raise exception using errcode='55000', message='Applied audit evidence is immutable.';
end;
$$;


ALTER FUNCTION "public"."portfolioai_reject_audit_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_reject_provider_audit_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin
  raise exception using errcode='55000',message='Provider accounting and audit events are append-only.';
end $$;


ALTER FUNCTION "public"."portfolioai_reject_provider_audit_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  raise exception using errcode='55000',message='Stage 7 provider evidence is immutable.';
end $$;


ALTER FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_set_audit_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'INSERT' then
    new.created_at := pg_catalog.now();
    new.updated_at := new.created_at;
  elsif tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.updated_at := pg_catalog.statement_timestamp();
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."portfolioai_set_audit_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_member"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_case public.fundamental_reconciliation_cases;
  v_observation public.fundamental_observations;
begin
  select * into strict v_case from public.fundamental_reconciliation_cases where id=new.case_id;
  select * into strict v_observation from public.fundamental_observations where id=new.observation_id;
  if v_case.security_id<>v_observation.security_id
    or v_case.metric_code<>v_observation.metric_code
    or v_case.period_start is distinct from v_observation.period_start
    or v_case.period_end is distinct from v_observation.period_end
    or v_case.period_type is distinct from v_observation.period_type
    or v_case.consolidation_scope is distinct from v_observation.consolidation_scope
    or v_case.unit is distinct from v_observation.unit
    or v_case.accounting_standard is distinct from v_observation.accounting_standard then
    raise exception using errcode='23514',message='Reconciliation member semantics do not match the case.';
  end if;
  if v_case.case_status='OPEN' and new.compatibility_status<>'VERIFIED_EQUIVALENT' then
    raise exception using errcode='23514',message='Open conflict cases require verified semantic equivalence.';
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_resolution"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.case_status in ('RESOLVED','REJECTED') and old.case_status in ('PENDING_COMPATIBILITY','OPEN') then
    if (select count(*) from public.fundamental_reconciliation_members m where m.case_id=new.id and m.compatibility_status='VERIFIED_EQUIVALENT')<2 then
      raise exception using errcode='23514',message='A fundamental reconciliation requires at least two semantically equivalent observations.';
    end if;
    if new.selected_observation_id is not null and not exists(
      select 1 from public.fundamental_reconciliation_members m where m.case_id=new.id and m.observation_id=new.selected_observation_id
    ) then
      raise exception using errcode='23514',message='Selected reconciliation observation must be a case member.';
    end if;
  elsif new.case_status is distinct from old.case_status then
    raise exception using errcode='23514',message='Unsupported fundamental reconciliation state transition.';
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_resolution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_validate_research_document_source"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_record_source text;
  v_canonical_hash text;
begin
  select source_code into v_record_source from public.data_source_records where id=new.source_record_id;
  if v_record_source is distinct from new.source_code then
    raise exception using errcode='23514',message='Document source must match its immutable source record.';
  end if;
  select canonical_content_hash into v_canonical_hash from public.research_documents where id=new.research_document_id;
  if v_canonical_hash is not null and new.content_hash is not null and v_canonical_hash<>new.content_hash then
    raise exception using errcode='23514',message='Document source content hash conflicts with canonical document identity.';
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."portfolioai_validate_research_document_source"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."portfolioai_validate_theme_security_holding"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.current_holdings holding
    where holding.portfolio_id = new.portfolio_id
      and holding.security_id = new.security_id
      and holding.current_quantity <> 0
  ) then
    raise exception using
      errcode = '23503',
      message = 'Theme membership requires an open holding in the same portfolio.';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."portfolioai_validate_theme_security_holding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_research_subprofile_assignment_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if old.assignment_status <> 'REVIEWED'
    or new.assignment_status <> 'RETIRED'
    or new.effective_to is null
    or new.effective_to <= old.effective_from
    or new.id is distinct from old.id
    or new.security_id is distinct from old.security_id
    or new.parent_profile_code is distinct from old.parent_profile_code
    or new.parent_profile_version is distinct from old.parent_profile_version
    or new.subprofile_code is distinct from old.subprofile_code
    or new.subprofile_version is distinct from old.subprofile_version
    or new.confidence_state is distinct from old.confidence_state
    or new.assignment_basis is distinct from old.assignment_basis
    or new.source_reference is distinct from old.source_reference
    or new.source_record_id is distinct from old.source_record_id
    or new.effective_from is distinct from old.effective_from
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.retired_by is null
    or new.retired_at is null
    or nullif(btrim(new.retirement_reason), '') is null
  then
    raise exception 'Reviewed research-subprofile history is append-only; only an audited retirement transition is allowed.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."protect_research_subprofile_assignment_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reclassify_unclassified_news_from_stored_evidence_v1"("p_limit" integer DEFAULT 100) RETURNS TABLE("scanned_count" integer, "updated_count" integer, "remaining_unclassified" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  r record;
  v_scanned integer := 0;
  v_updated integer := 0;
  v_category text;
  v_importance text;
  v_tone text;
  v_tone_confidence numeric;
  v_tone_reason text;
begin
  if p_limit < 1 or p_limit > 500 then
    raise exception using errcode='22023', message='Invalid classification batch limit.';
  end if;

  for r in
    select
      n.id,
      n.headline,
      n.summary,
      n.category,
      n.importance_state,
      n.tone_state,
      n.tone_method,
      n.tone_confidence,
      n.tone_reason,
      e.id as evidence_record_id,
      upper(concat_ws(' ', n.headline, n.summary, e.extracted_text)) as evidence_text
    from public.news_items n
    join lateral (
      select
        dsr.id,
        dsr.raw_payload->>'extracted_text' as extracted_text
      from public.data_source_records dsr
      where dsr.record_kind in (
        'NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION',
        'NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION_PILOT'
      )
        and dsr.raw_payload->>'news_item_id' = n.id::text
        and nullif(btrim(dsr.raw_payload->>'extracted_text'), '') is not null
      order by dsr.retrieved_at desc
      limit 1
    ) e on true
    where n.is_active
      and (
        n.category = 'UNCLASSIFIED'
        or n.importance_state = 'UNCLASSIFIED'
        or n.tone_state = 'UNCLASSIFIED'
      )
    order by coalesce(n.published_at, n.first_seen_at) desc
    limit p_limit
  loop
    v_scanned := v_scanned + 1;
    v_category := r.category;
    v_importance := r.importance_state;
    v_tone := r.tone_state;
    v_tone_confidence := r.tone_confidence;
    v_tone_reason := r.tone_reason;

    if v_category = 'UNCLASSIFIED' then
      if r.evidence_text ~ '(PENALTY|\mFINE\M|TAX AUDIT|REGULATORY ACTION|SHOW CAUSE|VIOLATION|CONTRAVENTION|ORDER PASSED BY|ORDER FROM.*(AUTHORITY|DEPARTMENT|REGULATOR)|SEBI ORDER|RBI ORDER|GST DEMAND|TAX DEMAND)' then
        v_category := 'REGULATORY';
      elsif r.evidence_text ~ '(MANAGING DIRECTOR|CHIEF EXECUTIVE OFFICER|\mCEO\M|WHOLE[- ]TIME DIRECTOR|EXECUTIVE DIRECTOR|CHIEF FINANCIAL OFFICER|\mCFO\M|CHANGE IN DIRECTORS|APPOINTMENT OF.*DIRECTOR|RE[- ]APPOINTMENT OF.*DIRECTOR|KEY MANAGERIAL PERSONNEL|\mKMP\M)' then
        v_category := 'MANAGEMENT';
      elsif r.evidence_text ~ '(FINANCIAL RESULTS|QUARTERLY RESULTS|ANNUAL RESULTS|AUDITED RESULTS|UNAUDITED RESULTS)' then
        v_category := 'RESULTS';
      elsif r.evidence_text ~ '(DIVIDEND|RECORD DATE|BONUS ISSUE|STOCK SPLIT|RIGHTS ISSUE|BUYBACK)' then
        v_category := 'CORPORATE_ACTION';
      elsif r.evidence_text ~ '(CREDIT RATING|RATING UPGRADE|RATING DOWNGRADE|RATING REAFFIRMED)' then
        v_category := 'CREDIT_RATING';
      elsif r.evidence_text ~ '(LETTER OF AWARD|WORK ORDER|PURCHASE ORDER|CONTRACT AWARDED|AWARDED.*CONTRACT|ORDER RECEIVED FROM.*(CUSTOMER|CLIENT)|RECEIVED.*(WORK ORDER|PURCHASE ORDER))' then
        v_category := 'ORDER_CONTRACT';
      elsif r.evidence_text ~ '(FUND RAIS|QUALIFIED INSTITUTIONAL PLACEMENT|\mQIP\M|PREFERENTIAL ISSUE|DEBENTURE ISSUE|BOND ISSUE)' then
        v_category := 'FUND_RAISE';
      elsif r.evidence_text ~ '(ACQUISITION|MERGER|AMALGAMATION|STRATEGIC INVESTMENT|STAKE ACQUISITION)' then
        v_category := 'MA_INVESTMENT';
      elsif r.evidence_text ~ '(SHAREHOLDING PATTERN|INSIDER TRADING|PROMOTER SHAREHOLDING)' then
        v_category := 'SHAREHOLDING_INSIDER';
      elsif r.evidence_text ~ '(LITIGATION|COURT ORDER|ARBITRATION|LEGAL PROCEEDING)' then
        v_category := 'LITIGATION_GOVERNANCE';
      elsif r.evidence_text ~ '(REGULATION 30|GENERAL UPDATE|GENERAL UPDATES|OTHER INFORMATION|DISCLOSURE)' then
        v_category := 'GENERAL';
      end if;
    end if;

    if v_importance = 'UNCLASSIFIED' then
      if r.evidence_text ~ '(REPORTED FRAUD|FRAUD (ALLEGATION|ALLEGED|INVESTIGATION|DETECTED|DISCOVERED)|DEFAULT|INSOLVENC|LIQUIDATION|BANKRUPTCY|TERMINATION OF.*MATERIAL|ADVERSE ORDER.*MATERIAL)' then
        v_importance := 'IMPORTANT';
      elsif v_category = 'MANAGEMENT' and r.evidence_text ~ '(MANAGING DIRECTOR|CHIEF EXECUTIVE OFFICER|\mCEO\M|CHIEF FINANCIAL OFFICER|\mCFO\M|WHOLE[- ]TIME DIRECTOR)' then
        v_importance := 'IMPORTANT';
      elsif v_category in ('RESULTS','FUND_RAISE','MA_INVESTMENT') then
        v_importance := 'IMPORTANT';
      elsif v_category = 'REGULATORY' and r.evidence_text ~ '(NO MATERIAL IMPACT|NO MATERIAL ADVERSE IMPACT|NOT MATERIAL)' then
        v_importance := 'NOTABLE';
      elsif v_category in ('REGULATORY','MANAGEMENT','CORPORATE_ACTION','ORDER_CONTRACT','CREDIT_RATING','LITIGATION_GOVERNANCE') then
        v_importance := 'NOTABLE';
      elsif v_category in ('SHAREHOLDING_INSIDER','GENERAL') then
        v_importance := 'ROUTINE';
      end if;
    end if;

    if v_tone = 'UNCLASSIFIED' then
      if r.evidence_text ~ '(PENALTY|\mFINE\M|DOWNGRADE|DEFAULT|REPORTED FRAUD|FRAUD (ALLEGATION|ALLEGED|INVESTIGATION|DETECTED|DISCOVERED)|INSOLVENC|LIQUIDATION|CANCELLATION|TERMINATION|ADVERSE ORDER|TAX DEMAND|GST DEMAND|SHORT PAYMENT OF TAX|VIOLATION|CONTRAVENTION)' then
        v_tone := 'NEGATIVE';
        v_tone_confidence := 0.95;
        v_tone_reason := 'Stored official filing contains an explicit adverse event such as a penalty, default, downgrade, termination, regulatory demand or reported fraud.';
      elsif r.evidence_text ~ '(RATING UPGRADE|UPGRADED.*RATING|LETTER OF AWARD|WORK ORDER.*RECEIVED|PURCHASE ORDER.*RECEIVED|CONTRACT AWARDED|AWARDED.*CONTRACT|DIVIDEND DECLARED|DIVIDEND RECOMMENDED|RECOMMENDED.*DIVIDEND)' then
        v_tone := 'POSITIVE';
        v_tone_confidence := 0.95;
        v_tone_reason := 'Stored official filing contains explicit favorable award, upgrade, order or dividend language.';
      elsif v_category = 'MANAGEMENT' and r.evidence_text ~ '(APPOINTMENT|RE[- ]APPOINTMENT|APPROVED.*APPOINTMENT|SUCCESSION|BOARD OF DIRECTORS)' then
        v_tone := 'NEUTRAL';
        v_tone_confidence := 0.90;
        v_tone_reason := 'Stored official filing describes a management or succession action without an explicit favorable or adverse event.';
      elsif r.evidence_text ~ '(RECORD DATE|SHAREHOLDING PATTERN|BOARD MEETING|ANALYST.*MEET|INVESTOR.*MEET|GENERAL UPDATE|GENERAL UPDATES)' and r.evidence_text !~ '(PENALTY|\mFINE\M|DOWNGRADE|DEFAULT|REPORTED FRAUD|TERMINATION|ADVERSE ORDER)' then
        v_tone := 'NEUTRAL';
        v_tone_confidence := 0.85;
        v_tone_reason := 'Stored official filing is administrative or informational and contains no explicit favorable or adverse event.';
      end if;
    end if;

    if v_category <> r.category or v_importance <> r.importance_state or v_tone <> r.tone_state then
      update public.news_items
      set
        category = v_category,
        importance_state = v_importance,
        tone_state = v_tone,
        tone_method = case when v_tone <> r.tone_state then 'DETERMINISTIC' else tone_method end,
        tone_confidence = case when v_tone <> r.tone_state then v_tone_confidence else tone_confidence end,
        tone_reason = case when v_tone <> r.tone_state then v_tone_reason else tone_reason end,
        updated_at = now()
      where id = r.id;

      insert into public.news_classification_events (
        news_item_id, classifier_version, evidence_record_id,
        previous_category, new_category,
        previous_importance_state, new_importance_state,
        previous_tone_state, new_tone_state, reason
      ) values (
        r.id, 'stored-evidence-v2.1', r.evidence_record_id,
        r.category, v_category,
        r.importance_state, v_importance,
        r.tone_state, v_tone,
        'Stored linked-document deterministic evidence classifier v2.1.'
      );
      v_updated := v_updated + 1;
    end if;
  end loop;

  return query
  select v_scanned, v_updated, (
    select count(*)::integer from public.news_items n
    where n.is_active and (
      n.category='UNCLASSIFIED' or n.importance_state='UNCLASSIFIED' or n.tone_state='UNCLASSIFIED'
    )
  );
end;
$$;


ALTER FUNCTION "public"."reclassify_unclassified_news_from_stored_evidence_v1"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_provider_usage_event_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_run_item_id" "uuid", "p_security_id" "uuid", "p_data_domain" "text", "p_operation_class" "text", "p_accounting_class" "text", "p_estimated_internal_units" integer, "p_actual_internal_units" integer, "p_attempted_at" timestamp with time zone, "p_completed_at" timestamp with time zone, "p_outcome" "text", "p_safe_error_code" "text", "p_retry_attempt" integer, "p_idempotency_key" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare result_id uuid;
begin
  insert into public.provider_usage_events(source_code,ingestion_run_id,run_item_id,security_id,data_domain,operation_class,accounting_class,estimated_internal_units,actual_internal_units,attempted_at,completed_at,outcome,safe_error_code,retry_attempt,idempotency_key)
  values(p_source_code,p_ingestion_run_id,p_run_item_id,p_security_id,p_data_domain,p_operation_class,p_accounting_class,p_estimated_internal_units,p_actual_internal_units,p_attempted_at,p_completed_at,p_outcome,p_safe_error_code,p_retry_attempt,p_idempotency_key)
  on conflict(source_code,idempotency_key) do nothing returning id into result_id;
  if result_id is null then select id into result_id from public.provider_usage_events where source_code=p_source_code and idempotency_key=p_idempotency_key; end if;
  return result_id;
end $$;


ALTER FUNCTION "public"."record_provider_usage_event_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_run_item_id" "uuid", "p_security_id" "uuid", "p_data_domain" "text", "p_operation_class" "text", "p_accounting_class" "text", "p_estimated_internal_units" integer, "p_actual_internal_units" integer, "p_attempted_at" timestamp with time zone, "p_completed_at" timestamp with time zone, "p_outcome" "text", "p_safe_error_code" "text", "p_retry_attempt" integer, "p_idempotency_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_recommendation_preview_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_rationale" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" "uuid", "suggested_role" "text", "change_signal" "text", "transition_status" "text", "persistence_count" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid := auth.uid();
  v_existing public.stock_recommendation_runs%rowtype;
  v_previous_distinct public.stock_recommendation_runs%rowtype;
  v_policy public.recommendation_profile_policies%rowtype;
  v_consecutive integer := 1;
  v_change text := 'INITIAL';
  v_transition text := 'INITIAL';
  v_upgrade_required integer := 2;
  v_downgrade_required integer := 2;
  v_current_rank integer;
  v_previous_rank integer;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_evaluation_key is null or length(trim(p_evaluation_key)) < 8 then
    raise exception 'Evaluation key is required';
  end if;

  if p_suggested_role not in ('CORE_CANDIDATE','SATELLITE_CANDIDATE','WATCH','AVOID','INSUFFICIENT') then
    raise exception 'Unsupported suggested role';
  end if;

  if not exists (
    select 1 from public.portfolios p
    where p.id = p_portfolio_id and p.user_id = v_user
  ) then
    raise exception 'Portfolio access denied' using errcode = '42501';
  end if;

  select * into v_policy
  from public.recommendation_profile_policies rp
  where rp.profile_code = p_scoring_profile_code
    and rp.policy_version = p_policy_version
    and rp.status in ('DRAFT','REVIEWED','ACTIVE');

  if not found then
    raise exception 'Recommendation policy is unavailable';
  end if;

  select * into v_existing
  from public.stock_recommendation_runs r
  where r.portfolio_id = p_portfolio_id
    and r.security_id = p_security_id
    and r.scoring_profile_code = p_scoring_profile_code
    and r.recommendation_policy_version = p_policy_version
    and r.run_state = 'PREVIEW'
    and r.evaluation_key = p_evaluation_key
  order by r.created_at desc
  limit 1;

  if found then
    return query select v_existing.id, v_existing.suggested_role, v_existing.change_signal,
      v_existing.transition_status, v_existing.persistence_count, v_existing.created_at;
    return;
  end if;

  v_upgrade_required := greatest(1, coalesce((v_policy.persistence_rules->>'upgrade_confirmations')::integer, 2));
  v_downgrade_required := greatest(1, coalesce((v_policy.persistence_rules->>'downgrade_confirmations')::integer, 2));

  if p_suggested_role = 'INSUFFICIENT' then
    v_change := 'UNCHANGED';
    v_transition := 'EVIDENCE_PENDING';
    v_consecutive := 1;
  else
    select * into v_previous_distinct
    from public.stock_recommendation_runs r
    where r.portfolio_id = p_portfolio_id
      and r.security_id = p_security_id
      and r.run_state in ('PREVIEW','OFFICIAL')
      and r.suggested_role <> 'INSUFFICIENT'
      and r.suggested_role <> p_suggested_role
    order by r.created_at desc
    limit 1;

    select count(*)::integer into v_consecutive
    from public.stock_recommendation_runs r
    where r.portfolio_id = p_portfolio_id
      and r.security_id = p_security_id
      and r.run_state in ('PREVIEW','OFFICIAL')
      and r.suggested_role = p_suggested_role
      and (v_previous_distinct.id is null or r.created_at > v_previous_distinct.created_at);
    v_consecutive := v_consecutive + 1;

    if v_previous_distinct.id is null then
      if exists (
        select 1 from public.stock_recommendation_runs r
        where r.portfolio_id = p_portfolio_id and r.security_id = p_security_id
          and r.run_state in ('PREVIEW','OFFICIAL') and r.suggested_role = p_suggested_role
      ) then
        v_change := 'UNCHANGED';
        v_transition := 'STABLE';
      else
        v_change := 'INITIAL';
        v_transition := 'INITIAL';
      end if;
    else
      v_current_rank := case p_suggested_role
        when 'CORE_CANDIDATE' then 4
        when 'SATELLITE_CANDIDATE' then 3
        when 'WATCH' then 2
        when 'AVOID' then 1
        else 0 end;
      v_previous_rank := case v_previous_distinct.suggested_role
        when 'CORE_CANDIDATE' then 4
        when 'SATELLITE_CANDIDATE' then 3
        when 'WATCH' then 2
        when 'AVOID' then 1
        else 0 end;

      if v_current_rank > v_previous_rank then
        v_change := 'UPGRADE';
        v_transition := case when v_consecutive >= v_upgrade_required then 'CONFIRMED_UPGRADE' else 'PENDING_UPGRADE' end;
      elsif v_current_rank < v_previous_rank then
        v_change := 'DOWNGRADE';
        v_transition := case when v_consecutive >= v_downgrade_required then 'CONFIRMED_DOWNGRADE' else 'PENDING_DOWNGRADE' end;
      else
        v_change := 'UNCHANGED';
        v_transition := 'STABLE';
      end if;
    end if;
  end if;

  insert into public.stock_recommendation_runs (
    portfolio_id, security_id, scoring_profile_code, recommendation_policy_version,
    run_state, overall_score, score_ready_coverage, evidence_confidence, suggested_role,
    current_user_role, current_weight, change_signal, transition_status, persistence_count,
    rationale, evaluation_key
  ) values (
    p_portfolio_id, p_security_id, p_scoring_profile_code, p_policy_version,
    'PREVIEW', p_overall_score, p_score_ready_coverage, p_evidence_confidence, p_suggested_role,
    p_current_user_role, p_current_weight, v_change, v_transition, v_consecutive,
    coalesce(p_rationale, '{}'::jsonb), p_evaluation_key
  )
  returning stock_recommendation_runs.id, stock_recommendation_runs.suggested_role,
    stock_recommendation_runs.change_signal, stock_recommendation_runs.transition_status,
    stock_recommendation_runs.persistence_count, stock_recommendation_runs.created_at
  into id, suggested_role, change_signal, transition_status, persistence_count, created_at;

  return next;
end;
$$;


ALTER FUNCTION "public"."record_recommendation_preview_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_rationale" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_recommendation_preview_v2"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_action_bias" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_suggested_weight_min" numeric, "p_suggested_weight_max" numeric, "p_rationale" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" "uuid", "suggested_role" "text", "action_bias" "text", "suggested_weight_min" numeric, "suggested_weight_max" numeric, "change_signal" "text", "transition_status" "text", "persistence_count" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid := auth.uid();
  v_existing public.stock_recommendation_runs%rowtype;
  v_previous_distinct public.stock_recommendation_runs%rowtype;
  v_policy public.recommendation_profile_policies%rowtype;
  v_consecutive integer := 1;
  v_change text := 'INITIAL';
  v_transition text := 'INITIAL';
  v_upgrade_required integer := 2;
  v_downgrade_required integer := 2;
  v_current_rank integer;
  v_previous_rank integer;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_evaluation_key is null or length(trim(p_evaluation_key)) < 8 then raise exception 'Evaluation key is required'; end if;
  if p_suggested_role not in ('CORE_CANDIDATE','SATELLITE_CANDIDATE','WATCH','AVOID','INSUFFICIENT') then raise exception 'Unsupported suggested role'; end if;
  if p_action_bias not in ('ACCUMULATE','HOLD','REDUCE','EXIT_CANDIDATE','WAIT') then raise exception 'Unsupported action bias'; end if;
  if not exists (select 1 from public.portfolios p where p.id = p_portfolio_id and p.user_id = v_user) then raise exception 'Portfolio access denied' using errcode = '42501'; end if;

  select * into v_policy from public.recommendation_profile_policies rp
   where rp.profile_code = p_scoring_profile_code and rp.policy_version = p_policy_version and rp.status in ('DRAFT','REVIEWED','ACTIVE');
  if not found then raise exception 'Recommendation policy is unavailable'; end if;

  select * into v_existing from public.stock_recommendation_runs r
   where r.portfolio_id=p_portfolio_id and r.security_id=p_security_id and r.scoring_profile_code=p_scoring_profile_code
     and r.recommendation_policy_version=p_policy_version and r.run_state='PREVIEW' and r.evaluation_key=p_evaluation_key
   order by r.created_at desc limit 1;
  if found then
    update public.stock_recommendation_runs r set action_bias=p_action_bias,current_weight=p_current_weight,
      suggested_weight_min=p_suggested_weight_min,suggested_weight_max=p_suggested_weight_max,
      rationale=coalesce(r.rationale,'{}'::jsonb)||coalesce(p_rationale,'{}'::jsonb) where r.id=v_existing.id;
    select * into v_existing from public.stock_recommendation_runs r where r.id=v_existing.id;
    return query select v_existing.id,v_existing.suggested_role,v_existing.action_bias,v_existing.suggested_weight_min,
      v_existing.suggested_weight_max,v_existing.change_signal,v_existing.transition_status,v_existing.persistence_count,v_existing.created_at;
    return;
  end if;

  v_upgrade_required:=greatest(1,coalesce((v_policy.persistence_rules->>'upgrade_confirmations')::integer,2));
  v_downgrade_required:=greatest(1,coalesce((v_policy.persistence_rules->>'downgrade_confirmations')::integer,2));
  if p_suggested_role='INSUFFICIENT' then
    v_change:='UNCHANGED'; v_transition:='EVIDENCE_PENDING'; v_consecutive:=1;
  else
    select * into v_previous_distinct from public.stock_recommendation_runs r
     where r.portfolio_id=p_portfolio_id and r.security_id=p_security_id and r.run_state in ('PREVIEW','OFFICIAL')
       and r.suggested_role<>'INSUFFICIENT' and r.suggested_role<>p_suggested_role order by r.created_at desc limit 1;
    select count(*)::integer into v_consecutive from public.stock_recommendation_runs r
     where r.portfolio_id=p_portfolio_id and r.security_id=p_security_id and r.run_state in ('PREVIEW','OFFICIAL')
       and r.suggested_role=p_suggested_role and (v_previous_distinct.id is null or r.created_at>v_previous_distinct.created_at);
    v_consecutive:=v_consecutive+1;
    if v_previous_distinct.id is null then
      if exists(select 1 from public.stock_recommendation_runs r where r.portfolio_id=p_portfolio_id and r.security_id=p_security_id and r.run_state in ('PREVIEW','OFFICIAL') and r.suggested_role=p_suggested_role)
      then v_change:='UNCHANGED'; v_transition:='STABLE'; else v_change:='INITIAL'; v_transition:='INITIAL'; end if;
    else
      v_current_rank:=case p_suggested_role when 'CORE_CANDIDATE' then 4 when 'SATELLITE_CANDIDATE' then 3 when 'WATCH' then 2 when 'AVOID' then 1 else 0 end;
      v_previous_rank:=case v_previous_distinct.suggested_role when 'CORE_CANDIDATE' then 4 when 'SATELLITE_CANDIDATE' then 3 when 'WATCH' then 2 when 'AVOID' then 1 else 0 end;
      if v_current_rank>v_previous_rank then v_change:='UPGRADE'; v_transition:=case when v_consecutive>=v_upgrade_required then 'CONFIRMED_UPGRADE' else 'PENDING_UPGRADE' end;
      elsif v_current_rank<v_previous_rank then v_change:='DOWNGRADE'; v_transition:=case when v_consecutive>=v_downgrade_required then 'CONFIRMED_DOWNGRADE' else 'PENDING_DOWNGRADE' end;
      else v_change:='UNCHANGED'; v_transition:='STABLE'; end if;
    end if;
  end if;

  insert into public.stock_recommendation_runs(portfolio_id,security_id,scoring_profile_code,recommendation_policy_version,run_state,
    overall_score,score_ready_coverage,evidence_confidence,suggested_role,action_bias,current_user_role,current_weight,suggested_weight_min,
    suggested_weight_max,change_signal,transition_status,persistence_count,rationale,evaluation_key)
  values(p_portfolio_id,p_security_id,p_scoring_profile_code,p_policy_version,'PREVIEW',p_overall_score,p_score_ready_coverage,p_evidence_confidence,
    p_suggested_role,p_action_bias,p_current_user_role,p_current_weight,p_suggested_weight_min,p_suggested_weight_max,v_change,v_transition,v_consecutive,
    coalesce(p_rationale,'{}'::jsonb),p_evaluation_key)
  returning stock_recommendation_runs.id,stock_recommendation_runs.suggested_role,stock_recommendation_runs.action_bias,
    stock_recommendation_runs.suggested_weight_min,stock_recommendation_runs.suggested_weight_max,stock_recommendation_runs.change_signal,
    stock_recommendation_runs.transition_status,stock_recommendation_runs.persistence_count,stock_recommendation_runs.created_at
  into id,suggested_role,action_bias,suggested_weight_min,suggested_weight_max,change_signal,transition_status,persistence_count,created_at;
  return next;
end;
$$;


ALTER FUNCTION "public"."record_recommendation_preview_v2"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_action_bias" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_suggested_weight_min" numeric, "p_suggested_weight_max" numeric, "p_rationale" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."data_ingestion_run_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ingestion_run_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "data_domain" "text" NOT NULL,
    "status" "text" DEFAULT 'PLANNED'::"text" NOT NULL,
    "safe_reason_code" "text",
    "attempted_call_count" integer DEFAULT 0 NOT NULL,
    "accepted_record_count" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "data_ingestion_run_item_completion" CHECK (((("status" = ANY (ARRAY['PLANNED'::"text", 'ATTEMPTED'::"text"])) AND ("completed_at" IS NULL)) OR (("status" <> ALL (ARRAY['PLANNED'::"text", 'ATTEMPTED'::"text"])) AND ("completed_at" IS NOT NULL)))),
    CONSTRAINT "data_ingestion_run_items_accepted_record_count_check" CHECK (("accepted_record_count" >= 0)),
    CONSTRAINT "data_ingestion_run_items_attempted_call_count_check" CHECK (("attempted_call_count" >= 0)),
    CONSTRAINT "data_ingestion_run_items_data_domain_check" CHECK (("data_domain" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "data_ingestion_run_items_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "data_ingestion_run_items_safe_reason_code_check" CHECK ((("safe_reason_code" IS NULL) OR ("safe_reason_code" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "data_ingestion_run_items_status_check" CHECK (("status" = ANY (ARRAY['PLANNED'::"text", 'SKIPPED_FRESH'::"text", 'SKIPPED_BUDGET'::"text", 'ATTEMPTED'::"text", 'ACCEPTED'::"text", 'UNCHANGED'::"text", 'CONFLICTING'::"text", 'REJECTED'::"text", 'FAILED'::"text"])))
);


ALTER TABLE "public"."data_ingestion_run_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_refresh_item_result_v1"("p_run_item_id" "uuid", "p_status" "text", "p_safe_reason_code" "text", "p_attempted_call_count" integer, "p_accepted_record_count" integer, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."data_ingestion_run_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare item public.data_ingestion_run_items%rowtype;
begin
  if p_status not in ('SKIPPED_FRESH','SKIPPED_BUDGET','ACCEPTED','UNCHANGED','CONFLICTING','REJECTED','FAILED') or p_attempted_call_count<0 or p_accepted_record_count<0 or jsonb_typeof(p_metadata)<>'object' then raise exception 'Invalid refresh item result.'; end if;
  select * into item from public.data_ingestion_run_items where id=p_run_item_id for update;
  if not found then raise exception 'Refresh item not found.'; end if;
  if item.completed_at is not null then
    if item.status<>p_status or item.safe_reason_code is distinct from p_safe_reason_code or item.attempted_call_count<>p_attempted_call_count or item.accepted_record_count<>p_accepted_record_count then raise exception 'Refresh item already completed differently.'; end if;
    return item;
  end if;
  update public.data_ingestion_run_items set status=p_status,safe_reason_code=p_safe_reason_code,attempted_call_count=p_attempted_call_count,accepted_record_count=p_accepted_record_count,metadata=p_metadata,completed_at=clock_timestamp() where id=p_run_item_id returning * into item;
  return item;
end $$;


ALTER FUNCTION "public"."record_refresh_item_result_v1"("p_run_item_id" "uuid", "p_status" "text", "p_safe_reason_code" "text", "p_attempted_call_count" integer, "p_accepted_record_count" integer, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_research_subprofile_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  raise exception 'Research-subprofile history is immutable and cannot be deleted.' using errcode = '22023';
end;
$$;


ALTER FUNCTION "public"."reject_research_subprofile_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ declare changed integer; begin
  if p_cooldown_seconds < 0 or p_cooldown_seconds > 86400 then raise exception 'Invalid cooldown duration.'; end if;
  update public.data_ingestion_leases set lease_holder=null, lease_expires_at=null, next_allowed_at=pg_catalog.clock_timestamp()+pg_catalog.make_interval(secs=>p_cooldown_seconds), updated_at=pg_catalog.clock_timestamp()
  where source_code=p_source_code and operation=p_operation and lease_holder=p_lease_holder;
  get diagnostics changed=row_count; return changed=1;
end $$;


ALTER FUNCTION "public"."release_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  changed integer;
begin
  if p_cooldown_seconds < 1 or p_cooldown_seconds > 86400 then
    raise exception 'Invalid cooldown duration.';
  end if;

  update public.market_data_operation_leases
  set lease_holder = null,
      lease_expires_at = null,
      next_allowed_at = pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_cooldown_seconds),
      updated_at = pg_catalog.clock_timestamp()
  where provider_code = p_provider_code
    and operation = p_operation
    and portfolio_id = p_portfolio_id
    and lease_holder = p_lease_holder;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;


ALTER FUNCTION "public"."release_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_cooldown_seconds" integer DEFAULT 30) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_updated integer;
begin
  if p_cooldown_seconds < 0 or p_cooldown_seconds > 3600 then
    raise exception using errcode='22023', message='Invalid news-pipeline cooldown.';
  end if;
  update public.news_pipeline_leases
  set expires_at=clock_timestamp(),
      cooldown_until=clock_timestamp()+make_interval(secs=>p_cooldown_seconds),
      updated_at=clock_timestamp()
  where source_code=p_source_code and portfolio_id=p_portfolio_id and lease_holder=p_lease_holder;
  get diagnostics v_updated=row_count;
  return v_updated=1;
end $$;


ALTER FUNCTION "public"."release_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."release_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) IS 'Service-only release/cooldown for NSE news orchestration.';



CREATE OR REPLACE FUNCTION "public"."reserve_provider_budget_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_reservation_key" "text", "p_estimated_units" integer, "p_reservation_seconds" integer DEFAULT 900) RETURNS TABLE("reservation_id" "uuid", "reserved" boolean, "reason_code" "text", "policy_version" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare c public.provider_ingestion_controls%rowtype; existing public.provider_budget_reservations%rowtype;
  daily_used bigint; rolling_used bigint; active_reserved bigint; run_reserved bigint; active_runs bigint; new_id uuid;
begin
  if p_estimated_units<1 or p_reservation_seconds<1 or p_reservation_seconds>3600 then raise exception 'Invalid provider budget reservation.'; end if;
  select * into c from public.provider_ingestion_controls where source_code=p_source_code for update;
  if not found then return query select null::uuid,false,'CONTROL_NOT_CONFIGURED'::text,null::integer; return; end if;
  select * into existing from public.provider_budget_reservations where source_code=p_source_code and reservation_key=p_reservation_key;
  if found then return query select existing.id,existing.status='RESERVED','IDEMPOTENT_REPLAY'::text,existing.policy_version; return; end if;
  update public.provider_budget_reservations set status='EXPIRED',settled_at=clock_timestamp(),released_units=estimated_units-consumed_units-failed_units
    where source_code=p_source_code and status='RESERVED' and expires_at<=clock_timestamp();
  if not c.ingestion_enabled then return query select null::uuid,false,'INGESTION_DISABLED'::text,c.policy_version; return; end if;
  select coalesce(sum(actual_internal_units),0) into daily_used from public.provider_usage_events where source_code=p_source_code and accounting_class='PROVIDER_TOOL_ATTEMPT' and attempted_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  select coalesce(sum(actual_internal_units),0) into rolling_used from public.provider_usage_events where source_code=p_source_code and accounting_class='PROVIDER_TOOL_ATTEMPT' and attempted_at>=clock_timestamp()-make_interval(days=>c.rolling_window_days);
  select coalesce(sum(estimated_units-consumed_units-failed_units-released_units),0),count(distinct ingestion_run_id) into active_reserved,active_runs from public.provider_budget_reservations where source_code=p_source_code and status='RESERVED' and expires_at>clock_timestamp();
  select coalesce(sum(estimated_units),0) into run_reserved from public.provider_budget_reservations where source_code=p_source_code and ingestion_run_id=p_ingestion_run_id and status in ('RESERVED','SETTLED');
  if run_reserved+p_estimated_units>c.per_run_internal_attempt_limit then return query select null::uuid,false,'PER_RUN_LIMIT'::text,c.policy_version; return; end if;
  if daily_used+active_reserved+p_estimated_units>c.daily_internal_attempt_limit then return query select null::uuid,false,'DAILY_LIMIT'::text,c.policy_version; return; end if;
  if rolling_used+active_reserved+p_estimated_units>c.rolling_internal_attempt_limit then return query select null::uuid,false,'ROLLING_LIMIT'::text,c.policy_version; return; end if;
  if active_runs>=c.concurrency_limit and not exists(select 1 from public.provider_budget_reservations where source_code=p_source_code and ingestion_run_id=p_ingestion_run_id and status='RESERVED' and expires_at>clock_timestamp()) then return query select null::uuid,false,'CONCURRENCY_LIMIT'::text,c.policy_version; return; end if;
  insert into public.provider_budget_reservations(source_code,ingestion_run_id,reservation_key,estimated_units,expires_at,policy_version)
    values(p_source_code,p_ingestion_run_id,p_reservation_key,p_estimated_units,clock_timestamp()+make_interval(secs=>p_reservation_seconds),c.policy_version) returning id into new_id;
  return query select new_id,true,'RESERVED'::text,c.policy_version;
end $$;


ALTER FUNCTION "public"."reserve_provider_budget_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_reservation_key" "text", "p_estimated_units" integer, "p_reservation_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_fundamental_reconciliation_case_v1"("p_case_id" "uuid", "p_resolution_type" "text", "p_selected_observation_id" "uuid", "p_reviewed_by" "uuid", "p_review_notes" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.fundamental_reconciliation_cases
  set case_status=case when p_resolution_type='REJECTED_CASE' then 'REJECTED' else 'RESOLVED' end,
      resolution_type=p_resolution_type,
      selected_observation_id=p_selected_observation_id,
      resolved_at=pg_catalog.clock_timestamp(),
      reviewed_by=p_reviewed_by,
      review_notes=p_review_notes
  where id=p_case_id and case_status in ('PENDING_COMPATIBILITY','OPEN');
  if not found then raise exception 'Open fundamental reconciliation case not found.'; end if;
end $$;


ALTER FUNCTION "public"."resolve_fundamental_reconciliation_case_v1"("p_case_id" "uuid", "p_resolution_type" "text", "p_selected_observation_id" "uuid", "p_reviewed_by" "uuid", "p_review_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.transactions%rowtype;
  v_existing public.transaction_accounting_events%rowtype;
  v_hash text;
  v_event_id uuid;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if p_reason is null or length(btrim(p_reason)) < 3 or length(btrim(p_reason)) > 1000 then
    raise exception using errcode='22023', message='A restoration reason of 3–1000 characters is required.';
  end if;
  if not exists(select 1 from public.portfolios where id=p_portfolio_id and user_id=v_user_id and is_active) then
    raise exception using errcode='42501', message='Portfolio is unavailable.';
  end if;
  v_hash := encode(extensions.digest(concat_ws('|','RESTORE',p_transaction_id,p_portfolio_id,btrim(p_reason)),'sha256'),'hex');
  select * into v_existing from public.transaction_accounting_events
  where performed_by=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then raise exception using errcode='22023', message='Idempotency key was already used for a different accounting action.'; end if;
    return jsonb_build_object('transaction_id',v_existing.transaction_id,'event_id',v_existing.id,'already_applied',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('transaction-accounting:'||p_portfolio_id::text,0));
  select * into v_transaction from public.transactions where id=p_transaction_id and portfolio_id=p_portfolio_id for update;
  if not found then raise exception using errcode='42501', message='Transaction is unavailable.'; end if;
  if v_transaction.accounting_status<>'REVERSED' or v_transaction.transaction_type not in ('BUY','SELL') then
    raise exception using errcode='22023', message='Only a previously voided BUY or SELL transaction can be restored.';
  end if;
  if not exists(select 1 from public.transaction_accounting_events where transaction_id=p_transaction_id and portfolio_id=p_portfolio_id and event_type='VOID') then
    raise exception using errcode='22023', message='The transaction has no trusted void history.';
  end if;
  perform public.portfolioai_assert_effective_quantity_valid(p_portfolio_id,v_transaction.security_id,null,p_transaction_id);
  update public.transactions set accounting_status='ACTIVE' where id=p_transaction_id;
  insert into public.transaction_accounting_events(portfolio_id,transaction_id,event_type,prior_accounting_status,resulting_accounting_status,reason,performed_by,idempotency_key,request_hash)
  values(p_portfolio_id,p_transaction_id,'RESTORE','REVERSED','ACTIVE',btrim(p_reason),v_user_id,p_idempotency_key,v_hash)
  returning id into v_event_id;
  return jsonb_build_object('transaction_id',p_transaction_id,'event_id',v_event_id,'already_applied',false);
end;
$$;


ALTER FUNCTION "public"."restore_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_ingestion_controls" (
    "source_code" "text" NOT NULL,
    "ingestion_enabled" boolean DEFAULT false NOT NULL,
    "scheduler_enabled" boolean DEFAULT false NOT NULL,
    "daily_internal_attempt_limit" integer NOT NULL,
    "rolling_internal_attempt_limit" integer NOT NULL,
    "rolling_window_days" integer DEFAULT 30 NOT NULL,
    "per_run_internal_attempt_limit" integer NOT NULL,
    "concurrency_limit" integer NOT NULL,
    "warning_threshold" numeric(5,4) NOT NULL,
    "caution_threshold" numeric(5,4) NOT NULL,
    "conservation_threshold" numeric(5,4) NOT NULL,
    "hard_stop_threshold" numeric(5,4) DEFAULT 1 NOT NULL,
    "consecutive_failure_threshold" integer NOT NULL,
    "actual_provider_quota_status" "text" DEFAULT 'UNKNOWN'::"text" NOT NULL,
    "actual_provider_quota" "jsonb",
    "policy_version" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "provider_control_quota_shape" CHECK (((("actual_provider_quota_status" = 'UNKNOWN'::"text") AND ("actual_provider_quota" IS NULL)) OR (("actual_provider_quota_status" = 'VERIFIED'::"text") AND ("jsonb_typeof"("actual_provider_quota") = 'object'::"text")))),
    CONSTRAINT "provider_ingestion_controls_actual_provider_quota_status_check" CHECK (("actual_provider_quota_status" = ANY (ARRAY['UNKNOWN'::"text", 'VERIFIED'::"text"]))),
    CONSTRAINT "provider_ingestion_controls_check" CHECK ((("caution_threshold" > "warning_threshold") AND ("caution_threshold" < (1)::numeric))),
    CONSTRAINT "provider_ingestion_controls_check1" CHECK ((("conservation_threshold" > "caution_threshold") AND ("conservation_threshold" < (1)::numeric))),
    CONSTRAINT "provider_ingestion_controls_check2" CHECK ((("hard_stop_threshold" >= "conservation_threshold") AND ("hard_stop_threshold" <= (1)::numeric))),
    CONSTRAINT "provider_ingestion_controls_concurrency_limit_check" CHECK ((("concurrency_limit" >= 1) AND ("concurrency_limit" <= 100))),
    CONSTRAINT "provider_ingestion_controls_consecutive_failure_threshold_check" CHECK (("consecutive_failure_threshold" > 0)),
    CONSTRAINT "provider_ingestion_controls_daily_internal_attempt_limit_check" CHECK (("daily_internal_attempt_limit" > 0)),
    CONSTRAINT "provider_ingestion_controls_per_run_internal_attempt_limi_check" CHECK (("per_run_internal_attempt_limit" > 0)),
    CONSTRAINT "provider_ingestion_controls_policy_version_check" CHECK (("policy_version" > 0)),
    CONSTRAINT "provider_ingestion_controls_rolling_internal_attempt_limi_check" CHECK (("rolling_internal_attempt_limit" > 0)),
    CONSTRAINT "provider_ingestion_controls_rolling_window_days_check" CHECK ((("rolling_window_days" >= 1) AND ("rolling_window_days" <= 365))),
    CONSTRAINT "provider_ingestion_controls_warning_threshold_check" CHECK ((("warning_threshold" > (0)::numeric) AND ("warning_threshold" < (1)::numeric)))
);


ALTER TABLE "public"."provider_ingestion_controls" OWNER TO "postgres";


COMMENT ON TABLE "public"."provider_ingestion_controls" IS 'PortfolioAI internal provider safety controls. Limits are not provider contractual quotas.';



CREATE OR REPLACE FUNCTION "public"."set_provider_ingestion_control_v1"("p_source_code" "text", "p_changes" "jsonb", "p_reason" "text", "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "public"."provider_ingestion_controls"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare before_row public.provider_ingestion_controls%rowtype; after_row public.provider_ingestion_controls%rowtype; key text; allowed constant text[]:=array['ingestion_enabled','scheduler_enabled','daily_internal_attempt_limit','rolling_internal_attempt_limit','rolling_window_days','per_run_internal_attempt_limit','concurrency_limit','warning_threshold','caution_threshold','conservation_threshold','hard_stop_threshold','consecutive_failure_threshold'];
begin
  if jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb or p_reason is null or btrim(p_reason)='' then raise exception 'Invalid provider control change.'; end if;
  if exists(select 1 from jsonb_object_keys(p_changes) k where not (k=any(allowed))) then raise exception 'Unsupported provider control.'; end if;
  select * into before_row from public.provider_ingestion_controls where source_code=p_source_code for update;
  if not found then raise exception 'Provider control not found.'; end if;
  update public.provider_ingestion_controls set
    ingestion_enabled=coalesce((p_changes->>'ingestion_enabled')::boolean,ingestion_enabled),scheduler_enabled=coalesce((p_changes->>'scheduler_enabled')::boolean,scheduler_enabled),
    daily_internal_attempt_limit=coalesce((p_changes->>'daily_internal_attempt_limit')::integer,daily_internal_attempt_limit),rolling_internal_attempt_limit=coalesce((p_changes->>'rolling_internal_attempt_limit')::integer,rolling_internal_attempt_limit),rolling_window_days=coalesce((p_changes->>'rolling_window_days')::integer,rolling_window_days),per_run_internal_attempt_limit=coalesce((p_changes->>'per_run_internal_attempt_limit')::integer,per_run_internal_attempt_limit),concurrency_limit=coalesce((p_changes->>'concurrency_limit')::integer,concurrency_limit),
    warning_threshold=coalesce((p_changes->>'warning_threshold')::numeric,warning_threshold),caution_threshold=coalesce((p_changes->>'caution_threshold')::numeric,caution_threshold),conservation_threshold=coalesce((p_changes->>'conservation_threshold')::numeric,conservation_threshold),hard_stop_threshold=coalesce((p_changes->>'hard_stop_threshold')::numeric,hard_stop_threshold),consecutive_failure_threshold=coalesce((p_changes->>'consecutive_failure_threshold')::integer,consecutive_failure_threshold),
    policy_version=policy_version+1,updated_at=clock_timestamp(),updated_by=auth.uid() where source_code=p_source_code returning * into after_row;
  for key in select jsonb_object_keys(p_changes) loop
    insert into public.provider_control_events(source_code,control_name,previous_value,new_value,actor_id,actor_kind,reason,expires_at,policy_version)
    values(p_source_code,upper(key),to_jsonb(before_row)->key,to_jsonb(after_row)->key,auth.uid(),'SERVICE_ROLE',p_reason,p_expires_at,after_row.policy_version);
  end loop;
  return after_row;
end $$;


ALTER FUNCTION "public"."set_provider_ingestion_control_v1"("p_source_code" "text", "p_changes" "jsonb", "p_reason" "text", "p_expires_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_provider_budget_v1"("p_reservation_id" "uuid", "p_consumed_units" integer, "p_failed_units" integer, "p_released_units" integer) RETURNS TABLE("reservation_id" "uuid", "status" "text", "consumed_units" integer, "failed_units" integer, "released_units" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare r public.provider_budget_reservations%rowtype;
begin
  if least(p_consumed_units,p_failed_units,p_released_units)<0 then raise exception 'Invalid provider budget settlement.'; end if;
  select * into r from public.provider_budget_reservations where id=p_reservation_id for update;
  if not found then raise exception 'Provider budget reservation not found.'; end if;
  if r.status<>'RESERVED' then
    if r.consumed_units<>p_consumed_units or r.failed_units<>p_failed_units or r.released_units<>p_released_units then raise exception 'Provider budget reservation already settled differently.'; end if;
    return query select r.id,r.status,r.consumed_units,r.failed_units,r.released_units; return;
  end if;
  if p_consumed_units+p_failed_units+p_released_units<>r.estimated_units then raise exception 'Settlement must account for every reserved unit.'; end if;
  update public.provider_budget_reservations set consumed_units=p_consumed_units,failed_units=p_failed_units,released_units=p_released_units,status='SETTLED',settled_at=clock_timestamp() where id=r.id
    returning * into r;
  return query select r.id,r.status,r.consumed_units,r.failed_units,r.released_units;
end $$;


ALTER FUNCTION "public"."settle_provider_budget_v1"("p_reservation_id" "uuid", "p_consumed_units" integer, "p_failed_units" integer, "p_released_units" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_security_enrichment_correction_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_target_kind" "text", "p_target_code" "text", "p_proposed_value" "jsonb", "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$ declare v_user uuid:=auth.uid(); v_id uuid; begin
  if v_user is null or not exists(select 1 from public.portfolios p where p.id=p_portfolio_id and p.user_id=v_user) then raise exception 'Not authorized.'; end if;
  if not exists(select 1 from public.transactions t where t.portfolio_id=p_portfolio_id and t.security_id=p_security_id) then raise exception 'Security is not in the portfolio history.'; end if;
  insert into public.security_enrichment_correction_requests(security_id,portfolio_id,requested_by,target_kind,target_code,proposed_value,reason)
  values(p_security_id,p_portfolio_id,v_user,p_target_kind,p_target_code,p_proposed_value,p_reason) returning id into v_id; return v_id;
end $$;


ALTER FUNCTION "public"."submit_security_enrichment_correction_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_target_kind" "text", "p_target_code" "text", "p_proposed_value" "jsonb", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_research_subprofile_secondary_exposure"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  primary_assignment public.research_subprofile_assignments%rowtype;
begin
  select * into primary_assignment
  from public.research_subprofile_assignments
  where id = new.assignment_id;

  if not found
    or new.parent_profile_code is distinct from primary_assignment.parent_profile_code
    or new.parent_profile_version is distinct from primary_assignment.parent_profile_version
    or (new.subprofile_code, new.subprofile_version)
      = (primary_assignment.subprofile_code, primary_assignment.subprofile_version)
  then
    raise exception 'Secondary exposure must share the parent contract and differ from the primary subprofile.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."validate_research_subprofile_secondary_exposure"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_amfi_market_cap_refresh_token_v1"("p_token" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
  select coalesce(
    p_token is not null and p_token <> '' and p_token = (
      select decrypted_secret from vault.decrypted_secrets
      where name='portfolioai_amfi_market_cap_refresh_token' limit 1
    ),false
  );
$$;


ALTER FUNCTION "public"."verify_amfi_market_cap_refresh_token_v1"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_news_pipeline_scheduler_token_v1"("p_token" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
  select coalesce(
    p_token is not null
    and exists (
      select 1
      from vault.decrypted_secrets s
      where s.name = 'portfolioai_nse_news_scheduler_token'
        and s.decrypted_secret = p_token
    ),
    false
  );
$$;


ALTER FUNCTION "public"."verify_news_pipeline_scheduler_token_v1"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_trendlyne_classification_refresh_token_v1"("p_token" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
  select coalesce(
    p_token is not null and p_token <> '' and p_token = (
      select decrypted_secret from vault.decrypted_secrets
      where name='portfolioai_trendlyne_classification_refresh_token' limit 1
    ),false
  );
$$;


ALTER FUNCTION "public"."verify_trendlyne_classification_refresh_token_v1"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."void_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.transactions%rowtype;
  v_existing public.transaction_accounting_events%rowtype;
  v_hash text;
  v_event_id uuid;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  if p_idempotency_key is null then raise exception using errcode='22023', message='An idempotency key is required.'; end if;
  if p_reason is null or length(btrim(p_reason)) < 3 or length(btrim(p_reason)) > 1000 then
    raise exception using errcode='22023', message='A removal reason of 3–1000 characters is required.';
  end if;
  if not exists(select 1 from public.portfolios where id=p_portfolio_id and user_id=v_user_id and is_active) then
    raise exception using errcode='42501', message='Portfolio is unavailable.';
  end if;
  v_hash := encode(extensions.digest(concat_ws('|','VOID',p_transaction_id,p_portfolio_id,btrim(p_reason)),'sha256'),'hex');
  select * into v_existing from public.transaction_accounting_events
  where performed_by=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then raise exception using errcode='22023', message='Idempotency key was already used for a different accounting action.'; end if;
    return jsonb_build_object('transaction_id',v_existing.transaction_id,'event_id',v_existing.id,'already_applied',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('transaction-accounting:'||p_portfolio_id::text,0));
  select * into v_transaction from public.transactions where id=p_transaction_id and portfolio_id=p_portfolio_id for update;
  if not found then raise exception using errcode='42501', message='Transaction is unavailable.'; end if;
  if v_transaction.accounting_status<>'ACTIVE' then raise exception using errcode='22023', message='Only an active transaction can be removed.'; end if;
  if v_transaction.transaction_type not in ('BUY','SELL') then raise exception using errcode='22023', message='Only active BUY and SELL transactions can be removed.'; end if;
  perform public.portfolioai_assert_effective_quantity_valid(p_portfolio_id,v_transaction.security_id,p_transaction_id,null);
  update public.transactions set accounting_status='REVERSED' where id=p_transaction_id;
  insert into public.transaction_accounting_events(portfolio_id,transaction_id,event_type,prior_accounting_status,resulting_accounting_status,reason,performed_by,idempotency_key,request_hash)
  values(p_portfolio_id,p_transaction_id,'VOID','ACTIVE','REVERSED',btrim(p_reason),v_user_id,p_idempotency_key,v_hash)
  returning id into v_event_id;
  return jsonb_build_object('transaction_id',p_transaction_id,'event_id',v_event_id,'already_applied',false);
end;
$$;


ALTER FUNCTION "public"."void_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."broker_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "broker_id" "uuid" NOT NULL,
    "account_name" "text" NOT NULL,
    "external_account_id" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "broker_accounts_account_name_check" CHECK ((("account_name" = "btrim"("account_name")) AND ("account_name" <> ''::"text"))),
    CONSTRAINT "broker_accounts_external_account_id_check" CHECK ((("external_account_id" IS NULL) OR (("external_account_id" = "btrim"("external_account_id")) AND ("external_account_id" <> ''::"text"))))
);


ALTER TABLE "public"."broker_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brokers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "api_provider" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "brokers_api_provider_check" CHECK ((("api_provider" IS NULL) OR ("api_provider" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "brokers_code_check" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "brokers_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text")))
);


ALTER TABLE "public"."brokers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classification_source_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_code" "text" NOT NULL,
    "taxonomy_code" "text" NOT NULL,
    "taxonomy_version" integer NOT NULL,
    "source_sector" "text",
    "source_industry" "text",
    "sector_id" "uuid",
    "industry_id" "uuid",
    "mapping_status" "text" NOT NULL,
    "evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    CONSTRAINT "classification_source_mappings_evidence_check" CHECK (("jsonb_typeof"("evidence") = 'object'::"text")),
    CONSTRAINT "classification_source_mappings_mapping_status_check" CHECK (("mapping_status" = ANY (ARRAY['VERIFIED'::"text", 'AMBIGUOUS'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."classification_source_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classification_taxonomies" (
    "code" "text" NOT NULL,
    "version" integer NOT NULL,
    "name" "text" NOT NULL,
    "level_names" "text"[] NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "effective_from" "date" NOT NULL,
    "definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "classification_taxonomies_definition_check" CHECK (("jsonb_typeof"("definition") = 'object'::"text")),
    CONSTRAINT "classification_taxonomies_version_check" CHECK (("version" > 0))
);


ALTER TABLE "public"."classification_taxonomies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fundamental_observation_decisions" (
    "security_id" "uuid" NOT NULL,
    "metric_code" "text" NOT NULL,
    "period_end" "date",
    "period_type" "text",
    "consolidation_scope" "text",
    "selected_observation_id" "uuid" NOT NULL,
    "decision_basis" "text" NOT NULL,
    "decided_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "decided_by" "uuid",
    "notes" "text",
    CONSTRAINT "fundamental_observation_decisions_decision_basis_check" CHECK (("decision_basis" = ANY (ARRAY['EVIDENCE_PRIORITY'::"text", 'RECONCILED_EQUIVALENT'::"text", 'MANUAL_REVIEW'::"text", 'CORRECTION'::"text"])))
);


ALTER TABLE "public"."fundamental_observation_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fundamental_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "metric_code" "text" NOT NULL,
    "source_record_id" "uuid" NOT NULL,
    "source_code" "text" NOT NULL,
    "numeric_value" numeric(38,18),
    "text_value" "text",
    "boolean_value" boolean,
    "date_value" "date",
    "currency" "text",
    "unit" "text",
    "period_start" "date",
    "period_end" "date",
    "period_type" "text",
    "accounting_standard" "text",
    "consolidation_scope" "text",
    "observed_at" timestamp with time zone,
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fresh_until" timestamp with time zone NOT NULL,
    "evidence_status" "text" DEFAULT 'AVAILABLE'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    CONSTRAINT "fundamental_exactly_one_value" CHECK (("num_nonnulls"("numeric_value", "text_value", "boolean_value", "date_value") = 1)),
    CONSTRAINT "fundamental_observations_consolidation_scope_check" CHECK ((("consolidation_scope" IS NULL) OR ("consolidation_scope" = ANY (ARRAY['STANDALONE'::"text", 'CONSOLIDATED'::"text", 'UNKNOWN'::"text"])))),
    CONSTRAINT "fundamental_observations_currency_check" CHECK ((("currency" IS NULL) OR ("currency" ~ '^[A-Z]{3}$'::"text"))),
    CONSTRAINT "fundamental_observations_evidence_status_check" CHECK (("evidence_status" = ANY (ARRAY['AVAILABLE'::"text", 'STALE'::"text", 'CONFLICTING'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "fundamental_observations_period_type_check" CHECK ((("period_type" IS NULL) OR ("period_type" = ANY (ARRAY['POINT_IN_TIME'::"text", 'QUARTER'::"text", 'HALF_YEAR'::"text", 'YEAR'::"text", 'TTM'::"text"]))))
);


ALTER TABLE "public"."fundamental_observations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."fundamental_observations"."published_at" IS 'Normalized publication time copied from attributable source evidence when supplied; null is preserved when unavailable.';



CREATE OR REPLACE VIEW "public"."current_fundamental_observations_v1" WITH ("security_invoker"='true') AS
 SELECT "d"."security_id",
    "d"."metric_code",
    "d"."period_end",
    "d"."period_type",
    "d"."consolidation_scope",
    "o"."numeric_value",
    "o"."text_value",
    "o"."boolean_value",
    "o"."date_value",
    "o"."currency",
    "o"."unit",
    "o"."source_code",
    "o"."observed_at",
    "o"."retrieved_at",
    "o"."fresh_until",
        CASE
            WHEN ("o"."evidence_status" = 'CONFLICTING'::"text") THEN 'CONFLICTING'::"text"
            WHEN ("o"."fresh_until" <= "now"()) THEN 'STALE'::"text"
            ELSE 'AVAILABLE'::"text"
        END AS "freshness_status",
    "o"."published_at"
   FROM ("public"."fundamental_observation_decisions" "d"
     JOIN "public"."fundamental_observations" "o" ON (("o"."id" = "d"."selected_observation_id")));


ALTER VIEW "public"."current_fundamental_observations_v1" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "broker_account_id" "uuid",
    "security_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "transaction_date" "date",
    "executed_at" timestamp with time zone,
    "source_sequence" integer,
    "quantity" numeric(38,18),
    "unit_price" numeric(38,18),
    "gross_amount" numeric(38,18),
    "charges" numeric(38,18),
    "taxes" numeric(38,18),
    "net_amount" numeric(38,18),
    "currency_code" "text" DEFAULT 'INR'::"text" NOT NULL,
    "source_average_cost" numeric(38,18),
    "source_cost_basis" numeric(38,18),
    "source_type" "text" NOT NULL,
    "source_provider" "text",
    "external_transaction_id" "text",
    "external_order_id" "text",
    "external_trade_id" "text",
    "import_batch_id" "uuid",
    "import_source_row_id" "uuid",
    "deduplication_key" "text",
    "data_quality_status" "text" NOT NULL,
    "accounting_status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "reversal_of_transaction_id" "uuid",
    "superseded_at" timestamp with time zone,
    "superseded_by_import_batch_id" "uuid",
    "supersession_reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "corrected_from_transaction_id" "uuid",
    "corrected_by" "uuid",
    "correction_reason" "text",
    CONSTRAINT "transactions_accounting_status_check" CHECK (("accounting_status" = ANY (ARRAY['ACTIVE'::"text", 'SUPERSEDED'::"text", 'REVERSED'::"text"]))),
    CONSTRAINT "transactions_correction_metadata_check" CHECK (((("corrected_from_transaction_id" IS NULL) AND ("corrected_by" IS NULL) AND ("correction_reason" IS NULL)) OR (("corrected_from_transaction_id" IS NOT NULL) AND ("corrected_by" IS NOT NULL) AND ("correction_reason" IS NOT NULL)))),
    CONSTRAINT "transactions_correction_reason_check" CHECK ((("correction_reason" IS NULL) OR (("correction_reason" = "btrim"("correction_reason")) AND (("length"("correction_reason") >= 3) AND ("length"("correction_reason") <= 1000))))),
    CONSTRAINT "transactions_currency_code_check" CHECK (("currency_code" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "transactions_data_quality_check" CHECK ((("data_quality_status" = 'NEEDS_REVIEW'::"text") OR (("data_quality_status" = 'COMPLETE'::"text") AND ("transaction_date" IS NOT NULL) AND ("broker_account_id" IS NOT NULL)) OR (("data_quality_status" = 'MISSING_DATE'::"text") AND ("transaction_date" IS NULL) AND ("broker_account_id" IS NOT NULL)) OR (("data_quality_status" = 'MISSING_BROKER'::"text") AND ("transaction_date" IS NOT NULL) AND ("broker_account_id" IS NULL)) OR (("data_quality_status" = 'MISSING_DATE_AND_BROKER'::"text") AND ("transaction_date" IS NULL) AND ("broker_account_id" IS NULL)))),
    CONSTRAINT "transactions_data_quality_status_check" CHECK (("data_quality_status" = ANY (ARRAY['COMPLETE'::"text", 'MISSING_DATE'::"text", 'MISSING_BROKER'::"text", 'MISSING_DATE_AND_BROKER'::"text", 'NEEDS_REVIEW'::"text"]))),
    CONSTRAINT "transactions_deduplication_key_check" CHECK ((("deduplication_key" IS NULL) OR (("deduplication_key" = "btrim"("deduplication_key")) AND ("deduplication_key" <> ''::"text")))),
    CONSTRAINT "transactions_external_order_id_check" CHECK ((("external_order_id" IS NULL) OR (("external_order_id" = "btrim"("external_order_id")) AND ("external_order_id" <> ''::"text")))),
    CONSTRAINT "transactions_external_trade_id_check" CHECK ((("external_trade_id" IS NULL) OR (("external_trade_id" = "btrim"("external_trade_id")) AND ("external_trade_id" <> ''::"text")))),
    CONSTRAINT "transactions_external_transaction_id_check" CHECK ((("external_transaction_id" IS NULL) OR (("external_transaction_id" = "btrim"("external_transaction_id")) AND ("external_transaction_id" <> ''::"text")))),
    CONSTRAINT "transactions_import_lineage_check" CHECK ((("import_source_row_id" IS NULL) OR ("import_batch_id" IS NOT NULL))),
    CONSTRAINT "transactions_notes_check" CHECK ((("notes" IS NULL) OR ("notes" = "btrim"("notes")))),
    CONSTRAINT "transactions_quantity_check" CHECK ((("quantity" IS NULL) OR ("quantity" > (0)::numeric))),
    CONSTRAINT "transactions_quantity_required_check" CHECK ((("transaction_type" <> ALL (ARRAY['BUY'::"text", 'SELL'::"text", 'OPENING_POSITION'::"text", 'TRANSFER_IN'::"text", 'TRANSFER_OUT'::"text", 'BONUS'::"text"])) OR ("quantity" IS NOT NULL))),
    CONSTRAINT "transactions_reversal_link_check" CHECK (((("transaction_type" = 'REVERSAL'::"text") AND ("reversal_of_transaction_id" IS NOT NULL)) OR (("transaction_type" <> 'REVERSAL'::"text") AND ("reversal_of_transaction_id" IS NULL)))),
    CONSTRAINT "transactions_source_average_cost_check" CHECK ((("source_average_cost" IS NULL) OR ("source_average_cost" >= (0)::numeric))),
    CONSTRAINT "transactions_source_cost_basis_check" CHECK ((("source_cost_basis" IS NULL) OR ("source_cost_basis" >= (0)::numeric))),
    CONSTRAINT "transactions_source_provider_check" CHECK ((("source_provider" IS NULL) OR ("source_provider" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "transactions_source_sequence_check" CHECK ((("source_sequence" IS NULL) OR ("source_sequence" >= 0))),
    CONSTRAINT "transactions_source_type_check" CHECK (("source_type" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "transactions_supersession_reason_check" CHECK ((("supersession_reason" IS NULL) OR (("supersession_reason" = "btrim"("supersession_reason")) AND ("supersession_reason" <> ''::"text")))),
    CONSTRAINT "transactions_supersession_state_check" CHECK (((("accounting_status" = 'SUPERSEDED'::"text") AND ("superseded_at" IS NOT NULL) AND ("supersession_reason" IS NOT NULL)) OR (("accounting_status" <> 'SUPERSEDED'::"text") AND ("superseded_at" IS NULL) AND ("superseded_by_import_batch_id" IS NULL) AND ("supersession_reason" IS NULL)))),
    CONSTRAINT "transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['BUY'::"text", 'SELL'::"text", 'OPENING_POSITION'::"text", 'TRANSFER_IN'::"text", 'TRANSFER_OUT'::"text", 'BONUS'::"text", 'SPLIT'::"text", 'REVERSAL'::"text", 'ADJUSTMENT'::"text"]))),
    CONSTRAINT "transactions_unit_price_check" CHECK ((("unit_price" IS NULL) OR ("unit_price" >= (0)::numeric)))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'Accounting source of truth. Missing legacy dates and broker accounts remain null and are disclosed by data_quality_status. Financial numeric values must cross application/API boundaries as decimal strings or another exact-decimal representation, never JavaScript floating point.';



COMMENT ON COLUMN "public"."transactions"."quantity" IS 'Positive magnitude with direction determined by transaction_type; stored as numeric(38,18).';



COMMENT ON COLUMN "public"."transactions"."source_average_cost" IS 'Average cost reported by an opening-position source; it is not a fabricated historical purchase price.';



COMMENT ON COLUMN "public"."transactions"."accounting_status" IS 'Only ACTIVE rows affect current_holdings. Future state changes, replacement lineage, import-row linkage, and batch changes must be atomic.';



COMMENT ON COLUMN "public"."transactions"."corrected_from_transaction_id" IS 'Links the current correction to immutable prior ledger evidence; only ACTIVE rows affect accounting.';



CREATE OR REPLACE VIEW "public"."current_holdings" WITH ("security_invoker"='true') AS
 SELECT "portfolio_id",
    "security_id",
    "sum"(
        CASE "transaction_type"
            WHEN 'BUY'::"text" THEN "quantity"
            WHEN 'SELL'::"text" THEN (- "quantity")
            WHEN 'OPENING_POSITION'::"text" THEN "quantity"
            WHEN 'TRANSFER_IN'::"text" THEN "quantity"
            WHEN 'TRANSFER_OUT'::"text" THEN (- "quantity")
            WHEN 'BONUS'::"text" THEN "quantity"
            ELSE (0)::numeric
        END) AS "current_quantity",
    "count"(*) AS "active_transaction_count",
    "count"(*) FILTER (WHERE ("data_quality_status" <> 'COMPLETE'::"text")) AS "incomplete_transaction_count",
    "bool_or"(("transaction_date" IS NULL)) AS "has_missing_dates",
    "bool_or"(("broker_account_id" IS NULL)) AS "has_missing_broker",
    "count"(*) FILTER (WHERE ("transaction_type" = ANY (ARRAY['SPLIT'::"text", 'REVERSAL'::"text", 'ADJUSTMENT'::"text"]))) AS "unresolved_quantity_event_count",
    ("count"(*) FILTER (WHERE ("transaction_type" = ANY (ARRAY['SPLIT'::"text", 'REVERSAL'::"text", 'ADJUSTMENT'::"text"]))) = 0) AS "is_quantity_complete"
   FROM "public"."transactions"
  WHERE ("accounting_status" = 'ACTIVE'::"text")
  GROUP BY "portfolio_id", "security_id"
 HAVING (("sum"(
        CASE "transaction_type"
            WHEN 'BUY'::"text" THEN "quantity"
            WHEN 'SELL'::"text" THEN (- "quantity")
            WHEN 'OPENING_POSITION'::"text" THEN "quantity"
            WHEN 'TRANSFER_IN'::"text" THEN "quantity"
            WHEN 'TRANSFER_OUT'::"text" THEN (- "quantity")
            WHEN 'BONUS'::"text" THEN "quantity"
            ELSE (0)::numeric
        END) <> (0)::numeric) OR ("count"(*) FILTER (WHERE ("transaction_type" = ANY (ARRAY['SPLIT'::"text", 'REVERSAL'::"text", 'ADJUSTMENT'::"text"]))) > 0));


ALTER VIEW "public"."current_holdings" OWNER TO "postgres";


COMMENT ON VIEW "public"."current_holdings" IS 'Live quantity projection from ACTIVE transactions. It intentionally excludes FIFO, P&L, holding period, and unsupported SPLIT/ADJUSTMENT semantics.';



CREATE TABLE IF NOT EXISTS "public"."market_cap_category_assessments" (
    "security_id" "uuid" NOT NULL,
    "policy_code" "text" NOT NULL,
    "policy_version" integer NOT NULL,
    "selected_observation_id" "uuid",
    "category" "text" NOT NULL,
    "rank_used" integer,
    "assessment_status" "text" NOT NULL,
    "assessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason_code" "text" NOT NULL,
    "evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "market_cap_category_assessments_assessment_status_check" CHECK (("assessment_status" = ANY (ARRAY['AVAILABLE'::"text", 'STALE'::"text", 'UNAVAILABLE'::"text", 'CONFLICTING'::"text"]))),
    CONSTRAINT "market_cap_category_assessments_category_check" CHECK (("category" = ANY (ARRAY['LARGE_CAP'::"text", 'MID_CAP'::"text", 'SMALL_CAP'::"text", 'INSUFFICIENT_EVIDENCE'::"text", 'CONFLICTING'::"text"]))),
    CONSTRAINT "market_cap_category_assessments_evidence_check" CHECK (("jsonb_typeof"("evidence") = 'object'::"text")),
    CONSTRAINT "market_cap_category_assessments_rank_used_check" CHECK ((("rank_used" IS NULL) OR ("rank_used" > 0))),
    CONSTRAINT "market_cap_category_assessments_reason_code_check" CHECK (("reason_code" ~ '^[A-Z0-9_]+$'::"text"))
);


ALTER TABLE "public"."market_cap_category_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_cap_classification_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "source_record_id" "uuid" NOT NULL,
    "source_code" "text" NOT NULL,
    "market_cap" numeric(38,6) NOT NULL,
    "currency" "text" NOT NULL,
    "capitalization_basis" "text" NOT NULL,
    "as_of_date" "date" NOT NULL,
    "observed_at" timestamp with time zone,
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fresh_until" timestamp with time zone NOT NULL,
    "universe_code" "text",
    "full_market_cap_rank" integer,
    "comparable_status" "text" DEFAULT 'AVAILABLE'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_cap_classification_observatio_capitalization_basis_check" CHECK (("capitalization_basis" = ANY (ARRAY['FULL'::"text", 'FREE_FLOAT'::"text"]))),
    CONSTRAINT "market_cap_classification_observatio_full_market_cap_rank_check" CHECK ((("full_market_cap_rank" IS NULL) OR ("full_market_cap_rank" > 0))),
    CONSTRAINT "market_cap_classification_observations_comparable_status_check" CHECK (("comparable_status" = ANY (ARRAY['AVAILABLE'::"text", 'STALE'::"text", 'CONFLICTING'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "market_cap_classification_observations_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "market_cap_classification_observations_market_cap_check" CHECK (("market_cap" >= (0)::numeric))
);


ALTER TABLE "public"."market_cap_classification_observations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_cap_classification_policies" (
    "code" "text" NOT NULL,
    "version" integer NOT NULL,
    "name" "text" NOT NULL,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "is_active" boolean DEFAULT false NOT NULL,
    "large_cap_max_rank" integer NOT NULL,
    "mid_cap_max_rank" integer NOT NULL,
    "minimum_universe_size" integer DEFAULT 251 NOT NULL,
    "conflict_same_date_percent" numeric(10,6) DEFAULT 1.0 NOT NULL,
    "conflict_adjacent_date_percent" numeric(10,6) DEFAULT 5.0 NOT NULL,
    "definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_cap_classification_policies_definition_check" CHECK (("jsonb_typeof"("definition") = 'object'::"text")),
    CONSTRAINT "market_cap_classification_policies_version_check" CHECK (("version" > 0)),
    CONSTRAINT "market_cap_policy_date_check" CHECK ((("effective_to" IS NULL) OR ("effective_to" >= "effective_from"))),
    CONSTRAINT "market_cap_policy_rank_check" CHECK ((("large_cap_max_rank" > 0) AND ("mid_cap_max_rank" > "large_cap_max_rank") AND ("minimum_universe_size" >= "mid_cap_max_rank")))
);


ALTER TABLE "public"."market_cap_classification_policies" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_cap_classification_policies" IS 'SEBI/AMFI rank policy is versioned separately from current market-cap observations. Conflict tolerances decide review routing only.';



CREATE OR REPLACE VIEW "public"."current_market_cap_category_v1" WITH ("security_invoker"='true') AS
 SELECT "a"."security_id",
    "a"."policy_code",
    "a"."policy_version",
    "a"."category",
    "a"."rank_used",
    "a"."assessment_status",
    "a"."assessed_at",
    "a"."reason_code",
    "o"."market_cap",
    "o"."currency",
    "o"."capitalization_basis",
    "o"."as_of_date",
    "o"."source_code",
    "o"."fresh_until"
   FROM ("public"."market_cap_category_assessments" "a"
     LEFT JOIN "public"."market_cap_classification_observations" "o" ON (("o"."id" = "a"."selected_observation_id")))
  WHERE (("a"."policy_code", "a"."policy_version") IN ( SELECT "p"."code",
            "p"."version"
           FROM "public"."market_cap_classification_policies" "p"
          WHERE "p"."is_active"));


ALTER VIEW "public"."current_market_cap_category_v1" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."securities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "symbol" "text" NOT NULL,
    "exchange" "text" NOT NULL,
    "isin" "text",
    "name" "text" NOT NULL,
    "asset_class" "text" NOT NULL,
    "instrument_type" "text" NOT NULL,
    "sector_id" "uuid",
    "industry_id" "uuid",
    "currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creation_source" "text" DEFAULT 'FOUNDATION'::"text" NOT NULL,
    "created_by" "uuid",
    "series" "text",
    CONSTRAINT "securities_asset_class_check" CHECK (("asset_class" = ANY (ARRAY['EQUITY'::"text", 'ETF'::"text", 'MUTUAL_FUND'::"text", 'GOLD'::"text", 'SILVER'::"text", 'BOND'::"text", 'CASH'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "securities_creation_source_check" CHECK (("creation_source" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "securities_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "securities_exchange_check" CHECK (("exchange" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "securities_industry_requires_sector" CHECK ((("industry_id" IS NULL) OR ("sector_id" IS NOT NULL))),
    CONSTRAINT "securities_instrument_type_check" CHECK ((("instrument_type" = "btrim"("instrument_type")) AND ("instrument_type" = "upper"("instrument_type")) AND ("instrument_type" <> ''::"text"))),
    CONSTRAINT "securities_isin_check" CHECK ((("isin" IS NULL) OR ("isin" ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'::"text"))),
    CONSTRAINT "securities_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text"))),
    CONSTRAINT "securities_series_check" CHECK ((("series" IS NULL) OR (("series" = "upper"("btrim"("series"))) AND ("series" ~ '^[A-Z0-9_-]{1,12}$'::"text")))),
    CONSTRAINT "securities_symbol_check" CHECK ((("symbol" = "btrim"("symbol")) AND ("symbol" = "upper"("symbol")) AND ("symbol" <> ''::"text")))
);


ALTER TABLE "public"."securities" OWNER TO "postgres";


COMMENT ON COLUMN "public"."securities"."isin" IS 'Canonical ISIN. ISIN values are prohibited in security_identifiers.';



COMMENT ON COLUMN "public"."securities"."series" IS 'Normalized exchange listing series (for example NSE EQ); not a globally unique security identifier.';



CREATE TABLE IF NOT EXISTS "public"."security_attribute_decisions" (
    "security_id" "uuid" NOT NULL,
    "attribute_code" "text" NOT NULL,
    "selected_observation_id" "uuid" NOT NULL,
    "decision_basis" "text" NOT NULL,
    "decided_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "decided_by" "uuid",
    "notes" "text",
    CONSTRAINT "security_attribute_decisions_attribute_code_check" CHECK (("attribute_code" = ANY (ARRAY['COMPANY_NAME'::"text", 'SECTOR'::"text", 'INDUSTRY'::"text"]))),
    CONSTRAINT "security_attribute_decisions_decision_basis_check" CHECK (("decision_basis" = ANY (ARRAY['EVIDENCE_PRIORITY'::"text", 'MANUAL_REVIEW'::"text", 'CORRECTION'::"text"])))
);


ALTER TABLE "public"."security_attribute_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_attribute_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "source_record_id" "uuid" NOT NULL,
    "source_code" "text" NOT NULL,
    "attribute_code" "text" NOT NULL,
    "text_value" "text" NOT NULL,
    "normalized_value" "text",
    "observed_at" timestamp with time zone,
    "valid_from" "date",
    "valid_to" "date",
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fresh_until" timestamp with time zone NOT NULL,
    "evidence_status" "text" DEFAULT 'AVAILABLE'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_attribute_observations_attribute_code_check" CHECK (("attribute_code" = ANY (ARRAY['COMPANY_NAME'::"text", 'SECTOR'::"text", 'INDUSTRY'::"text"]))),
    CONSTRAINT "security_attribute_observations_evidence_status_check" CHECK (("evidence_status" = ANY (ARRAY['AVAILABLE'::"text", 'STALE'::"text", 'CONFLICTING'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "security_attribute_observations_text_value_check" CHECK ((("text_value" = "btrim"("text_value")) AND ("text_value" <> ''::"text")))
);


ALTER TABLE "public"."security_attribute_observations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."current_security_classification_v1" WITH ("security_invoker"='true') AS
 SELECT "s"."id" AS "security_id",
    COALESCE("max"("o"."text_value") FILTER (WHERE ("d"."attribute_code" = 'COMPANY_NAME'::"text")), "s"."name") AS "company_name",
    "max"("o"."text_value") FILTER (WHERE ("d"."attribute_code" = 'SECTOR'::"text")) AS "sector",
    "max"("o"."text_value") FILTER (WHERE ("d"."attribute_code" = 'INDUSTRY'::"text")) AS "industry",
    "min"("o"."fresh_until") AS "fresh_until",
    "bool_or"(("o"."evidence_status" = 'CONFLICTING'::"text")) AS "has_conflict"
   FROM (("public"."securities" "s"
     LEFT JOIN "public"."security_attribute_decisions" "d" ON (("d"."security_id" = "s"."id")))
     LEFT JOIN "public"."security_attribute_observations" "o" ON (("o"."id" = "d"."selected_observation_id")))
  GROUP BY "s"."id", "s"."name";


ALTER VIEW "public"."current_security_classification_v1" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "base_currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "portfolios_base_currency_check" CHECK (("base_currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "portfolios_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text")))
);


ALTER TABLE "public"."portfolios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "exchange" "text" NOT NULL,
    "trading_symbol" "text" NOT NULL,
    "series" "text",
    "currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "valid_from" "date",
    "valid_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_listing_dates_check" CHECK ((("valid_to" IS NULL) OR ("valid_from" IS NULL) OR ("valid_to" >= "valid_from"))),
    CONSTRAINT "security_listings_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "security_listings_exchange_check" CHECK (("exchange" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "security_listings_trading_symbol_check" CHECK ((("trading_symbol" = "btrim"("trading_symbol")) AND ("trading_symbol" <> ''::"text")))
);


ALTER TABLE "public"."security_listings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."current_security_identity_v1" WITH ("security_invoker"='true') AS
 SELECT "s"."id" AS "security_id",
    "s"."name",
    "s"."isin",
    "s"."asset_class",
    "s"."instrument_type",
    "l"."id" AS "listing_id",
    "l"."exchange",
    "l"."trading_symbol",
    "l"."series",
    "l"."currency"
   FROM ("public"."securities" "s"
     LEFT JOIN LATERAL ( SELECT "sl"."id",
            "sl"."security_id",
            "sl"."exchange",
            "sl"."trading_symbol",
            "sl"."series",
            "sl"."currency",
            "sl"."is_primary",
            "sl"."is_active",
            "sl"."valid_from",
            "sl"."valid_to",
            "sl"."created_at",
            "sl"."updated_at"
           FROM "public"."security_listings" "sl"
          WHERE (("sl"."security_id" = "s"."id") AND "sl"."is_active")
          ORDER BY "sl"."is_primary" DESC, "sl"."created_at"
         LIMIT 1) "l" ON (true))
  WHERE ((CURRENT_USER = ANY (ARRAY['postgres'::"name", 'service_role'::"name"])) OR (EXISTS ( SELECT 1
           FROM ("public"."transactions" "t"
             JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
          WHERE (("t"."security_id" = "s"."id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));


ALTER VIEW "public"."current_security_identity_v1" OWNER TO "postgres";


COMMENT ON VIEW "public"."current_security_identity_v1" IS 'Canonical identity projection limited to securities in the authenticated user transaction history; trusted server roles retain universe access.';



CREATE OR REPLACE VIEW "public"."current_security_enrichment_v1" WITH ("security_invoker"='true') AS
 SELECT "i"."security_id",
    "i"."name" AS "canonical_name",
    "c"."company_name",
    "c"."sector",
    "c"."industry",
    "m"."market_cap",
    "m"."currency" AS "market_cap_currency",
    "m"."capitalization_basis",
    "m"."as_of_date" AS "market_cap_as_of_date",
    "m"."category" AS "market_cap_category",
    "m"."rank_used" AS "market_cap_rank",
    "m"."source_code" AS "market_cap_source",
        CASE
            WHEN (COALESCE("c"."has_conflict", false) OR ("m"."assessment_status" = 'CONFLICTING'::"text")) THEN 'FAILED'::"text"
            WHEN (("c"."sector" IS NULL) AND ("c"."industry" IS NULL) AND ("m"."category" IS NULL)) THEN 'UNAVAILABLE'::"text"
            WHEN ((("c"."fresh_until" IS NOT NULL) AND ("c"."fresh_until" <= "now"())) OR ("m"."assessment_status" = 'STALE'::"text") OR (("m"."fresh_until" IS NOT NULL) AND ("m"."fresh_until" <= "now"()))) THEN 'STALE'::"text"
            WHEN (("c"."sector" IS NOT NULL) AND ("c"."industry" IS NOT NULL) AND ("m"."category" = ANY (ARRAY['LARGE_CAP'::"text", 'MID_CAP'::"text", 'SMALL_CAP'::"text"]))) THEN 'AVAILABLE'::"text"
            ELSE 'PARTIAL'::"text"
        END AS "enrichment_state",
    LEAST("c"."fresh_until", "m"."fresh_until") AS "fresh_until"
   FROM (("public"."current_security_identity_v1" "i"
     LEFT JOIN "public"."current_security_classification_v1" "c" ON (("c"."security_id" = "i"."security_id")))
     LEFT JOIN "public"."current_market_cap_category_v1" "m" ON (("m"."security_id" = "i"."security_id")));


ALTER VIEW "public"."current_security_enrichment_v1" OWNER TO "postgres";


COMMENT ON VIEW "public"."current_security_enrichment_v1" IS 'Cache-only selected enrichment. Normal Dashboard reads never require a live provider call.';



CREATE TABLE IF NOT EXISTS "public"."data_ingestion_leases" (
    "source_code" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "lease_holder" "uuid",
    "lease_expires_at" timestamp with time zone,
    "next_allowed_at" timestamp with time zone DEFAULT '-infinity'::timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "data_ingestion_lease_state_check" CHECK (((("lease_holder" IS NULL) AND ("lease_expires_at" IS NULL)) OR (("lease_holder" IS NOT NULL) AND ("lease_expires_at" IS NOT NULL)))),
    CONSTRAINT "data_ingestion_leases_operation_check" CHECK (("operation" ~ '^[A-Z0-9_]+$'::"text"))
);


ALTER TABLE "public"."data_ingestion_leases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_ingestion_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_code" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "requested_by" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "requested_count" integer DEFAULT 0 NOT NULL,
    "cached_count" integer DEFAULT 0 NOT NULL,
    "fetched_count" integer DEFAULT 0 NOT NULL,
    "unchanged_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "error_summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "portfolio_id" "uuid",
    "orchestration_type" "text",
    "trigger_source" "text",
    "estimated_call_count" integer,
    "reserved_call_count" integer,
    "attempted_call_count" integer,
    "accepted_count" integer,
    "conflicting_count" integer,
    "rejected_count" integer,
    "skipped_count" integer,
    "policy_version" integer,
    CONSTRAINT "data_ingestion_run_completion_check" CHECK (((("status" = 'RUNNING'::"text") AND ("completed_at" IS NULL)) OR (("status" <> 'RUNNING'::"text") AND ("completed_at" IS NOT NULL)))),
    CONSTRAINT "data_ingestion_runs_accepted_count_check" CHECK ((("accepted_count" IS NULL) OR ("accepted_count" >= 0))),
    CONSTRAINT "data_ingestion_runs_attempted_call_count_check" CHECK ((("attempted_call_count" IS NULL) OR ("attempted_call_count" >= 0))),
    CONSTRAINT "data_ingestion_runs_cached_count_check" CHECK (("cached_count" >= 0)),
    CONSTRAINT "data_ingestion_runs_conflicting_count_check" CHECK ((("conflicting_count" IS NULL) OR ("conflicting_count" >= 0))),
    CONSTRAINT "data_ingestion_runs_estimated_call_count_check" CHECK ((("estimated_call_count" IS NULL) OR ("estimated_call_count" >= 0))),
    CONSTRAINT "data_ingestion_runs_failed_count_check" CHECK (("failed_count" >= 0)),
    CONSTRAINT "data_ingestion_runs_fetched_count_check" CHECK (("fetched_count" >= 0)),
    CONSTRAINT "data_ingestion_runs_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "data_ingestion_runs_operation_check" CHECK (("operation" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "data_ingestion_runs_orchestration_type_check" CHECK ((("orchestration_type" IS NULL) OR ("orchestration_type" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "data_ingestion_runs_policy_version_check" CHECK ((("policy_version" IS NULL) OR ("policy_version" > 0))),
    CONSTRAINT "data_ingestion_runs_rejected_count_check" CHECK ((("rejected_count" IS NULL) OR ("rejected_count" >= 0))),
    CONSTRAINT "data_ingestion_runs_requested_count_check" CHECK (("requested_count" >= 0)),
    CONSTRAINT "data_ingestion_runs_reserved_call_count_check" CHECK ((("reserved_call_count" IS NULL) OR ("reserved_call_count" >= 0))),
    CONSTRAINT "data_ingestion_runs_skipped_count_check" CHECK ((("skipped_count" IS NULL) OR ("skipped_count" >= 0))),
    CONSTRAINT "data_ingestion_runs_status_check" CHECK (("status" = ANY (ARRAY['RUNNING'::"text", 'SUCCEEDED'::"text", 'PARTIAL'::"text", 'FAILED'::"text", 'SKIPPED_FRESH'::"text", 'CONFIGURATION_PENDING'::"text"]))),
    CONSTRAINT "data_ingestion_runs_trigger_source_check" CHECK ((("trigger_source" IS NULL) OR ("trigger_source" = ANY (ARRAY['OWNER'::"text", 'MANUAL'::"text", 'SCHEDULED'::"text", 'EVENT'::"text", 'RETRY'::"text", 'PILOT'::"text"])))),
    CONSTRAINT "data_ingestion_runs_unchanged_count_check" CHECK (("unchanged_count" >= 0))
);


ALTER TABLE "public"."data_ingestion_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_source_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_code" "text" NOT NULL,
    "ingestion_run_id" "uuid",
    "record_kind" "text" NOT NULL,
    "external_record_id" "text",
    "source_observed_at" timestamp with time zone,
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payload_hash" "text" NOT NULL,
    "raw_payload" "jsonb" NOT NULL,
    "source_url" "text",
    "terms_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    CONSTRAINT "data_source_records_payload_hash_check" CHECK (("payload_hash" ~ '^[a-f0-9]{64}$'::"text")),
    CONSTRAINT "data_source_records_raw_payload_check" CHECK (("jsonb_typeof"("raw_payload") = ANY (ARRAY['object'::"text", 'array'::"text"]))),
    CONSTRAINT "data_source_records_record_kind_check" CHECK (("record_kind" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "data_source_records_terms_snapshot_check" CHECK (("jsonb_typeof"("terms_snapshot") = 'object'::"text"))
);


ALTER TABLE "public"."data_source_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."data_source_records" IS 'Immutable provider/raw observations deduplicated by source identity and SHA-256 payload hash.';



COMMENT ON COLUMN "public"."data_source_records"."published_at" IS 'Time the source published the evidence, when supplied. Distinct from its financial period, source observation/as-of time, and PortfolioAI retrieval time.';



CREATE TABLE IF NOT EXISTS "public"."data_sources" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "source_kind" "text" NOT NULL,
    "evidence_priority" integer NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "entitlement_verified" boolean DEFAULT false NOT NULL,
    "retention_rights_verified" boolean DEFAULT false NOT NULL,
    "capabilities" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "data_sources_capabilities_check" CHECK (("jsonb_typeof"("capabilities") = 'object'::"text")),
    CONSTRAINT "data_sources_code_check" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "data_sources_configuration_check" CHECK (("jsonb_typeof"("configuration") = 'object'::"text")),
    CONSTRAINT "data_sources_evidence_priority_check" CHECK ((("evidence_priority" >= 1) AND ("evidence_priority" <= 1000))),
    CONSTRAINT "data_sources_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text"))),
    CONSTRAINT "data_sources_source_kind_check" CHECK (("source_kind" = ANY (ARRAY['INTERNAL_MASTER'::"text", 'SUBSCRIPTION_API'::"text", 'BROKER_API'::"text", 'PUBLIC_WEB'::"text", 'MANUAL'::"text"])))
);


ALTER TABLE "public"."data_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."data_sources" IS 'TRENDLYNE_MCP is planned as the primary structured provider but remains inactive until subscribed methods, entitlement, and retention rights are verified.';



CREATE TABLE IF NOT EXISTS "public"."enrichment_decision_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "decision_kind" "text" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "old_decision" "jsonb",
    "new_decision" "jsonb",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enrichment_decision_event_shape" CHECK (((("operation" = 'INSERT'::"text") AND ("old_decision" IS NULL) AND ("new_decision" IS NOT NULL)) OR (("operation" = 'UPDATE'::"text") AND ("old_decision" IS NOT NULL) AND ("new_decision" IS NOT NULL)) OR (("operation" = 'DELETE'::"text") AND ("old_decision" IS NOT NULL) AND ("new_decision" IS NULL)))),
    CONSTRAINT "enrichment_decision_events_decision_kind_check" CHECK (("decision_kind" = ANY (ARRAY['SECURITY_ATTRIBUTE'::"text", 'FUNDAMENTAL'::"text"]))),
    CONSTRAINT "enrichment_decision_events_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."enrichment_decision_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."enrichment_decision_events" IS 'Append-only old/new audit history for every canonical enrichment selection change.';



CREATE TABLE IF NOT EXISTS "public"."external_rating_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "agency_code" "text" NOT NULL,
    "instrument_type" "text",
    "instrument_description" "text",
    "rating_symbol" "text" NOT NULL,
    "outlook" "text",
    "rating_action" "text",
    "rating_date" "date",
    "source_url" "text" NOT NULL,
    "source_record_id" "uuid",
    "retrieved_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "fresh_until" timestamp with time zone NOT NULL,
    "evidence_status" "text" DEFAULT 'AVAILABLE'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "external_rating_evidence_status" CHECK (("evidence_status" = ANY (ARRAY['AVAILABLE'::"text", 'PROVISIONAL'::"text", 'STALE'::"text", 'CONFLICTING'::"text", 'AMBIGUOUS'::"text", 'REVIEW_REQUIRED'::"text"]))),
    CONSTRAINT "external_rating_source_nonempty" CHECK (("length"(TRIM(BOTH FROM "source_url")) > 0)),
    CONSTRAINT "external_rating_symbol_nonempty" CHECK (("length"(TRIM(BOTH FROM "rating_symbol")) > 0))
);


ALTER TABLE "public"."external_rating_observations" OWNER TO "postgres";


COMMENT ON TABLE "public"."external_rating_observations" IS 'Immutable-style evidence rows for instrument-level external credit ratings and rating actions.';



CREATE TABLE IF NOT EXISTS "public"."fundamental_metric_definitions" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "value_kind" "text" NOT NULL,
    "canonical_unit" "text",
    "statement_scope" "text",
    "freshness_seconds" integer NOT NULL,
    "definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "fundamental_metric_definitions_code_check" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "fundamental_metric_definitions_definition_check" CHECK (("jsonb_typeof"("definition") = 'object'::"text")),
    CONSTRAINT "fundamental_metric_definitions_freshness_seconds_check" CHECK (("freshness_seconds" > 0)),
    CONSTRAINT "fundamental_metric_definitions_value_kind_check" CHECK (("value_kind" = ANY (ARRAY['NUMERIC'::"text", 'TEXT'::"text", 'BOOLEAN'::"text", 'DATE'::"text"])))
);


ALTER TABLE "public"."fundamental_metric_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fundamental_reconciliation_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "metric_code" "text" NOT NULL,
    "period_start" "date",
    "period_end" "date",
    "period_type" "text",
    "consolidation_scope" "text",
    "unit" "text",
    "accounting_standard" "text",
    "semantic_fingerprint" "text" NOT NULL,
    "case_status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "reason_code" "text" NOT NULL,
    "opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolution_type" "text",
    "selected_observation_id" "uuid",
    "reviewed_by" "uuid",
    "review_notes" "text",
    CONSTRAINT "fundamental_reconciliation_cases_case_status_check" CHECK (("case_status" = ANY (ARRAY['PENDING_COMPATIBILITY'::"text", 'OPEN'::"text", 'RESOLVED'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "fundamental_reconciliation_cases_consolidation_scope_check" CHECK ((("consolidation_scope" IS NULL) OR ("consolidation_scope" = ANY (ARRAY['STANDALONE'::"text", 'CONSOLIDATED'::"text", 'UNKNOWN'::"text"])))),
    CONSTRAINT "fundamental_reconciliation_cases_period_type_check" CHECK ((("period_type" IS NULL) OR ("period_type" = ANY (ARRAY['POINT_IN_TIME'::"text", 'QUARTER'::"text", 'HALF_YEAR'::"text", 'YEAR'::"text", 'TTM'::"text"])))),
    CONSTRAINT "fundamental_reconciliation_cases_reason_code_check" CHECK (("reason_code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "fundamental_reconciliation_cases_resolution_type_check" CHECK ((("resolution_type" IS NULL) OR ("resolution_type" = ANY (ARRAY['SELECTED_OBSERVATION'::"text", 'CONFIRMED_EQUIVALENT'::"text", 'RETAINED_CONFLICT'::"text", 'REJECTED_CASE'::"text"])))),
    CONSTRAINT "fundamental_reconciliation_cases_semantic_fingerprint_check" CHECK (("semantic_fingerprint" ~ '^[a-f0-9]{64}$'::"text")),
    CONSTRAINT "fundamental_reconciliation_period_check" CHECK ((("period_end" IS NULL) OR ("period_start" IS NULL) OR ("period_end" >= "period_start"))),
    CONSTRAINT "fundamental_reconciliation_resolution_check" CHECK (((("case_status" = ANY (ARRAY['PENDING_COMPATIBILITY'::"text", 'OPEN'::"text"])) AND ("resolved_at" IS NULL) AND ("resolution_type" IS NULL) AND ("selected_observation_id" IS NULL) AND ("reviewed_by" IS NULL)) OR (("case_status" = ANY (ARRAY['RESOLVED'::"text", 'REJECTED'::"text"])) AND ("resolved_at" IS NOT NULL) AND ("resolution_type" IS NOT NULL) AND ("reviewed_by" IS NOT NULL)))),
    CONSTRAINT "fundamental_reconciliation_selected_resolution_check" CHECK (((("resolution_type" = 'SELECTED_OBSERVATION'::"text") AND ("selected_observation_id" IS NOT NULL)) OR ("resolution_type" IS DISTINCT FROM 'SELECTED_OBSERVATION'::"text")))
);


ALTER TABLE "public"."fundamental_reconciliation_cases" OWNER TO "postgres";


COMMENT ON TABLE "public"."fundamental_reconciliation_cases" IS 'Dedicated review state for semantically compatible competing fundamental observations; security identity reconciliation remains separate.';



CREATE TABLE IF NOT EXISTS "public"."fundamental_reconciliation_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "prior_state" "jsonb",
    "resulting_state" "jsonb" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fundamental_reconciliation_event_shape" CHECK (((("event_type" = 'OPENED'::"text") AND ("prior_state" IS NULL)) OR (("event_type" = 'UPDATED'::"text") AND ("prior_state" IS NOT NULL)))),
    CONSTRAINT "fundamental_reconciliation_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['OPENED'::"text", 'UPDATED'::"text"])))
);


ALTER TABLE "public"."fundamental_reconciliation_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fundamental_reconciliation_members" (
    "case_id" "uuid" NOT NULL,
    "observation_id" "uuid" NOT NULL,
    "compatibility_status" "text" NOT NULL,
    "compatibility_evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fundamental_reconciliation_members_compatibility_evidence_check" CHECK (("jsonb_typeof"("compatibility_evidence") = 'object'::"text")),
    CONSTRAINT "fundamental_reconciliation_members_compatibility_status_check" CHECK (("compatibility_status" = ANY (ARRAY['VERIFIED_EQUIVALENT'::"text", 'PENDING_REVIEW'::"text"])))
);


ALTER TABLE "public"."fundamental_reconciliation_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."fundamental_reconciliation_members" IS 'Immutable links to competing observations. Membership never overwrites or deletes financial evidence.';



CREATE TABLE IF NOT EXISTS "public"."import_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "broker_account_id" "uuid",
    "source_type" "text" NOT NULL,
    "source_provider" "text",
    "file_name" "text",
    "file_sha256" "text",
    "duplicate_of_import_batch_id" "uuid",
    "file_format" "text",
    "mapping_version" "text",
    "mapping_config" "jsonb",
    "snapshot_as_of_date" "date",
    "status" "text" DEFAULT 'UPLOADED'::"text" NOT NULL,
    "total_row_count" integer DEFAULT 0 NOT NULL,
    "valid_row_count" integer DEFAULT 0 NOT NULL,
    "invalid_row_count" integer DEFAULT 0 NOT NULL,
    "ambiguous_row_count" integer DEFAULT 0 NOT NULL,
    "duplicate_row_count" integer DEFAULT 0 NOT NULL,
    "confirmed_at" timestamp with time zone,
    "committed_at" timestamp with time zone,
    "failure_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "import_batches_ambiguous_row_count_check" CHECK (("ambiguous_row_count" >= 0)),
    CONSTRAINT "import_batches_commit_state_check" CHECK (((("status" = 'COMMITTED'::"text") AND ("committed_at" IS NOT NULL)) OR (("status" <> 'COMMITTED'::"text") AND ("committed_at" IS NULL)))),
    CONSTRAINT "import_batches_duplicate_not_self_check" CHECK ((("duplicate_of_import_batch_id" IS NULL) OR ("duplicate_of_import_batch_id" <> "id"))),
    CONSTRAINT "import_batches_duplicate_row_count_check" CHECK (("duplicate_row_count" >= 0)),
    CONSTRAINT "import_batches_failure_details_check" CHECK ((("failure_details" IS NULL) OR ("jsonb_typeof"("failure_details") = 'object'::"text"))),
    CONSTRAINT "import_batches_file_format_check" CHECK ((("file_format" IS NULL) OR ("file_format" = ANY (ARRAY['XLSX'::"text", 'XLS'::"text", 'CSV'::"text", 'API'::"text", 'MANUAL'::"text"])))),
    CONSTRAINT "import_batches_file_name_check" CHECK ((("file_name" IS NULL) OR (("file_name" = "btrim"("file_name")) AND ("file_name" <> ''::"text")))),
    CONSTRAINT "import_batches_file_sha256_check" CHECK ((("file_sha256" IS NULL) OR ("file_sha256" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "import_batches_invalid_row_count_check" CHECK (("invalid_row_count" >= 0)),
    CONSTRAINT "import_batches_mapping_config_check" CHECK ((("mapping_config" IS NULL) OR ("jsonb_typeof"("mapping_config") = 'object'::"text"))),
    CONSTRAINT "import_batches_mapping_version_check" CHECK ((("mapping_version" IS NULL) OR (("mapping_version" = "btrim"("mapping_version")) AND ("mapping_version" <> ''::"text")))),
    CONSTRAINT "import_batches_source_provider_check" CHECK ((("source_provider" IS NULL) OR ("source_provider" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "import_batches_source_type_check" CHECK (("source_type" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "import_batches_status_check" CHECK (("status" = ANY (ARRAY['UPLOADED'::"text", 'PREVIEWED'::"text", 'VALIDATED'::"text", 'AWAITING_CONFIRMATION'::"text", 'COMMITTING'::"text", 'COMMITTED'::"text", 'REJECTED'::"text", 'FAILED'::"text"]))),
    CONSTRAINT "import_batches_total_row_count_check" CHECK (("total_row_count" >= 0)),
    CONSTRAINT "import_batches_valid_row_count_check" CHECK (("valid_row_count" >= 0))
);


ALTER TABLE "public"."import_batches" OWNER TO "postgres";


COMMENT ON TABLE "public"."import_batches" IS 'Metadata and workflow state for XLSX, CSV, API, or manual imports; source binaries are not stored here.';



COMMENT ON COLUMN "public"."import_batches"."file_sha256" IS 'Lowercase SHA-256 of the original file, used for exact-file re-import detection.';



COMMENT ON COLUMN "public"."import_batches"."duplicate_of_import_batch_id" IS 'Optional same-portfolio link to an earlier attempt with identical source content; every attempt retains its own row.';



CREATE TABLE IF NOT EXISTS "public"."import_source_rows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "import_batch_id" "uuid" NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "row_number" integer NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "raw_row_hash" "text",
    "normalized_data" "jsonb",
    "resolved_security_id" "uuid",
    "validation_status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "validation_errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "validation_warnings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "duplicate_status" "text",
    "duplicate_of_transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "import_source_rows_duplicate_status_check" CHECK ((("duplicate_status" IS NULL) OR ("duplicate_status" = ANY (ARRAY['NOT_DUPLICATE'::"text", 'POSSIBLE_DUPLICATE'::"text", 'CONFIRMED_DUPLICATE'::"text"])))),
    CONSTRAINT "import_source_rows_normalized_data_check" CHECK ((("normalized_data" IS NULL) OR ("jsonb_typeof"("normalized_data") = 'object'::"text"))),
    CONSTRAINT "import_source_rows_raw_data_check" CHECK (("jsonb_typeof"("raw_data") = 'object'::"text")),
    CONSTRAINT "import_source_rows_raw_row_hash_check" CHECK ((("raw_row_hash" IS NULL) OR ("raw_row_hash" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "import_source_rows_row_number_check" CHECK (("row_number" > 0)),
    CONSTRAINT "import_source_rows_validation_errors_check" CHECK (("jsonb_typeof"("validation_errors") = 'array'::"text")),
    CONSTRAINT "import_source_rows_validation_status_check" CHECK (("validation_status" = ANY (ARRAY['PENDING'::"text", 'VALID'::"text", 'INVALID'::"text", 'AMBIGUOUS'::"text", 'DUPLICATE'::"text", 'IGNORED'::"text"]))),
    CONSTRAINT "import_source_rows_validation_warnings_check" CHECK (("jsonb_typeof"("validation_warnings") = 'array'::"text"))
);


ALTER TABLE "public"."import_source_rows" OWNER TO "postgres";


COMMENT ON TABLE "public"."import_source_rows" IS 'Immutable row-level import evidence, including invalid, ambiguous, duplicate, and ignored source rows.';



COMMENT ON COLUMN "public"."import_source_rows"."raw_data" IS 'Original source column names and values captured before normalization.';



COMMENT ON COLUMN "public"."import_source_rows"."normalized_data" IS 'Untrusted staging output. A future trusted commit operation must revalidate it and all resolution/duplicate fields server-side.';



CREATE TABLE IF NOT EXISTS "public"."industries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sector_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "industries_code_check" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "industries_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text")))
);


ALTER TABLE "public"."industries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_transaction_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "idempotency_key" "uuid" NOT NULL,
    "request_hash" "text" NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "manual_transaction_requests_request_hash_check" CHECK (("request_hash" ~ '^[0-9a-f]{64}$'::"text"))
);


ALTER TABLE "public"."manual_transaction_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."manual_transaction_requests" IS 'Server-owned replay ledger for trusted manual transaction submission; it is not browser writable.';



CREATE TABLE IF NOT EXISTS "public"."market_benchmark_price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "benchmark_code" "text" NOT NULL,
    "provider_code" "text" NOT NULL,
    "interval" "text" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "open" numeric NOT NULL,
    "high" numeric NOT NULL,
    "low" numeric NOT NULL,
    "close" numeric NOT NULL,
    "volume" numeric,
    "retrieved_at" timestamp with time zone NOT NULL,
    "provenance" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_benchmark_interval_check" CHECK (("interval" = 'ONE_DAY'::"text")),
    CONSTRAINT "market_benchmark_provenance_object_check" CHECK (("jsonb_typeof"("provenance") = 'object'::"text"))
);


ALTER TABLE "public"."market_benchmark_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_benchmarks" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "provider_code" "text" NOT NULL,
    "provider_instrument_id" "text",
    "exchange" "text",
    "trading_symbol" "text",
    "mapping_status" "text" DEFAULT 'UNRESOLVED'::"text" NOT NULL,
    "mapping_evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "verified_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_benchmarks_code_check" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "market_benchmarks_mapping_evidence_object_check" CHECK (("jsonb_typeof"("mapping_evidence") = 'object'::"text")),
    CONSTRAINT "market_benchmarks_mapping_status_check" CHECK (("mapping_status" = ANY (ARRAY['VERIFIED'::"text", 'UNRESOLVED'::"text", 'AMBIGUOUS'::"text"])))
);


ALTER TABLE "public"."market_benchmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_data_instrument_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "provider_code" "text" NOT NULL,
    "provider_instrument_id" "text",
    "exchange" "text",
    "trading_symbol" "text",
    "provider_instrument_type" "text",
    "mapping_status" "text" NOT NULL,
    "match_basis" "text",
    "evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "instrument_master_as_of" "date",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "listing_id" "uuid",
    CONSTRAINT "market_data_instrument_mappings_evidence_check" CHECK (("jsonb_typeof"("evidence") = 'object'::"text")),
    CONSTRAINT "market_data_instrument_mappings_mapping_status_check" CHECK (("mapping_status" = ANY (ARRAY['VERIFIED'::"text", 'UNRESOLVED'::"text", 'AMBIGUOUS'::"text", 'INACTIVE'::"text"]))),
    CONSTRAINT "market_data_instrument_mappings_match_basis_check" CHECK ((("match_basis" IS NULL) OR ("match_basis" = ANY (ARRAY['EXCHANGE_SYMBOL_EXACT'::"text", 'ISIN_EXACT'::"text", 'MANUAL_VERIFIED'::"text"])))),
    CONSTRAINT "market_data_mapping_complete_check" CHECK (((("mapping_status" = 'VERIFIED'::"text") AND ("provider_instrument_id" IS NOT NULL) AND ("exchange" IS NOT NULL) AND ("trading_symbol" IS NOT NULL) AND ("match_basis" IS NOT NULL) AND ("verified_at" IS NOT NULL)) OR ("mapping_status" <> 'VERIFIED'::"text"))),
    CONSTRAINT "market_data_mapping_exchange_check" CHECK ((("exchange" IS NULL) OR ("exchange" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "market_data_mapping_instrument_id_check" CHECK ((("provider_instrument_id" IS NULL) OR ("provider_instrument_id" = "btrim"("provider_instrument_id")))),
    CONSTRAINT "market_data_mapping_trading_symbol_check" CHECK ((("trading_symbol" IS NULL) OR (("trading_symbol" = "btrim"("trading_symbol")) AND ("trading_symbol" <> ''::"text"))))
);


ALTER TABLE "public"."market_data_instrument_mappings" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_data_instrument_mappings" IS 'Provider instrument identity is kept separate from canonical securities. VERIFIED mappings require exact canonical exchange/symbol evidence, exact ISIN evidence, or manual verification.';



COMMENT ON COLUMN "public"."market_data_instrument_mappings"."listing_id" IS 'Optional canonical-listing link. Existing security/provider mapping identity and historical prices remain unchanged.';



CREATE TABLE IF NOT EXISTS "public"."market_data_mapping_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mapping_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "provider_code" "text" NOT NULL,
    "proposed_provider_instrument_id" "text",
    "proposed_exchange" "text",
    "proposed_trading_symbol" "text",
    "proposed_provider_instrument_type" "text",
    "proposed_mapping_status" "text" NOT NULL,
    "proposed_match_basis" "text",
    "evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "detected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "review_status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "review_notes" "text",
    CONSTRAINT "market_data_mapping_review_state_check" CHECK (((("review_status" = 'PENDING'::"text") AND ("reviewed_at" IS NULL) AND ("reviewed_by" IS NULL)) OR (("review_status" <> 'PENDING'::"text") AND ("reviewed_at" IS NOT NULL) AND ("reviewed_by" IS NOT NULL)))),
    CONSTRAINT "market_data_mapping_reviews_evidence_check" CHECK (("jsonb_typeof"("evidence") = 'object'::"text")),
    CONSTRAINT "market_data_mapping_reviews_proposed_mapping_status_check" CHECK (("proposed_mapping_status" = ANY (ARRAY['VERIFIED'::"text", 'UNRESOLVED'::"text", 'AMBIGUOUS'::"text", 'INACTIVE'::"text"]))),
    CONSTRAINT "market_data_mapping_reviews_proposed_match_basis_check" CHECK ((("proposed_match_basis" IS NULL) OR ("proposed_match_basis" = ANY (ARRAY['EXCHANGE_SYMBOL_EXACT'::"text", 'ISIN_EXACT'::"text", 'MANUAL_VERIFIED'::"text"])))),
    CONSTRAINT "market_data_mapping_reviews_review_status_check" CHECK (("review_status" = ANY (ARRAY['PENDING'::"text", 'APPLIED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."market_data_mapping_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_data_mapping_reviews" IS 'Quarantine for provider identity changes. A VERIFIED mapping remains unchanged until a separately reviewed transition is applied.';



CREATE TABLE IF NOT EXISTS "public"."market_data_operation_leases" (
    "provider_code" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "lease_holder" "uuid",
    "lease_expires_at" timestamp with time zone,
    "next_allowed_at" timestamp with time zone DEFAULT '-infinity'::timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_data_operation_lease_state_check" CHECK (((("lease_holder" IS NULL) AND ("lease_expires_at" IS NULL)) OR (("lease_holder" IS NOT NULL) AND ("lease_expires_at" IS NOT NULL)))),
    CONSTRAINT "market_data_operation_leases_operation_check" CHECK (("operation" = ANY (ARRAY['REFRESH_PRICES'::"text", 'SYNC_MAPPINGS'::"text", 'REFRESH_HISTORY'::"text"])))
);


ALTER TABLE "public"."market_data_operation_leases" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_data_operation_leases" IS 'Server-only provider-wide distributed leases and cooldowns. Browser roles have no table or function privileges.';



CREATE TABLE IF NOT EXISTS "public"."market_data_providers" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "capabilities" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_data_providers_capabilities_check" CHECK (("jsonb_typeof"("capabilities") = 'object'::"text")),
    CONSTRAINT "market_data_providers_code_check" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "market_data_providers_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text")))
);


ALTER TABLE "public"."market_data_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_data_refresh_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "provider_code" "text" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "requested_security_count" integer NOT NULL,
    "cached_security_count" integer DEFAULT 0 NOT NULL,
    "fetched_security_count" integer DEFAULT 0 NOT NULL,
    "unresolved_security_count" integer DEFAULT 0 NOT NULL,
    "failed_security_count" integer DEFAULT 0 NOT NULL,
    "error_summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "market_data_refresh_runs_cached_security_count_check" CHECK (("cached_security_count" >= 0)),
    CONSTRAINT "market_data_refresh_runs_failed_security_count_check" CHECK (("failed_security_count" >= 0)),
    CONSTRAINT "market_data_refresh_runs_fetched_security_count_check" CHECK (("fetched_security_count" >= 0)),
    CONSTRAINT "market_data_refresh_runs_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "market_data_refresh_runs_requested_security_count_check" CHECK (("requested_security_count" >= 0)),
    CONSTRAINT "market_data_refresh_runs_status_check" CHECK (("status" = ANY (ARRAY['RUNNING'::"text", 'SUCCEEDED'::"text", 'PARTIAL'::"text", 'FAILED'::"text", 'SKIPPED_FRESH'::"text"]))),
    CONSTRAINT "market_data_refresh_runs_unresolved_security_count_check" CHECK (("unresolved_security_count" >= 0))
);


ALTER TABLE "public"."market_data_refresh_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_data_refresh_runs" IS 'Auditable server-side refresh attempts; provider credentials and tokens are never stored here.';



CREATE TABLE IF NOT EXISTS "public"."market_metric_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "provider_code" "text" NOT NULL,
    "metric_code" "text" NOT NULL,
    "numeric_value" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "as_of_date" "date" NOT NULL,
    "lookback_start" "date",
    "lookback_end" "date" NOT NULL,
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fresh_until" timestamp with time zone NOT NULL,
    "evidence_status" "text" DEFAULT 'AVAILABLE'::"text" NOT NULL,
    "derivation" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_metric_code_check" CHECK (("metric_code" = ANY (ARRAY['PRICE_MOMENTUM_12M'::"text", 'PRICE_MOMENTUM_6M'::"text", 'RELATIVE_STRENGTH_12M'::"text", 'MAX_DRAWDOWN_1Y'::"text", 'VOLATILITY_1Y'::"text"]))),
    CONSTRAINT "market_metric_derivation_object_check" CHECK (("jsonb_typeof"("derivation") = 'object'::"text")),
    CONSTRAINT "market_metric_evidence_status_check" CHECK (("evidence_status" = ANY (ARRAY['AVAILABLE'::"text", 'CONFLICTING'::"text", 'REJECTED'::"text", 'REVIEW_REQUIRED'::"text"]))),
    CONSTRAINT "market_metric_unit_check" CHECK (("unit" = ANY (ARRAY['PERCENT'::"text", 'PERCENTAGE_POINTS'::"text", 'PERCENT_ABSOLUTE_DRAWDOWN'::"text"]))),
    CONSTRAINT "market_metric_window_check" CHECK ((("lookback_start" IS NULL) OR ("lookback_start" <= "lookback_end")))
);


ALTER TABLE "public"."market_metric_observations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_price_history" (
    "security_id" "uuid" NOT NULL,
    "provider_code" "text" NOT NULL,
    "mapping_id" "uuid" NOT NULL,
    "interval" "text" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "open" numeric(38,18) NOT NULL,
    "high" numeric(38,18) NOT NULL,
    "low" numeric(38,18) NOT NULL,
    "close" numeric(38,18) NOT NULL,
    "adjusted_close" numeric(38,18),
    "volume" numeric(38,0),
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provenance" "jsonb" NOT NULL,
    CONSTRAINT "market_price_history_adjusted_close_check" CHECK ((("adjusted_close" IS NULL) OR ("adjusted_close" >= (0)::numeric))),
    CONSTRAINT "market_price_history_close_check" CHECK (("close" >= (0)::numeric)),
    CONSTRAINT "market_price_history_high_check" CHECK (("high" >= (0)::numeric)),
    CONSTRAINT "market_price_history_interval_check" CHECK (("interval" = 'ONE_DAY'::"text")),
    CONSTRAINT "market_price_history_low_check" CHECK (("low" >= (0)::numeric)),
    CONSTRAINT "market_price_history_open_check" CHECK (("open" >= (0)::numeric)),
    CONSTRAINT "market_price_history_provenance_check" CHECK (("jsonb_typeof"("provenance") = 'object'::"text")),
    CONSTRAINT "market_price_history_range_check" CHECK ((("low" <= "high") AND (("open" >= "low") AND ("open" <= "high")) AND (("close" >= "low") AND ("close" <= "high")))),
    CONSTRAINT "market_price_history_volume_check" CHECK ((("volume" IS NULL) OR ("volume" >= (0)::numeric)))
);


ALTER TABLE "public"."market_price_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_price_history" IS 'Provider-independent daily OHLCV foundation. Stage 4 creates the model but does not run technical or risk engines.';



CREATE TABLE IF NOT EXISTS "public"."market_price_latest" (
    "security_id" "uuid" NOT NULL,
    "provider_code" "text" NOT NULL,
    "mapping_id" "uuid" NOT NULL,
    "price" numeric(38,18) NOT NULL,
    "currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "price_timestamp" timestamp with time zone,
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "market_session_status" "text" DEFAULT 'UNKNOWN'::"text" NOT NULL,
    "previous_close" numeric(38,18),
    "day_open" numeric(38,18),
    "day_high" numeric(38,18),
    "day_low" numeric(38,18),
    "provenance" "jsonb" NOT NULL,
    CONSTRAINT "market_price_latest_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "market_price_latest_day_high_check" CHECK ((("day_high" IS NULL) OR ("day_high" >= (0)::numeric))),
    CONSTRAINT "market_price_latest_day_low_check" CHECK ((("day_low" IS NULL) OR ("day_low" >= (0)::numeric))),
    CONSTRAINT "market_price_latest_day_open_check" CHECK ((("day_open" IS NULL) OR ("day_open" >= (0)::numeric))),
    CONSTRAINT "market_price_latest_day_range_check" CHECK ((("day_low" IS NULL) OR ("day_high" IS NULL) OR ("day_low" <= "day_high"))),
    CONSTRAINT "market_price_latest_market_session_status_check" CHECK (("market_session_status" = ANY (ARRAY['OPEN'::"text", 'CLOSED'::"text", 'PRE_OPEN'::"text", 'POST_CLOSE'::"text", 'UNKNOWN'::"text"]))),
    CONSTRAINT "market_price_latest_previous_close_check" CHECK ((("previous_close" IS NULL) OR ("previous_close" >= (0)::numeric))),
    CONSTRAINT "market_price_latest_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "market_price_latest_provenance_check" CHECK (("jsonb_typeof"("provenance") = 'object'::"text"))
);


ALTER TABLE "public"."market_price_latest" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_price_latest" IS 'Provider observation cache. price_timestamp is provider/exchange observation time; retrieved_at is PortfolioAI retrieval time.';



CREATE TABLE IF NOT EXISTS "public"."news_classification_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "news_item_id" "uuid" NOT NULL,
    "classifier_version" "text" NOT NULL,
    "evidence_record_id" "uuid",
    "previous_category" "text" NOT NULL,
    "new_category" "text" NOT NULL,
    "previous_importance_state" "text" NOT NULL,
    "new_importance_state" "text" NOT NULL,
    "previous_tone_state" "text" NOT NULL,
    "new_tone_state" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."news_classification_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "canonical_key" "text" NOT NULL,
    "headline" "text" NOT NULL,
    "summary" "text",
    "category" "text" DEFAULT 'UNCLASSIFIED'::"text" NOT NULL,
    "importance_state" "text" DEFAULT 'UNCLASSIFIED'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "publication_precision" "text" DEFAULT 'UNKNOWN'::"text" NOT NULL,
    "primary_source_name" "text",
    "primary_source_url" "text",
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tone_state" "text" DEFAULT 'UNCLASSIFIED'::"text" NOT NULL,
    "tone_method" "text" DEFAULT 'UNCLASSIFIED'::"text" NOT NULL,
    "tone_confidence" numeric(5,4),
    "tone_reason" "text",
    CONSTRAINT "news_items_canonical_key_check" CHECK ((("canonical_key" = "btrim"("canonical_key")) AND ("canonical_key" <> ''::"text") AND ("length"("canonical_key") <= 128))),
    CONSTRAINT "news_items_category_check" CHECK (("category" = ANY (ARRAY['RESULTS'::"text", 'CORPORATE_ACTION'::"text", 'REGULATORY'::"text", 'MANAGEMENT'::"text", 'ORDER_CONTRACT'::"text", 'FUND_RAISE'::"text", 'MA_INVESTMENT'::"text", 'CREDIT_RATING'::"text", 'SHAREHOLDING_INSIDER'::"text", 'LITIGATION_GOVERNANCE'::"text", 'GENERAL'::"text", 'UNCLASSIFIED'::"text"]))),
    CONSTRAINT "news_items_headline_check" CHECK ((("headline" = "btrim"("headline")) AND ("headline" <> ''::"text") AND ("length"("headline") <= 1000))),
    CONSTRAINT "news_items_importance_state_check" CHECK (("importance_state" = ANY (ARRAY['UNCLASSIFIED'::"text", 'ROUTINE'::"text", 'NOTABLE'::"text", 'IMPORTANT'::"text"]))),
    CONSTRAINT "news_items_primary_source_name_check" CHECK ((("primary_source_name" IS NULL) OR (("primary_source_name" = "btrim"("primary_source_name")) AND ("primary_source_name" <> ''::"text") AND ("length"("primary_source_name") <= 300)))),
    CONSTRAINT "news_items_primary_source_url_check" CHECK ((("primary_source_url" IS NULL) OR (("primary_source_url" = "btrim"("primary_source_url")) AND ("primary_source_url" ~ '^https://'::"text")))),
    CONSTRAINT "news_items_publication_precision_check" CHECK (("publication_precision" = ANY (ARRAY['DATETIME'::"text", 'DATE'::"text", 'UNKNOWN'::"text"]))),
    CONSTRAINT "news_items_seen_order" CHECK (("last_seen_at" >= "first_seen_at")),
    CONSTRAINT "news_items_summary_check" CHECK ((("summary" IS NULL) OR (("summary" = "btrim"("summary")) AND ("summary" <> ''::"text") AND ("length"("summary") <= 4000)))),
    CONSTRAINT "news_items_tone_confidence_check" CHECK ((("tone_confidence" IS NULL) OR (("tone_confidence" >= (0)::numeric) AND ("tone_confidence" <= (1)::numeric)))),
    CONSTRAINT "news_items_tone_method_check" CHECK (("tone_method" = ANY (ARRAY['DETERMINISTIC'::"text", 'AI_ASSISTED'::"text", 'SOURCE_PROVIDED'::"text", 'UNCLASSIFIED'::"text"]))),
    CONSTRAINT "news_items_tone_reason_check" CHECK ((("tone_reason" IS NULL) OR (("tone_reason" = "btrim"("tone_reason")) AND ("tone_reason" <> ''::"text") AND ("length"("tone_reason") <= 1000)))),
    CONSTRAINT "news_items_tone_state_check" CHECK (("tone_state" = ANY (ARRAY['POSITIVE'::"text", 'NEUTRAL'::"text", 'NEGATIVE'::"text", 'UNCLASSIFIED'::"text"])))
);


ALTER TABLE "public"."news_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."news_items" IS 'Normalized security-centric cached news. N3 pilot does not populate this table until the live provider response contract is reviewed.';



COMMENT ON COLUMN "public"."news_items"."tone_state" IS 'Direction of the reported event for visual scanning only; never a Buy/Sell recommendation.';



COMMENT ON COLUMN "public"."news_items"."tone_method" IS 'Provenance method used to assign tone. N3C raw ingestion leaves this UNCLASSIFIED.';



COMMENT ON COLUMN "public"."news_items"."tone_confidence" IS 'Optional bounded 0..1 confidence for a classified tone.';



COMMENT ON COLUMN "public"."news_items"."tone_reason" IS 'Short evidence-grounded explanation of tone assignment; not investment advice.';



CREATE TABLE IF NOT EXISTS "public"."news_pipeline_leases" (
    "source_code" "text" NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "lease_holder" "uuid" NOT NULL,
    "acquired_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "cooldown_until" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "news_pipeline_lease_expiry" CHECK (("expires_at" > "acquired_at"))
);


ALTER TABLE "public"."news_pipeline_leases" OWNER TO "postgres";


COMMENT ON TABLE "public"."news_pipeline_leases" IS 'Service-only concurrency lease for consolidated official NSE news ingestion. No browser access.';



CREATE TABLE IF NOT EXISTS "public"."news_source_appearances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "news_item_id" "uuid" NOT NULL,
    "source_code" "text" NOT NULL,
    "data_source_record_id" "uuid" NOT NULL,
    "provider_record_id" "text",
    "provider_security_identity" "text" NOT NULL,
    "publisher_name" "text",
    "source_url" "text",
    "headline_as_received" "text" NOT NULL,
    "summary_as_received" "text",
    "published_at" timestamp with time zone,
    "retrieved_at" timestamp with time zone NOT NULL,
    "content_hash" "text" NOT NULL,
    "dedupe_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "news_source_appearances_content_hash_check" CHECK (("content_hash" ~ '^[a-f0-9]{64}$'::"text")),
    CONSTRAINT "news_source_appearances_dedupe_key_check" CHECK ((("dedupe_key" = "btrim"("dedupe_key")) AND ("dedupe_key" <> ''::"text") AND ("length"("dedupe_key") <= 1000))),
    CONSTRAINT "news_source_appearances_headline_as_received_check" CHECK ((("headline_as_received" = "btrim"("headline_as_received")) AND ("headline_as_received" <> ''::"text") AND ("length"("headline_as_received") <= 1000))),
    CONSTRAINT "news_source_appearances_provider_record_id_check" CHECK ((("provider_record_id" IS NULL) OR (("provider_record_id" = "btrim"("provider_record_id")) AND ("provider_record_id" <> ''::"text") AND ("length"("provider_record_id") <= 500)))),
    CONSTRAINT "news_source_appearances_provider_security_identity_check" CHECK ((("provider_security_identity" = "btrim"("provider_security_identity")) AND ("provider_security_identity" <> ''::"text") AND ("length"("provider_security_identity") <= 500))),
    CONSTRAINT "news_source_appearances_publisher_name_check" CHECK ((("publisher_name" IS NULL) OR (("publisher_name" = "btrim"("publisher_name")) AND ("publisher_name" <> ''::"text") AND ("length"("publisher_name") <= 300)))),
    CONSTRAINT "news_source_appearances_source_url_check" CHECK ((("source_url" IS NULL) OR (("source_url" = "btrim"("source_url")) AND ("source_url" ~ '^https://'::"text")))),
    CONSTRAINT "news_source_appearances_summary_as_received_check" CHECK ((("summary_as_received" IS NULL) OR (("summary_as_received" = "btrim"("summary_as_received")) AND ("summary_as_received" <> ''::"text") AND ("length"("summary_as_received") <= 4000))))
);


ALTER TABLE "public"."news_source_appearances" OWNER TO "postgres";


COMMENT ON TABLE "public"."news_source_appearances" IS 'Provider/source lineage for normalized news items. Browser clients have no direct access.';



CREATE OR REPLACE VIEW "public"."portfolio_enrichment_coverage_v1" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "portfolio_id",
    ("count"(DISTINCT "t"."security_id"))::integer AS "security_count",
    ("count"(DISTINCT "t"."security_id") FILTER (WHERE ("e"."enrichment_state" = 'AVAILABLE'::"text")))::integer AS "available_count",
    ("count"(DISTINCT "t"."security_id") FILTER (WHERE ("e"."enrichment_state" = 'PARTIAL'::"text")))::integer AS "partial_count",
    ("count"(DISTINCT "t"."security_id") FILTER (WHERE ("e"."enrichment_state" = 'UNAVAILABLE'::"text")))::integer AS "unavailable_count",
    ("count"(DISTINCT "t"."security_id") FILTER (WHERE ("e"."enrichment_state" = 'STALE'::"text")))::integer AS "stale_count",
    ("count"(DISTINCT "t"."security_id") FILTER (WHERE ("e"."enrichment_state" = 'FAILED'::"text")))::integer AS "failed_count"
   FROM (("public"."portfolios" "p"
     JOIN "public"."transactions" "t" ON ((("t"."portfolio_id" = "p"."id") AND ("t"."accounting_status" = 'ACTIVE'::"text"))))
     LEFT JOIN "public"."current_security_enrichment_v1" "e" ON (("e"."security_id" = "t"."security_id")))
  GROUP BY "p"."id";


ALTER VIEW "public"."portfolio_enrichment_coverage_v1" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_security_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "portfolio_role" "text" DEFAULT 'OTHER'::"text" NOT NULL,
    "target_weight" numeric(9,6),
    "minimum_weight" numeric(9,6),
    "maximum_weight" numeric(9,6),
    "priority" integer,
    "is_watchlisted" boolean DEFAULT false NOT NULL,
    "is_frozen" boolean DEFAULT false NOT NULL,
    "investment_horizon" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_price" numeric,
    "stop_loss_price" numeric,
    "target_price_alert_enabled" boolean DEFAULT true NOT NULL,
    "stop_loss_alert_enabled" boolean DEFAULT true NOT NULL,
    CONSTRAINT "portfolio_security_settings_investment_horizon_check" CHECK ((("investment_horizon" IS NULL) OR (("investment_horizon" = "btrim"("investment_horizon")) AND ("investment_horizon" <> ''::"text")))),
    CONSTRAINT "portfolio_security_settings_maximum_weight_check" CHECK ((("maximum_weight" IS NULL) OR (("maximum_weight" >= (0)::numeric) AND ("maximum_weight" <= (100)::numeric)))),
    CONSTRAINT "portfolio_security_settings_minimum_weight_check" CHECK ((("minimum_weight" IS NULL) OR (("minimum_weight" >= (0)::numeric) AND ("minimum_weight" <= (100)::numeric)))),
    CONSTRAINT "portfolio_security_settings_notes_check" CHECK ((("notes" IS NULL) OR ("notes" = "btrim"("notes")))),
    CONSTRAINT "portfolio_security_settings_portfolio_role_check" CHECK (("portfolio_role" = ANY (ARRAY['CORE'::"text", 'SATELLITE'::"text", 'THEMATIC'::"text", 'ETF'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "portfolio_security_settings_priority_check" CHECK ((("priority" IS NULL) OR ("priority" >= 0))),
    CONSTRAINT "portfolio_security_settings_stop_loss_price_check" CHECK ((("stop_loss_price" IS NULL) OR ("stop_loss_price" > (0)::numeric))),
    CONSTRAINT "portfolio_security_settings_target_price_check" CHECK ((("target_price" IS NULL) OR ("target_price" > (0)::numeric))),
    CONSTRAINT "portfolio_security_settings_target_weight_check" CHECK ((("target_weight" IS NULL) OR (("target_weight" >= (0)::numeric) AND ("target_weight" <= (100)::numeric)))),
    CONSTRAINT "portfolio_security_settings_weight_order_check" CHECK (((("minimum_weight" IS NULL) OR ("target_weight" IS NULL) OR ("minimum_weight" <= "target_weight")) AND (("target_weight" IS NULL) OR ("maximum_weight" IS NULL) OR ("target_weight" <= "maximum_weight")) AND (("minimum_weight" IS NULL) OR ("maximum_weight" IS NULL) OR ("minimum_weight" <= "maximum_weight"))))
);


ALTER TABLE "public"."portfolio_security_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."portfolio_security_settings" IS 'Portfolio-specific role and sizing preferences; portfolio_role is independent of securities.asset_class.';



COMMENT ON COLUMN "public"."portfolio_security_settings"."target_weight" IS 'Percentage weight stored as numeric(9,6), where 100 represents one hundred percent.';



COMMENT ON COLUMN "public"."portfolio_security_settings"."target_price" IS 'User-controlled target price for this portfolio/security. Advisory automation may suggest but must not overwrite without user action.';



COMMENT ON COLUMN "public"."portfolio_security_settings"."stop_loss_price" IS 'User-controlled stop-loss/reference risk price for this portfolio/security.';



COMMENT ON COLUMN "public"."portfolio_security_settings"."target_price_alert_enabled" IS 'Reserved for future target-price notification workflow.';



COMMENT ON COLUMN "public"."portfolio_security_settings"."stop_loss_alert_enabled" IS 'Reserved for future stop-loss notification workflow.';



CREATE TABLE IF NOT EXISTS "public"."position_sizing_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "engine_version" "text" NOT NULL,
    "evaluation_key" "text" NOT NULL,
    "as_of_at" timestamp with time zone NOT NULL,
    "assessment_state" "text" NOT NULL,
    "research_profile_code" "text",
    "research_profile_version" "text",
    "current_weight" numeric(9,6),
    "suggested_target_weight" numeric(9,6),
    "suggested_minimum_weight" numeric(9,6),
    "suggested_maximum_weight" numeric(9,6),
    "recommended_action" "text",
    "evidence_coverage" numeric(7,6),
    "evidence_confidence" numeric(9,6),
    "reason_codes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "rationale" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "input_snapshot" "jsonb" NOT NULL,
    "source_score_run_id" "uuid",
    "source_recommendation_run_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "position_sizing_assessments_assessment_state_check" CHECK (("assessment_state" = ANY (ARRAY['READY'::"text", 'INSUFFICIENT_EVIDENCE'::"text", 'BLOCKED_PREREQUISITE'::"text", 'NOT_APPLICABLE'::"text"]))),
    CONSTRAINT "position_sizing_assessments_current_weight_check" CHECK ((("current_weight" >= (0)::numeric) AND ("current_weight" <= (100)::numeric))),
    CONSTRAINT "position_sizing_assessments_engine_version_check" CHECK (("length"("btrim"("engine_version")) > 0)),
    CONSTRAINT "position_sizing_assessments_evaluation_key_check" CHECK (("length"("btrim"("evaluation_key")) >= 16)),
    CONSTRAINT "position_sizing_assessments_evidence_confidence_check" CHECK ((("evidence_confidence" >= (0)::numeric) AND ("evidence_confidence" <= (100)::numeric))),
    CONSTRAINT "position_sizing_assessments_evidence_coverage_check" CHECK ((("evidence_coverage" >= (0)::numeric) AND ("evidence_coverage" <= (1)::numeric))),
    CONSTRAINT "position_sizing_assessments_input_snapshot_check" CHECK (("jsonb_typeof"("input_snapshot") = 'object'::"text")),
    CONSTRAINT "position_sizing_assessments_range_order" CHECK ((("suggested_minimum_weight" IS NULL) OR ("suggested_maximum_weight" IS NULL) OR ("suggested_minimum_weight" <= "suggested_maximum_weight"))),
    CONSTRAINT "position_sizing_assessments_rationale_check" CHECK (("jsonb_typeof"("rationale") = 'array'::"text")),
    CONSTRAINT "position_sizing_assessments_ready_shape" CHECK (((("assessment_state" = 'READY'::"text") AND ("research_profile_code" IS NOT NULL) AND ("research_profile_version" IS NOT NULL) AND ("current_weight" IS NOT NULL) AND ("suggested_target_weight" IS NOT NULL) AND ("suggested_minimum_weight" IS NOT NULL) AND ("suggested_maximum_weight" IS NOT NULL) AND ("recommended_action" IS NOT NULL) AND ("source_score_run_id" IS NOT NULL) AND ("source_recommendation_run_id" IS NOT NULL)) OR (("assessment_state" <> 'READY'::"text") AND ("suggested_target_weight" IS NULL) AND ("suggested_minimum_weight" IS NULL) AND ("suggested_maximum_weight" IS NULL) AND ("recommended_action" IS NULL)))),
    CONSTRAINT "position_sizing_assessments_recommended_action_check" CHECK ((("recommended_action" IS NULL) OR ("recommended_action" = ANY (ARRAY['ADD'::"text", 'HOLD'::"text", 'ADD_ON_WEAKNESS'::"text", 'REDUCE'::"text", 'TRIM_INTO_STRENGTH'::"text", 'FREEZE'::"text", 'EXIT_REVIEW'::"text"])))),
    CONSTRAINT "position_sizing_assessments_research_profile_code_check" CHECK ((("research_profile_code" IS NULL) OR ("length"("btrim"("research_profile_code")) > 0))),
    CONSTRAINT "position_sizing_assessments_research_profile_version_check" CHECK ((("research_profile_version" IS NULL) OR ("length"("btrim"("research_profile_version")) > 0))),
    CONSTRAINT "position_sizing_assessments_suggested_maximum_weight_check" CHECK ((("suggested_maximum_weight" >= (0)::numeric) AND ("suggested_maximum_weight" <= (100)::numeric))),
    CONSTRAINT "position_sizing_assessments_suggested_minimum_weight_check" CHECK ((("suggested_minimum_weight" >= (0)::numeric) AND ("suggested_minimum_weight" <= (100)::numeric))),
    CONSTRAINT "position_sizing_assessments_suggested_target_weight_check" CHECK ((("suggested_target_weight" >= (0)::numeric) AND ("suggested_target_weight" <= (100)::numeric))),
    CONSTRAINT "position_sizing_assessments_target_in_range" CHECK ((("suggested_target_weight" IS NULL) OR ("suggested_minimum_weight" IS NULL) OR ("suggested_maximum_weight" IS NULL) OR (("suggested_target_weight" >= "suggested_minimum_weight") AND ("suggested_target_weight" <= "suggested_maximum_weight"))))
);


ALTER TABLE "public"."position_sizing_assessments" OWNER TO "postgres";


COMMENT ON TABLE "public"."position_sizing_assessments" IS 'Append-only deterministic D35B position-sizing assessments. Engine output is separate from owner-controlled portfolio_security_settings.';



COMMENT ON COLUMN "public"."position_sizing_assessments"."evaluation_key" IS 'Stable SHA-256-style fingerprint/idempotency key derived from the canonical sizing input snapshot by trusted orchestration.';



COMMENT ON COLUMN "public"."position_sizing_assessments"."research_profile_code" IS 'Approved upstream sector/research profile used by the deterministic score/recommendation lineage.';



COMMENT ON COLUMN "public"."position_sizing_assessments"."research_profile_version" IS 'Version of the approved upstream sector/research profile; READY assessments require both profile code and version.';



COMMENT ON COLUMN "public"."position_sizing_assessments"."recommended_action" IS 'Sizing advisory action only. D35B intentionally has EXIT_REVIEW but no automatic EXIT action.';



COMMENT ON COLUMN "public"."position_sizing_assessments"."input_snapshot" IS 'Canonical structured inputs used by the deterministic engine, retained for reproducibility; never an AI-generated payload.';



CREATE TABLE IF NOT EXISTS "public"."provider_budget_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_code" "text" NOT NULL,
    "ingestion_run_id" "uuid" NOT NULL,
    "reservation_key" "text" NOT NULL,
    "estimated_units" integer NOT NULL,
    "consumed_units" integer DEFAULT 0 NOT NULL,
    "failed_units" integer DEFAULT 0 NOT NULL,
    "released_units" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'RESERVED'::"text" NOT NULL,
    "reserved_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "settled_at" timestamp with time zone,
    "policy_version" integer NOT NULL,
    CONSTRAINT "provider_budget_reservation_state" CHECK (((("status" = 'RESERVED'::"text") AND ("settled_at" IS NULL)) OR (("status" <> 'RESERVED'::"text") AND ("settled_at" IS NOT NULL)))),
    CONSTRAINT "provider_budget_reservation_totals" CHECK (((("consumed_units" + "failed_units") + "released_units") <= "estimated_units")),
    CONSTRAINT "provider_budget_reservations_consumed_units_check" CHECK (("consumed_units" >= 0)),
    CONSTRAINT "provider_budget_reservations_estimated_units_check" CHECK (("estimated_units" > 0)),
    CONSTRAINT "provider_budget_reservations_failed_units_check" CHECK (("failed_units" >= 0)),
    CONSTRAINT "provider_budget_reservations_policy_version_check" CHECK (("policy_version" > 0)),
    CONSTRAINT "provider_budget_reservations_released_units_check" CHECK (("released_units" >= 0)),
    CONSTRAINT "provider_budget_reservations_reservation_key_check" CHECK ((("reservation_key" = "btrim"("reservation_key")) AND ("reservation_key" <> ''::"text") AND ("length"("reservation_key") <= 200))),
    CONSTRAINT "provider_budget_reservations_status_check" CHECK (("status" = ANY (ARRAY['RESERVED'::"text", 'SETTLED'::"text", 'EXPIRED'::"text"])))
);


ALTER TABLE "public"."provider_budget_reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_control_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_code" "text" NOT NULL,
    "control_name" "text" NOT NULL,
    "previous_value" "jsonb",
    "new_value" "jsonb" NOT NULL,
    "actor_id" "uuid",
    "actor_kind" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "expires_at" timestamp with time zone,
    "policy_version" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "provider_control_events_actor_kind_check" CHECK (("actor_kind" = ANY (ARRAY['SERVICE_ROLE'::"text", 'DATABASE_ADMIN'::"text"]))),
    CONSTRAINT "provider_control_events_control_name_check" CHECK (("control_name" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "provider_control_events_policy_version_check" CHECK (("policy_version" > 0)),
    CONSTRAINT "provider_control_events_reason_check" CHECK ((("reason" = "btrim"("reason")) AND ("reason" <> ''::"text") AND ("length"("reason") <= 500)))
);


ALTER TABLE "public"."provider_control_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_usage_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_code" "text" NOT NULL,
    "ingestion_run_id" "uuid",
    "run_item_id" "uuid",
    "security_id" "uuid",
    "data_domain" "text",
    "operation_class" "text" NOT NULL,
    "accounting_class" "text" NOT NULL,
    "estimated_internal_units" integer DEFAULT 1 NOT NULL,
    "actual_internal_units" integer NOT NULL,
    "provider_reported_units" numeric,
    "attempted_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "outcome" "text" NOT NULL,
    "safe_error_code" "text",
    "retry_attempt" integer DEFAULT 0 NOT NULL,
    "idempotency_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "provider_usage_events_accounting_class_check" CHECK (("accounting_class" = ANY (ARRAY['PROVIDER_TOOL_ATTEMPT'::"text", 'TRANSPORT_BOOTSTRAP'::"text"]))),
    CONSTRAINT "provider_usage_events_actual_internal_units_check" CHECK (("actual_internal_units" >= 0)),
    CONSTRAINT "provider_usage_events_data_domain_check" CHECK ((("data_domain" IS NULL) OR ("data_domain" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "provider_usage_events_estimated_internal_units_check" CHECK (("estimated_internal_units" >= 0)),
    CONSTRAINT "provider_usage_events_idempotency_key_check" CHECK ((("idempotency_key" = "btrim"("idempotency_key")) AND ("idempotency_key" <> ''::"text"))),
    CONSTRAINT "provider_usage_events_operation_class_check" CHECK (("operation_class" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "provider_usage_events_outcome_check" CHECK (("outcome" = ANY (ARRAY['SUCCEEDED'::"text", 'FAILED'::"text", 'CANCELLED'::"text", 'UNKNOWN'::"text"]))),
    CONSTRAINT "provider_usage_events_retry_attempt_check" CHECK (("retry_attempt" >= 0)),
    CONSTRAINT "provider_usage_events_safe_error_code_check" CHECK ((("safe_error_code" IS NULL) OR ("safe_error_code" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "provider_usage_failed_counts" CHECK ((("accounting_class" <> 'PROVIDER_TOOL_ATTEMPT'::"text") OR ("actual_internal_units" = 1)))
);


ALTER TABLE "public"."provider_usage_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."provider_usage_events" IS 'Append-only internal provider-call accounting without credentials, headers, or request payloads.';



CREATE TABLE IF NOT EXISTS "public"."rating_agencies" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "country_code" "text",
    "website_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "rating_agency_code_shape" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text"))
);


ALTER TABLE "public"."rating_agencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recommendation_profile_policies" (
    "profile_code" "text" NOT NULL,
    "policy_version" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "min_score_ready_coverage" numeric DEFAULT 0.70 NOT NULL,
    "core_min_score" numeric,
    "satellite_min_score" numeric,
    "watch_min_score" numeric,
    "mandatory_dimension_floors" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "caution_rules" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sector_focus" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "persistence_rules" "jsonb" DEFAULT '{"upgrade_confirmations": 2, "downgrade_confirmations": 2}'::"jsonb" NOT NULL,
    "weight_policy" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "recommendation_profile_policies_core_min_score_check" CHECK ((("core_min_score" >= (0)::numeric) AND ("core_min_score" <= (100)::numeric))),
    CONSTRAINT "recommendation_profile_policies_min_score_ready_coverage_check" CHECK ((("min_score_ready_coverage" >= (0)::numeric) AND ("min_score_ready_coverage" <= (1)::numeric))),
    CONSTRAINT "recommendation_profile_policies_satellite_min_score_check" CHECK ((("satellite_min_score" >= (0)::numeric) AND ("satellite_min_score" <= (100)::numeric))),
    CONSTRAINT "recommendation_profile_policies_status_check" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'REVIEWED'::"text", 'ACTIVE'::"text", 'RETIRED'::"text"]))),
    CONSTRAINT "recommendation_profile_policies_watch_min_score_check" CHECK ((("watch_min_score" >= (0)::numeric) AND ("watch_min_score" <= (100)::numeric)))
);


ALTER TABLE "public"."recommendation_profile_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refresh_domain_policies" (
    "source_code" "text" NOT NULL,
    "data_domain" "text" NOT NULL,
    "policy_version" integer NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "freshness_seconds" integer,
    "freshness_basis" "text" NOT NULL,
    "cooldown_seconds" integer DEFAULT 0 NOT NULL,
    "retry_schedule_seconds" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "effective_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "effective_to" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "refresh_domain_policies_cooldown_seconds_check" CHECK (("cooldown_seconds" >= 0)),
    CONSTRAINT "refresh_domain_policies_data_domain_check" CHECK (("data_domain" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "refresh_domain_policies_definition_check" CHECK (("jsonb_typeof"("definition") = 'object'::"text")),
    CONSTRAINT "refresh_domain_policies_freshness_basis_check" CHECK (("freshness_basis" = ANY (ARRAY['ELAPSED_TIME'::"text", 'BUSINESS_DAY_APPROXIMATION'::"text", 'EVENT_WITH_BACKSTOP'::"text", 'DISABLED'::"text"]))),
    CONSTRAINT "refresh_domain_policies_freshness_seconds_check" CHECK ((("freshness_seconds" IS NULL) OR ("freshness_seconds" > 0))),
    CONSTRAINT "refresh_domain_policies_policy_version_check" CHECK (("policy_version" > 0)),
    CONSTRAINT "refresh_domain_policy_dates" CHECK ((("effective_to" IS NULL) OR ("effective_to" > "effective_from"))),
    CONSTRAINT "refresh_domain_policy_disabled" CHECK ((("is_enabled" AND ("freshness_basis" <> 'DISABLED'::"text")) OR ((NOT "is_enabled") AND ("freshness_basis" = 'DISABLED'::"text"))))
);


ALTER TABLE "public"."refresh_domain_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."research_document_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "research_document_id" "uuid" NOT NULL,
    "source_code" "text" NOT NULL,
    "source_record_id" "uuid" NOT NULL,
    "provider_document_id" "text",
    "source_url" "text",
    "source_title" "text",
    "source_version" "text",
    "source_published_at" timestamp with time zone,
    "retrieved_at" timestamp with time zone NOT NULL,
    "content_hash" "text",
    "extraction_method" "text",
    "extraction_version" "text",
    "extraction_provenance" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "research_document_source_provider_id_check" CHECK ((("provider_document_id" IS NULL) OR (("provider_document_id" = "btrim"("provider_document_id")) AND ("provider_document_id" <> ''::"text")))),
    CONSTRAINT "research_document_source_reference_check" CHECK ((("provider_document_id" IS NOT NULL) OR ("source_url" IS NOT NULL) OR ("content_hash" IS NOT NULL))),
    CONSTRAINT "research_document_source_url_check" CHECK ((("source_url" IS NULL) OR (("source_url" = "btrim"("source_url")) AND ("source_url" <> ''::"text")))),
    CONSTRAINT "research_document_sources_content_hash_check" CHECK ((("content_hash" IS NULL) OR ("content_hash" ~ '^[a-f0-9]{64}$'::"text"))),
    CONSTRAINT "research_document_sources_extraction_provenance_check" CHECK (("jsonb_typeof"("extraction_provenance") = 'object'::"text")),
    CONSTRAINT "research_document_sources_source_status_check" CHECK (("source_status" = ANY (ARRAY['OBSERVED'::"text", 'VERIFIED'::"text", 'REVIEW_REQUIRED'::"text", 'FAILED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."research_document_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."research_document_sources" IS 'Immutable provider/source appearances for one canonical research document. URLs are provenance, never canonical document identity.';



CREATE TABLE IF NOT EXISTS "public"."research_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "reporting_period_start" "date",
    "reporting_period_end" "date",
    "reporting_period_type" "text",
    "published_at" timestamp with time zone,
    "canonical_content_hash" "text",
    "authoritative_identifier_scheme" "text",
    "authoritative_identifier" "text",
    "metadata_identity_hash" "text",
    "identity_basis" "text" NOT NULL,
    "identity_status" "text" NOT NULL,
    "version_label" "text",
    "external_storage_reference" "text",
    "identity_evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "research_document_authoritative_identity_check" CHECK ((("authoritative_identifier_scheme" IS NULL) = ("authoritative_identifier" IS NULL))),
    CONSTRAINT "research_document_identity_basis_check" CHECK (((("identity_basis" = 'CONTENT_SHA256'::"text") AND ("canonical_content_hash" IS NOT NULL)) OR (("identity_basis" = 'AUTHORITATIVE_IDENTIFIER'::"text") AND ("authoritative_identifier_scheme" IS NOT NULL) AND ("authoritative_identifier" IS NOT NULL)) OR (("identity_basis" = 'VERIFIED_METADATA'::"text") AND ("metadata_identity_hash" IS NOT NULL)) OR (("identity_basis" = 'REVIEW_REQUIRED'::"text") AND ("identity_status" = 'REVIEW_REQUIRED'::"text")))),
    CONSTRAINT "research_document_period_check" CHECK ((("reporting_period_end" IS NULL) OR ("reporting_period_start" IS NULL) OR ("reporting_period_end" >= "reporting_period_start"))),
    CONSTRAINT "research_document_verified_identity_check" CHECK ((("identity_status" <> 'VERIFIED'::"text") OR ("identity_basis" <> 'REVIEW_REQUIRED'::"text"))),
    CONSTRAINT "research_documents_authoritative_identifier_check" CHECK ((("authoritative_identifier" IS NULL) OR (("authoritative_identifier" = "btrim"("authoritative_identifier")) AND ("authoritative_identifier" <> ''::"text")))),
    CONSTRAINT "research_documents_authoritative_identifier_scheme_check" CHECK ((("authoritative_identifier_scheme" IS NULL) OR ("authoritative_identifier_scheme" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "research_documents_canonical_content_hash_check" CHECK ((("canonical_content_hash" IS NULL) OR ("canonical_content_hash" ~ '^[a-f0-9]{64}$'::"text"))),
    CONSTRAINT "research_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['ANNUAL_REPORT'::"text", 'QUARTERLY_RESULT'::"text", 'INVESTOR_PRESENTATION'::"text", 'EARNINGS_CALL'::"text", 'SHAREHOLDING_FILING'::"text", 'EXCHANGE_REGULATORY_FILING'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "research_documents_identity_basis_check" CHECK (("identity_basis" = ANY (ARRAY['CONTENT_SHA256'::"text", 'AUTHORITATIVE_IDENTIFIER'::"text", 'VERIFIED_METADATA'::"text", 'REVIEW_REQUIRED'::"text"]))),
    CONSTRAINT "research_documents_identity_evidence_check" CHECK (("jsonb_typeof"("identity_evidence") = 'object'::"text")),
    CONSTRAINT "research_documents_identity_status_check" CHECK (("identity_status" = ANY (ARRAY['VERIFIED'::"text", 'REVIEW_REQUIRED'::"text"]))),
    CONSTRAINT "research_documents_metadata_identity_hash_check" CHECK ((("metadata_identity_hash" IS NULL) OR ("metadata_identity_hash" ~ '^[a-f0-9]{64}$'::"text"))),
    CONSTRAINT "research_documents_reporting_period_type_check" CHECK ((("reporting_period_type" IS NULL) OR ("reporting_period_type" = ANY (ARRAY['QUARTER'::"text", 'HALF_YEAR'::"text", 'YEAR'::"text", 'TTM'::"text"]))))
);


ALTER TABLE "public"."research_documents" OWNER TO "postgres";


COMMENT ON TABLE "public"."research_documents" IS 'Provider-independent immutable document identity and metadata only; large document bodies remain in approved external/object storage.';



CREATE TABLE IF NOT EXISTS "public"."research_subprofile_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "parent_profile_code" "text" NOT NULL,
    "parent_profile_version" "text" NOT NULL,
    "subprofile_code" "text" NOT NULL,
    "subprofile_version" "text" NOT NULL,
    "assignment_status" "text" NOT NULL,
    "confidence_state" "text" NOT NULL,
    "assignment_basis" "text" NOT NULL,
    "source_reference" "text" NOT NULL,
    "source_record_id" "uuid",
    "effective_from" timestamp with time zone NOT NULL,
    "effective_to" timestamp with time zone,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "retired_by" "uuid",
    "retired_at" timestamp with time zone,
    "retirement_reason" "text",
    "effective_period" "tstzrange" GENERATED ALWAYS AS ("tstzrange"("effective_from", "effective_to", '[)'::"text")) STORED,
    CONSTRAINT "research_subprofile_assignment_basis_nonempty" CHECK (("btrim"("assignment_basis") <> ''::"text")),
    CONSTRAINT "research_subprofile_assignment_confidence" CHECK (("confidence_state" = ANY (ARRAY['LOW'::"text", 'MEDIUM'::"text", 'HIGH'::"text"]))),
    CONSTRAINT "research_subprofile_assignment_interval" CHECK ((("effective_to" IS NULL) OR ("effective_to" > "effective_from"))),
    CONSTRAINT "research_subprofile_assignment_retirement_complete" CHECK ((("assignment_status" <> 'RETIRED'::"text") OR (("effective_to" IS NOT NULL) AND ("retired_by" IS NOT NULL) AND ("retired_at" IS NOT NULL) AND (NULLIF("btrim"(COALESCE("retirement_reason", ''::"text")), ''::"text") IS NOT NULL)))),
    CONSTRAINT "research_subprofile_assignment_review_complete" CHECK ((("assignment_status" <> 'REVIEWED'::"text") OR (("reviewed_by" IS NOT NULL) AND ("reviewed_at" IS NOT NULL) AND ("confidence_state" = ANY (ARRAY['MEDIUM'::"text", 'HIGH'::"text"]))))),
    CONSTRAINT "research_subprofile_assignment_source_nonempty" CHECK (("btrim"("source_reference") <> ''::"text")),
    CONSTRAINT "research_subprofile_assignment_status" CHECK (("assignment_status" = ANY (ARRAY['PROVISIONAL'::"text", 'REVIEWED'::"text", 'DISPUTED'::"text", 'RETIRED'::"text"])))
);


ALTER TABLE "public"."research_subprofile_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."research_subprofile_assignments" IS 'Global canonical research-subprofile assignment history keyed by security id. Non-resolved states must block subprofile readiness, scoring and recommendation.';



CREATE TABLE IF NOT EXISTS "public"."research_subprofile_contracts" (
    "parent_profile_code" "text" NOT NULL,
    "parent_profile_version" "text" NOT NULL,
    "subprofile_code" "text" NOT NULL,
    "subprofile_version" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "research_subprofile_contract_codes" CHECK ((("parent_profile_code" ~ '^[A-Z][A-Z0-9_]*$'::"text") AND ("parent_profile_version" ~ '^[A-Z][A-Z0-9_]*$'::"text") AND ("subprofile_code" ~ '^[A-Z][A-Z0-9_]*$'::"text") AND ("subprofile_version" ~ '^[A-Z][A-Z0-9_]*$'::"text"))),
    CONSTRAINT "research_subprofile_contract_display_name_nonempty" CHECK (("btrim"("display_name") <> ''::"text"))
);


ALTER TABLE "public"."research_subprofile_contracts" OWNER TO "postgres";


COMMENT ON TABLE "public"."research_subprofile_contracts" IS 'Immutable registered research-methodology subprofile versions; separate from application-wide security classification.';



CREATE TABLE IF NOT EXISTS "public"."research_subprofile_secondary_exposures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "parent_profile_code" "text" NOT NULL,
    "parent_profile_version" "text" NOT NULL,
    "subprofile_code" "text" NOT NULL,
    "subprofile_version" "text" NOT NULL,
    "materiality_state" "text" NOT NULL,
    "evidence_basis" "text" NOT NULL,
    "source_reference" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "research_subprofile_secondary_evidence_nonempty" CHECK (("btrim"("evidence_basis") <> ''::"text")),
    CONSTRAINT "research_subprofile_secondary_materiality" CHECK (("materiality_state" = ANY (ARRAY['UNASSESSED'::"text", 'IMMATERIAL'::"text", 'MATERIAL'::"text"]))),
    CONSTRAINT "research_subprofile_secondary_source_nonempty" CHECK (("btrim"("source_reference") <> ''::"text"))
);


ALTER TABLE "public"."research_subprofile_secondary_exposures" OWNER TO "postgres";


COMMENT ON TABLE "public"."research_subprofile_secondary_exposures" IS 'Evidence-backed secondary business-model exposures. They provide overlays and never blend or replace the primary effective contract.';



CREATE TABLE IF NOT EXISTS "public"."scoring_model_dimensions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scoring_model_id" "uuid" NOT NULL,
    "scoring_profile" "text" NOT NULL,
    "dimension_code" "text" NOT NULL,
    "weight" numeric(8,4) NOT NULL,
    "minimum_coverage" numeric(6,4) DEFAULT 0.6000 NOT NULL,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "scoring_dimension_coverage" CHECK ((("minimum_coverage" >= (0)::numeric) AND ("minimum_coverage" <= (1)::numeric))),
    CONSTRAINT "scoring_dimension_display_order" CHECK (("display_order" > 0)),
    CONSTRAINT "scoring_dimension_shape" CHECK (("dimension_code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "scoring_dimension_weight" CHECK ((("weight" >= (0)::numeric) AND ("weight" <= (100)::numeric))),
    CONSTRAINT "scoring_profile_shape" CHECK (("scoring_profile" ~ '^[A-Z0-9_]+$'::"text"))
);


ALTER TABLE "public"."scoring_model_dimensions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_model_metric_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scoring_model_id" "uuid" NOT NULL,
    "scoring_profile" "text" NOT NULL,
    "dimension_code" "text" NOT NULL,
    "input_code" "text" NOT NULL,
    "input_kind" "text" NOT NULL,
    "metric_code" "text",
    "preferred_source" "text",
    "provider_field_contract" "text",
    "metric_weight" numeric(8,4) NOT NULL,
    "direction" "text" NOT NULL,
    "rule_state" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "normalization_rule" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "scoring_rule_dimension_shape" CHECK (("dimension_code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "scoring_rule_direction" CHECK (("direction" = ANY (ARRAY['HIGHER_BETTER'::"text", 'LOWER_BETTER'::"text", 'ORDINAL'::"text", 'RELATIVE'::"text", 'CUSTOM'::"text"]))),
    CONSTRAINT "scoring_rule_display_order" CHECK (("display_order" > 0)),
    CONSTRAINT "scoring_rule_input_kind" CHECK (("input_kind" = ANY (ARRAY['FUNDAMENTAL'::"text", 'EXTERNAL_RATING'::"text", 'MARKET'::"text", 'DERIVED'::"text"]))),
    CONSTRAINT "scoring_rule_input_shape" CHECK (("input_code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "scoring_rule_normalization_object" CHECK (("jsonb_typeof"("normalization_rule") = 'object'::"text")),
    CONSTRAINT "scoring_rule_profile_shape" CHECK (("scoring_profile" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "scoring_rule_state" CHECK (("rule_state" = ANY (ARRAY['PENDING_SOURCE'::"text", 'DRAFT'::"text", 'REVIEWED'::"text", 'ACTIVE'::"text", 'RETIRED'::"text"]))),
    CONSTRAINT "scoring_rule_weight_range" CHECK ((("metric_weight" > (0)::numeric) AND ("metric_weight" <= (100)::numeric)))
);


ALTER TABLE "public"."scoring_model_metric_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."scoring_model_metric_rules" IS 'Versioned metric-level scoring contracts. PHARMA_V1 separates verified evidence coverage from score readiness; evidence-only parent contracts may be REVIEWED while score curves remain pending.';



CREATE TABLE IF NOT EXISTS "public"."scoring_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "version" integer NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "methodology" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "activated_at" timestamp with time zone,
    "retired_at" timestamp with time zone,
    CONSTRAINT "scoring_model_code_shape" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "scoring_model_methodology_object" CHECK (("jsonb_typeof"("methodology") = 'object'::"text")),
    CONSTRAINT "scoring_model_status" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'ACTIVE'::"text", 'RETIRED'::"text"]))),
    CONSTRAINT "scoring_model_version_positive" CHECK (("version" > 0))
);


ALTER TABLE "public"."scoring_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_profile_dimension_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scoring_model_id" "uuid" NOT NULL,
    "scoring_profile_code" "text" NOT NULL,
    "dimension_code" "text" NOT NULL,
    "weight" numeric(8,4) NOT NULL,
    "rationale" "text",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "scoring_profile_dimension_weight_range" CHECK ((("weight" >= (0)::numeric) AND ("weight" <= (100)::numeric)))
);


ALTER TABLE "public"."scoring_profile_dimension_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_profile_metric_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scoring_model_id" "uuid" NOT NULL,
    "scoring_profile_code" "text" NOT NULL,
    "dimension_code" "text" NOT NULL,
    "input_code" "text" NOT NULL,
    "applicability" "text" DEFAULT 'INHERIT'::"text" NOT NULL,
    "weight_multiplier" numeric(8,4) DEFAULT 1 NOT NULL,
    "rationale" "text",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "scoring_profile_metric_applicability" CHECK (("applicability" = ANY (ARRAY['INHERIT'::"text", 'REQUIRED'::"text", 'OPTIONAL'::"text", 'NOT_APPLICABLE'::"text"]))),
    CONSTRAINT "scoring_profile_metric_multiplier_positive" CHECK ((("weight_multiplier" >= (0)::numeric) AND ("weight_multiplier" <= (5)::numeric)))
);


ALTER TABLE "public"."scoring_profile_metric_overrides" OWNER TO "postgres";


COMMENT ON TABLE "public"."scoring_profile_metric_overrides" IS 'Sector-specific applicability and weighting overlays on GENERAL metric rules. No score is activated by these rows.';



CREATE TABLE IF NOT EXISTS "public"."scoring_profile_sector_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scoring_profile_code" "text" NOT NULL,
    "sector_pattern" "text" NOT NULL,
    "industry_pattern" "text",
    "priority" integer DEFAULT 100 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "scoring_profile_sector_priority_positive" CHECK (("priority" > 0))
);


ALTER TABLE "public"."scoring_profile_sector_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_profiles" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "parent_profile_code" "text",
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "scoring_profile_code_shape" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text"))
);


ALTER TABLE "public"."scoring_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."scoring_profiles" IS 'Sector-aware scoring profiles. GENERAL is the fallback for non-lender equities; BANK_NBFC is separate.';



CREATE TABLE IF NOT EXISTS "public"."sectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sectors_code_check" CHECK (("code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "sectors_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text")))
);


ALTER TABLE "public"."sectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_classification_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "old_asset_class" "text" NOT NULL,
    "new_asset_class" "text" NOT NULL,
    "old_instrument_type" "text" NOT NULL,
    "new_instrument_type" "text" NOT NULL,
    "evidence_reference" "text" NOT NULL,
    "applied_by" "uuid" NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."security_classification_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_classification_correction_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "proposed_asset_class" "text" NOT NULL,
    "proposed_instrument_type" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "evidence_reference" "text" NOT NULL,
    "request_status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_classification_correcti_proposed_instrument_type_check" CHECK ((("proposed_instrument_type" = "btrim"("proposed_instrument_type")) AND ("proposed_instrument_type" <> ''::"text"))),
    CONSTRAINT "security_classification_correction_r_proposed_asset_class_check" CHECK (("proposed_asset_class" = ANY (ARRAY['EQUITY'::"text", 'ETF'::"text", 'MUTUAL_FUND'::"text", 'GOLD'::"text", 'SILVER'::"text", 'BOND'::"text", 'CASH'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "security_classification_correction_req_evidence_reference_check" CHECK ((("evidence_reference" = "btrim"("evidence_reference")) AND (("length"("evidence_reference") >= 3) AND ("length"("evidence_reference") <= 2000)))),
    CONSTRAINT "security_classification_correction_request_request_status_check" CHECK (("request_status" = ANY (ARRAY['PENDING'::"text", 'APPLIED'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "security_classification_correction_requests_reason_check" CHECK ((("reason" = "btrim"("reason")) AND (("length"("reason") >= 3) AND ("length"("reason") <= 1000)))),
    CONSTRAINT "security_classification_correction_requests_review_notes_check" CHECK ((("review_notes" IS NULL) OR (("review_notes" = "btrim"("review_notes")) AND (("length"("review_notes") >= 3) AND ("length"("review_notes") <= 1000))))),
    CONSTRAINT "security_classification_review_state_check" CHECK (((("request_status" = 'PENDING'::"text") AND ("reviewed_by" IS NULL) AND ("reviewed_at" IS NULL) AND ("review_notes" IS NULL)) OR (("request_status" <> 'PENDING'::"text") AND ("reviewed_by" IS NOT NULL) AND ("reviewed_at" IS NOT NULL) AND ("review_notes" IS NOT NULL))))
);


ALTER TABLE "public"."security_classification_correction_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_company_profiles" (
    "security_id" "uuid" NOT NULL,
    "profile_status" "text" DEFAULT 'MISSING'::"text" NOT NULL,
    "about_summary" "text",
    "company_website_url" "text",
    "source_code" "text",
    "source_url" "text",
    "source_record_id" "uuid",
    "source_about_hash" "text",
    "logo_storage_path" "text",
    "logo_source_url" "text",
    "logo_content_type" "text",
    "about_retrieved_at" timestamp with time zone,
    "logo_retrieved_at" timestamp with time zone,
    "last_checked_at" timestamp with time zone,
    "last_safe_error_code" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_company_profile_ready_check" CHECK ((("profile_status" <> 'READY'::"text") OR (("about_summary" IS NOT NULL) AND ("logo_storage_path" IS NOT NULL)))),
    CONSTRAINT "security_company_profiles_about_summary_check" CHECK ((("about_summary" IS NULL) OR (("about_summary" = "btrim"("about_summary")) AND (("length"("about_summary") >= 1) AND ("length"("about_summary") <= 3000))))),
    CONSTRAINT "security_company_profiles_company_website_url_check" CHECK ((("company_website_url" IS NULL) OR ("company_website_url" ~ '^https?://'::"text"))),
    CONSTRAINT "security_company_profiles_last_safe_error_code_check" CHECK ((("last_safe_error_code" IS NULL) OR ("last_safe_error_code" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "security_company_profiles_logo_content_type_check" CHECK ((("logo_content_type" IS NULL) OR ("logo_content_type" = ANY (ARRAY['image/png'::"text", 'image/jpeg'::"text", 'image/webp'::"text", 'image/svg+xml'::"text"])))),
    CONSTRAINT "security_company_profiles_logo_source_url_check" CHECK ((("logo_source_url" IS NULL) OR ("logo_source_url" ~ '^https?://'::"text"))),
    CONSTRAINT "security_company_profiles_logo_storage_path_check" CHECK ((("logo_storage_path" IS NULL) OR (("logo_storage_path" = "btrim"("logo_storage_path")) AND ("logo_storage_path" <> ''::"text")))),
    CONSTRAINT "security_company_profiles_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "security_company_profiles_profile_status_check" CHECK (("profile_status" = ANY (ARRAY['MISSING'::"text", 'PARTIAL'::"text", 'READY'::"text", 'FAILED'::"text"]))),
    CONSTRAINT "security_company_profiles_source_about_hash_check" CHECK ((("source_about_hash" IS NULL) OR ("source_about_hash" ~ '^[a-f0-9]{64}$'::"text"))),
    CONSTRAINT "security_company_profiles_source_url_check" CHECK ((("source_url" IS NULL) OR ("source_url" ~ '^https?://'::"text")))
);


ALTER TABLE "public"."security_company_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_company_profiles" IS 'Cached, provenance-linked company About summary and presentation logo. Provider pages are not fetched on normal Research page loads.';



CREATE TABLE IF NOT EXISTS "public"."security_creation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "idempotency_key" "uuid" NOT NULL,
    "request_hash" "text" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_creation_requests_request_hash_check" CHECK (("request_hash" ~ '^[0-9a-f]{64}$'::"text"))
);


ALTER TABLE "public"."security_creation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_enrichment_correction_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "target_kind" "text" NOT NULL,
    "target_code" "text" NOT NULL,
    "proposed_value" "jsonb" NOT NULL,
    "reason" "text" NOT NULL,
    "request_status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enrichment_correction_review_check" CHECK (((("request_status" = 'PENDING'::"text") AND ("reviewed_by" IS NULL) AND ("reviewed_at" IS NULL)) OR (("request_status" <> 'PENDING'::"text") AND ("reviewed_by" IS NOT NULL) AND ("reviewed_at" IS NOT NULL)))),
    CONSTRAINT "security_enrichment_correction_requests_proposed_value_check" CHECK (("jsonb_typeof"("proposed_value") = 'object'::"text")),
    CONSTRAINT "security_enrichment_correction_requests_reason_check" CHECK ((("reason" = "btrim"("reason")) AND ("reason" <> ''::"text"))),
    CONSTRAINT "security_enrichment_correction_requests_request_status_check" CHECK (("request_status" = ANY (ARRAY['PENDING'::"text", 'APPLIED'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "security_enrichment_correction_requests_target_kind_check" CHECK (("target_kind" = ANY (ARRAY['ATTRIBUTE'::"text", 'FUNDAMENTAL'::"text", 'IDENTITY'::"text", 'MARKET_CAP_CATEGORY'::"text"])))
);


ALTER TABLE "public"."security_enrichment_correction_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_identifiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "identifier_type" "text" NOT NULL,
    "identifier_value" "text" NOT NULL,
    "provider_code" "text" NOT NULL,
    "exchange" "text",
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_identifiers_exchange_check" CHECK ((("exchange" IS NULL) OR ("exchange" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "security_identifiers_identifier_type_check" CHECK ((("identifier_type" ~ '^[A-Z0-9_]+$'::"text") AND ("identifier_type" <> 'ISIN'::"text"))),
    CONSTRAINT "security_identifiers_identifier_value_check" CHECK ((("identifier_value" = "btrim"("identifier_value")) AND ("identifier_value" <> ''::"text"))),
    CONSTRAINT "security_identifiers_provider_code_check" CHECK (("provider_code" ~ '^[A-Z0-9_]+$'::"text"))
);


ALTER TABLE "public"."security_identifiers" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_identifiers" IS 'Alternate/provider identifiers only; reference-master writes use trusted ingestion or server-side processes.';



COMMENT ON COLUMN "public"."security_identifiers"."provider_code" IS 'Normalized code for the exchange, broker, or data provider that issued the identifier.';



CREATE TABLE IF NOT EXISTS "public"."security_identity_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid",
    "listing_id" "uuid",
    "source_record_id" "uuid" NOT NULL,
    "source_code" "text" NOT NULL,
    "observed_name" "text",
    "observed_isin" "text",
    "observed_exchange" "text",
    "observed_symbol" "text",
    "observed_series" "text",
    "evidence_status" "text" DEFAULT 'OBSERVED'::"text" NOT NULL,
    "confidence" numeric(5,4),
    "observed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider_instrument_id" "text",
    CONSTRAINT "security_identity_observations_confidence_check" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))),
    CONSTRAINT "security_identity_observations_evidence_status_check" CHECK (("evidence_status" = ANY (ARRAY['OBSERVED'::"text", 'MATCHED'::"text", 'AMBIGUOUS'::"text", 'CONFLICTING'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "security_identity_observations_observed_isin_check" CHECK ((("observed_isin" IS NULL) OR ("observed_isin" ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'::"text"))),
    CONSTRAINT "security_identity_observations_provider_id_check" CHECK ((("provider_instrument_id" IS NULL) OR (("provider_instrument_id" = "btrim"("provider_instrument_id")) AND ("provider_instrument_id" <> ''::"text"))))
);


ALTER TABLE "public"."security_identity_observations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."security_identity_observations"."provider_instrument_id" IS 'Provider-scoped stable instrument identifier retained as evidence; never a canonical PortfolioAI security identifier.';



CREATE TABLE IF NOT EXISTS "public"."security_reconciliation_candidates" (
    "case_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "match_basis" "text" NOT NULL,
    "confidence" numeric(5,4) NOT NULL,
    "evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "security_reconciliation_candidates_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "security_reconciliation_candidates_evidence_check" CHECK (("jsonb_typeof"("evidence") = 'object'::"text")),
    CONSTRAINT "security_reconciliation_candidates_match_basis_check" CHECK (("match_basis" = ANY (ARRAY['ISIN_EXACT'::"text", 'EXCHANGE_SYMBOL_EXACT'::"text", 'NAME_SIMILARITY'::"text", 'MANUAL'::"text"])))
);


ALTER TABLE "public"."security_reconciliation_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_reconciliation_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_record_id" "uuid" NOT NULL,
    "case_status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "reason_code" "text" NOT NULL,
    "resolved_security_id" "uuid",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_reconciliation_cases_case_status_check" CHECK (("case_status" = ANY (ARRAY['OPEN'::"text", 'RESOLVED'::"text", 'REJECTED'::"text"]))),
    CONSTRAINT "security_reconciliation_cases_reason_code_check" CHECK (("reason_code" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "security_reconciliation_resolution_check" CHECK (((("case_status" = 'OPEN'::"text") AND ("reviewed_by" IS NULL) AND ("reviewed_at" IS NULL)) OR (("case_status" <> 'OPEN'::"text") AND ("reviewed_by" IS NOT NULL) AND ("reviewed_at" IS NOT NULL))))
);


ALTER TABLE "public"."security_reconciliation_cases" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_reconciliation_cases" IS 'Ambiguous identities are quarantined for explicit review; they are never guessed into the canonical security master.';



CREATE TABLE IF NOT EXISTS "public"."security_refresh_states" (
    "source_code" "text" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "data_domain" "text" NOT NULL,
    "last_attempt_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "last_evidence_change_at" timestamp with time zone,
    "fresh_until" timestamp with time zone,
    "next_eligible_refresh_at" timestamp with time zone,
    "consecutive_failures" integer DEFAULT 0 NOT NULL,
    "last_safe_error_code" "text",
    "last_run_id" "uuid",
    "refresh_status" "text" DEFAULT 'MISSING'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_refresh_states_consecutive_failures_check" CHECK (("consecutive_failures" >= 0)),
    CONSTRAINT "security_refresh_states_data_domain_check" CHECK (("data_domain" ~ '^[A-Z0-9_]+$'::"text")),
    CONSTRAINT "security_refresh_states_last_safe_error_code_check" CHECK ((("last_safe_error_code" IS NULL) OR ("last_safe_error_code" ~ '^[A-Z0-9_]+$'::"text"))),
    CONSTRAINT "security_refresh_states_refresh_status_check" CHECK (("refresh_status" = ANY (ARRAY['MISSING'::"text", 'FRESH'::"text", 'STALE'::"text", 'COOLDOWN'::"text", 'FAILED_WITH_CACHE'::"text", 'FAILED_NO_CACHE'::"text"])))
);


ALTER TABLE "public"."security_refresh_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_refresh_states" IS 'Mutable operational refresh projection; immutable evidence remains authoritative.';



CREATE TABLE IF NOT EXISTS "public"."security_scoring_profile_assignments" (
    "security_id" "uuid" NOT NULL,
    "scoring_profile_code" "text" NOT NULL,
    "assignment_status" "text" DEFAULT 'REVIEWED'::"text" NOT NULL,
    "assignment_basis" "text" NOT NULL,
    "source_reference" "text",
    "assigned_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "security_scoring_profile_assignment_basis_nonempty" CHECK (("length"(TRIM(BOTH FROM "assignment_basis")) > 0)),
    CONSTRAINT "security_scoring_profile_assignment_status" CHECK (("assignment_status" = ANY (ARRAY['PROVISIONAL'::"text", 'REVIEWED'::"text", 'RETIRED'::"text"])))
);


ALTER TABLE "public"."security_scoring_profile_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_scoring_profile_assignments" IS 'Explicit reviewed scoring-profile assignments used when trusted sector/industry enrichment is unavailable or requires override. These assignments affect scoring methodology only and never portfolio membership or Core/Satellite role.';



CREATE TABLE IF NOT EXISTS "public"."stock_dimension_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "score_run_id" "uuid" NOT NULL,
    "dimension_code" "text" NOT NULL,
    "dimension_weight" numeric(8,4) NOT NULL,
    "raw_score" numeric(6,2),
    "weighted_contribution" numeric(8,4),
    "evidence_coverage" numeric(6,4) DEFAULT 0 NOT NULL,
    "confidence" numeric(6,2) DEFAULT 0 NOT NULL,
    "heat_state" "text" DEFAULT 'INSUFFICIENT'::"text" NOT NULL,
    "rationale" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "stock_dimension_confidence_range" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (100)::numeric))),
    CONSTRAINT "stock_dimension_coverage_range" CHECK ((("evidence_coverage" >= (0)::numeric) AND ("evidence_coverage" <= (1)::numeric))),
    CONSTRAINT "stock_dimension_heat_state" CHECK (("heat_state" = ANY (ARRAY['STRONG'::"text", 'POSITIVE'::"text", 'NEUTRAL'::"text", 'WEAK'::"text", 'RISK'::"text", 'INSUFFICIENT'::"text"]))),
    CONSTRAINT "stock_dimension_rationale_object" CHECK (("jsonb_typeof"("rationale") = 'object'::"text")),
    CONSTRAINT "stock_dimension_raw_range" CHECK ((("raw_score" IS NULL) OR (("raw_score" >= (0)::numeric) AND ("raw_score" <= (100)::numeric)))),
    CONSTRAINT "stock_dimension_weight_range" CHECK ((("dimension_weight" >= (0)::numeric) AND ("dimension_weight" <= (100)::numeric)))
);


ALTER TABLE "public"."stock_dimension_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_metric_score_inputs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dimension_score_id" "uuid" NOT NULL,
    "metric_code" "text",
    "fundamental_observation_id" "uuid",
    "external_rating_observation_id" "uuid",
    "input_label" "text" NOT NULL,
    "observed_numeric_value" numeric,
    "observed_text_value" "text",
    "normalized_score" numeric(6,2),
    "metric_weight" numeric(8,4) NOT NULL,
    "contribution" numeric(8,4),
    "input_state" "text" DEFAULT 'AVAILABLE'::"text" NOT NULL,
    "normalization_rule" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "stock_metric_input_state" CHECK (("input_state" = ANY (ARRAY['AVAILABLE'::"text", 'STALE'::"text", 'CONFLICTING'::"text", 'INSUFFICIENT'::"text", 'NOT_APPLICABLE'::"text"]))),
    CONSTRAINT "stock_metric_one_evidence_source" CHECK (("num_nonnulls"("fundamental_observation_id", "external_rating_observation_id") <= 1)),
    CONSTRAINT "stock_metric_rule_object" CHECK (("jsonb_typeof"("normalization_rule") = 'object'::"text")),
    CONSTRAINT "stock_metric_score_range" CHECK ((("normalized_score" IS NULL) OR (("normalized_score" >= (0)::numeric) AND ("normalized_score" <= (100)::numeric)))),
    CONSTRAINT "stock_metric_weight_range" CHECK ((("metric_weight" >= (0)::numeric) AND ("metric_weight" <= (100)::numeric)))
);


ALTER TABLE "public"."stock_metric_score_inputs" OWNER TO "postgres";


COMMENT ON TABLE "public"."stock_metric_score_inputs" IS 'Audit trail of the exact observations/rating evidence and normalization rules used by a dimension score.';



CREATE TABLE IF NOT EXISTS "public"."stock_recommendation_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "scoring_profile_code" "text" NOT NULL,
    "recommendation_policy_version" integer NOT NULL,
    "source_score_run_id" "uuid",
    "run_state" "text" DEFAULT 'PREVIEW'::"text" NOT NULL,
    "overall_score" numeric,
    "score_ready_coverage" numeric,
    "evidence_confidence" numeric,
    "suggested_role" "text" NOT NULL,
    "action_bias" "text",
    "current_user_role" "text",
    "current_weight" numeric,
    "suggested_weight_min" numeric,
    "suggested_weight_max" numeric,
    "change_signal" "text",
    "persistence_count" integer DEFAULT 1 NOT NULL,
    "rationale" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ai_summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "evaluation_key" "text",
    "transition_status" "text" DEFAULT 'INITIAL'::"text",
    "ai_interpretation" "jsonb",
    "ai_interpretation_input_hash" "text",
    "ai_interpretation_provider" "text",
    "ai_interpretation_model" "text",
    "ai_interpretation_generated_at" timestamp with time zone,
    "ai_interpretation_status" "text",
    "ai_interpretation_usage" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "stock_recommendation_runs_action_bias_check" CHECK ((("action_bias" IS NULL) OR ("action_bias" = ANY (ARRAY['ACCUMULATE'::"text", 'HOLD'::"text", 'REDUCE'::"text", 'EXIT_CANDIDATE'::"text", 'WAIT'::"text"])))),
    CONSTRAINT "stock_recommendation_runs_ai_interpretation_status_check" CHECK ((("ai_interpretation_status" IS NULL) OR ("ai_interpretation_status" = ANY (ARRAY['READY'::"text", 'FAILED'::"text", 'STALE'::"text"])))),
    CONSTRAINT "stock_recommendation_runs_change_signal_check" CHECK ((("change_signal" IS NULL) OR ("change_signal" = ANY (ARRAY['UPGRADE'::"text", 'DOWNGRADE'::"text", 'UNCHANGED'::"text", 'INITIAL'::"text"])))),
    CONSTRAINT "stock_recommendation_runs_evidence_confidence_check" CHECK ((("evidence_confidence" >= (0)::numeric) AND ("evidence_confidence" <= (100)::numeric))),
    CONSTRAINT "stock_recommendation_runs_overall_score_check" CHECK ((("overall_score" >= (0)::numeric) AND ("overall_score" <= (100)::numeric))),
    CONSTRAINT "stock_recommendation_runs_persistence_count_check" CHECK (("persistence_count" >= 1)),
    CONSTRAINT "stock_recommendation_runs_run_state_check" CHECK (("run_state" = ANY (ARRAY['PREVIEW'::"text", 'OFFICIAL'::"text", 'SUPERSEDED'::"text"]))),
    CONSTRAINT "stock_recommendation_runs_score_ready_coverage_check" CHECK ((("score_ready_coverage" >= (0)::numeric) AND ("score_ready_coverage" <= (1)::numeric))),
    CONSTRAINT "stock_recommendation_runs_suggested_role_check" CHECK (("suggested_role" = ANY (ARRAY['CORE_CANDIDATE'::"text", 'SATELLITE_CANDIDATE'::"text", 'WATCH'::"text", 'AVOID'::"text", 'INSUFFICIENT'::"text"]))),
    CONSTRAINT "stock_recommendation_runs_transition_status_check" CHECK (("transition_status" = ANY (ARRAY['INITIAL'::"text", 'STABLE'::"text", 'EVIDENCE_PENDING'::"text", 'PENDING_UPGRADE'::"text", 'CONFIRMED_UPGRADE'::"text", 'PENDING_DOWNGRADE'::"text", 'CONFIRMED_DOWNGRADE'::"text"])))
);


ALTER TABLE "public"."stock_recommendation_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_score_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "security_id" "uuid" NOT NULL,
    "scoring_model_id" "uuid" NOT NULL,
    "scoring_profile" "text" NOT NULL,
    "as_of_date" "date" NOT NULL,
    "run_state" "text" DEFAULT 'PARTIAL'::"text" NOT NULL,
    "overall_score" numeric(6,2),
    "evidence_coverage" numeric(6,4) DEFAULT 0 NOT NULL,
    "evidence_confidence" numeric(6,2) DEFAULT 0 NOT NULL,
    "freshness_factor" numeric(6,4) DEFAULT 1 NOT NULL,
    "evidence_quality_factor" numeric(6,4) DEFAULT 1 NOT NULL,
    "summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "stock_score_confidence_range" CHECK ((("evidence_confidence" >= (0)::numeric) AND ("evidence_confidence" <= (100)::numeric))),
    CONSTRAINT "stock_score_coverage_range" CHECK ((("evidence_coverage" >= (0)::numeric) AND ("evidence_coverage" <= (1)::numeric))),
    CONSTRAINT "stock_score_freshness_range" CHECK ((("freshness_factor" >= (0)::numeric) AND ("freshness_factor" <= (1)::numeric))),
    CONSTRAINT "stock_score_overall_range" CHECK ((("overall_score" IS NULL) OR (("overall_score" >= (0)::numeric) AND ("overall_score" <= (100)::numeric)))),
    CONSTRAINT "stock_score_quality_factor_range" CHECK ((("evidence_quality_factor" >= (0)::numeric) AND ("evidence_quality_factor" <= (1)::numeric))),
    CONSTRAINT "stock_score_run_state" CHECK (("run_state" = ANY (ARRAY['PARTIAL'::"text", 'SCORABLE'::"text", 'FINAL'::"text", 'FAILED'::"text"]))),
    CONSTRAINT "stock_score_summary_object" CHECK (("jsonb_typeof"("summary") = 'object'::"text"))
);


ALTER TABLE "public"."stock_score_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."stock_score_runs" IS 'Versioned deterministic stock scoring runs. Historical runs are retained against their scoring model version.';



CREATE TABLE IF NOT EXISTS "public"."theme_securities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "theme_id" "uuid" NOT NULL,
    "security_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."theme_securities" OWNER TO "postgres";


COMMENT ON TABLE "public"."theme_securities" IS 'Portfolio-safe many-to-many theme membership for transaction-derived open holdings; independent of primary portfolio role.';



CREATE TABLE IF NOT EXISTS "public"."themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "max_allocation" numeric(9,6),
    "priority" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "themes_description_check" CHECK ((("description" IS NULL) OR ("description" = "btrim"("description")))),
    CONSTRAINT "themes_max_allocation_check" CHECK ((("max_allocation" IS NULL) OR (("max_allocation" >= (0)::numeric) AND ("max_allocation" <= (100)::numeric)))),
    CONSTRAINT "themes_name_check" CHECK ((("name" = "btrim"("name")) AND ("name" <> ''::"text"))),
    CONSTRAINT "themes_priority_check" CHECK ((("priority" IS NULL) OR ("priority" >= 0)))
);


ALTER TABLE "public"."themes" OWNER TO "postgres";


COMMENT ON TABLE "public"."themes" IS 'User-controlled portfolio themes. These are classifications, not analytical scores or recommendations.';



CREATE TABLE IF NOT EXISTS "public"."transaction_accounting_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portfolio_id" "uuid" NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "prior_accounting_status" "text" NOT NULL,
    "resulting_accounting_status" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "idempotency_key" "uuid" NOT NULL,
    "request_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transaction_accounting_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['VOID'::"text", 'RESTORE'::"text"]))),
    CONSTRAINT "transaction_accounting_events_prior_accounting_status_check" CHECK (("prior_accounting_status" = ANY (ARRAY['ACTIVE'::"text", 'REVERSED'::"text"]))),
    CONSTRAINT "transaction_accounting_events_reason_check" CHECK ((("reason" = "btrim"("reason")) AND (("length"("reason") >= 3) AND ("length"("reason") <= 1000)))),
    CONSTRAINT "transaction_accounting_events_request_hash_check" CHECK (("request_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "transaction_accounting_events_resulting_accounting_status_check" CHECK (("resulting_accounting_status" = ANY (ARRAY['ACTIVE'::"text", 'REVERSED'::"text"])))
);


ALTER TABLE "public"."transaction_accounting_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."transaction_accounting_events" IS 'Append-only audit evidence for trusted transaction void and restore operations. It never replaces or deletes the original transaction.';



CREATE TABLE IF NOT EXISTS "public"."transaction_correction_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "idempotency_key" "uuid" NOT NULL,
    "request_hash" "text" NOT NULL,
    "original_transaction_id" "uuid" NOT NULL,
    "corrected_transaction_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transaction_correction_requests_request_hash_check" CHECK (("request_hash" ~ '^[0-9a-f]{64}$'::"text"))
);


ALTER TABLE "public"."transaction_correction_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."transaction_correction_requests" IS 'Server-owned idempotency and audit ledger for trusted transaction corrections.';



ALTER TABLE ONLY "public"."broker_accounts"
    ADD CONSTRAINT "broker_accounts_id_portfolio_key" UNIQUE ("id", "portfolio_id");



ALTER TABLE ONLY "public"."broker_accounts"
    ADD CONSTRAINT "broker_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classification_source_mappings"
    ADD CONSTRAINT "classification_source_mapping_source_code_taxonomy_code_tax_key" UNIQUE NULLS NOT DISTINCT ("source_code", "taxonomy_code", "taxonomy_version", "source_sector", "source_industry");



ALTER TABLE ONLY "public"."classification_source_mappings"
    ADD CONSTRAINT "classification_source_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classification_taxonomies"
    ADD CONSTRAINT "classification_taxonomies_pkey" PRIMARY KEY ("code", "version");



ALTER TABLE ONLY "public"."data_ingestion_leases"
    ADD CONSTRAINT "data_ingestion_leases_pkey" PRIMARY KEY ("source_code", "operation");



ALTER TABLE ONLY "public"."data_ingestion_run_items"
    ADD CONSTRAINT "data_ingestion_run_items_key" UNIQUE ("ingestion_run_id", "security_id", "data_domain");



ALTER TABLE ONLY "public"."data_ingestion_run_items"
    ADD CONSTRAINT "data_ingestion_run_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_ingestion_runs"
    ADD CONSTRAINT "data_ingestion_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_source_records"
    ADD CONSTRAINT "data_source_records_dedup_key" UNIQUE NULLS NOT DISTINCT ("source_code", "record_kind", "external_record_id", "payload_hash");



ALTER TABLE ONLY "public"."data_source_records"
    ADD CONSTRAINT "data_source_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_sources"
    ADD CONSTRAINT "data_sources_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."enrichment_decision_events"
    ADD CONSTRAINT "enrichment_decision_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_rating_observations"
    ADD CONSTRAINT "external_rating_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fundamental_metric_definitions"
    ADD CONSTRAINT "fundamental_metric_definitions_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."fundamental_observation_decisions"
    ADD CONSTRAINT "fundamental_observation_decis_security_id_metric_code_perio_key" UNIQUE NULLS NOT DISTINCT ("security_id", "metric_code", "period_end", "period_type", "consolidation_scope");



ALTER TABLE ONLY "public"."fundamental_observations"
    ADD CONSTRAINT "fundamental_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fundamental_observations"
    ADD CONSTRAINT "fundamental_observations_security_id_metric_code_source_cod_key" UNIQUE NULLS NOT DISTINCT ("security_id", "metric_code", "source_code", "period_end", "period_type", "consolidation_scope", "source_record_id");



ALTER TABLE ONLY "public"."fundamental_reconciliation_cases"
    ADD CONSTRAINT "fundamental_reconciliation_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fundamental_reconciliation_events"
    ADD CONSTRAINT "fundamental_reconciliation_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fundamental_reconciliation_members"
    ADD CONSTRAINT "fundamental_reconciliation_members_pkey" PRIMARY KEY ("case_id", "observation_id");



ALTER TABLE ONLY "public"."import_batches"
    ADD CONSTRAINT "import_batches_id_portfolio_key" UNIQUE ("id", "portfolio_id");



ALTER TABLE ONLY "public"."import_batches"
    ADD CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_source_rows"
    ADD CONSTRAINT "import_source_rows_batch_row_key" UNIQUE ("import_batch_id", "row_number");



ALTER TABLE ONLY "public"."import_source_rows"
    ADD CONSTRAINT "import_source_rows_id_batch_portfolio_key" UNIQUE ("id", "import_batch_id", "portfolio_id");



ALTER TABLE ONLY "public"."import_source_rows"
    ADD CONSTRAINT "import_source_rows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."industries"
    ADD CONSTRAINT "industries_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."industries"
    ADD CONSTRAINT "industries_id_sector_key" UNIQUE ("id", "sector_id");



ALTER TABLE ONLY "public"."industries"
    ADD CONSTRAINT "industries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_transaction_requests"
    ADD CONSTRAINT "manual_transaction_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_transaction_requests"
    ADD CONSTRAINT "manual_transaction_requests_user_key" UNIQUE ("user_id", "idempotency_key");



ALTER TABLE ONLY "public"."market_benchmark_price_history"
    ADD CONSTRAINT "market_benchmark_price_histor_benchmark_code_provider_code__key" UNIQUE ("benchmark_code", "provider_code", "interval", "period_start");



ALTER TABLE ONLY "public"."market_benchmark_price_history"
    ADD CONSTRAINT "market_benchmark_price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_benchmarks"
    ADD CONSTRAINT "market_benchmarks_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."market_cap_category_assessments"
    ADD CONSTRAINT "market_cap_category_assessments_pkey" PRIMARY KEY ("security_id", "policy_code", "policy_version");



ALTER TABLE ONLY "public"."market_cap_classification_observations"
    ADD CONSTRAINT "market_cap_classification_obs_security_id_source_code_as_of_key" UNIQUE ("security_id", "source_code", "as_of_date", "capitalization_basis", "source_record_id");



ALTER TABLE ONLY "public"."market_cap_classification_observations"
    ADD CONSTRAINT "market_cap_classification_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_cap_classification_policies"
    ADD CONSTRAINT "market_cap_classification_policies_pkey" PRIMARY KEY ("code", "version");



ALTER TABLE ONLY "public"."market_data_instrument_mappings"
    ADD CONSTRAINT "market_data_instrument_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_data_instrument_mappings"
    ADD CONSTRAINT "market_data_mapping_composite_identity_key" UNIQUE ("id", "security_id", "provider_code");



ALTER TABLE ONLY "public"."market_data_mapping_reviews"
    ADD CONSTRAINT "market_data_mapping_review_status_key" UNIQUE ("mapping_id", "review_status");



ALTER TABLE ONLY "public"."market_data_mapping_reviews"
    ADD CONSTRAINT "market_data_mapping_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_data_instrument_mappings"
    ADD CONSTRAINT "market_data_mapping_security_provider_key" UNIQUE ("security_id", "provider_code");



ALTER TABLE ONLY "public"."market_data_operation_leases"
    ADD CONSTRAINT "market_data_operation_leases_pkey" PRIMARY KEY ("provider_code", "operation");



ALTER TABLE ONLY "public"."market_data_providers"
    ADD CONSTRAINT "market_data_providers_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."market_data_refresh_runs"
    ADD CONSTRAINT "market_data_refresh_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_metric_observations"
    ADD CONSTRAINT "market_metric_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_metric_observations"
    ADD CONSTRAINT "market_metric_observations_security_id_provider_code_metric_key" UNIQUE ("security_id", "provider_code", "metric_code", "as_of_date");



ALTER TABLE ONLY "public"."market_price_history"
    ADD CONSTRAINT "market_price_history_pkey" PRIMARY KEY ("security_id", "provider_code", "interval", "period_start");



ALTER TABLE ONLY "public"."market_price_latest"
    ADD CONSTRAINT "market_price_latest_mapping_identity_key" UNIQUE ("mapping_id");



ALTER TABLE ONLY "public"."market_price_latest"
    ADD CONSTRAINT "market_price_latest_pkey" PRIMARY KEY ("security_id", "provider_code");



ALTER TABLE ONLY "public"."news_classification_events"
    ADD CONSTRAINT "news_classification_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_items"
    ADD CONSTRAINT "news_items_canonical_key_key" UNIQUE ("canonical_key");



ALTER TABLE ONLY "public"."news_items"
    ADD CONSTRAINT "news_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_pipeline_leases"
    ADD CONSTRAINT "news_pipeline_leases_pkey" PRIMARY KEY ("source_code", "portfolio_id");



ALTER TABLE ONLY "public"."news_source_appearances"
    ADD CONSTRAINT "news_source_appearances_dedupe" UNIQUE ("source_code", "dedupe_key");



ALTER TABLE ONLY "public"."news_source_appearances"
    ADD CONSTRAINT "news_source_appearances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portfolio_security_settings"
    ADD CONSTRAINT "portfolio_security_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portfolio_security_settings"
    ADD CONSTRAINT "portfolio_security_settings_portfolio_security_key" UNIQUE ("portfolio_id", "security_id");



ALTER TABLE ONLY "public"."portfolios"
    ADD CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_sizing_assessments"
    ADD CONSTRAINT "position_sizing_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_budget_reservations"
    ADD CONSTRAINT "provider_budget_reservation_key" UNIQUE ("source_code", "reservation_key");



ALTER TABLE ONLY "public"."provider_budget_reservations"
    ADD CONSTRAINT "provider_budget_reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_control_events"
    ADD CONSTRAINT "provider_control_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_ingestion_controls"
    ADD CONSTRAINT "provider_ingestion_controls_pkey" PRIMARY KEY ("source_code");



ALTER TABLE ONLY "public"."provider_usage_events"
    ADD CONSTRAINT "provider_usage_events_key" UNIQUE ("source_code", "idempotency_key");



ALTER TABLE ONLY "public"."provider_usage_events"
    ADD CONSTRAINT "provider_usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rating_agencies"
    ADD CONSTRAINT "rating_agencies_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."recommendation_profile_policies"
    ADD CONSTRAINT "recommendation_profile_policies_pkey" PRIMARY KEY ("profile_code", "policy_version");



ALTER TABLE ONLY "public"."refresh_domain_policies"
    ADD CONSTRAINT "refresh_domain_policies_pkey" PRIMARY KEY ("source_code", "data_domain", "policy_version");



ALTER TABLE ONLY "public"."research_document_sources"
    ADD CONSTRAINT "research_document_source_dedup_key" UNIQUE NULLS NOT DISTINCT ("source_code", "provider_document_id", "source_url", "content_hash");



ALTER TABLE ONLY "public"."research_document_sources"
    ADD CONSTRAINT "research_document_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_documents"
    ADD CONSTRAINT "research_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_no_reviewed_overlap" EXCLUDE USING "gist" ("security_id" WITH =, "parent_profile_code" WITH =, "effective_period" WITH &&) WHERE (("assignment_status" = ANY (ARRAY['REVIEWED'::"text", 'RETIRED'::"text"])));



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_subprofile_contracts"
    ADD CONSTRAINT "research_subprofile_contracts_pkey" PRIMARY KEY ("parent_profile_code", "parent_profile_version", "subprofile_code", "subprofile_version");



ALTER TABLE ONLY "public"."research_subprofile_secondary_exposures"
    ADD CONSTRAINT "research_subprofile_secondary_assignment_key" UNIQUE ("assignment_id", "subprofile_code", "subprofile_version");



ALTER TABLE ONLY "public"."research_subprofile_secondary_exposures"
    ADD CONSTRAINT "research_subprofile_secondary_exposures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_model_dimensions"
    ADD CONSTRAINT "scoring_model_dimensions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_model_dimensions"
    ADD CONSTRAINT "scoring_model_dimensions_scoring_model_id_scoring_profile_d_key" UNIQUE ("scoring_model_id", "scoring_profile", "dimension_code");



ALTER TABLE ONLY "public"."scoring_model_metric_rules"
    ADD CONSTRAINT "scoring_model_metric_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_model_metric_rules"
    ADD CONSTRAINT "scoring_model_metric_rules_scoring_model_id_scoring_profile_key" UNIQUE ("scoring_model_id", "scoring_profile", "dimension_code", "input_code");



ALTER TABLE ONLY "public"."scoring_models"
    ADD CONSTRAINT "scoring_models_code_version_key" UNIQUE ("code", "version");



ALTER TABLE ONLY "public"."scoring_models"
    ADD CONSTRAINT "scoring_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_profile_dimension_overrides"
    ADD CONSTRAINT "scoring_profile_dimension_ove_scoring_model_id_scoring_prof_key" UNIQUE ("scoring_model_id", "scoring_profile_code", "dimension_code");



ALTER TABLE ONLY "public"."scoring_profile_dimension_overrides"
    ADD CONSTRAINT "scoring_profile_dimension_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_profile_metric_overrides"
    ADD CONSTRAINT "scoring_profile_metric_overri_scoring_model_id_scoring_prof_key" UNIQUE ("scoring_model_id", "scoring_profile_code", "dimension_code", "input_code");



ALTER TABLE ONLY "public"."scoring_profile_metric_overrides"
    ADD CONSTRAINT "scoring_profile_metric_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_profile_sector_rules"
    ADD CONSTRAINT "scoring_profile_sector_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_profile_sector_rules"
    ADD CONSTRAINT "scoring_profile_sector_rules_scoring_profile_code_sector_pa_key" UNIQUE ("scoring_profile_code", "sector_pattern", "industry_pattern");



ALTER TABLE ONLY "public"."scoring_profiles"
    ADD CONSTRAINT "scoring_profiles_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."sectors"
    ADD CONSTRAINT "sectors_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."sectors"
    ADD CONSTRAINT "sectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."securities"
    ADD CONSTRAINT "securities_exchange_symbol_key" UNIQUE ("exchange", "symbol");



ALTER TABLE ONLY "public"."securities"
    ADD CONSTRAINT "securities_isin_key" UNIQUE ("isin");



ALTER TABLE ONLY "public"."securities"
    ADD CONSTRAINT "securities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_attribute_decisions"
    ADD CONSTRAINT "security_attribute_decisions_pkey" PRIMARY KEY ("security_id", "attribute_code");



ALTER TABLE ONLY "public"."security_attribute_observations"
    ADD CONSTRAINT "security_attribute_observatio_source_record_id_security_id__key" UNIQUE ("source_record_id", "security_id", "attribute_code");



ALTER TABLE ONLY "public"."security_attribute_observations"
    ADD CONSTRAINT "security_attribute_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_classification_changes"
    ADD CONSTRAINT "security_classification_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_classification_changes"
    ADD CONSTRAINT "security_classification_changes_request_id_key" UNIQUE ("request_id");



ALTER TABLE ONLY "public"."security_classification_correction_requests"
    ADD CONSTRAINT "security_classification_correction_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_company_profiles"
    ADD CONSTRAINT "security_company_profiles_pkey" PRIMARY KEY ("security_id");



ALTER TABLE ONLY "public"."security_creation_requests"
    ADD CONSTRAINT "security_creation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_creation_requests"
    ADD CONSTRAINT "security_creation_requests_user_id_idempotency_key_key" UNIQUE ("user_id", "idempotency_key");



ALTER TABLE ONLY "public"."security_enrichment_correction_requests"
    ADD CONSTRAINT "security_enrichment_correction_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_identifiers"
    ADD CONSTRAINT "security_identifiers_identity_key" UNIQUE NULLS NOT DISTINCT ("provider_code", "identifier_type", "identifier_value", "exchange");



ALTER TABLE ONLY "public"."security_identifiers"
    ADD CONSTRAINT "security_identifiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_identity_observations"
    ADD CONSTRAINT "security_identity_observation_source_key" UNIQUE ("source_record_id", "source_code");



ALTER TABLE ONLY "public"."security_identity_observations"
    ADD CONSTRAINT "security_identity_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_listings"
    ADD CONSTRAINT "security_listing_identity_key" UNIQUE NULLS NOT DISTINCT ("exchange", "trading_symbol", "series");



ALTER TABLE ONLY "public"."security_listings"
    ADD CONSTRAINT "security_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_reconciliation_candidates"
    ADD CONSTRAINT "security_reconciliation_candidates_pkey" PRIMARY KEY ("case_id", "security_id");



ALTER TABLE ONLY "public"."security_reconciliation_cases"
    ADD CONSTRAINT "security_reconciliation_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_refresh_states"
    ADD CONSTRAINT "security_refresh_states_pkey" PRIMARY KEY ("source_code", "security_id", "data_domain");



ALTER TABLE ONLY "public"."security_scoring_profile_assignments"
    ADD CONSTRAINT "security_scoring_profile_assignments_pkey" PRIMARY KEY ("security_id");



ALTER TABLE ONLY "public"."stock_dimension_scores"
    ADD CONSTRAINT "stock_dimension_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_dimension_scores"
    ADD CONSTRAINT "stock_dimension_scores_score_run_id_dimension_code_key" UNIQUE ("score_run_id", "dimension_code");



ALTER TABLE ONLY "public"."stock_metric_score_inputs"
    ADD CONSTRAINT "stock_metric_score_inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_recommendation_runs"
    ADD CONSTRAINT "stock_recommendation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_score_runs"
    ADD CONSTRAINT "stock_score_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_score_runs"
    ADD CONSTRAINT "stock_score_runs_security_id_scoring_model_id_scoring_profi_key" UNIQUE ("security_id", "scoring_model_id", "scoring_profile", "as_of_date");



ALTER TABLE ONLY "public"."theme_securities"
    ADD CONSTRAINT "theme_securities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."theme_securities"
    ADD CONSTRAINT "theme_securities_theme_security_key" UNIQUE ("theme_id", "security_id");



ALTER TABLE ONLY "public"."themes"
    ADD CONSTRAINT "themes_id_portfolio_key" UNIQUE ("id", "portfolio_id");



ALTER TABLE ONLY "public"."themes"
    ADD CONSTRAINT "themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_accounting_events"
    ADD CONSTRAINT "transaction_accounting_events_performed_by_idempotency_key_key" UNIQUE ("performed_by", "idempotency_key");



ALTER TABLE ONLY "public"."transaction_accounting_events"
    ADD CONSTRAINT "transaction_accounting_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_correction_requests"
    ADD CONSTRAINT "transaction_correction_requests_corrected_transaction_id_key" UNIQUE ("corrected_transaction_id");



ALTER TABLE ONLY "public"."transaction_correction_requests"
    ADD CONSTRAINT "transaction_correction_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_correction_requests"
    ADD CONSTRAINT "transaction_correction_requests_user_id_idempotency_key_key" UNIQUE ("user_id", "idempotency_key");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_id_portfolio_key" UNIQUE ("id", "portfolio_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "broker_accounts_broker_id_idx" ON "public"."broker_accounts" USING "btree" ("broker_id");



CREATE UNIQUE INDEX "broker_accounts_external_id_key" ON "public"."broker_accounts" USING "btree" ("portfolio_id", "broker_id", "external_account_id") WHERE ("external_account_id" IS NOT NULL);



CREATE UNIQUE INDEX "broker_accounts_portfolio_name_key" ON "public"."broker_accounts" USING "btree" ("portfolio_id", "lower"("account_name"));



CREATE UNIQUE INDEX "brokers_name_key" ON "public"."brokers" USING "btree" ("lower"("name"));



CREATE INDEX "data_ingestion_run_items_security_idx" ON "public"."data_ingestion_run_items" USING "btree" ("security_id", "data_domain", "completed_at" DESC);



CREATE INDEX "data_ingestion_runs_portfolio_started_idx" ON "public"."data_ingestion_runs" USING "btree" ("portfolio_id", "started_at" DESC) WHERE ("portfolio_id" IS NOT NULL);



CREATE UNIQUE INDEX "data_source_records_nse_automation_external_key" ON "public"."data_source_records" USING "btree" ("source_code", "record_kind", "external_record_id") WHERE ("record_kind" = ANY (ARRAY['NSE_NEWS_RSS_RESPONSE'::"text", 'NSE_NEWS_LINKED_DOCUMENT'::"text", 'NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION'::"text"]));



CREATE INDEX "external_rating_observations_security_idx" ON "public"."external_rating_observations" USING "btree" ("security_id", "agency_code", "rating_date" DESC NULLS LAST, "retrieved_at" DESC);



CREATE INDEX "fundamental_reconciliation_cases_lookup_idx" ON "public"."fundamental_reconciliation_cases" USING "btree" ("security_id", "metric_code", "period_end", "case_status");



CREATE INDEX "fundamental_reconciliation_members_observation_idx" ON "public"."fundamental_reconciliation_members" USING "btree" ("observation_id");



CREATE UNIQUE INDEX "fundamental_reconciliation_one_active_semantic_case" ON "public"."fundamental_reconciliation_cases" USING "btree" ("security_id", "metric_code", "semantic_fingerprint") WHERE ("case_status" = ANY (ARRAY['PENDING_COMPATIBILITY'::"text", 'OPEN'::"text"]));



CREATE INDEX "import_batches_broker_account_id_idx" ON "public"."import_batches" USING "btree" ("broker_account_id") WHERE ("broker_account_id" IS NOT NULL);



CREATE INDEX "import_batches_file_identity_idx" ON "public"."import_batches" USING "btree" ("portfolio_id", "source_type", "file_sha256") WHERE ("file_sha256" IS NOT NULL);



CREATE INDEX "import_batches_portfolio_status_idx" ON "public"."import_batches" USING "btree" ("portfolio_id", "status");



CREATE INDEX "import_source_rows_duplicate_transaction_id_idx" ON "public"."import_source_rows" USING "btree" ("duplicate_of_transaction_id") WHERE ("duplicate_of_transaction_id" IS NOT NULL);



CREATE INDEX "import_source_rows_resolved_security_id_idx" ON "public"."import_source_rows" USING "btree" ("resolved_security_id") WHERE ("resolved_security_id" IS NOT NULL);



CREATE UNIQUE INDEX "industries_sector_name_key" ON "public"."industries" USING "btree" ("sector_id", "lower"("name"));



CREATE INDEX "manual_transaction_requests_transaction_idx" ON "public"."manual_transaction_requests" USING "btree" ("transaction_id");



CREATE INDEX "market_benchmark_price_history_lookup_idx" ON "public"."market_benchmark_price_history" USING "btree" ("benchmark_code", "provider_code", "interval", "period_start" DESC);



CREATE INDEX "market_data_instrument_mappings_listing_idx" ON "public"."market_data_instrument_mappings" USING "btree" ("listing_id") WHERE ("listing_id" IS NOT NULL);



CREATE INDEX "market_data_instrument_mappings_status_idx" ON "public"."market_data_instrument_mappings" USING "btree" ("provider_code", "mapping_status");



CREATE UNIQUE INDEX "market_data_mapping_provider_identity_key" ON "public"."market_data_instrument_mappings" USING "btree" ("provider_code", "exchange", "provider_instrument_id") WHERE ("provider_instrument_id" IS NOT NULL);



CREATE INDEX "market_data_refresh_runs_portfolio_started_idx" ON "public"."market_data_refresh_runs" USING "btree" ("portfolio_id", "started_at" DESC);



CREATE INDEX "market_metric_observations_security_metric_idx" ON "public"."market_metric_observations" USING "btree" ("security_id", "metric_code", "as_of_date" DESC, "retrieved_at" DESC);



CREATE INDEX "market_price_history_security_period_idx" ON "public"."market_price_history" USING "btree" ("security_id", "period_start" DESC);



CREATE INDEX "market_price_latest_retrieved_at_idx" ON "public"."market_price_latest" USING "btree" ("retrieved_at" DESC);



CREATE INDEX "news_items_importance_published_idx" ON "public"."news_items" USING "btree" ("importance_state", "published_at" DESC NULLS LAST);



CREATE INDEX "news_items_security_first_seen_idx" ON "public"."news_items" USING "btree" ("security_id", "first_seen_at" DESC);



CREATE INDEX "news_items_security_published_idx" ON "public"."news_items" USING "btree" ("security_id", "published_at" DESC NULLS LAST);



CREATE INDEX "news_source_appearances_item_retrieved_idx" ON "public"."news_source_appearances" USING "btree" ("news_item_id", "retrieved_at" DESC);



CREATE INDEX "news_source_appearances_raw_record_idx" ON "public"."news_source_appearances" USING "btree" ("data_source_record_id");



CREATE INDEX "portfolio_security_settings_security_id_idx" ON "public"."portfolio_security_settings" USING "btree" ("security_id");



CREATE UNIQUE INDEX "portfolios_user_name_key" ON "public"."portfolios" USING "btree" ("user_id", "lower"("name"));



CREATE UNIQUE INDEX "position_sizing_assessments_idempotency_uq" ON "public"."position_sizing_assessments" USING "btree" ("portfolio_id", "security_id", "engine_version", "evaluation_key");



CREATE INDEX "position_sizing_assessments_latest_idx" ON "public"."position_sizing_assessments" USING "btree" ("portfolio_id", "security_id", "as_of_at" DESC, "created_at" DESC);



CREATE INDEX "provider_budget_reservations_active_idx" ON "public"."provider_budget_reservations" USING "btree" ("source_code", "expires_at") WHERE ("status" = 'RESERVED'::"text");



CREATE INDEX "provider_control_events_source_created_idx" ON "public"."provider_control_events" USING "btree" ("source_code", "created_at" DESC);



CREATE INDEX "provider_usage_events_source_attempt_idx" ON "public"."provider_usage_events" USING "btree" ("source_code", "attempted_at" DESC);



CREATE UNIQUE INDEX "refresh_domain_policies_current_key" ON "public"."refresh_domain_policies" USING "btree" ("source_code", "data_domain") WHERE ("effective_to" IS NULL);



CREATE INDEX "research_document_sources_document_idx" ON "public"."research_document_sources" USING "btree" ("research_document_id");



CREATE UNIQUE INDEX "research_document_sources_provider_appearance_key" ON "public"."research_document_sources" USING "btree" ("source_code", "provider_document_id") WHERE ("provider_document_id" IS NOT NULL);



CREATE INDEX "research_document_sources_source_record_idx" ON "public"."research_document_sources" USING "btree" ("source_record_id");



CREATE UNIQUE INDEX "research_documents_authoritative_identifier_key" ON "public"."research_documents" USING "btree" ("authoritative_identifier_scheme", "authoritative_identifier") WHERE (("authoritative_identifier_scheme" IS NOT NULL) AND ("authoritative_identifier" IS NOT NULL));



CREATE UNIQUE INDEX "research_documents_content_hash_key" ON "public"."research_documents" USING "btree" ("canonical_content_hash") WHERE ("canonical_content_hash" IS NOT NULL);



CREATE UNIQUE INDEX "research_documents_metadata_identity_key" ON "public"."research_documents" USING "btree" ("security_id", "metadata_identity_hash") WHERE ("metadata_identity_hash" IS NOT NULL);



CREATE INDEX "research_documents_security_period_idx" ON "public"."research_documents" USING "btree" ("security_id", "document_type", "reporting_period_end" DESC);



CREATE INDEX "research_subprofile_assignments_created_by_idx" ON "public"."research_subprofile_assignments" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE UNIQUE INDEX "research_subprofile_assignments_idempotency_key" ON "public"."research_subprofile_assignments" USING "btree" ("security_id", "parent_profile_code", "parent_profile_version", "subprofile_code", "subprofile_version", "assignment_status", "effective_from");



CREATE INDEX "research_subprofile_assignments_retired_by_idx" ON "public"."research_subprofile_assignments" USING "btree" ("retired_by") WHERE ("retired_by" IS NOT NULL);



CREATE INDEX "research_subprofile_assignments_reviewed_by_idx" ON "public"."research_subprofile_assignments" USING "btree" ("reviewed_by") WHERE ("reviewed_by" IS NOT NULL);



CREATE INDEX "research_subprofile_assignments_security_id_idx" ON "public"."research_subprofile_assignments" USING "btree" ("security_id");



CREATE INDEX "research_subprofile_assignments_source_record_id_idx" ON "public"."research_subprofile_assignments" USING "btree" ("source_record_id") WHERE ("source_record_id" IS NOT NULL);



CREATE INDEX "research_subprofile_secondary_assignment_id_idx" ON "public"."research_subprofile_secondary_exposures" USING "btree" ("assignment_id");



CREATE INDEX "scoring_model_metric_rules_lookup_idx" ON "public"."scoring_model_metric_rules" USING "btree" ("scoring_model_id", "scoring_profile", "dimension_code", "display_order");



CREATE UNIQUE INDEX "sectors_name_key" ON "public"."sectors" USING "btree" ("lower"("name"));



CREATE INDEX "securities_industry_id_idx" ON "public"."securities" USING "btree" ("industry_id");



CREATE INDEX "securities_sector_id_idx" ON "public"."securities" USING "btree" ("sector_id");



CREATE INDEX "security_company_profiles_status_idx" ON "public"."security_company_profiles" USING "btree" ("profile_status", "last_checked_at" DESC);



CREATE UNIQUE INDEX "security_identifiers_one_primary_key" ON "public"."security_identifiers" USING "btree" ("security_id", "provider_code", "identifier_type") WHERE "is_primary";



CREATE INDEX "security_identifiers_security_id_idx" ON "public"."security_identifiers" USING "btree" ("security_id");



CREATE UNIQUE INDEX "security_identity_observations_verified_provider_id_key" ON "public"."security_identity_observations" USING "btree" ("source_code", "provider_instrument_id") WHERE (("provider_instrument_id" IS NOT NULL) AND ("evidence_status" = 'MATCHED'::"text"));



CREATE UNIQUE INDEX "security_listings_one_primary_key" ON "public"."security_listings" USING "btree" ("security_id") WHERE ("is_primary" AND "is_active");



CREATE INDEX "stock_metric_score_inputs_dimension_idx" ON "public"."stock_metric_score_inputs" USING "btree" ("dimension_score_id");



CREATE INDEX "stock_recommendation_runs_ai_lookup_idx" ON "public"."stock_recommendation_runs" USING "btree" ("portfolio_id", "security_id", "created_at" DESC) WHERE ("ai_interpretation_status" = 'READY'::"text");



CREATE INDEX "stock_recommendation_runs_lookup_idx" ON "public"."stock_recommendation_runs" USING "btree" ("portfolio_id", "security_id", "created_at" DESC);



CREATE UNIQUE INDEX "stock_recommendation_runs_preview_eval_uq" ON "public"."stock_recommendation_runs" USING "btree" ("portfolio_id", "security_id", "scoring_profile_code", "recommendation_policy_version", "evaluation_key") WHERE (("run_state" = 'PREVIEW'::"text") AND ("evaluation_key" IS NOT NULL));



CREATE INDEX "stock_score_runs_security_idx" ON "public"."stock_score_runs" USING "btree" ("security_id", "as_of_date" DESC, "created_at" DESC);



CREATE INDEX "theme_securities_portfolio_security_idx" ON "public"."theme_securities" USING "btree" ("portfolio_id", "security_id");



CREATE UNIQUE INDEX "themes_portfolio_name_key" ON "public"."themes" USING "btree" ("portfolio_id", "lower"("name"));



CREATE INDEX "transactions_broker_account_id_idx" ON "public"."transactions" USING "btree" ("broker_account_id") WHERE ("broker_account_id" IS NOT NULL);



CREATE UNIQUE INDEX "transactions_deduplication_key" ON "public"."transactions" USING "btree" ("portfolio_id", "source_provider", "deduplication_key") WHERE (("source_provider" IS NOT NULL) AND ("deduplication_key" IS NOT NULL));



CREATE INDEX "transactions_import_batch_id_idx" ON "public"."transactions" USING "btree" ("import_batch_id") WHERE ("import_batch_id" IS NOT NULL);



CREATE UNIQUE INDEX "transactions_import_source_row_key" ON "public"."transactions" USING "btree" ("import_source_row_id") WHERE ("import_source_row_id" IS NOT NULL);



CREATE UNIQUE INDEX "transactions_one_active_correction_key" ON "public"."transactions" USING "btree" ("corrected_from_transaction_id") WHERE (("corrected_from_transaction_id" IS NOT NULL) AND ("accounting_status" = 'ACTIVE'::"text"));



CREATE UNIQUE INDEX "transactions_one_reversal_key" ON "public"."transactions" USING "btree" ("reversal_of_transaction_id") WHERE ("reversal_of_transaction_id" IS NOT NULL);



CREATE INDEX "transactions_portfolio_date_idx" ON "public"."transactions" USING "btree" ("portfolio_id", "transaction_date") WHERE ("transaction_date" IS NOT NULL);



CREATE INDEX "transactions_portfolio_id_idx" ON "public"."transactions" USING "btree" ("portfolio_id");



CREATE INDEX "transactions_portfolio_security_active_idx" ON "public"."transactions" USING "btree" ("portfolio_id", "security_id") WHERE ("accounting_status" = 'ACTIVE'::"text");



CREATE UNIQUE INDEX "transactions_provider_trade_key" ON "public"."transactions" USING "btree" ("broker_account_id", "source_provider", "external_trade_id") WHERE (("broker_account_id" IS NOT NULL) AND ("source_provider" IS NOT NULL) AND ("external_trade_id" IS NOT NULL));



CREATE UNIQUE INDEX "transactions_provider_transaction_key" ON "public"."transactions" USING "btree" ("broker_account_id", "source_provider", "external_transaction_id") WHERE (("broker_account_id" IS NOT NULL) AND ("source_provider" IS NOT NULL) AND ("external_transaction_id" IS NOT NULL));



CREATE INDEX "transactions_security_id_idx" ON "public"."transactions" USING "btree" ("security_id");



CREATE INDEX "transactions_superseded_by_import_batch_id_idx" ON "public"."transactions" USING "btree" ("superseded_by_import_batch_id") WHERE ("superseded_by_import_batch_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "broker_accounts_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."broker_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "brokers_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."brokers" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "data_source_records_immutable" BEFORE DELETE OR UPDATE ON "public"."data_source_records" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "data_sources_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."data_sources" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "enrichment_decision_events_immutable" BEFORE DELETE OR UPDATE ON "public"."enrichment_decision_events" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "fundamental_observation_decisions_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."fundamental_observation_decisions" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_audit_enrichment_decision"();



CREATE OR REPLACE TRIGGER "fundamental_observations_immutable" BEFORE DELETE OR UPDATE ON "public"."fundamental_observations" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "fundamental_reconciliation_cases_audit" AFTER INSERT OR UPDATE ON "public"."fundamental_reconciliation_cases" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_audit_fundamental_reconciliation_case"();



CREATE OR REPLACE TRIGGER "fundamental_reconciliation_cases_no_delete" BEFORE DELETE ON "public"."fundamental_reconciliation_cases" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "fundamental_reconciliation_cases_validate_resolution" BEFORE UPDATE ON "public"."fundamental_reconciliation_cases" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_resolution"();



CREATE OR REPLACE TRIGGER "fundamental_reconciliation_events_immutable" BEFORE DELETE OR UPDATE ON "public"."fundamental_reconciliation_events" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "fundamental_reconciliation_members_immutable" BEFORE DELETE OR UPDATE ON "public"."fundamental_reconciliation_members" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "fundamental_reconciliation_members_validate" BEFORE INSERT ON "public"."fundamental_reconciliation_members" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_member"();



CREATE OR REPLACE TRIGGER "import_batches_protect_committed_state" BEFORE DELETE OR UPDATE ON "public"."import_batches" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_protect_committed_import_batch"();



CREATE OR REPLACE TRIGGER "import_batches_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."import_batches" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "import_source_rows_protect_original" BEFORE INSERT OR DELETE OR UPDATE ON "public"."import_source_rows" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_protect_import_source_row"();



CREATE OR REPLACE TRIGGER "industries_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."industries" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "market_cap_classification_observations_immutable" BEFORE DELETE OR UPDATE ON "public"."market_cap_classification_observations" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "market_data_instrument_mappings_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."market_data_instrument_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "market_data_providers_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."market_data_providers" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "portfolio_security_settings_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."portfolio_security_settings" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "portfolios_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."portfolios" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "provider_control_events_immutable" BEFORE DELETE OR UPDATE ON "public"."provider_control_events" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_provider_audit_mutation"();



CREATE OR REPLACE TRIGGER "provider_usage_events_immutable" BEFORE DELETE OR UPDATE ON "public"."provider_usage_events" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_provider_audit_mutation"();



CREATE OR REPLACE TRIGGER "research_document_sources_immutable" BEFORE DELETE OR UPDATE ON "public"."research_document_sources" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "research_document_sources_validate" BEFORE INSERT ON "public"."research_document_sources" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_validate_research_document_source"();



CREATE OR REPLACE TRIGGER "research_documents_immutable" BEFORE DELETE OR UPDATE ON "public"."research_documents" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "research_subprofile_assignments_protect_history" BEFORE UPDATE ON "public"."research_subprofile_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."protect_research_subprofile_assignment_history"();



CREATE OR REPLACE TRIGGER "research_subprofile_assignments_reject_delete" BEFORE DELETE ON "public"."research_subprofile_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."reject_research_subprofile_delete"();



CREATE OR REPLACE TRIGGER "research_subprofile_secondary_reject_delete" BEFORE DELETE ON "public"."research_subprofile_secondary_exposures" FOR EACH ROW EXECUTE FUNCTION "public"."reject_research_subprofile_delete"();



CREATE OR REPLACE TRIGGER "research_subprofile_secondary_validate" BEFORE INSERT ON "public"."research_subprofile_secondary_exposures" FOR EACH ROW EXECUTE FUNCTION "public"."validate_research_subprofile_secondary_exposure"();



CREATE OR REPLACE TRIGGER "sectors_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."sectors" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "securities_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."securities" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "security_attribute_decisions_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."security_attribute_decisions" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_audit_enrichment_decision"();



CREATE OR REPLACE TRIGGER "security_attribute_observations_immutable" BEFORE DELETE OR UPDATE ON "public"."security_attribute_observations" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "security_classification_changes_immutable" BEFORE DELETE OR UPDATE ON "public"."security_classification_changes" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_audit_mutation"();



CREATE OR REPLACE TRIGGER "security_company_profiles_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."security_company_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "security_identifiers_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."security_identifiers" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "security_identity_observations_immutable" BEFORE DELETE OR UPDATE ON "public"."security_identity_observations" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"();



CREATE OR REPLACE TRIGGER "security_listings_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."security_listings" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "theme_securities_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."theme_securities" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "theme_securities_validate_open_holding" BEFORE INSERT OR UPDATE OF "portfolio_id", "security_id" ON "public"."theme_securities" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_validate_theme_security_holding"();



CREATE OR REPLACE TRIGGER "themes_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."themes" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



CREATE OR REPLACE TRIGGER "transaction_accounting_events_immutable" BEFORE DELETE OR UPDATE ON "public"."transaction_accounting_events" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_reject_audit_mutation"();



CREATE OR REPLACE TRIGGER "transactions_set_audit_timestamps" BEFORE INSERT OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."portfolioai_set_audit_timestamps"();



ALTER TABLE ONLY "public"."broker_accounts"
    ADD CONSTRAINT "broker_accounts_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."broker_accounts"
    ADD CONSTRAINT "broker_accounts_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."classification_source_mappings"
    ADD CONSTRAINT "classification_source_mapping_taxonomy_code_taxonomy_versi_fkey" FOREIGN KEY ("taxonomy_code", "taxonomy_version") REFERENCES "public"."classification_taxonomies"("code", "version") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."classification_source_mappings"
    ADD CONSTRAINT "classification_source_mappings_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."classification_source_mappings"
    ADD CONSTRAINT "classification_source_mappings_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."classification_source_mappings"
    ADD CONSTRAINT "classification_source_mappings_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."classification_source_mappings"
    ADD CONSTRAINT "classification_source_mappings_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."data_ingestion_leases"
    ADD CONSTRAINT "data_ingestion_leases_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."data_ingestion_run_items"
    ADD CONSTRAINT "data_ingestion_run_items_ingestion_run_id_fkey" FOREIGN KEY ("ingestion_run_id") REFERENCES "public"."data_ingestion_runs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."data_ingestion_run_items"
    ADD CONSTRAINT "data_ingestion_run_items_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."data_ingestion_runs"
    ADD CONSTRAINT "data_ingestion_runs_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."data_ingestion_runs"
    ADD CONSTRAINT "data_ingestion_runs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."data_ingestion_runs"
    ADD CONSTRAINT "data_ingestion_runs_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."data_source_records"
    ADD CONSTRAINT "data_source_records_ingestion_run_id_fkey" FOREIGN KEY ("ingestion_run_id") REFERENCES "public"."data_ingestion_runs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."data_source_records"
    ADD CONSTRAINT "data_source_records_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."enrichment_decision_events"
    ADD CONSTRAINT "enrichment_decision_events_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."enrichment_decision_events"
    ADD CONSTRAINT "enrichment_decision_events_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."external_rating_observations"
    ADD CONSTRAINT "external_rating_observations_agency_code_fkey" FOREIGN KEY ("agency_code") REFERENCES "public"."rating_agencies"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."external_rating_observations"
    ADD CONSTRAINT "external_rating_observations_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."external_rating_observations"
    ADD CONSTRAINT "external_rating_observations_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fundamental_observation_decisions"
    ADD CONSTRAINT "fundamental_observation_decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_observation_decisions"
    ADD CONSTRAINT "fundamental_observation_decisions_metric_code_fkey" FOREIGN KEY ("metric_code") REFERENCES "public"."fundamental_metric_definitions"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_observation_decisions"
    ADD CONSTRAINT "fundamental_observation_decisions_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_observation_decisions"
    ADD CONSTRAINT "fundamental_observation_decisions_selected_observation_id_fkey" FOREIGN KEY ("selected_observation_id") REFERENCES "public"."fundamental_observations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_observations"
    ADD CONSTRAINT "fundamental_observations_metric_code_fkey" FOREIGN KEY ("metric_code") REFERENCES "public"."fundamental_metric_definitions"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_observations"
    ADD CONSTRAINT "fundamental_observations_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_observations"
    ADD CONSTRAINT "fundamental_observations_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_observations"
    ADD CONSTRAINT "fundamental_observations_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_cases"
    ADD CONSTRAINT "fundamental_reconciliation_cases_metric_code_fkey" FOREIGN KEY ("metric_code") REFERENCES "public"."fundamental_metric_definitions"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_cases"
    ADD CONSTRAINT "fundamental_reconciliation_cases_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_cases"
    ADD CONSTRAINT "fundamental_reconciliation_cases_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_cases"
    ADD CONSTRAINT "fundamental_reconciliation_cases_selected_observation_id_fkey" FOREIGN KEY ("selected_observation_id") REFERENCES "public"."fundamental_observations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_events"
    ADD CONSTRAINT "fundamental_reconciliation_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."fundamental_reconciliation_cases"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_events"
    ADD CONSTRAINT "fundamental_reconciliation_events_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_members"
    ADD CONSTRAINT "fundamental_reconciliation_members_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."fundamental_reconciliation_cases"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fundamental_reconciliation_members"
    ADD CONSTRAINT "fundamental_reconciliation_members_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "public"."fundamental_observations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."import_batches"
    ADD CONSTRAINT "import_batches_broker_account_portfolio_fkey" FOREIGN KEY ("broker_account_id", "portfolio_id") REFERENCES "public"."broker_accounts"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."import_batches"
    ADD CONSTRAINT "import_batches_duplicate_portfolio_fkey" FOREIGN KEY ("duplicate_of_import_batch_id", "portfolio_id") REFERENCES "public"."import_batches"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."import_batches"
    ADD CONSTRAINT "import_batches_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."import_source_rows"
    ADD CONSTRAINT "import_source_rows_batch_portfolio_fkey" FOREIGN KEY ("import_batch_id", "portfolio_id") REFERENCES "public"."import_batches"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."import_source_rows"
    ADD CONSTRAINT "import_source_rows_duplicate_transaction_fkey" FOREIGN KEY ("duplicate_of_transaction_id", "portfolio_id") REFERENCES "public"."transactions"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."import_source_rows"
    ADD CONSTRAINT "import_source_rows_resolved_security_id_fkey" FOREIGN KEY ("resolved_security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."industries"
    ADD CONSTRAINT "industries_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."manual_transaction_requests"
    ADD CONSTRAINT "manual_transaction_requests_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."manual_transaction_requests"
    ADD CONSTRAINT "manual_transaction_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_benchmark_price_history"
    ADD CONSTRAINT "market_benchmark_price_history_benchmark_code_fkey" FOREIGN KEY ("benchmark_code") REFERENCES "public"."market_benchmarks"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_benchmark_price_history"
    ADD CONSTRAINT "market_benchmark_price_history_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_benchmarks"
    ADD CONSTRAINT "market_benchmarks_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_cap_category_assessments"
    ADD CONSTRAINT "market_cap_category_assessments_policy_code_policy_version_fkey" FOREIGN KEY ("policy_code", "policy_version") REFERENCES "public"."market_cap_classification_policies"("code", "version") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_cap_category_assessments"
    ADD CONSTRAINT "market_cap_category_assessments_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_cap_category_assessments"
    ADD CONSTRAINT "market_cap_category_assessments_selected_observation_id_fkey" FOREIGN KEY ("selected_observation_id") REFERENCES "public"."market_cap_classification_observations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_cap_classification_observations"
    ADD CONSTRAINT "market_cap_classification_observations_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_cap_classification_observations"
    ADD CONSTRAINT "market_cap_classification_observations_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_cap_classification_observations"
    ADD CONSTRAINT "market_cap_classification_observations_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_instrument_mappings"
    ADD CONSTRAINT "market_data_instrument_mappings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."security_listings"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_instrument_mappings"
    ADD CONSTRAINT "market_data_instrument_mappings_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_instrument_mappings"
    ADD CONSTRAINT "market_data_instrument_mappings_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_mapping_reviews"
    ADD CONSTRAINT "market_data_mapping_review_mapping_consistency_fk" FOREIGN KEY ("mapping_id", "security_id", "provider_code") REFERENCES "public"."market_data_instrument_mappings"("id", "security_id", "provider_code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_mapping_reviews"
    ADD CONSTRAINT "market_data_mapping_reviews_mapping_id_fkey" FOREIGN KEY ("mapping_id") REFERENCES "public"."market_data_instrument_mappings"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_mapping_reviews"
    ADD CONSTRAINT "market_data_mapping_reviews_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_mapping_reviews"
    ADD CONSTRAINT "market_data_mapping_reviews_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_mapping_reviews"
    ADD CONSTRAINT "market_data_mapping_reviews_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_operation_leases"
    ADD CONSTRAINT "market_data_operation_leases_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_operation_leases"
    ADD CONSTRAINT "market_data_operation_leases_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_refresh_runs"
    ADD CONSTRAINT "market_data_refresh_runs_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_refresh_runs"
    ADD CONSTRAINT "market_data_refresh_runs_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_data_refresh_runs"
    ADD CONSTRAINT "market_data_refresh_runs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_metric_observations"
    ADD CONSTRAINT "market_metric_observations_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_metric_observations"
    ADD CONSTRAINT "market_metric_observations_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_price_history"
    ADD CONSTRAINT "market_price_history_mapping_consistency_fk" FOREIGN KEY ("mapping_id", "security_id", "provider_code") REFERENCES "public"."market_data_instrument_mappings"("id", "security_id", "provider_code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_price_history"
    ADD CONSTRAINT "market_price_history_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_price_history"
    ADD CONSTRAINT "market_price_history_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_price_latest"
    ADD CONSTRAINT "market_price_latest_mapping_consistency_fk" FOREIGN KEY ("mapping_id", "security_id", "provider_code") REFERENCES "public"."market_data_instrument_mappings"("id", "security_id", "provider_code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_price_latest"
    ADD CONSTRAINT "market_price_latest_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."market_data_providers"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_price_latest"
    ADD CONSTRAINT "market_price_latest_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."news_classification_events"
    ADD CONSTRAINT "news_classification_events_evidence_record_id_fkey" FOREIGN KEY ("evidence_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."news_classification_events"
    ADD CONSTRAINT "news_classification_events_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "public"."news_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_items"
    ADD CONSTRAINT "news_items_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."news_pipeline_leases"
    ADD CONSTRAINT "news_pipeline_leases_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_pipeline_leases"
    ADD CONSTRAINT "news_pipeline_leases_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."news_source_appearances"
    ADD CONSTRAINT "news_source_appearances_data_source_record_id_fkey" FOREIGN KEY ("data_source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."news_source_appearances"
    ADD CONSTRAINT "news_source_appearances_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "public"."news_items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."news_source_appearances"
    ADD CONSTRAINT "news_source_appearances_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."portfolio_security_settings"
    ADD CONSTRAINT "portfolio_security_settings_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."portfolio_security_settings"
    ADD CONSTRAINT "portfolio_security_settings_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."portfolios"
    ADD CONSTRAINT "portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."position_sizing_assessments"
    ADD CONSTRAINT "position_sizing_assessments_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."position_sizing_assessments"
    ADD CONSTRAINT "position_sizing_assessments_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."position_sizing_assessments"
    ADD CONSTRAINT "position_sizing_assessments_source_recommendation_run_id_fkey" FOREIGN KEY ("source_recommendation_run_id") REFERENCES "public"."stock_recommendation_runs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."position_sizing_assessments"
    ADD CONSTRAINT "position_sizing_assessments_source_score_run_id_fkey" FOREIGN KEY ("source_score_run_id") REFERENCES "public"."stock_score_runs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_budget_reservations"
    ADD CONSTRAINT "provider_budget_reservations_ingestion_run_id_fkey" FOREIGN KEY ("ingestion_run_id") REFERENCES "public"."data_ingestion_runs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_budget_reservations"
    ADD CONSTRAINT "provider_budget_reservations_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_control_events"
    ADD CONSTRAINT "provider_control_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_control_events"
    ADD CONSTRAINT "provider_control_events_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_ingestion_controls"
    ADD CONSTRAINT "provider_ingestion_controls_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_ingestion_controls"
    ADD CONSTRAINT "provider_ingestion_controls_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_usage_events"
    ADD CONSTRAINT "provider_usage_events_ingestion_run_id_fkey" FOREIGN KEY ("ingestion_run_id") REFERENCES "public"."data_ingestion_runs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_usage_events"
    ADD CONSTRAINT "provider_usage_events_run_item_id_fkey" FOREIGN KEY ("run_item_id") REFERENCES "public"."data_ingestion_run_items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_usage_events"
    ADD CONSTRAINT "provider_usage_events_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."provider_usage_events"
    ADD CONSTRAINT "provider_usage_events_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."recommendation_profile_policies"
    ADD CONSTRAINT "recommendation_profile_policies_profile_code_fkey" FOREIGN KEY ("profile_code") REFERENCES "public"."scoring_profiles"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refresh_domain_policies"
    ADD CONSTRAINT "refresh_domain_policies_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_document_sources"
    ADD CONSTRAINT "research_document_sources_research_document_id_fkey" FOREIGN KEY ("research_document_id") REFERENCES "public"."research_documents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_document_sources"
    ADD CONSTRAINT "research_document_sources_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_document_sources"
    ADD CONSTRAINT "research_document_sources_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_documents"
    ADD CONSTRAINT "research_documents_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_contract_fkey" FOREIGN KEY ("parent_profile_code", "parent_profile_version", "subprofile_code", "subprofile_version") REFERENCES "public"."research_subprofile_contracts"("parent_profile_code", "parent_profile_version", "subprofile_code", "subprofile_version") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_retired_by_fkey" FOREIGN KEY ("retired_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_assignments"
    ADD CONSTRAINT "research_subprofile_assignments_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_secondary_exposures"
    ADD CONSTRAINT "research_subprofile_secondary_contract_fkey" FOREIGN KEY ("parent_profile_code", "parent_profile_version", "subprofile_code", "subprofile_version") REFERENCES "public"."research_subprofile_contracts"("parent_profile_code", "parent_profile_version", "subprofile_code", "subprofile_version") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_subprofile_secondary_exposures"
    ADD CONSTRAINT "research_subprofile_secondary_exposures_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."research_subprofile_assignments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."scoring_model_dimensions"
    ADD CONSTRAINT "scoring_model_dimensions_scoring_model_id_fkey" FOREIGN KEY ("scoring_model_id") REFERENCES "public"."scoring_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_model_metric_rules"
    ADD CONSTRAINT "scoring_model_metric_rules_scoring_model_id_fkey" FOREIGN KEY ("scoring_model_id") REFERENCES "public"."scoring_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_profile_dimension_overrides"
    ADD CONSTRAINT "scoring_profile_dimension_overrides_scoring_model_id_fkey" FOREIGN KEY ("scoring_model_id") REFERENCES "public"."scoring_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_profile_dimension_overrides"
    ADD CONSTRAINT "scoring_profile_dimension_overrides_scoring_profile_code_fkey" FOREIGN KEY ("scoring_profile_code") REFERENCES "public"."scoring_profiles"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_profile_metric_overrides"
    ADD CONSTRAINT "scoring_profile_metric_overrides_scoring_model_id_fkey" FOREIGN KEY ("scoring_model_id") REFERENCES "public"."scoring_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_profile_metric_overrides"
    ADD CONSTRAINT "scoring_profile_metric_overrides_scoring_profile_code_fkey" FOREIGN KEY ("scoring_profile_code") REFERENCES "public"."scoring_profiles"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_profile_sector_rules"
    ADD CONSTRAINT "scoring_profile_sector_rules_scoring_profile_code_fkey" FOREIGN KEY ("scoring_profile_code") REFERENCES "public"."scoring_profiles"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_profiles"
    ADD CONSTRAINT "scoring_profiles_parent_profile_code_fkey" FOREIGN KEY ("parent_profile_code") REFERENCES "public"."scoring_profiles"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."securities"
    ADD CONSTRAINT "securities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."securities"
    ADD CONSTRAINT "securities_industry_sector_fkey" FOREIGN KEY ("industry_id", "sector_id") REFERENCES "public"."industries"("id", "sector_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."securities"
    ADD CONSTRAINT "securities_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_attribute_decisions"
    ADD CONSTRAINT "security_attribute_decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_attribute_decisions"
    ADD CONSTRAINT "security_attribute_decisions_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_attribute_decisions"
    ADD CONSTRAINT "security_attribute_decisions_selected_observation_id_fkey" FOREIGN KEY ("selected_observation_id") REFERENCES "public"."security_attribute_observations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_attribute_observations"
    ADD CONSTRAINT "security_attribute_observations_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_attribute_observations"
    ADD CONSTRAINT "security_attribute_observations_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_attribute_observations"
    ADD CONSTRAINT "security_attribute_observations_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_classification_changes"
    ADD CONSTRAINT "security_classification_changes_applied_by_fkey" FOREIGN KEY ("applied_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_classification_changes"
    ADD CONSTRAINT "security_classification_changes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."security_classification_correction_requests"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_classification_changes"
    ADD CONSTRAINT "security_classification_changes_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_classification_correction_requests"
    ADD CONSTRAINT "security_classification_correction_requests_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_classification_correction_requests"
    ADD CONSTRAINT "security_classification_correction_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_classification_correction_requests"
    ADD CONSTRAINT "security_classification_correction_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_classification_correction_requests"
    ADD CONSTRAINT "security_classification_correction_requests_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_company_profiles"
    ADD CONSTRAINT "security_company_profiles_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_company_profiles"
    ADD CONSTRAINT "security_company_profiles_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_company_profiles"
    ADD CONSTRAINT "security_company_profiles_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_creation_requests"
    ADD CONSTRAINT "security_creation_requests_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_creation_requests"
    ADD CONSTRAINT "security_creation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_enrichment_correction_requests"
    ADD CONSTRAINT "security_enrichment_correction_requests_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_enrichment_correction_requests"
    ADD CONSTRAINT "security_enrichment_correction_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_enrichment_correction_requests"
    ADD CONSTRAINT "security_enrichment_correction_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_enrichment_correction_requests"
    ADD CONSTRAINT "security_enrichment_correction_requests_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_identifiers"
    ADD CONSTRAINT "security_identifiers_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_identity_observations"
    ADD CONSTRAINT "security_identity_observations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."security_listings"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_identity_observations"
    ADD CONSTRAINT "security_identity_observations_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_identity_observations"
    ADD CONSTRAINT "security_identity_observations_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_identity_observations"
    ADD CONSTRAINT "security_identity_observations_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_listings"
    ADD CONSTRAINT "security_listings_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_reconciliation_candidates"
    ADD CONSTRAINT "security_reconciliation_candidates_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."security_reconciliation_cases"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_reconciliation_candidates"
    ADD CONSTRAINT "security_reconciliation_candidates_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_reconciliation_cases"
    ADD CONSTRAINT "security_reconciliation_cases_resolved_security_id_fkey" FOREIGN KEY ("resolved_security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_reconciliation_cases"
    ADD CONSTRAINT "security_reconciliation_cases_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_reconciliation_cases"
    ADD CONSTRAINT "security_reconciliation_cases_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."data_source_records"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_refresh_states"
    ADD CONSTRAINT "security_refresh_states_last_run_id_fkey" FOREIGN KEY ("last_run_id") REFERENCES "public"."data_ingestion_runs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_refresh_states"
    ADD CONSTRAINT "security_refresh_states_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_refresh_states"
    ADD CONSTRAINT "security_refresh_states_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "public"."data_sources"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_scoring_profile_assignments"
    ADD CONSTRAINT "security_scoring_profile_assignments_scoring_profile_code_fkey" FOREIGN KEY ("scoring_profile_code") REFERENCES "public"."scoring_profiles"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."security_scoring_profile_assignments"
    ADD CONSTRAINT "security_scoring_profile_assignments_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_dimension_scores"
    ADD CONSTRAINT "stock_dimension_scores_score_run_id_fkey" FOREIGN KEY ("score_run_id") REFERENCES "public"."stock_score_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_metric_score_inputs"
    ADD CONSTRAINT "stock_metric_score_inputs_dimension_score_id_fkey" FOREIGN KEY ("dimension_score_id") REFERENCES "public"."stock_dimension_scores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_metric_score_inputs"
    ADD CONSTRAINT "stock_metric_score_inputs_external_rating_observation_id_fkey" FOREIGN KEY ("external_rating_observation_id") REFERENCES "public"."external_rating_observations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stock_metric_score_inputs"
    ADD CONSTRAINT "stock_metric_score_inputs_fundamental_observation_id_fkey" FOREIGN KEY ("fundamental_observation_id") REFERENCES "public"."fundamental_observations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stock_recommendation_runs"
    ADD CONSTRAINT "stock_recommendation_runs_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_recommendation_runs"
    ADD CONSTRAINT "stock_recommendation_runs_scoring_profile_code_fkey" FOREIGN KEY ("scoring_profile_code") REFERENCES "public"."scoring_profiles"("code");



ALTER TABLE ONLY "public"."stock_recommendation_runs"
    ADD CONSTRAINT "stock_recommendation_runs_scoring_profile_code_recommendat_fkey" FOREIGN KEY ("scoring_profile_code", "recommendation_policy_version") REFERENCES "public"."recommendation_profile_policies"("profile_code", "policy_version");



ALTER TABLE ONLY "public"."stock_recommendation_runs"
    ADD CONSTRAINT "stock_recommendation_runs_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_recommendation_runs"
    ADD CONSTRAINT "stock_recommendation_runs_source_score_run_id_fkey" FOREIGN KEY ("source_score_run_id") REFERENCES "public"."stock_score_runs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_score_runs"
    ADD CONSTRAINT "stock_score_runs_scoring_model_id_fkey" FOREIGN KEY ("scoring_model_id") REFERENCES "public"."scoring_models"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stock_score_runs"
    ADD CONSTRAINT "stock_score_runs_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."theme_securities"
    ADD CONSTRAINT "theme_securities_security_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."theme_securities"
    ADD CONSTRAINT "theme_securities_theme_portfolio_fkey" FOREIGN KEY ("theme_id", "portfolio_id") REFERENCES "public"."themes"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."themes"
    ADD CONSTRAINT "themes_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_accounting_events"
    ADD CONSTRAINT "transaction_accounting_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_accounting_events"
    ADD CONSTRAINT "transaction_accounting_events_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_accounting_events"
    ADD CONSTRAINT "transaction_accounting_events_transaction_portfolio_fkey" FOREIGN KEY ("transaction_id", "portfolio_id") REFERENCES "public"."transactions"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_correction_requests"
    ADD CONSTRAINT "transaction_correction_requests_corrected_transaction_id_fkey" FOREIGN KEY ("corrected_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_correction_requests"
    ADD CONSTRAINT "transaction_correction_requests_original_transaction_id_fkey" FOREIGN KEY ("original_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_correction_requests"
    ADD CONSTRAINT "transaction_correction_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_broker_account_portfolio_fkey" FOREIGN KEY ("broker_account_id", "portfolio_id") REFERENCES "public"."broker_accounts"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_corrected_by_fkey" FOREIGN KEY ("corrected_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_correction_portfolio_fkey" FOREIGN KEY ("corrected_from_transaction_id", "portfolio_id") REFERENCES "public"."transactions"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_import_batch_portfolio_fkey" FOREIGN KEY ("import_batch_id", "portfolio_id") REFERENCES "public"."import_batches"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_import_source_row_batch_portfolio_fkey" FOREIGN KEY ("import_source_row_id", "import_batch_id", "portfolio_id") REFERENCES "public"."import_source_rows"("id", "import_batch_id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_reversal_portfolio_fkey" FOREIGN KEY ("reversal_of_transaction_id", "portfolio_id") REFERENCES "public"."transactions"("id", "portfolio_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_superseded_batch_portfolio_fkey" FOREIGN KEY ("superseded_by_import_batch_id", "portfolio_id") REFERENCES "public"."import_batches"("id", "portfolio_id") ON DELETE RESTRICT;



CREATE POLICY "Authenticated users can read brokers" ON "public"."brokers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read data source metadata" ON "public"."data_sources" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read industries" ON "public"."industries" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read market benchmark history" ON "public"."market_benchmark_price_history" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read market benchmarks" ON "public"."market_benchmarks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read market data providers" ON "public"."market_data_providers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read sectors" ON "public"."sectors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read securities" ON "public"."securities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read security identifiers" ON "public"."security_identifiers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users read market cap policies" ON "public"."market_cap_classification_policies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users read metric definitions" ON "public"."fundamental_metric_definitions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users read taxonomies" ON "public"."classification_taxonomies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create broker accounts in their portfolios" ON "public"."broker_accounts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "broker_accounts"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can create import batches in their portfolios" ON "public"."import_batches" FOR INSERT TO "authenticated" WITH CHECK ((("status" = 'UPLOADED'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "import_batches"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can create rows in uncommitted import batches" ON "public"."import_source_rows" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."import_batches"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "import_batches"."portfolio_id")))
  WHERE (("import_batches"."id" = "import_source_rows"."import_batch_id") AND ("import_batches"."status" <> ALL (ARRAY['COMMITTING'::"text", 'COMMITTED'::"text"])) AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can create their own portfolio security settings" ON "public"."portfolio_security_settings" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "portfolio_security_settings"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can create their own portfolios" ON "public"."portfolios" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create theme memberships in their portfolios" ON "public"."theme_securities" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "theme_securities"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can create themes in their portfolios" ON "public"."themes" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "themes"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read applied classification changes" ON "public"."security_classification_changes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."security_classification_correction_requests" "request"
     JOIN "public"."portfolios" "portfolio" ON (("portfolio"."id" = "request"."portfolio_id")))
  WHERE (("request"."id" = "security_classification_changes"."request_id") AND ("portfolio"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read broker accounts in their portfolios" ON "public"."broker_accounts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "broker_accounts"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read company profiles for owned securities" ON "public"."security_company_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "security_company_profiles"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read identity evidence for held securities" ON "public"."security_identity_observations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "security_identity_observations"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read latest prices for securities in their portfolios" ON "public"."market_price_latest" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "transactions"."portfolio_id")))
  WHERE (("transactions"."security_id" = "market_price_latest"."security_id") AND ("transactions"."accounting_status" = 'ACTIVE'::"text") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read listings for held securities" ON "public"."security_listings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "security_listings"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read mapping reviews for securities in their portfoli" ON "public"."market_data_mapping_reviews" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "transactions"."portfolio_id")))
  WHERE (("transactions"."security_id" = "market_data_mapping_reviews"."security_id") AND ("transactions"."accounting_status" = 'ACTIVE'::"text") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read mappings for securities in their portfolios" ON "public"."market_data_instrument_mappings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "transactions"."portfolio_id")))
  WHERE (("transactions"."security_id" = "market_data_instrument_mappings"."security_id") AND ("transactions"."accounting_status" = 'ACTIVE'::"text") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read market metrics for their securities" ON "public"."market_metric_observations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "market_metric_observations"."security_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read price history for securities in their portfolios" ON "public"."market_price_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "transactions"."portfolio_id")))
  WHERE (("transactions"."security_id" = "market_price_history"."security_id") AND ("transactions"."accounting_status" = 'ACTIVE'::"text") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read their classification correction requests" ON "public"."security_classification_correction_requests" FOR SELECT TO "authenticated" USING ((("requested_by" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "security_classification_correction_requests"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can read their own import batches" ON "public"."import_batches" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "import_batches"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read their own import source rows" ON "public"."import_source_rows" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."import_batches"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "import_batches"."portfolio_id")))
  WHERE (("import_batches"."id" = "import_source_rows"."import_batch_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read their own market refresh runs" ON "public"."market_data_refresh_runs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "market_data_refresh_runs"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read their own portfolio security settings" ON "public"."portfolio_security_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "portfolio_security_settings"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read their own portfolios" ON "public"."portfolios" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "transactions"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read theme memberships in their portfolios" ON "public"."theme_securities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "theme_securities"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read themes in their portfolios" ON "public"."themes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "themes"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can read transaction accounting events in their portfolio" ON "public"."transaction_accounting_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "transaction_accounting_events"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can remove theme memberships in their portfolios" ON "public"."theme_securities" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "theme_securities"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can submit classification correction requests" ON "public"."security_classification_correction_requests" FOR INSERT TO "authenticated" WITH CHECK ((("requested_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("request_status" = 'PENDING'::"text") AND ("reviewed_by" IS NULL) AND ("reviewed_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "security_classification_correction_requests"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (EXISTS ( SELECT 1
   FROM "public"."current_holdings"
  WHERE (("current_holdings"."portfolio_id" = "security_classification_correction_requests"."portfolio_id") AND ("current_holdings"."security_id" = "security_classification_correction_requests"."security_id") AND ("current_holdings"."current_quantity" <> (0)::numeric))))));



CREATE POLICY "Users can update broker accounts in their portfolios" ON "public"."broker_accounts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "broker_accounts"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "broker_accounts"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update rows in uncommitted import batches" ON "public"."import_source_rows" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."import_batches"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "import_batches"."portfolio_id")))
  WHERE (("import_batches"."id" = "import_source_rows"."import_batch_id") AND ("import_batches"."status" <> ALL (ARRAY['COMMITTING'::"text", 'COMMITTED'::"text"])) AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."import_batches"
     JOIN "public"."portfolios" ON (("portfolios"."id" = "import_batches"."portfolio_id")))
  WHERE (("import_batches"."id" = "import_source_rows"."import_batch_id") AND ("import_batches"."status" <> ALL (ARRAY['COMMITTING'::"text", 'COMMITTED'::"text"])) AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update their own portfolio security settings" ON "public"."portfolio_security_settings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "portfolio_security_settings"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "portfolio_security_settings"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update their own portfolios" ON "public"."portfolios" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update theme memberships in their portfolios" ON "public"."theme_securities" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "theme_securities"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "theme_securities"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update themes in their portfolios" ON "public"."themes" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "themes"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "themes"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update uncommitted import batches" ON "public"."import_batches" FOR UPDATE TO "authenticated" USING ((("status" <> ALL (ARRAY['COMMITTING'::"text", 'COMMITTED'::"text"])) AND (EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "import_batches"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK ((("status" <> ALL (ARRAY['COMMITTING'::"text", 'COMMITTED'::"text"])) AND (EXISTS ( SELECT 1
   FROM "public"."portfolios"
  WHERE (("portfolios"."id" = "import_batches"."portfolio_id") AND ("portfolios"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users read held attribute decisions" ON "public"."security_attribute_decisions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "security_attribute_decisions"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held enrichment decision history" ON "public"."enrichment_decision_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "enrichment_decision_events"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held fundamental decisions" ON "public"."fundamental_observation_decisions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "fundamental_observation_decisions"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held fundamental reconciliation cases" ON "public"."fundamental_reconciliation_cases" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "fundamental_reconciliation_cases"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held fundamental reconciliation events" ON "public"."fundamental_reconciliation_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."fundamental_reconciliation_cases" "c"
     JOIN "public"."transactions" "t" ON (("t"."security_id" = "c"."security_id")))
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("c"."id" = "fundamental_reconciliation_events"."case_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held fundamental reconciliation members" ON "public"."fundamental_reconciliation_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."fundamental_reconciliation_cases" "c"
     JOIN "public"."transactions" "t" ON (("t"."security_id" = "c"."security_id")))
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("c"."id" = "fundamental_reconciliation_members"."case_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held fundamentals" ON "public"."fundamental_observations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "fundamental_observations"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held market cap assessments" ON "public"."market_cap_category_assessments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "market_cap_category_assessments"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held market cap evidence" ON "public"."market_cap_classification_observations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "market_cap_classification_observations"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held research document sources" ON "public"."research_document_sources" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."research_documents" "d"
     JOIN "public"."transactions" "t" ON (("t"."security_id" = "d"."security_id")))
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("d"."id" = "research_document_sources"."research_document_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held research documents" ON "public"."research_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "research_documents"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read held security attributes" ON "public"."security_attribute_observations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "security_attribute_observations"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read own enrichment corrections" ON "public"."security_enrichment_correction_requests" FOR SELECT TO "authenticated" USING ((("requested_by" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."portfolios" "p"
  WHERE (("p"."id" = "security_enrichment_correction_requests"."portfolio_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."broker_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brokers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classification_source_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classification_taxonomies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_ingestion_leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_ingestion_run_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_ingestion_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_source_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrichment_decision_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."external_rating_observations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "external_rating_observations_authenticated_read" ON "public"."external_rating_observations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."fundamental_metric_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fundamental_observation_decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fundamental_observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fundamental_reconciliation_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fundamental_reconciliation_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fundamental_reconciliation_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_source_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."industries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_transaction_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_benchmark_price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_benchmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_cap_category_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_cap_classification_observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_cap_classification_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_data_instrument_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_data_mapping_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_data_operation_leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_data_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_data_refresh_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_metric_observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_price_latest" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_classification_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_pipeline_leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_source_appearances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolio_security_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_sizing_assessments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "position_sizing_assessments_owner_read" ON "public"."position_sizing_assessments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios" "p"
  WHERE (("p"."id" = "position_sizing_assessments"."portfolio_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."provider_budget_reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_control_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_ingestion_controls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_usage_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rating_agencies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rating_agencies_authenticated_read" ON "public"."rating_agencies" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."recommendation_profile_policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recommendation_profile_policies_authenticated_read" ON "public"."recommendation_profile_policies" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."refresh_domain_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_document_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_subprofile_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "research_subprofile_assignments_held_security_read" ON "public"."research_subprofile_assignments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("t"."security_id" = "research_subprofile_assignments"."security_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."research_subprofile_contracts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "research_subprofile_contracts_authenticated_read" ON "public"."research_subprofile_contracts" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."research_subprofile_secondary_exposures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "research_subprofile_secondary_held_security_read" ON "public"."research_subprofile_secondary_exposures" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."research_subprofile_assignments" "a"
     JOIN "public"."transactions" "t" ON (("t"."security_id" = "a"."security_id")))
     JOIN "public"."portfolios" "p" ON (("p"."id" = "t"."portfolio_id")))
  WHERE (("a"."id" = "research_subprofile_secondary_exposures"."assignment_id") AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."scoring_model_dimensions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_model_dimensions_authenticated_read" ON "public"."scoring_model_dimensions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."scoring_model_metric_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_model_metric_rules_authenticated_read" ON "public"."scoring_model_metric_rules" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."scoring_models" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_models_authenticated_read" ON "public"."scoring_models" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."scoring_profile_dimension_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_profile_dimension_overrides_authenticated_read" ON "public"."scoring_profile_dimension_overrides" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."scoring_profile_metric_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_profile_metric_overrides_authenticated_read" ON "public"."scoring_profile_metric_overrides" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."scoring_profile_sector_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_profile_sector_rules_authenticated_read" ON "public"."scoring_profile_sector_rules" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."scoring_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_profiles_authenticated_read" ON "public"."scoring_profiles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."sectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."securities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_attribute_decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_attribute_observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_classification_changes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_classification_correction_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_company_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_creation_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_enrichment_correction_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_identifiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_identity_observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_reconciliation_candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_reconciliation_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_refresh_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_scoring_profile_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_scoring_profile_assignments_authenticated_read" ON "public"."security_scoring_profile_assignments" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."stock_dimension_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_dimension_scores_authenticated_read" ON "public"."stock_dimension_scores" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."stock_metric_score_inputs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_metric_score_inputs_authenticated_read" ON "public"."stock_metric_score_inputs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."stock_recommendation_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_recommendation_runs_owner_read" ON "public"."stock_recommendation_runs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portfolios" "p"
  WHERE (("p"."id" = "stock_recommendation_runs"."portfolio_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."stock_score_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_score_runs_authenticated_read" ON "public"."stock_score_runs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."theme_securities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."themes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_accounting_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_correction_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."acquire_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."acquire_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."acquire_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."acquire_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_lease_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."acquire_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_lease_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."acquire_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_lease_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_fundamental_observation_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_fundamental_observation_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_security_attribute_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_security_attribute_decision_v1"("p_observation_id" "uuid", "p_basis" "text", "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_security_classification_correction_v1"("p_request_id" "uuid", "p_reviewer" "uuid", "p_review_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_security_classification_correction_v1"("p_request_id" "uuid", "p_reviewer" "uuid", "p_review_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_security_enrichment_correction_v1"("p_request_id" "uuid", "p_apply" boolean, "p_review_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_security_enrichment_correction_v1"("p_request_id" "uuid", "p_apply" boolean, "p_review_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."commit_import_batch_v1"("p_import_batch_id" "uuid", "p_approved_source_row_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."commit_import_batch_v1"("p_import_batch_id" "uuid", "p_approved_source_row_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."correct_transaction_v1"("p_original_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_reason" "text", "p_idempotency_key" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."correct_transaction_v1"("p_original_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_reason" "text", "p_idempotency_key" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."correct_transaction_v1"("p_original_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_reason" "text", "p_idempotency_key" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_manual_security_v1"("p_portfolio_id" "uuid", "p_exchange" "text", "p_symbol" "text", "p_name" "text", "p_asset_class" "text", "p_instrument_type" "text", "p_isin" "text", "p_series" "text", "p_idempotency_key" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_manual_security_v1"("p_portfolio_id" "uuid", "p_exchange" "text", "p_symbol" "text", "p_name" "text", "p_asset_class" "text", "p_instrument_type" "text", "p_isin" "text", "p_series" "text", "p_idempotency_key" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_manual_security_v1"("p_portfolio_id" "uuid", "p_exchange" "text", "p_symbol" "text", "p_name" "text", "p_asset_class" "text", "p_instrument_type" "text", "p_isin" "text", "p_series" "text", "p_idempotency_key" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_manual_transaction_v1"("p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_idempotency_key" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_manual_transaction_v1"("p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_idempotency_key" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_manual_transaction_v1"("p_portfolio_id" "uuid", "p_broker_account_id" "uuid", "p_security_id" "uuid", "p_transaction_type" "text", "p_transaction_date" "date", "p_quantity" numeric, "p_unit_price" numeric, "p_total_charges" numeric, "p_notes" "text", "p_idempotency_key" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_portfolio_coverage_registry_v1"("p_portfolio_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_portfolio_coverage_registry_v1"("p_portfolio_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_portfolio_news_feed_v1"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_portfolio_news_feed_v1"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_portfolio_news_feed_v1"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_portfolio_news_feed_v2"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_portfolio_news_feed_v2"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_portfolio_news_feed_v2"("p_portfolio_id" "uuid", "p_security_ids" "uuid"[], "p_limit" integer, "p_before" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_portfolio_profile_weight_context_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_profile_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_portfolio_profile_weight_context_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_profile_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_portfolio_profile_weight_context_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_profile_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_provider_operational_summary_v1"("p_source_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_provider_operational_summary_v1"("p_source_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_provider_operational_summary_v1"("p_source_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_provider_quota_summary_v1"("p_source_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_provider_quota_summary_v1"("p_source_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_provider_quota_summary_v1"("p_source_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_provider_quota_summary_v1"("p_source_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."invoke_amfi_market_cap_refresh_v1"("p_action" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."invoke_amfi_market_cap_refresh_v1"("p_action" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."invoke_nse_news_pipeline_scheduled_v1"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."invoke_nse_news_pipeline_scheduled_v1"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."invoke_trendlyne_classification_refresh_v1"("p_action" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."invoke_trendlyne_classification_refresh_v1"("p_action" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_assert_effective_quantity_valid"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_excluded_transaction_id" "uuid", "p_included_transaction_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_assert_effective_quantity_valid"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_excluded_transaction_id" "uuid", "p_included_transaction_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_audit_enrichment_decision"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_audit_enrichment_decision"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_audit_fundamental_reconciliation_case"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_audit_fundamental_reconciliation_case"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_import_cell"("p_raw_data" "jsonb", "p_aliases" "text"[]) FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."portfolioai_import_cell_text"("p_cell" "jsonb") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."portfolioai_import_date"("p_cell" "jsonb") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."portfolioai_is_valid_isin"("p_isin" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_is_valid_isin"("p_isin" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_normalize_import_token"("p_value" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."portfolioai_protect_committed_import_batch"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_protect_committed_import_batch"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_protect_import_source_row"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_protect_import_source_row"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_reject_audit_mutation"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_reject_audit_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."portfolioai_reject_provider_audit_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."portfolioai_reject_provider_audit_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."portfolioai_reject_provider_audit_mutation"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_reject_stage7_evidence_mutation"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_set_audit_timestamps"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_set_audit_timestamps"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_member"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_member"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_resolution"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_validate_fundamental_reconciliation_resolution"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_validate_research_document_source"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_validate_research_document_source"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."portfolioai_validate_theme_security_holding"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."portfolioai_validate_theme_security_holding"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."protect_research_subprofile_assignment_history"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_research_subprofile_assignment_history"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reclassify_unclassified_news_from_stored_evidence_v1"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reclassify_unclassified_news_from_stored_evidence_v1"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_provider_usage_event_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_run_item_id" "uuid", "p_security_id" "uuid", "p_data_domain" "text", "p_operation_class" "text", "p_accounting_class" "text", "p_estimated_internal_units" integer, "p_actual_internal_units" integer, "p_attempted_at" timestamp with time zone, "p_completed_at" timestamp with time zone, "p_outcome" "text", "p_safe_error_code" "text", "p_retry_attempt" integer, "p_idempotency_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_provider_usage_event_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_run_item_id" "uuid", "p_security_id" "uuid", "p_data_domain" "text", "p_operation_class" "text", "p_accounting_class" "text", "p_estimated_internal_units" integer, "p_actual_internal_units" integer, "p_attempted_at" timestamp with time zone, "p_completed_at" timestamp with time zone, "p_outcome" "text", "p_safe_error_code" "text", "p_retry_attempt" integer, "p_idempotency_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_recommendation_preview_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_rationale" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_recommendation_preview_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_rationale" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_recommendation_preview_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_rationale" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_recommendation_preview_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_rationale" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_recommendation_preview_v2"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_action_bias" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_suggested_weight_min" numeric, "p_suggested_weight_max" numeric, "p_rationale" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_recommendation_preview_v2"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_action_bias" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_suggested_weight_min" numeric, "p_suggested_weight_max" numeric, "p_rationale" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_recommendation_preview_v2"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_scoring_profile_code" "text", "p_policy_version" integer, "p_evaluation_key" "text", "p_overall_score" numeric, "p_score_ready_coverage" numeric, "p_evidence_confidence" numeric, "p_suggested_role" "text", "p_action_bias" "text", "p_current_user_role" "text", "p_current_weight" numeric, "p_suggested_weight_min" numeric, "p_suggested_weight_max" numeric, "p_rationale" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."data_ingestion_run_items" TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_refresh_item_result_v1"("p_run_item_id" "uuid", "p_status" "text", "p_safe_reason_code" "text", "p_attempted_call_count" integer, "p_accepted_record_count" integer, "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_refresh_item_result_v1"("p_run_item_id" "uuid", "p_status" "text", "p_safe_reason_code" "text", "p_attempted_call_count" integer, "p_accepted_record_count" integer, "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_research_subprofile_delete"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reject_research_subprofile_delete"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."release_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_data_ingestion_lease_v1"("p_source_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."release_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_market_data_operation_lease"("p_portfolio_id" "uuid", "p_provider_code" "text", "p_operation" "text", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."release_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_news_pipeline_lease_v1"("p_source_code" "text", "p_portfolio_id" "uuid", "p_lease_holder" "uuid", "p_cooldown_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."reserve_provider_budget_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_reservation_key" "text", "p_estimated_units" integer, "p_reservation_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reserve_provider_budget_v1"("p_source_code" "text", "p_ingestion_run_id" "uuid", "p_reservation_key" "text", "p_estimated_units" integer, "p_reservation_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."resolve_fundamental_reconciliation_case_v1"("p_case_id" "uuid", "p_resolution_type" "text", "p_selected_observation_id" "uuid", "p_reviewed_by" "uuid", "p_review_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."resolve_fundamental_reconciliation_case_v1"("p_case_id" "uuid", "p_resolution_type" "text", "p_selected_observation_id" "uuid", "p_reviewed_by" "uuid", "p_review_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."restore_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."provider_ingestion_controls" TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_provider_ingestion_control_v1"("p_source_code" "text", "p_changes" "jsonb", "p_reason" "text", "p_expires_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_provider_ingestion_control_v1"("p_source_code" "text", "p_changes" "jsonb", "p_reason" "text", "p_expires_at" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."settle_provider_budget_v1"("p_reservation_id" "uuid", "p_consumed_units" integer, "p_failed_units" integer, "p_released_units" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."settle_provider_budget_v1"("p_reservation_id" "uuid", "p_consumed_units" integer, "p_failed_units" integer, "p_released_units" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_security_enrichment_correction_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_target_kind" "text", "p_target_code" "text", "p_proposed_value" "jsonb", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_security_enrichment_correction_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_target_kind" "text", "p_target_code" "text", "p_proposed_value" "jsonb", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_security_enrichment_correction_v1"("p_portfolio_id" "uuid", "p_security_id" "uuid", "p_target_kind" "text", "p_target_code" "text", "p_proposed_value" "jsonb", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_research_subprofile_secondary_exposure"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_research_subprofile_secondary_exposure"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."verify_amfi_market_cap_refresh_token_v1"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verify_amfi_market_cap_refresh_token_v1"("p_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."verify_news_pipeline_scheduler_token_v1"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verify_news_pipeline_scheduler_token_v1"("p_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."verify_trendlyne_classification_refresh_token_v1"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verify_trendlyne_classification_refresh_token_v1"("p_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."void_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."void_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."void_transaction_v1"("p_transaction_id" "uuid", "p_portfolio_id" "uuid", "p_reason" "text", "p_idempotency_key" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."broker_accounts" TO "anon";
GRANT ALL ON TABLE "public"."broker_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."broker_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."brokers" TO "anon";
GRANT ALL ON TABLE "public"."brokers" TO "authenticated";
GRANT ALL ON TABLE "public"."brokers" TO "service_role";



GRANT ALL ON TABLE "public"."classification_source_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."classification_taxonomies" TO "service_role";
GRANT SELECT ON TABLE "public"."classification_taxonomies" TO "authenticated";



GRANT ALL ON TABLE "public"."fundamental_observation_decisions" TO "service_role";
GRANT SELECT ON TABLE "public"."fundamental_observation_decisions" TO "authenticated";



GRANT ALL ON TABLE "public"."fundamental_observations" TO "service_role";
GRANT SELECT ON TABLE "public"."fundamental_observations" TO "authenticated";



GRANT ALL ON TABLE "public"."current_fundamental_observations_v1" TO "anon";
GRANT ALL ON TABLE "public"."current_fundamental_observations_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."current_fundamental_observations_v1" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "service_role";
GRANT SELECT ON TABLE "public"."transactions" TO "authenticated";



GRANT ALL ON TABLE "public"."current_holdings" TO "service_role";
GRANT SELECT ON TABLE "public"."current_holdings" TO "authenticated";



GRANT ALL ON TABLE "public"."market_cap_category_assessments" TO "service_role";
GRANT SELECT ON TABLE "public"."market_cap_category_assessments" TO "authenticated";



GRANT ALL ON TABLE "public"."market_cap_classification_observations" TO "service_role";
GRANT SELECT ON TABLE "public"."market_cap_classification_observations" TO "authenticated";



GRANT ALL ON TABLE "public"."market_cap_classification_policies" TO "service_role";
GRANT SELECT ON TABLE "public"."market_cap_classification_policies" TO "authenticated";



GRANT ALL ON TABLE "public"."current_market_cap_category_v1" TO "anon";
GRANT ALL ON TABLE "public"."current_market_cap_category_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."current_market_cap_category_v1" TO "service_role";



GRANT ALL ON TABLE "public"."securities" TO "service_role";
GRANT SELECT ON TABLE "public"."securities" TO "authenticated";



GRANT ALL ON TABLE "public"."security_attribute_decisions" TO "service_role";
GRANT SELECT ON TABLE "public"."security_attribute_decisions" TO "authenticated";



GRANT ALL ON TABLE "public"."security_attribute_observations" TO "service_role";
GRANT SELECT ON TABLE "public"."security_attribute_observations" TO "authenticated";



GRANT ALL ON TABLE "public"."current_security_classification_v1" TO "anon";
GRANT ALL ON TABLE "public"."current_security_classification_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."current_security_classification_v1" TO "service_role";



GRANT ALL ON TABLE "public"."portfolios" TO "anon";
GRANT ALL ON TABLE "public"."portfolios" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolios" TO "service_role";



GRANT ALL ON TABLE "public"."security_listings" TO "service_role";
GRANT SELECT ON TABLE "public"."security_listings" TO "authenticated";



GRANT ALL ON TABLE "public"."current_security_identity_v1" TO "anon";
GRANT ALL ON TABLE "public"."current_security_identity_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."current_security_identity_v1" TO "service_role";



GRANT ALL ON TABLE "public"."current_security_enrichment_v1" TO "anon";
GRANT ALL ON TABLE "public"."current_security_enrichment_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."current_security_enrichment_v1" TO "service_role";



GRANT ALL ON TABLE "public"."data_ingestion_leases" TO "service_role";



GRANT ALL ON TABLE "public"."data_ingestion_runs" TO "service_role";



GRANT ALL ON TABLE "public"."data_source_records" TO "service_role";



GRANT ALL ON TABLE "public"."data_sources" TO "service_role";
GRANT SELECT ON TABLE "public"."data_sources" TO "authenticated";



GRANT ALL ON TABLE "public"."enrichment_decision_events" TO "service_role";
GRANT SELECT ON TABLE "public"."enrichment_decision_events" TO "authenticated";



GRANT ALL ON TABLE "public"."external_rating_observations" TO "anon";
GRANT ALL ON TABLE "public"."external_rating_observations" TO "authenticated";
GRANT ALL ON TABLE "public"."external_rating_observations" TO "service_role";



GRANT ALL ON TABLE "public"."fundamental_metric_definitions" TO "service_role";
GRANT SELECT ON TABLE "public"."fundamental_metric_definitions" TO "authenticated";



GRANT ALL ON TABLE "public"."fundamental_reconciliation_cases" TO "service_role";
GRANT SELECT ON TABLE "public"."fundamental_reconciliation_cases" TO "authenticated";



GRANT ALL ON TABLE "public"."fundamental_reconciliation_events" TO "service_role";
GRANT SELECT ON TABLE "public"."fundamental_reconciliation_events" TO "authenticated";



GRANT ALL ON TABLE "public"."fundamental_reconciliation_members" TO "service_role";
GRANT SELECT ON TABLE "public"."fundamental_reconciliation_members" TO "authenticated";



GRANT ALL ON TABLE "public"."import_batches" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."import_batches" TO "authenticated";



GRANT ALL ON TABLE "public"."import_source_rows" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."import_source_rows" TO "authenticated";



GRANT ALL ON TABLE "public"."industries" TO "anon";
GRANT ALL ON TABLE "public"."industries" TO "authenticated";
GRANT ALL ON TABLE "public"."industries" TO "service_role";



GRANT ALL ON TABLE "public"."manual_transaction_requests" TO "service_role";



GRANT ALL ON TABLE "public"."market_benchmark_price_history" TO "anon";
GRANT ALL ON TABLE "public"."market_benchmark_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."market_benchmark_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."market_benchmarks" TO "anon";
GRANT ALL ON TABLE "public"."market_benchmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."market_benchmarks" TO "service_role";



GRANT ALL ON TABLE "public"."market_data_instrument_mappings" TO "service_role";
GRANT SELECT ON TABLE "public"."market_data_instrument_mappings" TO "authenticated";



GRANT ALL ON TABLE "public"."market_data_mapping_reviews" TO "service_role";
GRANT SELECT ON TABLE "public"."market_data_mapping_reviews" TO "authenticated";



GRANT ALL ON TABLE "public"."market_data_operation_leases" TO "service_role";



GRANT ALL ON TABLE "public"."market_data_providers" TO "service_role";
GRANT SELECT ON TABLE "public"."market_data_providers" TO "authenticated";



GRANT ALL ON TABLE "public"."market_data_refresh_runs" TO "service_role";
GRANT SELECT ON TABLE "public"."market_data_refresh_runs" TO "authenticated";



GRANT ALL ON TABLE "public"."market_metric_observations" TO "anon";
GRANT ALL ON TABLE "public"."market_metric_observations" TO "authenticated";
GRANT ALL ON TABLE "public"."market_metric_observations" TO "service_role";



GRANT ALL ON TABLE "public"."market_price_history" TO "service_role";
GRANT SELECT ON TABLE "public"."market_price_history" TO "authenticated";



GRANT ALL ON TABLE "public"."market_price_latest" TO "service_role";
GRANT SELECT ON TABLE "public"."market_price_latest" TO "authenticated";



GRANT ALL ON TABLE "public"."news_classification_events" TO "service_role";



GRANT ALL ON TABLE "public"."news_items" TO "service_role";



GRANT ALL ON TABLE "public"."news_pipeline_leases" TO "service_role";



GRANT ALL ON TABLE "public"."news_source_appearances" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_enrichment_coverage_v1" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_enrichment_coverage_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_enrichment_coverage_v1" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_security_settings" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."portfolio_security_settings" TO "authenticated";



GRANT SELECT ON TABLE "public"."position_sizing_assessments" TO "authenticated";
GRANT SELECT,INSERT ON TABLE "public"."position_sizing_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."provider_budget_reservations" TO "service_role";



GRANT ALL ON TABLE "public"."provider_control_events" TO "service_role";



GRANT ALL ON TABLE "public"."provider_usage_events" TO "service_role";



GRANT ALL ON TABLE "public"."rating_agencies" TO "anon";
GRANT ALL ON TABLE "public"."rating_agencies" TO "authenticated";
GRANT ALL ON TABLE "public"."rating_agencies" TO "service_role";



GRANT ALL ON TABLE "public"."recommendation_profile_policies" TO "anon";
GRANT ALL ON TABLE "public"."recommendation_profile_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."recommendation_profile_policies" TO "service_role";



GRANT ALL ON TABLE "public"."refresh_domain_policies" TO "service_role";



GRANT ALL ON TABLE "public"."research_document_sources" TO "service_role";
GRANT SELECT ON TABLE "public"."research_document_sources" TO "authenticated";



GRANT ALL ON TABLE "public"."research_documents" TO "service_role";
GRANT SELECT ON TABLE "public"."research_documents" TO "authenticated";



GRANT SELECT ON TABLE "public"."research_subprofile_assignments" TO "authenticated";
GRANT SELECT,INSERT ON TABLE "public"."research_subprofile_assignments" TO "service_role";



GRANT UPDATE("assignment_status") ON TABLE "public"."research_subprofile_assignments" TO "service_role";



GRANT UPDATE("effective_to") ON TABLE "public"."research_subprofile_assignments" TO "service_role";



GRANT UPDATE("retired_by") ON TABLE "public"."research_subprofile_assignments" TO "service_role";



GRANT UPDATE("retired_at") ON TABLE "public"."research_subprofile_assignments" TO "service_role";



GRANT UPDATE("retirement_reason") ON TABLE "public"."research_subprofile_assignments" TO "service_role";



GRANT SELECT ON TABLE "public"."research_subprofile_contracts" TO "authenticated";
GRANT SELECT ON TABLE "public"."research_subprofile_contracts" TO "service_role";



GRANT SELECT ON TABLE "public"."research_subprofile_secondary_exposures" TO "authenticated";
GRANT SELECT,INSERT ON TABLE "public"."research_subprofile_secondary_exposures" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_model_dimensions" TO "anon";
GRANT ALL ON TABLE "public"."scoring_model_dimensions" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_model_dimensions" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_model_metric_rules" TO "anon";
GRANT ALL ON TABLE "public"."scoring_model_metric_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_model_metric_rules" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_models" TO "anon";
GRANT ALL ON TABLE "public"."scoring_models" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_models" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_profile_dimension_overrides" TO "anon";
GRANT ALL ON TABLE "public"."scoring_profile_dimension_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_profile_dimension_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_profile_metric_overrides" TO "anon";
GRANT ALL ON TABLE "public"."scoring_profile_metric_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_profile_metric_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_profile_sector_rules" TO "anon";
GRANT ALL ON TABLE "public"."scoring_profile_sector_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_profile_sector_rules" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_profiles" TO "anon";
GRANT ALL ON TABLE "public"."scoring_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sectors" TO "anon";
GRANT ALL ON TABLE "public"."sectors" TO "authenticated";
GRANT ALL ON TABLE "public"."sectors" TO "service_role";



GRANT ALL ON TABLE "public"."security_classification_changes" TO "service_role";
GRANT SELECT ON TABLE "public"."security_classification_changes" TO "authenticated";



GRANT ALL ON TABLE "public"."security_classification_correction_requests" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."security_classification_correction_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."security_company_profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."security_company_profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."security_creation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."security_enrichment_correction_requests" TO "service_role";
GRANT SELECT ON TABLE "public"."security_enrichment_correction_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."security_identifiers" TO "service_role";
GRANT SELECT ON TABLE "public"."security_identifiers" TO "authenticated";



GRANT ALL ON TABLE "public"."security_identity_observations" TO "service_role";
GRANT SELECT ON TABLE "public"."security_identity_observations" TO "authenticated";



GRANT ALL ON TABLE "public"."security_reconciliation_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."security_reconciliation_cases" TO "service_role";



GRANT ALL ON TABLE "public"."security_refresh_states" TO "service_role";



GRANT ALL ON TABLE "public"."security_scoring_profile_assignments" TO "anon";
GRANT ALL ON TABLE "public"."security_scoring_profile_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."security_scoring_profile_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."stock_dimension_scores" TO "anon";
GRANT ALL ON TABLE "public"."stock_dimension_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_dimension_scores" TO "service_role";



GRANT ALL ON TABLE "public"."stock_metric_score_inputs" TO "anon";
GRANT ALL ON TABLE "public"."stock_metric_score_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_metric_score_inputs" TO "service_role";



GRANT ALL ON TABLE "public"."stock_recommendation_runs" TO "anon";
GRANT ALL ON TABLE "public"."stock_recommendation_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_recommendation_runs" TO "service_role";



GRANT ALL ON TABLE "public"."stock_score_runs" TO "anon";
GRANT ALL ON TABLE "public"."stock_score_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_score_runs" TO "service_role";



GRANT ALL ON TABLE "public"."theme_securities" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."theme_securities" TO "authenticated";



GRANT ALL ON TABLE "public"."themes" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."themes" TO "authenticated";



GRANT ALL ON TABLE "public"."transaction_accounting_events" TO "service_role";
GRANT SELECT ON TABLE "public"."transaction_accounting_events" TO "authenticated";



GRANT ALL ON TABLE "public"."transaction_correction_requests" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







