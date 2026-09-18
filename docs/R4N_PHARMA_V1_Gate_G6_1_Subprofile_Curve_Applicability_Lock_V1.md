# R4N Gate G6.1 — PHARMA_V1 Subprofile Curve Applicability Lock V1

**Status:** Proposal only / applicability lock / no new numeric bands / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G6 must complete missing thresholds for every Pharma primary model.

Before adding more numeric bands, G6.1 locks **which existing curve proposals are actually allowed for each Primary subprofile**.

This prevents the most important G6 failure mode:

> Domestic Formulations thresholds must not silently become generic Pharma thresholds.

## Canonical primary models

G6.1 covers all five canonical Primary subprofiles:

- `DOMESTIC_FORMULATIONS`
- `GLOBAL_GENERICS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

## Existing validated numeric proposals

### Segment Growth

Validated proposal:

`PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL`

Explicit metric scope:

- `PHARMA_DOMESTIC_REVENUE_GROWTH`
- `PHARMA_EXPORT_US_REVENUE_GROWTH`

G6.1 therefore permits:

- Domestic Formulations → Domestic Revenue Growth
- Global Generics → Export / US Revenue Growth

It does **not** authorize the same curve for API/Bulk Drugs, CDMO/CRAMS or Biopharma/Biosimilars.

### Operating Margin

Validated proposal:

`PHARMA_OPERATING_MARGIN_CURVE_V1_PROPOSAL`

Explicit Primary scope:

`DOMESTIC_FORMULATIONS`

G6.1 therefore records:

- Domestic Formulations → `VALIDATED_NOT_ACTIVE`
- Global Generics → `UNSUPPORTED_FAIL_CLOSED`
- API/Bulk Drugs → `UNSUPPORTED_FAIL_CLOSED`
- CDMO/CRAMS → `UNSUPPORTED_FAIL_CLOSED`
- Biopharma/Biosimilars → `UNSUPPORTED_FAIL_CLOSED`

No other Primary may inherit the Domestic margin bands.

## G5 parent families

The seven G5 parent-family frameworks remain architecture-only.

For every Primary subprofile, the following still require explicit subprofile methodology/threshold approval:

- ROCE / Capital Efficiency
- Cash Conversion
- Balance Sheet / Leverage
- Valuation
- Ownership / Governance
- Regulatory & Market Risk
- Momentum

G6.1 records them as:

`SUBPROFILE_THRESHOLDS_REQUIRED`

No numeric thresholds are invented in this applicability-lock step.

## Subprofile-contract evidence differences

The existing subprofile contracts confirm why independent methodology is necessary.

Examples:

### Domestic Formulations
Mandatory model-specific evidence includes:
- Domestic Revenue Growth
- Field Force Productivity
- Brand / Therapy Leadership
- Domestic Exposure Materiality Review

### Global Generics
Mandatory model-specific evidence includes:
- Export / US Revenue Growth
- Regulatory Site Status
- Pipeline / Launch / Approval Evidence
- US Generic Price Erosion

### API / Bulk Drugs
Mandatory model-specific evidence includes:
- Regulatory Site Status
- Customer Concentration
- Capacity Utilization
- cycle-aware Valuation context

### CDMO / CRAMS
Mandatory model-specific evidence includes:
- Regulatory Site Status
- Revenue Visibility
- Client Concentration
- Capacity Utilization

### Biopharma / Biosimilars
Mandatory model-specific evidence includes:
- R&D intensity/productivity
- molecule/geography/stage pipeline evidence
- Patent / Litigation Timeline

These are economically different operating models; one threshold set is not defensible.

## Layering boundary

G6.1 preserves the canonical company architecture:

### Primary
Uses the applicable subprofile curve contract.

### Material Overlay
May modify approved evidence inside relevant dimensions under G2.

It does **not** create an independent stock score.

### Emerging Watch
Remains:
- visible in research;
- excluded from score readiness;
- excluded from numeric scoring;
- unable to create an independent stock score.

## TORNTPHARM effect

Current reviewed assignment:

- Primary: Domestic Formulations
- Material Overlay: Global Generics
- Emerging Watch: CDMO / CRAMS

Therefore:

- Domestic Formulations is the Primary curve driver.
- The Global Generics overlay may influence only G2-eligible dimensions through a future approved modifier.
- CDMO/CRAMS remains excluded from numeric scoring while Emerging.

No Global Generics or CDMO independent score is created.

## Repository artifacts

Added:

- `src/features/research/pharmaG6SubprofileCurveApplicability.ts`
- `src/features/research/pharmaG6SubprofileCurveApplicability.test.ts`
- this G6.1 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G6.1 · Subprofile curve applicability lock**
- **G6.1 · Primary / Overlay / Emerging boundary**

## Explicit non-activation boundary

- subprofile applicability registry: **YES**
- new numeric thresholds: **NO**
- Domestic thresholds auto-reused: **NO**
- Material Overlay independent score: **NO**
- Emerging Watch numeric score: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G6.1 cards on TORNTPHARM → Research → Gate G;
3. confirm Domestic / Global / Emerging scope is represented correctly;
4. run focused G6.1 validation.

Only after this applicability lock is validated should G6 add the first new subprofile-specific threshold family.
