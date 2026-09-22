-- Stage N4C preparation: one-fetch official NSE linked-document capture pilot.
-- Capture only. No document parsing, normalized-news mutation, AI, or scheduler enablement.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-source-documents',
  'news-source-documents',
  false,
  5242880,
  array['application/pdf','application/xml','text/xml']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

update public.refresh_domain_policies
set effective_to=now()
where source_code='COMPANY_EXCHANGE_FILING'
  and data_domain='NEWS'
  and effective_to is null;

insert into public.refresh_domain_policies(
  source_code,data_domain,policy_version,is_enabled,freshness_seconds,freshness_basis,
  cooldown_seconds,retry_schedule_seconds,definition,effective_from
) values (
  'COMPANY_EXCHANGE_FILING','NEWS',4,true,1800,'ELAPSED_TIME',0,'{}'::integer[],
  '{"stage":"N4C","mode":"OWNER_CONTROLLED_NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY","scheduler_allowed":false,"external_fetches_allowed":true,"max_external_fetches_per_pilot":1,"normalization_enabled":false,"linked_document_capture_enabled":true,"linked_document_parsing_enabled":false,"tone_classification_enabled":false,"importance_classification_enabled":false,"ai_enabled":false,"allowed_host":"nsearchives.nseindia.com","redirects_allowed":false,"max_document_bytes":5242880}'::jsonb,
  now()
);
