# PortfolioAI P8-B3 local foundation package

Date: 1 October 2026  
Environment: Development repository/local only  
Upstream: P8-B2 COMPLETE / PASS / CLOSED  
Status: **PACKAGE CREATED / LOCAL REPLAY + TEST PENDING / HOSTED APPLICATION NOT AUTHORIZED**

## Non-negotiable financial-data doctrine

PortfolioAI deals with real money. P8-B3 therefore uses a fail-closed evidence contract:

- no corporate action is inferred from a price discontinuity;
- no missing price is interpolated or copied from another date/security;
- no current security identity is projected backward without B2 evidence;
- no price-only benchmark may silently substitute for the frozen NIFTY 500 TRI benchmark;
- no unknown publication/source timestamp is invented;
- no rights/merger/demerger adjustment is computed without sufficient economic terms and an approved deterministic treatment;
- raw exchange evidence is immutable;
- all normalization and adjustment layers are separately versioned and append-only;
- every unresolved item remains an explicit blocker.

## Official-source verification

### Equity OHLCV

Official NSE All Reports is the primary source surface.

Verified report families:

- before the 08-Jul-2024 cutover: `CM - Bhavcopy(csv)`;
- from the cutover: `CM-UDiFF Common Bhavcopy Final (zip)`.

The official NSE report surface states that legacy CM Bhavcopy/Common Bhavcopy was discontinued w.e.f. 08-Jul-2024 in favor of CM-UDiFF Common Bhavcopy Final.

Current official UDiFF filename evidence follows:

`BhavCopy_NSE_CM_0_0_0_YYYYMMDD_F_0000.csv.zip`

The dry-run planner intentionally does **not** invent direct archive URLs. It records the official report surface and expected filename, then requires official source resolution before any download is accepted.

### Corporate actions

Official NSE Corporate Filings → Corporate Actions is the primary source.

Raw evidence fields include:

- symbol;
- company name;
- series;
- purpose;
- face value;
- ex-date;
- record date;
- book-closure start/end.

Raw purpose text is preserved exactly. Normalized action semantics are stored separately.

### Benchmark

Official NSE Indices Historical Data → `Total returns Index Values` is the primary benchmark source.

Frozen benchmark:

`P8_NIFTY500_TRI_V1`

Required primary raw fields:

- IndexName;
- Date;
- Total Returns Index.

Existing Angel One NIFTY 500 history is not treated as TRI authority.

## Local schema package

Migration:

`supabase/migrations/20261001123000_create_p8_b3_market_history_foundation.sql`

Additive relations:

1. `p8_b3_source_archives`
2. `p8_b3_raw_market_price_observations`
3. `p8_b3_corporate_action_observations`
4. `p8_b3_corporate_action_normalizations`
5. `p8_b3_adjustment_factors`
6. `p8_b3_adjusted_market_price_series`
7. `p8_b3_benchmark_total_return_history`

Read models:

- `current_p8_b3_market_coverage_v1`
- `current_p8_b3_corporate_action_coverage_v1`

Security model:

- RLS enabled on all B3 tables;
- anonymous access denied;
- authenticated access is owner-scoped SELECT only;
- service role retains write authority;
- all evidence/derived rows are append-only;
- views use `security_invoker=true`.

No existing live market-data table is modified.

## Deterministic adjustment math

Implementation:

`src/features/backtesting/p8CorporateActionAdjustment.ts`

Tests:

`src/features/backtesting/p8CorporateActionAdjustment.test.ts`

The initial approved math surface is intentionally narrow:

- declared face-value split/consolidation;
- declared bonus ratio;
- explicit cash dividend total-return link;
- rights, mergers, demergers and other complex actions default to BLOCKED until exact terms and treatment are approved.

No raw-purpose free-text parser is allowed to fabricate structured terms.

## SQL contract test

`supabase/tests/p8_b3_market_history_foundation.sql`

It validates:

- append-only enforcement;
- RLS and privilege contract;
- owner-scoped read model configuration;
- resolved action/normalization/factor lineage;
- READY vs BLOCKED normalization constraints;
- raw market evidence immutability;
- derived adjustment immutability;
- benchmark TRI storage contract.

Expected terminal sequence after a clean local reset:

```text
BEGIN
DO
DO
ROLLBACK
```

## Dry-run acquisition planner

`scripts/p8/p8-b3-plan-market-history.mjs`

The planner performs **zero network calls** and **zero database writes**.

It enumerates every weekday in the frozen 2023-10-01 through 2026-09-30 window as a candidate only. A weekday is not declared a trading date until official NSE evidence is resolved.

Expected dry-run candidate counts:

```text
candidate weekdays = 783
legacy-format candidates = 200
UDiFF-format candidates = 583
proven trading dates = 0
resolved download URLs = 0
acquisition ready = false
```

This deliberate non-ready result is the safety gate: the subsequent canary resolver must prove official downloadable artifacts before acquisition can begin.

## Next local gate

Run a clean local database replay, execute the SQL contract test, execute the deterministic TypeScript fixture test, then run the dry-run manifest planner.

No hosted migration application, official-file download campaign, corporate-action acquisition, TRI acquisition, B4 work or C work is authorized by this package.
