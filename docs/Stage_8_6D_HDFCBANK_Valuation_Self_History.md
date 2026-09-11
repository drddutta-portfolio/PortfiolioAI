# Stage 8.6D — HDFCBANK Valuation Self-History

## Objective

Make the BANK_NBFC Valuation dimension score-ready without inventing an absolute P/E band or accepting the quarantined Trendlyne adjusted P/B as generic P/B.

## Reviewed signal

PortfolioAI now uses the exact captured Trendlyne field `Fair Price 5YrPE Upside%` as a **self-history relative valuation** signal. The metric is stored canonically as `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`.

The wording “implied upside” is intentionally preserved. This is not treated as intrinsic fair value, a price target, or an instruction to buy. It reflects the provider's comparison of current P/E with the stock's own 5-year average P/E.

For HDFCBANK, the previously captured exact value is **75.51%**. No new provider call is required.

## BANK_NBFC valuation weights

The Valuation dimension remains 100% total weight:

- P/E versus own 5-year average: **60%** — REVIEWED and score-ready.
- Generic P/B relative valuation: **25%** — still pending a clean generic P/B contract and benchmark.
- Valuation relative to ROE: **15%** — still pending clean generic P/B plus reviewed derivation.

This allows the dimension to cross the existing 60% score-ready gate using one exact, high-quality self-history signal while keeping the unready P/B paths visible rather than manufacturing values.

## Normalization

The reviewed P/E self-history signal is normalized deterministically:

- implied upside >= 30% → 100
- >= 15% → 80
- >= -5% → 60
- >= -20% → 40
- below -20% → 20

The neutral zone around zero recognizes that trading close to the 5-year P/E norm is not automatically cheap or expensive.

## Safety and authority boundaries

- No Trendlyne call is made by this stage.
- The existing `PBV_ADJUSTED_PROVIDER` remains quarantined/conflicting and is not used as generic P/B.
- Angel One remains the current-price authority.
- No official score run is created; this changes only the read-only scoring preview.
- No portfolio holdings, roles, target prices, or Core/Satellite assignments are changed.
- Future peer-relative P/E/P/B evidence may augment this dimension, but must not silently replace this reviewed self-history contract.
