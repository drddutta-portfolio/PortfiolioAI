# PortfolioAI — Gate H H2 Pharma Valuation Contract Discovery Authorization

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** LOCAL-ONLY DISCOVERY READY / EXECUTION NOT YET AUTHORIZED

## Why this is needed

The local valuation prerequisite audit established:

- TORNTPHARM exists locally;
- MANKIND, ERIS and EMCURE do not yet exist locally;
- no local Trendlyne identities exist for the four-stock valuation set;
- `PE_TTM` is registered locally;
- `EV_EBITDA` is not yet registered locally;
- no local PE / EV-EBITDA / self-history observations exist.

Therefore PortfolioAI must discover the exact provider identity and valuation field contract before creating peer rows or persisting peer observations.

## Local-only discovery function

Added:

`discover-trendlyne-pharma-valuation-contract`

Purpose:

1. discover Trendlyne identity candidates for:
   - MANKIND
   - ERIS
   - EMCURE
2. issue one exact multi-stock valuation query covering:
   - TORNTPHARM
   - MANKIND
   - ERIS
   - EMCURE
3. request exact current provider labels/values for:
   - trailing P/E / PE TTM
   - EV/EBITDA
4. retain raw discovery capture for review.

## Exact provider call envelope

- MANKIND identity search: 1
- ERIS identity search: 1
- EMCURE identity search: 1
- four-stock valuation contract query: 1

**New Trendlyne calls requested = 4**

These are separate from the already-approved TORNTPHARM self-history refresh.

## What this discovery does NOT do

- no peer security insertion;
- no Trendlyne identity promotion;
- no `EV_EBITDA` metric-definition promotion;
- no fundamental-observation insertion;
- no peer assignment persistence;
- no score calculation;
- no production mutation.

Operational accounting and immutable raw discovery capture occur only in the local Supabase environment during local execution.

## Post-discovery decision

Only after reviewing the actual provider response may H2:

- create local peer securities using verified identities;
- register the exact reviewed `EV_EBITDA` provider mapping;
- acquire fresh PE_TTM + EV_EBITDA evidence;
- compute peer medians;
- calculate the owner-approved peer-relative valuation score.

No guessed provider label is allowed.

## Requested authorization phrase

`APPROVE H2 LOCAL PHARMA VALUATION CONTRACT DISCOVERY — MAX 4 TRENDLYNE CALLS`
