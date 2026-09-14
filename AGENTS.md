# PortfolioAI Agent Instructions

These instructions apply to the entire repository.

## Governance and source of truth

PortfolioAI is governed by the repository, not by any coding agent, chat history, or
agent-specific configuration. Project knowledge and new work must remain portable
between competent coding agents and human developers. Coding-agent choice must not
become part of the product architecture.

Read and apply the documents below in this authority order before implementation:

1. `docs/PortfolioAI_Master_Blueprint.md` — product vision, intended capabilities,
   investment methodology, and long-term architecture.
2. `docs/PortfolioAI_Research_and_Intelligence_Architecture.md` — source ownership,
   derived-metric contracts, scoring lineage, and intelligence boundaries.
3. `docs/PortfolioAI_Single_Source_of_Truth_Architecture.md` — canonical business
   facts, shared application access paths, deterministic ownership, and cross-page
   consistency.
4. `docs/PortfolioAI_Database_Architecture.md` — approved database architecture,
   data ownership, provenance, accounting and financial-data semantics, and
   database security/RLS expectations.
5. `docs/PortfolioAI_Development_Rules.md` — engineering standards, security and
   testing requirements, deterministic financial-calculation rules, and
   implementation discipline.
6. `docs/PortfolioAI_Product_UI_and_Decision_Workflow.md` — product workflow and
   consumer-surface intent.
7. `docs/PortfolioAI_Development_Status.md` — actual implemented state, completed
   milestones, known limitations, current milestone, and next approved work.
8. `docs/PortfolioAI_Requirements_Register.md` — requirement traceability and
   implementation placement; it does not override canonical specifications.
9. Relevant stage-specific documentation — detailed decisions, architecture, and
   completed behaviour for that stage.

The canonical architecture documents are specifications, not suggestions. The
Development Status records reality and handover state but does not override them.
Stage documents elaborate their scope and must remain consistent with higher
authority documents.

If proposed work conflicts with the Master Blueprint, Research & Intelligence
Architecture, Single Source of Truth Architecture, Database Architecture, or
Development Rules, do not silently proceed. Report the conflict and identify the
product or architecture decision requiring owner approval. A difference between
the implementation order and the Blueprint's broad phases is not itself a conflict.
Do not casually or incidentally change completed-stage behaviour, especially
financial or accounting semantics, while doing unrelated work.

- Treat transactions as the source of truth for holdings and portfolio accounting.
- Treat one business fact as having one canonical authority and one deterministic
  owner. Different pages are views of the same PortfolioAI system and must not
  introduce competing queries, formulas, taxonomies, or fallback values for the
  same fact.
- Never silently overwrite financial data, source data, provenance, historical
  transaction evidence, or historical records. Preserve original inputs and make
  corrections explicit, linked, and auditable.
- Never infer or fabricate missing financial data, replace it with zero, or assign
  invented transaction dates, brokers, or prices.
- Keep asset class separate from portfolio role. Equity, ETF, Mutual Fund, Gold, Silver, Bond, Cash, and Other describe assets; Core, Satellite, Thematic, ETF, and Other describe portfolio roles.
- Keep AI explanations and synthesis separate from deterministic calculations. AI must not calculate, replace, or override deterministic financial results.

## Mandatory implementation pre-flight

Keep this check proportional and practical, but complete it before coding:

- [ ] Read `AGENTS.md`.
- [ ] Read `docs/PortfolioAI_Master_Blueprint.md`.
- [ ] Read `docs/PortfolioAI_Research_and_Intelligence_Architecture.md`.
- [ ] Read `docs/PortfolioAI_Single_Source_of_Truth_Architecture.md`.
- [ ] Read `docs/PortfolioAI_Database_Architecture.md`.
- [ ] Read `docs/PortfolioAI_Development_Rules.md`.
- [ ] Read `docs/PortfolioAI_Product_UI_and_Decision_Workflow.md` when UI/workflow is affected.
- [ ] Read `docs/PortfolioAI_Development_Status.md`.
- [ ] Read `docs/PortfolioAI_Requirements_Register.md`.
- [ ] Read relevant stage-specific documentation.
- [ ] Identify the current approved milestone.
- [ ] Check the proposed work against the Blueprint.
- [ ] Identify the canonical authority and shared access path for every business fact the change reads, displays, calculates, or writes.
- [ ] Confirm that no page/component is creating a competing source or calculation for an existing fact.
- [ ] Identify database/schema impact.
- [ ] Identify financial/accounting impact.
- [ ] Identify security/RLS impact.
- [ ] Identify provenance/audit impact.
- [ ] Determine whether completed-stage semantics could change.
- [ ] Report genuine architectural conflicts before implementing them.

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

- Inspect the relevant existing code, schema, types, tests, established patterns, and canonical data authority before making changes.
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
- Presentation code under `src/pages/**` and `src/components/**` must consume approved repositories, hooks, selectors, or view models rather than directly querying canonical storage.
- UI code may format, sort, filter, group, and render canonical facts. It must not redefine a business fact or independently recalculate an existing domain fact.
- Do not duplicate business rules across files or layers. Maintain one clearly defined implementation for each rule.
- Reuse and extend established abstractions instead of creating parallel implementations for the same responsibility.
- If a genuinely new business fact is introduced, update the relevant canonical architecture and `src/contracts/canonicalDataAuthorities.ts` before or with implementation.
- Never disable, weaken, or bypass `npm run check:architecture` merely to make CI pass. Treat a violation as architecture drift to be corrected or as an explicit architecture decision requiring review.

## Error handling and operational safety

- Do not swallow errors or replace them with silent fallbacks.
- Return meaningful error messages and use structured logging with enough context for diagnosis, without logging secrets or unnecessarily sensitive financial data.
- Handle loading, empty, partial-data, stale-data, and failure states explicitly.
- Make external API and ingestion failures atomic or recoverable so they cannot corrupt or overwrite existing valid data.

## Testing requirements

- Add unit tests for every important financial calculation.
- Include a regression test with every bug fix where practical.
- Test relevant boundary cases, including null values, zero quantities, partial sells, duplicate imports, corporate actions, date boundaries, and decimal precision.
- Add cross-surface fact-consistency tests where the same business fact is consumed by multiple application views and a practical deterministic test can prove equivalence.
- Before claiming completion, run `npm run check:architecture`, TypeScript checks, linting, relevant unit and integration tests, security or RLS checks where applicable, and the production build.
- If a required check cannot run, state exactly which check was omitted, why, and what risk remains.

## Change discipline

- Keep commits small, logical, and focused on one coherent change.
- Avoid unrelated refactoring during feature work unless an automated architecture or correctness check exposes existing drift that must be removed for the approved change to be valid.
- Never perform a broad rewrite unless the user specifically approves its scope.
- Do not introduce a new library without explaining the need, alternatives considered, and maintenance or security implications.
- Do not leave placeholder logic, fake data, incomplete TODO implementations, or hard-coded production values.

## Safe execution and verification

- Before any destructive, overwriting, history-rewriting, or data-removing action, inspect the current state. If histories, requirements, or data conflict, stop and report the conflict before proceeding.
- Do not use destructive actions merely to make an implementation, test, score, or interface appear correct.
- Run the relevant tests, linters, architecture checks, migration checks, security checks, and other verification appropriate to the change before claiming completion. Clearly report checks that could not be run.

## Completion standard

Before declaring implementation work complete, run and report the checks that are
relevant to the change. Documentation-only work does not require irrelevant
application checks.

- [ ] Tests appropriate to the change pass.
- [ ] `npm run check:architecture` passes for application-facing work.
- [ ] Canonical authority registry remains accurate for changed business facts.
- [ ] Deterministic financial calculations are tested against known expectations where applicable.
- [ ] TypeScript passes where applicable.
- [ ] ESLint passes where applicable.
- [ ] The production build passes where applicable.
- [ ] `git diff --check` passes.
- [ ] A secret scan is completed where appropriate.
- [ ] There are no unexplained database/schema changes.
- [ ] There is no silent Blueprint or single-source architecture deviation.
- [ ] There are no unintended financial-semantic changes.
- [ ] Transaction provenance and auditability are preserved.
- [ ] `docs/PortfolioAI_Development_Status.md` is updated if implemented state, limitations, the current milestone, or next approved work changed.
- [ ] Relevant stage documentation is updated where appropriate.

The completion report must state:

- files changed;
- behavior changed;
- canonical authorities/shared access paths affected;
- tests and checks run;
- database changes, including whether migrations were created or applied;
- assumptions made;
- known limitations and remaining risks.

## Final principle

Correctness, auditability, one-authority consistency, and preservation of financial data take priority over speed, convenience, UI appearance, or code-generation volume.
