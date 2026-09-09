# Stage 7.2D.2B.3 — Controlled Trendlyne Contract Discovery Pilot

## Purpose

Run a narrowly bounded subscribed-provider discovery against one already verified held equity so PortfolioAI can observe the exact MCP parameter metadata for four high-priority missing research metrics:

- ROCE
- diluted EPS
- EBITDA
- operating margin

## Safety boundary

This slice:

- performs parameter discovery only;
- does not call `get_parameter_values` yet;
- does not write research evidence;
- does not modify metric definitions;
- does not widen Cohort A;
- does not enable manual refresh execution;
- does not change any portfolio, accounting, role, theme or market-price data.

The discovery function authenticates the owner, validates the portfolio and open held equity, requires an existing matched Trendlyne provider identity, then issues exactly four `search_parameters` calls. The provider responses are returned for review only.

## Acceptance

Before deployment:

```bash
npm test
npm run typecheck
npm run lint
npm run lint:edge
npm run test:edge
npm run build
git diff --check
```

After deployment, invoke once against a previously verified Cohort A equity. Confirm observed provider usage rises by exactly four attempts and that no research observation count changes. Only after reviewing the returned parameter metadata may any executable field name be promoted into `TRENDLYNE_PARAMETER_CONTRACT_V1` or used by `get_parameter_values`.