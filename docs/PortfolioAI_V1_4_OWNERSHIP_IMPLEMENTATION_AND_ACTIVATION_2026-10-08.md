# Operational V1-4 Ownership Code Implementation — 8 October 2026

## Status
Repository source changes committed and **NOT YET FULL-SUITE VERIFIED**. No deployment, evidence admission, live materialization or factual owner review has occurred; V1-4 remains NOT PROVEN.

Source branch: `PortfolioAI-Development`. Starting HEAD: `e901ec89512ce115c5046eba76ac145664262258`. Last verified code-diff head before handoff: `70a153a22c3132af1abe0ea4f8a146d105eded1d`.

## Actual code changes
- `supabase/functions/_shared/p7-ic-evidence-normalization.ts`: versioned selection `V1_4_OWNERSHIP_METHOD_SELECTION_V1` and `validateV14SelectedOwnership`, binding Promoter to `OWNERSHIP_TREND_4Q`, Institutional to `INSTITUTIONAL_OWNERSHIP_TREND_4Q`, and separate governance documentary review to `OWNERSHIP_GOVERNANCE`. Requires four unique consecutive Mar/Jun/Sep/Dec quarter identities with values 0 through 100 and source semantics proof; neither source field name nor chart count can automatically prove total-equity percentage denominator. Parser retains source decimal lexemes as `exactValue` alongside compatibility numeric values.
- `supabase/functions/p7-ic2-materialize-readiness/index.ts`: the established canonical requirement-item path calls the validator for all three ownership codes and returns `REVIEW_REQUIRED`/fail-closed with versioned lineage rather than promoting unproven chart data.
- `supabase/functions/_shared/p7-ic-ownership-v14.test.ts`: targeted Vitest regressions added for promoter/institutional series isolation, source decimal strings, boundary percentages, missing quarters, duplicates, nonconsecutive quarters, out-of-range values, and absent governance review.

### Exact provider semantics and blocker
Read-only Development source inventory confirms retained `COMPLETE_RESEARCH_OWNERSHIP` captures with `TRENDLYNE_MCP` source code. Raw records contain the provider result, instrument/security IDs, capture tool, retrieval date and normalized chart series. This **does not establish** the percentage denominator `TOTAL_EQUITY_PERCENT`, explicit true publication/reporting-period identity versus chart labels, or documentary governance decision. No source-field assertion has been promoted to canon.

This implementation is intentionally **fail-closed even for syntactically valid charts**, pending source semantics and the existing approved reviewed-evidence path. A future revision, reviewed under the canonical authority, is needed to recognize explicitly verified semantics and exact period/source/revision contracts as valid canonical candidates; this patch does not introduce unreviewed automatic ACCEPT.

## Provider-free retained-evidence inspection
Latest full fixed-115 canonical run: `c0b7f1c4-3e36-4d5c-b79a-19e44fe74e83` (historical, no new materialization). A fresh **read-only SQL item census**, not a persisted rerun of the new validator, found:
- `OWNERSHIP_TREND_4Q`: 53 items/53 stocks; all 53 linked to a raw source record.
- `INSTITUTIONAL_OWNERSHIP_TREND_4Q`: 10 items/10 stocks; all 10 linked.
- `OWNERSHIP_GOVERNANCE`: 51 items/51 stocks; 49 linked to a raw source record; two not linked.

Dry-run interpretation of the new repository guard based on those verified constraints: **0 automatically admissible canonical candidates** until source-defined total-equity denominator and separate governance document/review proof. No synthetic ACCEPT or review ledger row.

## Verification honesty
GitHub connector file mutations and code diff were verified; no local clone exists in the sandbox, external git host resolution failed, and the exact remote code with its dependency graph was **not compiled or test-run**. New test file exists but passing assertions cannot be claimed; `check:architecture`, TypeScript, lint, full Vitest/Edge, Deno handler workflows, build and whitespace checks remain execution prerequisites before deployment. Do not cite an older green commit as proof.

## Activation limits and remaining work
1. Read-only demonstrate exact Trendlyne source field semantics for Promoter and Institutional, including total-equity denominator, historical revision policy and quarter labels. If absent, request only that provider/source-field documentation, not a repeated owner-methodology choice.
2. Review/test patch on exact HEAD with repository dependencies, fix any type/lint issues and run required regression/build suite; keep branch Deployment protected.
3. If source contract and tests pass, propose specifically scoped Development deployment. Separate explicit authorizations remain required for R2/database writes, factual review and canonical materialization.
4. Re-run bounded provider-free validator against all affected 115-member snapshots; append only source-verified evidence through established handlers with one-time grants; reread 115 statuses and unchanged frozen 111 value. 
5. No Provider spending, R2 write, database mutation, migration, V1-5 or production change was performed.

The owner methodology is selected. Its historical source data and numerical admission **remain unproven**, so readiness must stay blocked.
