# Stage D16 — Dashboard Research & Intelligence Status

Status: **IMPLEMENTED ON REVIEW BRANCH — OWNER VISUAL APPROVAL PENDING**

## Purpose

Extend the Dashboard command centre with an executive view of research readiness using only evidence already stored in PortfolioAI.

This stage answers:

> How well researched is the portfolio, which evidence is stale or missing, and which holdings need attention?

## Dashboard content

### Research coverage summary

Shows:

- percentage of applicable holdings whose complete research coverage is fresh
- stale holdings
- missing holdings
- conflicting / review-required holdings
- latest stored research evidence date

### Domain coverage

Shows freshness across the existing evidence layers:

- provider identity
- fundamentals
- ownership
- valuation
- documents

The percentages are derived from the same cached coverage engine used by the Research Coverage page.

### Research attention queue

Ranks up to 12 holdings needing attention using existing coverage severity only:

1. conflicting evidence
2. review required
3. missing evidence
4. stale evidence

Each row links to the stock Research workspace and identifies the affected evidence domains and latest stored evidence age.

## Safety boundary

- No Supabase migration
- No Edge Function change
- No new provider/API call
- No AI call
- No recommendation/scoring policy change
- No transaction, holding, role, target, stop-loss or sizing mutation
- No refresh occurs from browsing the Dashboard

The component reuses `useResearchCoverage`, `buildResearchCoverage`, and the existing authenticated portfolio view. This preserves the cache-first Stage 7.2 research architecture.

## UI placement

The section is mounted below the Portfolio Structure & Action Center decision layer and above live Portfolio News.

## Validation gate before merge

- owner visual review on localhost
- TypeScript/typecheck
- targeted lint for changed TypeScript
- production build
- responsive desktop/tablet/mobile review
- confirm repository diff remains frontend/docs only
