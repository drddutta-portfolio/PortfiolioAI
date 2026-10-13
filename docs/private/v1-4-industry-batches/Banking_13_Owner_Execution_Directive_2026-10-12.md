# PORTFOLIOAI — CODEX EXECUTION DIRECTIVE
# Complete and Close Banking V1-4

## ROLE AND EXECUTION AUTHORITY

Act as the **Lead Engineer, Banking Research Architect, Data Acquisition Engineer, and Execution Owner** for PortfolioAI.

Your objective is to complete the remaining Banking V1-4 work, eliminate every genuine mandatory blocker across the frozen 13-bank population, verify the operational maintenance system, and close both Banking V1-4 acceptance gates.

**This is an execution authorization, not a request for another audit, planning exercise, or status report.**

The portfolio owner explicitly authorizes you to acquire missing financial, fundamental, historical, regulatory, institutional ownership, ratings, corporate-action, and market-data evidence through the available approved sources.

You may use:

- **Trendlyne API/MCP:** Up to 1,000 calls per day, subject to actual provider entitlement and quota verification.
- **Angel One API:** No additional owner-imposed numerical call ceiling for authorized research acquisition. Respect provider-enforced rate limits, session constraints, and existing operational controls.
- **Official websites:** NSE, BSE, RBI, issuer investor-relations portals, annual reports, quarterly results, stock exchange disclosures, credit-rating agency websites, and regulatory publications.
- **Web scraping:** Authorized where technically and legally permitted, respecting access conditions, robots restrictions where applicable, authentication boundaries and reasonable request rates.
- **Existing data:** Development Supabase, Development Cloudflare R2, retained original documents, historical archives and previously accepted canonical evidence.

**You do not need additional owner approval for routine Development research acquisition, authorized API usage, document extraction, code repairs, testing, or deployment within the established scope.**

However, this authorization does not override protected database migrations, genuine owner-authenticated review requirements, external-provider restrictions, financial methodology approvals, or the existing separate maintenance provider-call ceilings.

Do not invent evidence or manufacture acceptance merely to finish the stage.

---

## 1. ENVIRONMENT AND STARTING POINT

Repository:

`drddutta-portfolio/PortfiolioAI`

Pull Request:

`#124`

Working branch:

`codex/banking-source-remediation`

Last independently verified commit:

`ad4e03b633d186367545859f5b8a849ec6fdac51`

Development Supabase:

`lrgpjimipfkyoqbpsqzz`

Development R2:

`portfolioai-history-dev`

Canonical Development materializer:

`p7-ic2-materialize-readiness`

Before executing, verify the actual current PR HEAD, working tree, migrations, deployed function versions, canonical selections and applicable governance documents.

Read `AGENTS.md` and the governing Scope Freeze B, BANK V2 methodology, research evidence and maintenance contracts in their prescribed authority order.

Continue from the actual remote state. Preserve completed work.

### Hard restrictions

1. Do not change `main` or Production.
2. Do not start V1-5.
3. Do not change the frozen 13-member banking population or frozen holding values.
4. Do not weaken the approved BANK V2 scoring methodology, valuation requirements or weights.
5. Do not bypass safety review, authentication, RLS, source provenance or canonical authorization.
6. Preserve existing accepted evidence and append-only records.
7. Never invent publication times, historical availability, API observations or approval decisions.
8. Do not declare complete until both formal Banking V1-4 gates pass.

---

## 2. CURRENT VERIFIED PROGRESS

The most important development milestone has now been achieved.

### KVB ROA successfully admitted

Karur Vysya Bank:

`KARURVYSYA`

Security ID:

`be55b3cc-0400-45af-84aa-2a95e2c361c5`

FY2025–26 annual standalone ROA:

**1.93%**

Original issuer and RBI evidence has been registered and reviewed through the owner-authenticated pathway.

Accepted ROA review:

`51deb1ef-6105-4180-a139-30619ed6f5da`

Persisted snapshot:

`3a3eefc3-1999-47d5-bb3e-6bd4f38e35c6`

The Development database was independently queried and confirmed:

`ROA_ANNUAL = FRESH`

Validator reason:

`REVIEW_SUPPLEMENTS_CANONICAL_SERIES`

The successful execution also demonstrated:

- Original-source registration.
- Owner-authenticated review.
- Canonical validation.
- KVB-scoped single-use grant issuance and consumption.
- Replay rejection with `P4_GRANT_ALREADY_USED`.
- Successful materialization.
- Independent persisted snapshot readback.

**Do not reacquire or reapprove KVB's annual ROA. Preserve this result.**

### Successful verification

Banking Full Verification:

https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38165920397

Full Verification and Architecture Guard passed on commit `ad4e03b6`.

### Current KVB blockers

The original four financial/valuation blockers have been reduced to three:

1. `NIM_TTM`
2. `PE_TTM_RELATIVE`
3. `PB_RELATIVE`

A fresh canonical evaluation also identified five stale market-history requirements.

Therefore, the latest reported KVB state is:

**8 total mandatory blockers: 3 financial/valuation + 5 market-history.**

KVB remains:

`REVIEW_REQUIRED`

Banking-wide readiness remains:

**0/13 READY, ₹0 READY frozen value.**

### Historical evidence already obtained

KVB has 60 source-linked monthly price observations from October 2021 through September 2026.

The 36 later months were extracted from credentialed R2 archives.

Successful extraction run:

`38156445608`

Artifact:

`11708890282`

The preceding 24 months have independently retained NSE source records.

**Do not rerun completed archive discovery or historical extraction without a demonstrated integrity issue.**

However, 60 prices are not equivalent to 60 admitted PIT P/E or P/B observations.

---

## 3. ACCEPTANCE CRITERIA

Banking V1-4 is complete only if both gates pass.

### GATE A — Research and canonical readiness

All 13 frozen banks must have independently verified persisted `READY` selections.

The frozen READY value must reconcile to:

**₹2,05,138.62**

Every mandatory requirement must satisfy the approved BANK V2 evidence contract.

The 13 banks are:

| Bank | Symbol |
|---|---|
| Bank of Baroda | BANKBARODA |
| ICICI Bank | ICICIBANK |
| State Bank of India | SBIN |
| Federal Bank | FEDERALBNK |
| Karur Vysya Bank | KARURVYSYA |
| Kotak Mahindra Bank | KOTAKBANK |
| HDFC Bank | HDFCBANK |
| Axis Bank | AXISBANK |
| IDFC FIRST Bank | IDFCFIRSTB |
| Bandhan Bank | BANDHANBNK |
| IDBI Bank | IDBI |
| Indian Bank | INDIANB |
| AU Small Finance Bank | AUBANK |

Preserve AUBANK's approved Small Finance Bank-specific treatment.

### GATE B — Operational maintenance

Prove that the approved Development maintenance system works on a genuine eligible OPEN NSE session.

Verify scheduled dispatch, market calendar, grants, provider accounting, freshness, persistence, failure isolation, idempotency and application effective-readiness behavior.

A successful test or weekend CLOSED-session run does not establish Gate B.

---

## 4. FIRST EXECUTION PRIORITY — CLEAR KVB MARKET-HISTORY STALENESS

KVB has five market-history requirements marked STALE.

Inspect the latest selected KVB snapshot and identify the exact five requirements and their current reason codes.

The historical requirements previously include price momentum, relative strength, maximum drawdown and relative volatility.

Determine whether the cause is:

- Missing completed NSE sessions.
- Provider publication delay.
- Incorrect market calendar.
- Unavailable benchmark history.
- Stale captured source.
- Adjusted versus unadjusted series conflicts.
- Genuine missing market data.
- A validator/materializer bug.

Use the corrected approved NSE completed-session calendar, including weekends, holidays, special sessions, provider availability delays and genuine stale-session handling.

### Execution

1. Inspect the actual required evaluation and source cutoffs.
2. Identify the precise missing stock or NIFTY_BANK benchmark sessions.
3. Reuse valid existing stock and benchmark history.
4. Acquire only genuinely missing eligible data.
5. Verify candles, exact exchange identity, chronological ordering and approved adjustment treatment.
6. Respect provider source mapping and immutable capture requirements.
7. Run canonical validation.
8. Materialize through authorized Development controls.
9. Independently read back all five requirements.

Do not change the freshness rules merely to reduce the blocker count.

### Provider accounting

The owner authorizes broad research acquisition, but the **existing scheduled maintenance limit remains 14 history calls per day**, with zero automatic paid retries and shared NIFTY_BANK acquisition.

Do not silently override that maintenance limit.

If a separate discretionary historical research batch is explicitly supported by the governing contract, it may use the expanded authorization without masquerading as scheduled maintenance. Track and report it separately, and do not bypass provider terms or operational budgets.

### Deliverable

Reduce KVB's stale market-history blockers through genuine validated evidence wherever possible.

Report each requirement's before/after state.

---

## 5. SECOND PRIORITY — COMPLETE KVB HISTORICAL P/E AND P/B

The approved requirements are:

`PE_TTM_RELATIVE`

`PB_RELATIVE`

Both currently lack sufficient admitted historical point-in-time valuation evidence.

### Required historical contract

- Trailing 60 months.
- At least 36 admitted observations.
- At least six observations within each 12-month bucket.
- No gap longer than six consecutive months.
- Correct point-in-time publication/availability.
- Compatible accounting scope, share basis and corporate actions.

Do not change the approved valuation model, weights, scoring or thresholds.

### Step 1 — Prove a complete PIT sample

Before scaling, select representative months:

- Early historical observation.
- Middle historical observation.
- Recent historical observation.
- Observation before the KVB 26 August 2025 1:5 bonus.
- Observation after that bonus.

For each candidate month, obtain and qualify:

1. Original eligible exchange price.
2. Correct stock identity and ISIN.
3. Exact exchange session date.
4. Adjusted or unadjusted price basis.
5. Original issuer quarterly or annual disclosure.
6. Historical publication date or independently proven availability.
7. Four eligible quarterly EPS components or approved TTM earnings evidence.
8. Eligible BVPS or underlying equity and share-count evidence.
9. Accounting scope.
10. Effective bonus, split or other corporate actions.
11. Immutable source references.
12. Actual validator acceptance.

Qualify P/E and P/B independently.

**Do not extrapolate later restated fundamentals backward.**

A historical company disclosure acquired today may be used if its original publication or historical availability is independently proven.

A provider's present-day historical display is insufficient by itself to establish historical availability.

### Step 2 — Build reusable effective-date intervals

A properly published quarterly or annual financial disclosure may support subsequent monthly valuation observations until superseded, subject to the approved contract.

Avoid treating every month as requiring a different issuer disclosure.

Acquire original financial statements once, establish the historically valid availability interval, and join them to the already retained monthly prices.

### Step 3 — Scale to accepted coverage

Construct monthly evidence with source provenance.

Report separately:

- Price rows.
- Financial observations acquired.
- PIT-qualified observations.
- Canonically admitted observations.
- P/E accepted months.
- P/B accepted months.
- Annual-bucket coverage.
- Longest missing run.
- Rejection reasons.

Run the actual validator and materializer.

Do not declare valuation coverage complete until the requirement-level results are `FRESH` and persisted.

---

## 6. THIRD PRIORITY — RESOLVE NIM_TTM

KVB's remaining direct financial requirement is:

`NIM_TTM`

Perform a bounded, targeted search for directly certified trailing-four-quarter NIM using:

- Official KVB investor presentations.
- Quarterly results.
- Annual reports and financial schedules.
- NSE/BSE disclosures.
- Trendlyne.
- Other permitted original-source financial publications.

Distinguish:

- Annual NIM.
- Individual quarterly NIM.
- Year-to-date NIM.
- Trailing-four-quarter NIM.

Annual NIM must not automatically be substituted for TTM NIM.

Do not average four quarterly NIM percentages.

### If a direct TTM source exists

Verify the relevant exact period, numerator, denominator, accounting scope and disclosure availability.

Register the source through the proven authenticated original-source ingestion pathway.

Complete owner or approved delegated review, canonical validation and materialization.

### If direct TTM evidence is unavailable

Do not repeat the same search indefinitely.

Produce one precise methodological feasibility decision covering:

- Four-quarter net interest income.
- Eligible quarterly or daily average earning assets.
- Annualization convention.
- Non-identical quarterly day counts.
- Consolidation scope.
- Source requirements.
- Exact derivation.
- Reconciliation against issuer-disclosed reference periods.
- Edge cases and acceptance tests.

Keep a derived NIM model inactive until separately approved.

Do not modify methodology or claim `FRESH` from an unauthorized approximation.

Continue independent banking requirements rather than blocking everything behind NIM.

---

## 7. FOURTH PRIORITY — EXTEND THE PROVEN PATH TO ALL 13 BANKS

Do not wait for KVB's last three financial requirements before working on independent evidence gaps at the other 12 banks.

Use the current canonical selected snapshots to identify each bank's actual mandatory blockers.

Build a compact internal requirement-level execution ledger.

For each required item record:

- Symbol.
- Requirement code.
- Current state.
- Validator reason code.
- Required source or repair.
- Available accepted evidence.
- Acquisition action.
- Provider requests.
- Source record.
- Qualification result.
- Review status.
- Canonical materialization status.

### Reuse accepted data

Preserve previously accepted:

- Gross and net NPA.
- Capital adequacy.
- CET1.
- Institutional ownership, including SBIN.
- Ratings and rating trend.
- Governance evidence.
- Deposit growth.
- Advances growth.
- EPS growth.
- Annual ROA and ROE.
- Historical market captures.
- Snapshot lineage.

Do not reacquire valid evidence merely to create new records.

For missing or genuinely stale data, acquire and admit the necessary evidence using the approved sources.

### Reusable admission flow

Use the KVB ROA vertical slice as the standard:

**Original document → Verified canonical source record → Authenticated review → Validator PASS → Authorized materializer → Independently persisted FRESH.**

Do not manufacture approvals.

Where genuine owner review is required, prepare a consolidated authenticated approval workflow so the owner can review multiple qualified evidence items together.

Avoid creating 12 separate, repetitive owner-interaction interruptions.

No undocumented delegated authority should be assumed.

---

## 8. PROVIDER EXECUTION AUTHORIZATION

The portfolio owner explicitly approves the necessary research acquisition to finish Banking V1-4.

### Trendlyne

**Maximum: 1,000 calls per day.**

Implement a reliable accounting ledger:

- Provider-local day boundary.
- Calls made before the current run.
- New calls attempted.
- Successful responses.
- Failed responses.
- Remaining calls.
- Reserved quota.
- Duplicate avoidance.
- Request and response evidence identifiers.

Never exceed the lesser of 1,000 and the verified current provider entitlement.

Use batching and cache reuse where possible.

### Angel One

There is **no additional owner-imposed numerical daily call limit for authorized discretionary research**.

However:

- Respect Angel One's actual API rate limits and terms.
- Authenticate through existing secure integration.
- Preserve session and token security.
- Do not invent responses.
- Avoid uncontrolled parallel requests.
- Apply appropriate pacing, retries and backoff consistent with approved budgets.
- Record actual attempts and responses.
- Do not alter the existing separate scheduled maintenance cap.

### Internet acquisition

Codex may use authorized sources including issuer, NSE, BSE, RBI, regulatory and rating-agency websites.

For permitted web scraping:

- Prefer official document download and structured endpoints.
- Respect provider terms and access restrictions.
- Do not bypass paywalls, authentication or anti-bot protections.
- Record original URLs and retrieval timestamps.
- Verify downloaded original-content hashes.
- Preserve source identities and publication evidence.
- Capture exact quoted financial fragments.
- Do not attribute publication to retrieval time.
- Deduplicate identical content.

### Efficiency requirement

Use provider calls and web acquisition to close identifiable requirement gaps.

**Do not exhaust 1,000 Trendlyne calls simply because the allowance exists.**

Every acquisition batch should map to specific remaining requirements and have measurable acceptance criteria.

---

## 9. KEEP MAINTENANCE EXECUTION SEPARATE

The approved maintenance operation remains:

- 18:55 IST — NSE calendar refresh.
- 19:00 IST — Banking maintenance dispatch.
- Verified eligible completed exchange sessions.
- Maximum 14 history calls per day.
- Zero automatic paid retries.
- Shared NIFTY_BANK acquisition once per eligible cycle.

Verify the first genuine scheduled eligible OPEN-session execution with independent evidence.

Confirm:

1. NSE session determination.
2. Scheduler dispatch.
3. Correct source/session cutoffs.
4. Grant issuance.
5. Single grant consumption.
6. Reservation and settlement.
7. Provider call counts.
8. Immutable captured observations.
9. Stock and benchmark persistence.
10. Duplicate protection.
11. Partial-failure isolation.
12. Freshness expiry behavior.
13. Application effective-readiness behavior.

A CI pass, manual canary or CLOSED weekend run does not replace a genuine OPEN-session acceptance.

---

## 10. EXECUTE IN SMALL, MEASURABLE TRANCHES

Do not conduct another prolonged infrastructure exercise without showing canonical blocker reduction.

Recommended execution order:

**Tranche A — KVB history**

Clear the five stale-history requirements through approved market-data refresh and canonical admission.

**Tranche B — KVB valuation**

Prove PIT samples, then establish the required P/E and P/B historical coverage.

**Tranche C — KVB NIM**

Complete direct-source qualification or escalate one unavoidable methodology decision.

**Tranche D — All-bank evidence**

Execute the reusable processes across the other 12 banks in parallel where dependencies permit.

**Tranche E — Maintenance**

Complete Gate B operational acceptance at the next genuinely eligible scheduled session.

After every successful evidence tranche:

1. Validate.
2. Materialize through the approved mechanism.
3. Independently read back.
4. Record actual blocker reduction.

Do not confuse source acquisition with canonical acceptance.

---

## 11. TESTS AND RELEASE PROTECTIONS

Run all relevant repository and Development verification checks.

Include:

- Architecture Guard.
- Banking Full Verification.
- Typecheck and build.
- Numeric review and source-binding tests.
- Historical price freshness tests.
- PIT valuation tests.
- Corporate-action adjustment tests.
- Materializer idempotency.
- Duplicate source detection.
- Concurrent grant requests.
- Grant replay rejection.
- Expiry handling.
- Provider counters.
- Partial failure recovery.
- 13-bank current snapshot reconciliation.
- Application effective-readiness verification.

Record exact deployed function versions, bundle hashes and the final HEAD.

Do not close the branch or merge without applicable existing authority.

---

## 12. REPORT REAL PROGRESS

After each substantive execution tranche, provide a compact report containing:

| Metric | Required result |
|---|---|
| Starting mandatory blockers | Actual canonical count |
| Ending mandatory blockers | Independently verified count |
| Requirements newly FRESH | Exact requirement codes |
| New accepted reviews | IDs and source identities |
| New persisted snapshots | IDs and evaluation cutoffs |
| Trendlyne calls | Actual used / 1,000 |
| Angel One calls | Actual requests, successes and failures |
| Internet sources | Qualified originals and provenance |
| PIT observations | Qualified versus admitted |
| Deployment changes | Version and hash |
| Outstanding blockers | Reasons and next executable action |

Provide a current bank-by-bank table showing:

- Symbol.
- Selected snapshot.
- Evaluation/source cutoff.
- Persisted status.
- Remaining mandatory blockers.
- New FRESH requirements.
- Frozen holding value that is READY.

Track actual READY count and aggregate READY frozen value against the agreed acceptance minimum.

---

## 13. FINAL STAGE CLOSURE

Only mark Banking V1-4 **COMPLETE / PASS / CLOSED** when all conditions are met:

- 13 out of 13 frozen banks have independently verified persisted READY selections.
- Total READY frozen value reconciles to **₹2,05,138.62**.
- Every mandatory BANK V2 requirement is satisfied.
- Genuine scheduled eligible OPEN-session maintenance has passed.
- Provider accounting is independently verified.
- Freshness expiry and application effective-readiness behavior work.
- Final implementation HEAD has passing required CI.
- No unauthorized Production, `main`, V1-5, scoring or methodology changes occurred.

### If a genuine blocker remains

Do not falsely close the stage.

Complete all other authorized and independent work.

Present one consolidated checkpoint specifying the exact missing original evidence, methodology decision, owner-authenticated action, external execution restriction or future calendar condition.

Do not ask for another general authorization to use Trendlyne, Angel One or permitted public-source acquisition. That authorization is explicitly granted in this directive.

## FINAL INSTRUCTION

**Proceed with execution now. Prioritize actual reductions in canonical mandatory blockers and persisted READY selections.**

KVB's annual ROA is already successfully FRESH. Preserve it.

Use the newly authorized research capacity to finish the five stale market-history requirements, qualify PIT valuations, resolve NIM and extend remediation across all 13 frozen banks.

Do not stop after another audit, source inventory, implementation-only milestone or partial KVB success.

**Complete Banking V1-4 and close it only when both acceptance gates are independently proven.**