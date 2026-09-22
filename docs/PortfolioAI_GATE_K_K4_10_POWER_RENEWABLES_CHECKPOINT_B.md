# PortfolioAI — Gate K4 Package 10 · POWER_RENEWABLES_V1 · Checkpoint B

**Contract:** `POWER_RENEWABLES_V1_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic Power/Renewables scoring and portability without activating runtime scoring or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 11
- Growth 12
- Capital Efficiency 10
- Cash Flow 12
- Balance Sheet / Credit 13
- Business Durability 13
- Valuation 11
- Momentum 4
- Risk 10
- Ownership / Governance 4

Final weighted scores use stable six-decimal precision.

## 3. Subprofile-specific growth contracts

REGULATED_NETWORK → REGULATED_ASSET_NETWORK_AND_COMMISSIONING_GROWTH.

GENERATION_INTEGRATED_UTILITY → CAPACITY_GENERATION_AND_ASSET_MIX_GROWTH.

RENEWABLE_IPP → OPERATING_AND_PIPELINE_CAPACITY_GROWTH.

## 4. Mandatory readiness gate

`TARIFF_PPA_OFFTAKER_GRID_CONTEXT` is mandatory for every Power/Renewables score. Capacity growth alone can never bypass tariff, PPA, counterparty or grid-risk evidence.

## 5. Core safeguards

- tariff/regulatory context mandatory where material;
- leverage, interest coverage and refinancing sensitivity core;
- offtaker/DISCOM quality mandatory for contracted assets;
- fuel/resource variability normalized for generation;
- project execution and grid evacuation explicitly scored through durability/risk evidence;
- no cross-subprofile peer percentiles;
- missing mandatory evidence fails closed.

## 6. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` routes regulated networks, generation/integrated utilities and renewable IPPs separately.

`SECTOR_ENGINE_REGISTRY` maps all three profiles to POWER_RENEWABLES_V1 in validation-pending state.

## 7. Lifecycle-stable regression

The current-package regression is valid before and after promotion. Every previously completed K4 package is asserted only in its durable IMPLEMENTED state.

Golden controls preserve TORNTPHARM 75.1575, AUROPHARMA fail-closed semantics and the universal Research workspace.

## 8. Recommendation safety

No Power/Renewables numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated evidence validation.

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
  src/features/research/powerRenewablesK4aMethodologyContract.test.ts \
  src/features/research/powerRenewablesK4bScoringMethodology.test.ts \
  src/features/research/powerRenewablesK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, POWER_RENEWABLES_V1 may be promoted to IMPLEMENTED read-only methodology authority and K4 may be formally closed.


## 11. Final validation and closure

Owner-local Checkpoint B validation passed completely.

Validated:
- Checkpoint A regression;
- deterministic scoring for REGULATED_NETWORK / GENERATION_INTEGRATED_UTILITY / RENEWABLE_IPP;
- mandatory tariff/PPA/offtaker/grid readiness gate;
- leverage/refinancing evidence;
- lifecycle-stable isolation regression;
- canonical routing;
- registry integrity;
- scoring-profile integration;
- K2 recommendation-safety regression;
- TypeScript;
- TORNTPHARM 75.1575 golden output;
- AUROPHARMA fail-closed golden output;
- universal Research workspace continuity.

Registry promotion:
- POWER_RENEWABLES_V1 lifecycle → `IMPLEMENTED`;
- REGULATED_NETWORK / GENERATION_INTEGRATED_UTILITY / RENEWABLE_IPP → `SUPPORTED`;
- recommendation thresholds remain pending dedicated evidence validation;
- score/recommendation persistence remain OFF.

**K4 Package 10 · POWER_RENEWABLES_V1 = COMPLETE / PASS / CLOSED.**

With this closure, **K4 = COMPLETE / PASS / CLOSED across all 10 frozen sector packages.**
