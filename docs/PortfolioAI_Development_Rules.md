# PortfolioAI — Development Rules v1.0

These rules apply to every coding agent and human contributor working on PortfolioAI.

## 1. Source of Truth

- GitHub repository is the source of truth for application code and canonical specifications.
- `docs/PortfolioAI_Master_Blueprint.md` defines the intended product architecture.
- `docs/PortfolioAI_Single_Source_of_Truth_Architecture.md` defines the cross-application rule for canonical business facts, shared access paths, and cross-page consistency.
- Do not silently change product rules while coding.
- If implementation requires a material architecture change, document it before implementing it.

### 1.1 One business fact, one authority

- A data item that means the same thing must have one canonical authority across PortfolioAI.
- Different pages are views of the same system; they must not become independent mini-applications with separate queries, formulas, taxonomies, or fallback values for the same fact.
- UI components may format, sort, filter, group and present canonical facts. They must not redefine business facts or duplicate domain calculations.
- New pages must consume the approved shared repository/service/hook/view-model path for existing facts.
- Presentation files under `src/pages/**` and `src/components/**` must not directly query canonical Supabase storage.
- If a new business fact is introduced, its authority and calculation owner must be documented and added to the machine-readable canonical authority registry before or with implementation.
- Missing, stale, conflicting, review-required, not-applicable and insufficient-evidence states must remain explicit and consistent across surfaces.
- Research/scoring profiles may interpret canonical classification but may not silently replace the sector/industry/market-cap classification displayed by the application.
- A derived value must have one deterministic owner. Do not reimplement portfolio weight, P&L, scoring, recommendation, sizing, or another existing business formula inside a page/component.
- Architecture exceptions require an explicit reviewed change to the canonical source/calculation contract; a local workaround in one screen is not an exception.

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
- FIFO is authoritative for a security history when transaction chronology is
  complete and provable.
- Missing or incomplete chronology must not suppress valid cost/P&L accounting
  when an order-independent weighted-average-cost result can be deterministically
  computed from the effective BUY/SELL ledger.
- Never fabricate chronology or describe an average-cost fallback as FIFO. Select
  and disclose exactly one accounting basis per security history.
- Imported HOLDINGS values are reconciliation evidence only and must never replace
  independently calculated ledger accounting.

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

For shared business facts, tests should also verify architectural consistency where practical. The repository `check:architecture` guard and canonical-authority tests are mandatory controls; do not disable or bypass them merely to make a pull request pass.

## 12. User Experience

The user is a non-coder and the product is a personal investment terminal. UI must be professional, readable, responsive and information-dense without becoming confusing. Tables should support filtering, sorting and useful column configuration.

## 13. Human-in-the-Loop

PortfolioAI is decision support. Recommendations are recommendations, not automatic instructions. Promotion, demotion, reduction and exit actions require clear reasoning and user control.

## 14. Change Documentation

For each material feature:

- state the problem;
- state the intended behaviour;
- identify affected modules/data;
- identify the canonical authority for every new business fact shown or calculated;
- implement;
- test;
- document any schema/configuration changes;
- commit with a clear message.

## 15. Definition of Done

A feature is not complete merely because the UI renders. It must have the required data model, validation, deterministic logic, error handling, security considerations, tests where applicable, and documentation/configuration needed for another developer or coding agent to continue safely.

For application-facing features, Definition of Done additionally requires:

- `npm run check:architecture` passes;
- no competing source/calculation path is introduced for an existing canonical fact;
- shared facts shown on multiple surfaces resolve from the same authority;
- the canonical authority registry remains accurate.