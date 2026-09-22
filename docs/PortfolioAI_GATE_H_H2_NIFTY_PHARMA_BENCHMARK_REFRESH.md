# PortfolioAI — Gate H H2 NIFTY Pharma Benchmark Refresh Plumbing

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** LOCAL IMPLEMENTATION / NOT DEPLOYED / NO PROVIDER CALL

## Purpose

Close the engineering gap identified during H2: TORNTPHARM market history can use the existing held-equity `refresh-market-history` function, but the approved Momentum/Risk methodology requires NIFTY Pharma benchmark history and the only deployed benchmark refresher is BANK_NBFC-specific.

## Local implementation

Added:

- `supabase/functions/refresh-pharma-benchmark/index.ts`
- `supabase/functions/refresh-pharma-benchmark/index.test.ts`

The function intentionally mirrors the proven NIFTY Bank benchmark path while changing only the Pharma-specific identity/scope.

### Fixed scope

- target stock: `TORNTPHARM`
- benchmark code: `NIFTY_PHARMA`
- benchmark name: `NIFTY Pharma`
- accepted exact index aliases:
  - `NIFTY PHARMA`
  - `NIFTYPHARMA`
  - `CNXPHARMA`
- Angel One instrument type required: `AMXIDX`
- benchmark identity must resolve to exactly one provider token
- history window: 400 calendar days
- common 12M anchor: first trading day on/after target with 14-day tolerance
- relative strength: stock 12M return minus NIFTY Pharma 12M return

### Explicit execution confirmation

Execution requires the new, separate token:

`OWNER_CONFIRMED_PHARMA_BENCHMARK_REFRESH`

This token has not been supplied or used.

## What PLAN may do

After deployment, `action=PLAN` is designed to:

- consume zero historical provider calls;
- inspect existing TORNTPHARM history;
- report latest benchmark candle;
- report estimated provider calls.

## What EXECUTE would do if separately authorized later

Execution would:

1. verify authenticated portfolio ownership;
2. verify TORNTPHARM is an open holding;
3. require existing TORNTPHARM daily history first;
4. resolve NIFTY Pharma exactly from the current Angel One index master;
5. make one Angel One historical call;
6. store NIFTY Pharma daily benchmark candles;
7. derive and store TORNTPHARM `RELATIVE_STRENGTH_12M`;
8. record a market-data refresh run.

Therefore EXECUTE is both a provider call and production evidence write and remains separately owner-gated.

## Not performed

- Edge deployment: NO
- provider call: NO
- production market-history write: NO
- benchmark row write: NO
- metric write: NO
- score execution: NO
- score persistence: NO

## H2 significance

Once separately deployed/authorized and used together with the existing TORNTPHARM `refresh-market-history` function, the canonical history foundation can support:

- Momentum 12M;
- Momentum 6M;
- NIFTY Pharma 12M relative strength;
- TORNTPHARM 1Y max drawdown;
- TORNTPHARM 1Y volatility;
- NIFTY Pharma benchmark history needed to derive relative volatility for Risk.

No BANK_NBFC benchmark logic is inherited semantically; only the already-proven provider/lease/identity implementation pattern is reused.
