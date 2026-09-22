-- Stage N4B preparation: bounded deterministic batch normalization from reviewed NSE RSS evidence.
-- No scheduler enablement and no external network activity are introduced here.

update public.refresh_domain_policies
set effective_to=now()
where source_code='COMPANY_EXCHANGE_FILING'
  and data_domain='NEWS'
  and effective_to is null;

insert into public.refresh_domain_policies(
  source_code,data_domain,policy_version,is_enabled,freshness_seconds,freshness_basis,
  cooldown_seconds,retry_schedule_seconds,definition,effective_from
) values (
  'COMPANY_EXCHANGE_FILING','NEWS',3,true,1800,'ELAPSED_TIME',0,'{}'::integer[],
  '{"stage":"N4B","mode":"OWNER_CONTROLLED_NSE_BATCH_NORMALIZATION_PILOT_ONLY","scheduler_allowed":false,"external_fetches_allowed":false,"normalization_enabled":true,"tone_classification_enabled":true,"tone_method":"DETERMINISTIC_ONLY","importance_classification_enabled":true,"max_capture_records_per_pilot":1,"max_matched_items_per_pilot":20,"matching":"EXACT_STORED_IDENTITY_ONLY","fuzzy_matching_allowed":false}'::jsonb,
  now()
);
