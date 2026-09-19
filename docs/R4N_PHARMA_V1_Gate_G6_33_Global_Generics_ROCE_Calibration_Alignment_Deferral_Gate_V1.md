# R4N PHARMA_V1 — Gate G6.33 Global Generics ROCE Calibration Evidence Sufficiency / Parent Alignment Deferral Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_ROCE_HISTORY`  
**Canonical dimension:** `CAPITAL_EFFICIENCY`

## Purpose

G6.33 records two independent blockers that prevent numeric Global Generics ROCE scoring:

1. Global Generics-specific calibration evidence is not established.
2. The parent PHARMA_V1 profile currently classifies `PHARMA_ROCE_HISTORY` under `QUALITY`, while the ROCE methodology contract correctly targets `CAPITAL_EFFICIENCY`.

Neither issue may be silently bypassed.

## Current calibration blockers

- Global Generics ROCE calibration set not established.
- Reviewed Global Generics peer cohort not established.
- Level-band evidence not established.
- Stability-band evidence not established.
- Trend-band evidence not established.
- Component-weight evidence not established.

Therefore:

`globalSpecificCalibrationAvailable = false`

`numericRoceCurveReady = false`

## Parent dimension alignment blocker

Current parent metric dimension:

`QUALITY`

Canonical ROCE dimension:

`CAPITAL_EFFICIENCY`

Required action:

`PARENT_ROCE_DIMENSION_RECONCILIATION_REQUIRED`

G6.33 does not modify the parent profile. A separate versioned parent-contract reconciliation is required before numeric Capital Efficiency scoring can become eligible.

## What remains valid

The parent ROCE methodology shape remains valid:

- minimum 3 comparable annual periods;
- preferred 5 annual periods;
- latest period required;
- consistent calculation semantics required;
- Level + Stability + Trend shape.

## What remains prohibited

- other-subprofile ROCE bands as fallback;
- universal numeric bands;
- silently treating QUALITY as Capital Efficiency;
- numeric score emission before parent reconciliation;
- neutral substitution for missing evidence.

## Safety boundary

- parent reconciliation performed: **NO**
- Global Generics ROCE calibration: **NO**
- numeric ROCE curve: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, close the Global Generics ROCE slice as explicitly incomplete/fail-closed and move to the next unresolved Global Generics family. The parent ROCE dimension reconciliation should be handled as a separate versioned architecture correction rather than hidden inside a subprofile curve.
