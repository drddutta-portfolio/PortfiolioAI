# PortfolioAI — Program C · C3 R9 Contract, Execution & Validation

**Checkpoint:** C3 — R9 Contract + Execution + Validation
**Date:** 25 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `program-c-portfolio-decision-engines`
**Starting HEAD:** `91992ad93f9b2b65c75f85f2b47eed96c6de7a7e`
**Source implementation HEAD before this document:** `89e1f0a8ba8c3886315248687d27258d56f54562`
**Status:** IMPLEMENTED / STATIC ARCHITECTURE-SAFETY REVIEW PASS / OWNER-LOCAL EXECUTABLE VALIDATION PENDING

## 1. C3 authority and scope

The owner explicitly authorized C3 after formal C2/R8 closure.

The frozen Program C master plan defines C3 as the consolidated R9 checkpoint:

```text
C3 = R9 Contract + Execution + Validation
     Checkpoints A+B consolidated
     -> R9 closes here
```

C3 owns meaningful deterministic state transitions only.

C3 does **not** authorize:

```text
C4 / R10
C-FINAL
Program D
persistence/schema migration
provider acquisition
AI materiality
numeric sizing
productionization
merge/deployment
scheduler
trading
```

## 2. R9 source artifacts

Added:

```text
src/features/decision/r9AuthorityRegistry.ts
src/features/decision/r9MeaningfulChangeContract.ts
src/features/decision/r9MeaningfulChangeRegistry.ts
src/features/decision/r9ObservedState.ts
src/features/decision/r9EventIdentity.ts
src/features/decision/r9MeaningfulChangeEngine.ts
src/features/decision/r9Presentation.ts
src/features/decision/r9FrozenPortfolioDisposition.ts
src/features/decision/r9LivePortfolioAdapter.ts
src/features/decision/r9LiveSession.ts
src/features/decision/r9ReferenceValidation.ts
src/features/decision/r9C3Validation.ts
src/features/decision/r9MeaningfulChange.test.ts
```

Validation tooling:

```text
scripts/program-c-c3-report.mjs
scripts/program-c-c3-static-safety.mjs
scripts/c3-validate-program-c-r9.sh
```

Controlled UI integration:

```text
src/components/DashboardMeaningfulChanges.tsx
src/components/DashboardMeaningfulChanges.css
src/components/DashboardDailyMovement.tsx
src/components/DashboardSectionNavigator.tsx
src/routes/AppRoutes.tsx
```

No R10 source was created.

## 3. Frozen R9 contract versions

```text
PROGRAM_C_R9_MEANINGFUL_CHANGE_V1
PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES_V1
PROGRAM_C_R9_OBSERVED_STATE_V1
PROGRAM_C_R9_EXECUTION_V1
PROGRAM_C_R9_AUTHORITY_REGISTRY_V1
PROGRAM_C_R9_FROZEN_PORTFOLIO_DISPOSITION_V1
PROGRAM_C_R9_LIVE_ADAPTER_V1
PROGRAM_C_R9_REFERENCE_VALIDATION_V1
PROGRAM_C_R9_C3_VALIDATION_V1
```

## 4. Explicit baseline semantics

The mandatory first-observation distinction is encoded directly.

Baseline states:

```text
BASELINE_ESTABLISHED
COMPARABLE_BASELINE
NO_COMPARABLE_BASELINE
```

Transition states:

```text
FIRST_OBSERVATION
NO_CHANGE
RAW_IMMATERIAL_CHANGE
MEANINGFUL_CHANGE
INCOMPARABLE
OUT_OF_ORDER
NOT_APPLICABLE
```

The invariant is:

```text
FIRST_OBSERVATION
!= NO_CHANGE
!= RAW_IMMATERIAL_CHANGE
!= MEANINGFUL_CHANGE
```

A first observation generates no meaningful-change event.

## 5. Canonical observed-state bundle

R9 observed states are deterministic bundles containing, where available:

- security id;
- portfolio id;
- asset class;
- observation timestamp;
- R6 readiness state;
- R6 score-run id;
- exact score value if supplied;
- R7 readiness state;
- R7 recommendation state;
- R7 recommendation-run id;
- research profile;
- methodology id/version;
- methodology role;
- assignment id/version;
- classification version;
- evidence snapshot id;
- evidence readiness/freshness state;
- canonical valuation state where available;
- canonical momentum state where available;
- portfolio-context snapshot id;
- R8 decision-run id;
- R8 overall disposition;
- Core Health;
- Portfolio Fit;
- Portfolio Risk;
- Exit Intelligence;
- exact R8 blocker set;
- owner-context version.

The observed-state identity is a deterministic semantic fingerprint. Observation
time is carried for ordering/comparison-window validation but is not used as the
sole identity source.

R9 does not reconstruct missing upstream run identities.

## 6. Comparability and ordering

Two observations are comparable only when they refer to the same:

```text
securityId
portfolioId
assetClass
```

Different identities produce:

```text
baselineState = NO_COMPARABLE_BASELINE
transitionState = INCOMPARABLE
event = null
```

An observation older than the accepted baseline produces:

```text
transitionState = OUT_OF_ORDER
event = null
```

The in-memory live session retains the last valid baseline when an out-of-order
or incomparable observation is encountered.

## 7. Meaningful-change registry

R9 materiality is controlled only by the versioned machine-readable registry:

```text
PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES_V1
```

Meaningful categorical/lineage rules include:

```text
R6_READINESS_CHANGED
R7_READINESS_CHANGED
R7_RECOMMENDATION_CHANGED
METHODOLOGY_ID_CHANGED
METHODOLOGY_VERSION_CHANGED
METHODOLOGY_ROLE_CHANGED
ASSIGNMENT_ID_CHANGED
ASSIGNMENT_VERSION_CHANGED
CLASSIFICATION_VERSION_CHANGED
EVIDENCE_STATE_CHANGED
VALUATION_STATE_CHANGED
MOMENTUM_STATE_CHANGED
R8_OVERALL_CHANGED
CORE_HEALTH_CHANGED
PORTFOLIO_FIT_CHANGED
PORTFOLIO_RISK_CHANGED
EXIT_INTELLIGENCE_CHANGED
R8_BLOCKER_SET_CHANGED
OWNER_CONTEXT_VERSION_CHANGED
```

These rules are deterministic. AI does not decide materiality.

## 8. Raw but immaterial differences

R9 explicitly records some raw differences without promoting them to meaningful
events.

Current raw/immaterial rules include:

```text
R6_SCORE_RUN_CHANGED
R7_RECOMMENDATION_RUN_CHANGED
R8_DECISION_RUN_CHANGED
EVIDENCE_SNAPSHOT_CHANGED
PORTFOLIO_CONTEXT_SNAPSHOT_CHANGED
R6_SCORE_VALUE_CHANGED_WITHOUT_THRESHOLD
```

This permits PortfolioAI to say:

```text
something changed
but no approved Program C materiality rule says it is meaningful
```

rather than silently treating every raw delta as an event.

## 9. Numeric-threshold boundary

Program C has approved **no new R9 numeric or duration threshold**.

The authority object explicitly contains:

```text
scoreDeltaThreshold = null
valuationDeltaThreshold = null
momentumDeltaThreshold = null
concentrationDeltaThreshold = null
hysteresisThreshold = null
persistenceDurationRule = null
```

Therefore a numeric score change by itself is:

```text
RAW_IMMATERIAL_CHANGE
```

until a separately reviewed threshold authority exists.

R9 does not invent:

- score-delta thresholds;
- valuation-delta thresholds;
- momentum-delta thresholds;
- concentration-delta thresholds;
- hysteresis;
- persistence duration.

## 10. Missing/stale/conflicting and blocker transitions

The registry treats categorical evidence transitions as meaningful, including
states equivalent to:

```text
FRESH -> STALE
AVAILABLE -> MISSING
CONSISTENT -> CONFLICTING
READY -> BLOCKED
BLOCKED -> READY
```

The R8 blocker-set comparison detects blocker appearance, clearing or change.

These transitions remain categorical. R9 does not convert them into a synthetic
numeric deterioration score.

## 11. Event identity and exact causes

A meaningful event identity is deterministic from:

```text
securityId
portfolioId
previousObservedStateId
currentObservedStateId
ruleRegistryVersion
```

Each event carries:

- exact previous observed-state id;
- exact current observed-state id;
- rule version;
- all meaningful change facts;
- all raw change facts;
- before value;
- after value;
- reason codes.

Replaying the same comparison produces the same event id.

R9 does not decide the final action category. That remains R10 responsibility.

## 12. Semantic duplicate suppression

C3 supports:

```text
deterministic event identity = YES
semantic idempotency = YES
same-input replay stability = YES
in-memory duplicate suppression = YES
```

C3 explicitly does **not** claim:

```text
durable acknowledgement = NO
durable snooze = NO
persistent notification deduplication = NO
cross-session seen/unseen state = NO
```

Duplicate suppression is by event id in memory only.

No database table, browser durable store or notification-state schema was added.

## 13. Controlled reference validation

R9 controlled fixtures exercise:

- first observation;
- same-semantic-state replay;
- raw numeric score change without threshold;
- Core Health categorical transition;
- fresh -> stale evidence transition;
- assignment-version change;
- blocker cleared;
- out-of-order observation;
- incomparable security observations;
- duplicate-event suppression.

The fixture uses closed R8 reference outputs where practical. Explicitly
synthetic previous R8 fixture identities are test-only and are not presented as
production/canonical historical runs.

## 14. Frozen 238-holding R9 disposition

The Program C frozen universe remains:

```text
PROGRAM_C_VALIDATION_UNIVERSE_V1
K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22
238 holdings
238 EQUITY
```

The frozen K5 fixture contains symbols but does not contain canonical
`securityId` values or a previous R9 comparison snapshot.

R9 therefore does not fabricate either.

Every holding receives:

```text
baselineState = NO_COMPARABLE_BASELINE
transitionState = FIRST_OBSERVATION
previousObservedStateId = null
currentObservedStateId = null
changeEventId = null
```

with explicit reasons.

Thus:

```text
portfolio-wide R9 disposition completeness = COMPLETE
portfolio-wide historical comparison coverage = NOT CLAIMED
portfolio-wide meaningful event count in frozen first-observation fixture = 0
```

Zero events in this fixture means **no comparable baseline**, not “no change”.

## 15. Live in-memory R9 adapter

The live adapter consumes only already-loaded domain models:

```text
PortfolioViewModel
ResearchCoverageRow
canonical R8 live projection
```

It imports no data repository, Supabase client, provider acquisition path or
network utility.

It builds real observed-state identities where current security identity exists.

The mounted Dashboard session keeps prior observed states and seen event ids only
in React memory.

Invalid comparison windows do not replace the last valid baseline.

Reloading/remounting loses this state by design because durable persistence is
outside C3.

## 16. Dashboard meaningful-change integration

A dedicated Dashboard consumer was added:

```text
DashboardMeaningfulChanges
```

It presents:

- first observation count;
- no semantic change count;
- raw/immaterial change count;
- meaningful change count;
- incomparable/out-of-order count;
- new in-memory meaningful events.

It consumes the shared R9 engine/session model and does not implement independent
materiality rules.

The Dashboard section navigator includes a distinct Meaningful Change section.

## 17. Daily movement remains separate

`DashboardDailyMovement` remains a cached price/P&L movement surface.

It is explicitly labelled as:

```text
not R9 meaningful-change materiality
```

Daily price movement is not automatically a meaningful R9 event.

This preserves the master-plan distinction between market movement and
deterministic decision-state change.

## 18. R9 authority registry

The canonical R9 authority entry freezes:

```text
executionAuthority = C3_OWNER_AUTHORIZED_READ_ONLY
materialityAuthority = VERSIONED_DETERMINISTIC_RULES_ONLY
numericThresholdAuthority = NONE
aiDecisionAuthority = NONE
providerAuthority = NONE
persistenceAuthority = NONE
durableNotificationStateAuthority = NONE
ownerMutationAuthority = NONE
sizingAuthority = NONE
schedulerAuthority = NONE
tradingAuthority = NONE
```

## 19. Aggregate C3 validation audit

`buildProgramCR9C3Validation()` checks:

- deterministic replay;
- first-observation semantics;
- raw versus meaningful distinction;
- categorical meaningful transitions;
- out-of-order/incomparable handling;
- semantic duplicate suppression;
- frozen 238-holding disposition completeness;
- R9 authority registry;
- zero provider/AI/persistence/sizing/trading authority;
- closed R8 regression.

Expected invariant:

```text
overallPass = true
```

## 20. Static structural safety

Remote source review currently confirms the R9 runtime path contains no:

- `src/data/*` import;
- Supabase import;
- Angel One import;
- Trendlyne import;
- OpenAI import;
- provider-acquisition import;
- scheduler/brokerage/order-repository import;
- `fetch()`;
- `Date.now()`;
- `Math.random()`;
- insert/update/delete/upsert call.

The C3 static-safety script repeats these checks locally and also verifies:

- DashboardMeaningfulChanges consumes canonical R9;
- AppRoutes exposes the R9 Dashboard section;
- Daily Movement is explicitly separated from R9.

## 21. Repository safety boundary

C3 changes are limited to:

- `src/features/decision/r9*`;
- R9 Dashboard consumer files;
- Dashboard routing/navigation separation;
- C3 validation scripts;
- C3 documentation/handoff.

No:

- migration;
- Edge Function;
- data repository;
- provider adapter;
- workflow;
- persistence schema;
- production configuration;
- scheduler;
- trading path

was changed.

## 22. Required owner-local executable validation

Run:

```bash
git fetch origin
git switch program-c-portfolio-decision-engines
git pull --ff-only

bash scripts/c3-validate-program-c-r9.sh
```

The runner executes:

- R9 contract/execution tests;
- R8 C1/C2 regressions;
- Program B final/R6/R7 regressions;
- canonical C3 report;
- R9 static safety;
- scoped C3 ESLint;
- repository allowlist;
- TypeScript;
- PortfolioAI architecture/data-boundary guard;
- production build;
- `git diff --check`.

C3 must not be formally closed until the owner-local runner ends with:

```text
PROGRAM C C3 VALIDATION ALL PASS
R9 = IMPLEMENTED / VALIDATED / AWAITING OWNER CLOSURE
```

## 23. C3 safety state

```text
R9 execution = READ-ONLY / DETERMINISTIC
AI materiality = NO
numeric materiality thresholds invented = NO
numeric sizing authority = NO
owner-setting mutation = 0
provider calls = 0
Angel One calls = 0
Trendlyne calls = 0
OpenAI deterministic decisions = 0
persistence = 0
durable acknowledgement = NO
durable snooze = NO
persistent notification deduplication = NO
cross-session seen/unseen = NO
schema migration = 0
production mutation = 0
merge/deployment = 0
scheduler mutation = 0
trading = 0
```

## 24. Current stop point

```text
C0 = COMPLETE / PASS / CLOSED
C1 = COMPLETE / PASS / CLOSED
C2 = COMPLETE / PASS / CLOSED
R8 = COMPLETE / PASS / CLOSED

C3 implementation = COMPLETE
C3 static architecture/safety review = PASS
C3 executable validation = PENDING
C3 formal closure = PENDING
R9 formal closure = PENDING

C4 / R10 = NOT AUTHORIZED
C-FINAL = NOT AUTHORIZED
```

Do not begin C4 until C3 executable validation is clean, R9 is formally
accepted/closed by the owner, and C4 is separately authorized.
