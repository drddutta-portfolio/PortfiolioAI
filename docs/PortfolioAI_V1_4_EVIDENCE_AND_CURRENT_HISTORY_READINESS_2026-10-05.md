# PortfolioAI V1-4 — Evidence and Current-History Readiness

Date: 5 October 2026. Branch: `PortfolioAI-Development`. Repository: `drddutta-portfolio/PortfiolioAI`.

## Disposition and authorization

**V1-4: AUTHORIZED / IN PROGRESS / NOT PROVEN. V1-5: NOT STARTED / NOT AUTHORIZED.**

Owner authorized V1-4 in this conversation. V1-1, V1-2 and V1-3 stay closed. This pass completes bounded application evidence inspection and one normalization safety repair; it does not establish valid live evidence for the release endpoint. Starting authoritative remote HEAD: `a901a59de0c1506b51cc8650f753c0f9af8c6b4e`. All 740 checked application/config blobs matched that remote tree before coding; the stale local `work` checkout was not authoritative. Published application commit and Preview proof are recorded below after verification.

The frozen scope, 111-member private manifest and thresholds are unchanged. Approved JSON SHA-256: `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`. Exact count/value still reconcile: 111 members, 132,585,696 paise. V1 release requires at least 100 of those same members **and** 119,327,127 paise of their frozen value reaching the complete deterministic endpoint. Evidence readiness alone is not that endpoint. No failed member is excluded from a denominator or converted to HOLD. All 239 equities and all 248 holdings remain visible; ETFs remain outside equity methodologies. Successful isolated restore remains mandatory at V1-9.

## Canonical authority and Development isolation

Read-only inspection used only PortfolioAI Dev `lrgpjimipfkyoqbpsqzz`, API `https://lrgpjimipfkyoqbpsqzz.supabase.co`. Production `uxiyufbsbgzzdujzcdxe` was not queried for portfolio data or mutated.

The authority is `current_research_evidence_snapshot_lineage_v1`, not a fresh readiness query used to replace the cohort. The application selects the current canonical snapshot scoped to both portfolio and security, then reads append-only `research_evidence_snapshot_items` by that immutable snapshot ID. Dashboard/Intelligence/Research keep the same selection and route lineage. No component directly queries storage or independently selects an alternative source.

Live catalog checks confirm both current snapshot views use `security_invoker=true`. Snapshot and item tables have RLS enabled. Authenticated SELECT policies require ownership via `portfolios.user_id = auth.uid()`; the item policy joins its snapshot and portfolio. The new path uses the existing user Supabase client and SELECT only, with no service-role client, RPC, provider function invocation or write.

## Live retained evidence census

Measured against the selected snapshots, all dated **2026-09-29**; inspection date is 2026-10-05. These are dated stored assessments, not a claim of newly recomputed current freshness.

- Full population: 239 equities across 45 approved parent profiles; **0 READY, 109 REVIEW_REQUIRED, 2 STALE, 128 INSUFFICIENT**.
- Frozen cohort: 111 members across 39 parent profiles; **0 READY, 109 REVIEW_REQUIRED, 2 STALE**. Their unchanged frozen value is 132,585,696 paise.
- Frozen overlapping item blockers: **103** members with at least one mandatory MISSING item; **109** with REVIEW_REQUIRED items; **2** with STALE items; **32** with missing approved benchmark history; **1** with insufficient listing history. These categories overlap and must not be added into a member count.
- Whole equity population has 3,744 mandatory applicable requirement items: 1,320 stored FRESH, 2,158 MISSING, 246 REVIEW_REQUIRED, 18 INSUFFICIENT and 2 STALE.
- A null individual selected-evidence ID is not automatically a defect: deterministic history aggregates and immutable lineage items legitimately use aggregate provenance. The selection state and normalized payload remain visible.
- Live source rows and selected snapshots were not updated. No released usable-intelligence progress is claimed from the UI repair.

### Per-profile report

All held-profile READY counts are zero. Frozen missing/benchmark/short-history columns count members with that item condition, not the number of requirement items. Profiles absent from the frozen cohort remain in the full-population report.

| Approved profile | Held equities | Insufficient | Review | Stale | Frozen cohort | Frozen missing mandatory | Frozen benchmark missing | Frozen short history |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| AGRI_PROCESSING | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| AGRO_FERTILISER | 6 | 3 | 3 | 0 | 3 | 3 | 0 | 0 |
| AUTO_COMPONENTS | 7 | 3 | 4 | 0 | 4 | 2 | 0 | 0 |
| AUTO_OEM | 5 | 2 | 3 | 0 | 3 | 3 | 0 | 0 |
| BANK | 15 | 2 | 12 | 1 | 13 | 13 | 0 | 0 |
| BRANDED_CONSUMER_FMCG | 12 | 7 | 5 | 0 | 5 | 5 | 0 | 0 |
| BUSINESS_SERVICES | 2 | 1 | 1 | 0 | 1 | 1 | 1 | 0 |
| CAPITAL_EQUIPMENT_ELECTRICAL | 20 | 10 | 10 | 0 | 10 | 10 | 0 | 0 |
| CAPITAL_MARKETS_AMC | 7 | 3 | 4 | 0 | 4 | 3 | 0 | 1 |
| CEMENT_BUILDING_MATERIALS | 2 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| COMMODITY_PROCESS_CHEMICALS | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 |
| CONSUMER_DURABLES | 6 | 4 | 2 | 0 | 2 | 2 | 2 | 0 |
| DEFENCE_AEROSPACE | 7 | 3 | 4 | 0 | 4 | 2 | 0 | 0 |
| DIVERSIFIED_CHEMICALS_PETROCHEM | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| ENVIRONMENTAL_SERVICES | 5 | 3 | 1 | 1 | 2 | 2 | 0 | 0 |
| FINANCIAL_HOLDING_COMPANY | 2 | 0 | 2 | 0 | 2 | 2 | 0 | 0 |
| FINTECH_PLATFORM | 3 | 2 | 1 | 0 | 1 | 1 | 0 | 0 |
| GENERATION_INTEGRATED_UTILITY | 3 | 2 | 1 | 0 | 1 | 1 | 0 | 0 |
| HOSPITAL | 5 | 3 | 2 | 0 | 2 | 2 | 0 | 0 |
| HOSPITALITY_LEISURE | 6 | 3 | 3 | 0 | 3 | 3 | 3 | 0 |
| INDUSTRIAL_PRODUCTS | 8 | 6 | 2 | 0 | 2 | 2 | 2 | 0 |
| INSURANCE | 2 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| INTEGRATED_REFINING_PETCHEM | 2 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| IT_BPM_SERVICES | 4 | 2 | 2 | 0 | 2 | 2 | 0 | 0 |
| IT_DIGITAL_INFRA_HARDWARE | 2 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| IT_SERVICES | 10 | 4 | 6 | 0 | 6 | 5 | 0 | 0 |
| IT_SOFTWARE_PRODUCTS_PLATFORMS | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 |
| JEWELLERY | 8 | 5 | 3 | 0 | 3 | 3 | 3 | 0 |
| LOGISTICS | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 0 |
| MIDSTREAM_CITY_GAS | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| NBFC_LENDING | 9 | 6 | 3 | 0 | 3 | 3 | 3 | 0 |
| NON_FERROUS_DIVERSIFIED_METALS | 8 | 4 | 4 | 0 | 4 | 4 | 0 | 0 |
| OIL_OPERATIONS | 2 | 1 | 1 | 0 | 1 | 1 | 1 | 0 |
| PHARMA | 26 | 13 | 13 | 0 | 13 | 12 | 12 | 0 |
| PROJECT_EPC | 5 | 3 | 2 | 0 | 2 | 1 | 0 | 0 |
| REAL_ESTATE_DEVELOPER | 2 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| REGULATED_NETWORK | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| RENEWABLE_IPP | 2 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| RETAIL_COMMERCE | 5 | 3 | 2 | 0 | 2 | 2 | 2 | 0 |
| SHIPPING | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| SOLID_FUELS_MINING | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 0 |
| STEEL_FERROUS | 2 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| TELECOM_INFRA | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 0 |
| TELECOM_OPERATOR | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| TEXTILES_APPAREL | 6 | 5 | 1 | 0 | 1 | 1 | 0 | 0 |

## Implemented bounded repairs

1. Research Overview and Evidence tabs now display canonical requirement readiness independently of scoring/adapter availability, including when a generic adapter is pending. The previous score-derived readiness panel was gated behind engine availability and could hide the actual requirement contract.
2. The panel retains required/applicability, minimum history, approved benchmark context, stored evidence state, blocking reason and recommended remediation, provider/as-of/retrieval/fresh-through dates, selection/validation state, retained normalized data and provenance references. Empty/missing snapshots and read errors remain explicit. Snapshot state is never promoted from a legacy score or a count of visible metrics.
3. The hook scopes reads by portfolio/security/asset class, clears data immediately on scope changes and ignores an old request's delayed response. ETFs do not load equity requirement items.
4. The structured-parameter normalizer no longer counts matching labels or different growth horizons as historical reporting periods. Multi-period requirements without explicit dated period evidence remain `EVIDENCE_PRESENT_REVIEW_REQUIRED / DATED_REPORTING_PERIODS_NOT_PROVEN`, with `deterministicScoreReady:false`. Raw matched observations are retained. The normalizer version is `P7_IC_EVIDENCE_NORMALIZATION_V2_PERIOD_GUARD`.

The normalizer repair is committed and tested repository code. **No Edge Function deployment or materializer execution occurred**, so existing deployed functions, source records and current snapshots retain their previous versions. Historical source payloads were not edited, and this guard must be included in an approved deployment/materialization plan before any claim about new live normalized readiness.

The canonical authority registry and both research/SSOT architecture documents describe these shared paths. No score engine, eligibility, Fit, Sizing, Exit or advisory-action implementation was added.

## Verification and practical limits

- Application focused regressions: **105 PASS across 12 files**; the final lifecycle/presentation test edit was also rerun with **15 PASS across 2 files**.
- Edge normalization/materializer contract regressions: **21 PASS across 3 files**. These are pure tests; no function or provider executes.
- Strict TypeScript/Vite production build: PASS. Existing large-chunk warning remains.
- Data-boundary architecture guard: PASS.
- Changed application-file and changed Edge-file ESLint: PASS.
- Full repository ESLint: **77 errors / 4 warnings in unchanged files**, matching the prior baseline; not silently called a PASS.
- RLS/view configuration: inspected read-only as described above; no policy/grant changes.

Tests prove that canonical requirements and retained period/unit/currency/scope/adjustment/benchmark-mismatch metadata are rendered faithfully; they do **not** prove that merely displaying those fields validates the live source data. Guard tests specifically reject growth-horizon label counts as historical periods, block a single TTM observation for an eight-period requirement, retain genuinely single-observation behavior, preserve missing observations and reject provider entity mismatches. Existing ingestion regression tests reject invalid units, invalid calendar periods and missing provenance, and distinguish idempotence/conflicts. Existing market-history planner tests establish incremental planning, not adjusted-history validity or benchmark alignment.

Authenticated hosted acceptance remains a V1-9 release requirement. Protected static asset delivery/Preview READY is recorded separately from interactive app acceptance. Vercel protection and PortfolioAI authentication are preserved.

## Exact remaining blockers and continuation within V1-4

| Missing proof/action | Why it blocks V1-4 closure | Required bounded continuation |
|---|---|---|
| Valid dated per-profile mandatory inputs for the 103 frozen members with missing evidence | The full endpoint cannot consume absent metrics or unproven periods | Reconcile each requirement with an executable approved field-to-storage contract; exact period, unit, currency, reporting scope, source selection and freshness must be proven. Never invent new metric codes or substitute incompatible observations. |
| Evidence review for 109 members | Keyword/document appearances are not deterministic financial or business-model evidence | Retain source provenance, obtain factual/document review and append approved normalized evidence only under explicit write authority. |
| Approved benchmark history for 32 members | Stock history cannot replace an approved benchmark | Prove exact benchmark mappings, sufficient distinct sessions, applicable exchange calendar and stock/benchmark date alignment. Do not choose a convenient substitute. |
| One frozen member with short listing history | 252-period requirement cannot be manufactured by refreshing | Preserve INSUFFICIENT with its reason; keep the member in the same 111 denominator. The frozen contract permits at most the count/value shortfall allowed by both release minima. |
| Two stale mandatory evidence items/members | Retained source evidence is not currently ready | Refresh only after an exact source/field plan and approved budget; preserve historical observations and lineage. |
| Corporate-action adjustment semantics and calendar alignment | Current stock/benchmark materializer treats stored row counts as readiness; this pass found no proof that count alone establishes distinct-date, adjusted and aligned usable history | Complete deterministic history validation in the existing canonical pipeline. Preserve P8/R2 assets; do not execute P8 or build a competing history authority. |
| Source-selection, units/currency/scope and freshness proof for normalized/raw cached inputs | Existing materialization paths omit these semantics in some projected payloads; stored VALIDATED is not sufficient proof for the full V1-4 contract | Validate against approved requirement/metric definitions and actual stored observations. The period-label guard closes one demonstrated defect, not all normalization gaps. |
| Deploy repaired normalization and append/select new validated snapshots | Repository code and UI do not alter live evidence | A concrete Development-only deployment/materialization plan must name impacted functions, source cutoffs, grant action, counts and append-only writes. No migration is proposed by this pass. |

Provider controls are preserved. Read-only inspection found TRENDLYNE_MCP ingestion enabled, scheduler disabled, daily internal attempt limit 1,000, per-run 40, concurrency 3, quota status VERIFIED; SCREENER_WEB scheduler disabled, internal daily 25/per-run 5/concurrency 1, actual quota status UNKNOWN. These are configured limits, **not** permission to consume those limits. The older IC2 920-call estimate covers only a four-call supported adapter ceiling and does not prove full V1-4 remediation feasibility; no campaign was run or authorized by this record. Acquisition delays and engineering gaps are reported separately.

V1-4 can continue with bounded contract/validator work under its gate authorization. Provider execution, any data mutation/materialization, migrations, scheduler activation, storage writes and restore require their specific approved action. V1-5 remains separately unauthorized. Scope Freeze B is not reopened and release criteria are not changed.

## Side effects

No main/Production changes; no database writes, migrations, Auth/RLS changes, provider calls/refreshes, scheduler changes/triggers, R2/storage writes, P8 execution/canary/backtest, backup or restore. GitHub publication changes only Development source/tests/docs with `[skip ci] [skip actions]`. Source-equivalent documentation commits do not require a new acceptance/build loop.


## Published application and Preview evidence

- Application/normalizer repository commit: `94a9b855cb0f4c83a24b0a0de21f18d4438790bd`.
- Vercel project: `portfiolio-ai / prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU`; team slug `dibyendu-dutta`.
- Exact deployment: `dpl_BtKDRTQ7pSeL8HZF7FKCwtpq7U6c` / https://portfiolio-g4qns2wsr-dibyendu-dutta.vercel.app.
- Vercel confirms branch `PortfolioAI-Development`, exact commit above, target null (Preview), READY. GitHub commit status Vercel = success.
- Owner-provided temporary protected share access established a Vercel-only cookie and delivered `/app` HTTP 200. Served Research asset `ResearchPage-DcW-bIwF.js` SHA-256 `bfd60ee04e6e417b739b99141c49d8dbfdc99dcb1e42d8c5bdae107079a9c4bc` contains the canonical requirements panel, read-only browsing copy and requirement selection metadata. No share capability token/cookie value is recorded here.
- This proves protected SPA/asset delivery, not a logged-in PortfolioAI interaction or live data rendering. Authenticated end-to-end acceptance remains mandatory at V1-9.
- The connector's explicit team-scoped listing returned 403 scope authorization, while listing/get-deployment **without the team override** succeeded using the connected account. No protection settings or account permissions were changed.
- GitHub comparison against the starting HEAD verifies exactly 13 source/test/architecture-document files changed and no private manifest change. No GitHub Actions runs were associated with the application commit. The final gate/status record and cached-period follow-up add Edge source/tests/documentation only; the frontend remains source-equivalent to this tested application Preview. Do not require another frontend acceptance cycle for Edge/docs-only differences.


### Cached historical evidence guard follow-up

Final source-path verification also found already-normalized cached AVAILABLE payloads could bypass the parser repair. The materializer now calls the same `guardedNumericEvidenceState` for retained matched-section payloads before accepting availability. For multi-period requirements it yields REVIEW_REQUIRED with `DATED_REPORTING_PERIODS_NOT_PROVEN / RECONCILE_DATED_REPORTING_PERIODS`; document review keeps its own reason. The raw source payload is never changed. Pure Edge regressions now total **21 PASS across 3 files**, and changed Edge-file ESLint passes. The materializer's Development-only target, one-time execution grant, bounded slices, append-only lineage, zero-provider-call contract and terminal states remain intact. No Edge Function deployment or materializer invocation occurred. This follow-up changes Edge source/tests and documentation only; the frontend source remains exactly the tested READY application at `94a9b855cb0f4c83a24b0a0de21f18d4438790bd`. Future documentation/Edge-only commits must not be mistaken for a new frontend implementation needing repeated browser acceptance.


Final follow-up checks: the pure shared normalizer passes strict standalone TypeScript compilation (`tsc --noEmit --ignoreConfig --strict --skipLibCheck --target ES2023 --module ESNext --moduleResolution bundler`). Deno is not installed in the managed verification workspace, so a complete Deno runtime typecheck/deployment of the materializer was not performed or claimed. Its changed source is covered by pure normalization and materializer contract tests and Edge ESLint; actual Development function deployment and execution remain separately bounded actions.


Materializer source preflight also found its existing `Admin` parameter type was undeclared. It is now explicitly `ReturnType<typeof createClient>`; this is a type-only compatibility repair with no runtime behavior change. The 21 pure Edge tests and changed materializer Edge ESLint pass after this correction. Complete Deno runtime typechecking remains unverified as described above.
