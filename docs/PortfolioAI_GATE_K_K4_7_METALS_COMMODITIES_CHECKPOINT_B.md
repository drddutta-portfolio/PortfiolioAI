# PortfolioAI — Gate K4 Package 7 · METALS_COMMODITIES · Checkpoint B

**Contract:** `METALS_COMMODITIES_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic through-cycle Metals scoring and portability without activating runtime scoring or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 12
- Growth 11
- Capital Efficiency 13
- Cash Flow 13
- Balance Sheet / Credit 12
- Business Durability 9
- Valuation 13
- Momentum 5
- Risk 8
- Ownership / Governance 4

Final weighted scores use stable six-decimal output precision.

## 3. Subprofile-specific growth contracts

STEEL_FERROUS → VOLUME_REALIZATION_AND_SPREAD_GROWTH.

NON_FERROUS_DIVERSIFIED_METALS → PRODUCTION_VOLUME_REALIZATION_GROWTH.

Both require through-cycle margin quality, ROCE/ROIC, cash conversion, mid-cycle leverage, business durability, normalized valuation, momentum/risk and governance.

## 4. Mandatory readiness gate

`COMMODITY_EXPOSURE_METADATA` is mandatory even though it is not itself a numeric scoring dimension. Missing commodity exposure blocks the score.

## 5. Cycle safeguards

- through-cycle normalization mandatory;
- minimum five-year core financial history;
- 12-quarter growth/margin cycle depth;
- leverage assessed at mid-cycle;
- normalized EV/EBITDA / P-B / FCF / ROCE authority;
- spot P/E cannot be the sole valuation anchor.

## 6. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` routes steel/ferrous and non-ferrous/diversified metal/mining industries separately.

`SECTOR_ENGINE_REGISTRY` maps both to METALS_COMMODITIES in validation-pending state.

## 7. Lifecycle-stable regression

The current-package regression is valid before and after promotion. Completed packages are asserted only as IMPLEMENTED.

Golden controls preserve TORNTPHARM 75.1575, AUROPHARMA fail-closed semantics and the universal Research workspace.

## 8. Recommendation safety

No Metals numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated evidence validation.

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
  src/features/research/metalsCommoditiesK4aMethodologyContract.test.ts \
  src/features/research/metalsCommoditiesK4bScoringMethodology.test.ts \
  src/features/research/metalsCommoditiesK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, METALS_COMMODITIES may be promoted to IMPLEMENTED read-only methodology authority.
