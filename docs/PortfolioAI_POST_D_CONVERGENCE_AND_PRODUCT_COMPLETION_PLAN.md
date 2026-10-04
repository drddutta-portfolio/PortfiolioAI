# PortfolioAI Post-D Convergence and Product Completion Plan

**Document type:** Authoritative planning and audit document  
**Implementation authorization:** None  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Historical audited development line:** `program-d-operations-optional-ai`
**Current authoritative branch:** `PortfolioAI-Development`
**Original plan date:** 26 September 2026
**Last reconciled:** 4 October 2026, 18:11:19 IST (Asia/Kolkata; UTC+05:30)
**Audited Development HEAD:** `f2970a8970320e7525e272996ddcca59ba840542`

This plan does not authorize source-code changes, migrations, branch creation,
Supabase or Vercel changes, provider or AI calls, deployment, merge, push,
scheduler activation, production mutation, or implementation of any checkpoint.

---

## 1. Executive conclusion

**Current-state precedence — 4 October 2026:** Section 22 reconciles this plan
with the latest repository artifacts and supersedes earlier present-tense stage
labels below. P0–P7, P7-IC and IC-FINAL are closed within their recorded scopes.
P8 is active but V1 is stopped on feasibility. Workstream D is structurally
closed; Workstream E is COMPLETE / BLOCKED / CLOSED after its corrected rerun. The next path is an owner-reviewed design
for a separately versioned narrower experiment, before any outcome inspection.
This document update authorizes no experiment creation or execution.

PortfolioAI must now enter a **convergence and product-completion phase**, not
another feature program.

Programs A–D remain legitimately closed within their approved engineering
scopes. Their closure records must not be rewritten as failures. However, those
closures predominantly prove specifications, contracts, fixtures,
deterministic dispositions, and local safety—not complete real-portfolio
production operation.

The shortest safe path to a coherent PortfolioAI product is:

```text
ONE CODELINE
+
ONE ISOLATED DEVELOPMENT BASELINE
+
ONE RECONCILED DATABASE SCHEMA
+
ONE REAL-PORTFOLIO-EQUIVALENT PIPELINE
+
ONE CONSISTENT INVESTOR UI
+
ONE QUALIFIED RELEASE CANDIDATE
```

No independent feature Program E, R13/R14, Gate L/M, new scoring engine, additional Dashboard,
provider integration, trading capability, or broad AI expansion is authorized. The owner-approved
working label **Program E** refers only to the canonical **P7-IC Portfolio-wide Intelligence
Completion Remediation** checkpoint defined below. P7-IC is convergence/completion work using
existing R3/R4/R5/R6/R7/R8/R9/R10 authorities; it is not a fifth feature program.


**Final P7-IC planning audit — 29 September 2026:** APPROVE. The current repository planning package and the V2 owner plan are aligned with no material current contradiction. Governance remains unchanged: P7 active; IC0 audit complete/pass withheld; IC-A awaiting owner approval; IC1 not started/not authorized; P8 not authorized; Production unchanged. This is not implementation authorization.

### 1.1 Permanent capability maturity model

A capability must never be described simply as `COMPLETE`. Its exact maturity
level must be stated:

1. **L1 — SPECIFICATION COMPLETE**
2. **L2 — CONTRACT IMPLEMENTED**
3. **L3 — REFERENCE / FIXTURE VERIFIED**
4. **L4 — REAL-PORTFOLIO COHORT VERIFIED**
5. **L5 — PORTFOLIO-WIDE VERIFIED**
6. **L6 — PRODUCTION-INTEGRATED**
7. **L7 — OPERATIONALLY AUTOMATED**

Programs A–D may remain historically complete at L2–L3 while their product
rollout advances through L4–L7.

---

## 2. Canonical authority hierarchy

All Post-D work must follow this order:

1. `docs/PortfolioAI_Master_Blueprint.md`
2. `docs/PortfolioAI_Research_and_Intelligence_Architecture.md`
3. `docs/PortfolioAI_Single_Source_of_Truth_Architecture.md`
4. `docs/PortfolioAI_Database_Architecture.md`
5. `docs/PortfolioAI_Development_Rules.md`
6. `docs/PortfolioAI_Product_UI_and_Decision_Workflow.md`
7. `docs/PortfolioAI_Development_Status.md`
8. `docs/PortfolioAI_Requirements_Register.md`
9. Relevant stage, gate, and program documents
10. `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`

The Integration Plan and stage documents determine execution history, but they
cannot override the canonical architecture documents above them.

Permanent invariants:

- Transactions remain the holdings and accounting source of truth.
- One business fact has one canonical authority and shared access path.
- Asset class remains separate from portfolio role.
- Missing financial data remains null or unavailable.
- AI cannot calculate or override deterministic facts.
- Owner-controlled roles, weights, limits, targets, and decisions cannot be
  rewritten by an engine.
- R10 remains the sole Action Center authority.
- Provider activity does not occur inside deterministic R6–R10 computation.
- Product pages may not introduce competing queries, formulas, taxonomies, or
  fallback values for existing facts.

---

## 3. Full historical capability lineage

The build is one continuous lineage. Later Programs do not replace or erase
earlier origins.

### 3.1 Master Blueprint and foundational stages

The Master Blueprint established transaction-derived holdings and accounting,
portfolio roles and asset classes, provenance, deterministic investment
engines, sizing, movement, exit, research, optional AI, and human decision
authority. Monitoring, discovery, and backtesting were intentionally later
phases.

- **Stage 4:** market-data storage and current-price architecture.
- **Stages 5/5.1:** transaction ledger, imports, accounting, corrections, and
  historical auditability.
- **Stage 6:** portfolio classifications, asset classes, position settings,
  themes, and portfolio structure.

These capabilities are foundations and are not superseded by Programs A–D.

### 3.2 Research, providers, and workspace lineage

**Stage 7** created the fundamental-data and security-enrichment architecture.

**Stage 7.2** added:

- provider controls, budgets, kill switches, and usage accounting;
- cohort planning and orchestration;
- controlled provider pilots;
- research caches, freshness states, and conflicts;
- the Research workspace;
- evidence and document provenance;
- owner-confirmed manual refresh;
- Trendlyne discovery, parsing, mapping, and controlled promotion.

These mechanisms are the ancestors of both Program A evidence work and Program
D R11 orchestration.

**News stages N1–N6** separately established official-exchange sourcing,
canonical news storage, deterministic parsing and classification, linked
document capture, cached consumption, and scheduled production news operation.
R11 must not absorb or duplicate this approved news pipeline.

### 3.3 Stage 8 and Dashboard lineage

Stage 8 introduced sector-aware scoring, evidence-versus-score readiness,
bank/NBFC reference methodology, valuation and ownership readiness,
momentum/risk foundations, recommendation concepts, weight guidance, and the
first evidence-grounded AI interpretation path.

Dashboard stages D15–D35 added consumer surfaces for decision status, research
readiness, portfolio intelligence, risk, concentration, monitoring coverage,
allocation, performance, daily movement, Core Health/Exit readiness, and
position-sizing readiness.

Some Dashboard surfaces overtook the maturity of upstream engines. They must be
reconciled with actual authoritative readiness rather than rebuilt.

### 3.4 R1–R5 and R4N lineage

- **R1/D35B:** deterministic sizing contract with fail-closed evidence rules.
- **R2:** portfolio coverage registry and readiness/orchestration matrix.
- **R2E:** shared application classification and authority enforcement.
- **R3:** research evidence breadth.
- **R4:** reusable research profiles and sector methodologies.
- **R5:** historical market-data breadth.

R4N expanded Pharma from a generic sector profile into business-model-specific
subprofiles.

- **Gate E:** reviewed Pharma assignments and secondary-exposure decisions.
- **Gate F:** official/public evidence acquisition and canonical prerequisites.
- **Gate G:** deterministic dimension contracts, curves, isolation, readiness,
  and non-persisting dry runs. Many sub-gates remained proposals or explicit
  fail-closed deferrals.
- **Gate H:** first hand-verified, reproducible, non-persisting TORNTPHARM score.
- **Gate I:** first deterministic, explainable, non-persisting recommendation.
- **Gate J:** Pharma methodology portability without symbol-specific runtime
  authority.
- **Gate K:** portfolio-wide sector/profile routing architecture and fail-closed
  methodology coverage.

Gate K proved architecture coverage, not portfolio-wide evidence, numeric
scores, or recommendation coverage.

### 3.5 Post-Gate-K Programs

The Integration and Execution Plan defined R0–R12.

#### Program A

Program A inherited Stage 7, R3, and R5 mechanisms and established evidence
baselines, cache-only readiness, taxonomy prerequisites, and bounded provider
pilots.

**Valid closure meaning:** bounded-pilot and evidence-path completion.  
**Not implied:** portfolio-wide evidence freshness or market-history coverage.

#### Program B

Program B generalized Gates H/I/K into R6 score readiness and lineage, R7
recommendation readiness and lineage, sizing eligibility, and portfolio-wide
explicit disposition over a frozen snapshot.

**Valid closure meaning:** contract, reference, and fail-closed disposition
completion.  
**Not implied:** portfolio-wide numeric scores, recommendations, sizing
persistence, or production operation.

#### Program C

Program C inherited Stage 8 and Dashboard concepts and implemented R8 Core
Health/Fit/Risk/Exit, R9 meaningful change, R10 canonical Action Center, shared
consumption, and frozen-universe disposition across 238 holdings.

**Valid closure meaning:** deterministic engine/reference-fixture completion and
explicit disposition.  
**Not implied:** complete upstream inputs, persistent R8–R10 operation, live
production execution, or actionable numeric sizing.

#### Program D

Program D inherited Stage 7.2 controls, orchestration patterns, and Stage 8 AI
interpretation. It implemented R11 dependency-driven local orchestration and R12
grounded optional interpretation with adversarial validation.

Independent remediation corrected the final audit so repository facts are
executable evidence and external facts remain labelled manual snapshots.

**Valid closure meaning:** local orchestration and AI-boundary completion.  
**Not implied:** scheduler activation, real provider execution, real AI,
production persistence, merge, or deployment.

---

## 4. Current Git topology

### 4.1 Reverified state

```text
Local branch:
program-d-operations-optional-ai

Local and tracked remote HEAD:
59c89a18cb470c6402cc3c0a1316b75e0eae4641

origin/main:
d0cc52dfcf61fc9a884f139fcc7931b3bd73c57b

Relative position:
main-only commits:       4
Program-D-only commits:  2,046

Three-dot diff:
1,095 files changed
171,312 insertions
545 deletions
```

The Program D branch includes independent-audit remediation `34be570` and its
committed closure record `59c89a1`.

### 4.2 Main-only content

The four observed `main`-only commits concern:

- the industry-first research-methodology documentation lock;
- two Vercel configuration changes;
- the encrypted Supabase backup workflow.

Each must be classified as required, superseded, environment-specific, or
historical before the development baseline is frozen.

### 4.3 Open-PR ancestry

Repository records contain a nested R4/R4N pull-request lineage, including draft
PR #101. The authoritative open/merged PR graph must be queried again during P0
before reconciliation. Older status text must not be assumed current.

### 4.4 Development branch name

Verified with `git check-ref-format`:

```text
PortfolioAI Development
```

is not a valid Git ref because it contains a space.

- **Requested human-readable name:** PortfolioAI Development
- **Recommended valid Git ref:** `PortfolioAI-Development`
- **Alternative conventional ref:** `portfolioai-development`

The owner must select the final ref. This plan does not create it.

---

## 5. Current database and environment topology

### 5.1 Production

```text
main
→ Vercel Production
→ existing Production Supabase
```

Production serves the older application state against the real owner portfolio.

### 5.2 Local

A local Supabase stack exists and is used primarily with validation fixtures,
including the six-security UI fixture. The local frontend uses an ignored local
environment file. The Edge Functions environment file is ignored and untracked.

### 5.3 Migration state

The repository contains 86 migration files. The linked migration ledger is not
linearly equivalent to the repository:

- early migrations match;
- numerous production-only historical versions exist;
- numerous repository compatibility markers and baselines exist;
- later Program A migrations are repository-only;
- Program D added no migrations.

`PortfolioAI Dev` must not be created by blind production cloning, blind schema
push, assuming local equals production, rewriting migration history, or editing
already-applied migrations.

It must be created from an approved and proven reconstruction procedure.

---

## 6. Deployed UI versus Program D UI

| Concern | Deployed production | Local Program D | Required convergence |
|---|---|---|---|
| Dataset | Real owner portfolio | Six-security fixture | Production-equivalent acceptance data |
| Code generation | Older `main` | New Program D line | One reconciled development baseline |
| Navigation | Older product routes | Adds Operations and Investment Committee | Canonical compact navigation |
| Intelligence | Dashboard/Research fragments | R8–R10 distributed | One Intelligence workflow |
| Operations | Earlier provider settings | D2 validation page | Settings/Admin operations |
| Investment Committee | Not integrated as current workflow | Frozen/mock packet | Optional Intelligence child surface |
| Prices/accounting | Real portfolio evidence | Mostly unavailable fixture state | Same canonical path in development |
| R6–R10 | Earlier/reference state | New local contracts | Real-portfolio execution and consistency |
| Stage terminology | Limited | Engineering identifiers dominate | Diagnostics-only terminology |

The intended top-level product navigation is:

```text
Dashboard
Holdings
Portfolio Structure
Research
Intelligence
Transactions
Settings

Import is accessed from Settings and is not a primary navigation item.
```

`Operations` and `Investment Committee` should not remain ordinary primary
investor destinations:

- Operations/provider controls belong under **Settings → Data & Operations**.
- Technical validation belongs in diagnostics.
- Investment Committee belongs inside **Intelligence**.
- R8, R9, and R10 converge inside **Intelligence**.
- Gate/program identifiers do not dominate the normal investor workflow.

---

## 7. Capability maturity matrix

| Capability and lineage | Current state | Blocker / recommended action | Maturity |
|---|---|---|---|
| Transactions/accounting — Stages 5/5.1 | Audited, transaction-derived, production-integrated | Preserve and regression-test after convergence | L6 |
| Roles, asset class, structure — Stage 6/R2E | Canonical settings and enrichment in production | Revalidate after source/schema convergence | L6 |
| Themes — Stage 6 | Membership implemented; analytics partial | Preserve; do not expand during convergence | L6 membership / L2 analytics |
| Current prices — Stage 4 | Production path exists; fixture lacks coverage | Connect development to approved dev evidence | L6 production / L3 local |
| Historical market data — Stage 8.6E/R5 | Narrow reference/pilot history | Roll out existing incremental mechanism | L3 |
| Research evidence — Stage 7/Gate F/R3/A | Strong model and controls; breadth incomplete | Cohort, then eligible-universe rollout | L3; selected L4/L6 |
| Documents/news — Stage 7/N1–N6 | Documents narrow; NSE news operational | Preserve news; expand documents only for readiness | News L7 / documents L3–L4 |
| Profile routing — R4/R4N/Gates E–K | Architecture fail-closed across portfolio | Reconcile current classifications/assignments | L3–L5 architecture |
| Pharma methodology — Gates G–J | Detailed contracts; some methods proposed/deferred | Activate only approved evidence-ready methods | L2–L4 by subprofile |
| R6 scoring — Gate H/Program B | Contract/reference complete; numeric breadth incomplete | Execute against current canonical portfolio data | L3 |
| R7 recommendations — Gate I/Program B | Contract/reference complete; persistence off | Execute only after R6 readiness | L3 |
| Position sizing — R1/Program B | Contract exists; directional authority often absent | Fail closed; never fabricate sizing | L2–L3 |
| R8 Health/Fit/Risk/Exit — Program C | Deterministic reference complete; persistence off | Run on real portfolio and decide persistence | L3 |
| R9 Meaningful Change — Program C | Deterministic, in-memory baseline | Decide durable baseline after data convergence | L3 |
| R10 Action Center — Program C | One canonical collection and precedence contract | Integrate real upstream outputs | L3 |
| R11 operations — Stage 7.2/Program D | Local adversarial validation; no live scheduler | Manual/dry-run integration first | L3 |
| R12 AI Committee — Stage 8.9A/Program D | Grounding verified in mock mode | Keep optional and disabled | L3 mock |
| Dashboard | D1–D35 | Rich surfaces, mixed upstream maturity | Show current canonical state only | L4–L6 by panel |
| Intelligence workflow | UI plan/Programs C–D | Components exist; no unified route | Consolidate existing consumers | L2–L3 |
| Scheduler/notifications | N6/R11 | News operational; portfolio maintenance disabled | Separate later approval | News L7 / R11 L2–L3 |

---

## 8. UI-to-backend reconciliation matrix

| Investor question | Canonical backend | Product surface | Current gap |
|---|---|---|---|
| What do I own? | Transactions → holdings → accounting | Dashboard, Holdings | Environments differ |
| How is it structured? | Owner settings and trusted enrichment | Portfolio Structure | Real/local coverage differs |
| What evidence exists? | Observations, documents, news, provenance | Research | Breadth/readiness incomplete |
| What is happening? | Prices, history, R9, news | Dashboard, Intelligence | R9 lacks durable real baseline |
| What requires attention? | Sole canonical R10 collection | Dashboard, Intelligence, badges | Real upstream coverage incomplete |
| Why is it recommended? | R6 → R7 → R8/R10 lineage | Research, Intelligence | Historical and current states overlap |
| What decision did I make? | Owner decisions/settings | Intelligence, Structure | Human decision workflow fragmented |
| Is data current? | R2 coverage/freshness/operations | Research, Settings | Engineering detail too visible |
| What is automated? | R11 operational controls | Settings/Admin | Current page is a validation harness |
| What does AI add? | R12 interpretation only | Intelligence | Mock-only and optional |

---

## 9. Exact Post-D roadmap

The roadmap contains nine implementation stages plus final closure, with a small
number of meaningful owner checkpoints.

### P0 — Authority and scope reconciliation

**Purpose:** Freeze feature expansion and establish one authoritative
present-tense inventory.

**Entry conditions:**

- Program D remediation closure is committed.
- No new feature program is authorized.
- Canonical documents are available.

**Work:**

- Create the current capability-readiness register.
- Map every capability to its origin and implementation.
- Classify each requirement as converge, preserve, block, or defer.
- Record the three current realities.
- Re-query PR and branch topology.
- Freeze non-goals and deferred work.

**Exit criteria:**

- Every material capability has a maturity level.
- No requirement is simply `COMPLETE`.
- No duplicate engine or UI is authorized.
- Disputed authority mappings are identified.

**Owner checkpoint 1:** Approve the authority register and frozen scope.

### P1 — Source-code integration baseline

**Purpose:** Establish one development codeline containing the latest approved
capability without changing `main`.

**Strategy:**

1. Use the verified Program D remediation head as the candidate baseline.
2. Inspect the four `main`-only commits independently.
3. Port only content still required.
4. Preserve applicable backup/deployment configuration safely.
5. Reconcile the industry-first lock with newer canonical documents.
6. Record superseded content explicitly.
7. Do not merge all of `main` blindly.
8. Inventory open PRs as contained, required, superseded, or historical.

**Entry conditions:** P0 approved; branch name selected; PR graph available.

**Exit criteria:**

- One reviewed development graph exists.
- No unexplained `main`-only differences remain.
- No approved Program A–D capability is omitted.
- Architecture, tests, types, lint, and build pass.
- `main` remains unchanged.

**Owner checkpoint 2:** Approve the development baseline and ancestry.

### P2 — Isolated development environment and schema reconstruction

**Target topology:**

```text
PortfolioAI-Development
→ Vercel Preview / Development
→ PortfolioAI Dev
```

`PortfolioAI Dev` must be a separate Supabase project with separate URL, keys,
database credentials, Auth, Storage, Edge Functions, secrets, provider controls,
scheduler state, and dataset.

**Schema procedure:**

1. Capture read-only production migration/schema inventory.
2. Classify matched, repository-only, production-only, compatibility, baseline,
   and superseded migrations.
3. Prove repository replay into a disposable empty database.
4. Correct replay defects only with new additive migrations.
5. Compare the result with the intended canonical schema.
6. Create `PortfolioAI Dev` only after approval.
7. Apply only the approved development migration set.
8. Deploy development Edge Functions only after security review.
9. Keep provider ingestion, AI, and R11 scheduling disabled.

**Crossover safeguards:**

- Preview receives only development Supabase values.
- Production variables are not inherited into preview.
- Service-role secrets never enter frontend variables.
- The UI exposes an unambiguous environment marker.
- Automated guards reject known production project refs in development.
- Development and production migrations require separate approvals.
- Merge approval never implies database approval.

**Exit criteria:** fresh replay succeeds; RLS passes; preview connects only to
development; production is unchanged; providers, AI, and schedulers remain off.

**Owner checkpoint 3:** Approve the isolated environment after separation proof.

### P3 — Acceptance dataset and current-state register

Retain two permanent datasets.

#### Deterministic regression fixture

The six-security fixture remains appropriate for exact calculations, null and
blocked states, R6–R12 regression, and fast reproducible tests.

#### Production-equivalent acceptance dataset

Create either an owner-approved sanitized real-portfolio snapshot or a
structurally equivalent dataset with the same transaction, security,
classification, evidence, and readiness characteristics.

Preserve structural relationships, asset/role variety, profile variety,
partial-data states, conflicts, stale evidence, and representative documents.
Exclude or transform production identity, credentials, tokens, sensitive notes,
irrelevant operational logs, and data prohibited by licence.

**Exit criteria:** both datasets have distinct documented purposes; sanitization
is documented; acceptance testing cannot mutate production.

### P4 — Existing evidence and market-data rollout

Roll out existing R3/R5/Program A mechanisms in this order:

1. Identity and eligibility
2. Classification/profile readiness
3. Current-price coverage
4. Historical-price and benchmark coverage
5. Fundamental evidence
6. Valuation evidence
7. Ownership/governance evidence
8. Documents
9. Freshness/conflict resolution
10. Profile readiness

**Exit criteria:** every eligible holding is ready, blocked with a canonical
reason, not applicable, or owner-deferred. No unknown value becomes zero. No
provider sweep occurs without a cost estimate and approval.

**Owner checkpoint 4A:** APPROVED / COMPLETE / PASS.  
**Owner checkpoint 4B:** APPROVED / COMPLETE / PASS.

**Execution result — 27 September 2026:** P4 is **COMPLETE / PASS / CLOSED** in PortfolioAI Dev. All 248 open holdings have a persisted terminal readiness state; zero states remain unknown. All 239 equities are classification-ready with verified AngelOne mapping/current price/daily history. Research gaps are retained as explicit canonical blockers or not-applicable states rather than inferred values. Production was unchanged. **P5 remains NOT AUTHORIZED.**

### P5 — Existing R6/R7 real-portfolio execution

For every holding:

1. Resolve methodology and evidence readiness.
2. Issue the canonical R6 disposition.
3. Calculate a score only when complete.
4. Issue the canonical R7 disposition.
5. Calculate a recommendation only when eligible.
6. Determine sizing eligibility.
7. Preserve input hashes and lineage.
8. Keep owner settings immutable.

**Exit criteria:** portfolio-wide disposition exists; numeric coverage is
reported separately; blockers have canonical reasons; reference outputs are not
presented as current facts; persistence is explicit; cross-surface consistency
passes.

**Execution result — 27 September 2026:** P5 is **COMPLETE / PASS / CLOSED** in PortfolioAI Dev. All 248 open holdings have a persisted `P5_TERMINAL_DISPOSITION_V1` record with explicit methodology, R6, R7 and sizing states. Methodology resolution is 110 RESOLVED / 124 METHODOLOGY_NOT_AVAILABLE / 5 REVIEW_REQUIRED / 9 NOT_APPLICABLE. Current numeric score, recommendation and sizing coverage is 0/239 equities because no current canonical P5 score-input snapshot exists; historical reference artifacts and DRAFT recommendation policies were not promoted into current facts. Owner settings remained unchanged. P6 remains NOT AUTHORIZED; Production remains unchanged.

### P6 — Existing R8–R12 product integration

- Integrate R8 Health/Fit/Risk/Exit with current R6/R7 and portfolio facts.
- Establish a development R9 comparison baseline only after persistence design
  approval.
- Keep price movement separate from evidence, score, recommendation, and owner
  setting changes.
- Preserve one canonical R10 Action Center.
- Progress R11 through dry-run, manual development execution, bounded cohort,
  recovery validation, then portfolio-wide development operation.
- Keep R12 optional and on demand; real AI remains separately gated.

**Exit criteria:** R8–R10 use current upstream facts; R10 agrees across all
surfaces; R11 manual operation is auditable and fail-closed; deterministic
operation does not depend on AI; no scheduler or production execution is
implied.

**Execution result — 27 September 2026:** P6 is **COMPLETE / PASS / CLOSED** in PortfolioAI Dev. The live R8 → R9 → R10 chain consumes the current P5 terminal authority through an authenticated Development-only read bridge. R9 remains in-memory only, R10 remains recomputed canonical authority, R11 remains manual/auditable/fail-closed with schedulers disabled, and R12 remains LOCAL_MOCK_ONLY. No provider calls, score/recommendation/sizing runs, owner-setting mutations, migrations, Production changes or merge to `main` occurred.

**Owner checkpoint 5:** **APPROVED / CLOSED** — integrated deterministic state and persistence decisions are frozen: R8 recompute/no new persistence; R9 in-memory/no durable baseline; R10 recomputation/no competing snapshot; R11 existing manual operational ledger/no scheduler; R12 browser-local mock cache/no real AI.

### P7 — UI consolidation

Required method:

```text
Approved UI workflow
→ backend capability audit
→ UI/backend gap matrix
→ integration
→ real-data browser validation
```

Required product structure:

```text
Dashboard
Holdings
Portfolio Structure
Research
Intelligence
Transactions
Settings
```

Import remains available from Settings and is not a primary navigation item.

**Intelligence contains:** Core Health, Portfolio Fit, Risk, Exit Intelligence,
Meaningful Change, Action Center, and optional Investment Committee narrative.

**Settings/Admin contains:** data sources, provider controls, refresh planning,
operations history, diagnostics, and environment state.

**UI rules:**

- One current state per fact.
- Historical scores are clearly labelled.
- Fixtures never appear as current portfolio results.
- Owner decisions remain separate from engine recommendations.
- Blockers use investor language.
- Stage/gate/program identifiers stay in diagnostics.
- No placeholder implies unsupported backend capability.

**Exit criteria:** the user can answer what they own, what is happening, what
requires attention, and what evidence supports the action without understanding
repository program terminology.

**Execution result — refined 28 September 2026:** the P7 shell/UI consolidation is technically implemented in PortfolioAI Dev. The product shell now has exactly the seven approved top-level products, with Import nested under Settings; detailed decision intelligence is consolidated under Intelligence; provider/operations controls are grouped under Settings; historical Gate/fixture outputs are removed from current Research; owner controls are separated from engine outputs; blockers use investor language; unsupported duplicate placeholders were removed; and the Dashboard Allocation & Performance block uses the approved compact four-row presentation with responsive alignment.

P7 is intentionally **NOT CLOSED**. Master-Blueprint reconciliation identified a material product-completion gap: current portfolio-wide methodology/evidence/numeric recommendation coverage and the full multi-period Movement Engine are not yet operational across the eligible portfolio. The mandatory **P7-IC Portfolio-wide Intelligence Completion Remediation** must therefore complete before final Owner Checkpoint 6 acceptance.

### P7-IC — Portfolio-wide Intelligence Completion Remediation

**Working label:** Program E  
**Canonical meaning:** convergence/remediation checkpoint inside P7, not a new feature program.

Authoritative detailed plan:

`docs/PortfolioAI_POST_D_P7_IC_PORTFOLIO_INTELLIGENCE_COMPLETION_PLAN.md`

Required sequence:

```text
IC0  Authority + portfolio coverage freeze
  ↓
IC1  Methodology + recommendation-policy completion
  ↓
IC2  Evidence / market-history remediation
  ↓
IC3  Current canonical evidence snapshots
  ↓
IC4  R6 current portfolio scoring
  ↓
IC5  R7 recommendation / Core-Satellite candidacy / sizing readiness
  ↓
IC6  R8 + R9 + Movement Engine operationalization
  ↓
IC7  R10 + final P7 UI integration
  ↓
IC-FINAL portfolio-wide validation
  ↓
Owner Checkpoint 6
  ↓
P7 COMPLETE / PASS / CLOSED
```

P7-IC must preserve fail-closed semantics. It does **not** require a numeric score or recommendation for every equity at any cost. Every eligible security must instead reach either the deepest valid current assessment supported by approved methodology/evidence or an explicit canonical blocker.

P7-IC must not introduce a replacement scoring/recommendation engine, universal Pharma thresholds, automatic role mutation, autonomous trading, or a competing Action Center. R10 remains the sole Action Center authority and owner portfolio role remains authoritative.

**Operational amendment — 28 September 2026:**

- methodology validation is performed by methodology/subprofile, reusing existing Gate H-K reference stocks wherever valid; a representative stock proves a methodology contract but never substitutes for another company's evidence;
- IC2 is cache-first and persistence-first: normal stock-page or Dashboard browsing is zero-provider-call; accepted Trendlyne/Angel evidence is stored with provenance, evidence/as-of date, retrieval date, freshness/stale state and canonical-selection status;
- stock research cards must expose evidence/period date, last fetched/retrieved date and freshness state;
- Trendlyne execution is portfolio completion by bounded daily cohorts, not a one-stock-per-sector rollout;
- the current planning ceiling is 400 Trendlyne calls/day with a default P7-IC operating envelope of 320 planned calls/day and approximately 80 calls reserved for bounded retries/diagnostics/exceptions;
- five calls/security is only a conservative budgeting model: 239 equities × 5 = 1,195 calls before cache savings; exact batch plans must be derived from the current missing/stale/conflicting evidence matrix;
- at a nominal five calls/security and 320 planned calls/day, a worst-case rollout is approximately four provider days; completed cohorts may progress only within the currently approved checkpoint range and must stop at the next unapproved owner checkpoint;
- R7 remains the canonical role-candidacy authority (Core Candidate / Satellite Candidate / Watch / Avoid). A simple owner-facing Accumulate / Hold / Watch / Reduce / Exit Review label may be shown only as a deterministic, explainable projection of R7 + R8 + owner context; it is not a second recommendation engine and cannot mutate roles or trade.

**Portfolio-completion amendment — strengthened before IC-A approval:**

- Gate K remains historically closed; its routing/isolation/portability discipline is reused inside P7-IC rather than reopened.
- P7-IC IC1 is now the mandatory **held-portfolio methodology and recommendation-policy completion gate**.
- For every held equity the research hierarchy must resolve through `Sector → Industry → Basic Industry / Business Model → Subprofile where needed → COMPLETE methodology`.
- A complete methodology includes evidence requirements, metric applicability/N/A rules, dimensions/weights/curves, quality/durability/growth logic, capital-efficiency/cash-flow treatment, leverage/credit treatment, valuation, benchmark/peer authority, ownership/governance, momentum/risk, cycle normalization where relevant, blockers/freshness, deterministic R6 semantics, R7 policy, validation anchors, isolation tests and future-stock portability.
- `METHODOLOGY_NOT_AVAILABLE` for a current held equity is an IC1 work trigger when the cause is historically deferred methodology engineering; it is not an acceptable IC1 closure state merely because Gate K deferred that business model.
- Every complete methodology/profile/subprofile used by the current held portfolio must leave IC1 with a complete approved R7 policy. Existing `...RECOMMENDATION_PENDING_THRESHOLDS` authorities are IC1 work items, not completion states.
- IC1 may leave a held equity unresolved only for a genuine factual/classification ambiguity that prevents safe methodology assignment; the blocker must be explicit, owner-visible and actioned as `REVIEW_REQUIRED`.
- P7-IC must not create a later cleanup program merely to finish methodologies or recommendation policies for business models already represented in the current held portfolio.
- The canonical internal owner-facing action enum is `ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`, derived only as a deterministic projection of canonical R7 + R8 + Movement/context; the UI may display “Buy / Accumulate” or “Sell / Exit Review” as plain-language copy, but `BUY`/`SELL` are not competing internal action states and score alone cannot create an action label.
- Canonical action projection executes only after the required IC6 R8 + Movement authorities exist; IC5 produces R7 candidacy/sizing readiness but no authoritative owner-facing action state.

**Checkpoint and persistence clarification — frozen before IC-A approval:**

- owner checkpoints are global barriers: IC1 stops at IC-B; IC2/IC3 stop at IC-C; IC4/IC5 stop at IC-D; IC6 stops at IC-E; no bounded cohort may cross an unapproved checkpoint;
- IC-A, when approved, may authorize strengthened IC1 methodology/R7-policy completion and design-only work for the additive persistence/access capabilities identified by IC0;
- IC-A does not authorize migration creation/application, provider execution, Production change, or deployment;
- any required additive migration returns for separate owner approval under repository migration rules;
- canonical current evidence-snapshot persistence/access must be resolved before IC3 can pass / IC-C can be approved;
- methodology requirement registries/read models required to calculate exact IC2 evidence deficits must be available before provider-backed IC2 execution;
- durable R9 baseline/acknowledgement/snooze and multi-period Movement history must be resolved before IC6 can pass / IC-E can be approved.

**Owner checkpoint 6:** DEFERRED UNTIL P7-IC IC-FINAL — final browser approval using production-equivalent Development data and the real current R6/R7/R8/R9/Movement/R10 outputs.

P8 remains **NOT AUTHORIZED** until P7-IC completes and the owner explicitly closes P7.

### P8 — Release-candidate qualification

**Scope reconciliation — 4 October 2026:** Later owner-authorized P8 documents
use P8 for Advanced Quant / Backtesting, consistent with Blueprint Phase 8.
The release-candidate requirements below remain outstanding obligations before
P-FINAL; backtesting closure does not substitute for release qualification.
Section 22 records this naming divergence and the owner decision required to
freeze the combined completion sequence. No new program or numbered stage is
created by this reconciliation.

Required checks:

- full test suite;
- architecture guard;
- TypeScript and ESLint;
- production build;
- migration replay and schema diff;
- RLS and ownership tests;
- cross-surface canonical-fact tests;
- financial hand-verification;
- provider-disabled and AI-disabled safety;
- secret and environment-crossover scans;
- browser workflows;
- performance and error-state review;
- backup/recovery review;
- `git diff --check`.

The release package includes exact commit, migration set, schema diff,
environment-variable manifest without values, Edge Function manifest, dataset
manifest, limitations, deferred work, rollback plan, production migration plan,
and deployment plan.

**Exit criteria:** one immutable candidate is approved. Defects return to the
development branch and produce a new candidate.

### P-FINAL — Post-D convergence closure

Closure requires:

- one canonical development codeline;
- reproducible development schema;
- isolated preview environment;
- production-equivalent acceptance data;
- portfolio-wide readiness/disposition;
- consistent R6–R10 facts;
- coherent investor UI;
- release-candidate validation;
- separate production approvals documented;
- no unexplained architecture divergence.

P-FINAL does not itself authorize production deployment.

---

## 10. Owner approval gates

Separate approval is mandatory for:

1. P0 authority/readiness register
2. Development Git ref and baseline
3. Creation/configuration of `PortfolioAI Dev`
4. Application of development migrations
5. Vercel Preview configuration
6. Import of sanitized acceptance data
7. Any real provider execution in development
8. Any R8–R10 persistence decision
9. Any real AI call
10. Scheduler activation
11. Merge into `main`
12. Production database migration
13. Vercel production deployment

These approvals are independent. One never implies another.

---

## 11. Git reconciliation strategy

The safe strategy is not a bulk merge into `main`.

1. Freeze refs and record commit identities.
2. Use the Program D remediation head as the candidate baseline.
3. Audit each `main`-only commit.
4. Reapply required content deliberately.
5. Map open PR content to the candidate tree.
6. Prove no approved capability is missing.
7. Run full validation.
8. Establish the owner-approved development ref.
9. Develop and validate there.
10. Create a reviewed integration PR only after P8.
11. Keep `main` and production unchanged until separate release approval.

A squash-only strategy is not recommended because it would reduce historical
traceability. Any history compaction requires a separate owner decision.

---

## 12. Database reconciliation strategy

Canonical database state is defined by:

```text
versioned repository migrations
+ explicit compatibility/baseline policy
+ verified fresh replay
+ verified production-difference report
```

It is not defined by whichever database happens to contain the most objects.

- Never edit applied migrations.
- Never mark migrations applied merely to hide divergence.
- Never remove production-only objects without ownership assessment.
- Use additive reconciliation migrations.
- Preserve RLS, provenance, and historical evidence.
- Treat unexplained production functions/triggers as unknown until resolved.
- Regenerate database types after schema freeze.
- Decide R8–R12 persistence separately for each fact.
- Keep orchestration ledger facts separate from investment-decision facts.

---

## 13. Real-portfolio acceptance strategy

| Test class | Six-security fixture | Production-equivalent dataset |
|---|---:|---:|
| Exact deterministic arithmetic | Required | Supplemental |
| Null/blocked cases | Required | Required |
| Fast regression | Required | No |
| Portfolio breadth | No | Required |
| Real classification mix | No | Required |
| Real evidence gaps | Limited | Required |
| Navigation/workflow acceptance | Insufficient alone | Required |
| Performance/volume | No | Required |
| Release approval | Insufficient alone | Required |

Production data must not be copied wholesale. A field-level sanitization and
licensing review is required.

---

## 14. Documentation convergence

Create one authoritative current-state register while retaining historical
records.

Required fields:

- Capability ID
- Canonical authority and shared access path
- Originating stage/gate
- Latest program
- Specification status
- Contract status
- Fixture status
- Real-cohort status
- Portfolio-wide status
- Persistence status
- UI status
- Production status
- Automation status
- Current blocker
- Next approved action
- Owner decision required
- Last verified commit/date

Historical Development Status and Cumulative Handoff entries remain audit
history. Their former current-state statements are superseded, not deleted.

---

## 15. Explicitly deferred work

Audit and preserve, but do not authorize during convergence:

- Why Stocks Moved automation
- Calendar automation
- General alert automation
- Target/stop notifications
- Advanced thesis monitoring
- Watchlist discovery
- Screeners
- New-stock idea generation
- Replacement-engine expansion
- Broad Credit Intelligence
- Broad Analyst Revision Intelligence
- Broad AI synthesis
- Advanced quant/backtesting
- Trading or order generation

Existing NSE news automation is operational scope to preserve, not a new Post-D
project.

---

## 16. Explicit non-goals

Post-D convergence will not:

- create Program E, R13/R14, or Gate L/M;
- invent another scoring or recommendation engine;
- create another Dashboard;
- replace canonical accounting;
- infer classifications from ticker/name guesses;
- activate unsupported numeric results;
- introduce autonomous portfolio decisions or trading;
- automatically clone or migrate production;
- automatically call providers or enable AI;
- treat merge approval as database approval;
- treat deployment approval as scheduler approval.

---

## 17. Stop conditions

Stop and return to the owner if:

- canonical documents conflict on a business fact;
- a required `main` commit cannot be safely reconciled;
- repository replay cannot reconstruct the intended schema;
- production-only schema objects have unknown ownership;
- development resolves to production Supabase;
- preview contains production credentials;
- sanitization cannot protect sensitive or licensed data;
- RLS or ownership tests fail;
- a page introduces a second authority;
- numeric output would require invented evidence;
- provider cost or entitlement is unclear;
- the real cohort produces unexplained cross-surface differences;
- R10 differs between consumer surfaces;
- a requested UI state has no canonical backend fact;
- a change would alter completed financial semantics;
- production action lacks its specific approval.

---

## 18. Definition of Product Capability Complete

A PortfolioAI capability is **PRODUCT CAPABILITY COMPLETE** only when all
applicable conditions hold:

1. It is required by an approved canonical plan.
2. Its canonical data authority is registered.
3. Its deterministic contract is implemented.
4. Calculations and null behaviour are tested.
5. Provenance is reproducible.
6. Its persistence decision is explicit.
7. Fixture tests pass.
8. Real-portfolio cohort tests pass.
9. Portfolio-wide disposition is known.
10. The UI consumes the shared authority.
11. Cross-surface results agree.
12. Loading, missing, stale, conflicting, and failure states are truthful.
13. RLS and ownership boundaries pass.
14. The isolated development environment proves it without production
    crossover.
15. It is included in a qualified release candidate.
16. It is merged and deployed only through separate approval.
17. If automation is required, it is separately approved, observable, bounded,
    and recoverable.

A capability may validly stop at a lower maturity level. It must then carry that
level and must not appear as production-complete.

---

## 19. Proposed first authorized checkpoint

### P0 — Authority, Lineage, and Current Product-Readiness Freeze

If separately authorized by the owner, P0 allows only:

- read-only Git, GitHub, schema, and deployment inspection;
- revalidation of branch and PR topology;
- full capability-lineage mapping;
- planning/status documentation changes;
- creation of the current capability-readiness register;
- classification as preserve, converge, block, or defer;
- a proposed Git reconciliation manifest;
- a proposed database reconciliation manifest;
- documentation validation and `git diff --check`.

P0 prohibits:

- source-code changes;
- migration creation or application;
- branch creation;
- Supabase project creation;
- database writes;
- provider or AI calls;
- Vercel or GitHub settings changes;
- secret or scheduler changes;
- merges, pushes, or deployments;
- production mutation;
- UI implementation;
- work from P1 or later.

P0 ends by returning the frozen authority/readiness package to the owner for
review. No subsequent checkpoint begins automatically.

---

## 20. Planning-only stop boundary

Approval of this plan does not authorize P0 or any later stage. Execution begins
only when the owner explicitly authorizes the named checkpoint and its exact
scope.

---

## 21. P7-IC execution overlay — 28 September 2026

The P7-IC IC0 read-only audit was executed on Development HEAD
`673dcc9ac9acc1a514df3e27a9f2e4b58c15925f`. It produced an explicit 248-holding
coverage matrix without provider calls or writes. The universal stock-page
shell is verified and locked.

`IC0 = BLOCKED` because the present shared access paths cannot expose exact
methodology-specific evidence deficits and the required durable R9/Movement
persistence is absent. No migration was created or applied. IC-A now requires
an owner decision on IC1 scope and on any additive persistence design. P7 stays
active; IC1, P8 and Production work remain unauthorized.


---

## 22. Repository-backed current-build reconciliation — 4 October 2026

**Updated at:** 4 October 2026, 18:11:19 IST (Asia/Kolkata; UTC+05:30)
**Equivalent UTC:** 4 October 2026, 12:41:19 UTC
**Scope:** Planning/audit document update only
**Final audit disposition:** `VERSION_NARROWER_EXPERIMENT_REQUIRED`

### 22.1 Authority and evidence boundary

Repository: `drddutta-portfolio/PortfiolioAI`. Branch: `PortfolioAI-Development`.
Local HEAD, cached origin/PortfolioAI-Development and independently verified live
GitHub Development HEAD agree at:

`f2970a8970320e7525e272996ddcca59ba840542`

Latest commit: `audit(p8): close Workstream D materialization`.
The working tree was clean before this documentation edit. Shell
`git fetch --prune origin` failed because its proxy was unreachable; live remote
authority was instead verified through the GitHub connector. No reset or branch
switch occurred. This timestamp dates the reconciliation, not a new data run.

This audit inspected repository plans, implementation, commit chronology and
coverage artifacts. It did not independently reread R2 source bodies or query
hosted databases. Source verification counts below are the recorded run results.
No P8-C outcomes, holdout returns, forward returns or performance were inspected.

Controlling detailed evidence:

- `docs/PortfolioAI_Development_Status.md`, including P7 closure and P8 entry;
- `docs/PortfolioAI_POST_D_P7_IC_PORTFOLIO_INTELLIGENCE_COMPLETION_PLAN.md`;
- `docs/p8/PortfolioAI_P8_ADVANCED_QUANT_BACKTESTING_EXECUTION_PLAN_2026-09-30.md`;
- `docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md`;
- `docs/p8/PortfolioAI_P8_B_SINGLE_RECOVERY_PLAN_2026-10-03.md`;
- `docs/p8/PortfolioAI_P8_B_FEASIBILITY_DECISION_2026-10-04.md`;
- `docs/p8/PortfolioAI_P8_B_CURRENT_EXPERIMENT_FEASIBILITY_STOP_2026-10-04.md`;
- latest recovery Workstream A–D plans, census, audits and closure artifacts.

### 22.2 Effective lineage and stage matrix

| Stage | Effective state | Exact closure meaning / limitation |
|---|---|---|
| Programs A–D | COMPLETE / PASS / CLOSED | Approved bounded engineering scopes; not Production maturity |
| P0 | COMPLETE / PASS / CLOSED | Authority/readiness freeze and Checkpoint 1 |
| P1 | COMPLETE / PASS / CLOSED | Development baseline/ancestry and Checkpoint 2 |
| P2 | COMPLETE / PASS / CLOSED | Isolated Development environment and Checkpoint 3 |
| P3 | COMPLETE / PASS / CLOSED | Acceptance-data/fixture boundaries and Checkpoint 4 |
| P4 | COMPLETE / PASS / CLOSED | Portfolio-wide terminal readiness dispositions |
| P5 | COMPLETE / PASS / CLOSED | Explicit methodology/R6/R7/sizing dispositions; numeric coverage zero |
| P6 | COMPLETE / PASS / CLOSED | Integrated deterministic state and frozen persistence choices |
| P7 / P7-IC / IC-FINAL | COMPLETE / PASS / CLOSED | Current-state integration; Owner Checkpoint 6 explicitly approved |
| P8 overall | ACTIVE / BLOCKED | Historical experiment foundation insufficient |
| P8-0 | COMPLETE / PASS | Point-in-time entry contract and readiness surface |
| P8-A | COMPLETE / PASS | Read-only inventory completed; data sufficiency failed |
| P8-B0 / B1 | COMPLETE / PASS | Baseline and experiment/bias-control contract |
| P8-B2 / B3 | COMPLETE / PASS / CLOSED | Historical foundations with explicit residual blockers |
| Original B4 / B5 / B6 | COMPLETE / PASS structurally | Original artifacts preserved; deficient semantics superseded by recovery |
| Original B-FINAL | BLOCKED / CLOSED | Closure audit complete; experiment sufficiency failed |
| Recovery A | Contract implementation COMPLETE / PASS; ceiling freeze BLOCKED | Corrected semantics encoded; ceiling remains null |
| Recovery B | COMPLETE / PASS, bounded | Identity/source adapter and census; no feasibility PASS |
| Recovery C | BLOCKED / NOT CLOSED | Earlier PASS superseded by feasibility stop |
| Recovery D | COMPLETE / PASS / CLOSED structurally | Materialization run complete; full classification/reproducibility compliance unproven |
| Recovery E | COMPLETE / BLOCKED / CLOSED | Corrected rerun complete; 0 / 121,956 replay-ready; see section 22.7 |
| P8-C onward | NOT STARTED / NOT AUTHORIZED | No progression permitted from current foundation |
| Release-candidate qualification / P-FINAL | NOT CLOSED | Original qualification obligations remain outstanding |

The resulting lineage is:

Programs A–D → P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P7-IC /
IC-FINAL / approved Checkpoint 6 → P8-0 → P8-A → P8-B blocked → recovery A/B
→ C feasibility stop → D structural materialization → E COMPLETE / BLOCKED / CLOSED.

P7 closure does not assert numeric investment readiness. Latest closure records
report zero R6 scores, zero R7 candidacies and zero canonical actions, with
explicit current blockers. Older IC2-active and P8-unauthorized planning
snapshots remain historical records and are superseded for current-state use.

### 22.3 Current V1 feasibility and Workstream D reconciliation

Experiment: `P8_EXP_NSE_MONTHLY_6M_V1`.

| Measure | Repository-backed value |
|---|---:|
| Historical identities | 4,524 |
| Proven decision dates | 32 |
| Full identity/date audit surface | 144,768 |
| B2-eligible candidate denominator | 121,956 |
| Alias-aware official NSE financial-metadata covered pairs | 61,692 (50.585457%) |
| Latest metadata gaps | 60,264 |
| Metadata coverage by decision date | 44.2417%–54.5980% |
| Dates meeting recommended 70% floor | 0 / 32 |
| B3 V2 market-ledger READY pairs | 82,504 (67.650628%) |
| B3 V2 market-ledger blocked pairs | 39,452 |
| Owner-approved exclusion ceiling | PENDING_OWNER_FREEZE / null |

B's earlier 60,231 fallback-required pairs are its earlier census, not the
latest metadata-gap count. Official BSE fallback remains unproven/blocked:
API transport returned 403 and the browser canary failed. An implemented identity
adapter or accessible landing page does not prove usable filing acquisition.
Trendlyne enrichment requires an official filing anchor and cannot fill
filing-absent pairs. Explicit missingness does not count as replay-ready coverage.

Latest D audit: `PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_AUDIT_2026-10-04.json`.
Closure: `PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_CLOSURE_2026-10-04.md`.
GitHub Actions run 37195065327 completed successfully on Development.

| D output / state | Count |
|---|---:|
| Eligible pair dispositions | 121,956 |
| Verified usable source bodies / filing-index rows | 35,516 |
| Parsed XBRL bodies | 35,515 |
| XML parse errors | 1 |
| XBRL observations materialized | 6,303,784 |
| Historical classification intervals | 12,779 |
| Hash mismatches | 0 |
| RESOLVED_CLASSIFICATION | 27,719 (22.728689%) |
| EVIDENCE_PRESENT_CLASSIFICATION_UNRESOLVED | 33,706 |
| NO_PRE_DECISION_EVIDENCE | 60,531 |
| Total unresolved pair states | 94,237 |

All pair-state and 32 decision-date totals reconcile to 121,956. D evidence-present
coverage is 61,425 pairs (50.366526%). Recorded classification-resolved coverage
is 19.9772%–24.2915% per date. Classification resolution alone does not prove
complete required metrics, methodology routing or canonical B6 replay readiness.

D closes structural materialization only. Its closure explicitly preserves V1's
NO-GO and requires separate authorization for E. Original hosted B5/B6 artifacts
remain unchanged; no corrected B-FINAL PASS exists.

The recovery plan recommends at least 24 dates, 100% historical identity
resolution, 80% overall replay-ready coverage, 70% per retained date and 60% per
major methodology sector. These are owner-reviewable recommended standards,
not an already approved numeric ceiling. Owner approval must not be inferred.
Complete sector/cohort and metric sufficiency remain unproven.

**Conclusion:** V1 cannot legitimately reach B-FINAL PASS through an E rerun on
this frozen evidence surface. D improves evidence materialization but does not
repair feasibility. The market-ready population is itself below the recommended
overall coverage floor. No threshold or exclusion policy is relaxed here.

### 22.4 Errors, supersessions and governance drift

1. C's premature PASS at `873b1c83` was retracted at `803f3257`; the feasibility
   decision and stop are controlling. Missingness preservation is not sufficiency.
2. Full C acquisition proceeded while the ceiling remained pending and before a
   demonstrated coverage path met the recovery feasibility gate. The recorded
   source-download canary does not prove the required full difficult-identity →
   classification → methodology → B6 chain.
3. D implementation and execution followed the documented stop that prohibited
   starting D. No intervening owner override is recorded in the reviewed
   repository artifacts. Its later closure does not establish such approval.
4. Original B5 required current canonical-security linkage and historical
   assignment/policy creation. These rules contradicted B2 historical identity
   and retrospective frozen-methodology semantics. A corrects the contract,
   without rewriting original hosted B5/B6. E later produced corrected rerun artifacts; see section 22.7.
5. D's `parse_xml` aggregates revenue/turnover/income over XBRL members without
   selecting audited consolidated annual periods or identifying segment axes.
   Raw member labels / DIVERSIFIED do not implement the required four-tier
   taxonomy and fallback hierarchy. Its PASS check tests hashes and pair count,
   not the complete classification contract.
6. D collects results in asynchronous completion order and serializes them
   without canonical sorting; equal-timestamp events lack deterministic
   tie/conflict resolution. Stable repeat-materialization hashes are unproven.
7. This master roadmap names P8 release qualification while later plans name it
   Advanced Quant / Backtesting. Both obligations must be reconciled explicitly;
   neither completion can silently substitute for the other.
8. Development Status ends at A-started and the P7-IC plan retains older states.
   B–D have dedicated artifacts, so recovery is documented but central status
   convergence is incomplete. The alias-metadata JSON audit also has a trailing
   literal backslash-n after its object; strict JSON parsing fails. Its numbers
   were cross-checked against the feasibility documents.

B4–B6 structural closures already disclaim experiment sufficiency. B3's separate
exhaustive original-source forensic preservation item remains open and must stay
tracked; it is not silently closed by this update.

### 22.5 Exact next legitimate step and bounded plan

**Selected path C: stop V1 and prepare an owner-reviewable design for a separately
versioned narrower P8 experiment before any outcome inspection.**

A legitimate E PASS is unsupported. A structural diagnostic E rerun cannot
resolve feasibility; the subsequent E rerun confirmed BLOCKED closure (section 22.7). Existing official evidence and
historical infrastructure justify narrower-design assessment, but do not prove
that a narrower experiment will pass. Total historical-validation infeasibility
is therefore not declared yet. Repository access is sufficient for this decision.

| Control | Bounded next-step requirement |
|---|---|
| Entry | Reverify Development authority; preserve V1 NO-GO; obtain explicit owner authorization for narrower-design work |
| Proposed new files | `docs/p8/PortfolioAI_P8_NARROWER_EXPERIMENT_DECISION_MEMO.md`; `docs/p8/PortfolioAI_P8_NARROWER_EXPERIMENT_FEASIBILITY_AUDIT.json` |
| Subsequent status edits | `docs/PortfolioAI_Development_Status.md`; this master plan's current-state overlay |
| Read-only evidence | Existing B2 membership, B3 V2 decision ledger, C source manifests, D filing/fact/classification/disposition artifacts |
| Method | Define objective historical universe/period rules; measure the intersection of identity, market, official evidence, valid classification, required metrics and methodology coverage by date/sector/cohort |
| Allowed writes | After authorization, Development planning and audit documents only; no tables or R2 objects changed |
| Prohibited | Executable experiment creation, further E reruns, new acquisition/provider calls, schema changes, database/R2 writes, P8-C, outcome/holdout/forward-return inspection, silent exclusions, threshold lowering, Production/main changes |
| Closure | Owner-reviewable versioned design with explicit denominator, exclusions and missingness concentration; at least 24 proven dates; classifier validity and a demonstrated coverage path against proposed frozen standards—or documented narrower-scope NO-GO |
| Approval | Owner authorization for design; separate contract freeze/implementation approval; separately gated P8-C transition |

Narrowing must be based on explicit, outcome-independent eligibility rules,
not silent retention of conveniently covered pairs. No new nested recovery
program is created. The attached-document update request authorizes this planning
reconciliation only; it does not authorize the proposed experiment work.

### 22.6 Preserved completion and release boundary

Preserve valid P0–P7 / P7-IC work, B0/B1, B2/B3, R2 architecture, recovery A/B,
dated identity resolution, immutable raw sources/manifests, hashing and
point-in-time dissemination rules. Existing evidence must not be overwritten,
deleted or presented as more mature than its proven scope.

Before P-FINAL, the owner must explicitly resolve the combined roadmap:
historical-validation disposition and the original release-candidate checklist
in section 9. Release qualification still requires its exact candidate,
validation, migration/security evidence, environment/dataset manifests,
limitations, rollback and deployment plans. Production/main changes remain
separately authorized. This reconciliation makes no Production readiness claim.

**Current final disposition: VERSION_NARROWER_EXPERIMENT_REQUIRED.**

## 22.7 Workstream E closure reconciliation — 4 October 2026

**Current-state precedence:** This entry supersedes earlier recovery-active and E-not-started statements. Historical audits and their original denominators remain preserved.

**Workstream E = COMPLETE / BLOCKED / CLOSED.**
**P8-B-FINAL = COMPLETE / BLOCKED / CLOSED.**

Verified GitHub Actions run: [37207914448](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/37207914448), completed successfully on `PortfolioAI-Development`. Workflow success confirms execution completion; it does not establish experiment feasibility.

Authoritative records:

- [Workstream E closure](p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_E_CLOSURE_2026-10-04.md)
- [Workstream E audit](p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_E_AUDIT_2026-10-04.json)
- [B-FINAL rerun audit](p8/PortfolioAI_P8_B_RECOVERY_B_FINAL_RERUN_2026-10-04.json)

Corrected results against **121,956 B2-eligible pairs**:

| Measure | Result |
|---|---:|
| B5 resolved paths | 0 |
| B5 blocked paths | 121,956 |
| B6 replay-ready | 0 |
| B6 excluded | 121,956 |
| Replay-ready coverage | 0% |
| B3 market foundation READY / BLOCKED | 82,504 / 39,452 |
| Proven decision dates / minimum | 32 / 24 |

B5 blockers total exactly 121,956: `HISTORICAL_CLASSIFICATION_CONTRACT_UNPROVEN` 27,719; `HISTORICAL_CLASSIFICATION_UNRESOLVED` 33,706; `NO_PRE_DECISION_EVIDENCE` 60,531.

Deterministic replay passed. Future evidence, current-state fallback and cross-security imputation were not used. The owner-approved exclusion ceiling remains `PENDING_OWNER_FREEZE`. Corrected B5 and B6 feasibility checks failed despite structural execution completion.

`P8_EXP_NSE_MONTHLY_6M_V1` remains stopped: **P8-B = BLOCKED — V1 DATA FOUNDATION INSUFFICIENT**. **P8-C = NOT AUTHORIZED**. The next legitimate disposition is **`VERSION_NARROWER_EXPERIMENT_REQUIRED`**: prepare a separately authorized, owner-reviewable narrower design before any outcome inspection. This closure update does not authorize that work or another recovery loop.

The recorded E run made zero provider calls, zero Supabase writes and zero Production/main changes; P8-C, holdout, forward returns and performance outcomes were not inspected. Corrected E artifacts do not imply that the original hosted B5/B6 objects were rewritten. B3's separate original-source forensic preservation obligation remains open.

Reconciliation source: Development commit `b33986c8960c6b4a9b2f307a07aca2d896352675`. Section 22.1 retains the earlier audit's original HEAD and evidence boundary; this addendum records the subsequent E closure and supersedes its E-not-started conclusions. No fresh acquisition, database audit or experiment execution was performed for this documentation reconciliation.
