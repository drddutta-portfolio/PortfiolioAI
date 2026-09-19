# R4N Gate G6.20 — Global Generics Pipeline Stage Normalization V1

**Status:** Proposal only / per-event stage normalization / no combined pipeline score  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.20 builds directly on the validated G6.19 evidence-identity contract.

G6.19 established that Global Generics pipeline evidence must be linked to:

- product/molecule;
- geography;
- dated stage;
- materiality;
- economic relevance;
- source/reference.

G6.20 now proposes a **per-event stage normalization**.

It does not yet aggregate multiple pipeline events into one Business Durability score.

## Proposed stage normalization

| Stage | Score |
|---|---:|
| FILED_OR_SUBMITTED | 40 |
| TENTATIVE_APPROVAL | 55 |
| FINAL_APPROVAL | 70 |
| LAUNCHED | 85 |
| COMMERCIAL_TRACTION_CONFIRMED | 100 |
| DELAYED_OR_BLOCKED | 20 |
| WITHDRAWN_OR_DISCONTINUED | 0 |

## Interpretation

### Filed / submitted — 40

Pipeline optionality exists, but approval and commercial realization remain unproven.

### Tentative approval — 55

Regulatory progress is meaningful, but final approval and commercialization remain unresolved.

### Final approval — 70

Approval is established, but launch execution and market traction remain unproven.

### Launched — 85

Commercial launch is established, but durable traction is not yet confirmed.

### Commercial traction confirmed — 100

The material launch has progressed to evidenced commercial traction.

### Delayed / blocked — 20

Material pipeline value is impaired or deferred by an unresolved blocking condition.

### Withdrawn / discontinued — 0

The reviewed material pipeline opportunity is no longer progressing.

## Materiality treatment

Materiality and economic relevance are **eligibility gates**.

An event receives no normalized stage score unless both are established.

G6.20 does not invent:

- numeric materiality multipliers;
- inferred exposure percentages;
- provider-derived materiality weights.

Therefore:

`numericMaterialityMultiplierApproved = false`

## No event-count bonus

More filings, approvals or launches do not mechanically produce a higher metric score.

G6.20 prohibits:

- approval-count bonus;
- launch-count bonus;
- pipeline-count bonus.

## Multi-event aggregation remains unapproved

G6.20 does not approve:

- simple average;
- median;
- recency-weighted mean;
- stage-count weighting;
- materiality-weighted aggregation.

Therefore:

`combinedPipelineScoreReady = false`

A later contract must decide how multiple material events combine.

## Adverse evidence anti-offset rule

A delayed, blocked, withdrawn or discontinued material event cannot be silently cancelled by an unrelated positive event.

That would hide contradictory evidence.

Any later aggregation methodology must preserve adverse-event visibility.

## Regulatory anti-double-counting

G6.20 does not add a site-compliance penalty.

Regulatory-site severity remains governed separately by G4 and any later Global Generics regulatory-risk methodology.

## Explicit boundary

- per-event numeric stage normalization: **YES / PROPOSAL**
- materiality gate required: **YES**
- materiality multiplier: **NO**
- event-count bonus: **NO**
- multi-event pipeline score: **NO**
- activation: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.20 cards, and run focused validation.

Only after validation should a separate aggregation contract decide how multiple material pipeline events combine into one Global Generics Business Durability input.
