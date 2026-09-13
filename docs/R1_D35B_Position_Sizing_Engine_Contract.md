# R1 / D35B — Position Sizing Engine Contract

**Status:** Reference implementation under review  
**Completion target:** ENGINE CONTRACT COMPLETE only  
**Portfolio-wide coverage:** Not claimed  
**Production migration applied:** No  
**Scheduler/automation:** None

## 1. Purpose

D35B converts already-reviewed deterministic investment evidence into a separate, reproducible position-sizing assessment.

It answers:

> Given the evidence that PortfolioAI currently has for this security and its present portfolio weight, what sizing state/range/action can the system support without inventing missing evidence or overwriting the owner's settings?

D35B is a portfolio engine. It does not replace the upstream Quality/Growth/Valuation/Risk/Recommendation engines and does not fetch provider data.

## 2. Architecture boundary

The canonical Master Blueprint requires Position Sizing to consider conviction, portfolio role, business quality, growth durability, permanent-loss risk, valuation, volatility, concentration, liquidity and portfolio fit.

The R1 reference contract does **not** pretend all ten domains are already portfolio-wide. Instead it:

1. consumes a persisted deterministic score/recommendation lineage;
2. consumes validated upstream weight guidance when that guidance exists;
3. consumes the transaction/price-derived current portfolio weight;
4. treats owner position settings as human context only;
5. fails closed when required evidence is absent or below policy readiness;
6. persists a separate append-only assessment when trusted orchestration is later enabled.

This makes R1 a reference contract rather than an unsupported second scoring engine.

## 3. Non-negotiable separations

### Owner settings are not engine output

`portfolio_security_settings` remains owner-controlled. D35B must never write a generated target/min/max range into that table.

The owner target/min/max values may be compared with the deterministic engine range and surfaced as agreement/conflict reason codes, but they do not become evidence for inventing the engine range.

### Recommendation guidance is upstream evidence, not the D35B record

`stock_recommendation_runs` may contain `suggested_weight_min` / `suggested_weight_max` from the reviewed recommendation policy. D35B consumes those values with their score/recommendation lineage and creates its own assessment.

The two records remain distinct so the system can answer:

- what the recommendation layer said;
- what current portfolio weight was used;
- what D35B concluded;
- what the owner configured separately.

### Sizing reduction is not thesis exit

D35B never emits an automatic `EXIT` action. An upstream `EXIT_CANDIDATE` is converted only to `EXIT_REVIEW` so the dedicated thesis/permanent-loss Exit logic and human decision remain separate.

## 4. Deterministic v1 inputs

The pure TypeScript reference implementation accepts:

- `portfolioId`;
- `securityId`;
- `assetClass`;
- exact-decimal `currentWeight`;
- policy `minimumScoreReadyCoverage`;
- owner portfolio role;
- owner target/min/max settings;
- owner frozen state;
- persisted recommendation run ID;
- persisted score run ID;
- upstream suggested role;
- upstream action bias;
- upstream suggested minimum/maximum weight;
- score-ready coverage;
- evidence confidence;
- recommendation transition state.

No provider call, AI output, news fetch or browser-side inference is part of the v1 calculation.

## 5. Assessment states

### `READY`

The required equity applicability, deterministic lineage, readiness coverage, current weight and validated upstream range are present.

### `INSUFFICIENT_EVIDENCE`

The assessment has relevant upstream evidence, but the evidence is not sufficient to support a range/action. Examples include coverage below the policy minimum, missing weight guidance or missing current weight.

No target/min/max range or action is returned in this state.

### `BLOCKED_PREREQUISITE`

A required upstream deterministic prerequisite is absent or explicitly pending. Examples include no persisted recommendation run, no score-run lineage, an `INSUFFICIENT` upstream recommendation or `EVIDENCE_PENDING` transition.

### `NOT_APPLICABLE`

The equity position-sizing contract does not apply to the asset. R1 explicitly returns this for ETFs and other non-equity assets rather than forcing equity rules onto them.

## 6. V1 action rule

The v1 action is deliberately conservative:

- owner frozen → `FREEZE`;
- upstream `EXIT_CANDIDATE` → `EXIT_REVIEW`;
- current weight above engine maximum → `REDUCE`;
- current weight below engine minimum **and** upstream bias `ACCUMULATE` → `ADD`;
- otherwise → `HOLD`.

The schema reserves `ADD_ON_WEAKNESS` and `TRIM_INTO_STRENGTH` for later deterministic market/timing contracts. V1 does not fabricate those states without the required timing inputs.

## 7. Suggested target calculation

When the assessment is `READY`, v1 uses the midpoint of the validated upstream minimum and maximum as the suggested target:

`target = (minimum + maximum) / 2`

Critical financial arithmetic uses `decimal.js`, not JavaScript floating point. The target is rounded to six decimal places using `ROUND_HALF_UP`, matching the database weight scale.

The midpoint is a deterministic reference target inside an already-reviewed range. It is not a replacement for the owner's configured target.

## 8. Persistence contract

The additive migration introduces `position_sizing_assessments` with:

- portfolio/security identity;
- engine version;
- `evaluation_key` idempotency fingerprint;
- assessment timestamp;
- assessment state;
- captured current weight;
- suggested target/min/max weights;
- recommended sizing action;
- evidence coverage/confidence;
- reason codes;
- deterministic rationale;
- canonical structured `input_snapshot`;
- source score-run lineage;
- source recommendation-run lineage;
- creation timestamp.

### Idempotency

Trusted orchestration must generate a stable evaluation fingerprint from the canonical deterministic input snapshot. The database uniquely constrains:

`(portfolio_id, security_id, engine_version, evaluation_key)`

A repeated evaluation of the same canonical input therefore cannot silently append duplicates.

### Append-only / security

- RLS is enabled.
- Authenticated browser users receive owner-scoped `SELECT` only.
- Authenticated browser users receive no `INSERT`, `UPDATE` or `DELETE` privilege.
- `service_role` receives `SELECT` and `INSERT` only.
- Neither authenticated browser users nor `service_role` receive `UPDATE` or `DELETE` privilege.
- No browser RPC for writing assessments is introduced in R1.

This keeps future execution in a trusted server/orchestration path and prevents historical engine output from being silently rewritten.

## 9. Reference cohort

The contract tests four deliberately different cases.

### 1. HDFCBANK reference

Uses the known 3–4% upstream reference guidance with adequate score coverage. The pure engine reproduces the range generically, derives a 3.5% midpoint and can return `ADD` when current weight is below 3% and the upstream action bias is `ACCUMULATE`.

**Important:** `HDFCBANK` is not hard-coded in the engine.

### 2. Non-financial equity contract case

A non-financial equity with valid persisted lineage and validated upstream range follows exactly the same engine path. This proves the D35B implementation is not bank-specific.

The repository's reviewed non-financial scoring-profile validation cohort contains INFY, TORNTPHARM and M&M, but R1 does not claim that any one of those currently has production-ready persisted sizing guidance. Selection of a real production reference stock requires current evidence inspection during the later approved execution step.

### 3. Deliberately incomplete equity

A stock with score-ready coverage below policy returns `INSUFFICIENT_EVIDENCE`, no range and no action.

### 4. ETF

An ETF returns `NOT_APPLICABLE`, no range and no action.

## 10. Additional guard tests

The TypeScript reference tests also verify:

- missing upstream ranges do not create a default 3–4% range;
- human freeze returns `FREEZE`;
- exit candidates become `EXIT_REVIEW`, never automatic exit;
- midpoint rounding uses exact decimal arithmetic.

The SQL contract test verifies:

- required columns and lineage fields exist;
- idempotency is uniquely constrained;
- owner-scoped RLS policy exists;
- browser writes are denied;
- service role can append but cannot rewrite/delete assessment history.

## 11. What R1 explicitly does not do

R1 does not:

- apply the migration to production;
- populate `position_sizing_assessments` in production;
- change `portfolio_security_settings`;
- change transactions, holdings or accounting;
- call Trendlyne, Angel One, NSE or any external provider;
- consume provider budget;
- run AI;
- schedule anything;
- claim portfolio-wide sizing coverage;
- claim all Blueprint sizing factors already have portfolio-wide evidence;
- enable automatic trading or automatic exits.

## 12. Approval gates

Before a production sizing assessment can be persisted:

1. review and merge the R1 code/schema contract;
2. run TypeScript/test/lint/build checks in a full repository checkout;
3. run the migration and pgTAP test against a disposable/local Supabase environment;
4. inspect the resulting schema/RLS diff;
5. obtain explicit owner approval before applying the migration to production;
6. select and inspect the real four-case pilot cohort using current stored evidence;
7. run a bounded manual dry run;
8. inspect outputs and lineage;
9. only then consider a trusted persistence/orchestration path.

Passing R1 means **ENGINE CONTRACT COMPLETE**. It does not mean PILOT COMPLETE, PORTFOLIO-WIDE COVERAGE COMPLETE or AUTOMATION COMPLETE.
