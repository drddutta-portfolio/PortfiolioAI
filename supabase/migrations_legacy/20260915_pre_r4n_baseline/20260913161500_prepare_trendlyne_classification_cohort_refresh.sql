do $$
begin
  if not exists (select 1 from vault.secrets where name='portfolioai_trendlyne_classification_refresh_token') then
    perform vault.create_secret(
      encode(gen_random_bytes(48),'hex'),
      'portfolioai_trendlyne_classification_refresh_token',
      'Internal token for bounded Trendlyne classification-only refresh'
    );
  end if;
end $$;

create or replace function public.verify_trendlyne_classification_refresh_token_v1(p_token text)
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select coalesce(
    p_token is not null and p_token <> '' and p_token = (
      select decrypted_secret from vault.decrypted_secrets
      where name='portfolioai_trendlyne_classification_refresh_token' limit 1
    ),false
  );
$$;
revoke all on function public.verify_trendlyne_classification_refresh_token_v1(text) from public, anon, authenticated;
grant execute on function public.verify_trendlyne_classification_refresh_token_v1(text) to service_role;

create or replace function public.invoke_trendlyne_classification_refresh_v1(
  p_action text default 'DRY_RUN', p_limit integer default 40
)
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
  if p_limit < 1 or p_limit > 40 then raise exception 'INVALID_LIMIT'; end if;

  select decrypted_secret into v_token from vault.decrypted_secrets
  where name='portfolioai_trendlyne_classification_refresh_token' limit 1;
  select decrypted_secret into v_api_url from vault.decrypted_secrets
  where name='portfolioai_api_url' limit 1;
  select decrypted_secret into v_publishable_key from vault.decrypted_secrets
  where name='portfolioai_publishable_key' limit 1;

  if v_token is null or v_api_url is null or v_publishable_key is null then
    raise exception 'TRENDLYNE_CLASSIFICATION_REFRESH_CONFIGURATION_INCOMPLETE';
  end if;

  select net.http_post(
    url := v_api_url || '/functions/v1/refresh-trendlyne-classification',
    headers := jsonb_build_object(
      'Content-Type','application/json','apikey',v_publishable_key,
      'Authorization','Bearer ' || v_publishable_key,
      'x-portfolioai-classification-token',v_token
    ),
    body := jsonb_build_object('action',p_action,'limit',p_limit),
    timeout_milliseconds := 120000
  ) into v_request_id;
  return v_request_id;
end;
$$;
revoke all on function public.invoke_trendlyne_classification_refresh_v1(text,integer) from public, anon, authenticated;
grant execute on function public.invoke_trendlyne_classification_refresh_v1(text,integer) to service_role;
