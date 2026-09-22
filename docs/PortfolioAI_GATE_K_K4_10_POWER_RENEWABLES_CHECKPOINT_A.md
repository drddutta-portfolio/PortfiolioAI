# PortfolioAI — Gate K4 Package 10 · POWER_RENEWABLES_V1 · Checkpoint A

**Contract:** `POWER_RENEWABLES_V1_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the Power/Renewables methodology and evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. Mandatory K1 subprofiles

### REGULATED_NETWORK
Reference anchor: POWERGRID.
Core economics: regulated asset/network growth, tariff/allowed-return context, ROE/ROIC, cash conversion, leverage, commissioning execution and network availability.
Valuation: P/B with regulated-asset context, regulated-cash-flow DCF, dividend yield and FCF yield where meaningful.

### GENERATION_INTEGRATED_UTILITY
Reference anchors: TATAPOWER, NHPC.
Core economics: capacity/generation growth, PLF/efficiency where relevant, fuel/resource context, through-cycle ROCE/FCF, leverage, PPA/tariff/offtaker quality and asset-mix durability.
Valuation: normalized EV/EBITDA, DCF, normalized FCF yield, P/B with asset/regulatory context and dividend yield.

### RENEWABLE_IPP
Reference anchors: ACMESOLAR, KPIGREEN, subject to identity review where needed.
Core economics: operating and pipeline MW growth, CUF/resource yield, return-on-capital/project economics, project cash conversion, leverage/refinancing, PPA tenor/tariff/offtaker quality, execution and grid evacuation.
Valuation: EV/EBITDA, contracted-cash-flow DCF, stabilized FCF yield and EV/MW only with cash-flow context.

## 3. History requirements

- minimum 5 annual years;
- minimum 12 quarters of operating evidence;
- minimum 5 years cash conversion;
- minimum 5 years leverage history;
- minimum 252 trading days for momentum/risk.

## 4. Distortion safeguards

- tariff/regulatory context mandatory where material;
- fuel/resource variability normalized for generation;
- offtaker/DISCOM/PPA quality mandatory for contracted assets;
- leverage and interest-rate sensitivity are core evidence;
- capacity additions cannot override weak cash flow or execution quality;
- grid/transmission constraint risk explicit;
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

Owner approval must freeze the three-subprofile split, reference anchors, history/evidence gates, benchmark/valuation families, tariff/offtaker/leverage/grid-risk treatment and fail-closed behavior before Checkpoint B implementation.
