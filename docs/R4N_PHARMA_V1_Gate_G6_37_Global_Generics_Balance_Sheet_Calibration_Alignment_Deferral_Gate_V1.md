# R4N PHARMA_V1 — Gate G6.37 Global Generics Balance Sheet Calibration Evidence Sufficiency / Parent Alignment Deferral Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_BALANCE_SHEET_LEVERAGE`  
**Canonical dimension:** `BALANCE_SHEET_CREDIT`

## Purpose

G6.37 records two independent blockers that prevent numeric Global Generics Balance Sheet / Leverage scoring:

1. Global Generics-specific calibration evidence is not established.
2. The parent PHARMA_V1 profile currently classifies `PHARMA_BALANCE_SHEET_LEVERAGE` under `FINANCIAL_STRENGTH`, while the leverage methodology targets `BALANCE_SHEET_CREDIT`.

Neither issue may be silently bypassed.

## Current calibration blockers

- Global Generics Balance Sheet calibration set not established.
- Reviewed Global Generics peer cohort not established.
- Leverage-band evidence not established.
- Interest-coverage band evidence not established.
- Trend/resilience band evidence not established.
- Component-weight evidence not established.

Therefore:

`globalSpecificCalibrationAvailable = false`

`numericBalanceSheetCurveReady = false`

## Parent dimension alignment blocker

Current parent metric dimension:

`FINANCIAL_STRENGTH`

Canonical Balance Sheet / Leverage dimension:

`BALANCE_SHEET_CREDIT`

Required action:

`PARENT_BALANCE_SHEET_DIMENSION_RECONCILIATION_REQUIRED`

G6.37 does not modify the parent profile. A separate versioned parent-contract reconciliation is required before numeric Balance Sheet/Credit scoring can become eligible.

## What remains valid

The parent Balance Sheet / Leverage methodology shape remains valid:

- minimum 3 comparable annual periods;
- preferred 5 annual periods;
- latest balance-sheet period required;
- matched debt, cash and operating-earnings evidence required;
- net-debt leverage + interest coverage + trend/resilience;
- reviewed cash definition;
- explicit net-cash treatment;
- acquisition/expansion context.

## What remains prohibited

- other-subprofile calibration as fallback;
- universal numeric bands;
- silently treating `FINANCIAL_STRENGTH` as `BALANCE_SHEET_CREDIT`;
- numeric score emission before parent reconciliation;
- neutral substitution for missing evidence.

## Safety boundary

- parent reconciliation performed: **NO**
- Global Generics Balance Sheet calibration: **NO**
- numeric Balance Sheet curve: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, close the Global Generics Balance Sheet slice as explicitly incomplete/fail-closed and move to the next unresolved Global Generics family. Parent Balance Sheet/Credit dimension reconciliation remains a separate versioned architecture task.
