# PortfolioAI — Gate K4 Package 1 · IT_TECH · Checkpoint B

**Contract:** `IT_TECH_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate the deterministic IT_TECH scoring/portability contract without fabricating company evidence, activating runtime scoring, or persisting scores/recommendations.

## 2. Deterministic scoring contract

IT_TECH uses ten weighted dimensions totaling 100:
- Quality 15
- Growth 15
- Capital Efficiency 10
- Cash Flow 12
- Balance Sheet / Credit 8
- Business Durability 12
- Valuation 12
- Momentum 6
- Risk 5
- Ownership / Governance 5

Every active dimension currently requires one reviewed normalized signal. Missing, stale, conflicting, review-required, invalid-score, or insufficient-history evidence blocks the entire overall score. There is no denominator renormalization.

## 3. Subprofile-specific cash-flow contracts

IT_SERVICES → FCF_CONVERSION.

SOFTWARE_PRODUCTS_PLATFORMS → FCF_OR_CASH_BURN.

DIGITAL_INFRA_HARDWARE → WORKING_CAPITAL_AND_CASH_CONVERSION.

All other common signal families remain subprofile-aware through their normalization authority, peer set, valuation method and durability contract.

## 4. History gates

The scoring engine enforces the Checkpoint A history minimums directly:
- growth: 8 quarterly observations;
- margin: 8 quarterly observations;
- capital efficiency: 3 annual observations;
- cash-flow/conversion: 3 annual observations;
- valuation: 3 observations/history anchors;
- momentum/risk: 252 trading observations;
- balance-sheet, durability and governance: at least one reviewed current authority state.

## 5. Portability validation

The scoring evaluator receives only symbol + canonical Industry + reviewed normalized signals.

The symbol does not select methodology. A future arbitrary IT-services stock with the same Industry and signals produces the same deterministic result as the reference validation fixture.

Reference fixtures are synthetic normalized-score fixtures used only to validate engine mechanics. They are explicitly not represented as real INFY, PERSISTENT, HCLTECH or NETWEB evidence.

## 6. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` now recognizes:
- `IT_SERVICES`
- `IT_SOFTWARE_PRODUCTS_PLATFORMS`
- `IT_DIGITAL_INFRA_HARDWARE`

`SECTOR_ENGINE_REGISTRY` maps all three to IT_TECH, but IT_TECH remains `K4_FROZEN_PENDING` until this Checkpoint B passes. Therefore the normal scoring resolver still fails closed to GENERAL and does not activate IT_TECH prematurely.

## 7. Isolation / golden regression

Checkpoint B regression verifies:
- IT_TECH does not resolve to PHARMA_V1 or BANK_NBFC;
- TORNTPHARM golden overall score remains 75.1575;
- AUROPHARMA remains SCORE_NOT_COMPUTABLE with recommendation not computable;
- universal Research workspace shell remains shared;
- no symbol-specific page tree or methodology routing is introduced.

## 8. Recommendation safety

No IT_TECH recommendation thresholds are introduced in Checkpoint B.

Therefore recommendation state remains unavailable/pending methodology even when a read-only IT score fixture is computable. This avoids inventing recommendation thresholds before dedicated IT reference evidence supports them.

## 9. Safety

- production mutation: NO
- production migration: NO
- provider calls: 0
- score persistence: OFF
- recommendation persistence: OFF
- scheduler mutation: NO
- deployment: NO
- PR merge: NO
- automatic trading: NO

## 10. Exit validation

Run:

```bash
npx vitest run \
  src/features/research/itTechK4aMethodologyContract.test.ts \
  src/features/research/itTechK4bScoringMethodology.test.ts \
  src/features/research/itTechK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, IT_TECH may be promoted from validation-pending to implemented/read-only routing authority. Recommendation thresholds remain separately pending until explicitly validated; score/recommendation persistence remains OFF.
