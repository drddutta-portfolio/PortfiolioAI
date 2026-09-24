# PortfolioAI — Program B · B3 R7 Contract & Architecture

**Checkpoint:** B3 — R7 Contract & Architecture / Checkpoint A  
**Date:** 24 September 2026  
**Branch:** `program-a-evidence-coverage`  
**Starting commit:** `820d0b1d5e378b18b64e18f8c12d5c1abddae0c2`  
**Status:** IMPLEMENTED CANDIDATE — OWNER-LOCAL VALIDATION PENDING

## 1. Purpose

B3 freezes the R7 recommendation and position-sizing authority boundaries before
any Program B recommendation or sizing execution begins.

Primary artifact:

`src/features/research/programBR7Contract.ts`

B3 performs no recommendation decision, no target-weight calculation and no
position-sizing action for a real holding.

## 2. B3.1 recommendation-readiness gate

Recommendation readiness requires:

```text
equity applicability
+ SCORED R6 outcome
+ exact score-run identity
+ complete score lineage
+ approved profile-specific recommendation policy
+ complete mandatory floor inputs
+ resolved caution/risk inputs
```

Only `READY` sets `canRecommend = true`.

Blocked R6 outcomes remain blocked. In particular:

- insufficient/stale source score -> `INSUFFICIENT_EVIDENCE`;
- conflicting/review score state -> `REVIEW_REQUIRED`;
- source methodology unavailable -> `METHODOLOGY_NOT_AVAILABLE`;
- missing exact score-run lineage -> `BLOCKED_PREREQUISITE`;
- non-equity -> `NOT_APPLICABLE`.

The recommendation layer is not allowed to reconstruct a missing score.

## 3. B3.2 Gate I safety inheritance

The current R7 contract re-encodes and re-tests the Gate I rules:

- missing mandatory floor input is **INSUFFICIENT**, not a negative role;
- a failed role floor is distinct from missing input and may continue down the
  approved role ladder;
- overlays are context-only and cannot create a second independent portfolio role;
- null/non-computable score fails closed;
- recommendation computation is non-writing unless separately authorized later.

PHARMA_V1 retains its owner-approved Gate I policy identity:

`PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED`

## 4. B3.3 recommendation policy authority

Program B now has an explicit recommendation-policy authority registry.

At B3 the registry contains exactly one approved numeric policy:

```text
PHARMA_V1
  source = Gate I / I2 owner-approved policy
  numeric threshold scope = PROFILE_SPECIFIC_ONLY
  weight guidance authority = NOT_APPROVED
  sizing authority = NOT_APPROVED
```

This is deliberate.

The legacy BANK/NBFC Stage 8.8A recommendation thresholds remain a **DRAFT pilot**.
They are not promoted into Program B authority by B3.

Therefore:

```text
PHARMA_V1 recommendation policy -> RESOLVED
BANK_NBFC recommendation policy -> METHODOLOGY_NOT_AVAILABLE
other profiles without separately approved policy -> METHODOLOGY_NOT_AVAILABLE
```

## 5. B3.4 Gate K portability boundary

K5 proved portable recommendation **semantics**, not universal numeric thresholds.

B3 freezes:

```text
K5 numeric threshold portability = NOT_ESTABLISHED
K5 decision = DO_NOT_INTRODUCE_UNIVERSAL_NUMERIC_THRESHOLDS
universal numeric recommendation thresholds = FORBIDDEN
cross-sector sizing heuristic borrowing = FORBIDDEN
```

PHARMA_V1's 80 / 65 / 50 thresholds are therefore not copied into BANK, IT,
Industrials or any other profile.

## 6. B3.5 recommendation lineage

Every future Program B recommendation must carry:

- recommendation run id;
- security id;
- exact source score run id;
- recommendation methodology id/version;
- source score;
- applicable thresholds;
- cautions;
- deterministic reason codes;
- final recommendation;
- created timestamp.

The lineage identity changes when the source score run changes. A recommendation
cannot float independently of its source score.

## 7. B3.6 sizing readiness and anti-fallback

Program B position sizing is treated as a separate deterministic engine.

A sizing methodology authority is keyed by:

```text
profile code
+ methodology role
+ sizing policy id/version
```

It may explicitly declare approved factors from:

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

The profile and role must both match exactly. Primary/Overlay or cross-sector
borrowing is forbidden.

### Current B3 sizing-authority state

`PROGRAM_B_SIZING_POLICY_REGISTRY` is intentionally empty.

This is not an implementation omission. No Program B profile/role numeric sizing
policy has yet been separately owner-approved.

The older D35B `POSITION_SIZING_V1` artifact is retained as a verified receiving
engine/software contract. B3 does **not** reinterpret its historical HDFCBANK
pilot weight guidance as current Program B sizing authority.

Therefore a real Program B sizing request currently resolves to:

`METHODOLOGY_NOT_AVAILABLE`

until a profile/role-specific sizing policy is separately approved.

This avoids silently inventing target ranges merely to make B4 numeric.

## 8. B3.7 owner authority

Owner-controlled fields remain:

- target price;
- stop loss;
- target weight;
- portfolio role.

Program B machine-output fields are separately named:

- suggested target weight;
- suggested minimum weight;
- suggested maximum weight;
- recommended action;
- reason codes;
- confidence;
- assessment state.

The machine-output contract has no owner-controlled field names.

Allowed Program B sizing action vocabulary is:

```text
ADD
HOLD
ADD_ON_WEAKNESS
REDUCE
TRIM
FREEZE
EXIT_REVIEW
```

These remain assessments, never trade instructions.

## 9. Legacy boundary

B3 explicitly does not inherit as authority:

- legacy database DRAFT recommendation policies;
- BANK/NBFC draft thresholds from Stage 8.8A;
- recommendation-preview persistence from Stage 8.8B;
- D35B's historical HDFCBANK pilot weight guidance.

Those artifacts remain useful historical/software evidence but require separate
Program B authority before R7 can consume them.

## 10. Validation

Run locally:

```bash
git pull
bash scripts/b3-validate-r7-contract.sh
```

The runner validates:

- B3 recommendation/sizing contract;
- Gate I recommendation authority/policy safety;
- K5 recommendation portability;
- sector recommendation fail-closed regressions;
- D35B sizing software regressions;
- owner decision-control regressions;
- TypeScript;
- architecture guard;
- production build;
- `git diff --check`.

## 11. Safety boundary

```text
recommendation computation executed = NO
recommendation persistence = NO
sizing computation executed = NO
sizing persistence = NO
owner settings mutation = NO
provider calls = 0
Angel One calls = 0
Trendlyne calls = 0
OpenAI decision calls = 0
production mutation = NO
migration = NO
deployment = NO
merge = NO
scheduler mutation = NO
trading = NO
```

## 12. Stop boundary

B4 is not authorized by this candidate.

B3 remains open until owner-local validation passes and the recommendation,
lineage, sizing, anti-fallback, owner-authority and portability contracts are
approved together.
