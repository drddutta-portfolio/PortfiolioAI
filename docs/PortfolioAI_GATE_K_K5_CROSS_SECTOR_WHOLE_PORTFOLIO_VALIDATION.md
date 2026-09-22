# PortfolioAI — Gate K5: Cross-Sector Isolation & Whole-Portfolio Research Validation

**Contract:** `GATE_K5_CROSS_SECTOR_VALIDATION_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** LOCAL VALIDATION PENDING

## 1. Purpose

K5 is a confirmation gate. It runs the completed research engines together and proves that the portfolio behaves as one coherent research system without cross-sector authority leakage.

K5 does not create new scoring methodology.

## 2. Registry-driven isolation matrix

`k5PairwiseEngineIsolationMatrix()` automatically builds every ordered pair of registered engines.

For 12 registered engine families this produces 132 ordered isolation checks.

For every source engine A and foreign engine B:
- B profile codes cannot resolve through A;
- A cannot obtain B methodology authority;
- A cannot obtain B benchmark authority;
- A cannot obtain B valuation authority;
- A cannot obtain B recommendation authority;
- fallback remains `NONE_FAIL_CLOSED`.

Profile ownership is also required to be unique across the registry.

## 3. Whole-portfolio architecture state

A frozen 238-equity K1 routing fixture has been copied into:
`k5CurrentPortfolioRoutingSnapshot.ts`.

Every current holding must resolve to one explicit architecture state:
- `SUPPORTED_ENGINE`;
- `METHODOLOGY_NOT_AVAILABLE`;
- `REVIEW_REQUIRED`;
- `NOT_APPLICABLE`.

This is an architecture/routing validation. It does not claim that every holding has sufficient scoring evidence.

Missing classification is `REVIEW_REQUIRED`.
Unsupported sector/industry is `METHODOLOGY_NOT_AVAILABLE`.
No nearest-looking engine fallback is allowed.

## 4. Future-stock portability

K5 contains one synthetic future-stock routing fixture for every currently supported profile authority.

The tests prove that routing depends on Sector + Industry/business identity and registry authority, not ticker identity.

Intentionally pending authorities remain fail-closed:
- `NBFC_LENDING` → BANK_NBFC family, methodology pending;
- `DIAGNOSTICS` → no approved registered scoring authority.

## 5. Universal Research shell

K5 freezes the shared semantic Research shell:
- Overview
- Financials
- Quality & Growth
- Ownership
- Valuation
- Documents
- Evidence
- Readiness
- Recommendation
- Research Health

The existing universal workspace policy remains authoritative:
- shared page tree required;
- symbol-specific layouts prohibited;
- profile-specific page trees prohibited.

## 6. Recommendation-policy portability study

K5 does not assume universal numeric recommendation thresholds.

Portable universal semantics remain:
- role vocabulary;
- fail-closed missing mandatory inputs;
- failed role floor continues down the approved ladder;
- no score reconstruction;
- zero recommendation writes;
- MISSING vs N/A semantics.

Numeric threshold portability status:
`NOT_ESTABLISHED`.

Pre-declared falsification tests:
1. materially different score distributions by sector;
2. N/A dimensions invalidate a shared floor;
3. same numeric floor gives economically inconsistent outcomes;
4. sector-specific risks require different blockers;
5. valuation-score distributions differ by business model.

K5 decision before owner approval:
`DO_NOT_INTRODUCE_UNIVERSAL_NUMERIC_THRESHOLDS`.

No new numeric threshold is introduced in K5.

## 7. Golden controls

K5 preserves:
- TORNTPHARM overall score = 75.1575 / PHARMA_V1;
- AUROPHARMA = SCORE_NOT_COMPUTABLE;
- AUROPHARMA recommendation = RECOMMENDATION_NOT_COMPUTABLE;
- no missing-input renormalization.

## 8. Safety

- provider calls: 0;
- production mutation: NO;
- production migration: NO;
- score persistence: OFF;
- recommendation persistence: OFF;
- position sizing: OFF;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

## 9. Exit validation

```bash
npx vitest run \
  src/features/research/k5CrossSectorIsolation.test.ts \
  src/features/research/k5WholePortfolioRouting.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts \
  src/features/research/researchWorkspaceContract.test.ts

npm run typecheck
```

If all pass, owner review can freeze the recommendation-portability conclusion and close K5.


## 10. Consolidated execution path

To keep K5 to a single lifecycle-stable owner-local checkpoint, use:

```bash
bash scripts/k5-validate-cross-sector.sh
```

This runner executes the full K5 isolation/routing/portability regression set plus TypeScript. It intentionally contains no stale pre-approval or pre-promotion lifecycle expectation.

Repository CI observation on the initial K5 commit:
- GitHub Architecture Guard concluded failure before any job step was created or executed; this is not evidence of a test assertion failure.
- the separate Vercel status failed because of a build-rate-limit condition.
- neither condition changes K5 methodology or safety state.

K5 remains **LOCAL VALIDATION PENDING** until the consolidated owner-local command passes.
