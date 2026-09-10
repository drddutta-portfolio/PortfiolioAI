# Stage 8.6C.2 — HDFCBANK Primary-Filed Growth Evidence

## Decision

Trendlyne discovery did not return exact Advances Growth YoY or Deposits Growth YoY fields for HDFCBANK. The BANK_NBFC Growth contract therefore uses issuer/exchange primary evidence for these two inputs rather than semantic substitution.

## Reviewed metric contracts

- `ADVANCES_GROWTH_YOY` means **period-end gross advances year-on-year growth**. It must not be substituted with advances under management or average advances.
- `DEPOSITS_GROWTH_YOY` means **period-end total deposits year-on-year growth**.

Both inputs use source `COMPANY_EXCHANGE_FILING`, period type `QUARTER`, canonical unit `PERCENT`, and a 120-day freshness contract.

## HDFCBANK June 2026 observations

For the quarter ended 30 June 2026, the retained public-fact evidence stores:

- Gross advances, period end: INR 30,610 billion; YoY growth **15.4%**.
- Deposits, period end: INR 31,705 billion; YoY growth **14.7%**.

The source record stores metadata and extracted public facts only. No filing body is retained.

## Growth scoring consequence

The existing BANK_NBFC piecewise rules are retained unchanged:

- Advances Growth YoY weight: 35%. A 15.4% value scores 80/100.
- Deposits Growth YoY weight: 30%. A 14.7% value scores 80/100.
- EPS Growth YoY weight: 35%. The existing 18.37% value scores 100/100.

The resulting HDFCBANK Growth preview is therefore 87/100 with 100% score-ready Growth coverage, subject to the existing read-only scoring preview rules.

## Safety and authority

- No additional Trendlyne call was made.
- The Trendlyne discovery capture remains evidence of source insufficiency and is not promoted.
- No official score run is created.
- The scoring model remains DRAFT.
- No portfolio role or holding is changed.
