# R4N — PHARMA_V1 + DOMESTIC_FORMULATIONS Effective Contract

**Status:** documentation-only contract candidate
**Reference security:** TORNTPHARM
**Assignment state:** `PROVISIONAL`; owner approval pending
**Scoring:** unavailable; no curves, weights or recommendation policy approved

## Composition

```text
PHARMA_V1 parent v1
  + DOMESTIC_FORMULATIONS candidate v1
  + reviewed exposure conditions
  + universal governance/market overlays
  = effective research contract
```

An unknown condition or conflicting override fails closed and appears as a blocker. No company name or symbol activates a rule.

## Mandatory effective requirements

| Code | Requirement | Dimension | Unit / period | Minimum / preferred history | Source contract | Freshness | Owner | Readiness rule | Unavailable behavior |
|---|---|---|---|---|---|---|---|---|---|
| `PHARMA_REVENUE_GROWTH_HISTORY` | Revenue growth history | Growth | INR crore; year | 3 / 5 years | audited consolidated operating revenue | annual filing cycle | deterministic research service | 3 compatible annual periods with growth derivable | unavailable; blocks mandatory readiness |
| `PHARMA_OPERATING_MARGIN_HISTORY` | Operating-margin history | Quality | percent; quarter | 8 / 12 matched quarters | issuer operating revenue and operating profit | quarterly | PortfolioAI derivation | 8 matching periods with compatible definitions | unavailable; blocks |
| `PHARMA_ROCE_HISTORY` | ROCE history | Capital Efficiency | percent; year | 3 / 5 years | consistent issuer series or reviewed equivalent | annual | deterministic research service | 3 comparable annual observations | unavailable; blocks |
| `PHARMA_PAT_EPS_HISTORY` | PAT attributable and diluted EPS | Growth / Quality | INR crore and INR/share; year | 3 / 5 matched years | audited consolidated statements | annual | deterministic research service | both facts available for 3 matching years | unavailable; blocks |
| `PHARMA_CASH_CONVERSION_HISTORY` | CFO, PAT, capex and FCF | Cash Quality | INR crore; year | 3 / 5 matched years | audited cash flow plus approved FCF derivation | annual | PortfolioAI derivation | compatible CFO/PAT/capex and derived FCF for 3 years | unavailable; blocks |
| `PHARMA_FINANCIAL_STRENGTH_HISTORY` | Debt, cash, EBITDA and interest cover | Financial Strength / Leverage | INR crore and ratios; year | 3 / 5 matched years | audited statements and reviewed derivations | annual | deterministic research service | required components present for 3 matching years | unavailable; blocks |
| `PHARMA_DOMESTIC_REVENUE_GROWTH` | Domestic formulations revenue growth | Growth | INR crore or percent; year/quarter | 3 / 5 years | issuer geographic/segment disclosure | each result cycle | deterministic research service | three compatible annual domestic-revenue periods | unavailable; blocks; consolidated revenue is not a substitute |
| `PHARMA_FIELD_FORCE_PRODUCTIVITY` | Field-force/MR productivity | Business Durability | MR count and INR revenue/MR; year | 3 / 5 years | filing, investor presentation or approved licensed source | annual | PortfolioAI derivation | disclosed MR count and compatible domestic revenue for 3 years | unavailable; blocks; no inferred headcount |
| `PHARMA_BRAND_THERAPY_LEADERSHIP` | Brand and therapy-area leadership | Business Durability | share/rank and dated qualitative evidence | 3 / 5 years | issuer evidence plus approved licensed market source | annual or material update | evidence evaluator | reviewed leadership evidence covering material therapies for 3 periods | unavailable; blocks; no proxy estimate |
| `PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW` | Export/regulatory materiality determination | Risk | reviewed categorical assessment; point in time | current / annual review | issuer segment/site disclosure and regulator evidence | annual/material event | authorized reviewer | reviewed `ACTIVE`/`INACTIVE` decision with evidence and reason code | unknown; blocks contract finalization |

Baseline mandatory denominator is 10. If the materiality review activates a mandatory regulatory/site requirement, the denominator becomes 11.

## Important requirements

| Code | Requirement | Dimension | Unit / period | History | Source/freshness | Owner | Readiness rule |
|---|---|---|---|---|---|---|---|
| `PHARMA_OWNERSHIP_GOVERNANCE` | Ownership and governance | Ownership & Governance / Risk | percent plus dated events; quarter/event | 4 quarters / 8 | exchange filings and official events; quarterly/material | evidence service | four quarters plus current governance-event review |
| `PHARMA_VALUATION_CONTEXT` | P/E and approved contextual comparison | Valuation | multiple; point-in-time/history | current plus reviewed history/peer context | market authority plus issuer/canonical fundamentals; market freshness | valuation service | current multiple and approved comparison context |
| `PHARMA_NEW_LAUNCH_CONTRIBUTION` | New product/brand launch contribution | Growth | revenue percent; year | 3 / 5 years | filing/presentation; annual | research service | three disclosed compatible periods |
| `PHARMA_CHRONIC_ACUTE_MIX` | Chronic versus acute therapy mix | Business Durability | revenue percent; year | 3 / 5 years | filing/presentation or approved licensed source; annual | research service | three compatible mix observations |
| `PHARMA_DOMESTIC_PIPELINE_EVIDENCE` | Domestic brand/therapy launch pipeline | Business Durability | dated events; event/year | current plus 3 years | filings, presentations, earnings calls; material event | evidence evaluator | reviewed material launches/entries and outcomes |

Important gaps reduce coverage/confidence; they do not enter mandatory readiness.

## Supplementary requirements

| Code | Requirement | Dimension | Source contract | Readiness behavior |
|---|---|---|---|---|
| `PHARMA_RND_INTENSITY_CONTEXT` | R&D intensity and productivity context | Business Durability | audited/issuer R&D plus revenue | visible, non-blocking; higher spend is not automatically positive |
| `PHARMA_INLICENSING_MA_EXECUTION` | In-licensing and M&A history | Management/Governance | filings, presentations and transaction evidence | visible, non-blocking |
| `PHARMA_EXPORT_US_REVENUE_CONTEXT` | Export/US revenue trend | Growth/Risk | issuer geographic disclosure | conditional supplementary unless reviewed methodology strengthens it |

## Conditional regulatory/site requirement

`PHARMA_REGULATORY_SITE_STATUS` becomes active and mandatory only after a reviewed materiality determination establishes material regulated-market manufacturing dependence. It requires current issuer/regulator site status, unresolved actions and material remediation evidence. Unknown condition state does not silently mean not applicable.

No numeric materiality threshold is approved. The owner must approve whether activation uses a disclosed revenue-share threshold, facility dependence, supply criticality, management segment classification, or a documented combination. Until then, the materiality-review requirement remains a blocker.

## Source and licensing boundary

| Evidence | Preferred sources | Restriction |
|---|---|---|
| domestic revenue | audited filing, annual report, investor presentation | do not substitute consolidated revenue |
| MR headcount/productivity | filing, presentation, earnings call | do not infer headcount from employee totals or expenses |
| therapy market share/brand rank | approved licensed market dataset; issuer claim with attribution | no unapproved scraping or reuse of licence-restricted data |
| launch contribution | filing, presentation, earnings call | qualitative claims do not become numeric percentages |
| chronic/acute mix | filing, presentation, approved licensed source | missing mix remains unavailable |
| regulatory/site status | issuer filing plus official regulator | unresolved source conflicts block readiness |

## Test specification before implementation

1. Parent requirements compose once without duplication.
2. Domestic overrides are explicit and versioned.
3. unknown materiality blocks contract finalization without activating a score.
4. reviewed active materiality adds regulatory/site to the mandatory denominator.
5. reviewed inactive materiality excludes that conditional requirement.
6. missing MR or market-share disclosure remains unavailable, never zero.
7. secondary exposures activate evidence only and do not produce multiple scores.
8. unknown subprofile falls back to parent and exposes a blocker.
9. no bank metric appears in the effective contract.
10. score readiness remains 0/not-ready without an approved scoring contract.
