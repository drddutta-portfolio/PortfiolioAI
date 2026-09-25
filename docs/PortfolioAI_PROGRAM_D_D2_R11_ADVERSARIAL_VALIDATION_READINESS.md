# PortfolioAI — Program D D2 R11 Adversarial Validation & Bounded-Pilot Readiness

**Status:** COMPLETE / PASS / CLOSED  
**Date:** 25 September 2026  
**Branch:** `program-d-operations-optional-ai`  
**Authority:** D2 only  
**Inherited state:** D0 = CLOSED; D1 = CLOSED

## 1. D2 purpose

D2 validates the local/provider-free R11 orchestration layer against the frozen
adversarial matrix and establishes bounded-pilot readiness.

D2 does **not** itself authorize or execute a real provider pilot.

## 2. Implemented adversarial validation matrix

The local D2 validation harness covers:

1. trigger determinism;
2. semantic idempotency;
3. duplicate suppression;
4. active lease race;
5. expired/stale lease recovery;
6. global/provider/domain kill switches;
7. provider budget fail-closed behavior;
8. bounded transient retries and retry exhaustion;
9. partial provider acceptance classification;
10. recovery/resume from partial deterministic work;
11. unchanged-input no-op;
12. dependency-matrix/topological routing;
13. recursive-trigger generation guard;
14. stale-domain-only acquisition planning;
15. incremental market-history planning;
16. no owner mutation;
17. no trade/order path;
18. operational audit completeness;
19. R9 baseline durability semantics;
20. R10 authority preservation;
21. zero physical provider-call invariant.

Program C regression remains part of the required local validation suite before
D2 closure.

## 3. Kill-switch / budget / recursion preflight

The local D2 gate evaluator fails closed in this order:

```text
GLOBAL_AUTOMATION
PROVIDER
DOMAIN
RECURSIVE_TRIGGER_GENERATION
PROVIDER_BUDGET
```

Possible local decisions:

```text
ELIGIBLE_DRY_RUN
BLOCKED_GLOBAL_KILL_SWITCH
BLOCKED_PROVIDER_KILL_SWITCH
BLOCKED_DOMAIN_KILL_SWITCH
BLOCKED_RECURSIVE_TRIGGER
BLOCKED_BUDGET
```

No decision executes an external call.

## 4. Bounded retry semantics

D2 validates bounded transient retry behavior:

```text
maximum attempts = 1 initial attempt + maximumRetries
```

If transient failures exceed the available attempt ceiling:

```text
terminal state = RETRY_EXHAUSTED
```

Non-retryable classes remain governed by the D0 frozen contract and are not
promoted into automatic retry.

## 5. Partial acceptance

D2 freezes batch outcome classification:

```text
all accepted   -> SUCCEEDED
mixed          -> PARTIAL
none accepted  -> FAILED
```

A mixed provider result is never collapsed into SUCCESS.

This is classification-only local validation; D2 makes no provider call.

## 6. Lease race and stale recovery

Active foreign local leases block execution and are not stolen.

D2 adds a local expired-lease recovery helper for validation:

- the lease must exist;
- its `acquiredAt` timestamp must be valid;
- the age must exceed the explicit stale threshold;
- only then may the disposable local lease be removed.

This is not production lease persistence and does not create a migration.

## 7. Stale-domain-only provider planning

D2 validates that only stale/missing domains are included in acquisition
planning. Fresh domains remain excluded.

Example:

```text
IDENTITY      FRESH
FUNDAMENTALS  STALE
OWNERSHIP     FRESH
DOCUMENTS     MISSING

planned domains:
DOCUMENTS
FUNDAMENTALS
```

## 8. Incremental history planning

D2 reuses the existing Program A market-history planner.

Validated semantics include:

- no history -> full backfill plan;
- required lookback gap -> full target range;
- latest-candle gap -> overlap-bounded incremental request;
- current history -> zero-call no-op.

D2 does not call Angel One.

## 9. R9 / R10 preservation

D2 retains the D0 frozen decisions:

```text
R9:
MODEL_B_MINIMAL_COMPLETE_SEMANTIC_CHECKPOINT_REQUIRED
persistence = separately gated

R10:
canonical authority = R10_RECOMPUTATION
core R11 durable snapshot = not required
```

No D2 code creates R9 persistence or a competing R10 snapshot authority.

## 10. Owner and trading authority

D2 validation asserts that orchestration does not change owner-controlled role or
weight fields.

D2 emits no order/trade action and contains no broker-order execution path.

## 11. Bounded-pilot readiness contract

D2 marks the implementation:

```text
READY_FOR_OWNER_AUTHORIZATION
```

for a future separately authorized bounded provider pilot.

This does **not** mean provider execution is authorized.

A real pilot requires a new owner decision specifying all of:

```text
EXACT_PROVIDER
EXACT_SECURITIES
EXACT_DOMAINS
EXACT_PHYSICAL_CALL_CEILING
EXACT_BUDGET_CEILING
MANUAL_START
POST_RUN_REVIEW
```

Mandatory preconditions remain:

- D2 local adversarial validation passes;
- global/provider/domain gates rechecked at execution time;
- atomic provider budget reservation;
- approved provider capability only;
- exact identity verification;
- canonical evidence acceptance before downstream recomputation;
- no automatic production scheduler.

## 12. Operations UI

The authenticated `/app/operations` surface now includes:

- a D2 adversarial validation runner;
- per-check PASS/FAIL cards;
- bounded-pilot readiness state;
- explicit “Real provider execution: Not authorized” display;
- exact pilot inputs still required;
- existing D1 disposable operational ledger and fixtures.

The UI remains separate from investment conclusions.

## 13. Files added / changed

Added:

```text
src/features/operations/programD2Validation.ts
src/features/operations/programD2Validation.test.ts
docs/PortfolioAI_PROGRAM_D_D2_R11_ADVERSARIAL_VALIDATION_READINESS.md
```

Changed:

```text
src/features/operations/programD1Runtime.ts
src/pages/OperationsPage.tsx
src/features/operations/programD1Operations.css
```

The D1 runtime change is limited to a local expired-lease recovery helper used
for D2 adversarial validation.

## 14. Required local validation before D2 closure

- pull exact D2 branch HEAD;
- local Supabase/Vite healthy;
- open `/app/operations`;
- run D2 adversarial validation matrix;
- all D2 local cards PASS;
- real provider execution still shown as NOT AUTHORIZED;
- physical provider calls remain 0;
- D2 tests pass;
- D1/D0/Program C regressions pass;
- market-history planner regression passes;
- targeted lint passes;
- typecheck passes;
- architecture guard passes;
- production build passes;
- `git diff --check` passes;
- local working-tree audit shows no D2 drift.

A real provider pilot is not required to close the local adversarial-validation
portion. Whether to authorize a bounded pilot is a separate owner decision
inside D2.

## 15. Current checkpoint

```text
D0 = COMPLETE / PASS / CLOSED
D1 = COMPLETE / PASS / CLOSED
D2 = COMPLETE / PASS / CLOSED

real provider pilot = NOT AUTHORIZED
provider calls = 0
migration = NOT AUTHORIZED
scheduler = NOT AUTHORIZED
production = NOT AUTHORIZED
D3 / R12 = AUTHORIZED
trading = NOT AUTHORIZED
```


## 16. Validation result

```text
D2 = COMPLETE / PASS / CLOSED
R11 = COMPLETE / PASS / CLOSED
real bounded provider pilot = NOT RUN / NOT AUTHORIZED
D3 / R12 = AUTHORIZED
```
