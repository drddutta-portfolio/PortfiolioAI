# PortfolioAI — Program C · C4 R10 Contract, Execution & Validation

**Checkpoint:** C4 — R10 Contract + Execution + Validation
**Date:** 25 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `program-c-portfolio-decision-engines`
**Starting HEAD:** `60bf25caae9d9253c577a3e6809ad5527a23ddda`
**Source implementation HEAD before this document:** `c53f653840b690e4c761ebcebe5bf270687b3bbd`
**Status:** COMPLETE / PASS / CLOSED — owner-local executable validation confirmed

## 1. Authorization interpretation

The owner wrote "Authorise C4/R9".

Repository authority controls continuation. The frozen Program C checkpoint map is:

```text
C3 = R9 Contract + Execution + Validation -> R9 closes here
C4 = R10 Contract + Execution + Validation -> R10 closes here
```

R9 was already formally closed at C3. Therefore the authorization was applied as:

```text
C4 / R10 = AUTHORIZED
```

No R9 reopening or rewrite was performed.

## 2. C4 scope

C4 implements the canonical deterministic integrated Action Center.

It owns:

- one canonical R10 attention contract;
- deterministic precedence;
- explicit conflict preservation;
- exact R6–R9 lineage propagation where available;
- owner-context integration;
- owner target/stop threshold review context;
- portfolio-wide R10 disposition;
- shared Action Center view model;
- Dashboard/Research/Holdings consumers;
- validation and safety guards.

C4 does not authorize:

```text
C-FINAL
Program D
numeric sizing
ADD_REVIEW promotion
TRIM_REVIEW promotion
provider acquisition
AI deterministic decisions
persistence/schema migration
production mutation
merge/deployment
scheduler
trading
```

## 3. R10 source artifacts

Added:

```text
src/features/decision/r10ActionCenterContract.ts
src/features/decision/r10PrecedenceRegistry.ts
src/features/decision/r10Identity.ts
src/features/decision/r10ActionCenterEngine.ts
src/features/decision/r10ActionCenterViewModel.ts
src/features/decision/r10OwnerAuthority.ts
src/features/decision/r10AuthorityRegistry.ts
src/features/decision/r10LiveActionCenter.ts
src/features/decision/r10FrozenPortfolioDisposition.ts
src/features/decision/r10ReferenceValidation.ts
src/features/decision/r10C4Validation.ts
src/features/decision/r10ActionCenter.test.ts
src/features/decision/useProgramCR10ActionCenter.ts

src/components/ProgramCR10AttentionBadge.tsx
src/components/ProgramCR10AttentionBadge.css
```

Controlled consumer changes:

```text
src/components/DashboardDecisionLayer.tsx
src/pages/ResearchPage.tsx
src/pages/HoldingsPage.tsx
```

Validation tooling:

```text
scripts/program-c-c4-report.mjs
scripts/program-c-c4-static-safety.mjs
scripts/c4-validate-program-c-r10.sh
```

No C-FINAL artifact was created.

## 4. Frozen R10 versions

```text
PROGRAM_C_R10_ACTION_CENTER_V1
PROGRAM_C_R10_PRECEDENCE_V1
PROGRAM_C_R10_EXECUTION_V1
PROGRAM_C_R10_AUTHORITY_REGISTRY_V1
PROGRAM_C_R10_LIVE_ACTION_CENTER_V1
PROGRAM_C_R10_FROZEN_PORTFOLIO_DISPOSITION_V1
PROGRAM_C_R10_REFERENCE_VALIDATION_V1
PROGRAM_C_R10_C4_VALIDATION_V1
```

## 5. Canonical attention vocabulary

Canonical R10 states are:

```text
EXIT_REVIEW
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
EVIDENCE_REVIEW
INSUFFICIENT_EVIDENCE
RISK_REVIEW
RECOMMENDATION_CHANGE_REVIEW
CONCENTRATION_REVIEW
ROLE_REVIEW
PORTFOLIO_FIT_REVIEW
THESIS_WEAKENING
MONITOR
THESIS_STRENGTHENING
NO_ACTION_REQUIRED
NOT_APPLICABLE
```

All are review/attention states.

They contain no quantity, order instruction, exact add/trim percentage or
machine-generated target weight.

## 6. ADD_REVIEW / TRIM_REVIEW decision

The frozen master plan required C4 to prove an already-approved upstream
directional authority before promoting these states.

C4 found no approved upstream numeric/directional sizing authority sufficient to
support canonical ADD/TRIM direction without over-interpreting R7 or owner
weight context.

Therefore:

```text
ADD_REVIEW canonical = NO
TRIM_REVIEW canonical = NO

reason =
NO_APPROVED_UPSTREAM_DIRECTIONAL_SIZING_AUTHORITY
```

They remain candidate-only vocabulary and are not members of the canonical R10
state union.

This is a deliberate C4 result, not an omission.

## 7. Deterministic precedence

The machine-readable precedence order is:

```text
NOT_APPLICABLE
EXIT_REVIEW
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
EVIDENCE_REVIEW
INSUFFICIENT_EVIDENCE
RISK_REVIEW
RECOMMENDATION_CHANGE_REVIEW
CONCENTRATION_REVIEW
ROLE_REVIEW
PORTFOLIO_FIT_REVIEW
THESIS_WEAKENING
MONITOR
THESIS_STRENGTHENING
NO_ACTION_REQUIRED
```

`NOT_APPLICABLE` is terminal for unsupported/non-applicable assets.

Among applicable holdings, hard Exit Intelligence review outranks conflicting
signals, which outrank blocked/insufficient states, followed by risk,
recommendation, concentration/role/fit review, monitoring and informational
strengthening.

A higher-priority state does not discard lower-priority evidence.

## 8. Conflict preservation

R10 preserves conflicts as explicit structured records rather than averaging
signals into a score.

Implemented conflicts include:

```text
FAVOURABLE_RECOMMENDATION_VS_EXIT_RISK
FAVOURABLE_RECOMMENDATION_VS_PORTFOLIO_RISK
RECOMMENDATION_ROLE_VS_OWNER_ROLE
FAVOURABLE_RECOMMENDATION_VS_CONCENTRATION
POSITIVE_R8_CONTEXT_VS_EVIDENCE_DETERIORATION
```

Each conflict retains:

- supporting state;
- counter state;
- human-readable summary.

Example:

```text
CORE_CANDIDATE + HARD_EXIT_REVIEW
-> canonical state = EXIT_REVIEW
-> conflict remains visible
-> no hidden averaging
```

## 9. R8 / R9 integration rules

R10 consumes canonical R8 and R9 outputs.

It verifies:

```text
R8 securityId == R10 securityId
R8 portfolioId == R10 portfolioId
R9 securityId == R10 securityId
R9 portfolioId == R10 portfolioId
R9 current observed R8 decisionRunId == supplied R8 decisionRunId
```

A mismatched R8/R9 chain throws rather than reconstructing lineage.

R10 never recomputes R6, R7, R8 or R9.

## 10. End-to-end lineage

R10 carries, where available:

```text
classificationVersion
researchProfileCode
methodologyId/version
methodologyRole
assignmentId/version
evidenceSnapshotId
R6 scoreRunId
R7 recommendationRunId
portfolioContextSnapshotId
R8 decisionRunId
R9 previousObservedStateId
R9 currentObservedStateId
R9 changeEventId
R9 ruleVersion
R9 ownerContextVersion
R10 ownerThresholdContextId
R10 integratedAttentionId
```

No downstream run identity is fabricated.

## 11. Deterministic R10 identity

The R10 integrated-attention ID is derived from semantic inputs including:

```text
securityId
portfolioId
R8 decisionRunId
R9 current observed-state id
R9 change-event id
owner-context version
owner-threshold context id
R10 contract version
R10 precedence version
```

The owner-threshold context has its own deterministic fingerprint.

This means changing an owner-authored target/stop setting cannot silently reuse
an old R10 attention identity even if the R8/R9 state is otherwise unchanged.

No timestamp is used as the sole identity source.

## 12. Owner target / stop threshold semantics

Existing owner-authored monitoring thresholds may be consumed as context.

Examples:

```text
current price <= enabled owner stop-loss
-> REVIEW_REQUIRED
-> OWNER_STOP_LOSS_THRESHOLD_REACHED

current price >= enabled owner target price
-> REVIEW_REQUIRED
-> OWNER_TARGET_PRICE_THRESHOLD_REACHED
```

These are review states only.

They do not mean:

- sell;
- buy;
- order;
- quantity;
- exact percentage;
- automatic execution.

## 13. No numeric sizing

R10 explicitly prohibits output fields equivalent to:

```text
quantity
orderQuantity
orderInstruction
exactAddPercentage
exactTrimPercentage
machineGeneratedTargetWeight
machineGeneratedMinimumWeight
machineGeneratedMaximumWeight
opaqueMasterScore
```

Owner-authored target/min/max settings remain inputs only.

R10 does not activate or imitate D35B numeric sizing authority.

## 14. Controlled reference validation

C4 fixtures validate:

- clean complete state -> `NO_ACTION_REQUIRED`;
- first observation -> `MONITOR`;
- hard Exit Intelligence + favourable recommendation -> `EXIT_REVIEW` with
  explicit conflict;
- concentration -> `CONCENTRATION_REVIEW`;
- role compatibility issue -> `ROLE_REVIEW`;
- blocked chain -> `BLOCKED_PREREQUISITE`;
- stale evidence over a partial assessment -> `EVIDENCE_REVIEW`;
- owner stop threshold reached -> `REVIEW_REQUIRED`;
- R8/R9 decision-run mismatch -> fail closed;
- owner threshold context change -> new deterministic R10 identity.

The controlled fixtures are validation-only and do not expand live portfolio
numeric coverage.

## 15. Frozen 238-holding R10 disposition

The exact Program C validation universe remains:

```text
PROGRAM_C_VALIDATION_UNIVERSE_V1
K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22
238 holdings
238 EQUITY
```

R10 consumes the closed R8 and R9 frozen disposition artifacts.

The frozen fixture still lacks canonical security IDs and historical R9
comparison state required for full integrated attention identity.

R10 therefore does not fabricate them.

Every frozen holding receives an explicit disposition:

- `NOT_APPLICABLE` where upstream R8 is non-applicable;
- otherwise `BLOCKED_PREREQUISITE`.

The aggregate records:

```text
dispositionComplete = true
directionalAddReviewCount = 0
directionalTrimReviewCount = 0
providerCalls = 0
persistedWrites = 0
```

Thus:

```text
portfolio-wide deterministic R10 disposition = COMPLETE
portfolio-wide positive/action coverage = NOT CLAIMED
portfolio-wide numeric sizing coverage = NOT CLAIMED
```

## 16. Live canonical Action Center

`buildProgramCR10LiveActionCenter()` consumes only already-loaded domain
context:

- PortfolioViewModel;
- ResearchCoverageRow;
- owner monitoring settings passed as plain values;
- canonical R8 live projection;
- canonical R9 live projection.

The pure R10 live builder imports no:

- data repository;
- Supabase client;
- provider adapter;
- network function;
- persistence writer.

The live R9 state is currently an in-memory first-observation baseline unless a
mounted R9 session has advanced. R10 therefore preserves that limitation rather
than inventing historical change.

## 17. One shared application view model

The canonical R10 collection is projected through:

```text
buildProgramCR10ActionCenterView()
```

It deterministically sorts attention items by canonical precedence rank, symbol
and identity.

The shared integration hook is:

```text
useProgramCR10ActionCenter()
```

It waits for cached research coverage and cached owner monitoring settings before
publishing the shared collection.

## 18. Dashboard integration

`DashboardDecisionLayer` no longer implements Action Center business
priorities using:

- `localActions()`;
- local recommendation tone;
- persisted legacy advisory action bias.

The Dashboard Action Center now consumes only the shared canonical R10
collection.

The descriptive role/theme sections remain separate portfolio-structure views.

## 19. Research integration

Security Research now projects the same shared R10 item in the position header.

The Research page does not recompute:

- precedence;
- conflicts;
- materiality;
- sizing;
- action state.

It renders the canonical R10 view model through the shared attention badge.

## 20. Holdings integration

Open Holdings now includes an `R10 Action Center` column.

Each open holding renders the shared canonical R10 item.

Closed holdings display the Action Center as not applicable.

Holdings does not calculate its own R10 priority.

## 21. Cross-surface equivalence

Dashboard, Research and Holdings all call:

```text
useProgramCR10ActionCenter()
```

which projects:

```text
buildProgramCR10LiveActionCenter()
-> buildProgramCR10ActionCenterView()
```

Therefore the same canonical input set produces the same:

- integratedAttentionId;
- state;
- severity;
- reasons;
- conflicts;
- precedence rank.

Presentation surfaces do not execute `evaluateProgramCR10Attention()`
directly.

## 22. Owner-write regression

C4 includes a mock R10 writer boundary.

The regression requires:

```text
attentionWriteCount = 1
ownerFieldMutationCount = 0
persistenceMutationCount = 0
ownerContextAfter === ownerContextBefore
```

R10 may report tension with owner settings but cannot change them.

## 23. R10 authority registry

The R10 authority is frozen as:

```text
executionAuthority = C4_OWNER_AUTHORIZED_READ_ONLY
actionCenterAuthority = ONE_CANONICAL_R10_COLLECTION
conflictAuthority = EXPLICIT_PRESERVATION_NO_AVERAGING
addReviewAuthority = NOT_PROMOTED
trimReviewAuthority = NOT_PROMOTED
exitReviewAuthority = R8_EXIT_INTELLIGENCE_ONLY
numericSizingAuthority = NONE
aiDecisionAuthority = NONE
providerAuthority = NONE
persistenceAuthority = NONE
ownerMutationAuthority = NONE
schedulerAuthority = NONE
tradingAuthority = NONE
```

## 24. Static source review

Remote source inspection of R10 runtime modules found no:

- `src/data/*` import;
- Supabase import;
- Angel One import;
- Trendlyne import;
- OpenAI import;
- provider acquisition import;
- scheduler/brokerage/order repository import;
- `fetch()`;
- `Date.now()`;
- `Math.random()`;
- insert/update/upsert call;
- database-style chained delete call.

The R10 compute path remains read-only.

## 25. Repository safety boundary

C4 changes are limited to:

- `src/features/decision/r10*`;
- the shared R10 integration hook;
- shared R10 presentation badge;
- Dashboard Action Center consumer;
- Research projection;
- Holdings projection;
- C4 validation scripts;
- C4 documentation/handoff.

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

## 26. Validation bundle

`buildProgramCR10C4Validation()` requires:

- deterministic replay;
- deterministic precedence;
- conflict preservation;
- ADD/TRIM candidate-only status;
- frozen 238-holding disposition completeness;
- owner-field immutability;
- authority registry closure;
- safety boundary;
- closed R8 regression;
- closed R9 regression.

Expected invariant:

```text
overallPass = true
```

## 27. Owner-local executable validation

The owner confirmed the authoritative C4 validation runner completed
successfully after synchronizing the Program C branch through:

```text
8ee73abf6c05ea1cff23b296b08524d8f9ccebb4
```

and then applying the narrow TypeScript union-preservation correction:

```text
5c8c62afe4e57599c1f4619b1415fa430e70e666
```

Executed:

```bash
git fetch origin
git switch program-c-portfolio-decision-engines
git pull --ff-only

bash scripts/c4-validate-program-c-r10.sh
```

The runner completed with:

```text
PROGRAM C C4 VALIDATION ALL PASS
R10 = IMPLEMENTED / VALIDATED / AWAITING OWNER CLOSURE
```

This confirms the complete C4 validation bundle passed, including:

- R10 contract/execution tests;
- R9 regressions;
- R8 regressions;
- Program B final/R6/R7 regressions;
- canonical C4 R10 aggregate report;
- R10 structural provider/AI/persistence/trading safety;
- scoped C4 ESLint;
- repository allowlist;
- TypeScript;
- PortfolioAI architecture/data-boundary guard;
- production build;
- `git diff --check`.

The earlier TypeScript state-union widening issue was corrected before this
final passing run. No failed executable validation remains open.

## 28. C4 safety state

```text
R10 execution = READ-ONLY / DETERMINISTIC
one canonical Action Center authority = YES
conflicts preserved = YES
opaque master score = NO
ADD_REVIEW promoted = NO
TRIM_REVIEW promoted = NO
numeric sizing authority = NO
trade instruction = NO
owner-setting mutation = 0
provider calls = 0
AI deterministic decisions = 0
persistence = 0
schema migration = 0
production mutation = 0
merge/deployment = 0
scheduler mutation = 0
trading = 0
```

## 28A. Owner-local typecheck correction

The first owner-local C4 validation run reached TypeScript and stopped at:

```text
src/features/decision/r10ActionCenterEngine.ts(200,43):
TS2345: Argument of type 'string[]' is not assignable to
readonly ProgramCR10AttentionState[]
```

Root cause:

```text
unique(values: readonly string[])
```

widened the canonical R10 state union to plain `string[]` before
`selectProgramCR10State()`.

Correction:

```text
unique<T extends string>(values: readonly T[]): T[]
```

This preserves the exact `ProgramCR10AttentionState` union through deterministic
deduplication.

Correction commit:

```text
5c8c62afe4e57599c1f4619b1415fa430e70e666
```

No R10 state, precedence, conflict rule, lineage, owner authority, sizing
boundary, provider boundary, persistence boundary or trading boundary changed.

C4 remains executable-validation pending until the full authoritative runner
completes successfully.

## 29. C4 / R10 formal closure and stop point

C4 satisfies the frozen R10 exit criteria.

```text
C4 implementation = COMPLETE
C4 static architecture/safety review = PASS
C4 executable validation = PASS
C4 formal closure = COMPLETE / PASS / CLOSED

R10 contract = CLOSED
R10 execution = CLOSED
R10 deterministic replay = PASS
R10 deterministic precedence = PASS
R10 conflict preservation = PASS
R10 exact R8/R9 lineage validation = PASS
R10 owner-threshold identity = PASS
R10 owner-authority regression = PASS
R10 frozen-universe disposition completeness = PASS
R10 cross-surface Action Center equivalence = VALIDATED
R10 authority/safety audit = PASS

R10 = COMPLETE / PASS / CLOSED

C-FINAL = NOT STARTED
C-FINAL authorization = NONE
```

Intentional R10 limitations remain explicit:

- `ADD_REVIEW` remains candidate-only and is not canonical;
- `TRIM_REVIEW` remains candidate-only and is not canonical;
- no numeric sizing authority exists;
- no order quantity or trade instruction is produced;
- owner target/stop thresholds create review context only;
- the 238-holding frozen fixture has complete deterministic dispositions but
  does not claim complete positive/action coverage;
- R10 remains read-only and non-persisting;
- Dashboard, Research and Holdings consume one canonical Action Center
  collection rather than page-local decision logic.

No C-FINAL work is included in this closure.

The repository must stop here until the owner separately authorizes C-FINAL.
