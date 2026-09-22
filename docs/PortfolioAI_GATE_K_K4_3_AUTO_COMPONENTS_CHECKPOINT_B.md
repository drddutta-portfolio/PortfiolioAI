# PortfolioAI — Gate K4 Package 3 · AUTO_COMPONENTS · Checkpoint B

**Contract:** `AUTO_COMPONENTS_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic automobile/auto-components scoring and portability without fabricating company evidence, activating runtime scoring, or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 14
- Growth 14
- Capital Efficiency 11
- Cash Flow 12
- Balance Sheet / Credit 8
- Business Durability 13
- Valuation 11
- Momentum 6
- Risk 7
- Ownership / Governance 4

Missing, stale, conflicting, review-required, invalid-score, or insufficient-history mandatory evidence blocks the overall score. No denominator renormalization is allowed.

## 3. Subprofile-specific growth contracts

AUTO_OEM:
- VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD

AUTO_COMPONENTS:
- REVENUE_GROWTH_MULTI_PERIOD

Common mandatory evidence includes operating-margin history, ROCE/ROIC, cash conversion, leverage, durability, valuation, market momentum/risk and governance.

## 4. EV-transition safety

EV transition remains a durability/risk/exposure input only.
It does not create an independent score, a separate engine, or an automatic score premium.

## 5. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` routes OEM industries to `AUTO_OEM` and component/tyre industries to `AUTO_COMPONENTS`.

`SECTOR_ENGINE_REGISTRY` maps both to AUTO_COMPONENTS in validation-pending state.

Normal scoring remains blocked because the engine lifecycle remains `K4_FROZEN_PENDING` until Checkpoint B passes.

## 6. Portability

The evaluator receives symbol + canonical Industry + reviewed normalized signals. Symbol never selects methodology.

Synthetic normalized-score fixtures validate deterministic mechanics and future-stock portability only; they are not represented as real M&M, TVSMOTOR, MOTHERSON or SONACOMS evidence.

## 7. Isolation and regressions

Checkpoint B validates isolation from:
- PHARMA_V1
- BANK_NBFC
- completed IT_TECH
- completed INDUSTRIALS_CAPITAL_GOODS

Golden controls:
- TORNTPHARM overall score = 75.1575
- AUROPHARMA remains SCORE_NOT_COMPUTABLE / recommendation not computable
- earlier K4 engines remain IMPLEMENTED
- universal Research workspace shell remains unchanged

## 8. Recommendation safety

No AUTO numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated reference evidence.

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
  src/features/research/autoComponentsK4aMethodologyContract.test.ts \
  src/features/research/autoComponentsK4bScoringMethodology.test.ts \
  src/features/research/autoComponentsK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, AUTO_COMPONENTS may be promoted to IMPLEMENTED read-only methodology authority. Recommendation thresholds remain pending and persistence remains OFF.
