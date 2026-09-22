# PortfolioAI — Gate K4 Package 7 · METALS_COMMODITIES · Checkpoint A

**Contract:** `METALS_COMMODITIES_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the Metals/Commodities methodology/evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. K1 open question resolved

K1 intentionally did not freeze a Metals subprofile split. K4-A now resolves that decision in favor of two curves because steel and non-ferrous/mining economics require materially different cycle, cost and valuation interpretation.

## 3. STEEL_FERROUS

Reference anchor: JINDALSTEL.
Benchmark: Nifty Metal.
Core economics: volume/realization, EBITDA per tonne or equivalent margin, utilization, raw-material integration, through-cycle ROCE/FCF, leverage and steel-spread cycle.
Valuation: normalized EV/EBITDA, P/B with cycle context, normalized FCF yield and through-cycle ROCE.

## 4. NON_FERROUS_DIVERSIFIED_METALS

Reference anchors: HINDALCO, HINDZINC.
Benchmark: Nifty Metal.
Core economics: production volume/realization, cost curve, reserves/resource life where relevant, integration/energy costs, through-cycle ROCE/FCF, leverage and metal-price cycle.
Valuation: normalized EV/EBITDA, P/B with cycle context, normalized FCF yield, through-cycle ROCE and NAV/resource context where relevant.

## 5. Commodity exposure metadata

Mandatory for both subprofiles. The scoring method must know the relevant commodity/metal exposure and must not infer a durable earnings state from spot pricing alone.

## 6. History requirements

- minimum 5 annual years;
- minimum 12 quarterly cycle observations;
- minimum 12 quarters margin history;
- minimum 5 years cash conversion;
- minimum 5 years leverage history;
- minimum 252 trading days for momentum/risk.

## 7. Distortion safeguards

- through-cycle normalization mandatory;
- no single-quarter margin or spot-price spike may define durable earnings;
- cost curve/input integration context mandatory;
- leverage must be assessed at mid-cycle rather than only peak earnings;
- spot P/E cannot be the sole valuation anchor;
- cross-subprofile peer percentiles prohibited;
- missing mandatory evidence fails closed.

## 8. Recommendation authority

Universal role names may be reused, but numeric thresholds, role floors and AVOID boundaries remain subprofile-owned and are not activated at Checkpoint A.

## 9. Safety

- runtime activation: NO;
- score persistence: OFF;
- recommendation persistence: OFF;
- provider calls: 0;
- production mutation/migration: NO;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

## 10. Checkpoint A acceptance

Owner approval must freeze the two-subprofile split, commodity-exposure requirement, reference anchors, through-cycle history/evidence gates, benchmark/valuation families and fail-closed behavior before Checkpoint B implementation.
