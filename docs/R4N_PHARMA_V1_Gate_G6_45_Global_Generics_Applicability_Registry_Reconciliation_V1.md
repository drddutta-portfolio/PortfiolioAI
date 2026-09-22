# R4N PHARMA_V1 — Gate G6.45 Global Generics Applicability Registry Reconciliation V1

**Status:** PROPOSAL ONLY / OWNER VALIDATION REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`

## Purpose

G6.45 reconciles the canonical G6 applicability registry with the already validated Global Generics methodology outcomes from G6.44.

This is a representation gate only.

It does not create a new score, numeric curve, benchmark, threshold, weight, recommendation, sizing rule or database state.

## Repository inspection result

The existing applicability registry had four distinct semantic needs but only three states:

- validated numeric curve, not active;
- methodology validated but numeric scoring intentionally unavailable/deferred;
- methodology/threshold work genuinely unresolved;
- family unsupported for that subprofile.

The missing semantic state caused later Global Generics G6 outcomes to remain mislabeled as unresolved threshold work.

## Reconciliation decision

The applicability state union is versioned from:

`PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_V1_PROPOSAL`

to:

`PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_V2_PROPOSAL`

and adds:

`VALIDATED_FAIL_CLOSED`

Meaning:

> The methodology outcome for this family/subprofile has been explicitly validated, but no approved numeric curve is available. The family must remain fail-closed and must not be converted to zero, neutral, reweighted, or otherwise scored.

## Global Generics representation after this proposal

### VALIDATED_NOT_ACTIVE

- `SEGMENT_GROWTH`
- `US_GENERIC_PRICE_EROSION`

These retain their validated numeric proposal versions but remain inactive.

### VALIDATED_FAIL_CLOSED

- `OPERATING_MARGIN`
- `ROCE_CAPITAL_EFFICIENCY`
- `CASH_CONVERSION`
- `BALANCE_SHEET_LEVERAGE`
- `VALUATION`
- `OWNERSHIP_GOVERNANCE`
- `REGULATORY_MARKET_RISK`
- `MOMENTUM`

Every `VALIDATED_FAIL_CLOSED` entry has:

- `curveVersion = null`;
- no numeric score authority;
- no implied neutral value;
- no hidden denominator reweighting.

## Why Operating Margin also changes

Before G6.45, Global Generics Operating Margin was represented as:

`UNSUPPORTED_FAIL_CLOSED`

Later G6 work established that the family itself is supported as a methodology lane, but Global-specific calibration remains unavailable and Domestic bands are prohibited.

Therefore its truthful current state is:

`VALIDATED_FAIL_CLOSED`

This is distinct from API/Bulk Drugs, CDMO/CRAMS and Biopharma/Biosimilars, which remain `UNSUPPORTED_FAIL_CLOSED` for the Domestic Operating Margin curve.

## Other Pharma primaries remain unchanged

The shared `pendingParentFamilies` structure is deliberately retained for:

- `DOMESTIC_FORMULATIONS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

For those four primaries, the seven G5-derived parent families remain:

`SUBPROFILE_THRESHOLDS_REQUIRED`

No methodology conclusion is inferred for them from Global Generics work.

## G7 boundary

Preparing G6.45 does not start G7.

Current state:

- registry representation aligned by proposal: **YES**
- owner validation of reconciliation: **PENDING**
- score execution: **NO**
- G7 read-only adapter eligible now: **NO**

Only after owner validation confirms the reconciliation and the coverage/registry relationship remains consistent may G7 eligibility be reconsidered.

Even then G7 remains read-only.

## Safety boundary

- new numeric thresholds: **NO**
- curve activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema mutation: **NO**
- local DB mutation: **NO**
- production DB mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Validation request

Owner should:

1. `git pull`;
2. visually inspect the two G6.45 Gate G cards;
3. run focused Vitest for:
   - `pharmaG6SubprofileCurveApplicability.test.ts`
   - `pharmaGlobalGenericsApplicabilityRegistryReconciliation.test.ts`
4. run focused ESLint for the G6.45 files and `PharmaResearchWorkspacePanel.tsx`;
5. run `npm run typecheck`;
6. run `npm run build`.

G6.45 must remain **PROPOSAL ONLY / NOT ACTIVE** until the owner reports all requested validation passes.
