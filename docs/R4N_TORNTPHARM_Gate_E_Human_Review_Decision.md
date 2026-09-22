# R4N — TORNTPHARM Gate E Human Review Decision

**Status:** HUMAN REVIEW APPROVED — REVIEWED DECISION — NOT PERSISTED  
**Date:** 17 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Scope:** Records the owner's completed Gate E human-review decision only. This artifact does **not** authorize or perform any production database write, evidence ingestion, scoring, recommendation, sizing, provider call, deployment, merge, or scheduler change.

## Decision

The owner completed the Gate E human review for TORNTPHARM and explicitly approved the assignment as `REVIEWED` for preparation of a separately gated canonical persistence action.

Approved assignment decision:

```text
security: TORNTPHARM (NSE)
profile_code: PHARMA_V1
primary_subprofile_code: DOMESTIC_FORMULATIONS
assignment_version_candidate: 1
assignment_state_decision: REVIEWED
confidence: HIGH
effective_from: 2026-03-31
effective_to: null
```

Approved secondary exposures:

```text
GLOBAL_GENERICS
materiality: MATERIAL
confidence: MEDIUM

CDMO_CRAMS
materiality: EMERGING
confidence: MEDIUM
```

Approved conditional consequence:

- activate applicable export / regulated-market / regulatory-site requirements for the `MATERIAL` `GLOBAL_GENERICS` exposure;
- activate only requirements explicitly designed for an `EMERGING` `CDMO_CRAMS` exposure;
- secondary exposures remain non-scoring and do not create or blend another Pharma score.

## Human-review approvals recorded

The owner explicitly approved all of the following during the Gate E review:

1. Primary `DOMESTIC_FORMULATIONS`.
2. Secondary `GLOBAL_GENERICS` as `MATERIAL`.
3. Secondary `CDMO_CRAMS` as `EMERGING`.
4. Effective date `2026-03-31`.
5. Conditional export/regulatory activation.
6. Final Gate E TORNTPHARM assignment decision as `REVIEWED`.

## Evidence basis

This decision relies on the reviewed evidence package already recorded in:

- `docs/R4N_TORNTPHARM_Gate_E_Secondary_Exposure_Evidence_Review.md`
- `docs/R4N_TORNTPHARM_Gate_E_Assignment_Review_Package.md`
- `docs/R4N_PHARMA_V1_Secondary_Exposure_Materiality_Proposal.md` (owner-approved V1 methodology)

The reviewed interpretation is:

- `DOMESTIC_FORMULATIONS` is the primary operating model, supported by the dominant India branded-formulations franchise;
- `GLOBAL_GENERICS` is a `MATERIAL` secondary exposure under the approved V1 rule;
- `CDMO_CRAMS` is an `EMERGING` secondary exposure using the approved provenance-complete qualitative override path;
- no secondary exposure is `UNKNOWN` or `DOMINANT`, so no unresolved-materiality or primary-reclassification blocker remains.

## Important distinction: reviewed decision vs persisted canonical row

The Gate E human-review decision is now approved as `REVIEWED`, but **no canonical assignment row has been written to production Supabase**.

The existing review-package builder intentionally produces only a `PROVISIONAL` draft and never auto-promotes to `REVIEWED`. That safety behavior remains correct and unchanged. Human approval is the separate authority that now permits preparation of an exact canonical persistence package.

Before any future production persistence action, the implementation must still resolve and verify:

- the current production TORNTPHARM `security_id`;
- assignment version remains `1` with no intervening assignment row;
- reviewer database identity required by the `reviewed_by` foreign key;
- an exact `reviewed_at` timestamp;
- source/provenance fields and reason codes;
- secondary-exposure rows and their parent assignment linkage;
- immediate read-only production preflight results;
- the exact SQL/transaction or approved service-role write mechanism.

No reviewer UUID is fabricated or inferred in this artifact.

## Persistence authorization boundary

This human-review approval **does not authorize the production write itself**.

A production persistence step must be separately authorized with an exact scope, for example only after a reviewed persistence plan is prepared and preflighted.

Until that separate authorization is given:

- production `research_subprofile_assignments` remains unchanged;
- production `research_subprofile_secondary_exposures` remains unchanged;
- no evidence is ingested;
- no score/recommendation/sizing is written;
- PR #101 remains unmerged unless separately authorized.

## Gate E state

**Human review:** COMPLETE / APPROVED  
**Assignment decision:** `REVIEWED`  
**Canonical production persistence:** NOT YET AUTHORIZED / NOT YET PERFORMED  
**Next safe step:** prepare the exact production persistence plan and perform read-only preflight only; do not write until separately authorized.
