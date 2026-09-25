# PortfolioAI — Program C · C-FINAL Cross-Engine Closure Candidate

**Checkpoint:** C-FINAL — Program C cross-engine validation and closure
**Date:** 25 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `program-c-portfolio-decision-engines`
**C-FINAL starting HEAD:** `be79c7bdf2f66e0392804c3502515c228d171c4f`
**Source/audit HEAD before this document:** `14815fbc4ed48c3de2de36788ae9bb274787b518`
**Status:** CANDIDATE IMPLEMENTED / STATIC REVIEW PASS / OWNER-LOCAL EXECUTABLE VALIDATION PENDING / FORMAL PROGRAM C CLOSURE NOT YET APPROVED

## 1. Purpose

C-FINAL is a cross-engine regression and closure audit only.

It introduces no new R8, R9 or R10 decision behavior.

It introduces no:

- scoring methodology;
- recommendation policy;
- sizing policy;
- provider workflow;
- persistence contract;
- migration;
- production operation;
- merge;
- deployment;
- scheduler;
- AI deterministic decision;
- trading behavior.

Its only purpose is to validate the already-closed R8 → R9 → R10 chain as one
Program C system and prepare an owner-reviewable closure candidate.

## 2. Entry conditions

Repository evidence entering C-FINAL:

```text
C0 = COMPLETE / PASS / CLOSED
C1 = COMPLETE / PASS / CLOSED
C2 = COMPLETE / PASS / CLOSED
C3 = COMPLETE / PASS / CLOSED
C4 = COMPLETE / PASS / CLOSED

R8 = COMPLETE / PASS / CLOSED
R9 = COMPLETE / PASS / CLOSED
R10 = COMPLETE / PASS / CLOSED
```

Program B remains:

```text
Program B = COMPLETE / PASS / CLOSED
```

The Program C branch remains:

```text
program-c-portfolio-decision-engines
```

and is not merged to `main`.

## 3. C-FINAL artifacts

Added validation-only artifacts:

```text
src/features/decision/programCFinalClosure.ts
src/features/decision/programCFinalClosure.test.ts

scripts/program-c-final-report.mjs
scripts/program-c-final-static-safety.mjs
scripts/c-final-validate-program-c.sh
```

This document is:

```text
docs/PortfolioAI_PROGRAM_C_FINAL_CLOSURE.md
```

No consumer/UI behavior was added or changed in C-FINAL.

## 4. Final audit contract

`buildProgramCFinalAudit()` validates simultaneously:

1. closed Program B regression;
2. R8 closure regression;
3. R9 closure regression;
4. R10 closure regression;
5. deterministic replay across the Program C chain;
6. exact reference lineage through R8 → R9 → R10;
7. frozen cross-engine lineage by holding;
8. portfolio-wide deterministic disposition completeness;
9. one canonical cross-surface R10 authority;
10. owner-authority preservation;
11. zero provider/AI/persistence/scheduler/trading authority;
12. no numeric-sizing or ADD/TRIM promotion.

Expected invariant:

```text
overallPass = true
```

## 5. Validation universe remains frozen

C-FINAL does not re-freeze or refresh the portfolio universe.

The authoritative Program C validation population remains:

```text
validation universe version =
  PROGRAM_C_VALIDATION_UNIVERSE_V1

source snapshot version =
  K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22

snapshot date =
  2026-09-22

holding count =
  238

asset applicability =
  238 EQUITY
```

This is the same C0-frozen local deterministic fixture.

C-FINAL performs no production read and no provider refresh.

## 6. Cross-engine frozen lineage

C-FINAL validates each frozen holding across:

```text
R8 disposition
    ↓
R9 sourceR8Disposition
    ↓
R9 transition
    ↓
R10 sourceR8Disposition + sourceR9Transition
```

For all 238 frozen rows:

```text
R9.sourceR8Disposition == R8.overallDisposition
R10.sourceR8Disposition == R8.overallDisposition
R10.sourceR9Transition == R9.transitionState
```

This verifies deterministic stage-to-stage lineage even where the fixture must
remain blocked or first-observation-only.

## 7. Exact reference lineage

The controlled reference chain additionally requires:

```text
R9 current observed R8 decisionRunId == supplied R8 decisionRunId

R10 upstream scoreRunId == R8 scoreRunId
R10 upstream recommendationRunId == R8 recommendationRunId
R10 portfolioContextSnapshotId == R8 portfolioContextSnapshotId
R10 R8 decisionRunId == supplied R8 decisionRunId
R10 R9 currentObservedStateId == supplied R9 currentObservedStateId
```

No missing run identity may be reconstructed.

## 8. Deterministic replay

C-FINAL requires deterministic replay for:

- R8 reference validation;
- R9 reference validation;
- R10 reference validation;
- the complete final audit payload.

No random or time-now source is allowed to define deterministic identity.

## 9. Portfolio-wide disposition

All three Program C engines must report complete deterministic disposition over
the same frozen 238-holding population.

C-FINAL requires:

```text
R8 rows = 238
R9 rows = 238
R10 rows = 238

R8 dispositionComplete = true
R9 dispositionComplete = true
R10 dispositionComplete = true
```

This means every frozen holding receives an explicit Program C outcome.

It does **not** mean every holding receives a positive, numeric or actionable
result.

## 10. Cross-surface consistency

The closed R10 authority remains:

```text
actionCenterAuthority = ONE_CANONICAL_R10_COLLECTION
conflictAuthority = EXPLICIT_PRESERVATION_NO_AVERAGING
```

C-FINAL structural checks require Dashboard, Research and Holdings to consume the
same shared R10 hook:

```text
useProgramCR10ActionCenter()
```

No presentation surface may call the R10 decision engine directly.

C-FINAL also rechecks canonical Dashboard consumption for:

- R8 Core/Exit;
- R8 Risk/Fit;
- R9 Meaningful Change;
- R10 Action Center.

## 11. ADD_REVIEW / TRIM_REVIEW remain unpromoted

C-FINAL preserves the C4 decision:

```text
ADD_REVIEW = NOT PROMOTED
TRIM_REVIEW = NOT PROMOTED
numeric sizing authority = NONE
```

The reason remains:

```text
NO_APPROVED_UPSTREAM_DIRECTIONAL_SIZING_AUTHORITY
```

Program C therefore does not generate:

- quantity;
- exact add percentage;
- exact trim percentage;
- machine target weight;
- automatic order;
- trade instruction.

## 12. Owner authority

C-FINAL requires owner fields to remain immutable across R8/R10 writer
regressions and authority registries.

Owner-controlled context remains input only, including:

- portfolio role;
- target weight;
- minimum/maximum allocation;
- investment horizon;
- target price;
- stop-loss price;
- monitoring preferences;
- final investment decision.

Program C may surface review states but may not rewrite owner settings.

## 13. Structural compute-path safety

The C-FINAL static scanner re-audits the complete R8/R9/R10 runtime path and
rejects:

- direct data-repository imports;
- Supabase imports;
- Angel One imports;
- Trendlyne imports;
- OpenAI imports;
- provider acquisition;
- scheduler/brokerage/order repository imports;
- `fetch()`;
- `Date.now()`;
- `Math.random()`;
- insert/update/upsert calls;
- database-style chained deletes.

It also rechecks the Program C presentation/consumer boundaries.

## 14. Full-history repository safety

The C-FINAL runner audits the full Program C branch history from:

```text
d3b8a755885bd4ecc0be37aa59ea46f2eac0ca41
```

It requires:

- the frozen Program C start remains an ancestor of HEAD;
- no merge commit exists inside the Program C development history;
- the active branch is exactly
  `program-c-portfolio-decision-engines`;
- changed files stay within the frozen Program C allowlist;
- no `supabase/migrations/*` changes;
- no `supabase/functions/*` changes;
- no `.github/workflows/*` changes;
- no `src/data/*` changes;
- no deployment configuration changes.

This is a history/repository safety audit only. It does not merge anything.

## 15. Complete executable validation bundle

The authoritative C-FINAL runner executes:

- C-FINAL audit tests;
- C4/R10 tests;
- C3/R9 tests;
- C1/C2 R8 tests;
- Program B final/R6/R7 regressions;
- K5 isolation/routing/portability regressions;
- canonical Program C final report;
- C2 structural-safety regression;
- C3 structural-safety regression;
- C4 structural-safety regression;
- C-FINAL structural-safety scan;
- scoped Program C ESLint;
- Program C full-history allowlist;
- branch/ancestry/no-merge guards;
- TypeScript;
- PortfolioAI architecture/data-boundary guard;
- production Vite build;
- full Program C `git diff --check`.

## 16. Required owner-local command

Run:

```bash
git fetch origin
git switch program-c-portfolio-decision-engines
git pull --ff-only

bash scripts/c-final-validate-program-c.sh
```

The successful terminal ending must include:

```text
PROGRAM C C-FINAL CANDIDATE VALIDATION PASS
R8 = COMPLETE / PASS / CLOSED
R9 = COMPLETE / PASS / CLOSED
R10 = COMPLETE / PASS / CLOSED
Program C closure audit = PASS / AWAITING EXPLICIT OWNER FORMAL CLOSURE APPROVAL
Portfolio-wide deterministic disposition = COMPLETE over frozen 238-holding universe
Numeric sizing / ADD_REVIEW / TRIM_REVIEW authority = NONE
Provider/AI/persistence/production/merge/scheduler/trading authority = NONE
Program C state = VALIDATED LOCAL-CANDIDATE / FAIL-CLOSED WHERE INCOMPLETE
Production operational = NO
Program D = NOT AUTHORIZED
```

## 17. Intentional limitations at closure candidate

A successful C-FINAL may still retain all of the following intentionally:

```text
PORTFOLIO_WIDE_NUMERIC_R6_COVERAGE_NOT_COMPLETE
PORTFOLIO_WIDE_NUMERIC_R7_COVERAGE_NOT_COMPLETE
NUMERIC_SIZING_POLICY_NOT_APPROVED
ADD_REVIEW_NOT_PROMOTED
TRIM_REVIEW_NOT_PROMOTED
SOME_HOLDINGS_FAIL_CLOSED_BLOCKED_OR_INSUFFICIENT
R8_R9_R10_PERSISTENCE_NOT_ENABLED
R9_DURABLE_ACKNOWLEDGEMENT_SNOOZE_NOT_ENABLED
NO_PROVIDER_REFRESH_IN_PROGRAM_C
NO_SCHEDULER
NO_AI_INVESTMENT_DECISION_AUTHORITY
NO_PRODUCTION_DEPLOYMENT
NO_BRANCH_MERGE
NO_TRADING
FROZEN_VALIDATION_SNAPSHOT_IS_2026_09_22_NOT_LIVE_PRODUCTION_STATE
PROGRAM_C_IS_VALIDATED_LOCAL_CANDIDATE_NOT_PRODUCTION_OPERATIONAL
```

These are not C-FINAL defects.

## 18. What a clean C-FINAL will mean

After a clean validator and explicit owner formal-closure approval, Program C
closure will mean:

- canonical R8/R9/R10 contracts exist;
- deterministic implementations are validated;
- exact upstream lineage is preserved;
- portfolio decision context is explicit;
- meaningful change is distinguishable from raw change;
- one canonical Action Center authority exists;
- all frozen holdings receive explicit dispositions;
- owner settings remain protected;
- incomplete inputs fail closed;
- consumer surfaces do not recompute business facts.

## 19. What a clean C-FINAL will not mean

It will not mean:

- all holdings have numeric scores/recommendations;
- numeric sizing is approved;
- machine output replaces owner decisions;
- Program C branch is merged;
- schema changes are deployed;
- production is reconciled;
- R8/R9/R10 persistence is enabled;
- providers run automatically;
- schedules are active;
- AI makes investment decisions;
- trading is enabled;
- PortfolioAI is production-operational;
- Program D is authorized.

## 19A. Owner-local whitespace guard correction

The first owner-local C-FINAL run completed the production build successfully
and reached the final `git diff --check` history guard.

The only reported failure was historical trailing whitespace in the C0 audit
header:

```text
docs/PortfolioAI_PROGRAM_C_C0_CONTRACT_FREEZE_INHERITANCE_AUDIT.md
lines 3-8
```

This was documentation whitespace only. No Program C source, decision rule,
lineage, authority, UI behavior, provider boundary, persistence boundary,
scheduler boundary or trading boundary failed.

The six trailing-space occurrences were normalized without changing document
content or semantics.

Correction commit:

```text
e7f0763a92942cdd587a68b5e7fe322c23c562a4
```

The Vite chunk-size message shown immediately before the whitespace guard was a
non-fatal build warning; the build itself completed successfully.

C-FINAL remains executable-validation pending until the full authoritative
runner reaches its candidate-pass ending.

## 20. Formal closure gate

The frozen master plan requires a separate explicit owner approval after a clean
C-FINAL validation.

Therefore the current state is:

```text
C-FINAL implementation = COMPLETE
C-FINAL static review = PASS
C-FINAL owner-local executable validation = PENDING
C-FINAL formal closure = NOT YET APPROVED

Program C = CLOSURE CANDIDATE / OPEN
Program D = NOT AUTHORIZED
Production operational = NO
```

After a clean local result, stop and request explicit owner approval before
recording:

```text
Program C = COMPLETE / PASS / CLOSED
```
