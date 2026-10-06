# PortfolioAI Stock Research Page Design and Implementation Plan

**Date:** 6 October 2026 (Asia/Kolkata)
**Repository:** drddutta-portfolio/PortfiolioAI
**Target branch:** PortfolioAI-Development
**Design version:** STOCK_RESEARCH_WORKSPACE_V2_2_TWO_PART_DESIGN
**Status:** Consolidated design specification / implementation proposal. Documentation creation is authorized; this document does not independently authorize application changes, provider execution, migrations or later V1 gates.
**Reference baseline:** `95ae01330f87e7adc35a79da084f4beb9157c2bd`
**Product rule:** One PortfolioAI, one reusable stock Research shell, profile-specific research within it.

## 1. Purpose and boundaries

Make every stock Research page understandable, consistent and useful while preserving the frozen R4M shell, existing methodology, canonical authorities and all retained evidence. The first screen and the beginning of Overview must explain the company, the owner's exposure, what research is established, and why any conclusion is unavailable.

This document consolidates PortfolioAI sources only. No design, code, taxonomy or methodology from another program is incorporated.

This is an upgrade of the existing Research workspace, not a replacement application. It changes presentation contracts and implementation planning; it does not approve scoring formulas, source substitutions or methodology assignments. Implementation must remain subordinate to the Master Blueprint, Research and Intelligence Architecture, Single Source of Truth Architecture, Database Architecture, Development Rules, current Scope Freeze A/B and explicit gate authorization.

## 2. Source references and their authority

| Reference | Recorded status and contribution | How this plan uses it |
|---|---|---|
| [R4M Universal Research Workspace Freeze](R4M_Universal_Research_Workspace_Freeze.md) | Frozen R4M_V1; records owner-approved PR #100 merged at de54ed1fa9569e9db0c14cfa8dac6dfbc2638c9f. Defines common regions, tabs, interfaces and prohibited extensions. | Governs the shared shell and state vocabulary. Its existing freeze is preserved. |
| [R4M Profile-Driven Research Workspace Plan](R4M_Profile_Driven_Research_Workspace_Plan.md) | Records a reusable workspace, profile UI registry, compact summaries, responsive presentation and regression requirements. | Supplies presentation extension patterns and consolidation rules. Implementation-complete statements in this historical document are not proof of current compliance. |
| [Sector Research Profile Architecture](PortfolioAI_Sector_Research_Profile_Architecture.md) | Labels itself an architecture candidate for owner review; distinguishes sectors, subprofiles and overlays. | Supplies the research framework. Examples are not new approved routes, formulas or source permissions. Current approved canonical assignments and contracts determine applicability. |
| [Research Page Consistency Audit](R4N_HDFCBANK_TORNTPHARM_Research_Page_Consistency_Audit.md) | Defines the shared overview spine, common visual grammar and compact specialist workspace with collapsed deeper controls. | Supplies layout consistency and progressive disclosure. |
| [Product UI and Decision Workflow](PortfolioAI_Product_UI_and_Decision_Workflow.md) | Higher-level product workflow; V1 is integration/correctness/completion, not a broad redesign. | Keeps this work a bounded restoration and extension of the existing Research experience. |
| [Scope Freeze B and Build Plan](PortfolioAI_V1_SCOPE_FREEZE_B_AND_BUILD_PLAN_2026-10-05.md) | Governs current V1 gates, evidence and release acceptance. | Determines execution boundaries; design publication does not open a gate. |
| [Versioned Build and Baseline Preservation Plan](PortfolioAI_VERSIONED_BUILD_AND_BASELINE_PRESERVATION_PLAN_2026-10-05.md) | Requires cumulative upgrades and preservation of valid prior work. | Requires reuse, extension and traceable migration of presentation components. |

The R4M freeze lists detailed region ordering; the consistency audit describes a shorter overview spine with slightly different readiness placement. For this consolidation, preserve the explicit frozen R4M region sequence below. Use the audit's compact summaries, common grammar and specialist placement. Do not silently treat the shorter audit diagram as approval to replace the frozen sequence.

No existing reference is deleted, rewritten or declared obsolete by this document. Any future alteration to frozen region ordering must be a named, reviewable amendment.

## 3. Two-part stock-page design: common shell and stock-specific research

Every stock Research page consists of **two design parts**. This applies to ALL stocks, including stocks with incomplete research, blocked evidence or unsupported presentation metadata. HDFCBANK is a visual baseline for the common shell; its banking content is not the template for every stock.

### Part 1 — Basic shell, common to ALL stocks

Every stock uses the same route, layout components, region order, tabs, card grammar, typography, responsive behavior, evidence interactions and loading/error vocabulary. The shell provides identity and classification, About, price/portfolio exposure, owner plan, advisory and interpretation slots, Key Insights, refresh controls, research navigation, context, cockpit, heatmap, ratings, readiness, snapshots, Research Health and access to Documents/Evidence.

Common design does not mean identical values or research dimensions. These regions display the selected stock's actual data and applicable research, or an honest unavailable state. A blocked profile retains the shell. Section 4 defines its shared regions and section 17 maps the implementation.

### Part 2 — Stock-specific research design and group-built research data

Within the common shell, reusable research blocks present the content appropriate to the stock's canonical sector, industry, sub-sector/group/subgroup, approved research profile/subprofile and applicable approved overlays. These classification fields remain distinct from methodological assignments: the approved effective research contract selects requirements, dimensions, metrics and modules; the UI must not infer a methodology from a sector label or ticker.

This part must expose the research data and results already built for the applicable group of stocks: relevant financial and operating observations, normalized metrics and history, business-model/exposure research, source documents, supporting and contradictory evidence, validation/review states, requirement coverage, freshness, blockers, and qualified persisted assessments and explanations where available. It is substantive research content, not merely a sector badge or a different card title.

Stocks in the same approved research group reuse the group's presentation modules and methodology contract. Each stock displays only its own security-scoped observations, evidence and results, with portfolio scope where applicable. Group reuse must never copy another stock's values or apply banking metrics to an unrelated business. Existing research remains accessible through the relevant shared tabs and expandable specialist blocks even when the Overview shows only a compact selection.

### Implementation configuration layers supporting the two design parts

The following three technical layers implement the two design parts; they are not three separate page designs.

1. **Universal shell:** identity, company description, exposure, owner plan, advisory regions, navigation, overview, evidence and document interactions.
2. **Approved effective research contract:** applicable dimensions, metrics, requirements, history, freshness, benchmarks, labels and workspace modules.
3. **Security-scoped state:** actual assignments, facts, observations, reviews, readiness, engine runs, recommendations and owner decisions.

Industry/sector/group/subgroup labels are canonical classification facts. Research profiles/subprofiles are methodological assignments. They may correspond, but they are not interchangeable and the UI must not infer one from the other.

An overlay changes only those research modules and applicability rules explicitly specified by the approved effective contract. It does not independently change canonical sector, assign a portfolio role or create an opinion.

Unknown or unresolved profiles use the same shell with explicit unresolved applicability and blocked results. They must not inherit a generic scoring model or bank metrics.

## 4. Entire page structure

| Order | Shared region | Content and behavior |
|---:|---|---|
| 1 | Security header and classification | Company name, symbol, exchange, asset class, canonical sector/industry/group/subgroup where available; resolved research profile/subprofile and assignment date. Long names wrap by words. |
| 2 | About company | Compact source-supported description of business, products/services, customers/geographies and material operating exposures. If absent, one concise unavailable message; no fabricated company narrative. |
| 3 | Portfolio and price summary | CMP with price timestamp/session and freshness, quantity, cost basis/method, invested cost, current value, P&L and portfolio weight. Broker/account attribution remains explicit when incomplete. |
| 4 | Decision Workspace | Owner-controlled plan: role, target weight, horizon, target price and stop-loss reference. Edit controls use existing authorized owner workflows. |
| 5 | PortfolioAI Suggestion | Separate read-only advisory region: recommendation state, applicable role/action/range and portfolio context only from qualified canonical outputs. Otherwise explain the exact missing prerequisites. |
| 6 | AI Interpretation | Same location and interaction grammar for all profiles; enabled only under existing downstream authorization and qualified deterministic recommendation. Never invent a thesis, metric or action. |
| 7 | Key Insights | Up to three to five concise source-supported findings, material risks or unanswered research questions. Do not repeat the suggestion card verbatim. |
| 8 | Research Refresh | Compact shared control strip plus expandable profile capability modules; no provider calls on rendering/navigation. Explicit lifecycle and separate planning/execution controls. |
| 9 | Research navigation | Overview / Financials / Quality & Growth / Ownership / Valuation / Documents / Evidence. Same labels and order for all stocks. |
| 10 | Research at a glance | Three-card strip: business/research context, owner's portfolio role/exposure, and canonical classification. Evidence/score readiness remains prominent in the cockpit and readiness regions; see section 16.3. |
| 11 | Investment Decision Cockpit and section summaries | Independent dimensions, assessment state and material reasons from qualified persisted outputs; explicit engine/evidence blocks when unavailable. |
| 12 | Investment heatmap | Shared geometry and accessibility; only applicable approved dimensions. No manufactured scores, misleading curves or zero-filled missing cells. |
| 13 | External ratings | Clearly separate provider opinions/ratings from PortfolioAI conclusions. Compact empty state and source/date metadata. |
| 14 | Research Readiness | Compact grouped summary, validated applicable requirement counts and top blockers. Full requirement matrix and lineage belong in expandable detail/Evidence. |
| 15 | Profile metric snapshots and detailed content | A small set of relevant source-bound metrics, followed by Research Health and the profile-specific deep-research extension. Detailed content is selected through common tabs. |

Regions 4–7 may share a responsive container while preserving their reading order and distinct authority. Regions may be compact, collapsed or show a concise unavailable state; do not replace the common shell with a stock-specific empty layout.

The full methodology-requirements table must not precede Research at a glance in the default Overview. Readiness appears once as a summary; other locations link to the same details rather than duplicating them.

### Structure diagram

```mermaid
flowchart TD
    A["Identity → About → Position"] --> B["Owner plan | Canonical advisory | Interpretation | Insights"]
    B --> C["Compact refresh controls"]
    C --> D["Shared research tabs"]
    D --> E["Overview: Context → Cockpit → Heatmap → Ratings → Readiness"]
    E --> F["Applicable metric snapshots → Research Health"]
    F --> G["Sector/profile deep research: compact summary + expandable modules"]
    D --> H["Financials / Quality & Growth / Ownership / Valuation"]
    D --> I["Documents / Evidence: complete facts, requirements and lineage"]
```

## 5. Tab contracts

| Tab | Questions answered | Required presentation |
|---|---|---|
| Overview | What is this business, what is our exposure, what is known and what prevents a conclusion? | Shared sequence above; prioritized findings and blockers; specialist summary after shared research health. |
| Financials | How has performance, cash generation and balance-sheet strength changed? | Relevant annual/quarterly series, units, periods and scope; no charts without validated comparable observations. |
| Quality & Growth | Is performance durable and what drives it? | Profile-specific quality, growth, cash conversion, durability and operating drivers; deterministic assessments separate from raw observations. |
| Ownership | Who owns the business and what changed? | Dated compatible ownership series, pledge, dilution and documented governance events; explain denominators and overlapping categories. |
| Valuation | What is the valuation basis and is it economically applicable? | Valid profile-specific methods, dated denominators, price timestamp and approved peer/own-history context; no invented upside or fair value. |
| Documents | Which primary artifacts support the research? | Verified document identity, issuer/source, publication/period, content identity, reviewed passages and requirement links; discovery-only records marked as such. |
| Evidence | What has actually passed validation and what remains blocked? | Complete requirement matrix, applicability/history units, periods/freshness, review status, source IDs/hashes and expandable reproducible lineage. |

Financial history tables should distinguish annual, quarterly, TTM, instant and comparative/restated facts. Do not combine incompatible bases to create a trend.

Evidence rows show human-readable explanations first and technical reason codes on expansion. Audit detail remains accessible; it is not removed to shorten the page.

## 6. Part 2 content: sector, industry, sub-sector and profile/subprofile adaptation

The approved canonical assignment selects the effective methodology. A shared presentation registry maps that methodology to groups and labels; it must not classify the security or calculate scores.

| Research family | Typical content focus, subject to approved contract | Prevent misleading carry-over |
|---|---|---|
| Banks | Loan/deposit growth, asset quality, margins, capital, profitability and applicable book-value valuation | Do not generalize bank measures to all financial companies. |
| NBFC/lending | AUM, funding/liquidity, credit losses, leverage and lending economics | Do not treat deposits/CASA as universally applicable. |
| Insurance | Life: APE/VNB/EV/persistency; general: underwriting/combined ratio/solvency | Do not mix life and general-insurance metrics or bank capital measures. |
| AMC/broker/exchange/depository | AUM/flows, client assets/activity, volumes, market share and fee economics as applicable | Each approved operating-model subgroup controls metrics. |
| Financial holding company | Subsidiary economics, look-through earnings, capital allocation, liquidity/leverage and approved SOTP/NAV context | No generic bank deposits/NPA grid or arbitrary holding-company discount. |
| IT/services/product | Revenue/margins, cash conversion, client/deal concentration and approved product/service operating measures | Do not turn unverified AI exposure into a quality conclusion. |
| Pharma/healthcare | Role-selected business model, financials, regulatory/site evidence, product/pipeline and cash quality | Domestic formulations, generics, API, CDMO and other reviewed subprofiles retain distinct applicability. |
| Industrials/capital goods/defence | Order book/execution, margins, working capital, capacity and customer/project exposure | Order backlog is not automatically recognized revenue or a recommendation. |
| Consumer/retail/durables | Demand, mix, distribution, unit economics, margins and cash generation | Use approved operating-model distinctions rather than one consumer formula. |
| Commodity/cyclical businesses | Cycle-aware margins/cash flow, leverage, capacity/cost context and sufficiently long history | A peak quarter must not become permanent quality/growth. |
| Real estate/construction | Cash collection, project/land/liability evidence, execution and approved valuation basis | Do not substitute ordinary industrial sales/margins for project economics. |
| Power/utilities/telecom/infrastructure | Regulated/contracted revenue, assets, utilization, cash flows, leverage and capital intensity | Operator, infrastructure and regulated subgroups may require different measures. |

This table illustrates presentation families; it does not approve new profiles or claim implemented engines. The implementation coverage manifest must enumerate **every current approved profile/subprofile**, including those omitted from the examples, and identify presentation support, unresolved applicability and engine availability separately. Current portfolio profile counts are observations, not permanent limits.

### Pharma extension example

Keep a compact model summary and then two collapsed-by-default groups:

1. Business model & exposure map: primary business, reviewed material overlays, emerging/unresolved exposures and their methodology applicability.
2. Evidence operations & review controls: source acquisition/review tools and complete retained methodology detail.

Preserve valid prior methodology and research structures. Role-specific denominator inclusion follows approved contracts; the UI cannot decide which exposure counts.

A security's evidence, assignments and lineage must never be inherited from another reference stock.

## 7. Canonical facts and display contracts

| Displayed fact | Authority / shared consumption rule |
|---|---|
| Quantity, cost basis, realized/unrealized P&L | Existing canonical ledger/accounting/portfolio view path. No Research-page arithmetic competing with Holdings or Dashboard. |
| Portfolio role, target and horizon | Owner-controlled canonical settings, kept separate from recommendations and asset class. |
| Price and history | Existing approved market-data authority and validated history path; session/freshness shown. |
| Sector/industry/group/subgroup | Canonical identity/classification projection. Missing hierarchy levels remain unavailable. |
| Profile/subprofile and methodology version | Current approved canonical route/assignment, with effective-contract lineage. |
| Evidence readiness | Current selected canonical evidence snapshot and requirement items, with evaluation/source cutoff; not raw provider status. |
| Engine availability and assessments | Existing canonical engine registry/runs, separately identified from evidence readiness. |
| Advisory action and fit/sizing/exit | Qualified canonical persisted outputs with portfolio context and reproducible lineage. |
| Company narrative and primary documents | Approved source-supported document/profile path; absent content is not generated as fact. |

### Required metric view model

A metric card/table cell consumes, at minimum:

- canonical metric code and investor-facing label;
- value kind, exact value or null, display precision and canonical unit;
- currency and source scale where applicable;
- period start/end/type and reporting scope;
- publication and retrieval dates;
- applicable freshness limit and current state;
- source identity and observation/document/review references;
- validation state distinct from provider/raw availability;
- effective profile/contract version and applicability;
- reason for an unavailable, conflicting, stale or unreviewed display.

Display formatting uses the existing approved decimal/rounding contracts. Do not reinterpret a percent, ratio or currency amount in JSX. Retain source-value evidence and deterministic conversion lineage.

A raw/source value may be shown as such when safe, but must not receive a canonical VERIFIED badge merely because a legacy/provider flag says verified. A value whose unit or currency cannot be represented safely is not shown as an apparently interpretable financial amount.

### State vocabulary

Preserve R4M's explicit states:

- SCORED: qualified numeric assessment exists.
- EVIDENCE_NOT_SCORE_READY: validated evidence exists but scoring prerequisites are not met.
- NO_VALIDATED_EVIDENCE: no qualifying evidence exists.
- NOT_APPLICABLE: the approved effective contract excludes this item.
- NO_DATA: raw/source information is absent.

Expose the underlying evidence states without conversion to a default opinion: fresh, stale, missing, insufficient, conflicting or review required.

Not available means no approved capability; not ready means prerequisites are missing; pending means an initiated process is awaiting completion. Do not use Pending for every empty or unimplemented result.

Keep profile resolved, evidence ready, engine implemented, assessment available and advisory available as independent facts.

### Readiness and freshness summaries

Compute summaries in the shared canonical selector/view-model layer. Count only applicable requirements with the approved mandatory/important/supplementary definitions. Show numerator, denominator and evaluation date; do not combine different readiness denominators.

Snapshot age and current price freshness are separate. A stored snapshot dated October 5 must not appear to be a newly evaluated October 6 result. Do not derive or persist readiness while rendering.

## 8. Investor-facing information hierarchy

Each page should support three reading depths:

1. **Understand:** compact identity, company description, exposure and research state.
2. **Investigate:** applicable financial/quality/valuation/ownership facts and material research questions.
3. **Audit:** complete source documents, requirement details, review decisions and reproducible lineage.

Key Insights must explain supported observations, not manufacture strengths/risks from missing evidence. If no conclusion is qualified, use a concise research summary such as: “A current investment assessment is unavailable because the required annual profitability series and benchmark-aligned history have not been validated.”

Business questions may be displayed as questions awaiting evidence; they must not masquerade as answered analysis.

Refresh operations and internal development terminology are secondary. Translate reason codes into specific plain-language explanations while retaining the original codes in Evidence.

## 9. Visual, responsive and accessibility rules

- Keep the existing PortfolioAI typography, colors, card grammar, tabs and navigation. Avoid another independent stylesheet/design system per profile.
- Use compact cards, consistent spacing and content-driven empty-state heights.
- On desktop, use a stable main-content and compact secondary-context layout where existing shell supports it.
- On narrow screens, stack regions in their defined reading order; avoid horizontal page overflow or character-by-character wrapping.
- Preserve shared tab order; allow keyboard-accessible scrolling when space is limited.
- Use labeled controls, visible focus, semantic headings and accessible disclosure states.
- Never convey readiness, gain/loss or risk by color alone.
- Tables may scroll within their container on mobile; offer readable summaries before dense tables.
- Round displayed weights through existing formatting rules; do not expose twenty-decimal raw percentages.
- Conditionally show meaningful controls through shared capability states, not symbol-specific CSS/JSX.
- Expanded/collapsed state should not reset unexpectedly during ordinary navigation.

## 10. Defects observed in the live Development UI

The following observations were made read-only on 6 October 2026. They are repair targets, not new canonical facts or permission to change assignments.

| Observed issue | Planned correction | Verification |
|---|---|---|
| Large methodology matrix precedes Research at a glance | Restore the frozen overview sequence; compact readiness summary and expandable full Evidence detail. | Default Overview heading/order and screenshot regression. |
| Decision/readiness status repeated in several blocks | Distinct responsibilities for suggestion, insights, readiness and research health; shared underlying state. | No duplicate generic Pending/Review required narrative. |
| AKUMS header says primary subprofile pending while snapshot names CDMO CRAMS | Reconcile authority, version and timestamps; display current assignment separately from historical snapshot assignment if different. | Never guess which source is current or overwrite an assignment. |
| Owner role appears as Other and Unclassified | Use the same owner-role view model everywhere; do not confuse asset class/profile with role. | Cross-surface role consistency. |
| Financial values lack visible period/unit/scale | Enforce metric display contract and explicit unavailable metadata. | Unit/currency/period fixtures and live inspection. |
| Non-bank financial company shows bank-oriented metric placeholders | Approved effective-contract applicability drives all tabs and groups. | No bank-metric leakage into holding-company, Pharma or other non-bank pages. |
| Cached VERIFIED labels coexist with blocked canonical evidence | Show raw/source availability and canonical validation as distinct concepts. | Legacy flags cannot imply current methodology readiness. |
| Empty company description uses prominent space | Compact truthful empty state; source enrichment remains separately authorized. | Sparse-evidence screenshot. |

The page length alone is not an error: complete research must remain available. The error is forcing deep diagnostics before the primary research summary.

## 11. Implementation architecture and reuse

Reuse and extend:

- `src/pages/ResearchPage.tsx` for the common route/composition;
- `src/features/research/researchProfileUiContract.ts` for presentation metadata;
- existing readiness view models/adapters, including `pharmaReadinessViewModel.ts`;
- existing accounting/portfolio hooks and canonical route/snapshot selectors;
- existing shared metric, cockpit, heatmap, document and evidence components.

These paths are starting points to inspect, not proof that all current implementations already comply.

Prohibit:

- stock-specific pages or permanent symbol-specific component trees;
- page-local sector routing, score calculations, readiness reconstruction or direct canonical-storage queries;
- duplicated source/provider or accounting logic;
- provider calls, score/recommendation tracking writes or persistence caused by rendering;
- new hidden fallback scoring, invented company descriptions or placeholder numerical data;
- deleting prior evidence/methodology merely to simplify the UI.

If an existing render path writes recommendation-preview tracking, identify and preserve its authorization boundary; a read-only visual check must not accidentally exercise it.

## 12. Bounded implementation sequence and V1 placement

| Step | Work | Gate relationship / boundary |
|---|---|---|
| D1 | Compare current shared composition against this contract; inspect relevant components and authority paths. Produce a focused file/change map. | Design preflight, not another general V1 audit. |
| D2 | Repair ordering, progressive disclosure, label/context conflicts and metric presentation. Extend shared profile UI configuration. | Bounded presentation integration alongside authorized V1-4 work; application execution must be explicitly authorized. |
| D3 | Ensure all current approved profiles/subprofiles use the shell and honest applicability/unsupported states. | No new methodology, evidence or engine implementation implied. |
| D4 | Populate assessment regions from qualified deterministic outputs as engines become available. | V1-5 after separate authorization. |
| D5 | Populate eligibility, fit/sizing/exit and portfolio-aware action regions. | V1-6/V1-7 after their separate authorizations. |
| D6 | Integrate approved thesis, interpretation and owner-decision workflows. | V1-8 after separate authorization. |
| D7 | Verify complete authenticated workflows, maintenance/outage states and release acceptance. | V1-9; restore proof remains separately mandatory. |

D2 must not wait for all stocks to become READY: blocked pages still need accurate, organized research. Conversely, a polished page does not close V1-4 or any downstream gate.

Implementation commits should be small and focused. Preserve the repaired evidence validator workstream and do not mix UI repairs with provider campaigns or schema changes.

## 13. Acceptance matrix

The following is the design acceptance contract; no PASS is claimed by publishing it.

| Area | Required proof |
|---|---|
| Shared shell | Same regions and tab order across bank, holding company, Pharma, non-financial specialist, unknown profile and sparse/blocked states. |
| First-glance clarity | At 1440×900, first screen identifies the company, exposure and research/advisory state; first Overview screen after selecting the tab shows the research summary before the full evidence matrix. |
| Profile applicability | Every current approved profile/subprofile has an explicit presentation outcome; no irrelevant bank metrics appear outside approved bank/lending applicability. |
| Canonical consistency | Identity, role, quantity, cost, price and weight agree with their shared authorities and other surfaces using the same snapshot/time context. |
| Value meaning | No financial amount appears without safe unit/currency/scale and period context; missing metadata remains explicit. |
| State meaning | Raw data, validated evidence, engine capability, assessments and advice remain distinguishable. |
| Evidence integrity | Complete requirements and lineage remain reachable; detail is collapsed, not removed. |
| Advisory safety | No fallback HOLD, invented score, implied recommendation or hidden readiness promotion. |
| Read-only browsing | No provider calls, refresh execution, database writes or scheduler actions from ordinary navigation/rendering. |
| Responsive/accessibility | Check 1440px, 1024px and 390px widths, keyboard navigation, focus, text wrapping and accessible disclosures. |
| Resilience | Loading, error, empty, partial, stale, conflicting, short history and unavailable engine states preserve the common shell. |
| Preservation | Existing valid research, methodology, owner settings and evidence remain intact. |

Use real Development cases for visual acceptance, including HDFCBANK, TORNTPHARM, AKUMS and ABCAPITAL when accessible, plus representative approved profiles and unresolved cases. Reference companies are test cases, not presentation branching keys. Keep private holding quantities/account details out of committed screenshots or use sanitized fixtures.

## 14. Tests, deployment verification and completion evidence

For implementation:

1. Add meaningful composition/order, profile applicability, metric metadata, state semantics and canonical consistency regressions.
2. Test both populated and sparse/blocked view models and unknown-profile behavior.
3. Run relevant tests, TypeScript, changed-file lint, architecture guard and production build; disclose pre-existing failures separately.
4. Verify the Development Preview and deployed source equivalence. Documentation-only differences do not require repeated application acceptance.
5. Use authenticated browser inspection with existing protected access; never weaken Vercel or PortfolioAI authentication.
6. Verify relevant tab/disclosure interactions without executing provider controls, edits or tracking writes.
7. Record tested application SHA, UI cases, viewport screenshots, omitted checks and remaining limitations.
8. Update Development Status only when implementation reality or the approved milestone changes.

Documentation-only publication requires reference/path checking, Markdown/whitespace checks and verification of the documentation-only commit. It does not require an unrelated application build.

## 15. Completion boundaries

**Design complete:** one documented shell, profile-extension rules, full tab contracts, state/metric semantics, current defect map, implementation sequence and acceptance criteria.

**Implementation complete:** repaired shared workspace is deployed and verified across representative profiles/states, with coverage of every approved profile configuration and preserved underlying logic.

**Evidence/engine/release complete:** only the relevant V1 gate's acceptance contract may establish this; neither design nor UI completion implies it.

This publication creates one consolidated design plan on Development. It does not amend frozen cohort membership/value, release thresholds, methodology, provider budgets, Production, main, Auth/RLS, schedulers, storage or migration state.

## 16. Owner-supplied original stock-page baseline — 6 October 2026 amendment

**Design decision:** The three HDFCBANK screenshots supplied by the owner are the visual and feature baseline for the shared stock Research page. Retain the complete feature set and recognizable layout, and extend it through approved sector/industry/group/subgroup and profile/subprofile contracts.

This amendment clarifies feature preservation in sections 4–9. It does not remove AI Interpretation, readiness or specialist research already required by R4M merely because those regions are not visible in the supplied screenshots.

The screenshots are design evidence, not financial facts, validated scores, current assignments, provider authorizations or approved methodology thresholds. No numerical value, draft policy, 70% gating text, action, score or historical tracking count is adopted as a business rule from an image.

### 16.1 Evaluation of the original design

Preserve the following strengths:

- a recognizable identity/About/position header;
- a clear separation between the owner's saved plan and PortfolioAI's read-only suggestion;
- explanatory action/range links and a compact Key Insights column;
- one refresh area with capability cards;
- consistent navigation tabs;
- a compact context strip, decision cockpit and explainable heatmap;
- expandable external ratings;
- a two-column grid of research snapshots;
- a compact Research Health footer with a direct evidence link.

Correct the visible weaknesses without removing the features:

- eliminate the large blank area under Decision Workspace through content-driven sizing;
- expose dates, units, currency/scale and reporting scope instead of ambiguous raw amounts;
- distinguish current canonical validation from provider/legacy VERIFIED labels;
- clarify ownership categories that overlap, such as mutual funds inside institutional ownership;
- keep unavailable/insufficient heatmap interactions disabled or redirect explicitly to missing prerequisites; do not label them “Why this score?” when no score exists;
- keep draft recommendations, stale evidence and missing assessments unmistakably separate from qualified advice;
- display market-cap magnitude only with its proven currency/unit;
- preserve consistent owner-role and research-assignment facts across all regions.

The objective is the original complete product experience with better canonical consistency and business-specific research—not a reduced page containing only readiness diagnostics.

### 16.2 Complete feature-preservation matrix

Every row below must have an explicit implementation/test outcome. Unavailable facts keep their region and a truthful state; they are not silently removed to make the page look complete.

| Original feature | Required shared behavior | Sector/profile adaptation and safety |
|---|---|---|
| Back-to-Research link | Preserve navigation to coverage/list and useful navigation context. | Same behavior for every stock. |
| Stock identity panel | Name, symbol, exchange, asset class, classification, market-cap class and themes. | Canonical sector/industry/group/subgroup and research assignment remain separate; missing facts explicit. |
| Company logo and About panel | Compact logo/fallback and source-supported business description with source/date access. | Describe this company's actual operating model; never generate unsupported factual enrichment. |
| Position summary | CMP, quantity, average/canonical cost, weight, invested amount, current value, P&L and brokers/demat. | Shared accounting authority; explain gross/net or cost-method limits and incomplete broker attribution. |
| Edit plan | Retain the existing owner-controlled editing workflow. | No advisory write-through; editing remains an explicit owner action. |
| Target price | Show saved value, reference/horizon and saved date where available. | An owner target is not PortfolioAI fair value. |
| Stop-loss reference | Show saved value or Not set; retain notification/reference semantics. | No automated sell/execution implication. |
| Target weight | Show owner allocation target distinctly from any suggested range. | Exact current/target difference only from approved shared calculations. |
| Investment horizon | Show value with its explicit unit, not an unexplained number. | Never infer a horizon from sector or methodology. |
| Selected portfolio role | Preserve owner's Core/Satellite/Thematic/ETF/Other or unset state. | Not a research-profile label or system-overwritten role. |
| Suggestion status badge | Show recommendation freshness/qualification from the correct canonical output. | Separate evidence freshness, recommendation freshness and execution capability. |
| Role/recommendation preview | Preserve common structure in available and unavailable states. | Only approved deterministic outputs; never convert not-ready to HOLD or an invented role. |
| Action bias | Show canonical action/bias when qualified, otherwise an explicit unavailable/not-ready state. | Do not present Wait as a default investment opinion merely because evidence is missing. |
| Why this action? | Preserve an accessible explanation entry point. | Qualified output opens reasons, supporting/contradicting evidence and lineage; blocked output opens exact prerequisites with an accurate label. |
| Suggested weight range | Preserve the range region and applicability status. | Populated only from authorized qualified sizing outputs; no new sizing calculation in UI. |
| Current weight / Your target | Preserve side-by-side comparison. | Shared current portfolio view plus owner settings; consistent formatting. |
| Portfolio context | Preserve fit/concentration/context region. | Qualified portfolio-aware results only; missing assessment remains explicit. |
| Why this range? | Preserve explanation of any qualified sizing range. | Show constraints, fit/risk inputs, calculation version and lineage; do not manufacture a rationale. |
| AI Interpretation | Preserve R4M region and control placement. | Optional downstream explanation of existing deterministic outputs; disabled when not authorized/ready. |
| Key Insights: role/action/range | Preserve compact summary entries and links to their detailed regions. | Use the same canonical values, not a separate computation or repeated generic narrative. |
| Primary caution | Preserve the caution field. | Distinguish No reviewed caution identified from No caution assessment available; absence of evidence is not evidence of safety. |
| Tracking status | Preserve evaluation/confirmation progress where a reviewed tracking contract exists. | Counts, anti-churn and confirmation rules come from the approved engine; never copy screenshot numbers or rules. |
| Evidence confidence | Preserve a confidence/coverage entry with clear definition and date. | Do not rename evidence coverage as confidence or invent percentages; explain their distinct denominators. |
| Tracking history | Preserve read-only history access. | Selected security/portfolio only, qualified evaluations and timestamps; ordinary viewing must not append tracking events. |
| Read-only advisory notice | Preserve concise owner-control explanation. | No implied trading, role changes or account action. |
| Target/stop-loss notification note | Preserve the applicable existing notification feature and its honest state. | Do not promise notifications when capability is absent or inactive; no scheduler activation from page rendering. |
| Plan complete refresh | Preserve zero-call planning entry point and exact proposed operations. | Uses effective profile capability contract, budget, eligibility and execution grants. |
| Valuation refresh card | Preserve module slot and shared control grammar. | Approved sector-specific valuation source/requirements; no generic P/E request forced on all profiles. |
| Market-history refresh card | Preserve incremental history planning and evidence state. | Actual approved source/window, session and adjustment validation; no call on navigation. |
| Benchmark-relative card | Preserve benchmark planning/context slot. | Exact approved benchmark mapping; no substitution with NIFTY Bank outside applicable contracts. |
| Missing-field discovery card | Preserve a capability module for bounded discovery when supported. | HDFCBANK reference-stock entitlement is not expanded to other stocks; display explicit unsupported state elsewhere. |
| Seven research tabs | Preserve original labels/order and all existing content. | Effective profile changes content within tabs, not navigation grammar. |
| Research at a glance context cards | Preserve Business/research context, Your portfolio role, and Classification. | Context may show profile/subprofile, exposure/weight, cap class/themes and canonical hierarchy. Canonical evidence summary remains prominent in the cockpit/readiness region. |
| Overall stock score | Preserve dedicated overall score/state card. | Only qualified canonical overall assessment; independent missing dimensions remain explicit. |
| Verified evidence and score-ready coverage | Preserve separate measures and date/denominator access. | Validated evidence is not automatically score-ready; no guessed percentages. |
| Section score summaries | Preserve compact overview cards for the approved standard dimensions. | Profile labels/applicability may differ; raw provider values do not become scores. |
| Read-only scoring preview notice | Preserve explanation of preview versus qualified persisted results. | Gating language comes from current approved policy, not historical screenshot draft text. |
| Heatmap and legend | Preserve common card grid, semantic colors and accessible state labels. | Only approved applicable dimensions; missing/nonapplicable states do not become neutral or zero. |
| Why this score? | Preserve drill-down for scored cells. | Link score inputs, formula/version, exclusions and evidence; no score means correctly labelled evidence/prerequisite access. |
| External ratings | Preserve agency summary, agency/instrument counts and expandable details. | Rating/outlook/date and instrument-level identity remain separate from company scores; explicit availability/applicability for every profile. |
| Quality / Growth snapshots | Preserve relevant grouped metric cards. | All metrics and labels selected by approved effective profile, not stock symbol. |
| Valuation snapshot | Preserve source-bound applicable ratios/context. | Sector-appropriate approved methods; conflicts/staleness visible. |
| Ownership snapshot | Preserve dated ownership and pledge facts. | Consistent period/basis; overlapping ownership groups must be explained, not summed as independent portions. |
| Research Health footer | Preserve coverage state, retained observation count, conflicts/review/provisional counts and View Evidence. | Define count scope/time; raw observation count is not validated readiness. |
| Complete documents/evidence access | Preserve detailed artifacts, requirements and provenance. | Move depth into tabs/disclosures without deleting valid prior research. |

### 16.3 Context strip clarification

For the owner-supplied baseline, retain the three original context roles:

1. **Business / research context:** canonical industry and approved profile/subprofile, with clear assignment state.
2. **Your portfolio role:** owner's role, current weight and preserved manual-control semantics.
3. **Classification:** canonical sector/industry/group/subgroup summary, market-cap class and themes as available.

This clarifies section 4, region 10, which previously described an evidence-summary third card. Evidence readiness is still prominent and mandatory, but belongs in the dedicated cockpit evidence/score-readiness cards and the readiness summary rather than displacing Classification.

Where information would duplicate the header, use concise context summaries and accessible detail. No canonical fact is removed.

### 16.4 Same visual design, different research results

The same shell must accommodate these distinct outputs:

| Shared research surface | Banking illustration | Pharma illustration | Holding-company illustration |
|---|---|---|---|
| Business context | Approved bank/lending model | Reviewed Pharma primary subprofile plus role-scoped exposures | Approved holding-company model and subsidiary/structural context |
| Quality/growth research | Relevant lending/franchise profitability and growth | Relevant product/business-model profitability, growth and durability | Look-through economics, subsidiary earnings and capital allocation |
| Strength/risk research | Credit quality, capital/funding and applicable risks | Cash/leverage, regulatory/site and applicable business risks | Holdco liquidity/leverage, complexity and reviewed subsidiary risks |
| Valuation research | Approved bank/lender valuation basis | Approved Pharma valuation basis | Approved NAV/SOTP/look-through valuation basis |
| Market context | Exact approved benchmark/history | Exact approved profile/subprofile benchmark/history | Exact approved benchmark/peer context |
| Explanations | Same score/action/range detail grammar | Same detail grammar, different validated inputs | Same detail grammar, different validated inputs |

These are illustrative content directions, not new formula/metric approvals. The approved effective contract controls exact requirements, source authority, history, applicability, overlays and outputs.

The sector-specific deep workspace follows the shared Overview and Research Health. It can contain model/operating-driver detail, applicable methodology, source-linked supporting and contradicting evidence, unresolved questions and collapsible evidence operations. It must not push the common cockpit below a long operational checklist.

### 16.5 Result publication contract

A business-oriented section is useful only if its contents have honest semantics. Each displayed research result must identify:

- effective profile/subprofile and approved methodology version;
- security/portfolio scope and relevant evaluation date;
- applicable requirement/dimension and readiness state;
- source facts with unit/currency/scale/period/scope;
- deterministic assessment/run and explanation where available;
- supporting and contradictory evidence;
- material blockers or exclusions;
- freshness and reproducible lineage.

An unimplemented engine may show validated facts and research questions but cannot supply an assessment as if calculated. An implemented engine without qualifying evidence remains blocked. A qualified assessment without qualified portfolio-context/sizing/action output does not imply an actionable recommendation.

### 16.6 Revised implementation priorities

1. Preserve every feature in section 16.2 and map it to existing reusable components and canonical paths before editing.
2. Restore the original compact visual grammar; remove unnecessary blank space and giant pre-overview evidence tables.
3. Repair identity/owner-role/state contradictions and unsafe metric formatting.
4. Extend the shared UI contracts for all current approved profiles/subprofiles; remove irrelevant metric leakage.
5. Connect qualified sector-specific results into the existing cockpit, heatmap, snapshot, explanation and deep-research regions as their authorized V1 gates complete.
6. Verify populated, blocked, sparse, stale, conflicting, unknown-profile and unavailable-engine states in the same shell.

Preservation does not mean showing every banking metric for every stock. It means retaining every product capability and shared region while selecting the economically applicable research content.

### 16.7 Additional acceptance requirements

- Feature coverage matrix: every row in section 16.2 has a retained component/path, authorized availability condition and verification case.
- Side-by-side desktop/mobile comparison against the supplied original design for shared layout and interaction grammar; screenshots are not required to match obsolete values or unsafe legacy labels.
- Action/range/score links expose qualified canonical explanations and show truthful unavailable states.
- Tracking and notification surfaces preserve approved behavior without enabling new writes, provider calls or schedulers.
- Rating summaries expand to the correct security/instrument evidence; raw rating labels never alter scores.
- No disappearance of owner plan, suggestion, Key Insights, cockpit, heatmap, ratings, snapshots or Research Health when a profile is blocked.
- Bank-only content does not leak into Pharma, holding companies or other profiles.
- All retained profile methodology remains accessible; collapsing detail is not deleting it.
- No new financial formulas, scoring thresholds, confirmation counts or provider permissions are inferred from the screenshots.

## 17. Shared-shell restoration implementation — 6 October 2026

The owner authorized restoring the original HDFCBANK visual baseline on Development,
with one basic shell for all stocks and stock/sector/industry/sub-sector research
blocks. This is presentation integration under D1–D3, not authorization to open
V1-5 or downstream execution gates.

### 17.1 Implementation of the two design parts

**Basic shell:** identity/About/position; owner plan alongside read-only advisory;
interpretation slot and Key Insights; compact refresh with expandable capabilities;
seven tabs; Business/research context, owner role and Classification; cockpit,
section summaries, heatmap, external ratings; compact readiness; metric snapshots;
Research Health; complete Documents/Evidence access. Loading, blocked and sparse
pages retain this structure. An unavailable score never removes the cockpit or
turns into an investment opinion.

**Stock-specific extension:** the selected canonical snapshot's approved
profile/subprofile and applicable immutable requirement items select the research
blocks, source-bound normalized results, states, dates and lineage. They are scoped
to the current portfolio/security. Canonical sector/industry labels are descriptive
facts and do not infer a profile, subprofile or scoring method. Existing Pharma
business-model/evidence workspace remains accessible after the common research
health. Other approved profiles retain their selected-contract research blocks even
when a richer snapshot presentation or scoring adapter is unavailable.

No symbol-specific page, stylesheet, component tree or formula is introduced.
Unknown presentation contracts expose unsupported states; they do not inherit bank
metrics or a generic scoring engine. The existing reference-stock refresh eligibility
remains the authority for operational controls.

### 17.2 Concrete component and authority map

| Region | Component / shared path | Availability and preservation |
|---|---|---|
| Identity, position, classification | `ResearchPage` → `usePortfolioView`, `useSecurityResearch`, `useSecurityScoring` | Existing accounting and canonical route; no page-local accounting |
| About/logo | `CompanyAboutPanel` → existing company-profile repository | Cached narrative retained; failed logo uses an initial |
| Owner plan/edit | `PositionDecisionControls` → existing position settings repository | Existing explicit owner writes only; decimal formatting and unset-role distinction preserved |
| Suggestion, reasons, Key Insights | Shared Research header → R10 action-center view and canonical scoring snapshot | Read-only current state; unavailable role/range slots and prerequisite explanations; no fallback HOLD/Wait |
| Interpretation | Shared disabled interpretation region | Capability/result wiring remains downstream authorized work; rendering issues no AI request |
| Tracking history | `ResearchTrackingHistory` → existing `loadRecommendationHistory` | Explicit history disclosure performs SELECT only; historical records are not current advice |
| Refresh | `CompleteResearchRefreshPanel` → existing typed profile/reference eligibility | Capabilities collapsed by default; existing explicit planning/execution safeguards retained |
| Cockpit/heatmap | `ResearchScorecardPanel` → canonical scoring snapshot / R6 presentation | Complete current qualified run required for numbers; blocked/sparse regions retained |
| Ratings | `useExternalRatings` → `loadCachedExternalRatings` in scoring repository | Existing rating authority browsed independently of score readiness; provider opinion/status/dates visible |
| Readiness | `CanonicalEvidenceReadinessPanel` → `useCanonicalEvidenceReadiness` | Compact stored-state/top-blocker summary; complete immutable matrix and provenance collapsed in Overview and expanded in Evidence |
| Metric snapshots | Existing profile UI registry and research repository | Bank and Pharma configurations retained; source status distinguished from canonical validation; ambiguous unit/currency hidden from overview amounts |
| Other profile results | `ProfileResearchBlocks` → selected canonical evidence details | First six applicable requirements, source-bound retained result disclosures, complete Evidence link; no readiness recomputation |
| Deep Pharma research | Existing `PharmaResearchWorkspacePanel` | Existing model/exposure/review tools and methodology retained |
| Research Health, documents, source ledger | Existing shared Research components / research repository | Original observations and audit detail retained; source counts are not validated coverage |

### 17.3 Honest unavailable combinations

- A selected profile with blocked evidence retains the common cockpit/heatmap,
  provider ratings and source snapshots. No stale numeric assessment is promoted.
- Validated evidence without a qualified score run shows retained results and
  prerequisites, not an invented assessment or action.
- Missing presentation metadata for an approved profile uses the selected canonical
  requirement blocks; bank placeholders do not fill the gap.
- Legacy source availability is labelled as retained source availability; it does
  not carry a canonical VERIFIED badge into the overview.
- Ambiguous `Cr` / `Cr.` amounts without proven currency are marked unproven.
  Original values remain in Evidence. A bare owner horizon is not assigned months
  or years by the UI.

This implementation does not introduce source acquisition, normalization, evidence
review writes, new formulas, provider permissions, migrations, Auth/RLS changes,
schedulers, or recommendation-preview tracking writes. Scoring/advisory/AI completion
and release acceptance retain their separate gate contracts.


## 18. Two-part design implementation and acceptance clarification — 6 October 2026

This amendment makes section 3 the explicit two-part product design contract. It clarifies presentation and preservation of research already built; it does not claim that every research engine, richer specialist view or downstream action workflow is implemented.

### 18.1 Implementation sequence

1. Maintain one shared stock-page shell and shared responsive styles for every stock. Preserve the old page's visual baseline and Development's evidence safeguards.
2. Resolve canonical classification and the approved effective profile/subprofile through existing shared authorities. Show unresolved assignments explicitly.
3. Select reusable group-specific presentation modules from that effective contract. Specialize content and applicability within common regions and tabs; do not create a separate page for each symbol.
4. Bind the current security's existing research observations, normalized results, evidence requirements, reviews, documents and lineage into the applicable modules. Keep source availability, validated evidence, qualified assessment and actionable advice visibly distinct.
5. Present compact research highlights in Overview and retain complete group-specific research in the relevant tabs, specialist disclosures and Evidence. Summary limits must not discard underlying research.
6. Verify the common shell and the correct group-specific content across banks, Pharma, holding companies and other approved profiles, including unresolved, sparse and blocked states. New methodology or engine work retains its existing authorization boundary.

### 18.2 Required acceptance evidence

| Requirement | Acceptance evidence |
|---|---|
| Part 1: common shell for ALL stocks | Same shared route, regions, navigation, interaction grammar and responsive behavior across supported, unresolved and blocked profiles. |
| Part 2: appropriate group-specific design | Canonical classification and approved profile/subprofile are visible; applicable metrics, requirements and specialist blocks differ according to the effective contract. |
| Research built for the group is preserved | Trace each existing applicable research dataset/result to an Overview summary, relevant tab, specialist disclosure or Evidence detail; identify any missing presentation mapping rather than silently dropping it. |
| Stock-specific values remain correct | Two stocks sharing a profile reuse presentation but each shows its own security-scoped facts, sources, periods and results. |
| Evidence safeguards remain intact | Raw/retained observations, reviewed or validated evidence, qualified scores and advisory states remain distinct; unavailable results are not fabricated. |
| Summary and full detail agree | Overview highlights link to the same security's complete research, requirement state, source bindings and lineage. |

Section 17 records the existing bounded implementation. This section defines how to review and extend its coverage; richer group modules and research-result integrations remain pending wherever their data contract, authorized engine or presentation mapping is unavailable. Hosted verification and merge status are tracked separately from this design specification.


### 18.3 Initial sample rollout

The initial hosted sample enables the redesigned composition only for HDFCBANK (security `b47b007d-1990-4504-a5a2-4391c07687c5`, or its ticker route). Other stocks retain the pre-redesign page composition through a temporary rollout fallback. Sample styles are scoped to the sample container. This routing condition controls presentation only; it does not assign a research profile, alter evidence or introduce a stock-specific formula. The reusable shell remains the intended design for all stocks after sample review. Shared evidence safeguards remain in force.
