# PortfolioAI P8 completion build handoff plan

Date: 30 September 2026  
Target: `PortfolioAI-Development` only  
Starting commit: `c7e6495b2d6e9463826b420e84d56e7b78f42137`  
Purpose: implementation-ready handoff from completed P8-A through P8-FINAL  
Current gate: **BLOCKED — DATA FOUNDATION**

## 1. Authoritative starting state

- P7 / P7-IC / IC-FINAL: COMPLETE / PASS / CLOSED.
- Owner Checkpoint 6: APPROVED / CLOSED.
- P8-0: COMPLETE / PASS.
- P8-A: COMPLETE / PASS as a read-only sufficiency inventory.
- P8-B: NOT STARTED / awaiting an owner-approved remediation and experiment scope.
- P8-C through P8-FINAL: NOT STARTED / NOT AUTHORIZED by P8-A alone.
- Production and `main`: unchanged.

The P8-A audit is `docs/p8/PortfolioAI_P8_A_HISTORICAL_DATA_SUFFICIENCY_AUDIT_2026-09-30.json`. Re-read it and remeasure the hosted Development state before relying on any count in this handoff.

## 2. Non-negotiable product and research constraints

1. Use only information provably available at or before each simulated decision instant.
2. Never project current holdings, classifications, methodologies, fundamentals, documents or later provider revisions backward.
3. Preserve raw observations, source identity, retrieval time, publication time, transformations and immutable history.
4. Treat unknown publication/availability time as ineligible, not as an estimated date.
5. Use a historically eligible, survivor-free universe including delisted/inactive securities where the approved universe requires them.
6. Separate signal time from every forward outcome window.
7. Keep deterministic calculations outside UI components and AI synthesis.
8. A backtest result cannot mutate live R6–R10 policy, owner roles, sizing, actions or transactions.
9. No headline performance claim may omit coverage, exclusions, costs, turnover, benchmark, drawdown and limitations.
10. All database changes require separately approved, additive migrations; local replay must pass before hosted Development application.
11. Every exposed table requires owner-scoped RLS. Views must use `security_invoker`; privileged functions must be service-only and explicitly revoke default `PUBLIC` execution.
12. No Production or `main` change is permitted during this plan.

## 3. Owner decisions required before implementation

The implementing agent must not infer these choices. Present a decision memo and obtain explicit approval for one coherent contract.

### 3.1 Recommended bounded first experiment

The recommended first experiment is deliberately narrower than the eventual product:

- **Universe:** historically listed NSE equities covered by the approved listing authority, not today's holdings.
- **Period:** the longest common verified interval that supplies at least 24 monthly decision dates; target three years if the authorities can support it. If fewer than 24 dates can be proven, stop rather than weaken the gate.
- **Decision calendar:** monthly, last eligible trading session of each month, evaluated after market close.
- **Signal lag:** use each input only from the first decision instant strictly after its provable publication/availability time.
- **Forward horizons:** 1, 3, 6 and 12 months where complete; primary horizon must be selected before seeing results.
- **Primary benchmark:** NIFTY 500 total-return or the closest approved total-return authority. Price-only benchmark history must be labelled and cannot silently stand in for total return.
- **Secondary benchmarks:** approved sector benchmark mapped by historical classification, plus cash/risk-free only if a dated authority is approved.
- **Costs:** freeze brokerage, taxes, slippage, liquidity and turnover assumptions before replay; report zero-cost results only as a sensitivity, never the primary claim.
- **Corporate actions:** adjusted prices must come from an approved split/bonus/dividend/delisting authority. Do not synthesize adjustments from unexplained discontinuities.
- **Missing data:** fail closed per security/date/requirement. No cross-security imputation and no conversion of unknown to zero.
- **Methodology:** freeze an immutable historical P8 methodology version derived from the approved R6–R10 contracts. Do not change thresholds after inspecting outcomes.
- **Holdout:** reserve the most recent eligible portion before any threshold comparison; recommended split is 60% development, 20% validation and 20% untouched holdout, subject to adequate sample depth.

### 3.2 Explicit approval checklist

- historical universe/listing authority;
- experiment start/end dates and minimum number of decision dates;
- decision calendar and time zone;
- primary outcome horizon and secondary horizons;
- benchmark and currency policy;
- corporate-action/adjusted-price authority;
- fundamental and document authorities plus quota/budget limits;
- costs, slippage, liquidity and turnover assumptions;
- missing-data/exclusion policy;
- methodology and classification version policy;
- train/validation/holdout split;
- provider-call budget and allowed campaign windows;
- permission to create local migrations;
- separate permission to apply each migration to hosted PortfolioAI Dev;
- explicit authorization to start P8-C after P8-B passes.

## 4. Proposed execution sequence

### Stage P8-B0 — Re-entry and immutable baseline

**Actions**

1. Verify branch, remote head, clean worktree and hosted project identity.
2. Read `AGENTS.md` and all canonical architecture/status/P8 documents in authority order.
3. Rerun the P8-A inventory read-only and compare fingerprints/counts.
4. Capture schema, migration, Edge Function and relevant RLS/view/function versions.
5. Record provider ledger/quota state without making provider calls.
6. Create a new immutable baseline audit containing query definitions and timestamps.

**Proof required**

- repository and hosted Development state are identified exactly;
- no drift invalidates the P8-A findings;
- zero mutation occurred.

**STOP/GO:** stop on unexplained drift. Proceed only when the baseline is reproducible.

### Stage P8-B1 — Freeze the experiment and bias-control contract

Create a versioned contract defining every owner choice in section 3, plus:

- stable `experiment_id`, `methodology_version`, `universe_version`, `classification_version`, `benchmark_version` and `cost_model_version`;
- decision-instant definition and calendar generation rule;
- point-in-time eligibility predicate for every evidence domain;
- deterministic exclusion reason enum;
- forward-window boundary rule;
- reproducibility input fingerprint;
- allowed metrics and prohibited claims;
- multiple-testing, sensitivity and holdout rules;
- a rule that results cannot promote live policy automatically.

Implement this first as a pure TypeScript contract with unit tests and documentation. Do not acquire data or run returns yet.

**Acceptance criteria**

- contract decisions are complete and contain no `TBD` affecting results;
- timestamp boundary tests cover before/equal/after publication, later retrieval, unknown time and overlapping outcomes;
- identical contract inputs produce an identical fingerprint;
- owner approves the frozen contract.

**STOP/GO:** owner approval is required before remediation campaigns or schema application.

### Stage P8-B2 — Historical universe and listing validity foundation

This is the first data dependency because every other acquisition must be scoped to the correct historical universe.

**Likely additive objects**

- immutable listing/universe observations with source, observed/published/retrieved timestamps and content hash;
- versioned universe membership selections with `valid_from`/`valid_to` or decision-date membership events;
- delisting/inactive status evidence;
- a `security_invoker` owner-scoped current/historical read model;
- service-only append/select functions with append-only enforcement.

Do not overwrite current `securities.active` or invent validity dates. Link corrections explicitly.

**Tests**

- listed before decision, listed after decision, delisted before outcome, relisting, symbol change and missing validity;
- current members are not silently members on earlier dates;
- RLS isolation, anonymous denial, authenticated ownership and service-only writes;
- append idempotency and deterministic selection.

**Gate B2:** every approved decision date can reconstruct an eligible universe, or reports a deterministic global blocker. Survivor-only reconstruction is forbidden.

### Stage P8-B3 — Corporate actions and adjusted market history

Acquire and preserve raw price and corporate-action evidence from the approved authorities. Compute adjusted series deterministically with documented precision and rounding.

**Required behavior**

- retain raw OHLCV unchanged;
- store each action with stable identity, ex/effective dates, terms, provenance and retrieval time;
- version adjustment factors and distinguish price return from total return;
- cover splits, bonus issues, dividends if total return is claimed, mergers/demergers, symbol changes and delistings;
- reject unexplained discontinuities rather than auto-classifying them as actions;
- align benchmark treatment with the equity return definition.

**Gate B3:** hand-verifiable adjustment fixtures and repeatability pass; every eligible security/date is adjusted or has an explicit blocker; benchmark periods align exactly.

### Stage P8-B4 — Point-in-time fundamentals and document history

Run bounded, resumable acquisition only after owner approves authorities and quota. Use cache-first recovery and immutable append semantics.

**Required fields**

- security and source identity;
- reporting period and fiscal basis;
- source publication time, provider observation time and retrieval time;
- raw value, unit/currency/scale, normalized value and transformation version;
- document type, source URL/reference and content hash where lawful/available;
- amendment/restatement links without overwriting the original.

Unknown publication time remains ineligible. Provider `updated_at` is not automatically publication time.

**Operational controls**

- one campaign ID, fixed source cutoff and evaluation timestamp;
- per-slice grants and quota ledger;
- dry-run manifest before calls;
- resume without duplicate observations;
- canary cohort before full campaign;
- daily safe-stop below the approved quota reserve.

**Gate B4:** required domain/date coverage meets the frozen contract; unresolved gaps yield deterministic exclusions; replaying the campaign creates no duplicates or changed fingerprints.

### Stage P8-B5 — Classification, methodology and assignment validity

Create immutable historical validity for sector/industry/basic-industry/business-model/subprofile, methodology profile, assignment and thresholds. A current assignment cannot be backdated without dated evidence.

**Gate B5:** every eligible security/decision date resolves one and only one versioned classification/methodology path, or an explicit fail-closed blocker. No overlapping validity intervals.

### Stage P8-B6 — Canonical historical snapshot materialization

Materialize decision-date snapshots only from inputs that passed B2–B5. Keep content identity separate from canonical selection history, following the proven IC2/IC3 append-and-select pattern.

Each snapshot must bind:

- experiment and decision instant;
- universe membership evidence;
- source cutoff;
- evidence item identities and availability times;
- classification/methodology/assignment/threshold versions;
- benchmark and cost-model versions;
- eligibility/exclusion disposition;
- deterministic content and selection fingerprints.

**Gate B6:** all expected security/date pairs have either one canonical snapshot or one explicit exclusion; no duplicates; no future evidence; repeated materialization produces zero new content/selections and the same fingerprint.

### Stage P8-B-FINAL — Data-foundation closure audit

Produce matrices by domain, decision date and security; quantify coverage and exclusions; prove RLS, immutability, idempotency and no look-ahead. Browser UI should show coverage only, not performance.

**PASS condition**

- the minimum approved number of decision dates exists;
- historical universe is survivor-free under the approved authority;
- adjustment and benchmark contracts pass;
- point-in-time evidence and version lineage are complete enough for the frozen experiment;
- every gap is explicit and within the approved exclusion ceiling;
- the holdout remains untouched;
- owner approves transition to P8-C.

If these conditions fail, P8-B closes as BLOCKED with exact evidence; do not weaken the contract after seeing coverage.

### Stage P8-C — Pure deterministic replay engine

Build a side-effect-free engine that consumes only the canonical P8-B snapshots and frozen contract. It must reproduce the historical R6–R10 path without querying current-state fallbacks.

**Outputs per security/date**

- eligibility/exclusion;
- frozen R6 components and disposition;
- R7 candidacy/sizing-readiness disposition;
- R8 domains;
- R9 meaningful-change relation to the previous eligible state;
- Movement;
- canonical action projection;
- exact lineage and blocker reasons.

**Gate C:** golden fixtures, boundary cases, repeated-run equivalence and full input/output fingerprints pass. No portfolio performance calculation yet.

### Stage P8-D — Portfolio simulation and benchmark comparison

Add portfolio construction only after Gate C. Keep signal generation, portfolio construction and performance accounting as separate deterministic modules.

Required capabilities include lagged execution, cash, position constraints, liquidity, costs, turnover, corporate actions, delistings, benchmark alignment and exact decimal arithmetic. Define rounding once and test it with hand-verifiable ledgers.

**Gate D:** accounting identities reconcile for every period; no future price enters execution; benchmark calendars align; zero-cost and stressed-cost sensitivities are separately labelled.

### Stage P8-E — Validation and adversarial review

Run development, validation and untouched holdout once under the frozen contract. Test:

- look-ahead leakage and retrieval/publication confusion;
- survivorship and delisting treatment;
- revised/restated evidence;
- missing periods and stale observations;
- classification drift;
- threshold perturbations;
- cost/liquidity stress;
- benchmark substitutions;
- subperiod and sector concentration;
- multiple comparisons and small-sample instability;
- deterministic repeatability.

**Gate E:** publish both favourable and adverse findings. Any contract change creates a new experiment version; the original holdout result remains immutable.

### Stage P8-F — Results UI and interpretation

Build UI only from approved read models/view models. Show methodology and experiment version, sample dates, universe, coverage, exclusions, benchmark, return definition, costs, turnover, drawdown, sensitivity, holdout separation and limitations.

AI may explain deterministic results but must not calculate metrics, choose a winning variant or change policy. The UI must keep results unavailable while any upstream gate is blocked.

**Gate F:** accessibility, loading/empty/error/partial states, cross-surface consistency, authenticated browser verification and zero application console errors.

### Stage P8-FINAL — Owner checkpoint

Deliver an immutable completion audit containing repository commit, migrations, hosted versions, run fingerprints, experiment contract, coverage, exclusions, all metrics, adversarial findings and known limitations.

P8-FINAL does not itself change live policy. Any methodology change must be proposed as a separately versioned, owner-approved program and independently validated before Production consideration.

## 5. Migration and deployment protocol

For each schema stage:

1. inspect current schema/data/RLS and identify the canonical authority;
2. obtain explicit approval to create the local migration;
3. create a new additive migration—never edit an applied migration;
4. replay from a clean local database and run SQL/RLS/immutability/idempotency tests;
5. run schema diff, migration list, lint/advisors and regenerate database types;
6. present the exact migration and preservation counts;
7. obtain separate explicit approval to apply that migration to hosted PortfolioAI Dev;
8. capture before/after fingerprints and row counts;
9. run a canary and stop on divergence;
10. deploy only the Development function/application versions needed by that stage;
11. never use a broad remote push when migration history aliases could replay unrelated migrations.

## 6. Required verification at every implementation checkpoint

- targeted unit/integration/regression tests;
- hand-verifiable financial fixtures where calculations change;
- `npm run typecheck`;
- scoped ESLint and repository lint status disclosure;
- `npm run check:architecture`;
- relevant SQL, RLS and security tests;
- migration replay/diff/lint when applicable;
- production build;
- `git diff --check` and secret scan;
- authenticated Development browser verification for UI stages;
- exact database/provider/migration/deployment mutation report;
- Development Status and stage audit/handoff update;
- focused commit pushed to `PortfolioAI-Development`.

## 7. Safe-stop and handoff rules

Stop safely when the five-hour Codex remaining allowance reaches 10% or the weekly remaining allowance reaches 3%, as previously instructed by the owner. Before stopping:

1. finish or roll back the current atomic operation;
2. do not leave a half-applied migration or ambiguous campaign slice;
3. run the checks possible for the completed scope;
4. commit and push coherent verified work to `PortfolioAI-Development`;
5. record exact commit, hosted versions, migration state, provider ledger, counts and fingerprints;
6. state the first unexecuted step and every approval still required;
7. keep Production and `main` unchanged.

## 8. Exact first action for the receiving ChatGPT build session

Perform **Stage P8-B0 only**: verify the repository is at `c7e6495b2d6e9463826b420e84d56e7b78f42137` or identify later authorized commits, read the authoritative documents, remeasure the hosted Development P8-A inventory without mutation, and produce the owner decision memo for section 3. Do not create a migration, call a provider, acquire history or start P8-C until that memo is approved.

## 9. Ready-to-paste receiving prompt

```text
Continue PortfolioAI P8 from the repository-backed handoff:

docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md

Repository: drddutta-portfolio/PortfiolioAI
Branch: PortfolioAI-Development
Expected starting commit: c7e6495b2d6e9463826b420e84d56e7b78f42137
Hosted Development Supabase project: PortfolioAI Dev (lrgpjimipfkyoqbpsqzz)

P7 is COMPLETE/CLOSED. P8-0 and P8-A are COMPLETE/PASS. The current P8 gate is BLOCKED — DATA FOUNDATION. P8-B and later stages have not started.

First perform Stage P8-B0 exactly as written: re-enter the real repository and hosted Development state, read all authoritative documents, rerun the P8-A inventory read-only, and prepare the explicit owner decision memo for the P8-B contract. Do not infer owner choices.

Do not create/apply a migration, call providers, write to the database, start replay/performance work, modify Production/main, or begin P8-C without the separate approvals required by the handoff. Preserve immutable history, provenance, RLS, point-in-time eligibility and survivor-free-universe requirements.

If five-hour remaining credit reaches 10% or weekly remaining credit reaches 3%, stop safely, push only coherent verified work to PortfolioAI-Development, and create a complete handoff.
```

## 10. Governance state at handoff

```text
P7 = COMPLETE / PASS / CLOSED
Owner Checkpoint 6 = APPROVED / CLOSED
P8 = ACTIVE
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B = NOT STARTED / AWAITING OWNER-APPROVED REMEDIATION + EXPERIMENT CONTRACT
P8-C+ = NOT STARTED / NOT AUTHORIZED
P8 execution gate = BLOCKED — DATA FOUNDATION
Production = UNCHANGED
main = UNCHANGED
```
