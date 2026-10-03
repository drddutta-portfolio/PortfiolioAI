# PortfolioAI P8-B6 canonical historical snapshot materialization plan

Date: 3 October 2026
Environment: PortfolioAI Dev only
Branch: PortfolioAI-Development
Experiment: P8_EXP_NSE_MONTHLY_6M_V1

## Authority

Master plan:
docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md

Frozen versions:
- experiment_id = P8_EXP_NSE_MONTHLY_6M_V1
- methodology_version = P8_R6_R10_REPLAY_V1
- universe_version = P8_NSE_HISTORICAL_UNIVERSE_V1
- classification_version = P8_HISTORICAL_CLASSIFICATION_V1
- benchmark_version = P8_NIFTY500_TRI_V1
- cost_model_version = P8_COST_MODEL_V1
- decision_calendar_version = P8_MONTH_END_IST_V1

## B6 rule

For every 4,524 historical identities × 32 frozen decision dates, emit exactly one canonical B6 disposition.

A row is replay-ready only if all upstream gates required by the frozen experiment resolve. Otherwise it is a canonical exclusion.

B6 does not repair B2-B5 blockers and does not query current-state fallback.

## Bound inputs

Each pair binds:
- historical identity ID + historical ISIN + identity hash;
- B2 universe run ID, run hash, source cutoff, universe version;
- B4 FUNDAMENTAL selection fingerprint and disposition;
- B4 DOCUMENT selection fingerprint and disposition;
- B5 deterministic historical assignment fingerprint and primary blocker;
- frozen methodology/classification/benchmark/cost/calendar version IDs.

Because B5 has zero fully resolved historical paths, all 144,768 B6 rows are expected to be canonical exclusions. B6 must not invent replay-ready snapshots.

## Compact persistence

To remain below the Dev storage target, physical persistence is identity-vector based:

public.p8_b6_canonical_snapshot_vectors

One physical row per historical identity:
- ordered 32-decision snapshot fingerprints concatenated as 32 × 32-byte SHA-256;
- ordered 32-decision B6 exclusion codes as 32 bytes;
- aggregate identity fingerprint.

The decoded canonical interface:

public.p8_b6_canonical_historical_snapshots_v1

expands those vectors against the frozen 32 B2 universe runs and exposes exactly 144,768 logical rows.

## B6 exclusion precedence

1 B5_NO_CANONICAL_LINK
2 B5_NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION
3 B5_CLASSIFICATION_VALIDITY_UNPROVEN
4 B5_CLASSIFICATION_CONFLICT_OR_OVERLAP
5 B5_METHODOLOGY_ASSIGNMENT_MISSING
6 B5_METHODOLOGY_ASSIGNMENT_OVERLAP
7 B5_APPROVED_THRESHOLD_VERSION_MISSING
8 B5_SUBPROFILE_REQUIRED_UNRESOLVED
9 B4_FUNDAMENTAL_INELIGIBLE
10 B4_DOCUMENT_INELIGIBLE
11 B2_RUN_NOT_READY
0 REPLAY_READY

B5 blockers take precedence because a blocked historical classification/methodology path makes replay ineligible regardless of downstream market/evidence availability.

## Closure

- 4,524 physical identity vectors;
- each vector exactly 1,024 fingerprint bytes + 32 exclusion bytes;
- decoded logical rows exactly 144,768;
- exactly one pair fingerprint per identity/date;
- no duplicate logical keys;
- no replay-ready row if an upstream blocker exists;
- source replay equals materialized view;
- aggregate fingerprint stable;
- RLS enabled, public client access denied;
- no provider calls;
- no Production/main changes;
- P8-B-FINAL not started.
