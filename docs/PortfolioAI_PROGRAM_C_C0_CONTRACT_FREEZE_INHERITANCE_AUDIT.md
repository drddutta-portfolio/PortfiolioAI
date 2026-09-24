# PortfolioAI — Program C · C0 Contract Freeze + Inheritance Audit

**Checkpoint:** C0 — Program C contract freeze + inheritance audit  
**Date:** 24 September 2026  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Program C branch:** `program-c-portfolio-decision-engines`  
**Starting HEAD:** `d3b8a755885bd4ecc0be37aa59ea46f2eac0ca41`  
**Program B functional baseline:** `6a605f618ab67e3e8ad5d5faa2181796a1f43988`  
**Status:** COMPLETE / PASS — OWNER APPROVAL REQUIRED BEFORE C1

## 1. Scope

C0 is documentation, inheritance audit and continuation-state freeze only.

No R8/R9/R10 source implementation is included.

Program C remains:

```text
Program C = R8 + R9 + R10

R8  = Core Health / Portfolio Fit / Risk / Exit Intelligence
R9  = Meaningful Change / Movement Engine
R10 = Combined Action Center
```

Frozen checkpoint sequence:

```text
C0 → C1 → C2 → C3 → C4 → C-FINAL
```

No C5+ checkpoint chain is authorized.

## 2. Repository continuation authority

The authoritative continuation sources audited for C0 are:

1. `docs/PortfolioAI_PROGRAM_C_MASTER_PLAN.md`;
2. latest Program C section of `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`;
3. current Program B R6/R7 contracts and execution code;
4. current branch/HEAD.

Before C0 branch creation, the verified remote branch was:

```text
branch = program-a-evidence-coverage
HEAD   = d3b8a755885bd4ecc0be37aa59ea46f2eac0ca41
```

Compared with the formal Program B functional baseline
`6a605f618ab67e3e8ad5d5faa2181796a1f43988`, that branch was exactly two
commits ahead and the only changed files were the Program C master plan and the
cumulative handoff. No Program C source implementation had been introduced.

C0 explicitly established:

```text
branch = program-c-portfolio-decision-engines
base   = d3b8a755885bd4ecc0be37aa59ea46f2eac0ca41
```

This branch is not `main`; branch creation does not authorize merge,
deployment or productionization.

## 3. R6 inheritance audit

Audited authorities:

- `src/features/research/programBR6Contract.ts`
- `src/features/research/programBR6Execution.ts`

Inherited R6 guarantees retained by Program C:

- scoring readiness is explicit and fail-closed;
- missing/stale/conflicting mandatory evidence cannot become a valid score;
- methodology/classification/assignment prerequisites remain explicit;
- Pharma requires exactly one valid reviewed Primary assignment when
  `PHARMA_V1` is the methodology authority;
- score lineage is R6-issued and immutable in the downstream contract;
- lineage carries security, classification, methodology, assignment,
  evidence/as-of, score and run identity;
- R6 safety boundaries remain provider-free, AI-decision-free,
  persistence-free, non-production, non-scheduler and non-trading.

Program C must consume R6 results and lineage unchanged. It may not reconstruct,
re-score or invent a missing R6 result.

## 4. R7 inheritance audit

Audited authorities:

- `src/features/research/programBR7Contract.ts`
- `src/features/research/programBR7Execution.ts`

Inherited R7 guarantees retained by Program C:

- no valid R6 score/readiness means no valid recommendation;
- R7 recommendation lineage preserves the exact R6 source score-run identity;
- Pharma recommendation lineage retains parent profile + Primary methodology
  role + assignment version;
- recommendation policy authority remains profile-specific;
- universal numeric recommendation thresholds are not authorized;
- cross-sector sizing-policy borrowing is prohibited;
- `PROGRAM_B_SIZING_POLICY_REGISTRY` remains intentionally empty;
- no numeric sizing authority is inherited into Program C;
- owner target price, stop loss, target weight and portfolio role remain
  owner-controlled;
- provider, AI numeric-decision, persistence, production, scheduler and trading
  safety boundaries remain closed.

Program C may consume an existing approved R7 recommendation as deterministic
context. It may not silently promote legacy/draft sizing semantics into Program
C authority.

## 5. R8 consumption boundary frozen

R8 may consume, where valid and applicable:

- exact R6 readiness/disposition;
- exact R6 score-run identity;
- exact R7 recommendation readiness/disposition;
- exact R7 recommendation-run identity;
- research profile and methodology identity;
- Pharma assignment identity/version;
- canonical evidence/as-of identity;
- portfolio holdings/current-weight context;
- owner-authored role/settings;
- canonical classification and market/risk evidence already available locally.

R8 must not:

- recompute R6 or R7;
- fabricate missing evidence;
- treat R7 as a universal prerequisite for every R8 sub-engine;
- invent target weights, min/max allocations, correlations or diversification
  thresholds;
- mutate owner settings;
- call providers;
- persist results;
- use AI for deterministic decisions;
- trade.

## 6. Mandatory R8 dependency matrix requirement frozen

C1 must create a machine-readable dependency matrix covering exactly:

```text
Core Health
Portfolio Fit
Portfolio Risk
Exit Intelligence
```

For each sub-engine the matrix must declare:

- mandatory upstream states;
- optional upstream states;
- portfolio-context requirements;
- market/risk evidence requirements;
- owner-context requirements;
- applicability rules;
- blocking conditions;
- whether R7 recommendation is actually required.

The matrix must preserve sub-engine independence. A missing R7 result must not
automatically block a valid R8 Risk or Portfolio Fit assessment unless the
frozen C1 contract explicitly requires R7 for that rule.

## 7. Program C validation universe frozen

C0 reuses the already-frozen K5 local portfolio fixture. No new provider or
production read is authorized or required.

```text
validation universe version =
  PROGRAM_C_VALIDATION_UNIVERSE_V1

source snapshot version =
  K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22

snapshot date =
  2026-09-22

holding count =
  238

eligible asset universe =
  frozen K5 current-portfolio routing rows

asset applicability =
  238 EQUITY rows
  0 non-equity rows in the frozen fixture

source authority =
  src/features/research/k5CurrentPortfolioRoutingSnapshot.ts

fixture/current-state classification =
  frozen local deterministic fixture; not live production state

classification snapshot/version =
  K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22

known exclusions / limitations =
  - not a live 24 September production reconciliation
  - industry is absent on part of the frozen fixture
  - numeric R6 coverage is intentionally incomplete
  - numeric R7 coverage is intentionally incomplete
  - no approved Program B numeric sizing policy
```

Program C portfolio-wide disposition claims are scoped only to this frozen
universe unless the owner explicitly authorizes a versioned re-freeze.

## 8. R9 baseline semantics frozen

R9 must distinguish four different semantic outcomes:

```text
first observation / no comparable baseline
no change
raw but immaterial change
meaningful change
```

A missing comparable prior state is not equivalent to `NO_CHANGE`.

C3 must freeze explicit baseline states, including semantics equivalent to:

```text
BASELINE_ESTABLISHED
NO_COMPARABLE_BASELINE
```

Final token names may differ, but these semantics may not.

## 9. R9 idempotency boundary frozen

Initial Program C R9 guarantees:

```text
deterministic event identity = YES
semantic idempotency         = YES
same-input replay stability  = YES
```

Initial Program C R9 does not claim:

```text
durable acknowledgement       = NO
durable snooze                = NO
persistent notification dedup = NO
cross-session seen/unseen      = NO
```

Event identity and semantic duplicate suppression remain in-memory/read-only
until a separate persistence design is explicitly approved.

## 10. R10 vocabulary constraint frozen

`ADD_REVIEW` and `TRIM_REVIEW` remain candidate-only vocabulary.

They cannot become canonical unless C4 proves an already-approved deterministic
upstream authority supports the directional conclusion without inventing numeric
sizing policy.

Until then, safer review-oriented states must be used, such as:

```text
RECOMMENDATION_CHANGE_REVIEW
CONCENTRATION_REVIEW
ROLE_REVIEW
PORTFOLIO_FIT_REVIEW
REVIEW_REQUIRED
```

No Program C attention state may contain quantity, order details, exact
percentage, machine-generated target weight or a trade instruction.

## 11. Owner-control boundary frozen

Owner-controlled fields remain authoritative:

- portfolio role;
- target price;
- stop loss;
- target weight;
- owner min/max allocation settings;
- investment horizon;
- freeze/monitoring preferences;
- final investment decision.

Program C may read these as context and surface agreement/tension/review states.
It may not update, overwrite or silently reinterpret them.

## 12. Provider / AI / persistence / production boundaries frozen

For R8/R9/R10 deterministic compute paths:

```text
provider calls = 0
Angel One calls = 0
Trendlyne calls = 0
network refresh = 0
AI deterministic decisions = 0
trading/order behavior = 0
scheduler activation = 0
automatic persistence = 0
schema migration = 0
production mutation = 0
merge/deployment = 0
```

If any of these becomes necessary, the active checkpoint must stop and owner
approval is required before proceeding.

## 13. UI ownership boundary frozen

Dashboard, Research, Holdings and future Action Center surfaces may only consume
shared canonical Program C domain/view models.

They must not independently recreate:

- R8 states;
- R9 materiality;
- R10 precedence;
- sizing logic;
- recommendation logic.

Existing dashboard shells remain consumers only.

## 14. Lineage rules frozen

Program C must preserve exact upstream identities.

Where applicable, downstream results retain:

```text
securityId
portfolioId
classification identity/version
researchProfileCode
methodology identity/version
methodologyRole
assignment identity/version
evidence snapshot/as-of identity
R6 scoreRunId
R7 recommendationRunId
portfolioContextSnapshotId
R8 decisionRunId
R9 previous/current observed-state ids
R9 changeEventId
R10 integratedAttentionId
rule/contract versions
```

No downstream stage may reconstruct or fabricate an upstream run identity.

Timestamps are not sufficient as sole identity sources.

## 15. C0 validation matrix

C0 confirms the following requirements are frozen for later checkpoints:

- exact state vocabularies and applicability rules;
- missing/stale/conflicting-data fail-closed cases;
- owner-field immutability;
- no numeric-sizing leakage;
- deterministic replay;
- stable deterministic IDs;
- exact decimal arithmetic where financial arithmetic is used;
- R8 dependency isolation;
- R9 first-observation/baseline behavior;
- R9 semantic duplicate suppression;
- R10 deterministic precedence/conflict preservation;
- no provider imports/calls in Program C compute paths;
- no AI deterministic dependencies;
- no trading/order dependencies;
- no initial persistence repository dependency;
- shared canonical UI consumption;
- Program B regression continuity.

## 16. Stop conditions retained

C0 carries forward the master-plan stop conditions without dilution.

Work must stop for owner direction if implementation would require:

- loss/reconstruction of R6/R7 lineage;
- score/recommendation recomputation;
- inferred missing evidence;
- owner-setting mutation;
- invented numeric sizing;
- provider calls inside R8/R9/R10 compute paths;
- AI deterministic logic;
- cross-sector/nearest-profile fallback;
- recreated Pharma classification;
- non-deterministic replay;
- ambiguous R9 before/after state identity;
- unexplainable R10 causes;
- persistence or migration;
- production mutation;
- scheduler activation;
- trading/order behavior;
- R11/R12 scope expansion;
- productionization/release work;
- an unversioned validation-universe change.

## 17. C0 exit status

```text
Program C scope = FROZEN
R8/R9/R10 ordering = FROZEN
Program C branch = EXPLICIT
validation universe = EXPLICIT
upstream inheritance = AUDITED
owner/sizing/provider/AI boundaries = FROZEN
R8 dependency-matrix requirement = FROZEN
R9 baseline/idempotency semantics = FROZEN
R10 ADD/TRIM candidate-only rule = FROZEN
R8 implementation = NOT STARTED
next stage = C1 ONLY, AFTER EXPLICIT OWNER APPROVAL
```

No source-code implementation of R8, R9 or R10 occurred in C0.
