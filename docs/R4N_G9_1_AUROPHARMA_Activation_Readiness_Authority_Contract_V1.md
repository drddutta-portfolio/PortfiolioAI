# R4N — G9.1 AUROPHARMA Activation-Readiness & Authority Contract V1

**Status:** IMPLEMENTED FOR LOCAL VISUAL REVIEW — NOT VALIDATED / NOT ACTIVE  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Stage:** G9.1 of the hard-capped G9 sequence  
**Production mutation:** none

## Purpose

G9.1 converts the completed G8 AUROPHARMA portability result into an explicit activation-readiness contract without persisting anything.

It answers:

> Which AUROPHARMA research authorities are ready to become canonical in G9.2, and which downstream capabilities must remain fail-closed?

## Independent activation layers

The contract keeps these activation layers separate:

1. parent `PHARMA_V1` research profile;
2. Primary subprofile assignment;
3. reviewed secondary exposure;
4. unresolved exposure;
5. numeric scoring;
6. recommendation;
7. position sizing.

Research authority does not imply downstream scoring/recommendation/sizing authority.

## Reviewed G9.1 authority state

### Parent profile

`PHARMA_V1 = READY`

This means the Pharma research architecture is eligible to become the canonical research workspace once the assignment path is activated. It does not enable score execution.

### Primary

`GLOBAL_GENERICS = READY_FOR_ACTIVATION`

The candidate retains:

- assignment state `REVIEWED`;
- confidence `HIGH`;
- effective-from date `2026-03-31`;
- G8.1 evidence lineage.

No database row is written by G9.1.

### Secondary exposure

`API_BULK_DRUGS = READY_EMERGING`

The candidate retains the reviewed Emerging role.

Consequences:

- visible as research context;
- excluded from readiness denominator;
- excluded from score denominator;
- no independent stock score.

### Unresolved exposure

`BIOPHARMA_BIOSIMILARS = REVIEW_REQUIRED`

It is intentionally absent from the G9.1 activation candidate and cannot become an active assignment/exposure merely because the parent Pharma research workspace is activated.

### Numeric scoring

`BLOCKED_METHODOLOGY`

Reason:

`GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE`

G9.1 does not repair the G8 Research-Gap Register or borrow Domestic Formulations methodology.

### Recommendation

`BLOCKED_UPSTREAM_SCORING`

No recommendation policy activation or recommendation persistence is authorized.

### Position sizing

`BLOCKED_UPSTREAM_RECOMMENDATION`

No D35B activation or persistence is authorized.

## Readiness-denominator role-awareness re-check

G9.1 intentionally re-runs the candidate through the shared Pharma three-layer/workspace contracts instead of assuming the G8.2 preview result is sufficient.

The contract requires:

- Primary = `GLOBAL_GENERICS`;
- API = active `EMERGING_WATCH`;
- API Emerging requirements contributed to readiness denominator = `0`;
- unresolved Biosimilars remains outside the active assignment;
- interpretation scope = `COMPANY_ACTIVE_ASSIGNMENT_ROLE`.

If this property changes, G9.1 throws rather than silently proceeding.

## Implementation

Added:

- `src/features/research/auropharmaG91ActivationReadiness.ts`
- `src/features/research/auropharmaG91ActivationReadiness.test.ts`
- `src/features/research/AuropharmaG91ActivationReadinessPanel.tsx`

Updated:

- `src/pages/ResearchPage.tsx`

The AUROPHARMA Overview now displays the G9.1 activation-readiness checkpoint after the completed G8 validation panels.

## Explicit write boundary

G9.1 sets all of the following to false:

- canonical assignment persisted;
- production mutation enabled;
- score execution enabled;
- recommendation persistence enabled;
- position-sizing persistence enabled.

No SQL, Supabase mutation, provider refresh, production migration, deployment or scheduler action is introduced.

## Workflow state

This checkpoint is **not yet complete**.

Required next sequence:

1. owner pulls the current branch;
2. Local Supabase and Local Vite run as normal;
3. owner opens AUROPHARMA → Research → Overview;
4. owner visually validates the G9.1 panel;
5. only after visual approval, run full local G9.1 validation;
6. record the authoritative result in the cumulative handoff;
7. then and only then proceed to G9.2.

## Expected localhost panel

The G9.1 panel should show:

- Research profile: `PHARMA_V1 · Ready`;
- Canonical candidate: `Global Generics · Ready for activation`;
- Secondary: `API / Bulk Drugs · Emerging`;
- Unresolved: `Biopharma / Biosimilars · Review Required`;
- Readiness denominator: Primary role only;
- Numeric scoring: Blocked Methodology;
- Recommendation: Blocked Upstream Scoring;
- Position sizing: Blocked Upstream Recommendation;
- Production mutation: OFF;
- score execution: OFF.

**CURRENT STOP POINT:** localhost visual review. Do not persist the AUROPHARMA canonical assignment and do not start G9.2 before G9.1 visual approval + full local validation + final handoff checkpoint.
