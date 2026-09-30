begin;

do $$
declare
  v_snapshot public.research_evidence_snapshots%rowtype;
  v_items jsonb;
  v_snapshot_json jsonb;
  v_selection jsonb;
  v_lineage jsonb;
  v_result jsonb;
  v_snapshots_before bigint;
  v_items_before bigint;
  v_selections_before bigint;
begin
  select * into v_snapshot from public.current_research_evidence_snapshot_v1 limit 1;
  if v_snapshot.id is null then raise exception 'IC3 test requires an existing snapshot'; end if;

  select jsonb_agg(to_jsonb(i) - 'id' - 'snapshot_id' - 'created_at' order by i.requirement_code)
    into v_items from public.research_evidence_snapshot_items i where i.snapshot_id = v_snapshot.id;

  v_snapshot_json := jsonb_build_object(
    'portfolio_id',v_snapshot.portfolio_id,'security_id',v_snapshot.security_id,
    'as_of_date',v_snapshot.as_of_date,'methodology_authority',v_snapshot.methodology_authority,
    'methodology_version',v_snapshot.methodology_version,'profile_code',v_snapshot.profile_code,
    'subprofile_code',v_snapshot.subprofile_code,'requirement_registry_version',v_snapshot.requirement_registry_version,
    'snapshot_status',v_snapshot.snapshot_status,'snapshot_hash',v_snapshot.snapshot_hash,'created_by',null
  );
  v_selection := jsonb_build_object(
    'selection_run_id','11111111-1111-4111-8111-111111111111','execution_grant_id',null,
    'evaluation_as_of',(v_snapshot.as_of_date::text || 'T23:59:59Z'),
    'source_cutoff_at',(v_snapshot.as_of_date::text || 'T23:59:59Z'),
    'selection_basis','IC3_CANONICAL_MATERIALIZATION','materializer_version','IC3_LOCAL_REPLAY_V1','selected_by',null
  );
  v_lineage := jsonb_build_object(
    'classification_authority','current_security_enrichment_v1','classification_version','IC3_TEST_CLASSIFICATION_V1',
    'methodology_role',coalesce(v_snapshot.subprofile_code,v_snapshot.profile_code),
    'assignment_authority','IC3_TEST_ASSIGNMENT','assignment_id',v_snapshot.security_id::text,'assignment_version','1'
  );

  select count(*) into v_snapshots_before from public.research_evidence_snapshots;
  select count(*) into v_items_before from public.research_evidence_snapshot_items;
  select count(*) into v_selections_before from public.research_evidence_snapshot_selections;

  v_result := public.append_and_select_research_evidence_snapshot_v3(v_snapshot_json,v_items,v_selection,v_lineage);
  if (v_result->>'snapshot_created')::boolean then raise exception 'existing immutable snapshot was duplicated'; end if;
  if not (v_result->>'lineage_recorded')::boolean then raise exception 'lineage was not recorded'; end if;

  perform public.append_and_select_research_evidence_snapshot_v3(v_snapshot_json,v_items,v_selection,v_lineage);

  if (select count(*) from public.research_evidence_snapshots) <> v_snapshots_before
     or (select count(*) from public.research_evidence_snapshot_items) <> v_items_before
     or (select count(*) from public.research_evidence_snapshot_selections) <> v_selections_before + 1
     or (select count(*) from public.research_evidence_snapshot_lineage where snapshot_id=v_snapshot.id) <> 1 then
    raise exception 'IC3 V3 idempotency or preservation check failed';
  end if;

  begin
    perform public.append_and_select_research_evidence_snapshot_v3(
      v_snapshot_json,v_items,v_selection,v_lineage || '{"assignment_version":"tampered"}'::jsonb
    );
    raise exception 'tampered lineage was accepted';
  exception when sqlstate '22023' then null;
  end;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_class c where c.oid='public.current_research_evidence_snapshot_lineage_v1'::regclass
    and not ('security_invoker=true'=any(c.reloptions))
  ) then raise exception 'IC3 current-lineage view is not security_invoker'; end if;
  if has_table_privilege('anon','public.research_evidence_snapshot_lineage','select')
     or not has_table_privilege('authenticated','public.research_evidence_snapshot_lineage','select')
     or has_function_privilege('authenticated','public.append_and_select_research_evidence_snapshot_v3(jsonb,jsonb,jsonb,jsonb)'::regprocedure,'execute')
     or not has_function_privilege('service_role','public.append_and_select_research_evidence_snapshot_v3(jsonb,jsonb,jsonb,jsonb)'::regprocedure,'execute') then
    raise exception 'IC3 privilege contract failed';
  end if;
end;
$$;

rollback;
