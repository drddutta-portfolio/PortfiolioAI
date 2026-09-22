# PortfolioAI — Gate K4 Package 5 · HEALTHCARE_SERVICES_V1 · Checkpoint B

**Contract:** `HEALTHCARE_SERVICES_V1_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic hospital-operator scoring and portability without forcing diagnostics into hospital economics, activating runtime scoring, or persisting scores/recommendations.

## 2. Deterministic hospital scoring

Ten dimensions total 100:
- Quality 14
- Growth 14
- Capital Efficiency 10
- Cash Flow 12
- Balance Sheet / Credit 8
- Business Durability 15
- Valuation 11
- Momentum 5
- Risk 7
- Ownership / Governance 4

Mandatory evidence includes margin history, multi-period revenue/EBITDA growth, ROCE/ROIC, cash conversion, leverage, hospital operating durability, valuation, momentum/risk and governance.

`HOSPITAL_OPERATING_DURABILITY` explicitly carries occupancy, ARPOB/equivalent, bed-ramp, case-mix and payer-context evidence.

## 3. Diagnostics boundary

Diagnostics are not mapped into HEALTHCARE_SERVICES_V1.

Direct Healthcare scoring of a diagnostics identity returns `REVIEW_REQUIRED` with `DIAGNOSTICS_REQUIRES_SEPARATE_METHODOLOGY`.

## 4. Fail-closed behavior

Missing, stale, conflicting, review-required, invalid-score, or insufficient-history mandatory evidence blocks the entire score. No denominator renormalization is permitted.

## 5. Portability and lifecycle-safe regression

The evaluator consumes symbol + canonical Industry + reviewed normalized signals. Symbol never selects methodology.

The isolation regression is deliberately lifecycle-stable: it remains valid both before and after HEALTHCARE_SERVICES_V1 is promoted, so this package does not reintroduce stale-build failures.

## 6. Isolation and golden controls

Isolation is checked against PHARMA_V1, BANK_NBFC and completed IT_TECH / INDUSTRIALS_CAPITAL_GOODS / AUTO_COMPONENTS / CHEMICALS_V1.

Golden controls:
- TORNTPHARM overall score = 75.1575
- AUROPHARMA remains SCORE_NOT_COMPUTABLE / recommendation not computable
- universal Research workspace remains unchanged

## 7. Recommendation safety

No Healthcare numeric recommendation thresholds are introduced in Checkpoint B. Recommendation authority remains pending dedicated evidence validation.

## 8. Safety

- provider calls: 0
- production mutation/migration: NO
- score persistence: OFF
- recommendation persistence: OFF
- scheduler mutation: NO
- deployment: NO
- PR merge: NO
- automatic trading: NO

## 9. Exit validation

```bash
npx vitest run \
  src/features/research/healthcareServicesK4aMethodologyContract.test.ts \
  src/features/research/healthcareServicesK4bScoringMethodology.test.ts \
  src/features/research/healthcareServicesK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, HEALTHCARE_SERVICES_V1 may be promoted to IMPLEMENTED read-only methodology authority. Diagnostics remain separately unresolved; recommendation thresholds and persistence remain OFF.
