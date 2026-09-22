# PortfolioAI — Gate K4 Package 9 · OIL_GAS_V1 · Checkpoint A

**Contract:** `OIL_GAS_V1_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the Oil/Gas methodology and evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. Mandatory K1 subprofiles

### UPSTREAM_E_AND_P
Reference anchor: ONGC.
Core economics: production volume/realization, reserves/resource life, lifting/unit cost, through-cycle ROCE/FCF, leverage, commodity/administered pricing context.
Valuation: normalized EV/EBITDA, P/B with resource context, normalized FCF yield, dividend yield and DCF/resource value where supported.

### MIDSTREAM_CITY_GAS
Reference anchors: GAIL, MGL, IGL.
Core economics: volume/throughput growth, margin/spread, ROCE, cash conversion, leverage, tariff/allocation/regulatory context, network/license durability.
Valuation: EV/EBITDA, P/E with regulatory context, FCF yield, dividend yield and DCF where tariff cash flows are stable.

### INTEGRATED_REFINING_PETCHEM
RELIANCE is a mixed-business control rather than the sole economic anchor.
Core economics: throughput/segment growth, GRM/refining spread context, petchem margin/product mix, through-cycle ROCE/FCF, leverage, diversification and capital allocation.
Valuation: normalized EV/EBITDA, SOTP where relevant, normalized FCF yield, P/B with cycle context and DCF where segment disclosure supports.

## 3. History requirements

- minimum 5 annual years;
- minimum 12 quarterly cycle observations;
- minimum 5 years cash-conversion history;
- minimum 5 years reserves/volume context where relevant;
- minimum 252 trading days for momentum/risk.

## 4. Distortion safeguards

- commodity/refining-cycle normalization mandatory;
- spot crude/gas/refining spreads cannot define durable earnings;
- administered pricing/tax context mandatory where material;
- reserves/volume/throughput context required by subprofile;
- energy-transition risk explicit;
- mixed-business controls cannot override pure-play economics;
- no cross-subprofile peer percentiles;
- missing mandatory evidence fails closed.

## 5. Recommendation authority

Universal role names may be reused, but numeric thresholds, role floors and AVOID boundaries remain subprofile-owned and are not activated at Checkpoint A.

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

Owner approval must freeze the three-subprofile split, mixed-business-control rule, history/evidence gates, benchmark/valuation families, energy-transition treatment and fail-closed behavior before Checkpoint B implementation.


## 8. Checkpoint A final validation and freeze

Owner-local validation passed:
- `oilGasK4aMethodologyContract.test.ts` — PASS;
- `sectorEngineRegistry.test.ts` — PASS;
- `researchProfileRouting.test.ts` — PASS;
- `npm run typecheck` — PASS.

Owner approved proceeding with the three-subprofile Oil/Gas methodology and the frozen cycle/valuation/risk boundaries.

**OIL_GAS_V1 Checkpoint A = COMPLETE / PASS / FROZEN.**
