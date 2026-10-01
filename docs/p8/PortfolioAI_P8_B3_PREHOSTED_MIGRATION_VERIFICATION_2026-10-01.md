# PortfolioAI P8-B3 pre-hosted migration verification

Date: 1 October 2026  
Environment: PortfolioAI Development  
Status: **REMOTE BASELINE VERIFIED / LOCAL PRE-HOSTED RUNNER CREATED / HOSTED APPLICATION NOT AUTHORIZED**

## 1. Purpose

This checkpoint verifies the exact additive B3 migration before any hosted Development application.

PortfolioAI handles financially consequential data. The verification gate therefore requires preservation evidence, schema/security checks, deterministic financial fixtures and repository build hygiene before the migration can be considered for hosted application.

## 2. Hosted Development migration state

Hosted PortfolioAI Dev currently ends at:

```text
remote version = 20260930192959
remote migration = create_p8_b2_historical_identity_registry_v3
```

The repository contains:

```text
20261001001500_create_p8_b2_historical_identity_registry_v3.sql
20261001123000_create_p8_b3_market_history_foundation.sql
```

This confirms an existing migration-version alias between repository and hosted B2 history.

**Consequence:** do not use a broad `supabase db push` for B3. When separately approved, apply exactly the reviewed B3 migration only, then capture its hosted migration version and reconcile the audit trail.

The hosted database currently contains **zero** `p8_b3_*` tables/functions/views.

## 3. Migration static audit

Reviewed migration:

`supabase/migrations/20261001123000_create_p8_b3_market_history_foundation.sql`

Static properties:

```text
create tables = 7
create views = 2
create functions = 1

DROP statements = 0
UPDATE statements = 0
DELETE statements = 0
INSERT statements = 0
ALTER existing non-B3 tables = 0
```

References to existing live market/security relations are documentary/foreign-authority references only. The migration does not alter:

- `market_price_history`;
- `market_price_latest`;
- `market_benchmark_price_history`;
- `securities`;
- P8-B2 evidence/universe rows.

## 4. Hosted preservation baseline

Capture immediately before any later hosted migration application:

```text
securities
  rows = 284
  fingerprint_sum = -71096614391613005803

market_price_history
  rows = 63929
  first = 2025-08-07 18:30:00+00
  last = 2026-09-28 18:30:00+00
  fingerprint_sum = 1886650556560648807899

market_benchmark_price_history
  rows = 2710
  first = 2025-08-25 18:30:00+00
  last = 2026-09-28 18:30:00+00
  fingerprint_sum = -161214581717534960018

P8-B2 historical identities
  rows = 4524
  fingerprint_sum = -203447333955115924373

P8-B2 listing observations
  rows = 562790
  row_hash_fingerprint_sum = -3231956900133089664586

P8-B2 runs = 32
P8-B2 members = 144768
P8-B2 evidence links = 562790
P8-B2 selections = 32
```

The post-migration verification must reproduce these exact counts/fingerprints.

## 5. Hosted advisor baseline

Current Supabase advisor findings are pre-existing and were captured before B3 is hosted.

Security summary:

- `rls_enabled_no_policy`: 21 INFO
- `pg_graphql_anon_table_exposed`: 29 WARN
- `pg_graphql_authenticated_table_exposed`: 95 WARN
- `anon_security_definer_function_executable`: 3 WARN
- `authenticated_security_definer_function_executable`: 14 WARN
- `auth_leaked_password_protection`: 1 WARN

Performance summary:

- `unindexed_foreign_keys`: 135 INFO
- `auth_rls_initplan`: 2 WARN
- `no_primary_key`: 1 INFO
- `unused_index`: 36 INFO

These are baseline project findings, not B3 findings. After hosted application, B3 must not introduce new security advisor warnings. Any new B3 performance finding must be reviewed before acquisition.

Supabase remediation references:

- [RLS enabled with no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Anon GraphQL exposure](https://supabase.com/docs/guides/database/database-linter?lint=0026_pg_graphql_anon_table_exposed)
- [Authenticated GraphQL exposure](https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed)
- [Anon security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Authenticated security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- [RLS initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)

## 6. Already completed local evidence

Before this checkpoint:

```text
clean local db reset = PASS
migration replay = PASS
SQL contract = BEGIN / DO / DO / ROLLBACK
deterministic adjustment tests = 7 / 7 PASS
official-source canary = 4 / 4 PROVEN
```

No hosted B3 schema or data write has occurred.

## 7. Final local pre-hosted verification runner

Created:

`scripts/p8/run-p8-b3-prehosted-verification.sh`

It runs:

1. clean local database replay;
2. B3 SQL contract;
3. deterministic corporate-action fixtures;
4. TypeScript typecheck;
5. scoped ESLint;
6. architecture boundary check;
7. production build;
8. local DB lint, migration listing and local generated types;
9. post-reset local schema diff (must be empty);
10. `git diff --check` plus credential-shaped secret scan.

Expected final marker:

```text
P8_B3_PREHOSTED_VERIFICATION_PASS
```

Artifacts remain local under:

`tmp/p8-b3/prehosted-verification/`

## 8. Hosted application protocol after PASS

Even after the local runner passes, hosted application remains separately approval-gated.

The hosted step, if later approved, must:

1. recapture the preservation baseline immediately before DDL;
2. apply only `create_p8_b3_market_history_foundation`;
3. verify exactly seven B3 tables, two security-invoker views and one mutation-rejection function;
4. verify RLS/privileges;
5. rerun preservation counts/fingerprints;
6. rerun Supabase security/performance advisors;
7. confirm zero B3 data rows immediately after schema application;
8. stop for a hosted schema canary before any bulk historical acquisition.

No `db push` is permitted for this stage because of migration-history aliasing.
