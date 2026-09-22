# R4N PHARMA_V1 — Gate G6.25 Global Generics Market-Risk Normalization Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Canonical dimension:** `RISK`

## Purpose

G6.25 freezes the market-risk evidence identities and approval boundary for Global Generics without inventing Pharma-specific drawdown or volatility score bands.

## Canonical market-risk evidence

### MAX_DRAWDOWN_1Y

Definition:

`TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE`

Authority:

- raw authority: `MARKET_PRICE_HISTORY`
- derived store: `MARKET_METRIC_OBSERVATIONS`

Unit:

`PERCENT`

Interpretation:

- drawdown is represented as a non-positive percentage;
- smaller absolute loss is better;
- valid structural range is -100% to 0%.

Numeric score bands remain unapproved.

### VOLATILITY_1Y

Definition:

`ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252`

Authority:

- raw authority: `MARKET_PRICE_HISTORY`
- derived store: `MARKET_METRIC_OBSERVATIONS`

Unit:

`PERCENT`

Interpretation:

- volatility must be non-negative;
- lower volatility is directionally better only with appropriate Pharma peer/benchmark context.

Numeric bands and peer/benchmark normalization remain unapproved.

## Explicitly not inherited

BANK_NBFC market-risk thresholds are not inherited.

G6.25 does not approve:

- absolute drawdown bands;
- absolute volatility bands;
- relative-volatility bands;
- a Pharma benchmark;
- component weights;
- any Risk dimension combined score.

## Fail-closed evidence readiness

The evidence helper returns:

- `INSUFFICIENT_EVIDENCE` if either required market-risk input is missing;
- `REVIEW_REQUIRED` if values violate metric semantics;
- `READY_FOR_METHODOLOGY` only when both inputs are structurally valid.

`READY_FOR_METHODOLOGY` does not mean score-ready.

## Relationship to G6.24

G6.24 keeps regulatory-site context non-numeric and preserves G4 authority.

G6.25 addresses only the market-risk evidence lanes:

- drawdown;
- volatility.

The whole Global Generics Risk dimension remains incomplete.

## Safety boundary

- Pharma drawdown curve: **NO**
- Pharma volatility curve: **NO**
- BANK_NBFC threshold inheritance: **NO**
- benchmark approved: **NO**
- component weighting approved: **NO**
- whole Risk dimension ready: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, the next methodology decision should choose how Global Generics trailing 1-year drawdown is normalized, or explicitly defer drawdown bands if available evidence cannot justify them.
