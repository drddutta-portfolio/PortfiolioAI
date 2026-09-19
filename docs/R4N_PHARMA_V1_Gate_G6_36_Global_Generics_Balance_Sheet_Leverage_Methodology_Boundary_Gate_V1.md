# R4N PHARMA_V1 — Gate G6.36 Global Generics Balance Sheet / Leverage Methodology Boundary Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_BALANCE_SHEET_LEVERAGE`  
**Canonical dimension:** `BALANCE_SHEET_CREDIT`

## Purpose

G6.36 separates the reusable parent Balance Sheet / Leverage methodology shape from Global Generics-specific numeric calibration.

The parent G5.3 proposal already establishes the evidence framework but intentionally leaves all subprofile thresholds null.

## Reusable parent structure

- minimum 3 comparable annual periods;
- preferred 5 annual periods;
- latest balance-sheet period required;
- matched debt, cash and operating-earnings evidence required;
- point-in-time evidence alone is insufficient;
- one snapshot is insufficient;
- net-debt leverage + interest coverage + trend/resilience methodology shape;
- cash offset requires a reviewed cash definition;
- net cash requires explicit treatment;
- acquisition/expansion context required.

## Parent dimension reconciliation blocker

Current parent profile dimension:

`FINANCIAL_STRENGTH`

Canonical methodology dimension:

`BALANCE_SHEET_CREDIT`

The parent proposal records:

`REQUIRES_VERSIONED_PARENT_RECONCILIATION`

G6.36 preserves this blocker and does not silently rewrite the parent profile.

## Global Generics-specific decisions still required

Not approved:

- component weights;
- leverage bands;
- interest-coverage bands;
- trend/resilience bands;
- final aggregation;
- universal numeric bands;
- Domestic or other-subprofile bands.

Therefore:

`numericBalanceSheetCurveReady = false`

## Evidence readiness

The helper returns:

- `REVIEW_REQUIRED` for invalid annual-history counts;
- `INSUFFICIENT_EVIDENCE` below 3 comparable periods, missing latest balance sheet, or unmatched debt/cash/earnings evidence;
- `READY_FOR_METHOD_SELECTION` only when the structural parent evidence contract is satisfied.

`READY_FOR_METHOD_SELECTION` is not score readiness.

## Safety boundary

- parent dimension reconciliation resolved: **NO**
- universal numeric bands inherited: **NO**
- other-subprofile bands inherited: **NO**
- Global Generics Balance Sheet weights approved: **NO**
- Global Generics Balance Sheet bands approved: **NO**
- numeric Balance Sheet curve ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect whether Global Generics-specific Balance Sheet calibration is evidence-supportable and separately reconcile the parent dimension contract before any numeric Balance Sheet/Credit score is allowed.
