# PortfolioAI — Gate K4 Package 3 · AUTO_COMPONENTS · Checkpoint A

**Contract:** `AUTO_COMPONENTS_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the automobile and auto-components methodology/evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. Proposed subprofiles

### AUTO_OEM
Reference anchors: M&M and TVSMOTOR.
Benchmark: Nifty Auto.
Core economics: volume/revenue growth, margin durability, ROCE/ROIC, cash conversion, capex intensity, balance-sheet strength, product/platform diversification and EV-transition readiness.
Valuation: cycle-aware P/E, EV/EBITDA, FCF yield and ROCE with capex context.

### AUTO_COMPONENTS
Reference anchors: MOTHERSON and SONACOMS.
Benchmarks: Nifty Auto primary; EV/New Age Automotive as transition context.
Core economics: revenue growth, margins, ROCE/ROIC, cash conversion, customer concentration, leverage, platform diversification and technology/EV exposure.
Valuation: P/E, EV/EBITDA, FCF yield and cycle-aware ROCE.

## 3. EV-transition treatment

EV transition is explicitly treated as exposure/risk metadata and a durability input at Checkpoint A. It is not a separate third scoring engine and does not automatically generate a score premium.

## 4. History requirements

- minimum 3 annual years, preferably 5;
- minimum 8 quarterly growth observations;
- minimum 8 quarters margin history;
- minimum 3 years cash conversion;
- minimum 252 trading days for momentum/risk.

## 5. Distortion safeguards

- no single-quarter volume or margin spike may establish durable growth;
- FCF and ROCE must be interpreted with the capex cycle;
- OEM and component peer percentiles must not be mixed;
- EV-transition narratives must not override audited financial evidence;
- missing mandatory evidence fails closed.

## 6. Recommendation authority

Universal role names may be reused, but numeric role thresholds, role floors, caution thresholds and AVOID logic remain subprofile-owned and are not activated at Checkpoint A.

## 7. Safety

- runtime activation: NO;
- score persistence: OFF;
- recommendation persistence: OFF;
- provider calls: 0;
- production mutation/migration: NO;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

## 8. Checkpoint A acceptance

Owner approval must freeze the OEM/components split, reference anchors, history/evidence gates, benchmark families, valuation families, durability/risk treatment and fail-closed behavior before Checkpoint B scoring/portability implementation.
