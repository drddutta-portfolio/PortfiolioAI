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


## 9. K3 methodology split decision — FROZEN

The Stage 8 evidence is sufficiently asymmetric to reject one undifferentiated BANK/NBFC numeric methodology.

Frozen architecture:

```text
BANK_NBFC engine family
├── BANK
│   ├── Stage 8 bank methodology
│   ├── NIFTY Bank benchmark authority
│   ├── bank valuation authority
│   └── HDFCBANK remains validation/reference stock only
└── NBFC_LENDING
    ├── same engine family
    ├── dedicated methodology authority required
    ├── dedicated benchmark authority required
    ├── dedicated valuation authority required
    └── dedicated recommendation authority required
```

Reason: the inherited Stage 8 BANK_NBFC contract contains bank-specific inputs including deposit growth and CET1 and uses NIFTY Bank. These cannot be assumed portable to lending NBFCs.

Runtime safety:
- BANK routes to `BANK_NBFC`;
- NBFC_LENDING remains family-routable but scoring fails closed to GENERAL until its own methodology contract exists;
- no bank benchmark, valuation or recommendation rule leaks into NBFC_LENDING.

## 10. Benchmark portability fix

`refresh-bank-benchmark` is no longer HDFCBANK-specific.

It now:
- verifies the held security is an equity;
- reads canonical `current_security_enrichment_v1.sector,industry`;
- permits NIFTY Bank refresh only for `Banking + Banks`;
- uses the actual security symbol in operational metadata;
- explicitly rejects NBFC_LENDING until an NBFC benchmark authority is approved.

The historical Trendlyne discovery functions remain HDFCBANK-only because they are reference-stock contract discovery, not runtime methodology.

## 11. N/A semantics freeze

For the BANK_NBFC lender family:
- `CASH_FLOW` is explicitly not applicable;
- it is removed from allowed scoring dimensions;
- N/A must not be treated as missing.

## 12. K3 closure validation required

Owner-local validation:

```bash
npx vitest run \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/k3BankNbfcPortability.test.ts \
  src/features/research/k3BankNbfcClosure.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts

npm run typecheck
```

If all pass, K3 can close with BANK supported and NBFC_LENDING explicitly fail-closed pending its future dedicated methodology, rather than falsely claiming bank-rule portability.


## 13. K3 final validation and closure

Owner-local final validation passed completely:

- `scoringProfileResolution.test.ts` — PASS;
- `k3BankNbfcPortability.test.ts` — PASS;
- `k3BankNbfcClosure.test.ts` — PASS;
- `researchProfileRouting.test.ts` — PASS;
- `sectorEngineRegistry.test.ts` — PASS;
- `sectorRecommendation.k2Safety.test.ts` — PASS;
- `npm run typecheck` — PASS.

Final K3 state:

```text
BANK_NBFC engine family               PORTABLE / CLOSED
BANK methodology authority            SUPPORTED
NBFC_LENDING methodology authority    EXPLICITLY PENDING / FAIL-CLOSED
NIFTY Bank runtime benchmark          BANK ONLY / CLASSIFICATION-DRIVEN
HDFCBANK runtime dependency           NONE
HDFCBANK validation role              REFERENCE ONLY
PHARMA isolation                      PASS
CASH_FLOW lender treatment            N/A / NOT MISSING
Recommendation safety                 PASS
Production mutation                   NONE
PR #101                               OPEN / DRAFT / UNMERGED
```

**K3 = COMPLETE / PASS / CLOSED.**
