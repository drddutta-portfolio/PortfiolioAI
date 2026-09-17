# R4N — TORNTPHARM Production Persistence Candidate

**Status:** FRESH READ-ONLY PRODUCTION PREFLIGHT PASS — PRODUCTION WRITE NOT AUTHORIZED  
**Date:** 17 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`

## Scope boundary

This package was first prepared and validated on localhost, then followed by a separately authorized fresh **read-only** production preflight. No production write was performed.

This step did **not**:
- create or modify a production assignment row;
- create or modify a production secondary-exposure row;
- ingest evidence;
- call any paid/external provider;
- write scores, recommendations, or sizing;
- alter cron/schedulers;
- deploy application or Edge Functions;
- merge PR #101;
- apply a migration.

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

The database schema does not persist a separate numeric `assignment_version` column. The Gate E `assignmentVersionCandidate = 1` is represented operationally by the requirement that no prior PHARMA assignment history exists for TORNTPHARM before the first canonical row is inserted.

## Candidate execution artifact

Prepared:

`scripts/r4n_torntpharm_reviewed_assignment_persistence_candidate.sql`

Safety properties:

1. Requires explicit target `security_id`, reviewer email, and `reviewed_at` timestamp as psql variables.
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

The `commit_authorized` variable is only a technical guard. Passing it as true is prohibited unless the owner separately authorizes the exact production persistence action after reviewing this preflight.

## Localhost validation

The localhost reference environment used:

```text
security_id: a4000000-0000-0000-0000-000000000002
reviewer email: dr.d.dutta@gmail.com
reviewed_at in the local fixture: 2026-09-17T13:00:00Z
```

Owner executed the candidate against local Supabase with `commit_authorized=false`.

Observed result:
- target TORNTPHARM/NSE identity resolved successfully;
- reviewer resolved successfully;
- existing reviewed primary assignment matched exactly as `DOMESTIC_FORMULATIONS / REVIEWED / HIGH`;
- existing `CDMO_CRAMS` secondary matched exactly as `EMERGING / MEDIUM / REVIEWED`;
- existing `GLOBAL_GENERICS` secondary matched exactly as `MATERIAL / MEDIUM / REVIEWED`;
- exactly two verification rows were displayed;
- the script printed `SAFE DEFAULT: commit_authorized=false; rolling back transaction.`;
- transaction ended with `ROLLBACK`.

**Result:** localhost idempotent-match validation PASS.

## Fresh read-only production preflight — 17 September 2026

Production project independently resolved as:

```text
project: Project-PortfolioAI
project_ref: uxiyufbsbgzzdujzcdxe
status: ACTIVE_HEALTHY
region: ap-northeast-1
PostgreSQL: 17.6.1.166
```

Fresh read-only SQL verified:

```text
TORNTPHARM / NSE security matches: 1
production security_id: da69b3eb-0343-44f8-912c-288b826118cc
existing PHARMA assignments for TORNTPHARM: 0
secondary rows attached to TORNTPHARM assignments: 0
reviewer auth-user matches: 1
reviewer owns a production portfolio containing TORNTPHARM: YES
```

Required immutable contracts all exist exactly:

```text
DOMESTIC_FORMULATIONS / DOMESTIC_FORMULATIONS_V1: present
GLOBAL_GENERICS / GLOBAL_GENERICS_V1: present
CDMO_CRAMS / CDMO_CRAMS_V1: present
```

Schema safety was rechecked read-only:
- `research_subprofile_assignments` contains the reviewed lifecycle/provenance columns required by the candidate;
- `research_subprofile_secondary_exposures` contains `assignment_status`, `confidence_state`, `effective_from`, `effective_to`, `reason_code`, `reviewed_by`, and `reviewed_at`;
- expected review-completeness, confidence, status, interval, foreign-key and non-overlap constraints are present;
- RLS is enabled on both assignment and secondary-exposure tables;
- role `authenticated` has `SELECT` only on both tables.

No conflicting target row was found. Therefore the first canonical TORNTPHARM PHARMA assignment remains eligible to be represented as assignment-version candidate 1.

## Production provenance parameters prepared, not executed

Proposed exact production parameters for a future separately authorized write are:

```text
target_security_id = da69b3eb-0343-44f8-912c-288b826118cc
reviewer_email = dr.d.dutta@gmail.com
reviewed_at = 2026-09-17T13:05:43Z
```

`reviewed_at = 2026-09-17T13:05:43Z` is the Git commit timestamp of the immutable human-review approval artifact `cccb40ac7a119698fb46ed3e0658bea1377f3a7d` and is used as the audit anchor for the recorded review decision rather than the arbitrary localhost fixture timestamp.

## Exact future execution shape — NOT AUTHORIZED NOW

If and only if the owner later explicitly authorizes this exact production persistence action, the execution should use the already-reviewed script with the production target parameters above and `commit_authorized=true`.

Before that execution, perform one final immediate read-only recheck that:
- TORNTPHARM still resolves to the same production UUID;
- PHARMA assignment count is still zero;
- no secondary exposure row has appeared;
- reviewer identity still resolves uniquely and still owns a portfolio containing TORNTPHARM;
- all three required contracts still exist;
- branch/script content is unchanged from the reviewed package.

If any condition differs, abort and re-review.

## Gate status after fresh preflight

- Human review: COMPLETE / APPROVED.
- Local reviewed persistence + UI proof: PASS.
- Persistence candidate script: PREPARED.
- Local idempotency validation: PASS.
- Fresh production read-only preflight: PASS.
- Production persistence: NOT AUTHORIZED / NOT PERFORMED.
- Production rows created by this step: 0.
