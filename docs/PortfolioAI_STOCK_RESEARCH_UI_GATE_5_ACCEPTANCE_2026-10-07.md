# Stock research UI Gate 5 acceptance review

Date: 7 October 2026 (UTC). Scope: the common shell for all stocks plus canonical
stock/sector/industry/sub-sector/subprofile-specific research presentation.

**Final decision, 8 October 2026 (Asia/Kolkata): PASS.** The two-part design
is accepted as the common baseline for all stock research pages within declared
profile capabilities. The tablet overflow fix is merged and deployed to Development.
This decision approves UI presentation, not research readiness or investment advice.

| Sub-gate | Result | Final evidence |
| --- | --- | --- |
| G5.1 representative profile/state regression | PASS | 182 tests across 11 focused files, including 37 integrated ResearchPage cases. |
| G5.2 authenticated hosted visual review | PASS | 146 checks across four real stocks, four native 200% browser-zoom checks and agent inspection of representative screenshots. |
| G5.3 recorded final decision and rollout proof | PASS | PR #113 passed CI and Preview, merged into Development; exact merged deployment verified READY before and after hosted review. |

## Final deployed acceptance evidence

- Reviewed PR: [#113](https://github.com/drddutta-portfolio/PortfiolioAI/pull/113).
- Validated head: `ad2359f6b9cff0b182c6c52b72f34c884dcfcb07`; architecture CI run `37682912089` succeeded, and Vercel Preview `dpl_WCmtJ1GtS4VxCwmgKwFyhRADKyLN` was READY.
- Development merge: `1a6d16e0a553ba08232bdc5f003e78b8f032c404`.
- Exact merged deployment: `dpl_8bzgi9ueeZQAp5NfBJiNMN427CYA`, READY.
- Alias: `portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app`; verified on the same revision before and after review.
- Final hosted run began `2026-10-08T02:16:12.775Z`: 146 passed, zero failed, zero runtime errors and zero blocked provider-execution attempts. No proposed CSS was injected.

| Actual stock | Canonical profile / retained presentation |
| --- | --- |
| HDFCBANK | BANK / RETAIL_BANK; own banking requirements and evidence lineage. |
| TORNTPHARM | PHARMA / DOMESTIC_FORMULATIONS; retained Pharma specialist presentation, primary-source gaps and adapter limits remain explicit. |
| ABCAPITAL | FINANCIAL_HOLDING_COMPANY; own requirements retained, unregistered specialist presentation disclosed. |
| ACMESOLAR | RENEWABLE_IPP; own requirements retained, unregistered specialist presentation disclosed. |

Hosted checks cover 390/768/1024/1440px layouts, compact complete names including
SRHHYPLTD and longer symbols, shared tabs, sticky section links, keyboard/focus,
evidence filters, documents, expanded refresh and an injected cached-read failure.
The failure/name scenarios are temporary inspection scenarios, not stored changes.
The agent inspected representative header, narrow-layout, stock-specific research,
evidence/document, error and zoom screenshots; no owner intervention was needed.

Native browser zoom used Chromium's default-storage-partition zoom preference
(`partition.default_zoom_level.x = log(2)/log(1.2)`) before launch, with app login
in a separate private memory context. On all four stocks, outer width 1440 became
inner width 720, devicePixelRatio was 2, CSS body zoom stayed 1 and document width
was 720. Chromium compositor screenshots (`Page.captureScreenshot` with
`fromSurface:false`) supplied complete native-zoom images. Score labels wrap fully
at this zoom; some long labels span several lines rather than all cards stacking.
No label or stock name is cropped and no document-level overflow was observed.
This native evidence is separate from the runner's CSS zoom stress test.
Temporary browser profiles were deleted; auth state and network traces were not saved.

Sanitized final evidence: [146 hosted checks](research-ui-g5-evidence/development-final-acceptance-checks.json)
and [four native zoom checks](research-ui-g5-evidence/native-200-percent-zoom-checks.json).
Private screenshots remain outside git. Machine reports still explicitly require
visual review; this acceptance record supplies the subsequent agent decision.

**Rollout decision:** use this two-part baseline for all stock research pages.
The shared shell owns layout and interaction; canonical profile capabilities own
stock-specific blocks and research data. Missing, stale, conflicting or unapproved
evidence stays explicit. Owner Core/Satellite selection remains separate from any
qualified recommendation. No methodology/evidence approval, provider execution,
schema/RLS change, Production promotion or V1 investment-engine gate is granted.

## Regression matrix

The integrated page tests exercise these canonical fixtures, without inventing
new methodology routes or treating display labels as research authority:

| Profile / state | Expected presentation verified |
| --- | --- |
| HDFCBANK / BANK / RETAIL_BANK | Shared shell, canonical hierarchy and selected evidence lineage; absent capabilities stay unavailable. |
| TORNTPHARM / PHARMA / DOMESTIC_FORMULATIONS | Shared shell with retained Pharma specialist presentation and reviewed assignment; adapter limits remain explicit. |
| FINANCIAL_HOLDING_COMPANY, RETAIL_COMMERCE, REGULATED_NETWORK | Common shell and applicable retained requirements; pending scoring adapters cannot imply current score readiness. |
| Unregistered and unresolved profile | Explicit capability/assignment limits, retained source results and provenance; no sector-derived methodology fallback. |
| STALE, MISSING, CONFLICTING, REVIEW_REQUIRED | Unqualified retained score suppressed; independent external opinion retained with its own source/status. |
| Score loading / read error | No stale current score or invented recommendation; owner plan stays separate. |
| Qualified zero | Valid canonical zero remains visible; no fabricated Core/Satellite recommendation or sizing. |
| ETF | Portfolio facts remain visible outside equity methodology applicability. |

The existing focused suite also covers bookmark restoration, all seven tabs,
keyboard/focus behavior, refresh confirmation/quota/errors, retained documents,
original values and competing observations, long names and independent readiness.
DOM assertions do not prove browser layout or visual correctness.

## Reviewed Development merge

[Gate 4 PR #111](https://github.com/drddutta-portfolio/PortfiolioAI/pull/111) was
reviewed with no blocking findings and merged after CI passed at exact head
`47b90ccaafa6f70fe55b90affeab042883cff53f`.

- Merge: `211767ad439d30f3a492885d40f2cc72279fe9f1`.
- Vercel deployment: `dpl_EgJnXQutWCSAbEBJ6Y8SCdtnCWog`, verified **READY** at that merge.
- Development alias: `portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app`.
- Subsequent Development commits include this merge; readiness metadata is deployment evidence, not stock-page visual evidence.

## Hosted verification procedure

The final authenticated procedure has now passed; the access-blocked and quota
records below are historical and superseded by the final evidence above.

`scripts/research-ui/verify-hosted-stock-pages.cjs` uses Playwright and an installed
Chromium executable against the fixed Development origin. It never starts a local
app. Playwright is a browser-runner prerequisite, not a new application dependency.
Pass one JSON line through stdin with `shareUrl`, app `email`/`password`, optional
`outputDir` under `/tmp`, and optional real `additionalStocks` IDs/symbols. Do not
put access URLs or credentials into git, command arguments or saved reports.

The verifier saves private screenshots and a sanitized report under `/tmp`; it
persists no cookies, auth state or network traces. Provider-function calls are
blocked during inspection. Its access-blocked and authenticated paths have been exercised. Automated success
explicitly requires agent inspection of the screenshots, completed for this review.

Completed final hosted checks: HDFCBANK, TORNTPHARM and an actual unresolved/unregistered
or sparse stock; 390/768/1024/1440px widths; section links and keyboard focus;
expanded refresh, documents and evidence; cached-read failure; long names without
cropping. Temporary DOM name stress and cached-read fault injection are labelled
inspection scenarios, not changes to stored facts. CSS zoom stress is not proof
of native browser zoom; verify native zoom separately where supported. Confirm
all independent reads have settled before judging screenshots.

No provider refresh, evidence promotion, owner setting change, schema/RLS change,
methodology approval or Production deployment forms part of this gate. A UI PASS
would certify presentation within declared capabilities, not that all research
methodologies or investment recommendations are approved.

## Build and tooling checks

TypeScript/production build, the canonical data-boundary guard, changed-test lint,
script syntax and whitespace checks pass. The existing 543.73 kB research bundle
warning remains. Gate 5 adds integrated regressions, the hosted verification runner, the shared
tablet score-label correction and this acceptance record. Authenticated hosted
behavior has passed at the deployed revision above.

## Historical hosted review update — 8 October 2026 (Asia/Kolkata)

A newly supplied share URL unlocked Vercel protection and the authorized app login
succeeded. The hosted-only run completed 72 checks across HDFCBANK and TORNTPHARM
with zero runtime errors and zero blocked provider-execution requests. The initial
run found two failures: both stock pages had 793px document width at a 768px viewport.
The visible score-coverage label "Unavailable" overflowed its constrained third
column. The common-shell correction stacks the score header below 800px and permits
long score labels to wrap. Final deployed re-verification remains necessary.

The verifier now waits for the asynchronous app login redirect and permits the
reviewed `refresh-market-data` **READ_CACHE** operation needed to render portfolio
facts. It continues to block REFRESH/provider execution. It captures viewport
images as well as full-page images and saves sanitized stop-screen diagnostics.
Access is no longer blocked; G5.2 is **IN REVIEW / FIX PENDING VERIFICATION**, and
the overall decision remains HOLD until the deployed correction and remaining
representative-stock/zoom checks are verified. No access URL, token or credentials
are retained in this record.

## Historical review outcome and deployment blocker — 8 October 2026 (Asia/Kolkata)

The supplied share link works; no further access link or manual visual inspection
is requested. The final actual-Development run completed **74 checks: 72 pass,
two fail**, both the 768px score-label overflow. Zero browser runtime errors and
zero blocked provider-execution requests were observed. Source-status filtering,
keyboard navigation, focus/sticky clearance, 390/1024/1440px layouts, full-name
wrapping, documents, expanded refresh and injected cached-read failure were exercised.

The additional real-stock run completed **74 checks with no failures** on
ABCAPITAL (`FINANCIAL_HOLDING_COMPANY`) and ACMESOLAR (`RENEWABLE_IPP`), using the
proposed tablet CSS injected temporarily into the hosted browser. Both retain
their own canonical requirements and provenance despite an unregistered specialist
snapshot presentation. This confirms the declared fallback without substituting
a banking model. It does **not** prove the fixed CSS is deployed.

Sanitized machine reports are retained in
[actual Development checks](research-ui-g5-evidence/development-hosted-checks.json)
and [representative checks with proposed CSS](research-ui-g5-evidence/representative-proposed-css-checks.json).
Private screenshots remain outside git. Viewport/section images were inspected;
CSS zoom stress remains explicitly distinct from native browser zoom. The observed
CSS-zoom card reflow is not used to certify native browser zoom.

At the end of review, Development alias metadata was READY at
`06449a4394183f0fd5e77e3004ded497098be722`, deployment
`dpl_J9bx3BeeygUGGvkPNbuBRZJ51dkG`. The live alias can advance during inspection;
this is end-of-review deployment metadata, not a frozen revision certification.

[PR #113](https://github.com/drddutta-portfolio/PortfiolioAI/pull/113) contains the
shared CSS correction and browser-runner fixes. Code CI passed at
`cd462fb807c3e97873bdcd4ccc44d74d8d07c084`; Vercel rejected that revision's build
with its 24-hour rate-limit message. The final report/selector follow-up must retain
its own exact-head CI status. Do not bypass checks, upgrade billing, promote to
Production or claim the Development alias contains this correction.

**Design decision:** the common-shell plus canonical stock-specific composition
aligns with the plan and preserves Development's safeguards. Final release
acceptance remains HOLD. Resume by checking final-head CI, deploying/merging through
the normal Development flow after the build quota permits it, then re-running
authenticated checks at the exact fixed deployment, including native-zoom/reflow
verification. No research-methodology/evidence or V1 investment gate is approved.
