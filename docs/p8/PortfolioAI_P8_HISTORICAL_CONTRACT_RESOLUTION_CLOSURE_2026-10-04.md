# PortfolioAI P8 Historical Classification / Methodology Route / Metric Contract Resolution Closure

Date: 4 October 2026  
Environment: Development only  
Contract: `P8_HISTORICAL_CONTRACT_RESOLUTION_CANDIDATE_V1`  
Contract Git blob SHA: `f459a4bd01ff8d25bcabbcef2195249553ddeb87`

## Exact disposition

**HISTORICAL_CONTRACT_RESOLUTION_BLOCKED**

Audit execution is **COMPLETE / PASS as an audit operation**. Research feasibility remains **BLOCKED**.

A defensible narrower experiment is **not yet supportable from the current evidence surface**.

## Deterministic census

Full B2 denominator: **121,956 pairs / 4,524 historical identities / 32 decision dates**.

Primary mutually exclusive dispositions:

- `NO_PRE_DECISION_EVIDENCE`: **60,531**
- `CLASSIFICATION_UNRESOLVED`: **33,706**
- `MARKET_DATA_BLOCKED`: **1,958**
- `CLASSIFICATION_TAXONOMY_UNPROVEN`: **25,761**

These reconcile exactly to 121,956.

The previously measured provisional candidate surface remains **25,761 pairs / 877 identities**. Under the frozen contract candidate:

- classification-proven pairs: **0**
- methodology-route-proven pairs: **0**
- complete-input pairs: **0**
- full-B2 complete-input coverage: **0%**
- candidate-surface complete-input coverage: **0%**

## Why the 25,761 candidates do not pass classification proof

Within the candidate surface:

- `DIVERSIFIED` without semantic four-tier proof: **8,719**
- positional XBRL segment-member labels rather than business taxonomy: **17,042**

Workstream D therefore proves useful contemporaneous segment evidence, but not canonical historical Sector + Industry + Basic Industry. Promoting those labels into Gate-K routing would invent classification.

## Methodology and metric contracts

The existing P7-IC authority contains **47 profiles**, **26 families** and **471 required signals**. The audit did not create a new methodology family or modify R6–R10.

Because no historical pair has proven Sector + Industry under the frozen contract, the existing `RESEARCH_PROFILE_ROUTING_V2` cannot select a methodology route without guessing. Pair-level metric evaluation therefore correctly stops before selecting a route-specific mandatory metric set.

The central registry gives evidence-code/minimum-period/freshness detail for **209** required signals; **262** rely on additional profile authority detail. PortfolioAI Dev also has 47 active canonical fundamental metric definitions, but there is no universal historical raw-XBRL concept/unit/scale mapping for every required route signal.

## Proposed standards

The proposed standards remain **not owner-frozen**.

- >=24 dates: **PASS (32)**
- >=80% overall complete-input coverage: **FAIL (0%)**
- >=70% each retained date: **FAIL**
- >=60% each major methodology sector: **NOT COMPUTABLE / FAIL CLOSED**, because no methodology sector can be assigned without historical taxonomy proof.

No rule or threshold was relaxed after observing the census.

## Remaining blocker and owner decision

The precise next possible task is **not another provider/source-acquisition loop**. If the owner separately authorizes it, it would be a bounded historical taxonomy evidence-normalization build using already acquired official source bodies only:

1. derive semantic business labels from eligible pre-decision filings/annual-report evidence;
2. map them into the existing canonical four-tier taxonomy without current-state backdating;
3. prove exact Sector + Industry routing through the existing router; and
4. only then measure route-specific normalized metric completeness using canonical metric definitions and explicit raw-concept mappings.

This closure does **not** authorize that work, a new experiment, B5/B6/B-FINAL rebuild, or P8-C.

## Safety boundary

Provider calls: 0. New source acquisition: 0. Supabase writes: 0. R2 writes: 0. Migrations: 0. Performance/forward-return/holdout reads: 0. Production/main changes: 0.
