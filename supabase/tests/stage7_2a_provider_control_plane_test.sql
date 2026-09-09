begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(45);

select extensions.has_table('public','provider_ingestion_controls','provider controls exist');
select extensions.has_table('public','provider_control_events','control audit exists');
select extensions.has_table('public','provider_budget_reservations','atomic reservations exist');
select extensions.has_table('public','provider_usage_events','usage ledger exists');
select extensions.has_table('public','data_ingestion_run_items','run items exist');
select extensions.has_table('public','security_refresh_states','refresh projection exists');
select extensions.has_table('public','refresh_domain_policies','domain policies exist');
select extensions.has_function('public','reserve_provider_budget_v1',array['text','uuid','text','integer','integer'],'reservation RPC exists');
select extensions.has_function('public','settle_provider_budget_v1',array['uuid','integer','integer','integer'],'settlement RPC exists');

select extensions.is((select daily_internal_attempt_limit from public.provider_ingestion_controls where source_code='TRENDLYNE_MCP'),100,'daily internal limit defaults to 100');
select extensions.is((select rolling_internal_attempt_limit from public.provider_ingestion_controls where source_code='TRENDLYNE_MCP'),1500,'rolling internal limit defaults to 1500');
select extensions.is((select per_run_internal_attempt_limit from public.provider_ingestion_controls where source_code='TRENDLYNE_MCP'),40,'per-run limit defaults to 40');
select extensions.is((select concurrency_limit from public.provider_ingestion_controls where source_code='TRENDLYNE_MCP'),1,'provider concurrency defaults to one');
select extensions.is((select actual_provider_quota_status from public.provider_ingestion_controls where source_code='TRENDLYNE_MCP'),'UNKNOWN','contractual quota remains unknown');
select extensions.is((select scheduler_enabled from public.provider_ingestion_controls where source_code='TRENDLYNE_MCP'),false,'scheduler remains disabled');
select extensions.is((select count(*) from public.refresh_domain_policies where source_code='TRENDLYNE_MCP'),11::bigint,'all approved domain policies exist');
select extensions.is((select is_enabled from public.refresh_domain_policies where source_code='TRENDLYNE_MCP' and data_domain='NEWS'),false,'news remains disabled');
select extensions.is((select definition->>'current_price_authority' from public.refresh_domain_policies where source_code='TRENDLYNE_MCP' and data_domain='TECHNICAL_MARKET_DATA'),'ANGEL_ONE','Angel One remains current-price authority');

insert into auth.users(id) values('72000000-0000-0000-0000-000000000001');
select set_config('request.jwt.claim.sub','72000000-0000-0000-0000-000000000001',true);
insert into public.portfolios(id,user_id,name) values('72000000-0000-0000-0000-000000000002','72000000-0000-0000-0000-000000000001','Stage 7.2A test');
insert into public.securities(id,symbol,exchange,name,asset_class,instrument_type) values('72000000-0000-0000-0000-000000000003','CTLTEST','NSE','Control Test','EQUITY','COMMON_STOCK');
insert into public.data_ingestion_runs(id,source_code,portfolio_id,operation,status,requested_count,orchestration_type,trigger_source,policy_version) values
('72000000-0000-0000-0000-000000000010','TRENDLYNE_MCP','72000000-0000-0000-0000-000000000002','TEST','RUNNING',1,'TEST','PILOT',1),
('72000000-0000-0000-0000-000000000011','TRENDLYNE_MCP','72000000-0000-0000-0000-000000000002','TEST','RUNNING',1,'TEST','PILOT',1);

select extensions.ok((select reserved from public.reserve_provider_budget_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010','reserve-1',40,900)),'reservation succeeds below limits');
select extensions.is((select reason_code from public.reserve_provider_budget_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010','reserve-1',40,900)),'IDEMPOTENT_REPLAY','reservation replay is idempotent');
select extensions.is((select reason_code from public.reserve_provider_budget_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010','reserve-over-run',1,900)),'PER_RUN_LIMIT','per-run ceiling is enforced');
select extensions.is((select reason_code from public.reserve_provider_budget_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000011','reserve-concurrent',1,900)),'CONCURRENCY_LIMIT','provider-wide concurrency is enforced');

select extensions.is((select status from public.settle_provider_budget_v1((select id from public.provider_budget_reservations where reservation_key='reserve-1'),30,5,5)),'SETTLED','reservation settles consumed failed and released units');
select extensions.is((select status from public.settle_provider_budget_v1((select id from public.provider_budget_reservations where reservation_key='reserve-1'),30,5,5)),'SETTLED','double settlement is idempotent');
select extensions.throws_ok($$select public.settle_provider_budget_v1((select id from public.provider_budget_reservations where reservation_key='reserve-1'),31,4,5)$$,'P0001','Provider budget reservation already settled differently.','different double settlement is rejected');

insert into public.provider_usage_events(source_code,ingestion_run_id,operation_class,accounting_class,actual_internal_units,attempted_at,completed_at,outcome,safe_error_code,idempotency_key)
select 'TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010','TEST_CALL','PROVIDER_TOOL_ATTEMPT',1,clock_timestamp(),clock_timestamp(),'FAILED','PROVIDER_TIMEOUT','failed-'||g from generate_series(1,60) g;
select extensions.is((select utilization_state from public.get_provider_operational_summary_v1()),'WARNING','warning threshold is reported');
insert into public.provider_usage_events(source_code,ingestion_run_id,operation_class,accounting_class,actual_internal_units,attempted_at,completed_at,outcome,idempotency_key)
select 'TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010','TEST_CALL','PROVIDER_TOOL_ATTEMPT',1,clock_timestamp(),clock_timestamp(),'SUCCEEDED','caution-'||g from generate_series(1,15) g;
select extensions.is((select utilization_state from public.get_provider_operational_summary_v1()),'CAUTION','caution threshold is reported');
insert into public.provider_usage_events(source_code,ingestion_run_id,operation_class,accounting_class,actual_internal_units,attempted_at,completed_at,outcome,idempotency_key)
select 'TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010','TEST_CALL','PROVIDER_TOOL_ATTEMPT',1,clock_timestamp(),clock_timestamp(),'SUCCEEDED','conserve-'||g from generate_series(1,15) g;
select extensions.is((select utilization_state from public.get_provider_operational_summary_v1()),'CONSERVATION','conservation threshold is reported');
insert into public.provider_usage_events(source_code,ingestion_run_id,operation_class,accounting_class,actual_internal_units,attempted_at,completed_at,outcome,idempotency_key)
select 'TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010','TEST_CALL','PROVIDER_TOOL_ATTEMPT',1,clock_timestamp(),clock_timestamp(),'SUCCEEDED','stop-'||g from generate_series(1,10) g;
select extensions.is((select utilization_state from public.get_provider_operational_summary_v1()),'HARD_STOP','hard-stop threshold is reported');
select extensions.is((select reason_code from public.reserve_provider_budget_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000011','reserve-daily-stop',1,900)),'DAILY_LIMIT','daily hard limit refuses work');

insert into public.provider_usage_events(source_code,operation_class,accounting_class,actual_internal_units,attempted_at,completed_at,outcome,idempotency_key)
values('TRENDLYNE_MCP','OLD_CALL','PROVIDER_TOOL_ATTEMPT',1,clock_timestamp()-interval '31 days',clock_timestamp()-interval '31 days','SUCCEEDED','old-outside-rolling');
select extensions.is((select rolling_observed_usage from public.get_provider_operational_summary_v1()),100::bigint,'rolling window excludes older usage');
insert into public.provider_usage_events(source_code,operation_class,accounting_class,actual_internal_units,attempted_at,completed_at,outcome,idempotency_key)
values('TRENDLYNE_MCP','PRIOR_DAY_CALL','PROVIDER_TOOL_ATTEMPT',1,date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'-interval '1 second',clock_timestamp(),'SUCCEEDED','prior-day');
select extensions.is((select daily_observed_usage from public.get_provider_operational_summary_v1()),100::bigint,'UTC daily rollover excludes the prior day');
select public.record_provider_usage_event_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010',null,null,'TTM_FUNDAMENTALS','IDEMPOTENCY_TEST','TRANSPORT_BOOTSTRAP',0,0,clock_timestamp(),clock_timestamp(),'SUCCEEDED',null,0,'usage-idempotency');
select public.record_provider_usage_event_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000010',null,null,'TTM_FUNDAMENTALS','IDEMPOTENCY_TEST','TRANSPORT_BOOTSTRAP',0,0,clock_timestamp(),clock_timestamp(),'SUCCEEDED',null,0,'usage-idempotency');
select extensions.is((select count(*) from public.provider_usage_events where idempotency_key='usage-idempotency'),1::bigint,'usage accounting replay is idempotent without mutating the event');

select public.set_provider_ingestion_control_v1('TRENDLYNE_MCP','{"ingestion_enabled":false}'::jsonb,'kill switch test');
select extensions.is((select reason_code from public.reserve_provider_budget_v1('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000011','reserve-disabled',1,900)),'INGESTION_DISABLED','kill switch blocks before work');
select extensions.is((select count(*) from public.provider_control_events where control_name='INGESTION_ENABLED'),1::bigint,'control change is audited');
select extensions.throws_ok($$update public.provider_control_events set reason='changed'$$,'55000','Provider accounting and audit events are append-only.','control audit is immutable');

insert into public.data_ingestion_run_items(id,ingestion_run_id,security_id,data_domain,status) values('72000000-0000-0000-0000-000000000020','72000000-0000-0000-0000-000000000010','72000000-0000-0000-0000-000000000003','TTM_FUNDAMENTALS','PLANNED');
select extensions.is((select status from public.record_refresh_item_result_v1('72000000-0000-0000-0000-000000000020','ACCEPTED',null,1,7,'{}')),'ACCEPTED','run item completes as accepted');
select extensions.is((select status from public.record_refresh_item_result_v1('72000000-0000-0000-0000-000000000020','ACCEPTED',null,1,7,'{}')),'ACCEPTED','run item completion is idempotent');

insert into public.security_refresh_states(source_code,security_id,data_domain,last_attempt_at,last_success_at,fresh_until,next_eligible_refresh_at,consecutive_failures,refresh_status)
values('TRENDLYNE_MCP','72000000-0000-0000-0000-000000000003','TTM_FUNDAMENTALS',clock_timestamp(),clock_timestamp()-interval '8 days',clock_timestamp()-interval '1 day',clock_timestamp()+interval '10 minutes',1,'FAILED_WITH_CACHE');
select extensions.is((select refresh_status from public.security_refresh_states where security_id='72000000-0000-0000-0000-000000000003'),'FAILED_WITH_CACHE','failed refresh retains valid cached-evidence state');
select extensions.is((select consecutive_failures from public.security_refresh_states where security_id='72000000-0000-0000-0000-000000000003'),1,'consecutive failures are retained');

select extensions.ok(not has_table_privilege('authenticated','public.provider_ingestion_controls','UPDATE'),'browser cannot mutate controls');
select extensions.ok(not has_table_privilege('authenticated','public.provider_usage_events','INSERT'),'browser cannot write usage');
select extensions.ok(not has_table_privilege('authenticated','public.provider_budget_reservations','INSERT'),'browser cannot reserve budget directly');
select extensions.ok(not has_function_privilege('authenticated','public.reserve_provider_budget_v1(text,uuid,text,integer,integer)','EXECUTE'),'browser cannot execute reservation RPC');
select extensions.ok(has_function_privilege('service_role','public.reserve_provider_budget_v1(text,uuid,text,integer,integer)','EXECUTE'),'service role can reserve budget');

select * from extensions.finish();
rollback;
