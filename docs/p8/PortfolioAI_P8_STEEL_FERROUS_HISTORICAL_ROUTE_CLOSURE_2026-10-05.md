# PortfolioAI P8 Steel-Ferrous Historical Route Integration + Frozen-Canary Input Readiness Validation — Closure

Date: 5 October 2026

## Exact disposition

**STEEL_FERROUS_HISTORICAL_ROUTE_INTEGRATION_COMPLETE_INPUT_READINESS_BLOCKED**

### 1. Implementation

**COMPLETE / PASS**

A bounded historical-only route has been added to the existing canonical research routing authority.

Exact eligibility:

`NSE November-2022 → IN07 Industrials → IN0702 Capital Goods → IN070205 Industrial Products → IN070205015 Iron & Steel Products`

Exact methodology:

`STEEL_FERROUS`

Engine:

`METALS_COMMODITIES`

Methodology version:

`METALS_COMMODITIES_K4A_METHODOLOGY_V1`

Scoring version:

`METALS_COMMODITIES_K4B_SCORING_V1`

The economic hierarchy remains unchanged. The route does **not** rewrite Steel Pipes into Metals & Mining.

The existing live `routeResearchProfileV1` behavior is unchanged.

## 2. Frozen 32-case canary

Canary fingerprint remains:

`b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce`

Results:

- denominator: **32**
- authoritative complete classifications: **2**
- exact integrated STEEL_FERROUS routes: **1**
- authoritative classification outside this integration: **1** (Edible Oil)
- other pairs rejected: **30**
- accidental negative-control routes: **0**
- existing non-zero-intersegment accounting blockers preserved: **6**
- complete-input pairs: **0**

Canary audit fingerprint:

`d9ad343b3c28cdf1015f081398c58f9fa4e42a3097b735606e76006055ccd357`

## 3. Routed historical case

Historical identity:

`19f21fe6-46c9-5f26-9ee5-6207558ba10b`

ISIN:

`INE230R01035`

Decision instant:

`2024-11-29T10:00:00+00:00`

Selected audited consolidated source SHA-256:

`4b0b16349cc9ef3ff46f61d590768a39915ba4c567ef4a72f0355cd28680521d`

Disseminated:

`2024-05-31T09:27:01+00:00`

Source inventory before decision:

- pre-decision XML sources: **8**
- eligible audited annual sources: **2**
- canonical adjusted B3 market rows: **0**

## 4. Input readiness

The existing STEEL_FERROUS K4B contract has **11 mandatory readiness requirements**:

- 10 scored signals;
- 1 commodity-exposure metadata readiness gate.

Normalized ready signals for the historical case:

**0 / 11**

Therefore state:

**INPUTS_INCOMPLETE**

The route is authoritative, but the historical score is not computable.

Important blockers include:

- no canonical 252-day market history for momentum;
- no canonical 252-day market history for commodity-cycle drawdown risk;
- only two eligible audited annual sources versus five observations required by several through-cycle signals;
- no materialized 12-observation through-cycle margin/growth history;
- no reviewed historical ownership/governance signal;
- no materialized canonical commodity-exposure metadata signal.

Raw XBRL/financial facts were not converted into normalized scores merely because they exist.

## 5. Verification

Workflow `37229420071`: **SUCCESS**

- focused routing/readiness tests: PASS
- focused lint: PASS
- architecture check: PASS
- full repository typecheck: PASS
- full repository lint: PASS
- production build: PASS
- deterministic frozen-canary audit: PASS

No provider call, database/storage write, migration, deployment, live assignment change or investment-output generation occurred.

## 6. Smallest evidence-supported next task

Do not start another broad recovery loop.

If the owner wants to continue this exact Steel path, the smallest next bounded task is:

**P8 Steel-Ferrous Historical Signal Materialization Feasibility**

Scope:

- this exact routed Steel historical identity only;
- existing eight pre-decision XML filings and existing B3/R2 evidence only;
- determine whether the 11 existing STEEL_FERROUS requirements can be normalized to their required observation counts;
- no score/recommendation generation;
- no source acquisition;
- stop immediately where required history cannot be proven.

This task is **proposed, not authorized**.

The 25,761-pair surface remains unauthorized and unmeasured.
