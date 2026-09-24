# PortfolioAI — Program B Master Plan
## Portfolio-Wide Deterministic Scoring, Recommendation & Sizing

**Status:** APPROVED MASTER PLAN — B0 is the only active next checkpoint  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Program A closure reference:** `96309657dcd853d83a5c992e0237daa919af709b`  
**Program B hard cap:** `B0 → B1 → B2 → B3 → B4 → B-FINAL` — **no B5+**

---

## 1. Program B purpose

Program B converts PortfolioAI's validated classification, methodology, evidence, and market-history foundations into a deterministic portfolio decision pipeline:

```text
Canonical classification
        ↓
Canonical cached evidence
        ↓
Scoring readiness
        ↓
Methodology resolver
        ↓
Deterministic score
        ↓
Recommendation readiness
        ↓
Deterministic recommendation
        ↓
Sizing readiness
        ↓
Deterministic sizing assessment
```

Program B comprises:

- **R6 — portfolio-wide deterministic scoring**
- **R7 — portfolio-wide deterministic recommendation and sizing**

Program B does **not** perform evidence acquisition. It consumes only canonical cached evidence and must fail closed when required inputs are missing, stale, conflicting, unsupported, or not applicable.

---

## 2. Fixed checkpoint structure

```text
B0        Program A closure + Program B contract freeze

B1        R6 Contract & Architecture
          Checkpoint A

B2        R6 Execution & Validation
          Checkpoint B
          → R6 closes here

B3        R7 Contract & Architecture
          Checkpoint A

B4        R7 Execution & Validation
          Checkpoint B
          → R7 closes here

B-FINAL   Program B cross-pipeline closure
```

This six-checkpoint structure is final for Program B. Granular requirements live inside the checkpoints; they must not be promoted into additional B5+ gates.

---

# B0 — Program A Closure Verification + Program B Contract Freeze

## Objective

Verify that Program A is genuinely closed at the recorded repository state and freeze the non-negotiable Program B rules before any scoring architecture is implemented.

## B0 verification

Confirm from repository evidence:

- A2A = COMPLETE / PASS / CLOSED
- A2B = COMPLETE / PASS / CLOSED
- A2C = COMPLETE / PASS / CLOSED
- bounded Program A provider pilot = COMPLETE / PASS / CLOSED
- final A2C commit is present in ancestry
- final A2C coverage and the 24 September 2026 non-final-candle rationale are recorded
- no unresolved Program A blocker is silently carried into Program B

## Program B invariants to freeze

1. **No evidence readiness → no score.**
2. **No valid score → no recommendation.**
3. **No valid recommendation → no sizing.**
4. R6/R7 computation is **cache-only**.
5. **Zero Angel One calls** from scoring/recommendation/sizing computation.
6. **Zero Trendlyne calls** from scoring/recommendation/sizing computation.
7. **Zero OpenAI calls** for numeric scoring, recommendation, or sizing decisions.
8. Missing input is never repaired by hidden renormalization.
9. Unsupported methodology is never replaced with `GENERAL_FALLBACK` or nearest-sector logic.
10. No sector may borrow another sector's methodology or sizing heuristic.
11. AI may explain a deterministic result later; AI may not create or alter the deterministic result.
12. Owner target price, stop loss, target weight, and role overrides remain owner-controlled.
13. Equity/non-equity applicability remains explicit.
14. No production mutation, deployment, merge, scheduler activation, or trading is authorized by Program B.
15. Any database migration must be additive, genuinely required, separately reviewed, and separately approved before application.

## B0 inherited-contract audit

B0 must explicitly verify which prior Gate I / Gate K results can be inherited.

In particular:

- do **not** infer recommendation-policy portability merely because Gate K closed;
- inspect the actual K5 evidence;
- inherit only the recommendation portability facts that K5 explicitly proved;
- record any missing portability question as a B3 contract obligation.

## B0 exit

```text
Program A closure = VERIFIED
Program B invariants = FROZEN
Inherited Gate I / Gate K contracts = EXPLICITLY RECORDED
Next stage = B1 only
```

No provider calls. No scoring. No recommendation. No sizing.

---

# B1 — R6 Contract & Architecture
## Checkpoint A

B1 designs the shared scoring architecture before numeric scoring begins.

## B1.1 Scoring-readiness adapter

The adapter answers:

> Can this security be scored authoritatively right now?

Allowed readiness states:

```text
READY
INSUFFICIENT_EVIDENCE
STALE_REQUIRED_EVIDENCE
CONFLICTING_EVIDENCE
REVIEW_REQUIRED
METHODOLOGY_NOT_AVAILABLE
NOT_APPLICABLE
BLOCKED_PREREQUISITE
```

Only `READY` may reach numeric scoring.

The readiness decision must evaluate, as applicable:

- security identity;
- asset type;
- sector;
- industry;
- basic industry;
- methodology/subprofile assignment;
- required evidence coverage;
- evidence freshness;
- evidence conflict/review state;
- required market-history availability;
- methodology version availability;
- assignment/role validity.

## B1.2 Methodology resolver

The established routing invariant remains:

```text
Sector
  = macro context

Industry
  = minimum micro-methodology selector

Basic Industry
  = business-model refinement

Subprofile
  = metric / applicability / valuation / risk selector

Company evidence
  = input

Score
  = assessment
```

Explicitly prohibited:

```text
unsupported / unresolved methodology
        ↓
GENERAL_FALLBACK or nearest methodology
        ↓
authoritative numeric score
```

Unsupported cases must return `METHODOLOGY_NOT_AVAILABLE`.

## B1.3 Evidence-to-score lineage contract

Every authoritative score must preserve enough information to reproduce and audit the result.

Minimum lineage fields:

```text
security_id
as_of_date

classification_version

assignment_id / assignment_version
methodology_role

methodology_id
methodology_version

evidence_snapshot_id or evidence_ids
evidence_as_of_dates
evidence_freshness

metric_values
metric_applicability
metric_component_scores
metric_weights

category_scores
overall_score

readiness_state
reason_codes

calculation_version
run_id
created_at
```

### Security-role lineage correction

Role is part of lineage identity, but **`(security_id, role)` must not be used as a timeless uniqueness constraint**.

A security can have different:

- runs;
- as-of dates;
- assignment versions;
- methodology versions;
- roles across effective periods;
- evidence snapshots.

The lineage must therefore carry:

```text
security identity
+ role
+ effective assignment/version
+ methodology/version
+ as-of date
+ run identity
```

This prevents role leakage without destroying historical lineage.

## B1.4 Machine-readable blocker / gap output contract

Any fail-closed readiness result should emit a structured blocker that downstream coverage/orchestration can consume without Program B fetching evidence itself.

Recommended fields:

```text
security_id
blocking_domain
blocking_metric
required_state
observed_state
reason_code
methodology_id
methodology_role
assignment_version
as_of_date
recommended_next_evidence_action
```

`recommended_next_evidence_action` is descriptive only. It must never trigger a provider call from Program B.

Architecture:

```text
Program B detects a gap
        ↓
Coverage Registry records the gap
        ↓
Evidence Orchestrator may later refresh it
        ↓
Program B recomputes from cache
```

## B1 exit

All four components are approved together:

- readiness adapter;
- methodology resolver;
- lineage contract;
- blocker/gap contract.

No numeric scoring begins until B1 is approved.

---

# B2 — R6 Execution & Validation
## Checkpoint B

B2 proves R6 deterministically, then expands to a portfolio-wide disposition pass.

## B2.1 Controlled reference cohort

Use a deliberately mixed cohort including, where repository state supports them:

- TORNTPHARM — Domestic Formulations;
- ALIVUS — API/Bulk Drugs;
- AUROPHARMA — Global Generics;
- BIOCON — Biopharma/Biosimilars;
- SYNGENE — CDMO/CRAMS;
- HDFCBANK — BANK;
- one security with **no approved methodology** → expected `METHODOLOGY_NOT_AVAILABLE`;
- one security with a valid methodology but **insufficient evidence** → expected `INSUFFICIENT_EVIDENCE`;
- one ETF/non-equity → expected `NOT_APPLICABLE`.

The exact cohort must be selected from canonical repository/database state at execution time; symbols are reference candidates, not hard-coded methodology selectors.

## B2.2 Deterministic scoring execution

Only `READY` members may be scored.

Scoring must be:

- cache-only;
- deterministic;
- methodology-versioned;
- exact about missing inputs;
- traceable to canonical evidence.

Verify:

- no missing-input renormalization;
- no cross-sector metric leakage;
- no duplicate counting;
- no nearest-profile substitution;
- no hidden discretionary adjustment;
- no AI-generated score;
- no provider execution.

## B2.3 Replay validation

For the same:

```text
security
+ evidence snapshot
+ assignment/role
+ methodology version
+ as-of date
```

the canonical deterministic payload must reproduce identically.

### Semantic-equivalence rule

Do **not** require literal byte equality across nondeterministic metadata.

Normalize/exclude fields such as:

- run IDs;
- created timestamps;
- storage-generated IDs;
- serialization-only ordering.

Require exact equality for deterministic business payload fields, including:

- readiness;
- methodology/role selection;
- metric applicability;
- metric values;
- component scores;
- category scores;
- overall score;
- deterministic reason codes;
- recommendation state where inherited shell regression covers it.

## B2.4 Isolation and fail-closed validation

Force and validate:

- Bank metrics never enter Pharma;
- Pharma-specific metrics never enter BANK;
- subprofile logic remains isolated;
- missing required metric fails closed;
- stale mandatory evidence fails closed;
- conflicting evidence fails closed;
- unsupported industry/methodology fails closed;
- non-equity fails as not applicable.

### Role-keyed leakage test

Explicitly prove that evidence consumed under:

```text
Company X
Global Generics = Primary
```

cannot be resolved as evidence for:

```text
Company Y
Global Generics = Overlay
```

merely because the subprofile name is shared.

Security + role + assignment/effective lineage must remain company-scoped.

## B2.5 Shell-continuity regression

Introducing a generic readiness/resolution layer must not change already-valid Gate H–K outputs.

Compare canonical deterministic payloads before/after normalization for existing PHARMA_V1, BANK_NBFC, and relevant Gate K controls.

Require semantic equality of deterministic fields while excluding nondeterministic metadata.

No shared layer may silently recalculate an existing engine differently.

## B2.6 Research UI integration

The universal Research UI should expose:

- Overall Score;
- Category Scores;
- Readiness;
- Methodology;
- Methodology role;
- Evidence date / snapshot;
- "Why this score?";
- missing/blocked inputs;
- fail-closed reason.

The UI must clearly distinguish:

```text
evidence coverage ≠ score readiness
```

A security may have abundant evidence yet remain unscoreable because the correct approved methodology is unavailable.

## B2.7 Controlled portfolio expansion

Expand gradually:

```text
Reference cohort
      ↓
Cohort B — highest-value / highest-readiness holdings
      ↓
Cohort C — remaining evidence-ready equities
      ↓
Final portfolio disposition pass
```

Every eligible holding must end with either:

```text
SCORED
```

or a canonical fail-closed reason.

### Completion terminology

Program B distinguishes:

**PORTFOLIO-WIDE DISPOSITION COMPLETE**
- every eligible holding was evaluated and has a canonical outcome.

**PORTFOLIO-WIDE NUMERIC COVERAGE COMPLETE**
- every eligible holding had enough approved evidence/methodology for numeric downstream results.

R6 requires **portfolio-wide disposition complete**. It does not require portfolio-wide numeric coverage complete.

## R6 exit

```text
R6 = COMPLETE / PASS
Portfolio-wide scoring disposition = COMPLETE
Role/sector/subprofile isolation = PASS
Shell continuity = PASS
Provider calls from R6 computation = 0
```

---

# B3 — R7 Contract & Architecture
## Checkpoint A

No R7 computation begins until R6 is closed.

## B3.1 Recommendation-readiness gate

Recommendation eligibility requires:

```text
valid score
+ valid score lineage
+ methodology supports recommendation
+ risk/caution state resolved
```

No recommendation may be produced from:

- `INSUFFICIENT_EVIDENCE`;
- `METHODOLOGY_NOT_AVAILABLE`;
- `REVIEW_REQUIRED`;
- `CONFLICTING_EVIDENCE`;
- any other blocked prerequisite.

## B3.2 Mandatory Gate I safety inheritance

B3 must explicitly carry these safety tests into the R7 contract:

- missing floor → `INSUFFICIENT` / fail closed;
- failed floor → blocker/avoid-type result distinct from insufficient input;
- overlay cannot create an independent portfolio role;
- recommendation computation performs zero unintended writes;
- null input fails closed rather than being reconstructed or guessed.

Do not rely on institutional memory; encode these as current tests/contracts.

## B3.3 Deterministic recommendation engine

```text
deterministic score
+ methodology-specific recommendation policy
+ applicable cautions / blockers
        ↓
deterministic recommendation
```

Pharma's existing CORE/SATELLITE/WATCH floors remain Pharma-owned. They must not automatically become universal thresholds for other sectors.

## B3.4 Gate K portability inheritance rule

Before B4:

- inspect the actual K5 evidence;
- if K5 explicitly proved the relevant recommendation-policy portability property, inherit that result;
- if K5 did not explicitly prove it, B3 must define and validate the missing recommendation handoff contract;
- never infer recommendation-threshold portability merely from Gate K closure.

## B3.5 Recommendation lineage

Minimum lineage:

```text
recommendation_run_id
security_id
score_run_id

recommendation_methodology_id
recommendation_methodology_version

score
applicable thresholds
cautions
reason_codes

final_recommendation
created_at
```

Every recommendation must trace to one exact score run.

## B3.6 Position-sizing readiness and sizing engine

Sizing is a separate deterministic engine.

It may consider, as approved by the sizing methodology:

- conviction;
- portfolio role;
- business quality;
- growth durability;
- permanent-loss risk;
- valuation;
- volatility;
- concentration;
- liquidity;
- portfolio fit.

`INSUFFICIENT_EVIDENCE` is a valid result. A target range must never be fabricated because inputs are incomplete.

### Sizing anti-fallback rule

If the applicable sizing methodology is unavailable or incomplete:

```text
BLOCKED / METHODOLOGY_NOT_AVAILABLE / INSUFFICIENT_EVIDENCE
```

must be returned.

No sector may borrow another sector's sizing heuristics.

## B3.7 Owner-authority preservation

Machine assessments must remain separate from owner-controlled settings.

Program B must not overwrite:

- target price;
- stop loss;
- target weight;
- owner-set role overrides.

Possible machine outputs:

```text
suggested_target_weight
suggested_minimum_weight
suggested_maximum_weight

recommended_action
reason_codes
confidence
assessment_state
```

Possible actions may include, only where methodology supports them:

```text
ADD
HOLD
ADD_ON_WEAKNESS
REDUCE
TRIM
FREEZE
EXIT_REVIEW
```

These are assessments, not trade instructions.

## B3 exit

Recommendation, recommendation-lineage, sizing, anti-fallback, owner-authority, and inherited portability/safety contracts are approved.

No R7 computation begins until B3 is approved.

---

# B4 — R7 Execution & Validation
## Checkpoint B

## B4.1 Reference cohort and sizing edge cases

Reuse the R6 cohort where appropriate and add deliberate cases such as:

- strong score + high concentration;
- strong score + high volatility;
- low evidence confidence;
- incomplete holding;
- ETF/non-applicable asset.

Fail-closed sizing results are expected where warranted.

## B4.2 Owner-authority mutation regression

Run sizing against a security that already has owner values for:

- target price;
- stop loss;
- target weight.

After sizing execution, assert the canonical persisted owner fields are exactly unchanged.

Program B may create/read its own assessment record only through the separately approved contract; it must not rewrite owner settings.

## B4.3 Replay and cross-surface validation

Validate:

```text
Research score
      =
Recommendation engine source score

Recommendation output
      =
Sizing engine recommendation input

Portfolio view
      =
Research view
      =
Action view
```

One canonical result, many consumers.

No presentation surface may independently compute its own score, recommendation, or sizing conclusion.

## B4.4 Controlled portfolio-wide disposition

Gradually expand R7.

Every eligible holding must finish with an explicit outcome such as:

```text
RECOMMENDATION_READY
SIZING_READY
INSUFFICIENT_EVIDENCE
METHODOLOGY_NOT_AVAILABLE
NOT_APPLICABLE
BLOCKED_PREREQUISITE
```

No silent holes.

As in R6, Program B requires **portfolio-wide disposition**, not forced portfolio-wide numeric output.

## R7 exit

```text
R7 = COMPLETE / PASS
Portfolio-wide recommendation/sizing disposition = COMPLETE
Owner-authority regression = PASS
Cross-surface canonical consistency = PASS
```

---

# B-FINAL — Program B Closure

B-FINAL is a closing regression and audit, not a new methodology discovery stage.

Confirm simultaneously:

1. R6 → R7 traceability holds for every scored/recommended/sized security.
2. Security-role-assignment lineage is preserved.
3. Every eligible holding has an explicit Program B disposition.
4. Deterministic replay remains valid.
5. Cross-sector/subprofile/role isolation remains valid.
6. Existing Gate H–K shell outputs remain semantically unchanged where expected.
7. Every Program B stop condition was respected throughout.
8. Provider calls from Program B compute paths = zero.
9. AI did not create or alter numeric decisions.
10. Owner settings were not overwritten.
11. No production mutation, deployment, PR merge, scheduler activation, or trading was authorized by Program B.

Closure language:

```text
Program B = COMPLETE / PASS

Portfolio decision pipeline =
VALIDATED / OPERATIONAL IN THE APPROVED LOCAL-CANDIDATE ENVIRONMENT /
FAIL-CLOSED WHERE INCOMPLETE
```

Do **not** call the new Program B pipeline `PRODUCTION OPERATIONAL` until a separately approved merge/deployment/production reconciliation establishes that state.

---

# Provider policy

During R6/R7 scoring/recommendation/sizing computation:

```text
Angel One calls = 0
Trendlyne calls = 0
OpenAI decision calls = 0
```

If an input is missing, Program B emits a blocker/gap result. Evidence refresh belongs to the evidence/coverage orchestration layer.

---

# Database policy

Prefer existing schema.

Any new schema must be:

- genuinely necessary;
- additive;
- versioned;
- separately reviewed;
- separately approved before application.

No early Program B pilot authorizes a production migration.

---

# AI policy

Allowed:

```text
Deterministic result
        ↓
AI explanation / summarization
```

Not allowed:

```text
Evidence
   ↓
AI creates or adjusts numeric score/recommendation/sizing
```

---

# Program B stop conditions

Stop the active checkpoint if any of the following occurs:

- methodology selection is ambiguous;
- required evidence is conflicting;
- missing inputs are renormalized away;
- sector/subprofile/role leakage appears;
- scoring/recommendation/sizing computation triggers a provider call;
- AI influences numeric output;
- recommendation cannot trace to one score run;
- sizing overwrites owner-controlled settings;
- deterministic replay fails;
- shared-shell deterministic outputs change unexpectedly;
- production mutation becomes necessary without separate approval;
- a migration is required but not separately approved.

---

# Governance and build discipline

For each checkpoint:

1. inspect repository state first;
2. preserve unrelated untracked files;
3. implement only the active checkpoint;
4. run focused tests plus required global guards;
5. update the cumulative handoff;
6. commit and push only the approved branch work;
7. do not advance to the next owner checkpoint until the current checkpoint has passed.

The cumulative handoff remains historical context, not a substitute for current repository verification.

---

# Current stop point

```text
Program A = CLOSED
Program B master plan = FROZEN
Current active checkpoint = B0
Next permitted work = B0 only
```

After B0 passes, proceed to B1 Checkpoint A. Do not begin B2, B3, B4, or B-FINAL early.