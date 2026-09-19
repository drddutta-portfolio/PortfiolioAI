# R4N PHARMA_V1 — Gate G6.41 Global Generics Ownership / Governance Calibration Evidence Sufficiency / Parent Alignment Deferral Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_OWNERSHIP_GOVERNANCE`  
**Canonical dimension:** `OWNERSHIP_GOVERNANCE`

## Purpose

G6.41 records two independent blockers that prevent numeric Global Generics Ownership / Governance scoring:

1. Global Generics-specific calibration evidence is not established.
2. The parent PHARMA_V1 profile currently classifies `PHARMA_OWNERSHIP_GOVERNANCE` under `GOVERNANCE`, while the methodology targets `OWNERSHIP_GOVERNANCE`.

It also preserves the G4 anti-double-counting lock.

## Current calibration blockers

- Global Generics Ownership / Governance calibration set not established.
- Reviewed Global Generics ownership cohort not established.
- Ownership-band evidence not established.
- Pledge/control-risk band evidence not established.
- Governance-event-context band evidence not established.
- Component-weight evidence not established.
- Final aggregation not established.

Therefore:

`globalSpecificCalibrationAvailable = false`

`numericOwnershipGovernanceCurveReady = false`

## Parent dimension alignment blocker

Current parent metric dimension:

`GOVERNANCE`

Canonical Ownership / Governance dimension:

`OWNERSHIP_GOVERNANCE`

Required action:

`PARENT_OWNERSHIP_GOVERNANCE_DIMENSION_RECONCILIATION_REQUIRED`

G6.41 does not modify the parent profile. A separate versioned parent-contract reconciliation is required before numeric Ownership / Governance scoring can become eligible.

## G4 anti-double-counting lock

G4 remains authoritative for blocked and high-risk governance/regulatory event handling.

Ownership / Governance calibration may retain event context, but it may not:

- add a second hidden penalty for a G4 critical/blocked event;
- add a second hidden penalty for a G4 high-risk event;
- introduce a hidden extra gate cap inside this dimension.

## What remains valid

The parent methodology shape remains valid:

- minimum 4 comparable shareholding quarters;
- preferred 8 quarters;
- latest shareholding quarter required;
- current material governance-event review required;
- ownership structure and stability;
- pledge and control risk;
- governance-event context.

## What remains prohibited

- mechanical promoter-percentage scoring;
- mechanical institutional-ownership bonuses;
- zero pledge = automatically best score;
- numeric score emission before parent reconciliation;
- neutral substitution for missing evidence.

## Safety boundary

- parent reconciliation performed: **NO**
- G4 anti-double-counting lock preserved: **YES**
- Global Generics Ownership / Governance calibration: **NO**
- numeric Ownership / Governance curve: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, close the Global Generics Ownership / Governance slice as explicitly incomplete/fail-closed and move to the next unresolved Global Generics family. Parent Ownership / Governance dimension reconciliation remains a separate versioned architecture task.
