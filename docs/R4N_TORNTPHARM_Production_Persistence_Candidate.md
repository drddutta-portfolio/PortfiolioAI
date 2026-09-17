# R4N — TORNTPHARM Production Persistence Candidate

**Status:** LOCALHOST IDEMPOTENCY DRY-RUN VALIDATED — NO PRODUCTION PREFLIGHT PERFORMED IN THIS STEP  
**Date:** 17 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`

## Scope boundary

The owner explicitly requested that this preparation remain on localhost and not query or write production Supabase. Accordingly:

- no fresh production database query was performed in this step;
- no production assignment or secondary-exposure row was created;
- no provider, evidence-ingestion, scoring, recommendation, sizing, scheduler, deployment, merge, or migration action was performed;
- the production identifiers below are retained only from the last reviewed Gate E package and are **not treated as freshly revalidated**.

A real production persistence action remains blocked until a later, separately authorized **fresh read-only production preflight** confirms identity, zero/conflict state, reviewer identity, constraints, and the exact target rows immediately before any write.

## Reviewed decision to persist

Primary assignment:

```text
security: TORNTPHARM / NSE
parent profile: PHARMA / PHARMA_V1
primary subprofile: DOMESTIC_FORMULATIONS / DOMESTIC_FORMULATIONS_V1
assignment status: REVIEWED
confidence: HIGH
effective_from: 2026-03-31T00:00:00Z
effective_to: null
assignment_basis: OWNER_REVIEWED_GATE_E_2026_09_17
source_reference: TORNTPHARM_AR_2025_26; TORNTPHARM_AR_2024_25; TORNTPHARM_Q4_FY25_26_EARNINGS_CALL
```

Approved secondary exposures:

```text
GLOBAL_GENERICS / GLOBAL_GENERICS_V1
materiality: MATERIAL
confidence: MEDIUM
status: REVIEWED
reason_code: ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10
source_reference: TORNTPHARM_AR_2025_26; TORNTPHARM_Q2_FY25_26_EARNINGS_CALL

CDMO_CRAMS / CDMO_CRAMS_V1
materiality: EMERGING
confidence: MEDIUM
status: REVIEWED
reason_code: OWNER_REVIEWED_STRATEGIC_EMERGING_CDMO_CAPABILITY
source_reference: TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29; TORNTPHARM_AR_2025_26
```

The database schema does not persist a separate numeric `assignment_version` column. The Gate E `assignmentVersionCandidate = 1` therefore remains a review/package concept represented operationally by the requirement that no prior PHARMA assignment history exists for TORNTPHARM before the first canonical row is inserted.

## Candidate execution artifact

Prepared:

`scripts/r4n_torntpharm_reviewed_assignment_persistence_candidate.sql`

Safety properties:

1. Requires an explicit target `security_id`, reviewer email, and `reviewed_at` timestamp as psql variables.
2. Resolves the supplied security UUID and aborts unless it is exactly `TORNTPHARM` on `NSE`.
3. Resolves reviewer identity from `auth.users` and requires a unique match.
4. Requires the reviewer to own a portfolio containing the target security.
5. Requires the three immutable PHARMA_V1 contracts needed by the reviewed decision.
6. Inserts the primary row only when no PHARMA assignment exists; if one row already exists, it must be an exact idempotent match or the script aborts.
7. Rejects any unexpected secondary exposure.
8. Existing `GLOBAL_GENERICS` or `CDMO_CRAMS` rows must match the reviewed decision exactly.
9. Inserts only missing approved secondary rows.
10. Requires exactly two approved secondary rows after the candidate transaction.
11. Defaults to `ROLLBACK`. It commits only if the caller deliberately passes `-v commit_authorized=true`.

The `commit_authorized` mechanism is an additional guard, not production authorization. Passing the variable in the future is prohibited unless the owner has separately authorized the exact production write after fresh read-only preflight.

## Localhost validation target

Current local Gate E fixture uses:

```text
security_id: a4000000-0000-0000-0000-000000000002
reviewer email: dr.d.dutta@gmail.com
reviewed_at already persisted locally: 2026-09-17T13:00:00Z
```

Because the localhost fixture already contains the exact reviewed assignment and two secondary rows, running the candidate with `commit_authorized=false` proves its **idempotent-match path** and then rolls back. No local rows change.

Exact localhost dry-run command:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v target_security_id='a4000000-0000-0000-0000-000000000002' \
  -v reviewer_email='dr.d.dutta@gmail.com' \
  -v reviewed_at='2026-09-17T13:00:00Z' \
  -v commit_authorized=false \
  -f scripts/r4n_torntpharm_reviewed_assignment_persistence_candidate.sql
```

## Localhost idempotency dry-run result

Owner executed the exact command above against local Supabase on `127.0.0.1:54322`.

Observed result:

- target TORNTPHARM/NSE identity resolved successfully;
- reviewer `dr.d.dutta@gmail.com` resolved successfully;
- existing reviewed primary assignment matched exactly:
  - `DOMESTIC_FORMULATIONS`
  - `REVIEWED`
  - `HIGH`
  - effective from `2026-03-31T00:00:00Z`;
- existing `CDMO_CRAMS` secondary matched exactly as `EMERGING / MEDIUM / REVIEWED`;
- existing `GLOBAL_GENERICS` secondary matched exactly as `MATERIAL / MEDIUM / REVIEWED`;
- exactly two verification rows were displayed;
- the script printed `SAFE DEFAULT: commit_authorized=false; rolling back transaction.`;
- transaction ended with `ROLLBACK`.

**Result:** localhost idempotent-match validation PASS. The candidate script proved that it can recognize the already-reviewed target state and exit without mutating local data when commit authorization is false.

## Production values intentionally not finalized in this localhost-only step

The earlier Gate E review package recorded production TORNTPHARM UUID `da69b3eb-0343-44f8-912c-288b826118cc`, but this step does not revalidate it and therefore does not treat it as execution-ready.

The human-review decision artifact was committed at `2026-09-17T13:05:43Z`. That timestamp may be used as a candidate audit anchor for `reviewed_at`, but it is **not finalized here**. A future production preflight must explicitly confirm the chosen reviewer identity and reviewed-at provenance before execution.

## Gate status after localhost validation

- Human review: COMPLETE / APPROVED.
- Local reviewed persistence + UI proof: PASS.
- Persistence candidate script: PREPARED.
- Local idempotency validation: PASS.
- Fresh production preflight: NOT PERFORMED BY OWNER REQUEST.
- Production persistence: NOT AUTHORIZED / NOT PERFORMED.
