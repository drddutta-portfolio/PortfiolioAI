# Banking V1-4 — 12 October 2026 execution checkpoint

Scope: Development only; PR #124; frozen 13 banks and value ₹2,05,138.62 unchanged.

## Preserved accepted evidence

KVB's genuine owner ROA review `51deb1ef-6105-4180-a139-30619ed6f5da` is already accepted. The independent 11 October canonical readback selected snapshot `3a3eefc3-1999-47d5-bb3e-6bd4f38e35c6` proves `ROA_ANNUAL` FRESH at 1.93%. Its one-time materialization grant was consumed; live replay returned `P4_GRANT_ALREADY_USED`. Do not repeat approval or reuse that grant.

## Executed engineering and source checks

- Development maintenance runner v2 is ACTIVE, bundle `69433c4267234020d1494c89d523a939bece0aaed474b97fba3623c3e2b61198`. It rejects same-date calls before approved 19:00 IST dispatch before querying a decision or consuming a grant. The live negative request returned HTTP 409 `BANK_MAINTENANCE_SESSION_NOT_PUBLICATION_ELIGIBLE`, `providerCalls: 0`, `grantConsumed: false`. Maintenance runs and captures remain zero.
- The canonical history repair uses the already approved 2026 NSE Capital Market base, pinned semantic baseline and a matching live-page capture no older than 24 hours. Only before ordinary 09:00 IST pre-open does it resolve the preceding completed session. It does not fabricate a Monday CLOSED decision, fetch Monday's unfinished candle or extend the annual horizon. Missing/changed authority, pending special dates and stale refreshes fail closed. The proof expires at pre-open and only applies when retained history ends on that exact completed session with post-close proof.
- Corrected actual-data replay uses the canonical planner's coverage family. All five MARKET_HISTORY input requirements return FRESH. The earlier replay incorrectly forced relative strength and volatility through BENCHMARK_HISTORY; its two mismatches were not live canonical blockers. Explicit stock/index return-basis comparison remains a separate, unqualified calculation investigation and does not invalidate the selected input-readiness evidence.
- Retained original iXBRL captures were rehashed and their annual reporting columns extracted for all 13 banks (14 filings because Federal has two versions). Each pinned original matched its retained acquisition manifest. FY2025–26 ROA cells are verified separately from quarter cells, with no annualization. This is cell verification, **not new canonical admission**. KVB's existing acceptance is preserved. Federal's two captures both report 1.1500 but their revision/publication lineage still needs reconciliation. AUBANK is excluded from the November 2025 Commercial Banks Directions by their express Small Finance Bank exclusion; its separate regulator must be used.
- The three PIT document samples now include original NSE dissemination proof and issuer-page matching. The exchange API's historical KVB ISIN field remains explicitly flagged for dated identity mapping. No retrospective EPS/BVPS or price-adjustment inference has been admitted.

## NIM: bounded search result and inactive feasibility decision

The retained 2021/2023/2025 issuer presentations, FY2025–26 original schedules and newly fetched original 20 July 2026 issuer presentation did not establish a directly certified TTM NIM. Latest original SHA-256: `f43e2de4c3622879da611c25d1c886d9da74a5e3de7cfbb68209c62ad2d86312`, URL `https://www.kvb.bank.in/docs/investor-presentation-2026-07-20.pdf`. It labels Q1 NIM **4.26%** and supplies annual/quarterly series. It does not certify a trailing-four-quarter ratio or its average-earning-assets denominator. Its exclusions include ₹139 crore technically-written-off interest recovery and ₹21.68 crore tax-refund interest. Those adjustments must not silently become the raw mandatory metric. No fresh Trendlyne call was executed: this executor has no callable credentialed provider research grant.

A possible derived contract would require four contiguous same-scope quarters of source-certified NII and exact average interest-earning assets, compatible definitions and revisions, each quarter's actual day count and the issuer's day-count/annualization convention. For an explicitly approved actual-day model with annualization basis D and quarter day counts dᵢ: `TTM NIM = 100 × D × ΣNIIᵢ / Σ(average earning assetsᵢ × dᵢ)`. This is **a proposal, inactive**. Exact quarterly average earning assets are not yet proved. Do not derive them by reversing rounded NIM percentages; do not average quarterly ratios. Reconcile against unadjusted issuer reference periods, separate normalizations, reject missing/nonpositive assets, gaps, scope mismatches and incompatible revisions, and use Decimal with a separately approved rounding convention. Owner approval alone cannot replace missing denominator evidence.

## Acceptance and concrete remaining controls

Latest independently read-back selection is KVB snapshot `2af15b91-4924-4baf-ab1b-c91d62b095dc`, with ROA and all five market-history requirements FRESH. Only `NIM_TTM`, `PE_TTM_RELATIVE`, and `PB_RELATIVE` remain blocked. Banking acceptance remains 0/13 READY and ₹0. No accepted ROA review or valid selected evidence needs repeating.

The 18:55/19:00 Development cron jobs remain active and unchanged. The first eligible scheduled OPEN candidate is 12 October 2026; it has not happened as of this overnight checkpoint. Existing 19:10 IST verification automation is preserved. Actual cron, authoritative OPEN decision, grant, ≤14 history attempts, zero automatic paid retries, reservation/settlement, original captures, stock/index rows and partial-failure/duplicate behavior must be read back after that run. A manual call or future schedule is not evidence of this gate.

The owner has completed Validate and save KVB readiness. Source-qualified PIT denominators/share basis, a valid NIM contract/input path and the other banks' outstanding requirements are the next work. Do not request another ROA approval or repeat the completed save.

No schema migration was created or applied in this continuation. No Production/main, frozen value, financial methodology or accepted review was changed.
