# PortfolioAI — Gate K4 Package 6 · FIN_SERVICES_NON_LENDER · Checkpoint A

**Contract:** `FIN_SERVICES_NON_LENDER_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the non-lender Financial Services methodology/evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. Mandatory subprofile split

### CAPITAL_MARKETS_AMC
Reference anchors: NAM-INDIA, HDFCAMC, ANGELONE, CAMS.
Benchmarks: Nifty Financial Services Ex-Bank; Nifty Capital Markets.
Core economics: AUM/client-asset growth, revenue/earnings growth, operating leverage, ROE/ROIC, cash conversion, market share, distribution/platform strength and cycle sensitivity.
Valuation: P/E, AUM/revenue yield where relevant, FCF yield and cycle-aware ROE.

### INSURANCE
Reference anchor: STARHEALTH.
Benchmarks: Nifty Financial Services Ex-Bank; Nifty Insurance.
Core economics: premium/AUM growth, claims/loss ratio, combined-ratio or equivalent margin, solvency/capital adequacy, persistency/renewal quality, underwriting/reserving quality.
Valuation: embedded value/VNB families where available; P/E and ROE only with insurance context.

### FINTECH_PLATFORM
Reference anchors: PAYTM, POLICYBZR.
Benchmarks: Nifty Financial Services Ex-Bank; size-matched digital-financial peer context.
Core economics: revenue growth, contribution margin/unit economics, CFO/FCF or cash burn, funding runway, active user/transaction durability, regulatory dependency and monetization depth.
Valuation: EV/Sales when profitability is immature; P/E when mature; FCF yield when positive; growth-adjusted valuation when justified.

## 3. Hard separation from lender methodology

FIN_SERVICES_NON_LENDER must not inherit BANK_NBFC lending metrics or thresholds.

Explicitly prohibited as methodology selectors here:
- NPA;
- CET1;
- deposit growth;
- NIFTY Bank benchmark authority;
- lender recommendation floors.

## 4. History requirements

- minimum 3 annual years, preferably 5;
- minimum 8 quarterly growth observations;
- minimum 8 quarters of operating/subprofile metrics;
- minimum 3 years cash conversion where applicable;
- minimum 252 trading days for momentum/risk.

## 5. Distortion safeguards

- AUM/market-cycle growth must be normalized within the relevant subprofile;
- insurance claims/reserving evidence cannot be replaced by generic margins;
- platform growth cannot override cash burn or poor unit economics;
- cross-subprofile peer percentiles are prohibited;
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

Owner approval must freeze the three-subprofile split, lender separation, reference anchors, evidence/history gates, benchmark/valuation families, durability/risk treatment and fail-closed behavior before Checkpoint B scoring/portability implementation.
