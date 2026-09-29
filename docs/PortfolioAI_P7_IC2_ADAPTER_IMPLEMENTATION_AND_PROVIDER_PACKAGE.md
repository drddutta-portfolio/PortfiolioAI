# PortfolioAI — P7-IC IC2 Adapter Implementation & Exact Provider Package

**Date:** 29 September 2026  
**Parent adapter commit:** `463c6a6f586420ee6db1882b8d2654f588743893`  
**Status:** **READY FOR OWNER REVIEW / PROVIDER EXECUTION NOT AUTHORIZED**

## Repository-only implementation completed

The accepted IC1 contracts are now executable in repository code without changing the scoring methodology:

- 47 methodology profiles are represented by frozen profile evidence contracts.
- 239 held-equity assignments are represented from the accepted IC1 coverage matrix.
- BLUEJET remains the sole factual `REVIEW_REQUIRED` item and is never auto-assigned.
- a generic 22-authority NIFTY benchmark adapter resolves exact NSE `AMXIDX` identities and plans shared cache/full/incremental history;
- profile-aware Trendlyne evidence normalization routes numeric history, ownership history, document evidence, stock history and benchmark history through explicit fail-closed contracts;
- qualitative document evidence is `EVIDENCE_PRESENT_REVIEW_REQUIRED`; keyword presence is never converted into a score;
- the existing four-call Complete Research bundle is reused. Profile-aware query contents improve evidence capture without increasing physical Trendlyne calls;
- Complete Research has repository wiring for `P7_IC2_PLAN/P7_IC2_EXECUTE`, Development hard-lock and owner-approved assignment verification;
- a generic Development-only benchmark refresh Edge Function is staged in repository and not deployed.

## Exact Trendlyne package

The one-day package is **920 physical Trendlyne calls**:

| Phase | Batches | Calls |
|---|---:|---:|
| Exact identity | 7 × ≤40 | 280 |
| Current research | 16 × ≤40 | 640 |
| **Total** | **23** | **920** |

With the temporary 1,000-call/day subscription, this leaves **80 calls of external subscription headroom**.

Identity batches must finish first. A stock that was identity-unresolved may enter a research batch only after exact MATCHED identity exists.

## Trendlyne upgrade point

**This is now the point at which the temporary Trendlyne upgrade is needed — before the next provider-execution approval.**

Current PortfolioAI Development control remains **400/day**. The external subscription upgrade alone does not change PortfolioAI's safety limit. After you confirm that Trendlyne shows 1,000 calls/day, the next owner authorization can explicitly permit:

1. temporary Development-only internal limit `400 → 1000`;
2. exact IC2 Trendlyne execution up to the frozen 920-call campaign ceiling;
3. exact Angel One stock + benchmark history execution;
4. Development evidence writes produced by those approved provider runs.

The internal limit will be returned to **400/day** after Development remediation. The external 30-day plan may expire or be downgraded independently.

## Angel One package

- stock-history calls: **238**;
- benchmark-history calls: **22**;
- authenticated history calls total: **260**;
- one shared public Angel One instrument-master fetch is used to resolve benchmark identities.

Angel One remains subject to existing pacing/lease controls even though there is no planned daily hard ceiling comparable with Trendlyne.

## Cache-first rule

79 current base-research bundles already exist. Their raw Trendlyne captures are normalized locally first, with zero provider calls. Provider work is reserved for actual residual gaps.

## Intrinsic 252-session exceptions

These listings remain unable to satisfy a 252-session history requirement until enough real trading sessions exist:

- GROWW
- ICICIAMC
- LENSKART
- LGEINDIA
- PINELABS
- TATACAP
- TMCV
- UTLSOLAR
- VAML

## Hard stop rules

Execution must stop rather than guess if:
- Production is targeted;
- the 1,000/day Trendlyne entitlement is not verified;
- the Development internal limit has not been explicitly raised;
- a batch exceeds 40 calls or the campaign would exceed 920;
- identity is not exact before research;
- provider schema/primary entity mismatches;
- a benchmark is not exactly one NSE AMXIDX identity;
- BLUEJET remains unresolved.

## Current governance

No provider call, database write, migration, deployment, merge, Production change, IC4/R6 execution, IC5/R7 execution or P8 was authorized or performed by this repository build.
