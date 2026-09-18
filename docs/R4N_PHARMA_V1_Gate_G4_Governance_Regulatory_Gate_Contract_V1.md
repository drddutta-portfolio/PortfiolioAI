# R4N Gate G4 — PHARMA_V1 Governance / Regulatory Gate Contract V1

**Status:** Proposal only / no numeric cap / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G4 formalizes the **pre-aggregation governance and regulatory gate** for PHARMA_V1.

It defines when research must fail closed, when a high-risk state remains visible but non-blocking, and how regulatory materiality/remediation must be handled without inventing exposure or double-counting penalties.

It does not activate a numeric governance cap or any additional score penalty.

## Governance states

### Critical / blocked review

Either of the following blocks PHARMA_V1 preview readiness:

- an explicit `GOVERNANCE_BLOCKED_REVIEW` state;
- a reviewed `CRITICAL` governance event.

Result:

`BLOCKED_REVIEW`

This is a gate, not a hidden numeric deduction.

### High risk

A reviewed `HIGH` governance event resolves to:

`HIGH_RISK`

High risk:

- does **not** automatically block preview;
- must be prominent in Interpretation;
- may become eligible for a future separately versioned transparent cap/constraint;
- receives **no numeric cap in G4**.

Current exact high-risk cap value:

`null / UNAPPROVED`

## Regulatory event prerequisites

Before a regulatory event can influence the gate, establish:

1. affected facility/product/geography;
2. economic materiality;
3. severity;
4. remediation state;
5. subsequent outcome where relevant.

If facility/product/geography linkage is not established:

`REVIEW_REQUIRED`

If economic materiality is unknown:

`REVIEW_REQUIRED`

PortfolioAI must not infer or fabricate an exposure percentage.

## Regulatory critical and high-risk states

After scope and materiality are established:

- `CRITICAL` + `KNOWN_MATERIAL` → `BLOCKED_REVIEW`
- `HIGH` + `KNOWN_MATERIAL` → `HIGH_RISK`

High risk remains non-blocking unless a later versioned contract explicitly changes that behavior.

## Remediation

Remediation and closeout are separate evidence.

A regulatory event with `CLOSED_OUT` remediation:

- remains in historical interpretation;
- is **not erased**;
- requires subsequent outcome context before PortfolioAI treats the remediation chain as sufficiently resolved for gate interpretation.

Therefore:

`CLOSED_OUT` + missing subsequent outcome context → `REVIEW_REQUIRED`

This is deliberately consistent with the existing TORNTPHARM Indrad warning/closeout evidence model, where closeout does not establish a company-wide regulatory-clearance claim.

## Anti-double-counting

Ownership / Governance remains a weighted PHARMA_V1 dimension.

Gate G4 therefore prohibits an additional hidden numeric penalty for the same governance/regulatory event.

The contract exposes:

- gate state;
- whether preview is blocked;
- whether Interpretation prominence is required;
- whether a future high-risk constraint contract could apply.

It does **not** emit:

- an extra governance score deduction;
- a regulatory penalty percentage;
- a hidden cap;
- an overlay modifier.

Any future high-risk cap must be separately versioned and transparent.

## Output states

Gate G4 may return:

- `CLEAR`
- `HIGH_RISK`
- `REVIEW_REQUIRED`
- `BLOCKED_REVIEW`

All outputs remain proposal-only.

## Relationship to G3

G3 consumes governance/review blocking as a readiness input.

G4 now defines the upstream gate state that may supply that blocker.

This does not activate a scoring adapter.

## Repository artifacts

Added:

- `src/features/research/pharmaGovernanceRegulatoryGateContract.ts`
- `src/features/research/pharmaGovernanceRegulatoryGateContract.test.ts`
- this Gate G4 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G4 · Governance / regulatory gate**
- **G4 · Materiality, remediation & anti-double-counting**

## Explicit non-activation boundary

- governance/regulatory gate architecture: **PROPOSAL ONLY**
- high-risk numeric cap: **UNAPPROVED**
- additional numeric penalty: **NO**
- score preview execution: **NO**
- numeric score execution: **NO**
- persisted score run: **NO**
- schema migration: **NO**
- regulatory event write: **NO**
- recommendation change: **NO**
- position sizing: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G4 cards on TORNTPHARM → Research → Gate G;
3. confirm the visual/methodological interpretation;
4. run focused G4 validation.

Only after G4 validation should Gate G proceed to **G5 — additional core scoring curves**.
