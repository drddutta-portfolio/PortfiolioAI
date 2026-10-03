# PortfolioAI P8-B Recovery — Workstream B Adapter Entry

Date: 3 October 2026  
Environment: Development only  
Branch: `PortfolioAI-Development`  
Status: WORKSTREAM B STARTED — ADAPTER/CENSUS IMPLEMENTATION

## Implemented repository controls

- historical identity/source adapter;
- NSE filing metadata adapter;
- BSE ISIN-anchored fallback adapter;
- metadata-only feasibility census function;
- fixture canaries for exact ISIN, dated NSE symbol/name, BSE fallback and strict-before-decision.

Files:

- `src/features/backtesting/p8BRecoverySourceAdapters.ts`
- `src/features/backtesting/p8BRecoverySourceAdapters.test.ts`

## Important boundary

This code consumes metadata only. It does not download XBRL/PDF/CSV filing bodies, call Trendlyne/Angel One, mutate hosted B5/B6, calculate outcomes, or start P8-C.

The full 4,524-identity / 121,956-eligible-pair feasibility census is not claimed complete until official NSE/BSE metadata is indexed through these adapters. The census keeps the recovery exclusion ceiling as `PENDING_OWNER_FREEZE`.
