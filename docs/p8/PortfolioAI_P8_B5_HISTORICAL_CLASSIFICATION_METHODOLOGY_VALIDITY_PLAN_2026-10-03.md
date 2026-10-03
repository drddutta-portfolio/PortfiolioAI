# PortfolioAI P8-B5 historical classification / methodology validity execution plan

Date: 3 October 2026
Environment: PortfolioAI Dev only
Branch: PortfolioAI-Development
Experiment: P8_EXP_NSE_MONTHLY_6M_V1
Authority: docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md
Frozen experiment contract: P8_EXPERIMENT_BIAS_CONTROL_V1

## Purpose

P8-B5 proves, for each historical identity / decision-date pair, whether one and only one classification -> methodology -> assignment -> threshold path was provably valid at that decision instant. It must never backdate the current V1/V2 classification state, the current P7-IC1 methodology registry, or present-day thresholds.

The gate is structurally complete when every pair has either:
- one deterministic valid historical path; or
- one explicit fail-closed blocker.

Coverage sufficiency is assessed later at P8-B-FINAL. B5 must not weaken the contract merely to improve coverage.

## Frozen evidence rules

### Classification

A classification component can be historical-valid only when:
1. the historical identity has an exact canonical security link;
2. both SECTOR and INDUSTRY evidence existed strictly before the decision;
3. the evidence carries an explicit validity start at or before the decision;
4. valid_to is null or after the decision;
5. applicable evidence at the same level is non-overlapping / deterministic.

Observed/retrieved timestamps alone prove availability, not how far backward a current classification applies.
Current classification may never be projected backward.

### Methodology assignment

A DB methodology assignment is historically available only when:
- assignment_status = REVIEWED;
- assigned_at < decision_at;
- reviewed_at < decision_at.

The P7-IC1 portfolio methodology registry has asOfDate 2026-09-29 and is a current-state authority. It is not backdated into earlier decisions and is not considered strictly-before the 2026-09-29 decision without a proven time-of-day.

### Threshold / recommendation policy

A DB policy is eligible only when:
- the corresponding reviewed methodology assignment is eligible;
- policy created_at < decision_at;
- status = APPROVED.

DRAFT policies are not historical threshold authority.

### Subprofile

A reviewed subprofile is available only when:
- effective_from < decision_at;
- reviewed_at < decision_at;
- created_at < decision_at;
- effective_to is null or after decision_at.

Subprofile availability does not cure missing historical economic classification.

## Baseline

Historical identities: 4,524
Decision dates: 32
Identity/date pairs: 144,768

Classification evidence:
- SECTOR observations: 300; valid_from present: 0
- INDUSTRY observations: 250; valid_from present: 0
- all current sector/industry observations were observed/retrieved in September 2026

Pair blocker census before materialization:
- NO_CANONICAL_LINK: 136,384
- NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION: 8,145
- CLASSIFICATION_VALIDITY_UNPROVEN: 239

Component evidence:
- reviewed methodology identity/date pairs available strictly before decision: 4
- approved threshold/policy pairs: 0
- reviewed dated subprofile pairs: 1

## Materialized contract

Create service/internal table:
public.p8_b5_historical_assignment_validity

One row per historical identity / decision date.

State codes:

classification_state:
- 0 NO_CANONICAL_LINK
- 1 NO_COMPLETE_PRE_DECISION_EVIDENCE
- 2 EVIDENCE_PRESENT_VALIDITY_UNPROVEN
- 3 RESOLVED
- 4 CONFLICTING_OR_OVERLAPPING

methodology_state:
- 0 NO_CANONICAL_LINK
- 1 NO_REVIEWED_PRE_DECISION_ASSIGNMENT
- 2 REVIEWED_ASSIGNMENT_AVAILABLE
- 3 OVERLAPPING_ASSIGNMENTS

threshold_state:
- 0 NO_ELIGIBLE_METHODOLOGY
- 1 NO_APPROVED_PRE_DECISION_POLICY
- 2 APPROVED_POLICY_AVAILABLE

subprofile_state:
- 0 NOT_PROVEN_OR_NOT_REQUIRED
- 1 REVIEWED_EFFECTIVE_ASSIGNMENT_AVAILABLE
- 2 CONFLICTING_OR_OVERLAPPING

path_state:
- 0 BLOCKED
- 1 RESOLVED

primary_blocker_code:
- 1 NO_CANONICAL_LINK
- 2 NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION
- 3 CLASSIFICATION_VALIDITY_UNPROVEN
- 4 CLASSIFICATION_CONFLICT_OR_OVERLAP
- 5 METHODOLOGY_ASSIGNMENT_MISSING
- 6 METHODOLOGY_ASSIGNMENT_OVERLAP
- 7 APPROVED_THRESHOLD_VERSION_MISSING
- 8 SUBPROFILE_REQUIRED_UNRESOLVED
- 0 NONE

Rows carry deterministic SHA-256 fingerprints. Re-execution is append-idempotent.

## B5 closure requirements

- exactly 144,768 rows;
- exactly 144,768 distinct logical keys;
- no duplicate identity/date;
- no path marked RESOLVED unless every required component is historically valid;
- current P7 methodology registry never backdated;
- current classification never backdated;
- overlap/conflict census explicit;
- deterministic aggregate fingerprint stable on replay;
- RLS enabled; anon/authenticated access revoked;
- no provider calls;
- no Production/main changes;
- B6 not started.

