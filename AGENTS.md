# PortfolioAI Agent Instructions

These instructions apply to the entire repository.

## Architecture and source of truth

- Before major work, always read all three canonical documents:
  - `docs/PortfolioAI_Master_Blueprint.md`
  - `docs/PortfolioAI_Database_Architecture.md`
  - `docs/PortfolioAI_Development_Rules.md`
- Treat those documents and the GitHub repository as the project's canonical specifications. Do not silently change product or financial rules during implementation.
- Treat transactions as the source of truth for holdings and portfolio accounting.
- Never silently overwrite financial data, source data, provenance, or historical records. Preserve original inputs and represent corrections explicitly and audibly.
- Keep asset class separate from portfolio role. Equity, ETF, Mutual Fund, Gold, Silver, Bond, Cash, and Other describe assets; Core, Satellite, Thematic, ETF, and Other describe portfolio roles.
- Keep AI explanations and synthesis separate from deterministic calculations. AI must not calculate, replace, or override deterministic financial results.

## Security and data storage

- Never commit API keys, passwords, access tokens, service-role credentials, or other secrets. Use approved environment variables or secret stores.
- Preserve Row Level Security and user ownership boundaries on all user-owned data. Do not weaken or bypass RLS for convenience.
- Keep large research documents and binary archives out of Supabase. Store only structured intelligence, metadata, provenance, and external document references there.

## Database changes

- Make every database schema change through a versioned Supabase migration committed to the repository.
- Never run migrations, `supabase db push`, `supabase db reset`, or any equivalent local or remote schema-changing command without the user's explicit approval for that specific action.
- Prefer additive and reversible schema changes. Preserve backward compatibility and historical auditability wherever practical.
- All writes must respect foreign keys, constraints, provenance requirements, and RLS.
- Keep migrations narrowly scoped and reviewable.
- Never edit a migration that has already been applied. Create a new migration for every subsequent database change.
- Write migration SQL so it is safe to run against existing data. Inspect affected data and constraints before an approved migration is executed.
- Before and after any approved database change, verify migration status and inspect the schema diff.

## Before coding

- Inspect the relevant existing code, schema, types, tests, and established patterns before making changes.
- Understand the complete data flow and its upstream and downstream effects before changing it.
- Prefer the smallest change that correctly and completely satisfies the requirement.
- Do not guess missing business rules. Stop and report the ambiguity when the specifications and existing behavior do not resolve it.

## Type safety

- Use strict TypeScript settings and preserve strictness throughout the codebase.
- Avoid `any`. Use it only when genuinely unavoidable, constrain its scope, and document why it is required.
- Define explicit interfaces or types for financial values, domain entities, API requests, API responses, and ingestion payloads.
- After approved schema changes, regenerate and use Supabase database types. Do not maintain hand-written database types that can drift from the schema.

## Financial correctness

- Never use JavaScript floating-point arithmetic directly for critical financial calculations when precision matters. Use an appropriate decimal representation or exact integer units.
- Store financial quantities, prices, amounts, rates, percentages, and other precision-sensitive values as PostgreSQL `numeric`, never floating-point types.
- Preserve `null` as unknown or unavailable. Never silently convert missing financial data to zero.
- Make calculations deterministic, reproducible, and covered by tests using hand-verifiable cases.
- Define and document rounding mode, precision, scale, and the stage at which rounding occurs for every financial calculation that requires rounding.

## Data ingestion

- Make imports and external API ingestion idempotent wherever practical.
- Use stable identities, hashes, source references, and database constraints to prevent duplicate transactions, prices, documents, and fundamental observations.
- Preserve raw source rows and original imported values alongside normalized data where required for auditability.
- Validate types, ranges, identities, units, dates, and required provenance before normalization or commit.
- Reject or quarantine ambiguous, invalid, or conflicting data for review instead of guessing or silently coercing it.

## Application architecture

- Keep business and financial logic out of UI components.
- Put deterministic financial logic in dedicated, independently testable services or modules.
- Keep Supabase and other data-access logic separate from presentation logic.
- Do not duplicate business rules across files or layers. Maintain one clearly defined implementation for each rule.
- Reuse and extend established abstractions instead of creating parallel implementations for the same responsibility.

## Error handling and operational safety

- Do not swallow errors or replace them with silent fallbacks.
- Return meaningful error messages and use structured logging with enough context for diagnosis, without logging secrets or unnecessarily sensitive financial data.
- Handle loading, empty, partial-data, stale-data, and failure states explicitly.
- Make external API and ingestion failures atomic or recoverable so they cannot corrupt or overwrite existing valid data.

## Testing requirements

- Add unit tests for every important financial calculation.
- Include a regression test with every bug fix where practical.
- Test relevant boundary cases, including null values, zero quantities, partial sells, duplicate imports, corporate actions, date boundaries, and decimal precision.
- Before claiming completion, run TypeScript checks, linting, relevant unit and integration tests, security or RLS checks where applicable, and the production build.
- If a required check cannot run, state exactly which check was omitted, why, and what risk remains.

## Change discipline

- Keep commits small, logical, and focused on one coherent change.
- Avoid unrelated refactoring during feature work.
- Never perform a broad rewrite unless the user specifically approves its scope.
- Do not introduce a new library without explaining the need, alternatives considered, and maintenance or security implications.
- Do not leave placeholder logic, fake data, incomplete TODO implementations, or hard-coded production values.

## Safe execution and verification

- Before any destructive, overwriting, history-rewriting, or data-removing action, inspect the current state. If histories, requirements, or data conflict, stop and report the conflict before proceeding.
- Do not use destructive actions merely to make an implementation, test, score, or interface appear correct.
- Run the relevant tests, linters, migration checks, security checks, and other verification appropriate to the change before claiming completion. Clearly report checks that could not be run.

## Completion standard

Before declaring a task complete, report:

- files changed;
- behavior changed;
- tests and checks run;
- database changes, including whether migrations were created or applied;
- assumptions made;
- known limitations and remaining risks.

## Final principle

Correctness, auditability, and preservation of financial data take priority over speed, convenience, UI appearance, or code-generation volume.
