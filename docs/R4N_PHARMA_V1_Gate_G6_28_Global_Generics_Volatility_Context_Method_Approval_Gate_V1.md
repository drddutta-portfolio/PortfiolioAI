# R4N PHARMA_V1 — Gate G6.28 Global Generics Volatility Context Method Approval Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `VOLATILITY_1Y`  
**Canonical dimension:** `RISK`

## Purpose

G6.28 defines the admissible context-aware methodology choices for Global Generics 1-year volatility.

The parent Risk contract explicitly requires peer or benchmark context, so standalone absolute-volatility scoring is not admissible.

## Candidate methods

1. `SAME_SUBPROFILE_PEER_RELATIVE`
2. `BENCHMARK_RELATIVE`
3. `SELF_HISTORY_WITH_EXTERNAL_CONTEXT`
4. `HYBRID_EXPLICITLY_VERSIONED`

No candidate is approved by default.

## Method prerequisites

### Same-subprofile peer-relative
Requires a reviewed Global Generics Primary cohort.

### Benchmark-relative
Requires an explicitly approved Pharma benchmark.

### Self-history with external context
Requires sufficient comparable self-history plus an external context source so the company is not judged only against itself.

### Hybrid
Requires at least two independently eligible context methods plus explicit versioned weights.

## Prohibited defaults

- BANK/NBFC thresholds inherited: **NO**
- standalone absolute volatility bands: **NO**
- generic Pharma peer set without reviewed Primary: **NO**
- silent benchmark selection: **NO**
- hidden hybrid weighting: **NO**
- missing evidence treated as neutral: **NO**

## Readiness helper

The helper returns only structurally eligible methods based on available prerequisites.

Always:

- `approvedMethod = null`
- `ownerApprovalRequired = true`
- `numericVolatilityCurveReady = false`

## Safety boundary

- volatility method approved: **NO**
- numeric volatility curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect the repository for a reviewed Global Generics cohort, approved Pharma benchmark, and comparable self-history. If none exists, defer numeric volatility scoring rather than inventing context.
