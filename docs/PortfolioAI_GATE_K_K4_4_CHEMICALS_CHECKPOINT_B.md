# PortfolioAI — Gate K4 Package 4 · CHEMICALS_V1 · Checkpoint B

**Contract:** `CHEMICALS_V1_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic Chemicals scoring and portability without fabricating company evidence, activating runtime scoring, or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 13
- Growth 13
- Capital Efficiency 12
- Cash Flow 12
- Balance Sheet / Credit 9
- Business Durability 11
- Valuation 12
- Momentum 6
- Risk 8
- Ownership / Governance 4

Missing, stale, conflicting, review-required, invalid-score, or insufficient-history mandatory evidence blocks the overall score. No denominator renormalization is allowed.

## 3. Subprofile-specific growth contracts

SPECIALTY_CHEMICALS → REVENUE_GROWTH_MULTI_PERIOD
AGRO_FERTILISER → REVENUE_AND_VOLUME_GROWTH_MULTI_PERIOD
COMMODITY_PROCESS_CHEMICALS → VOLUME_PRICE_MIX_GROWTH

All subprofiles require cycle-aware margins, ROCE/ROIC, cash conversion, leverage, durability, valuation, momentum/risk and governance.

## 4. Cycle safeguards

- cycle normalization is mandatory;
- capacity growth cannot substitute for utilisation/returns;
- feedstock/global pricing context remains method authority where material;
- no cross-subprofile percentiles;
- missing mandatory evidence fails closed.

## 5. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` now recognizes:
- SPECIALTY_CHEMICALS
- AGRO_FERTILISER
- COMMODITY_PROCESS_CHEMICALS

`SECTOR_ENGINE_REGISTRY` maps all three to CHEMICALS_V1 in validation-pending state. Normal scoring remains blocked while lifecycle = `K4_FROZEN_PENDING`.

## 6. Portability

The evaluator consumes symbol + canonical Industry + reviewed normalized signals. Symbol never selects methodology.

Synthetic normalized fixtures validate deterministic mechanics only and are not represented as real PIIND, SRF, VINATIORGA or DEEPAKFERT evidence.

## 7. Isolation and golden regression

Checkpoint B validates isolation from PHARMA_V1, BANK_NBFC and completed IT_TECH / INDUSTRIALS_CAPITAL_GOODS / AUTO_COMPONENTS.

Golden controls:
- TORNTPHARM overall score = 75.1575
- AUROPHARMA remains SCORE_NOT_COMPUTABLE / recommendation not computable
- prior K4 engines remain IMPLEMENTED
- universal Research workspace remains unchanged

## 8. Recommendation safety

No Chemicals numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated evidence validation.

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
  src/features/research/chemicalsK4aMethodologyContract.test.ts \
  src/features/research/chemicalsK4bScoringMethodology.test.ts \
  src/features/research/chemicalsK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, CHEMICALS_V1 may be promoted to IMPLEMENTED read-only methodology authority. Recommendation thresholds remain pending and persistence remains OFF.
