# R4N Gate G5.5 — PHARMA_V1 Ownership / Governance Framework V1

**Status:** Proposal only / no numeric bands / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G5.5 defines the common PHARMA_V1 **Ownership / Governance** weighted-dimension framework while preserving the already validated G4 governance gate.

The central design requirement is anti-double-counting:

> The same governance event must not be punished once through G4 and again through a hidden numeric deduction inside the 6% Ownership / Governance dimension.

## Existing evidence contract

Parent metric:

`PHARMA_OWNERSHIP_GOVERNANCE`

Preserved requirements:

- quarterly ownership history plus event evidence;
- minimum **4** comparable shareholding quarters;
- preferred **8** comparable quarters;
- latest completed shareholding quarter required;
- current material governance events required;
- promoter absence is **not** automatically negative.

Existing normalization semantics:

`ownership_trend_pledge_and_governance_event_overlay`

## Dimension alignment

Canonical Gate G dimension:

`OWNERSHIP_GOVERNANCE`

Current parent evidence-contract dimension:

`GOVERNANCE`

Alignment state:

`REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No silent remapping is applied.

## Candidate methodology framework

G5.5 records three evidence lanes:

1. `OWNERSHIP_STRUCTURE_AND_STABILITY`
2. `PLEDGE_AND_CONTROL_RISK`
3. `GOVERNANCE_EVENT_CONTEXT`

Component weights and numeric bands remain unapproved.

## Ownership evidence must not be mechanically scored

G5.5 explicitly rejects simple mechanical rules such as:

- “higher promoter ownership is always better”;
- “no promoter automatically means worse governance”;
- “zero pledge automatically deserves the best score”;
- “higher institutional ownership is automatically positive”.

Ownership structure must be interpreted in context, including:

- stability and direction of change;
- control structure;
- pledge history;
- dilution or concentration;
- material governance events;
- business-model and corporate-structure context.

## Separation from G4 governance gate

G4 already owns:

- `BLOCKED_REVIEW` for critical/blocked governance states;
- `HIGH_RISK` treatment;
- future transparent gate/cap behavior;
- regulatory materiality/remediation gate logic.

G5.5 therefore prohibits:

- a second hidden deduction for a G4 critical/blocked event;
- a second hidden deduction for a G4 high-risk event;
- an additional governance cap embedded inside the weighted dimension.

Governance-event context may remain visible inside the dimension for explainability, but the G4 gate outcome is not numerically re-punished.

This preserves the canonical anti-double-counting rule.

## Fail-closed rules

Ownership / Governance remains non-scoreable when:

- fewer than 4 comparable shareholding quarters exist;
- latest shareholding evidence is missing/stale;
- relevant material governance events are missing or unresolved;
- canonical dimension alignment remains unreconciled;
- component weights/bands remain unapproved.

Missing governance evidence must never become neutral.

## Repository artifacts

Added:

- `src/features/research/pharmaOwnershipGovernanceCurveProposal.ts`
- `src/features/research/pharmaOwnershipGovernanceCurveProposal.test.ts`
- this G5.5 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G5.5 · Ownership / Governance framework**
- **G5.5 · G4 separation & anti-double-counting boundary**

## Explicit non-activation boundary

- Ownership / Governance framework proposal: **YES**
- parent dimension reconciliation applied: **NO**
- component weights approved: **NO**
- ownership numeric bands approved: **NO**
- pledge bands approved: **NO**
- governance-event numeric bands approved: **NO**
- G4 event second hidden penalty: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G5.5 cards on TORNTPHARM → Research → Gate G;
3. confirm the dimension mismatch and G4 anti-double-counting boundary;
4. run focused G5.5 validation.

Only after validation should the next G5 parent family, Risk, be considered.
