# PortfolioAI — Gate I / I1 Recommendation Authority and Architecture Reconciliation

**Date:** 21 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Stage:** I1 — Recommendation Authority / Architecture Reconciliation
**Status:** COMPLETE / PASS — OWNER VALIDATED

## Purpose

I1 freezes the authority boundary through which PHARMA_V1 scoring may later enter recommendation methodology.

I1 does **not** define recommendation thresholds, floors, blockers, cautions, or a TORNTPHARM role.

## Implemented authority contract

Added:

- `src/features/research/pharmaRecommendationAuthority.ts`
- `src/features/research/pharmaRecommendationAuthority.test.ts`
- `src/features/research/sectorRecommendation.pharmaV1Strict.test.ts`

Version:

`PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_V1`

### Canonical assignment authority

Recommendation inputs consume the existing PHARMA_V1 assignment resolution contract.

Identity remains:

```text
security_id
+ parent_profile_code = PHARMA
+ parent_profile_version = PHARMA_V1
```

The recommendation-input assembler accepts the already resolved `PharmaSubprofileResolution`; it does not infer Primary or secondary roles from symbol, company name, sector label, or category text.

### Score authority is separate

I1 does not pretend the assignment repository stores the Gate H score.

The input assembler composes:

```text
canonical assignment authority
        +
explicit score authority
        ↓
Gate I recommendation input
```

For a closed score, `buildGateHClosedScoreAuthority` requires:

- finite authoritative overall score;
- exactly ten PHARMA_V1 dimensions;
- finite score for every dimension;
- full readiness coverage for every dimension;
- read-only / non-persisting source result.

The TORNTPHARM H3/H4 score remains exactly 75.1575.

### Typed score state

I1 distinguishes:

```text
SCORE_READY
SCORE_NOT_COMPUTABLE
```

A score-not-computable authority contains:

- `overallScore = null`;
- no recommendation-consumable partial dimension score array;
- explicit reason code;
- explicit upstream contract lineage.

This prevents a nullable score field from silently becoming a partial-score recommendation path.

### Typed assignment state

I1 separately distinguishes:

```text
RESOLVED
BLOCKED
```

Assignment failure and score non-computability therefore cannot collapse into one ambiguous null state.

### PHARMA_V1 policy identity

I1 freezes a PHARMA_V1-native recommendation policy identity:

```text
research authority:
  PHARMA / PHARMA_V1

recommendation policy code:
  PHARMA_V1

policy storage state:
  NOT_MATERIALIZED

legacy PHARMA_HEALTHCARE usage:
  FORBIDDEN_FOR_GATE_I
```

No production recommendation-policy row was created or changed.

## Legacy score-reconstruction fallback

The existing generic recommendation helper can reconstruct an overall preview from available weighted dimensions when `overallScore` is null.

That legacy behavior remains available outside PHARMA_V1 for backward compatibility.

For `profileCode = PHARMA_V1`, it is now disabled:

```text
overallScore = null
    ↓
no reconstruction
    ↓
overallScore remains null
    ↓
recommendation helper fails closed as INSUFFICIENT
```

The regression test deliberately supplies complete, high-scoring dimensions with a null overall score and verifies that PHARMA_V1 still returns `INSUFFICIENT`.

A companion legacy test verifies that the generic fallback remains unchanged for non-PHARMA_V1 profiles.

## Cross-company authority isolation

The I1 assembler rejects:

- score authority whose `securityId` differs from the selected security;
- canonical assignment whose security differs from the selected security;
- assignment Primary subprofile that conflicts with score-authority Primary subprofile.

This is the recommendation-layer counterpart to earlier scoring/assignment isolation rules.

## AUROPHARMA negative-control readiness

I1 can represent the approved AUROPHARMA state without constructing a partial score:

```text
Primary = GLOBAL_GENERICS
score authority = SCORE_NOT_COMPUTABLE
overallScore = null
reason = GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE
recommendation eligibility = FAIL_CLOSED
```

I1 does not yet map that eligibility state to the final recommendation ontology; that happens in I2/I3 after recommendation policy approval.

## No methodology invented

I1 creates no:

- Core threshold;
- Satellite threshold;
- Watch threshold;
- dimension floor;
- hard blocker;
- caution threshold;
- weight guidance;
- action bias.

Those remain I2 work.

## Safety

I1 performs no:

- score persistence;
- recommendation persistence;
- assignment mutation;
- production Supabase mutation;
- provider call;
- Edge Function call;
- AI interpretation;
- position sizing;
- deployment;
- PR merge.

## First local validation attempt

The first owner-run I1 validation completed the focused test step successfully:

- **5 test files passed**;
- **30 tests passed**.

Validation then stopped at strict TypeScript with two instances of the same compatibility issue:

```text
GateHClosedReadOnlyScoreLike.emergingWatch.numericParticipation
expected literal type: false
upstream H3 inferred return type: boolean
```

This was a TypeScript boundary issue, not a recommendation-authority or scoring failure.

Correction:

- the I1 adapter now accepts the upstream `boolean` type at its input boundary;
- `buildGateHClosedScoreAuthority` explicitly requires the runtime value to equal `false`;
- the builder also explicitly checks that the material-overlay numeric modifier remains unapplied and the Gate H result remains read-only / non-persisting;
- focused regression tests now prove these safety invariants fail closed if violated.

No Gate H score, methodology, recommendation threshold, assignment authority, or persistence behavior changed.

## Consolidated validation

Run:

```bash
git pull && bash scripts/i1-validate-pharma-recommendation-authority.sh
```

The script validates:

1. I1 authority + strict-fallback + canonical assignment + Gate H/AUROPHARMA regressions;
2. strict TypeScript;
3. presentation data-boundary architecture guard;
4. focused I1 ESLint;
5. existing architecture lint;
6. production build;
7. I1 diff whitespace.

No Edge tests are required because I1 changes no Edge Function code.

## Final consolidated validation result

The owner reran the complete I1 validation command after the TypeScript boundary correction:

```bash
git pull && bash scripts/i1-validate-pharma-recommendation-authority.sh
```

Owner result:

> **ALL PASSED**

This confirms PASS for the full I1 validation sequence:

1. focused I1 + authority regressions;
2. strict TypeScript;
3. presentation data-boundary architecture guard;
4. focused I1 ESLint;
5. existing architecture lint;
6. production build;
7. I1 diff whitespace.

No Edge tests were required because I1 changed no Edge Function code.

Final I1 state:

- canonical PHARMA_V1 assignment authority = FROZEN;
- separate score authority = FROZEN;
- `SCORE_READY` vs `SCORE_NOT_COMPUTABLE` = EXPLICIT;
- assignment `RESOLVED` vs blocked = EXPLICIT;
- PHARMA_V1 recommendation policy identity = FROZEN;
- legacy `PHARMA_HEALTHCARE` policy use = FORBIDDEN FOR GATE I;
- missing-overall-score reconstruction for PHARMA_V1 = DISABLED;
- cross-security / Primary-subprofile mismatch = FAIL CLOSED;
- recommendation thresholds/floors/blockers/cautions = NOT YET DEFINED;
- score persistence = OFF;
- recommendation persistence = OFF.

> **I1 = COMPLETE / PASS**

I2 remains **NOT STARTED**.

## I1 closure condition

The consolidated validation passed and the owner accepted the result.

Current state:

```text
Gate H = COMPLETE / PASS
I1 = COMPLETE / PASS
I2 = NOT STARTED
I3 = NOT STARTED
I4 = NOT STARTED
```
