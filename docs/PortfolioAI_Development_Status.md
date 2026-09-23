# PortfolioAI — Development Status

**Status:** Living implementation and handover record  
**Current milestone:** Gate K research-methodology architecture is COMPLETE / PASS with portfolio-coverage/fail-closed routing; PR #101 remains OPEN / DRAFT / UNMERGED; the next substantive program is evidence breadth and market-history coverage, not a new Gate L/M
**Last reviewed:** 16 September 2026

This document records current implementation reality, completion level, known limitations, and the next gated work. Detailed historical implementation evidence remains in stage plans/completion records and Git history.

## Program A · Checkpoint A1 status — 23 September 2026

A1.1 planner/contract implementation is COMPLETE / PASS.

Implemented in A1.1:
- reusable Program A eligibility resolver;
- R3 evidence-coverage planner;
- R5 market-history planner;
- incremental history-window logic;
- benchmark dependency inventory;
- projected provider-cost planner;
- bounded pilot-cohort selection;
- zero-provider / zero-write safety contract.

Important scope clarification:
- A1.1 proves the planning contract with deterministic tests and frozen current-portfolio fixtures;
- it does not yet materialize the real current portfolio baseline directly from the owner's actual canonical cache/read-only stores.

A1.2 is therefore required to complete the original A1 objective:
- read the actual current Portfolio Coverage Registry and canonical cache-only evidence/market stores;
- materialize real planner inputs;
- produce the real current R3/R5 baseline;
- produce actual projected provider-call counts;
- produce the actual bounded R3/R5 pilot proposal;
- still execute zero provider calls and zero production writes.

Canonical A1.2 plan:
- `docs/PortfolioAI_PROGRAM_A_A1_2_REAL_CACHE_BASELINE_MATERIALIZATION_PLAN.md`.

No provider execution, production mutation, migration, score/recommendation/sizing persistence, scheduler activation, AI activation, deployment or merge is part of A1. Program B scorer activation remains out of scope.

## Post-K scoring reconciliation closure — 23 September 2026

PKR-1 / PKR-1B is COMPLETE / PASS / CLOSED.

The live Research scoring path is now aligned with the Gate-K fail-closed architecture:
- unsupported methodology → METHODOLOGY_NOT_AVAILABLE;
- missing/conflicting classification → REVIEW_REQUIRED;
- completed K4 methodology may be AVAILABLE while score execution remains PENDING_ADAPTER;
- K4 engines no longer substitute legacy GENERAL numeric scoring before Program B / R6 activates the correct sector scorer adapter;
- reviewed K4 assignments cannot bypass this guard;
- PHARMA_V1 and supported BANK scoring remain available;
- NBFC_LENDING remains fail-closed;
- explicit canonical GENERAL assignments remain separately supported where genuinely reviewed.

Local validation passed for targeted regressions, K-FINAL, TypeScript, architecture guard and production build. Full-repository lint retains inherited errors outside this reconciliation and is not a PKR regression.

Program A remains NOT STARTED.

## Post-Gate-K reconciliation — 23 September 2026

Gate H through Gate K materially advanced the research methodology architecture beyond the older R3/R4 roadmap wording.

Current reconciled state:
- Gate K is COMPLETE / PASS;
- the sector-specific research layer is portfolio-coverage complete/fail-closed for the frozen Gate-K scope;
- one universal Research workspace remains authoritative;
- PHARMA_V1, BANK_NBFC and ten additional K4 sector-engine families coexist under registry-driven routing/isolation;
- unsupported methodology remains METHODOLOGY_NOT_AVAILABLE and unresolved/conflicting classification remains REVIEW_REQUIRED;
- this is methodology/routing coverage, not proof of portfolio-wide company evidence, score-run, recommendation-run or sizing coverage.

The older roadmap item **R4 — Generic sector/profile Research contracts** is therefore superseded/completed by the H→K work, especially Gate K. The remaining canonical work begins with **R3 research-evidence breadth** and **R5 market-history breadth**, followed by readiness-driven R6/R7 execution and later R8–R12 portfolio engines/operations.

No canonical Gate L or Gate M is currently defined or required. See `PortfolioAI_POST_GATE_K_ARCHITECTURE_AND_ROADMAP_AUDIT.md`.

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

Dashboard Allocation & Performance consumes this source for sector, industry and market-cap classification. R2E aligns shared portfolio consumers with the same authority so Dashboard, Holdings, Portfolio Structure, Research, Research Coverage and future decision surfaces cannot maintain competing user-visible classifications.

Current production coverage baseline:

- 240/240 open equities have sector classification in `current_security_enrichment_v1`;
- industry detail remains materially narrower (48/240 in the R2C baseline);
- market-cap classification is portfolio-wide for current non-ETF equities in the Dashboard evidence layer;
- the application must preserve exact current classification labels rather than silently remapping them into a second user-visible taxonomy.

Research profiles/subprofiles remain separate downstream methodology and may not rewrite the application sector/industry/market-cap classification.

### Dashboard decision surfaces

- D34 Core Health / Exit-Risk readiness is UI COMPLETE / merged. It exposes advisory/readiness evidence and does not fabricate formal Core Health or Exit-Risk engine states.
- D35 Position Sizing Health UI implementation is complete in PR #78; merge/deployment state remains separate from implementation completion.
- R2E refactored existing Dashboard evidence reads behind shared repositories/hooks; no competing production data authority was introduced.

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

The earlier experimental R2 mapping of source labels into a separate 20-sector user-visible taxonomy is superseded for application display. PortfolioAI preserves the Dashboard classification as the shared application classification; research profile routing remains separate.

### R2D production integration

R2D is now **PRODUCTION INTEGRATION COMPLETE for the authenticated read-only endpoint**.

Production implementation:

- `public.get_portfolio_coverage_registry_v1(uuid, uuid)` is deployed as a `STABLE SECURITY INVOKER` function;
- `anon` and `authenticated` have no direct execute privilege;
- only `service_role` may execute the database function;
- the function independently checks that the supplied portfolio belongs to the supplied authenticated user id;
- Edge Function `portfolio-coverage-registry` is deployed with JWT verification enabled;
- the Edge Function validates the signed-in user, independently checks portfolio ownership, then calls the service-only database projection;
- application code has a shared `loadPortfolioCoverageRegistry()` repository boundary rather than direct browser access to provider-control tables;
- response is compact and aggregate-only for market history; raw candles and document bodies are not returned;
- response explicitly reports `providerCalls: 0` and `budgetConsumed: 0`.

Production verification established:

- correct owner id returns 249 open holdings;
- deliberately incorrect user id is rejected with SQLSTATE `42501` / `PORTFOLIO_NOT_AUTHORIZED`;
- registry sector coverage is 240/240 equities and uses `current_security_enrichment_v1`;
- HDFCBANK returns `Banking` and `LARGE_CAP`, matching the Dashboard enrichment source exactly;
- HDFCBANK recommendation history remains `PREVIEW` with null `sourceScoreRunId`, so R2D does not fabricate persisted score lineage;
- `sizingPersistenceAvailable` remains false because the R1 production sizing table has not been applied;
- provider usage-event, ingestion-run, score-run, recommendation-run and fundamental-observation counts were unchanged before/after R2D verification;
- no provider call, provider-budget use, evidence mutation, recommendation mutation or sizing mutation occurred.

The production Edge Function is deployed, but an end-to-end HTTP call using the owner's actual browser JWT was not available to the repository/tooling session. The authenticated HTTP path follows the same existing `auth.getUser()` production pattern used by other verified Edge Functions; database ownership enforcement and service-only execution were independently verified.

## G. R2E — Single Source of Truth Architecture

R2E is **MERGED / REPOSITORY ARCHITECTURE COMPLETE** via PR #84.

Its governing rule is:

> **One business fact, one authority, one deterministic owner, many consistent views.**

R2E introduced/enforces:

- canonical `PortfolioAI_Single_Source_of_Truth_Architecture.md`;
- machine-readable `src/contracts/canonicalDataAuthorities.ts`;
- authority-registry tests;
- `npm run check:architecture` presentation-boundary scanner;
- permanent `.github/workflows/architecture-guard.yml` CI enforcement;
- updated Development Rules, documentation map and agent pre-flight;
- shared Dashboard evidence repository/hooks replacing direct presentation-layer Supabase reads discovered by the guard;
- shared classification overlay so portfolio consumer pages receive the same sector/industry facts as Dashboard.

The architecture guard treats presentation-layer direct canonical-storage access as drift rather than allowlisting it.

R2E itself made no production database mutation, provider call, scheduler change, RLS/grant change or provider-budget consumption.

### R4M — shared profile-driven Research workspace

R4M is **UI COMPLETE / MERGED** in PR #100 at merge commit `de54ed1fa9569e9db0c14cfa8dac6dfbc2638c9f`; deployment and production state remain separate.

- HDFCBANK / BANK_NBFC remains the mature regression reference.
- TORNTPHARM / PHARMA_V1 uses the same Research page, hierarchy and interaction language while its profile contract supplies Pharma metrics, labels, applicability, refresh modules and readiness requirements.
- Shared score surfaces distinguish scored, evidence-only, no-evidence and not-applicable states. PHARMA_V1 remains fail-closed; no numeric Pharma score curves were invented.
- The reusable readiness summary receives profile-specific groups and details through an adapter. All 13 PHARMA_V1 contracts remain inspectable.
- The legacy HDFCBANK refresh-module JSX branch has been removed. Typed profile/reference-security eligibility metadata now feeds the shared refresh-module renderer while preserving the bounded HDFCBANK pilot and keeping other BANK_NBFC securities fail-closed.
- The UI pass made no migration, database/evidence write, provider call, score/recommendation/sizing write, Edge Function deployment or scheduler change.
- The authenticated localhost visual review found no unresolved shared-UI differences between HDFCBANK and TORNTPHARM.

### R4N-A/R4N-B — Research contract freeze and Pharma subprofile foundation

R4N-A/R4N-B is **PRODUCTION SCHEMA DEPLOYED / CONTRACT IMPLEMENTATION IN DRAFT PR #101** on `r4n-pharma-subprofile-architecture`.

- The universal Research workspace is frozen as `R4M_V1`; future profiles supply configuration and data rather than page trees.
- The typed `PHARMA_V1` subprofile assignment contract preserves immutable versions, effective intervals, review provenance, secondary exposures and fail-closed resolution.
- The owner-supplied 25-stock Pharma mapping is a noncanonical provisional fixture register; ZYDUSWELL is separately `OUTSIDE_PHARMA_V1 / CONSUMER_HEALTH_REVIEW`.
- Missing, provisional, disputed or conflicting required subprofile assignment permits parent evidence display but blocks readiness, scoring and recommendation.
- Machine-readable V1 evidence/readiness contracts now compose all five subprofiles onto the parent exactly once. Top-line readiness uses active Mandatory requirements only; Important and Supplementary coverage remain separate.
- The frozen TORNTPHARM 42-row official-evidence proposal now has an exact fixture and pure dry-run classifier against `PHARMA_V1 + DOMESTIC_FORMULATIONS`. It maps 36 rows to six parent mandatory requirements and keeps six R&D rows contextual; it satisfies zero subprofile-specific or condition-activation requirements and performs no ingestion.
- A pure local ingestion validator now checks security/profile identity, metric units, periods, numeric values, source artifacts, derived formula/input lineage, duplicate candidates and conflicts with existing facts. A separate schema-design note defines the append-only assignment authority and RLS boundary.
- The global contract registry, append-only assignment history, secondary exposures, reviewed-interval exclusion, held-security read policies and service-only mutation privileges are deployed in production with five contract rows and zero assignments/exposures. A new production-unapplied forward migration reconciles secondary-exposure lifecycle, confidence, effective-interval and reviewer provenance with the approved typed contract; it creates no exposure and requires separate production authorization. The complete active migration chain replays locally with that migration, its environment-appropriate R4N pgTAP suite passes 41/41, the public schema diff is empty, all 85 public tables retain RLS, and database lint has only the inherited coverage-registry volatility warning.
- A disposable local baseline replay verified the complete history and R4N migration without changing committed historical migrations, the ordinary local database or production. The replay required the documented MOTHERSON fixture and four temporary filename normalizations, plus two reported structural compatibility repairs for historical NEWS/pg_cron ordering and disabled-policy retirement. R4N applied last in the disposable stack; all 19 pgTAP tests and direct schema/RLS/grant/immutability/empty-state/no-network checks passed. The stack and volumes were destroyed. `docs/R4N_Local_Migration_Replay_Audit_and_Fixture_Strategy.md` records the full result.
- The production deployment was limited to the three recorded checksum-pinned migrations. No database assignment, secondary exposure, provider action, evidence ingestion, scoring method, recommendation or sizing write was part of that deployment.

Detailed implementation and review boundaries are recorded in `R4M_Profile_Driven_Research_Workspace_Plan.md`.

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
- R2D: authenticated read-only production endpoint deployed and verified within the stated boundary.
- R2E: repository architecture/enforcement merged.
- Stage 8 scoring/recommendation: REFERENCE IMPLEMENTATION / PILOT ONLY, portfolio-wide incomplete.
- News Intelligence: automated operational capability for its defined official-NSE scope.

## I. Current limitations and unresolved breadth

These are explicit limitations, not invitations to fabricate values:

- one current holding remains outside latest cached-price coverage in the reconciled snapshot;
- historical OHLCV / momentum / volatility / drawdown evidence is not portfolio-wide;
- fundamental research breadth is far below all eligible equities;
- research-document breadth is narrow;
- sector/profile methodology architecture is now portfolio-coverage complete/fail-closed under Gate K, but company-specific evidence and score execution are not portfolio-wide;
- persisted deterministic score-run coverage is not portfolio-wide;
- recommendation coverage is still a reference path rather than portfolio-wide;
- formal Position Sizing persistence is not applied to production;
- formal Core Health, Exit Risk and Portfolio Fit engines are not portfolio-wide persisted engines;
- D34/D35 consumer surfaces must remain readiness/coverage surfaces until those engines exist;
- owner targets/min/max weights must never be overwritten by deterministic engine output;
- ETFs/non-equity assets must not be forced through equity-only scoring/sizing contracts;
- `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE`, conflict/review states and missing values are valid outputs and must remain explicit.

## J. Next work

The owner-authorized migration baseline cutover is active in the repository and verified in the ordinary local database: 78 historical SQL files remain byte-identical in the legacy archive, while the active directory contains 74 unique-version compatibility markers followed by deterministic schema, reference-registry and inert local-operational baseline migrations. A pre-reset inventory proved the ordinary local database contained no auth users or business rows, then `supabase db reset --local` successfully applied all 77 unique versions. Post-reset verification passed 29/29 relevant pgTAP assertions, 82/82 Vitest files and 444/444 tests, typecheck, architecture guard, production build, empty schema diff, error-level database lint, 85/85 public-table RLS, zero scheduler jobs and zero business/evidence/score/recommendation/sizing rows. Historical SQL-inspection tests now read the immutable archive. Known non-blocking debt remains: one database volatility warning, the superseded Stage 7.2A final-state pgTAP expectation, existing repository ESLint errors and the build chunk-size warning. The separately authorized read-only production-history inventory found production/local migration-ledger divergence, so deployment used a reviewed isolated compatibility-marker bundle rather than the ordinary migration directory. The three checksum-pinned forward migrations were applied to production on 16 September 2026 after a successful backup and a refreshed owner-authorized 492-transaction baseline. Post-deployment validation confirmed all three ledger rows, five immutable R4N contracts, zero assignments/exposures, RLS on all three tables, NEWS V6 retired with V7 current, byte-identical cron state, the portfolio-weight ambiguity removed, anonymous execution revoked, and exact preservation of 1 portfolio, 492 transactions, 273 securities, 458 fundamental observations and 4 recommendation runs. Linked database lint passed without errors with the inherited coverage-registry volatility warning. `docs/R4N_Production_Deployment_2026-09-16.md` records the evidence. Assignment, evidence ingestion, provider execution and scoring remain independently gated.

Post-Gate-K, the broader repository sequence is reconciled as:

1. **R3 — research evidence breadth expansion** using the existing provider-control/budget/freshness safeguards;
2. **R5 — market-history breadth expansion** through Angel One authority;
3. **R6 — readiness-driven deterministic scoring rollout** using the Gate-K methodology authorities;
4. **R7 — recommendation and position-sizing rollout** only after adequate evidence/scoring readiness;
5. **R8–R10 — Core Health / Portfolio Fit / Risk / Exit / Movement / Combined Action Center**;
6. **R11–R12 — scheduled maintenance and optional AI synthesis**, only after upstream manual/cohort rollout proves safe.

The older **R4 — generic sector/research-profile contracts** objective is superseded/completed by H→K and must not be rebuilt under a new Gate L/M label.

R3/R5/R6 must continue to use shared application classification only as classification evidence; sector-specific research profiles remain their own versioned methodology contracts and must fail closed when mandatory evidence/source/history requirements are unmet.

Any production provider cohort, broad refresh, scheduler activation, or additional database deployment still requires its own explicit production approval.

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
