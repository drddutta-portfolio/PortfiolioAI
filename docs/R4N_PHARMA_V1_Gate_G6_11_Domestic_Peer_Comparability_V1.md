# R4N Gate G6.11 — Domestic Formulations Peer Minimum-Comparability & Aggregation Contract V1

**Status:** Proposal only / peer-comparability contract / no numeric peer score  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.11 defines the minimum peer-comparability and aggregation rules required after the G6.10 deterministic peer builder.

It does not yet define valuation premium/discount score bands.

## Minimum peer count

Proposed minimum:

`3 eligible peers`

Preferred:

`5 eligible peers`

Reasoning:

- fewer than three peers makes a cohort statistic too fragile;
- three is sufficient for a deterministic median;
- five is preferred because the median becomes less sensitive to one unusual peer;
- the minimum is deliberately modest because same-Primary reviewed Pharma cohorts may initially be small.

If fewer than three eligible peers have comparable evidence for a metric family:

`INSUFFICIENT_EVIDENCE`

Missing peers must not be substituted with broad-sector companies.

## Aggregation statistic

Proposed:

`MEDIAN`

No V1 winsorization is used.

Reasoning:

- median is deterministic;
- robust to one unusually high/low multiple;
- avoids introducing an additional arbitrary winsorization percentile;
- easier to explain and audit.

## Candidate metric families

G6.11 retains the G6.9 candidate peer evidence families:

- `PE_TTM`
- `EV_EBITDA`

Each family is aggregated independently.

PE values are compared with PE peers; EV/EBITDA values with EV/EBITDA peers.

No cross-metric averaging occurs at the cohort-statistic stage.

## Like-for-like comparability

Required per metric family:

- same metric code;
- same period basis;
- same consolidation scope;
- fresh evidence;
- selected/reviewed evidence;
- current authoritative market-price semantics where relevant;
- negative or economically meaningless denominators excluded;
- acquisition/one-off distortions require review before inclusion.

## Full peer-component readiness

A single metric family meeting the minimum is **not** enough to declare the full peer-relative component ready.

V1 requires both:

- PE_TTM peer cohort meeting minimum comparability;
- EV_EBITDA peer cohort meeting minimum comparability.

This avoids allowing one multiple to silently substitute for the intended multi-metric peer methodology.

## Still unapproved

G6.11 does not approve:

- PE vs EV/EBITDA component weighting;
- premium/discount calculation convention;
- premium/discount score bands;
- overall Valuation component weights;
- peer-relative numeric score.

Therefore:

`peerRelativeScoreReady = false`

and:

`wholeValuationDimensionReady = false`

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerComparabilityContract.ts`
- `src/features/research/pharmaDomesticPeerComparabilityContract.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.11 · Peer minimum-comparability contract**
- **G6.11 · Median aggregation boundary**

## Explicit boundary

- minimum eligible peer count proposed: **3**
- preferred eligible peer count: **5**
- aggregation statistic: **MEDIAN**
- winsorization: **NO**
- both PE and EV/EBITDA required for full peer component: **YES**
- numeric peer-relative bands: **NO**
- metric weighting: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**

## Next checkpoint

Owner should pull, inspect the G6.11 cards and run focused validation.

Only after validation should G6 define the peer premium/discount calculation and numeric normalization curve.
