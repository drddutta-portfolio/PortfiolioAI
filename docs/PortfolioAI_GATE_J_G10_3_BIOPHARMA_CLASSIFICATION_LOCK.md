# PortfolioAI — Gate J / G10.3 BIOPHARMA_BIOSIMILARS Classification Lock

**Date:** 21 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Stage:** G10.3 — Checkpoint A  
**Status:** IMPLEMENTED / LOCALHOST VISUAL + FULL VALIDATION PENDING  
**Score execution:** OFF  
**Recommendation execution:** OFF  
**Persistence:** OFF

## Reference-company selection

The provisional `BIOPHARMA_BIOSIMILARS` register contains one candidate:

- BIOCON

**Selected reference candidate: BIOCON — Biocon Limited.**

Biocon is therefore not a newly invented reference. It is the existing sole provisional candidate in the canonical PHARMA_V1 candidate registry.

## Two-period classification evidence

The issuer reports business-revenue contribution across Biosimilars, Generics and Research Services / CRDMO on a directly comparable group basis.

| Period | Biosimilars | Generics | Research Services / CRDMO |
|---|---:|---:|---:|
| FY25 | 58% | 19% | 23% |
| FY26 | 60% | 18% | 22% |

Sources:

- Biocon Integrated Annual Report 2024-25
- Biocon Investor Presentation June 2026 / FY26 financial highlights
- Biocon official annual-report and full-year-results pages

The unchanged G1 adaptive-classification contract resolves:

```text
Classification state = READY_FOR_REVIEW
Primary candidate = BIOPHARMA_BIOSIMILARS
Material Overlay = GLOBAL_GENERICS
Material Overlay = CDMO_CRAMS
Emerging Watch = none
```

This result is important: the G10.3 reference is a genuine multi-exposure test. Biosimilars is dominant, but both Generics and CRDMO remain above the existing 15% sustained Material Overlay threshold in both reviewed annual periods.

## Distortion / structural-change review

1. **Two-period denominator — PASS.** FY25 and FY26 both use the issuer's group business-revenue contribution structure across the same three major business families.
2. **Biosimilars dominance — PASS.** Biosimilars remains the largest business in both reviewed periods at 58% and 60%.
3. **FY25 one-offs — PASS WITH CONTEXT.** FY25 contained disclosed one-off items, including generic lenalidomide sales and Biocon Biologics divestment-related income. Classification therefore uses the issuer's business-revenue contribution mix rather than total income or exceptional gains.
4. **Secondary businesses — PASS.** Generics and CRDMO are retained explicitly as Material Overlays rather than hidden inside a blended Biosimilars narrative.

## Classification-lock rule

Checkpoint A must be owner-approved before Checkpoint B starts.

After lock, classification cannot be changed because a later score or recommendation is inconvenient.

It may reopen only for new material business evidence through a separately documented, versioned reclassification decision.

## Critical G10.3 isolation rule

Completing a Biopharma/Biosimilars methodology for BIOCON must **not** silently resolve AUROPHARMA's currently unresolved Biosimilars exposure.

```text
methodology exists
!=
company exposure automatically resolved
```

AUROPHARMA remains governed by its own reviewed classification authority.

## UI proof

The existing reusable `PharmaGateJReferenceClassificationPanel` now supports BIOCON through the common Gate J reference registry.

No BIOCON-specific page tree was added.

The Checkpoint A panel shows:

- reference company;
- Primary candidate;
- both Material Overlays;
- no Emerging Watch;
- FY25/FY26 business mix;
- selection rationale;
- distortion checks;
- explicit no-score/no-persistence boundary.

No G10.3 Checkpoint B UI is rendered yet.

## Local Supabase proof boundary

Run only against local Supabase:

`bash scripts/r4n/run-biocon-g10-3-local-research-target.sh`

The fixture may create/reconcile the local BIOCON identity and add a synthetic ownership link only if BIOCON is absent from local Research Coverage.

It writes:

- 0 research-evidence rows;
- 0 subprofile-assignment rows;
- 0 score rows;
- 0 recommendation rows.

It refuses a non-local database URL.

## Owner visual checkpoint

After `git pull`, run the local BIOCON Research-target fixture and open BIOCON in localhost Research → Overview.

Approve only if the panel correctly shows:

```text
Gate J · G10.3 · Checkpoint A
BIOCON
Primary candidate = Biopharma / Biosimilars
Material Overlay = Global Generics + CDMO / CRAMS
Emerging Watch = None
FY25 = Biosimilars 58% / Generics 19% / CRDMO 23%
FY26 = Biosimilars 60% / Generics 18% / CRDMO 22%
Ready for owner lock
Score not started
```

Do not begin Checkpoint B until this classification lock is explicitly approved.

## Full local validation

After the visual review run:

`bash scripts/g10-3-validate-biopharma-classification-lock.sh`

The validator covers focused G10.3 tests, prior Gate J controls, Gate I safety regression, full non-Edge application tests, strict TypeScript, architecture checks, lint, production build and diff whitespace.

## Safety boundary

G10.3 Checkpoint A does not authorize:

- Biosimilars scoring methodology execution;
- provider calls;
- score persistence;
- recommendation persistence/history;
- weight guidance;
- action bias;
- AI interpretation;
- position sizing;
- production Supabase mutation;
- scheduler changes;
- deployment;
- PR #101 merge;
- automatic trading.

## Current stop

```text
G10.1 API_BULK_DRUGS / ALIVUS = COMPLETE / PASS
G10.2 GLOBAL_GENERICS / AUROPHARMA = COMPLETE / PASS
G10.3 BIOPHARMA_BIOSIMILARS / BIOCON Checkpoint A = IMPLEMENTED
Owner localhost classification lock = PENDING
Full local validation = PENDING
G10.3 Checkpoint B = NOT STARTED
```
