# PortfolioAI — Post-D P4 Existing Evidence & Market-Data Rollout — Bounded Cohort Plan

**Stage:** P4 — Existing Evidence & Market-Data Rollout  
**Checkpoint:** Owner Checkpoint 4A candidate  
**Branch:** `PortfolioAI-Development`  
**Date:** 26 September 2026  
**Status:** OWNER CHECKPOINT 4A APPROVED / EXECUTION SAFELY BLOCKED BEFORE FIRST PROVIDER CALL  
**Production impact:** NONE

## 1. P4 contract

P4 reuses the existing R3/R5/Program A mechanisms. It does not create another evidence, classification, market-history, provider-control, or scoring authority.

Canonical order:

1. identity and eligibility;
2. classification/profile readiness;
3. current-price coverage;
4. historical-price and benchmark coverage;
5. fundamental evidence;
6. valuation evidence;
7. ownership/governance evidence;
8. documents;
9. freshness/conflict resolution;
10. profile readiness.

No R6/R7 scoring or recommendation execution belongs to P4.

## 2. Read-only Development baseline

The copied Development portfolio currently contains:

| Readiness fact | Current state |
|---|---:|
| Open holdings | 248 |
| Open equities | 239 |
| Non-equity open holdings | 9 |
| Current-price coverage | 244 / 248 |
| Current-price missing | 4 |
| Equities with sector + industry and no conflict | 48 / 239 |
| Equities blocked by missing sector/industry/conflict | 191 / 239 |
| Angel One identity verified | 244 / 248 |
| Current holdings with ONE_DAY stored history | 1 / 248 |
| Current holdings without ONE_DAY stored history | 247 / 248 |
| Holdings with fundamental observations | 25 |
| Holdings with research documents | 4 |
| Holdings with active news | 35 |

The apparent difference from the Stage 5 “classified” count is intentional, not a regression: Stage 5 validated broad copied classification state, while P4 applies the later frozen **industry-first methodology selector**. A sector-only equity is therefore not methodology-ready.

No provider call or write was performed to produce this baseline.

## 3. Proposed five-security bounded cohort

| Security | Purpose | Current P4 state |
|---|---|---|
| HDFCBANK | Mature Bank reference | Classification/profile ready; current price + Angel identity ready; 274 ONE_DAY rows through 16 Sep 2026; rich fundamentals/document/news evidence |
| TORNTPHARM | Mature Pharma reference | Classification/profile/subprofile ready; current price + Angel identity ready; no copied ONE_DAY history; rich fundamentals + document evidence |
| M&M | Non-Pharma K4 reference | Classification + reviewed AUTO_COMPONENTS profile ready; current price + Angel identity ready; no copied ONE_DAY history; fundamentals/document/news present |
| BEL | Classification prerequisite | Sector present but industry missing; current price + Angel identity ready; ISIN present; must remain blocked until reviewed industry classification resolves |
| BANKBARODA | Fail-closed crossover case | Current price missing; classification missing; Angel mapping missing; ISIN present; proves P4 does not fabricate price, identity or methodology readiness |

This cohort is deliberately not “the five easiest stocks.” It exercises ready, partial, and blocked states.

## 4. Execution sequence after Owner Checkpoint 4A

### P4A-1 — prerequisite classification only

Use the existing Program A classification mechanism only for cohort rows that satisfy its exact identity prerequisite.

Initial proposed actions:

- BEL — at most **1 Trendlyne classification call**.
- BANKBARODA — at most **1 Trendlyne classification call**.

Hard ceiling for P4A-1: **2 Trendlyne physical calls**.

After P4A-1, stop and rematerialize the readiness snapshot. Any changed classification invalidates downstream assumptions and requires deterministic replanning.

### P4A-2 — evidence refresh, only after replan

For still-eligible cohort securities with stale/missing refreshable R3 domains, reuse `COMPLETE_RESEARCH_REFRESH`.

Inherited Program A call model:
- verified existing Trendlyne identity: 4 estimated physical calls;
- identity discovery required: 6 estimated physical calls.

P4A-2 hard ceiling: **6 Trendlyne physical calls total**, which permits no more than one six-call case or the bounded equivalent under the existing controller.

No external-ratings or business-durability provider call may be invented where no approved adapter exists.

### P4A-3 — security market history, only after replan

Eligible initial candidates:
- HDFCBANK — incremental ONE_DAY refresh candidate;
- TORNTPHARM — full-backfill candidate;
- M&M — full-backfill candidate.

Hard ceiling: **3 Angel One security-history requests**, matching the existing Program A bounded ceiling.

### Benchmark boundary

Development currently has:
- NIFTY_BANK benchmark identity row present but unresolved;
- no NIFTY_PHARMA benchmark row;
- zero copied benchmark-history rows.

Therefore **benchmark provider execution is excluded from the initial P4A authorization candidate**. It remains blocked until benchmark identity support is explicitly ready and a fresh plan proves the exact call.

## 5. Maximum initial 4A budget envelope

If Owner Checkpoint 4A approves the staged cohort package:

| Provider | Stage | Hard ceiling |
|---|---|---:|
| Trendlyne | P4A-1 classification | 2 calls |
| Trendlyne | P4A-2 evidence after replan | 6 calls |
| Angel One | P4A-3 security history after replan | 3 requests |
| Angel One | benchmark history | 0 initially |

Maximum approved envelope proposed: **8 Trendlyne calls + 3 Angel One security-history requests**, executed sequentially with mandatory replan/stop boundaries.

This is below the inherited Program A combined Trendlyne ceiling of 11 and preserves the Angel One three-security ceiling.

## 6. Stop conditions

Stop immediately if any of the following occurs:

- exact provider identity cannot be established;
- provider schema differs from the reviewed contract;
- classification conflicts or remains incomplete;
- a plan changes after an upstream prerequisite write;
- call ceiling would be exceeded;
- a provider endpoint is unsupported;
- Development resolves to the Production project;
- any action attempts score/recommendation/sizing persistence;
- scheduler, paid AI, trading or Production mutation would be required.

No missing datum may be converted to zero or inferred from sector alone.

## 7. Owner Checkpoint 4A decision

```text
P4 read-only baseline = COMPLETE
P4 bounded cohort = PROPOSED
Provider calls made during planning = 0
Writes made during planning = 0
Owner Checkpoint 4A = APPROVED
P4A-1 execution = BLOCKED_SAFE
Provider calls = 0
Writes = 0
Blocking reason = HOSTED_EXACT_COHORT_EXECUTION_PATH_NOT_AVAILABLE
Portfolio-wide P4 rollout = NOT AUTHORIZED
Owner Checkpoint 4B = NOT REACHED
P5 = NOT AUTHORIZED
```

## 8. UI impact

**Visible UI change: NONE.**

This P4 planning checkpoint changes documentation/readiness evidence only. It does not change React components, routes, displayed data, or application behavior.


## 9. Owner Checkpoint 4A approval and safe execution stop

The owner approved the exact five-security cohort and stated ceilings.

Before the first provider call, the deployed Development execution contract was checked. The existing exact bounded route (`A2_EXECUTE`) is intentionally local-only and rejects hosted Supabase. The hosted function also requires an internal classification token, while the currently connected execution surface does not expose a safe exact-cohort invocation mechanism carrying that credential.

The generic hosted `RUN` mode was deliberately not used because it would select its own cohort rather than the approved P4 cohort.

Result:

- provider calls: **0**;
- Development writes: **0**;
- Production writes: **0**;
- call budget consumed: **0**;
- approved cohort: unchanged;
- execution status: **BLOCKED_SAFE**.

The next corrective action must preserve the exact-cohort contract and Development-only write target. It requires either an already-approved callable hosted execution surface or a separately reviewed Development-only adapter change. No local-only guard or internal-authentication boundary may be weakened merely to advance P4.
