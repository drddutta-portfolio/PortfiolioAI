# R4N Gate G5.2 — PHARMA_V1 Cash Conversion Framework V1

**Status:** Proposal only / numeric thresholds unapproved / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G5.2 defines the common PHARMA_V1 **Cash Conversion** framework without activating numeric scoring.

The parent metric already requires matched CFO, PAT and capex/FCF evidence. This checkpoint preserves that contract, aligns the intended scoring destination with canonical `CASH_FLOW`, and avoids inventing one universal conversion threshold across economically different Pharma business models.

## Canonical evidence contract

Existing parent metric:

`PHARMA_CASH_CONVERSION_HISTORY`

Current evidence requirements:

- annual history;
- minimum **3** comparable annual observations;
- preferred **5** comparable annual observations;
- latest completed annual period required;
- matched-period CFO, PAT and capex/FCF evidence;
- CFO alone is insufficient;
- single-point evidence is insufficient.

These requirements are preserved.

## Dimension-alignment issue

The canonical adaptive scoring architecture assigns this metric to:

`CASH_FLOW`

with a **10%** PHARMA_V1 dimension weight.

The older lower-level parent evidence contract still records:

`PHARMA_CASH_CONVERSION_HISTORY.dimension = EARNINGS_CASH_QUALITY`

The lower-level `ResearchMetricContract` taxonomy predates the canonical PHARMA_V1 ten-dimension model.

G5.2 records:

- canonical target dimension: `CASH_FLOW`
- current parent-contract dimension: `EARNINGS_CASH_QUALITY`
- alignment state: `REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No silent remapping is applied.

## Shared methodology framework

The parent normalization semantics already specify:

`cfo_pat_and_fcf_conversion`

G5.2 therefore records the candidate common framework:

1. `CFO_TO_PAT_CONVERSION`
2. `FCF_CONVERSION`
3. `CONSISTENCY_AND_TREND`

The following remain unapproved:

- component weights;
- CFO/PAT conversion bands;
- FCF conversion bands;
- consistency/trend bands.

No numeric score is emitted.

## Why universal bands are not created

Cash conversion economics can differ materially between Pharma business models.

For example, businesses with heavy capacity build-out or biologics/CDMO expansion may show temporarily weaker FCF conversion despite acceptable operating cash conversion, while mature formulations businesses may warrant different expectations.

Therefore:

- universal numeric cash-conversion bands: **NO**
- capex-intensity context required: **YES**
- subprofile threshold contracts required: **YES**
- all five current subprofile threshold slots remain **null / unapproved**

This avoids mechanically penalizing investment-heavy models or rewarding CFO without considering reinvestment.

## Fail-closed rules

Cash Conversion remains non-scoreable when:

- fewer than 3 comparable annual periods exist;
- latest annual evidence is missing or stale;
- CFO, PAT and capex/FCF periods are not compatible;
- only CFO is available;
- canonical dimension alignment has not been reconciled;
- the applicable Primary subprofile lacks an approved threshold contract;
- component weights/bands remain unapproved.

Missing evidence must never become zero or neutral.

## Relationship to G5.1

G5.1 surfaced the same legacy-taxonomy issue for ROCE / Capital Efficiency.

G5.2 confirms this is a broader parent-contract alignment issue rather than a ROCE-specific anomaly.

No taxonomy migration is applied in this checkpoint.

## Repository artifacts

Added:

- `src/features/research/pharmaCashConversionCurveProposal.ts`
- `src/features/research/pharmaCashConversionCurveProposal.test.ts`
- this G5.2 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G5.2 · Cash Conversion framework**
- **G5.2 · Dimension alignment & capex-context boundary**

## Explicit non-activation boundary

- Cash Conversion framework proposal: **YES**
- parent dimension reconciliation applied: **NO**
- component weights approved: **NO**
- universal numeric bands: **NO**
- subprofile thresholds approved: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G5.2 cards on TORNTPHARM → Research → Gate G;
3. confirm the Cash Flow dimension mismatch and capex-context boundary are presented correctly;
4. run focused G5.2 validation.

Only after validation should the next G5 parent family, Balance Sheet / Leverage, be considered.
