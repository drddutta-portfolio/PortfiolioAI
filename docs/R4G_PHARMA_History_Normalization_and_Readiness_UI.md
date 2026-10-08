# R4G — PHARMA History Normalization and Readiness UI

Status: **REPOSITORY NORMALIZATION CONTRACT COMPLETE / SECURITY-SPECIFIC READINESS SURFACE IMPLEMENTED / PRODUCTION INGESTION NOT IMPLIED**

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

Version: `PHARMA_HISTORY_NORMALIZATION_V2`

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

The calculation is owned by `pharmaOperatingMargin.ts`, uses `decimal.js` at deterministic calculation precision, and does not perform display rounding. Presentation surfaces may round only when formatting the derived value.

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

The source-contract state and the security-specific cached-evidence state are displayed separately. A source contract is never treated as proof that a particular security has enough canonical observations.

The panel continues to show `INSUFFICIENT EVIDENCE` overall unless the security-specific mandatory evidence contracts and observation minima are actually satisfied. R4H's prepared TORNTPHARM ingestion manifest is not interpreted as a production write.

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
- source-contract state separately from the security-specific cached-evidence state;
- actual canonical cached observation counts and minimum/preferred thresholds;
- unresolved/conflicting history excluded from derived margins;
- no claim that a prepared pilot manifest was ingested merely because repository code exists.


## 8 October 2026 audit-remediation clarification

The canonical history view now consumes the existing `fundamental_observation_decisions` selection authority through `ResearchMetric.selected`. When no canonical selection exists it may collapse only semantically identical duplicate captures with the same value. Conflicting values, incompatible period semantics, scope, unit, currency, or source semantics remain unresolved and are omitted from derived history.

Quarterly operating margin now has one deterministic calculation owner: `src/features/research/pharmaOperatingMargin.ts`. The canonical history view and raw-history normalization both delegate to it. Derived calculation precision is retained; two-decimal UI formatting remains presentation-only.

R4H remains a prepared repository pilot unless separately evidenced as applied. This document does not claim production ingestion, deployment, or portfolio-wide Pharma readiness.
