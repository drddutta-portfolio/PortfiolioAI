# R4N Gate G6.19 — Global Generics Pipeline / Launch / Approval Evidence Contract V1

**Status:** Proposal only / evidence normalization prerequisite / no numeric score  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.19 addresses the mandatory Global Generics Business Durability metric:

`PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`

The parent PHARMA_V1 contract already defines this metric as event-based and informational, with an evidence-weighted pipeline/approval normalization method.

Global Generics elevates it to **MANDATORY**.

G6.19 therefore structures the evidence before any numeric scoring is attempted.

## Why no numeric curve yet

A simple approval count is not a reliable durability score.

One tentative approval, one final approval, one launch and one commercially successful launch are economically different states.

Likewise:

- a filing is not an approval;
- a tentative approval is not a commercial launch;
- a launch without traction is not the same as a proven commercial franchise;
- a delayed/blocked/withdrawn product remains relevant evidence.

Therefore G6.19 prohibits count-only scoring.

## Required evidence identity

Each material event must identify:

- product or molecule;
- geography;
- dated stage;
- materiality;
- economic relevance;
- source/reference.

Permitted source classes:

- official regulator;
- issuer;
- reviewed research.

## Canonical event stages

- `FILED_OR_SUBMITTED`
- `TENTATIVE_APPROVAL`
- `FINAL_APPROVAL`
- `LAUNCHED`
- `COMMERCIAL_TRACTION_CONFIRMED`
- `DELAYED_OR_BLOCKED`
- `WITHDRAWN_OR_DISCONTINUED`

These states are not interchangeable.

## History requirement

Minimum material events:

`1`

Preferred:

`4`

Latest material events are required.

This preserves the parent contract while allowing an early Global Generics evidence set to remain fail closed when materiality/economic relevance is not established.

## Adverse evidence retention

Delayed, blocked, withdrawn and discontinued events are retained.

They must not disappear merely because a later approval or launch occurs elsewhere in the pipeline.

## Numeric boundary

Current state:

`numericNormalizationState = UNAPPROVED`

Explicitly prohibited:

- number of approvals = automatic positive score;
- number of launches = automatic positive score;
- tentative approval treated as commercial launch;
- missing materiality treated as neutral.

## Regulatory anti-double-counting boundary

G6.19 does not numerically penalize regulatory-site events.

Regulatory-site severity remains governed by the separate G4 governance/regulatory gate and the later Global Generics regulatory-risk methodology.

This avoids hidden double-counting.

## Repository artifacts

Added:

- `src/features/research/pharmaGlobalGenericsPipelineEvidenceContract.ts`
- `src/features/research/pharmaGlobalGenericsPipelineEvidenceContract.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.19 · Global Generics pipeline evidence contract**
- **G6.19 · Count-only scoring blocker**

## Explicit boundary

- mandatory pipeline evidence structured: **YES**
- product/geography/stage identity required: **YES**
- materiality/economic relevance required: **YES**
- count-only scoring allowed: **NO**
- numeric pipeline curve approved: **NO**
- activation: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.19 cards and run focused validation.

Only after validation should a separate Global Generics pipeline normalization methodology decide whether and how stage, commercial traction, materiality and adverse events become numeric.
