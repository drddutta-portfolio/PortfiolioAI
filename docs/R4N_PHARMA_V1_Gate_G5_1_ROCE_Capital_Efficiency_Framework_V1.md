# R4N Gate G5.1 — PHARMA_V1 ROCE / Capital Efficiency Curve Framework V1

**Status:** Proposal only / numeric thresholds unapproved / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G5.1 begins the **Core Parent Curve Families** sequence with ROCE / Capital Efficiency.

The canonical adaptive plan names ROCE / Capital Efficiency as the first G5 family, but it does not approve one universal set of ROCE thresholds across all Pharma business models.

This checkpoint therefore versions the common evidence/history and methodology framework without inventing cross-subprofile numeric bands.

## Canonical evidence contract

Existing parent metric:

`PHARMA_ROCE_HISTORY`

Current evidence requirements:

- annual history;
- minimum **3** comparable annual observations;
- preferred **5** comparable annual observations;
- latest completed annual period required;
- consistent ROCE calculation semantics required;
- direction: higher is better;
- one current snapshot is insufficient.

These requirements are preserved.

## Dimension-alignment issue discovered

The canonical adaptive scoring architecture assigns:

`ROCE → CAPITAL_EFFICIENCY`

with a **10%** PHARMA_V1 dimension weight.

However, the existing lower-level parent evidence contract still records:

`PHARMA_ROCE_HISTORY.dimension = QUALITY`

The lower-level `ResearchMetricContract` taxonomy predates the canonical PHARMA_V1 ten-dimension model and does not yet expose `CAPITAL_EFFICIENCY` as a metric dimension.

Gate G5.1 does **not** silently reinterpret this mismatch.

It records:

- canonical target dimension: `CAPITAL_EFFICIENCY`
- current parent-contract dimension: `QUALITY`
- alignment state: `REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No active score path may treat ROCE as a Capital Efficiency score until that reconciliation is explicitly versioned and validated.

## Shared methodology shape

The adaptive plan permits a common methodology shape when semantics are genuinely shared.

For ROCE, G5.1 records the candidate framework:

`Level + Stability + Trend`

But the following remain unapproved:

- component weights;
- level bands;
- stability bands;
- trend bands.

No numeric score can be emitted.

## Why universal ROCE bands are not created

ROCE economics may differ materially across:

- Domestic Formulations;
- Global Generics;
- API / Bulk Drugs;
- CDMO / CRAMS;
- Biopharma / Biosimilars.

The canonical plan explicitly warns that a shared methodology shape does not imply shared thresholds.

Therefore G5.1 encodes:

- universal numeric ROCE bands allowed: **NO**
- subprofile threshold contracts required: **YES**
- all five subprofile threshold slots: **null / unapproved**

Subprofile-specific threshold work belongs to the later subprofile methodology sequence and must be versioned before numeric execution.

## Fail-closed rules

ROCE remains non-scoreable when:

- fewer than 3 comparable annual observations exist;
- latest annual evidence is missing/stale;
- calculation semantics are inconsistent;
- canonical dimension alignment has not been reconciled;
- the applicable Primary subprofile lacks an approved ROCE threshold contract;
- component weights/bands remain unapproved.

Missing evidence or missing methodology must never become zero or neutral.

## Relationship to existing validated curves

This proposal does not alter:

- `PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL`
- `PHARMA_OPERATING_MARGIN_CURVE_V1_PROPOSAL`

Those remain validated / not active.

Unlike the Domestic Formulations operating-margin proposal, ROCE is a common parent metric, but its numeric thresholds are not assumed to be universal.

## Repository artifacts

Added:

- `src/features/research/pharmaRoceCurveProposal.ts`
- `src/features/research/pharmaRoceCurveProposal.test.ts`
- this G5.1 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G5.1 · ROCE / Capital Efficiency framework**
- **G5.1 · Dimension alignment & threshold boundary**

## Explicit non-activation boundary

- ROCE framework proposal: **YES**
- parent dimension reconciliation applied: **NO**
- component weights approved: **NO**
- universal numeric ROCE bands: **NO**
- subprofile ROCE thresholds approved: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- recommendation / position sizing: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G5.1 cards on TORNTPHARM → Research → Gate G;
3. confirm that the dimension mismatch and threshold boundary are presented correctly;
4. run focused G5.1 validation.

Only after validation should the next G5 core parent family be considered.
