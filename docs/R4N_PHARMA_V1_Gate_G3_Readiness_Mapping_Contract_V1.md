# R4N Gate G3 — PHARMA_V1 Readiness Mapping Contract V1

**Status:** Proposal only / readiness mapping only / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G3 formalizes the deterministic mapping from PHARMA_V1 research/evidence conditions into the visible readiness states:

- `READY`
- `PARTIAL`
- `INSUFFICIENT_EVIDENCE`
- `PROFILE_PENDING`
- `BLOCKED_REVIEW`
- `NOT_APPLICABLE`

It does not execute or persist a numeric score.

## Canonical readiness gates preserved

The contract keeps the already adopted PHARMA_V1 thresholds unchanged:

- dimension score-ready coverage gate: **60%**
- overall preview score-ready coverage gate: **70%**
- every weighted dimension must independently be `READY`
- common PHARMA_V1 core must be `READY`
- Primary subprofile must be `READY`
- governance/review blocking prevents preview eligibility

The 70% overall gate is therefore necessary but never sufficient by itself.

## Dimension mapping

A dimension resolves in fail-closed order.

### NOT_APPLICABLE

If the dimension is not applicable under the effective contract:

- visible state: `NOT_APPLICABLE`
- score ready: **NO**
- denominator eligible: **NO**

### PROFILE_PENDING

If the Pharma business-model profile is unresolved:

- visible state: `PROFILE_PENDING`
- score ready: **NO**

### BLOCKED_REVIEW

If the dimension has an unresolved review blocker, including a material-overlay blocker:

- visible state: `BLOCKED_REVIEW`
- score ready: **NO**

### PARTIAL

If the Primary/base dimension would otherwise be researched but a **Material Overlay** that affects it has incomplete evidence:

- visible state: `PARTIAL`
- score ready: **NO**

Missing material-overlay evidence is never converted into a neutral modifier.

### INSUFFICIENT_EVIDENCE

A dimension is insufficient when:

- score-ready coverage is unavailable;
- mandatory blocking conditions are not satisfied; or
- score-ready coverage is below **60%**.

### READY

A dimension may be `READY` only when:

- it is applicable;
- the profile is resolved;
- no review blocker exists;
- mandatory blocking conditions are satisfied;
- score-ready coverage is at least **60%**;
- any relevant Material Overlay does not leave the dimension incomplete.

## Emerging Watch boundary

`EMERGING_WATCH` remains visible research context but is completely excluded from numeric readiness effect.

An Emerging Watch therefore cannot:

- improve readiness;
- reduce readiness;
- enter a dimension denominator;
- enter the overall score-ready denominator.

This preserves the canonical G1/G2 boundary.

## Overall mapping

Overall PHARMA_V1 preview can become `READY` only when all of these are true:

1. Pharma profile is resolved.
2. Common PHARMA_V1 core is `READY`.
3. Primary subprofile is `READY`.
4. Every weighted dimension is `READY`.
5. Overall score-ready coverage is at least **70%**.
6. Governance/review gating has not blocked preview.

Failure of the Primary remains company-level fail-closed.

A weighted dimension that is `PARTIAL`, `INSUFFICIENT_EVIDENCE`, `PROFILE_PENDING`, or `BLOCKED_REVIEW` prevents overall preview readiness regardless of the aggregate coverage percentage.

## Governance boundary

Gate G3 accepts a boolean governance/review blocker only so readiness can fail closed.

It deliberately does **not** define:

- critical governance-event classification;
- high-risk cap mechanics;
- regulatory materiality resolution;
- remediation treatment;
- anti-double-counting mechanics.

Those remain for **G4 — Governance / Regulatory Gate Contract**.

## Repository artifacts

Added:

- `src/features/research/pharmaReadinessMappingContract.ts`
- `src/features/research/pharmaReadinessMappingContract.test.ts`
- this Gate G3 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G3 · Readiness mapping contract**
- **G3 · Overall fail-closed readiness gate**

## Explicit non-activation boundary

- readiness mapping architecture: **PROPOSAL ONLY**
- score preview execution: **NO**
- numeric score execution: **NO**
- persisted score run: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position sizing: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G3 cards on TORNTPHARM → Research → Gate G;
3. confirm the visual/methodological interpretation;
4. run focused G3 validation.

Only after G3 validation should Gate G proceed to **G4 — Governance / Regulatory Gate Contract**.
