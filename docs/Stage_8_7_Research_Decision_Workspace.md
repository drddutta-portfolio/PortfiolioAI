# Stage 8.7 — Research Decision Workspace

## Purpose

Convert the Research page from an evidence-heavy technical view into a user-facing investment decision workspace without changing scoring authority, portfolio membership, or provider ownership.

## Delivered

- DB-backed user controls for target price, stop-loss price, portfolio role, target weight and investment horizon.
- Target and stop-loss alert-enable flags stored now for a future notification engine.
- Explicit separation between `PortfolioAI suggestion` and `Your selected role`; the recommendation layer remains advisory and is not implemented as an automatic role mutation.
- Interactive heatmap evidence: each dimension contains an expandable `Why this score?` panel with its configured signals.
- Compact multi-agency external-rating presentation with agency summaries and expandable instrument-level detail.
- Financials reorganized into decision-oriented groups (profitability/returns, asset quality/capital, growth, earnings/cash evidence, other fundamentals).
- Quality & Growth separated into two professional evidence panels.
- Ownership shows a clean latest snapshot plus a deduplicated quarterly trend matrix; repeated ingestion copies remain visible in the Evidence ledger.
- Valuation separates market multiples, historical context, market context and other evidence. Provider implied upside is explicitly not treated as the user's target price.

## Safety and authority

- No provider calls are introduced.
- No `stock_score_runs` rows are created.
- No portfolio role is changed by PortfolioAI recommendations.
- User-entered target/stop levels are portfolio settings, not research observations.
- RLS on `portfolio_security_settings` remains the write boundary for the logged-in portfolio owner.
- Notification execution is not included in this stage; only alert-ready storage is added.

## Follow-on

1. HDFCBANK canonical sector/industry completion and final document/evidence cleanup.
2. Scoring-model validation before any official persisted score is activated.
3. Advisory PortfolioAI role recommendation layer (Core/Satellite/etc.) shown separately from user choice.
4. Price-alert service that evaluates current Angel One price against user target/stop levels and emits deduplicated notifications.
5. Replicate the validated BANK/NBFC research workflow to ICICIBANK, SBIN and FEDERALBNK before broader sector-by-sector rollout.
