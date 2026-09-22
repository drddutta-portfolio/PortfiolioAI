# R4N PHARMA_V1 — Gate G6.23 Global Generics Combined Pipeline Score Contract V1

**Status:** OWNER APPROVED / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`  
**Canonical dimension:** `BUSINESS_DURABILITY`

## Purpose

G6.23 implements the owner-approved G6.22 methodology as a deterministic combined pipeline score contract.

This makes the methodology calculation-ready in code, but does **not** activate application scoring or persistence.

## Approved aggregation method

`LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE`

### Pipeline identity

One distinct pipeline identity is:

- product or molecule;
- geography.

The same molecule in different geographies is treated as a distinct identity.

### Lifecycle handling

For each identity:

- all historical events remain auditable;
- only the latest reviewed material state enters cross-identity aggregation;
- older stages are not repeatedly counted after a later state exists.

This avoids mechanically rewarding one opportunity for passing through several lifecycle stages.

### Same-date contradiction

If one identity has different latest stages on the same latest date:

`REVIEW_REQUIRED`

No combined score is produced.

### Adverse latest-state rule

Adverse latest stages:

- `DELAYED_OR_BLOCKED`
- `WITHDRAWN_OR_DISCONTINUED`

If any distinct identity has one of these latest states:

`REVIEW_REQUIRED`

The combined score remains `null`.

This preserves the G6.20/G6.21 rule that unrelated positive events cannot silently offset an adverse material event.

### Non-adverse aggregation

When all distinct latest states are non-adverse:

1. normalize each latest state using G6.20;
2. compute the median of the resulting normalized scores.

For an even number of identities, the median is the arithmetic midpoint of the two central ordered scores.

No event-count bonus is applied.

## Recency treatment

No age-based numeric recency weighting is used.

Recency affects the calculation only by selecting the latest reviewed state within each pipeline identity.

Historical states remain available for audit.

## Materiality and economic relevance

Both remain eligibility requirements only.

Not used:

- materiality multiplier;
- inferred exposure weight;
- economic-relevance multiplier;
- provider-derived numeric weighting.

## Fail-closed behavior

The combiner returns:

- `INSUFFICIENT_EVIDENCE` when no events exist;
- `REVIEW_REQUIRED` if any event cannot normalize under G6.20;
- `REVIEW_REQUIRED` for same-date contradictory latest stages;
- `REVIEW_REQUIRED` when any latest identity state is adverse;
- `READY` only when every latest identity state is eligible, normalized and non-adverse.

Only the `READY` state carries a numeric combined score.

## Audit output

The result retains, for every distinct pipeline identity:

- product/molecule;
- geography;
- latest event date;
- latest stage;
- normalized score;
- count of historical events for that identity.

This provides visibility into lifecycle de-duplication rather than returning an opaque scalar.

## Anti-double-counting

G6.23 does not introduce a regulatory-site penalty.

G4 remains authoritative for governance/regulatory gating.

The pipeline score represents pipeline progression only and cannot silently duplicate a G4 regulatory penalty.

## Activation boundary

The contract is calculation-ready but not active.

- combined-score function present: **YES**
- combined pipeline methodology ready: **YES**
- application scoring activation: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Validation required

Before G6.23 can be marked VALIDATED / NOT ACTIVE:

- focused Vitest;
- focused ESLint;
- `npm run typecheck`;
- `npm run build`;
- visual review of the G6.23 glass-box cards.
