# PortfolioAI — AI Insights Build Plan (15 October 2026)
**Branch:** PortfolioAI-Development only. **Status:** UI changes committed; full investment intelligence engine planned, not implemented.
## UI delivered
Preserve the approved Results grid and four-card layout. Neutral compact AI Insight now presents an independently derived quarterly grade, a deliberately unassessed investment action, a short source-selected comparison summary and an accessible **View Full Analysis** toggle. The expanded, responsive section below the four cards has eight sections (executive summary; financial performance; historical comparison; industry; valuation; management; risks; investment action) and a collapsible methodology/evidence area. It does not simulate a BUY, ADD, HOLD, WATCH or EXIT decision before qualifying a decision engine. Existing Source & verification details stay intact.
## AI-1 — Data audit and reuse
Inventory already-qualified Results, prices, financial statements, classifications, holdings/closed positions and V1-4 research in Supabase/R2. Check issuer identity, periods, scope, units, corporate actions, available-at and verification provenance. Only query external sources for gaps. **Exit:** security/factor coverage and missing-data readback.
## AI-2 — Financial comparisons
QoQ/YoY, four-quarter trajectory, annual quality, profit, margin and cash-flow patterns; sector-specific bank/NBFC, pharma, IT, industrial and other appropriate models. Fail closed for incompatible or nonpositive denominators. **Exit:** tests including corporate actions and corrections.
## AI-3 — Valuation and portfolio risks
Point-in-time P/E/P/B and sector-appropriate valuation, earnings quality, cash flow, balance sheet, governance risks and current portfolio concentration. No unsupported price targets or look-ahead. **Exit:** original-availability, freshness and share-basis provenance.
## AI-4 — Investment action classification
**ADD** for justified increases to existing positions; **BUY** for justified new entries; **HOLD** for justified retention without addition; **WATCH** for a supported monitoring decision; **EXIT** for a supported negative thesis on existing positions. **NOT_ASSESSED / INSUFFICIENT_EVIDENCE** is a distinct refusal state, not WATCH. Maintain separate quarterly performance and investment decision models, with evidence, counterarguments, confidence and reason codes. Weak quarterly result never automatically means EXIT; Strong never means BUY. **Exit:** independent test scenarios for all statuses, unavailable evidence, current and closed securities.
## AI-5 — Grounded narrative
Explain what happened, why *only if evidence verifies cause*, industry context, management remarks with source citation, risks and change triggers. Version evidence/model and preserve historical commentary. **Exit:** citation and hallucination checks.
## AI-6 — UI integration
Wire actual action, confidence and full analysis from typed backend contracts; preserve screenshot at 100% zoom, mobile/keyboard access and selected-stock/quarter behavior. No green methodology callout. **Exit:** visual acceptance and tests for unavailable state.
## AI-7 — Automation and storage
Trigger on new or corrected qualified filings and relevant research/market inputs; daily Results scan and manual recheck, with idempotent no-change runs. Reuse first; R2 for large artifacts, Supabase for compact index. Planned constraints: Supabase 500MB and R2 10GB; Trendlyne 1000 calls/day (bank maintenance 14-call cap stays intact). Store snapshots, citations, update times, supersession/version, no duplicates. **Exit:** real new-filing/correction/no-change runs and independent DB readback.
## AI-8 — Acceptance
All live current/closed equities accounted for, with issued evidence-backed recommendation or explicit no-recommendation state. Verify accuracy, risk, freshness, model/source versions, R5 and V1-4 isolation, accessibility, preview and deployment readiness. No Production/main change without separate authorization.
## Dependencies
UI-only now. AI-1 and AI-2 after qualified R3/R4/R5 data; then AI-3/4, then AI-5/6, then AI-7/8. 
## Baseline commits
UI: `84a001de97ca979861b53040644fec02ad2f6c15`; CSS: `faf69e315b0432d59aa363fb290e9eecafbc4767`; UI tests: `07433a0813bb129839e8bf451aa3db5d2dc6eeb4`. Commits are not proof of passing build, deployment or backend assessment.
