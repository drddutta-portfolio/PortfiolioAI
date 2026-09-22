# R4N — TORNTPHARM Production Persistence Candidate

**Status:** PRODUCTION PERSISTENCE COMPLETE — POST-WRITE VALIDATION PASS  
**Date:** 17 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`

## Scope boundary

This package was first prepared and validated on localhost, then passed a fresh read-only production preflight. The owner subsequently explicitly authorized only the reviewed TORNTPHARM Gate E persistence action described below.

The production action did **not**:
- ingest evidence;
- call any paid/external provider;
- write scores, recommendations, or sizing;
- alter cron/schedulers;
- deploy application or Edge Functions;
- merge PR #101;
- apply a migration;
- create any research-subprofile row for another security.

## Reviewed decision persisted

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
reviewed_at: 2026-09-17T13:05:43Z
```

Approved secondary exposures:

```text
GLOBAL_GENERICS / GLOBAL_GENERICS_V1
materiality: MATERIAL
confidence: MEDIUM
status: REVIEWED
reason_code: ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10
source_reference: TORNTPHARM_AR_2025_26; TORNTPHARM_Q2_FY25_26_EARNINGS_CALL
reviewed_at: 2026-09-17T13:05:43Z

CDMO_CRAMS / CDMO_CRAMS_V1
materiality: EMERGING
confidence: MEDIUM
status: REVIEWED
reason_code: OWNER_REVIEWED_STRATEGIC_EMERGING_CDMO_CAPABILITY
source_reference: TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29; TORNTPHARM_AR_2025_26
reviewed_at: 2026-09-17T13:05:43Z
```

The database schema does not persist a separate numeric `assignment_version` column. Gate E `assignmentVersionCandidate = 1` is represented operationally by this being the first PHARMA assignment row for TORNTPHARM.

## Candidate execution artifact

Prepared and locally dry-run validated:

`scripts/r4n_torntpharm_reviewed_assignment_persistence_candidate.sql`

Safety properties include:

1. explicit target security, reviewer, and review timestamp;
2. exact TORNTPHARM/NSE identity validation;
3. unique reviewer resolution;
4. reviewer portfolio ownership check;
5. required PHARMA_V1 contract checks;
6. fail-closed handling for pre-existing assignments;
7. rejection of unexpected secondary exposures;
8. exact-match requirements for existing approved rows;
9. insertion of only the two approved secondary rows;
10. exactly-two-secondary postcondition;
11. local script default of rollback unless commit is deliberately authorized.

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

Fresh read-only SQL verified immediately before the authorized write:

```text
TORNTPHARM / NSE security matches: 1
production security_id: da69b3eb-0343-44f8-912c-288b826118cc
existing PHARMA assignments for TORNTPHARM: 0
secondary rows attached to TORNTPHARM assignments: 0
reviewer auth-user matches: 1
reviewer owns a production portfolio containing TORNTPHARM: YES
```

Required immutable contracts all existed exactly:

```text
DOMESTIC_FORMULATIONS / DOMESTIC_FORMULATIONS_V1: present
GLOBAL_GENERICS / GLOBAL_GENERICS_V1: present
CDMO_CRAMS / CDMO_CRAMS_V1: present
```

Schema safety was rechecked read-only:
- reviewed lifecycle/provenance columns were present on both assignment tables;
- expected review-completeness, confidence, status, interval, foreign-key and non-overlap constraints were present;
- RLS was enabled on both assignment and secondary-exposure tables;
- role `authenticated` had `SELECT` only on both tables.

## Explicit owner authorization

The owner explicitly authorized only:

> Authorized production persistence of the reviewed TORNTPHARM Gate E assignment only: DOMESTIC_FORMULATIONS as the primary REVIEWED assignment, GLOBAL_GENERICS as MATERIAL, and CDMO_CRAMS as EMERGING, using the reviewed persistence candidate package.

No broader production authorization was inferred from that statement.

## Production persistence execution

After one final immediate read-only recheck confirmed the preflight was unchanged, the authorized transaction was executed against production project `uxiyufbsbgzzdujzcdxe`.

Created primary assignment:

```text
assignment_id: 2833dec7-466c-4491-9a0a-47693dce3673
security_id: da69b3eb-0343-44f8-912c-288b826118cc
primary_subprofile: DOMESTIC_FORMULATIONS
assignment_status: REVIEWED
confidence_state: HIGH
effective_from: 2026-03-31T00:00:00Z
reviewed_at: 2026-09-17T13:05:43Z
```

Created exactly two secondary exposures attached to that assignment:

```text
CDMO_CRAMS
materiality_state: EMERGING
confidence_state: MEDIUM
assignment_status: REVIEWED

GLOBAL_GENERICS
materiality_state: MATERIAL
confidence_state: MEDIUM
assignment_status: REVIEWED
```

## Immediate post-write production validation

Fresh read-only validation after commit confirmed:

```text
TORNTPHARM PHARMA assignment count: 1
attached secondary-exposure count: 2
unexpected secondary-exposure count: 0
primary exact-match validation: true
GLOBAL_GENERICS exact-match validation: true
CDMO_CRAMS exact-match validation: true
```

Therefore the committed production state exactly matches the owner-reviewed Gate E decision.

## Scope preserved after execution

The authorized write created only:
- one TORNTPHARM reviewed primary research-subprofile assignment;
- one TORNTPHARM `GLOBAL_GENERICS` reviewed secondary exposure;
- one TORNTPHARM `CDMO_CRAMS` reviewed secondary exposure.

No application deployment occurred, so the production UI will only display these new research-subprofile facts after the Research-header consumption code from this R4N branch is separately approved, merged/deployed, or otherwise released through the normal application deployment path.

## Gate status after persistence

- Human review: COMPLETE / APPROVED.
- Local reviewed persistence + UI proof: PASS.
- Persistence candidate script: PREPARED / LOCAL DRY-RUN PASS.
- Fresh production read-only preflight: PASS.
- Production persistence: COMPLETE.
- Immediate post-write validation: PASS.
- Production TORNTPHARM PHARMA assignment rows: 1.
- Production TORNTPHARM secondary-exposure rows: 2.
- PR #101 merge: NOT AUTHORIZED / NOT PERFORMED.
- Application deployment: NOT AUTHORIZED / NOT PERFORMED.
