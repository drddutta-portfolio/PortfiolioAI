# R4F — PHARMA Live Provider Discovery Results — 2026-09-14

Status: **LIVE DISCOVERY COMPLETE / SOURCE CONTRACT STILL PARTIAL**

This document records the owner-approved R4E/R4F Trendlyne discovery executed against the reviewed PHARMA reference security, TORNTPHARM. It records what the provider contract actually proved, the failed initial tool assumption, the accounting/audit treatment, and the remaining source-contract gaps.

## 1. Scope and safety boundary

The live work was explicitly limited to provider-contract discovery for:

- reference security: `TORNTPHARM`;
- application sector: `Pharma` from `current_security_enrichment_v1`;
- verified Trendlyne instrument id: `1409`;
- provider: `TRENDLYNE_MCP`;
- raw discovery capture only.

The discovery did **not** create or update:

- `fundamental_observations`;
- research-profile assignments;
- deterministic score runs;
- recommendation runs;
- position-sizing assessments;
- portfolio transactions/settings;
- sector/industry/market-cap classification.

Operational provider accounting rows, budget reservation/settlement rows, ingestion run/item rows, raw discovery captures, and one append-only audit-correction event were written as required by the provider control plane.

## 2. Initial R4E tool-contract failure

The repository R4E plan originally assumed the Trendlyne MCP tool `search_parameters` was available.

Six budget-reserved calls were executed for the six planned history domains. All six provider responses were:

`Unknown tool: 'search_parameters'`

The MCP transport itself returned successfully, and the older client did not yet classify that provider text as a business-level tool-contract failure. Consequently the immutable usage/run rows recorded those transport attempts as successful.

This result must **not** be treated as valid provider discovery.

### Append-only audit correction

PortfolioAI correctly prevented direct mutation of the provider accounting/audit rows because they are append-only.

A separate `provider_control_events` record was therefore written with:

- control name: `R4E_DISCOVERY_AUDIT_CORRECTION`;
- affected run: `5c69c74e-e6b6-4c07-af2f-63aaf2dde2fa`;
- corrected interpretation: `FAILED_PROVIDER_TOOL_CONTRACT`;
- safe error code: `PROVIDER_TOOL_CONTRACT_ERROR`;
- original six provider units remain consumed;
- original raw capture remains preserved.

The original immutable records were not altered.

## 3. Validated Trendlyne discovery tool

PortfolioAI then used the already-observed Trendlyne MCP tool:

`get_parameter_values_multi_stock`

The observed client explicitly treats provider text such as `Unknown tool`, `tool not found`, or `method not found` as `PROVIDER_TOOL_CONTRACT_ERROR`.

A one-call broad TORNTPHARM discovery succeeded, followed by three narrower calls for:

1. `EARNINGS_ROCE_HISTORY`;
2. `OPM_QUARTER_HISTORY`;
3. `CASH_LEVERAGE_HISTORY`.

All four validated-tool calls succeeded and produced raw provider captures only.

## 4. Provider usage/accounting outcome

Total live provider attempts for this owner-approved discovery were:

- 6 initial `search_parameters` attempts — externally consumed but invalid as discovery because the tool was unavailable;
- 1 broad `get_parameter_values_multi_stock` call — successful;
- 3 targeted `get_parameter_values_multi_stock` calls — successful.

Total provider attempts: **10**.

The first six are explicitly corrected by append-only audit interpretation rather than rewritten. The four later calls are valid discovery evidence.

No canonical research metric, score, recommendation, or sizing state was promoted by any of these calls.

## 5. Source-contract findings

### 5.1 Revenue history — strongly supported

Trendlyne exposed period-specific annual revenue fields for TORNTPHARM including:

- current annual operating revenue;
- 1Y ago;
- 2Y ago;
- 3Y ago;
- 4Y ago;
- 5Y ago.

This is sufficient provider-capability evidence to design a canonical raw annual revenue ingestion contract. It does not itself ingest/promote those values into canonical research evidence.

### 5.2 Quarterly operating margin — derive from raw inputs

Direct OPM labels were inconsistent across periods. However, Trendlyne exposed quarter-specific raw operating profit and operating revenue values across a useful historical range.

Therefore the preferred PortfolioAI contract is:

`Trendlyne raw quarterly operating profit + raw quarterly operating revenue → PortfolioAI deterministic OPM calculation`

This is preferable to making provider-computed OPM labels a second business-fact authority.

### 5.3 ROCE history — still incomplete

The discovery validated:

- current annual ROCE;
- 1Y-ago annual ROCE.

It did not establish a complete comparable 3–5 year raw ROCE series. `PHARMA_ROCE_HISTORY` therefore remains source-contract incomplete.

### 5.4 PAT/EPS history — partial

Trendlyne exposed several period-specific net-profit/PAT and cash-EPS history fields, including current and multiple older annual periods.

The field set was not yet proven to be complete and semantically consistent for every required annual observation. PHARMA PAT/EPS history therefore remains partially proven rather than READY.

### 5.5 CFO / cash conversion — CFO strong, capex/FCF unresolved

Trendlyne exposed annual cash-from-operating-activities history across multiple years, including 1Y through 5Y ago.

Direct, reviewed capex/free-cash-flow fields were not proven. Investing cash flow must not be silently substituted for capex.

Therefore:

- raw CFO history capability is strongly supported;
- the full `PHARMA_CASH_CONVERSION_HISTORY` contract remains incomplete until capex/FCF evidence is approved or an alternative canonical calculation contract is defined.

### 5.6 Balance-sheet leverage — partial

The discovery exposed useful leverage-related evidence such as:

- interest coverage for at least a historical annual period;
- TTM interest expense;
- short-term debt for at least one annual period;
- other balance-sheet fields.

A complete reviewed series for total debt, cash, net debt, debt-equity and EBITDA was not proven. `PHARMA_BALANCE_SHEET_LEVERAGE` remains source-contract incomplete.

### 5.7 Regulatory evidence — unchanged

This Trendlyne discovery does not replace the PHARMA regulatory-source requirement.

Material regulatory manufacturing-site status remains an official-source evidence contract and must be handled separately.

## 6. Architecture conclusion

The live discovery reinforces the PortfolioAI Single Source of Truth rule:

> Use providers for raw evidence where they are authoritative/capable; derive shared financial/business facts once in PortfolioAI when a deterministic calculation can be owned internally.

In particular, quarterly OPM should be derived deterministically from the same raw operating-profit and operating-revenue history rather than trusting a collection of inconsistent provider OPM labels.

## 7. Production endpoint state

After discovery execution, `discover-trendlyne-pharma-history-contract` was restored to normal authenticated owner access with `verify_jwt=true`.

The corrected implementation uses:

- exact TORNTPHARM / Pharma / Trendlyne-1409 identity gates;
- `get_parameter_values_multi_stock`;
- a maximum of three targeted provider calls;
- provider-budget reservation before calls;
- per-attempt usage accounting;
- settlement/release of reserved units;
- raw discovery capture only;
- zero canonical research promotion.

No scheduler was enabled.

## 8. Completion meaning

R4E/R4F live discovery is **DISCOVERY COMPLETE** for this bounded reference exercise.

It is **not** valid to claim:

- `PHARMA_V1 SOURCE CONTRACT COMPLETE`;
- any Pharma holding is research READY;
- Pharma scoring is ready;
- portfolio-wide Pharma evidence is populated;
- a 26-stock provider rollout is approved.

The next repository task is to convert the proven fields into a reviewed PHARMA raw-history ingestion/normalization contract and explicitly list the still-unresolved mandatory inputs. Any broader provider execution remains separately approval-gated.
