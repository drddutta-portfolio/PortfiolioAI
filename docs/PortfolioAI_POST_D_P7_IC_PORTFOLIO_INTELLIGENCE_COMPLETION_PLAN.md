# PortfolioAI — P7-IC Portfolio-wide Intelligence Completion Remediation

**Working label:** Program E  
**Canonical status:** Post-D convergence remediation/completion checkpoint inside the still-open P7 stage; **not a new feature program**  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Branch:** `PortfolioAI-Development`  
**Date frozen:** 28 September 2026  
**Master authority:** `docs/PortfolioAI_Master_Blueprint.md`  
**Post-D authority:** `docs/PortfolioAI_POST_D_CONVERGENCE_AND_PRODUCT_COMPLETION_PLAN.md`  
**P7 state:** ACTIVE — must remain open until P7-IC completes and Owner Checkpoint 6 is approved  
**P8:** NOT AUTHORIZED  
**Production:** UNCHANGED

---

## 1. Purpose

P7-IC exists to align the research, scoring, recommendation, portfolio-decision and movement capabilities already built through Gates H–K and Programs A–D with the real current portfolio before release-candidate qualification.

It is deliberately a **completion/remediation pass**, not a new research architecture and not a new scoring/recommendation program.

The problem it closes is:

```text
architecture / contracts / reference fixtures exist
                +
portfolio-wide fail-closed dispositions exist
                +
current real portfolio has incomplete methodology/evidence/numeric coverage
                ↓
PortfolioAI cannot yet provide current Core/Satellite and movement intelligence
for the full eligible portfolio
```

The target is:

> Every eligible equity has either a reproducible current assessment through the deepest applicable canonical engine, or an explicit canonical blocker explaining why it cannot yet be assessed.

The target is **not** “force a numeric score for every stock”.

Valid terminal states remain valid:

- `METHODOLOGY_NOT_AVAILABLE`
- `INSUFFICIENT_EVIDENCE`
- `STALE_REQUIRED_EVIDENCE`
- `CONFLICTING_EVIDENCE`
- `REVIEW_REQUIRED`
- `BLOCKED_PREREQUISITE`
- `NOT_APPLICABLE`

No hidden fallback, guessed metric, denominator renormalization, or cross-sector policy borrowing is allowed.

## 1.1 Portfolio-completion doctrine — strengthened 28 September 2026

P7-IC is the portfolio-completion phase for the owner's current held-equity universe. Earlier Gates and Programs may remain historically complete within narrower architecture, reference, fixture or fail-closed scopes, but P7-IC must not carry those historical deferrals forward as unfinished product capability.

For the current held-equity portfolio, the required research hierarchy is:

```text
Sector
  ↓
Industry
  ↓
Basic Industry / Business Model
  ↓
Subprofile where economically required
  ↓
COMPLETE methodology
  ↓
company-specific evidence
  ↓
R6 deterministic scoring
  ↓
R7 recommendation / role candidacy
  ↓
R8 / R9 / Movement / R10 portfolio intelligence
```

A **complete methodology** is not a placeholder adapter and not merely a routing token. It must define, as one coherent versioned contract where applicable:

- required financial and operating evidence;
- required market-history and benchmark evidence;
- applicable vs explicitly N/A metrics;
- scoring dimensions and weights;
- scoring curves / bands / normalization rules;
- business-quality and durability logic;
- industry-appropriate growth logic;
- capital-efficiency and cash-flow treatment;
- leverage / balance-sheet / credit treatment;
- valuation methodology;
- benchmark and peer context;
- ownership / governance treatment;
- momentum and risk treatment;
- cycle normalization where relevant;
- hard blockers and fail-closed rules;
- evidence freshness requirements;
- deterministic R6 scoring semantics;
- complete R7 Core Candidate / Satellite Candidate / Watch / Avoid policy;
- methodology-specific recommendation thresholds / floors / cautions;
- validation/reference stock(s);
- cross-methodology isolation tests;
- future-stock portability rules for the same business model.

The goal is **not** one methodology per Dashboard sector label. Multiple securities may share one methodology only when Industry / Basic Industry / business-model economics justify that shared authority and applicability is explicitly validated.

For a current held equity, `METHODOLOGY_NOT_AVAILABLE` is a **work trigger during IC1**, not a satisfactory IC1 closure result merely because earlier Gate-K scope deferred that business model.

IC1 must attempt to close every methodology gap represented by the current held portfolio. A remaining unresolved equity may proceed beyond IC1 only when the blocker is a genuine unresolved/conflicting company classification or another owner-reviewed factual ambiguity that prevents safe methodology assignment; deferred engineering by itself is not an acceptable final blocker.

No new future "Program F", Gate, or cleanup pass should be required merely to finish methodologies or recommendation policies for business models already present in the current held portfolio.

---

## 2. Why P7 stays open

P7 originally consolidates the product UI. The portfolio-wide intelligence completion pass will create real states that must be presented and validated in:

- Research;
- Intelligence;
- Holdings / Action Center;
- Portfolio Structure;
- selected Dashboard coverage/attention surfaces.

Therefore the correct sequence is:

```text
P7 shell + responsive refinement
        ↓
P7-IC portfolio-wide intelligence completion
        ↓
P7 final UI integration with real outputs
        ↓
Owner Checkpoint 6 browser acceptance
        ↓
P7 COMPLETE / PASS / CLOSED
        ↓
P8 release-candidate qualification
        ↓
P-FINAL convergence closure
```

P7 must **not** be formally closed before P7-IC and final real-data browser acceptance.

---

## 3. Scope and non-goals

### In scope

P7-IC reuses existing authorities:

- R3 research evidence breadth;
- R4 / Gate-K methodology routing;
- R5 market-history breadth;
- R6 deterministic scoring;
- R7 recommendation and sizing readiness;
- R8 Core Health / Portfolio Fit / Portfolio Risk / Exit Intelligence;
- R9 Meaningful Change;
- R10 Action Center;
- existing provider controls, provenance, RLS and owner-authority rules.

It also completes the Master Blueprint Movement Engine as the missing portfolio lifecycle layer.

### Out of scope

P7-IC does not authorize:

- a new universal scoring engine;
- a new recommendation engine;
- universal Pharma thresholds outside Pharma;
- sector-only specialist routing;
- another Dashboard;
- autonomous role mutation;
- autonomous trading;
- production mutation;
- production migration;
- scheduler activation;
- paid AI;
- broad watchlist discovery;
- market-wide stock idea generation;
- replacement-engine expansion beyond existing approved scope;
- P8.

---

## 4. Frozen starting facts

The current Post-D state must be revalidated at P7-IC entry, but the expected starting facts are:

- 248 open holdings;
- 239 equities;
- 9 ETFs;
- P4 portfolio-wide readiness/disposition closed;
- P5 portfolio-wide terminal disposition closed;
- current P5 numeric score coverage recorded as 0 / 239 equities;
- current P5 recommendation coverage recorded as 0 / 239 equities;
- current P5 sizing coverage recorded as 0 / 239 equities;
- methodology resolution historically recorded as 110 resolved / 124 methodology-not-available / 5 review-required / 9 not-applicable;
- R8–R10 engines are implemented;
- current R7 recommendation-policy coverage is narrower than the R6 methodology/routing architecture;
- owner role remains authoritative and must never be silently rewritten;
- P7 is still active.

These are starting expectations, not assumptions. IC0 must verify current repository/database reality before execution.

## 4.1 Frozen operational invariants added 28 September 2026

The following are now mandatory for P7-IC:

1. **Universal stock-page shell**
   - all equity stock pages use the same design shell and navigation;
   - sector / industry / subprofile differences change research content, dimensions, evidence requirements and decision logic, not the basic page design;
   - Pharma subprofiles and other industry-specific methodologies remain content/configuration differences inside the common shell.

2. **Industry/methodology-first research**
   - Sector is macro context;
   - Industry is the minimum micro-methodology selector;
   - Basic Industry / subprofile refines the business model;
   - company evidence feeds the selected methodology;
   - no sector-only specialist fallback and no nearest-looking methodology substitution.

3. **Cache-first provider use**
   - opening Research, Holdings, Intelligence, Dashboard or any stock page must use cached canonical data only;
   - normal browsing must make **zero Trendlyne calls** and zero Angel One historical calls;
   - provider calls occur only through an explicit planned refresh / remediation workflow.

4. **Persist every accepted provider observation**
   - fetched evidence must be written to the Development evidence store with provider/source provenance, raw field/value where retained, normalized value, evidence period/as-of date, retrieval timestamp, freshness/stale boundary, validation state and canonical-selection state;
   - repeated page opens reuse persisted evidence;
   - stale evidence remains visible and is marked stale until refreshed; it is not silently discarded or automatically refetched.

5. **Visible evidence age**
   - user-facing evidence cards must expose the applicable evidence/period date and the last fetched/retrieved date;
   - where a freshness policy exists, the card or its detail view must also expose the fresh-through/stale-after state.

6. **Quota-bounded acquisition**
   - Trendlyne is treated as a constrained evidence provider, not a page-render service;
   - the current planning assumption is a 400-call/day provider ceiling;
   - P7-IC must reserve operating headroom and must not plan to consume the full daily ceiling;
   - the default planning envelope is **320 planned Trendlyne calls/day**, leaving approximately 80 calls for retries, schema diagnostics and exceptions unless the owner explicitly approves another ceiling.

7. **Reference validation is not portfolio completion**
   - one representative stock per methodology/subprofile may be used to validate a methodology or recommendation-policy contract;
   - existing Gate H-K reference validations must be reused wherever still valid;
   - a reference stock can prove methodology behavior but can never substitute for another company's evidence;
   - after methodology validation, every held equity must still receive its own cache/evidence/readiness treatment.

8. **Cohort execution**
   - provider-backed work is performed in bounded daily cohorts generated from the exact missing/stale/conflicting evidence matrix;
   - a rough worst-case planning model of five Trendlyne calls per security implies about 1,195 calls for 239 equities, but this is a ceiling model only;
   - exact call plans must first subtract reusable fresh cache;
   - at a 320-call operational envelope, a nominal five-calls-per-stock cohort is approximately 64 stocks/day, so a full worst-case rollout is expected to require about four provider days plus any remediation/retry work.

9. **Decision output must be evidence-linked**
   - R7 role candidacy remains canonical: CORE_CANDIDATE / SATELLITE_CANDIDATE / WATCH / AVOID or explicit blocker;
   - canonical internal owner-facing action states are `ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`, derived only from canonical R7 + R8 + Movement + current owner role/context + risk/exit state;
   - display copy may render `ACCUMULATE` as “Buy / Accumulate” and `EXIT_REVIEW` as “Sell / Exit Review” where the UI needs plain-language guidance, but `BUY` and `SELL` are not additional internal recommendation/action enums because those terms also identify executed transaction types;
   - this action-language layer is advisory and must never mutate owner settings or execute trades.

---

# 5. Canonical build workflow

```text
IC0  Authority + portfolio coverage freeze
  ↓ owner checkpoint IC-A
IC1  Methodology + recommendation-policy completion
  ↓ owner checkpoint IC-B
IC2  Evidence / market-history remediation plan and bounded acquisition
  ↓ provider execution checkpoints as required
IC3  Current canonical evidence-snapshot materialization
  ↓ owner checkpoint IC-C
IC4  R6 current portfolio scoring execution
  ↓
IC5  R7 recommendation / Core-Satellite candidacy / sizing readiness
  ↓ owner checkpoint IC-D
IC6  R8 + R9 + Movement Engine operationalization
  ↓ owner checkpoint IC-E
IC7  R10 + Research / Intelligence / Action Center UI integration
  ↓
IC-FINAL  Cross-portfolio validation + final P7 browser package
  ↓ Owner Checkpoint 6
P7 CLOSED
  ↓
P8
```

No checkpoint may be skipped because a later UI appears to work.

## 5.1 Checkpoint barrier rule

The checkpoint sequence is globally authoritative.

A bounded security/evidence cohort may progress only through work that is inside the currently approved checkpoint range and must stop before the next unapproved owner checkpoint.

The default interpretation is:

```text
IC-A approved
  ↓
IC1
  ↓
STOP at IC-B

IC-B approved
  ↓
IC2 bounded evidence cohorts
  ↓
IC3 snapshot materialization may be prepared/materialized for completed cohorts
  ↓
STOP at IC-C
  ↓
NO R6 / R7 execution before IC-C approval

IC-C approved
  ↓
IC4 R6
  ↓
IC5 R7 / sizing readiness
  ↓
STOP at IC-D
  ↓
NO IC6 / Movement execution before IC-D approval

IC-D approved
  ↓
IC6 R8 + R9 + Movement
  ↓
STOP at IC-E
  ↓
NO IC7 final integration before IC-E approval

IC-E approved
  ↓
IC7
  ↓
IC-FINAL
  ↓
Owner Checkpoint 6
```

A checkpoint approval is global for the explicitly approved scope; it is not silently recreated per cohort. A rolling multi-stage cohort protocol may be used only if the owner separately and explicitly approves such a protocol.


---

# 6. IC0 — Authority and coverage freeze

## Objective

Establish exact present-tense truth for every open holding before remediation.

## Required work

1. Freeze the exact Development branch commit and Development portfolio identity.
2. Reconcile current holdings:
   - equities;
   - ETFs / non-equity;
   - open / closed.
3. Produce one machine-readable per-security matrix containing at minimum:
   - security identity;
   - asset class;
   - sector / industry / basic industry;
   - methodology/profile resolution;
   - methodology role / assignment version;
   - research evidence readiness;
   - market-history readiness;
   - current canonical evidence snapshot state;
   - R6 state;
   - R7 state;
   - sizing state;
   - R8 state by domain;
   - R9 availability;
   - movement state;
   - R10 state;
   - current owner role;
   - current blocker;
   - next canonical action.
4. Reconcile legacy/reference outputs so none are mistaken for current portfolio facts.
5. Inventory existing persistence:
   - score runs;
   - recommendation runs;
   - evidence snapshots;
   - owner role history;
   - action/decision history;
   - movement/promotion/demotion storage if any.
6. Confirm whether the current schema can support the required multi-period Movement Engine without a new migration.

## Exit criteria

- 248/248 open holdings have an explicit IC0 record.
- 239 equities have an explicit methodology/evidence/R6/R7/R8/R9/R10 status.
- 9 ETFs have explicit non-equity applicability.
- No unknown is silently treated as ready.
- Existing schema/persistence capability is documented.

### Owner Checkpoint IC-A

IC-A must explicitly decide all of the following:

1. **IC1 authority**
   - whether to authorize the strengthened held-portfolio methodology and R7-policy completion scope;
   - IC1 may proceed independently of later provider execution and independently of migration application.

2. **Persistence architecture design authority**
   - whether to authorize design-only work for the additive persistence/access capabilities identified by IC0;
   - design authority does **not** authorize migration creation or migration application.

3. **Migration boundary**
   - if design proves that a migration is required, the exact additive migration must return for separate owner approval before it is created/applied under the repository migration rules;
   - no migration approval is implied by IC-A.

4. **Placement of persistence work**
   - canonical current evidence-snapshot persistence / access required by IC3 must be resolved before IC3 can pass and before IC-C approval;
   - durable R9 baseline / acknowledgement / snooze and durable multi-period Movement history required by IC6 must be resolved before IC6 can pass and before IC-E approval;
   - methodology requirement registries/read models needed for IC2 exact deficit planning must be available before IC2 provider execution.

No provider calls occur in IC0. IC-A approval, when given, does not itself authorize provider calls, migration creation/application, Production changes, or deployment.

---

# 7. IC1 — Methodology and recommendation-policy completion

## Objective

Close the gap between portfolio-wide Gate-K routing and actual executable R6/R7 policy coverage.

## IC1A — Complete R6 methodology coverage for the held portfolio

For every current held equity, resolve:

```text
Sector
  ↓
Industry
  ↓
Basic Industry / Business Model
  ↓
Subprofile where needed
  ↓
complete methodology authority
```

For each equity currently `METHODOLOGY_NOT_AVAILABLE` or `REVIEW_REQUIRED`:

1. Verify sector / industry / basic-industry / business-model authority.
2. Determine whether an existing **complete** approved methodology legitimately applies.
3. If an existing methodology applies, validate applicability to that business model and reuse it.
4. If an existing methodology family applies but its adapter or subprofile contract is incomplete, complete the missing methodology work without weakening the frozen semantics.
5. If no approved methodology exists, **build and validate the complete industry/basic-industry/business-model methodology required for that held-equity business model**.
6. Add a subprofile only where economically necessary; do not create artificial subprofiles merely to mirror display-sector labels.
7. Validate:
   - required evidence contract;
   - metric applicability / explicit N/A treatment;
   - scoring dimensions, weights and curves;
   - quality/durability/growth/capital-efficiency/cash-flow/leverage logic;
   - valuation and benchmark authority;
   - ownership/governance, momentum and risk treatment;
   - cycle normalization where relevant;
   - freshness and fail-closed rules;
   - deterministic R6 behavior;
   - no Pharma metric leakage into Banks;
   - no Bank metric leakage into industrials;
   - no cross-industry methodology leakage;
   - no nearest-sector fallback;
   - no symbol-specific runtime routing;
   - future-stock portability for the same business model.
8. Keep company evidence separate from methodology definition: the methodology says **what evidence is required and how it is interpreted**; IC2 supplies each company's current evidence.

**IC1A completion principle:** a held equity may not remain `METHODOLOGY_NOT_AVAILABLE` simply because methodology work was deferred in Gate K. That state triggers methodology completion work inside IC1.

This does not require fabricated numeric scores. A company can still fail closed later because its required evidence is missing, stale, conflicting or review-required.

## IC1B — Complete R7 recommendation-policy coverage

Inventory every complete R6 methodology/profile/subprofile used by the current held-equity portfolio.

For each one, ensure a complete approved R7 recommendation policy exists.

A complete R7 policy must define, where appropriate:

- `CORE_CANDIDATE` eligibility;
- `SATELLITE_CANDIDATE` eligibility;
- `WATCH` eligibility;
- `AVOID` / blocked conditions;
- overall thresholds where methodology-appropriate;
- mandatory dimension floors;
- caution rules;
- risk interaction;
- valuation interaction;
- governance interaction;
- evidence-confidence/readiness gates;
- methodology-specific role rules;
- fail-closed behavior;
- recommendation lineage/version;
- deterministic reason codes;
- validation/falsification cases.

Important:

- Pharma’s historical `CORE / SATELLITE / WATCH` floors remain Pharma-specific.
- They must not be copied to Banking, IT, Capital Goods, Auto, Chemicals, or any other unrelated methodology.
- Existing `...RECOMMENDATION_PENDING_THRESHOLDS` authorities for methodologies used by current held equities are **IC1 work items**, not acceptable IC1 closure states.
- Every executable held-portfolio methodology must leave IC1 with an approved, testable R7 policy.
- A recommendation may still fail closed later because the company lacks current required evidence; that is an evidence/runtime result, not an unfinished-policy result.

## IC1C — Representative methodology validation strategy

P7-IC must not create unnecessary provider cost by pretending every classification group needs a fresh methodology pilot.

1. Build the exact registry of executable methodology families and subprofiles.
2. Map the portfolio sector / industry / basic-industry groups to those methodology authorities.
3. Reuse already-validated Gate H-K reference stocks when their methodology contract and provider semantics are still current.
4. Select a new representative stock only when:
   - a genuinely new methodology/subprofile is being completed;
   - an adapter/provider semantic contract changed materially;
   - a recommendation policy requires a new falsification/reference case;
   - an existing reference no longer satisfies current evidence lineage.
5. A representative-stock pass validates the **methodology**, not the rest of the portfolio.
6. Once the methodology is frozen, each held equity is processed independently through IC2-IC5 with its own evidence and lineage.

This prevents both extremes: no wasteful new pilot for every display-sector label, and no false assumption that one stock's evidence represents its peers.

## IC1D — Core/Satellite meaning freeze

Freeze common semantics while allowing methodology-specific thresholds:

**Core Candidate**
- durable business quality and growth;
- suitable balance-sheet / cash-flow / capital-efficiency characteristics for that industry;
- acceptable risk;
- valuation not inconsistent with sustainable compounding;
- sufficient evidence confidence.

**Satellite Candidate**
- investable opportunity that does not currently satisfy the required Core durability/quality profile, or whose investment case is intentionally cyclical, turnaround, catalyst, rerating, emerging-growth or momentum-led.

Satellite must never mean “failed Core”.

## Exit criteria

IC1 is a **portfolio-completion gate**, not a documentation-of-deferrals gate.

IC1 may close only when:

1. all 239 current equities have a resolved Sector / Industry / Basic Industry / business-model disposition;
2. every held equity with resolvable classification maps to a **complete** methodology authority;
3. every previously deferred business model represented in the held portfolio has either:
   - been mapped legitimately to an existing complete methodology, or
   - received a newly completed and validated methodology/subprofile;
4. no held equity remains `METHODOLOGY_NOT_AVAILABLE` solely because methodology engineering was deferred;
5. any remaining unresolved equity is a genuine `REVIEW_REQUIRED` factual/classification exception with an explicit owner-visible reason and next action;
6. every complete methodology/profile/subprofile used by held equities has an approved complete R7 policy;
7. no active held-portfolio recommendation authority remains merely `...PENDING_THRESHOLDS`;
8. methodology/reference validation, cross-sector isolation and future-stock portability tests pass;
9. no universal numeric fallback or copied Pharma thresholds are introduced;
10. the exact methodology-to-evidence requirements are machine-readable enough for IC2 to calculate per-security fresh/stale/missing/conflicting evidence deficits and exact provider demand.

**IC1 does not require every stock to have a numeric score yet.** It requires the methodology and recommendation authority to be complete so that IC2 can collect the correct evidence and IC4/IC5 can evaluate the company without another methodology-building pass.

### Owner Checkpoint IC-B

Owner reviews and approves newly required recommendation-policy contracts before portfolio-wide execution.

---

# 8. IC2 — Evidence and market-history remediation

## Objective

Acquire or normalize the evidence required by the approved methodologies without allowing R6/R7 to fetch data themselves.

## Rules

Evidence acquisition remains outside deterministic computation.

Use existing:

- R3 evidence orchestration;
- R5 history mechanisms;
- Program A patterns;
- Trendlyne controls;
- Angel One controls;
- official filings / exchange sources;
- manual verified evidence where allowed.

## Required workflow

For every blocked equity:

```text
methodology requirement
      ↓
exact required metric/evidence contract
      ↓
fresh canonical cache check
      ↓
missing / stale / conflicting evidence list
      ↓
provider/source plan
      ↓
exact cost/call estimate
      ↓
owner approval where required
      ↓
bounded fetch
      ↓
validate provider identity + schema
      ↓
persist raw/provider provenance + normalized evidence
      ↓
set retrieved_at + evidence/as-of date + fresh-through/stale-after state
      ↓
canonical selection / conflict handling
      ↓
recompute readiness
      ↓
prepare/materialize IC3 snapshot for the completed cohort → STOP at IC-C; IC4 R6 and IC5 R7 may execute only after IC-C approval
```

### Cache-first rule

A provider call is not justified merely because a stock page is opened or because the provider has a newer value. Before any Trendlyne call, the planner must determine whether the required evidence is already present, still fresh for the methodology, validated/canonically selected, conflicted, or actually required by that stock's methodology/subprofile.

If the existing evidence is valid and fresh, the planned call count for that item is zero.

### Evidence persistence contract

Every accepted provider observation must preserve enough information to reproduce why the application showed a value:

- security identity;
- provider and provider identity;
- provider source field / endpoint class where available;
- raw provider value/text where retention is lawful and already supported;
- normalized value/unit/currency;
- evidence period type and period/as-of date;
- retrieval timestamp (`retrieved_at`);
- freshness boundary (`fresh_until` or equivalent deterministic stale rule);
- evidence status (verified/provisional/conflicting/review-required/stale/etc.);
- selected vs competing/unselected state;
- normalization/mapping version where applicable;
- immutable provenance/lineage to the acquisition run.

Normal UI reads consume this persistence. They do not call the provider.

### Visible freshness contract

At minimum, stock research cards/details must make the user able to see:

- evidence/period date;
- last fetched/retrieved date;
- current freshness state;
- fresh-through/stale-after date when a deterministic freshness boundary exists.

A stale value may remain visible for continuity, but it must be marked stale and must not silently qualify as current score-ready evidence.

### Cohort priority

Prioritize execution by:

1. owner Core holdings and other positions requiring immediate Core Health/role comparison;
2. largest portfolio weights;
3. holdings blocked by only one/few prerequisites and therefore likely to become R6/R7-ready quickly;
4. remaining Satellite/other held equities;
5. difficult/conflicting/manual-review cases.

This prioritization affects execution order only, not methodology standards.

### Trendlyne daily quota strategy

The provider plan is **portfolio completion by bounded cohorts**, not one stock from each sector and stop.

Planning assumptions:

- hard/current working ceiling: 400 Trendlyne calls/day;
- default P7-IC operating envelope: 320 planned calls/day;
- reserve: approximately 80 calls/day for retries, provider/schema diagnostics, identity exceptions and bounded remediation;
- worst-case planning estimate: 239 equities × 5 calls = 1,195 calls before cache savings;
- nominal five-call stock capacity at 320 planned calls/day: about 64 securities/day;
- nominal worst-case rollout: about four provider days, subject to actual cache reuse and per-methodology call requirements.

Each daily cohort plan must state:

- exact security list;
- methodology/profile for each security;
- fresh cache reused;
- exact missing/stale/conflicting requirements;
- planned Trendlyne calls per security and total;
- planned Angel One/history calls separately;
- retry ceiling;
- daily observed provider usage before execution;
- projected usage after execution;
- reserved headroom;
- stop conditions.

No batch may begin merely from an estimate such as five calls per stock. The executable plan must be based on the exact current cache deficit.

### Progressive downstream execution within checkpoint barriers

Provider work may still be executed in bounded cohorts, but cohorts do **not** bypass owner checkpoints.

After IC-B approval, a completed IC2 cohort may progress only as far as the IC-C boundary:

```text
cohort evidence persisted
      ↓
readiness recomputed
      ↓
IC3 canonical snapshot prepared/materialized for that cohort
      ↓
STOP — awaiting global IC-C approval
```

No authoritative R6 or R7 portfolio execution occurs before IC-C approval.

After IC-C approval, IC4 and IC5 may evaluate the approved current-snapshot universe, but execution stops at IC-D:

```text
IC4 R6 disposition/score
      ↓
IC5 R7 candidacy / sizing readiness
      ↓
STOP — awaiting IC-D approval
```

After IC-D approval, IC6 may run R8 / R9 / Movement, but execution stops at IC-E before IC7.

This retains quota-bounded cohort acquisition and early snapshot materialization without weakening the frozen governance sequence.

## Provider controls

Before each provider-backed batch record:

- provider;
- symbols/cohort;
- exact reason;
- expected calls;
- daily quota impact;
- retry ceiling;
- cost/entitlement;
- stop condition.

No open-ended provider sweep.

### Provider checkpoints

Real Trendlyne / Angel One or other provider execution requires the existing owner/provider authorization rules.

## Exit criteria

Every equity has one of:

- required evidence ready;
- explicit unresolved evidence blocker;
- unresolved methodology blocker;
- review-required conflict;
- not applicable.

---

# 9. IC3 — Current canonical research/evidence snapshots

## Objective

Materialize the current reproducible input boundary required by R6.

For each eligible equity, create or resolve one canonical current snapshot containing:

- security identity;
- classification version;
- methodology/profile;
- methodology role;
- assignment version;
- evidence IDs;
- evidence as-of dates;
- freshness;
- required metric values;
- metric applicability;
- market-history identity where required;
- conflict/review state;
- deterministic snapshot fingerprint;
- as-of date.

Snapshots must preserve null/missing facts.

No reference fixture, old Gate score or historical recommendation may be reused as a current snapshot unless it independently satisfies the current evidence and lineage contract.

## Persistence rule

Reuse existing canonical persistence wherever possible.

If a genuinely new persistence mechanism or migration is necessary, stop and return for separate owner approval before creating/applying it.

## Exit criteria

Every equity has:

- a current score-input snapshot eligible for R6; or
- an explicit canonical reason why one cannot be materialized.

### Owner Checkpoint IC-C

Approve the current-snapshot coverage report before R6 portfolio execution.

---

# 10. IC4 — R6 current portfolio scoring

## Objective

Run the existing deterministic R6 architecture over current canonical snapshots.

## Rules

- cache-only;
- zero provider calls inside R6;
- zero AI numeric influence;
- deterministic replay required;
- exact methodology/version lineage required;
- no missing-input renormalization;
- no cross-sector fallback.

## Required outputs per equity

One of:

- `SCORED`
- `INSUFFICIENT_EVIDENCE`
- `STALE_REQUIRED_EVIDENCE`
- `CONFLICTING_EVIDENCE`
- `REVIEW_REQUIRED`
- `METHODOLOGY_NOT_AVAILABLE`
- `BLOCKED_PREREQUISITE`
- `NOT_APPLICABLE`

For scored equities preserve:

- overall score;
- category scores;
- methodology;
- evidence snapshot;
- run identity;
- reason codes;
- as-of date.

## Exit criteria

- 239/239 equities have a current R6 disposition.
- Numeric coverage is reported separately.
- No score is fabricated to increase the coverage percentage.

---

# 11. IC5 — R7 recommendation, role candidacy and sizing readiness

## Objective

Produce current deterministic investment-role suggestions wherever R6 and the approved policy permit.

## Required R7 recommendation outputs

Where eligible:

- `CORE_CANDIDATE`
- `SATELLITE_CANDIDATE`
- `WATCH`
- `AVOID`

Where not eligible:

- explicit fail-closed state.

### Action projection boundary

IC5 produces the canonical R7 candidacy result and sizing readiness only.

**IC5 does not produce an owner-facing action state.**

The owner-facing action layer requires R8 and Movement inputs that do not exist until IC6. IC5 may expose the prerequisites needed by the later action projection, but it must not emit `ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW` as authoritative current action states.


## Required role comparison

For each eligible holding expose separately:

```text
Owner role
vs
PortfolioAI suggested role
```

Examples:

```text
Owner: SATELLITE
PortfolioAI: CORE_CANDIDATE
=> ROLE_COMPATIBILITY_REVIEW
```

```text
Owner: CORE
PortfolioAI: SATELLITE_CANDIDATE
=> possible demotion review input
```

The engine must never mutate the owner role.

## Sizing

Sizing remains separate from role recommendation.

Use only an approved sizing methodology. If none exists, return the canonical sizing blocker rather than inventing weights.

## Exit criteria

- 239 equities have a current R7 disposition.
- Every scored/recommendable equity has a traceable R7 result.
- Core/Satellite numeric/result coverage is reported separately.
- Owner settings remain unchanged.

### Owner Checkpoint IC-D

Review recommendation-policy execution, Core/Satellite candidacy semantics and owner-authority protection.

---

# 12. IC6 — R8, R9 and Movement Engine operationalization

## Objective

Turn current R6/R7 outputs into portfolio-level health, change and role-transition intelligence.

## IC6A — R8

For each applicable holding run:

- Core Health;
- Portfolio Fit;
- Portfolio Risk;
- Exit Intelligence.

Preserve independent states; do not collapse them into an opaque master score.

Expected Core Health states include:

- `CORE_HEALTHY`
- `CORE_WATCH`
- `CORE_AT_RISK`
- `CORE_DEMOTION_REVIEW`

## IC6B — R9 meaningful change

Use canonical point-in-time evidence/run lineage to distinguish:

- no meaningful change;
- improving;
- deteriorating;
- conflicting;
- newly blocked/unblocked;
- recommendation-role change;
- risk/exit-state change.

Do not confuse daily price movement with thesis/research change.

## IC6C — Movement Engine

Implement the missing Master Blueprint lifecycle using current owner role + R7 + R8 + R9 + historical canonical evidence.

Minimum movement states:

### Core lifecycle

- `CORE_STABLE`
- `CORE_WATCH`
- `CORE_AT_RISK`
- `CORE_TO_SATELLITE_REVIEW`
- `CORE_TO_EXIT_REVIEW`

### Satellite lifecycle

- `SATELLITE_STABLE`
- `SATELLITE_CORE_CANDIDATE`
- `SATELLITE_CORE_PROMOTION_READY`
- `SATELLITE_REVIEW`

### Other applicability

- `NOT_APPLICABLE`
- `INSUFFICIENT_EVIDENCE`
- `REVIEW_REQUIRED`
- `BLOCKED_PREREQUISITE`

## IC6D — Canonical owner-facing action projection

Only after current R7, R8 and Movement authorities exist may PortfolioAI derive a canonical owner-facing action state.

The canonical internal action enum is:

- `ACCUMULATE`
- `HOLD`
- `WATCH`
- `REDUCE`
- `EXIT_REVIEW`

The action state must be a deterministic, methodology-aware, versioned, testable and explainable projection of:

- current R7 candidacy;
- R8 Core Health;
- R8 Portfolio Fit;
- R8 Portfolio Risk;
- R8 Exit Intelligence;
- Movement state;
- current owner role;
- already-authorized portfolio context;
- evidence confidence and hard blockers.

A score alone cannot create an action state. A fail-closed upstream state cannot be converted into a decisive action state.

`BUY` and `SELL` are not internal recommendation/action states because they are transaction/accounting concepts elsewhere in PortfolioAI.

Permitted display copy may include:

- `ACCUMULATE` → “Buy / Accumulate”
- `EXIT_REVIEW` → “Sell / Exit Review”

Display wording must never change the underlying canonical state or imply that an order was placed.

No action state authorizes automatic trading or owner-role mutation.

## Anti-churn contract

The Master Blueprint rules are mandatory:

- price weakness alone cannot demote Core;
- one weak quarter cannot automatically demote Core;
- Core promotion normally requires sustained qualifying evidence over 2–4 quarters;
- exceptional hard thesis breaks may accelerate demotion/review;
- soft deterioration and hard deterioration must be distinguished.

“Sustained qualifying evidence” must be methodology-aware. Do not invent one universal numeric threshold.

## Owner actions

Movement outputs are advisory.

Possible owner decisions:

### Demotion review
- KEEP CORE
- MOVE TO SATELLITE
- MOVE TO REVIEW
- EXIT
- SNOOZE 90 DAYS

### Promotion review
- PROMOTE TO CORE
- KEEP SATELLITE
- WATCH
- REJECT

No role changes occur automatically.

## Persistence / history

The Movement Engine needs reproducible multi-period evidence.

First reuse append-only canonical evidence, score/recommendation lineage and existing owner-decision history.

If existing storage cannot reproduce a 2–4-quarter movement decision, stop for a separate persistence-design approval. Do not silently change the previously frozen R8/R9 persistence policy.

## Exit criteria

- every applicable holding has an R8 disposition;
- R9 change state is available where historical comparison is valid;
- every equity has a movement disposition or canonical blocker;
- every applicable equity has a canonical owner-facing action state or an explicit action blocker after R7 + R8 + Movement are available;
- no automatic role mutation exists;
- replay of the same evidence/history gives the same movement state and action projection.

### Owner Checkpoint IC-E

Approve Movement Engine contracts and owner-decision boundary before UI integration is called final.

---

# 13. IC7 — R10 and final P7 UI integration

## Objective

Expose the completed current intelligence through the existing product shell without creating competing authorities.

## Research

All stocks use one universal design shell. Sector/industry/subprofile differences alter only the research modules, evidence requirements and methodology-specific decision content.

Show:

- current methodology/profile/subprofile;
- current evidence readiness;
- current R6 score when available;
- current R7 recommendation / suggested role when available;
- owner-facing action label when canonically derivable;
- exact blocker when unavailable;
- “why this score/recommendation?” lineage;
- evidence period/as-of date;
- last fetched/retrieved date;
- freshness / stale state and fresh-through date where applicable.

Opening the page must be cache-only and must not itself trigger Trendlyne or Angel One historical calls.

## Intelligence

Show:

- current owner role;
- PortfolioAI suggested role;
- Core Health;
- Portfolio Fit;
- Portfolio Risk;
- Exit Intelligence;
- Meaningful Change;
- Movement state;
- reason/evidence summary.

## R10 Action Center

Surface only canonical attention items, including:

- Core demotion review;
- Satellite promotion candidate;
- Core promotion ready;
- exit review;
- evidence/methodology review;
- owner-role/recommendation tension.

R10 remains the sole Action Center authority.

## Portfolio Structure

Remain the owner-control surface.

Movement recommendations may link here for owner action, but no engine may write the owner role automatically.

## Holdings

May show compact current role / suggested role / attention state, but must consume the same canonical R7/R8/Movement/R10 outputs.

## Dashboard

Dashboard remains an executive overview. Do not duplicate the full Movement or Research workspace.

## Exit criteria

Cross-surface consistency proves:

```text
Research suggested role
=
Intelligence suggested role
=
Holdings suggested role
=
R10 source fact
```

and owner role remains separately visible.

---

# 14. IC-FINAL — Portfolio-wide completion audit

## Required portfolio matrix

For all 248 open holdings record:

- asset class;
- current owner role;
- methodology state;
- evidence state;
- current snapshot state;
- R6 state;
- R6 score if valid;
- R7 state;
- R7 suggested role if valid;
- sizing state;
- R8 Core Health;
- R8 Fit;
- R8 Risk;
- R8 Exit;
- R9 state;
- Movement state;
- R10 attention state;
- UI visibility;
- evidence period/as-of date;
- last fetched/retrieved date;
- freshness state;
- provider calls used by the remediation cohort;
- final blocker;
- last as-of date.

## Required aggregate coverage report

At minimum:

- methodology resolved / blocked / review / N/A;
- current snapshot ready;
- R6 scored;
- R7 recommendation ready;
- Core Candidate;
- Satellite Candidate;
- Watch;
- Avoid;
- R8 evaluated by domain;
- movement evaluated;
- promotion-ready;
- demotion-review;
- explicit blocked states;
- ETF/non-equity not applicable.

## Completion rule

P7-IC may close even if not every equity receives a numeric score or recommendation.

It may close only if:

1. every holding has a current explicit terminal state;
2. all legitimately solvable methodology/evidence gaps in the approved scope were addressed;
3. remaining blockers are real and documented;
4. no current result depends on a fixture/historical reference masquerading as live data;
5. all cross-surface facts agree;
6. owner role was never silently mutated;
7. provider/accounting/production safety boundaries passed;
8. Movement Engine decisions are reproducible;
9. P7 UI consumes the completed authorities.

After IC-FINAL, return to **Owner Checkpoint 6** for final browser acceptance.

Only explicit Owner Checkpoint 6 approval closes P7.

---

# 15. Validation requirements

At each executable checkpoint run the relevant subset; IC-FINAL runs the full set:

- TypeScript;
- architecture guard;
- deterministic engine tests;
- sector/profile isolation tests;
- recommendation-policy tests;
- Movement Engine tests;
- owner-authority mutation regressions;
- cross-surface canonical-fact tests;
- RLS / ownership tests where applicable;
- full main test suite;
- Edge tests;
- ESLint;
- production-equivalent Vite build;
- `git diff --check`;
- secret/crossover scan;
- Development browser validation;
- cache-only page-open regression proving zero provider calls on normal Research/Holdings/Intelligence/Dashboard browsing;
- evidence-card freshness/date display validation;
- bounded-provider-plan tests including daily call ceiling/headroom enforcement.

Required visual/browser widths remain:

- 1440;
- 1280;
- 1024;
- 768;
- 430;
- 390;
- 360.

---

# 16. Stop conditions

Stop and return to the owner if:

- methodology selection is ambiguous;
- a new recommendation policy requires an investment-policy decision not already approved;
- a provider batch exceeds its approved envelope;
- a required provider entitlement/cost is unclear;
- current evidence conflicts materially;
- a new database migration appears necessary;
- Movement Engine persistence requires changing the frozen R8/R9 persistence decision;
- a stock can be scored only by borrowing another industry’s methodology;
- a recommendation can be produced only by copying Pharma thresholds;
- R10 differs between consumer surfaces;
- owner roles would need automatic mutation;
- production action is required;
- a numeric result would require guessed data.

---

# 17. Git and environment discipline

All work remains on:

`PortfolioAI-Development`

Before every checkpoint:

1. inspect local branch / remote branch;
2. protect unrelated uncommitted work;
3. reconcile to the current Development baseline;
4. implement only the active checkpoint;
5. validate;
6. update this plan/status/handoff;
7. commit/push only reviewed files;
8. stop at the next owner checkpoint.

Never commit credentials, backup keys or local secret files.

`main` and Production remain unchanged until separate release authorization after P8.

---

# 18. Canonical governance sequence

```text
P4 = COMPLETE / PASS / CLOSED
P5 = COMPLETE / PASS / CLOSED
P6 = COMPLETE / PASS / CLOSED

P7 = ACTIVE
  ├─ shell/UI consolidation = implemented
  ├─ P7-IC = required before final closure
  │    ├─ IC0 coverage freeze
  │    ├─ IC1 methodology + recommendation policy
  │    ├─ IC2 evidence/history remediation
  │    ├─ IC3 canonical snapshots
  │    ├─ IC4 R6
  │    ├─ IC5 R7
  │    ├─ IC6 R8 + R9 + Movement
  │    ├─ IC7 R10 + UI integration
  │    └─ IC-FINAL
  └─ Owner Checkpoint 6
       ↓
P7 COMPLETE / PASS / CLOSED
       ↓
P8 release-candidate qualification
       ↓
P-FINAL convergence closure
```

There is no canonical P9 in the current Post-D roadmap.

---

# 19. Definition of success

P7-IC succeeds when PortfolioAI can answer, for each eligible holding, with current evidence:

1. **Can this company be assessed with an approved methodology?**
2. **What is its current deterministic score, or why is no score valid?**
3. **Is it currently a Core Candidate, Satellite Candidate, Watch, Avoid, or blocked?**
4. **How does that compare with the owner's current role?**
5. **What is its Core Health / Fit / Risk / Exit state?**
6. **What changed since the prior valid state?**
7. **Is it stable, a promotion candidate, promotion ready, a demotion review, or otherwise blocked?**
8. **What requires the owner's attention in R10?**
9. **What evidence supports the conclusion?**
10. **When was that evidence measured and last fetched, and is it still fresh?**
11. **What canonical owner-facing action state (`ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`) is justified, if any, without bypassing R7/R8/Movement?** The UI may display “Buy / Accumulate” or “Sell / Exit Review” as explanatory copy without creating `BUY`/`SELL` internal enums.
12. **If the company is in the held portfolio, is any remaining limitation caused by a genuine factual/evidence blocker rather than unfinished methodology or recommendation-policy engineering?**

The final investment decision remains with the owner. The application must provide the evidence, deterministic assessment, role candidacy, risk/exit context and traceable reason path needed to make that decision.

---

# 20. IC0 execution record — 28 September 2026

Development was reconciled at `673dcc9ac9acc1a514df3e27a9f2e4b58c15925f`.
The universal Research stock-page shell is verified and locked across the
representative Bank/NBFC, Pharma, Industrials, Auto and specialist Chemicals
families. Methodology content may vary inside the shared shell; it may not fork
the shell without explicit owner UI approval.

The read-only IC0 matrix explicitly classifies 248/248 open holdings (239
equities and 9 non-equities) with zero provider calls, zero database writes,
zero migrations and zero Production changes. The audit found that the current
access paths do not expose per-security methodology evidence counts, and that
durable R9 baseline state and Movement history persistence do not exist.

Therefore `IC0 = BLOCKED`, not PASS. The detailed audit and machine-readable
matrix are recorded in `docs/PortfolioAI_P7_IC0_AUTHORITY_AND_COVERAGE_FREEZE.md`
and `docs/p7-ic/PortfolioAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_2026-09-28.json`.
IC-A is awaiting owner decision; IC1 has not started.
