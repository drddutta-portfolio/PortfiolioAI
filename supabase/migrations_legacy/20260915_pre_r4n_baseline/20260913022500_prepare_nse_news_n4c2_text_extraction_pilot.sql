-- Stage N4C.2: stored NSE PDF text extraction pilot only.
update public.refresh_domain_policies
set effective_to = now()
where source_code = 'COMPANY_EXCHANGE_FILING'
  and data_domain = 'NEWS'
  and effective_to is null;

insert into public.refresh_domain_policies (
  source_code, data_domain, policy_version, is_enabled, freshness_seconds,
  freshness_basis, cooldown_seconds, retry_schedule_seconds, definition, effective_from
) values (
  'COMPANY_EXCHANGE_FILING', 'NEWS', 5, true, 1800,
  'ELAPSED_TIME', 0, '{}'::integer[],
  '{"stage":"N4C2","mode":"OWNER_CONTROLLED_STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY","scheduler_allowed":false,"external_fetches_allowed":false,"normalization_enabled":false,"linked_document_capture_enabled":false,"linked_document_parsing_enabled":true,"supported_content_type":"application/pdf","max_document_bytes":5242880,"max_pdf_pages":12,"max_extracted_text_chars":20000,"text_extraction_timeout_ms":10000,"ocr_enabled":false,"tone_classification_enabled":false,"importance_classification_enabled":false,"ai_enabled":false}'::jsonb,
  now()
);
