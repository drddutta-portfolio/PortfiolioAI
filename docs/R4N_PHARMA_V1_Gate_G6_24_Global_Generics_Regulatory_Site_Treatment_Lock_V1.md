# R4N PHARMA_V1 — Gate G6.24 Global Generics Regulatory Site Status Treatment Lock V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_REGULATORY_SITE_STATUS`  
**Canonical dimension:** `RISK`

## Purpose

G6.24 defines how Global Generics regulatory-site evidence is treated without creating a second numeric penalty on top of the existing G4 governance/regulatory gate.

This gate deliberately does not create a new regulatory score curve.

## Why this gate is needed

Global Generics requires regulatory-site evidence where regulated export exposure exists.

At the same time:

- G4 already owns governance/regulatory block, review and high-risk states;
- G5.6 already defines the parent Regulatory & Market Risk framework;
- Pharma-specific drawdown and volatility bands remain unapproved;
- hidden regulatory double-counting is prohibited.

Therefore the safe next step is a treatment/separation contract, not a numeric penalty.

## Evidence requirements

For Global Generics regulatory-site treatment:

- official evidence required;
- affected facility/product/geography required;
- regulatory materiality required;
- current unresolved actions required;
- latest material inspection/remediation state required;
- single-site closeout may not imply company-wide clearance.

## G4 authority

G4 remains authoritative for:

- `BLOCKED_REVIEW`;
- `REVIEW_REQUIRED`;
- `HIGH_RISK`;
- regulatory materiality review;
- remediation/history retention.

G6.24 may surface that context inside the Risk dimension but does not re-score it numerically.

## Anti-double-counting rules

- G4 blocked review receives a second numeric penalty: **NO**
- G4 high-risk receives a second numeric penalty: **NO**
- regulatory numeric score inside Risk: **NOT APPROVED**
- regulatory numeric cap inside Risk: **NOT APPROVED**
- remediation erases historical event: **NO**
- regulatory context remains visible: **YES**

## Risk-dimension boundary

Separate components remain:

- regulatory context;
- trailing 1-year drawdown;
- trailing 1-year volatility context.

The regulatory context lane is non-numeric under G6.24.

The whole Global Generics Risk dimension remains incomplete because:

- Pharma drawdown bands are unapproved;
- Pharma volatility bands/benchmark context are unapproved;
- component weighting is unapproved.

Therefore:

`wholeRiskDimensionReady = false`

## Projection helper

The treatment helper maps the existing G4 gate state into a Global Generics Risk context state:

- `BLOCKED_REVIEW` → `BLOCKED_REVIEW`
- `REVIEW_REQUIRED` → `REVIEW_REQUIRED`
- `HIGH_RISK` → `HIGH_RISK_CONTEXT`
- `CLEAR` → `CLEAR_CONTEXT`

The helper always returns:

- `regulatoryNumericScore = null`
- `additionalNumericPenalty = null`
- `wholeRiskDimensionReady = false`

This is a visibility/separation contract only.

## Safety boundary

- numeric regulatory curve: **NO**
- second G4 penalty: **NO**
- whole Risk dimension ready: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, the next Global Generics Risk methodology step should address the still-unapproved market-risk normalization components rather than adding another regulatory penalty.
