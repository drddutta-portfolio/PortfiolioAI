# R4N PHARMA_V1 — Gate G6.32 Global Generics ROCE / Capital Efficiency Methodology Boundary Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_ROCE_HISTORY`  
**Canonical dimension:** `CAPITAL_EFFICIENCY`

## Purpose

G6.32 separates the reusable parent ROCE methodology shape from Global Generics-specific numeric calibration.

The parent G5.1 proposal already establishes the evidence/history framework but intentionally leaves all subprofile thresholds null.

## Reusable parent structure

- minimum 3 comparable annual periods;
- preferred 5 annual periods;
- latest period required;
- consistent ROCE calculation semantics required;
- one snapshot is insufficient;
- Level + Stability + Trend methodology shape.

## Parent dimension reconciliation blocker

The parent ROCE proposal currently records:

`dimensionAlignmentState = REQUIRES_VERSIONED_PARENT_RECONCILIATION`

G6.32 preserves that blocker.

It does not silently rewrite the parent contract or pretend the alignment issue is resolved.

## Global Generics-specific decisions still required

Not approved:

- component weights;
- level bands;
- stability bands;
- trend bands;
- final aggregation;
- universal numeric bands;
- Domestic or other-subprofile bands.

Therefore:

`numericRoceCurveReady = false`

## Evidence readiness

The helper returns:

- `REVIEW_REQUIRED` for invalid annual-history counts;
- `INSUFFICIENT_EVIDENCE` below 3 comparable annual periods, missing latest period, or inconsistent calculation semantics;
- `READY_FOR_METHOD_SELECTION` only when the structural parent evidence contract is satisfied.

`READY_FOR_METHOD_SELECTION` is not score readiness.

## Safety boundary

- parent dimension reconciliation resolved: **NO**
- universal numeric bands inherited: **NO**
- other-subprofile bands inherited: **NO**
- Global Generics ROCE weights approved: **NO**
- Global Generics ROCE bands approved: **NO**
- numeric ROCE curve ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect whether Global Generics-specific ROCE calibration is evidence-supportable and separately reconcile the parent dimension contract before any numeric Capital Efficiency score is allowed.
