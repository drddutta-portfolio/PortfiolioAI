# PortfolioAI — Gate K4 Package 8 · CONSUMER_FMCG · Checkpoint A

**Contract:** `CONSUMER_FMCG_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the Consumer/FMCG methodology and evidence contract before runtime scoring activation, provider refresh, persistence or deployment.

## 2. Initial scope decision

K1 intentionally did not require fixed consumer subprofiles. Checkpoint A keeps one initial `BRANDED_CONSUMER_FMCG` methodology rather than fragmenting personal care, packaged foods, beverages, tea/coffee and alcohol into arbitrary score curves.

Product/category metadata remains mandatory so durability and risk interpretation can differ where economically necessary.

## 3. Reference anchors

- HINDUNILVR — branded personal/home-care control;
- VBL — beverages/control for distribution and asset intensity;
- LTFOODS — packaged-food control;
- RADICO — alcohol-specific excise/regulatory risk control.

Benchmark: Nifty FMCG.

## 4. Core evidence

- multi-period revenue growth;
- volume/price/mix when disclosed;
- gross and operating-margin history;
- ROCE/ROIC;
- CFO/FCF conversion;
- working-capital discipline;
- brand/distribution/category durability;
- balance-sheet safety;
- valuation self-history and peer context;
- product-category metadata;
- momentum/drawdown.

## 5. Alcohol treatment

Alcohol is not assigned a separate universal score curve at K4-A. Excise and regulation are explicit risk metadata and must influence durability/risk interpretation for relevant companies.

## 6. History requirements

- minimum 3 annual years, preferably 5;
- minimum 8 quarterly growth observations;
- minimum 8 quarters margin history;
- minimum 3 years cash conversion;
- minimum 252 trading days for momentum/risk.

## 7. Distortion safeguards

- no single-quarter growth or margin spike may establish durable growth;
- volume/price/mix must be separated when disclosed;
- raw-material inflation must be read with gross/operating-margin history;
- cash conversion and working capital are core quality evidence;
- product-category metadata is mandatory;
- missing mandatory evidence fails closed.

## 8. Valuation

- P/E self-history and peer-relative;
- EV/EBITDA;
- FCF yield;
- ROCE/cash-conversion context.

## 9. Recommendation authority

Universal role names may be reused, but numeric thresholds, role floors and AVOID boundaries remain profile-owned and are not activated at Checkpoint A.

## 10. Safety

- runtime activation: NO;
- score persistence: OFF;
- recommendation persistence: OFF;
- provider calls: 0;
- production mutation/migration: NO;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

## 11. Checkpoint A acceptance

Owner approval must freeze the one-profile initial scope, mandatory category metadata, alcohol-risk treatment, reference anchors, history/evidence gates, benchmark/valuation families and fail-closed behavior before Checkpoint B implementation.


## 12. Checkpoint A final validation and freeze

Owner-local validation passed:
- `consumerFmcgK4aMethodologyContract.test.ts` — PASS;
- `sectorEngineRegistry.test.ts` — PASS;
- `researchProfileRouting.test.ts` — PASS;
- `npm run typecheck` — PASS.

Owner approved proceeding with the one-profile branded/staples methodology and explicit category/alcohol risk metadata treatment.

**CONSUMER_FMCG Checkpoint A = COMPLETE / PASS / FROZEN.**
