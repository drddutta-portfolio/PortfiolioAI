# PortfolioAI — Gate K4 Package 2 · INDUSTRIALS_CAPITAL_GOODS · Checkpoint A

**Contract:** `INDUSTRIALS_CAPITAL_GOODS_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the industrials/capital-goods methodology and evidence contract before any runtime scoring activation, provider refresh, persistence or deployment.

## 2. Proposed subprofiles

### PROJECT_EPC
Reference anchor: LT.
Primary economics: order book, order inflow, execution, working capital, receivables, cash conversion, ROCE and leverage.
Benchmark: Nifty Capital Goods.
Valuation: EV/EBITDA, cycle-aware P/E, FCF yield and ROCE with working-capital context.

### CAPITAL_EQUIPMENT_ELECTRICAL
Reference anchor: CGPOWER.
Primary economics: revenue/order growth, margins, capital efficiency, cash conversion, capacity/utilisation, leverage and product/technology positioning.
Benchmarks: Nifty Capital Goods; India Manufacturing as context.
Valuation: P/E, EV/EBITDA, FCF yield and cycle-aware ROCE.

### DEFENCE_AEROSPACE
Reference anchors: BEL; ASTRAMICRO as control.
Primary economics: order book/inflow, program execution, margins, ROCE, cash conversion, customer concentration and indigenisation/IP where evidenced.
Benchmarks: India Defence; Nifty Capital Goods as context.
Valuation: P/E, EV/EBITDA, FCF yield and order-book-adjusted growth context.

## 3. History requirements

- minimum 3 annual years, preferably 5;
- minimum 8 quarterly growth observations;
- minimum 4 order-book/order-inflow periods;
- minimum 3 years cash conversion;
- minimum 3 years working-capital evidence;
- minimum 252 trading days for momentum/risk.

## 4. Distortion safeguards

- no single-quarter order/revenue spike may establish durable growth;
- order books must be interpreted with execution/cancellation risk;
- working-capital and receivables cannot be hidden by strong reported order growth;
- ROCE/margins must be interpreted with capex and cycle context;
- no cross-subprofile peer percentiles.

## 5. Recommendation authority

Universal role names may be reused, but numeric role thresholds, role floors and AVOID logic remain subprofile-owned and are not activated at Checkpoint A.

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

Owner approval must freeze the three-subprofile structure, reference anchors, evidence/history gates, benchmark families, valuation families, durability/risk logic and fail-closed behavior before Checkpoint B scoring/portability implementation.
