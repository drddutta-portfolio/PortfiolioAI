# R4N PHARMA_V1 — Gate G6.34 Global Generics Cash Conversion Methodology Boundary Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_CASH_CONVERSION_HISTORY`  
**Canonical dimension:** `CASH_FLOW`

## Purpose

G6.34 separates the reusable parent Cash Conversion methodology shape from Global Generics-specific numeric calibration.

The parent G5.2 proposal already establishes the evidence framework but intentionally leaves all subprofile thresholds null.

## Reusable parent structure

- minimum 3 comparable annual periods;
- preferred 5 annual periods;
- latest period required;
- matched CFO/PAT/capex-FCF periods required;
- CFO alone is insufficient;
- one snapshot is insufficient;
- capex-intensity context required;
- CFO-to-PAT conversion + FCF conversion + consistency/trend methodology shape.

## Parent dimension reconciliation blocker

The parent Cash Conversion proposal currently records:

`dimensionAlignmentState = REQUIRES_VERSIONED_PARENT_RECONCILIATION`

Current parent profile dimension:

`EARNINGS_CASH_QUALITY`

Canonical methodology dimension:

`CASH_FLOW`

G6.34 preserves this blocker.

It does not silently rewrite the parent profile.

## Global Generics-specific decisions still required

Not approved:

- component weights;
- CFO-to-PAT bands;
- FCF-conversion bands;
- consistency/trend bands;
- final aggregation;
- universal numeric bands;
- Domestic or other-subprofile bands.

Therefore:

`numericCashConversionCurveReady = false`

## Evidence readiness

The helper returns:

- `REVIEW_REQUIRED` for invalid annual-history counts;
- `INSUFFICIENT_EVIDENCE` below 3 comparable periods, missing latest period, or unmatched CFO/PAT/capex-FCF periods;
- `READY_FOR_METHOD_SELECTION` only when the structural parent evidence contract is satisfied.

`READY_FOR_METHOD_SELECTION` is not score readiness.

## Safety boundary

- parent dimension reconciliation resolved: **NO**
- universal numeric bands inherited: **NO**
- other-subprofile bands inherited: **NO**
- Global Generics Cash Conversion weights approved: **NO**
- Global Generics Cash Conversion bands approved: **NO**
- numeric Cash Conversion curve ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect whether Global Generics-specific Cash Conversion calibration is evidence-supportable and separately reconcile the parent Cash Flow dimension contract before any numeric Cash Flow score is allowed.
