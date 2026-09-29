-- P7-IC IC2 canonical-selection ledger verification.
-- Run only against a local/replay database AFTER
-- 20260929235000_add_p7_ic2_canonical_snapshot_selection_ledger.sql.
-- The whole script rolls back.

begin;

do $$
declare
  v_backfill bigint;
  v_current bigint;
  v_distinct bigint;
  v_backfill_fingerprint text;
  v_current_fingerprint text;
begin
  select count(*) into v_backfill
  from public.research_evidence_snapshot_selections
  where selection_basis = 'BACKFILL_CURRENT_VIEW';

  select count(*), count(distinct (portfolio_id, security_id))
  into v_current, v_distinct
  from public.current_research_evidence_snapshot_v1;

  if v_backfill <> v_current then
    raise exception 'backfill/current cardinality mismatch: % vs %', v_backfill, v_current;
  end if;

  if v_current <> v_distinct then
    raise exception 'current view contains duplicate portfolio/security rows: rows %, distinct %', v_current, v_distinct;
  end if;

  if exists (
    (
      select portfolio_id, security_id, snapshot_id
      from public.research_evidence_snapshot_selections
      where selection_basis = 'BACKFILL_CURRENT_VIEW'
      except
      select portfolio_id, security_id, id
      from public.current_research_evidence_snapshot_v1
    )
    union all
    (
      select portfolio_id, security_id, id
      from public.current_research_evidence_snapshot_v1
      except
      select portfolio_id, security_id, snapshot_id
      from public.research_evidence_snapshot_selections
      where selection_basis = 'BACKFILL_CURRENT_VIEW'
    )
  ) then
    raise exception 'backfill/current exact snapshot-id mapping mismatch';
  end if;

  select md5(string_agg(
    portfolio_id::text || ':' || security_id::text || ':' || snapshot_id::text,
    E'\n'
    order by portfolio_id, security_id
  ))
  into v_backfill_fingerprint
  from public.research_evidence_snapshot_selections
  where selection_basis = 'BACKFILL_CURRENT_VIEW';

  select md5(string_agg(
    portfolio_id::text || ':' || security_id::text || ':' || id::text,
    E'\n'
    order by portfolio_id, security_id
  ))
  into v_current_fingerprint
  from public.current_research_evidence_snapshot_v1;

  if v_backfill_fingerprint is distinct from v_current_fingerprint then
    raise exception 'backfill/current deterministic fingerprint mismatch: % vs %',
      v_backfill_fingerprint, v_current_fingerprint;
  end if;
end;
$$;

do $$
declare
  v_reloptions text[];
begin
  select reloptions into v_reloptions
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'current_research_evidence_snapshot_v1';

  if not ('security_invoker=true' = any(coalesce(v_reloptions,'{}'::text[]))) then
    raise exception 'current research evidence view is not security_invoker=true';
  end if;

  if has_table_privilege('anon','public.research_evidence_snapshot_selections','SELECT') then
    raise exception 'anon unexpectedly has SELECT on selection ledger';
  end if;

  if not has_table_privilege('authenticated','public.research_evidence_snapshot_selections','SELECT') then
    raise exception 'authenticated is missing SELECT on selection ledger';
  end if;

  if has_table_privilege('authenticated','public.research_evidence_snapshot_selections','INSERT')
     or has_table_privilege('authenticated','public.research_evidence_snapshot_selections','UPDATE')
     or has_table_privilege('authenticated','public.research_evidence_snapshot_selections','DELETE') then
    raise exception 'authenticated unexpectedly has write privileges on selection ledger';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.append_and_select_research_evidence_snapshot_v2(jsonb,jsonb,jsonb)',
    'EXECUTE'
  ) then
    raise exception 'authenticated unexpectedly has EXECUTE on V2 append/select function';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.append_and_select_research_evidence_snapshot_v2(jsonb,jsonb,jsonb)',
    'EXECUTE'
  ) then
    raise exception 'service_role is missing EXECUTE on V2 append/select function';
  end if;
end;
$$;

do $$
declare
  v_security_id uuid;
  v_portfolio_id uuid;
  v_original_current uuid;
  v_older_snapshot public.research_evidence_snapshots%rowtype;
  v_other_snapshot public.research_evidence_snapshots%rowtype;
  v_items jsonb;
  v_snapshot_json jsonb;
  v_other_snapshot_json jsonb;
  v_selection_json jsonb;
  v_first jsonb;
  v_retry jsonb;
  v_run uuid := gen_random_uuid();
  v_snapshot_count_before bigint;
  v_snapshot_count_after bigint;
  v_item_count_before bigint;
  v_item_count_after bigint;
  v_selection_count_after_first bigint;
  v_selection_count_after_retry bigint;
begin
  select c.portfolio_id, c.security_id, c.id
  into v_portfolio_id, v_security_id, v_original_current
  from public.current_research_evidence_snapshot_v1 c
  where (
    select count(*)
    from public.research_evidence_snapshots s
    where s.portfolio_id = c.portfolio_id
      and s.security_id = c.security_id
  ) >= 2
  order by c.security_id
  limit 1;

  if v_security_id is null then
    raise exception 'behavioral fixture requires one security with at least two immutable snapshots';
  end if;

  select s.* into v_older_snapshot
  from public.research_evidence_snapshots s
  where s.portfolio_id = v_portfolio_id
    and s.security_id = v_security_id
    and s.id <> v_original_current
  order by s.created_at asc, s.id asc
  limit 1;

  select s.* into v_other_snapshot
  from public.research_evidence_snapshots s
  where s.portfolio_id = v_portfolio_id
    and s.security_id = v_security_id
    and s.id = v_original_current;

  select jsonb_agg(
    jsonb_build_object(
      'requirement_code', i.requirement_code,
      'metric_code', i.metric_code,
      'required', i.required,
      'minimum_history', i.minimum_history,
      'freshness_policy', i.freshness_policy,
      'benchmark_authority', i.benchmark_authority,
      'applicability', i.applicability,
      'evidence_state', i.evidence_state,
      'candidate_evidence_ids', i.candidate_evidence_ids,
      'selected_evidence_id', i.selected_evidence_id,
      'evidence_as_of_date', i.evidence_as_of_date,
      'retrieved_at', i.retrieved_at,
      'fresh_through', i.fresh_through,
      'source_provider', i.source_provider,
      'raw_source_record_id', i.raw_source_record_id,
      'normalized_value', i.normalized_value,
      'validation_state', i.validation_state,
      'canonical_selection_state', i.canonical_selection_state,
      'reason_code', i.reason_code,
      'recommended_remediation_action', i.recommended_remediation_action
    )
    order by i.requirement_code
  )
  into v_items
  from public.research_evidence_snapshot_items i
  where i.snapshot_id = v_older_snapshot.id;

  if v_items is null or jsonb_array_length(v_items) = 0 then
    raise exception 'behavioral fixture older snapshot has no items';
  end if;

  v_snapshot_json := jsonb_build_object(
    'portfolio_id', v_older_snapshot.portfolio_id,
    'security_id', v_older_snapshot.security_id,
    'as_of_date', v_older_snapshot.as_of_date,
    'methodology_authority', v_older_snapshot.methodology_authority,
    'methodology_version', v_older_snapshot.methodology_version,
    'profile_code', v_older_snapshot.profile_code,
    'subprofile_code', v_older_snapshot.subprofile_code,
    'requirement_registry_version', v_older_snapshot.requirement_registry_version,
    'snapshot_status', v_older_snapshot.snapshot_status,
    'snapshot_hash', v_older_snapshot.snapshot_hash,
    'created_by', v_older_snapshot.created_by
  );

  v_selection_json := jsonb_build_object(
    'selection_run_id', v_run,
    'execution_grant_id', null,
    'evaluation_as_of', (v_older_snapshot.as_of_date::timestamp + interval '12 hours') at time zone 'UTC',
    'source_cutoff_at', (v_older_snapshot.as_of_date::timestamp + interval '11 hours') at time zone 'UTC',
    'selection_basis', 'CORRECTIVE_RESELECTION',
    'materializer_version', 'P7_IC2_SELECTION_LEDGER_TEST_V1',
    'selected_by', null
  );

  select count(*) into v_snapshot_count_before from public.research_evidence_snapshots;
  select count(*) into v_item_count_before from public.research_evidence_snapshot_items;

  v_first := public.append_and_select_research_evidence_snapshot_v2(
    v_snapshot_json,
    v_items,
    v_selection_json
  );

  if (v_first->>'snapshot_id')::uuid <> v_older_snapshot.id then
    raise exception 'existing deterministic snapshot was not reused';
  end if;

  if coalesce((v_first->>'snapshot_created')::boolean,true) then
    raise exception 'reselection unexpectedly created a duplicate snapshot';
  end if;

  if not coalesce((v_first->>'selection_created')::boolean,false) then
    raise exception 'first selection event was not created';
  end if;

  if (
    select id
    from public.current_research_evidence_snapshot_v1
    where portfolio_id = v_portfolio_id
      and security_id = v_security_id
  ) <> v_older_snapshot.id then
    raise exception 'older recomputed snapshot did not become canonical';
  end if;

  select count(*) into v_snapshot_count_after from public.research_evidence_snapshots;
  select count(*) into v_item_count_after from public.research_evidence_snapshot_items;

  if v_snapshot_count_after <> v_snapshot_count_before
     or v_item_count_after <> v_item_count_before then
    raise exception 'reselection mutated immutable snapshot/item cardinality';
  end if;

  select count(*) into v_selection_count_after_first
  from public.research_evidence_snapshot_selections
  where portfolio_id = v_portfolio_id
    and selection_run_id = v_run
    and security_id = v_security_id;

  v_retry := public.append_and_select_research_evidence_snapshot_v2(
    v_snapshot_json,
    v_items,
    v_selection_json
  );

  if (v_retry->>'selection_id')::uuid <> (v_first->>'selection_id')::uuid then
    raise exception 'same-run retry did not return the same selection id';
  end if;

  if coalesce((v_retry->>'selection_created')::boolean,true) then
    raise exception 'same-run retry created a duplicate selection';
  end if;

  select count(*) into v_selection_count_after_retry
  from public.research_evidence_snapshot_selections
  where portfolio_id = v_portfolio_id
    and selection_run_id = v_run
    and security_id = v_security_id;

  if v_selection_count_after_retry <> v_selection_count_after_first then
    raise exception 'same-run retry changed selection cardinality';
  end if;

  begin
    perform public.append_and_select_research_evidence_snapshot_v2(
      v_snapshot_json,
      jsonb_set(v_items, '{0,reason_code}', to_jsonb('TAMPERED_PAYLOAD'::text)),
      jsonb_set(v_selection_json, '{selection_run_id}', to_jsonb(gen_random_uuid()))
    );
    raise exception 'tampered existing-snapshot payload unexpectedly succeeded';
  exception
    when sqlstate '22023' then
      null;
  end;

  v_other_snapshot_json := jsonb_build_object(
    'portfolio_id', v_other_snapshot.portfolio_id,
    'security_id', v_other_snapshot.security_id,
    'as_of_date', v_other_snapshot.as_of_date,
    'methodology_authority', v_other_snapshot.methodology_authority,
    'methodology_version', v_other_snapshot.methodology_version,
    'profile_code', v_other_snapshot.profile_code,
    'subprofile_code', v_other_snapshot.subprofile_code,
    'requirement_registry_version', v_other_snapshot.requirement_registry_version,
    'snapshot_status', v_other_snapshot.snapshot_status,
    'snapshot_hash', v_other_snapshot.snapshot_hash,
    'created_by', v_other_snapshot.created_by
  );

  select jsonb_agg(
    jsonb_build_object(
      'requirement_code', i.requirement_code,
      'metric_code', i.metric_code,
      'required', i.required,
      'minimum_history', i.minimum_history,
      'freshness_policy', i.freshness_policy,
      'benchmark_authority', i.benchmark_authority,
      'applicability', i.applicability,
      'evidence_state', i.evidence_state,
      'candidate_evidence_ids', i.candidate_evidence_ids,
      'selected_evidence_id', i.selected_evidence_id,
      'evidence_as_of_date', i.evidence_as_of_date,
      'retrieved_at', i.retrieved_at,
      'fresh_through', i.fresh_through,
      'source_provider', i.source_provider,
      'raw_source_record_id', i.raw_source_record_id,
      'normalized_value', i.normalized_value,
      'validation_state', i.validation_state,
      'canonical_selection_state', i.canonical_selection_state,
      'reason_code', i.reason_code,
      'recommended_remediation_action', i.recommended_remediation_action
    )
    order by i.requirement_code
  )
  into v_items
  from public.research_evidence_snapshot_items i
  where i.snapshot_id = v_other_snapshot.id;

  -- Reusing the same (run, security) key for different content must fail closed.
  begin
    perform public.append_and_select_research_evidence_snapshot_v2(
      v_other_snapshot_json,
      v_items,
      jsonb_set(
        jsonb_set(
          v_selection_json,
          '{evaluation_as_of}',
          to_jsonb(((v_other_snapshot.as_of_date::timestamp + interval '12 hours') at time zone 'UTC'))
        ),
        '{source_cutoff_at}',
        to_jsonb(((v_other_snapshot.as_of_date::timestamp + interval '11 hours') at time zone 'UTC'))
      )
    );
    raise exception 'expected idempotency-key/content conflict did not fail';
  exception
    when sqlstate '22023' then
      null;
  end;

  -- The selection history itself must remain append-only.
  begin
    update public.research_evidence_snapshot_selections
    set materializer_version = 'ILLEGAL_MUTATION'
    where id = (v_first->>'selection_id')::uuid;
    raise exception 'selection UPDATE unexpectedly succeeded';
  exception
    when sqlstate '55000' then
      null;
  end;

  begin
    delete from public.research_evidence_snapshot_selections
    where id = (v_first->>'selection_id')::uuid;
    raise exception 'selection DELETE unexpectedly succeeded';
  exception
    when sqlstate '55000' then
      null;
  end;
end;
$$;

do $$
declare
  v_snapshot public.research_evidence_snapshots%rowtype;
  v_other_security uuid;
begin
  select s.* into v_snapshot
  from public.research_evidence_snapshots s
  limit 1;

  select id into v_other_security
  from public.securities
  where id <> v_snapshot.security_id
  limit 1;

  if v_snapshot.id is null or v_other_security is null then
    raise exception 'cross-scope FK test requires at least two securities';
  end if;

  begin
    insert into public.research_evidence_snapshot_selections (
      portfolio_id,
      security_id,
      snapshot_id,
      selection_run_id,
      evaluation_as_of,
      source_cutoff_at,
      selection_basis,
      materializer_version
    ) values (
      v_snapshot.portfolio_id,
      v_other_security,
      v_snapshot.id,
      gen_random_uuid(),
      now(),
      now(),
      'CORRECTIVE_RESELECTION',
      'P7_IC2_SELECTION_LEDGER_TEST_V1'
    );
    raise exception 'cross-security selection unexpectedly succeeded';
  exception
    when foreign_key_violation then
      null;
  end;
end;
$$;

rollback;
