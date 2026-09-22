-- Stage 7.1C: activate the reviewed Trendlyne contract and retain its stable instrument identity.

alter table public.security_identity_observations
  add column provider_instrument_id text;

alter table public.security_identity_observations
  add constraint security_identity_observations_provider_id_check
  check (provider_instrument_id is null or (provider_instrument_id=btrim(provider_instrument_id) and provider_instrument_id<>''));

create unique index security_identity_observations_verified_provider_id_key
  on public.security_identity_observations(source_code,provider_instrument_id)
  where provider_instrument_id is not null and evidence_status='MATCHED';

create unique index research_document_sources_provider_appearance_key
  on public.research_document_sources(source_code,provider_document_id)
  where provider_document_id is not null;

comment on column public.security_identity_observations.provider_instrument_id is
  'Provider-scoped stable instrument identifier retained as evidence; never a canonical PortfolioAI security identifier.';

insert into public.fundamental_metric_definitions(code,name,value_kind,canonical_unit,statement_scope,freshness_seconds,definition) values
  ('MARKET_CAP_PROVIDER_RAW','Provider raw market capitalization','NUMERIC','INR_CRORE','POINT_IN_TIME',86400,'{"selection":"PROVISIONAL","trendlyne_field":"MCAP_Q","price_authority":false}'::jsonb),
  ('REVENUE_TTM','Operating revenue TTM','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,'{"selection":"PROVISIONAL","trendlyne_field":"SR_TTM"}'::jsonb),
  ('NET_PROFIT_TTM','Net profit/PAT TTM','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,'{"selection":"PROVISIONAL","trendlyne_field":"NP_TTM"}'::jsonb),
  ('CFO_ANNUAL','Cash from operating activity annual','NUMERIC','INR_CRORE','CASH_FLOW',7776000,'{"selection":"PROVISIONAL","trendlyne_field":"CFO_A"}'::jsonb),
  ('PE_TTM','Price to earnings TTM','NUMERIC','RATIO','VALUATION',86400,'{"selection":"PROVISIONAL","trendlyne_field":"PE_TTM"}'::jsonb),
  ('ROE_ANNUAL','Return on equity annual','NUMERIC','PERCENT','RATIO',7776000,'{"selection":"PROVISIONAL","trendlyne_field":"ROE_A"}'::jsonb),
  ('PBV_ADJUSTED_PROVIDER','Provider adjusted price to book value','NUMERIC','RATIO','VALUATION',86400,'{"selection":"QUARANTINE","trendlyne_field":"PBV_A","not_equivalent_to":"GENERIC_PBV"}'::jsonb),
  ('SHAREHOLDING_PROMOTER_PLEDGE_PERCENT','Promoter pledge as percent of promoter holding','NUMERIC','PERCENT_OF_PROMOTER_HOLDING','SHAREHOLDING',7776000,'{"selection":"REVIEWED","denominator":"PROMOTER_HOLDING"}'::jsonb),
  ('SHAREHOLDING_FII_FPI_PERCENT','FII/FPI shareholding','NUMERIC','PERCENT','SHAREHOLDING',7776000,'{"selection":"REVIEWED"}'::jsonb),
  ('SHAREHOLDING_DII_PERCENT','DII shareholding','NUMERIC','PERCENT','SHAREHOLDING',7776000,'{"selection":"REVIEWED"}'::jsonb),
  ('SHAREHOLDING_MUTUAL_FUND_PERCENT','Mutual-fund shareholding','NUMERIC','PERCENT','SHAREHOLDING',7776000,'{"selection":"REVIEWED"}'::jsonb),
  ('SHAREHOLDING_PUBLIC_PERCENT','Public shareholding','NUMERIC','PERCENT','SHAREHOLDING',7776000,'{"selection":"REVIEWED"}'::jsonb)
on conflict (code) do nothing;

update public.fundamental_metric_definitions
set definition='{"selection":"REVIEWED","trendlyne_field":"Promoter","aggregate_only":true}'::jsonb
where code='SHAREHOLDING_PROMOTER_PERCENT';

update public.data_sources
set is_active=true,
    entitlement_verified=true,
    retention_rights_verified=true,
    capabilities=capabilities || '{"identity":true,"fundamentals":true,"aggregate_ownership":true,"provisional_document_appearances":true,"strict_stock_id_filtering":true}'::jsonb,
    configuration=configuration || '{"activation":{"approved_by":"PORTFOLIO_OWNER","approval_source":"OWNER_APPROVED_STAGE_7_1C","approved_at":"2026-09-08T00:00:00Z","adapter_contract":"TRENDLYNE_MCP_V1"}}'::jsonb,
    updated_at=now()
where code='TRENDLYNE_MCP';
