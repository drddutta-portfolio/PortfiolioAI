# PortfolioAI Stage 4 — Development Backend Reconstruction Manifest

**Status:** Stage 4A–4D COMPLETE / PASS with recorded inherited advisor findings
**Date:** 26 September 2026
**Branch:** `PortfolioAI-Development`
**Production project:** `uxiyufbsbgzzdujzcdxe` (`Project-PortfolioAI`)
**Development project:** `lrgpjimipfkyoqbpsqzz` (`PortfolioAI Dev`)

## 1. Safety boundary

This manifest authorizes reconstruction only in `PortfolioAI Dev` under the
owner's Stage 4 instruction. It does not authorize a production migration,
production schema change, production migration-history repair, scheduler,
provider call, AI call, trading action, production deployment, or `main` change.

## 2. Read-only production findings

- Production is `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.
- The Supabase CLI link remained on production throughout Stage 4A inspection.
- Production public schema contains 84 application tables, seven views, 60 SQL
  functions, 79 RLS policies, and the associated constraints, indexes, grants,
  sequences, and triggers captured in the read-only schema dump.
- Production has 32 deployed Edge Functions.
- Production has 17 configured Edge secret names, including Supabase-managed
  names and provider/scheduler/AI names.
- Production has no configured SAML SSO provider.
- The production migration ledger differs materially from the repository ledger,
  as documented by the earlier R4N history audit.
- Production contains real owner portfolio, transaction, market, evidence, news,
  scoring, and operational records. Those records are not part of Stage 4 schema
  reconstruction.
- No production database, Auth, Storage, Edge Function, secret, scheduler, or
  migration-history mutation occurred during the audit.

## 3. Repository comparison

The repository's verified baseline replay and production public schema agree on:

- 84 common application tables;
- all seven application views;
- the principal constraint, index, trigger, grant, and RLS families;
- 59 common SQL functions.

Approved repository-only schema:

- `position_sizing_assessments` table;
- its constraints, indexes, foreign keys, grants, RLS, and owner-read policy.

Approved repository-only forward changes:

- normalized current-security classification view;
- Program A Banking and Pharma taxonomy prerequisites;
- reviewed Trendlyne Pharma mapping;
- reviewed Trendlyne Biotechnology mapping;
- reviewed Trendlyne Bank mapping.

Production-only object:

- `invoke_amfi_market_cap_symbol_fallback_v1(text)`.

The production-only AMFI fallback is intentionally excluded from Dev. Its
approved Edge Function source is absent from `PortfolioAI-Development`, and the
RPC can enqueue an external HTTP request when configured. Copying the SQL alone
would create an incomplete operational path and violate the provider-disabled
Stage 4 boundary.

## 4. Canonical database reconstruction set

Apply the active repository migration chain to the empty development project:

1. immutable no-op legacy compatibility markers;
2. `20260915140000_portfolioai_schema_baseline_v1.sql`;
3. `20260915140001_portfolioai_reference_registry_v1.sql`;
4. `20260915140002_portfolioai_local_operational_defaults_v1.sql`;
5. approved R4N forward reconciliation migrations;
6. approved Program A forward migrations through `20260923111553`.

The schema baseline was previously proven by disposable replay. The curated
reference registry contains global application configuration only. The local
operational-default migration is inert unless an explicit scheduler opt-in GUC
is set; no such opt-in is authorized for Dev.

No production migration ledger row will be copied or repaired in Dev. Dev will
receive the repository-controlled migration ledger produced by normal execution
of the approved active chain.

## 5. Data boundary

Stage 4 creates schema and approved global reference/configuration rows only.
It does not copy:

- production Auth users or sessions;
- owner portfolios or broker accounts;
- transactions or imported source rows;
- prices, market history, provider captures, or evidence;
- news records;
- scores, recommendations, sizing results, or decisions;
- operational usage/run history;
- production Vault values or secrets.

Controlled development users and realistic acceptance data belong to the later
development-data stage unless minimally required to validate Auth/RLS.

## 6. Auth

- Retain the development project's own Auth identity and keys.
- Use email/password behavior required by the application.
- Do not copy password hashes, sessions, refresh tokens, identities, or MFA data.
- No SAML SSO configuration is required.
- Create a controlled owner-equivalent Dev user later for Auth/RLS validation.

## 7. Storage

PortfolioAI stores structured intelligence in Supabase and large research
documents externally. No application-specific Storage dependency was found in
the public schema or application queries. Stage 4 therefore retains the managed
Dev Storage schema but creates no bucket and copies no production object.

## 8. Edge Functions

Deploy only function directories present on `PortfolioAI-Development` and
intended for hosted use. Exclude local/diagnostic functions whose names or code
explicitly define a local-only boundary.

Preserve each approved function's configured `verify_jwt` behavior. The four
functions configured with gateway verification disabled perform their own
application-level authorization and must be revalidated after deployment.

Production-only Edge Functions absent from the approved branch are not copied.

## 9. Edge secrets and external integrations

Dev may receive only Dev-specific Supabase-managed values. The following
external capabilities remain unset or disabled during Stage 4:

- Angel One credentials;
- Trendlyne MCP endpoint;
- OpenAI API key/model;
- news scheduler token;
- local Gate G/H diagnostic feature flags.

Provider-ingestion controls and scheduler policy remain disabled/inert. No
provider, AI, scheduler, or external financial action is part of reconstruction.

## 10. Validation requirements

After reconstruction, verify:

- migration ledger matches the active repository chain;
- 85 public application tables exist with expected RLS;
- seven application views exist and remain `security_invoker` where required;
- SQL functions, triggers, indexes, constraints, grants, and policies exist;
- approved reference/configuration row assertions pass;
- zero portfolio, transaction, evidence, price, score, recommendation, sizing,
  or operational-history rows exist except curated global registries;
- zero cron jobs exist;
- generated TypeScript database types succeed;
- approved Edge Functions are deployed with expected `verify_jwt` settings;
- Dev contains no production project ref or production Supabase credential;
- Auth can be validated with a controlled Dev-only user;
- no application-specific Storage bucket is required;
- Supabase database/security advisors are reviewed;
- production schema, ledger, functions, secrets, and data remain unchanged.

## 11. Expected intentional differences from production

- Dev includes the approved `position_sizing_assessments` schema; production does
  not currently contain it.
- Dev includes the approved Program A taxonomy/mapping changes not yet applied to
  production.
- Dev excludes the production-only AMFI fallback RPC and production-only/stale
  Edge Functions absent from the approved branch.
- Dev has no production portfolio/business data, Auth users, Vault values,
  provider credentials, scheduler secrets, or cron jobs.
- Dev uses its own Supabase URL, keys, Auth identity, and project-managed schemas.

## 12. Stage 4D execution result

The active repository chain was dry-run and then applied only to
`lrgpjimipfkyoqbpsqzz`. It created 86 migration-ledger entries through
`20260923111553_add_reviewed_trendlyne_bank_mapping`. No new migration was
needed: the existing baseline, compatibility markers, reference registry and
forward migrations already reproduce the intended development schema.

Final database evidence:

- 85 public application tables;
- seven public views;
- 59 public SQL functions;
- 80 public RLS policies;
- RLS enabled on all 85 public application tables;
- zero cron jobs;
- zero Auth users;
- zero Storage buckets;
- zero rows across the sampled portfolio, transaction, security, price,
  research-document, recommendation and sizing business tables;
- the generated Dev public-schema dump is byte-for-byte identical to the
  repository-local replay dump: 9,103 lines, 462,843 bytes, SHA-256
  `afa230b9bd626109b5e0dd13124d847eeba63e8587429b6aaebba104df5a4b04`;
- linked TypeScript database-type generation completed successfully;
- linked database lint completed with one inherited warning:
  `get_portfolio_coverage_registry_v1` is declared `STABLE` while containing a
  volatile expression.

The inert operational-default migration reported that scheduler defaults were
skipped because the explicit opt-in setting was absent. This is the expected
safe Dev state.

## 13. Auth and Storage validation result

The Dev Auth settings endpoint returned successfully. Email/password sign-up is
enabled, mailer auto-confirm is disabled, SAML is disabled, and the project has
no copied production user. A controlled owner-equivalent Dev user was not
created because Stage 4 does not need production identity data and the later
development-data stage owns controlled acceptance identities. Full signed-in
RLS acceptance therefore remains a deliberate next-stage validation.

The managed Dev Storage API returned HTTP 200. No PortfolioAI application
bucket is required by the approved code or schema, so the empty bucket set is
intentional.

## 14. Edge Function and secret result

Twenty-seven approved hosted function directories from
`PortfolioAI-Development` were deployed and are `ACTIVE`. The following four
retain `verify_jwt = false` exactly as configured and enforce authorization in
application code:

- `refresh-bank-benchmark`;
- `refresh-market-history`;
- `refresh-pharma-benchmark`;
- `refresh-trendlyne-classification`.

All other deployed functions retain gateway JWT verification. A POST without a
user authorization token to `generate-recommendation-interpretation` returned
HTTP 401, proving the protected gateway path rejects unauthenticated execution.

The four explicitly local/diagnostic directories were not deployed:

- `a2c-local-angel-diagnostic`;
- `g10-2-local-global-generics-evidence`;
- `g10-2-local-trendlyne-gap-fill`;
- `h2-local-pharma-valuation-evidence`.

The Dev secret inventory contains only seven project-managed Supabase names.
Angel One, Trendlyne, OpenAI, scheduler-token and diagnostic-flag names are
absent. No production secret value was read, copied, committed or placed in
Dev. Consequently provider execution, paid AI and scheduling remain inactive.

## 15. Supabase advisor result

The post-reconstruction advisors completed. They report inherited properties of
the approved baseline; Stage 4 did not change them because doing so would be an
unapproved security/architecture change:

- security: 21 RLS-enabled service/internal tables with no direct policy
  (`INFO`), 29 anon GraphQL-visible objects (`WARN`), 71 authenticated
  GraphQL-visible objects (`WARN`), three anon-executable security-definer
  functions (`WARN`), and 14 authenticated-executable security-definer
  functions (`WARN`);
- performance: 108 unindexed foreign keys (`INFO`), two auth-RLS init-plan
  findings (`WARN`), one table without a primary key (`INFO`), and 57 unused
  indexes (`INFO`).

These findings require a separately scoped owner-reviewed hardening assessment.
Unused-index results on a newly created empty database are not evidence that an
approved production index should be removed. Advisor references:
[database linter](https://supabase.com/docs/guides/database/database-linter),
[RLS performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select).

## 16. Closure and remaining validation boundary

Production was inspected read-only and remains `ACTIVE_HEALTHY` on PostgreSQL
17.6.1; no production mutation command was issued. `main` was not modified.
The CLI remains linked to `PortfolioAI Dev`.

Stage 4 establishes a reproducible, provider-disabled development backend. It
does not start Post-D P0, load realistic owner data, create a Dev acceptance
identity, activate providers/schedulers/AI, or reconcile production's divergent
migration ledger. Those remain separate, explicitly gated work.
