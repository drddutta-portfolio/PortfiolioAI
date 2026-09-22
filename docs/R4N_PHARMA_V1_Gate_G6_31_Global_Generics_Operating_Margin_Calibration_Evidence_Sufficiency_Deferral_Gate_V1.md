# R4N PHARMA_V1 — Gate G6.31 Global Generics Operating Margin Calibration Evidence Sufficiency / Deferral Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_OPERATING_MARGIN_HISTORY`  
**Canonical dimension:** `QUALITY`

## Purpose

G6.31 records that the parent Operating Margin methodology shape is valid for Global Generics, but the repository does not yet contain enough evidence to calibrate Global-specific weights or score bands.

This is a fail-closed deferral, not a rejection of the methodology shape.

## Current evidence blockers

- Global Generics calibration set not established.
- Reviewed Global Generics peer cohort not established.
- Level-band evidence not established.
- Stability-band evidence not established.
- Trend-band evidence not established.
- Component-weight evidence not established.

Therefore:

`globalSpecificCalibrationAvailable = false`

`numericOperatingMarginCurveReady = false`

`deferralRequired = true`

## What remains valid

The parent PHARMA_V1 evidence structure remains valid:

- minimum 8 comparable quarters;
- preferred 12 comparable quarters;
- latest period required;
- matched revenue and operating-profit periods required;
- level + stability + trend methodology shape.

## What remains prohibited

- Domestic Formulations bands as fallback.
- Domestic 50/30/20 weights as fallback.
- invented Global Generics cutoffs.
- neutral substitution for missing history.
- score execution before explicit methodology approval.

## Safety boundary

- Domestic calibration fallback: **NO**
- Global-specific numeric calibration: **NO**
- numeric Operating Margin curve: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, close the Global Generics Operating Margin slice as explicitly incomplete/fail-closed and move to the next unresolved Global Generics family.
