# R4N PHARMA_V1 — Gate G6.27 Global Generics Drawdown Evidence Sufficiency / Deferral Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `MAX_DRAWDOWN_1Y`  
**Canonical dimension:** `RISK`

## Purpose

G6.27 records that no G6.26 drawdown methodology candidate is currently evidence-sufficient enough to justify a numeric Global Generics drawdown curve.

This is a deliberate fail-closed deferral, not a methodology failure.

## Current blockers

- Absolute bands → empirical Pharma cutoffs not established.
- Same-subprofile peer-relative → reviewed Global Generics peer cohort not established.
- Benchmark-relative → approved Pharma benchmark not established.
- Self-history-relative → sufficient comparable self-history not established.
- Hybrid → fewer than two independently eligible methods.

Therefore:

`approvedMethod = null`

`numericDrawdownCurveReady = false`

## Why deferral is required

The canonical plan prohibits:

- BANK/NBFC threshold inheritance;
- generic Pharma peer substitution;
- silent benchmark selection;
- invented cutoffs;
- hidden weighting.

Proceeding numerically now would violate those rules.

## Safety boundary

- approved drawdown method: **NO**
- numeric drawdown curve: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

Do not force drawdown scoring. Move to the other unresolved market-risk lane — volatility normalization / peer or benchmark context — and apply the same evidence-sufficiency discipline.
