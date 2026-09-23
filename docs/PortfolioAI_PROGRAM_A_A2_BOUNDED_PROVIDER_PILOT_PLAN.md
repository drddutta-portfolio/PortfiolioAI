# PortfolioAI — Program A · Checkpoint A2 Plan

**Canonical file:** `docs/PortfolioAI_PROGRAM_A_A2_BOUNDED_PROVIDER_PILOT_PLAN.md`  
**Program:** A — Evidence Coverage  
**Checkpoint:** A2 — Prerequisite-First Bounded Provider Pilot  
**Starting branch:** `program-a-evidence-coverage`  
**A1 status:** COMPLETE / PASS / CLOSED  
**A2 status:** FROZEN FOR IMPLEMENTATION  
**Provider execution:** NOT AUTHORIZED UNTIL OWNER APPROVES AN EXACT GENERATED PLAN  
**Production mutation:** PROHIBITED

---

## 1. Purpose

A1 proved the cache-only planning/materialization architecture and exposed the first real local data constraints.

Accepted A1 runtime cohort:
- six holdings in `LOCAL UI Research Review`;
- eligible = 1;
- review required = 5;
- projected Trendlyne calls = 2;
- projected Angel One security requests = 1;
- actual calls/budget/writes = 0.

The main blocker is therefore not broad evidence scarcity yet. It is **classification readiness** for five holdings.

A2 is the first bounded provider-backed checkpoint and must proceed prerequisite-first.

---

## 2. A2 sequence

```text
A1 real baseline
      ↓
A2 PLAN
      ↓
classification blockers first
      ↓
re-materialize cache-only baseline
      ↓
bounded R3 evidence pilot
      ↓
bounded R5 market-history pilot
      ↓
re-materialize / validate
      ↓
STOP
```

No score, recommendation or sizing activation occurs in A2.

---

## 3. Mandatory PLAN → APPROVE → EXECUTE contract

A2 must implement two explicit modes:

### PLAN
- read current local cache;
- identify exact symbols/security IDs;
- identify exact provider actions;
- estimate exact physical calls;
- show stop conditions;
- perform **zero external provider calls**;
- perform zero writes except ephemeral local planning output if needed.

### EXECUTE
- unavailable unless the owner supplies the exact confirmation token defined by A2;
- execution must refuse to start if current cache state differs materially from the approved plan;
- execution must enforce all cohort and call ceilings at runtime;
- execution must stop on the first hard safety/provider-control failure.

Codex may build PLAN and EXECUTE capability, but Codex must **not run EXECUTE** during implementation.

The owner will first run PLAN locally, return the output to ChatGPT, and explicitly approve or reject provider execution.

---

## 4. A2A — Classification prerequisite pilot

### Goal

Resolve the five `REVIEW_REQUIRED` holdings in the accepted A1 local cohort where missing/incomplete canonical sector/industry prevents methodology routing.

### Source

Use only the already-reviewed classification/enrichment provider path currently present in PortfolioAI.

Trendlyne may supply classification only if the existing reviewed adapter/capability supports the required sector/industry fields.

Do not create a new scraping path in A2.

### Cohort ceiling

Maximum:
- **5 securities**;
- only securities currently `REVIEW_REQUIRED` because classification is missing/incomplete;
- no already-resolved security should be refreshed merely for convenience.

### Call ceiling

Hard maximum:
- **5 physical Trendlyne classification calls**, and preferably fewer if the existing provider response can resolve multiple required fields in one call.

The generated PLAN must show the estimated physical call count before approval.

### Writes

Provider results may be persisted **only to the existing local canonical classification/enrichment cache path** already authorized by the architecture.

No production write.

No new scoring assignment may be created merely because a provider returned a sector label.

After A2A:
- re-run the A1 cache-only materializer;
- methodology routing must still be determined by canonical routing/review rules;
- conflicts must become `REVIEW_REQUIRED`, never guessed.

---

## 5. A2B — Bounded R3 evidence pilot

A2B starts only after A2A re-materialization.

### Eligibility

Only holdings whose post-A2A state is:
- equity;
- methodology `AVAILABLE`;
- not classification-review blocked.

### Cohort ceiling

Maximum:
- **3 securities** total.

Prefer deterministic selection from the A1/A2 baseline:
1. highest portfolio-weight eligible holding if authoritative weight is available;
2. otherwise first deterministic eligible supported holding;
3. at least one non-Pharma K4 holding if one is eligible;
4. include a stale/missing evidence case.

Do not hard-code ticker methodology.

### Evidence scope

Refresh only already-approved/missing/stale R3 domains whose current adapters can satisfy them without inventing new semantics.

Initial allowed Trendlyne-backed domains:
- fundamentals;
- ownership/shareholding;
- approved valuation inputs;
- documents only if the existing adapter/path is already operational and the PLAN shows the call separately.

External ratings:
- no new provider path may be invented in A2;
- remain missing if no approved provider adapter exists.

Business durability:
- no fabricated provider mapping;
- remains honestly missing unless existing canonical materialization becomes available through already-approved evidence.

### R3 physical-call ceiling

Hard maximum for A2B:
- **6 Trendlyne physical calls total**.

Shared responses must be deduplicated where the existing adapter supports it.

A2A + A2B combined Trendlyne hard ceiling:
- **10 physical calls**.

If the PLAN estimates more than 10, execution must refuse and require a new owner-approved checkpoint.

---

## 6. A2C — Bounded R5 market-history pilot

### Cohort ceiling

Maximum:
- **3 eligible equities**.

Prefer:
1. one partial-history case;
2. one full-backfill case if present;
3. one benchmark-dependent case if an implemented benchmark adapter exists.

If the local cohort contains fewer eligible cases, execute fewer.

### Provider

Angel One remains the market-history authority.

### Window

Use the A1 incremental-history planner.

Do not use a blind fixed 400-day refresh when partial/current history exists.

### Request ceiling

Hard maximum:
- **3 security history requests**;
- **2 benchmark history requests**;
- **5 Angel One historical requests total**.

If the existing provider API requires chunking, the generated PLAN must show the actual physical request count after chunking. If it exceeds 5, execution must stop before calling the provider and return `CALL_BUDGET_EXCEEDED`.

---

## 7. Provider-control requirements

Reuse existing provider-control infrastructure where present:

- freshness / next-eligible-refresh rules;
- lease / duplicate-run prevention;
- retry/backoff contract;
- provider-call accounting;
- call budget;
- run lineage;
- explicit PLAN vs EXECUTE mode;
- idempotent persistence.

Do not bypass the existing provider control plane with direct ad-hoc HTTP calls.

### Retry limit

For this first pilot:
- at most **1 retry** after an initial transient failure;
- no retry for authentication, schema, mapping conflict, quota/budget or safety errors.

Retries count toward the physical-call ceiling.

---

## 8. Hard stop conditions

Execution must stop immediately on:

- classification conflict;
- ambiguous provider identity;
- authentication/configuration failure;
- provider schema/capability mismatch;
- call budget exceeded;
- unexpected production database target;
- stale approved plan / material cache drift;
- lease conflict / concurrent execution;
- provider returning an unsupported or contradictory classification;
- any attempt to activate scoring/recommendation/sizing;
- any unplanned provider endpoint.

Partial successful evidence already written locally may remain if writes are idempotent and traceable, but the run must report `PARTIAL_STOPPED`.

---

## 9. Local-only database boundary

A2 provider execution may write only to the existing **local Supabase** development database/cache.

Execution must refuse non-local database targets.

Expected local database:
- localhost / 127.0.0.1;
- Supabase local Postgres port 54322 where applicable.

No production Supabase mutation.

---

## 10. A2 output

PLAN output must include:

- baseline version/as-of;
- exact cohort;
- exact symbols/security IDs;
- reason each security was selected;
- provider;
- endpoint/capability/action;
- domain or history window;
- estimated physical calls;
- per-provider totals;
- hard ceilings;
- stop conditions;
- confirmation token required for EXECUTE;
- providerCalls actually made = 0.

EXECUTE result must include:

- approved-plan hash/id;
- actual calls by provider;
- retries;
- rows/evidence/history persisted locally;
- conflicts;
- failures;
- stop reason;
- post-execution cache-only A1 baseline summary;
- provider budget used;
- writes count;
- proof of no score/recommendation/sizing activation.

---

## 11. Post-execution validation

After any owner-approved EXECUTE:

1. re-run A1 local materializer;
2. compare before/after classification states;
3. compare before/after R3 domain states;
4. compare before/after R5 history states;
5. confirm K4 remains `AVAILABLE + PENDING_ADAPTER`;
6. confirm no GENERAL numeric scoring;
7. confirm PHARMA/BANK existing behavior unchanged;
8. confirm NBFC remains fail-closed;
9. run targeted regression tests;
10. TypeScript;
11. architecture guard;
12. changed-file lint;
13. build.

---

## 12. A2 implementation deliverables

Codex should implement:

1. reusable A2 plan builder;
2. exact cohort selector from the current A1 baseline;
3. provider-call estimator with hard ceilings;
4. local-only execution guard;
5. stale-plan/cache-drift guard;
6. existing-provider-control-plane integration;
7. classification prerequisite executor using existing approved adapter;
8. R3 bounded executor using existing approved adapters;
9. R5 bounded Angel One executor using incremental windows;
10. structured execution result;
11. local CLI/shell entry point with `PLAN` and `EXECUTE`;
12. tests.

Do not duplicate A1 planners.

---

## 13. Codex implementation validation

Codex may:
- run PLAN;
- run mocks/tests;
- run cache-only/local read validation.

Codex must NOT:
- run real provider EXECUTE;
- consume Trendlyne calls;
- consume Angel One calls.

Required before commit:
- A1 tests pass;
- A2 tests pass;
- Gate-K/K-FINAL relevant regressions pass;
- TypeScript pass;
- architecture guard pass;
- changed-file lint pass;
- build pass.

---

## 14. Documentation ownership

Codex must NOT update:
- `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`;
- `docs/PortfolioAI_Development_Status.md`;
- `docs/PortfolioAI_POST_GATE_K_FORTHCOMING_ACTION_PLAN.md`.

ChatGPT updates canonical status after diff audit and owner validation.

---

## 15. A2 acceptance

A2 is not complete merely because the executor is implemented.

Formal sequence:

```text
A2 implementation PASS
        ↓
owner runs PLAN
        ↓
ChatGPT audits exact plan
        ↓
owner explicitly approves EXECUTE
        ↓
owner runs bounded EXECUTE
        ↓
post-execution validation
        ↓
A2 COMPLETE / PASS / CLOSED
```

Until explicit owner approval:

**Provider execution = NOT AUTHORIZED.**

---

## 16. Safety boundary

Still prohibited:
- production mutation;
- production migration;
- score persistence/activation;
- recommendation persistence/activation;
- sizing persistence/activation;
- scheduler changes;
- AI activation;
- deployment;
- PR merge;
- automatic trading.
