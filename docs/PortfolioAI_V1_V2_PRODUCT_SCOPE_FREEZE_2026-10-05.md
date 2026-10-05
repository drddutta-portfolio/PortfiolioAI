# PortfolioAI V1/V1.1/V2 Product Scope Freeze A — 5 October 2026

**Status:** FROZEN — Scope Freeze A (product boundary + audit plan)  
**Branch authority for this freeze:** `PortfolioAI-Development`  
**Implementation authorization:** NOT GRANTED by this document  
**Production/main changes:** NOT AUTHORIZED  
**Scope Freeze B:** PENDING the verified Development audit  
**P8 disposition:** expansion is proposed to pause and preserve for V2, but the exact Development/P8 baseline must be verified before that disposition is recorded as final

---

## 1. Purpose

This document freezes the PortfolioAI release boundary before further implementation.

PortfolioAI V1 is the **operational current-portfolio investment decision-support product**. It is not a reduced portfolio tracker. V1 retains the deterministic investment-intelligence architecture required to assess current holdings and current opportunities safely.

PortfolioAI V2/P8 is the **historical validation and research program** that reconstructs point-in-time evidence and evaluates whether PortfolioAI methodologies and recommendations worked historically.

The governing distinction is:

> **Point-in-time reconstruction and historical strategy evaluation are deferred. Historical observations required to assess companies correctly today remain V1 dependencies.**

Therefore V1 may require multiple quarters/years of fundamentals, valuation history, ownership history, current-market OHLCV lookback, benchmark history and prior observations needed for current deterioration/improvement logic. Deferring P8 historical replay does not mean discarding history required for present-tense analysis.

---

## 2. Authority and governance

This scope freeze controls **release sequencing and delivery scope only**. It does not override PortfolioAI's canonical architecture.

The exact repository authority order from `AGENTS.md` remains:

1. `docs/PortfolioAI_Master_Blueprint.md`
2. `docs/PortfolioAI_Research_and_Intelligence_Architecture.md`
3. `docs/PortfolioAI_Single_Source_of_Truth_Architecture.md`
4. `docs/PortfolioAI_Database_Architecture.md`
5. `docs/PortfolioAI_Development_Rules.md`
6. `docs/PortfolioAI_Product_UI_and_Decision_Workflow.md`
7. `docs/PortfolioAI_Development_Status.md`
8. `docs/PortfolioAI_Requirements_Register.md`
9. relevant stage-specific documentation

If this scope freeze appears to conflict with a higher-authority document, the higher-authority document wins and the conflict must be brought to the owner for explicit resolution.

The following existing invariants remain binding:

- transactions remain the source of truth for holdings/accounting;
- one business fact has one canonical authority and shared access path;
- missing evidence stays missing;
- no guessed/zero-filled financial evidence;
- raw evidence, deterministic calculations, scores/states, AI explanation and human decision remain separate layers;
- deterministic engines are reproducible, versioned and tested;
- equity-specific engines are not applied indiscriminately to ETFs/non-equities;
- normal browsing is cache-first and must not silently spend provider quota;
- provider refreshes use approved controls, budgets, leases, accounting and kill switches;
- AI cannot replace Layer 1–3 calculations or autonomously mutate holdings, transactions, roles, themes or targets;
- the owner remains the final investment decision-maker.

---

## 3. Product generations frozen by Scope Freeze A

### 3.1 PortfolioAI V1 — Operational Investment Intelligence

V1 must support the complete current-portfolio decision loop:

**Transactions / holdings**
→ **current evidence**
→ **approved methodology route**
→ **deterministic stock intelligence**
→ **Core/Satellite eligibility**
→ **Core Health / Valuation / Momentum / Risk**
→ **Portfolio Fit / Position Sizing / Exit Risk**
→ **advisory action state**
→ **optional grounded AI explanation**
→ **owner decision**
→ **auditable recommendation/decision history**

V1 includes current historical observations required for present analysis.

### 3.2 PortfolioAI V1.1 — Monitoring and Intelligence Expansion

V1.1 is for useful operational enrichments that are not necessary to launch the core V1 loop, subject to the V1 audit confirming they are not already operational:

- richer target/stop monitoring and notification delivery;
- richer Portfolio Calendar;
- broader Why Stocks Moved analysis;
- richer theme strength/breadth/outlook;
- Credit Intelligence;
- Analyst Consensus and Earnings Revision Intelligence;
- richer Watchlist/discovery/screeners/re-entry/replacement workflows;
- broader notification channels and monitoring polish.

If the audit proves any of these are already operational and low-risk to retain, they may remain available in V1; this list is a release-blocker classification, not an instruction to remove working functionality.

### 3.3 PortfolioAI V2 / P8 — Historical Validation and Research

V2/P8 is responsible for point-in-time historical reconstruction and scientific strategy evaluation, including:

- historical identity/universe reconstruction;
- point-in-time historical fundamentals and research evidence;
- historical methodology routing;
- historical score and eligibility replay;
- historical BUY/ADD/HOLD/REDUCE/EXIT replay;
- historical portfolio reconstruction;
- benchmark/TRI comparison;
- alpha, hit-rate, drawdown and risk-adjusted evaluation;
- survivorship-bias and look-ahead-bias controls;
- walk-forward/out-of-sample testing;
- methodology calibration based on historical evidence;
- historical taxonomy/corporate-action reconstruction needed specifically for replay.

Completed P8 work must not be deleted or invalidated. Its exact Development-branch baseline must be verified before recording `P8 = PAUSED / PRESERVED FOR V2`.

### 3.4 Later / explicit future decision

Not required for V1:

- complex tax optimization;
- advanced multi-asset optimization/scenario simulation;
- commercial multi-user/SaaS functionality;
- broad broker automation beyond approved integration scope.

Automatic order placement, intraday/scalping logic, ungrounded LLM BUY/SELL calls, silent portfolio mutations and autonomous role changes remain outside normal V1/V2 behavior unless the owner explicitly changes the product philosophy.

---

## 4. V1 feature boundary

The following are V1 capabilities, subject to evidence and approved-method readiness:

### Portfolio/accounting
- secure authenticated use;
- XLSX/CSV import and transaction ledger;
- current holdings derived from transactions;
- BUY/SELL, partial/closed/reopened position handling according to existing approved accounting semantics;
- realised and unrealised P&L with disclosed coverage/basis;
- latest prices, current value and portfolio weight with explicit partial/unpriced states;
- broker/account attribution and consolidated portfolio view;
- Core/Satellite/Thematic roles;
- ETF/non-equity separation;
- themes and portfolio structure already supported by the product.

### Research/evidence
- current company research workspace;
- fundamental, ownership, valuation and document evidence where supported;
- evidence provenance, period, units, freshness, conflicts and missing states;
- approved sector/industry/research-profile methodology routing;
- historical observations needed for today's methodology.

### Deterministic investment intelligence
- Quality/Growth;
- Core Selection;
- Core eligibility;
- Core Health;
- Satellite Opportunity;
- Satellite eligibility;
- Valuation;
- current Momentum/Technical/Relative Strength using sufficient authoritative OHLCV and benchmark history;
- Risk;
- Portfolio Fit;
- Position Sizing;
- Exit Risk;
- role compatibility;
- temporal movement states only when sufficient prior observations exist.

### Advisory actions
The V1 UI may expose headline advisory actions:
- BUY;
- ADD;
- HOLD;
- REDUCE;
- EXIT;
- WATCH.

`BLOCKED` is a readiness condition, not an investment opinion. Missing evidence must never be converted into HOLD, REDUCE or EXIT.

Detailed internal states such as `ADD_ON_WEAKNESS`, `SELECTIVE_ADD`, `TRIM_INTO_STRENGTH`, `FREEZE`, `EXIT_REVIEW` and `EXIT_CANDIDATE` may be preserved. Mapping to headline labels must retain advisory semantics and explicit prerequisites.

### Thesis
**Option A is selected and frozen:** V1 includes a minimal investment thesis/invalidation record where thesis-based reasoning is used.

Minimum record:
- why the position is owned;
- current role;
- key thesis drivers;
- key risks;
- thesis invalidation conditions;
- optional owner note/review date.

PortfolioAI may claim a thesis break/invalidation only when a recorded thesis/invalidation condition supports that conclusion. Otherwise Exit Risk must rely on approved deterministic deterioration rules.

### AI
AI remains optional in V1.

AI may explain, compare, summarize, identify contradictions and generate evidence-grounded reviews. Deterministic PortfolioAI must remain operational when AI is disabled/unavailable.

AI may not invent metrics, override deterministic results, mutate roles/transactions/holdings/settings or place orders.

### Owner decision
Owner decisions are separate from system recommendations.

A decision must reference the exact recommendation snapshot reviewed, including as available:
- recommendation ID/version;
- evaluation timestamp;
- engine/profile versions;
- evidence lineage;
- portfolio-context/snapshot reference;
- advisory action;
- rationale/readiness;
- owner decision;
- owner note/reason;
- optional review date.

---

## 5. UI boundary

The existing application shell and navigation are preserved:

**Dashboard | Holdings | Portfolio Structure | Research | Intelligence | Transactions | Import | Settings**

V1 is primarily an integration, correctness and completion program, not another broad UI redesign.

Permitted UI changes include:
- clearer readiness/blocker states;
- score/action explanation;
- drill-down to evidence;
- decision recording;
- small cards/tabs required by approved V1 functionality;
- consistency corrections across pages.

No duplicate application shell, separate V2 app or wholesale navigation redesign is authorized by Scope Freeze A.

Future historical-validation functionality should integrate into the same product surfaces.

---

## 6. Pre-execution environment-isolation checkpoint

**This checkpoint must occur before any Development backend access that can write, any provider execution, any refresh, scheduler action, migration or other mutable operation.**

Verify and record:
- active Git branch/ref;
- Development frontend/environment identity;
- Development Supabase/backend project identity;
- Development database/RLS target;
- Development secrets/functions target;
- provider-control and provider-usage target;
- storage/R2 target where applicable;
- no Production database write path;
- no accidental Production provider spending;
- scheduler state;
- migration target.

Read-only repository/document inspection may occur before this checkpoint. Backend/provider execution may not.

Environment isolation must be verified again in V1-9 release acceptance.

---

## 7. V1 execution gates

Scope Freeze A freezes these gates and their purpose. Detailed fixtures, numerical thresholds, supported profiles and effort estimates are frozen only in Scope Freeze B after the audit.

### V1-0 — Product Boundary & Governance Freeze
Purpose:
- freeze V1/V1.1/V2/Later boundary;
- preserve exact authority order;
- create requirement-to-gate traceability;
- prohibit Production/main changes.

Proof:
- this scope document;
- targeted documentation alignment;
- no implementation mutation.

Allowable unresolved state:
- Scope Freeze B details remain pending.

### V1-1 — Operational Baseline Audit
Purpose:
Determine what the actual Development product does now, distinguishing:
- WORKING;
- PARTIAL;
- UI/READINESS SURFACE ONLY;
- REFERENCE/PILOT ONLY;
- BROKEN;
- MISSING;
- BLOCKED_BY_EVIDENCE;
- NOT_APPLICABLE.

Every gap is classified:
- V1 BLOCKER;
- V1 IMPORTANT;
- V1.1;
- V2;
- NO CHANGE.

Required audit outputs:
1. dated acceptance inventory;
2. supported/unsupported profile inventory;
3. proposed real-security acceptance cohort;
4. proposed usable-intelligence count/value denominators and thresholds;
5. gate-specific completion contracts;
6. maintenance/refresh proposal;
7. effort estimate and uncertainty per remaining gate;
8. verified Development/P8 baseline.

No implementation is authorized by completion of the audit alone.

### V1-2 — Portfolio Accounting Integrity
Verify existing approved accounting semantics rather than redesign them.

Acceptance fixtures must cover as applicable:
- simple BUY;
- multiple BUYs;
- SELL;
- partial sale;
- closed position;
- reopened position;
- holdings across brokers;
- duplicate imports;
- charges;
- missing chronology;
- correction/supersession;
- void/restore;
- decimal precision;
- relevant corporate-action effects;
- partial valuation;
- unpriced holdings.

Requirements:
- preserve disclosed FIFO vs deterministic weighted-average fallback semantics;
- separate imported snapshot evidence from deterministic accounting;
- distinguish unrealised return from total portfolio investment performance;
- qualify partial P&L/value/weights.

Proof:
- hand-reconciled fixture calculations;
- deterministic tests;
- authenticated UI/browser verification;
- explicit unsupported-state report.

### V1-3 — Identity, Classification & Methodology Routing
For each acceptance security establish:
- canonical identity;
- asset class;
- sector/industry/Basic Industry or approved classification authority;
- portfolio role;
- research profile/methodology route;
- methodology/profile version;
- applicability/readiness state.

Scoring cannot run through an unapproved/ambiguous route.

### V1-4 — Evidence & Current-History Readiness
For each approved profile verify:
- mandatory evidence;
- units and semantics;
- accounting/reporting scope;
- period requirements;
- freshness;
- provenance;
- conflicts;
- required annual/quarterly lookback.

For market-dependent engines verify:
- authoritative OHLCV source;
- sufficient lookback;
- corporate-action semantics;
- benchmark identity;
- benchmark/date alignment.

Readiness states include:
`READY`, `PARTIAL`, `STALE`, `MISSING`, `CONFLICTING`, `REVIEW_REQUIRED`, `NOT_APPLICABLE`.

### V1-5 — Deterministic Stock Intelligence
Run only approved, versioned methodologies with satisfied prerequisites.

V1 engines:
- Quality/Growth;
- Core Selection;
- Core Health;
- Satellite Opportunity;
- Valuation;
- Momentum/Market State;
- Risk;
- Portfolio Fit;
- Position Sizing;
- Exit Risk.

Each engine completion contract must define:
- required inputs;
- blocked states;
- output schema;
- versioning;
- reproducibility/lineage;
- tests;
- accepted fixtures.

A rendered UI card does not prove engine completion.

### V1-6 — Core/Satellite Eligibility & Temporal Movement
Current eligibility:
- Core: PASS / CONDITIONAL / FAIL / NOT_COMPUTABLE;
- Satellite: PASS / CONDITIONAL / FAIL / NOT_COMPUTABLE;
- role compatibility/mismatch.

Temporal claims such as Promotion Ready, deterioration, demotion or movement require sufficient prior observations and must preserve anti-churn rules.

Where temporal evidence is insufficient:
- show current eligibility;
- show `TRANSITION_NOT_ASSESSABLE`;
- do not fabricate a transition.

### V1-7 — Portfolio Intelligence & Frozen Action Policy
Before broad action integration, Scope Freeze B must freeze:
- action prerequisites;
- precedence/conflict rules;
- BUY vs ADD ownership distinction;
- treatment of missing portfolio context;
- frozen positions;
- valuation/concentration vs thesis-break distinctions;
- detailed-state → headline-state mapping.

Core distinctions:
- BUY = initiate a new position;
- ADD = increase an existing position;
- REDUCE/TRIM = sizing/valuation/portfolio-context action;
- EXIT/EXIT REVIEW = approved deterioration/thesis-risk advisory;
- BLOCKED = readiness, not an investment conclusion.

Outputs must be portfolio-aware and evidence-traceable.

### V1-8 — Minimal Thesis, Optional Grounded AI & Owner Decision Audit
Implement/verify:
- minimal thesis/invalidation record (Option A);
- deterministic operation with AI off;
- grounded AI explanation when enabled;
- immutable/reproducible recommendation snapshot linkage;
- owner decision referencing the reviewed recommendation.

AI outage must not disable deterministic PortfolioAI.

### V1-9 — Maintenance, Unified UI & Release Candidate
V1 must remain operational after launch, not only at one validated snapshot.

Scope Freeze B must define maintenance per domain:
- manual and/or scheduled refresh;
- freshness limits;
- invalidation triggers;
- retries/failure recovery;
- provider outage behavior;
- recalculation triggers after transactions/settings/evidence/methodology changes.

UI remains the existing navigation.

Release acceptance must include:
- actual authenticated browser path against intended Development backend;
- security/RLS/secret-boundary checks;
- repeat environment-isolation verification;
- backup confirmation;
- tested/documented recovery/rollback procedure;
- explicit migration list;
- separate approval boundaries for provider cohorts and scheduler activation;
- accepted known limitations.

Stop before Production. Production deployment requires separate owner approval.

---

## 8. Usable intelligence coverage

Truthful status coverage and usable intelligence coverage are separate release measures.

### 8.1 Integrity/status coverage
Every security in the dated acceptance inventory must resolve to an explicit status. Securities must not silently disappear because a profile is unsupported or evidence is missing.

### 8.2 Usable intelligence coverage
A security counts as **usable-intelligence covered** only when it completes the agreed V1 intelligence workflow applicable to its approved profile through the minimum deterministic output frozen in Scope Freeze B.

Scope Freeze B must freeze:
- the dated acceptance inventory;
- security eligibility rules;
- supported and unsupported profiles;
- count denominator;
- value denominator;
- ETF/non-equity treatment;
- treatment of unsupported profiles in disclosures/denominators;
- minimum workflow endpoint required to count as covered;
- required count threshold;
- required portfolio-value threshold.

Unsupported profiles cannot simply be removed to inflate coverage. Any exclusions must be explicit, rule-based and disclosed.

Unpriced holdings must be disclosed separately and must not be silently omitted from value-based coverage interpretation.

No count/value threshold is invented by Scope Freeze A. Thresholds are chosen from the V1-1 audit and require owner approval in Scope Freeze B.

---

## 9. Scope Freeze B — mandatory before implementation

Scope Freeze B remains PENDING.

It must approve, based on verified Development evidence:

1. exact dated acceptance inventory;
2. verified P8 baseline/disposition;
3. supported methodology profiles and versions;
4. unsupported-profile handling;
5. real-security acceptance cohort;
6. count/value coverage denominators and thresholds;
7. gate-by-gate acceptance fixtures/checks/proof artifacts/allowable unresolved states;
8. frozen action policy;
9. maintenance/refresh/invalidation mechanism;
10. environment evidence;
11. implementation effort estimates and uncertainty;
12. exact V1 blocker list.

Only after owner approval of Scope Freeze B may V1 implementation begin.

---

## 10. Scope-change rule after Scope Freeze B

A newly discovered item may enter V1 only when at least one is true:

1. required for financial correctness;
2. required for security/data integrity;
3. required for an already-approved V1 workflow to function;
4. absence would cause a misleading investment result;
5. required to satisfy the approved usable-coverage contract.

Otherwise classify it as V1.1, V2 or Later.

This rule is intended to prevent uncontrolled gate/sub-gate expansion.

---

## 11. Requirement-to-gate release overlay

Existing requirement IDs, status history and original milestone records remain intact. This table is a **release overlay**, not a rewrite of implementation history.

| Existing requirement(s) | Scope Freeze A release placement |
|---|---|
| REQ-TRAN-001…008 | V1-2 / retain existing capability |
| REQ-ACCOUNT-001…004 | V1-2 |
| REQ-COMPAT-001 | V1-9 |
| REQ-POS-003, REQ-POS-004 | V1-3/V1-7 retain |
| REQ-POS-001, REQ-POS-002 | V1.1 unless V1 audit proves required for an accepted V1 workflow |
| REQ-CLASS-001, REQ-CLASS-002 | V1-3 |
| REQ-THEME-001…005 | V1 retain |
| REQ-THEME-007 | V1 where existing/priced coverage supports it; remaining analytical expansion V1.1 |
| REQ-THEME-006, REQ-THEME-008, REQ-THEME-009 | V1.1/Later |
| REQ-ASSET-001…003 | V1-3 |
| REQ-SEC-001, REQ-SEC-002 | V1-3 |
| REQ-VALUATION-001 | V1-2 |
| REQ-RECON-001…003 | V1-2/V1-4 |
| REQ-DASH-001…005 | V1 retain; multi-period expansion depends on V1-4/V1-5 |
| REQ-HOLD-001 | V1 retain |
| REQ-DETAIL-002, REQ-MARKET-001 | V1-4/V1-5 for current-state momentum where sufficient OHLCV exists |
| REQ-DETAIL-001, REQ-ALERT-001, REQ-ALERT-002 | V1.1 unless audit/action acceptance makes a bounded subset necessary |
| REQ-DATA-001…005 | V1-4/V1-9 controls; broaden only under approved provider budget/identity contracts |
| REQ-DOC-001 | V1-4 where required by supported profiles |
| REQ-RESEARCH-001, REQ-RESEARCH-002 | V1 retain |
| REQ-RESEARCH-003 | V1-3/V1-4 for approved profile routes only |
| REQ-NEWS-001 | V1 retain existing cached capability; richer monitoring V1.1 |
| REQ-INVEST-001 | V1-5/V1-6/V1-7 |
| REQ-HEALTH-001 | V1-5; readiness UI alone is not engine completion |
| REQ-SIZING-001 | V1-7 consumer surface |
| REQ-SIZING-002 | V1-5/V1-7; deployment/persistence remains environment-gated |
| REQ-COVERAGE-001 | V1-1/V1-4/V1-9 |
| REQ-ARCH-001 | binding across all V1 gates |

Scope Freeze B may refine this overlay after the audit but may not silently change existing requirement history.

---

## 12. V1 acceptance definition

PortfolioAI V1 is not accepted merely because pages render or gates are labelled complete.

The accepted product must demonstrate the following real workflow on the agreed acceptance cohort and coverage contract:

**Import/maintain transactions**
→ **trust holdings/accounting**
→ **resolve identity/classification/methodology**
→ **inspect current evidence and readiness**
→ **run approved deterministic stock engines**
→ **determine Core/Satellite eligibility**
→ **assess Core Health/Valuation/Momentum/Risk**
→ **evaluate Portfolio Fit/Position Sizing/Exit Risk**
→ **produce an explainable advisory action or explicit non-actionable readiness state**
→ **optionally explain via grounded AI**
→ **record the owner's decision against the exact recommendation snapshot**
→ **refresh/reassess correctly when relevant inputs change**

Passing deterministic acceptance proves implementation correctness and evidence discipline. It does **not** prove historical investment effectiveness. Historical effectiveness is a V2/P8 question.

---

## 13. Immediate next authorized work under Scope Freeze A

Scope Freeze A authorizes documentation alignment and **read-only repository inspection**.

Before Development backend/provider execution:
1. complete the environment-isolation checkpoint;
2. verify the actual Development/P8 baseline;
3. run the V1-1 Operational Baseline Audit;
4. prepare Scope Freeze B.

No V1 implementation, Production mutation, provider campaign, scheduler activation or Production/main merge is authorized by this document.
