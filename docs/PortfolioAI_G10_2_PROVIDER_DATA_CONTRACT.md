# PortfolioAI — G10.2 Provider/Data Contract

**Date:** 21 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** FROZEN FOR G10.2 REMAINDER

## Purpose

Stop transport/fallback experimentation and use provider capabilities deliberately.

## Authority order

### 1. Trendlyne MCP — primary research-data authority

Official Trendlyne MCP documentation states that `get_parameter_values_multi_stock` supports structured multi-stock retrieval across:

- financial statements;
- financial ratios;
- price and volume data;
- technical indicators;
- historical values of parameters.

Trendlyne MCP also exposes ownership/shareholding and promoter-pledge data through its ownership tool, plus document search for annual reports, investor presentations, earnings calls and qualitative segment/business evidence.

For G10.2 this means Trendlyne is the first source for:

- revenue / margins / ROCE;
- CFO / FCF / leverage;
- valuation;
- ownership / pledge;
- available EOD price-performance;
- available technical / momentum / risk parameters;
- qualitative business-durability evidence through document search when required.

References:

- https://help.trendlyne.com/support/solutions/articles/84000399411-what-capabilities-are-currently-available-in-the-trendlyne-mcp-server-
- https://help.trendlyne.com/support/solutions/articles/84000399410-what-data-is-not-included-in-the-trendlyne-mcp-server-

## 2. Angel One — secondary exact market-history authority

Official SmartAPI documentation confirms Historical API supports stocks and indices with `ONE_DAY` candles and up to 2,000 days in one request.

G10.2 should use Angel One only when exact raw daily OHLC history is still required after Trendlyne coverage is exhausted.

Reference:

- https://smartapi.angelone.in/docs/User

Current operational caveat: authenticated login is verified PASS locally, but `getCandleData` returned HTTP 403 during this session. That is treated as provider-path degradation, not a credential failure.

## 3. Fallbacks

NSE/Yahoo fallback code may remain in the repository for diagnostics, but is **not** part of the active G10.2 scoring path unless both primary/secondary authorities are unavailable and the methodology explicitly permits substitution.

## Execution rule

Before any further provider call:

1. inspect the three already-preserved Trendlyne responses;
2. produce exact ten-dimension coverage;
3. request only the missing Trendlyne parameter families in one narrow multi-stock call where possible;
4. use Angel One only for any mandatory raw-history metric Trendlyne cannot provide;
5. never repeat already-preserved calls.
