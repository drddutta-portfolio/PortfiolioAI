# R4N PHARMA_V1 — Gate G6.35 Global Generics Cash Conversion Calibration Evidence Sufficiency / Parent Alignment Deferral Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_CASH_CONVERSION_HISTORY`  
**Canonical dimension:** `CASH_FLOW`

## Purpose

G6.35 records two independent blockers that prevent numeric Global Generics Cash Conversion scoring:

1. Global Generics-specific calibration evidence is not established.
2. The parent PHARMA_V1 profile currently classifies `PHARMA_CASH_CONVERSION_HISTORY` under `EARNINGS_CASH_QUALITY`, while the Cash Conversion methodology targets `CASH_FLOW`.

Neither issue may be silently bypassed.

## Current calibration blockers

- Global Generics Cash Conversion calibration set not established.
- Reviewed Global Generics peer cohort not established.
- CFO-to-PAT band evidence not established.
- FCF-conversion band evidence not established.
- Consistency/trend band evidence not established.
- Component-weight evidence not established.

Therefore:

`globalSpecificCalibrationAvailable = false`

`numericCashConversionCurveReady = false`

## Parent dimension alignment blocker

Current parent metric dimension:

`EARNINGS_CASH_QUALITY`

Canonical Cash Conversion dimension:

`CASH_FLOW`

Required action:

`PARENT_CASH_FLOW_DIMENSION_RECONCILIATION_REQUIRED`

G6.35 does not modify the parent profile. A separate versioned parent-contract reconciliation is required before numeric Cash Flow scoring can become eligible.

## What remains valid

The parent Cash Conversion methodology shape remains valid:

- minimum 3 comparable annual periods;
- preferred 5 annual periods;
- latest period required;
- matched CFO/PAT/capex-FCF periods required;
- CFO alone insufficient;
- capex-intensity context required;
- CFO-to-PAT + FCF conversion + consistency/trend shape.

## What remains prohibited

- other-subprofile calibration as fallback;
- universal numeric bands;
- silently treating `EARNINGS_CASH_QUALITY` as `CASH_FLOW`;
- numeric score emission before parent reconciliation;
- neutral substitution for missing evidence.

## Safety boundary

- parent reconciliation performed: **NO**
- Global Generics Cash Conversion calibration: **NO**
- numeric Cash Conversion curve: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, close the Global Generics Cash Conversion slice as explicitly incomplete/fail-closed and move to the next unresolved Global Generics family. Parent Cash Flow dimension reconciliation remains a separate versioned architecture task.
