# PortfolioAI — Program C · C2 R8 Execution & Validation

**Checkpoint:** C2 — R8 Execution & Validation / Checkpoint B
**Date:** 25 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `program-c-portfolio-decision-engines`
**Starting HEAD:** `fdd44b4591402dbc521e597e499341e2395b910a`
**Initial source implementation review HEAD:** `823e47b503dd1c678f29dcad8e814df6ae74bb6f`
**Latest source implementation HEAD before this document refresh:** `a449963778b7d61e0004fc20b4311060571eb3b3`
**Status:** COMPLETE / PASS / CLOSED — owner-local executable validation confirmed

## 1. C2 authority

The owner explicitly authorized C2 after formal C1 closure.

C2 is R8 Checkpoint B only. It implements deterministic read-only R8 execution,
validation fixtures, frozen-universe disposition and controlled consumer
integration.

The following remain outside C2:

```text
C3 / R9 = NOT AUTHORIZED
C4 / R10 = NOT AUTHORIZED
C-FINAL = NOT AUTHORIZED
Program D = NOT AUTHORIZED
productionization = NOT AUTHORIZED
schema migration = NOT AUTHORIZED
persistence = NOT AUTHORIZED
merge/deployment = NOT AUTHORIZED
scheduler/trading = NOT AUTHORIZED
```

## 2. C2 execution modules

Added:

```text
src/features/decision/r8Determinism.ts
src/features/decision/r8PortfolioContextBuilder.ts
src/features/decision/r8CoreHealth.ts
src/features/decision/r8PortfolioFit.ts
src/features/decision/r8PortfolioRisk.ts
src/features/decision/r8ExitIntelligence.ts
src/features/decision/r8PortfolioDecisionEngine.ts
src/features/decision/r8ExecutionAuthority.ts
src/features/decision/r8OwnerAuthority.ts
src/features/decision/r8Presentation.ts
src/features/decision/r8LivePortfolioAdapter.ts
src/features/decision/r8FrozenPortfolioDisposition.ts
src/features/decision/r8ReferenceValidation.ts
src/features/decision/r8C2Validation.ts
src/features/decision/r8Execution.test.ts
```

Validation tooling added:

```text
scripts/program-c-c2-report.mjs
scripts/program-c-c2-static-safety.mjs
scripts/c2-validate-program-c-r8.sh
```

Consumer integration changed only:

```text
src/components/DashboardCoreExitRisk.tsx
src/components/DashboardRiskConcentration.tsx
```

No R9/R10 modules were created.

## 3. Deterministic portfolio-context builder

`buildProgramCR8PortfolioContext()` builds the C1-frozen logical snapshot from
explicit inputs only.

It carries:

- portfolio identity;
- sorted holding/security identities;
- exact-decimal quantity/cost/price/value/current weight;
- classification snapshot identity;
- owner context;
- sector/industry/theme exposures;
- market-data as-of;
- exact R6 run ids where available;
- exact R7 run ids where available;
- semantic holdings fingerprint;
- semantic snapshot fingerprint;
- deterministic snapshot id.

Financial values remain exact decimal strings.

The semantic fingerprint implementation is deterministic and does not use
`Date.now()`, randomness or a timestamp as the sole identity source.

## 4. Core Health execution

Core Health now executes the C1 contract.

Rules implemented:

- missing owner role -> `BLOCKED_PREREQUISITE`;
- non-Core owner role -> `NOT_APPLICABLE`;
- formal Core Health never changes the owner role;
- invalid/missing R6 prerequisites fail closed;
- missing/stale health signal -> `INSUFFICIENT_EVIDENCE`;
- conflicting/review signal -> `REVIEW_REQUIRED`;
- approved categorical health signals map to:
  - `CORE_HEALTHY`;
  - `CORE_WATCH`;
  - `CORE_AT_RISK`;
  - `CORE_DEMOTION_REVIEW`;
- R7 remains optional context;
- recommendation/owner-role disagreement is surfaced, not resolved.

C2 introduces no numeric Core Health threshold.

## 5. Portfolio Fit execution

Portfolio Fit uses only approved C1 authorities:

- current portfolio weight;
- owner role;
- owner-authored minimum allocation;
- owner-authored maximum allocation;
- optional R7 role context.

Deterministic outcomes include:

```text
current weight > owner maximum -> CONCENTRATION_REVIEW
current weight < owner minimum -> FIT_TENSION
R7 direct-role candidate differs from owner role -> ROLE_COMPATIBILITY_REVIEW
within configured owner range -> FIT_SUPPORTED
no owner range configured -> FIT_NEUTRAL
```

No target weight, ideal allocation, correlation, diversification threshold or
sector sizing rule is invented.

## 6. Portfolio Risk execution

Portfolio Risk remains fail-closed.

A positive/evaluated risk state requires:

1. an explicit canonical categorical risk signal; and
2. at least one canonical risk evidence identity.

Missing or stale evidence returns `INSUFFICIENT_EVIDENCE`.

Conflicting/review-required evidence returns `REVIEW_REQUIRED`.

Therefore:

```text
no risk evidence != RISK_ACCEPTABLE
fresh generic research coverage != RISK_ACCEPTABLE
```

Concentration reasons may be carried as context, but they do not invent a risk
magnitude state.

## 7. Exit Intelligence execution

Exit Intelligence remains thesis/permanent-loss oriented.

A positive/evaluated Exit state requires:

1. an explicit categorical thesis/permanent-loss signal; and
2. at least one thesis evidence identity.

Missing/stale thesis evidence returns `INSUFFICIENT_EVIDENCE`.

Price weakness, valuation concern and overweight status are recorded only as
context reason codes and cannot create an Exit state by themselves.

`HARD_EXIT_REVIEW` remains advisory and non-trading.

## 8. Composed R8 decision engine

`evaluateProgramCR8PortfolioDecision()` executes the four independent
sub-engines and preserves each result separately.

It does not produce an opaque master score.

The engine:

- carries exact R6/R7 identities when supplied;
- detects R6/R7 source-run mismatch;
- suppresses inconsistent R7 context rather than using it;
- preserves independently valid Portfolio Fit/Risk behavior;
- derives a deterministic R8 run id;
- returns explicit blockers and reason codes;
- returns complete/partial/blocked/insufficient/review/not-applicable overall
  disposition without averaging sub-results.

## 9. C2 execution authority

C1's historical registry remains unchanged.

C2 adds a separate execution-authority projection:

```text
PROGRAM_C_R8_C2_EXECUTION_AUTHORITY_V1

executionAuthority = C2_OWNER_AUTHORIZED_READ_ONLY
numericSizingAuthority = NONE
providerAuthority = NONE
aiDecisionAuthority = NONE
persistenceAuthority = NONE
ownerMutationAuthority = NONE
```

This avoids rewriting the frozen C1 historical contract while making current C2
authority explicit.

## 10. Hand-verifiable reference validation

C2 uses TORNTPHARM and ALIVUS as controlled validation fixtures because their
Program B R6/R7 lineage exists.

The validation fixture:

- consumes exact Program B score-run ids;
- calls the Program B R7 recommendation executor directly, without invoking
  Program B sizing execution;
- consumes exact Program B recommendation-run ids;
- builds a deterministic two-holding portfolio context;
- exercises Core/non-Core applicability;
- exercises Portfolio Fit;
- exercises positive Risk only with explicit fixture evidence identity;
- exercises `NO_EXIT_SIGNAL` only with explicit fixture thesis evidence identity;
- verifies deterministic replay.

The fixture-only categorical health/risk/exit signals are validation inputs.
They are not claimed as live portfolio evidence and do not expand portfolio-wide
numeric or decision coverage.

## 11. Frozen 238-holding R8 disposition

C2 produces:

```text
PROGRAM_C_R8_FROZEN_PORTFOLIO_DISPOSITION_V1
```

over the exact frozen validation universe:

```text
K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22
238 holdings
238 EQUITY
```

Every holding receives an explicit R8 disposition.

The frozen aggregate consumes the existing Program B R7 portfolio aggregate for
recommendation lineage only and explicitly aborts if any upstream
`sizingReady` count is non-zero. C2 therefore cannot silently inherit numeric
sizing authority.

The frozen K5 fixture does not contain the owner role/settings, current portfolio
weight, canonical risk magnitude evidence or thesis/permanent-loss evidence
needed for a full R8 assessment.

C2 therefore intentionally returns fail-closed frozen-universe states rather
than fabricating positive coverage:

```text
Core Health       -> BLOCKED_PREREQUISITE
Portfolio Fit     -> BLOCKED_PREREQUISITE
Portfolio Risk    -> BLOCKED_PREREQUISITE
Exit Intelligence -> INSUFFICIENT_EVIDENCE
overall           -> BLOCKED_PREREQUISITE
```

for applicable holdings lacking those inputs.

This satisfies:

```text
PORTFOLIO-WIDE DETERMINISTIC R8 DISPOSITION = COMPLETE
```

It does not claim:

```text
PORTFOLIO-WIDE POSITIVE R8 COVERAGE = COMPLETE
PORTFOLIO-WIDE NUMERIC ACTION COVERAGE = COMPLETE
```

## 12. Live read-only portfolio adapter

`buildProgramCR8LivePortfolioProjection()` consumes only already-loaded
application domain values:

- `PortfolioViewModel`;
- `ResearchCoverageRow`.

It imports no repository, Supabase client, provider adapter or network function.

For the live application surface:

- Portfolio Fit can evaluate from current weight + owner settings;
- Core Health remains blocked where exact canonical R6 run lineage is not
  materialized to that surface;
- Portfolio Risk remains insufficient where only generic research freshness
  exists but no canonical risk magnitude evidence exists;
- Exit Intelligence remains insufficient where thesis/permanent-loss evidence is
  absent;
- no legacy persisted recommendation row is silently promoted to Program B R7
  lineage.

This is intentionally conservative.

## 13. Controlled consumer integration

`DashboardCoreExitRisk.tsx` now consumes canonical R8 projections for:

- Core Health;
- Exit Intelligence.

Persisted advisory metadata remains visibly separate and does not become formal
R8 authority.

`DashboardRiskConcentration.tsx` now consumes canonical R8 projections for:

- Portfolio Fit;
- Portfolio Risk.

Its pre-existing concentration/data queue is explicitly labelled descriptive
and non-R8 so page-local heuristics cannot masquerade as canonical Program C
logic.

No R8 business state is recalculated inside either component.

## 14. Presentation model

`projectProgramCR8Assessment()` is the shared presentation projection.

It maps canonical states to:

- display label;
- tone;
- coverage class.

Presentation code does not choose R8 business states.

## 15. Owner-write recorder

C2 includes a real mock machine-assessment writer boundary.

The regression proves:

```text
machine assessment writes = 1
owner field mutation = 0
persistence mutation = 0
```

The returned owner-context object is the same object supplied to the writer
boundary.

## 16. Aggregate C2 validation audit

`buildProgramCR8C2Validation()` checks:

- reference lineage;
- deterministic replay;
- 238-holding disposition completeness;
- owner-field immutability;
- zero persistence;
- zero provider/AI/trading authority;
- Program B final audit remains PASS.

Expected report invariant:

```text
overallPass = true
```

## 17. Static structural safety

`program-c-c2-static-safety.mjs` scans R8 runtime modules and rejects:

- data-repository imports;
- Supabase imports;
- Trendlyne imports;
- Angel One imports;
- OpenAI imports;
- provider imports;
- scheduler/brokerage/order repository imports;
- `fetch()`;
- `Date.now()`;
- `Math.random()`;
- insert/update/delete/upsert calls.

It also verifies that both C2 Dashboard consumer shells import the canonical R8
adapter.

## 18. C2 repository safety boundary

C2 changes are limited to:

- `src/features/decision/r8*`;
- the two approved Dashboard consumer shells;
- C2 validation scripts;
- C2 documentation/handoff.

No:

- migration;
- Edge Function;
- provider adapter;
- data repository;
- workflow;
- production configuration;
- persistence schema;
- scheduler;
- trading path

is changed.

## 19. Owner-local executable validation

The owner confirmed the authoritative C2 validation runner completed successfully
after synchronizing the Program C branch through:

```text
74a59f6b6e480f2a8e140c2566e528dc0d2c9af0
```

Executed:

```bash
git fetch origin
git switch program-c-portfolio-decision-engines
git pull --ff-only

bash scripts/c2-validate-program-c-r8.sh
```

The runner completed with:

```text
PROGRAM C C2 VALIDATION ALL PASS
R8 = IMPLEMENTED / VALIDATED / AWAITING OWNER CLOSURE
```

This confirms the C2 validation bundle passed, including:

- C1 contract regression;
- C2 R8 execution tests;
- Program B final/R6/R7 regression tests;
- canonical C2 aggregate report;
- static provider/AI/persistence/trading safety scan;
- scoped C2 ESLint;
- repository safety allowlist;
- TypeScript;
- PortfolioAI architecture/data-boundary guard;
- production build;
- `git diff --check`.

No failed executable validation remains open.

## 20. C2 safety state

```text
R8 execution = READ-ONLY / DETERMINISTIC
portfolio-wide frozen R8 disposition = COMPLETE
numeric action coverage = NOT CLAIMED
provider calls = 0
Angel One calls = 0
Trendlyne calls = 0
OpenAI deterministic decisions = 0
score recomputation = NO
recommendation recomputation = NO
numeric sizing authority = NO
opaque master score = NO
owner-setting mutation = 0
persistence = 0
schema migration = 0
production mutation = 0
deployment/merge = 0
scheduler mutation = 0
trading = 0
```

## 21. C2 / R8 formal closure and stop point

C2 satisfies the frozen R8 Checkpoint-B exit criteria.

```text
C2 implementation = COMPLETE
C2 static architecture/safety review = PASS
C2 executable validation = PASS
C2 formal closure = COMPLETE / PASS / CLOSED

R8 contract = CLOSED
R8 execution = CLOSED
R8 deterministic replay = PASS
R8 frozen-universe disposition completeness = PASS
R8 owner-authority regression = PASS
R8 consumer integration = VALIDATED
R8 provider/AI/persistence/trading safety = PASS

R8 = COMPLETE / PASS / CLOSED

C3 / R9 = NOT STARTED
C3 authorization = NONE
```

Intentional R8 limitations remain explicit:

- the 238-holding frozen K5 universe has complete deterministic dispositions but
  does not claim complete positive R8 coverage;
- numeric action/sizing coverage is not authorized or claimed;
- live Core Health remains blocked where exact canonical R6 lineage is not
  materialized to the surface;
- live Portfolio Risk remains insufficient without canonical risk magnitude
  evidence;
- live Exit Intelligence remains insufficient without thesis/permanent-loss
  evidence;
- R8 remains read-only and non-persisting.

No C3/R9 work is included in this closure.

The repository must stop here until the owner separately authorizes C3.

## Post-audit lineage correction — 25 September 2026

The independent Program C pre-closure audit found that the original R8 run
identity did not include every decision-changing signal and that the composed
engine did not bind supplied risk/thesis evidence IDs to `canonicalEvidence`.
The corrective implementation now:

- derives `decisionRunId` from a SHA-256 fingerprint of the complete semantic
  R8 decision input, including canonical evidence and normalized signals;
- accepts positive risk evidence only from a fresh `PORTFOLIO_RISK` canonical
  evidence reference;
- accepts thesis/permanent-loss evidence only from a fresh `EXIT_THESIS`
  canonical evidence reference;
- fails closed when supplied signal evidence is absent from that authority;
- includes adverse regression coverage for identity sensitivity and evidence
  binding.

No persistence, schema, provider, production, sizing or trading authority was
introduced.
