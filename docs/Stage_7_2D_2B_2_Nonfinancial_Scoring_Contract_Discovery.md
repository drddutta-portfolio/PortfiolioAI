# Stage 7.2D.2B.2 — Non-financial scoring contract discovery

## Purpose
Verify Trendlyne's exact structured field vocabulary for the first non-financial scoring cohort before any canonical promotion or score run.

## Validation cohort
- INFY — IT / Technology — Trendlyne instrument 630
- M&M — Auto / Auto Components — Trendlyne instrument 807
- TORNTPHARM — Pharma / Healthcare — Trendlyne instrument 1409

All three are current open holdings with reviewed scoring-profile assignments and matched Trendlyne identities.

## One-call discovery design
`discover-trendlyne-nonfinancial-scoring-contract` performs exactly one `get_parameter_values_multi_stock` provider tool call for the three-stock cohort. It requests scoring-oriented fundamentals only: three-year revenue/PAT/EPS growth, ROCE, ROE, OPM, EBITDA, CFO, leverage, interest coverage, P/E and P/B.

The pilot intentionally does not request current price authority or create momentum observations. Angel One remains the canonical current-price/trading authority.

## Safety controls
- authenticated owner only;
- current portfolio ownership required;
- all three securities must be open EQUITY holdings;
- reviewed scoring profile required for every cohort member;
- matched Trendlyne identity required;
- source entitlement and retention rights required;
- provider ingestion kill switch respected;
- one internal unit reserved before provider access;
- no retry;
- one usage event for the physical provider tool attempt;
- budget settlement required;
- immutable raw capture in `data_source_records` with record kind `NONFINANCIAL_SCORING_CONTRACT_DISCOVERY`;
- no canonical fundamental writes;
- no score run;
- no scoring-model activation;
- no Core/Satellite or portfolio-role mutation.

## Next gate
After the owner executes the endpoint once from an authenticated PortfolioAI browser session, reconcile accounting and raw capture, inspect exact provider field labels, approve only unambiguous mappings, and then build the controlled parser/promotion path. Do not repeat the provider call until the first capture has been fully reviewed.
