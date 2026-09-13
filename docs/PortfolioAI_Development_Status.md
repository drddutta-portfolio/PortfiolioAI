# PortfolioAI — Development Status

**Status:** Living implementation and handover record  
**Current milestone:** R0 documentation reconciliation; R1 / D35B Position Sizing Engine contract + reference implementation is next after owner sign-off  
**Last reviewed:** 13 September 2026

This document records current implementation reality, completion level, known limitations, and the next approved work. It is intentionally concise. Detailed historical implementation evidence remains in stage plans/completion records and Git history.

## A. Project identity

PortfolioAI is the private `drddutta-portfolio/PortfiolioAI` repository for a personal investment decision-support system covering a diversified Indian portfolio across multiple broker/demat accounts. It is not an autonomous investment adviser, order-execution bot, or trading bot; investment decisions remain with the owner.

- Frontend: React, Vite, strict TypeScript.
- Backend: Supabase Auth, PostgreSQL, Row Level Security, RPCs, and Edge Functions.
- Portfolio: one consolidated portfolio across distinct broker/demat accounts.
- Holdings remain transaction-derived.
- Angel One remains current-price and planned daily-OHLCV authority.
- Trendlyne remains a structured research-evidence provider behind PortfolioAI's provider-neutral storage/control plane.
- NSE/official sources remain authoritative for the implemented News Intelligence pipeline.

## B. Canonical document hierarchy

Authority descends in this order:

1. `PortfolioAI_Master_Blueprint.md`
2. `PortfolioAI_Research_and_Intelligence_Architecture.md` for source ownership, derived metrics, scoring lineage, and intelligence boundaries
3. `PortfolioAI_Database_Architecture.md`
4. `PortfolioAI_Development_Rules.md`
5. `PortfolioAI_Product_UI_and_Decision_Workflow.md`
6. this Development Status
7. `PortfolioAI_Requirements_Register.md`
8. stage-specific plans, the Integration & Execution Plan, and completion records

`PortfolioAI_Integration_and_Execution_Plan.md` is the current repository-governed execution roadmap, but it remains subordinate to the canonical architecture above and does not authorize production changes by itself.

## C. Current verified portfolio/application foundation

### Transactions, accounting, portfolio structure

- 249 current open holdings in the consolidated portfolio.
- 240 current non-ETF equities and 9 ETFs.
- Transaction-derived accounting and portfolio weights are operational.
- Roles, themes, target/min/max weights, watchlist/frozen state and related portfolio settings remain owner-controlled settings, not engine-assigned facts.
- Browser access remains constrained by the existing RLS/security model; trusted transaction history and source evidence remain auditable and non-destructively corrected.

### Current prices and market evidence

- 248/249 current holdings have latest cached Angel One prices in the current reconciled snapshot.
- Dashboard Daily Move uses cached previous-close evidence and remains cache-only.
- Historical OHLCV / market-derived momentum, volatility and drawdown coverage is not portfolio-wide. Reference/pilot work exists, but Stage 7.3 must not be described as portfolio-wide complete.

### Classification and Dashboard

- Canonical sector and market-cap classification is complete for current non-ETF equities in the Dashboard evidence layer.
- Dashboard allocation/performance and shared scope behavior are operational.
- D34 Core Health / Exit-Risk readiness is UI complete and merged. It truthfully exposes advisory/readiness evidence and does not fabricate formal Core Health or Exit-Risk engine states.
- D35 Position Sizing Health UI implementation is complete in PR #78, but PR #78 remains open at this R0 checkpoint. Therefore D35 is not recorded as merged/deployed on `main` yet.

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

Current reconciled production coverage remains materially narrower than the portfolio:

- approximately 25 held securities with fundamental observations;
- 420 held-security fundamental observation rows in the reconciled snapshot;
- 3 held securities with research-document records;
- 1 held security with historical market-data coverage;
- generic Research-page reading by `security_id` is implemented and cache-only.

The existing evidence breadth proves the architecture and controlled cohort path; it does not constitute Stage 7.2 portfolio-wide research completion.

### News Intelligence

Official NSE News Intelligence is automated and operational:

- official NSE ingestion is scheduled;
- normalization and holding matching are persisted;
- linked-document capture/text extraction work has been validated in production;
- stored-evidence reclassification is scheduled;
- Dashboard News consumes cached normalized evidence;
- normal Dashboard browsing does not perform live NSE fetches.

The News automation does not alter the approval requirements for research, market-history, scoring or sizing schedulers.

## E. Stage 8 reconciliation

Older status text said Stage 8 had not started. That is no longer accurate.

The correct current description is:

> **Stage 8 reference implementation / pilot has started; portfolio-wide Stage 8 rollout is incomplete.**

Current reference evidence includes:

- database structures for score runs, dimension scores, metric inputs and recommendation runs;
- a persisted deterministic scoring/recommendation path for HDFCBANK;
- persisted HDFCBANK recommendation/sizing advisory evidence;
- AI interpretation evidence layered on top of deterministic output;
- Dashboard consumer/readiness surfaces that intentionally expose sparse coverage instead of fabricating portfolio-wide intelligence.

This reference work proves that the pipeline can operate for a bounded case. It does **not** prove that all 249 holdings are scored, recommended, sized or risk-assessed.

## F. Completion terminology

From this R0 checkpoint onward, avoid the unqualified word “complete” for broad capabilities. Use:

1. **UI COMPLETE** — the consumer interface works.
2. **ENGINE CONTRACT COMPLETE** — deterministic algorithm/storage/tests work on reference cases.
3. **PILOT COMPLETE** — a controlled real cohort has passed.
4. **PORTFOLIO-WIDE COVERAGE COMPLETE** — every eligible holding was processed or explicitly marked unresolved/not applicable.
5. **AUTOMATION COMPLETE** — scheduler/event orchestration is safely operational.
6. **PRODUCT CAPABILITY COMPLETE** — use only when the relevant lower-level gates justify it.

Examples at this checkpoint:

- D34: UI COMPLETE / merged.
- D35: UI implementation complete in PR #78 / merge pending.
- Stage 8 scoring/recommendation: REFERENCE IMPLEMENTATION / PILOT ONLY, portfolio-wide incomplete.
- News Intelligence: automated operational capability for its defined official-NSE scope.
- D35B: not yet implemented; next target is ENGINE CONTRACT COMPLETE on bounded reference cases.

## G. Current limitations and unresolved breadth

These are explicit limitations, not invitations to fabricate values:

- one current holding remains outside latest cached price coverage in the reconciled snapshot;
- historical OHLCV / momentum / volatility / drawdown evidence is not portfolio-wide;
- fundamental research breadth is far below all eligible equities;
- research-document breadth is narrow;
- recommendation coverage is currently a reference case rather than portfolio-wide;
- formal Position Sizing, Core Health, Exit Risk and Portfolio Fit engines are not portfolio-wide persisted engines;
- D34/D35 consumer surfaces must remain readiness/coverage surfaces until those engines exist;
- owner targets/min/max weights must never be overwritten by deterministic engine output;
- ETFs/non-equity assets must not be forced through equity-only scoring/sizing contracts;
- `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE`, conflict/review states and missing values are valid outputs and must remain explicit.

## H. R0 reconciliation decision

R0 establishes the shared implementation reality before another backend engine is added.

This documentation checkpoint records that:

- PR #79 merged `PortfolioAI_Integration_and_Execution_Plan.md` into `main` as a subordinate execution roadmap;
- Stage 8 is reference/pilot started, not “not started” and not portfolio-wide complete;
- D34 is a merged Dashboard readiness/consumer surface, not proof of Core Health/Exit-Risk engine completion;
- D35 is a completed UI implementation in open PR #78, not yet a merged/deployed formal sizing engine;
- the Requirements Register and documentation map are reconciled to the same terminology;
- no production schema, provider call, database data, scheduler or deployed Edge Function is changed by R0.

R0 is documentation-only. Owner sign-off is required before treating the reconciliation as the approved current stage map.

## I. Next approved implementation — R1 / D35B

After R0 owner sign-off, the next implementation is:

> **D35B Position Sizing Engine contract + reference implementation**

It must be deterministic, versioned, reproducible, tested and bounded. It must persist its own assessment rather than writing engine recommendations into owner `portfolio_security_settings`.

The contract must support, where evidence exists:

- current portfolio weight;
- owner role and configured target/min/max constraints/context;
- deterministic scoring/recommendation readiness;
- quality/growth/durability evidence;
- permanent-loss/balance-sheet risk evidence;
- valuation state;
- volatility/drawdown;
- concentration;
- liquidity only when a reviewed source/calculation exists;
- portfolio-fit evidence when implemented.

Expected persisted outputs include:

- portfolio/security;
- assessment/version/as-of time;
- captured current weight;
- suggested target/minimum/maximum weights when supported;
- recommended sizing action;
- evidence/readiness coverage;
- reason codes and deterministic rationale;
- source score/recommendation lineage where applicable;
- assessment state;
- engine version.

Valid states must include at least:

- `READY`;
- `INSUFFICIENT_EVIDENCE`;
- `NOT_APPLICABLE`;
- explicit blocked states where a required upstream domain is missing.

The engine must not invent a 3%–4% range simply because HDFCBANK has one.

### Initial reference cohort

1. HDFCBANK — known reference case.
2. One non-financial equity with the best available canonical evidence.
3. One deliberately incomplete equity — expected fail-closed / insufficient-evidence behavior.
4. One ETF — expected inapplicable/exclusion behavior.

Completion of this step means **ENGINE CONTRACT COMPLETE**, not portfolio-wide sizing coverage.

## J. Following stage — R2 Portfolio Coverage Registry / Orchestrator

After D35B reference-contract completion, build the internal portfolio coverage/orchestration spine. It should know, for every current holding/domain:

- applicability;
- authoritative source;
- identity readiness;
- fresh/stale/missing/conflicting/review state;
- next eligible refresh;
- estimated provider-call cost;
- downstream-engine readiness;
- blocking prerequisite.

The orchestrator coordinates evidence coverage. It does not make investment decisions and does not require a provider call merely to calculate the readiness matrix.

## K. Non-negotiable controls for all next stages

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

Detailed historical stage evidence remains in the repository's `Stage_*`, `*_Completion.md`, News Intelligence, Dashboard stage documents and Git history. This living status intentionally avoids duplicating those records. When historical text conflicts with this current-status reconciliation, treat the historical text as accurate for its dated checkpoint and this file as the current implementation state, subject to the canonical hierarchy above.
