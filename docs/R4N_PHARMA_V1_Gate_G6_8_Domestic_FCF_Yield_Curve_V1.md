# R4N Gate G6.8 — Domestic Formulations FCF-Yield Corroboration Curve V1

**Status:** Proposal only / numeric subcomponent bands / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.8 defines a Domestic Formulations-specific numeric curve for the Valuation component:

`CASH_FLOW_CORROBORATION`

using the now-validated canonical metric:

`FCF_YIELD_PERCENT`

This is not a standalone Valuation score and does not make the 12% Valuation dimension ready.

## Why FCF yield is a corroboration component

G5.4 defines Valuation as a three-part methodology:

1. self-history relative valuation;
2. peer-relative valuation;
3. cash-flow corroboration.

G6.2 already proposed the Domestic self-history subcurve.

G6.8 addresses only the cash-flow corroboration lane.

A high FCF yield supports the conclusion that valuation is backed by actual cash generation. A low or negative yield weakens that conclusion, but must not by itself decide whether the stock is cheap or expensive.

## Canonical metric

`FCF_YIELD_PERCENT`

Formula:

`(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100`

The metric identity and derivation were validated in G6.4–G6.7.

## Proposed Domestic Formulations V1 bands

| FCF yield | Score | Interpretation |
|---|---:|---|
| >= 5.0% | 100 | High cash-flow yield / strong valuation corroboration |
| >= 3.0% and < 5.0% | 80 | Good cash-flow yield / positive corroboration |
| >= 1.5% and < 3.0% | 60 | Moderate cash-flow yield / neutral-to-positive corroboration |
| >= 0% and < 1.5% | 40 | Low positive cash-flow yield / weak corroboration |
| < 0% | 20 | Negative free cash flow / adverse corroboration |

## Economic interpretation

These levels can be read approximately as inverse FCF multiples:

- 5% yield ≈ 20x annual FCF;
- 3% yield ≈ 33.3x annual FCF;
- 1.5% yield ≈ 66.7x annual FCF.

That makes the curve interpretable without introducing an absolute P/E rule.

The bands are deliberately broad because this is corroboration, not intrinsic valuation.

## Negative FCF

Negative FCF remains negative evidence.

It is not:
- clamped to zero;
- treated as missing;
- silently neutralized.

A negative FCF yield receives the lowest proposed corroboration score, 20.

## Required evidence

G6.8 inherits the G6.4/G6.6 authority contract:

- latest completed annual `FREE_CASH_FLOW_ANNUAL`;
- current authoritative market-cap denominator;
- current market-price semantics;
- stale market-cap evidence prohibited;
- invalid/non-positive market cap fails closed.

## Scope boundary

Applies only to:

`DOMESTIC_FORMULATIONS`

Must not automatically apply to:

- `GLOBAL_GENERICS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

Those models require their own reviewed valuation corroboration methodology.

## Incomplete Valuation boundary

Even after G6.8:

- self-history subcurve exists;
- FCF corroboration subcurve exists;
- peer-relative valuation remains **UNAPPROVED**;
- component weights remain **UNAPPROVED**.

Therefore:

`whole Valuation dimension ready = NO`

## Explicit non-activation boundary

- numeric FCF-yield bands proposed: **YES**
- standalone valuation verdict: **NO**
- peer-relative component approved: **NO**
- component weights approved: **NO**
- whole Valuation dimension ready: **NO**
- persistent FCF-yield metric registration: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.8 cards, and run focused validation.

Only after G6.8 validation should the project decide whether to complete the peer-relative Valuation lane or move to another Domestic Formulations-specific G6 family.
