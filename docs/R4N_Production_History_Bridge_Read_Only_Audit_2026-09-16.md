# R4N production-history bridge read-only audit — 16 September 2026

Status: **STOPPED — EQUIVALENCE NOT PROVEN / PRODUCTION UNCHANGED**

## Scope and controls

The owner authorized a strictly read-only production inventory for the R4N
production-history bridge. The inspection covered the migration ledger, public
schema, selected global reference-registry counts, scheduler state and table row
counts.

No migration was applied or repaired. No data was written, no provider was called,
no Edge Function was deployed and no scheduler was changed. The ordinary local
database was not changed.

## Decision

The production-history bridge described in
`docs/R4N_Migration_Baseline_Cutover_Plan.md` must not proceed. Its prerequisite is
exact equivalence between production and the reviewed baseline target. Production
differs in migration history, schema, reference state, scheduler state and contains
real portfolio/application data.

Blindly marking the three baseline migrations as applied would conceal these
differences rather than reconcile them. Running them normally would also be unsafe
because the schema baseline is for a fresh database, not an existing production
schema.

## Findings

### 1. Migration ledger

`supabase migration list --linked` found:

- 31 versions present in both the active local history and production;
- 46 active-local versions absent from production; and
- 62 production versions absent from the active local history.

The divergence begins after the shared `20260909100000` region, with a small number
of later coincidental matches. Examples include local `20260910113000` versus
production `20260910113353` and `20260910114400`. The R4N and baseline versions
`20260915094042`, `20260915133027`, `20260915133028`, `20260915140000`,
`20260915140001` and `20260915140002` are absent from production.

This is not the expected state of one equivalent schema with only three new
baseline ledger entries missing.

### 2. Public schema

A read-only production schema dump was compared with the reviewed local baseline.
The normalized catalog is not equivalent.

Baseline-only objects include:

- `research_subprofile_contracts`;
- `research_subprofile_assignments`;
- `research_subprofile_secondary_exposures`;
- `position_sizing_assessments`;
- the R4N assignment-history protection and validation functions.

Production-only inspection found `invoke_amfi_market_cap_symbol_fallback_v1`.

These differences independently fail the exact-schema prerequisite. They are not a
license to drop or overwrite any production object.

### 3. Global reference/configuration state

Read-only counts show both matching and divergent registries:

| Registry | Reviewed baseline | Production |
| --- | ---: | ---: |
| `scoring_models` | 1 | 1 |
| `scoring_profiles` | 13 | 13 |
| `scoring_profile_sector_rules` | 31 | 31 |
| `scoring_profile_dimension_overrides` | 90 | 90 |
| `scoring_profile_metric_overrides` | 20 | 20 |
| `recommendation_profile_policies` | 12 | 12 |
| `fundamental_metric_definitions` | 47 | 29 |
| `scoring_model_dimensions` | 28 | 27 |
| `scoring_model_metric_rules` | 70 | 68 |
| `sectors` | 5 | 43 |
| `industries` | 6 | 27 |
| `classification_source_mappings` | 6 | 27 |

Counts alone do not establish semantic equality even where they match. The broader
production classification registries must be preserved and reconciled by stable
keys; they must not be replaced by the smaller fresh-baseline fixture.

### 4. Scheduler state

Production has two active `pg_cron` jobs:

| Job name | Schedule | Command |
| --- | --- | --- |
| `portfolioai-n5-nse-news-30min` | `*/30 * * * *` | `select public.invoke_nse_news_pipeline_scheduled_v1();` |
| `portfolioai-news-evidence-classification-30min` | `5,35 * * * *` | `select public.reclassify_unclassified_news_from_stored_evidence_v1(100);` |

The fresh/local operational baseline is intentionally inert and creates zero jobs.
The difference is expected across environments but still means scheduler state is
not equivalent and must remain an independently governed production concern.

### 5. Existing production data

Read-only table statistics confirm a populated production system, including one
portfolio, 489 transactions, 273 securities, 458 fundamental observations, 1,346
immutable import-source rows, 24,879 ingestion-run items and four persisted stock
recommendation runs. These are estimates from PostgreSQL statistics and are used
only to establish that production is non-empty.

No reset, replay or broad baseline load is permissible against this database.

## Required forward-only reconciliation plan

Before any further production-history authorization:

1. Establish a stable-key mapping from every production-only migration to its
   final schema/configuration effect and the corresponding immutable legacy source
   or Git commit.
2. Generate a production-compatible target fingerprint that preserves all current
   classification/reference rows and operational objects.
3. Separate genuine missing R4N additions from already-present equivalent effects;
   do not use timestamp similarity as proof of equivalence.
4. Write narrowly scoped, additive, forward-only migrations for only the confirmed
   missing R4N schema/contracts and any separately approved baseline repairs.
5. Test those migrations first against a disposable clone or structure-and-fixture
   representation of the current production state, including RLS, grants,
   immutability, row preservation and scheduler non-mutation checks.
6. Re-run schema and stable-key reference fingerprints. Any unresolved mismatch
   keeps the gate closed.
7. Request a new, explicit production approval only after the exact SQL, backup,
   rollback/forward-recovery procedure and verification report are available.

Production migration-history repair is not currently a safe next action. The safe
next build is the forward-only reconciliation design and disposable proof.

## Artifacts and limitations

Temporary read-only dumps were written outside the repository under `/private/tmp`
for this audit. They contain schema/extension metadata, not a broad export of
production business data.

The row counts reported by table statistics are estimates. Exact counts are not
needed for the stop decision. No row contents, portfolio records or financial
records were exported into the repository.
