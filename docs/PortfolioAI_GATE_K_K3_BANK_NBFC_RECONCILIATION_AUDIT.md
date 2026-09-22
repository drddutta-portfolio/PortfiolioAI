# PortfolioAI — Gate K3 BANK_NBFC Reconciliation & Portability Audit

**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** K3 IN PROGRESS — routing reconciliation implemented; methodology/benchmark portability review still open.

## 1. K3 goal

Bring the inherited `BANK_NBFC` engine to the same portability and isolation standard as PHARMA_V1 without rebuilding Stage 8 from zero.

## 2. Runtime reconciliation completed

The legacy scoring path contained a second profile resolver based on broad regex matching. That could activate methodology independently of the K1 industry-first routing contract.

K3 now centralizes scoring resolution through canonical Sector + Industry → RESEARCH_PROFILE_ROUTING_V2 → SECTOR_ENGINE_REGISTRY → scoring profile / rule profile.

Implemented:
- `src/features/research/scoringProfileResolution.ts` now consumes the K1 router and K2 registry;
- `src/data/scoringRepository.ts` now uses the centralized resolver instead of maintaining its own sector regex map;
- BANK_NBFC can route without any ticker-specific condition;
- K4-pending profiles fail closed to GENERAL until their methodology is approved.

Expected routing:
- Banking + Banks → BANK_NBFC
- Financial Services + NBFC → BANK_NBFC
- Banking + missing Industry → GENERAL / fail closed
- Healthcare + Pharmaceuticals → PHARMA_V1

## 3. HDFCBANK-specific code audit

Historical discovery/reference tooling remains explicitly HDFCBANK-only and is not normal runtime methodology:
- `discover-trendlyne-bank-scoring-contract`
- `discover-trendlyne-bank-growth-contract`

Their restriction is acceptable because they are bounded contract-discovery utilities, not runtime methodology selection.

`refresh-bank-benchmark` remains restricted to HDFCBANK and uses NIFTY Bank. This is a genuine K3 portability blocker, but it must not be generalized blindly to every NBFC because benchmark suitability is a methodology question.

## 4. Recommendation audit

The inherited Stage 8 BANK_NBFC recommendation policy is HDFCBANK-pilot based and historically DRAFT.
K2 safety semantics now apply globally: authoritative overall score required; missing mandatory role-floor data → INSUFFICIENT; failed role floor does not automatically imply AVOID; AVOID requires an approved sector boundary; recommendation computation remains read-only; score/recommendation persistence remains OFF.

K3 must still determine whether existing BANK_NBFC thresholds are portable beyond the HDFCBANK bank reference case.

## 5. N/A semantics

Stage 8 explicitly treats Cash Flow as not applicable for BANK_NBFC. K3 must preserve N/A as distinct from missing so N/A cannot create a false readiness failure.

## 6. Bank vs NBFC subprofile decision

The inherited engine is strongly bank-oriented: NPA / asset-quality emphasis, NIFTY Bank benchmark, and HDFCBANK reference implementation.
K3 will not assume those exact benchmark and recommendation rules are economically portable to NBFCs merely because both route into the BANK_NBFC family.

Remaining decision:
- BANK methodology → portability validation
- NBFC_LENDING → prove compatibility or introduce an explicit subprofile/authority split

## 7. Tests added

- updated `scoringProfileResolution.test.ts`
- added `k3BankNbfcPortability.test.ts`

These cover ticker-independent Bank routing, NBFC family routing, sector-only fail-closed behavior, PHARMA isolation, and HDFCBANK as reference-only rather than runtime identity.

## 8. K3 current state

- Industry-first scoring resolution: IMPLEMENTED
- Duplicate regex scoring router: REMOVED
- Ticker-independent BANK route: IMPLEMENTED
- Ticker-independent NBFC family route: IMPLEMENTED
- PHARMA isolation: TESTED IN CODE / LOCAL RUN PENDING
- HDFCBANK discovery tools: REFERENCE-ONLY / ACCEPTABLE
- Bank benchmark portability: OPEN
- Bank-vs-NBFC subprofile decision: OPEN
- Recommendation threshold portability: OPEN
- N/A semantics final verification: OPEN

No production mutation, migration, provider call, scheduler change, deployment, PR merge, score persistence, recommendation persistence or trading action was performed.
