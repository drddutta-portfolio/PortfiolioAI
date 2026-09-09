# Stage 7.2D.2B.2 — Trendlyne Parameter Contract Discovery

**Status:** Implementation slice — provider tool contract added, live parameter-field promotion still gated

## 1. Authority reviewed before implementation

This slice follows the repository's canonical hierarchy and the owner-reviewed Stage 7.2 plan. It also follows the D.2B production research dataset contract merged immediately before this work.

The key rule remains unchanged: a human-readable provider parameter name is not enough to become a PortfolioAI production metric. The exact provider `field_name`, period semantics, unit, currency, scope and returned value shape must be observed and reviewed before promotion.

## 2. Provider MCP contract now confirmed

Current Trendlyne MCP documentation exposes two tools that are directly relevant to completing PortfolioAI's research dataset:

- `search_parameters(query, source_table="stockprofile")` — discovers provider parameter metadata, including field names/categories/verbose names.
- `get_parameter_values(stocks, parameters)` — retrieves values for explicit provider source identities and explicit parameter field names.

These tools are now represented in PortfolioAI's server-side provider adapter, but are not wired into broad refresh execution.

## 3. D.2B.2 implementation

### Provider adapter additions

`TrendlyneMcpClient` now provides typed wrappers for:

- `searchParameters(query, sourceTable)`
- `getParameterValues(stocks, parameters)`

The wrappers only package the documented MCP arguments. They do not parse, normalize, store, select or score the returned data.

### Production parameter discovery manifest

`trendlyne-parameter-contract.ts` defines the next production research targets and the exact human-readable parameter concepts that must be discovered for each.

Targets include:

- annual and quarterly operating revenue;
- annual and quarterly net profit/PAT;
- diluted EPS;
- EBITDA;
- operating margin;
- ROCE;
- total debt;
- cash and cash equivalents;
- debt/equity;
- interest coverage;
- EV/EBITDA;
- dividend yield.

Every target deliberately has `verifiedFieldName: null`.

That is not incomplete bookkeeping. It is a production safety gate: the app must not guess that a verbose parameter label is the provider's executable MCP field identifier.

## 4. Public parameter evidence versus production contract

Trendlyne's public parameter catalogue confirms that relevant concepts exist, including examples such as:

- `ROCE Annual %`;
- `Operating Revenue Annual`;
- `Operating Revenue Qtr`;
- `Net Profit Annual`;
- `Net Profit Qtr`;
- `Diluted EPS Annual` / `Diluted EPS Qtr`;
- `EBITDA Annual`;
- `Operating Profit Margin Annual %` (including legacy spelling variants in the catalogue);
- `Total Debt Annual`;
- `Cash Plus Cash Equivalents Annual`;
- `Interest Coverage Ratio Annual`;
- `EV Per EBITDA Annual`.

Public catalogue presence proves discoverability, not the final MCP `field_name`, source-table compatibility, unit contract, period metadata, or security-specific availability.

## 5. Important non-equivalences preserved

The discovery manifest explicitly prevents these silent substitutions:

- ROCE ≠ ROIC;
- stock ROCE ≠ industry ROCE;
- EBITDA ≠ Operating Profit;
- generic total debt/equity ≠ long-term debt/equity unless reviewed as the intended metric;
- generic P/B ≠ Provider Adjusted P/B;
- operating revenue ≠ total revenue unless the target metric contract explicitly permits the distinction.

## 6. Live discovery still required

Before any target changes from `REQUIRES_PROVIDER_CONTRACT` to `VERIFIED_PROVIDER_FIELD`, a controlled owner-approved discovery run must:

1. call `search_parameters` for the target concept;
2. retain the raw response as provider evidence;
3. inspect returned `field_name`, category and verbose name;
4. verify the field against the intended PortfolioAI metric;
5. call `get_parameter_values` for one or more already-verified provider security identities;
6. inspect exact result shape, null behavior, period information, units and scope;
7. add parser fixtures from the observed response shape;
8. only then add/update `fundamental_metric_definitions` and storage logic.

## 7. Safety boundary

This slice does **not**:

- make a live Trendlyne provider call;
- widen Cohort A execution;
- change the D.2A zero-call planner;
- add a database migration;
- store any guessed provider parameter identifier;
- enable owner-confirmed broad refresh execution;
- enable Stage 8 scoring or recommendations.

## 8. Tests

Tests prove:

- all discovery targets remain unverified until a subscribed response is reviewed;
- ROCE is not broadened to ROIC or industry ROCE;
- long-term debt/equity is not promoted as a generic total-debt ratio;
- the adapter sends the documented `search_parameters` payload;
- the adapter sends the documented `get_parameter_values` payload only with explicit provider identities and explicit parameter names;
- receiving provider text through `search_parameters` does not mutate the production contract by itself.

## 9. Next gate

The next bounded step is a **controlled live parameter-discovery pilot**, using one already-verified Trendlyne stock identity and a very small target set (recommended first: ROCE, diluted EPS, EBITDA, operating margin).

That run should be separately owner-approved because it will consume real Trendlyne tool calls. Its purpose is contract discovery only — not portfolio refresh.
