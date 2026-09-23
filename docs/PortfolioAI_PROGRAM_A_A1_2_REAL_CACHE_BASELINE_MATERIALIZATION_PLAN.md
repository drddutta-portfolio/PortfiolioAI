# PortfolioAI — Program A · Checkpoint A1.2 Plan

**Canonical file:** `docs/PortfolioAI_PROGRAM_A_A1_2_REAL_CACHE_BASELINE_MATERIALIZATION_PLAN.md`  
**Program:** A — Evidence Coverage  
**Checkpoint:** A1.2 — Real Cache-Only Baseline Materialization  
**Branch:** `program-a-evidence-coverage`  
**Starting implementation commit:** `a8ed4867801abee34d3d9ab84c9cbdadbf5ad287`  
**Status:** FROZEN FOR IMPLEMENTATION  
**Provider execution:** PROHIBITED  
**Production mutation:** PROHIBITED

---

## 1. Why A1.2 exists

A1.1 successfully implemented and validated the reusable Program A planning engine:

- eligibility resolver;
- R3 coverage planner;
- R5 market-history planner;
- incremental-history window planning;
- benchmark inventory;
- provider-cost projection;
- pilot-cohort selection.

However, A1.1 still requires caller-supplied planning inputs.

A1.2 completes the original A1 objective by materializing those inputs from the **actual current canonical cache/read-only sources** and producing the first real Program A baseline for the current portfolio.

A1.2 is not a new architecture stage. It is the materialization half of A1.

---

## 2. Hard boundary

A1.2 may:

- read the current portfolio coverage registry;
- read current cached/canonical evidence state;
- read current stored market history and market metrics;
- read current classification/profile/assignment state;
- derive Program A planner inputs;
- generate the real cache-only A1 baseline;
- produce a deterministic machine-readable and human-readable report;
- produce the real bounded R3/R5 pilot proposal;
- produce projected provider-call counts.

A1.2 may not:

- call Trendlyne;
- call Angel One;
- call NSE;
- execute provider refresh;
- reserve provider budget;
- record provider usage;
- mutate production;
- create/apply production migrations;
- persist scores/recommendations/sizing;
- activate schedulers;
- activate AI;
- deploy;
- merge;
- trade.

---

## 3. Mandatory Codex pre-build verification

Before coding, Codex must read:

1. `docs/PortfolioAI_PROGRAM_A_A1_EVIDENCE_BASELINE_AND_EXECUTION_PLAN.md`
2. this A1.2 plan
3. `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`
4. `docs/PortfolioAI_POST_GATE_K_FORTHCOMING_ACTION_PLAN.md`
5. `src/features/research/programAA1EvidenceBaseline.ts`
6. `src/features/research/programAMarketHistoryPlanner.ts`
7. `src/data/portfolioCoverageRegistryRepository.ts`
8. current cached evidence/market repositories and relevant read-only Edge Function contracts.

This check is bounded.

Codex should stop only if real materialization would require a prohibited provider/production action or duplicate an existing canonical materializer.

Otherwise proceed directly.

---

## 4. A1.2 primary deliverable

Build a reusable **cache-only materializer** that produces `ProgramAHoldingInput[]` and `BenchmarkRuntimeEvidence[]` from actual stored/read-only data.

Preferred architecture:

```text
Current portfolio
      ↓
portfolio-coverage-registry / canonical cached stores
      ↓
A1.2 materializer
      ↓
ProgramAHoldingInput[]
BenchmarkRuntimeEvidence[]
      ↓
buildProgramAA1Baseline()
      ↓
real Program A A1 baseline report
```

Do not duplicate Gate-K routing or A1.1 planning logic.

---

## 5. Portfolio source

Use the existing owner-scoped read-only Portfolio Coverage Registry as the primary portfolio/control-plane source.

For every returned record, materialize:

- portfolio weight from current holdings/valuation cache if available;
- canonical classification;
- reviewed scoring assignment;
- methodology/profile routing;
- current coverage states;
- market-history stored range;
- score/recommendation lineage only as context.

If portfolio weight is not available from the coverage registry itself, use the existing canonical portfolio read model. Do not add a new independent portfolio calculation.

---

## 6. R3 domain materialization

Map actual stored/cached evidence into the A1.1 canonical R3 domains.

At minimum:

### FUNDAMENTALS
Use current fundamentals coverage + canonical observation/decision state.

### OWNERSHIP
Use current ownership/shareholding coverage.

### EXTERNAL_RATINGS
Determine applicability from existing scoring/profile contracts.
Read only current canonical ratings evidence.
Do not mark applicable where the methodology does not require it.

### DOCUMENTS
Use current document coverage and existing official-document evidence state.

### VALUATION
Derive readiness only from already-approved canonical valuation evidence/inputs.
Do not invent new valuation semantics.

### BUSINESS_DURABILITY
Use existing reviewed durability evidence/contracts where already represented.
If not materialized in a canonical store for a profile, mark the domain honestly rather than fabricate readiness.

### OTHER_MANDATORY_PROFILE_EVIDENCE
Use only where an existing approved profile contract defines additional mandatory evidence.

For each domain generate:

- state;
- freshUntil;
- authoritySource;
- blockingReason;
- estimatedRefreshAction;
- projectedProviderCalls;
- sharedCallKey;
- derivableFromStoredEvidence where appropriate.

Provider-call estimates must reflect existing reviewed adapter behavior, not guesses.

---

## 7. R5 materialization

For each eligible equity:

- map Angel One identity readiness from existing canonical identity/mapping state;
- use stored earliest/latest candle from canonical market history;
- enumerate already-derived market metrics from `market_metric_observations`;
- apply A1.1 incremental-window logic;
- preserve required lookback/overlap contract;
- map benchmark evidence only for benchmarks whose identity/history support actually exists.

Do not invoke `refresh-market-history` EXECUTE.

If an existing PLAN action can be proven zero-provider and read-only, prefer direct cache queries/materialization over invoking it unless necessary.

---

## 8. Benchmark runtime evidence

Materialize actual runtime evidence for currently implemented benchmark adapters only.

At minimum preserve:

- BANK → NIFTY Bank;
- Pharma → NIFTY Pharma if the current adapter/store supports it;
- K4 benchmark authorities remain explicit but `implementationSupport=false` until adapters genuinely exist;
- NBFC_LENDING remains pending.

Do not manufacture K4 benchmark identity from authority strings.

---

## 9. Actual A1 report

Create a deterministic report generator for one portfolio.

The report should contain:

### Summary
- total holdings;
- eligible equities;
- not applicable;
- methodology unavailable;
- review required.

### R3
- domain state counts;
- holdings requiring refresh;
- projected Trendlyne calls;
- conflict/review blockers.

### R5
- identity-ready holdings;
- full backfills;
- incremental refreshes;
- already-current histories;
- benchmark requests;
- blocked identities/benchmarks.

### Pilot proposal
- selected R3 pilot candidates + criterion;
- selected R5 pilot candidates + criterion.

### Safety
- actual provider calls = 0;
- budget consumed = 0;
- writes = 0.

Preferred outputs:
- structured JSON object;
- human-readable text/markdown renderer or CLI-friendly formatter.

No persistence is required.

---

## 10. Real-data validation

A1.2 must be validated against the owner's actual local/cache-only environment.

Required checks:

1. actual current coverage registry can be read;
2. every current holding maps to exactly one A1 eligibility state;
3. every eligible holding receives complete required planner inputs;
4. no duplicate R3 domains;
5. market-history windows are deterministic;
6. provider-call projection is non-negative and traceable;
7. no provider execution occurs;
8. actual pilot proposal is bounded;
9. K4 remains AVAILABLE + PENDING_ADAPTER;
10. unsupported/review-required remains fail-closed.

If local credentials/environment are needed only to read local Supabase/cache, use the existing local setup.

Do not use production.

---

## 11. Validation suite

Run:

- A1.1 tests;
- A1.2 materializer/report tests;
- relevant R2 coverage registry tests;
- relevant scoring-resolution/Gate-K fail-closed tests;
- relevant market-history repository/planner tests;
- TypeScript;
- architecture guard;
- changed-file lint;
- build.

No provider-backed execution tests.

---

## 12. Documentation rule

Codex must NOT update:

- cumulative handoff;
- post-K canonical action plan;
- Development Status.

ChatGPT owns canonical status/closure updates after diff audit and owner-local validation.

---

## 13. Acceptance conditions

A1.2 passes when:

1. the A1.1 planner is fed from actual canonical cache/read-only data;
2. the real current portfolio baseline is produced;
3. actual R3/R5 coverage summaries are produced;
4. actual projected provider-call counts are produced without calls;
5. actual bounded pilot candidates are produced;
6. no fabricated evidence/benchmark mapping is introduced;
7. provider calls remain zero;
8. production writes remain zero;
9. all required validation passes.

Then:

```text
A1.1 = COMPLETE / PASS
A1.2 = COMPLETE / PASS
Program A · A1 = COMPLETE / PASS / CLOSED
Provider execution = STILL NOT AUTHORIZED
```
