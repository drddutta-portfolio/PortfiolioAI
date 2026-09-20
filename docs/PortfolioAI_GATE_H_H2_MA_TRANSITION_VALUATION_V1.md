# PortfolioAI — Gate H H2 M&A Transition Valuation V1

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Target:** TORNTPHARM / Domestic Formulations / Valuation  
**Status:** OWNER-APPROVED H2 TRANSITION CONTRACT / NOT GLOBALLY ACTIVE / NO H3 SCORE EXECUTION

## Owner approval

Approved exactly as:

`APPROVE H2 M&A TRANSITION VALUATION V1 — SELF-HISTORY 50% / PEER-RELATIVE 50% / FCF 0% UNTIL COMPARABLE POST-MERGER ANNUAL FCF EXISTS`

## Why a transition contract is required

The base Domestic Formulations Valuation contract remains:

- self-history relative valuation = 40%
- peer-relative valuation = 40%
- FCF-yield corroboration = 20%

That base contract explicitly identifies structural FCF distortion from M&A/capex cycles as a methodology revisit trigger.

For the current TORNTPHARM H2 snapshot, the available completed annual FCF belongs to a materially different pre/post-transaction operating scope from the present valuation denominator. Using that FCF against a current post-transaction market-cap denominator would mix non-comparable economic scopes.

Therefore H2 must not:

- reuse stale/pre-transition FCF as though it were comparable;
- insert a neutral FCF score;
- derive a current FCF yield from mismatched numerator/denominator scopes;
- silently renormalize the base 40/40/20 weights.

## Versioned transition rule

While the M&A scope mismatch remains true and no comparable post-merger annual FCF exists:

- self-history relative valuation = 50%
- peer-relative valuation = 50%
- FCF-yield corroboration = 0%

Formula:

`Transition Valuation Score = (Self-History × 0.50) + (Peer-Relative × 0.50)`

This is an explicit owner-approved methodology version, not missing-component renormalization.

## H2 deterministic inputs

### Self-history

Fresh local evidence:

- `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT = -15.90%`

Approved Domestic self-history curve:

- -20% to < -5% -> score 40

Therefore:

`Self-History Score = 40`

### Peer-relative valuation

Fresh local peer cohort:

| Security | PE_TTM | EV_EBITDA |
|---|---:|---:|
| MANKIND | 46.51 | 22.33 |
| ERIS | 28.21 | 17.92 |
| EMCURE | 35.82 | 16.70 |

Target:

| Security | PE_TTM | EV_EBITDA |
|---|---:|---:|
| TORNTPHARM | 85.02 | 37.11 |

Peer medians:

- PE median = 35.82
- EV/EBITDA median = 17.92

Approved relative formula:

`(Peer Median / Target - 1) × 100`

Results:

- PE relative premium/discount = approximately -57.87% -> normalized score 20
- EV/EBITDA relative premium/discount = approximately -51.71% -> normalized score 20

Approved G6.15 peer combination:

`(20 × 0.50) + (20 × 0.50) = 20`

Therefore:

`Peer-Relative Score = 20`

## H2 transition Valuation result

`(40 × 0.50) + (20 × 0.50) = 30`

> **TORNTPHARM Valuation = 30 under H2 M&A Transition Valuation V1**

This is a deterministic H2 dimension result only.

It is **not**:

- an H3 final company score;
- a recommendation;
- a target price;
- a position-sizing decision;
- a persisted official score run.

## Scope and anti-leakage rules

This transition contract is restricted to:

- security: `TORNTPHARM`
- primary model: `DOMESTIC_FORMULATIONS`
- current H2 M&A scope-mismatch condition

It must not automatically apply to:

- AUROPHARMA;
- any other Pharma security;
- another TORNTPHARM period after comparable post-merger annual FCF becomes available.

## Exit rule

As soon as a comparable post-merger completed annual FCF exists:

1. this transition contract expires;
2. the FCF-yield corroboration lane must be recomputed using the approved current-market-cap authority contract;
3. Valuation reverts to the base owner-approved 40/40/20 contract.

No permanent extension is automatic.

## Safety boundary

- base G6.17 40/40/20 contract overwritten: **NO**
- hidden reweighting: **NO**
- missing-component renormalization: **NO**
- neutral FCF substitution: **NO**
- stale pre-merger FCF reuse: **NO**
- extra provider call required for suspended FCF lane: **NO**
- production DB mutation: **NO**
- H3 final company scoring: **NO**
- score persistence: **NO**
- recommendation: **NO**
- PR merge: **NO**

## Repository contract

Implementation:

- `src/features/research/pharmaDomesticValuationMaTransitionContract.ts`
- `src/features/research/pharmaDomesticValuationMaTransitionContract.test.ts`

Contract version:

`PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED`
