## Baseline Freeze and V1-1 audit overlay — 5 October 2026

The Current Development Baseline Freeze and V1-1 Operational Baseline Audit have now been executed under read-only/documentation authorization.

- Baseline Freeze: **PARTIAL**
- V1-1 audit: **COMPLETE FOR AVAILABLE READ-ONLY EVIDENCE**
- Scope Freeze B: **INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY**
- V1 implementation: **NOT AUTHORIZED**

Use:
- [Current Development Baseline Freeze](PortfolioAI_CURRENT_DEVELOPMENT_BASELINE_FREEZE_2026-10-05.md)
- [V1 Operational Baseline Audit](PortfolioAI_V1_OPERATIONAL_BASELINE_AUDIT_2026-10-05.md)
- [V1 Scope Freeze B and Build Plan](PortfolioAI_V1_SCOPE_FREEZE_B_AND_BUILD_PLAN_2026-10-05.md)

The old R1–R12 roadmap below remains architectural/history context and does not supersede the ten V1 gates. P8 is preserved/paused for future V2. The immediate critical path is to close the explicit Scope Freeze B evidence gaps, not to resume old roadmap execution or P8 campaigns.

---

# PortfolioAI Integration and Execution Plan

**Status:** Owner-review plan; no production implementation is authorized by this document alone.  
**Purpose:** Reconcile the canonical architecture with the actual implementation state, connect the existing pieces in a controlled sequence, and prevent future work from drifting into disconnected pilots or UI-only completion claims.  
**Authority:** This plan is subordinate to `PortfolioAI_Master_Blueprint.md`, `PortfolioAI_Research_and_Intelligence_Architecture.md`, `PortfolioAI_Database_Architecture.md`, `PortfolioAI_Development_Rules.md`, and `PortfolioAI_Product_UI_and_Decision_Workflow.md`. It does not redefine those documents.

---

## Scope Freeze A current delivery directive — 5 October 2026

The active delivery direction is now governed by [PortfolioAI V1/V1.1/V2 Product Scope Freeze A](PortfolioAI_V1_V2_PRODUCT_SCOPE_FREEZE_2026-10-05.md).

This Integration Plan remains valuable architectural/history context, but it does not authorize continuing its older roadmap as the current critical path when that would conflict with Scope Freeze A release sequencing.

Current sequence:

1. verify Development environment isolation **before any mutable backend/provider execution**;
2. verify the actual Development/P8 baseline;
3. complete V1-1 Operational Baseline Audit;
4. establish the dated acceptance inventory, supported profiles, acceptance cohort, usable-intelligence count/value denominators and thresholds, maintenance mechanism, gate completion contracts and effort estimates;
5. owner approves Scope Freeze B;
6. only then begin V1 implementation.

P8 expansion is not deleted or invalidated. Its final `PAUSED / PRESERVED FOR V2` disposition remains conditional on Development-branch baseline verification.

No Production/main mutation is authorized by this directive.

---

## 1. Why this plan is needed now

PortfolioAI has reached a transition point. The transaction ledger, accounting, current-price integration, canonical classifications, research storage, provider control plane, Research workspace, NSE News pipeline, Dashboard redesign and a reference-stock investment-intelligence path have all advanced substantially. However, the implementation is no longer moving strictly in the original stage order.

That is not automatically a problem: several detours produced useful reference implementations, especially HDFCBANK scoring/recommendation work, automated NSE News and the Dashboard intelligence surfaces. The risk now is declaring a downstream capability “complete” when only one stock or one domain has the required inputs.

The objective from this point forward is therefore:

> **Connect the existing proven components into one portfolio-wide, source-aware, freshness-aware, budget-aware, deterministic execution chain without discarding successful pilot work or weakening evidence standards.**

---

## 2. Canonical rules that remain unchanged

The following rules are non-negotiable throughout this roadmap:

1. Transactions remain the source of truth for holdings.
2. Angel One remains the primary market-price / daily-OHLCV authority.
3. Trendlyne remains a structured research-evidence provider only for reviewed contracts.
4. NSE/official sources remain authoritative for the official News pipeline already implemented.
5. Missing data stays missing; it must never silently become zero or a guessed value.
6. Raw evidence, normalized/derived data, deterministic scores/states, and explanations remain separate layers.
7. Every deterministic engine must be reproducible, versioned and tested.
8. AI may explain and synthesize but may not replace Layer-1–3 calculations or mutate holdings, transactions, roles, themes or targets autonomously.
9. Equity-specific engines must not be applied to ETFs/non-equity assets without an explicit contract.
10. Reduce/Trim due to sizing/valuation is distinct from Exit due to thesis/business deterioration.
11. Normal Dashboard and Research browsing must remain cache-first and must not silently spend provider quota.
12. Provider refreshes must reuse the deployed budget, reservation, usage-accounting, freshness, lease and kill-switch controls.
13. A UI is not “done” merely because it renders. Data model, deterministic logic, security, error handling, tests and documentation must also be complete for the claimed capability.

---

## 3. Reconciled current state (13 September 2026)

### 3.1 Portfolio/accounting/market foundation — portfolio-wide and operational

- 249 current open holdings in the consolidated portfolio.
- 240 non-ETF held equities and 9 ETFs.
- 248/249 current holdings have latest cached Angel One prices.
- Transaction-derived accounting and current portfolio-weight calculations are operational.
- Daily Movement now uses cached previous-close evidence and is portfolio-wide except for unsupported price coverage.

### 3.2 Classification/allocation — portfolio-wide for current holdings

- Sector and market-cap classifications have been brought to the Dashboard with explicit evidence semantics.
- Current Dashboard allocation/performance, scope filtering and classification-backed tables are operational.
- Roles/themes remain owner settings rather than engine-assigned facts; only explicitly configured roles/targets should be treated as such.

### 3.3 Research evidence — architecture operational, breadth incomplete

Production evidence currently covers approximately:

- 25 held securities with fundamental observations (420 held-security observation rows in the current snapshot).
- 3 held securities with research-document records.
- 1 held security with market-history coverage.
- Normal Research-page reading is generic by `security_id` and cache-only.
- `Complete Research Refresh` is a generic owner-controlled four-operation refresh boundary, but several deep reference-stock controls remain HDFCBANK-specific.

### 3.4 Deterministic scoring/recommendation — reference implementation exists, portfolio-wide rollout incomplete

- Database structures for score runs, dimension scores, metric inputs and recommendation runs exist.
- Recommendation evidence currently covers one held security (HDFCBANK).
- HDFCBANK has persisted sizing suggestions and AI interpretation evidence on top of deterministic recommendation output.
- This proves a reference path; it does **not** mean portfolio-wide Stage 8 is complete.

### 3.5 News — automated and operational

- Official NSE news ingestion is scheduled every 30 minutes.
- Stored-evidence news classification is also scheduled.
- Dashboard News reads cached normalized evidence and does not depend on live browsing.

### 3.6 Dashboard — advanced consumer layer, some engine surfaces still readiness-only

The Dashboard now includes Overview, Daily Move, Allocation/Performance, Structure/Action Center, Health, Risk, Monitoring, Research, Intelligence, News and the D35 Position Sizing Health branch under review.

Some sections consume complete portfolio-wide inputs; others truthfully expose partial coverage or “not yet persisted” states. The remaining work is therefore primarily **engine coverage and orchestration**, not another broad UI redesign.

---

## 4. Important deviations / detours to acknowledge explicitly

### 4.1 Stage 7.2E/F research rollout is not complete

The approved Stage 7.2 plan expected controlled Cohorts B/C and later scheduled/event-driven stale-domain research refresh. The production system has a strong control plane and manual refresh capability, but the full held-equity research dataset has not been rolled out portfolio-wide.

### 4.2 Stage 7.3 market-history architecture has been piloted, not rolled out

Angel One current prices are portfolio-wide, but historical OHLCV / market-derived risk and momentum evidence is currently narrow. HDFCBANK reference-stock work must not be presented as portfolio-wide market-intelligence completion.

### 4.3 Stage 8 has partially started despite older status text saying it has not

Reference scoring/recommendation schema and code exist, and HDFCBANK has a persisted recommendation. Therefore the living Development Status is now stale. The correct description is:

> **Stage 8 reference implementation / pilot has started; portfolio-wide Stage 8 rollout is incomplete.**

### 4.4 HDFCBANK has pilot-specific Research controls

The generic Research page and generic Complete Research Refresh path are reusable across securities. However, valuation-refresh, NIFTY Bank benchmark, market-history and bank-growth discovery UI controls include HDFCBANK-specific logic. These must later become profile/sector-driven capabilities, not 249 copied special cases.

### 4.5 Dashboard development has overtaken some backend engines

D34 and D35 intentionally expose readiness rather than fabricated outputs. This is acceptable and should remain so until Core Health, Exit Risk and portfolio-wide sizing assessments are genuinely persisted.

These deviations are not rollback targets. They are useful pilots that must be absorbed into the canonical dependency order.

---

## 5. Target architecture: one internal orchestration spine, multiple authoritative sources

There is no single external provider that should “connect the entire app.” PortfolioAI should instead have one **internal portfolio coverage/orchestration spine** coordinating independent authorities.

```text
Trusted Transactions / Portfolio Settings
                 │
                 ├───────────────┐
                 │               │
             Angel One       Research Providers / Official Sources
        current + history     fundamentals / ownership / documents / news
                 │               │
                 └──────┬────────┘
                        ↓
              Canonical Evidence Layer
                        ↓
         Classification + Freshness + Provenance
                        ↓
       Deterministic Research / Market Calculations
                        ↓
          Versioned Stock Scoring / States
                        ↓
       Recommendation / Portfolio-context engines
                        ↓
   Sizing ─ Core Health ─ Portfolio Fit ─ Exit ─ Movement
                        ↓
         Dashboard + Research + Intelligence UI
                        ↓
                  Human Decision
                        ↓
                  Transaction Ledger
```

The orchestrator should decide **what is missing/stale and what is eligible**, not make investment decisions itself.

---

## 6. Execution roadmap

The roadmap is intentionally divided into gates. No later gate should be called complete merely because one reference stock passes.

### R0 — Documentation and implementation reconciliation checkpoint

**Purpose:** Establish one shared reality before more engines are added.

Deliverables:

- adopt this plan after owner review;
- update `PortfolioAI_Development_Status.md` to current reality;
- update the Requirements Register where status has materially changed;
- explicitly label reference-stock-only Stage 8 work as pilot/reference implementation;
- record D34/D35 as Dashboard consumer surfaces, not proof of engine completion;
- maintain one “current next stage” in the Development Status.

Gate:

- architecture documents remain unchanged unless an actual architecture decision changed;
- no production mutation required;
- owner signs off the reconciled stage map.

### R1 — D35B Position Sizing Engine **contract + reference implementation**

D35B may proceed first, but it must be bounded correctly.

**Purpose:** Define and prove the deterministic Position Sizing Engine contract using available evidence without pretending 249-stock coverage exists.

Inputs should be explicit and versioned. At minimum the sizing contract should support:

- current portfolio weight;
- current user role;
- persisted deterministic recommendation/scoring readiness;
- business quality / growth / durability evidence where available;
- permanent-loss / balance-sheet risk inputs where available;
- valuation state where available;
- volatility / drawdown where available;
- concentration context;
- liquidity when a reviewed source/calculation exists;
- portfolio-fit inputs when implemented;
- owner target/min/max settings as constraints/context, never silently overwritten.

Outputs should be persisted separately from user settings:

- assessment ID and version;
- portfolio/security;
- as-of timestamp/date;
- current weight;
- suggested target weight;
- suggested minimum weight;
- suggested maximum weight;
- recommended sizing action (`ADD`, `HOLD`, `ADD_ON_WEAKNESS`, `REDUCE`, `TRIM_INTO_STRENGTH`, `FREEZE`, `EXIT_REVIEW`, `EXIT` where evidence permits);
- evidence/readiness coverage;
- reason codes / rationale;
- input lineage / source recommendation or score run IDs where applicable;
- state such as `READY`, `INSUFFICIENT_EVIDENCE`, `BLOCKED_MISSING_MARKET_RISK`, etc.;
- engine version.

**Critical rule:** D35B must be able to persist `INSUFFICIENT_EVIDENCE` without inventing a target range.

Initial validation cohort:

1. HDFCBANK reference case — enough existing recommendation/sizing evidence to reconcile expected behavior.
2. One non-financial security with the best available canonical research evidence.
3. One security deliberately lacking sufficient inputs — prove fail-closed behavior.
4. One ETF — prove engine inapplicability / exclusion.

D35B completion at this stage means **engine contract proven**, not portfolio-wide sizing coverage.

### R2 — Portfolio Coverage Registry / Orchestrator foundation

**Purpose:** Create the single operational connection point requested by the owner.

For every current holding/domain, the orchestrator should know:

- eligibility (equity/ETF/etc.);
- authoritative source;
- identity readiness;
- current coverage state;
- freshness state;
- conflict/review state;
- next eligible refresh;
- estimated physical provider-call cost;
- whether a downstream engine can run;
- blocking prerequisites.

The planner should produce a portfolio-wide matrix such as:

```text
Security | Identity | Fundamentals | Ownership | Documents | Market History | Scoring | Recommendation | Sizing | Core Health | Exit Risk
```

States should be explicit: `FRESH`, `STALE`, `MISSING`, `CONFLICTING`, `REVIEW_REQUIRED`, `NOT_APPLICABLE`, `READY_TO_DERIVE`, `BLOCKED_PREREQUISITE`.

No provider call is required to build the planning matrix.

### R3 — Complete Stage 7.2 research breadth (Cohorts B/C equivalent)

**Purpose:** Fill canonical research evidence across eligible held equities without a blind 4-calls-per-stock sweep.

Rules:

- reuse existing Stage 7.2 provider-budget reservation and usage accounting;
- cache-first and freshness-aware;
- execute only missing/stale verified domains;
- do not fetch a domain whose semantic contract is not approved;
- preserve ETF/non-equity exclusion;
- process bounded cohorts with acceptance gates;
- preserve manual owner approval for expensive broad runs until scheduler behavior is separately approved;
- record exact projected and actual provider-call usage.

Prioritization order should be configurable, initially:

1. current Core / high-weight holdings;
2. holdings with active recommendation/health/sizing gaps;
3. largest priced holdings;
4. stale previously-covered holdings;
5. remaining eligible equities.

Broad research rollout must **not** be described as “connect Trendlyne to all pages.” It populates canonical evidence once; every page reads that cache.

### R4 — Generic sector/profile Research contracts

**Purpose:** Generalize the HDFCBANK reference implementation without cloning bank logic into every stock.

Deliverables:

- keep one generic Research page shell;
- maintain scoring/research profiles by business type/sector;
- BANK/NBFC metrics use banking-appropriate evidence;
- non-financial profiles use reviewed non-financial metrics;
- future specialty profiles only where materially required;
- replace HDFCBANK-only deep-refresh controls with profile/capability-based rendering;
- no generic metric label may conceal incompatible semantics.

Gate: at least one validated bank/NBFC and multiple non-financial sectors render correctly from the same generic page architecture.

### R5 — Stage 7.3 market-history rollout

**Purpose:** Move market intelligence from one-stock/reference coverage to portfolio-wide eligible-equity coverage.

Implement through the existing Angel One authority and market-history storage:

- bounded initial daily OHLCV backfill;
- incremental updates only after the latest stored candle;
- broad-market benchmark history;
- later sector benchmark mappings where trustworthy;
- deterministic returns, relative strength, drawdown and volatility;
- subsequent moving averages / trend / momentum inputs according to the canonical architecture.

No Trendlyne technical score should substitute for this layer.

### R6 — Portfolio-wide deterministic scoring rollout

**Purpose:** Run Stage-8 scoring only when each profile's required canonical inputs meet readiness thresholds.

Conceptual order remains aligned to the canonical Stage-8 structure:

- 8A canonical input and point-in-time lineage review;
- 8B Quality & Growth;
- 8C Core Selection / Core Health / Satellite Opportunity;
- 8D Momentum & Market State integration;
- 8E Valuation;
- 8F Portfolio Fit & Position Sizing;
- 8G Exit Intelligence;
- 8H Combined Action Engine.

Because reference implementations already exist out of order, each existing piece should be mapped into this structure rather than rewritten merely to satisfy numbering.

Every run must retain:

- profile/model version;
- as-of date;
- component inputs;
- evidence coverage/confidence;
- missing/blocked dimensions;
- deterministic rationale.

### R7 — Recommendation and Position Sizing portfolio rollout

Once R3–R6 provide adequate evidence:

- generate recommendations for eligible securities with sufficient readiness;
- persist `INSUFFICIENT_EVIDENCE` rather than forcing recommendations;
- run D35B sizing assessments downstream of the validated recommendation/scoring context;
- never mutate the owner's role or target settings automatically;
- Dashboard D35 reads persisted sizing assessments, while user target/range remains a separate column/context.

### R8 — Core Health, Portfolio Fit, Risk and Exit engines

**Core Health** answers whether an existing Core holding remains healthy in that role.

**Portfolio Fit/Risk** evaluates concentration, overlap, volatility, drawdown, correlation, liquidity and diversification contribution where evidence exists.

**Exit Risk** remains distinct from sizing:

- overweight/expensive may lead to REDUCE/TRIM;
- thesis/business/permanent-loss deterioration may lead to EXIT REVIEW/EXIT.

D34 should then change automatically from readiness text to formal persisted states.

### R9 — Movement Engine + Meaningful Change Detection

Monitor transitions rather than only snapshots:

- Core → Watch → At Risk;
- Satellite → Core Candidate;
- significant sizing-state changes;
- material valuation/momentum/risk changes;
- earnings/ownership/news events that alter deterministic state.

Apply anti-churn rules from the Blueprint. One weak quarter or price decline must not automatically demote Core.

### R10 — Combined Action Center / Intelligence completion

Only after upstream engines are dependable should the Action Center combine:

- Add / Hold / Reduce / Trim / Freeze / Exit Review;
- role movement;
- sizing state;
- Core Health;
- Exit Risk;
- important News;
- research staleness/conflicts;
- target/stop triggers;
- concentration and portfolio-fit warnings.

Combined action must expose supporting and contradictory evidence; it must not hide disagreements inside one opaque score.

### R11 — Scheduled portfolio maintenance

Scheduling should be added per domain only after manual/bounded rollout proves safe.

- News scheduler: already active and separate.
- Research scheduler: stale/missing-domain only, budgeted through the existing provider control plane.
- Market-history scheduler: incremental daily updates, Angel One controlled.
- Scoring/recommendation/sizing recomputation: event-driven after accepted input changes, not arbitrary repeated runs.

### R12 — Optional AI Investment Committee

AI remains the final optional explanatory layer after deterministic outputs exist broadly.

It may summarize:

- what changed;
- supporting and contradictory evidence;
- uncertainties;
- what to monitor next.

It must never become the source of financial facts, scores or autonomous portfolio mutations.

---

## 7. Shared execution discipline for every remaining stage

Every stage from D35B onward should use the same six-step template:

### A. Inspect

- read canonical docs and current stage plan;
- inspect repository implementation;
- inspect production schema/data read-only;
- state actual coverage and known gaps.

### B. Plan

- define bounded scope;
- identify authoritative inputs;
- define output/storage contract;
- define fail-closed states;
- define provider-call estimate;
- define security/RLS boundary;
- define acceptance tests.

### C. Build locally / on an isolated branch

- additive schema where needed;
- deterministic modules first;
- UI consumer second;
- no production mutation without explicit owner approval.

### D. Validate

At minimum:

- unit tests for formulas/states;
- hand-reconciled reference examples;
- RLS/security tests for new persistence;
- idempotency/re-run tests;
- missing/conflicting/stale-input tests;
- TypeScript/lint/build;
- database migration lint/replay when schema changes;
- provider usage-accounting reconciliation where calls exist.

### E. Pilot

- start with a deliberately small cohort;
- include positive, missing-data and not-applicable cases;
- compare outputs to expected/reference calculations;
- do not silently widen scope after the pilot.

### F. Promote

- owner acceptance;
- update Development Status + Requirements Register;
- merge only the reviewed branch;
- widen cohort/scheduler only through a separately named gate.

---

## 8. “Definition of complete” vocabulary

To stop future confusion, use these labels consistently:

- **UI COMPLETE:** page/section renders correctly against its current contract.
- **ENGINE CONTRACT COMPLETE:** deterministic logic/storage/tests proven on reference cases.
- **PILOT COMPLETE:** small controlled cohort passed.
- **PORTFOLIO-WIDE COVERAGE COMPLETE:** all eligible current holdings processed or explicitly classified as unresolved/not applicable.
- **AUTOMATION COMPLETE:** scheduler/event orchestration enabled with accounting, kill switch and recovery.
- **PRODUCT CAPABILITY COMPLETE:** UI + data + engine + coverage + automation (if required) + docs are all accepted.

Do not call a capability simply “complete” if only the UI or one reference stock is complete.

---

## 9. Proposed immediate next work

After owner approval of this roadmap:

1. Reconcile the living Development Status and Requirements Register.
2. Keep PR #78 (D35 UI) as a truthful consumer of current partial evidence.
3. Implement **D35B — Position Sizing Engine Contract & Reference Pilot** as R1.
4. Do **not** immediately mass-run D35B across 249 holdings.
5. Build R2 Portfolio Coverage Registry / Orchestrator immediately after the D35B reference pilot.
6. Use that registry to drive the R3/R5/R6 rollout sequence so research, market history, scoring, recommendations and sizing become portfolio-wide in a controlled way.

This preserves the owner's preference to implement D35B first while keeping the application pointed toward the full intended architecture.

---

## 10. Owner decision gates

Owner approval should be requested separately for:

- adoption/merge of this plan;
- any production schema migration required by D35B;
- D35B reference-pilot execution;
- portfolio-wide research Cohort B/C execution and projected Trendlyne spend;
- portfolio-wide historical-market backfill parameters;
- broad scoring/recommendation/sizing execution;
- any new scheduled provider process;
- activation of optional AI portfolio-wide synthesis.

No plan approval should be interpreted as blanket permission for all later production changes.

---

## 11. Direction in one sentence

> **Use the existing HDFCBANK and Dashboard work as reference implementations, then complete the missing portfolio-wide evidence and deterministic orchestration layers so every page reads the same canonical stored truth and every engine runs only when its prerequisites are genuinely satisfied.**
