# R4N local migration replay audit and fixture strategy

Status: **AUDIT COMPLETE / EXECUTION NOT STARTED**  
Scope: local disposable Supabase only  
Production impact: none

## 1. Purpose and safety boundary

This document records the required pre-application audit for the R4N research-subprofile migration. It does not authorize or perform a production change.

The replay must:

- leave every committed historical migration byte-for-byte unchanged;
- leave the current local development database unchanged until the strategy is reviewed;
- use an independently named, disposable local Supabase stack;
- create only deterministic, visibly synthetic prerequisite records inside that disposable stack;
- never import, copy, or imitate a user's real portfolio, transaction, price, fundamental, recommendation, or evidence rows;
- make no provider call and invoke no scheduled job;
- apply the repository R4N migration only after the complete historical chain has replayed successfully;
- destroy the disposable database after retaining non-sensitive test output.

## 2. Audit result

The repository contains 76 SQL migration files. The current local database has applied migrations through `20260907123000`. A previous `migration up` stopped atomically at `20260907130000_verify_motherson_angel_mapping.sql`; `20260915094042_create_research_subprofile_assignments.sql` was not applied and no R4N table was created.

### 2.1 Hard state dependency

`20260907130000_verify_motherson_angel_mapping.sql` deliberately fails closed unless all of the following already exist:

- canonical MOTHERSON security id `9d28c14f-9035-4028-a8d7-128886031b00` with the migration's exact NSE symbol, ISIN, asset class and instrument type;
- one `ANGEL_ONE` mapping in `AMBIGUOUS` state whose evidence contains both reviewed candidates (`25510 / MOTHERSON-D1` and `4204 / MOTHERSON-EQ`);
- exactly one distinct portfolio owner connected to that security by an `ACTIVE` transaction.

The first two items are historical identity/review evidence encoded by the migration. The ownership lookup is the only requirement that needs a synthetic accounting wrapper in a fresh test database.

### 2.2 Duplicate migration versions

Four version values are each used by two files:

| Version | First file | Second file |
| --- | --- | --- |
| `20260910200000` | `create_scoring_metric_rules.sql` | `verify_bank_metric_mappings_from_live_capture.sql` |
| `20260910210000` | `create_sector_scoring_framework.sql` | `verify_nonfinancial_metric_mappings.sql` |
| `20260910224000` | `align_general_scoring_rule_normalization.sql` | `align_manual_fundamentals_refresh_cadence.sql` |
| `20260911021000` | `review_bank_external_rating_signal.sql` | `stage_8_6c2_bank_growth_primary_evidence.sql` |

Supabase migration history identifies migrations by version, so a clean replay cannot represent both files in each pair without unique test-copy versions. This is a repository-history defect, not an R4N defect. Previously applied files must not be renamed.

### 2.3 Other state-sensitive migrations

- `20260906183000_accept_raw_transactions_record_kind.sql` and `20260906203000_cache_stock_master_identity_evidence.sql` validate the exact preceding function definition. A correctly ordered replay supplies their prerequisite; no data fixture is required.
- `20260908101000_correct_bbox_canonical_asset_class.sql` is explicitly empty-safe when BBOX is absent. No BBOX fixture should be invented.
- HDFCBANK evidence/profile promotion migrations and later classification promotions are empty-safe or definition-only when their reviewed source rows are absent. No HDFCBANK or provider evidence fixture should be invented.
- `20260913133000_reconcile_n5_scheduler_production_state.sql` requires the earlier NEWS refresh policy. That policy is created by the preceding migration chain. The migration defines and schedules local cron jobs but does not itself call a provider. The disposable stack must be destroyed before a cron cadence can execute; scheduled functions must not be invoked during the test.
- `20260914123000_register_pharma_history_raw_metrics.sql` requires the compatible `CFO_ANNUAL` definition created earlier in the chain. No financial observation fixture is required.
- The remaining guards are function runtime validation, immutability protection, RLS, or conflict detection; they do not require portfolio/business data merely to apply.

## 3. Exact fixture strategy

### 3.1 Isolation

Create a temporary project directory with `mktemp -d`. Copy `supabase/config.toml` and all migration files into it, then assign a unique project id and non-production local ports. Do not copy `.env`, Vault values, seed data, storage objects, or database dumps.

The repository migration directory and the current local database remain untouched.

### 3.2 Test-copy version normalization

In the temporary copy only, preserve the first file at each colliding version and rename the second file as follows:

- `20260910200000_verify_bank_metric_mappings_from_live_capture.sql` → `20260910200001_verify_bank_metric_mappings_from_live_capture.sql`
- `20260910210000_verify_nonfinancial_metric_mappings.sql` → `20260910210001_verify_nonfinancial_metric_mappings.sql`
- `20260910224000_align_manual_fundamentals_refresh_cadence.sql` → `20260910224001_align_manual_fundamentals_refresh_cadence.sql`
- `20260911021000_stage_8_6c2_bank_growth_primary_evidence.sql` → `20260911021001_stage_8_6c2_bank_growth_primary_evidence.sql`

This preserves the existing lexical order and gives the disposable migration ledger one unique version per file. It is a replay-harness transformation, not a proposed edit to committed migrations.

### 3.3 Deterministic prerequisite fixture

Add one temporary-only fixture migration at `20260907124500`, between the market-data foundation and the historical MOTHERSON review. It inserts the minimum rows required by the fail-closed guard:

- auth user id: `00000000-0000-4000-8000-000000000101`, email ending in `.invalid`, with metadata `test_only=true`;
- portfolio id: `00000000-0000-4000-8000-000000000102`, name `[TEST ONLY] migration replay prerequisite`;
- canonical MOTHERSON security: use the exact reviewed id and identity asserted by the historical migration;
- one ambiguous Angel One mapping with only the two candidate objects asserted by that migration and `fixture_scope=LOCAL_MIGRATION_REPLAY`;
- one `ACTIVE` `OPENING_POSITION` transaction with quantity `1`, null unit price/amount fields, no broker account, `source_type=TEST_FIXTURE`, `data_quality_status=NEEDS_REVIEW`, and notes stating that it is a synthetic ownership-link prerequisite only.

The transaction is not a claimed trade, price, cost basis, or holding fact. Its only purpose is to satisfy the historical migration's `distinct portfolio.user_id` ownership lookup in an isolated database. Null financial fields remain null; no real portfolio identity or financial value is fabricated.

Before insertion, the fixture aborts if any target id already exists. After insertion, it asserts exactly one qualifying owner and exactly one qualifying ambiguous mapping.

### 3.4 Prevent external effects

- Supply no production URL, API key, scheduler token, provider token, or Vault secret.
- Do not invoke refresh functions, Edge Functions, scheduled functions, or provider commands.
- Complete replay and verification before the first 30-minute cron boundary, then stop and remove the disposable stack.
- Query `net._http_response`/request queue where available and assert that no outbound request was created.

### 3.5 Application and verification sequence

After owner confirmation of this strategy:

1. Create and validate the temporary project and normalized migration inventory.
2. Start the isolated stack and replay all 76 repository migrations plus the single temporary fixture migration.
3. Assert that every repository migration has a corresponding applied test-copy version and that the R4N version is applied last.
4. Run `supabase/tests/r4n_research_subprofile_assignments_test.sql` against the isolated database.
5. Run schema/RLS checks for the R4N tables, policies, constraints, immutability triggers and grants.
6. Confirm the R4N migration created no assignment rows and changed no portfolio, transaction, fundamental, score or recommendation facts beyond the explicit test fixture.
7. Confirm there were no network/provider requests.
8. Capture non-secret results, stop the isolated stack and remove its temporary directory/volumes.
9. Re-check the ordinary local database and production migration state to prove neither changed.

## 4. Go/no-go gates

The replay must stop if:

- another duplicate version is detected;
- a migration needs business data not listed above;
- the scheduler enqueues a request;
- the fixture would need a real user, portfolio, transaction, evidence row or credential;
- any committed migration differs between the repository and temporary copy except the four filename-only version normalizations;
- the ordinary local or linked production migration history changes.

## 5. Decision requested

The audited strategy is ready for owner review. No migration has been applied under this strategy. The next action is to execute this isolated replay exactly as specified after confirmation.
