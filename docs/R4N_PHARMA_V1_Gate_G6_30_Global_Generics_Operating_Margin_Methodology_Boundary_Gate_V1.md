# R4N PHARMA_V1 — Gate G6.30 Global Generics Operating Margin Methodology Boundary Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_OPERATING_MARGIN_HISTORY`  
**Canonical dimension:** `QUALITY`

## Purpose

G6.30 separates the reusable parent PHARMA_V1 Operating Margin methodology shape from Domestic Formulations-specific numeric choices.

The current registry correctly marks Global Generics Operating Margin as fail-closed because Domestic thresholds must not be reused.

## Parent methodology shape that may be reused

The parent PHARMA_V1 metric already requires:

- minimum 8 comparable quarters;
- preferred 12 comparable quarters;
- latest period present;
- matched revenue and operating-profit periods;
- level, stability and trend interpretation.

Candidate statistics remain:

- Level: `MEDIAN_LATEST_8_OPERATING_MARGIN_PERCENT`
- Stability: `INTERQUARTILE_RANGE_LATEST_8_PERCENTAGE_POINTS`
- Trend: `MEDIAN_LATEST_4_MINUS_MEDIAN_PRIOR_4_PERCENTAGE_POINTS`

These describe methodology shape only.

## Global Generics-specific decisions still required

Not approved:

- component weights;
- level bands;
- stability bands;
- trend bands;
- final aggregation;
- Domestic 50/30/20 weights;
- Domestic numeric bands.

Therefore:

`numericOperatingMarginCurveReady = false`

## Evidence readiness

The helper returns:

- `REVIEW_REQUIRED` for invalid history counts;
- `INSUFFICIENT_EVIDENCE` below 8 comparable quarters or when latest/matched-period requirements fail;
- `READY_FOR_METHOD_SELECTION` only when the parent structural evidence contract is satisfied.

`READY_FOR_METHOD_SELECTION` is not score readiness.

## Safety boundary

- Domestic weights inherited: **NO**
- Domestic bands inherited: **NO**
- Global Generics weights approved: **NO**
- Global Generics bands approved: **NO**
- numeric Operating Margin curve ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, determine whether repository evidence can support Global Generics-specific Operating Margin level/stability/trend calibration. If not, defer numeric normalization rather than importing Domestic thresholds.
