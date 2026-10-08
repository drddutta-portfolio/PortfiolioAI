# Stock research Stage 6 — Development rollout and financial color theme

**Date:** 8 October 2026 (Asia/Kolkata)

**Target:** PortfolioAI-Development only

**Status:** Implementation checks PASS; Development code rollout is tracked in PR #119. Hosted publication/visual acceptance is BLOCKED by Vercel deployment rate limiting. Stage 6 is not finally accepted.

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

Focused application tests: **137 PASS across six files**, including all profile contracts, selected-context safeguards, Research zero/loss/unavailable regression cases, financial sign precision and covered allocation P/L states. Integrated concurrent ownership guard: **5 PASS** under the Edge Vitest configuration; this is not an authenticated Deno handler/source-readiness proof. Changed TSX/helper/test ESLint, architecture guard, added-line credential scan and diff checks pass. Production TypeScript/build PASS (existing large-chunk advisory retained). Review PR: #119. Final source revision and CI result are recorded below; hosted checks remain pending. The preview branch has only the two public Supabase frontend variables copied from Development; no private provider credentials or Production/Development configuration were changed.

Measured text contrast: gain 7.13:1 on white / 6.81:1 on its pale surface; loss 6.57:1 on white / 5.98:1 on its pale surface. This exceeds WCAG AA normal-text contrast; hosted geometry and CSS loading-order checks remain separate. No locally rendered app is used for visual acceptance. Unit tests and the production build are local engineering checks, distinct from hosted browser acceptance.

A Vercel READY build must contain this stage's actual code. The existing Stage 4/5 READY artifact cannot prove or publish the new theme. The previously observed daily deployment-count limit and GitHub runner billing restriction are independent of storage/traffic usage. If they still prevent builds, retain an explicit publication/acceptance block; do not repeatedly retry or bypass quotas.

Application source revision: `0fddf87c89471aeaee17c2acddd5fc3360eebd38`; `src` tree: `4ac1800a434a3369b5c5271a6ebbf6aa57ecb65c`. Subsequent evidence-only commits preserve this application source tree. Review/release tracking: [PR #119](https://github.com/drddutta-portfolio/PortfiolioAI/pull/119). The final check and merge identities remain available on that PR; this document does not predict their outcome. Sanitized evidence: [Stage 6 rollout manifest](research-ui-sector-review-evidence/stock-research-stage-6-rollout-2026-10-08.json).

## Hosted release block and current live artifact

Vercel accepted the first preview at `67ac91fe5757215bc7aafb3effe9ca61f76e56e5` but rejected its strict test-fixture typing (`dpl_7AkgAUpxiZmJ7dXR96BkBjqh3z8q`, ERROR). Both fixture typing issues are corrected and the final local production build passes. The next corrected revision (`235844afb62d81d54de3648ceb7ba346e09c1178`) received the GitHub Vercel status **Deployment rate limited — retry in 24 hours**. No READY Stage 6 artifact exists; no old artifact is relabelled as Stage 6 and no quota bypass is attempted.

The Development alias was independently inspected and still points to `dpl_6v1mxijEWaoky6jAG3YniiVB1e25`, the previously accepted Stage 4/5 build. New gain/loss styling therefore cannot be claimed visible there yet. All Stage 6 hosted visual checks remain pending; no local render or injected CSS is substituted for acceptance.

GitHub runner availability has recovered: run `37782352355` executed its application, methodology, architecture, lint/typecheck and production build steps successfully, then failed only two Markdown trailing-space lines in the new rollout document. These lines are corrected. The final PR head must pass the rerun before merge; Vercel's quota failure is assessed separately and must remain explicit.

**Release decision:** approve the verified presentation code for the normal Development merge after final CI; do not declare hosted rollout or Stage 6.4 acceptance complete. When Vercel permits a normal build, require the exact merged source to reach READY and independently complete the hosted acceptance matrix above before final all-stock release acceptance. No upgrade or account/project switch is made to bypass the limit.

## Boundaries and rollback

No database migration, Supabase function deployment, provider execution, evidence/assignment write, Auth/RLS change, financial formula change or Production publication is part of this stage. Existing portfolio view models, dashboard evidence hooks, canonical research repositories and effective assignment remain the shared authorities.

Rollback the Development alias to its previous verified READY deployment using normal Vercel alias assignment if a new deployed build fails acceptance. Do not rewrite evidence or accounting to make a screenshot appear complete. Retain the prior Stage 4/5 release record; it is not Stage 6 acceptance.
