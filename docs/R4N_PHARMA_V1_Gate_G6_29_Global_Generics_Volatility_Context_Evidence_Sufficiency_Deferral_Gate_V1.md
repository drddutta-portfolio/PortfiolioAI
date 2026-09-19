# R4N PHARMA_V1 — Gate G6.29 Global Generics Volatility Context Evidence Sufficiency / Deferral Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `VOLATILITY_1Y`  
**Canonical dimension:** `RISK`

## Purpose

G6.29 records that no G6.28 volatility-context methodology candidate is currently evidence-sufficient enough to justify a numeric Global Generics volatility curve.

This is a deliberate fail-closed deferral.

## Current blockers

- Same-subprofile peer-relative → reviewed Global Generics Primary peer cohort not established.
- Benchmark-relative → approved Pharma benchmark not established.
- Self-history with external context → sufficient comparable self-history plus external context not established.
- Hybrid → fewer than two independently eligible context methods.

Therefore:

`approvedMethod = null`

`numericVolatilityCurveReady = false`

## Why deferral is required

The parent Risk contract requires volatility context.

The canonical architecture prohibits:

- BANK/NBFC threshold inheritance;
- generic Pharma peers without reviewed Primary classification;
- silent benchmark selection;
- self-history-only volatility scoring;
- hidden hybrid weighting;
- neutral substitution for missing evidence.

Proceeding numerically now would violate those rules.

## Risk-dimension state

With G6.27 and G6.29:

- drawdown normalization remains explicitly deferred;
- volatility normalization remains explicitly deferred;
- regulatory context remains non-numeric under G6.24;
- component weighting remains unapproved.

Therefore:

`wholeRiskDimensionReady = false`

## Safety boundary

- approved volatility method: **NO**
- numeric volatility curve: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, close the Global Generics Risk methodology slice as fail-closed/incomplete and move to the next unresolved Global Generics curve family rather than forcing market-risk scores.
