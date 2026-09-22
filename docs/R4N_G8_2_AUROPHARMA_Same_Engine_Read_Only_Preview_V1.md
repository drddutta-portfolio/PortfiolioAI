# PortfolioAI — G8.2 AUROPHARMA Same-Engine Read-only Preview V1

**Status:** IMPLEMENTED / OWNER VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**G8 checkpoint:** G8.2  
**Activation:** READ-ONLY / NON-PERSISTING / NOT ACTIVE

## Permanent Pharma research invariant

Every `PHARMA_V1` company is composed from three analytical layers:

1. **Common Pharma Core** — the parent `PHARMA_V1` research contract shared by all Pharma companies.
2. **Primary business-model layer** — exactly one reviewed predominant Pharma subprofile.
3. **Secondary exposure layer** — zero or more reviewed Material / Emerging / monitoring exposures into other Pharma subprofiles.

Raw evidence remains security/company scoped.

Interpretation remains company + active reviewed architecture + role scoped.

This is a reusable Pharma architecture invariant, not an AUROPHARMA exception.

## G8.1 closure

Owner visually validated the G8.1 AUROPHARMA classification/evidence card and the focused validation commands passed.

G8.1 is therefore closed with:

- Primary: `GLOBAL_GENERICS`;
- Material Overlay: none reviewed;
- Emerging Watch: `API_BULK_DRUGS`;
- `BIOPHARMA_BIOSIMILARS`: `REVIEW_REQUIRED`.

The discovery hypothesis is not restored.

## G8.2 preview architecture

The G8.2 implementation creates an in-memory reviewed preview architecture from the validated G8.1 result. It does not write `research_subprofile_assignments`.

The reusable three-layer builder composes:

- common Pharma parent requirements;
- Global Generics Primary requirements;
- API/Bulk Drugs as an Emerging Watch;
- Biosimilars as an unresolved exposure outside active numeric interpretation.

## Same-engine rule

G8.2 consumes the existing:

`PHARMA_V1_G7_READ_ONLY_SCORING_ADAPTER_V1_PROPOSAL`

No second scoring engine is created.

The dimension preview resolves methodology from:

`pharmaG6CurveContractForPrimary("GLOBAL_GENERICS")`

Therefore:

- Global Generics Segment Growth retains `VALIDATED_NOT_ACTIVE`;
- Global Generics Operating Margin, ROCE, Cash Conversion, Balance Sheet, Valuation, Ownership/Governance, Risk and Momentum retain their validated fail-closed states;
- Business Durability remains without approved whole-dimension aggregation;
- Domestic Formulations thresholds are never used as fallback.

## Current AUROPHARMA result

Expected overall state:

> **NOT CURRENTLY COMPUTABLE**

This is the correct fail-closed result.

API/Bulk Drugs is currently Emerging, not Material Overlay. It remains visible but is excluded from:

- numeric score;
- score denominator;
- readiness denominator;
- independent stock scoring.

Biosimilars remains `REVIEW_REQUIRED` and is not silently converted into Emerging Watch.

## Safety

- production mutation: NO
- canonical assignment persistence: NO
- evidence write: NO
- score persistence: NO
- shared enrichment refresh/mutation: NO
- recommendation mutation: NO
- position-sizing mutation: NO
- scheduler change: NO
- deployment: NO
- PR merge: NO

## Validation boundary

G8.2 remains open until:

- focused tests pass;
- focused ESLint passes;
- architecture check passes;
- typecheck passes;
- build passes;
- owner visually validates the three-layer AUROPHARMA preview.

Do not enter G8.3 before owner approval.
