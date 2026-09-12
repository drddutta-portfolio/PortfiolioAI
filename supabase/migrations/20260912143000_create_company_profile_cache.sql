-- Designs follow-up: one-time company profile + logo cache for Research.
-- This migration only defines storage/provenance infrastructure. It does not fetch provider data.

insert into public.data_sources (
  code, name, source_kind, evidence_priority, is_active,
  entitlement_verified, retention_rights_verified, capabilities, configuration
) values (
  'SCREENER_WEB',
  'Screener.in public company profile discovery',
  'PUBLIC_WEB',
  95,
  true,
  true,
  false,
  '{"company_profile_discovery":true,"official_website_discovery":true,"logo_cache":true,"financial_evidence_authority":false}'::jsonb,
  '{"raw_html_retention":false,"normalized_profile_cache":true,"owner_triggered_only":true,"default_refresh":"ONCE_UNLESS_FORCED"}'::jsonb
)
on conflict (code) do nothing;

insert into public.provider_ingestion_controls (
  source_code, ingestion_enabled, scheduler_enabled,
  daily_internal_attempt_limit, rolling_internal_attempt_limit, rolling_window_days,
  per_run_internal_attempt_limit, concurrency_limit,
  warning_threshold, caution_threshold, conservation_threshold, hard_stop_threshold,
  consecutive_failure_threshold, actual_provider_quota_status, actual_provider_quota,
  policy_version
) values (
  'SCREENER_WEB', true, false,
  25, 300, 30,
  5, 1,
  0.6000, 0.7500, 0.9000, 1.0000,
  5, 'UNKNOWN', null,
  1
)
on conflict (source_code) do nothing;

insert into public.refresh_domain_policies (
  source_code, data_domain, policy_version, is_enabled,
  freshness_seconds, freshness_basis, cooldown_seconds,
  retry_schedule_seconds, definition
) values (
  'SCREENER_WEB', 'COMPANY_PROFILE', 1, true,
  31536000, 'EVENT_WITH_BACKSTOP', 0,
  array[60,600,3600],
  '{"description":"Owner-triggered company About/logo discovery; cached after first successful acquisition","automatic_page_load_refresh":false,"financial_evidence_authority":false}'::jsonb
)
on conflict do nothing;

create table public.security_company_profiles (
  security_id uuid primary key references public.securities(id) on delete restrict,
  profile_status text not null default 'MISSING'
    check (profile_status in ('MISSING','PARTIAL','READY','FAILED')),
  about_summary text
    check (about_summary is null or (about_summary = btrim(about_summary) and length(about_summary) between 1 and 3000)),
  company_website_url text
    check (company_website_url is null or company_website_url ~ '^https?://'),
  source_code text references public.data_sources(code) on delete restrict,
  source_url text
    check (source_url is null or source_url ~ '^https?://'),
  source_record_id uuid references public.data_source_records(id) on delete restrict,
  source_about_hash text
    check (source_about_hash is null or source_about_hash ~ '^[a-f0-9]{64}$'),
  logo_storage_path text
    check (logo_storage_path is null or (logo_storage_path = btrim(logo_storage_path) and logo_storage_path <> '')),
  logo_source_url text
    check (logo_source_url is null or logo_source_url ~ '^https?://'),
  logo_content_type text
    check (logo_content_type is null or logo_content_type in ('image/png','image/jpeg','image/webp','image/svg+xml')),
  about_retrieved_at timestamptz,
  logo_retrieved_at timestamptz,
  last_checked_at timestamptz,
  last_safe_error_code text
    check (last_safe_error_code is null or last_safe_error_code ~ '^[A-Z0-9_]+$'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint security_company_profile_ready_check check (
    profile_status <> 'READY' or (about_summary is not null and logo_storage_path is not null)
  )
);

create index security_company_profiles_status_idx
  on public.security_company_profiles(profile_status, last_checked_at desc);

create trigger security_company_profiles_set_audit_timestamps
before insert or update on public.security_company_profiles
for each row execute function public.portfolioai_set_audit_timestamps();

alter table public.security_company_profiles enable row level security;
revoke all on table public.security_company_profiles from anon, authenticated;
grant select on table public.security_company_profiles to authenticated;

create policy "Users can read company profiles for owned securities"
on public.security_company_profiles
for select to authenticated
using (
  exists (
    select 1
    from public.transactions t
    join public.portfolios p on p.id = t.portfolio_id
    where t.security_id = security_company_profiles.security_id
      and p.user_id = (select auth.uid())
  )
);

-- Logos are non-sensitive public presentation assets. Only service-role code uploads/deletes;
-- public bucket semantics are intentionally used only for serving the cached logo bytes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  true,
  524288,
  array['image/png','image/jpeg','image/webp','image/svg+xml']
)
on conflict (id) do nothing;

comment on table public.security_company_profiles is
  'Cached, provenance-linked company About summary and presentation logo. Provider pages are not fetched on normal Research page loads.';
