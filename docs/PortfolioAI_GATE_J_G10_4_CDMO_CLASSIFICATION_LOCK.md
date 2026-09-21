# PortfolioAI — Gate J / G10.4 CDMO_CRAMS Classification Lock

**Date:** 21 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Stage:** G10.4 — Checkpoint A
**Status:** IMPLEMENTED / OWNER LOCALHOST LOCK + FULL VALIDATION PENDING
**Score execution:** OFF
**Recommendation execution:** OFF
**Persistence:** OFF

## Reference-company selection

The provisional `CDMO_CRAMS` register contains:

- LAURUSLABS
- ONESOURCE
- PPLPHARMA
- AKUMS
- SYNGENE
- JUBLPHARMA

**Selected reference candidate: SYNGENE — Syngene International Limited.**

SYNGENE is selected as the lowest-ambiguity portability candidate because the reviewed issuer operating model is an integrated contract research, development and manufacturing platform rather than a product-led Pharma business.

## Two-period classification evidence

FY25 issuer reporting describes the business model as diversified across CRO and CDMO services. FY26 issuer reporting describes Syngene as an integrated CRDMO platform spanning discovery, development and manufacturing.

PortfolioAI's `CDMO_CRAMS` taxonomy intentionally consolidates those contract research, development and manufacturing service families.

Accordingly, the Checkpoint A classification fixture records:

| Period | CDMO / CRAMS taxonomy coverage | Material Overlay | Emerging Watch |
|---|---:|---|---|
| FY25 | 100% | None | None |
| FY26 | 100% | None | None |

**Important:** 100% is a PortfolioAI taxonomy classification of the reviewed issuer operating model. It is not represented as an issuer-reported single-segment revenue percentage.

The unchanged G1 adaptive-classification contract resolves:

```text
Classification state = READY_FOR_REVIEW
Primary candidate = CDMO_CRAMS
Material Overlay = none
Emerging Watch = none
```

## Distortion / comparability review

1. **Two-period operating-model comparability — PASS.**
   FY25 and FY26 both preserve the same outsourced research/development/manufacturing service model.

2. **CRO + CDMO taxonomy consolidation — PASS WITH CONTEXT.**
   Issuer Research Services/CRO and CDMO/development/manufacturing lines are consolidated only because `CDMO_CRAMS` is the PortfolioAI contract-services taxonomy.

3. **No product-led Pharma secondary exposure — PASS.**
   Customer molecules and programs do not become Syngene API, Generics, Domestic Formulations or Biosimilars exposures.

4. **Internal service mix is not a second subprofile — PASS.**
   Research Services, development and commercial manufacturing remain internal service families inside one CRDMO operating model.

## Classification-lock rule

Checkpoint A must be owner-approved before Checkpoint B starts.

A later score or recommendation cannot alter the classification. Reclassification requires new material business evidence and a separate versioned decision.

## UI proof

The common Gate J panel now supports SYNGENE without creating a symbol-specific page tree.

Expected localhost block:

```text
Gate J · G10.4 · Checkpoint A
Reference company = Syngene International Limited / SYNGENE
Primary candidate = CDMO / CRAMS
Material Overlay = None reviewed
Emerging Watch = None
FY25 = CDMO / CRAMS taxonomy coverage 100%
FY26 = CDMO / CRAMS taxonomy coverage 100%
Ready for owner lock
Score not started
```

## Local Supabase proof boundary

Run only against local Supabase:

`bash scripts/r4n/run-syngene-g10-4-local-research-target.sh`

The fixture may create/reconcile local SYNGENE identity and add a synthetic ownership link only if SYNGENE is absent from local Research Coverage.

It writes:

- 0 research-evidence rows;
- 0 subprofile-assignment rows;
- 0 score rows;
- 0 recommendation rows.

It refuses a non-local database URL.

## Full local validation

After visual review and owner approval run:

`bash scripts/g10-4-validate-cdmo-classification-lock.sh`

## Safety boundary

G10.4 Checkpoint A does not authorize:

- CDMO/CRAMS scoring-method execution;
- provider refreshes;
- score persistence;
- recommendation persistence;
- position sizing;
- AI interpretation;
- production Supabase mutation;
- scheduler changes;
- deployment;
- PR #101 merge;
- automatic trading.

## Current stop

```text
G10.1 API_BULK_DRUGS = COMPLETE / PASS
G10.2 GLOBAL_GENERICS = COMPLETE / PASS
G10.3 BIOPHARMA_BIOSIMILARS = COMPLETE / PASS
G10.4 CDMO_CRAMS / SYNGENE Checkpoint A = IMPLEMENTED
Owner localhost classification lock = PENDING
Full local validation = PENDING
G10.4 Checkpoint B = NOT STARTED
```
