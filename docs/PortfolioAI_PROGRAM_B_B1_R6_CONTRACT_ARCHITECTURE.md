# PortfolioAI — Program B · B1 R6 Contract & Architecture

**Checkpoint:** B1 — R6 Contract & Architecture / Checkpoint A  
**Date:** 24 September 2026  
**Branch:** `program-a-evidence-coverage`  
**Starting commit:** `10c87a5d9a2eb5338db51f3f85e5f5ce1ff9a605`  
**Status:** COMPLETE / PASS / CLOSED — OWNER-LOCAL VALIDATED

## 1. Purpose

B1 freezes the shared R6 scoring architecture before any Program B numeric
scoring begins.

This checkpoint implements only contracts and pure fail-closed resolution.
It does not calculate a numeric score, persist a score, call a provider, write to
Supabase, create a migration, compute a recommendation, size a position, deploy,
merge, schedule work or trade.

Contract version:

`PROGRAM_B_R6_CONTRACT_V1`

Primary artifact:

`src/features/research/programBR6Contract.ts`

## 2. B1.1 scoring-readiness adapter

The adapter returns exactly one of:

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

Only `READY` sets `canScore = true`.

The adapter evaluates, without fetching anything:

- security identity;
- equity/non-equity applicability;
- canonical classification state and classification version;
- Gate-K methodology resolution;
- methodology version availability;
- assignment requirement/state/version/role;
- required evidence applicability and freshness;
- evidence conflict/review state;
- required market-history state.

Explicit `NOT_APPLICABLE` evidence is not treated as missing.

Readiness precedence is fail-closed. Manual review, methodology absence and
missing prerequisites cannot be masked by otherwise fresh evidence.

## 3. B1.2 methodology resolver

The B1 resolver is deliberately a thin layer over the frozen Gate-K authority:

```text
canonical asset/classification
        ↓
Gate-K industry-first router
        ↓
SectorEngineRegistry
        ↓
profile-specific methodology authority
```

It does not create a second routing table.

The resolver preserves:

- Sector = macro context;
- Industry = minimum micro-methodology selector;
- Basic Industry = business-model refinement context;
- profile/subprofile assignment = role/applicability refinement;
- `NONE_FAIL_CLOSED` fallback policy.

Unsupported sectors, pending methodology and unresolved classification never
resolve to `GENERAL_FALLBACK`, nearest-sector logic or ticker-specific logic.

## 4. B1.3 evidence-to-score lineage contract

B1 defines the full shape that a future authoritative score must carry:

- security id;
- as-of date;
- classification version;
- assignment id/version;
- methodology role;
- methodology id/version;
- evidence snapshot id and/or evidence ids;
- evidence as-of dates and freshness;
- metric values;
- metric applicability;
- metric component scores;
- metric weights;
- category scores;
- overall score;
- readiness state/reason codes;
- calculation version;
- run id;
- created timestamp.

B1 does **not** instantiate an authoritative score.

The lineage identity helper intentionally uses:

```text
security
+ methodology role
+ assignment id/version
+ methodology id/version
+ as-of date
+ run id
```

It therefore does not use `(security_id, role)` as a timeless uniqueness key.

## 5. B1.4 machine-readable blocker/gap contract

Each fail-closed result can emit structured blockers containing:

- security id;
- readiness state;
- blocking domain;
- blocking metric;
- required state;
- observed state;
- reason code;
- methodology id;
- methodology role;
- assignment version;
- as-of date;
- descriptive recommended next evidence action.

The action field is descriptive only. Program B does not dispatch it.

Intended future flow remains:

```text
Program B detects gap
        ↓
Coverage Registry may record gap
        ↓
Evidence Orchestrator may later refresh under separate authority
        ↓
Program B recomputes from cache
```

## 6. Inherited authority preserved

B1 reuses rather than replaces:

- `routeResearchProfileV1`;
- `resolveK5PortfolioMethodState`;
- `SECTOR_ENGINE_REGISTRY`;
- profile-specific methodology authority in the Gate-K registry.

This preserves K5 cross-sector isolation and keeps pending profiles such as
`NBFC_LENDING` fail-closed.

PHARMA_V1 assignment/subprofile validation remains a prerequisite input. B1 does
not infer a Pharma subprofile from the symbol or parent sector.

## 7. Validation and closure

Owner-local consolidated validation was run after the focused blocker-metric
lineage correction.

Command:

```bash
git pull
bash scripts/b1-validate-r6-contract.sh
```

Final owner-local result: **ALL PASS**.

The consolidated runner therefore passed:

- B1 contract tests;
- Gate-K registry/routing isolation regressions;
- scoring-profile routing regressions;
- TypeScript;
- architecture guard;
- production build;
- whitespace/diff validity.

The first local attempt had exposed a structured-blocker field-mapping defect:
`metricCode` was not being emitted as `blockingMetric`. Commit
`bfe3b714a631df631f201e8ad90267702ebce544` corrected only that lineage
mapping. The rerun subsequently passed completely.

B1 is therefore **COMPLETE / PASS / CLOSED**.

## 8. Safety boundary

```text
cache-only contract design = YES
provider calls = 0
Angel One calls = 0
Trendlyne calls = 0
OpenAI decision calls = 0
numeric scoring executed = NO
score persistence = NO
recommendation computation = NO
recommendation persistence = NO
position sizing = NO
production mutation = NO
migration = NO
deployment = NO
merge = NO
scheduler mutation = NO
trading = NO
```

## 9. Exit and stop boundary

```text
B1.1 scoring-readiness adapter = APPROVED / CLOSED
B1.2 methodology resolver = APPROVED / CLOSED
B1.3 evidence-to-score lineage contract = APPROVED / CLOSED
B1.4 machine-readable blocker/gap contract = APPROVED / CLOSED

B1 = COMPLETE / PASS / CLOSED
Next stage = B2 only, after explicit owner approval
```

B2 has not started and is not authorized by this B1 closure.
