# Stock research Stage 6 — Development rollout and financial color theme

**Date:** 8 October 2026 (Asia/Kolkata)

**Target:** PortfolioAI-Development only

**Status:** Stage 6.1–6.4 design rollout and hosted acceptance PASS. The common stock shell and financial theme are accepted for ALL stock pages. Upstream methodology/evidence/classification approvals remain separate.

Stage 6 rolls out the accepted Industry-first, business-model-aware research page and the owner's requested application-wide gain/loss presentation. The common shell applies to every stock; the effective canonical research assignment selects specialist content. Sector remains contextual metadata. This acceptance does not certify missing official taxonomy, evidence, ownership provider semantics, specialised numeric methodology or qualified recommendations.

| Sub-stage | Final result |
|---|---|
| 6.1 Release contract | PASS — Stage 5 shell acceptance retained: Industry-first assignment/lineage, common sticky navigation, wrapping names, independent evidence/engine state and saved owner role. |
| 6.2 Shared financial theme | PASS — shared green/red tokens for signed P/L, covered returns, daily movement and contribution values across Dashboard, Holdings, transaction context and stock research. Zero is neutral; missing values remain unavailable. Signs, precision, labels and accounting values are preserved. |
| 6.3 Review and Development publication | PASS — 137 focused application tests, five integrated ownership-guard tests, production TypeScript/build, changed-file ESLint, architecture/diff/credential checks and final GitHub CI. PR #119 merged normally; an exact merged-source READY Preview build was published to the Development alias. |
| 6.4 Hosted acceptance and handoff | PASS — 350 valid hosted checks, covering seven desktop stock cases/all five Pharma models, three mobile stock cases, a financial holding company, unresolved assignment, desktop/tablet/mobile financial surfaces and clearly labelled browser-only zero/missing-quote fixtures. Post-publication checks ran through the requested Development URL. No runtime errors, provider refresh attempts, research writes or REST read failures. |

## Shared presentation contract

`src/features/portfolio/format.ts` exposes `financialTone` and `financialClass`. They classify the supplied canonical Decimal/string value before rounding; they neither calculate P/L nor query storage. Tiny positive/negative values retain their direction; zero and signed zero are neutral. Null, undefined, invalid or non-finite inputs cannot become gains. Existing formatters and domain owners retain value/precision/coverage responsibilities.

Global tokens in `src/styles.css` define gain `#166534`, loss `#b42318`, neutral `#334155` and unavailable `#64748b`, plus pale gain/loss backgrounds and borders. Signed values opt into explicit classes. Financial colors do not select methodology, promote evidence, change portfolio roles or imply investment advice. Prices, balances, allocation categories, buy/sell transaction types and research-readiness indicators remain separate concepts.

The Research P/L card labels zero **No change**. Amount and percentage each use their own canonical sign, so missing percentages do not inherit an amount's gain color. Dashboard KPI amounts/returns likewise retain independent tones. Imported snapshot P/L keeps its evidence label and its own sign. Daily-movement CSS is scoped to its component, preventing its positive/negative rules leaking into other pages.

Affected application files: shared portfolio formatting helper/tests; global styles; ResearchPage, HoldingsPage, DashboardPage, TransactionsPage; DashboardDailyMovement, DashboardAllocationPerformance and DashboardDecisionLayer; their financial CSS and regression tests. Design plan, product UI contract, Development Status and sanitized release evidence are updated. No new dependency was added.

## Exact release identity

- [PR #119](https://github.com/drddutta-portfolio/PortfiolioAI/pull/119) merged at `5d50c5c8a76359c02489c3b07e6317b86197860e` on 8 October 2026, 18:55:42 IST.
- Verified application source revision: `0fddf87c89471aeaee17c2acddd5fc3360eebd38`; `src` tree: `4ac1800a434a3369b5c5271a6ebbf6aa57ecb65c`. The review head, merge and release-record-only changes preserve this application tree.
- Final review CI: [run 37783573991](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/37783573991), job `113332495091`, SUCCESS on head `445b0a5e0781b1e0c2c4ffa4fe2e50ac9b15fbb0` before merge.
- READY Preview deployment: `dpl_HLHjfTM8447XDHKYAfoJoGF7bT9z`, built from exact merge `5d50c5c8a76359c02489c3b07e6317b86197860e`.
- Immutable build: `https://portfiolio-hh08dz9xr-dibyendu-dutta.vercel.app`.
- Published Development URL: `https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app`.
- Native Vercel alias inspection confirmed the Development hostname points to this READY deployment. Previous verified artifact/rollback target: `dpl_6v1mxijEWaoky6jAG3YniiVB1e25`.

The initial review build failed strict fixture typing; this was corrected. A subsequent review-branch build was rate-limited. The normal automatic Development merge build reached READY; no quota bypass, project/account switch, forced build or old-artifact relabelling was used. The earlier quota failure is historical, not the final release state. Only the two public Supabase frontend variables were copied to the review branch; private provider credentials and Production/Development configuration were unchanged.

## Acceptance evidence and limits

[Sanitized Stage 6 evidence](research-ui-sector-review-evidence/stock-research-stage-6-rollout-2026-10-08.json) contains 234 passing stock-matrix checks, 58 passing focused candidate checks and 58 passing post-publication Development checks: **350 valid checks**. These are separate runs on the same exact application source. The original cross-surface verifier incorrectly expected signed classes on a historical transaction row without a current position; its two assertions were superseded by the passing focused HDFCBANK transaction-context checks. Dashboard readiness was corrected to use its actual headings and allow its verified owner-scoped read-only news-feed RPC. Neither correction changed application code or weakened write protection.

Actual cached financial values exercised green gains, red losses and neutral zero. Client-only quote fixtures separately exercised exact zero and unavailable Research P/L, using an explicit `STAGE6_UI_SIMULATION` provider marker; actual cache reads were restored afterwards. No synthetic quote or other test data was persisted. Browser screenshots/authentication material remain private and are not committed. No local rendered app or injected CSS was substituted for hosted acceptance.

Visual screenshots were inspected for stock identity, industry/subprofile context, gain presentation, portfolio surfaces and mobile layout. Source-bound specialist tabs and Evidence retained the same selected assignment/snapshot; all five Pharma models remained distinct. Unresolved assignment stayed explicit. Independent evidence/engine/readiness states and owner roles were retained.

Measured text contrast: gain 7.13:1 on white / 6.81:1 on its pale surface; loss 6.57:1 on white / 5.98:1 on its pale surface. These exceed WCAG AA normal-text contrast. The existing production-build large-chunk advisory remains; no bundle restructuring was introduced.

The full-repository Vitest suite and authenticated Deno handler/source-readiness proofs are not claimed. The five pure ownership-guard tests do not certify source semantics or operational V1-4 completion. C1/C8, evidence and methodology approvals remain independently governed; no missing data was filled to obtain visual acceptance.

## Decision, boundaries and rollback

**Approve the common stock shell, Industry-first specialist presentation and shared financial theme for all-stock Development use. Stage 6 design rollout is complete.** Financial gain color is not an investment recommendation; readiness/qualified-advice safeguards remain binding. Production promotion and upstream methodology/evidence certification are outside this release.

No database migration, Supabase function deployment, provider execution, evidence/assignment write, Auth/RLS change, financial formula change or Production publication occurred. Existing portfolio view models, dashboard evidence hooks, research repositories and effective assignment remain the shared authorities. Concurrent Development ownership work was preserved.

If a later release fails acceptance, rollback the Development alias to its previous verified READY deployment through normal Vercel alias assignment. Do not rewrite evidence or accounting to make a screenshot appear complete. Retain both this release record and the Stage 4/5 release history.
