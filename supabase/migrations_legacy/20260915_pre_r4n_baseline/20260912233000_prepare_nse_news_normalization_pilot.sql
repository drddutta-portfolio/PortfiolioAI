-- Stage N4A preparation: deterministic normalization from previously captured NSE RSS evidence.
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
  'COMPANY_EXCHANGE_FILING','NEWS',2,true,1800,'ELAPSED_TIME',0,'{}'::integer[],
  '{"stage":"N4A","mode":"OWNER_CONTROLLED_NSE_NORMALIZATION_PILOT_ONLY","scheduler_allowed":false,"external_fetches_allowed":false,"normalization_enabled":true,"tone_classification_enabled":false,"max_capture_records_per_pilot":1,"matching":"EXACT_STORED_IDENTITY_ONLY","fuzzy_matching_allowed":false}'::jsonb,
  now()
);
