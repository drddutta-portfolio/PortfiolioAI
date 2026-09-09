# Stage 7.2D.2B — Production Research Dataset and Manual Refresh

**Status:** Implementation plan after Stage 7.2D.2A production verification

## 1. Documents reviewed before planning

This plan was prepared after reviewing the current canonical and stage-specific `.md` authorities on `main`:

1. `PortfolioAI_Master_Blueprint.md`
2. `PortfolioAI_Database_Architecture.md`
3. `PortfolioAI_Development_Rules.md`
4. `PortfolioAI_Research_and_Intelligence_Architecture.md`
5. `PortfolioAI_Product_UI_and_Decision_Workflow.md`
6. `PortfolioAI_Development_Status.md`
7. `PortfolioAI_Requirements_Register.md`
8. `Owner_Reviewed_Stage_7_2_Production_Fundamental_Intelligence_and_Research_Workspace_Plan.md`
9. `Stage_7_2D_1_Research_Coverage_and_Operations_UX.md`
10. `Stage_7_2D_2A_Refresh_Planning_and_Confirmation_Plan.md`

The owner-reviewed Stage 7.2 plan explicitly defers full financial statements and long historical charts until period, scope, currency and series contracts are adequate. The Research and Intelligence Architecture also requires every metric to have an explicit source-and-calculation contract before it becomes canonical research or an analytical input.

## 2. Why D.2B must start with a production dataset contract

Stage 7.2D.2A proved that owner-triggered planning can calculate a conservative refresh estimate with zero provider calls. Production verification showed a representative stock can have a mixture of stale pilot metrics and unavailable research fields.

The current Trendlyne adapter is intentionally narrow. Its verified overview parser maps only:

- `MARKET_CAP_PROVIDER_RAW`
- `PE_TTM`
- `PBV_ADJUSTED_PROVIDER` (conflicting by design)
- `REVENUE_TTM`
- `NET_PROFIT_TTM`
- `CFO_ANNUAL`
- `ROE_ANNUAL`

The verified ownership parser maps:

- promoter holding
- FII/FPI holding
- DII holding
- mutual-fund holding
- public holding
- promoter pledge

The adapter deliberately rejects or ignores unreviewed provider fields such as EBITDA, operating profit or margins rather than guessing semantic equivalence.

Therefore D.2B must not simply enable the D.2A execution button and refresh the same intentionally incomplete pilot dataset across the whole portfolio.

## 3. D.2B delivery split

### D.2B.1 — Production Research Dataset Contract

No provider execution expansion.

Deliverables:

- versioned definition of the research dataset PortfolioAI wants per equity;
- explicit status for every desired metric: `VERIFIED_PROVIDER_FIELD`, `REQUIRES_PROVIDER_CONTRACT`, `DERIVED_LATER`, or `DEFERRED`;
- unit/period/scope/currency requirements;
- freshness domain;
- intended UI section;
- intended later analytical use;
- no fabrication or silent semantic substitution;
- tests that prevent unreviewed fields from being promoted to verified production metrics.

### D.2B.2 — Provider Contract Expansion

Still no broad portfolio execution until the provider fields are verified.

For each `REQUIRES_PROVIDER_CONTRACT` metric:

1. inspect the subscribed Trendlyne MCP tool/schema already available to the server integration;
2. identify the exact provider field/code and response shape;
3. verify unit, period semantics, consolidation scope and currency behavior;
4. add parser fixtures from observed provider shape;
5. add canonical metric definitions only when semantics are stable;
6. preserve nulls and conflicts;
7. update cost planning only if new provider tools/calls are actually required.

If a desired metric cannot be proven semantically, it remains unavailable.

### D.2B.3 — Owner-Confirmed Manual Execution

Only after the production dataset contract and provider mappings are accepted:

- use the D.2A estimate as the pre-execution plan;
- require explicit owner acknowledgement;
- re-plan immediately before execution to prevent stale estimates;
- reserve internal provider budget atomically;
- execute only stale/missing verified domains;
- retain existing identity, RLS, equity-only, concurrency, retry and cleanup safeguards;
- persist immutable evidence and usage accounting;
- refresh Research Coverage after completion;
- display per-security success/partial/failure outcomes;
- never auto-execute from navigation, filtering or selection.

The exact owner-approved Cohort A execution path remains unchanged until this new path has its own reviewed gate.

## 4. Production research dataset v1

The v1 dataset is a **target contract**, not a statement that Trendlyne currently supplies every metric.

### 4.1 Company identity and classification

| Metric / field | Initial status | Authority / rule |
|---|---|---|
| Company name | VERIFIED_PROVIDER_FIELD | Strict identity reconciliation; canonical security remains authority |
| Ticker / ISIN / provider stock ID | VERIFIED_PROVIDER_FIELD | Exact identity rules; provider ID remains source-scoped |
| Sector | VERIFIED_PROVIDER_FIELD | Provider evidence only until canonical selection/taxonomy mapping is approved |
| Industry | VERIFIED_PROVIDER_FIELD | Provider evidence only until canonical selection/taxonomy mapping is approved |
| Market-cap category | DERIVED_LATER / selected evidence | Must use approved PortfolioAI market-cap policy, not a provider label guess |

### 4.2 Financial growth evidence

| Metric | Initial status | Minimum contract before production use |
|---|---|---|
| Revenue TTM | VERIFIED_PROVIDER_FIELD | Existing `SR_TTM` contract |
| Revenue annual series | REQUIRES_PROVIDER_CONTRACT | Period end, annual period type, unit, currency, scope |
| Revenue quarterly series | REQUIRES_PROVIDER_CONTRACT | Quarter end, unit, currency, scope |
| EBITDA / operating profit | REQUIRES_PROVIDER_CONTRACT | Must prove exact semantic definition; never equate EBITDA and operating profit automatically |
| EBITDA / operating margin | REQUIRES_PROVIDER_CONTRACT | Numerator/denominator and period semantics required |
| PAT TTM | VERIFIED_PROVIDER_FIELD | Existing `NP_TTM` contract |
| PAT annual series | REQUIRES_PROVIDER_CONTRACT | Period end, unit, currency, scope |
| PAT quarterly series | REQUIRES_PROVIDER_CONTRACT | Quarter end, unit, currency, scope |
| Diluted EPS | REQUIRES_PROVIDER_CONTRACT | Dilution basis and period required |
| Revenue/PAT/EPS CAGR | DERIVED_LATER | PortfolioAI deterministic calculation from period-qualified series only |
| Growth acceleration/deceleration | DERIVED_LATER | PortfolioAI deterministic calculation; no provider label substitution |

### 4.3 Quality and capital-efficiency evidence

| Metric | Initial status | Minimum contract before production use |
|---|---|---|
| ROE annual | VERIFIED_PROVIDER_FIELD, period-incomplete | Existing `ROE_A`; period metadata must be improved before long-history analysis |
| ROCE annual | REQUIRES_PROVIDER_CONTRACT | Exact provider formula/field and annual period required |
| ROIC / incremental ROCE | DERIVED_LATER unless exact reviewed source exists | Formula and invested-capital definition required |
| CFO annual | VERIFIED_PROVIDER_FIELD, period-incomplete | Existing `CFO_A`; period metadata must be improved |
| CFO/PAT | DERIVED_LATER | PortfolioAI calculation from compatible periods |
| CFO/EBITDA | DERIVED_LATER | Requires semantically approved EBITDA and compatible periods |
| Free cash flow | DERIVED_LATER or REQUIRES_PROVIDER_CONTRACT | Formula contract required; do not infer from incomplete cash-flow fields |
| Net margin | DERIVED_LATER or verified provider field | Requires compatible revenue/PAT period and scope |

### 4.4 Balance-sheet and solvency evidence

| Metric | Initial status | Minimum contract before production use |
|---|---|---|
| Total debt | REQUIRES_PROVIDER_CONTRACT | Point/period date, currency, scope |
| Cash / cash equivalents | REQUIRES_PROVIDER_CONTRACT | Point/period date, currency, scope |
| Net debt | DERIVED_LATER unless exact reviewed source exists | Debt minus approved cash components |
| Debt/equity | REQUIRES_PROVIDER_CONTRACT or derived later | Denominator definition required |
| Interest expense | REQUIRES_PROVIDER_CONTRACT | Period and scope required |
| Interest coverage | REQUIRES_PROVIDER_CONTRACT or derived later | EBIT/EBITDA numerator definition must be explicit |
| Debt trend | DERIVED_LATER | Requires reliable multi-period debt series |

### 4.5 Valuation evidence

| Metric | Initial status | Rule |
|---|---|---|
| Provider raw market cap | VERIFIED_PROVIDER_FIELD | Evidence only; does not replace Angel One CMP |
| P/E TTM | VERIFIED_PROVIDER_FIELD | Existing contract; one-business-day freshness |
| Provider Adjusted P/B | VERIFIED_PROVIDER_FIELD / CONFLICTING | Must stay distinct from generic P/B |
| Generic P/B | REQUIRES_PROVIDER_CONTRACT | Only semantically equivalent evidence or reviewed PortfolioAI formula |
| EV/EBITDA | REQUIRES_PROVIDER_CONTRACT | EV and EBITDA semantics required |
| PEG | DERIVED_LATER or reviewed provider field | Growth denominator contract required |
| Dividend yield | REQUIRES_PROVIDER_CONTRACT | Dividend period/basis required |
| FCF yield | DERIVED_LATER | Requires approved FCF and market-cap/EV denominator |

### 4.6 Ownership

The existing aggregate ownership contract remains approved for production research:

- Promoter
- FII/FPI
- DII
- Mutual Funds
- Public
- Promoter Pledge

Quarterly history should be retained when the provider response supplies multiple valid periods; the UI must not fabricate a trend from one point.

### 4.7 Documents

Target document classes:

- Annual Reports
- Quarterly Results
- Investor Presentations
- Earnings Calls / Concalls

Provider appearances remain `REVIEW_REQUIRED` until canonical document identity/open-reference rules are separately satisfied. Document body retention remains out of scope unless rights are explicitly reviewed.

## 5. Freshness policy mapping

Reuse the approved Stage 7.2 domain policy:

- verified identity: 180 days;
- TTM fundamentals: 7 days;
- annual metrics: 90 days;
- quarterly metrics: 30 days;
- valuation evidence: 1 business day approximation;
- ownership: 45 days;
- document discovery: 7-day backstop/event-driven where supported;
- technical/market evidence: not Trendlyne; Angel One remains authority.

Metric-specific `fresh_until` must come from the metric/domain contract, not a blanket parser value.

## 6. Call-cost policy

D.2A already counts physical provider tool attempts rather than metric count. D.2B must preserve that rule.

A production dataset with 20 metrics does **not** imply 20 calls if one approved overview operation yields multiple metrics. Conversely, if annual history, quarterly history or balance-sheet evidence requires separate MCP tools, those physical operations must be added to the planner before execution is enabled.

No call-cost change is allowed until the provider contract expansion identifies the actual tools required.

## 7. Manual refresh execution gate

The future execution control may be enabled only when all of the following are true:

- the selected security is an authenticated owner-held open equity;
- provider identity is verified or the plan includes the bounded identity resolution path;
- every requested production metric has a reviewed source/semantic contract;
- the current plan fits internal daily, rolling and per-run safeguards;
- one-provider-orchestration concurrency is available;
- the owner explicitly acknowledges the current estimate;
- the server re-plans immediately before reservation;
- no Cohort A or legacy guard is silently weakened;
- every tool attempt is usage-accounted;
- cleanup/settlement occurs for success, partial success and failure;
- the result is cache-visible without requiring a live provider call on page load.

## 8. UI changes planned for D.2B

Research Coverage should eventually distinguish:

- **Fresh** — production dataset domains satisfied and fresh;
- **Stale** — usable but expired production evidence;
- **Missing** — required production evidence absent;
- **Contract pending** — PortfolioAI wants the metric but no verified provider/canonical contract exists yet;
- **Conflicting** — retained semantic/evidence conflict;
- **Review required** — explicit human/evidence review needed;
- **N/A** — domain not applicable.

The company Research Workspace should show why an unavailable field is unavailable, for example:

- `Not yet mapped to a verified provider field`
- `No evidence returned by provider`
- `Period metadata incomplete`
- `Semantic conflict — not promoted`

This is more informative than treating every unavailable field as the same condition.

## 9. Tests required

- production dataset registry contains no unreviewed field marked verified;
- adjusted P/B cannot become generic P/B;
- EBITDA cannot be silently substituted for operating profit or vice versa;
- annual/quarterly metrics require period metadata before history/CAGR use;
- derived metrics cannot be produced with incompatible periods/scopes;
- planner cost remains based on physical provider operations;
- manual execution cannot run from page load/filter/selection;
- final execution requires a fresh server-side plan and explicit owner acknowledgement;
- ETFs/non-equities remain excluded from equity-research execution;
- existing Cohort A guard remains unchanged until separately retired by an approved migration/code change.

## 10. Implementation order

1. Add versioned production research dataset registry and tests.
2. Improve UI unavailable-reason model so pilot limitations are explicit.
3. Inspect and map exact Trendlyne provider fields/tools for the target metrics without promoting unverified semantics.
4. Add reviewed metric definitions/parsers and period/scope/currency handling.
5. Extend planner only for newly required physical provider operations.
6. Re-run D.2A planning against the expanded dataset.
7. Implement owner-confirmed execution as a separately testable slice.
8. Pilot manual execution on a very small owner-selected set before any broad rollout.
9. Update Development Status and Requirements Register after acceptance.

No broad portfolio provider execution is authorized merely by creating this plan.