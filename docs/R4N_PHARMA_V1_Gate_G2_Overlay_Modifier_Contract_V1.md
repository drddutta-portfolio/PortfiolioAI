# R4N Gate G2 — PHARMA_V1 Overlay Modifier Contract V1

**Status:** Proposal only / numeric modifier formula unapproved / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G2 formalizes how a reviewed **Material Overlay** may eventually affect a Primary dimension without creating a second stock score.

It is deliberately a **gating and eligibility contract**, not an active scoring formula.

The exact numeric modifier formula and exact per-dimension cap remain unapproved by the canonical adaptive plan and are therefore not invented here.

## Canonical flow

`Primary Dimension Score → Material Overlay Modifier(s) → Final Dimension Score`

Gate G2 preserves one company-level score architecture:

- Primary remains the scoring driver.
- Material Overlay may affect only relevant dimensions.
- Emerging Watch remains completely outside numeric scoring.
- No overlay receives an independent stock score.
- No Primary/Overlay score averaging is allowed.

## Eligible dimensions

Overlay dimension eligibility is derived from the overlay's **versioned PHARMA_V1 subprofile evidence contract**.

A dimension is eligible only where the subprofile contract adds or overrides evidence in that dimension.

This avoids a hard-coded assumption that every secondary business can modify every common PHARMA_V1 dimension.

For the current `GLOBAL_GENERICS` overlay contract, the derived eligible dimensions are:

- `GROWTH`
- `BUSINESS_DURABILITY`
- `RISK`

Other dimensions are fail-closed as `NOT_ELIGIBLE_DIMENSION` unless a later versioned contract changes their evidence applicability.

## Required modifier inputs

A Material Overlay cannot advance toward a numeric modifier unless all of the following are explicit:

1. reviewed economic materiality;
2. evidence completeness;
3. evidence confidence;
4. an approved normalized overlay signal;
5. contradiction state.

The contract validates input ranges but does **not** multiply these values or emit a score adjustment.

## Materiality scaling

Economic materiality remains a required scaling input.

A `MATERIAL_OVERLAY` must carry reviewed materiality at or above the G1 material threshold.

If materiality is absent or incompatible with Material Overlay status:

`REVIEW_REQUIRED`

No inferred materiality is permitted.

## Evidence completeness and confidence

Missing overlay evidence must not silently become a neutral modifier.

If evidence completeness, confidence, or normalized overlay signal is absent:

`PARTIAL_EVIDENCE`

with explicit reason codes.

Numeric modifier remains `null`.

## Contradictions

If overlay evidence conflicts with the Primary or with other overlay evidence and no versioned contract defines the resolution:

`REVIEW_REQUIRED`

The contradiction is surfaced rather than averaged away.

A contradiction may proceed only when its resolution is itself defined by a versioned methodology contract.

## One combined per-dimension cap

All Material Overlays affecting the same dimension must eventually share **one combined per-dimension cap**.

Gate G2 explicitly prohibits independent overlay-cap stacking.

Current state:

- combined cap required: **YES**
- independent cap stacking: **NO**
- exact cap value: **UNAPPROVED / null**
- exact modifier formula: **UNAPPROVED**

No ±10%, ±15%, or other cap has been invented.

## Emerging Watch boundary

`EMERGING_WATCH` is always:

`EXCLUDED_EMERGING_WATCH`

for numeric modifier purposes.

It may remain visible in Research interpretation and evidence collection, but:

- readiness denominator participation: **NO**
- dimension modifier participation: **NO**
- stock-score participation: **NO**

## Output states

Gate G2 may return:

- `ELIGIBLE_PENDING_NUMERIC_CONTRACT`
- `EXCLUDED_EMERGING_WATCH`
- `NOT_ELIGIBLE_DIMENSION`
- `PARTIAL_EVIDENCE`
- `REVIEW_REQUIRED`
- `BELOW_SCORING_MATERIALITY`

Even `ELIGIBLE_PENDING_NUMERIC_CONTRACT` emits:

- numeric modifier: `null`
- combined cap value: `null`

because exact mechanics remain separately approval-gated.

## Repository artifacts

Added:

- `src/features/research/pharmaOverlayModifierContract.ts`
- `src/features/research/pharmaOverlayModifierContract.test.ts`
- this Gate G2 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G2 · Overlay modifier contract**
- **G2 · Combined-cap & contradiction boundary**

## Explicit non-activation boundary

- overlay architecture contract: **PROPOSAL ONLY**
- numeric modifier formula: **UNAPPROVED**
- combined cap value: **UNAPPROVED**
- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position sizing: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the new G2 cards on TORNTPHARM → Research → Gate G;
3. confirm the visual and methodological interpretation;
4. run focused G2 validation.

Only after G2 validation should Gate G proceed to **G3 — Readiness Mapping Contract**.
