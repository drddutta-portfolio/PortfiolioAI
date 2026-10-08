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

## Source-bound verification addendum — 8 October 2026

The authoritative Development HEAD at start of this continuation was `1db4eed499c4920c60c0abc4e6a50c9628e2accb`, not the prior handoff HEAD, due to concurrent stock-research UI changes. These unrelated commits were preserved. The exact shared ownership guard was read from current Development before local isolated verification.

**Verification actually performed:** an isolated local TypeScript copy of `validateV14SelectedOwnership` and `parseTrendlyneOwnershipHistory` was compiled under TypeScript strict ES2022 settings (`tsc --noEmit`), then subjected to eleven Node.js `assert` behavioral checks. **11/11 passed**: promoter and institutional series, rejecting FII as Institutional, separate governance review, decimal-string preservation, nonconsecutive quarters, duplicate quarters, values below zero/above 100, and missing history. This is **not** a full-repository test run; full architecture guard, full TypeScript, app/Edge lint, Vitest, Deno handler, production build and whitespace checks were **not run** because the private repository could not be checked out in the available container (`git ls-remote` failed host resolution). No CI full PASS is claimed. The local smoke check scripts are non-authoritative and are not a production dependency.

**Read-only official Development source inspection:** retained `COMPLETE_RESEARCH_OWNERSHIP` records use `TRENDLYNE_MCP` and provider tool `get_ownership_deals_insider_sast`. Example retained chart headers explicitly show `Promoter Holding (%)` and `Holding (%)`, proving percentage-format labels in the response but **not** their exact denominator. Institution is provider's independently labeled chart series; it is not an approved aggregate arithmetic definition. Neither denominator nor the relationship of Institutional to FII/MF/DII is proven by that heading. `Jun 2026` etc are provider chart quarter labels and must not be treated as immutable quarterly filing availability dates or publication timestamps. Raw provider source value, source ID/hash and retrieval timestamp are distinct from reporting period end.

**Governance count reconciliation:** read-only SQL of selection runs `5763ee72-3e33-4419-9b74-0811e9fabe6a` and `c0b7f1c4-3e36-4d5c-b79a-19e44fe74e83` gives **53 / 10 / 51** (`OWNERSHIP_TREND_4Q` / `INSTITUTIONAL_OWNERSHIP_TREND_4Q` / `OWNERSHIP_GOVERNANCE`) for both. In the latest run exactly **49 of 51** governance items link to a raw ownership source record, and **2 do not**; the earlier reported 49 should not be compared to the 51 total as if both measured the same denominator. Whether the older reviewer count was a linked-only census or an arithmetic/reporting error cannot be established from that count alone. The canonical denominator is 51 requirement items.

**All-115 retained item-linked source replay:** `docs/private/PortfolioAI_V1_4_OWNERSHIP_RETAINED_DRYRUN_115_2026-10-08.json` covers the exact fixed 115 securities, marking frozen-111 membership, security ID, requirement, raw record ID/hash and chart quarters. It finds **114 securities with one applicable ownership item, one with no applicable item; total 114 requirement items**. Results: **24 OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN**, **39 OWNERSHIP_SERIES_MISSING**, **51 OWNERSHIP_GOVERNANCE_DOCUMENT_REVIEW_REQUIRED**; **0 safe canonical candidates**. These counts describe replay of selected **item-linked source records** and the same versioned guard decision logic; it is **not execution of the full Deno materializer's security-level source lookup**. In particular, a missing series in the linked raw object need not prove that no alternative retained security-level ownership source exists. No persistence of dry-run READY is claimed.

**Activation blockers:** prove canonical provider percentage denominator, Institutional aggregate/overlap, dated quarter-end and source availability semantics, explicit review source bindings, and previously unresolved governance documentary minima; perform a real exact-HEAD repository test run and canonical Deno dry run; obtain separate bounded Development deployment/materialization approval. No provider acquisition, R2/db write, migration or deployment was executed. Operational V1-4 remains NOT PROVEN.
