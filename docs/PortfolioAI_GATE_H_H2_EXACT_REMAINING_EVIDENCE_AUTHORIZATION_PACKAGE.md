# PortfolioAI — Gate H H2 Exact Remaining Evidence Authorization Package

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** OWNER AUTHORIZATION REQUEST / NOT EXECUTED

## Purpose

Define the smallest exact set of production/provider actions still required to complete the market-dependent H2 evidence lanes without granting broad provider or production-write authority.

This package does **not** authorize score persistence, recommendation, sizing, scheduler changes, PR merge, or deployment beyond the specifically named Edge Function.

## Action A — deploy Pharma benchmark refresher

Deploy only:

`refresh-pharma-benchmark`

Purpose:

- enable the already locally validated TORNTPHARM + NIFTY Pharma benchmark path.

No provider call occurs merely from deployment.

No other Edge Function may be deployed under this authorization.

## Action B — execute TORNTPHARM market-history refresh

Existing Edge Function:

`refresh-market-history`

Exact target:

- security: TORNTPHARM
- provider: ANGEL_ONE
- interval: ONE_DAY
- history horizon: 400 days
- expected provider historical calls: 1

Expected canonical writes:

- TORNTPHARM rows to `market_price_history`;
- derived `PRICE_MOMENTUM_12M`;
- derived `PRICE_MOMENTUM_6M`;
- derived `MAX_DRAWDOWN_1Y`;
- derived `VOLATILITY_1Y`;
- one auditable `market_data_refresh_runs` record.

Required execution confirmation:

`OWNER_CONFIRMED_MARKET_HISTORY_REFRESH`

No score run is authorized.

## Action C — execute NIFTY Pharma benchmark refresh

New validated Edge Function:

`refresh-pharma-benchmark`

Exact target:

- stock context: TORNTPHARM
- benchmark: NIFTY Pharma
- provider: ANGEL_ONE
- benchmark instrument type: AMXIDX
- history horizon: 400 days
- expected historical provider calls: 1

Expected canonical writes:

- verified NIFTY Pharma benchmark identity to `market_benchmarks`;
- NIFTY Pharma daily rows to `market_benchmark_price_history`;
- TORNTPHARM `RELATIVE_STRENGTH_12M` to `market_metric_observations`;
- one auditable `market_data_refresh_runs` record.

Required execution confirmation:

`OWNER_CONFIRMED_PHARMA_BENCHMARK_REFRESH`

The benchmark must resolve to exactly one accepted NIFTY Pharma AMXIDX identity or fail closed.

## Action D — execute current TORNTPHARM self-history valuation refresh

Existing Edge Function:

`refresh-valuation-evidence`

Exact target:

- security: TORNTPHARM
- source: TRENDLYNE_MCP
- metric: `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`
- provider label: `Fair Price 5YrPE Upside%`
- expected provider calls: 1

Expected canonical writes:

- one immutable `data_source_records` capture;
- one current `fundamental_observations` row for `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`;
- auditable provider budget/usage/run accounting.

Required execution confirmation:

`OWNER_CONFIRMED_VALUATION_EVIDENCE_REFRESH`

No other valuation metric is authorized by this action.

## Explicitly not included

### Brand / Therapy Leadership

Not yet authorized.

The Gate F contract requires a specifically approved licensed market-share/rank source. No generic licensed-provider authority is requested.

Before authorization, H2 must identify:

- exact provider/source;
- exact metric/query;
- expected call count/cost unit;
- exact evidence shape;
- whether the result is read-only capture or canonical evidence write.

### Domestic Formulations peer cohort

No production assignment write is authorized.

MANKIND, ERIS, EMCURE and SUNPHARMA remain provisional candidates until their individual G1 evidence reviews satisfy the reviewed/effective-dated assignment contract.

No company may be promoted merely to satisfy the Valuation minimum peer count.

## Maximum provider-call envelope in this package

If Actions B, C and D are approved and executed successfully:

- Angel One historical calls: **2**
  - 1 TORNTPHARM
  - 1 NIFTY Pharma
- Trendlyne valuation calls: **1**
- total maximum provider calls: **3**

Deployment itself consumes zero provider calls.

## Explicit exclusions

This authorization package does not include:

- Brand/Therapy licensed call;
- peer-classification persistence;
- peer valuation refreshes;
- production score run;
- score persistence;
- recommendation;
- position sizing;
- scheduler/cron change;
- unrelated Edge Function deployment;
- PR merge.

## Requested owner authorization phrase

If approved exactly as scoped:

`APPROVE H2 MARKET + VALUATION EVIDENCE ACQUISITION PACKAGE`

That approval authorizes only Actions A-D above.
