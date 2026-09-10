# Stage 8.1 — Bank/NBFC Scoring Contract and CRISIL Pilot

## Purpose

Convert the Stage 8 scoring foundation into an explicit, auditable Bank/NBFC metric contract before calculating any live HDFCBANK score. The parent `PAI_STOCK_SCORE` V1 model remains `DRAFT` throughout this stage.

## Bank/NBFC score design

The profile remains nine-dimensional, with `CASH_FLOW` weighted at zero for lenders because industrial cash-flow rules are not appropriate for banks/NBFCs.

This stage adds metric-level weights and normalization rules but does not activate scoring. Inputs whose source semantics have not yet been verified are marked `PENDING_SOURCE` and cannot contribute to a live score.

### Quality

- ROE annual — 20%
- NIM TTM — 35%
- Gross NPA — 20%
- Net NPA — 25%

Quality therefore cannot become scorable from ROE alone. Asset quality and banking profitability must be present.

### Growth

- Advances growth YoY — 35%
- Deposits growth YoY — 30%
- EPS growth YoY — 35%

A current-quarter EPS value alone is not treated as growth evidence.

### Capital efficiency

- ROE annual — 60%
- ROA annual — 40%

ROE is presently available for HDFCBANK, but the model remains DRAFT and no score is emitted yet.

### Balance sheet / credit

- External long-term rating — 40%
- CET1 ratio — 20%
- Capital adequacy ratio — 15%
- Gross NPA — 10%
- Net NPA — 15%

External ratings are instrument-level evidence. PortfolioAI must preserve the agency, instrument class, symbol, outlook and action rather than collapsing all instruments into one uncontrolled company label.

### Valuation

Bank valuation is explicitly relative, not based on simplistic absolute P/E/P/B cut-offs:

- P/E TTM relative to bank/NBFC peers and the stock's own history — 45%
- generic P/B relative to peers and self-history — 35%
- P/B adjusted for ROE — 20%

The existing Trendlyne `PBV_ADJUSTED_PROVIDER` remains quarantined and is not treated as generic P/B.

### Momentum

Angel One remains price authority.

- 12-month price momentum — 40%
- 6-month price momentum — 30%
- 12-month relative strength — 30%

Trendlyne technical data may later corroborate but must not replace Angel One current-price authority.

### Ownership / governance

Static institutional ownership is context, not enough by itself to score governance.

- four-quarter institutional ownership trend — 60%
- insider/governance event signal — 40%

### Risk

Higher normalized Risk score means lower investment risk.

- Gross NPA — 25%
- Net NPA — 25%
- one-year maximum drawdown — 20%
- one-year volatility relative to bank peers / Nifty Bank — 15%
- external rating trend — 15%

## Normalization principles

The migration stores exact piecewise or ordinal rules for every currently specified input. All rules are versioned under the scoring model and remain reviewable.

Important safeguards:

- no AI-generated numeric score;
- no fuzzy metric matching;
- no score from stale/conflicting evidence without an explicit evidence policy;
- `PENDING_SOURCE` inputs never contribute;
- missing evidence reduces coverage rather than becoming zero;
- sector-specific rules take precedence over generic rules;
- valuation must use peer/self-history context for banks;
- absence of an external rating is `INSUFFICIENT`, not a negative score.

## HDFCBANK current scoring readiness

HDFCBANK currently has useful evidence including ROE, ROCE, diluted EPS, EBITDA, OPM, P/E, ownership and external Trendlyne evidence. However, a bank-specific overall score still needs key banking inputs such as NIM, GNPA, NNPA, CET1/CAR, banking growth history and price/relative-strength history.

Therefore HDFCBANK remains `PARTIAL`; this stage intentionally does not fabricate an overall score.

## CRISIL pilot evidence

The latest authoritative CRISIL rating rationale located for HDFC Bank is dated **23 June 2026**. It reports ratings reaffirmed at `Crisil AAA/Crisil AA+/Stable` and states:

- fixed deposits: `Crisil AAA/Stable` — reaffirmed;
- infrastructure bonds: `Crisil AAA/Stable` — reaffirmed;
- non-convertible debentures: `Crisil AAA/Stable` — reaffirmed;
- Tier II bonds: `Crisil AAA/Stable` — reaffirmed;
- Tier I bonds: `Crisil AA+/Stable` — reaffirmed;
- commercial paper: withdrawn.

Source: CRISIL Ratings official rating rationale for HDFC Bank Limited dated 23 June 2026.

The first PortfolioAI rating capture should therefore create instrument/category-level observations for the active long-term ratings and retain the withdrawal as an action/history event rather than pretending it is an active rating.

No CRISIL HTML body should be permanently retained until PortfolioAI has an explicit retention-rights policy for controlled public web evidence. Metadata and source URL may be retained as evidence references.

## Next gate

1. Apply the metric-rule migration while keeping `PAI_STOCK_SCORE` V1 DRAFT.
2. Add the current HDFCBANK CRISIL instrument-level observations as source-linked public evidence metadata.
3. Discover exact Trendlyne provider labels for NIM, GNPA, NNPA, CET1/CAR and bank growth metrics using the already-proven `get_parameter_values_multi_stock` contract.
4. Map and promote only exact verified fields.
5. Add Angel One derived momentum/drawdown inputs.
6. Recalculate HDFCBANK coverage.
7. Only when mandatory coverage gates pass, run the first deterministic score and render the heatmap.
