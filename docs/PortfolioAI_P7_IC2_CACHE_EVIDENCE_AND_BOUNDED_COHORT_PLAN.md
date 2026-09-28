# PortfolioAI — P7-IC IC2 Cache / Evidence Deficit & Bounded Cohort Plan

**Date:** 29 September 2026  
**Environment:** PortfolioAI Dev  
**IC1 authority accepted:** `8bd8a971ae31812e503217d06c6c3cc9098d4061`  
**Status:** **IC2 planning complete / provider execution NOT authorized**

## IC1 closure

Owner Checkpoint IC-B approved the exact IC1 package at `8bd8a971ae31812e503217d06c6c3cc9098d4061`. IC1 is **COMPLETE / PASS / CLOSED**: 239 equities, 238 resolved, BLUEJET the sole factual review exception, and zero deferred-engineering methodology gaps.

## Live cache result

Planning used the live Development cache with an execution-freshness cutoff of end-of-day 29 September IST.

| Item | Live result |
|---|---:|
| Equities | 239 |
| Trendlyne identity ready | 99 |
| Base current research bundle reusable | 79 |
| Resolved equities needing current-research refresh | 160 |
| Resolved equities needing Trendlyne identity work first | 140 |
| Supported-adapter Trendlyne call ceiling | 920 |
| Trendlyne planned daily envelope / reserve | 320 / 80 |
| Current India-day Trendlyne usage | 0 |
| Incremental Angel One stock-history calls | 238 |
| Required primary benchmark authorities | 22 |
| Ready primary benchmark histories | 0 |
| Current R6-ready equities | 0 |

The **920-call figure is only the exact ceiling for already-implemented identity + current-research adapters**. It is not the full IC2 methodology-specific evidence workload.

## Trendlyne bounded cohorts

- **T1:** 320 calls: 140 identity scopes ×2 plus 10 already-identity-ready current-research refreshes ×4.
- **T2:** 320 calls, conditional on exact identity success.
- **T3:** 280 calls, conditional on exact identity success.

Every physical batch is capped at 40 planned calls. BLUEJET receives zero calls until its Primary Pharma subprofile is reviewed.

## Angel One history

238 resolved equities need one incremental stock-history request. After refresh, momentum/drawdown/volatility are locally derivable with no additional provider call.

These nine securities remain intrinsically below 252 trading sessions even after an incremental refresh and therefore remain evidence-insufficient for 252-day signals:

- GROWW
- ICICIAMC
- LENSKART
- LGEINDIA
- PINELABS
- TATACAP
- TMCV
- UTLSOLAR
- VAML

## Benchmark blocker

IC1 resolves to 22 distinct primary benchmark authorities, but Development has zero ready benchmark histories. Only specialized NIFTY Bank and NIFTY Pharma benchmark functions currently exist; the Pharma function is TORNTPHARM-scoped. The other benchmark authorities need a generic exact-index resolver/history adapter or an explicit equivalent before execution.

Benchmark history is shared per benchmark, not fetched per stock.

## Profile-specific normalization blocker

The strengthened methodologies contain evidence that the current 47 canonical metric definitions and four-call research refresh do not fully represent. Current document discovery stores metadata, not normalized business-model evidence. Multi-period growth/margins, business durability, order/capacity/unit-economics, lender capital/liquidity and similar requirements need executable profile evidence adapters before broad calls can be justified.

Machine-readable mapping:
`docs/p7-ic/PortfolioAI_P7_IC2_PROFILE_EVIDENCE_ADAPTER_PLAN_V1.json`

## Execution barrier

No provider calls or database writes occurred.

The next executable IC2 package must return for owner approval with:
1. the T1-T3 exact supported-adapter cohorts;
2. the stock-history batches;
3. the 22-benchmark adapter/registry plan;
4. executable profile-specific evidence mappings and any required Development write authority;
5. BLUEJET's factual subprofile disposition.

IC4/R6 and IC5/R7 remain prohibited until IC-C.
