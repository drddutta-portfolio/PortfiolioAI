# PortfolioAI — Program C · C1 R8 Contract & Architecture

**Checkpoint:** C1 — R8 Contract & Architecture / Checkpoint A
**Date:** 24 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `program-c-portfolio-decision-engines`
**Starting HEAD:** `497006335d4648c7f425691fe8598f9b170ddcd3`
**Contract source HEAD before this document:** `c2b97b49d2cb962daae4e4e4517d929486357c95`
**Status:** COMPLETE / PASS / CLOSED — owner-local executable validation confirmed

## 1. C1 authority

The owner explicitly authorized C1 after C0 completed.

C1 is R8 Checkpoint A only. It defines R8 contracts and architecture without
executing portfolio decisions.

The following remain outside this checkpoint:

```text
C2 / R8 execution = NOT AUTHORIZED
C3 / R9 = NOT AUTHORIZED
C4 / R10 = NOT AUTHORIZED
C-FINAL = NOT AUTHORIZED
Program D = NOT AUTHORIZED
productionization = NOT AUTHORIZED
merge/deployment = NOT AUTHORIZED
scheduler/trading = NOT AUTHORIZED
```

## 2. Source artifacts added

```text
src/features/decision/r8CoreHealthContract.ts
src/features/decision/r8PortfolioFitContract.ts
src/features/decision/r8PortfolioRiskContract.ts
src/features/decision/r8ExitIntelligenceContract.ts
src/features/decision/r8PortfolioContext.ts
src/features/decision/r8DependencyMatrix.ts
src/features/decision/r8PortfolioDecisionContract.ts
src/features/decision/r8AuthorityRegistry.ts
src/features/decision/r8ContractArchitecture.test.ts
```

No evaluator, portfolio-wide R8 runner, presentation integration or UI decision
logic was added.

## 3. Frozen contract versions

```text
PROGRAM_C_R8_CORE_HEALTH_V1
PROGRAM_C_R8_PORTFOLIO_FIT_V1
PROGRAM_C_R8_PORTFOLIO_RISK_V1
PROGRAM_C_R8_EXIT_INTELLIGENCE_V1
PROGRAM_C_R8_PORTFOLIO_CONTEXT_V1
PROGRAM_C_R8_DEPENDENCY_MATRIX_V1
PROGRAM_C_R8_DECISION_CONTRACT_V1
PROGRAM_C_R8_AUTHORITY_REGISTRY_V1
PROGRAM_C_VALIDATION_UNIVERSE_V1
```

These are C1 contract authorities. They do not grant execution authority.

## 4. Core Health contract

Frozen states:

```text
CORE_HEALTHY
CORE_WATCH
CORE_AT_RISK
CORE_DEMOTION_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
```

Frozen semantics:

- formal Core Health applies only when the owner role is `CORE`;
- non-Core holdings return `NOT_APPLICABLE`;
- owner role is input authority and cannot be mutated;
- positive health states require complete mandatory evidence;
- recommendation/owner-role disagreement is context for review, not an automatic
  owner-role change;
- R6 and R7 cannot be recomputed inside R8;
- C1 creates no numeric deterioration threshold.

## 5. Portfolio Fit contract

Frozen states:

```text
FIT_SUPPORTED
FIT_NEUTRAL
FIT_TENSION
CONCENTRATION_REVIEW
ROLE_COMPATIBILITY_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
```

Portfolio Fit may use current weight, portfolio exposure and owner-authored
limits. It is explicitly prohibited from inventing:

- target weight;
- min/max allocation;
- correlation;
- diversification threshold;
- universal sector sizing;
- nearest-profile sizing fallback.

Portfolio Fit is not a hidden sizing engine.

## 6. Portfolio Risk contract

Frozen states:

```text
RISK_ACCEPTABLE
RISK_MONITOR
RISK_ELEVATED
RISK_CRITICAL_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
```

A positive `RISK_ACCEPTABLE` state requires sufficient canonical risk evidence.
Absence of risk evidence cannot be interpreted as low/acceptable risk.

Allowed inputs may include canonical R6 risk dimensions, stored volatility,
drawdown, liquidity, concentration and sector/theme exposure where authoritative
data exists.

No missing-input renormalization or invented risk threshold is allowed.

## 7. Exit Intelligence contract

Frozen states:

```text
NO_EXIT_SIGNAL
EXIT_MONITOR
EXIT_REVIEW_REQUIRED
EXIT_RISK_ELEVATED
HARD_EXIT_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
```

`HARD_EXIT_REVIEW` is advisory only.

The contract explicitly rejects the following as standalone exit authority:

- price weakness;
- valuation;
- overweight status.

Owner stop loss may be read as context but does not become automatic trade
authority.

## 8. Mandatory R8 dependency matrix

The machine-readable dependency matrix is:

```text
PROGRAM_C_R8_DEPENDENCY_MATRIX_V1
```

It contains exactly four entries:

```text
CORE_HEALTH
PORTFOLIO_FIT
PORTFOLIO_RISK
EXIT_INTELLIGENCE
```

For each entry the matrix records:

- mandatory upstream states;
- optional upstream states;
- portfolio-context requirements;
- market/risk evidence requirements;
- owner-context requirements;
- applicability rules;
- blocking conditions;
- R7 requirement;
- prohibited fallbacks.

Frozen R7 dependency policy:

```text
CORE_HEALTH       = OPTIONAL_CONTEXT
PORTFOLIO_FIT     = NOT_REQUIRED
PORTFOLIO_RISK    = NOT_REQUIRED
EXIT_INTELLIGENCE = OPTIONAL_CONTEXT
```

Therefore a missing R7 recommendation cannot globally block an independently
valid Portfolio Fit or Portfolio Risk assessment.

Core Health and Exit Intelligence may consume R7 context when available, but R7
is not a universal prerequisite.

## 9. Portfolio-context snapshot contract

R8 receives a logical immutable portfolio-context snapshot carrying:

- portfolio id;
- frozen validation-universe version;
- included security ids;
- holding quantities, costs, prices, values and current weights;
- sector/industry/basic-industry classification;
- classification version;
- themes;
- owner context;
- exposure context;
- market-data as-of state;
- exact R6 run ids;
- exact R7 run ids;
- snapshot as-of;
- holdings fingerprint;
- snapshot fingerprint;
- snapshot id.

Financial values are represented as exact decimal strings at this boundary.

Snapshot identity requires semantic fingerprints and cannot use timestamp alone.

C1 does not implement holdings arithmetic or snapshot construction; that belongs
to C2.

## 10. R8 composed contract and lineage

The R8 composed assessment keeps the four sub-results independently inspectable:

```text
coreHealth
portfolioFit
portfolioRisk
exitIntelligence
```

A single opaque portfolio decision score is explicitly prohibited.

The composed lineage contract carries, where applicable:

```text
securityId
portfolioId
R6 scoreRunId
R7 recommendationRunId
researchProfileCode
methodologyId/version
methodologyRole
assignmentId/version
evidenceSnapshotId
portfolioContextSnapshotId
R8 decisionRunId
```

R8 run identity is deterministic from semantic inputs and is not timestamp-only.
When no R7 run exists, the identity preserves an explicit no-R7 sentinel rather
than fabricating an R7 identity.

## 11. State/reason/blocker taxonomy

C1 freezes:

- R8 overall disposition vocabulary;
- blocker-domain vocabulary;
- canonical base reason-code vocabulary;
- owner-controlled fields;
- prohibited machine-output fields.

Owner-controlled fields include:

```text
portfolioRole
targetPrice
stopLossPrice
targetWeight
minimumAllocation
maximumAllocation
investmentHorizon
freezeMonitoringPreference
```

Prohibited Program C outputs include:

```text
machineGeneratedTargetWeight
machineGeneratedMinimumWeight
machineGeneratedMaximumWeight
exactAddPercentage
exactTrimPercentage
orderQuantity
orderInstruction
opaquePortfolioDecisionScore
```

## 12. Authority registry

`PROGRAM_C_R8_AUTHORITY_REGISTRY_V1` registers all four R8 sub-engines.

Every entry freezes:

```text
executionAuthority = C2_NOT_AUTHORIZED
numericSizingAuthority = NONE
providerAuthority = NONE
aiDecisionAuthority = NONE
persistenceAuthority = NONE
ownerMutationAuthority = NONE
```

This prevents the C1 contract layer from being mistaken for executable R8
decision authority.

## 13. Static architecture audit

Repository diff from the C1 starting HEAD was reviewed.

At the contract-source review point, the diff contains only the nine C1 files
under:

```text
src/features/decision/
```

No migration, Supabase function, provider adapter, persistence repository,
workflow, scheduler, trading path, Dashboard component, Research component or
Holdings component was changed.

Static import review confirms:

- R8 composed contract uses type-only imports from Program B R6/R7 contracts;
- other R8 modules import only local R8 contracts;
- no Angel One import;
- no Trendlyne import;
- no OpenAI import;
- no Supabase import;
- no network fetch import;
- no persistence repository import;
- no scheduler import;
- no brokerage/order execution import.

## 14. Contract test artifact

`r8ContractArchitecture.test.ts` covers:

- exact state vocabularies;
- exactly four dependency-matrix entries;
- R7 independence;
- Core role applicability;
- owner-field protection;
- Portfolio Fit sizing prohibition;
- Risk missing-evidence boundary;
- Exit advisory boundary;
- cross-sector fallback prohibition;
- authority-registry closure;
- deterministic semantic identities;
- identity fail-closed behavior;
- C1 operational safety boundary.

## 15. Executable validation

Owner-local executable validation completed successfully after synchronizing the
Program C branch through commit:

```text
2a248bc300ed70ea143ae37164b5f4674485275e
```

The owner confirmed all required C1 commands passed:

```bash
npm test -- src/features/decision/r8ContractArchitecture.test.ts
npm run typecheck
npm run check:architecture
npm exec eslint -- src/features/decision/*.ts
git diff --check 497006335d4648c7f425691fe8598f9b170ddcd3..HEAD
```

Observed validation state:

```text
R8 contract architecture Vitest = PASS
TypeScript = PASS
PortfolioAI data-boundary architecture guard = PASS
scoped decision-module ESLint = PASS
git diff --check = PASS
```

The only transient issue encountered was Markdown trailing whitespace in this
C1 document. It was documentation-only, corrected in commit
`2a248bc300ed70ea143ae37164b5f4674485275e`, and the final
`git diff --check` passed.

## 16. C1 safety boundary

```text
R8 evaluation executed = NO
portfolio-wide R8 disposition = NO
provider calls = 0
Angel One calls = 0
Trendlyne calls = 0
OpenAI deterministic decision calls = 0
score recomputation = NO
recommendation recomputation = NO
numeric sizing authority = NO
opaque master score = NO
owner-setting mutation = NO
persistence = NO
migration = NO
production mutation = NO
deployment/merge = NO
scheduler mutation = NO
trading = NO
```

## 17. C1 closure and stop point

C1 satisfies its Checkpoint-A exit requirements.

```text
C1 implementation = COMPLETE
C1 static architecture review = PASS
C1 executable validation = PASS
C1 formal closure = COMPLETE / PASS / CLOSED

R8 contract = FROZEN
R8 dependency matrix = FROZEN
R8 portfolio-context snapshot contract = FROZEN
R8 run identity contract = FROZEN
R8 authority registry = FROZEN

R8 execution / C2 = NOT STARTED
C2 authorization = NONE
```

No C2 evaluator, portfolio-wide R8 disposition or UI integration is included in
C1.

The repository must stop here until the owner separately authorizes C2.
