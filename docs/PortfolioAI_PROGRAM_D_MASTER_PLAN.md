# PortfolioAI — Program D Master Plan
## R11 Scheduled Portfolio Maintenance + R12 Optional AI Investment Committee

**Status:** FROZEN PLANNING AUTHORITY / IMPLEMENTATION NOT YET AUTHORIZED
**Date:** 25 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Program D branch:** `program-d-operations-optional-ai`
**Program D base:** `f7c6cf45e7ec1d1820173addea0e18f38f84a25a`
**Inherited state:** Program C = COMPLETE / PASS / CLOSED
**Authoritative sequence:** `D0 → D1 → D2 → D3 → D4 → D-FINAL`

---

## 1. Executive Summary

Program D operationalizes the closed PortfolioAI deterministic intelligence stack without creating a new investment-decision authority.

Program D contains:

```text
R11 — Scheduled Portfolio Maintenance
R12 — Optional AI Investment Committee
```

The architecture is deliberately subordinate to Programs A–C:

```text
canonical evidence
    ↓
R6 deterministic score
    ↓
R7 deterministic recommendation
    ↓
R8 portfolio decision context
    ↓
R9 meaningful change
    ↓
R10 canonical Action Center
    ↓
R11 operational maintenance around the stack
    ↓
R12 optional explanation of the stack
```

R11 may orchestrate acquisition and recomputation through approved boundaries.
R12 may explain approved deterministic facts.
Neither R11 nor R12 may create new investment authority.

Recommended implementation sequence:

```text
D0       Program D inheritance, dependency, durability and safety freeze

D1       R11 local orchestration implementation
D2       R11 adversarial validation and bounded-pilot readiness
         → R11 closes here

D3       R12 bounded/on-demand implementation — optional
D4       R12 grounding/adversarial validation — optional
         → R12 closes here if authorized

D-FINAL  Program D authorized-scope closure audit
```

R12 is optional. If the owner deliberately defers it:

```text
R11 = COMPLETE / PASS / CLOSED
R12 = OWNER-DEFERRED / NOT ACTIVATED
Program D = COMPLETE / PASS / CLOSED FOR AUTHORIZED SCOPE
```

Program D must never become automated portfolio management.

---

## 2. Continuation Authority and Mandatory Workflow

Every Program D build session — whether performed by ChatGPT, Codex, or another approved development path — must begin by reading, in this order:

1. `docs/PortfolioAI_PROGRAM_D_MASTER_PLAN.md`
2. the latest Program D section of `docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md`
3. the exact current branch and HEAD
4. any checkpoint-specific Program D validation/closure document already created

Repository documents, not chat memory, are continuation authority.

The builder must verify:

```text
branch = program-d-operations-optional-ai
Program C remains frozen
current checkpoint authorization is explicit
no later checkpoint is implicitly authorized
```

The builder must stop when the currently authorized checkpoint is complete.

---

## 3. Program D Purpose

Program D has two purposes.

### R11 — Operations

R11 safely keeps canonical research, market data and deterministic portfolio intelligence current over time.

It owns:

- trigger intake;
- eligibility planning;
- domain orchestration;
- bounded provider acquisition through existing control planes;
- deterministic downstream recomputation;
- operational idempotency;
- leases/concurrency;
- retries/recovery;
- job/checkpoint state;
- cost/budget enforcement;
- audit/observability.

R11 does **not** own investment meaning.

### R12 — Optional AI Investment Committee

R12 optionally explains canonical deterministic state.

It may:

- summarize evidence;
- explain contradictions;
- explain deterministic score/recommendation changes;
- explain R8/R9/R10 state;
- highlight blockers and uncertainties;
- prepare bounded company or portfolio narratives.

R12 does **not** own scoring, recommendation, materiality, Action Center precedence, sizing or trading.

---

## 4. Non-Goals

Program D does not authorize:

- a new investment decision engine;
- a second Action Center;
- a new R6 scoring methodology;
- a new R7 recommendation methodology;
- changes to the R8 dependency contract;
- changes to R9 materiality authority;
- changes to R10 canonical precedence;
- owner-role mutation;
- target/min/max weight mutation;
- target-price or stop-loss mutation;
- hidden numeric sizing;
- promotion of `ADD_REVIEW`;
- promotion of `TRIM_REVIEW`;
- automatic portfolio mutation;
- order generation;
- trade execution;
- provider calls from R6–R10 compute paths;
- blanket nightly full-portfolio recomputation;
- automatic production scheduling;
- unrestricted AI browsing;
- AI investment authority;
- migration, production deployment or branch merge through plan approval alone.

---

## 5. Inherited Authority Matrix

| Capability | Canonical authority |
|---|---|
| Transactions / holdings | Trusted transaction and accounting layer |
| Security/company identity | Canonical security identity |
| Sector / industry / market cap | Reviewed enrichment authority |
| Research evidence facts | Canonical evidence stores and provenance contracts |
| Market history / current price | Approved market-data authority |
| R6 score | R6 deterministic scoring engine |
| R7 recommendation | R7 deterministic recommendation engine |
| R8 decision context | R8 canonical engine |
| R9 meaningful change | R9 canonical engine + materiality registry |
| R10 Action Center | One canonical R10 collection |
| R11 orchestration | Program D operational control plane only |
| R12 AI narrative | Optional interpretation layer only |
| Owner roles / limits / targets | Portfolio owner |
| Provider acquisition | Approved provider adapters/control planes |
| Production activation | Explicit owner approval |
| Trading | No Program D authority |

Permanent inherited invariants:

```text
provider evidence must be accepted before deterministic recomputation
R6-R10 remain provider-free
R10 remains the sole Action Center authority
R9 materiality remains deterministic and versioned
owner fields remain immutable to Program D
ADD_REVIEW remains unpromoted
TRIM_REVIEW remains unpromoted
numeric sizing authority remains absent
AI output cannot become deterministic state
```

---

## 6. Existing Automation / Provider / Scheduler Position

Program D must extend existing infrastructure rather than duplicate it.

Current architectural position to preserve:

- provider controls and kill switches already exist in parts of the research stack;
- Trendlyne budgeting/control infrastructure is reusable;
- provider usage accounting is reusable;
- acquisition leases are reusable where their semantics match;
- market-data operation leases/cooldowns need review/hardening for scheduler use;
- research staleness/domain policies are reusable;
- complete single-security research refresh remains a separate owner-confirmed workflow;
- bounded cohort-refresh patterns are reusable;
- incremental market-history planning is the correct scheduler starting point;
- existing news scheduling remains separate and must not be absorbed into one Program D global cron;
- R6–R10 operational orchestration is new;
- a general durable maintenance/checkpoint layer may be needed;
- a unified operations console is new;
- durable R9 acknowledgement/snooze remains deferred unless separately approved.

No Program D implementation may create a parallel provider budget or lease system where an existing canonical mechanism already fits.

---

## 7. Existing AI Position

An existing recommendation explanation path is a reference capability, not yet full R12.

R12 may reuse:

- owner-authenticated invocation patterns;
- structured deterministic input;
- SHA-256 input hashing;
- cached same-input output;
- provider/model/usage metadata;
- safe failure when AI is unavailable.

R12 must harden beyond the existing reference path:

- versioned R6–R10 fact packet;
- strict schema validation;
- provenance/citation validation;
- unsupported-number rejection;
- prompt-injection resistance;
- explicit deterministic-vs-AI labels;
- bounded cost/concurrency;
- no deterministic dependency on AI availability;
- no implicit portfolio-wide scheduling.

---

# R11

## 8. R11 Architecture

R11 has four conceptual layers:

### 8.1 Trigger Intake

Receives:

- scheduled trigger;
- condition trigger;
- accepted-evidence event;
- owner-context event;
- manual replay;
- bounded pilot trigger.

### 8.2 Eligibility Planner

Determines:

- exact affected scope;
- canonical dependency hashes;
- staleness/eligibility;
- provider requirement;
- provider call plan;
- budget requirement;
- kill-switch state;
- no-op vs work;
- downstream dependency graph.

### 8.3 Domain Executor

Executes only approved boundaries:

- provider acquisition through approved adapters;
- canonical evidence acceptance;
- deterministic R6–R10 execution;
- no investment logic inside orchestration itself.

### 8.4 Operational Ledger

Records operational state:

- trigger;
- work plan;
- semantic idempotency key;
- lease;
- attempt;
- checkpoint;
- provider reservation/usage reference;
- failure/retry;
- downstream emission;
- terminal status.

The operational ledger is not an investment authority.

---

## 9. Dependency-Driven Recompute Contract

R11 must **not** encode a simplistic linear pipeline as its only truth.

D0 must freeze a machine-readable dependency matrix.

Minimum conceptual structure:

| Stage | Canonical dependencies |
|---|---|
| R6 | approved evidence inputs + methodology/profile/assignment versions |
| R7 | valid R6 result + approved R7 policy/profile/assignment dependencies |
| R8 Core Health | exact frozen R8 Core Health dependency set |
| R8 Portfolio Fit | owner/portfolio context + exact frozen Fit dependencies |
| R8 Portfolio Risk | risk evidence + portfolio context + exact frozen Risk dependencies |
| R8 Exit Intelligence | thesis/permanent-loss evidence + exact frozen Exit dependencies |
| R9 | complete frozen R9 observed-state dependency set |
| R10 | R8 + R9 + owner threshold/context dependencies |

Triggers must target dependency changes, not stage names alone.

Examples:

```text
accepted evidence change
    ↓
which dependency hashes changed?
    ↓
recompute only affected deterministic stages
```

```text
owner allocation limits changed
    ↓
R8 Portfolio Fit may change
    ↓
R9 observed state may change
    ↓
R10 may change
```

```text
evidence freshness changed
    ↓
R9 may change even when R8 conclusion does not
```

Unchanged canonical dependencies must result in an audited no-op.

---

## 10. R11 Trigger DAG

Conceptual DAG:

```text
scheduled / condition / event / manual trigger
        ↓
scope + dependency resolution
        ↓
read canonical versions / hashes / policy
        ↓
disabled / unchanged / ineligible / budget-blocked?
        ├── yes → audited skip/no-op
        └── no
             ↓
provider acquisition if required
             ↓
validate + accept canonical evidence
             ↓
recompute only affected deterministic dependencies
             ↓
R6 / R7 / R8 sub-engines as required
             ↓
construct valid R9 current observed state
             ↓
compare against approved previous comparable state
             ↓
R9 semantic result
             ↓
recompute R10 only if R8/R9/owner-context dependency changed
```

No AI sits in this DAG.

---

## 11. R11 Provider-Control Contract

Every provider-backed operation must:

1. recheck global automation enablement;
2. recheck provider enablement;
3. recheck domain policy;
4. compute an exact bounded call plan;
5. reserve bounded budget atomically;
6. acquire the proper lease;
7. allow only approved endpoint/capability contracts;
8. record every physical attempt once;
9. verify provider identity;
10. preserve raw evidence/provenance;
11. promote only accepted canonical evidence;
12. settle used/failed/released budget;
13. release/expire leases safely;
14. stop downstream recomputation unless canonical acceptance succeeded.

Provider acquisition remains upstream of R6–R10.

---

## 12. R11 Scheduling Modes

Program D distinguishes:

- scheduled maintenance;
- event-driven recomputation;
- condition-triggered maintenance;
- owner/manual maintenance.

Recommended modes:

| Domain | Proposed mode |
|---|---|
| Research evidence | scheduled/condition stale-domain planning + bounded execution |
| Market history | incremental scheduled/condition batches |
| R6 | event-driven from canonical dependency change |
| R7 | event-driven from complete R7 dependency change |
| R8 | event-driven by sub-engine dependency matrix |
| R9 | event-driven from complete observed-state dependency change |
| R10 | event-driven from R8/R9/owner-context change |
| News | remain separate under existing independently approved scheduler |
| R12 | on-demand first; optional bounded periodic later |

No global “run everything nightly” scheduler is approved.

---

## 13. D1 Zero-Real-Provider Rule

D1 local implementation must use:

- fixtures;
- mocks;
- local/disposable persistence;
- dry-run provider plans;
- existing adapter contracts without live execution.

Default D1 provider calls:

```text
Trendlyne = 0
Angel One = 0
AI provider = 0
other paid/external provider = 0
```

A real bounded provider pilot belongs to D2 and requires a separate explicit owner authorization with:

- exact securities/domains;
- exact provider;
- exact physical-call ceiling;
- exact budget ceiling;
- manual start;
- post-run review.

---

## 14. Idempotency / Lease / Retry Contract

### Idempotency

Recommended identity:

```text
SHA-256(
  portfolio_id
  + subject/security/domain scope
  + trigger type
  + canonical dependency hash
  + policy version
  + engine version
)
```

Same semantic trigger + same canonical dependencies + same policy must reuse/no-op.

### Leases

At minimum:

- provider lease = provider + operation + bounded scope;
- deterministic-chain lease = portfolio + subject + pipeline generation;
- acquisition must be atomic;
- ownership checked on release;
- active leases cannot be stolen;
- stale lease recovery is explicit/audited.

### Retry

No automatic retry for:

- auth failure;
- authorization failure;
- budget denial;
- kill switch;
- mapping/schema conflict;
- invalid canonical evidence;
- deterministic invalid input;
- authority conflict.

Transient provider/runtime retries are bounded and policy-driven.

Exhausted work becomes review/dead-letter state.

---

## 15. Program D Durability / Restart Matrix

D0 must freeze this before D1.

| Stage/domain | Canonical persistent input today | Durable business output today | Needed after restart? | D0 decision |
|---|---|---|---|---|
| Research evidence | Yes | Yes | Yes | Reuse |
| Market history | Yes | Yes | Yes | Reuse |
| R6 | Audit exact current durability | Audit | Needed if downstream depends on historical run | Freeze |
| R7 | Audit exact current durability | Audit | Needed if downstream depends on historical run | Freeze |
| R8 | Program C non-persistent | No | Evaluate orchestration need | Freeze |
| R9 prior comparable state | Program C non-persistent | No | Required for reliable scheduled comparison unless reconstructable | Freeze |
| R9 meaningful event | No durable authority | No | Optional | Defer unless justified |
| R10 | Program C non-persistent | No | Optional for operational presentation | Freeze separately |
| R12 narrative | Existing limited pattern | Limited | Optional | Bounded contract |

D0 must prove whether a state can be deterministically reconstructed from immutable canonical history before deciding not to persist it.

---

## 16. R9 Durability Decision

Program C closed with:

```text
semantic duplicate suppression = in-memory
durable acknowledgement = NO
durable snooze = NO
cross-session seen/unseen = NO
```

R11 scheduled operation requires a restart-safe answer to:

> What was the last valid comparable semantic R9 observed state?

D0 must choose exactly one approved model.

### Model A — Exact reconstruction

Use only if the previous complete semantic `ProgramCR9ObservedState` can be reconstructed exactly from durable immutable upstream artifacts and versions.

### Model B — Minimal R9 comparison checkpoint

If exact reconstruction is not guaranteed, persist the minimal complete previous comparable semantic observed-state payload plus:

- observed-state identity;
- lineage;
- dependency hash;
- successful processing checkpoint.

Recommendation:

```text
Prefer Model B unless D0 proves Model A is exact and durable.
```

The checkpoint is operational comparison state, not a second R9 authority.

Core R11 must still not add:

- acknowledgement;
- snooze;
- seen/unseen;
- notification-delivery state.

Any schema for this checkpoint requires separate owner authorization.

---

## 17. R10 Last-Known-Good Rule

Program C R10 is non-persistent.

Therefore R11 must not claim:

```text
"R10 retains the last valid deterministic state after restart"
```

unless Program D separately implements an approved durable operational snapshot.

D0 must distinguish:

```text
canonical R10 authority
        ≠
operational cached/snapshotted last-known-good presentation
```

If a durable R10 operational snapshot is proposed:

- it is non-authoritative;
- it must carry exact R10 identity/lineage;
- it must be clearly marked stale when upstream refresh fails;
- it must never replace canonical R10 recomputation;
- it requires separate persistence/schema approval.

Without such a snapshot, failure behavior is:

```text
preserve canonical upstream facts
report operational failure/staleness
do not fabricate a replacement R10 state
```

---

## 18. Failure / Recovery Contract

- accepted evidence is never deleted because a later stage fails;
- partial provider run = PARTIAL, never SUCCESS;
- downstream stages require accepted canonical inputs;
- each completed operational stage records a resumable checkpoint;
- restart resumes from first incomplete eligible stage;
- replay with identical semantic input is no-op;
- R6 failure blocks dependent R7 work;
- R7 failure does not block independent R8 sub-engines unless their frozen dependencies require R7;
- R9 meaningful comparison requires valid current state and approved comparable prior state;
- R10 failure cannot fabricate a substitute state;
- provider failure never removes prior canonical evidence;
- AI failure never affects deterministic availability;
- manual replay creates a new audit record linked to the failed run.

---

## 19. Operational Observability

Create an operations surface separate from investment conclusions.

It should expose:

- queued;
- running;
- no-op;
- succeeded;
- partial;
- failed;
- retry scheduled;
- retry exhausted;
- lease conflict;
- kill switch active;
- budget exhausted;
- stale domains remaining;
- downstream stages triggered/skipped;
- last successful provider refresh;
- last successful deterministic recomputation;
- R9 comparison checkpoint status;
- R10 recomputation status;
- safe failure reason;
- manual replay eligibility.

Investment pages may show compact freshness/health indicators and deep-link into operations detail.

Operational health must never be visually confused with investment state.

---

## 20. Security / Cost / Abuse Controls

Required:

- service-role-only orchestration mutation;
- portfolio/owner scope enforcement;
- secrets only in approved secret stores;
- no credentials/headers/raw prompts/private source bodies in logs;
- global/provider/domain kill switches;
- atomic budgets;
- hard per-run/per-day ceilings;
- concurrency ceilings;
- maximum DAG depth/generation counter;
- downstream event deduplication;
- bounded queue/replay rates;
- canonical input hashing;
- stale-lock expiry with ownership check;
- allowlisted provider capabilities;
- document acquisition size/redirect/SSRF controls;
- immutable operational audit events;
- alert throttling;
- no scheduled owner mutation;
- no scheduled trading.

---

# R12

## 21. R12 Optionality Contract

R12 must be independently disableable.

Allowed rollout states:

```text
DISABLED
ON_DEMAND_ONLY
BOUNDED_PILOT
WEEKLY_SELECTED_SCOPE
```

No portfolio-wide event-driven AI mode is authorized initially.

If R12 is disabled or unavailable:

- R6–R10 remain fully usable;
- no deterministic output changes;
- no R10 item disappears;
- no deterministic job is blocked;
- no recommendation becomes stale because AI narrative is absent.

---

## 22. R12 Deterministic Fact Packet

R12 receives a versioned immutable packet, never unrestricted database/application access.

Minimum packet:

- packet identity/version;
- portfolio/security identity;
- requested narrative type;
- canonical evidence references/provenance;
- R6 state + lineage;
- R7 state + lineage;
- R8 state + lineage;
- R9 comparison/event state;
- R10 canonical Action Center state/precedence;
- owner context explicitly labelled;
- blockers/unknowns;
- contradictions;
- timestamps/freshness;
- approved display-safe excerpts only.

Every input field is typed as:

```text
FACT
DETERMINISTIC_STATE
OWNER_CONTEXT
UNCERTAINTY
SOURCE_EXCERPT
```

AI output is typed only as:

```text
AI_SUMMARY
AI_INTERPRETATION
```

---

## 23. R12 Grounding / Provenance Contract

- Only supplied packet facts may support factual claims.
- Every financial number must exactly match a packet value and provenance reference.
- Missing facts render as unknown/not available.
- Contradictions remain visible.
- Source text is untrusted data, never instructions.
- Prompt construction isolates system rules from source excerpts.
- No free-form provider/web browsing occurs inside R12 generation.
- Citation IDs must resolve to packet evidence.
- Unsupported securities/dates/events/peers/valuations/figures invalidate output.
- AI confidence does not become deterministic confidence.
- Invalid output is rejected, not partially surfaced as authoritative.

---

## 24. R12 Authority-Conflict Rule

R12 may:

- explain why R10 reached its state;
- explain contradictory evidence;
- describe uncertainty;
- formulate monitoring questions.

R12 may **not** propose a competing canonical action/priority.

If AI output:

- contradicts R10 action authority;
- proposes an alternative deterministic priority;
- proposes an unauthorized buy/sell/add/trim/exit instruction;
- overrides R6/R7/R8/R9/R10;

then:

```text
validation_status = REJECTED_AUTHORITY_CONFLICT
```

The invalid narrative must not be shown as a valid Investment Committee conclusion.

This is stricter than merely displaying an AI disagreement beside R10.

---

## 25. R12 Output Contract

Recommended result:

```text
narrative_id
input_packet_hash
prompt_version
provider/model
generated_at
deterministic_state_summary
supporting_evidence[]
contradictory_evidence[]
uncertainties[]
blocked_questions[]
ai_interpretation
monitoring_questions[]
citations[]
validation_status
usage/cost
```

R12 cannot emit authoritative:

- score;
- recommendation;
- materiality;
- Action Center priority;
- quantity;
- target weight;
- exact add/trim percentage;
- order;
- trade instruction.

---

## 26. R12 Invocation / Cost Contract

Initial mode:

```text
ON_DEMAND_ONLY
```

Rules:

- selected security or bounded portfolio brief;
- cached output reused for unchanged packet hash + prompt version;
- hard daily/weekly/per-run/token/cost ceilings;
- one active generation per subject/input hash;
- at most one transient retry;
- timeout = unavailable;
- malformed output = failed;
- unsupported output = failed;
- unchanged semantic packet = skip/no-op.

Optional weekly selected-scope generation may be considered only after D4 and a separate owner gate.

---

## 27. R12 UI

Recommended surfaces:

- Research detail: company-specific explanation;
- R10 Action Center detail: explanation of canonical R10 item;
- R9 meaningful-change detail: explanation of canonical R9 event;
- dedicated Investment Committee workspace: bounded selected reviews/briefs;
- Dashboard: link/status only, not a competing AI Action Center.

Deterministic state must be visually separate from AI prose.

---

## 28. Program D Safety Invariants

1. Provider code cannot enter R6–R10 compute paths.
2. R12 cannot feed R6–R10.
3. R11 cannot mutate owner fields.
4. R11 cannot create numeric sizing authority.
5. R11 cannot trade.
6. R12 cannot create or reprioritize R10 state.
7. Same canonical dependencies + same versions produce the same deterministic output.
8. Unchanged dependencies cause no downstream work.
9. Operational failure preserves canonical facts.
10. Every automated spend is bounded, visible and disableable.
11. News remains independently controlled.
12. Production activation is distinct from implementation completion.
13. Program C remains frozen.
14. R9 comparison durability cannot become a competing materiality authority.
15. R10 operational snapshots, if ever approved, cannot become a competing Action Center authority.

---

# Checkpoints

## 29. Program D Checkpoint Map

| Checkpoint | Purpose | Main output | Validation | Owner gate |
|---|---|---|---|---|
| D0 | Freeze Program D contracts | dependency matrix, durability decision, safety/authority matrices, fixtures | architecture/static contract audit | Required |
| D1 | Build R11 locally | planner/orchestrator/ledger adapters/ops UI using mocks/local only | unit/integration/architecture | Required; separate migration approval |
| D2 | Validate R11 + bounded-pilot readiness | adversarial suite, recovery, dry-run/exact call plans, pilot runbook | zero-unplanned-call proof + full regression | Required before any provider pilot/scheduler |
| D3 | Build bounded on-demand R12 | fact packet, validator, AI boundary, cache/cost controls, UI | local/mocked AI + strict schema/authority tests | Optional; explicit approval |
| D4 | Validate R12 | grounding/injection/cost/failure/adversarial suite | bounded real AI only if separately approved | Optional; explicit approval |
| D-FINAL | Authorized-scope closure audit | final Program D closure record | full regression/security/build/history audit | Required for formal closure |

D-FINAL is an **authorized-scope closure audit**, not production enablement.

---

## 30. D0 — Contract & Safety Freeze

D0 is the first and only checkpoint that may be authorized initially.

D0 must freeze:

- Program D branch/base;
- exact R11 trigger taxonomy;
- complete R6–R10 dependency matrix;
- recomputation rules;
- no-op rules;
- provider-control reuse map;
- global/provider/domain kill-switch contract;
- job identity;
- lease model;
- retry/failure model;
- operational ledger semantics;
- durability/restart matrix;
- R9 reconstruction-vs-checkpoint decision;
- R10 operational snapshot decision;
- operations observability model;
- frozen R11 fixtures;
- R12 optionality;
- R12 fact-packet schema;
- R12 output schema;
- R12 authority-conflict rejection;
- owner approval gates.

D0 may not:

- call providers;
- call AI;
- create/apply migrations;
- activate scheduler;
- modify production;
- merge/deploy;
- mutate Program C.

D0 exit:

```text
all Program D contracts frozen
all persistence questions explicitly resolved or gated
D1 is the only newly eligible implementation checkpoint
```

---

## 31. D1 — R11 Local Implementation

Entry:

- D0 COMPLETE / PASS / CLOSED;
- owner authorizes D1;
- any required schema migration separately authorized before creation/application.

D1 implementation is local and provider-free by default.

Build:

- trigger intake;
- dependency planner;
- semantic no-op planner;
- deterministic job identity;
- leases;
- retry/recovery state;
- operational ledger abstraction;
- downstream event routing;
- operations UI;
- dry-run provider-call planning;
- canonical stage adapters.

D1 provider calls:

```text
0 by default
```

D1 exit:

- local orchestration passes;
- unchanged inputs no-op;
- duplicate triggers dedupe;
- lease contention safe;
- restart/resume safe;
- no production activation;
- no real provider pilot unless separately approved.

---

## 32. D2 — R11 Validation & Bounded-Pilot Readiness

D2 validates R11 against adverse scenarios.

Required:

- trigger determinism;
- semantic idempotency;
- duplicate suppression;
- lease race;
- stale lease;
- kill switches;
- provider budgets;
- bounded retries;
- partial acceptance;
- recovery/resume;
- unchanged-input no-op;
- dependency matrix routing;
- recursive-trigger guard;
- stale-domain-only refresh;
- incremental history planning;
- no owner mutation;
- no trade/order path;
- audit completeness;
- Program C regression;
- R9 baseline semantics;
- R10 authority preservation.

A real bounded provider pilot requires separate authorization inside D2.

R11 may formally close after D2.

---

## 33. D3 — Optional R12 Local Implementation

D3 is not automatically authorized by R11 closure.

Entry:

- R11 closed/stable;
- owner explicitly authorizes R12;
- packet/output schemas frozen;
- AI provider/cost ceiling approved.

Build bounded on-demand R12 only.

No scheduled AI.

---

## 34. D4 — Optional R12 Validation

Required adverse tests:

- exact packet grounding;
- numeric claim verification;
- citation resolution;
- unsupported-fact rejection;
- deterministic-state preservation;
- contradictory evidence;
- prompt injection;
- malformed output;
- AI timeout/unavailability;
- cache/idempotency;
- cost limits;
- authority-conflict rejection;
- no owner mutation;
- no R10 override;
- deterministic system remains available when AI fails.

R12 closes after D4 if authorized and clean.

---

## 35. D-FINAL — Authorized-Scope Closure Audit

D-FINAL may close either:

### Full scope

```text
R11 = COMPLETE / PASS / CLOSED
R12 = COMPLETE / PASS / CLOSED
Program D = COMPLETE / PASS / CLOSED
```

or deliberate R11-only scope:

```text
R11 = COMPLETE / PASS / CLOSED
R12 = OWNER-DEFERRED / NOT ACTIVATED
Program D = COMPLETE / PASS / CLOSED FOR AUTHORIZED SCOPE
```

D-FINAL must verify:

- Program C regressions;
- R11 safety;
- R12 safety if authorized;
- history/branch boundaries;
- data/provider boundaries;
- security/cost controls;
- no owner mutation;
- no sizing authority;
- no trading;
- production state stated precisely;
- all intentional limitations documented.

D-FINAL is not production enablement.

---

## 36. Owner Approval Gates

Separate explicit approval is required before:

1. starting D0 execution;
2. D1 implementation;
3. creating any migration;
4. applying any migration locally;
5. applying any migration remotely;
6. introducing durable R9 checkpoint persistence;
7. introducing durable R10 operational snapshot persistence;
8. any real provider-backed pilot;
9. enabling Trendlyne automation;
10. enabling Angel One automation;
11. enabling automatic R6–R10 recomputation;
12. enabling any scheduler;
13. recurring provider spend;
14. starting R12;
15. any real AI-provider pilot if cost-bearing;
16. scheduled/portfolio-wide AI;
17. notifications;
18. production-readiness declaration;
19. production enablement;
20. merge/deployment;
21. any future trading capability.

One approval never implies another.

---

## 37. Frozen Validation Fixtures

D0 must preserve the closed Program C 238-equity universe for regression continuity and add small versioned Program D fixtures.

R11 fixture cases:

- fresh;
- stale;
- missing;
- conflicting;
- provider disabled;
- global disabled;
- budget exhausted;
- lease occupied;
- partial provider success;
- unchanged input;
- dependency changed;
- downstream failure;
- restart/resume;
- duplicate trigger.

Market history fixture:

- empty;
- partial;
- current;
- gap;
- already complete.

R9 fixture:

- first observation;
- no change;
- raw immaterial change;
- meaningful change;
- incomparable;
- out-of-order.

R12 fixture:

- fully supported;
- contradictory;
- incomplete;
- blocked;
- malicious source text;
- invented number;
- unsupported citation;
- authority-conflicting action;
- timeout/unavailable.

Fixtures are local validation artifacts, not live production state.

---

## 38. Adversarial Matrix

| Threat | Required result |
|---|---|
| Same trigger twice | One semantic execution; duplicate audited no-op |
| Two workers race | One lease winner |
| Trigger recursion | Generation/depth guard stops loop |
| Budget exhausted | Zero provider calls |
| Kill switch changed after queue | Executor rechecks and stops |
| Provider identity changed | Review/fail closed |
| Partial provider response | Accepted valid evidence retained, run partial |
| R6 crash after acquisition | Resume without provider refetch |
| Unchanged canonical dependencies | No downstream recompute |
| Run ID only changed | No R9 meaningful event |
| R9 lacks previous comparable state | Baseline/no-comparable handling |
| Restart loses process memory | R9 exact reconstruction/checkpoint preserves semantics |
| AI invents number | Reject |
| Source excerpt says ignore rules | Treat as data |
| AI proposes action contradicting R10 | REJECTED_AUTHORITY_CONFLICT |
| AI returns trade instruction | Reject |
| AI times out | Deterministic system unaffected |
| Replay storm | Rate/lease/idempotency controls suppress |
| Logs contain secrets | Validation/build fails |

---

## 39. Local vs Production Separation

```text
LOCAL ARCHITECTURE
contracts / fixtures / pure planning

LOCAL VALIDATION
local/disposable persistence, mocked providers, zero production calls

BOUNDED PILOT
explicit owner-approved scope, exact call/cost ceiling, manual start

PRODUCTION READINESS
security, budgets, observability, recovery, runbooks, tests

PRODUCTION ENABLEMENT
separate explicit approval to deploy/migrate/configure secrets/activate schedules
```

Passing D1/D2 does not activate production scheduling.

---

## 40. Branch Strategy

Program C remains frozen.

Program D branch:

```text
program-d-operations-optional-ai
```

Frozen base:

```text
f7c6cf45e7ec1d1820173addea0e18f38f84a25a
```

Reason:

- exact formal Program C closure lineage;
- includes Programs A–C;
- avoids modifying the closed Program C branch;
- current `origin/main` is not assumed to contain the closed lineage.

Program D merge/integration remains separately gated.

---

## 41. Migration Policy

No migration is authorized by this plan.

Policy:

- reuse existing tables where semantics genuinely match;
- do not overload provider-ingestion tables with deterministic orchestration semantics;
- any maintenance ledger, R9 checkpoint or R10 operational snapshot must be justified narrowly;
- migration creation requires explicit owner approval;
- local application requires separate approval;
- remote application requires separate approval;
- never edit applied migrations;
- preserve RLS/service-only mutation/audit history;
- regenerate Supabase types after approved schema change.

---

## 42. Productionization Policy

Program D build does not include:

- merge;
- deployment;
- remote migration;
- production secret setup;
- cron activation;
- provider automation;
- recurring spend;
- scheduled AI;
- notification delivery;
- trading.

Productionization requires a separate plan and owner authorization.

---

## 43. Program D Closure Criteria

Program D may close only when:

- Program C regressions remain green;
- authorized R11 behavior is deterministic, idempotent, bounded and auditable;
- unchanged dependencies produce no work;
- provider acquisition remains outside deterministic compute;
- partial failures/restarts are safe;
- R9 restart semantics are exact;
- any R10 operational snapshot is explicitly non-authoritative;
- R10 remains canonical;
- owner fields remain immutable;
- numeric sizing remains absent;
- operations visibility is adequate;
- R12 is clean for authorized scope or explicitly deferred;
- security/cost/adversarial tests pass;
- production state is stated accurately;
- documentation/handoff are current;
- formal owner closure is explicit.

---

## 44. Intentional Limitations

Program D may close while retaining:

- incomplete numeric R6/R7 coverage;
- blocked/insufficient holdings;
- no numeric sizing policy;
- unpromoted ADD_REVIEW/TRIM_REVIEW;
- no durable R9 acknowledgement/snooze;
- no notifications;
- no broad R12;
- no production scheduler;
- no provider automation;
- no deployment;
- no branch merge;
- no trading.

---

## 45. Explicitly Deferred Work

- autonomous portfolio management;
- automatic owner-role/weight mutation;
- order generation/execution;
- numeric sizing policy;
- durable alert acknowledgement/snooze;
- cross-channel notification delivery;
- AI-created scores/recommendations/materiality/priorities;
- unrestricted AI browsing;
- broad portfolio-wide AI;
- autonomous provider fallback outside approved contracts;
- new provider integrations;
- production deployment/activation.

---

## 46. Program D Status at Freeze

```text
Program C = COMPLETE / PASS / CLOSED

Program D master plan = FROZEN
Program D branch = program-d-operations-optional-ai

D0 = NOT STARTED
D1 = NOT STARTED
D2 = NOT STARTED
D3 = NOT STARTED
D4 = NOT STARTED
D-FINAL = NOT STARTED

R11 = NOT STARTED
R12 = NOT STARTED

Program D implementation = NOT AUTHORIZED
Productionization = NOT AUTHORIZED
Migration = NOT AUTHORIZED
Provider pilot = NOT AUTHORIZED
Scheduler activation = NOT AUTHORIZED
Provider automation = NOT AUTHORIZED
AI activation = NOT AUTHORIZED
Merge/deployment = NOT AUTHORIZED
Trading = NOT AUTHORIZED
```

---

## 47. Recommended Next Authorization

The next authorization should be:

```text
D0 ONLY
```

D0 is contract/audit/freeze work only.

D0 may not execute:

- provider calls;
- AI calls;
- scheduler activation;
- migration creation/application;
- production mutation;
- deployment;
- trading.

After D0 is complete and owner-reviewed, D1 may be separately authorized.

---

# Final Frozen Sequence

```text
Program C
COMPLETE / PASS / CLOSED
        ↓
Program D
        ↓
D0
Contract / Dependency / Durability / Safety Freeze
        ↓
D1
R11 Local Orchestration Implementation
        ↓
D2
R11 Adversarial Validation + Bounded-Pilot Readiness
        ↓
R11 COMPLETE
        ↓
Owner decision on R12
   ┌───────────────┴───────────────┐
   ↓                               ↓
R12 authorized                 R12 deferred
   ↓                               ↓
D3                               D-FINAL
   ↓
D4
   ↓
D-FINAL
```

This document is the single Program D planning authority for ChatGPT and Codex until superseded by an explicitly owner-approved revision.
