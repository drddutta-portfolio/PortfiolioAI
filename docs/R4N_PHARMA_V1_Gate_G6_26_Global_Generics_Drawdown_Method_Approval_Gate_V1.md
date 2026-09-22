# R4N PHARMA_V1 — Gate G6.26 Global Generics Drawdown Method Approval Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `MAX_DRAWDOWN_1Y`  
**Canonical dimension:** `RISK`

## Purpose

G6.26 defines the admissible methodology choices for normalizing Global Generics trailing 1-year maximum drawdown without inventing Pharma thresholds.

Upstream metric identity is already locked by G6.25:

`TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE`

## Candidate methods

G6.26 records five possible approaches:

1. `ABSOLUTE_BANDS`
2. `SAME_SUBPROFILE_PEER_RELATIVE`
3. `BENCHMARK_RELATIVE`
4. `SELF_HISTORY_RELATIVE`
5. `HYBRID_EXPLICITLY_VERSIONED`

Listing a method does not approve it.

## Eligibility requirements

### Absolute bands

Require empirical Pharma evidence supporting the cutoffs.

No BANK_NBFC threshold may be reused.

### Same-subprofile peer-relative

Requires a reviewed Global Generics Primary peer cohort.

A generic Pharma-sector percentile without reviewed same-primary classification is not sufficient.

### Benchmark-relative

Requires an explicitly approved Pharma benchmark.

No benchmark may be selected silently.

### Self-history-relative

Requires sufficient comparable drawdown history under stable calculation semantics.

### Hybrid

Requires at least two independently eligible methods plus explicit versioned weights.

No hidden hybrid weighting is allowed.

## Prohibited defaults

- BANK_NBFC bands inherited: **NO**
- zero/neutral substitution for missing evidence: **NO**
- generic Pharma percentile without reviewed cohort: **NO**
- silent benchmark selection: **NO**
- hidden hybrid weighting: **NO**

## Readiness helper

The proposal-only helper returns only the evidence-backed candidate methods that are structurally eligible under the supplied prerequisites.

It never approves a method.

Always:

- `approvedMethod = null`
- `ownerApprovalRequired = true`
- `numericDrawdownCurveReady = false`

## Safety boundary

- drawdown method approved: **NO**
- numeric drawdown curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect which candidate methods are actually evidence-backed for the current Global Generics reference universe. Then obtain explicit owner methodology approval before implementing any numeric G6.27 drawdown normalization contract.
