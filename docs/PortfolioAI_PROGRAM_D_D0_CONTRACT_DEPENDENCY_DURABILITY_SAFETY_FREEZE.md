# PortfolioAI — Program D D0 Contract / Dependency / Durability / Safety Freeze

**Status:** COMPLETE / PASS / CLOSED  
**Date:** 25 September 2026  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Branch:** `program-d-operations-optional-ai`  
**Frozen Program D base:** `f7c6cf45e7ec1d1820173addea0e18f38f84a25a`  
**Authoritative master plan:** `docs/PortfolioAI_PROGRAM_D_MASTER_PLAN.md`  
**Machine-readable contract:** `src/features/operations/programD0Contract.ts`

---

## 1. D0 authority and stop boundary

The owner authorized **D0 only**.

D0 is architecture, audit and contract-freeze work. It does not authorize D1
or any operational activation.

D0 changes may define static contracts, dependency metadata and validation
fixtures. D0 may not execute providers, AI, schedulers, production mutation,
schema migration, deployment, branch merge or trading.

Frozen safety state:

```text
D0 = AUTHORIZED
D1 = NOT AUTHORIZED
D2 = NOT AUTHORIZED
D3 = NOT AUTHORIZED
D4 = NOT AUTHORIZED
D-FINAL = NOT AUTHORIZED

provider calls = 0
AI calls = 0
migration creation = 0
migration application = 0
scheduler activation = 0
production mutation = 0
deployment = 0
merge = 0
trading = 0
```

Program C remains frozen. No Program C engine semantics are changed by D0.

---

## 2. Repository audit conclusions

### 2.1 R6 current durability

The current Program B R6 execution path is explicitly read-only and
non-persisting.

The current code states:

```text
readOnly = true
nonPersisting = true
scorePersistence = false
```

R6 carries substantial lineage, including score run identity, evidence snapshot,
methodology version, assignment version and calculation version, but the current
Program B R6 execution output is not itself durable business state.

**D0 decision:** scheduled R11 may recompute R6 from complete canonical inputs
when its exact dependency fingerprint changes. D0 does not create R6
persistence.

### 2.2 R7 current durability

The current Program B R7 execution path is also non-persisting:

```text
persistedWrites = 0
recommendationPersistence = false
sizingPersistence = false
```

R7 carries source score run lineage and recommendation run identity, but the
current Program B R7 execution result is not durable authoritative state.

**D0 decision:** scheduled R11 may recompute R7 from a valid current R6 result
and complete R7 policy/profile/assignment inputs when its dependency fingerprint
changes. D0 does not create R7 persistence.

### 2.3 R8 current durability

Program C R8 is deterministic and non-persistent. It already has a frozen
sub-engine dependency contract covering:

- Core Health;
- Portfolio Fit;
- Portfolio Risk;
- Exit Intelligence.

Not every R8 sub-engine requires R7. Portfolio Fit and Portfolio Risk explicitly
do not require R7. Core Health and Exit Intelligence use R7 only as optional
context.

**D0 decision:** R11 must preserve this sub-engine dependency structure. It must
not turn R8 into a mandatory R6 → R7 → R8 cascade.

### 2.4 R9 current durability

Program C R9 keeps prior observed states and seen event identities in process
memory.

The complete `ProgramCR9ObservedState` includes semantic state and lineage
beyond its hash, including:

- classification version;
- research profile;
- methodology id/version/role;
- assignment id/version;
- evidence snapshot id;
- score and recommendation run ids;
- portfolio context snapshot id;
- R8 decision run id;
- R6/R7 states;
- R7 recommendation;
- R6 score;
- evidence/valuation/momentum state;
- R8 sub-engine dispositions;
- blocker keys;
- owner-context version.

The prior state is therefore not represented adequately by an identity/hash
alone.

Because current R6, R7 and R8 outputs are non-persisting, D0 cannot prove that a
previous complete semantic R9 observed state is exactly reconstructable after a
process restart from durable canonical history alone.

**D0 decision: R9 Model B is required for scheduled R11.**

A future minimal operational checkpoint must retain the complete previous
comparable semantic state needed by R9 plus identity, lineage, dependency hash
and successful processing checkpoint.

This is operational comparison state only. It is not a competing R9 materiality
authority.

No R9 checkpoint schema is created in D0. Creation and persistence require the
separate owner gates defined below.

### 2.5 R10 current durability

Program C R10 is reconstructed from current R8/R9/owner-threshold inputs and is
non-persistent.

**D0 decision:** core R11 will not require a durable R10 operational snapshot.

Failure behavior is frozen as:

```text
preserve canonical upstream facts
report operational failure or staleness
do not fabricate replacement R10 state
```

Any future non-authoritative R10 operational snapshot requires separate owner
approval and may never become the canonical Action Center.

---

## 3. R11 trigger taxonomy

The machine-readable taxonomy is frozen as:

1. `SCHEDULED_MAINTENANCE`
2. `CONDITION_STALENESS`
3. `CANONICAL_EVIDENCE_ACCEPTED`
4. `MARKET_DATA_ACCEPTED`
5. `OWNER_CONTEXT_CHANGED`
6. `METHODOLOGY_CHANGED`
7. `ASSIGNMENT_CHANGED`
8. `POLICY_CHANGED`
9. `MANUAL_REPLAY`
10. `BOUNDED_PILOT`

Provider-capable triggers may only **plan** provider acquisition in D0/D1.
Actual provider execution remains separately owner-gated and belongs no earlier
than a separately authorized bounded D2 pilot.

Every executor must re-evaluate execution gates at execution time. Queue-time
eligibility is not sufficient authority.

---

## 4. Dependency-driven R6–R10 DAG

The Program D machine-readable matrix freezes these nodes:

```text
R6
R7
R8_CORE_HEALTH
R8_PORTFOLIO_FIT
R8_PORTFOLIO_RISK
R8_EXIT_INTELLIGENCE
R9
R10
```

The matrix is dependency-driven rather than stage-order-driven.

Important examples:

- R7 depends on a valid R6 result.
- R8 Portfolio Fit does not require R7.
- R8 Portfolio Risk does not require R7.
- owner-context changes may affect Portfolio Fit and R10 without requiring a new
  provider acquisition.
- accepted market data may affect only the nodes that consume that market state.
- R9 depends on the complete current observed semantic state and an approved
  previous comparable state.
- R10 requires exact current R8/R9 lineage and owner-threshold context.

A changed random run id with otherwise identical semantics is not a dependency
change.

---

## 5. Recomputation and no-op contract

Every node must be keyed by a canonical dependency fingerprint.

Same semantic inputs and same contract/policy/engine versions must produce a
no-op rather than work.

Frozen no-op cases include:

- identical canonical dependency fingerprint;
- duplicate semantic trigger;
- unchanged accepted evidence;
- run-id-only change;
- unchanged owner context;
- unchanged methodology/assignment/policy version;
- already-current required market-history window;
- already-fresh research domain.

A no-op remains auditable operational state. It is not silently dropped.

---

## 6. Semantic job identity

Semantic identity is frozen as SHA-256 over canonical ordered fields:

```text
PROGRAM_D_D0_CONTRACT_VERSION
portfolio_id
normalized_subject_scope
trigger_type
canonical_dependency_fingerprint
policy_version_set
engine_version_set
```

A random job/run UUID is an execution-instance identity, not semantic
idempotency authority.

Program D must distinguish:

- semantic job identity;
- job/run instance identity;
- physical attempt identity;
- provider attempt identity;
- deterministic engine run identity.

This prevents retries/replays from becoming false semantic changes.

---

## 7. Existing provider-control reuse map

### Research / Trendlyne-style acquisition

Reuse:

- `provider_ingestion_controls`;
- `provider_usage_events`;
- `reserve_provider_budget_v1`;
- `settle_provider_budget_v1`;
- `data_ingestion_runs`;
- `data_ingestion_run_items`;
- `security_refresh_states`;
- `refresh_domain_policies`;
- `acquire_data_ingestion_lease_v1` and
  `release_data_ingestion_lease_v1` where their semantic scope matches.

D0 explicitly prohibits a duplicate provider budget or usage-accounting system.

### Market data / Angel One

Reuse:

- `market_data_refresh_runs`;
- `market_price_latest`;
- `market_price_history`;
- `market_metric_observations`;
- existing market-data operation lease/cooldown RPCs.

The market-data lease/cooldown path requires scheduler-oriented hardening review
in D1/D2 before automation, rather than replacement by an unrelated parallel
system.

### Program D-only operational requirements

Two semantics are genuinely new:

- deterministic-chain lease;
- general Program D operational ledger/checkpoint state.

Their persistence is separately gated. D0 only freezes the semantics.

---

## 8. Kill-switch contract

Execution checks are ordered:

```text
GLOBAL_AUTOMATION
→ PROVIDER
→ DOMAIN
```

A provider-backed executor must check all applicable switches immediately before
a physical attempt.

Changing a switch after planning but before execution must prevent the call.

Budget, lease and provider-capability gates remain independent of kill switches.

---

## 9. Lease / concurrency contract

Minimum semantics:

### Provider/acquisition lease

Identity includes provider + operation + bounded scope.

### Deterministic-chain lease

Identity includes portfolio + subject scope + semantic dependency generation.

All lease acquisition must be atomic.

Required behavior:

- one race winner;
- active leases cannot be stolen;
- release requires matching ownership;
- expired/stale lease recovery is explicit and audited;
- retry/replay cannot silently create a concurrent duplicate semantic execution.

Persistence design for a Program D deterministic-chain lease is D1 work and may
require a separately approved schema change.

---

## 10. Retry / failure / recovery

Automatically retryable classes are limited to bounded transient provider or
runtime failure.

No automatic retry for:

- authentication failure;
- authorization failure;
- budget denial;
- kill switch;
- identity/mapping conflict;
- provider-schema conflict;
- invalid canonical evidence;
- deterministic invalid input;
- authority conflict.

Exhausted work enters an explicit review/dead-letter state.

Accepted canonical evidence survives a later deterministic failure.

A restart resumes from the first incomplete eligible operational checkpoint; it
does not refetch accepted provider evidence merely because a downstream engine
failed.

Manual replay creates a linked audit instance and rechecks all execution gates.

---

## 11. Operational ledger semantics

D0 freezes the following operational states:

```text
PLANNED
QUEUED
RUNNING
NO_OP
SUCCEEDED
PARTIAL
FAILED
RETRY_SCHEDULED
RETRY_EXHAUSTED
BLOCKED_KILL_SWITCH
BLOCKED_BUDGET
BLOCKED_LEASE
BLOCKED_AUTHORITY
REVIEW_REQUIRED
```

The ledger records operational truth only. It must never store or manufacture a
competing investment conclusion.

A provider-acquisition result and a downstream deterministic result must remain
separately visible. For example, provider acceptance followed by R6 failure
cannot be collapsed into an ambiguous single success/failure flag.

---

## 12. Durability / restart matrix

| Domain | Durable today | Frozen D0 restart decision |
|---|---:|---|
| Research evidence | Yes | Reuse canonical durable state |
| Market history | Yes | Reuse canonical durable state |
| R6 result | No | Recompute from complete canonical inputs when eligible |
| R7 result | No | Recompute from valid current R6 + complete policy inputs |
| R8 result | No | Recompute from current canonical dependencies |
| R9 previous comparable semantic state | No | Model B minimal complete semantic checkpoint required |
| R9 ack/snooze/seen state | No | Deferred outside core R11 |
| R10 Action Center | No | Recompute; no core R11 durable snapshot |

This matrix is encoded in `programD0Contract.ts`.

---

## 13. Operational observability model

R11 operations must expose at minimum:

- current run/job state;
- semantic idempotency identity;
- trigger class and bounded scope;
- dependency fingerprint;
- provider plan versus physical attempts;
- budget reservation/settlement references where applicable;
- lease state;
- stages triggered and skipped;
- explicit no-op reason;
- partial acceptance;
- safe failure code;
- retry state;
- stale domains remaining;
- last successful provider refresh;
- last successful deterministic recomputation;
- R9 comparison-checkpoint health;
- R10 recomputation health;
- manual replay eligibility.

Operational health must be visually and semantically separate from R10
investment state.

---

## 14. Frozen R11 validation fixtures

D0 freezes local validation scenarios for:

- fresh/stale/missing/conflicting domains;
- global disabled;
- provider disabled;
- budget exhausted;
- lease occupied;
- partial provider success;
- unchanged input;
- changed dependency;
- downstream failure;
- restart/resume;
- duplicate trigger;
- market history empty/partial/current/gap/already-complete;
- R9 first observation/no change/raw immaterial change/meaningful
  change/incomparable/out-of-order.

The closed Program C 238-equity universe remains the Program C regression
fixture.

These fixtures are validation artifacts only and do not create live state.

---

## 15. R12 optionality contract

R12 remains optional and downstream.

Allowed lifecycle states:

```text
DISABLED
ON_DEMAND_ONLY
BOUNDED_PILOT
WEEKLY_SELECTED_SCOPE
```

If D3 is later authorized, the initial implementation mode is
`ON_DEMAND_ONLY`.

R6–R10 cannot depend on R12 availability or output.

R12 is not authorized by D0.

---

## 16. R12 deterministic fact-packet contract

The packet must be immutable and versioned and include at least:

- packet identity/version;
- portfolio/security identity;
- requested narrative type;
- canonical evidence references and provenance;
- R6 state and lineage;
- R7 state and lineage;
- R8 state and lineage;
- R9 comparison/event state;
- R10 canonical Action Center state and precedence;
- owner context;
- blockers/unknowns;
- contradictions;
- timestamps/freshness;
- display-safe source excerpts only.

Every packet field must be typed as one of:

```text
FACT
DETERMINISTIC_STATE
OWNER_CONTEXT
UNCERTAINTY
SOURCE_EXCERPT
```

AI output types remain only:

```text
AI_SUMMARY
AI_INTERPRETATION
```

---

## 17. R12 output and authority-conflict contract

R12 may explain deterministic facts but may not create:

- a score;
- recommendation authority;
- materiality authority;
- Action Center priority;
- target weight or sizing;
- buy/sell/add/trim/exit instruction;
- order/trade instruction.

Validation must reject unsupported facts, unsupported numbers and unresolved
citations.

If output proposes a competing R10 action/priority, a trade instruction or an
override of R6/R7/R8/R9/R10:

```text
validation_status = REJECTED_AUTHORITY_CONFLICT
```

That output may not surface as a valid Investment Committee conclusion.

---

## 18. Owner approval gates after D0

Separate explicit approval is required before:

1. D1 implementation;
2. migration creation;
3. local migration application;
4. remote migration application;
5. R9 comparison-checkpoint persistence;
6. R10 operational-snapshot persistence;
7. any real provider pilot;
8. Trendlyne automation;
9. Angel One automation;
10. automatic R6–R10 recomputation;
11. any scheduler enablement;
12. recurring provider spend;
13. starting R12;
14. any real AI-provider pilot;
15. scheduled/portfolio-wide AI;
16. notifications;
17. production-readiness declaration;
18. production enablement;
19. merge/deployment;
20. future trading capability.

One approval never implies another.

---

## 19. D0 validation contract

Before owner closure, the exact pulled branch state must pass local validation
appropriate to D0.

Required checks:

- D0 contract Vitest;
- relevant Program C regression tests;
- TypeScript/typecheck;
- architecture guard;
- lint for changed application files;
- production build where applicable;
- `git diff --check`;
- secret review;
- confirmation of no migration/schema delta;
- confirmation of zero provider/AI execution.

Local validation evidence must be appended to the cumulative handoff before D0
is presented for final owner closure.

---

## 20. D0 current stop point

At this repository checkpoint:

```text
D0 contract package = COMPLETE / PASS / CLOSED
local pull/validation = PASS
owner D0 closure = APPROVED

D1 = AUTHORIZED
```

No D1 orchestration implementation may begin until the owner reviews the
locally validated D0 result and explicitly authorizes D1.
