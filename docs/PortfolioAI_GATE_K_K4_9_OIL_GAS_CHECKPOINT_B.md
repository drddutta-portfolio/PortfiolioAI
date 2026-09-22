# PortfolioAI — Gate K4 Package 9 · OIL_GAS_V1 · Checkpoint B

**Contract:** `OIL_GAS_V1_K4B_SCORING_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING / RUNTIME ACTIVATION BLOCKED

## 1. Purpose

Implement and validate deterministic Oil/Gas scoring and portability without activating runtime scoring or persisting scores/recommendations.

## 2. Deterministic scoring

Ten dimensions total 100:
- Quality 11
- Growth 11
- Capital Efficiency 12
- Cash Flow 13
- Balance Sheet / Credit 11
- Business Durability 10
- Valuation 13
- Momentum 5
- Risk 10
- Ownership / Governance 4

Final weighted scores use stable six-decimal precision.

## 3. Subprofile-specific growth contracts

UPSTREAM_E_AND_P → PRODUCTION_RESERVE_AND_REALIZATION_GROWTH.

MIDSTREAM_CITY_GAS → VOLUME_THROUGHPUT_AND_NETWORK_GROWTH.

INTEGRATED_REFINING_PETCHEM → THROUGHPUT_SEGMENT_AND_MARGIN_GROWTH.

## 4. Mandatory readiness gate

`SUBPROFILE_OPERATING_CONTEXT` is mandatory for every Oil/Gas score so the evaluator has the required reserve/volume/throughput/refining context before computing a score.

## 5. Cycle safeguards

- commodity/refining-cycle normalization mandatory;
- five-year through-cycle financial history;
- 12-quarter cycle-quality depth;
- administered pricing/tax context where material;
- reserves/volume/throughput context by subprofile;
- explicit commodity/policy/FX/energy-transition risk;
- RELIANCE remains a mixed-business control rather than sole authority.

## 6. Canonical routing

`RESEARCH_PROFILE_ROUTING_V2` routes upstream, midstream/city gas and integrated/refining-petchem industries separately.

`SECTOR_ENGINE_REGISTRY` maps all three profiles to OIL_GAS_V1 in validation-pending state.

## 7. Lifecycle-stable regression

The current-package regression is valid before and after promotion. Completed packages are asserted only as IMPLEMENTED.

Golden controls preserve TORNTPHARM 75.1575, AUROPHARMA fail-closed semantics and the universal Research workspace.

## 8. Recommendation safety

No Oil/Gas numeric recommendation thresholds are introduced here. Recommendation authority remains pending dedicated evidence validation.

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
  src/features/research/oilGasK4aMethodologyContract.test.ts \
  src/features/research/oilGasK4bScoringMethodology.test.ts \
  src/features/research/oilGasK4bIsolationRegression.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, OIL_GAS_V1 may be promoted to IMPLEMENTED read-only methodology authority.
