# PortfolioAI — Gate K4 Package 8 · CONSUMER_FMCG · Checkpoint B

**Contract:** `CONSUMER_FMCG_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic Consumer/FMCG scoring and portability without activating runtime scoring or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 15
- Growth 14
- Capital Efficiency 10
- Cash Flow 12
- Balance Sheet / Credit 8
- Business Durability 16
- Valuation 11
- Momentum 5
- Risk 5
- Ownership / Governance 4

Final weighted scores use stable six-decimal precision.

## 3. Mandatory readiness gate

`PRODUCT_CATEGORY_METADATA` is mandatory even though it is not itself a numeric scoring dimension. Missing category metadata blocks the score.

## 4. Core operating evidence

- gross and operating-margin history;
- revenue plus volume/price/mix where disclosed;
- ROCE/ROIC;
- CFO/FCF conversion and working-capital discipline;
- balance-sheet safety;
- brand/distribution/category durability;
- valuation;
- momentum/risk;
- governance.

## 5. Alcohol treatment

Alcohol remains on the same branded-consumer curve, but excise/regulatory exposure is part of category risk authority. No separate alcohol score curve is created.

## 6. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` routes eligible FMCG/consumer-staples industries to `BRANDED_CONSUMER_FMCG`.

`SECTOR_ENGINE_REGISTRY` maps that profile to CONSUMER_FMCG in validation-pending state.

## 7. Lifecycle-stable regression

The current-package regression remains valid before and after promotion. Completed packages are asserted only as IMPLEMENTED.

Golden controls preserve TORNTPHARM 75.1575, AUROPHARMA fail-closed semantics and the universal Research workspace.

## 8. Recommendation safety

No Consumer/FMCG numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated evidence validation.

## 9. Safety

- provider calls: 0
- production mutation/migration: NO
- score persistence: OFF
- recommendation persistence: OFF
- scheduler mutation: NO
- deployment: NO
- PR merge: NO
- automatic trading: NO

## 10. Exit validation

```bash
npx vitest run \
  src/features/research/consumerFmcgK4aMethodologyContract.test.ts \
  src/features/research/consumerFmcgK4bScoringMethodology.test.ts \
  src/features/research/consumerFmcgK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, CONSUMER_FMCG may be promoted to IMPLEMENTED read-only methodology authority.
