# PortfolioAI Requirements Register

This register preserves feature traceability. It does not override the Master Blueprint, Database Architecture, or Development Rules.

| ID | Area | Requirement | Status | Target milestone | Architectural placement / notes |
|---|---|---|---|---|---|
| REQ-TRAN-001 | Transactions | Add/resolve an unknown security directly from manual BUY entry when no existing security matches | IMPLEMENTED / ACCEPTED | 5.1 | One searchable selector exposes the add action, preserves entered BUY fields, auto-selects the created canonical security, and permits unresolved provider mapping |
| REQ-TRAN-002 | Transactions | Audited correction of date, security, type, quantity, price, broker, charges and notes | IMPLEMENTED | 5.1 | Supersession plus replacement transaction; original and imported evidence retained |
| REQ-TRAN-003 | Transactions | Sortable transaction columns | IMPLEMENTED | 5.1 | Stable single-column client sort; missing values remain explicit |
| REQ-TRAN-004 | Transactions | Advanced filtering and text search | IMPLEMENTED | 5.1 | Combined security, account, type, source, dates, missing evidence and quality filters |
| REQ-TRAN-005 | Transactions | Transaction provenance/correction history visibility | IMPLEMENTED | 5.1 | Details show source lineage and correction link/reason |
| REQ-ACCOUNT-001 | Accounting | Realised/unrealised visibility at correct ledger/position semantics | PARTIAL | 5+ | FIFO results live in Holdings; transaction rows avoid misleading position-level unrealised P&L |
| REQ-POS-001 | Position settings | Target price | DEFERRED | Monitoring stage | One portfolio/security setting, not copied to historical buys |
| REQ-POS-002 | Position settings | Stop-loss price | DEFERRED | Monitoring stage | One portfolio/security setting |
| REQ-POS-003 | Position settings | Target/min/max weights | PARTIAL | Portfolio management | Weight fields exist in `portfolio_security_settings`; management UI deferred |
| REQ-ALERT-001 | Alerts | Stop-loss crossing, history and deduplicated notification | DEFERRED | Monitoring stage | Uses trusted prices; no autonomous order execution |
| REQ-ALERT-002 | Alerts | Target-price crossing, history and deduplicated notification | DEFERRED | Monitoring stage | Uses trusted prices; notification channels later |
| REQ-MARKET-001 | Market/momentum | 90-day data/chart and momentum indicators | DEFERRED | Technical engine | Provider-independent OHLCV foundation exists |
| REQ-SEC-001 | Security intelligence | Sector, market cap and category enrichment | DEFERRED | Fundamentals | Canonical security attributes, not transaction copies |
| REQ-INVEST-001 | Investment engines | Quality, Core/Satellite, valuation, risk and portfolio-fit engines | DEFERRED | Future stages | Governed by Master Blueprint; deterministic inputs separated from AI synthesis |
