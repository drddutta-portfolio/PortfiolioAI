# PortfolioAI — Development Rules v1.0

These rules apply to every coding agent and human contributor working on PortfolioAI.

## 1. Source of Truth

- GitHub repository is the source of truth for application code and canonical specifications.
- `docs/PortfolioAI_Master_Blueprint.md` defines the intended product architecture.
- Do not silently change product rules while coding.
- If implementation requires a material architecture change, document it before implementing it.

## 2. Coding-Agent Independence

The specification must remain independent of Codex, Claude Code, Lovable or any other coding AI. Any competent engineer or coding agent must be able to continue the project from the repository.

## 3. Incremental Development

- Implement one bounded feature at a time.
- Do not build future phases early merely because an integration is convenient.
- Each major feature should compile, run and be tested before the next feature is added.
- Prefer small, reviewable commits.

## 4. Financial Integrity

- Transactions are the source of truth for holdings.
- Never silently modify historical transactions.
- Never silently turn missing financial data into zero.
- Never fabricate financial facts, catalysts, prices or research.
- Every important metric must retain source and period provenance.
- Deterministic financial calculations must not depend on an LLM.

## 5. AI Rules

- AI is optional.
- AI must receive structured evidence rather than uncontrolled raw data whenever possible.
- AI may explain, synthesize, compare and identify conflicts.
- AI may not override deterministic calculations.
- AI must not invent facts or sources.
- AI provider/model must be abstracted behind an application interface.

## 6. Data and Storage

- Use Supabase for structured, frequently accessed application intelligence.
- Use Google Drive for large source documents.
- Avoid storing large binary documents in the primary database unless technically justified.
- Use incremental ingestion and deduplication.
- Do not repeatedly process unchanged documents/data.
- Retain hashes/source identifiers where useful for duplicate detection.

## 7. Asset Rules

- Maintain explicit asset class: Equity, ETF, Mutual Fund, Gold, Silver, Bond, Cash, Other.
- Equity-specific quality/growth/ROCE/EBITDA engines must not be blindly applied to ETFs or other unsuitable assets.
- Core target of approximately 35 stocks is a stock-count objective, not a 35% allocation rule.

## 8. Investment-Engine Rules

- Core, Satellite and Thematic are portfolio roles, not direct proxies for quality.
- The strict Quality-Growth screen is a diagnostic and must not automatically force a stock into Core, Satellite or Exit.
- Momentum is primarily timing/confirmation, not an automatic Core/Exit trigger.
- Valuation must be evaluated relative to quality, growth, durability and risk. High PE alone is not an exit rule.
- Reduce/Sell due to sizing or valuation is different from Exit due to thesis/business failure.
- One weak quarter or price decline alone should not automatically demote a Core holding.

## 9. Security

- Never commit API keys, service-role keys or passwords.
- Never expose Supabase service-role credentials in browser code.
- Use environment variables/secrets.
- Apply RLS appropriately.
- Validate all imported data.

## 10. Backward Compatibility

- Prefer additive schema changes.
- Do not break existing imported historical data.
- Migrations must be reversible where practical.
- New engine versions should be versioned so historical recommendations remain interpretable.

## 11. Testing

Every deterministic engine must have unit tests. Importers require validation and duplicate tests. Important financial calculations require hand-verified examples. Security and RLS should be tested before production use.

## 12. User Experience

The user is a non-coder and the product is a personal investment terminal. UI must be professional, readable, responsive and information-dense without becoming confusing. Tables should support filtering, sorting and useful column configuration.

## 13. Human-in-the-Loop

PortfolioAI is decision support. Recommendations are recommendations, not automatic instructions. Promotion, demotion, reduction and exit actions require clear reasoning and user control.

## 14. Change Documentation

For each material feature:

- state the problem;
- state the intended behaviour;
- identify affected modules/data;
- implement;
- test;
- document any schema/configuration changes;
- commit with a clear message.

## 15. Definition of Done

A feature is not complete merely because the UI renders. It must have the required data model, validation, deterministic logic, error handling, security considerations, tests where applicable, and documentation/configuration needed for another developer or coding agent to continue safely.
