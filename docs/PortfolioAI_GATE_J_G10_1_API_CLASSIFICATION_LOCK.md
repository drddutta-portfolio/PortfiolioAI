# PortfolioAI — Gate J / G10.1 API_BULK_DRUGS Classification Lock

**Date:** 21 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Stage:** G10.1 — Checkpoint A  
**Status:** IMPLEMENTED / LOCALHOST OWNER APPROVAL PENDING  
**Score execution:** OFF  
**Recommendation execution:** OFF  
**Persistence:** OFF

## Reference-company selection

The provisional API/Bulk register contains ALIVUS, SUPRIYA, SOLARA and PAR.

**Selected reference candidate: ALIVUS — Alivus Life Sciences Limited.**

Selection rationale:

- current canonical security exists in PortfolioAI;
- issuer identifies the business as an API developer/manufacturer;
- official annual reports provide a direct Generic API versus CDMO business mix for two consecutive annual periods;
- the split allows the unchanged G1 adaptive-classification contract to operate without inventing a denominator;
- secondary CDMO exposure is disclosed separately rather than hidden inside a blended narrative.

## Two-period classification evidence

| Period | Generic API | CDMO | Source |
|---|---:|---:|---|
| FY25 | 94% | 6% | Alivus Integrated Annual Report 2024-25 |
| FY26 | 93% | 7% | Alivus Integrated Annual Report 2025-26 |

G1 result:

```text
Classification state = READY_FOR_REVIEW
Primary candidate = API_BULK_DRUGS
Material Overlay = none
Emerging Watch = CDMO_CRAMS
```

CDMO remains an Emerging Watch because it is above the 5% emerging threshold but below the 15% Material Overlay threshold in both reviewed periods.

## Distortion / one-off / structural-change review

1. **Two-period denominator — PASS.** FY25 and FY26 use the same issuer-disclosed Generic API versus CDMO business-mix basis.
2. **Nirma acquisition / rename — PASS.** Ownership and company-name changes do not alter the operating-model denominator.
3. **FY26 CDMO recovery — PASS.** CDMO growth is economically real but remains only 7% of FY26 mix; it cannot overturn 93% API leadership.
4. **IQGenX acquisition — FUTURE REVIEW TRIGGER.** The August 2026 acquisition occurs after the 31 March 2026 evidence date. It must be assessed prospectively in a later effective period rather than back-projected into FY25/FY26.

## Classification-lock rule

Checkpoint A must be owner-approved before Checkpoint B starts.

After lock, classification cannot be changed because a later score or recommendation is inconvenient.

It may reopen only for new material business evidence through a separately documented, versioned reclassification decision.

## UI proof

A reusable `PharmaGateJReferenceClassificationPanel` is added to the existing universal Research Overview.

The universal page has no ALIVUS-specific page tree. A reusable reference-review registry supplies the G10 classification fixture to the sector add-on.

The panel shows:

- reference company;
- proposed primary;
- Material Overlay state;
- Emerging Watch state;
- two-period business mix;
- selection rationale;
- distortion checks;
- explicit score/persistence boundary.

## Local Supabase proof boundary

Run only against local Supabase:

`bash scripts/r4n/run-alivus-g10-1-local-research-target.sh`

The fixture may create/reconcile the local ALIVUS identity and add a synthetic ownership link only if ALIVUS is absent from local Research Coverage.

It writes no research evidence, no subprofile assignment, no score and no recommendation.

## Owner visual checkpoint

After `git pull`, local Supabase fixture and Vite startup, open ALIVUS in localhost Research → Overview.

Approve only if the panel correctly shows:

```text
G10.1 / Checkpoint A
ALIVUS
Primary candidate = API / Bulk Drugs
Material Overlay = None reviewed
Emerging Watch = CDMO / CRAMS
FY25 = API 94% / CDMO 6%
FY26 = API 93% / CDMO 7%
Ready for owner lock
Score not started
```

Do not begin Checkpoint B until this visual/classification approval is explicit.

## Full local validation after visual approval

Run:

`bash scripts/g10-1-validate-api-classification-lock.sh`

The validation includes focused classification tests, Gate I safety regressions, TORNTPHARM/AUROPHARMA control regressions, full non-Edge tests, strict TypeScript, architecture guard, lint, production build and diff whitespace.

## Current stop

```text
G10.1 Checkpoint A = IMPLEMENTED
Owner localhost approval = PENDING
Full local validation = PENDING
G10.1 Checkpoint B = NOT STARTED
```
