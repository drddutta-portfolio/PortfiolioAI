# PortfolioAI — G8.1 AUROPHARMA Classification & Evidence Lock V1

**Status:** IMPLEMENTED LOCALLY / OWNER UI VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Stage:** G8.1 only  
**Production mutation:** NO  
**Canonical assignment write:** NO  
**Scoring:** NO

## Purpose

G8.1 tests whether the existing G1 adaptive-classification contract can classify a second Pharma company from bounded, reviewed official evidence before any AUROPHARMA score preview is attempted.

The discovery hypothesis was:

- Primary: `GLOBAL_GENERICS`
- Material Overlay: `API_BULK_DRUGS`
- Emerging Watch: `BIOPHARMA_BIOSIMILARS`

The hypothesis was **not** treated as an answer.

## Official evidence set

Bounded sources:

1. Aurobindo Pharma Integrated Report 2025-26 — official issuer annual-report artifact.
2. Aurobindo Pharma Integrated Annual Report 2024-25 — official issuer prior-period annual report.
3. Q4 FY26 / FY26 audited consolidated results release.
4. Q4 FY25 / FY25 audited consolidated results release.
5. Q4 FY25 earnings-call transcript, used only to review the Biosimilars development/commercialisation commentary.
6. FY26 audited consolidated financial-results filing for structural-change/effective-date checks.

No news-research expansion, licensed-provider call or evidence ingestion is part of G8.1.

## Two-period role-determining business mix

| Period | Consolidated revenue | US formulations | Europe formulations | Global Generics conservative lower bound | API revenue | API share |
|---|---:|---:|---:|---:|---:|---:|
| FY25 | ₹31,724 Cr | ₹14,816 Cr | ₹8,356 Cr | 73.04% | ₹4,323 Cr | 13.63% |
| FY26 | ₹33,653 Cr | ₹14,408 Cr | ₹10,315 Cr | 73.46% | ₹4,047 Cr | 12.03% |

The Global Generics numerator intentionally uses only US + Europe formulations. Growth Markets, ARV and the rest of Formulations are excluded rather than silently classified as Global Generics. This is a conservative lower-bound test, not an attempt to force every formulation rupee into one subprofile.

## G1 result

The unchanged G1 contract resolves:

- **Primary candidate: `GLOBAL_GENERICS`**
- **Material Overlay: none reviewed**
- **Emerging Watch: `API_BULK_DRUGS`**
- **`BIOPHARMA_BIOSIMILARS`: `REVIEW_REQUIRED`**

Why API is not a Material Overlay:

- G1 requires at least **15% of consolidated revenue or profit** for **2 consecutive annual periods**.
- API revenue share is 13.63% in FY25 and 12.03% in FY26.
- Those are economic-share figures. API growth rates are irrelevant to the threshold.
- Both annual shares are between the 5% Emerging lower bound and the 15% Material threshold.

Why Biosimilars is not promoted:

- official sources show a real pipeline, approvals and expected future contribution;
- the bounded official set does **not** provide a comparable Biosimilars revenue-share or profit-share denominator for the required periods;
- unchanged G1 therefore returns `REVIEW_REQUIRED / NO_REVENUE_OR_PROFIT_SHARE`;
- strategic commentary is not converted into a materiality percentage.

## Role-determining comparability / distortion review

1. **Consolidated denominator — PASS.** FY25 and FY26 role shares use consolidated revenue from operations and comparable consolidated business-mix disclosures.
2. **Global Generics mapping — PASS WITH QUALIFICATION.** US + Europe is deliberately a lower bound. Excluding Growth Markets/ARV prevents over-classification and still leaves Global Generics above 73% in both periods.
3. **API legal-entity transfer — PASS WITH QUALIFICATION.** The 2023 API transfer was to wholly owned Apitoria. Because G8.1 uses consolidated API and consolidated company revenue, the transfer does not create a group-scope break.
4. **Business profit split — UNAVAILABLE / NON-BLOCKING UNDER G1.** Comparable business-level profit shares are not disclosed in the bounded set. G1 uses the available reviewed revenue-share evidence and does not invent a profit conflict.
5. **Acquisition / structural change — EFFECTIVE-DATE QUALIFICATION.** The Khandelwal domestic-formulations acquisition does not enter the US+Europe or API numerators used for the role decision. The proposed Lannett acquisition had no FY26 financial impact and subsequently closes after the 31 March 2026 evidence date. Both are future-period review triggers, not reasons to rewrite FY25/FY26 evidence.

## Effective dating

Evidence through: **2026-03-31**  
Proposed classification effective date: **2026-03-31**

This is a reviewed G8.1 fixture, **not** a persisted canonical `research_subprofile_assignments` row.

Any later business mix reflecting Lannett, Khandelwal run-rate, Biosimilars commercialisation or another structural change must be reviewed under a new effective period rather than back-projected into FY25/FY26.

## Architecture boundary

- raw fixture evidence is AUROPHARMA/security scoped;
- it contains no TORNTPHARM evidence reuse;
- role interpretation is produced by the existing G1 contract;
- no raw-evidence store is redesigned to `(company, role)`;
- no score curve, score run, recommendation or sizing state is created.

## Repository artifacts

Added:

- `src/features/research/auropharmaG8ClassificationEvidence.ts`
- `src/features/research/auropharmaG8ClassificationEvidence.test.ts`
- `src/features/research/AuropharmaG81ClassificationCard.tsx`
- this document.

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`

## Validation boundary

G8.1 is **not closed** until:

- focused tests pass;
- ESLint passes;
- typecheck passes;
- build passes;
- owner visually validates the AUROPHARMA G8.1 card on localhost.

Do not start G8.2 before that owner validation.
