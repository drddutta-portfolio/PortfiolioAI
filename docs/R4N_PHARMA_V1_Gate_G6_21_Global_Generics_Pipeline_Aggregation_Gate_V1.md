# R4N PHARMA_V1 — Gate G6.21 Global Generics Multi-Event Pipeline Aggregation Approval Gate V1

**Status:** PROPOSAL ONLY / NOT ACTIVE  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`  
**Canonical dimension:** `BUSINESS_DURABILITY`

## Purpose

G6.21 defines the approval boundary for combining multiple individually normalized material Global Generics pipeline events.

It deliberately does **not** choose a numeric aggregation method yet.

The repository contains approved weighted-mean precedents for Domestic Formulations peer-relative Valuation and final Domestic Valuation, but those precedents are not transferable to pipeline-event aggregation because G6.20 explicitly requires adverse events to remain visible and prohibits unrelated successes from silently cancelling adverse material events.

No approved event-aggregation precedent was found.

## Upstream contracts

G6.21 depends on:

- `PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE_V1_PROPOSAL` (G6.19)
- `PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION_V1_PROPOSAL` (G6.20)

Each included event must already satisfy the G6.19 identity/materiality/economic-relevance/source requirements and must normalize successfully under G6.20.

## Decisions still requiring explicit approval

The following methodology decisions remain unresolved:

1. aggregation method;
2. recency treatment;
3. adverse-event treatment;
4. event-offset policy;
5. whether economic relevance ever becomes numeric or remains eligibility-only.

## Candidate methods are not defaults

Methods that may be considered later include:

- median;
- weighted mean;
- adverse floor or cap;
- another explicitly versioned method.

Listing a candidate does **not** approve it.

## Safeguards locked by G6.21

Until a method is explicitly approved:

- event-count bonus: **NO**
- simple average: **NOT APPROVED**
- median: **NOT APPROVED**
- recency weighting: **NOT APPROVED**
- materiality weighting: **NOT APPROVED**
- economic-relevance numeric multiplier: **NOT APPROVED**
- unrelated positive event silently offsets adverse event: **NO**
- adverse-event visibility: **REQUIRED**
- combined pipeline score: **NO**

## Readiness behavior

The proposal-only readiness helper may classify an event set as:

- `INSUFFICIENT_EVIDENCE` when no events exist;
- `REVIEW_REQUIRED` when any event fails G6.20 eligibility/normalization;
- `AWAITING_METHODOLOGY_APPROVAL` when all events normalize successfully.

Even in the last state, the combined pipeline score remains `null`.

This is an audit/readiness state only, not score execution.

## Anti-double-counting

G6.21 does not add a regulatory-site numeric penalty.

G4 remains authoritative for critical/high-risk governance/regulatory gating. Pipeline-event aggregation must not duplicate that penalty path.

## Safety boundary

- numeric aggregation method approved: **NO**
- combined pipeline score ready: **NO**
- activation approved: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next approval gate

After visual and local validation of this G6.21 gate, an explicit methodology decision is required before any combined pipeline score contract can be implemented.

The approval should state, at minimum:

- the selected aggregation method;
- the treatment of unresolved adverse events;
- whether and how recency is used;
- whether different events can offset one another;
- whether economic relevance remains an eligibility gate or receives an explicitly justified numeric role.
