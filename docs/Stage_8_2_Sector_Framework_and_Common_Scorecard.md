# Stage 8.2 — Sector Framework and Common Research Scorecard

## Purpose

Extend PortfolioAI beyond the Bank/NBFC pilot so every listed equity can use a consistent Research scorecard while the underlying metric applicability remains sector-aware.

## Scoring profiles

The framework registers GENERAL as the non-lender fallback plus dedicated profiles for Bank/NBFC, IT/Technology, Industrials/Capital Goods, Consumer/FMCG, Pharma/Healthcare, Auto/Auto Components, Energy/Utilities, Metals/Commodities, Infrastructure/Construction, Real Estate, and non-lender Financial Services.

Sector profiles begin from the GENERAL dimension weights. Any sector-specific weight or formula change must be introduced through a later reviewed migration; the initial overlay mainly controls applicability and relative emphasis.

## GENERAL metric contract

The common non-financial contract covers Quality, Growth, Capital Efficiency, Cash Flow, Balance Sheet/Credit, Valuation, Momentum, Ownership/Governance and Risk.

Verified existing fields such as ROCE Annual and OPM TTM can be referenced now. Historical growth, cash-conversion, leverage, peer-relative valuation and market-derived momentum/risk inputs remain PENDING_SOURCE until the required series and field semantics are verified.

Missing evidence never becomes an artificial zero.

## Sector overlays

Examples:

- IT/Technology: stronger emphasis on FCF conversion; leverage may be less material for net-cash businesses.
- Industrials/Capital Goods: CFO/EBITDA and leverage become more important because working capital and capital intensity matter.
- Consumer/FMCG: margin durability and cash conversion are emphasized.
- Pharma/Healthcare: operating margin durability and evidence/regulatory risk receive additional attention.
- Auto: multi-year growth and cash conversion are emphasized.
- Energy/Utilities: leverage is emphasized and simple EPS-growth interpretation is softened.
- Metals/Commodities: point-in-cycle P/E is de-emphasized while balance-sheet strength is emphasized.
- Infrastructure/Construction: working capital and interest coverage are emphasized.
- Real Estate: leverage is emphasized and simple P/E is de-emphasized.
- Non-lender Financial Services: industrial CFO/EBITDA is not generally applicable.

## Common Research UI

The Research Overview now has a common Stock Scorecard surface that displays:

- resolved scoring profile;
- model status;
- overall score only when an actual score run exists;
- evidence coverage and confidence;
- nine-dimension heatmap;
- explicit INSUFFICIENT cells when no valid score exists;
- external instrument-level ratings.

For HDFCBANK the CRISIL observations are visible in this panel. For non-financial stocks, the same visual language is used with the appropriate sector profile.

The model remains DRAFT and no overall score is fabricated merely to populate the UI.

## Portfolio boundary

Core/Satellite suitability remains downstream of validated scoring. PortfolioAI may later recommend a role, but portfolio membership and final role are always the user's decision. The approximate 35-stock Core design maximum remains a portfolio-construction limit, not a scoring limit.

## Next gates

1. Validate sector resolution against the actual portfolio sector taxonomy.
2. Promote the three verified HDFCBANK bank metrics from the captured Trendlyne evidence.
3. Complete the missing bank inputs and Angel One momentum/risk inputs.
4. Verify GENERAL metric mappings required by the first non-financial validation cohort.
5. Calculate HDFCBANK first, then validate 2–3 non-financial stocks from different sectors before activating broad scoring.
