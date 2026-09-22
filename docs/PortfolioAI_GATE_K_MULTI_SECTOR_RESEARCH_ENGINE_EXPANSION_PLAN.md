# PortfolioAI — Gate K: Multi-Sector Research Engine Expansion Plan

**Canonical plan title:** `PortfolioAI_GATE_K_MULTI_SECTOR_RESEARCH_ENGINE_EXPANSION_PLAN.md`
**Prepared:** 21 September 2026
**Starting state:** Gates H, I and J = COMPLETE / PASS. `PHARMA_V1` is complete across all five Pharma subprofiles. `BANK_NBFC` already has a substantial earlier methodology, readiness logic, refresh modules and HDFCBANK reference implementation. PR #101 remains OPEN / DRAFT / UNMERGED.

---

## 1. Gate K Purpose

Gate K expands PortfolioAI from a Pharma-first research system into a **multi-sector research architecture** without turning the application into a collection of sector-specific pages or duplicating the long Pharma development path for every sector.

The core principle is:

```text
Universal Research Workspace
        ↓
Canonical sector / profile resolution
        ↓
Sector-specific research engine
        ↓
Sector-specific evidence + readiness
        ↓
Deterministic score when complete
        ↓
Sector-approved recommendation methodology
```

The **application architecture is universal**.
The **research formulas are sector-specific**.

Gate K must preserve the strongest properties already proven through Pharma:

- fail-closed behavior;
- explicit evidence lineage;
- deterministic methodology;
- no hidden denominator renormalization;
- no reconstructed score from incomplete mandatory inputs;
- no cross-sector methodology leakage;
- one universal Research page;
- reference stocks used as validation anchors, not runtime requirements;
- no persistence, deployment, sizing or trading unless separately authorized.

---

## 2. Gate K Hard Cap

Gate K is hard-capped at:

```text
K1 → K2 → K3 → K4 → K5 → K-FINAL
```

There is **no K6**.

K4 may contain several sector packages, but the number of K4 packages is frozen at K1 and cannot silently expand later.

---

# K1 — Portfolio Sector Inventory & Priority Lock

## Goal

Determine exactly which sector engines PortfolioAI needs for the current portfolio and freeze the Gate K build queue before methodology work begins.

## Work

Audit the canonical sector and industry classification of every current holding and place each holding into one of these states:

```text
A. Existing specialised engine
   - PHARMA_V1
   - BANK_NBFC

B. Needs dedicated sector engine
   - determined from actual portfolio holdings

C. GENERAL / METHODOLOGY_NOT_AVAILABLE
   - sector intentionally not built in Gate K
   - special-case review
   - economically heterogeneous area requiring later work
```

For each sector or proposed engine, record:

- holding count;
- portfolio exposure;
- canonical sector / industry identity;
- economic similarity of companies in that group;
- whether a single sector methodology is appropriate;
- whether subprofiles are genuinely required;
- candidate reference stock(s);
- data/evidence availability;
- benchmark candidate;
- valuation-method family;
- major sector-specific risks;
- priority order.

## Mandatory K1 rule — freeze scope

Once K1 is owner-approved:

```text
Gate K target sector engines = FROZEN
K4 package count = FROZEN
```

A newly encountered sector after K1 does not silently enlarge Gate K. It remains `METHODOLOGY_NOT_AVAILABLE` or becomes a later controlled-expansion item.

## K1 Output

A versioned:

```text
Gate K Sector Build Queue
```

Example structure only:

```text
Existing:
1. PHARMA_V1
2. BANK_NBFC

To build:
3. IT_SERVICES
4. CAPITAL_GOODS
5. AUTO / AUTO_ANCILLARY
6. POWER / RENEWABLES
7. CHEMICALS

Deferred:
8. Sector X → METHODOLOGY_NOT_AVAILABLE
```

The actual queue must come from the portfolio audit, not assumption.

## Exit

Owner approves:

- sector grouping;
- engine count;
- K4 package count;
- development order;
- reference-stock candidates;
- deferred sectors.

---

# K2 — Universal Sector-Engine Architecture Contract

## Goal

Freeze the contract that every sector engine must obey while preserving full freedom for sector-specific formulas.

## Universal layer

The following are shared across all research engines:

```text
Canonical classification
→ Research profile resolution
→ Evidence storage + provenance
→ Evidence status semantics
→ Readiness state semantics
→ Universal Research page
→ Score display semantics
→ Recommendation availability semantics
→ Research Health
```

## Sector-owned layer

Each sector engine owns its own:

- research metrics;
- history requirements;
- calculation methods;
- score curves / percentile logic;
- benchmarks;
- business-durability model;
- sector-specific risks;
- valuation model;
- N/A dimensions;
- hard blockers;
- subprofiles, if genuinely required;
- recommendation thresholds;
- role-floor dimensions;
- caution dimensions;
- sector-specific AVOID rule.

## Critical architecture rule

```text
Universal recommendation framework
≠
Universal recommendation thresholds
```

The following may be universal:

- `CORE_CANDIDATE`
- `SATELLITE_CANDIDATE`
- `WATCH`
- `AVOID`
- `INSUFFICIENT`
- role-ladder semantics;
- fail-closed semantics;
- no score reconstruction;
- no recommendation writes;
- reason-code transparency;
- missing vs N/A distinction.

The following remain sector-owned unless explicitly proven portable later:

- aggregate thresholds;
- role-floor thresholds;
- which dimensions are role-blocking;
- caution thresholds;
- sector-specific hard blockers;
- AVOID threshold logic.

## Mandatory failure table

```text
Unknown methodology
→ METHOD_NOT_AVAILABLE

Missing mandatory evidence
→ SCORE_NOT_COMPUTABLE

Conflicting classification
→ REVIEW_REQUIRED

Missing required recommendation-floor data
→ INSUFFICIENT

Failed role floor
→ that role becomes ineligible
→ continue down the approved role ladder

Fully evaluable score below approved sector watch floor
→ AVOID, only if that sector's approved policy says so

Explicitly not-applicable dimension
→ N/A, never treated as missing
```

## Gate I safety properties carried forward by contract

Every sector recommendation engine must prove:

1. missing mandatory role-floor data → `INSUFFICIENT`;
2. failed role floor does **not** automatically imply `AVOID`; it only makes that role ineligible;
3. secondary exposure / overlay cannot produce an independent role or second recommendation;
4. null mandatory inputs fail closed — no reconstructed score;
5. recommendation computation performs zero writes;
6. score/recommendation persistence remains disabled unless separately authorized.

## Engine registry

Create a versioned `SECTOR_ENGINE_REGISTRY` with at least:

```text
profileCode
displayName
methodologyAuthority
allowedDimensions
notApplicableDimensions
benchmarkAuthority
valuationAuthority
recommendationAuthority
subprofileSupport
fallbackPolicy
referenceValidationSymbols
runtimeSymbolSpecific = false
```

This registry becomes the basis for generic routing, isolation tests and future-stock portability.

## K2 Output

`SECTOR_ENGINE_CONTRACT_V1`

with deterministic tests proving:

- a new sector plugs into the universal Research page;
- no new page tree is required;
- missing vs N/A is preserved;
- no cross-sector fallback exists;
- recommendation safety semantics are explicit and testable.

## Exit

Owner approves the universal contract before new sector methodologies are built.

---

# K3 — BANK_NBFC Reconciliation & Portability Closure

## Goal

Bring the already-existing `BANK_NBFC` engine to the same portability standard now proven for Pharma, without rebuilding it from zero.

## Work

Audit and reconcile:

- existing banking evidence contract;
- readiness logic;
- valuation treatment;
- growth treatment;
- momentum;
- NPA / asset-quality risk;
- benchmark logic;
- recommendation rules;
- refresh modules;
- HDFCBANK-specific code branches;
- current N/A dimension treatment.

Any legitimately bank-specific logic stays.

Any unnecessarily HDFCBANK-specific methodology routing must become:

```text
BANK_NBFC-driven
```

HDFCBANK becomes a validation/reference stock only.

## Subprofile decision

Bank-vs-NBFC or other subprofiles are created **only if the economics genuinely require different methodology**.

They are not created merely from industry labels.

## Mandatory K3 tests

### 1. Runtime portability

```text
Any eligible Bank/NBFC stock
→ BANK_NBFC
→ existing Bank/NBFC methodology
→ company-specific evidence
→ readiness
→ score if complete
→ recommendation if eligible
```

No symbol-specific methodology code may be required.

### 2. PHARMA isolation

No Pharma:

- scoring band;
- valuation assumption;
- durability criterion;
- benchmark;
- missing-data behavior;
- recommendation rule

may be reachable from a Bank/NBFC holding.

And vice versa.

### 3. Recommendation safety contract

Re-run the K2 recommendation safety set on Bank/NBFC data.

### 4. N/A semantics

Any Bank/NBFC N/A dimension must remain N/A and must not trigger a missing-floor failure.

## K3 Exit

- arbitrary eligible banking stocks route through `BANK_NBFC`;
- HDFCBANK identity is no longer a runtime requirement;
- PHARMA isolation confirmed;
- recommendation safety confirmed;
- N/A semantics confirmed.

---

# K4 — Remaining Sector Engine Packages

## Goal

Build every additional sector engine approved in K1.

## One consolidated package per sector

Each sector gets exactly one K4 package:

```text
A. Sector definition
        ↓
B. Reference-stock selection
        ↓
C. Evidence / readiness contract
        ↓
D. Deterministic scoring methodology
        ↓
E. Valuation / risk / durability treatment
        ↓
F. Recommendation handoff
        ↓
G. Reference-company validation
        ↓
H. Future-stock portability validation
```

Do **not** recreate Pharma Gates A–J for each sector.

## Two owner checkpoints per sector

### Checkpoint A — Methodology / Evidence Contract Approval

Must freeze:

- sector boundaries;
- reference company;
- sector-specific dimensions;
- evidence history requirements;
- score methodology;
- valuation method;
- benchmark;
- business-durability logic;
- sector risks;
- N/A dimensions;
- subprofiles if required;
- recommendation framework ownership.

### Distortion scrutiny

Any figure used to:

- justify reference-stock selection;
- classify a reference stock;
- define a sector methodology anchor;

must be checked for:

- one-offs;
- acquisitions;
- mergers;
- base effects;
- reporting changes;
- abnormal cycle effects;
- exceptional gains/losses.

No distorted figure may silently become a methodology anchor.

### Checkpoint B — Reference Validation + Portability Validation

Must prove:

#### 1. Reference validation

The chosen reference stock can exercise the engine deterministically.

A legitimate fail-closed result remains acceptable if evidence is insufficient.

#### 2. Future-stock portability

An arbitrary future stock in the same supported sector must route to the same methodology without ticker-specific code.

#### 3. Incremental isolation

Isolation is tested against:

- PHARMA_V1;
- BANK_NBFC;
- every K4 engine already completed.

This is registry-driven, not manually hard-coded pair by pair.

#### 4. Golden-output regression

Existing control outputs must remain semantically unchanged.

Examples:

```text
TORNTPHARM
primary = DOMESTIC_FORMULATIONS
overallScore = 75.1575
suggestedRole = SATELLITE_CANDIDATE
scoreState = SCORE_READY

AUROPHARMA
primary = GLOBAL_GENERICS
scoreState = SCORE_NOT_COMPUTABLE
recommendation = NOT_EXECUTED
biosimilarsExposure = UNRESOLVED
```

Equivalent golden fixtures should exist for BANK_NBFC once K3 is closed.

The purpose is to prove methodology continuity, not brittle byte-identical UI markup.

#### 5. Shell-continuity regression

Every new sector must preserve:

- same Research page;
- same tabs;
- same status semantics;
- same readiness component contract;
- same recommendation component contract;
- same Research Health behavior.

#### 6. Recommendation safety

Re-run the K2 recommendation safety set using the sector's own data and policy.

## K4 Per-Sector Exit

A sector package is complete when:

- methodology is explicit;
- reference validation passes or fails closed correctly;
- future stocks can route without symbol-specific methodology code;
- isolation-so-far passes;
- golden-output regression passes;
- shell continuity passes;
- recommendation safety passes.

## K4 Overall Exit

Every K1-approved sector is in exactly one state:

```text
APPROVED_ENGINE
or
GENERAL / METHODOLOGY_NOT_AVAILABLE
```

with a documented reason.

---

# K5 — Cross-Sector Isolation & Whole-Portfolio Research Validation

## Goal

Run all completed sector engines together and confirm the portfolio behaves as one coherent research system.

K5 is a **confirmation gate**, not the first place leakage is discovered.

## Validation matrix

Using `SECTOR_ENGINE_REGISTRY`, automatically test every pair of registered engines:

```text
for every engine A:
    for every engine B where B != A:
        A cannot use B scoring methodology
        A cannot use B benchmark
        A cannot use B valuation authority
        A cannot use B durability logic
        A cannot use B recommendation thresholds
        A cannot use B fallback behavior
```

## Whole-portfolio routing

Validate:

```text
Supported sector + new stock
→ existing engine automatically

Unsupported sector
→ METHODOLOGY_NOT_AVAILABLE

Conflicting canonical classification
→ REVIEW_REQUIRED
```

No "nearest-looking" sector fallback is allowed.

## Universal UI validation

All engines must use the same Research shell:

- Overview
- Financials
- Quality & Growth
- Ownership
- Valuation
- Documents
- Evidence
- Readiness
- Recommendation
- Research Health

Only the content and methodology may differ.

## Recommendation-policy portability study

K5 must **evaluate**, not assume, whether any numeric recommendation thresholds are portable across sectors.

### Pre-declared falsification principle

Before evaluating cross-sector portability, define tests that would invalidate a universal threshold assumption, including:

- materially different score distributions by sector;
- N/A dimensions making a shared floor invalid;
- documented cases where the same numeric floor yields economically inconsistent outcomes;
- sector-specific risks requiring different blockers;
- valuation-score distributions that behave differently by business model.

If portability is falsified:

```text
→ create explicit sector-specific recommendation authority
→ document the exception
→ require owner approval
```

Never introduce silent sector-specific thresholds inside a K4 implementation.

## K5 Exit

- all engines coexist without leakage;
- universal Research UI holds;
- future-stock routing works;
- unsupported sectors fail safely;
- recommendation-policy portability is either:
  - confirmed for specific components; or
  - explicitly rejected with approved sector-specific exceptions.

---

# K-FINAL — Portfolio Sector-Coverage Closure

## Goal

Formally prove that PortfolioAI now has a sector-driven research architecture suitable for the whole current portfolio.

## Runtime contract

```text
PORTFOLIO HOLDING
        ↓
Canonical classification
        ↓
Research profile / sector engine
        ↓
Optional sector-specific subprofile
        ↓
Company-specific evidence
        ↓
Readiness
        ↓
Deterministic score if complete
        ↓
Sector-approved recommendation if eligible
```

## Portfolio-wide closure matrix

K-FINAL should produce a matrix such as:

```text
Holding       Sector engine       Method status       Score state       Recommendation state
------------------------------------------------------------------------------------------------
TORNTPHARM    PHARMA_V1           READY               SCORE_READY       SATELLITE_CANDIDATE
HDFCBANK      BANK_NBFC           READY               ...               ...
XYZ IT        IT_SERVICES         READY/BLOCKED       ...               ...
ABC Infra     CAPITAL_GOODS       READY/BLOCKED       ...               ...
```

A legitimate `SCORE_NOT_COMPUTABLE` is acceptable where evidence is insufficient.

What must be complete is the **routing and methodology architecture**.

## Final acceptance conditions

Gate K closes only when:

1. all current portfolio sectors have an explicit research-engine state;
2. no stock silently inherits methodology from an unrelated sector;
3. supported sectors are portable to future stocks;
4. all engines share the universal Research workspace;
5. missing mandatory evidence fails closed;
6. N/A is never treated as missing;
7. recommendation safety semantics are preserved;
8. cross-sector methodology isolation passes;
9. golden control outputs remain stable;
10. unsupported sectors safely report `METHODOLOGY_NOT_AVAILABLE`;
11. score persistence remains OFF;
12. recommendation persistence remains OFF;
13. position sizing remains OFF;
14. AI interpretation remains OFF unless separately authorized;
15. production mutation remains OFF;
16. deployment remains OFF;
17. PR merge remains OFF;
18. automatic trading remains OFF.

## Gate K Closure

```text
Gate K = COMPLETE / PASS

Sector-specific research layer
= PORTFOLIO COVERAGE COMPLETE
```

---

# 3. Gate K Safety Boundary

Gate K does **not** authorize:

```text
Production Supabase mutation
Production migrations
Provider refresh without explicit approval
Score persistence
Recommendation persistence
Position sizing
Portfolio mutation
Scheduler changes
Deployment
PR merge
Automatic trading
```

Any such action requires separate owner approval for that exact action.

---

# 4. Branch / PR Strategy

Gate J is complete on:

```text
r4n-pharma-subprofile-architecture
PR #101
```

Gate K is a new architectural scope.

Preferred sequence:

```text
Gate J COMPLETE
        ↓
freeze cumulative handoff
        ↓
owner reviews PR #101
        ↓
explicit merge decision
        ↓
new Gate K branch
        ↓
K1
```

Suggested branch name:

```text
r4o-multisector-research-engines
```

If PR #101 is intentionally left unmerged, K1 planning may still proceed, but substantive Gate K implementation should begin only after the branch strategy is explicitly frozen.

---

# 5. Gate K Stage Summary

```text
K1
Portfolio Sector Inventory & Priority Lock
+ freeze exact K4 package count
        ↓
K2
Universal Sector-Engine Contract
+ engine registry
+ universal recommendation semantics
+ sector-owned thresholds
+ explicit MISSING vs N/A
        ↓
K3
BANK_NBFC Reconciliation & Portability
+ Pharma isolation
+ recommendation safety
+ HDFCBANK becomes validation anchor only
        ↓
K4
Remaining Sector Engine Packages
2 checkpoints each:
 A. Methodology / Evidence
 B. Validation / Portability

Each B includes:
+ registry-driven isolation
+ golden-output regression
+ shell continuity
+ recommendation safety
+ distortion scrutiny
        ↓
K5
Full Cross-Sector Integration
+ complete isolation matrix
+ universal UI
+ future-stock routing
+ recommendation-policy portability study
        ↓
K-FINAL
Portfolio Sector-Coverage Closure
```

---

# 6. Recommended Immediate Next Step

Begin **K1 only**.

Do not build any new sector methodology until:

- the complete portfolio sector inventory is known;
- the exact K4 package count is frozen;
- the sector priority order is owner-approved;
- the branch strategy is explicitly decided.

That keeps Gate K finite, auditable and aligned with the actual portfolio rather than theoretical NSE sector coverage.
