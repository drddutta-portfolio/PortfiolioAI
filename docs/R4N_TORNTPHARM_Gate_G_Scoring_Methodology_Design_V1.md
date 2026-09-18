# R4N Gate G — PHARMA_V1 Scoring Methodology Design V1

**Status:** Design only / no numeric curve approved / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

Gate G begins the transition from validated canonical Pharma evidence to deterministic scoring methodology.

This first Gate G checkpoint does **not** create a score. It makes the scoring architecture explicit and reviewable before any normalization curve is approved.

## Existing PHARMA_V1 parent dimension contract

The current R4L-completed PHARMA_V1 parent weights are preserved:

- Quality — 13%
- Growth — 15%
- Capital Efficiency — 10%
- Cash Flow — 10%
- Balance Sheet / Credit — 10%
- Business Durability — 10%
- Valuation — 12%
- Momentum — 8%
- Ownership / Governance — 6%
- Risk — 6%

Total = **100%**.

Gate G does not change these weights in this checkpoint.

## Existing readiness gates preserved

PortfolioAI already enforces:

- weighted dimension numeric score only after **60% score-ready coverage**;
- overall read-only preview only after **70% score-ready coverage**;
- every weighted dimension must also have crossed its own scoring gate before an overall preview can appear.

Gate G reuses these safeguards.

## TORNTPHARM scoring participation model

Reviewed assignment:

- Primary: **Domestic Formulations**
- Material overlay: **Global Generics**
- Emerging watch: **CDMO / CRAMS**

### Primary

Domestic Formulations is the **PRIMARY_SCORE_DRIVER**.

It defines the core business-model scoring requirements within the common PHARMA_V1 dimensions.

### Material overlay

Global Generics is a **MATERIAL_EVIDENCE_OVERLAY**.

It may alter the approved evidence mix inside affected PHARMA_V1 dimensions.

It must **not**:
- create a second independent stock score;
- blend a second score into the parent score;
- increase the total dimension denominator above 100%.

Any later metric weighting must be resolved **within the affected dimension**.

### Emerging watch

CDMO / CRAMS is **EMERGING_WATCH_EXCLUDED**.

It remains visible for research but is excluded from:
- score-readiness denominator;
- dimension scoring denominator;
- overall scoring denominator;

until a separately versioned EMERGING-specific scoring contract is approved.

## Current curve state

All numeric Pharma normalization curves remain:

**PENDING_APPROVAL**

No score run is authorized by this checkpoint.

## Downstream boundaries

Disabled:

- score execution;
- persisted stock score run;
- recommendation generation;
- position sizing;
- production mutation.

## Prepared repository artifacts

- `src/features/research/pharmaGateGScoringMethodProposal.ts`
- `src/features/research/pharmaGateGScoringMethodProposal.test.ts`
- Gate G glass-box panel in `PharmaResearchWorkspacePanel.tsx`

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect **Gate G · Scoring methodology design** on localhost;
3. confirm the visual/scoring architecture;
4. run focused local validation.

Only after that should Gate G move to the next slice: defining the first reviewable normalization-curve contracts.
