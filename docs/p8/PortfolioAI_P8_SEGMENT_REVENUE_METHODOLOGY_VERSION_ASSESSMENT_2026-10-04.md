# PortfolioAI P8 Segment-Revenue Classification — Methodology Version Assessment

Date: 4 October 2026  
Environment: Development only

## Official source evidence

The current official NSE Indices industry-classification methodology page is marked **Updated on 21/09/2023**. It documents:

- a four-tier classification structure;
- revenue as the basis for classification;
- one-line-of-business classification;
- for multi-business companies, a segment-revenue contribution **greater than 50%** of total revenue;
- Diversified treatment when no segment exceeds 50% under the documented 20% conditions;
- **audited consolidated annual financials** as the prime source;
- annual review and event-driven classification changes.

The current methodology page was preserved in:

`docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_METHODOLOGY_SOURCE_ASSESSMENT_2026-10-04.json`

Current methodology HTML SHA-256:

`5ef4f26fde3c3fc2d105adf27c6a3884e500a307c02bf89f866b687bb0cb3792`

## November-2022 vocabulary boundary

PortfolioAI's frozen taxonomy vocabulary is the official **NSE Indices Industry Classification Structure — November 2022**.

Official PDF SHA-256:

`ed6a4af212460747510ca551bb14634ab8ef81bb5dee59a33d5d6973e3129dd1`

The November-2022 PDF itself contains definition text using the concepts:

- `more than 50%`;
- `at least 20%`.

This supports continuity of the revenue-threshold concepts. However, the exact complete November-2022 methodology text was not found/preserved. Therefore PortfolioAI must **not** claim that the entire 21 September 2023 methodology was necessarily identical in November 2022.

## Safe research conclusion

The official evidence supports a **candidate** historical rule based on audited consolidated annual segment revenue and strict `>50%` dominance.

It does not itself authorize PortfolioAI retrospective use. OD1–OD3 remain owner-controlled policies.

The accounting implementation therefore measures the rule conditionally and reports candidate results separately from authoritative results.
