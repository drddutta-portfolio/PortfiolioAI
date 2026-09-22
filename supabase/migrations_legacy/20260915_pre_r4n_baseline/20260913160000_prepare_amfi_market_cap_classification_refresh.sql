insert into public.data_sources(
  code,name,source_kind,evidence_priority,is_active,entitlement_verified,retention_rights_verified,capabilities,configuration
) values (
  'AMFI_OFFICIAL',
  'Association of Mutual Funds in India official market-cap categorisation',
  'PUBLIC_WEB',5,true,true,true,
  jsonb_build_object('market_cap_classification',true,'official_rank_universe',true,'public_primary_source',true),
  jsonb_build_object(
    'source_page','https://www.amfiindia.com/otherdata/categorisation-of-stocks',
    'current_dataset_url','https://portal.amfiindia.com/spages/AverageMarketCapitalization30Jun2026.xlsx',
    'current_period_end','2026-06-30',
    'retention_scope','normalized_public_reference_facts_and_dataset_hash'
  )
)
on conflict (code) do update set
  name=excluded.name,source_kind=excluded.source_kind,evidence_priority=excluded.evidence_priority,
  is_active=excluded.is_active,entitlement_verified=excluded.entitlement_verified,
  retention_rights_verified=excluded.retention_rights_verified,capabilities=excluded.capabilities,
  configuration=excluded.configuration,updated_at=now();

do $$
begin
  if not exists (select 1 from vault.secrets where name='portfolioai_amfi_market_cap_refresh_token') then
    perform vault.create_secret(
      encode(gen_random_bytes(48),'hex'),
      'portfolioai_amfi_market_cap_refresh_token',
      'Internal token for the PortfolioAI AMFI market-cap classification refresh Edge Function'
    );
  end if;
end $$;

create or replace function public.verify_amfi_market_cap_refresh_token_v1(p_token text)
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select coalesce(
    p_token is not null and p_token <> '' and p_token = (
      select decrypted_secret from vault.decrypted_secrets
      where name='portfolioai_amfi_market_cap_refresh_token' limit 1
    ),false
  );
$$;
revoke all on function public.verify_amfi_market_cap_refresh_token_v1(text) from public, anon, authenticated;
grant execute on function public.verify_amfi_market_cap_refresh_token_v1(text) to service_role;

create or replace function public.invoke_amfi_market_cap_refresh_v1(p_action text default 'DRY_RUN')
returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
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
revoke all on function public.invoke_amfi_market_cap_refresh_v1(text) from public, anon, authenticated;
grant execute on function public.invoke_amfi_market_cap_refresh_v1(text) to service_role;
