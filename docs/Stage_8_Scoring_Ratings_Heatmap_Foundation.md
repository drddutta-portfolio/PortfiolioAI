# Stage 8 — Scoring, Ratings and Heatmap Foundation

## Purpose

Turn PortfolioAI research from an evidence viewer into an auditable decision-support system while preserving the principle that the user, not the software, decides whether a security belongs in Core, Satellite, Watchlist or nowhere.

This stage creates the data model and deterministic scoring contract. It does **not** yet activate portfolio recommendations or automatically classify holdings.

## Decision pipeline

`raw evidence -> canonical observations -> normalized metric scores -> dimension scores -> heatmap -> investment profile -> later Core/Satellite suitability -> user decision`

AI may explain results, but the numeric score must be deterministic and reproducible from stored evidence and a versioned scoring model.

## Scoring dimensions

PortfolioAI V1 uses nine dimensions. Evidence Confidence is reported separately and never used to hide missing data.

1. QUALITY
2. GROWTH
3. CAPITAL_EFFICIENCY
4. CASH_FLOW
5. BALANCE_SHEET_CREDIT
6. VALUATION
7. MOMENTUM
8. OWNERSHIP_GOVERNANCE
9. RISK

### General-equity model weights

| Dimension | Weight |
| --- | ---: |
| Quality | 15 |
| Growth | 18 |
| Capital Efficiency | 12 |
| Cash Flow | 12 |
| Balance Sheet / Credit | 10 |
| Valuation | 13 |
| Momentum | 10 |
| Ownership / Governance | 5 |
| Risk | 5 |
| **Total** | **100** |

### Bank / NBFC model weights

Traditional industrial cash-flow rules are not appropriate for lenders, so Cash Flow is not weighted in the Bank/NBFC profile.

| Dimension | Weight |
| --- | ---: |
| Quality | 18 |
| Growth | 15 |
| Capital Efficiency | 12 |
| Cash Flow | 0 |
| Balance Sheet / Credit | 20 |
| Valuation | 15 |
| Momentum | 10 |
| Ownership / Governance | 5 |
| Risk | 5 |
| **Total** | **100** |

## Deterministic score contract

Every component metric is normalized to 0–100 using a versioned rule. No fuzzy or AI-generated numeric score is permitted.

A dimension score is the weighted mean of its available normalized metric scores:

`dimension_score = sum(metric_score * metric_weight) / sum(available_metric_weight)`

A dimension is not considered scorable unless its evidence coverage is at least 60% of the configured metric weight for that dimension.

Overall score is calculated only when at least 70% of total model weight is represented by scorable dimensions. Mandatory anchors are:

- General equity: Quality, Growth, Valuation and Risk.
- Bank/NBFC: Quality, Growth, Balance Sheet/Credit, Valuation and Risk.

If those gates are not met, the stock remains `PARTIAL` and PortfolioAI must not fabricate an overall score.

### Heatmap states

| Normalized score | State |
| --- | --- |
| 80–100 | STRONG |
| 65–79.99 | POSITIVE |
| 50–64.99 | NEUTRAL |
| 35–49.99 | WEAK |
| 0–34.99 | RISK |
| no valid score | INSUFFICIENT |

## Evidence confidence

Confidence is distinct from investment quality. A company can look strong while confidence remains low because history is incomplete.

For V1:

`confidence = coverage_percent * freshness_factor * evidence_quality_factor`

where each factor is stored with the run and bounded to 0–1. The resulting displayed confidence is 0–100.

The scoring engine must preserve the observation IDs, external-rating IDs, metric weights, normalized scores and contributions used in each run so any score can be reconstructed later.

## External ratings and credit quality

Agency ratings are first-class evidence and are not collapsed into one raw company rating. Each observation stores:

- agency;
- instrument/category;
- rating symbol;
- outlook/watch;
- rating action;
- rating/action date;
- source URL;
- retrieved/fresh-until timestamps;
- evidence status;
- optional retained raw evidence reference.

Initial agency registry:

- CRISIL Ratings
- ICRA
- CARE Ratings
- India Ratings & Research
- Fitch Ratings
- Moody's Ratings
- S&P Global Ratings

For banks/NBFCs, external credit evidence is a material input to `BALANCE_SHEET_CREDIT`. For companies without rated debt, absence of a rating is `INSUFFICIENT`, not a negative score.

Rating changes such as upgrade, downgrade, reaffirmation, watch positive/negative and outlook changes must remain historically visible.

## Source authority

- Angel One remains current market-price/trading authority.
- Trendlyne MCP supplies approved fundamentals, ratios, technicals, shareholding, insider activity and document discovery.
- Rating agencies are authoritative for their own ratings.
- Company/exchange filings are primary-source validation where available.
- HTML scraping is fallback/enrichment only where lawful and where a structured/API source is unavailable.

PortfolioAI should not scrape the Trendlyne public equity page for data already available through the paid MCP.

## Metric acquisition policy

Do not ingest all 3,500+ Trendlyne parameters. Add only metrics required by the active scoring model.

The next metric-contract PR must define the exact provider field, canonical code, unit, period semantics, scoring dimension and normalization bands for every metric before it affects a score.

Priority groups:

- profitability and returns: ROE, ROCE, margins;
- growth: revenue/PAT/EPS growth and consistency;
- capital efficiency and cash conversion;
- leverage/balance-sheet or bank-specific solvency/asset-quality metrics;
- valuation: P/E, P/B and sector-appropriate measures;
- momentum: price trend and technical confirmation without replacing Angel One as price authority;
- ownership/governance: promoter, institutional ownership, pledge and insider activity;
- risk: leverage, drawdown/volatility, deteriorating fundamentals, rating actions and evidence conflicts.

## Score versioning

Scoring models are immutable once activated. A formula change creates a new model version. Historical score runs remain linked to the model version that produced them.

No migration or formula update may rewrite historical runs merely to make them match a newer methodology.

## Research UI target

The Research Overview should eventually display:

- overall score only when the scoring gate passes;
- dimension cards with 0–100 scores;
- evidence coverage and confidence;
- heatmap states;
- Fundamental Strength, Valuation, Momentum, Credit Strength and Risk profile labels;
- external agency ratings and recent rating actions;
- direct links to the evidence ledger.

The detailed tabs remain the source of truth.

## Core / Satellite boundary

Core/Satellite suitability is deliberately downstream of scoring and is not implemented by this foundation.

PortfolioAI may later recommend `CORE_SUITABLE`, `SATELLITE_SUITABLE`, `BOTH`, `WATCHLIST` or `INSUFFICIENT_EVIDENCE`, but the user retains final control of portfolio membership and role.

Approximately 35 Core stocks is a maximum design limit by count, not a target and not an automatic constraint on research coverage.

## Immediate implementation gates

1. Create versioned score/rating schema.
2. Register V1 as `DRAFT`; do not calculate live overall scores yet.
3. Build exact metric normalization rules only after source fields are verified.
4. Add rating-agency collectors separately and conservatively.
5. Calculate HDFCBANK first.
6. Manually reconcile its component scores against evidence.
7. Only then activate the model and build Core/Satellite suitability.
8. Widen monthly Trendlyne ingestion only after HDFCBANK and a small validation cohort pass.