# PortfolioAI — Post-Gate-K Forthcoming Action Plan

**Canonical file:** `docs/PortfolioAI_POST_GATE_K_FORTHCOMING_ACTION_PLAN.md`  
**Prepared:** 23 September 2026  
**Current branch:** `r4n-pharma-subprofile-architecture`  
**Current PR:** #101 OPEN / DRAFT / UNMERGED  
**Starting state:** Gate K COMPLETE / PASS; PKR-1 / PKR-1B COMPLETE / PASS / CLOSED; sector-specific research methodology architecture = PORTFOLIO COVERAGE COMPLETE / FAIL-CLOSED for the frozen Gate-K scope.

---

## 1. Purpose

This document is the canonical execution plan for PortfolioAI after Gate K.

It exists to prevent the project from:
- creating unnecessary new Gates;
- duplicating already-completed research methodology work;
- widening scope without evidence;
- mixing methodology architecture with evidence acquisition or execution;
- starting portfolio-wide scoring/recommendation before the required inputs exist;
- continuing indefinitely on an oversized development branch without an explicit branch/PR decision.

This plan must be reviewed before starting **Program A, Program B, Program C, or Program D**.

No Program may begin merely because the previous Program exists in this document. Each Program requires:
1. review of this plan;
2. review of the cumulative handoff;
3. inspection of current repository/runtime state;
4. confirmation that prerequisites remain true;
5. a bounded implementation plan for that Program;
6. owner approval before any production/provider action.

---

## 2. Post-Gate-K architecture state

Gate K completed the research methodology architecture for the frozen current-equity scope.

The established runtime architecture is:

```text
PORTFOLIO HOLDING
        ↓
Canonical application classification
        ↓
Industry / business-model research routing
        ↓
Sector/profile methodology authority
        ↓
Company-specific evidence
        ↓
Readiness
        ↓
Deterministic score if complete
        ↓
Sector/profile-approved recommendation if eligible
        ↓
Downstream portfolio engines only when prerequisites exist
```

Gate K proved:
- one universal Research workspace;
- 12 registered engine families;
- sector as macro context;
- industry/business model as the minimum specialised-methodology selector;
- no ticker-specific runtime methodology;
- future-stock portability;
- cross-sector methodology isolation;
- explicit missing vs N/A semantics;
- unsupported methodology → `METHODOLOGY_NOT_AVAILABLE`;
- missing/conflicting classification → `REVIEW_REQUIRED`;
- missing mandatory evidence → fail closed;
- universal recommendation semantics;
- no assumption of universal numeric recommendation thresholds.

Gate K did **not** prove that every current holding already has:
- complete company evidence;
- sufficient historical market evidence;
- a computable deterministic score;
- an eligible recommendation;
- a sizing assessment;
- Core Health / Exit / Portfolio Fit outputs.

---

## 3. Gate L / Gate M decision

There is currently **no need for Gate L or Gate M**.

The remaining work already has a canonical home in the existing R-roadmap.

A new letter Gate should be created only if a genuinely new architecture problem appears that is not covered by the existing roadmap.

Examples that could justify a future new Gate:
- a new asset-class methodology architecture beyond equities;
- a materially new recommendation-authority architecture;
- a new portfolio-optimization framework;
- a new autonomous orchestration architecture;
- another cross-domain architecture decision of similar magnitude.

Evidence expansion, score execution, recommendation rollout, portfolio engines and automation do **not** need new letter Gates.

---

## 4. Program structure

The remaining roadmap is consolidated into four Programs while preserving the existing canonical R-stage identities.

```text
Program A
Evidence Coverage
R3 + R5
        ↓
Program B
Deterministic Portfolio Intelligence
R6 + recommendation calibration + R7
        ↓
Program C
Portfolio Decision Engines
R8 + R9 + R10
        ↓
Program D
Operations & Optional AI
R11 + R12
```

Each Program must be independently reviewed before execution.

## 4A. Post-K reconciliation checkpoint

Before Program A, PKR-1 / PKR-1B reconciled the live scoring path with the Gate-K contract.

Frozen result:
- unsupported methodology → METHODOLOGY_NOT_AVAILABLE;
- missing/conflicting classification → REVIEW_REQUIRED;
- completed K4 methodology → AVAILABLE with score execution PENDING_ADAPTER;
- completed K4 engines cannot substitute legacy GENERAL numeric scoring;
- PHARMA_V1 and supported BANK scoring remain active;
- NBFC_LENDING remains fail-closed;
- Program B / R6 owns future activation of the real K4 live scorer adapters.

Validated implementation commits:
- PKR-1: `412e3e36a6f435675d4293c4678c54d0b4acea8e`;
- PKR-1B: `f22b4efc8607102c51abadd46c62f362fd837084`.

Canonical handoff / status documentation was then updated without changing runtime methodology.


---

# PROGRAM A — Evidence Coverage

## 5. Purpose

Program A fills the real evidence gaps that now prevent the Gate-K methodologies from being exercised across more of the portfolio.

Program A consists of:

```text
R3 — Research evidence breadth
+
R5 — Historical market evidence breadth
```

Program A does **not** activate portfolio-wide scoring, recommendation persistence, position sizing, or automated trading.

---

## 6. Program A · R3 — Research Evidence Breadth

### Goal

Acquire and normalize the company-specific evidence needed by the approved Gate-K sector/profile methodologies.

### Required principles

- provider-neutral canonical evidence remains authoritative;
- Trendlyne remains a structured evidence provider, not the scoring authority;
- fetch only approved domains;
- fetch only missing/stale evidence;
- preserve provider provenance;
- use existing freshness and budget controls;
- use bounded cohorts;
- no blind full-portfolio sweep;
- no live provider dependency from normal Research/Dashboard browsing;
- no methodology inference from company name/ticker;
- unsupported profile remains fail closed.

### Suggested cohort order

Initial prioritization should be:

1. high-weight / strategically important current holdings;
2. holdings whose methodology is supported but evidence is currently insufficient;
3. holdings blocking recommendation/sizing readiness;
4. holdings with previously accepted but stale evidence;
5. remaining eligible equities.

Final cohort ordering must be generated from current portfolio state, not hard-coded from this document.

### Program A / R3 outputs

For each eligible holding/domain:

```text
FRESH
STALE
MISSING
CONFLICTING
REVIEW_REQUIRED
NOT_APPLICABLE
READY_TO_DERIVE
```

Evidence coverage must be explicit by profile requirement.

### R3 acceptance conditions

- exact provider-call estimate before execution;
- owner approval before provider execution;
- provider budget reservation/accounting works;
- bounded cohort completes without identity leakage;
- source/provenance retained;
- conflicting evidence retained rather than overwritten;
- no scoring/recommendation write triggered automatically;
- no scheduler activation;
- next cohort does not silently widen itself.

---

## 7. Program A · R5 — Historical Market Evidence Breadth

### Goal

Expand Angel One historical market evidence from narrow/reference coverage to eligible portfolio breadth.

### Authority

Angel One remains the authoritative market-history source for this layer.

Trendlyne technical scores must not substitute for the canonical market-history engine.

### Required evidence

As approved by each methodology:

- daily OHLCV history;
- current/latest stored candle boundary;
- 6M / 12M returns where applicable;
- drawdown;
- volatility;
- broad-market benchmark history;
- sector benchmark history where explicitly approved;
- relative strength;
- momentum inputs;
- later moving-average / trend inputs where methodology requires them.

### Execution rules

- bounded initial backfill;
- incremental refresh after latest stored candle;
- one canonical market-history store;
- no duplicate page-specific history;
- respect Angel One API controls;
- retain timestamp/as-of lineage;
- benchmark coverage must fail closed if unavailable.

### R5 acceptance conditions

- history coverage reported by eligible holding;
- deterministic derivations reproduce reference calculations;
- benchmark absence does not create synthetic relative metrics;
- no Trendlyne technical fallback;
- no portfolio-wide scheduler activation yet;
- scoring remains separately gated.

---

## 8. Program A exit

Program A is complete only when the portfolio has a sufficiently broad canonical evidence foundation to begin bounded portfolio scoring cohorts.

Completion must be reported separately as:

```text
Research evidence coverage
Market evidence coverage
Remaining missing/stale/conflicting domains
Profile readiness distribution
Provider usage
```

Program A does **not** mean every holding must be score-ready.

Valid final states include:
- READY;
- INSUFFICIENT_EVIDENCE;
- METHODOLOGY_NOT_AVAILABLE;
- REVIEW_REQUIRED;
- NOT_APPLICABLE.

---

# PROGRAM B — Deterministic Portfolio Intelligence

## 9. Purpose

Program B turns approved evidence into actual deterministic portfolio intelligence.

Program B consists of:

```text
R6 — deterministic scoring rollout
+
sector/profile recommendation policy calibration
+
R7 — recommendation + position-sizing rollout
```

---

## 10. Program B · R6 — Deterministic Scoring Rollout

### Goal

Execute the Gate-K methodology authorities against real company-specific evidence.

### Mandatory rules

A score may be produced only if:
- the canonical research profile is resolved;
- required company evidence is complete enough;
- profile-specific readiness passes;
- required market evidence exists;
- mandatory evidence is not conflicting/unresolved;
- the correct methodology version is known.

Missing mandatory inputs:
```text
→ SCORE_NOT_COMPUTABLE
```

No denominator renormalization is allowed unless the methodology explicitly defines N/A semantics.

### Required output lineage

Every score run must retain:
- security;
- profile/subprofile;
- model/methodology version;
- as-of date;
- evidence IDs;
- dimension inputs;
- dimension scores;
- missing/N/A states;
- confidence/coverage;
- final score state;
- deterministic rationale.

### R6 rollout pattern

Use staged cohorts:
1. previously validated golden/reference stocks;
2. one small multi-sector cohort;
3. larger multi-sector cohort;
4. broader eligible portfolio only after consistency passes.

No automatic portfolio-wide score persistence should be enabled merely because the scoring code exists.

---

## 11. Recommendation Policy Calibration

### Why this is required

Gate K proved that universal recommendation semantics are portable but universal numeric thresholds are **not established as portable**.

Therefore recommendation numeric policy remains sector/profile-owned.

### Calibration inputs

Use real score/evidence distributions from R6 to assess:
- score distribution by engine/subprofile;
- N/A dimension patterns;
- valuation behavior;
- sector-specific hard blockers;
- role-floor stability;
- caution rules;
- watch/avoid boundaries;
- false-positive/false-negative behavior on known reference cases.

### Rules

- do not invent numeric thresholds before evidence exists;
- do not copy Pharma thresholds to another engine;
- do not copy BANK thresholds to another engine;
- thresholds must be explicit and versioned;
- owner approval is required before activation of each sector/profile numeric policy;
- failed role floor does not automatically imply AVOID;
- missing floor evidence → INSUFFICIENT;
- AVOID requires an approved sector/profile boundary.

---

## 12. Program B · R7 — Recommendation Rollout

### Goal

Produce deterministic recommendations only for holdings whose methodology, evidence and score state are eligible.

### Required recommendation states

At minimum:

```text
CORE_CANDIDATE
SATELLITE_CANDIDATE
WATCH
AVOID
INSUFFICIENT
```

### Required behavior

- role ladder remains explicit;
- reason codes must identify floor failures/cautions;
- recommendation computation performs zero portfolio mutation;
- human owner roles/targets remain independent;
- no automatic trade;
- insufficient inputs remain INSUFFICIENT;
- secondary profile exposure cannot generate a second independent recommendation.

### Persistence

Recommendation persistence, if introduced, must remain:
- versioned;
- append-only;
- source-score-linked;
- evidence-lineage-linked;
- separately owner-approved.

---

## 13. Program B · Position Sizing Rollout

D35B already has an ENGINE CONTRACT COMPLETE reference implementation.

Program B should use it only after a validated upstream score/recommendation exists.

### Required rules

- never overwrite owner target/min/max values;
- no sizing from incomplete score/recommendation lineage;
- ETF/non-equity applicability remains explicit;
- missing upstream guidance → no manufactured range;
- sizing reduction is not thesis exit;
- EXIT remains a separate human/thesis decision.

### Program B exit

Program B should produce a portfolio coverage matrix such as:

```text
Holding
Research profile
Evidence readiness
Score state
Recommendation state
Sizing state
Blocking reason
```

Valid unresolved states remain acceptable.

---

# PROGRAM C — Portfolio Decision Engines

## 14. Purpose

Program C moves from company-level research outputs to portfolio-level decision support.

Program C consists of:

```text
R8 — Core Health / Portfolio Fit / Risk / Exit
R9 — Movement / Meaningful Change Detection
R10 — Combined Action Center
```

---

## 15. Program C · R8 — Core Health / Portfolio Fit / Risk / Exit

### Core Health

Question:

> Does this holding still justify its current Core role?

Must distinguish:
- temporarily weak momentum;
- valuation excess;
- deteriorating business quality;
- balance-sheet/permanent-loss risk;
- thesis damage.

### Portfolio Fit

Should evaluate where evidence exists:
- concentration;
- role balance;
- sector/profile concentration;
- overlap/correlation;
- volatility contribution;
- liquidity;
- diversification contribution.

### Exit Intelligence

Must remain separate from sizing.

```text
Overweight / expensive
→ REDUCE / TRIM candidate

Thesis / quality / permanent-loss deterioration
→ EXIT REVIEW / EXIT candidate
```

A price decline alone must not create an exit signal.

---

## 16. Program C · R9 — Movement / Meaningful Change Detection

### Goal

Monitor transitions, not only snapshots.

Examples:

```text
CORE → WATCH
WATCH → AT_RISK
SATELLITE → CORE_CANDIDATE
recommendation upgrade/downgrade
material score change
material risk deterioration
meaningful valuation shift
new regulatory/news evidence
evidence conflict
staleness transition
```

### Anti-churn requirement

- one weak quarter must not automatically demote a Core holding;
- one price move must not create thesis change;
- transitions require explicit persistence/stability rules.

---

## 17. Program C · R10 — Combined Action Center

The final Action Center should combine:

- deterministic recommendation;
- current role;
- sizing state;
- Core Health;
- Portfolio Fit;
- Exit Risk;
- meaningful change;
- material news;
- research freshness/conflicts;
- owner target/stop settings;
- concentration warnings.

It must show supporting and contradictory evidence separately.

It must not compress disagreement into one opaque score.

### Program C exit

The owner should be able to see, for each holding:

```text
What is the current deterministic state?
What changed?
Why?
What is blocked?
What evidence contradicts the view?
What action is suggested?
What still requires human review?
```

No automated trading is authorized.

---

# PROGRAM D — Operations & Optional AI

## 18. Purpose

Program D operationalizes the system only after Programs A–C are dependable.

Program D consists of:

```text
R11 — Scheduled portfolio maintenance
R12 — Optional AI Investment Committee
```

---

## 19. Program D · R11 — Scheduled Maintenance

Automation should be domain-specific and enabled only after manual/bounded rollout proves safe.

Possible later automation:

- stale research-domain refresh;
- incremental Angel One market-history refresh;
- deterministic score recomputation after accepted evidence change;
- recommendation recomputation after score change;
- sizing recomputation after recommendation/weight change;
- meaningful-change detection.

### Automation rules

- provider kill switch;
- call budgets;
- idempotency;
- bounded retries;
- leases;
- audit events;
- recovery behavior;
- no hidden repeated spending;
- no automatic portfolio mutation;
- no automatic order placement.

---

## 20. Program D · R12 — Optional AI Investment Committee

AI remains optional.

It may:
- summarize deterministic evidence;
- explain contradictions;
- explain score/recommendation changes;
- highlight monitoring priorities;
- prepare weekly/on-demand Investment Committee narratives.

AI may not:
- invent financial facts;
- calculate hidden scores;
- change deterministic outputs;
- mutate positions;
- place trades;
- override owner decisions.

Program D can be considered complete without broad AI if the owner does not want that capability.

---

# 21. Mandatory review protocol before every Program

Before Program A, B, C or D starts, perform:

### Step 1 — Read
- this plan;
- cumulative handoff;
- current Development Status;
- relevant canonical architecture docs;
- previous Program closure document.

### Step 2 — Inspect
- current branch/PR state;
- current production/local state as appropriate;
- relevant tests;
- current portfolio coverage;
- currently authorized provider/production actions.

### Step 3 — Reconcile
Confirm:
- prerequisites still hold;
- no earlier stage became stale;
- no duplicate architecture is being created;
- no obsolete branch assumptions are carried forward.

### Step 4 — Plan
Create a bounded Program-specific plan with:
- checkpoints;
- acceptance criteria;
- expected provider calls;
- production changes, if any;
- rollback/fail-closed behavior;
- owner approval points.

### Step 5 — Execute locally first
Unless the owner separately authorizes otherwise.

### Step 6 — Validate
- tests;
- TypeScript;
- architecture guards;
- security/RLS where relevant;
- hand-reconciled financial examples;
- provider accounting where relevant.

### Step 7 — Record
Update:
- cumulative handoff;
- Program-specific closure doc;
- Development Status;
- Requirements Register where status materially changes.

---

# 22. Branch / PR governance before Program A

Do not continue substantial Program A development on the current oversized PR #101 without an explicit disposition decision.

Current audit state:
- PR #101 = OPEN / DRAFT / UNMERGED;
- current branch contains the complete H→K architecture history;
- scope is very large.

Required before Program A implementation:

```text
Freeze Gate-K handoff
        ↓
Review PR #101 disposition
        ↓
Owner merge / branch strategy decision
        ↓
Create clean post-K branch
        ↓
Start Program A
```

Program A planning may be prepared before merge, but substantive implementation should begin only after branch strategy is frozen.

---

# 23. Permanent safety boundaries

Unless explicitly approved for a named action, this plan does not authorize:

- production Supabase mutation;
- production migration;
- provider execution;
- broad Trendlyne cohort execution;
- Angel One historical backfill;
- score persistence;
- recommendation persistence;
- position sizing persistence;
- scheduler activation;
- AI portfolio-wide activation;
- portfolio mutation;
- deployment;
- PR merge;
- automatic trading.

Owner approval for one action does not imply approval for another.

---

# 24. Final post-K sequence

```text
Gate K
COMPLETE / PASS
        ↓
PR #101 disposition / clean-branch strategy
        ↓
PROGRAM A
R3 + R5
Evidence Coverage
        ↓
PROGRAM B
R6 + recommendation calibration + R7
Deterministic Portfolio Intelligence
        ↓
PROGRAM C
R8 + R9 + R10
Portfolio Decision Engines
        ↓
PROGRAM D
R11 + R12
Operations & Optional AI
```

No Gate L or Gate M is planned unless a genuinely new architecture problem later justifies one.

---

## 25. Current status

```text
Post-Gate-K plan = CANONICAL / ACTIVE
PKR-1 / PKR-1B = COMPLETE / PASS / CLOSED

Program A = NOT STARTED
Program B = NOT STARTED
Program C = NOT STARTED
Program D = NOT STARTED
```

This document must be reviewed before opening each Program.
