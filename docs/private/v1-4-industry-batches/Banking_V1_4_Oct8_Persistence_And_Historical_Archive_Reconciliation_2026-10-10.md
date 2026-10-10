# BANK V1-4 — October 8 persistence and historical-archive reconciliation
**Date:** 2026-10-10
**Scope:** Draft PR #124 / Development only. Production/main/V1-5 unchanged.

## 1. October 8 persistence discrepancy — PROVEN CAUSE

The earlier statement that Development contained zero October 8 ANGEL_ONE rows was incorrect. It used the UTC calendar date of a `timestamptz` rather than the NSE local session date.

For action `V1_4_BANK_TAIL_2026_10_08`, live Development readback proves:
- `market_price_history`: **16 rows total** from the action.
- **13/13 bank rows are the 2026-10-08 NSE session** when `period_start` is interpreted in `Asia/Kolkata`.
- Their stored timestamp is `2026-10-07 18:30:00+00` = `2026-10-08 00:00 Asia/Kolkata`.
- The remaining three action rows are October 7 IST repair sessions for **KARURVYSYA, KOTAKBANK and SBIN**, matching the original acquisition report.
- `market_benchmark_price_history`: **one NIFTY_BANK October 8 IST session**, likewise stored at `2026-10-07 18:30:00+00`.
- These rows retain `provenance.operation=V1_4_BANK_TAIL_2026_10_08` and the original `source_record_id` lineage.

The original immutable capture set also remains present in `data_source_records` with source `ANGEL_ONE`, record kind `V1_4_BANK_TAIL_CAPTURE`, original payload hashes and the one-time grant lineage. The deployed executor is still `v14-bank-tail-acquisition` v1 with SHA-256 `56f5ee80adb96072bfef5bc573eca99acd43cd6ca510594d6be6ee3f7987f753`, matching the historical checkpoint.

**Conclusion:** October 8 was acquired **and persisted correctly**. The later zero-row finding was a reporting/query error. No October 8 reacquisition is authorized or necessary.

## 2. Grant/accounting boundary

The Oct-8 P4 grant `9e6bba80-df78-47bf-b5d6-4c4c6f3adb30` was created for the exact bank-tail action, expired after the execution window and is recorded consumed. It must not be reused.

The standard `provider_budget_reservations` / `provider_usage_events` tables did not return matching rows for that historical execution window. Therefore the retained evidence proves the grant consumption plus the executor's 1 auth + 14 history-request accounting, but does **not** prove that this custom executor used the standard provider-reservation ledger. This is an accounting-observability gap, not a persistence gap.

As of this reconciliation no current unconsumed/unexpired bank maintenance grant was found. The next completed NSE session after the already-persisted October 8 session is October 9; no paid recovery/canary call was executed without a valid current grant.

## 3. Historical price archive — corrected evidence

The empty Postgres compatibility table `p8_b3_adjusted_market_price_series` does **not** mean adjusted historical price objects are absent.

Direct read-only R2 inventory of bucket `portfolioai-history-dev`, prefix `portfolioai-history/development/p8/b3/adjusted-series/v1/`, proves daily manifest + Parquet objects with SHA metadata:

| Year | Distinct trade-date partitions | Range |
|---|---:|---|
| 2023 | 61 | 2023-10-03 → 2023-12-29 |
| 2024 | 249 | 2024-01-01 → 2024-12-31 |
| 2025 | 249 | 2025-01-01 → 2025-12-31 |
| 2026 | 185 | 2026-01-01 → 2026-09-30 |
| **Total** | **744** | **2023-10-03 → 2026-09-30** |

The B3 R2 namespace also contains distinct `raw-prices/`, `adjusted-decision-ledger/`, `source-authority/` and `canary/` prefixes.

This materially improves the **price-side archive inventory** versus the 15-month live `market_price_history` table. It does **not yet qualify M5/M7** because:
1. the approved contract requires at least 36 qualified month-end observations **distributed across all five preceding years**; this archive spans only about three years;
2. the current inspection proves object/partition existence and object SHA metadata, not yet the per-bank 13-symbol contents of every Parquet partition;
3. M5/M7 additionally require contemporaneously available book-value / positive TTM earnings facts with correct scope, share basis, corporate actions and publication availability. No such five-year matched point-in-time financial series has been proven.

No present-day BVPS/EPS is backfilled into historical dates.

## 4. M6 exact recommended amendment

The authoritative BANK Valuation dimension is 60% M7/P-E self-history, 25% M5/P-B relative and 15% M6/valuation relative to ROE.

Recommended future `BANK_NBFC_STAGE_8_BANK_V2` amendment:
- retire mandatory `PB_ADJUSTED_FOR_ROE` rather than activate an uncalibrated residual-income formula;
- set M6 = 0%;
- redistribute only the Valuation dimension pro rata:
  - M7 = **70.588235%**
  - M5 = **29.411765%**
- preserve all other dimensions, thresholds, mandatory requirements and historical V1 snapshots.

The steady-state justified P/B identity `(ROE-g)/(Ke-g)` requires sustainable through-cycle ROE, constant long-run growth, `Ke>g`, clean-surplus consistency, compatible payout/retention and capital regime, stable risk/cost of equity and matching book-value scope. Those inputs are not currently source-calibrated bank by bank, so the formula remains research context, not an active score.

Immediate current consequence of the proposed amendment alone: **0/13 READY remains 0/13 READY and ₹0 READY remains ₹0**, because M5/M7 and other mandatory evidence remain unresolved.

## 5. Publication precision — current executable boundary

The tested precision evaluator keeps three cases separate:
- **A EXACT:** exact source-certified publication timestamp can be admitted under the current exact-time path if all other controls pass.
- **B DATE_ONLY:** conservative availability bound = 23:59:59.999 Asia/Kolkata on the proven publication date; never fabricate `published_at`.
- **C UNKNOWN_DATE:** retain `published_at=NULL`; verified original bytes establish availability **no later than the first verified retrieval time only**.

The current canonical reviewer still expects exact `published_at`, so B/C are intentionally **non-admitting** until a narrow owner-approved precision amendment is integrated into the single canonical reviewer. For C, retrieval is not publication and cannot establish any pre-retrieval historical point-in-time availability.

## 6. Live current canonical state

Canonical validator: `p7-ic2-materialize-readiness` **v51 ACTIVE**, SHA-256 `260c202064096ac7f426b33feea1eff9ceccf6bc3180a8ff6c55438e14cbbe3d`.

Selected BANK V1 state remains:
- **0/13 READY**
- **11 REVIEW_REQUIRED**
- **2 CONFLICTING** (KARURVYSYA, KOTAKBANK)
- **₹0 / ₹2,05,138.62** frozen value READY
- 26 previously accepted NPA reviews retained
- M1–M4 definitions ACTIVE under approved 150/550 dual clocks
- no new M1–M4 factual ACCEPT from this continuation
- maintenance recurrence/canary not executed because no current executable grant was evidenced.

## 7. Repository repair

A regression test now requires `bankTailDay("2026-10-07T18:30:00.000Z") === "2026-10-08"`, preventing future UTC-date misclassification of the NSE local session.

This record supersedes only the erroneous “zero October 8 canonical rows” conclusion. It does not rewrite or delete the earlier execution/capture records.
