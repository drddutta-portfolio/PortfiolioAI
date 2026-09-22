# PortfolioAI — Gate K4 Package 5 · HEALTHCARE_SERVICES_V1 · Checkpoint A

**Contract:** `HEALTHCARE_SERVICES_V1_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the Healthcare Services methodology/evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. Initial scope decision

K1 explicitly allowed a single initial hospital-operator methodology. This Checkpoint A therefore does not force diagnostics or other healthcare-service identities into hospital economics.

Diagnostics remain outside this package's first scoring method and must fail review until a separate methodology authority is approved.

## 3. HOSPITAL_OPERATORS

Reference anchors: MAXHEALTH, NH, MEDANTA, YATHARTH.
Primary benchmark: Nifty Hospitals.
Secondary context: Nifty Healthcare.

Primary economics:
- revenue and EBITDA growth;
- operating-margin history;
- occupancy where disclosed;
- ARPOB or equivalent operating yield where disclosed;
- bed capacity and bed-ramp execution;
- ROCE/ROIC;
- CFO/FCF conversion;
- leverage;
- valuation self/peer context.

Valuation family:
- EV/EBITDA;
- P/E;
- FCF yield;
- ROCE with bed-ramp context.

## 4. History requirements

- minimum 3 annual years, preferably 5;
- minimum 8 quarterly growth observations;
- minimum 8 quarters of operating metrics where disclosed;
- minimum 3 years cash conversion;
- minimum 252 trading days for momentum/risk.

## 5. Distortion safeguards

- no single-quarter occupancy or ARPOB spike may establish durable growth;
- bed additions must be reconciled with ramp and return on capital;
- occupancy and ARPOB must be read with capacity/case-mix context;
- cash conversion must be reconciled with capex and receivables;
- non-hospital healthcare-service identities must fail review;
- missing mandatory evidence fails closed.

## 6. Durability and risk

Durability:
- occupancy durability;
- clinician retention;
- case-mix/specialty depth;
- network/location diversification;
- payer mix;
- bed-ramp execution.

Major risks:
- occupancy weakness;
- clinician attrition;
- pricing regulation;
- capex/bed-ramp execution;
- payer mix;
- receivables;
- operating execution.

## 7. Recommendation authority

Universal role names may be reused, but numeric role thresholds, role floors, caution thresholds and AVOID logic remain subprofile-owned and are not activated at Checkpoint A.

## 8. Safety

- runtime activation: NO;
- score persistence: OFF;
- recommendation persistence: OFF;
- provider calls: 0;
- production mutation/migration: NO;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

## 9. Checkpoint A acceptance

Owner approval must freeze the hospital-only initial scope, reference anchors, history/evidence gates, benchmark/valuation families, durability/risk treatment and fail-closed behavior before Checkpoint B scoring/portability implementation.


## 10. Checkpoint A final validation and freeze

Owner-local validation passed:
- `healthcareServicesK4aMethodologyContract.test.ts` — PASS;
- `sectorEngineRegistry.test.ts` — PASS;
- `researchProfileRouting.test.ts` — PASS;
- `npm run typecheck` — PASS.

Owner approved proceeding with the hospital-only initial scope.

**HEALTHCARE_SERVICES_V1 Checkpoint A = COMPLETE / PASS / FROZEN.**
