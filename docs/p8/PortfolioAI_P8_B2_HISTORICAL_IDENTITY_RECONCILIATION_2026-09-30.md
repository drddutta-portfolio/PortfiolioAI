# PortfolioAI P8-B2 historical identity reconciliation

Date: 30 September 2026  
Environment: PortfolioAI Development only  
Status: **LOCAL RECONCILIATION COMPLETE / BLOCKERS PROVEN / MATERIALIZATION BLOCKED**

## Why this gate exists

The acquired official NSE CM MII security-master evidence contains 5,211 unique equity ISINs across the 32 proven monthly files. PortfolioAI Dev currently contains 284 canonical securities, of which 256 have an ISIN.

The P8-B2 tables intentionally reference canonical `securities.id`. The existing B2 design explicitly prohibits inventing security identity and notes that canonical additions for genuinely historical/delisted instruments are a separate materialization concern. Therefore historical universe rows must not be written until the exact ISIN overlap, null-ISIN current-security candidates, symbol collisions and required canonical additions are measured.

## Repository artifacts

- `scripts/p8/p8-b2-reconcile-historical-identities.mjs`
- `docs/p8/PortfolioAI_P8_B2_CURRENT_SECURITY_IDENTITY_SNAPSHOT_2026-09-30.json`

The canonical snapshot is an immutable read-only capture of `public.securities` from PortfolioAI Dev at 2026-09-30 17:41:44.550571+00. It contains 284 securities / 256 distinct ISINs and no portfolio position or transaction data.

## Local reconciliation command

Run from the same worktree that already contains `tmp/p8-b2-nse`:

```bash
node scripts/p8/p8-b2-reconcile-historical-identities.mjs
```

Output:

`tmp/p8-b2-nse/historical-identity-reconciliation.json`

The runner revalidates the acquired CSV/GZIP hashes, re-parses only official NSE instrument type `0 = Equities`, compares all 5,211 historical ISINs to the frozen Development security snapshot, detects current null-ISIN symbol candidates and symbol collisions, and inspects GZIP MTIME metadata as a possible exact source-publication timestamp signal.

The runner performs **zero database writes and zero provider calls**. It intentionally exits with status 2 when any materialization blocker remains; that exit is a fail-closed gate, not a crash.

## Current boundary

No historical listing observation, universe run, member, selection or evidence link has been inserted by this checkpoint. No canonical security row has been created or modified. P8-B3 and P8-C remain not authorized.

## Reconciliation result

The owner-run reconciliation completed against Development commit `ddb6a4488046981435b4b2a59bcd7a36eec047dc`.

```text
files_checked = 32
total_equity_rows = 597092
historical_unique_isins = 5211
canonical_securities = 284
canonical_distinct_isins = 256
matched_by_isin = 256
current_null_isin_symbol_candidates = 7
canonical_additions_required = 4948
current_symbol_collision_groups = 51
latest_multi_symbol_isins = 25
latest_multi_name_isins = 882
current_equity_isins_absent_from_archive = 0
rows_missing_isin = 0
parse_error_count = 0
hash_mismatch_count = 0
gzip_mtime_present_files = 0
gzip_mtime_missing_files = 32
gzip_mtime_same_calendar_date_files = 0
ready_for_materialization = false
```

Blocking reasons:

1. `SOURCE_PUBLICATION_TIMESTAMP_NOT_PROVEN_FROM_GZIP_METADATA`
2. `CANONICAL_CURRENT_SECURITIES_REQUIRE_ISIN_RECONCILIATION`
3. `CANONICAL_HISTORICAL_SECURITY_ADDITIONS_REQUIRED`

This is an expected fail-closed result. The source files and parsed identity evidence are internally clean; the remaining work is provenance-time proof plus identity persistence design/remediation. No historical materialization has been performed.
