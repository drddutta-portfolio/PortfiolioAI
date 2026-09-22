# R4N — G9.2 AUROPHARMA Canonical Research Activation V1

**Status:** IMPLEMENTED FOR LOCAL PERSISTENCE + VISUAL REVIEW — NOT YET VALIDATED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Stage:** G9.2 of the hard-capped G9 sequence  
**Production mutation:** none

## Purpose

G9.2 replaces AUROPHARMA's temporary in-memory G8 assignment with the normal canonical `research_subprofile_assignments` + `research_subprofile_secondary_exposures` pathway in **Local Supabase only**.

It activates canonical research authority, not numeric scoring, recommendation, or position sizing.

## Local canonical authority

Expected Primary assignment:

- security: AUROPHARMA
- parent profile: `PHARMA_V1`
- Primary: `GLOBAL_GENERICS`
- assignment state: `REVIEWED`
- confidence: `HIGH`
- effective from: `2026-03-31`

Expected reviewed secondary exposure:

- `API_BULK_DRUGS`
- materiality: `EMERGING`
- assignment state: `REVIEWED`
- confidence: `HIGH`

`BIOPHARMA_BIOSIMILARS` remains unresolved and must not exist as active reviewed Primary or active reviewed secondary authority.

## Local-only persistence package

Added:

- `scripts/r4n/auropharma-g9-2-local-canonical-activation.sql`
- `scripts/r4n/run-auropharma-g9-2-local-canonical-activation.sh`
- `src/features/research/auropharmaG92LocalCanonicalActivationSql.test.ts`

The runner refuses non-local database URLs.

The SQL itself also requires the AUROPHARMA security to have:

`creation_source = LOCAL_G8_FIXTURE`

so the production security cannot satisfy the local-only guard accidentally.

## Persistence isolation

Before inserting AUROPHARMA authority, the script requires the previously validated local TORNTPHARM canonical state:

- TORNTPHARM Primary = `DOMESTIC_FORMULATIONS`;
- TORNTPHARM Global Generics = `MATERIAL` secondary exposure.

After AUROPHARMA persistence it asserts:

- AUROPHARMA assignment id differs from TORNTPHARM assignment id;
- AUROPHARMA Global Generics Primary is not duplicated as an AUROPHARMA secondary exposure;
- TORNTPHARM's Global Generics Material Overlay remains attached to TORNTPHARM's assignment only.

This is the G9 persistence-layer security/assignment isolation + role-binding check.

## Biosimilars fail-closed persistence rule

The package aborts if:

- an active reviewed AUROPHARMA Primary assignment exists for `BIOPHARMA_BIOSIMILARS`; or
- an active reviewed AUROPHARMA secondary exposure exists for `BIOPHARMA_BIOSIMILARS`.

Unresolved means absent from active canonical authority.

## UI

Added:

`src/features/research/AuropharmaG92CanonicalActivationPanel.tsx`

and mounted it on AUROPHARMA Overview.

Before the local persistence script is run, the panel shows:

`Canonical local research activation: PENDING`

After successful local persistence and refresh, expected:

- resolver state = `RESOLVED`;
- Primary = Global Generics / Reviewed / High;
- secondary = API / Bulk Drugs · Emerging;
- Biosimilars authority = No active reviewed row;
- canonical local research activation = PASS;
- numeric score = BLOCKED;
- recommendation = BLOCKED;
- sizing = BLOCKED.

The ordinary Pharma workspace should also resolve through the normal assignment repository after local persistence.

## Explicit non-goals

G9.2 does not:

- persist to production;
- insert research evidence;
- create a score run;
- create a recommendation run;
- create a position-sizing assessment;
- repair Global Generics methodology gaps;
- deploy;
- change schedulers;
- merge PR #101.

## Local execution

From repository root, with Local Supabase running:

```bash
bash scripts/r4n/run-auropharma-g9-2-local-canonical-activation.sh
```

Then refresh AUROPHARMA → Research → Overview.

## Workflow state

G9.2 is not complete.

Required next sequence:

1. owner pulls latest branch;
2. Local Supabase is running;
3. owner runs the local-only G9.2 persistence package;
4. Local Vite is running;
5. owner hard-refreshes AUROPHARMA Overview;
6. owner visually confirms the G9.2 canonical activation panel and the ordinary Pharma workspace resolve correctly;
7. only then run full local G9.2 validation;
8. record final checkpoint in cumulative handoff;
9. then proceed to G9.3.

**CURRENT STOP POINT:** owner pull + Local Supabase G9.2 persistence + localhost visual review. Production persistence remains prohibited.
