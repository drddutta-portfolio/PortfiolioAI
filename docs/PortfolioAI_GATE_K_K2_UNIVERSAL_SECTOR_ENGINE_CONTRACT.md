# PortfolioAI — Gate K2 Universal Sector-Engine Architecture Contract

**Contract:** `SECTOR_ENGINE_CONTRACT_V1`  
**Date:** 22 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 OPEN / DRAFT / UNMERGED

## 1. Purpose

K2 freezes the universal contract that every sector engine must obey while leaving methodology, valuation, benchmark, risk and recommendation thresholds sector-owned.

```text
Canonical classification
→ Research profile resolution
→ Sector-engine registry
→ Sector-specific evidence/readiness
→ Deterministic score when complete
→ Sector-owned recommendation authority
→ Universal Research workspace
```

Industry remains the minimum micro-methodology selector. Sector alone cannot activate a specialised engine.

## 2. Universal semantics

The universal layer owns:
- canonical classification and profile resolution;
- evidence provenance/status semantics;
- missing vs N/A semantics;
- readiness semantics;
- the common Research workspace;
- score/recommendation availability semantics;
- fail-closed behavior;
- Research Health;
- zero-write recommendation computation.

Universal role names may be shared:
`CORE_CANDIDATE`, `SATELLITE_CANDIDATE`, `WATCH`, `AVOID`, `INSUFFICIENT`.

Universal numeric thresholds are prohibited.

## 3. Sector-owned authority

Each engine owns, after its methodology gate approves them:
- metrics and history requirements;
- score curves/percentiles;
- benchmarks;
- valuation method;
- durability model;
- sector risks;
- N/A dimensions;
- hard blockers;
- subprofiles where genuinely required;
- role thresholds and role floors;
- caution thresholds;
- AVOID rules.

## 4. Mandatory failure behavior

```text
Unknown methodology
→ METHOD_NOT_AVAILABLE

Missing mandatory evidence
→ SCORE_NOT_COMPUTABLE

Conflicting classification
→ REVIEW_REQUIRED

Missing required recommendation-floor data
→ INSUFFICIENT

Failed role floor
→ role ineligible
→ continue down approved role ladder

Explicit N/A
→ N/A
→ never missing
```

No mandatory-input score reconstruction is allowed.

## 5. Registry

Runtime authority:
`src/features/research/sectorEngineRegistry.ts`

The registry currently contains:
- PHARMA_V1 — implemented;
- BANK_NBFC — inherited, K3 reconciliation required;
- ten K4 packages — frozen placeholders only, with no invented methodology.

Every registry entry has:
- engine identity;
- lifecycle;
- methodology authority;
- profile codes;
- allowed/N/A dimensions;
- benchmark authority;
- valuation authority;
- recommendation authority;
- subprofile support;
- fail-closed fallback policy;
- reference validation symbols;
- `runtimeSymbolSpecific = false`.

## 6. Safety contract carried forward

Every sector engine must prove:
1. missing mandatory role-floor data → `INSUFFICIENT`;
2. a failed role floor does not automatically imply `AVOID`;
3. secondary exposure cannot create an independent recommendation;
4. null mandatory inputs fail closed;
5. recommendation computation performs zero writes;
6. score and recommendation persistence stay OFF unless separately authorized.

## 7. K2 implementation state

Implemented in this checkpoint:
- `SECTOR_ENGINE_CONTRACT_V1`;
- versioned sector-engine registry;
- inherited-engine mappings;
- ten frozen K4 placeholders;
- explicit no-fallback/no-symbol-specific invariants;
- deterministic contract tests.

Not done in K2:
- no new sector methodology;
- no BANK_NBFC reconciliation;
- no recommendation threshold changes;
- no production writes;
- no deployment.

## 8. Validation required for K2 exit

Owner-local validation:

```bash
npx vitest run src/features/research/sectorEngineRegistry.test.ts
npm run typecheck
```

K2 closes only after those validations pass and the owner approves this universal contract.
