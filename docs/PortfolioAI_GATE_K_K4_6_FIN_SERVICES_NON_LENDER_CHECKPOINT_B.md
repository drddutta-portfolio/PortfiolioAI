# PortfolioAI — Gate K4 Package 6 · FIN_SERVICES_NON_LENDER · Checkpoint B

**Contract:** `FIN_SERVICES_NON_LENDER_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic non-lender Financial Services scoring and portability without leaking BANK_NBFC methodology, activating runtime scoring, or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 13
- Growth 14
- Capital Efficiency 10
- Cash Flow 10
- Balance Sheet / Credit 8
- Business Durability 14
- Valuation 12
- Momentum 5
- Risk 10
- Ownership / Governance 4

Final weighted scores use stable six-decimal output precision.

## 3. Subprofile-specific evidence

CAPITAL_MARKETS_AMC:
- market-cycle-normalized AUM/client-asset and earnings growth;
- operating margin;
- ROE/ROIC;
- cash conversion;
- client-asset/market-share/distribution durability.

INSURANCE:
- underwriting/reserving quality;
- premium/AUM growth;
- solvency/capital adequacy;
- insurance earnings/cash quality;
- persistency/renewal/distribution durability.

FINTECH_PLATFORM:
- contribution margin/unit economics;
- revenue growth;
- burn efficiency/capital efficiency;
- CFO/FCF/cash burn;
- funding runway;
- retention/monetization/regulatory durability.

## 4. Lender separation

NBFC_LENDING remains owned by BANK_NBFC. Non-lender scoring explicitly rejects lender classification and does not use NPA, CET1, deposit-growth or Nifty Bank methodology.

## 5. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` routes:
- CAPITAL_MARKETS_AMC
- INSURANCE
- FINTECH_PLATFORM
- NBFC_LENDING remains separate.

`SECTOR_ENGINE_REGISTRY` maps the three non-lender profiles to FIN_SERVICES_NON_LENDER in validation-pending state.

## 6. Lifecycle-stable regression

The current-package isolation regression is valid both before and after promotion. No pre-closure lifecycle assertion is retained.

Completed K4 packages are asserted only in their durable IMPLEMENTED state.

## 7. Golden/isolation controls

- PHARMA_V1 isolated;
- BANK_NBFC isolated;
- prior K4 packages remain IMPLEMENTED;
- TORNTPHARM overall score = 75.1575;
- AUROPHARMA remains SCORE_NOT_COMPUTABLE / recommendation not computable;
- universal Research workspace remains unchanged.

## 8. Recommendation safety

No non-lender Financial Services numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated evidence validation.

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
  src/features/research/finServicesNonLenderK4aMethodologyContract.test.ts \
  src/features/research/finServicesNonLenderK4bScoringMethodology.test.ts \
  src/features/research/finServicesNonLenderK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, FIN_SERVICES_NON_LENDER may be promoted to IMPLEMENTED read-only methodology authority. Recommendation thresholds remain pending and persistence remains OFF.


## 11. Final validation and closure

Owner-local Checkpoint B validation passed completely after correction of the legacy profile-code routing expectation.

Validated:
- Checkpoint A regression;
- deterministic scoring across CAPITAL_MARKETS_AMC / INSURANCE / FINTECH_PLATFORM;
- lifecycle-stable isolation regression;
- explicit separation from BANK_NBFC / NBFC_LENDING;
- canonical routing;
- registry integrity;
- scoring-profile integration;
- K2 recommendation-safety regression;
- TypeScript;
- TORNTPHARM 75.1575 golden output;
- AUROPHARMA fail-closed golden output;
- universal Research workspace continuity.

Registry promotion:
- FIN_SERVICES_NON_LENDER lifecycle → `IMPLEMENTED`;
- CAPITAL_MARKETS_AMC / INSURANCE / FINTECH_PLATFORM → `SUPPORTED`;
- lender methodology inheritance remains prohibited;
- recommendation thresholds remain pending dedicated evidence validation;
- score/recommendation persistence remain OFF.

**K4 Package 6 · FIN_SERVICES_NON_LENDER = COMPLETE / PASS / CLOSED.**
