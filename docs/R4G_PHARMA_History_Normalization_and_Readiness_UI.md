# R4G — PHARMA History Normalization and Readiness UI

Status: **ENGINE CONTRACT COMPLETE / UI READINESS SURFACE COMPLETE / PRODUCTION INGESTION NOT APPLIED**

## Purpose

R4G converts the owner-approved R4E/R4F Trendlyne discovery into a deterministic PortfolioAI normalization contract without promoting raw provider discovery into canonical research observations.

It also surfaces that distinction in the Research Overview for securities whose canonical application sector is exactly `Pharma`.

## Canonical boundaries

- Application classification authority remains `current_security_enrichment_v1`.
- Trendlyne remains provider evidence, not application classification authority.
- Raw discovery captures are not canonical research observations.
- PortfolioAI owns all deterministic derived metrics.
- Missing/invalid provider values remain missing/invalid and are never coerced to zero.
- No PHARMA_V1 score or recommendation is generated merely because a source/normalization contract exists.

## Normalization contract

Version: `PHARMA_HISTORY_NORMALIZATION_V1`

Validated provider tool: `get_parameter_values_multi_stock`

### Annual revenue

Exact validated Trendlyne labels are normalized to relative annual periods `Y0` through `Y5`.

A provider CAGR or multi-year growth aggregate cannot substitute for the raw annual history.

PHARMA_V1 requires at least three annual observations; five are preferred.

### Annual CFO

Exact annual cash-from-operations labels are normalized to `Y0` through `Y5`.

CFO history alone does not satisfy the PHARMA cash-conversion contract because matched PAT and a reviewed capex/FCF contract remain necessary.

### Quarterly operating margin

PortfolioAI does not treat inconsistent Trendlyne OPM history labels as the canonical margin series.

For each matched quarter:

`Operating Margin % = Operating Profit / Operating Revenue × 100`

The calculation uses `decimal.js` and rounds only the normalized output to six decimal places using half-up rounding.

A quarter is unavailable when either input is missing. Revenue of zero or an invalid numeric input makes that period invalid; it is never converted to zero-margin evidence.

PHARMA_V1 requires at least eight quarterly margin observations; twelve are preferred by the profile contract.

## UI behavior

`Research → security → Overview` now includes the `PHARMA_V1 Research Readiness` panel when the canonical sector is exactly `Pharma`.

The panel distinguishes:

- `Normalization ready` — source history has been validated and a deterministic normalization contract exists;
- `Source validated` — provider capability is validated but normalization remains separate;
- `Partial`;
- `Pending`;
- `Official source pending`.

Revenue history and operating-margin history are currently shown as `Normalization ready`.

The panel continues to show `INSUFFICIENT EVIDENCE` overall because normalized raw-history values have not yet been promoted into canonical observations and several mandatory PHARMA domains remain unresolved.

## Explicit blockers after R4G

Still unresolved or partial:

- 3–5 year ROCE history;
- complete PAT/EPS period lineage;
- capex/FCF source contract;
- matched leverage/debt/cash history;
- official regulatory-site evidence;
- additional important PHARMA domains such as R&D, segment growth, pipeline evidence and ownership history.

## Production boundary

R4G is repository-only.

It does **not**:

- call Trendlyne or any external provider;
- write `fundamental_observations`;
- create scoring/recommendation/sizing rows;
- deploy a migration or Edge Function;
- change RLS/grants;
- enable a scheduler.

The next production-capable step is a separately reviewed **TORNTPHARM canonical ingestion pilot** using stored/validated raw capture inputs. That production write requires explicit owner approval before execution.

## Localhost verification

After R4G is merged and the local checkout is updated, open a Pharma holding such as TORNTPHARM from `Research` and stay on the `Overview` tab.

The PHARMA readiness panel should appear below the research scorecard and should show:

- overall `Insufficient evidence`;
- `Revenue history — Normalization ready`;
- `Operating margin history — Normalization ready`;
- pending/partial states for the remaining core domains;
- canonical cached observation counts separately from source-contract status.
