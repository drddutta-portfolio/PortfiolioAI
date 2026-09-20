# PortfolioAI — Gate I Plan
## PHARMA_V1 Recommendation Methodology, First TORNTPHARM Recommendation, and AUROPHARMA Fail-Closed Control

**Date:** 21 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — KEEP OPEN / DRAFT / UNMERGED
**Target security:** TORNTPHARM
**Research profile:** PHARMA / PHARMA_V1
**Primary subprofile:** DOMESTIC_FORMULATIONS
**Gate H score:** 75.1575 / 100
**Gate H state:** COMPLETE / PASS
**Status:** IN PROGRESS — I1 IMPLEMENTED / CONSOLIDATED VALIDATION PENDING

**Owner-approved revised-plan corrections adopted before I1 implementation:**

- TORNTPHARM Gate H score 75.1575 is closed / hand-verified / reproducible / **non-persisting**; score persistence remains OFF.
- Canonical assignment identity is security-scoped plus `PHARMA / PHARMA_V1` profile/version scoped; Primary/secondary roles are resolved from that assignment rather than being lookup keys.
- Recommendation input composes canonical assignment authority with a separate explicit score authority.
- Score state is structurally discriminated as `SCORE_READY` vs `SCORE_NOT_COMPUTABLE`; assignment state is independently `RESOLVED` vs blocked.
- AUROPHARMA is the I3 fail-closed negative control, not a second completed-score recommendation pilot.
- Missing role-floor data and evaluated role-floor failure must remain distinct in I2.
- A failed role-specific floor makes that role ineligible and falls through the approved role ladder; only an approved global blocker may directly force Avoid/blocker.
- Material Overlay context cannot create an independent score, role or recommendation.
- I4 must prove zero mutation-capable path invocation, not merely unchanged stored values.


---

# 1. Gate I objective

Gate I converts the formally closed Gate H deterministic score into the first **PHARMA_V1 recommendation methodology** and then applies that methodology once to TORNTPHARM in read-only mode.

Gate I answers a different question from Gate H.

Gate H answered:

> What is the deterministic PHARMA_V1 company score from the locked evidence and approved scoring methodology?

Gate I will answer:

> Given a fully ready, deterministic PHARMA_V1 score and its dimension-level evidence, what research role can PortfolioAI support under an explicitly approved Pharma recommendation policy?

The first Gate I output must remain:

> **READ-ONLY / EXPLAINABLE / NON-PERSISTING / NON-SIZING**

Gate I does **not** reinterpret or redesign the Gate H score.

---

# 2. Gate I entry authority

The canonical Gate I input authority is the closed Gate H chain:

```text
H2 locked evidence and dimension inputs
    ->
H3 deterministic read-only score
    ->
H4 independent verification
    ->
PortfolioAI_GATE_H_CLOSURE.md
    ->
Gate I recommendation methodology
```

Current locked TORNTPHARM Gate H result:

| Dimension | Score |
|---|---:|
| Quality | 92 |
| Growth | 78.25 |
| Capital Efficiency | 79 |
| Cash Flow | 93.6 |
| Balance Sheet / Credit | 65 |
| Business Durability | 75 |
| Valuation | 30 |
| Momentum | 95 |
| Ownership / Governance | 70 |
| Risk | 80 |
| **Overall** | **75.1575** |

All ten weighted dimensions are mandatory and ready.

Gate I must consume the **authoritative H3/H4 overall score directly**.

It must never reconstruct a missing overall score by renormalizing available dimensions.

---

# 3. Existing recommendation architecture to reuse

PortfolioAI already contains useful recommendation infrastructure:

- `sectorRecommendation.ts`
- `recommendationPolicyRepository.ts`
- `actionRecommendation.ts`
- `weightRecommendation.ts`
- `RecommendationInterpretationPanel`
- `stock_recommendation_runs`
- `recommendation_profile_policies`
- persistent transition tracking
- downstream D35B position-sizing engine

These are **reference architecture**, not automatically approved PHARMA_V1 methodology.

Gate I should reuse the shared architecture where valid, but must not inherit BANK_NBFC thresholds, floors, cautions, weight ranges or persistence rules.

---

# 4. Structural issues Gate I must resolve explicitly

## 4.1 Recommendation profile identity

The current Pharma research authority is:

```text
profileCode = PHARMA
profileVersion = PHARMA_V1
```

The older recommendation scaffold is keyed to legacy scoring-profile identities such as:

```text
PHARMA_HEALTHCARE
```

Gate I must define one explicit, versioned identity bridge before recommendation logic can consume Gate H.

It must not silently assume that `PHARMA_HEALTHCARE` and `PHARMA_V1` are interchangeable.

No production `scoring_profiles` or recommendation-policy row is changed merely to solve this mapping.

## 4.2 No recommendation-side score reconstruction

The legacy `sectorRecommendation.ts` helper contains a fallback path that can calculate an overall preview from available dimensions when `snapshot.overallScore` is null.

That behavior is incompatible with the Gate H Pharma contract because it can normalize over the available dimension weight.

For PHARMA_V1:

- authoritative overall score present -> consume it;
- authoritative overall score absent -> recommendation fails closed;
- no recommendation-layer denominator renormalization;
- no substitute score from raw dimensions.

Gate I must either harden the reusable adapter or create an explicit strict-mode input contract around it.

It must not create a second scoring engine.

## 4.3 Read-only score versus persisted recommendation lineage

Gate H closed with:

```text
score persistence = OFF
```

Existing recommendation tracking and D35B sizing architecture can consume persisted score/recommendation IDs.

Gate I must not fake those IDs or persist H3 merely to satisfy a downstream prerequisite.

The first Pharma recommendation therefore remains read-only and non-persisting.

## 4.4 Recommendation is distinct from sizing and exit

The existing downstream architecture already separates:

```text
research score
    -> recommendation role
    -> recommendation persistence / transition history
    -> weight guidance / action bias
    -> position sizing
    -> Core Health / Exit
```

Gate I covers only the **recommendation role methodology and first read-only recommendation**.

Gate I does not determine portfolio weight and does not convert a role recommendation into a trade action.

---

# 5. Gate I is capped at four stages

Gate I is explicitly capped at:

```text
I1 — Recommendation authority / architecture reconciliation
I2 — PHARMA_V1 recommendation methodology lock
I3 — First recommendation + fail-closed AUROPHARMA reference control
I4 — Independent verification and Gate I closure
```

Do not create I1A / I1B / I2A / I2B or other approval micro-gates unless a genuinely new structural blocker is discovered.

Use one consolidated implementation pass per stage where practical.

---

# 6. I1 — Recommendation authority / architecture reconciliation

## Purpose

Establish the exact downstream contract through which the closed Gate H score may enter recommendation methodology.

I1 is architecture and authority work only.

It does not decide whether TORNTPHARM is Core, Satellite, Watch or Avoid.

## Required I1 work

### A. Freeze the Gate I input contract

Create one versioned, read-only recommendation input contract containing at minimum:

- security symbol / security identity;
- research profile code = `PHARMA`;
- research profile version = `PHARMA_V1`;
- primary subprofile = `DOMESTIC_FORMULATIONS`;
- Gate H score-contract version;
- Gate H input-package / evidence lineage;
- overall score = 75.1575;
- all ten final dimension scores;
- score-ready coverage;
- governance runtime state;
- Global Generics overlay treatment;
- CDMO / CRAMS Emerging Watch state;
- read-only / non-persisting flags.

Suggested contract family:

`PHARMA_V1_RECOMMENDATION_INPUT_V1`

### B. Resolve profile identity

Define a versioned mapping contract between:

- research profile authority;
- scoring authority;
- recommendation policy authority.

The mapping must answer explicitly whether the recommendation policy key is:

- a new PHARMA_V1-native policy identity; or
- a versioned bridge to an existing broader legacy policy identity.

The decision must preserve PHARMA_V1 methodology ownership.

### C. Reconcile the generic recommendation adapter

Audit `buildRecommendationPreview` and its call sites.

PHARMA_V1 must fail closed when the authoritative overall score is absent.

The generic fallback score reconstruction must not be used for Gate I.

### D. Freeze output ontology

Gate I should reuse the existing recommendation-role language unless review finds a structural reason not to:

- `CORE_CANDIDATE`
- `SATELLITE_CANDIDATE`
- `WATCH`
- `AVOID`
- `INSUFFICIENT`

These are research-role suggestions, not portfolio mutations.

### E. Preserve human authority

The PortfolioAI recommendation must remain separate from:

- user-selected portfolio role;
- target price;
- stop loss;
- target weight;
- actual holdings;
- transaction authority.

## I1 exit condition

I1 passes only when:

- the Gate H -> recommendation input path is versioned;
- PHARMA_V1 recommendation-policy identity is unambiguous;
- recommendation cannot reconstruct/renormalize a missing score;
- the output role ontology is locked;
- no recommendation threshold has yet been invented.

---

# 7. I2 — PHARMA_V1 recommendation methodology lock

## Purpose

Approve the deterministic rules that map a valid PHARMA_V1 score state to one recommendation role.

I2 is the core methodology stage.

Do not choose thresholds merely to make TORNTPHARM land in a preferred category.

## Required methodology decisions

### A. Overall role thresholds

Owner-review and approve PHARMA_V1 thresholds for:

- Core candidate;
- Satellite candidate;
- Watch;
- Avoid.

Thresholds must be monotonic, explicit and versioned.

No BANK_NBFC numeric threshold may be inherited automatically.

### B. Mandatory dimension floors

Decide whether each role requires minimum scores in selected Pharma dimensions.

Candidate dimensions for review should come from the approved PHARMA_V1 methodology, not from generic sector assumptions.

At minimum I2 must evaluate whether floors are needed for:

- Quality;
- Growth;
- Cash Flow;
- Balance Sheet / Credit;
- Business Durability;
- Valuation;
- Ownership / Governance;
- Risk.

Capital Efficiency and Momentum must also be reviewed rather than silently ignored.

A dimension may be:

- role-blocking floor;
- caution-only;
- context-only;
- explicitly not a separate role gate.

Every choice must be documented.

### C. Hard blockers versus cautions

Gate I must distinguish:

**Hard blocker**
- prevents a higher recommendation role.

**Caution**
- remains visible but does not create a second numeric deduction.

Potential Pharma caution domains to review include:

- valuation weakness / M&A transition valuation context;
- momentum disagreement;
- balance-sheet transition;
- regulatory history despite current CLEAR runtime;
- material business overlays;
- evidence-confidence limitations.

No caution may double-count a dimension already consumed numerically unless an explicit approved contract says it is a separate gate.

### D. Governance behavior

The existing current TORNTPHARM runtime is `CLEAR`.

Gate I must preserve:

- historical event visibility;
- no second regulatory penalty;
- no hidden recommendation cap;
- no duplicate Risk penalty.

For future `REVIEW_REQUIRED`, `HIGH_RISK`, `BLOCKED_REVIEW` or equivalent states, Gate I must define fail-closed recommendation behavior explicitly.

### E. Overlay behavior

Global Generics for TORNTPHARM is:

- Material business context;
- 12.05% economic materiality;
- below the 15% numeric-overlay threshold;
- no numeric modifier.

Gate I may explain that context but must not create:

- a second Global Generics recommendation;
- a second Global Generics score;
- an extra penalty/bonus.

CDMO / CRAMS remains Emerging Watch and is non-numeric.

### F. Missing-evidence behavior

Recommendation must be `INSUFFICIENT` when the required Gate I input is not complete.

Do not:

- convert missing evidence to neutral;
- ignore a required floor;
- renormalize remaining dimensions;
- infer a role from partial data.

### G. Recommendation rationale contract

Every deterministic recommendation should preserve:

- role;
- overall score;
- exact policy version;
- passed/failed role thresholds;
- passed/failed mandatory floors;
- cautions;
- governance state;
- overlay treatment;
- evidence lineage;
- methodology lineage;
- reason codes.

## Calibration discipline

I2 must test the policy against:

1. TORNTPHARM as the real first reference case;
2. synthetic boundary cases around every approved threshold;
3. high-overall-score / failed-floor cases;
4. low-overall-score / strong-dimension cases;
5. missing-dimension cases;
6. governance-blocked cases;
7. overlay-context cases.

Synthetic cases are methodology tests only and must not be persisted as real company recommendations.

## I2 exit condition

I2 passes only when the owner approves one versioned PHARMA_V1 recommendation policy.

Suggested family:

`PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED`

The policy remains read-only and is not yet materialized into production.

---

# 8. I3 — First Recommendation + Fail-Closed Reference Control

## Purpose

Apply the I2-approved recommendation policy to TORNTPHARM as the first real completed-score recommendation and to AUROPHARMA as the real fail-closed negative control.

TORNTPHARM uses the closed Gate H score of 75.1575.

AUROPHARMA remains `SCORE_NOT_COMPUTABLE` because Global Generics Primary methodology is incomplete and must resolve to explicit fail-closed `INSUFFICIENT` in I3 without score reconstruction.

## Calculation order

```text
Gate H closed score/result
    ->
Gate I input readiness
    ->
approved PHARMA_V1 role threshold
    ->
approved mandatory dimension floors
    ->
approved hard blockers
    ->
non-numeric caution/context layer
    ->
one deterministic recommendation role
```

No score is recalculated in I3.

## Required I3 result

Produce one versioned read-only result containing:

- TORNTPHARM;
- PHARMA_V1 policy version;
- Gate H score = 75.1575;
- ten dimension scores;
- suggested role;
- threshold result;
- floor results;
- caution flags;
- governance state;
- overlay treatment;
- reason codes;
- methodology lineage;
- evidence lineage;
- deterministic calculation state.

## UI

Where the existing shared Research workspace has the PortfolioAI suggestion surface, expose the I3 result there.

Do not redesign the Research page.

Do not create a permanent TORNTPHARM-specific page branch.

The UI must make these separations obvious:

```text
PortfolioAI suggested research role
≠
Your selected portfolio role
```

## I3 explicit exclusions

I3 must not:

- write `stock_recommendation_runs`;
- create an OFFICIAL recommendation;
- create a PREVIEW recommendation row;
- persist the H3 score;
- generate suggested weight range;
- generate action bias;
- invoke AI interpretation;
- invoke D35B position sizing;
- change user portfolio settings;
- place an order.

## I3 exit condition

I3 passes when one deterministic TORNTPHARM role recommendation is produced from the locked Gate H result and approved I2 policy, with complete rationale and no persistence.

---

# 9. I4 — Independent verification and Gate I closure

## Purpose

Prove that the first Pharma recommendation can be independently reproduced and that recommendation logic did not alter the Gate H score.

## Required checks

### A. Hand verification

Independently evaluate:

- overall-score role threshold;
- every mandatory floor;
- every hard blocker;
- every caution;
- final role.

The hand result must exactly match the recommendation adapter.

### B. Score preservation

Verify:

- input score remains exactly 75.1575;
- ten dimension scores remain unchanged;
- no hidden recommendation-side score reconstruction;
- no hidden renormalization.

### C. Anti-leakage

Verify:

- no BANK_NBFC thresholds;
- no BANK_NBFC mandatory floors;
- no NIFTY Bank logic;
- no HDFCBANK-specific recommendation assumptions;
- no Global Generics second recommendation;
- no CDMO Emerging numeric role input;
- no governance double counting.

### D. Determinism

Run the recommendation twice from the same locked input + policy.

Outputs must be identical.

### E. Safety

Verify no calls to:

- recommendation persistence RPCs;
- score persistence;
- weight guidance persistence;
- AI interpretation;
- position sizing;
- provider refresh;
- production mutations.

### F. Engineering validation

Run:

- focused Gate I tests;
- related Gate H regression tests;
- recommendation architecture regressions;
- full non-Edge application tests as appropriate;
- strict TypeScript;
- architecture guard;
- focused lint;
- architecture lint;
- production build if UI changes;
- `git diff --check`.

Edge tests only if Gate I actually changes Edge Function code.

## I4 exit condition

Gate I closes only when:

> **FIRST PHARMA RECOMMENDATION = DETERMINISTIC / HAND-VERIFIED / EXPLAINABLE / NON-PERSISTING**

---

# 10. Gate I safety boundary

Gate I does **not** authorize:

- score persistence;
- recommendation persistence;
- promotion of a recommendation policy to production ACTIVE;
- recommendation-history creation;
- upgrade/downgrade persistence;
- suggested weight range;
- position sizing;
- action bias;
- AI recommendation interpretation;
- user role mutation;
- target-weight mutation;
- target-price mutation;
- stop-loss mutation;
- provider calls;
- production Supabase mutation;
- deployment;
- PR #101 merge;
- automatic trading;
- broader Pharma recommendation rollout.

Production remains untouched.

---

# 11. Gate I relationship to existing downstream engines

The existing downstream engines remain valid architecture references but stay blocked during Gate I.

## Recommendation persistence

`stock_recommendation_runs` and `record_recommendation_preview_v2` remain unused.

Persistence requires a later explicit gate because Gate H score persistence is still OFF.

## Weight guidance and action bias

`weightRecommendation.ts` and `actionRecommendation.ts` remain downstream.

They must not run merely because a role recommendation exists.

## Position sizing

D35B correctly requires persisted score and persisted recommendation lineage.

Gate I must not weaken those prerequisites.

## AI interpretation

The recommendation interpretation Edge Function may explain a trusted deterministic recommendation later.

It does not participate in Gate I methodology and may not invent or override the deterministic role.

---

# 12. Explicit Gate I owner checkpoints

Only two methodology owner checkpoints should be needed:

1. **I1 architecture approval**
   - input authority;
   - profile identity bridge;
   - strict no-renormalization adapter boundary;
   - output ontology.

2. **I2 policy approval**
   - role thresholds;
   - mandatory floors;
   - blockers;
   - cautions;
   - fail-closed rules.

After I2, I3 and I4 should be implementation/validation stages rather than repeated methodology debates.

---

# 13. Recommended execution posture

The shortest safe Gate I sequence is:

```text
I1
Reconcile recommendation authority and PHARMA_V1 identity
    ↓
I2
Approve one deterministic PHARMA_V1 recommendation policy
    ↓
I3
Calculate one read-only TORNTPHARM recommendation
    ↓
I4
Hand-verify and close Gate I
```

Do not reopen Gate H unless a concrete contradiction proves that the closed score cannot be consumed without altering its approved meaning.

That would be a structural exception, not a normal Gate I step.

---

# 14. Gate I closure state

When I1–I4 pass:

```text
GATE I = COMPLETE
PHARMA_V1 RECOMMENDATION METHODOLOGY = COMPLETE
TORNTPHARM FIRST DETERMINISTIC RECOMMENDATION = COMPLETE
RECOMMENDATION PERSISTENCE = OFF
SCORE PERSISTENCE = OFF
WEIGHT GUIDANCE = OFF
POSITION SIZING = OFF
AI INTERPRETATION = OFF
AUTOMATIC PORTFOLIO ACTION = OFF
```

Only after Gate I closure should the project decide the next separate downstream gate for recommendation persistence / portfolio-aware guidance / sizing integration.

---

# 15. Current stop point

```text
Gate H = COMPLETE / PASS
Gate I plan = REVISED / ADOPTED
I1 = IMPLEMENTED / VALIDATION PENDING
I2 = NOT STARTED
I3 = NOT STARTED
I4 = NOT STARTED
```

Do not begin I1 until explicitly instructed by the owner.
