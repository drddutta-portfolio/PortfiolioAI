# Stage D18 — Dashboard Portfolio Risk & Concentration

Status: **IMPLEMENTED ON REVIEW BRANCH — OWNER VISUAL APPROVAL PENDING**

## Purpose

Extend the Dashboard command centre with a read-only view of where portfolio risk is concentrated using evidence already available in PortfolioAI.

This stage answers:

> Where is portfolio risk concentrated, and which holdings combine multiple warning conditions?

## Dashboard content

### Executive risk summary

Shows:

- largest priced holding and its portfolio weight;
- Top 5 concentration across priced holdings;
- largest sector exposure;
- stale-price exposure as a share of priced capital;
- research-risk exposure as a share of priced capital whose applicable research coverage is not fully fresh.

### Concentration map

Shows the largest sector exposures by current priced value and weight. It also reports the priced exposure currently held in **Unclassified** portfolio-role positions.

### Risk attention queue

Ranks up to 12 current holdings using only deterministic/read-only conditions already stored in PortfolioAI:

- current portfolio weight above the user-configured maximum weight;
- stale current market price;
- missing current market price;
- unclassified portfolio role;
- conflicting/review-required research evidence;
- missing research evidence;
- stale research evidence;
- material portfolio weight context.

The queue does not create a new recommendation or risk score. The numeric priority is a UI ordering device only and is not persisted as investment intelligence.

## Safety boundary

- No Supabase migration
- No Edge Function change
- No provider/API call
- No AI call
- No recommendation/scoring execution
- No transaction, holding, role, target, stop-loss or sizing mutation
- No trade/order execution
- No automatic portfolio-role change

The component reuses the authenticated portfolio view and existing cache-first research coverage engine.

## UI placement

The section is mounted below **Portfolio Structure & Action Center** and above **Research & Intelligence Status**.

## Validation gate before merge

- owner visual review on localhost;
- TypeScript/typecheck;
- targeted lint for changed TypeScript;
- production build;
- responsive desktop/tablet/mobile review;
- confirm repository diff remains frontend/docs only.
