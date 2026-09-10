# Stage 7.2D — Complete Research Refresh

## Purpose

Complete Research Refresh is an owner-triggered, single-security deep refresh available from a held equity's Research page. It is designed to improve investment-research completeness without silently spending provider quota or creating investment decisions.

## Planning and execution

Planning makes **zero** Trendlyne provider calls. The plan shows the current internal usage budget, projected usage, and the exact expected provider cost before execution.

A confirmed execution reserves **4 internal provider units** and performs at most four non-retried Trendlyne tool attempts:

1. Overview and core fundamentals — `get_overview_news_corp_events(..., overview)`
2. Detailed scoring metrics — `get_parameter_values_multi_stock(...)`
3. Ownership and promoter pledge — `get_ownership_deals_insider_sast(..., shareholding)`
4. Documents and evidence discovery — `get_document_search_results(...)`

The first overview call revalidates the stored Trendlyne instrument ID and symbol. If it fails identity validation, the remaining three calls are not attempted and their reserved units are released.

## Canonical-write policy

The overview parser continues to write only the already approved overview metric contract. The structured-data call is captured immutably, but only exact reviewed labels are promoted to canonical observations. Current approved deep mappings include ROCE Annual, OPM TTM, promoter pledge, Gross NPA, Net NPA and quarterly EPS YoY growth when those exact labels are present for the exact requested entity.

Missing or unreviewed provider fields remain evidence only and are not converted into canonical scoring inputs.

Ownership observations use the existing aggregate ownership parser. Document search stores metadata/source appearances only; document bodies are not retained and document identity remains `REVIEW_REQUIRED` until independently verified.

## Authority boundaries

- Trendlyne MCP: research fundamentals, ratios, ownership and document discovery.
- Angel One: current market price and later price-derived momentum/risk authority.
- Rating agencies/company/exchange sources: their own authoritative evidence where separately integrated.

Complete Research Refresh does not overwrite current price, activate the scoring model, create an official score run, assign Core/Satellite roles, or mutate portfolio holdings.

## Safety

- Open held equities only.
- Verified Trendlyne identity required.
- Explicit owner confirmation required.
- Daily and per-run internal budgets enforced.
- Provider entitlement and retention-rights gates enforced.
- One usage event per physical provider attempt.
- No automatic retries.
- Budget reservation/settlement and operation lease are mandatory.
- Partial accepted evidence may be retained if a later domain fails, and the run is marked `PARTIAL` rather than pretending full completion.
