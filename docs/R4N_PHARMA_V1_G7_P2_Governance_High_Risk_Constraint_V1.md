# PortfolioAI — G7-P2 Governance High-Risk Constraint Contract V1

**Status:** PROPOSAL ONLY / OWNER VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Parent authority:** validated G4 Governance / Regulatory Gate Contract  
**G6 status:** CLOSED — this is a G7 prerequisite

## Purpose

G7-P2 resolves the remaining G4 question:

> What should a reviewed `HIGH_RISK` governance/regulatory state do numerically?

G4 already defines the blocking states. G7-P2 must not alter them.

## Repository conclusion

The current repository contains no defensible empirical calibration for a numeric high-risk score cap or extra dimension penalty.

G4 explicitly records:

- high-risk automatically blocks preview: **NO**
- high-risk cap value: **null / UNAPPROVED**
- additional numeric penalty: **NO**
- hidden double counting: **PROHIBITED**

The G5 Ownership/Governance and Risk frameworks also prohibit embedding an additional hidden governance/regulatory penalty.

Therefore the safest G7-P2 decision is:

> **HIGH_RISK = INTERPRETATION-ONLY / NON-BLOCKING / NO NUMERIC PENALTY**

This is an explicit methodology decision, not an omission.

## Preserved blocking behavior

The following continue to block the overall Pharma preview:

- explicit `GOVERNANCE_BLOCKED_REVIEW`;
- reviewed `CRITICAL` governance event;
- reviewed `CRITICAL` regulatory event with established material scope.

Result:

`BLOCKED_REVIEW`

No overall score preview may be considered valid while blocked.

## HIGH_RISK behavior

A reviewed HIGH governance event, or HIGH + known-material regulatory event:

- does **not** block overall preview;
- requires prominent Interpretation-layer visibility;
- does **not** create an extra Quality deduction;
- does **not** create an extra Risk deduction;
- does **not** create an overall numeric cap;
- does **not** create an overlay penalty;
- does **not** alter dimension weights.

This avoids double-counting because Ownership/Governance already remains part of the weighted PHARMA_V1 framework.

## REVIEW_REQUIRED behavior

Unknown regulatory materiality, unresolved scope, or incomplete remediation context remains:

`REVIEW_REQUIRED`

No numeric penalty or cap may be applied while review is unresolved.

## Versioned contract

`PHARMA_V1_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_V1_PROPOSAL`

The proposal records:

- HIGH_RISK behavior: `INTERPRETATION_ONLY`
- numeric cap: `null`
- dimension penalty: **disabled**
- overall cap: **disabled**
- hidden double counting: **prohibited**
- owner validation required: **YES**
- G7.1 consumption approved: **NO**
- score execution: **NO**

## Why no numeric cap is preferable now

A numeric cap would require a defensible calibration basis.

The repository currently provides no approved evidence showing that a HIGH_RISK state should cap an overall score at 60, 70, 80 or any other value.

Choosing one would therefore be arbitrary.

PortfolioAI should preserve the reviewed event prominently and allow the weighted Ownership/Governance and Risk methodologies to operate only where their own approved numeric contracts exist.

## Revisit triggers

A separately versioned numeric governance constraint may be reconsidered if:

- second-company validation reveals that interpretation-only treatment materially understates governance risk;
- a reviewed Pharma cohort provides a defensible calibration basis;
- backtesting establishes a robust cap relationship;
- a future Ownership/Governance contract explicitly separates dimension scoring from a company-level governance constraint without double counting.

No revisit trigger authorizes silent activation.

## Anti-double-counting invariant

The same governance/regulatory event may not simultaneously create:

- Ownership/Governance deterioration;
- extra Risk deduction;
- overlay penalty;
- hidden numeric deduction;
- overall score cap;

unless a later versioned methodology explicitly proves those effects are distinct.

## Non-activation boundary

- G7.1 adapter: **NOT STARTED**
- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- database/schema mutation: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR merge: **NO**

## Validation required

Before G7-P2 closes:

1. visually inspect the two G7-P2 Gate G cards;
2. focused Vitest for `pharmaG7GovernanceHighRiskConstraint.test.ts`;
3. focused Vitest for `pharmaGovernanceRegulatoryGateContract.test.ts`;
4. focused ESLint for the G7-P2 contract/test and workspace panel;
5. `npm run typecheck`;
6. `npm run build`.

Only after owner validation should G7.1 begin.
