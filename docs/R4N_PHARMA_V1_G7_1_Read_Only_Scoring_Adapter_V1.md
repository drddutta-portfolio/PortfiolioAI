# PortfolioAI — G7.1 Read-only Scoring Adapter & Fail-Closed Calculation Engine V1

**Status:** PROPOSAL ONLY / OWNER VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Prerequisites:** G7-P1 validated; G7-P2 validated  
**Persistence:** NONE

## Purpose

G7.1 creates the first pure PHARMA_V1 read-only scoring adapter.

It does not fetch or persist scores. It accepts already-resolved methodology/evidence inputs and proves the calculation boundary can:

- calculate only with an approved numeric dimension contract;
- fail closed for unavailable methodology;
- apply validated Material Overlay modifiers only inside a dimension;
- exclude Emerging Watch numerically;
- obey governance blocking;
- preserve fixed PHARMA_V1 dimension weights;
- refuse hidden reweighting;
- emit methodology lineage;
- remain non-persisting.

## Important denominator decision

The canonical readiness contract allows a dimension to be score-ready at >=60% score-ready coverage.

However, the repository does **not** define a generic formula for aggregating partially available metric components into every dimension.

Therefore G7.1 does not invent one.

A dimension may emit a numeric result only when both are true:

1. readiness says the dimension is score-ready; and
2. an approved/versioned dimension-specific score contract has already produced a numeric Primary dimension score.

Thus 60% readiness is a gate, not an instruction to convert missing components to zero or silently renormalize available components.

## Methodology-state behavior

### VALIDATED_NOT_ACTIVE

Eligible for read-only calculation only when a versioned numeric dimension-score contract/result is supplied.

### APPROVED_NUMERIC_CONTRACT

Eligible for read-only calculation.

### VALIDATED_FAIL_CLOSED

No numeric result.

### SUBPROFILE_THRESHOLDS_REQUIRED

No numeric result.

### UNSUPPORTED_FAIL_CLOSED

No numeric result.

### NO_APPROVED_DIMENSION_AGGREGATION

No numeric result.

## Overlay behavior

For an eligible Material Overlay:

`Primary Dimension Score + G7-P1 Modifier -> Final Dimension Score`

The modifier must use the validated G7-P1 contract version.

No independent overlay stock score exists.

If an eligible overlay is missing its numeric modifier, the dimension remains non-computable/partial rather than treating the overlay as neutral.

Emerging Watch remains numerically excluded and leaves the Primary dimension result unchanged.

## Governance behavior

G7-P2 is evaluated before overall scoring.

- BLOCKED_REVIEW / CRITICAL blocking state -> overall preview blocked.
- HIGH_RISK -> Interpretation-only, no numeric penalty.
- REVIEW_REQUIRED -> non-numeric governance treatment; it does not invent a deduction.

## Overall aggregation

The adapter uses the canonical ten PHARMA_V1 dimension weights unchanged:

- Quality 13%
- Growth 15%
- Capital Efficiency 10%
- Cash Flow 10%
- Balance Sheet / Credit 10%
- Business Durability 10%
- Valuation 12%
- Momentum 8%
- Ownership / Governance 6%
- Risk 6%

Overall preview is calculated only when:

- the exact ten-dimension set is present;
- overall readiness is eligible;
- every weighted dimension has a numeric final result;
- governance is not blocking.

If any weighted dimension is unavailable:

`Overall Pharma score: Not currently computable`

No remaining dimension is scaled upward.

## Methodology lineage

Every dimension result carries:

- G7.1 adapter version;
- G3 readiness version;
- G7-P1 overlay version;
- G7-P2 governance version;
- supplied dimension score-contract version;
- supplied methodology decision lineage.

The overall result additionally carries the Gate G scoring-method version.

## Result states

Dimension-level:

- CALCULATED
- UNAVAILABLE_METHODOLOGY
- INSUFFICIENT_EVIDENCE
- PARTIAL
- BLOCKED_REVIEW
- PROFILE_PENDING
- NOT_APPLICABLE
- EXCLUDED_EMERGING_WATCH

Overall:

- READY
- NOT_CURRENTLY_COMPUTABLE
- BLOCKED_REVIEW
- PROFILE_PENDING

## Non-persistence boundary

The G7.1 adapter contains no:

- Supabase client;
- repository write;
- Edge Function call;
- score persistence;
- recommendation mutation;
- position-sizing mutation;
- schema migration;
- provider call.

All calculations are transient pure TypeScript values.

## Files

Added:

- `src/features/research/pharmaG7ReadOnlyScoringAdapter.ts`
- `src/features/research/pharmaG7ReadOnlyScoringAdapter.test.ts`
- this methodology document

A minimal existing change exports the already canonical `PHARMA_V1_DIMENSION_WEIGHTS` constant so G7.1 consumes one source of truth rather than duplicating weights.

## Validation required

Before G7.1 closes:

1. visually inspect the two G7.1 Gate G cards;
2. focused Vitest for the G7.1 adapter;
3. focused Vitest for G7-P1, G7-P2 and readiness contracts;
4. focused ESLint;
5. `npm run typecheck`;
6. `npm run build`.

Only after owner validation should G7.2 wire TORNTPHARM's actual read-only preview.
