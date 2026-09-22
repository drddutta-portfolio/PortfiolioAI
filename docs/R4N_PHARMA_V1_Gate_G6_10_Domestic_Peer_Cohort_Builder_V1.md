# R4N Gate G6.10 — Domestic Formulations Peer-Cohort Builder & Minimum-Comparability Boundary V1

**Status:** Proposal only / deterministic cohort builder / no minimum peer count / no peer score  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.10 implements the deterministic **eligibility builder** required by G6.9 for Domestic Formulations peer-relative Valuation.

It does **not** approve a minimum peer count, aggregation statistic or numeric peer-relative curve.

## Eligibility algorithm

A candidate security is eligible only when:

1. it is not the target security;
2. the security is active;
3. its PHARMA_V1 assignment resolves successfully on the evaluation date;
4. the resolved assignment is `REVIEWED`;
5. the resolved Primary is exactly `DOMESTIC_FORMULATIONS`.

The builder reuses the existing fail-closed assignment resolver.

Therefore provisional, disputed, missing, retired/inactive or conflicting assignment states do not enter the cohort.

## Explicit exclusions

The builder records deterministic exclusion reasons:

- `TARGET_SECURITY`
- `INACTIVE_SECURITY`
- `SUBPROFILE_UNRESOLVED`
- `PRIMARY_MISMATCH`

No provider peer list, broad Pharma-sector membership, Material Overlay or Emerging Watch is used to override these rules.

## Minimum-comparability boundary

G6.10 deliberately does **not** invent a numeric minimum peer count.

Current state:

`minimumPeerCountState = UNAPPROVED`

Therefore:

`cohortScoreReady = false`

even when eligible peers are found.

This keeps the peer-relative Valuation lane fail closed until a later approved contract defines:

- minimum eligible peer count;
- minimum comparable valuation evidence per peer;
- cohort aggregation statistic;
- outlier treatment;
- premium/discount normalization bands.

## No valuation score

G6.10 only builds the peer universe.

It does not:

- select PE vs EV/EBITDA weights;
- compute peer medians;
- compute percentiles;
- calculate valuation premium/discount;
- emit a peer-relative score;
- activate the Valuation dimension.

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerCohortBuilder.ts`
- `src/features/research/pharmaDomesticPeerCohortBuilder.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.10 · Domestic peer-cohort builder**
- **G6.10 · Minimum-comparability boundary**

## Explicit boundary

- deterministic cohort eligibility builder: **YES**
- same reviewed Primary enforced: **YES**
- unresolved assignments excluded: **YES**
- minimum peer count approved: **NO**
- peer aggregation approved: **NO**
- numeric peer-relative curve: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.10 cards, and run focused validation.

Only after G6.10 validation should the project define the **minimum peer-count and aggregation-statistic contract**, if the owner approves those methodology choices.
