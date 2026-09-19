# R4N PHARMA_V1 — Gate G6.22 Global Generics Pipeline Aggregation Method Proposal V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL PENDING  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`  
**Canonical dimension:** `BUSINESS_DURABILITY`

## Purpose

G6.22 proposes a concrete aggregation methodology for multiple Global Generics pipeline events without activating any score execution.

The proposal addresses the five unresolved G6.21 decisions:

1. aggregation method;
2. recency treatment;
3. adverse-event treatment;
4. event-offset policy;
5. economic-relevance numeric role.

No executable combined-score function is introduced until the owner explicitly approves this methodology.

## Proposed method

`LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE`

### Step 1 — define one pipeline identity

Identity:

- product or molecule;
- geography.

The same molecule in different geographies is a distinct pipeline identity because regulatory and commercial status can differ materially by geography.

### Step 2 — collapse lifecycle history to the latest reviewed state

For each product/molecule + geography identity:

- retain all historical events for audit;
- select only the latest reviewed material state for aggregation;
- do not count older filing / approval / launch stages again after a later reviewed state exists.

This prevents one opportunity from being mechanically rewarded multiple times as it progresses through its lifecycle.

If the same identity has contradictory latest stages on the same date, the state is `REVIEW_REQUIRED`.

### Step 3 — adverse-state rule

Adverse latest states:

- `DELAYED_OR_BLOCKED`;
- `WITHDRAWN_OR_DISCONTINUED`.

If any distinct pipeline identity has one of these as its latest reviewed material state:

`REVIEW_REQUIRED`

No numeric combined pipeline score is produced.

This is intentionally stricter than an adverse cap/floor because no evidence-backed numeric cap has yet been established, and G6.20 prohibits unrelated successes from silently cancelling an adverse material event.

### Step 4 — non-adverse aggregation

Only when every distinct latest state is non-adverse:

- normalize each latest state under G6.20;
- take the **MEDIAN** across the distinct pipeline identities.

Minimum distinct identities:

- 1

Preferred:

- 4

The minimum/preferred counts inherit the G6.19 evidence-history contract.

### Why median

Median is proposed because it:

- avoids a mechanical event-count bonus;
- reduces distortion from one unusually advanced positive pipeline event;
- does not require unapproved magnitude/materiality weights;
- is deterministic and auditable.

Median is not intended to hide adverse events because any latest adverse state blocks numeric aggregation before the median is calculated.

## Recency policy

No age-based numeric recency weighting is proposed.

Recency acts only through:

- latest-state selection for each pipeline identity.

Older lifecycle states remain visible for audit but do not enter the cross-identity aggregation once superseded by a later reviewed state.

## Materiality and economic relevance

Both remain eligibility gates only.

Not proposed:

- materiality multiplier;
- inferred exposure weight;
- economic-relevance multiplier;
- provider-derived numeric scaling.

## Event offset policy

Positive pipeline identities cannot numerically offset a distinct latest adverse identity.

Any latest adverse identity produces `REVIEW_REQUIRED`.

## Anti-double-counting

G6.22 does not create a regulatory-site penalty.

G4 remains authoritative for governance/regulatory gating.

A pipeline event that is adverse for product-development/commercial progression must not also become a hidden duplicate regulatory-site penalty unless a separately versioned methodology explicitly justifies that treatment.

## Explicitly not implemented

- executable combined-score function: **NO**
- score execution: **NO**
- persisted score: **NO**
- scoring-rule migration: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Owner approval required

Before an executable G6.23 combined pipeline score contract is created, the owner must explicitly approve or modify:

- latest state per product/molecule + geography as the aggregation identity;
- adverse latest state → `REVIEW_REQUIRED`;
- median across non-adverse latest states;
- no age-based recency weighting;
- materiality and economic relevance remain eligibility-only.

Until then:

`combinedPipelineScoreReady = false`
