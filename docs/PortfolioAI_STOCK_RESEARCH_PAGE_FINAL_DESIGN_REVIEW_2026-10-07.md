# PortfolioAI Stock Research Pages — Final Design Acceptance Review

**Date:** 7 October 2026 (Asia/Kolkata)  
**Reviewed source:** `8ed204d86c5b45e69c50c4f206965c5eec732184`  
**Target:** PortfolioAI-Development; HDFCBANK and TORNTPHARM  
**Decision:** Recommend HDFCBANK's reusable composition as the application-wide design baseline. **Current all-stock implementation: NOT FINAL / NOT ACCEPTED FOR UNIVERSAL ROLLOUT.**

## 1. Decision and its scope

The two-part concept is the correct final architecture: (1) one common stock-page shell, and (2) reusable, contract-selected stock/group research blocks populated with each security's own research. HDFCBANK is the preferred visual baseline. Its banking data is not a template for all companies. TORNTPHARM's applicable Pharma research must be preserved within that shell.

The current pages do not yet implement one common composition. `StockResearchRoute` deliberately selects the redesigned `ResearchPage` only for HDFCBANK; TORNTPHARM and other stocks use `ExistingResearchPage`. Shared navigation and typography do not remove the underlying differences. Do not label current implementation FINAL for all stocks, remove the sample restriction without coverage checks, or freeze the older page as a second permanent shell.

This is a design/acceptance recommendation, not owner approval of new engines, classifications, scoring formulas, provider execution or a universal deployment. Blocked research can have an accepted UI; UI acceptance does not establish evidence readiness or an actionable Core/Satellite recommendation.

## 2. Evidence and limits

The Vercel API confirmed the supplied Development alias was READY at the reviewed SHA (deployment `dpl_GyAo6VwXx5ttniLkVoMZKpgcMXFm`). The checked-out review source exactly matched that SHA.

Authenticated browser comparison used that source locally against the existing Development data configuration, with HDFCBANK security `b47b007d-1990-4504-a5a2-4391c07687c5` and TORNTPHARM security `da69b3eb-0343-44f8-912c-288b826118cc`. Desktop screenshots, 1024px/390px layout checks, Documents→Research health navigation and Evidence-tab selection were checked. No refresh execution, owner edits, factual-review writes or new methodology operations were invoked. Private screenshots remain outside the repository.

**Limit:** this review did not inspect the authenticated rendered hosted pages in the user's browser. Vercel deployment/source verification and local authenticated rendering are separate evidence. Some captured panels were still loading their async data; loading captures do not prove persistent failures or complete result coverage. Only two stocks were examined, so all-profile acceptance remains unproven. This report does not certify every dataset, provider boundary or numeric result.

## 3. Comparison with the plan

| Requirement | HDFCBANK | TORNTPHARM | Acceptance decision |
|---|---|---|---|
| Common route and seven research tabs | Retained | Retained | Pass for these two examples |
| Sticky menu and compact full-name typography | Present; title 24.48px at 1440px | Present; same title size | Shared improvements pass; long-name checks were recorded by the title-sizing change |
| One common header/decision composition | Redesigned owner/advisory layout, interpretation slot and history disclosure | Older composition; interpretation/history slots absent | Fail for universal shell consistency |
| Owner role versus suggested Core/Satellite role | Explicit selected-role and unavailable suggested-role slots in source | Owner role exists; equivalent suggested-role slot absent | Align presentation without inventing recommendations |
| Overview before detailed evidence operations | Context/cockpit first; compact readiness follows, full matrix disclosed | Full, initially expanded requirement matrix precedes research context/cockpit | Fail for shared ordering and progressive disclosure |
| Context strip semantics | Business/research context, owner role and classification | Research profile, portfolio exposure and evidence status | Use the same three-region contract |
| Applicable group research | Bank snapshots plus selected-contract requirement/result extension | Pharma-oriented snapshots and conditional specialist workspace; no generic selected-contract result extension | Preserve Pharma content and add consistent result access |
| Honest source/value presentation | Overview source labels and conservative unit/currency formatting | Older metric formatter and status badges | Carry the same source-versus-validation distinction to all stocks |
| Score qualification safeguards in header | Requires complete current identified run and freshness/capability conditions | Older predicate checks truthy run state and non-null score | Must consolidate before universal acceptance; see section 4 |
| Responsive shell | No page overflow at 1024px and 390px in reviewed sample | Horizontal overflow at 1024px; none observed at 390px | Fix existing composition's intermediate-width overflow or retire it through verified consolidation |
| Section-menu interactions | Documents/Evidence selection and focused health destination worked | Same checks worked | Pass for tested interactions |
| Complete all-profile/state coverage | Not demonstrated by this bank sample | Not demonstrated by this Pharma sample | Universal sign-off remains pending |

The different data, metric labels and requirements between banking and Pharma are desirable. Different common-shell structure, qualification rules and evidence semantics are not.

## 4. Required corrections before final implementation acceptance

### P1 — One shell and one current-result qualification path

Consolidate the common header, advisory slots, interpretation availability, history, context, cockpit, ratings, readiness and research-health structure into reusable composition. Retire the duplicate legacy composition after preserving its capabilities and verifying regression coverage.

In `ExistingResearchPage`, the header's numeric-score condition is `snapshot?.runState && snapshot.overallScore != null`. It lacks the redesigned header's complete-run, identified-run, freshness, preview and blocked-execution checks. This is a source-inspected safety inconsistency, not evidence that an invalid score was displayed during this review. Both pages showed unavailable/blocked assessment states in the observed rendering. Use the existing qualified canonical presentation authority consistently; do not create a third page-local formula or fallback.

### P1 — Preserve research built for each approved group

Map every applicable existing dataset/result to its shared tab, compact summary, specialist module or Evidence detail. Preserve reviewed Pharma business-model/subprofile/exposure research when moving TORNTPHARM into the new shell. Retain generic selected-contract requirement/results for profiles lacking richer presentation modules.

The first-six-requirement preview in `ProfileResearchBlocks` is a compact entry point, not proof that all research has been presented. Full requirements, history, documents, provenance, supporting/contradictory evidence and qualified outputs must remain reachable. Keep technical normalized-value JSON in expandable evidence detail; use source-supported business labels and safely formatted results in the primary research view where the contract supplies them.

### P2 — Consistent hierarchy, semantics and responsiveness

Use the HDFCBANK Overview order: context → cockpit/heatmap → ratings → compact readiness → applicable snapshots → Research Health → specialist research. Keep the complete immutable evidence matrix available in Evidence/disclosure rather than expanded before the cockpit.

Apply the same source-availability labels, currency/unit/period/scope rules and explicit unavailable states across all stocks. Preserve provider ratings as provider opinions. Distinguish the owner's saved role from a qualified suggested role; missing engines show an unavailable reason, not a default Core/Satellite choice.

Keep canonical sector, industry, supported sub-sector/group/subgroup fields, profile/subprofile and approved overlays distinguishable. Display unavailable classification metadata explicitly; never infer or manufacture it from the ticker or presentation module.

Remove intermediate-width horizontal overflow without truncating names or deleting evidence. Menu links must only target available modules and retain tab switching, focus and sticky offsets.

### P2 — Prove universal coverage

Verify banks, Pharma, financial holding companies, another specialist non-financial profile, unknown/unresolved profiles, and sparse/blocked/stale/conflicting cases. Enumerate every approved profile/subprofile presentation outcome. Include two different stocks sharing a profile to prove that modules are reused while facts remain security-scoped.

## 5. Recommended final standard

**Part 1 — Common shell:** one stock route/composition, sticky section menu, compact fully wrapping identity, About, price/exposure/owner plan, qualified advisory slots, gated interpretation, insights/history, compact refresh, seven tabs, context, cockpit/heatmap, external ratings, readiness, snapshots, research health and complete Documents/Evidence access. Availability may change; the structure and semantics remain common.

**Part 2 — Contract-selected research:** economically applicable metrics, periods/history, operating drivers, risks, business-model/exposure modules, valuation basis, requirements, reviews, documents and retained/qualified results selected through approved canonical assignments and contracts. Same-group stocks share components and methodology contracts, never another stock's data.

## 6. Final acceptance checklist

- One common shell is used by both reference stocks; no permanent symbol-based composition split.
- Banking content remains applicable only to approved banking/lending contracts; Pharma content and prior research are preserved.
- Every approved profile/subprofile has an explicit presentation mapping or an honest unsupported state with complete retained evidence access.
- Header/advisory/cockpit numeric qualification and source-state semantics agree.
- Owner-selected and suggested roles remain separate; unavailable engines do not manufacture recommendations.
- Context, evidence ordering, history and interpretation availability use the same grammar.
- All existing applicable research datasets/results have a documented presentation destination.
- Representative desktop, intermediate and mobile views show full names and no page overflow.
- Navigation, tabs, ratings/evidence disclosures and keyboard focus pass; no provider execution or new writes occur through the new navigation.
- Relevant regressions, architecture guard, TypeScript, changed-file lint and build pass for the consolidation.
- Authenticated hosted acceptance is recorded against the deployed SHA, including blocked/unsupported states and preserved specialist research.

**Final recommendation:** use the HDFCBANK shared-shell direction as the final target design, retain TORNTPHARM's applicable research within it, and complete the corrections above before declaring the application-wide implementation FINAL. Do not wait for every engine to become ready merely to complete the shell; do not mistake a completed shell for completed research engines.
