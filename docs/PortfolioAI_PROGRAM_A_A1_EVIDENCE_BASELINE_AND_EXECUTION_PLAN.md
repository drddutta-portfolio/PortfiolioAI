# PortfolioAI — Program A · Checkpoint A1 Plan

**Canonical file:** `docs/PortfolioAI_PROGRAM_A_A1_EVIDENCE_BASELINE_AND_EXECUTION_PLAN.md`  
**Program:** A — Evidence Coverage  
**Checkpoint:** A1 — Read-only Evidence Baseline & Execution Contract Freeze  
**Branch:** `program-a-evidence-coverage`  
**Starting commit:** `239c209005b549ce4c6eff260d284091afe972fc`  
**Status:** FROZEN FOR IMPLEMENTATION  
**Provider execution:** PROHIBITED  
**Production mutation:** PROHIBITED

---

## 1. Purpose

A1 is the first post-Gate-K implementation checkpoint.

Its job is to establish a trustworthy, reproducible, **cache-only baseline** for Program A before any Trendlyne or Angel One breadth execution occurs.

A1 must answer:

1. Which current holdings are eligible for Program A?
2. Which R3 research domains are already fresh, stale, missing, conflicting, review-required, or not applicable?
3. Which R5 market-history inputs already exist and which are missing?
4. Which supported Gate-K methodology/profile requirements are blocked by evidence gaps?
5. What provider work would be required later, and at what projected call cost?
6. What bounded pilot cohorts should be used in the next checkpoint?
7. What benchmark/history prerequisites must exist before market-derived scoring inputs can become usable?

A1 must not fetch new external evidence.

---

## 2. Hard boundary

A1 is a **read-only planning + contract-freeze checkpoint**.

A1 may:
- read existing canonical local/cache data;
- inspect current holdings/classification/profile routing;
- compute coverage states from stored evidence;
- compute projected provider-call requirements;
- define bounded cohort proposals;
- define benchmark/history requirements;
- add pure planning/helper code;
- add read-only UI/CLI/report surfaces if they consume existing data only;
- add tests for planning, coverage classification, incremental history-range planning, and budget estimation;
- improve purely local/in-memory derivation tests.

A1 may not:
- call Trendlyne;
- call Angel One;
- call NSE or any other provider;
- mutate production Supabase;
- apply production migrations;
- create broad provider runs;
- persist scores;
- persist recommendations;
- persist sizing assessments;
- activate schedulers;
- activate AI;
- alter portfolio holdings/roles/targets;
- deploy;
- merge PRs;
- trade.

---

## 3. Mandatory Codex pre-build planning verification

Before writing code, Codex must read:

1. `docs/PortfolioAI_POST_GATE_K_FORTHCOMING_ACTION_PLAN.md`
2. `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`
3. `docs/PortfolioAI_POST_GATE_K_ARCHITECTURE_AND_ROADMAP_AUDIT.md`
4. this A1 plan
5. `docs/PortfolioAI_Integration_and_Execution_Plan.md`
6. `docs/PortfolioAI_Research_and_Intelligence_Architecture.md`
7. current R3/R5-related implementation files

Codex must then perform a **bounded pre-build verification** and report only:

- whether the A1 plan matches the current repository;
- any concrete contradiction that would make implementation unsafe;
- any exact file/module that should be reused instead of duplicated;
- the minimal intended file-change set.

### Pre-build stop rule

Codex must STOP before coding only if it finds one of these:

- the branch/head does not match the expected Program A baseline;
- A1 would require a production/provider action despite the plan prohibiting it;
- an existing canonical module already does the exact planned job and implementing another would duplicate authority;
- a required contract is internally contradictory and cannot be resolved without an architecture decision;
- a safety boundary would be violated.

Minor naming differences, stale comments, or non-blocking technical debt are **not** reasons to stop.

The pre-build verification is not an open-ended audit and must not expand scope.

If no hard blocker exists, Codex should proceed directly into implementation in the same task.

---

## 4. A1 workstream A — Current portfolio eligibility baseline

Create a reusable read-only Program A portfolio baseline derived from current canonical holdings/classification.

For every current holding determine:

- asset eligibility;
- current canonical sector;
- current canonical industry;
- resolved research profile/subprofile;
- Gate-K methodology state;
- score-execution state;
- whether R3 applies;
- whether R5 applies;
- reason for exclusion or review.

Required explicit states:

```text
ELIGIBLE
NOT_APPLICABLE
METHODOLOGY_NOT_AVAILABLE
REVIEW_REQUIRED
```

ETF/non-equity handling must remain explicit.

No ticker-specific methodology rules.

---

## 5. A1 workstream B — R3 evidence coverage baseline

Use existing canonical evidence stores and coverage/freshness contracts.

For each eligible holding/profile/domain classify stored research evidence as:

```text
FRESH
STALE
MISSING
CONFLICTING
REVIEW_REQUIRED
NOT_APPLICABLE
READY_TO_DERIVE
```

At minimum inspect existing authorities for:

- fundamentals;
- ownership/shareholding;
- external ratings where applicable;
- documents / official evidence where the profile requires them;
- valuation inputs;
- durability/business-model evidence where represented canonically;
- other profile-mandatory domains already defined by Gate K contracts.

Do not invent new metric semantics simply to improve coverage.

### Required R3 output

A deterministic read-only matrix:

```text
Security
Profile
Domain
Coverage state
Freshness
Authority/source
Blocking reason
Estimated refresh action
Projected provider-call count
```

Projected call counts must be estimates only.

---

## 6. A1 workstream C — R5 market-history baseline

Inspect the existing market-history foundation.

For each eligible equity determine:

- Angel One identity/mapping readiness;
- earliest/latest stored candle;
- history depth;
- whether the target lookback is already satisfied;
- missing interval if incremental fetch were later authorized;
- derived metric availability;
- benchmark dependency;
- benchmark-history readiness.

### Incremental-window contract

A1 must define and test a pure function that calculates the missing historical interval from:

- requested lookback target;
- current date/as-of date;
- latest stored candle;
- minimum overlap needed for safe reconciliation.

It must **not** always default to a fixed 400-day refetch when existing history is present.

No provider call is allowed in A1.

### Initial market-derived requirements to inventory

Where relevant to current Gate-K methodologies:

- 6M momentum/return;
- 12M momentum/return;
- 1Y drawdown;
- 1Y volatility;
- relative strength;
- benchmark-relative volatility/risk;
- benchmark readiness.

A1 does not need to add every possible technical indicator.

---

## 7. A1 workstream D — Benchmark authority inventory

Build a read-only inventory of benchmark dependencies from the current engine/profile registry.

For every supported profile requiring a benchmark, report:

- benchmark authority name;
- benchmark type;
- whether current benchmark identity/history support exists;
- whether benchmark history is missing;
- whether the dependency blocks a derived metric or only enriches context.

Do not fabricate a benchmark mapping.

BANK must preserve NIFTY Bank authority.

NBFC_LENDING remains pending/fail-closed.

---

## 8. A1 workstream E — Provider-cost projection

Using existing provider-budget/freshness/control-plane abstractions, produce projected work only.

For R3:
- count holdings/domains likely needing refresh;
- estimate physical Trendlyne calls under current reviewed domain contracts;
- distinguish shared-call vs per-security estimates where existing adapter behavior supports that distinction.

For R5:
- count holdings requiring history backfill;
- classify full-backfill vs incremental;
- estimate Angel One historical requests using the current API contract;
- include benchmark-history requests separately.

No budget reservation or usage event may be written in A1.

---

## 9. A1 workstream F — Pilot cohort proposal

A1 must produce a deterministic proposal for the next Program A execution checkpoint.

The proposal should include:

### R3 pilot
A small multi-sector cohort containing:
- at least one high-weight supported holding;
- at least one non-Pharma K4 holding;
- at least one holding expected to remain blocked/review-required;
- at least one case with stale/missing evidence.

### R5 pilot
A small cohort containing:
- one security with existing partial history;
- one security needing a larger backfill;
- one benchmark-dependent case;
- one deliberately blocked identity/benchmark case if present.

The exact symbols must be derived from current portfolio data, not hard-coded into methodology code.

---

## 10. A1 workstream G — Validation and regression

Required validation:

- A1 unit tests;
- current Gate-K/K-FINAL regression relevant to routing/fail-closed behavior;
- scoring-resolution regression proving K4 remains `PENDING_ADAPTER`;
- TypeScript;
- architecture guard;
- targeted market-history planning tests;
- targeted coverage/budget planning tests;
- production build if preceding checks pass.

Do not run provider-backed integration tests.

Do not require full-repository lint to be green if failures are pre-existing and unrelated; any new/changed files should be lint-clean where practical.

---

## 11. A1 deliverables

A1 must leave the repository with:

1. a reusable Program A portfolio eligibility baseline;
2. an R3 evidence coverage planner/report;
3. an R5 market-history coverage planner/report;
4. pure incremental history-range planning logic;
5. benchmark dependency inventory;
6. projected provider-call budget report;
7. proposed bounded R3/R5 pilot cohorts;
8. tests proving deterministic planning behavior;
9. no provider calls;
10. no production changes.

Preferred outputs should be reusable by later Program A checkpoints rather than one-off scripts.

---

## 12. Acceptance conditions

A1 passes only if:

1. every current holding gets an explicit Program A eligibility state;
2. every eligible R3 domain gets an explicit coverage state;
3. every eligible R5 security gets an explicit history/mapping state;
4. incremental history planning no longer assumes fixed 400-day refetch for already-covered securities;
5. benchmark dependencies are explicit and non-fabricated;
6. projected provider work is quantified without executing it;
7. pilot cohorts are deterministic and bounded;
8. unsupported/review-required methodology remains fail-closed;
9. completed K4 engines remain `AVAILABLE + PENDING_ADAPTER`;
10. PHARMA/BANK existing scoring paths remain unchanged;
11. NBFC_LENDING remains fail-closed;
12. no score/recommendation/sizing persistence is introduced;
13. no scheduler/AI/deployment/merge/trading action occurs;
14. TypeScript passes;
15. architecture guard passes;
16. targeted regressions pass;
17. production build passes if the repository remains buildable.

---

## 13. A1 non-goals

A1 does not:
- execute Trendlyne breadth;
- execute Angel One breadth;
- add new sector scoring formulas;
- activate K4 live scoring;
- calibrate recommendation thresholds;
- create recommendations;
- run D35B sizing;
- build Core Health/Exit/Portfolio Fit;
- schedule anything;
- use AI for investment conclusions.

---

## 14. A1 completion vocabulary

If all acceptance conditions pass:

```text
Program A · A1 = COMPLETE / PASS / CLOSED
Program A = IN PROGRESS
Provider execution = STILL NOT AUTHORIZED
```

The next checkpoint should then be separately planned and approved for the first bounded provider-backed execution cohort.

---

## 15. Current status

```text
Program A branch = CREATED
A1 plan = FROZEN
A1 implementation = NOT STARTED
Codex pre-build plan verification = REQUIRED
Provider execution = NOT AUTHORIZED
```
