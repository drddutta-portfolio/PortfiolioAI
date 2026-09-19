# R4N PHARMA_V1 — Gate G6.42 Global Generics Momentum Methodology Boundary Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Canonical dimension:** `MOMENTUM`

## Purpose

G6.42 establishes the Global Generics Momentum methodology boundary without importing BANK_NBFC pilot assumptions or inventing a Pharma benchmark.

## Existing parent blocker

The current Pharma Momentum proposal records:

`parentMetricContractState = MISSING_DEDICATED_PHARMA_PARENT_CONTRACT`

Therefore a dedicated Pharma parent Momentum contract remains required before activation.

## Reusable evidence identity

Candidate metrics:

- `PRICE_MOMENTUM_12M`
- `PRICE_MOMENTUM_6M`
- `RELATIVE_STRENGTH_12M`

Evidence authority:

- raw market authority: `MARKET_PRICE_HISTORY`
- derived evidence store: `MARKET_METRIC_OBSERVATIONS`

Definitions:

- absolute momentum: `CLOSE_TO_CLOSE_RETURN_WITH_14_DAY_LOOKBACK_TOLERANCE`
- relative strength: `STOCK_RETURN_MINUS_APPROVED_BENCHMARK_RETURN`

## Benchmark blocker

Current benchmark state:

`PHARMA_BENCHMARK_UNAPPROVED`

No relative-strength score may be emitted until an approved Pharma benchmark exists.

## BANK_NBFC separation

The following must not transfer from the BANK_NBFC pilot:

- BANK 12-month weight;
- BANK 6-month weight;
- NIFTY BANK benchmark;
- Trendlyne technical score.

## Global Generics-specific decisions still required

Not approved:

- component weights;
- absolute-momentum bands;
- relative-strength bands;
- approved benchmark;
- final aggregation.

Missing relative-strength evidence may not become neutral.

Therefore:

`numericMomentumCurveReady = false`

## Regulatory / Market Risk status

G6.24–G6.29 are not reopened here.

That slice already remains explicitly incomplete/fail-closed:

- regulatory-site treatment validated and non-duplicative;
- drawdown numeric normalization deferred;
- volatility numeric normalization deferred;
- component weights unapproved;
- whole Risk dimension not ready.

## Safety boundary

- dedicated Pharma parent Momentum contract: **MISSING**
- Pharma benchmark approved: **NO**
- BANK pilot inheritance: **NO**
- Global Generics Momentum numeric curve: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect whether the repository supports creating a dedicated Pharma parent Momentum contract and an approved Pharma benchmark methodology. Do not fabricate either merely to complete the dimension.
