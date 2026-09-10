# Stage 8.6A — Valuation and Ownership Score Readiness

## Goal

Increase score-ready coverage using already-retained evidence without spending provider quota, while refusing to fabricate valuation benchmarks.

## Ownership / Governance

The Complete Research Refresh ownership response already retained quarterly Trendlyne history in the immutable source record. Stage 8.6A promotes those exact quarterly aggregate series into canonical observations for Promoter, FII/FPI, DII, Mutual Fund and Public holdings.

For the BANK_NBFC profile, `INSTITUTIONAL_OWNERSHIP_TREND` is now a reviewed derived signal:

`latest(FII/FPI + DII) - same-quarter-prior-year(FII/FPI + DII)`

Requirements:

- at least five quarterly observations so four quarter intervals exist;
- both FII/FPI and DII must be available for the same periods;
- observations must be fresh and AVAILABLE;
- no missing quarter is silently converted to zero.

Normalization in percentage points:

- >= +3 pp → 100
- >= +1 pp → 80
- >= -1 pp → 60
- >= -3 pp → 40
- < -3 pp → 20

The signal carries 60% of the BANK_NBFC Ownership/Governance dimension. The remaining 40% insider/governance-event contract remains pending. Therefore a valid four-quarter ownership trend can cross the existing 60% dimension coverage gate without pretending that insider-event evidence exists.

For HDFCBANK, retained data shows combined FII/FPI + DII at 84.8% in Jun 2025 and 83.8% in Jun 2026, a -1.0 percentage-point four-quarter change. Under the reviewed bands this is a neutral 60/100 signal.

## Valuation

No valuation score is activated in this stage. HDFCBANK P/E TTM is reviewed evidence, but the BANK_NBFC valuation rule explicitly requires a trusted peer series plus self-history. PortfolioAI currently lacks a sufficiently reviewed bank/NBFC peer universe and five-year canonical self-history, so valuation correctly remains `INSUFFICIENT` rather than using an arbitrary absolute P/E band.

This is intentional. Future Stage 8.6 valuation work must first establish:

1. reviewed bank/NBFC peer membership;
2. period-qualified historical P/E/P/B series;
3. a clean generic P/B contract (never the quarantined provider-adjusted P/B field);
4. minimum sample and freshness rules for peer percentile calculation.

## Safety and authority

- No Trendlyne calls are made by this stage.
- No official score run is created.
- The scoring model remains DRAFT.
- No portfolio role or holding is mutated.
- Trendlyne remains research evidence authority; Angel One remains current-price / market-data authority.
- Provider-adjusted P/B remains quarantined and is not used as generic P/B.
