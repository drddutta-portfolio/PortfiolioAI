# PortfolioAI — Gate K4 Package 4 · CHEMICALS_V1 · Checkpoint A

**Contract:** `CHEMICALS_V1_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the Chemicals methodology/evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. Proposed subprofiles

### SPECIALTY_CHEMICALS
Reference anchors: PIIND, SRF; VINATIORGA as specialty control.
Primary economics: durable revenue/margin growth, ROCE/ROIC, cash conversion, capacity utilisation, customer/product concentration, process/IP depth and export/customer diversification.
Benchmark: Nifty Chemicals.
Valuation: P/E, EV/EBITDA, FCF yield and ROCE with capacity context.

### AGRO_FERTILISER
Reference anchors: PIIND and DEEPAKFERT.
Primary economics: volume/revenue growth, margin history, capital efficiency, cash conversion, inventory/working capital, leverage and feedstock/input-price context.
Benchmark: Nifty Chemicals.
Valuation: cycle-aware P/E, EV/EBITDA, FCF yield and normalised ROCE.

### COMMODITY_PROCESS_CHEMICALS
Reference anchors: SRF and DEEPAKFERT.
Primary economics: volume/price/mix, through-cycle margins and ROCE, cash conversion, utilisation, leverage, feedstock/global pricing and cost position.
Benchmark: Nifty Chemicals.
Valuation: normalised EV/EBITDA, P/B with cycle context, normalised FCF yield and through-cycle ROCE.

## 3. History requirements

- minimum 3 annual years, preferably 5;
- minimum 8 quarterly growth observations;
- minimum 8 quarters margin history;
- minimum 3 years cash conversion;
- minimum 4 capacity/utilisation observations where relevant;
- minimum 252 trading days for momentum/risk.

## 4. Distortion safeguards

- no single-quarter price or margin spike may establish durable growth;
- capacity growth must be reconciled with utilisation and return on capital;
- feedstock and global pricing context is mandatory where material;
- cross-subprofile peer percentiles are prohibited;
- missing mandatory evidence fails closed.

## 5. Recommendation authority

Universal role names may be reused, but numeric role thresholds, role floors, caution thresholds and AVOID logic remain subprofile-owned and are not activated at Checkpoint A.

## 6. Safety

- runtime activation: NO;
- score persistence: OFF;
- recommendation persistence: OFF;
- provider calls: 0;
- production mutation/migration: NO;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

## 7. Checkpoint A acceptance

Owner approval must freeze the three-subprofile structure, reference anchors, history/evidence gates, benchmark family, valuation families, durability/risk treatment and fail-closed behavior before Checkpoint B scoring/portability implementation.


## 8. Checkpoint A final validation and freeze

Owner-local validation passed:
- `chemicalsK4aMethodologyContract.test.ts` — PASS;
- `sectorEngineRegistry.test.ts` — PASS;
- `researchProfileRouting.test.ts` — PASS;
- `npm run typecheck` — PASS.

Owner approved proceeding with the three-subprofile Chemicals structure and the frozen evidence/valuation/benchmark/durability boundaries.

**CHEMICALS_V1 Checkpoint A = COMPLETE / PASS / FROZEN.**
