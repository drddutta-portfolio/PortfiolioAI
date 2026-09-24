# PortfolioAI — Program B · B4 R7 Execution & Validation

**Checkpoint:** B4 — R7 Execution & Validation / Checkpoint B  
**Date:** 24 September 2026  
**Branch:** `program-a-evidence-coverage`  
**Starting commit:** `5128b575532f8069693a476019732f0f56622a55`  
**Status:** IMPLEMENTED CANDIDATE — OWNER-LOCAL VALIDATION PENDING

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

## 9. Validation

Run:

```bash
git pull
bash scripts/b4-validate-r7-execution.sh
```

The runner validates:
- B4 execution/replay/disposition;
- B3 and R6 regressions;
- Pharma parent/subgroup architecture;
- Gate I recommendation authority/policy;
- ALIVUS and TORNTPHARM read-only recommendation behavior;
- K5 portability;
- sector fail-closed behavior;
- D35B sizing software boundary;
- owner decision controls;
- Pharma recommendation UI;
- Research page regression;
- canonical B4 report;
- TypeScript;
- architecture guard;
- production build;
- `git diff --check`.

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

## 11. Stop boundary

B-FINAL is not authorized by this candidate.

B4 remains open until the strengthened local runner passes and B4/R7 is formally
closed.
