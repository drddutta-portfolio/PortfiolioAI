# PortfolioAI — Program B · B2 R6 Execution & Validation

**Checkpoint:** B2 — R6 Execution & Validation / Checkpoint B  
**Date:** 24 September 2026  
**Branch:** `program-a-evidence-coverage`  
**Starting commit:** `3a2adc6b8bc04b3645676bf50ce09d3a8ea27720`  
**Status:** IMPLEMENTED CANDIDATE — OWNER-LOCAL VALIDATION PENDING

## Purpose

B2 executes the R6 contract deterministically against already-approved read-only
score artifacts, proves replay/isolation/shell continuity, and assigns every
holding in the frozen K5 238-equity portfolio snapshot a canonical scoring
disposition.

B2 does not fetch missing evidence and does not invent a score where a canonical
score-input snapshot is absent.

## Controlled reference cohort

Repository-backed references:

- TORNTPHARM / Domestic Formulations — existing Gate H read-only deterministic score;
- ALIVUS / API-Bulk Drugs — existing G10.1 read-only deterministic score;
- AUROPHARMA / Global Generics — existing fail-closed score-not-computable control;
- BIOCON / Biopharma-Biosimilars — existing fail-closed control;
- SYNGENE / CDMO-CRAMS — existing fail-closed control;
- HDFCBANK / BANK — included as a BANK control, but no new score is fabricated
  because a cache-pure B2 bank score-input snapshot is not materialized in the
  repository artifact layer.

The unsupported-methodology control is selected dynamically from the frozen K5
portfolio snapshot rather than hard-coded by ticker.

K5's frozen portfolio fixture contains equities only. The non-equity applicability
test is therefore an explicit synthetic ETF contract control, not falsely
represented as a K5 portfolio holding.

## Deterministic scoring

B2 does not create new formulas.

For scoreable reference artifacts it reuses the previously closed deterministic
results exactly. For incomplete reference artifacts it preserves the prior
fail-closed state with:

- no denominator renormalization;
- no partial-score reconstruction;
- no nearest-methodology substitution;
- no discretionary adjustment;
- no AI-generated score.

## Replay

Canonical replay compares deterministic business payloads only:

- methodology id/role;
- artifact version;
- disposition state;
- category scores;
- overall score;
- deterministic reason codes;
- no-renormalization flag.

Run ids, timestamps and storage ids are not part of the comparison.

## Isolation

B2 adds a role-scoped evidence identity requiring:

```text
security
+ methodology role
+ assignment id/version
+ effective-from date
+ evidence id
```

This explicitly prevents evidence for Company X / Global Generics Primary from
being resolved as Company Y / Global Generics Overlay merely because the
subprofile name overlaps.

Existing K5 pairwise engine-isolation regressions remain in the B2 validation
runner.

## Portfolio-wide disposition

The portfolio pass uses:

`K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22`

Every one of its 238 equity rows receives exactly one of:

```text
SCORED
INSUFFICIENT_EVIDENCE
STALE_REQUIRED_EVIDENCE
CONFLICTING_EVIDENCE
REVIEW_REQUIRED
METHODOLOGY_NOT_AVAILABLE
NOT_APPLICABLE
BLOCKED_PREREQUISITE
```

A supported methodology does not imply a score. Where a canonical B2 score-input
snapshot is not materialized, the row is explicitly
`BLOCKED_PREREQUISITE / CANONICAL_B2_SCORE_INPUT_SNAPSHOT_NOT_MATERIALIZED`.

This means B2 can reach **PORTFOLIO-WIDE DISPOSITION COMPLETE** without making the
false claim **PORTFOLIO-WIDE NUMERIC COVERAGE COMPLETE**.

## Expansion order

The frozen K5 routing fixture does not contain an authoritative current portfolio
weight fact. B2 therefore does not invent a highest-value ranking.

The deterministic expansion order is:

1. closed reference score/fail-closed controls;
2. holdings with supported methodology;
3. remaining unsupported/review-required holdings;
4. complete 238-row disposition.

A later runtime with canonical weight/readiness facts may order execution by
highest-value/highest-readiness without changing the B2 outcome contract.

## Research UI integration

The shared scorecard is extended to display, without changing page topology:

- scoring readiness;
- methodology;
- methodology role;
- evidence date/snapshot;
- blocked-input count;
- fail-closed reason.

The existing UI distinction between verified evidence and score-ready coverage is
retained. The UI does not turn a partial evidence preview into an authoritative
Program B score.

## Validation

Run:

```bash
git pull
bash scripts/b2-validate-r6-execution.sh
```

The runner executes B2/B1/Gate-H/G10/K5/UI regressions, prints the canonical
238-row disposition summary, then runs TypeScript, architecture guard, production
build and `git diff --check`.

## Safety

```text
provider calls from B2 = 0
Angel One calls = 0
Trendlyne calls = 0
OpenAI decision calls = 0
score persistence = NO
recommendation computation/persistence = NO
position sizing = NO
production mutation = NO
migration = NO
deployment = NO
merge = NO
scheduler mutation = NO
trading = NO
```

## Stop boundary

B3 is not authorized by this candidate. B2 remains open until owner-local
validation passes and B2 is formally closed.
