# R2 — Portfolio Coverage Registry / Orchestrator Foundation

**Status:** Reference implementation under review  
**Completion target:** REGISTRY CONTRACT COMPLETE first; no provider execution or production migration is authorized by this document.  
**Purpose:** Give PortfolioAI one deterministic, portfolio-wide truth table for what evidence exists, what is fresh/stale/missing/conflicting, what research profile applies, which downstream engine can run, and what prerequisite blocks it.

## 1. Why R2 exists

PortfolioAI already has multiple authoritative stores and operational controls: transaction-derived holdings, canonical security identity/classification, provider refresh states, research evidence, market evidence, scoring-profile assignments, score runs, recommendation runs and the R1/D35B sizing contract.

The problem R2 solves is coordination, not investment judgment.

R2 answers:

> For each current holding, what is the present readiness state of every required domain, and what should happen next?

R2 does **not** decide whether a company is attractive and does not itself calculate Quality, Growth, Valuation, Recommendation or Position Size.

## 2. Core rule

R2 is a deterministic planner/projection over existing canonical facts.

It must not:

- call Trendlyne, Angel One, NSE or another provider merely to display coverage;
- invent a missing sector, industry or research profile;
- promote `PROFILE_PENDING` to READY;
- treat stale evidence as fresh;
- treat missing evidence as zero;
- manufacture a score/recommendation/sizing result;
- mutate owner roles, themes or position settings;
- bypass provider budgets, freshness or identity controls.

## 3. Registry domains

Initial V1 domains:

1. `IDENTITY`
2. `CLASSIFICATION`
3. `RESEARCH_PROFILE`
4. `FUNDAMENTALS`
5. `OWNERSHIP`
6. `DOCUMENTS`
7. `MARKET_HISTORY`
8. `SCORING`
9. `RECOMMENDATION`
10. `POSITION_SIZING`
11. `CORE_HEALTH`
12. `EXIT_RISK`

Later domains may be added only through a reviewed versioned contract.

## 4. Standard coverage states

R2 uses the roadmap states:

- `FRESH`
- `STALE`
- `MISSING`
- `CONFLICTING`
- `REVIEW_REQUIRED`
- `NOT_APPLICABLE`
- `READY_TO_DERIVE`
- `BLOCKED_PREREQUISITE`

### Meaning

`FRESH` — canonical evidence/output exists and is usable under the approved freshness/readiness contract.

`STALE` — valid historical evidence exists but is beyond its freshness policy.

`MISSING` — no usable evidence/output currently exists.

`CONFLICTING` — competing evidence cannot be safely treated as one canonical fact.

`REVIEW_REQUIRED` — evidence exists but an explicit review/decision is required.

`NOT_APPLICABLE` — this domain does not apply to the asset/profile, e.g. equity stock-selection research for ETFs.

`READY_TO_DERIVE` — all required upstream evidence is ready and the next deterministic calculation can run without an external provider call.

`BLOCKED_PREREQUISITE` — a required earlier domain is absent, unresolved or not ready.

## 5. Source reuse — no duplicate truth

R2 should reuse existing stores rather than creating parallel evidence.

### Portfolio membership / asset class

- transaction-derived current holdings;
- `securities.asset_class`.

### Identity

- canonical security/listing identity;
- `security_identity_observations` and reconciliation status where required.

### Classification

- canonical selected sector/industry decisions and current classification projection;
- existing reviewed classification evidence remains authoritative.

### Research freshness

- `security_refresh_states` plus domain policies;
- canonical fundamental/ownership/document evidence and conflicts.

### Research profile

- explicit reviewed profile assignments where present;
- canonical sector/industry mapping to the approved Sector Research Profile Architecture;
- no guessed profile when mapping is not reviewed.

### Market history

- Angel One remains authoritative;
- R2 records coverage/readiness only.

### Scoring

- versioned scoring profile/model readiness;
- latest applicable persisted score run.

### Recommendation

- latest applicable persisted recommendation run and transition/readiness state.

### Position sizing

- D35B prerequisites and, when the R1 persistence migration is later explicitly approved/applied, latest persisted sizing assessment.
- Until that production persistence exists, a security with all D35B prerequisites may be `READY_TO_DERIVE`; R2 must not pretend a persisted assessment already exists.

## 6. Research-profile relationship

R2 bridges the newly approved `PortfolioAI_Sector_Research_Profile_Architecture.md` into actual holdings.

Every equity should eventually resolve to:

```text
canonical sector
  -> research subprofile
  -> profile version
  -> profile readiness
```

Examples:

```text
HDFCBANK -> Banking & Financial Services -> BANK -> BANK_V1 -> READY
```

A real non-bank holding whose profile contract has not yet been validated remains:

```text
PROFILE_PENDING
```

That blocks downstream real scoring/recommendation/sizing even if generic scaffolds or hypothetical ranges exist.

## 7. Deterministic dependency rules

V1 planner rules are intentionally conservative.

### Equity applicability

Non-equities are `NOT_APPLICABLE` for sector-specific equity research/scoring/recommendation/sizing.

### Research profile

Requires:

- usable identity;
- usable classification;
- explicit profile code/version;
- profile readiness `READY`.

Otherwise downstream scoring is blocked.

### Scoring

If required research/profile prerequisites are usable and no score run exists, state is `READY_TO_DERIVE` rather than `MISSING` alone.

If profile/fundamental prerequisites are blocked, scoring is `BLOCKED_PREREQUISITE`.

### Recommendation

Requires a usable persisted score run. If score is ready and recommendation is missing, recommendation becomes `READY_TO_DERIVE`.

### Position sizing

Requires a usable persisted recommendation plus R1 research-profile/score/recommendation lineage.

If prerequisites are ready but persistence is not yet available in production, sizing is `READY_TO_DERIVE`, not `FRESH`.

### Core Health / Exit Risk

Remain explicitly blocked until their formal persisted engines exist. The Dashboard must not infer completion from UI rendering.

## 8. Refresh planning and provider cost

For source-backed domains, each registry item may expose:

- authoritative/approved source code;
- `fresh_until`;
- `next_eligible_refresh_at`;
- projected physical provider calls.

Projected calls are planning metadata only. R2 never executes them.

Portfolio-level orchestration can later aggregate this into questions such as:

- how many holdings have stale fundamentals?
- which stocks are blocked only by profile approval?
- how many Trendlyne calls would be required to refresh only missing/stale domains?
- which securities can be scored immediately with zero provider calls?

Actual provider execution remains R3 and must use the existing reservation, accounting, lease, cooldown and kill-switch controls.

## 9. Reference cases in V1 tests

### HDFCBANK

Research/profile/scoring/recommendation can be represented as ready. Because the D35B persistence migration has not been applied to production, sizing can truthfully be `READY_TO_DERIVE` rather than falsely persisted/complete.

### Non-bank profile pending

A real non-bank equity with `PROFILE_PENDING` must block scoring, recommendation and sizing even when classification exists.

### Stale/missing research

The planner retains separate stale/missing states, projected call cost and blocks scoring when mandatory upstream research is not usable.

### Identity review

`REVIEW_REQUIRED` identity becomes the earliest blocker; R2 never guesses through it.

### ETF

Equity research/scoring/recommendation/sizing are `NOT_APPLICABLE`.

## 10. Implementation phases inside R2

### R2A — deterministic contract

- pure TypeScript planner;
- state/reason-code tests;
- no database mutation;
- no provider calls.

### R2B — repository/data projection

Build a cache-only repository layer that normalizes existing database facts into `PortfolioCoverageInput`.

This work must inspect current production-safe views and avoid duplicating canonical evidence.

### R2C — portfolio-level registry projection

Expose a read-only portfolio matrix with security/domain state and blockers. Prefer an additive view/RPC only if it materially improves correctness/performance; any migration file remains review-only until separately approved for production.

### R2D — owner-facing coverage surface

A compact table/filter UI may consume the registry, but UI rendering alone is not R2 completion.

## 11. Completion gate

`R2 REGISTRY CONTRACT COMPLETE` means:

- deterministic state model implemented and tested;
- asset applicability correct;
- profile readiness cannot be bypassed;
- dependencies are explicit;
- projected provider cost is non-executing;
- no fabricated coverage.

`R2 PORTFOLIO COVERAGE REGISTRY COMPLETE` additionally requires the data projection to truthfully enumerate every current holding or explicitly mark it unresolved/not applicable.

It does **not** mean research breadth, scoring, recommendation or sizing are portfolio-wide complete.

## 12. Production boundary

This R2 reference implementation does not authorize:

- provider execution;
- broad research refresh;
- scheduler activation;
- production migrations;
- production D35B persistence;
- automatic investment actions.

Any future production schema/RPC change remains a separate explicit approval gate under the project Development Rules.
