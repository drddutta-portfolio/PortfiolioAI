# PortfolioAI — Program B · B4 R7 Execution & Validation

**Checkpoint:** B4 — R7 Execution & Validation / Checkpoint B  
**Date:** 24 September 2026  
**Branch:** `program-a-evidence-coverage`  
**Starting commit:** `5128b575532f8069693a476019732f0f56622a55`  
**Status:** COMPLETE / PASS / CLOSED — OWNER-LOCAL VALIDATED

## 1. Purpose

B4 executes R7 only where B3 established current authority and assigns every
holding in the frozen K5 portfolio snapshot an explicit recommendation/sizing
disposition.

It does not force numeric recommendation or sizing coverage.

## 2. Approved recommendation execution

Current Program B numeric recommendation authority remains PHARMA_V1-only.

The controlled score-ready references are:

- TORNTPHARM — `PHARMA_V1 + DOMESTIC_FORMULATIONS`;
- ALIVUS — `PHARMA_V1 + API_BULK_DRUGS`.

For each reference B4 binds:

```text
exact R6 read-only score artifact
+ exact Primary Pharma subgroup
+ assignment version
+ PHARMA_V1 owner-approved recommendation policy
        ↓
read-only deterministic R7 recommendation
```

The Gate I policy is reused unchanged.

Expected reference recommendation behavior:
- TORNTPHARM -> Satellite candidate from score 75.1575;
- ALIVUS -> Satellite candidate from score 76.7225.

AUROPHARMA, BIOCON and SYNGENE remain insufficient because R6 did not produce an
authoritative complete score. HDFCBANK remains blocked at the R6 prerequisite
boundary.

## 3. Exact R6 -> R7 lineage

Because R6 reference scores are read-only/non-persisted artifacts, B4 creates a
deterministic reference run identity from:

```text
symbol + exact R6 artifact version
```

The R7 recommendation identity then includes:

```text
security
+ exact R6 reference run id
+ PHARMA_V1 parent profile
+ Primary subgroup
+ assignment version
+ recommendation policy id/version
```

B4 rejects source-score or Primary-subprofile mismatches.

## 4. Sizing execution boundary

The B3 Program B sizing-policy registry is intentionally empty.

Therefore B4 does not manufacture target weights merely because a recommendation
exists.

For a recommendation-ready Pharma reference:

```text
recommendation = READY
sizing methodology = METHODOLOGY_NOT_AVAILABLE
suggested target/min/max weight = null
recommended action = null
```

This is an expected fail-closed R7 result.

## 5. Required sizing edge cases

B4 explicitly validates:

- strong score + high concentration;
- strong score + high volatility;
- low evidence confidence;
- incomplete holding;
- ETF / non-applicable asset.

Because no Program B numeric sizing policy is approved, high-concentration and
high-volatility cases remain `METHODOLOGY_NOT_AVAILABLE`; no generic or
cross-sector range is invented.

Low evidence remains insufficient, an incomplete holding remains blocked, and an
ETF is not applicable.

## 6. Owner-authority mutation regression

The controlled owner fixture contains pre-existing:

- target price;
- stop loss;
- target weight;
- portfolio role.

R7 sizing is executed against the corresponding recommendation state and the
machine assessment remains separate.

The expected invariant is:

```text
owner settings before == owner settings after
owner field mutations = 0
persistence mutations = 0
```

B4 has no authorization to write a recommendation, sizing assessment or owner
setting.

## 7. Cross-surface canonical consistency

B4 defines one canonical decision payload and three read-only projections:

- Research;
- Portfolio;
- Action.

The projections do not compute independently. They consume the same:

- source score and score-run identity;
- recommendation run identity;
- recommendation state/role;
- sizing state/policy;
- final disposition.

The B4 regression requires all three payloads to be identical apart from the
surface label.

## 8. Portfolio-wide R7 disposition

The controlled portfolio pass continues to use the frozen:

`K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22`.

Every one of its 238 equities receives explicit R7 recommendation and sizing
dispositions.

B4 distinguishes:

```text
portfolio-wide disposition complete
!=
portfolio-wide numeric recommendation coverage
!=
portfolio-wide numeric sizing coverage
```

At candidate design time:
- only the already-approved PHARMA_V1 score-ready references can become
  `RECOMMENDATION_READY`;
- no real holding can become `SIZING_READY` while the sizing-policy registry
  remains empty;
- all other rows fail closed with explicit reasons.

No silent holes are permitted.

## 9. Validation and closure

Owner-local consolidated validation was run with:

```bash
git pull
bash scripts/b4-validate-r7-execution.sh
```

Final owner-local result: **PASS**.

Observed terminal closure markers:

```text
B4 CANDIDATE VALIDATION PASS
R7 provider calls: 0
Recommendation persistence: OFF
Sizing persistence: OFF
Owner settings mutation: 0
Next checkpoint: B-FINAL only after B4 closure and explicit owner approval
```

The same run also showed:
- architecture guard passed;
- production build passed;
- the Vite large-chunk notice remained informational only.

Because the runner is fail-fast, reaching the B4 PASS marker confirms the
configured B4 execution/replay/disposition suite, inherited B3/R6 regressions,
Pharma dual-layer regressions, Gate I recommendation policy, ALIVUS/TORNTPHARM
reference recommendations, K5 portability, sizing-software boundary, owner
decision controls, shared UI regressions, canonical B4 report, TypeScript,
architecture guard, production build and `git diff --check` all completed
successfully.

B4 is therefore **COMPLETE / PASS / CLOSED** and R7 is closed.

## 10. Safety boundary

```text
provider calls = 0
Angel One calls = 0
Trendlyne calls = 0
OpenAI decision calls = 0
recommendation persistence = NO
sizing persistence = NO
owner settings mutation = NO
production mutation = NO
migration = NO
deployment = NO
merge = NO
scheduler mutation = NO
trading = NO
```

## 11. Exit and stop boundary

```text
B4.1 reference cohort / sizing edge cases = COMPLETE / PASS / CLOSED
B4.2 owner-authority mutation regression = COMPLETE / PASS / CLOSED
B4.3 replay and cross-surface validation = COMPLETE / PASS / CLOSED
B4.4 controlled portfolio-wide disposition = COMPLETE / PASS / CLOSED

Program B · B4 = COMPLETE / PASS / CLOSED
R7 Checkpoint B = CLOSED
R7 = COMPLETE / PASS / CLOSED

Portfolio-wide recommendation/sizing disposition = COMPLETE
Portfolio-wide numeric recommendation coverage = NOT CLAIMED / INCOMPLETE BY DESIGN
Portfolio-wide numeric sizing coverage = NOT CLAIMED / INCOMPLETE BY DESIGN
Owner-authority regression = PASS
Cross-surface canonical consistency = PASS
Provider calls from R7 computation = 0
```

B-FINAL has not started and is not authorized by this B4 closure.
