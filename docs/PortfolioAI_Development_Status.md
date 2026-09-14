# PortfolioAI — Development Status

**Status:** Living implementation and handover record  
**Current milestone:** R2E Single Source of Truth architecture/enforcement in draft PR #84; R2D production projection remains separately gated  
**Last reviewed:** 14 September 2026

This document records current implementation reality, completion level, known limitations, and the next gated work. Detailed historical implementation evidence remains in stage plans/completion records and Git history.

## A. Project identity

PortfolioAI is the private `drddutta-portfolio/PortfiolioAI` repository for a personal investment decision-support system covering a diversified Indian portfolio across multiple broker/demat accounts. It is not an autonomous investment adviser, order-execution bot, or trading bot; investment decisions remain with the owner.

- Frontend: React, Vite, strict TypeScript.
- Backend: Supabase Auth, PostgreSQL, Row Level Security, RPCs, and Edge Functions.
- Portfolio: one consolidated portfolio across distinct broker/demat accounts.
- Holdings remain transaction-derived.
- Angel One remains current-price and daily-OHLCV authority.
- Trendlyne remains a structured research-evidence provider behind PortfolioAI's provider-neutral storage/control plane.
- NSE/official sources remain authoritative for the implemented News Intelligence pipeline.

## B. Canonical document hierarchy

Authority descends in this order:

1. `PortfolioAI_Master_Blueprint.md`
2. `PortfolioAI_Research_and_Intelligence_Architecture.md` for source ownership, derived metrics, scoring lineage, and intelligence boundaries
3. `PortfolioAI_Single_Source_of_Truth_Architecture.md` for application-wide canonical business facts, shared access paths, and cross-page consistency
4. `PortfolioAI_Database_Architecture.md`
5. `PortfolioAI_Development_Rules.md`
6. `PortfolioAI_Product_UI_and_Decision_Workflow.md`
7. this Development Status
8. `PortfolioAI_Requirements_Register.md`
9. stage-specific plans, the Integration & Execution Plan, and completion records

`PortfolioAI_Integration_and_Execution_Plan.md` remains the repository-governed execution roadmap, subordinate to canonical architecture and unable by itself to authorize production changes.

## C. Current verified portfolio/application foundation

### Transactions, accounting, portfolio structure

- 249 current open holdings in the consolidated portfolio.
- 240 current non-ETF equities and 9 ETFs.
- Transaction-derived accounting and portfolio weights are operational.
- Roles, themes, target/min/max weights, watchlist/frozen state and related portfolio settings remain owner-controlled settings, not engine-assigned facts.
- Browser access remains constrained by the existing RLS/security model; trusted transaction history and source evidence remain auditable and non-destructively corrected.

### Current prices and market evidence

- 248/249 current holdings had latest cached Angel One prices in the most recently reconciled snapshot.
- Dashboard Daily Move uses cached previous-close evidence and remains cache-only.
- Historical OHLCV / market-derived momentum, volatility and drawdown coverage is not portfolio-wide. Reference/pilot work exists; Stage 7.3/R5 must not be described as portfolio-wide complete.

### Classification and Dashboard

The current application-wide classification authority is the reviewed enrichment layer:

`current_security_enrichment_v1`

Dashboard Allocation & Performance already consumes this source for sector, industry and market-cap classification. R2E/PR #84 aligns shared portfolio consumers with the same authority so Dashboard, Holdings, Portfolio Structure, Research, Research Coverage and future decision surfaces cannot maintain competing user-visible classifications.

Current production coverage baseline:

- 240/240 open equities have sector classification in `current_security_enrichment_v1`;
- industry detail remains materially narrower (48/240 in the R2C baseline);
- market-cap classification is portfolio-wide for current non-ETF equities in the Dashboard evidence layer;
- the application must preserve exact current classification labels rather than silently remapping them into a second user-visible taxonomy.

Research profiles/subprofiles remain separate downstream methodology and may not rewrite the application sector/industry/market-cap classification.

### Dashboard decision surfaces

- D34 Core Health / Exit-Risk readiness is UI COMPLETE / merged. It exposes advisory/readiness evidence and does not fabricate formal Core Health or Exit-Risk engine states.
- D35 Position Sizing Health UI implementation is complete in PR #78; merge/deployment state remains separate from implementation completion.
- PR #84 is refactoring existing Dashboard evidence reads behind shared repositories/hooks as part of R2E; no production data source is changed by that repository refactor.

## D. Research, provider control, and News state

### Stage 7 research foundation

The Stage 7 provider-neutral evidence architecture, trusted Trendlyne adapter, provider control plane and controlled Cohort A path are implemented. Existing protections remain mandatory:

- source/provenance preservation;
- immutable/raw evidence separation from normalized/selected evidence;
- provider kill switch;
- freshness-aware planning;
- atomic budget reservation/settlement;
- per-call usage accounting;
- bounded retries and leases;
- cache-first normal application reads;
- no silent provider spending from Dashboard/Research browsing.

### Research breadth

The R2C read-only production baseline found research breadth materially narrower than the portfolio:

- approximately 25 held equities with at least one fundamental observation;
- 3 held equities with research-document records;
- 1 held equity with the substantial Angel One daily-history path;
- 4 reviewed scoring-profile assignments;
- 0 persisted `stock_score_runs` for current holdings at the R2C checkpoint;
- HDFCBANK recommendation preview/persistence evidence exists, but canonical persisted score-run lineage is not portfolio-wide.

This evidence proves architecture/reference paths, not portfolio-wide research or scoring completion.

### News Intelligence

Official NSE News Intelligence is automated and operational:

- official NSE ingestion is scheduled;
- normalization and holding matching are persisted;
- linked-document capture/text extraction has been validated in production;
- stored-evidence reclassification is scheduled;
- Dashboard News consumes cached normalized evidence;
- normal Dashboard browsing does not perform live NSE fetches.

The News automation does not authorize research, market-history, scoring or sizing scheduler activation.

## E. Stage 8 / R1 reconciliation

Stage 8 reference implementation/pilot has started; portfolio-wide Stage 8 rollout remains incomplete.

### R1 / D35B Position Sizing Engine

R1 is **ENGINE CONTRACT COMPLETE** and merged.

Verified repository contract includes:

- deterministic/versioned D35B engine;
- fail-closed prerequisite handling;
- research profile code/version/readiness lineage;
- score/recommendation lineage requirements;
- READY / INSUFFICIENT_EVIDENCE / BLOCKED_PREREQUISITE / NOT_APPLICABLE behavior;
- additive persistence migration committed to the repository;
- unit tests, strict TypeScript/lint/build verification;
- isolated migration + pgTAP verification.

Important boundary:

- the R1 production migration has **not** been applied;
- HDFCBANK remains the only genuine current research-backed sizing reference case;
- a plausible sizing range alone cannot make another stock READY.

## F. R2 Portfolio Coverage Registry / Orchestrator

R2 repository-side coverage work has reached **COVERAGE CONTRACT COMPLETE** with a **READ-ONLY PORTFOLIO BASELINE COMPLETE**.

Implemented repository-side concepts include:

- deterministic per-security/domain coverage planner;
- cache-only projection/summary logic;
- portfolio-wide read-only R2C baseline;
- explicit eligibility, freshness, missing/conflicting/review states and downstream blockers;
- fail-closed research-profile readiness;
- no provider call required merely to determine coverage/readiness.

R2C read-only production baseline:

- 249 open holdings;
- 240 equities;
- 9 non-equities;
- 240/240 equities have current sector labels through the Dashboard enrichment authority;
- research/history/scoring/recommendation breadth remains narrow as described above.

The earlier experimental R2 mapping of source labels into a separate 20-sector user-visible taxonomy is superseded for application display. PortfolioAI now preserves the Dashboard classification as the shared application classification; research profile routing remains separate.

### R2D production integration

R2D has a design contract for an authenticated, owner-scoped, read-only app-facing coverage projection.

It is **NOT deployed**.

Creating an RPC/view/Edge Function, grant, policy or other production object for R2D remains a production change and requires explicit owner approval for that specific action.

## G. R2E — Single Source of Truth Architecture

R2E is the current repository milestone in draft PR #84.

Its governing rule is:

> **One business fact, one authority, one deterministic owner, many consistent views.**

R2E introduces/enforces:

- canonical `PortfolioAI_Single_Source_of_Truth_Architecture.md`;
- machine-readable `src/contracts/canonicalDataAuthorities.ts`;
- authority-registry tests;
- `npm run check:architecture` presentation-boundary scanner;
- permanent `.github/workflows/architecture-guard.yml` CI enforcement;
- updated Development Rules, documentation map and agent pre-flight;
- shared Dashboard evidence repository/hooks replacing direct presentation-layer Supabase reads discovered by the guard;
- shared classification overlay so portfolio consumer pages receive the same sector/industry facts as Dashboard.

The architecture guard intentionally treats presentation-layer direct canonical-storage access as drift rather than allowlisting it.

R2E remains **IN PR / NOT MERGED** until PR #84 is explicitly approved for merge.

No production database mutation, migration application, provider call, deployment, scheduler change, RLS/grant change or provider-budget consumption is part of R2E.

## H. Completion terminology

Use these labels instead of the ambiguous word “complete”:

1. **UI COMPLETE** — the consumer interface works.
2. **ENGINE CONTRACT COMPLETE** — deterministic algorithm/storage/tests work on reference cases.
3. **PILOT COMPLETE** — a controlled real cohort has passed.
4. **PORTFOLIO-WIDE COVERAGE COMPLETE** — every eligible holding was processed or explicitly marked unresolved/not applicable.
5. **AUTOMATION COMPLETE** — scheduler/event orchestration is safely operational.
6. **PRODUCT CAPABILITY COMPLETE** — use only when relevant lower-level gates genuinely justify it.

Current examples:

- D34: UI COMPLETE / merged.
- D35: UI implementation complete in PR #78; merge status separate.
- R1/D35B: ENGINE CONTRACT COMPLETE / merged; production persistence not applied.
- R2: COVERAGE CONTRACT COMPLETE; R2C READ-ONLY COVERAGE BASELINE COMPLETE.
- R2D: DESIGN CONTRACT COMPLETE / production implementation not applied.
- R2E: repository implementation in draft PR #84 until verified/approved/merged.
- Stage 8 scoring/recommendation: REFERENCE IMPLEMENTATION / PILOT ONLY, portfolio-wide incomplete.
- News Intelligence: automated operational capability for its defined official-NSE scope.

## I. Current limitations and unresolved breadth

These are explicit limitations, not invitations to fabricate values:

- one current holding remains outside latest cached-price coverage in the reconciled snapshot;
- historical OHLCV / momentum / volatility / drawdown evidence is not portfolio-wide;
- fundamental research breadth is far below all eligible equities;
- research-document breadth is narrow;
- approved sector-specific research-profile contracts are not yet portfolio-wide;
- persisted deterministic score-run coverage is not portfolio-wide;
- recommendation coverage is still a reference path rather than portfolio-wide;
- formal Position Sizing persistence is not applied to production;
- formal Core Health, Exit Risk and Portfolio Fit engines are not portfolio-wide persisted engines;
- D34/D35 consumer surfaces must remain readiness/coverage surfaces until those engines exist;
- owner targets/min/max weights must never be overwritten by deterministic engine output;
- ETFs/non-equity assets must not be forced through equity-only scoring/sizing contracts;
- `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE`, conflict/review states and missing values are valid outputs and must remain explicit.

## J. Next work after R2E

After PR #84 is verified and explicitly approved/merged, the next development decision should follow the Integration & Execution Plan while preserving the R2E authority rules.

The immediate choices are:

1. **R2D production integration** — requires explicit production approval before any database/view/RPC/Edge Function deployment; or
2. continue repository-side R3/R4 evidence/profile work that does not require a production mutation, subject to its own scoped plan.

R3/R4 must use the shared application classification only as classification evidence; sector-specific research profiles remain their own versioned methodology contracts and must fail closed when mandatory evidence/source/history requirements are unmet.

## K. Non-negotiable controls for all next stages

- One business fact must have one canonical authority and one shared application access path.
- Presentation code must not directly create competing canonical-storage queries.
- Preserve source/provenance and raw/normalized/derived/score/explanation separation.
- Reuse provider-budget reservation, usage accounting, freshness, lease and kill-switch controls.
- Keep normal Dashboard/Research browsing cache-first.
- Do not silently mutate transactions, holdings, roles, themes, targets or portfolio settings.
- Do not treat sizing/valuation reduction as thesis-driven exit.
- Keep equity/non-equity applicability explicit.
- Preserve deterministic exact-decimal behavior where weights/financial values are calculated.
- Keep human-in-the-loop approval for investment decisions and all production-enabling steps.
- No production migration, provider cohort execution, scheduler activation or other production change without explicit owner approval.

## L. Historical implementation records

Detailed historical stage evidence remains in the repository's `Stage_*`, `*_Completion.md`, News Intelligence, Dashboard stage documents and Git history. Historical text remains accurate for its dated checkpoint; this file records the current implementation state subject to the canonical hierarchy above.
