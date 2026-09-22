# R4N Gate G — PHARMA_V1 Segment Growth Curve Proposal V1

**Status:** Proposal only / activation not approved / score execution disabled  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

Define the first reviewable PHARMA_V1 numeric normalization-curve family without activating scoring.

This curve family is proposed for:

- `PHARMA_DOMESTIC_REVENUE_GROWTH`
- `PHARMA_EXPORT_US_REVENUE_GROWTH`

The same family is used because both are segment-growth histories whose score should reflect persistent comparable growth, not one isolated quarter.

## Required history

- minimum comparable reviewed quarters: **4**
- preferred comparable reviewed quarters: **8**
- latest completed quarter: **required**
- rejected or scope-incompatible claims: **excluded before scoring**
- incompatible series: **fail closed / no score**

## Proposed composite

Final score is a weighted 0–100 composite:

### 1. Growth level — 60%

Statistic:

`median(latest 4 comparable YoY segment-growth quarters)`

Bands:

- >= 20% → 100
- >= 15% and < 20% → 85
- >= 10% and < 15% → 70
- >= 5% and < 10% → 55
- >= 0% and < 5% → 40
- < 0% → 20

### 2. Consistency — 25%

Statistic:

`positive-growth quarters out of latest 4 comparable quarters`

Scores:

- 4/4 → 100
- 3/4 → 75
- 2/4 → 50
- 1/4 → 25
- 0/4 → 0

### 3. Trend — 15%

Statistic:

`latest quarter growth - median(prior 3 comparable quarter growth rates)`

Bands:

- >= +5 percentage points → 100
- >= 0 and < +5 → 75
- >= -5 and < 0 → 50
- >= -10 and < -5 → 25
- < -10 → 0

## Why this shape

The proposal deliberately avoids scoring the latest quarter alone.

It rewards:
- sustained growth level;
- repeatability across quarters;
- maintained or improving recent direction.

It also avoids allowing one unusually strong quarter to dominate a weak history.

## Compatibility boundary

A quarter participates only if:
- the metric semantics match the approved metric contract;
- the reporting scope is comparable with the rest of the series;
- the observation is reviewed/available and current;
- the period is distinct.

The rejected TORNTPHARM Q4 FY26 consolidated 31% claim remains outside the comparable US-business series and therefore cannot enter this curve.

## Activation boundary

Current state:

- curve defined as repository methodology proposal: **YES**
- curve approved for scoring: **NO**
- scoring adapter implementation: **NO**
- scoring rule migration: **NO**
- score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- production mutation: **NO**

## Next workflow step

1. owner `git pull`;
2. inspect the new Gate G curve cards on localhost;
3. visually approve or request changes to the proposed growth methodology;
4. run focused local validation.

Only after owner approval should the proposal move to the next Gate G slice.
