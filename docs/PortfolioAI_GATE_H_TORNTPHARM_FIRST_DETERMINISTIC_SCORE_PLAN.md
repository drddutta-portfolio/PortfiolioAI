# PortfolioAI — Gate H Plan
## Complete TORNTPHARM Evidence and Calculate the First Deterministic Company Score

**Date:** 20 September 2026  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Target security:** TORNTPHARM  
**Profile:** PHARMA_V1  
**Primary:** DOMESTIC_FORMULATIONS  
**Material Overlay:** GLOBAL_GENERICS  
**Emerging Watch:** CDMO_CRAMS  

**Status:** PLANNED — NOT STARTED

---

## 1. Gate H objective

Gate H has one narrowly defined objective:

> Produce the first real, deterministic, hand-verifiable TORNTPHARM PHARMA_V1 score from canonical reviewed evidence using the Gate G engine contract.

Gate G is already closed as:

> **ENGINE CONTRACT COMPLETE**

Gate H therefore does **not** redesign methodology.

Gate H must:

1. prove the exact company-specific input readiness for all 10 weighted dimensions;
2. fill only the evidence gaps required by the already-approved contracts;
3. calculate all 10 Primary dimension scores;
4. apply only approved Global Generics Material Overlay modifiers;
5. apply the approved governance/regulatory runtime behavior;
6. calculate the fixed-weight overall score;
7. independently hand-check the result;
8. keep persistence, recommendation and sizing OFF.

---

## 2. Non-goals and safety boundaries

Gate H does **not** authorize:

- production evidence mutation;
- production score persistence;
- recommendation logic;
- recommendation persistence;
- position-sizing logic;
- position-sizing persistence;
- provider refreshes or paid API calls;
- scheduler changes;
- deployment;
- PR merge;
- automatic trading;
- Pharma rollout to other stocks.

Any action that would write evidence, call a provider, or persist a score requires a separate explicit owner approval for that exact action.

Gate H is read-only by default.

Missing evidence is never zero.

Missing evidence is never neutral.

No missing dimension may be reweighted away.

---

## 3. Gate H entry state

Gate G has established:

- all ten PHARMA_V1 weighted dimensions have approved methodology;
- readiness rules are approved;
- Global Generics overlay formula/cap is approved;
- governance/regulatory interpretation rules are approved;
- fixed-weight aggregation is reproducible;
- the complete engine passed a hand-verifiable synthetic dry run;
- score execution and persistence remain OFF.

Current TORNTPHARM state is:

```text
overallScore = null
overallPreviewState = NOT_CURRENTLY_COMPUTABLE
governanceRuntime = REVIEW_REQUIRED
Gate H entry = FAIL_CLOSED_EVIDENCE_COMPLETION_REQUIRED
```

This is a company-evidence problem, not a methodology problem.

---

# 4. Gate H is capped at four stages

There will be only:

```text
H1 — Exact 10-dimension evidence readiness audit
H2 — Evidence completion and canonical input lock
H3 — First deterministic read-only TORNTPHARM score
H4 — Independent verification and Gate H closure
```

There are no H1A/H1B/H2A/etc. stages unless a genuinely new structural blocker is discovered.

---

# 5. H1 — Exact 10-dimension evidence readiness audit

## Purpose

Build one authoritative TORNTPHARM input matrix against the **approved Gate G contracts**.

This audit must use the actual canonical/local research state and existing stored source records, not assumptions from old gap registers.

Every weighted dimension must be checked independently.

## Required matrix

| Dimension | Weight | Exact approved input requirement | Current canonical evidence | Missing input | Score-ready? |
|---|---:|---|---|---|---|
| Quality | 13% | Operating Margin level/stability/trend from required comparable history | audit | audit | yes/no |
| Growth | 15% | Segment Growth level/consistency/trend | audit | audit | yes/no |
| Capital Efficiency | 10% | ROCE level/stability/trend | 3-year ROCE fixture exists | derive/check | yes/no |
| Cash Flow | 10% | matched CFO/PAT/FCF conversion + consistency/trend | CFO currently incomplete in Gate G fixture | audit/fill | yes/no |
| Balance Sheet / Credit | 10% | leverage, interest coverage, trend/resilience | 3-year structure exists | derive/check | yes/no |
| Business Durability | 10% | reviewed normalized durability components | R&D history only partially covers dimension | fill | yes/no |
| Valuation | 12% | self-history + peer-relative + FCF corroboration | methodology approved | actual component inputs audit | yes/no |
| Momentum | 8% | 12M, 6M, 12M relative to NIFTY Pharma | not locked | fill | yes/no |
| Ownership / Governance | 6% | ownership stability + pledge/control + non-G4 context | not fully locked | fill | yes/no |
| Risk | 6% | regulatory context + 1Y drawdown + relative volatility | partial regulatory chain | fill | yes/no |

## H1 rules

- do not use old “ready/not ready” labels without verifying the underlying current evidence;
- distinguish raw observations from derived statistics;
- distinguish reviewed evidence from proposal-only evidence;
- distinguish source completeness from scoring completeness;
- verify exact periods, units, consolidation scope, and provenance;
- preserve acquisition/one-off comparability rules;
- no provider call merely because a metric is missing.

## H1 deliverable

One versioned artifact:

`TORNTPHARM_GATE_H_INPUT_READINESS_V1`

It must identify, for every dimension:

- exact required raw inputs;
- exact derived statistics;
- current source/evidence references;
- missing observations;
- source priority for filling gaps;
- whether the dimension is score-ready.

## H1 exit condition

H1 passes only when there is no ambiguity about **what is missing**.

No numeric overall score is calculated in H1.

---

# 6. H2 — Evidence completion and canonical input lock

## Purpose

Fill the evidence gaps identified by H1 using the safest available source path, then freeze a read-only company-score input package.

H2 does not change scoring methodology.

## Source priority

Use the following order:

1. existing canonical observations already in PortfolioAI;
2. already-stored immutable source records;
3. existing reviewed issuer/exchange/regulator artifacts already in the repo/research store;
4. fresh public official-source research, read-only;
5. market-history provider data only if required and separately authorized.

No lower-priority source should replace an available higher-priority canonical source.

## Expected evidence work

### Quality

Confirm enough comparable quarterly operating-revenue and operating-profit periods to produce:

- median latest-8 Operating Margin;
- latest-8 IQR;
- latest-4 minus prior-4 median trend.

If 8 comparable matched quarters do not exist, Quality remains fail-closed.

### Growth

Lock the exact Primary Domestic Formulations growth series required by the approved Segment Growth contract.

For any Global Generics Growth overlay input:

- use only reviewed comparable US/export observations;
- preserve the existing Q4 base-business semantic guard;
- do not silently mix acquisition-distorted reported growth.

### Capital Efficiency

Use the canonical annual ROCE series and deterministically derive:

- level statistic;
- stability statistic;
- trend statistic.

The derivation convention itself must be explicit and reproducible.

### Cash Flow

Complete the minimum matched annual series for:

- CFO;
- PAT;
- CAPEX / FCF;
- CFO/PAT;
- FCF/PAT;
- positive FCF years;
- CFO/PAT trend.

Current Gate G evidence indicates CFO history is the likely blocking item.

### Balance Sheet / Credit

Lock the matched annual series for:

- Net Debt / EBITDA;
- Interest Coverage;
- supporting debt/cash/EBITDA;
- leverage trend.

No short-term-debt substitution is permitted.

### Business Durability

Create reviewed normalized component inputs for:

- Brand / Therapy Leadership — 35%;
- Field Force Productivity — 25%;
- R&D Productivity — 20%;
- Pipeline / Corporate Execution — 20%.

These are evidence-to-component reviews, not new methodology.

Every component score must include:

- reviewed evidence;
- rationale;
- confidence;
- contradiction state;
- lineage.

No raw qualitative claim may be converted directly into a score without the reviewed component record.

### Valuation

Lock all three required component scores:

- Self-History Relative Valuation — 40%;
- Peer-Relative Valuation — 40%;
- Cash-Flow Corroboration — 20%.

Requirements:

- current authoritative market price;
- current reviewed earnings/denominators;
- comparable Domestic Formulations peer cohort;
- acquisition/one-off normalization where required;
- no missing-component renormalization.

If any one component is missing, Valuation remains fail-closed.

### Momentum

Lock:

- 12M absolute return;
- 6M absolute return;
- 12M relative strength versus NIFTY Pharma.

The price-history source and exact lookback-date convention must be explicit.

No NIFTY Bank or BANK_NBFC momentum logic is permitted.

### Ownership / Governance

Lock at least the approved minimum ownership history:

- minimum 4 quarters;
- preferred 8 quarters;
- latest quarter required.

Review:

- ownership stability;
- pledge/control risk;
- non-G4 governance context.

Do not re-penalize events already consumed by the governance gate.

### Risk

Lock:

- canonical regulatory runtime context;
- 1Y maximum drawdown;
- volatility relative to NIFTY Pharma.

The current Indrad warning→closeout history is retained.

Company-wide current regulatory scope must be researched sufficiently to classify the runtime input; if materiality/scope remains unknown, Risk and/or overall scoring stays fail-closed.

## H2 overlay inputs

For the Global Generics Material Overlay, where eligible, lock:

- economic materiality percent;
- evidence completeness;
- evidence confidence;
- normalized overlay signal;
- contradiction state.

A numeric overlay modifier is allowed only when overlay readiness is `READY`.

## H2 deliverable

One immutable/read-only calculation package:

`TORNTPHARM_GATE_H_SCORE_INPUT_PACKAGE_V1`

It must contain:

- all raw evidence references;
- all derived statistics;
- all reviewed normalized component scores;
- overlay inputs;
- governance/runtime input;
- methodology contract versions;
- no persisted final score.

## H2 exit condition

Every one of the 10 weighted dimensions must be score-ready.

Additionally:

- common core READY;
- Primary READY;
- overall readiness >= 70%;
- each dimension >= 60%;
- every weighted dimension READY;
- governance runtime no longer unresolved for score execution;
- required Material Overlay inputs READY or explicitly not applicable by contract.

If any required item remains missing, H2 does not pass and no overall score is calculated.

---

# 7. H3 — First deterministic read-only TORNTPHARM score

## Purpose

Calculate the first real company score using only the locked H2 input package and already-approved Gate G methodology.

No new threshold, band, weight, benchmark, or heuristic may be introduced in H3.

## Calculation order

For each of the 10 dimensions:

```text
Reviewed raw evidence
→ deterministic derived statistics
→ approved Primary score contract
→ Primary dimension score
→ approved Material Overlay modifier, if eligible and READY
→ Final dimension score
```

Then:

```text
Final Overall Score
=
13% Quality
+ 15% Growth
+ 10% Capital Efficiency
+ 10% Cash Flow
+ 10% Balance Sheet / Credit
+ 10% Business Durability
+ 12% Valuation
+ 8% Momentum
+ 6% Ownership / Governance
+ 6% Risk
```

No denominator renormalization is allowed.

## Required H3 output

For every dimension display:

- Primary score;
- Primary methodology contract version;
- raw evidence lineage;
- derived-statistic lineage;
- readiness coverage;
- overlay eligibility;
- overlay modifier;
- final dimension score;
- reason codes;
- confidence / review notes.

Overall output must include:

- all 10 final dimension scores;
- each weighted contribution;
- overall score;
- governance gate state;
- complete methodology lineage;
- complete evidence lineage.

## H3 persistence rule

The first TORNTPHARM score is **read-only / non-persisting**.

Do not write to any score-run table.

Do not create a recommendation.

Do not create position sizing.

## H3 exit condition

The adapter emits exactly one deterministic TORNTPHARM overall score with:

- all 10 dimensions numeric;
- no hidden reweighting;
- approved overlay treatment only;
- governance runtime resolved;
- complete lineage.

---

# 8. H4 — Independent verification and Gate H closure

## Purpose

Prove that the first TORNTPHARM score can be independently reproduced.

## Required checks

### A. Hand calculation

Independently calculate:

```text
dimension score × fixed weight
```

for all 10 dimensions and sum the contributions.

The hand total must exactly match the adapter result within the documented rounding convention.

### B. Evidence trace

For each dimension, independently verify:

- the observations used;
- dates / periods;
- units;
- source identity;
- derived statistic;
- score band;
- component weight;
- overlay modifier, if any.

### C. Anti-leakage

Verify:

- no BANK_NBFC methodology;
- no NIFTY Bank benchmark;
- no Global Generics second stock score;
- no CDMO Emerging Watch numeric inclusion;
- no hidden governance double counting;
- no missing-evidence neutralization;
- no hidden renormalization.

### D. Determinism

Run the calculation twice from the same locked input package.

The outputs must be identical.

### E. Full engineering validation

Run:

- focused Gate H tests;
- full app tests as appropriate;
- Edge tests if touched;
- strict TypeScript;
- architecture guard;
- architecture lint;
- production build;
- `git diff --check`.

Global lint remains separate from known inherited debt unless the Gate H changes introduce a new lint regression.

## H4 deliverable

A final versioned report containing:

- locked input-package version;
- all ten dimension scores;
- overlay modifiers;
- weighted contributions;
- overall score;
- governance state;
- hand-check result;
- evidence lineage;
- methodology lineage;
- validation results.

## H4 exit condition

Gate H closes only when:

> **FIRST DETERMINISTIC TORNTPHARM SCORE = REPRODUCIBLE / HAND-VERIFIED / NON-PERSISTING**

---

# 9. Gate H closure state

When H1–H4 pass:

```text
GATE H = COMPLETE
TORNTPHARM FIRST DETERMINISTIC SCORE = COMPLETE
SCORE PERSISTENCE = OFF
RECOMMENDATION = OFF
POSITION SIZING = OFF
```

Then the project may move to:

> **Gate I — convert scored research into recommendation methodology**

Gate I must not begin before Gate H is formally closed.

---

# 10. Explicit authorization checkpoints

The default Gate H workflow is read-only.

Separate explicit owner approval is required before any of the following:

- calling a paid/provider API or refresh endpoint;
- inserting/updating canonical evidence;
- materializing reviewed evidence into production;
- persisting the calculated score;
- changing scheduler/cron;
- deployment;
- PR merge.

If H2 can be completed entirely from already-stored canonical data and public official-source read-only research, no production mutation approval is required.

---

# 11. Recommended execution posture

The shortest safe route is:

```text
H1
Exact all-10 input audit
    ↓
H2
Fill evidence once, lock one score-input package
    ↓
H3
Calculate the first real score once
    ↓
H4
Hand-verify once
    ↓
Gate H closed
```

Avoid reopening methodology unless a concrete contradiction proves that an approved Gate G contract cannot consume valid company evidence.

That would be an exception, not a new Gate H sub-stage.
