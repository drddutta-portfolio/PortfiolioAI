# R4N Gate G6.18 — Global Generics US Generic Price-Erosion Curve V1

**Status:** Proposal only / Global Generics-specific / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.18 begins the next non-Domestic PHARMA_V1 curve family with the mandatory Global Generics metric:

`PHARMA_US_GENERIC_PRICE_EROSION`

The Global Generics contract marks this metric as:

- applicable;
- mandatory;
- lower-is-better;
- quarterly/year history;
- disclosed price/ASP evidence only.

## Evidence boundary

The curve requires issuer-disclosed price or ASP evidence.

PortfolioAI must not infer price erosion residually from:

`revenue ÷ volume`

or similar derived approximations unless a separately approved method exists.

Minimum comparable history:

`4 quarters`

Preferred history:

`8 quarters`

Latest comparable period is mandatory.

## Methodology shape

Two components:

1. **Level — 70%**
   - statistic: median latest 4 comparable quarters;
2. **Trend — 30%**
   - statistic: latest erosion minus median of prior 3 comparable quarters.

Lower erosion is better.

A negative erosion observation represents pricing improvement rather than deterioration.

## Proposed level bands

| Median price erosion | Score |
|---|---:|
| < 0% | 100 |
| 0% to <3% | 85 |
| 3% to <5% | 70 |
| 5% to <8% | 55 |
| 8% to <12% | 35 |
| >=12% | 15 |

## Proposed trend bands

Trend:

`latest erosion - median prior 3 erosion`

Lower / more negative is better.

| Trend change | Score |
|---|---:|
| < -3 pp | 100 |
| -3 pp to <0 pp | 80 |
| 0 pp to <3 pp | 60 |
| 3 pp to <6 pp | 40 |
| >=6 pp | 20 |

## Why this is Global-Generics-specific

US generic pricing pressure is structurally important to Global Generics economics.

These bands must not be automatically applied to:

- Domestic Formulations;
- API/Bulk Drugs;
- CDMO/CRAMS;
- Biopharma/Biosimilars.

## Relationship to existing Global Generics Growth methodology

Global Generics already has a validated / not-active Segment Growth curve for:

`PHARMA_EXPORT_US_REVENUE_GROWTH`

G6.18 adds the mandatory price-pressure lane.

Revenue growth and price erosion remain separate evidence signals.

Strong revenue growth must not erase severe price erosion, and improving pricing must not substitute for missing growth evidence.

## Explicit boundary

- Global Generics-specific price-erosion curve proposed: **YES**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- cross-subprofile threshold reuse: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.18 cards, and run focused validation.

After validation, the next Global Generics-specific slice should address the next mandatory/structurally critical Global Generics evidence family without borrowing Domestic thresholds.
