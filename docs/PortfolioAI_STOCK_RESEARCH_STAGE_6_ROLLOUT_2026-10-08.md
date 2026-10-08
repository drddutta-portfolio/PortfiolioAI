# Stock research Stage 6 — Development rollout and financial color theme

**Date:** 8 October 2026 (Asia/Kolkata)  
**Target:** PortfolioAI-Development only  
**Status:** Implementation and release verification in progress; hosted acceptance is pending a READY build of this revision.

Stage 6 rolls out the accepted Industry-first, business-model-aware research page and adds the owner's requested application-wide gain/loss presentation. It preserves the two-part design: the common shell applies to every stock; the effective canonical research assignment selects specialist content. Sector remains contextual metadata. This stage does not certify missing taxonomy, evidence, ownership provider semantics or qualified recommendations.

| Sub-stage | Deliverable / release condition |
|---|---|
| 6.1 Release contract | Preserve Stage 5 acceptance, canonical assignment/lineage, common sticky navigation, full wrapping names, independent evidence/engine state and saved owner role. Inventory the Development revision and upstream limitations. |
| 6.2 Shared financial theme | Use shared green/red tokens for signed P/L, covered returns, price movement and contribution values across Dashboard, Holdings, transaction context and stock research. Zero is neutral and missing values remain unavailable. Keep signs, labels, precision and canonical accounting values. |
| 6.3 Review and Development publication | Run focused regressions, TypeScript/production build, changed-file ESLint, architecture guard, diff/secret review. Publish through a normal GitHub PR/Development merge and Vercel Preview build; record exact source and deployment identities. Assess hosted CI separately. |
| 6.4 Hosted acceptance and handoff | Verify the exact new deployment through the Development URL at desktop, tablet and mobile widths. Check HDFCBANK, TORNTPHARM, all five Pharma refinements and unresolved assignment cases; verify Dashboard/Holdings/transaction-context signed values, zero/unavailable states, CSS loading order, readable signs and contrast. Browse read-only with no provider refresh or research writes. Record evidence and rollback target. |

## Shared presentation contract

`src/features/portfolio/format.ts` exposes `financialTone` and `financialClass`. They classify the supplied canonical Decimal/string value before rounding; they neither calculate P/L nor query storage. Tiny positive/negative values retain their direction; zero and signed zero are neutral. Null, undefined, invalid or non-finite inputs cannot become gains. Existing formatters and domain owners retain value/precision/coverage responsibilities.

Global tokens in `src/styles.css` define gain `#166534`, loss `#b42318`, neutral `#334155` and unavailable `#64748b`, plus pale gain/loss backgrounds and borders. Signed values opt into explicit classes. Financial colors do not select methodology, promote evidence, change portfolio roles or imply investment advice. Prices, balances, allocation categories, buy/sell transaction types and research-readiness indicators are separate concepts.

The Research P/L card now labels zero **No change**, rather than Gain. Amount and percentage each use their own canonical sign, so missing percentages do not inherit an amount's gain color. Imported snapshot P/L keeps its evidence label and its own sign. Daily-movement CSS is scoped to its component, preventing its positive/negative rules leaking into other pages during navigation.

## Verification and release record

Focused application tests: **136 PASS across six files**, including all profile contracts, selected-context safeguards, Research zero/loss/unavailable regression cases, financial sign precision and covered allocation P/L states. Integrated concurrent ownership guard: **5 PASS** under the Edge Vitest configuration; this is not an authenticated Deno handler/source-readiness proof. Changed TSX/helper/test ESLint, architecture guard, added-line credential scan and diff checks pass. Production TypeScript/build and exact revision/PR/deployment IDs remain pending.

Measured text contrast: gain 7.13:1 on white / 6.81:1 on its pale surface; loss 6.57:1 on white / 5.98:1 on its pale surface. This exceeds WCAG AA normal-text contrast; hosted geometry and CSS loading-order checks remain separate. No locally rendered app is used for visual acceptance. Unit tests and the production build are local engineering checks, distinct from hosted browser acceptance.

A Vercel READY build must contain this stage's actual code. The existing Stage 4/5 READY artifact cannot prove or publish the new theme. The previously observed daily deployment-count limit and GitHub runner billing restriction are independent of storage/traffic usage. If they still prevent builds, retain an explicit publication/acceptance block; do not repeatedly retry or bypass quotas.

## Boundaries and rollback

No database migration, Supabase function deployment, provider execution, evidence/assignment write, Auth/RLS change, financial formula change or Production publication is part of this stage. Existing portfolio view models, dashboard evidence hooks, canonical research repositories and effective assignment remain the shared authorities.

Rollback the Development alias to its previous verified READY deployment using normal Vercel alias assignment if a new deployed build fails acceptance. Do not rewrite evidence or accounting to make a screenshot appear complete. Retain the prior Stage 4/5 release record; it is not Stage 6 acceptance.
