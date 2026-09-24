# PortfolioAI — Program C Master Plan
## Portfolio Decision Engines — R8 + R9 + R10

**Status:** FROZEN MASTER PLAN — C0 is the only authorized next checkpoint  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Planning branch at freeze:** `program-a-evidence-coverage`  
**Program B formal-closure baseline:** `6a605f618ab67e3e8ad5d5faa2181796a1f43988`  
**Program C hard cap:** `C0 → C1 → C2 → C3 → C4 → C-FINAL` — **no C5+**  
**Production operational:** `NO`  
**Merge/deployment authority:** `NONE`  
**Trading authority:** `NONE`

> This document is the authoritative Program C continuation contract for both
> ChatGPT and Codex. Before changing Program C code, either agent must read this
> file, the latest appended Program C section of
> `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`, the active checkpoint
> artifacts, and the current branch HEAD. Conversation memory is not sufficient
> continuation authority.

---

## Frozen amendments to the Codex-reviewed Program C plan

The Codex plan below is accepted as the Program C baseline with these six
mandatory amendments. Where wording in the preserved baseline can be read more
broadly, these frozen amendments control.

### Amendment 1 — Program C branch discipline

The functional Program C baseline is the formally closed Program B state:

```text
6a605f618ab67e3e8ad5d5faa2181796a1f43988
```

Before any C1 source implementation, C0 must explicitly establish the Program C
development branch.

Preferred branch:

```text
program-c-portfolio-decision-engines
```

It should be created from the Program C plan-freeze documentation state whose
functional-code parent is the Program B closure baseline above.

This is not a merge to `main` and does not authorize productionization.
Neither Codex nor ChatGPT may silently switch branches during Program C.

### Amendment 2 — R8 dependency matrix is mandatory

C1 must freeze a machine-readable dependency matrix for each R8 sub-engine:

```text
Core Health
Portfolio Fit
Portfolio Risk
Exit Intelligence
```

For each, the matrix must declare:

- mandatory upstream states;
- optional upstream states;
- portfolio-context requirements;
- owner-context requirements;
- evidence requirements;
- applicability;
- blockers;
- whether R7 is actually required.

A missing R7 recommendation must not automatically block an independently valid
R8 Risk or Portfolio Fit assessment unless the frozen dependency contract says
that it is required.

No R8 sub-engine may fabricate a missing upstream fact.

### Amendment 3 — R9 first-observation/baseline semantics are explicit

R9 must distinguish:

```text
first observation
!= no change
!= immaterial change
!= meaningful change
```

C3 must define an explicit baseline/no-comparable-baseline state. Candidate
names include:

```text
BASELINE_ESTABLISHED
NO_COMPARABLE_BASELINE
```

The final names may differ, but the semantics are mandatory.

### Amendment 4 — R9 idempotency is not durable notification state

Initial Program C R9 supports:

```text
deterministic event identity = YES
semantic idempotency = YES
same-input replay stability = YES
```

Initial Program C does not claim:

```text
durable acknowledgement = NO
durable snooze = NO
persistent notification deduplication = NO
cross-session seen/unseen state = NO
```

Those operational/persistence concerns remain deferred.

### Amendment 5 — ADD_REVIEW / TRIM_REVIEW are candidate-only

`ADD_REVIEW` and `TRIM_REVIEW` are not pre-approved canonical R10 states.

They may be promoted only if C4 proves that an already-approved deterministic
upstream authority supports the directional conclusion without inventing
numeric sizing policy.

Otherwise R10 must prefer safer states such as:

```text
RECOMMENDATION_CHANGE_REVIEW
CONCENTRATION_REVIEW
ROLE_REVIEW
PORTFOLIO_FIT_REVIEW
REVIEW_REQUIRED
```

No Program C output may contain quantity, order, exact trade percentage or
machine-generated target weight.

### Amendment 6 — Program C validation universe is frozen in C0

Before portfolio-wide Program C validation, C0 must record:

```text
validation snapshot version
snapshot date
holding count
eligible asset universe
equity/non-equity applicability
source authority
fixture vs current canonical local state
classification snapshot/version
known exclusions
```

The Program B/K5 2026-09-22 frozen fixture may be reused only if C0 explicitly
approves it as the Program C validation universe.

"Portfolio-wide disposition complete" always refers to this frozen,
versioned population.

---

## Fixed Program C checkpoint map

```text
C0       Program C contract freeze + inheritance audit

C1       R8 Contract & Architecture
         Checkpoint A

C2       R8 Execution & Validation
         Checkpoint B
         → R8 closes here

C3       R9 Contract + Execution + Validation
         Checkpoints A+B consolidated
         → R9 closes here

C4       R10 Contract + Execution + Validation
         Checkpoints A+B consolidated
         → R10 closes here

C-FINAL  Program C cross-engine validation and closure
```

This six-checkpoint structure is frozen. No C5+ may be created without explicit
owner-approved replanning.

---

## Current authorization boundary

```text
Gate H–K = COMPLETE / PASS / CLOSED
Program A = COMPLETE / PASS / CLOSED
Program B = COMPLETE / PASS / CLOSED

Program C master plan = FROZEN
Current authorized next checkpoint = C0 ONLY

C1 implementation = NOT AUTHORIZED
R8 execution = NOT AUTHORIZED
R9 = NOT AUTHORIZED
R10 = NOT AUTHORIZED
C-FINAL = NOT AUTHORIZED

Program D = NOT AUTHORIZED
Productionization = NOT AUTHORIZED
Merge/deployment = NOT AUTHORIZED
Scheduler/trading = NOT AUTHORIZED
```

C0 must stop for owner approval before C1.

---

# Preserved Codex Program C baseline plan

The following planning body is preserved as the reviewed baseline from which the
frozen amendments above were derived.


PortfolioAI — Program C: Portfolio Decision Engines
R8 + R9 + R10
Planning document only. No files, code, migrations, commits, provider calls, database mutations, merges, deployments, or production actions were performed.
1. Executive summary
Program C is definitively the portfolio decision-engine program:
Program A = R3 + R5 = Evidence Coverage
Program B = R6 + R7 = Deterministic Portfolio Intelligence
Program C = R8 + R9 + R10 = Portfolio Decision Engines
Program D = R11 + R12 = Operations + Optional AI
Its deterministic chain is:
Canonical evidence
        ↓
R6 score
        ↓
R7 recommendation
        ↓
R8 portfolio decision context
        ↓
R9 meaningful-change detection
        ↓
R10 integrated Action Center
Program C should convert validated stock-level intelligence into portfolio-aware, explainable attention and review states. It must not become a trading, automation, provider-acquisition, numeric-sizing, AI-decision, deployment, or productionization program.
The recommended compact sequence is:
C0       Contract freeze and inheritance audit
C1       R8 contract and architecture
C2       R8 execution and validation
C3       R9 contract, execution and validation
C4       R10 Action Center contract, execution and validation
C-FINAL  Cross-engine validation and Program C closure
Only C0 should be authorized first.

2. Repository/current-state audit
Verified repository state:
Branch: program-a-evidence-coverage
HEAD:   6a605f618ab67e3e8ad5d5faa2181796a1f43988
Canonical status:
Gate H–K = COMPLETE / PASS / CLOSED
Program A = COMPLETE / PASS / CLOSED
Program B = COMPLETE / PASS / CLOSED

Branch merge to main = NO
Production deployment = NO
Production operational = NO
The cumulative handoff and Program B closure documents correctly record formal closure:
[Cumulative handoff (line 5465)](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md:5465)
[Program B final closure (line 1)](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/docs/PortfolioAI_PROGRAM_B_FINAL_CLOSURE.md:1)
The post-Gate-K roadmap explicitly assigns R8–R10 to Program C:
R8 remains required for Core Health, Portfolio Fit, Risk and Exit.
R9 remains required for deterministic meaningful-change detection.
R10 remains required for the integrated Action Center.
See [the post-Gate-K roadmap (line 162)](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/docs/PortfolioAI_POST_GATE_K_ARCHITECTURE_AND_ROADMAP_AUDIT.md:162).
Existing state relevant to Program C
Program B provides deterministic R6/R7 contracts, fail-closed dispositions, and corrected lineage.
Program B’s controlled numeric reference coverage remains narrow.
Its 238-holding disposition uses a frozen 22 September 2026 fixture, not a live portfolio.
R7 has recommendation-ready references but no approved Program B numeric sizing policy.
Existing Dashboard surfaces are read-only readiness/advisory views, not formal R8–R10 engines.
Existing Dashboard components currently contain some page-local heuristics that cannot become canonical Program C logic.
No implemented canonical Core Health, Portfolio Risk, Exit Risk, or Movement assessment tables were found in the active schema.
position_sizing_assessments exists in repository schema architecture but remains a separate D35B concern and is not production-applied.
stock_recommendation_runs contains transition metadata, but this is narrower than the proposed R9 state-transition engine.

3. Canonical Program C scope
Program C owns:
R8 — Portfolio decision context
Core Health for owner-designated Core holdings;
Portfolio Fit;
holding and portfolio-context risk;
Exit Intelligence;
explicit insufficient, blocked, conflicting and not-applicable states;
deterministic, versioned portfolio-context snapshots.
R9 — Meaningful change
before/after comparison of canonical deterministic states;
material changes in evidence, readiness, score, recommendation, assignment, risk, valuation, momentum, concentration, Core Health and Exit Intelligence;
deterministic event identity;
noise suppression using reviewed categorical or numeric rules;
duplicate suppression and replay.
R10 — Combined Action Center
one canonical attention model;
deterministic precedence and conflict handling;
review-oriented outputs;
exact reason and lineage propagation;
shared consumption by Dashboard, Research, Holdings and future Intelligence surfaces.

4. Explicit non-goals
Program C does not include:
branch/main reconciliation;
production schema reconciliation;
merge readiness or deployment readiness;
production validation;
provider acquisition or evidence refresh;
scheduler activation;
automated persistence;
numeric position-sizing policy creation;
target/minimum/maximum portfolio-weight generation;
exact add or trim percentages;
changing owner roles or settings;
AI decision-making;
order creation, brokerage integration or trading;
R11 or R12;
a production operational declaration.
Those belong either to Program D or to a separate future productionization/release track.

5. Existing reusable architecture
R6 and R7
Program C should directly consume:
R6 score readiness and disposition;
immutable R6 score-run lineage;
R7 recommendation readiness and disposition;
exact R7 recommendation-run identity;
research profile;
methodology role;
Pharma assignment identity/version;
as-of and evidence identity;
reason codes and blockers.
Primary reusable modules include:
[programBR6Contract.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/features/research/programBR6Contract.ts)
[programBR6Execution.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/features/research/programBR6Execution.ts)
[programBR7Contract.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/features/research/programBR7Contract.ts)
[programBR7Execution.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/features/research/programBR7Execution.ts)
Portfolio facts
Reusable canonical facts include:
transaction-derived holdings;
open quantity and average cost;
current price/current value;
portfolio weight;
sector and industry;
owner-assigned portfolio role;
themes;
owner target, stop-loss and weight settings.
These must continue through the shared portfolio model and approved repositories.
Existing UI shells
Reusable presentation surfaces include:
[DashboardCoreExitRisk.tsx](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/components/DashboardCoreExitRisk.tsx)
[DashboardRiskConcentration.tsx](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/components/DashboardRiskConcentration.tsx)
[DashboardDecisionLayer.tsx](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/components/DashboardDecisionLayer.tsx)
[DashboardDailyMovement.tsx](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/components/DashboardDailyMovement.tsx)
These are consumer shells, not current canonical R8–R10 authorities.
Existing alerts and recommendations
Reusable inputs include:
owner target/stop threshold state;
persisted recommendation metadata;
recommendation transition state;
stale-market-data flags;
research-coverage state;
canonical sector/role/theme exposure.
D35B
The existing position-sizing engine is relevant as a boundary and lineage example:
[positionSizingEngine.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/features/portfolio/positionSizingEngine.ts)
[D35B contract](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/docs/R1_D35B_Position_Sizing_Engine_Contract.md)
It must remain distinct because its READY path requires reviewed upstream numeric weight guidance that Program B did not approve portfolio-wide.

6. Missing architecture
The following are genuinely missing:
Canonical R8 input/output contracts.
Approved Core Health rules.
Portfolio Fit rules separated from numeric sizing.
Portfolio-context risk rules.
Dedicated Exit Intelligence rules.
Portfolio-context snapshot identity.
R8 deterministic run identity and replay contract.
Canonical observed-state bundle for R9.
Meaningful-change rule registry.
Deterministic transition identity and duplicate suppression.
Canonical R10 attention categories.
R10 precedence and conflict rules.
Shared R10 application view model.
Cross-surface integration replacing page-local action derivation.
Machine-readable canonical-authority entries for R8–R10.
Portfolio-wide fixture/disposition coverage for Program C.
Initial Program C can be completed without persistence or a schema migration.

7. R8 design
R8 structure
R8 should produce one composed assessment containing separate sub-results:
interface R8PortfolioDecisionAssessment {
  identity
  upstreamLineage
  portfolioContext
  coreHealth
  portfolioFit
  portfolioRisk
  exitIntelligence
  overallDisposition
  blockers
  reasonCodes
}
The four sub-results must remain independently inspectable. A single opaque “portfolio decision score” is prohibited.
Core Health
Recommended states:
CORE_HEALTHY
CORE_WATCH
CORE_AT_RISK
CORE_DEMOTION_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
Rules:
Applies formally only when the owner role is CORE.
Owner role is input context, never overwritten.
A non-Core holding receives NOT_APPLICABLE for Core Health, not a fabricated Core state.
Core Health should inspect validated R6/R7 dimensions and approved deterioration indicators.
Missing mandatory domains prevent a positive health state.
Recommendation/role disagreement is surfaced as a reason, not resolved by changing the owner role.
Portfolio Fit
Recommended states:
FIT_SUPPORTED
FIT_NEUTRAL
FIT_TENSION
CONCENTRATION_REVIEW
ROLE_COMPATIBILITY_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
Portfolio Fit may assess:
actual current portfolio weight;
concentration relative to approved limits already configured by the owner;
sector/industry/theme exposure;
owner role compatibility;
duplication only when canonical correlation or overlap evidence exists.
It must not invent target weights, ideal allocations, correlations or diversification thresholds.
Portfolio Risk
Recommended states:
RISK_ACCEPTABLE
RISK_MONITOR
RISK_ELEVATED
RISK_CRITICAL_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
Inputs may include:
validated R6 risk dimensions;
stored volatility and drawdown evidence;
concentration;
liquidity where canonical evidence exists;
sector/theme exposure;
evidence freshness and conflicts.
Absence of risk evidence is not RISK_ACCEPTABLE.
Exit Intelligence
Recommended states:
NO_EXIT_SIGNAL
EXIT_MONITOR
EXIT_REVIEW_REQUIRED
EXIT_RISK_ELEVATED
HARD_EXIT_REVIEW
INSUFFICIENT_EVIDENCE
REVIEW_REQUIRED
BLOCKED_PREREQUISITE
NOT_APPLICABLE
HARD_EXIT_REVIEW remains advisory. It is not a trade instruction.
Exit should be based primarily on thesis/permanent-loss deterioration, not merely price weakness, valuation, or an overweight position.
Portfolio context snapshot
R8 must receive an immutable logical snapshot containing:
portfolio identity;
included holding identities;
quantities and values;
current weights;
classification versions;
owner-role/settings versions or timestamps;
sector/industry/theme exposures;
market-data as-of state;
upstream R6/R7 run identities;
snapshot as-of timestamp;
deterministic snapshot fingerprint.
All financial arithmetic should use exact decimal representation.

8. R9 design
Observed state
An R9 observed state should be a versioned deterministic bundle containing:
R6 state and score-run identity;
R7 state and recommendation-run identity;
methodology/assignment identity;
evidence readiness/freshness;
valuation and momentum state where canonical;
R8 assessment and run identity;
relevant owner-context version;
portfolio-context snapshot identity.
Transition
A transition is any difference between two comparable observed states.
Examples:
score-run changed;
recommendation state changed;
assignment version changed;
required evidence became stale;
blocker appeared or cleared;
risk state changed;
Core Health changed;
Exit Intelligence changed;
concentration context changed.
Meaningful transition
A transition becomes meaningful only through a versioned deterministic rule:
categorical state transition;
newly appearing or clearing blocker;
approved threshold crossing;
approved persistence/duration rule;
material lineage change.
R9 must not create new numeric thresholds casually. Until thresholds are separately reviewed, categorical transitions should be preferred.
Action-worthy distinction
R9 should not decide the final action category.
raw difference       -> R9 observed transition
meaningful transition -> R9 meaningful event
action-worthy state   -> R10 integration decision
Noise suppression
Use:
categorical transition rules;
threshold hysteresis where an approved threshold exists;
minimum persistence/duration where approved;
stable comparison windows;
event deduplication;
same-input replay identity.
AI must not decide materiality.
Event identity
Recommended deterministic identity:
hash(
  securityId
  + portfolioId
  + previousObservedStateId
  + currentObservedStateId
  + changeRuleVersion
)
Replaying the same comparison must produce the same event identity.
Missing, stale and conflicting evidence
These are meaningful transitions in their own right:
fresh → stale;
available → missing;
consistent → conflicting;
blocked → ready;
ready → blocked.
They must not be converted into a synthetic numeric deterioration.
Initial persistence
R9 should initially generate events in memory/read-only fixtures.
Persistence should be deferred until:
event semantics are stable;
deduplication is proven;
acknowledgement/snooze requirements are designed;
an additive append-only schema is separately approved.

9. R10 design
Canonical contract
Recommended structure:
interface R10IntegratedAttention {
  identity
  securityId
  portfolioId
  state
  severity
  reasons
  upstreamLineage
  conflicts
  ownerContext
  generatedAt
}
Recommended attention states
Use review-oriented terms:
NO_ACTION_REQUIRED
MONITOR
REVIEW_REQUIRED
EVIDENCE_REVIEW
THESIS_STRENGTHENING
THESIS_WEAKENING
RISK_REVIEW
CONCENTRATION_REVIEW
ROLE_REVIEW
RECOMMENDATION_CHANGE_REVIEW
ADD_REVIEW
TRIM_REVIEW
EXIT_REVIEW
BLOCKED_PREREQUISITE
INSUFFICIENT_EVIDENCE
NOT_APPLICABLE
ADD_REVIEW, TRIM_REVIEW, and EXIT_REVIEW are advisory review states. They must not contain quantity, order, exact percentage, or execution instructions.
Deterministic precedence
Recommended precedence:
hard safety or thesis-breaking review;
conflicting authoritative inputs;
blocked prerequisite;
insufficient/stale evidence;
elevated exit or risk review;
recommendation change;
concentration or role review;
strengthening/monitoring information;
no action required.
A higher-priority state must retain lower-priority supporting and counter-signals rather than discard them.
Conflicting signals
Examples:
strong R7 recommendation with elevated Exit Intelligence;
recommendation suggests Core candidate while owner role remains Satellite;
positive score trend with stale mandatory evidence;
favourable stock state with severe concentration.
These should normally produce REVIEW_REQUIRED or a more specific review state with an explicit conflict list. Signals must not be averaged into a hidden master score.
Incomplete upstream inputs
R10 must not infer missing R6, R7, R8 or R9 outputs. It should emit a blocked or insufficient disposition with exact upstream blockers.

10. End-to-end lineage model
Minimum lineage:
securityId
portfolioId
asset/classification identity
researchProfileCode
methodologyId/version
methodologyRole
assignmentId/version
evidenceSnapshotId
R6 scoreRunId
R7 recommendationRunId
portfolioContextSnapshotId
R8 decisionRunId
previousObservedStateId
currentObservedStateId
R9 changeEventId
R10 integratedAttentionId
asOf/effective timestamps
contract/rule versions
Rules:
R8 must consume R6/R7 identities unchanged.
R9 must identify exact before and after states.
R10 must carry exact R6–R9 identities.
No downstream stage may reconstruct or fabricate an upstream run identity.
IDs should be deterministic from canonical inputs for initial in-memory execution.
Timestamps must not be used as the sole identity source.
Corrections create a new version; they do not rewrite historical meaning.

11. Portfolio-wide fail-closed model
Every holding must receive an explicit Program C disposition, but not necessarily a positive decision output.
Examples:
valid R6 + valid R7 + complete context
    -> R8 may evaluate

no valid R6
    -> R8/R9/R10 blocked; no recommendation invented

valid R6 but no valid R7
    -> R8 may report evidence/risk context where independently valid
    -> R10 may not fabricate action direction

missing portfolio context
    -> Portfolio Fit/Risk insufficient or blocked

missing comparison baseline
    -> R9 baseline-only / no comparable transition

missing R8 output
    -> R10 blocked

unsupported asset class
    -> explicit NOT_APPLICABLE
Program C success means:
portfolio-wide deterministic disposition complete
It does not mean:
portfolio-wide numeric action coverage complete

12. Owner-control model
Owner-controlled fields remain:
portfolio role;
target price;
stop-loss;
target weight;
minimum/maximum owner weight settings;
investment horizon;
freeze/monitoring preferences;
final investment decision.
R8–R10 may:
read owner settings as context;
compare machine assessments against them;
report agreement or tension;
suggest review.
R8–R10 must not:
update them;
treat a machine suggestion as an owner choice;
silently adopt an R7 suggested role;
modify alert thresholds;
persist machine results into owner-setting columns.
Tests must use a real mock writer/repository boundary proving zero owner-field writes.

13. Numeric-sizing boundary
Program C does not approve numeric sizing.
Allowed:
current-weight observation;
concentration calculation;
comparison with owner-configured limits;
overweight/underweight relative to owner-authored ranges;
portfolio-fit or concentration review;
consumption of a separately approved sizing assessment if one exists.
Not allowed:
invented target weight;
invented min/max range;
exact add/trim percentage;
universal sector sizing rule;
nearest-profile sizing fallback;
activating the D35B READY path with unapproved guidance.
D35B remains a separate engine contract and must not be smuggled into R8 Portfolio Fit.

14. Provider boundary
R8–R10 compute paths must not import or call:
Angel One;
Trendlyne;
provider refresh functions;
evidence acquisition adapters;
network fetch utilities;
provider quota or lease functions.
Missing evidence should produce:
R8/R9/R10 blocker
        ↓
coverage/orchestration gap
        ↓
separately authorized evidence workflow
Normal navigation must remain cache-only and must not trigger provider refresh.

15. Persistence/schema strategy
Initial Program C policy
Output
Initial classification
R8 assessment
Deterministic on-demand
R8 portfolio snapshot
Logical/in-memory snapshot
R9 event
Deterministic on-demand
R10 attention item
Deterministic on-demand
UI projection
Derived from canonical in-memory result
Database persistence
Deferred
Existing schema
position_sizing_assessments is not an R8/R9/R10 store.
stock_recommendation_runs remains R7 authority.
Existing recommendation change_signal cannot substitute for R9.
Planned names in the Database Architecture do not prove implemented tables.
Migration conclusion
Program C can initially close without a migration.
A future persistence proposal would need to justify distinct append-only tables or snapshots, for example:
R8 assessment snapshots;
R9 meaningful-change events;
R10 attention-state history.
Any such proposal requires separate owner approval before creation or application.

16. UI integration strategy
One canonical Program C domain/view model should feed all surfaces.
Dashboard
Reuse the existing shells but replace local decision heuristics:
DashboardCoreExitRisk consumes R8.
DashboardRiskConcentration consumes canonical R8 portfolio context.
DashboardDecisionLayer consumes R10.
DashboardDailyMovement remains a market-movement view and must not be mislabeled R9.
Current presentation-local functions such as advisoryState() and localActions() must not become Program C authorities.
Research
Show security-specific:
R8 sub-results;
R9 latest meaningful changes;
R10 current attention state;
lineage and blockers.
Research must not recompute them.
Holdings
May display concise canonical columns:
Core Health;
Portfolio Fit;
Risk;
Exit Intelligence;
latest meaningful change;
current R10 attention state.
Intelligence / Action Center
One canonical R10 collection should be the authoritative Action Center. Dashboard and Research show projections or summaries of it.
No separate page may implement its own priorities or action taxonomy.

17. Test/validation strategy
Contract tests
exact state vocabularies;
required and optional inputs;
invalid combinations;
lineage completeness;
owner-field immutability;
non-applicable assets;
missing/stale/conflicting data;
no numeric sizing leakage.
Deterministic replay
same canonical input produces byte-equivalent semantic output;
stable run/event IDs;
input order does not change results;
decimal calculations are exact;
comparison windows are explicit.
R8 tests
Core versus non-Core applicability;
healthy/stable/deteriorating cases;
recommendation/owner-role disagreement;
concentration with and without owner limits;
missing risk evidence;
elevated exit evidence;
no exit inference from price weakness alone.
R9 tests
no-change replay;
raw but immaterial change;
categorical meaningful transition;
stale/missing/conflicting evidence transition;
blocker appeared/cleared;
duplicate-event suppression;
out-of-order observations;
incomparable snapshots;
assignment or methodology version change.
R10 tests
deterministic precedence;
conflict preservation;
blocked upstream chain;
review-oriented ADD/TRIM/EXIT states;
no quantity or exact percentage;
no owner-setting writes;
portfolio-wide disposition.
Structural tests
no provider imports;
no AI dependencies;
no trading/order dependencies;
no persistence repositories in initial compute paths;
presentation components consume shared Program C contracts;
canonical authority registry remains accurate.
Regression checks
Program B final suite;
R6/R7 lineage;
Pharma parent + Primary invariant;
Gate K sector isolation;
D35B separation;
Dashboard/Research/Portfolio consistency;
TypeScript;
architecture guard;
scoped lint;
production build;
git diff --check;
repository safety/history scan.

18. Stop conditions
Stop and request owner direction if:
R6/R7 lineage cannot be preserved;
R8 needs to recompute a score or recommendation;
a downstream stage needs to infer missing evidence;
owner settings would need mutation;
numeric sizing must be invented;
a provider call is required in a decision compute path;
AI is required for deterministic logic;
cross-sector or nearest-profile fallback appears;
Pharma classification would be recreated;
deterministic replay fails;
an R9 event cannot identify before/after states;
R10 cannot explain its upstream causes;
persistence becomes necessary;
a migration becomes necessary without separate approval;
production mutation becomes necessary;
scheduler activation is proposed;
trading/order behavior is proposed;
scope expands into R11/R12 or productionization.

19–20. Recommended checkpoint sequence and exit criteria
C0 — Program C contract freeze and inheritance audit
Purpose: Freeze scope, terminology, inherited Program B boundaries and current-state facts.
R-stage mapping: Pre-R8.
Inputs: Program B closure, canonical architecture, roadmap, current code/schema inventory.
Outputs:
frozen Program C master plan;
R6/R7 consumption boundary;
candidate R8/R9/R10 vocabularies;
owner-control and sizing prohibitions;
persistence/provider/UI policies;
stop conditions;
validation matrix.
Likely files if later implemented:
docs/PortfolioAI_PROGRAM_C_MASTER_PLAN.md
cumulative handoff
no source code.
Persistence/provider/UI: None.
Tests: Documentation and repository-consistency audit only.
Exit criteria:
Program C confirmed as R8 + R9 + R10;
source baseline fixed at Program B closure HEAD;
no scope conflict;
existing versus missing architecture documented;
owner approves the frozen plan.
Stop: Any conflict with canonical roadmap or Program B closure.
Next approval: Explicit owner authorization required before C1.

C1 — R8 contract and architecture
Purpose: Define R8 without executing portfolio decisions.
R-stage mapping: R8 Checkpoint A.
Inputs: R6/R7 contracts, portfolio model, owner settings, canonical classification and stored risk/market evidence.
Outputs:
R8 input contract;
four R8 sub-result contracts;
portfolio-context snapshot contract;
state/reason/blocker taxonomies;
run identity;
methodology registry;
canonical authority registration.
Likely modules:
src/features/decision/r8PortfolioDecisionContract.ts
src/features/decision/r8PortfolioContext.ts
src/features/decision/r8CoreHealthContract.ts
src/features/decision/r8PortfolioFitContract.ts
src/features/decision/r8PortfolioRiskContract.ts
src/features/decision/r8ExitIntelligenceContract.ts
Names are planning candidates, not created files.
Persistence: None.
Provider policy: Zero calls/imports.
UI impact: None beyond typed future integration boundaries.
Lineage: Exact R6/R7 and snapshot identity required.
Tests: Contract matrices, invalid-state tests, owner boundary, sizing prohibition, cross-sector isolation.
Exit criteria:
every R8 state has deterministic prerequisites;
missing evidence fails closed;
Core Health applicability is role-correct;
risk and exit are distinct;
no owner mutation or sizing authority;
architecture review passes.
Stop: Unresolved business thresholds or need for schema/provider work.
Next approval: Owner approves R8 contract before C2.

C2 — R8 execution and validation
Purpose: Implement read-only deterministic R8 evaluation.
R-stage mapping: R8 Checkpoint B.
Inputs: Frozen C1 contracts and controlled Program B fixtures.
Outputs:
pure R8 evaluators;
portfolio-context builder;
portfolio-wide disposition;
R8 presentation view model;
controlled UI integration.
Persistence: In-memory/read-only only.
Provider policy: Zero calls.
UI impact: Existing Core/Exit/Risk shells consume canonical R8 outputs.
Lineage: R8 run identity derived from exact upstream and context snapshot.
Tests:
hand-verifiable reference holdings;
Core/non-Core cases;
incomplete upstream cases;
concentration/role disagreement;
replay;
portfolio-wide disposition;
real consumer integration;
owner-write recorder.
Exit criteria:
deterministic replay passes;
every frozen holding receives a disposition;
no fabricated positive coverage;
UI contains no independent R8 calculation;
zero persistence/provider/AI/trading behavior.
Next approval: Owner closes R8 before C3.

C3 — R9 contract, execution and validation
Purpose: Define and execute meaningful deterministic state transitions.
R-stage mapping: R9 Checkpoints A and B combined.
Inputs: Comparable R6/R7/R8 observed states.
Outputs:
observed-state contract;
transition contract;
meaningful-change registry;
event identity;
duplicate suppression;
portfolio-wide change disposition;
R9 presentation model.
Likely modules:
src/features/decision/r9ObservedState.ts
src/features/decision/r9MeaningfulChangeContract.ts
src/features/decision/r9MeaningfulChangeEngine.ts
src/features/decision/r9EventIdentity.ts
Persistence: Deferred; events generated read-only.
Provider policy: Zero calls.
UI impact: Meaningful-change summaries; daily price movement remains separate.
Lineage: Exact previous/current IDs and rule version.
Tests: Replay, idempotency, categorical transitions, threshold boundaries where approved, stale/conflict transitions, duplicate suppression, incomparable snapshots.
Exit criteria:
raw versus meaningful change is explicit;
no AI materiality;
no duplicate event on replay;
all events explain exact before/after causes;
missing baseline returns an explicit baseline state;
no persistence required.
Next approval: Owner closes R9 before C4.

C4 — R10 integrated Action Center
Purpose: Create one canonical deterministic attention model.
R-stage mapping: R10 Checkpoints A and B combined.
Inputs: R6, R7, R8 and R9 canonical outputs plus owner context.
Outputs:
R10 contract;
precedence/conflict rules;
integrated attention collection;
shared application view model;
Dashboard/Research/Holdings integration;
Action Center consumer tests.
Likely modules:
src/features/decision/r10ActionCenterContract.ts
src/features/decision/r10ActionCenterEngine.ts
src/features/decision/r10ActionCenterViewModel.ts
Persistence: Deferred.
Provider policy: Zero calls.
UI impact: Existing Dashboard Action Center becomes a consumer; other surfaces show projections.
Lineage: Exact R6–R9 identity chain.
Tests: Precedence, conflicts, incomplete inputs, cross-surface equivalence, no numeric sizing, zero owner writes, no trading vocabulary.
Exit criteria:
one canonical Action Center authority;
all surfaces render the same attention fact;
conflicts are visible;
action states are review-oriented;
no exact sizing or execution action;
portfolio-wide disposition complete.
Next approval: Explicit owner authorization before C-FINAL.

C-FINAL — Cross-engine closure
Purpose: Validate Program C as one R8→R9→R10 chain.
Inputs: Closed C1–C4 artifacts.
Outputs:
final audit;
closure report;
updated handoff;
explicit intentional limitations.
Persistence/provider/UI: No new behavior.
Tests:
complete C1–C4 suites;
Program B regression;
exact lineage;
deterministic replay;
portfolio-wide disposition;
cross-surface consistency;
structural provider/AI/persistence/trading scan;
owner-authority checks;
architecture guard;
TypeScript;
scoped lint;
build;
diff/history safety checks.
Exit criteria:
R8 = COMPLETE / PASS / CLOSED
R9 = COMPLETE / PASS / CLOSED
R10 = COMPLETE / PASS / CLOSED
Program C = COMPLETE / PASS / CLOSED
Closure remains local-candidate unless a separate release track says otherwise.
Final approval: Explicit owner approval required for formal Program C closure.

21. Owner approval checkpoints
Required approvals:
Approve master plan and authorize C0.
Approve C0 contract freeze before C1.
Approve R8 contract before C2.
Accept R8 closure before R9.
Accept R9 closure before R10.
Authorize C-FINAL after R10 validation.
Explicitly approve formal Program C closure.
Additional approval is mandatory if any migration, persistence, provider call, production operation, scheduler, AI decision, or trading behavior becomes necessary.

22. Handoff/agent-swap protocol
After every completed checkpoint, append—not rewrite—a section to:
docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md
preferably docs/PortfolioAI_PROGRAM_C_MASTER_PLAN.md for frozen plan/status amendments.
Every checkpoint handoff must record:
repository and branch;
exact starting and ending HEAD;
checkpoint status;
files changed;
frozen contracts and versions;
owner decisions;
tests/checks and exact results;
intentional limitations;
outstanding blockers;
stop boundary;
exact next authorized checkpoint;
explicit prohibitions;
local database/repository differences;
migrations created/applied;
provider calls;
persistence;
production effects.
The latest appended section is the continuation authority for Codex or ChatGPT. Historical entries remain audit evidence.

23. Intentional limitations at Program C closure
Program C may close with:
incomplete portfolio-wide numeric R6 coverage;
incomplete portfolio-wide numeric R7 coverage;
no approved numeric sizing policy;
some holdings blocked or insufficient;
no persisted R8/R9/R10 records;
no scheduler;
no provider refresh;
no AI investment committee;
no production deployment;
no branch merge;
no trading.
Portfolio-wide deterministic disposition must nevertheless be complete.

24. What Program C closure WILL mean
Closure will mean:
canonical R8, R9 and R10 contracts exist;
deterministic implementations are validated;
exact upstream lineage is preserved;
portfolio-aware decision context is explicit;
meaningful change is distinguishable from raw change;
one canonical Action Center authority exists;
all holdings receive an explicit disposition;
owner settings remain protected;
incomplete inputs fail closed;
consumer surfaces do not recompute business facts.

25. What Program C closure WILL NOT mean
Closure will not mean:
all holdings have numeric scores or recommendations;
numeric position sizing is approved;
machine output replaced owner decisions;
branch changes are merged;
schema changes are deployed;
production is reconciled;
R8–R10 persistence is enabled;
providers run automatically;
schedules are active;
AI is making decisions;
trading is enabled;
PortfolioAI is production-operational.

26. Relationship to Program D
Program D remains:
R11 = controlled operations and scheduling
R12 = optional AI explanation/synthesis
R11 may later orchestrate already-approved deterministic computations. It cannot weaken Program C readiness or fail-closed rules.
R12 may explain Program C outputs. It cannot:
calculate them;
change their priority;
invent signals;
override owner settings;
create trades.
Program C should expose structured reasons and lineage so R12 can summarize without becoming an authority.

27. Separate productionization/release track
A future release track may cover:
branch/main reconciliation;
migration-ledger reconciliation;
production schema/data comparison;
merge-ready integration;
environment and secret verification;
deployment;
read-only production validation;
rollback and monitoring;
production-operational decision.
That track is outside Program C and requires separate authorization.
Program C must remain portable and correct independent of whether that release track has started.

28. Risks and open questions
R6/R7 real coverage is narrow. Program C must avoid designing only for the two scored Pharma references.
Frozen portfolio fixture. A newer portfolio snapshot may be required for final validation, but acquiring it must remain read-only and separately authorized if production access is involved.
Core Health thresholds are not fully frozen. C1 must distinguish architectural state contracts from profile-specific deterioration rules.
Portfolio Fit can drift into sizing. C1 needs explicit prohibited outputs.
Risk evidence varies by holding. Missing data must remain insufficient, never low risk.
Correlation evidence may not exist canonically. Duplication/correlation logic should remain unavailable until supported.
Current UI contains local heuristics. These must be replaced by domain outputs rather than promoted as R10.
Recommendation transition metadata is not R9. It can be an input but cannot become the full movement engine.
Alert deduplication may eventually require persistence. Initial Program C should prove deterministic event identity without adding a table.
R10 ADD/TRIM wording can be misunderstood. UI language must consistently say “review,” with no quantities or execution affordance.
Legacy D35B can imply numeric authority. Program C must preserve its blocked/unapproved boundary.
Development Status is historically stale in places. C0 should document, but not silently rewrite, authoritative historical distinctions.

29. Recommended first authorized action
After owner approval of this proposed plan, authorize:
C0 only — Program C contract freeze and inheritance audit
C0 should create the frozen Program C master-plan artifact and append the authoritative start checkpoint to the cumulative handoff. It should not implement R8.

Concise stage map
Checkpoint
R-stage
Result
C0
Pre-R8
Scope, inheritance, terminology and safety freeze
C1
R8 Checkpoint A
Core Health/Fit/Risk/Exit contracts
C2
R8 Checkpoint B
Read-only R8 execution and validation
C3
R9 A+B
Meaningful-change contract, execution and validation
C4
R10 A+B
Canonical integrated Action Center and consumers
C-FINAL
R8+R9+R10
Cross-engine audit and owner-approved closure
Final required answers
A. Is Program C definitively R8 + R9 + R10?
Yes.
B. Is production branch/schema reconciliation part of Program C?
No. It belongs to a separate future productionization/release track.
C. Does Program C authorize merge/deployment?
No.
D. Does Program C authorize numeric sizing?
No. Portfolio-fit and concentration assessment are allowed; numeric sizing authority is not.
E. Does Program C authorize trading?
No.
F. Does Program C permit provider calls inside decision compute paths?
No.
G. Does Program C permit AI to create deterministic action decisions?
No.
H. Can Program C close with some holdings fail-closed due to missing upstream data?
Yes. Portfolio-wide disposition must be complete, but numeric/action coverage may remain incomplete.
I. What exact checkpoint should be authorized first?
C0 — Program C contract freeze and inheritance audit.
J. What must remain for Program D after Program C closes?
R11 controlled operations/scheduling and R12 optional AI explanation/synthesis, both separately authorized and downstream of the deterministic Program C outputs.
