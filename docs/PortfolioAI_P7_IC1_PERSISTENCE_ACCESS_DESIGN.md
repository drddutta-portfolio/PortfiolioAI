# PortfolioAI — P7-IC IC1 Persistence / Access Design

**Status:** DESIGN ONLY / AWAITING SEPARATE IMPLEMENTATION APPROVAL  
**Date:** 29 September 2026  
**No migration file created. No DDL executed. No database write executed.**

## 1. Purpose

IC0 identified three persistence/access gaps that must be resolved at later checkpoint boundaries:
1. methodology requirement read models before provider-backed IC2;
2. canonical current evidence-snapshot persistence/access before IC3 PASS / IC-C;
3. durable R9 baseline/acknowledgement/snooze and multi-period Movement history before IC6 PASS / IC-E.

IC-A authorized architecture design only.

## 2. Methodology requirement read model — no migration required for IC2 planning

IC1 supplies a repository-versioned canonical contract:
- `PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json`;
- `PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json`.

The IC2 planner should read these artifacts and join them to existing cached evidence. This avoids creating a database table merely to describe code-owned methodology requirements.

Required read-model output per security:
```
security_id
profile_code
subprofile_code
methodology_authority
methodology_version
requirement_code / signal_code
required / N_A
minimum_history
freshness_policy
benchmark_authority
normalization_curve
evidence_state
selected_evidence_ids
deficit_state
recommended_next_evidence_action
```

No provider call may be made until this read model can enumerate the exact deficits.

## 3. Canonical current evidence snapshot — additive persistence design

Before IC3 can PASS, design requires immutable snapshot identity plus immutable selected items.

Proposed logical objects (names are design labels, not authorized DDL):

### research_evidence_snapshots
- id UUID PK
- portfolio_id UUID
- security_id UUID
- as_of_date DATE
- methodology_authority TEXT
- methodology_version TEXT
- profile_code TEXT
- subprofile_code TEXT nullable
- requirement_registry_version TEXT
- snapshot_status READY | INSUFFICIENT | STALE | CONFLICTING | REVIEW_REQUIRED
- snapshot_hash TEXT
- created_at timestamptz
- created_by UUID nullable

Identity uniqueness: security + as_of_date + methodology/version + requirement-registry version + snapshot hash. Snapshots are append-only.

### research_evidence_snapshot_items
- snapshot_id UUID
- requirement_code TEXT
- metric_code TEXT nullable
- applicability APPLICABLE | NOT_APPLICABLE
- evidence_state FRESH | STALE | MISSING | CONFLICTING | REVIEW_REQUIRED | NOT_APPLICABLE
- selected_evidence_id UUID nullable
- evidence_as_of_date DATE nullable
- retrieved_at timestamptz nullable
- fresh_through DATE nullable
- source_provider TEXT nullable
- raw_source_record_id UUID nullable
- normalized_value exact numeric/text nullable
- validation_state TEXT
- canonical_selection_state TEXT
- reason_code TEXT

No provider payload is duplicated when an immutable existing evidence/source record can be referenced.

### current_research_evidence_snapshot_v1
Security-invoker read model selecting the latest canonical accepted snapshot for the authorized owner/portfolio. It must never silently substitute a stale snapshot as fresh.

## 4. Durable R9 design

R9 needs durable comparison identity and user interaction state without mutating deterministic history.

### portfolio_intelligence_snapshots
Append-only deterministic portfolio/security decision state:
- security_id, portfolio_id, as_of
- source R6 run id
- source R7 run id
- source R8 state/version
- canonical machine state
- deterministic hash

### meaningful_change_events
Append-only event comparing two deterministic intelligence snapshots:
- prior_snapshot_id
- current_snapshot_id
- change_class / materiality
- changed_fields
- reason_codes
- detected_at

### meaningful_change_user_state
Mutable owner UI state only:
- event_id
- acknowledged_at/by
- snoozed_until
- note nullable

Acknowledgement/snooze must never alter the deterministic event itself.

## 5. Movement history design

### portfolio_movement_events
Append-only lifecycle projection:
- portfolio_id
- security_id
- from_role
- to_role
- movement_state
- effective_at
- source_r7_run_id
- source_r8_snapshot_id
- source_r9_event_id nullable
- policy_version
- reason_codes
- owner_role_at_projection
- created_at

Movement is advisory/deterministic history. It never writes the owner-controlled portfolio role and never executes a transaction.

The canonical internal action enum remains:
`ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`.

That action is projected only in IC6 from R7 + R8 + R9/Movement + owner context. It is not stored or emitted by IC1/IC5 as an owner-facing action.

## 6. RLS/access design

For any future exposed public-schema table:
- RLS enabled;
- authenticated owner access requires explicit portfolio ownership predicate, not `TO authenticated` alone;
- updateable user-state rows require both USING and WITH CHECK;
- immutable deterministic/evidence history has no browser UPDATE/DELETE policy;
- read views use `security_invoker = true`;
- service-only ingestion paths remain service-owned;
- no service-role credential enters the browser.

## 7. Approval boundary

This design does **not** authorize:
- migration creation;
- migration application;
- table/view/function creation;
- data backfill;
- provider calls;
- database writes;
- scheduler changes;
- deployment;
- Production change.

If IC-B accepts the architecture, any exact additive migration required for IC3 or IC6 must return to the owner as a separate migration approval package before a migration file is created or applied.
