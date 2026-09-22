# R4N Gate G6.9 — Domestic Formulations Peer-Relative Valuation Cohort Methodology Lock V1

**Status:** Proposal only / peer methodology prerequisite / no numeric peer bands  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.9 addresses the final missing Domestic Formulations Valuation lane:

`PEER_RELATIVE_VALUATION`

Repository inspection found no existing versioned peer-cohort builder or approved peer-relative normalization methodology.

Therefore G6.9 does **not** invent a peer score.

It locks the cohort/comparability requirements that must be satisfied before any numeric peer-relative curve can be proposed.

## Canonical scope

Primary:

`DOMESTIC_FORMULATIONS`

Dimension:

`VALUATION`

Component:

`PEER_RELATIVE_VALUATION`

## Peer cohort boundary

A valid peer cohort must be based on reviewed canonical business-model identity.

Required:

- reviewed Primary subprofile;
- same Primary subprofile: `DOMESTIC_FORMULATIONS`;
- effective-dated active assignment;
- active security.

Not sufficient:

- sector match alone;
- industry match alone;
- Material Overlay match alone;
- provider peer labels.

Emerging Watch may not define peer eligibility.

## Why same Primary is mandatory

The canonical PHARMA_V1 plan explicitly prohibits one generic Pharma methodology.

Domestic Formulations, Global Generics, API/Bulk Drugs, CDMO/CRAMS and Biopharma/Biosimilars have structurally different economics.

Therefore a peer-relative valuation cohort cannot be built merely from the broad Pharma sector.

## Comparability boundary

Peer observations must be like-for-like.

Required:

- identical metric semantics;
- comparable period basis;
- current authoritative market-price semantics;
- non-stale valuation evidence;
- explicit treatment/exclusion of negative or economically meaningless denominators;
- acquisition and one-off earnings normalization where material.

## Candidate evidence families

Potential peer-relative evidence families already recognized by G5.4:

- `PE_TTM`
- `EV_EBITDA`

G6.9 does not yet approve which combination is canonical.

## Explicitly unapproved

The following remain open:

- final peer metric set;
- minimum eligible peer count;
- cohort aggregation statistic (median/percentile/etc.);
- outlier treatment;
- relative premium/discount score bands;
- PE versus EV/EBITDA weighting;
- overall Valuation component weights.

Because these are unresolved:

`numericPeerCurveReady = false`

## Relationship to existing Domestic Valuation work

Already validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration

Still missing:

- peer-relative valuation methodology

Therefore:

`whole Valuation dimension ready = NO`

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerValuationContract.ts`
- `src/features/research/pharmaDomesticPeerValuationContract.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G6.9 · Domestic peer-cohort methodology lock**
- **G6.9 · Peer-relative numeric blocker**

## Explicit boundary

- peer cohort eligibility rules proposed: **YES**
- same reviewed Primary required: **YES**
- generic Pharma-sector peers allowed: **NO**
- provider peer labels authoritative: **NO**
- numeric peer-relative bands: **NO**
- cohort builder implemented: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.9 cards, and run focused validation.

Only after G6.9 validation should PortfolioAI define the peer cohort implementation and minimum-comparability contract or move to another G6 family.
