# PortfolioAI — Gate H H2 Local Market Evidence Lock

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** LOCAL EVIDENCE VALIDATED / SCORE INPUTS LOCKED / NO FINAL COMPANY SCORE

## Local evidence acquired

Environment:

- local Supabase only
- provider: Angel One
- stock: TORNTPHARM
- benchmark: NIFTY Pharma
- stock candles: 270
- benchmark candles: 270
- common daily returns used for volatility ratio: 247
- common lookback: 17 Sep 2025 to 17 Sep 2026

### TORNTPHARM market metrics

- 12M return: **35.6730391882%**
- 6M return: **13.3436373036%**
- max drawdown 1Y: **10.3193882141% absolute**
- annualized 1Y volatility: **22.0003295840%**

### NIFTY Pharma benchmark metrics

- 12M return: **18.3205719941%**
- annualized 1Y volatility: **13.720605%**

### Derived relative metrics

- relative strength 12M: **17.3524673888 percentage points**
- relative-volatility ratio: **1.603452**

## Approved deterministic Momentum score

Approved G-FINAL-2 methodology:

- 12M absolute return = 35.6730% -> score 100
- 6M absolute return = 13.3436% -> score 80
- 12M relative strength = 17.3525pp -> score 100

Weights:

- absolute 12M: 40%
- absolute 6M: 25%
- relative strength 12M: 35%

Result:

`100*0.40 + 80*0.25 + 100*0.35 = 95`

**Momentum = 95**

## Approved deterministic Risk score

Regulatory Context had already been independently resolved:

- regulatory context = CLEAR -> 100

Market inputs:

- stored max drawdown evidence = +10.3194% absolute magnitude
- approved Risk evaluator input = **-10.3194% signed**
- relative-volatility ratio = 1.603452

Band results:

- Regulatory Context = 100
- Max Drawdown = 100
- Relative Volatility = 20

Weights:

- Regulatory Context: 40%
- Max Drawdown: 35%
- Relative Volatility: 25%

Result:

`100*0.40 + 100*0.35 + 20*0.25 = 80`

**Risk = 80**

## Safety boundary

- local Supabase writes only
- no production Supabase write
- no official score run
- no score persistence
- no recommendation
- no position sizing
- no scheduler change
- no PR merge

## H2 impact

Resolved deterministic H2 dimensions now include:

- Quality = 92
- Growth = 78.25
- Capital Efficiency = 79
- Cash Flow = 93.6
- Balance Sheet / Credit = 65
- Ownership / Governance = 70
- Momentum = 95
- Risk = 80

Still unresolved:

- Business Durability final combined score, blocked only by Brand / Therapy Leadership licensed cross-check
- Valuation, blocked by current self-history / current market authority and reviewed peer cohort

H3 final company scoring remains prohibited until H2 is fully complete.
