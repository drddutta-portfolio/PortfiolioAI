# R4N Gate G6.13 — Domestic Formulations Peer Cross-Metric Combination Approval Lock V1

**Status:** Proposal only / combination prerequisite / no combined peer score  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.13 addresses the remaining step between the validated per-metric peer-relative scores and a combined Domestic Formulations peer-relative Valuation component.

Canonical repository inspection found no approved PE-vs-EV/EBITDA weighting rule.

Therefore G6.13 deliberately **does not invent one**.

## Required normalized inputs

The peer component requires both:

- `PE_TTM` normalized peer-relative score;
- `EV_EBITDA` normalized peer-relative score.

Both must already satisfy:

- G6.9 cohort methodology;
- G6.10 deterministic cohort eligibility;
- G6.11 minimum comparability and median aggregation;
- G6.12 peer premium/discount normalization.

## Fail-closed rule

If either normalized metric-family score is missing or invalid:

`INSUFFICIENT_EVIDENCE`

No single-metric substitution is allowed.

A valid PE score may not replace missing EV/EBITDA, and vice versa.

## Combination method remains unapproved

The following are explicitly **not approved**:

- equal-weight arithmetic mean;
- weighted mean;
- best-of;
- worst-of;
- fallback to one metric;
- any hidden default weighting.

Current weights:

- PE weight: `null`
- EV/EBITDA weight: `null`

Therefore even when both input scores exist, the state is only:

`READY_FOR_WEIGHTING_DECISION`

and the combined score remains:

`null`

## Why this lock is necessary

The permanent R4N engineering rule prohibits inventing scoring weights.

A 50/50 average would itself be a methodology decision.

Because the canonical plan does not approve that decision, G6.13 makes the absence explicit and fail closed.

## Whole Valuation boundary

Validated Domestic Valuation ingredients now include:

- self-history relative curve;
- FCF-yield corroboration curve;
- peer cohort methodology;
- peer builder;
- minimum comparability;
- peer premium/discount normalization;
- cross-metric combination readiness.

Still unresolved:

- PE-vs-EV/EBITDA weighting;
- self-history vs peer-relative vs FCF component weights.

Therefore:

`whole Valuation dimension ready = false`

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerCombinationContract.ts`
- `src/features/research/pharmaDomesticPeerCombinationContract.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.13 · Peer cross-metric combination lock**
- **G6.13 · Explicit weighting blocker**

## Explicit boundary

- both PE and EV/EBITDA inputs required: **YES**
- single-metric fallback: **NO**
- equal weighting approved: **NO**
- weighted combination approved: **NO**
- combined peer score ready: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.13 cards and run focused validation.

After validation, the next methodology decision must explicitly approve a PE-vs-EV/EBITDA weighting rule before any combined peer-relative score can exist.
