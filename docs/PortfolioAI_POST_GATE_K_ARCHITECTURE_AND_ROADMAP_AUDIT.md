# PortfolioAI — Post-Gate-K Architecture & Roadmap Reconciliation Audit

**Date:** 23 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 OPEN / DRAFT / UNMERGED  
**Purpose:** Reconcile the actual H→K build against the canonical Blueprint, Research & Intelligence Architecture, Requirements Register, Development Status and Integration & Execution Plan before naming any further Gate.

---

## 1. Executive conclusion

**No Gate L or Gate M is currently required or canonically defined.**

Gate K closed the missing **research-methodology architecture** problem:

```text
canonical classification
→ industry/business-model routing
→ sector/profile methodology authority
→ evidence/readiness semantics
→ deterministic scoring methodology
→ recommendation handoff
→ universal Research workspace
→ fail-closed unsupported/review states
```

Creating Gate L/M immediately would duplicate the older repository roadmap and blur the distinction between:

1. **methodology architecture**, which Gate K has now completed/fail-closed; and
2. **portfolio-wide evidence acquisition, scoring execution, recommendation rollout and downstream portfolio engines**, which remain incomplete.

The correct post-K direction is therefore to reconcile and resume the existing R-roadmap, not create another letter-gate chain by default.

---

## 2. What H→K actually completed

### Gate H — deterministic Pharma score proof
- first locked deterministic TORNTPHARM read-only score;
- score lineage and component integrity;
- business durability/valuation handling;
- no missing-input renormalization.

### Gate I — Pharma recommendation methodology
- recommendation authority reconciliation;
- deterministic role logic and stability safeguards;
- read-only recommendation output;
- universal fail-closed semantics carried forward.

### Gate J — Pharma subprofile portability
- all five Pharma business-model subprofiles brought under one PHARMA_V1 architecture;
- classification, evidence/readiness and scoring portability;
- explicit unresolved/fail-closed cases;
- no ticker-specific methodology dependence.

### Gate K — multi-sector methodology architecture
Gate K now proves:
- 12 registered engine families coexist;
- inherited `PHARMA_V1` and `BANK_NBFC` are preserved;
- ten K4 sector engines are implemented as read-only methodology authorities;
- Industry/business model is the minimum specialised-methodology selector;
- Sector remains macro context;
- unsupported methodology fails safely;
- conflicting/missing classification remains review-required;
- future-stock routing is classification-driven;
- cross-sector methodology/benchmark/valuation/recommendation authority leakage is blocked;
- one universal Research workspace remains authoritative;
- the frozen K1/K5 current-equity architecture snapshot has an explicit route/unavailable/review state for every row;
- universal recommendation semantics are portable;
- universal numeric recommendation thresholds are **not** assumed portable.

**Gate K completion means methodology architecture coverage, not evidence/scoring/recommendation coverage for every holding.**

---

## 3. Architecture areas already strong enough that another methodology Gate is unnecessary

### Application foundation
- transaction-derived holdings/accounting;
- canonical classification authority;
- owner-controlled role/weight settings;
- RLS/security and audit architecture;
- Dashboard/Research shared access boundaries.

### Provider/evidence control plane
- provider-neutral evidence storage;
- freshness and provenance semantics;
- Trendlyne controlled adapter;
- provider kill switch/budget/lease/accounting controls;
- cache-first application reads;
- bounded cohort architecture.

### Research workspace
- one shared Research page shell;
- profile-driven configuration;
- missing/N/A/readiness semantics;
- score/recommendation display contracts;
- Research Health continuity.

### Research methodology
- Pharma architecture validated deeply;
- bank methodology reconciled and separated from pending NBFC methodology;
- ten additional sector methodology packages completed;
- registry-driven routing and isolation;
- no cross-sector fallback.

These areas do not need a Gate L merely to restate or repackage them.

---

## 4. What remains genuinely incomplete

### A. Portfolio-wide fundamental/research evidence breadth — **still required**
The provider/evidence architecture exists, but broad company-specific evidence does not.

Remaining work maps to canonical **R3**:
- fetch only approved missing/stale domains;
- bounded cohorts;
- preserve provider budgets and freshness rules;
- populate canonical evidence once;
- no page-specific live provider dependency.

Gate K deliberately did not perform this work.

### B. Portfolio-wide market history / momentum / risk evidence — **still required**
Angel One current price authority exists, but historical OHLCV-derived market evidence remains reference/pilot breadth rather than full eligible-equity breadth.

Remaining work maps to **R5**:
- bounded OHLCV backfill;
- incremental updates;
- benchmark histories;
- deterministic returns, drawdown, volatility, relative strength and momentum evidence.

### C. Company-specific deterministic scoring execution — **still required**
Gate K built/validated scoring **methodology authorities**. It did not execute and persist score runs across the whole portfolio.

Remaining work maps to **R6**:
- readiness-driven scoring only;
- company evidence + correct methodology;
- explicit score-not-computable outcomes;
- point-in-time/model/evidence lineage.

### D. Sector-specific numeric recommendation authority — **partially unresolved by design**
K5 explicitly found that universal numeric recommendation thresholds are not established as portable.

Therefore:
- recommendation role semantics are shared;
- numeric thresholds/floors/blockers remain profile-owned;
- they should be calibrated/approved using real score/evidence distributions, not invented abstractly.

This work belongs alongside late R6 / early **R7**, after adequate evidence/scoring cohorts exist.

### E. Recommendation + Position Sizing portfolio rollout — **still required**
Recommendation and D35B receiving contracts/reference implementations exist, but broad real-holding execution/persistence does not.

Remaining work maps to **R7**:
- eligible score-ready recommendations;
- explicit insufficient evidence;
- downstream D35B assessments;
- never overwrite owner role/targets.

### F. Core Health / Portfolio Fit / Risk / Exit — **not implemented portfolio-wide**
Dashboard readiness surfaces exist, but dedicated formal engines are not yet portfolio-wide deterministic outputs.

Remaining work maps to **R8**.

### G. Meaningful change / Movement Engine — **not implemented as the full deterministic transition engine**
Daily market movement UI is not the same as thesis/role/state transition monitoring.

Remaining work maps to **R9**.

### H. Combined Action Center — **not complete as the final integrated decision layer**
Pieces such as action-bias helpers exist, but the full portfolio-level combined action system depends on R6–R9.

Remaining work maps to **R10**.

### I. Scheduled research/market/scoring maintenance — **not generally enabled**
News scheduling is separate and already active. Research, market history and investment-engine automation remain independently gated.

Remaining work maps to **R11**.

### J. Optional AI Investment Committee — **not required for deterministic product correctness**
An AI interpretation reference path exists, but broad AI synthesis remains optional and must remain downstream of deterministic evidence/results.

Remaining work maps to **R12** only if the owner wants it.

---

## 5. Mapping the old R-roadmap after Gate K

| Existing roadmap stage | Post-K disposition |
|---|---|
| R0 documentation reconciliation | **Needs refresh now** because Development Status became stale during H→K |
| R1 Position Sizing contract | **ENGINE CONTRACT COMPLETE**; portfolio rollout still downstream |
| R2 Coverage Registry / Orchestrator | **Foundation/read-only coverage contract exists** |
| R3 Research evidence breadth | **STILL REQUIRED** |
| R4 Generic sector/profile Research contracts | **SUPERSEDED / COMPLETED BY H→K, especially Gate K** |
| R5 Market-history rollout | **STILL REQUIRED** |
| R6 Portfolio-wide deterministic scoring rollout | **STILL REQUIRED; methodology layer now much stronger because of Gate K** |
| R7 Recommendation + sizing rollout | **STILL REQUIRED** |
| R8 Core Health / Portfolio Fit / Risk / Exit | **STILL REQUIRED** |
| R9 Movement / meaningful change detection | **STILL REQUIRED** |
| R10 Combined Action Center | **STILL REQUIRED** |
| R11 Scheduled portfolio maintenance | **OPTIONAL LATER, only after manual rollout proves safe** |
| R12 Optional AI Investment Committee | **OPTIONAL LATER** |

---

## 6. Recommended post-K program — fewer stages, not more letter Gates

To avoid another long nested-gate sequence, group the remaining roadmap into four controlled programs while preserving the canonical R-stage identities.

### Program A — Evidence Coverage
**R3 + R5**

Goal:
- company research evidence breadth;
- historical market evidence breadth;
- no scoring/recommendation widening until required inputs are ready.

Execution should remain bounded, cohort-based and provider-budget-aware.

### Program B — Deterministic Portfolio Intelligence
**R6 + recommendation-policy calibration + R7**

Goal:
- execute company-specific scores only when ready;
- calibrate/approve sector/profile recommendation thresholds from real evidence/score distributions;
- produce recommendations only when eligible;
- run D35B only downstream of validated score/recommendation lineage.

### Program C — Portfolio Decision Engines
**R8 + R9 + R10**

Goal:
- Core Health;
- Portfolio Fit/Risk;
- Exit intelligence;
- meaningful state/change detection;
- final integrated Action Center.

### Program D — Operations & Optional AI
**R11 + R12**

Goal:
- automation only after manual/cohort safety is proven;
- optional AI explanation/synthesis only after deterministic portfolio intelligence is dependable.

---

## 7. Immediate next step before Program A

Do **not** start another substantive build on PR #101.

PR #101 currently contains a very large accumulated scope and remains OPEN / DRAFT / UNMERGED. The current inspected state is approximately:
- 1,621 commits;
- 868 changed files;
- ~123,869 additions;
- 186 deletions.

This does not mean the code is invalid, but it makes review/re-entry harder and increases governance risk.

Before new breadth/production work:
1. freeze the Gate K handoff;
2. update living Development Status / roadmap wording;
3. decide PR #101 disposition separately;
4. after owner review/merge strategy, begin the next program on a clean branch;
5. keep all production/provider execution separately approved.

The latest Architecture Guard workflow also ended before executing job steps, while Vercel reports a build-rate-limit failure. Those infrastructure statuses should not be treated as code validation results; owner-local Gate K validation remains the closure evidence currently recorded.

---

## 8. Gate L / Gate M decision

### Gate L
**Not needed now.**

A Gate L called “evidence expansion” would merely rename R3/R5 and create a second roadmap vocabulary.

A Gate L called “recommendation thresholds” would be premature before representative score/evidence distributions exist.

### Gate M
**Not needed now.**

Position sizing/Core Health/Exit/Action Center already have canonical homes in R7–R10. Creating Gate M would duplicate those stages.

### Future new Gate
A new letter Gate should be created only if a genuinely new architecture decision appears that is not already represented in the canonical R-roadmap.

Examples that could justify a future new Gate:
- a new asset-class research architecture beyond equities;
- a materially new cross-sector recommendation authority architecture;
- an autonomous orchestration architecture change;
- a new portfolio-level optimization framework.

None of those is required merely to continue the current portfolio build.

---

## 9. Final audit verdict

```text
Research methodology architecture:
COMPLETE / FAIL-CLOSED for current Gate-K scope

Portfolio-wide evidence:
INCOMPLETE

Portfolio-wide market history:
INCOMPLETE

Portfolio-wide score execution:
INCOMPLETE

Portfolio-wide recommendation:
INCOMPLETE

Portfolio-wide position sizing:
INCOMPLETE

Core Health / Portfolio Fit / Exit:
INCOMPLETE

Movement / meaningful change:
INCOMPLETE

Combined Action Center:
INCOMPLETE

General research/market/scoring automation:
NOT ENABLED

Optional AI Investment Committee:
OPTIONAL / NOT REQUIRED FOR NEXT STEP
```

**Recommended roadmap:** no Gate L/M. Reconcile documentation/PR strategy, then continue with Program A = **R3 + R5 Evidence Coverage**.
