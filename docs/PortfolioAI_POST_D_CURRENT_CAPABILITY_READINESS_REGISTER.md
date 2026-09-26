# PortfolioAI — Post-D Current Capability Readiness Register

**Status:** LIVING POST-D CURRENT-STATE REGISTER — UPDATED THROUGH P3 FORMAL CLOSURE  
**Branch:** `PortfolioAI-Development`  
**Freeze date:** 26 September 2026  
**Purpose:** Present-tense capability/readiness register for Post-D convergence  
**Governance:** Update after every major stage through the Standing Post-Stage Reconciliation Rule

## 1. Status vocabulary

- **PRESERVE** — capability/authority is already valid; do not rebuild it.
- **CONVERGE** — capability exists but needs broader real-portfolio rollout, integration, persistence decision, or UI reconciliation.
- **BLOCK** — do not advance until its explicit prerequisite/owner gate is satisfied.
- **DEFER** — valid future scope, intentionally outside current convergence work.

Maturity levels:
- **L1** specification complete
- **L2** contract implemented
- **L3** reference/fixture verified
- **L4** real-portfolio cohort verified
- **L5** portfolio-wide verified
- **L6** production-integrated
- **L7** operationally automated

A capability may be historically complete at a lower level without being product-complete.

## 2. Current capability register

| Capability | Canonical authority / access path | Lineage | Current maturity / state | P0 classification | Residual work |
|---|---|---|---|---|---|
| Transactions and accounting | Trusted `transactions` ledger → accounting/shared portfolio model | Stages 5/5.1 | L6; production-integrated; Dev real-data acceptance verified | PRESERVE | Regression-test after convergence; do not replace ledger authority |
| Holdings / open quantity | Transaction-derived portfolio/accounting layer → shared portfolio model | Stages 5/5.1 | L6 | PRESERVE | Cross-surface regression only |
| Portfolio roles / owner settings | `portfolio_security_settings` | Stage 6 / R2E | L6; sparse owner settings are truthful | PRESERVE | No engine inference; UI must keep UNCLASSIFIED when unset |
| Themes | `themes` + `theme_securities` | Stage 6 | Membership L6; analytics partial | PRESERVE / CONVERGE | Preserve membership; richer analytics only where already planned |
| Asset class | Canonical security master | Stage 6 | L6 | PRESERVE | Keep separate from role and research profile |
| Current price | Angel One cached market-price authority → market-data repository → shared portfolio model | Stage 4 | Production L6; Dev real-data path verified 244/248 | PRESERVE | Keep four genuinely unpriced holdings unavailable; no fallback authority |
| Current value / unrealised P&L / weight | Canonical quantity/accounting + canonical current price | Stages 5/6 | L6 where priced | PRESERVE | Maintain partial-coverage semantics |
| Application sector / industry / market-cap | `current_security_enrichment_v1` → shared enrichment path | Stage 7 / R2E / Gate K | Sector/market-cap broad; industry narrower; industry-first rule frozen | PRESERVE / CONVERGE | Resolve only reviewed missing classification; no page-local taxonomy |
| Research profile / subprofile routing | Versioned profile/subprofile contracts using industry/business-model prerequisites | R4/R4N / Gates E–K | L3–L5 architecture; fail-closed | CONVERGE | Reconcile current assignments and readiness; no sector-only specialised routing |
| Research evidence | Reviewed observations/documents/provenance through research repository | Stage 7 / R3 / Program A | L3 overall; selected L4/L6 paths; breadth sparse | CONVERGE | Existing R3/Program A rollout only; no fabricated coverage |
| Research documents | `research_documents` + source metadata | Stage 7 | L3–L4; narrow breadth | CONVERGE | Expand only where required for readiness |
| Provider control plane | Existing service-only budgets, leases, usage accounting, freshness and kill switches | Stage 7.2 / Program A | L6 control architecture; bounded pilots completed | PRESERVE | Reuse; no new provider-control authority |
| Historical OHLCV / market history | Angel One canonical stored history → market repository | Stage 8.6E / R5 / Program A | L3; narrow pilot/reference coverage | CONVERGE | Portfolio-wide existing incremental mechanism requires later gated rollout |
| Momentum / market-derived analytics | PortfolioAI deterministic engines over canonical OHLCV | Stage 8 / R5 | Reference/pilot only | CONVERGE | Requires historical breadth first |
| NSE News Intelligence | Normalized official NSE pipeline → shared News repository | N1–N6 | L7 operational in production; copied Dev evidence verified | PRESERVE | Preserve existing pipeline; do not absorb into R11 |
| R6 deterministic scoring | Approved methodology engines / scoring repository | Gate H / Program B / Gate K | L3; reference/contract complete, numeric breadth incomplete | CONVERGE | Execute only where methodology + evidence are ready |
| R7 recommendation | Deterministic recommendation engine/repository | Gate I / Program B | L3; reference complete, breadth/persistence incomplete | CONVERGE | Requires valid R6 lineage; no fabricated recommendation |
| Position sizing | D35B deterministic sizing contract; owner settings remain separate | R1 / Program B | L2–L3; engine contract complete; broad persistence not active | CONVERGE / BLOCK persistence | Decide persistence only after prerequisite readiness and owner gate |
| R8 Core Health / Fit / Risk / Exit | Program C deterministic contracts | Program C | L3 reference/fixture verified; real upstream breadth incomplete | CONVERGE | Run on current canonical real-portfolio facts after P4/P5 readiness |
| R9 Meaningful Change | Program C deterministic comparison model | Program C | L3; in-memory/reference baseline | CONVERGE / BLOCK persistence | Durable comparison baseline needs explicit persistence decision |
| R10 Action Center | Sole canonical Program C action-collection/precedence authority | Program C | L3 | CONVERGE | Integrate only current R6–R9 outputs; must remain sole action authority |
| R11 Operations | Program D dependency-driven orchestration + existing control plane | Program D | L3 local/adversarial; scheduler inactive | CONVERGE / BLOCK automation | Manual/dry-run development integration first; scheduler separately gated |
| R12 optional AI | Program D grounded interpretation only | Program D | L3 mock/local | DEFER / BLOCK real AI | Deterministic product must work without AI; any real AI call separately approved |
| Dashboard | Shared canonical repositories/view models | D1–D35 / R2E | Mixed L4–L6 by panel | CONVERGE | Remove stale/reference-only presentation; show only current canonical state |
| Holdings | Shared portfolio/accounting + enrichment | Stages 5/6 / R2E | L6 core facts | PRESERVE | Cross-surface consistency only |
| Portfolio Structure | Owner settings + themes + shared enrichment | Stage 6 / R2E | L6 core settings, sparse real owner roles | PRESERVE | No automatic role inference |
| Research workspace | Shared universal Research workspace + profile adapters | Stage 7 / R4M/R4N | L4–L6 shell; evidence/methodology varies | CONVERGE | Truthful readiness and current lineage |
| Intelligence workflow | R8/R9/R10 + optional R12 consumers | Programs C–D | L2–L3; components exist but fragmented | CONVERGE | Consolidate existing capabilities; do not create another engine |
| Scheduler / portfolio maintenance automation | R11 controls | Program D | L2–L3; disabled | BLOCK | Separate later approval after manual development proof |
| Production trading/order execution | None; explicitly outside product authority | Blueprint / safety controls | Not authorized | DEFER / BLOCK | No trading capability in Post-D convergence |

## 3. Current three realities

### Production
- `main` remains the production codeline.
- Production Supabase remains the real production backend.
- Production is the reference for current real-owner operational behavior.
- No P0 action may mutate production.

### Development
- `PortfolioAI-Development` is the active development codeline.
- Vercel Development Preview is isolated from production.
- Supabase project `PortfolioAI Dev` is the development backend.
- Stage 4 schema reconstruction is complete.
- Stage 5 real-data acceptance validation is complete/pass.
- Development resolves the real copied portfolio with 248 open holdings and 244/248 current-price coverage through the canonical path.

### Historical/local/reference
- The six-security/local fixtures remain valuable for deterministic regression and adversarial states.
- Program A–D closure evidence remains historically valid at its proven maturity level.
- Reference/fixture completion must not be presented as portfolio-wide or production-operational completion.

## 4. Pre-existing progress against future P1/P2/P3

### P1 — Source-Code Integration Baseline: PARTIALLY COMPLETE

Already complete:
- `PortfolioAI-Development` exists and is based on the accepted Program D remediation lineage.
- Program A–D work is materially present.
- Industry-first methodology invariant is already present in the Development branch.
- Development contains the currently required SPA rewrite.

Residual before P1 can close:
- Four `main`-only commits must be formally dispositioned.
- The production backup workflow on `main` is not present on Development and must be reviewed/ported or explicitly rejected during P1.
- Open PRs must be formally dispositioned without blind merge.
- Development ancestry/baseline must receive the P1 owner checkpoint.

### P2 — Isolated Development Environment & Schema Reconstruction: PARTIALLY COMPLETE / NEAR COMPLETE

Already complete:
- Separate Development Supabase exists.
- Repository-controlled schema was reconstructed and verified.
- RLS/Auth/ownership were validated.
- 27 approved Edge Functions were deployed to Development.
- Vercel Development Preview is bound to Development through branch-scoped variables.
- Canonical price path works; no second authority/fallback was introduced.
- Production remained unchanged.
- Providers, paid AI, trading and schedulers remain inactive.

Residual to prove before formal P2 closure:
- Reconcile any remaining P2 crossover safeguards not explicitly proved by Stage 4/5, especially an automated rejection of known production project refs and an unambiguous environment identity indicator if not already present.
- Formal P2 owner checkpoint must recognize the pre-existing evidence rather than repeat it.

### P3 — Acceptance Dataset & Current-State Register: COMPLETE / PASS / CLOSED

Already complete before P3:
- Production-equivalent real business/application data is operational in Development.
- Stage 5 manifest documents row counts, ownership remap, canonical resolution and known gaps.
- This document establishes the present-tense capability register.

Residuals completed by P3:
- the deterministic six-security local regression fixture is frozen as LOCAL ONLY and is distinct from the Development acceptance portfolio;
- a read-only Development check confirms the local fixture portfolio ID has zero rows in Development;
- field/data-family sanitization and licensing treatment is frozen in a machine-readable P3 policy;
- a repeatable, fail-closed acceptance refresh/rebuild procedure is now repository-controlled;
- P3 performs no unnecessary data recopy.

Owner Checkpoint 4 was approved on 26 September 2026. P3 is formally closed. P4 is authorized only through bounded-cohort planning until Owner Checkpoint 4A.

## 5. Open Git / PR topology freeze

At P0 audit time, the repository has four open PRs:

| PR | Current P0 disposition | Reason |
|---|---|---|
| #101 R4N Pharma subprofile architecture | CONTAINED / HISTORICAL OPEN PR | Its head is an ancestor of `PortfolioAI-Development` (Development is ahead with 0 commits behind it). Do not merge it into Development again. |
| #99 R4L PHARMA_V1 parent completion | REQUIRES P1 PATH-LEVEL DISPOSITION | Branch has diverged; later R4N/Gate work likely supersedes much content, but P0 does not assume full redundancy. No blind merge. |
| #98 R4K Pharma business-model subprofiles | REQUIRES P1 PATH-LEVEL DISPOSITION | Branch has diverged; later R4N/Gate work exists. No blind merge. |
| #78 D35 Position Sizing Health | REQUIRES P1 PATH-LEVEL DISPOSITION | Independent open PR against `main`; Development has later sizing work, but exact UI-content disposition must be audited. No blind merge. |

## 6. Main-only commit freeze

`main` is four commits ahead of the common base relative to Development history:

| Main-only commit | P0 disposition |
|---|---|
| `d0cc52d` industry-first research methodology lock | FUNCTIONALLY CONTAINED in Development; invariant is present. Preserve semantics, do not replay blindly. |
| `2a7d323` Vercel `/app` rewrites | FUNCTIONALLY CONTAINED / SUPERSEDED by Development `vercel.json` with the same required SPA routes. |
| `f7e25d7` initial catch-all Vercel config | SUPERSEDED by later main and Development SPA config. |
| `147f36b` manual encrypted Supabase DB backup workflow | NOT PRESENT in Development; P1 must review and deliberately port/preserve or explicitly reject it. |

## 7. Frozen non-goals / deferred scope

The following remain outside current convergence unless separately authorized:
- Why Stocks Moved automation
- calendar automation
- general alert automation
- target/stop notifications
- advanced thesis monitoring
- watchlist discovery
- screeners
- new-stock idea generation
- replacement-engine expansion
- broad Credit Intelligence
- broad Analyst Revision Intelligence
- broad AI synthesis
- advanced quant/backtesting
- trading or order generation

Existing NSE news automation is preserved operational scope, not a new Post-D project.

## 8. Permanent invariants

- Transactions remain holdings/accounting source of truth.
- One business fact has one canonical authority and one shared access path.
- Asset class remains separate from portfolio role.
- Industry/business-model evidence selects specialised research methodology; sector alone does not.
- Missing evidence remains null/unavailable/blocked, never silently zero.
- Owner settings remain owner-controlled.
- R10 remains the sole Action Center authority.
- Provider acquisition does not occur inside deterministic R6–R10 computation.
- AI cannot calculate or override deterministic facts.
- No page may create a competing authority, formula, taxonomy or fallback for an existing business fact.
- No production mutation, provider execution, paid AI, scheduler activation, trading, production migration, merge to `main`, or production deployment is implied by P0.

## 9. Next action

P0 itself is planning/reconciliation only. Once the P0 authority/readiness freeze is owner-approved, the next formal roadmap activity is **P1 residual reconciliation**, not a rebuild of already-proven P2/P3 work.
