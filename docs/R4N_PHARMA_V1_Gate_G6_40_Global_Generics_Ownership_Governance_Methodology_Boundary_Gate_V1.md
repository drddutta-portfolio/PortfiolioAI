# R4N PHARMA_V1 — Gate G6.40 Global Generics Ownership / Governance Methodology Boundary Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_OWNERSHIP_GOVERNANCE`  
**Canonical dimension:** `OWNERSHIP_GOVERNANCE`

## Purpose

G6.40 separates the reusable parent Ownership / Governance methodology shape from Global Generics-specific numeric calibration while preserving the G4 governance/regulatory anti-double-counting boundary.

## Reusable parent structure

- minimum 4 comparable shareholding quarters;
- preferred 8 quarters;
- latest shareholding quarter required;
- current material governance events required;
- promoter absence is not automatically negative;
- ownership structure and stability;
- pledge and control risk;
- governance-event context.

## Parent dimension reconciliation blocker

Current parent profile dimension:

`GOVERNANCE`

Canonical methodology dimension:

`OWNERSHIP_GOVERNANCE`

The parent proposal records:

`REQUIRES_VERSIONED_PARENT_RECONCILIATION`

G6.40 preserves this blocker and does not silently rewrite the parent profile.

## G4 anti-double-counting boundary

Governance/regulatory events already handled by G4 may remain visible as context, but:

- critical/blocked events may not receive a second hidden numeric penalty;
- high-risk events may not receive a second hidden numeric penalty;
- an additional hidden gate cap inside this dimension is not allowed.

## Global Generics-specific decisions still required

Not approved:

- component weights;
- ownership bands;
- pledge bands;
- governance-event context bands;
- final aggregation;
- mechanical promoter-percentage thresholds;
- mechanical institutional-ownership bonuses.

Also prohibited as automatic shortcuts:

- zero pledge = automatically best score;
- promoter absolute percentage alone = sufficient;
- institutional ownership = automatically positive.

Therefore:

`numericOwnershipGovernanceCurveReady = false`

## Evidence readiness

The helper returns:

- `REVIEW_REQUIRED` for invalid quarter counts;
- `INSUFFICIENT_EVIDENCE` below 4 comparable quarters, missing latest shareholding quarter, or incomplete material-governance-event review;
- `READY_FOR_METHOD_SELECTION` only when the structural evidence contract is satisfied.

`READY_FOR_METHOD_SELECTION` is not score readiness.

## Safety boundary

- parent dimension reconciliation resolved: **NO**
- G4 hidden double counting: **NO**
- mechanical ownership shortcuts: **NO**
- Global Generics Ownership/Governance weights approved: **NO**
- Global Generics Ownership/Governance bands approved: **NO**
- numeric Ownership/Governance curve ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect whether Global Generics-specific Ownership / Governance calibration is evidence-supportable. If not, defer numeric normalization and preserve the separate parent dimension reconciliation requirement.
