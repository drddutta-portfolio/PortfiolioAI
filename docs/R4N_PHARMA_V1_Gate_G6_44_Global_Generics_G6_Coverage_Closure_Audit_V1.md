# R4N PHARMA_V1 — Gate G6.44 Global Generics G6 Coverage Closure Audit V1

**Status:** PROPOSAL ONLY / OWNER VALIDATION REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`

## Purpose

G6.44 verifies whether every canonical Global Generics G6 family now has an explicit validated methodology outcome before any move toward G7.

This is a coverage audit, not a scoring gate.

## Canonical family review

All 10 canonical families now have an explicit outcome:

1. `SEGMENT_GROWTH` — validated / not active.
2. `OPERATING_MARGIN` — validated fail-closed; Global calibration deferred.
3. `ROCE_CAPITAL_EFFICIENCY` — validated fail-closed; calibration deferred; parent dimension reconciliation required.
4. `CASH_CONVERSION` — validated fail-closed; calibration deferred; parent dimension reconciliation required.
5. `BALANCE_SHEET_LEVERAGE` — validated fail-closed; calibration deferred; parent dimension reconciliation required.
6. `VALUATION` — validated fail-closed; Global calibration deferred; Domestic methodology not inherited.
7. `OWNERSHIP_GOVERNANCE` — validated fail-closed; calibration deferred; parent dimension reconciliation required; G4 anti-double-counting preserved.
8. `REGULATORY_MARKET_RISK` — validated fail-closed; G6.24–G6.29 remain authoritative; drawdown/volatility normalization deferred.
9. `MOMENTUM` — validated fail-closed; parent Momentum contract, Pharma benchmark, bands and aggregation unestablished.
10. `US_GENERIC_PRICE_EROSION` — validated / not active.

Therefore:

`g6MethodologyCoverageComplete = true`

## Numeric-curve readiness

Only two canonical families currently have a validated numeric curve that remains not active:

- `SEGMENT_GROWTH`
- `US_GENERIC_PRICE_EROSION`

The other eight canonical families remain explicitly fail-closed.

This is intentional and must not be converted into neutral scoring.

## Applicability-registry reconciliation finding

The current `pharmaG6SubprofileCurveApplicability.ts` still uses a shared `pendingParentFamilies` structure.

For Global Generics, seven families therefore still appear as:

`SUBPROFILE_THRESHOLDS_REQUIRED`

even though their G6 work now has a validated fail-closed outcome:

- `ROCE_CAPITAL_EFFICIENCY`
- `CASH_CONVERSION`
- `BALANCE_SHEET_LEVERAGE`
- `VALUATION`
- `OWNERSHIP_GOVERNANCE`
- `REGULATORY_MARKET_RISK`
- `MOMENTUM`

The registry representation is therefore stale for Global Generics.

## Why the registry is not changed inside G6.44

The registry test currently asserts that all seven G5-derived parent families remain `SUBPROFILE_THRESHOLDS_REQUIRED` for every Pharma subprofile.

Changing the shared array inside this audit would alter Domestic, API/Bulk, CDMO/CRAMS and Biopharma/Biosimilars semantics at the same time.

Therefore registry reconciliation must be a separate, reviewable gate.

## G7 boundary

G6 methodology coverage is complete, but G7 should not begin while the canonical applicability registry still contradicts validated Global Generics outcomes.

Therefore:

`registryReconciliationRequiredBeforeG7 = true`

`g7ReadOnlyAdapterEligible = false`

## Safety boundary

- registry mutation in G6.44: **NO**
- scoring-rule migration: **NO**
- score execution: **NO**
- persisted score run: **NO**
- schema/local/production DB mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After G6.44 validation, prepare a narrow Global Generics applicability-registry reconciliation gate that:

- changes only Global Generics representation;
- preserves every other Pharma subprofile's existing state;
- does not label deferred families as numeric-curve ready;
- distinguishes validated fail-closed outcomes from unresolved threshold work;
- keeps score execution disabled.

Only after that reconciliation is validated should G7 eligibility be reconsidered.
