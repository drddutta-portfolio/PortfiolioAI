# PortfolioAI P8-B3 Codex-plan alignment audit

Date: 1 October 2026  
Branch: `PortfolioAI-Development`  
Authority checked:

- `docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md`
- `docs/p8/PortfolioAI_P8_ADVANCED_QUANT_BACKTESTING_EXECUTION_PLAN_2026-09-30.md`
- `docs/p8/PortfolioAI_P8_B1_EXPERIMENT_BIAS_CONTROL_CONTRACT_2026-09-30.md`

Result: **ALIGNED WITH ONE DEFERRED ARITHMETIC CONTRACT REQUIREMENT**

## 1. B3 stage intent

Codex requires B3 to:

- acquire and preserve raw market-price evidence;
- preserve raw OHLCV unchanged;
- preserve corporate-action provenance and terms;
- compute adjusted series deterministically;
- distinguish price return from total return;
- cover splits, bonus, dividends, mergers/demergers, symbol changes and delistings;
- reject unexplained discontinuities;
- align benchmark treatment with equity-return treatment;
- close only when hand-verifiable fixtures and repeatability pass and every eligible security/date is adjusted or explicitly blocked.

Current implementation matches this stage intent.

## 2. Data authority alignment

Frozen B1 authority:

- official NSE/company evidence for corporate actions;
- NIFTY 500 Total Return Index for primary benchmark;
- no silent price-index substitution;
- immutable raw OHLCV;
- missing evidence fails closed.

Current B3 implementation:

- raw OHLCV authority = official NSE bhavcopy/UDiFF;
- corporate-action authority = official NSE Corporate Actions;
- benchmark authority = official NSE Indices NIFTY 500 TRI;
- official-source canary = 4 / 4 PROVEN;
- no paid-provider fallback;
- no inferred action from price discontinuity.

Result: **ALIGNED**.

## 3. Schema alignment

Codex requires additive, owner-scoped, immutable persistence. Exact table names are not prescribed.

Current migration:

- 7 additive B3 tables;
- 2 security-invoker read views;
- 1 append-only mutation-rejection function;
- no mutation of existing live market/security relations;
- RLS on every exposed B3 table;
- anon denied;
- authenticated owner-scoped SELECT only;
- service-role write authority;
- raw evidence separated from normalized/derived layers.

The local B3 authority memo initially proposed separate benchmark/equity source-archive relations. The implemented schema instead uses one typed `p8_b3_source_archives` relation with `source_kind`. This preserves the same provenance contract and does not violate the Codex plan.

Result: **ALIGNED**.

## 4. Migration-protocol alignment

Codex protocol requires:

1. inspect current schema/RLS;
2. owner approval for local migration;
3. additive migration;
4. clean local replay/tests;
5. schema diff/migration/lint/types;
6. present exact migration/preservation counts;
7. separate owner approval for hosted Development application;
8. before/after fingerprints;
9. hosted canary and stop on divergence;
10. deploy only required Development components;
11. no broad push when migration-history aliases exist.

Completed:

- 1 through 6 = COMPLETE / PASS;
- step 7 = OWNER APPROVED, but hosted application deliberately paused for this alignment audit;
- broad `db push` explicitly prohibited due B2 migration-version aliasing.

Required next sequence:

- recapture preservation baseline;
- apply only the reviewed B3 migration to hosted PortfolioAI Dev;
- verify 7 tables + 2 views + 1 function, RLS/privileges, and zero initial B3 rows;
- rerun preservation fingerprints and Supabase advisors;
- run hosted schema canary;
- stop on any divergence.

Result: **ALIGNED**.

## 5. Explicit arithmetic-policy gap

Codex B3 requires adjusted series to use **documented precision and rounding**.

The current deterministic module uses Decimal.js and produces reproducible fixtures, but B1 does not freeze a B3-specific arithmetic precision/rounding policy.

This is not a schema blocker because:

- database numerics are not hard-rounded by the migration;
- adjustment rows carry `adjustment_version`;
- adjusted-series rows carry `adjustment_version`;
- no hosted B3 data exists yet.

However, it is a **hard materialization blocker**.

Before any adjustment factors or adjusted price/return series are materialized, the owner must approve a versioned arithmetic contract covering at minimum:

- internal Decimal precision;
- rounding mode;
- whether split/bonus factors remain exact rationals/decimals until final storage;
- stored decimal scale, if any;
- total-return link precision;
- cumulative factor/index precision;
- presentation rounding versus calculation rounding.

No default Decimal.js rounding behavior may be treated as an implicit financial policy.

Disposition: **DEFERRED CONTRACT REQUIREMENT / MUST CLOSE BEFORE B3 ADJUSTMENT MATERIALIZATION**.

## 6. Complex corporate-action alignment

Current normalization enum includes:

- CASH_DIVIDEND
- SPLIT
- BONUS
- RIGHTS
- MERGER
- DEMERGER
- SYMBOL_CHANGE
- DELISTING
- OTHER

Current deterministic implementation computes only:

- split/consolidation from explicit declared terms;
- bonus from explicit declared ratio;
- cash-dividend return links from explicit declared cash amount.

Rights, merger, demerger and other complex actions remain BLOCKED until exact terms and an approved deterministic treatment exist.

This matches Codex fail-closed requirements. Symbol changes and delistings are represented in the data model and must be resolved during acquisition/materialization before Gate B3 can close.

Result: **ALIGNED / NOT YET COMPLETE**.

## 7. Acquisition-sequence alignment

Codex requires the historical data foundation before replay and requires every gap to remain explicit.

Current source canary proves the retrieval authority but does **not** authorize bulk acquisition.

Before full acquisition:

- resolve each candidate weekday into a proven trading/non-trading date from official evidence;
- resolve exact official artifacts for the full frozen window;
- bind market rows to B2 historical identities/listing evidence;
- preserve raw file hashes and parser versions;
- make acquisition resumable/idempotent;
- run a bounded hosted data canary after schema application.

Result: **ALIGNED, WITH BULK ACQUISITION STILL NOT AUTHORIZED**.

## 8. Stage boundary

No work has started on:

- P8-B4 point-in-time fundamentals/documents;
- P8-B5 historical classification/methodology validity;
- P8-B6 canonical snapshot materialization;
- P8-C deterministic replay;
- P8-D+.

Production and `main` remain unchanged.

## 9. Aligned immediate next step

The exact next step under the Codex handoff is:

**Hosted Development schema application only**, using the already-reviewed B3 migration and the already-captured preservation protocol.

After that:

1. hosted schema verification/canary;
2. stop on divergence;
3. freeze B3 arithmetic precision/rounding contract before any adjusted-series materialization;
4. separately authorize bounded acquisition/materialization;
5. only after Gate B3 closure proceed to B4.

No bulk acquisition is implied by the hosted schema approval.
