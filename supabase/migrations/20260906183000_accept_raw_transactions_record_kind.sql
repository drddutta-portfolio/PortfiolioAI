begin;

-- Raw evidence preserves the parser's canonical worksheet kind (TRANSACTIONS,
-- plural). Normalized commit records use TRANSACTION (singular). Patch only
-- that exact trusted-RPC predicate and fail closed if the deployed definition
-- is not the reviewed version.
do $migration$
declare
  v_definition text;
  v_old_predicate constant text :=
    'v_row.raw_data ->> ''record_kind'' <> ''TRANSACTION''';
  v_new_predicate constant text :=
    'v_row.raw_data ->> ''record_kind'' <> ''TRANSACTIONS''';
begin
  select pg_catalog.pg_get_functiondef(
    'public.commit_import_batch_v1(uuid,uuid[])'::regprocedure
  ) into v_definition;

  if pg_catalog.strpos(v_definition, v_old_predicate) = 0 then
    raise exception using
      errcode = '55000',
      message = 'reviewed import commit predicate was not found; migration not applied';
  end if;
  if pg_catalog.strpos(v_definition, v_new_predicate) <> 0 then
    raise exception using
      errcode = '55000',
      message = 'replacement import commit predicate already exists unexpectedly; migration not applied';
  end if;

  execute pg_catalog.replace(v_definition, v_old_predicate, v_new_predicate);
end;
$migration$;

commit;
