# PortfolioAI — Gate K4 Package 2 · INDUSTRIALS_CAPITAL_GOODS · Checkpoint B

**Contract:** `INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic industrial scoring and portability without fabricating company evidence, activating runtime scoring, or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 13
- Growth 14
- Capital Efficiency 11
- Cash Flow 14
- Balance Sheet / Credit 10
- Business Durability 12
- Valuation 11
- Momentum 5
- Risk 6
- Ownership / Governance 4

Missing, stale, conflicting, review-required, invalid-score, or insufficient-history mandatory evidence blocks the overall score. No denominator renormalization is allowed.

## 3. Subprofile-specific growth/cash contracts

PROJECT_EPC:
- ORDER_BOOK_AND_REVENUE_GROWTH
- WORKING_CAPITAL_AND_CASH_CONVERSION

CAPITAL_EQUIPMENT_ELECTRICAL:
- REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD
- CFO_FCF_AND_WORKING_CAPITAL

DEFENCE_AEROSPACE:
- ORDER_BOOK_AND_EXECUTION_GROWTH
- CFO_FCF_CONVERSION

## 4. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` now recognizes:
- PROJECT_EPC
- CAPITAL_EQUIPMENT_ELECTRICAL
- DEFENCE_AEROSPACE

`SECTOR_ENGINE_REGISTRY` maps all three to INDUSTRIALS_CAPITAL_GOODS in validation-pending state.

Normal scoring remains blocked because the engine lifecycle remains `K4_FROZEN_PENDING` until Checkpoint B passes.

## 5. Portability

The evaluator receives symbol + canonical Industry + reviewed normalized signals. Symbol never selects methodology.

Synthetic normalized-score fixtures validate deterministic mechanics and future-stock portability only; they are not represented as real LT, CGPOWER, BEL or ASTRAMICRO evidence.

## 6. Isolation and regressions

Checkpoint B validates isolation from:
- PHARMA_V1
- BANK_NBFC
- completed IT_TECH

Golden controls:
- TORNTPHARM overall score = 75.1575
- AUROPHARMA remains SCORE_NOT_COMPUTABLE / recommendation not computable
- IT_TECH remains IMPLEMENTED
- universal Research workspace shell remains unchanged

## 7. Recommendation safety

No Industrials numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated reference evidence.

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
  src/features/research/industrialsK4aMethodologyContract.test.ts \
  src/features/research/industrialsK4bScoringMethodology.test.ts \
  src/features/research/industrialsK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, INDUSTRIALS_CAPITAL_GOODS may be promoted to IMPLEMENTED read-only methodology authority. Recommendation thresholds remain pending and persistence remains OFF.


## 10. Final validation and closure

Owner-local Checkpoint B validation passed completely after correction of two stale regression expectations.

Validated:
- Industrials Checkpoint A contract regression;
- deterministic scoring methodology;
- future-stock portability;
- industry-first routing;
- scoring profile integration;
- registry integrity;
- K2 recommendation-safety regression;
- TypeScript;
- incremental isolation against PHARMA_V1, BANK_NBFC and IT_TECH;
- TORNTPHARM 75.1575 golden output;
- AUROPHARMA fail-closed golden output;
- universal Research workspace continuity.

Registry promotion:
- INDUSTRIALS_CAPITAL_GOODS lifecycle → `IMPLEMENTED`;
- PROJECT_EPC / CAPITAL_EQUIPMENT_ELECTRICAL / DEFENCE_AEROSPACE → `SUPPORTED`;
- recommendation thresholds remain pending dedicated evidence validation;
- score/recommendation persistence remain OFF.

**K4 Package 2 · INDUSTRIALS_CAPITAL_GOODS = COMPLETE / PASS / CLOSED.**
