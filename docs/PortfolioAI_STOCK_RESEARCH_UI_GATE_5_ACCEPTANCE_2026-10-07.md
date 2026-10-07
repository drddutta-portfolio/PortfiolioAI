# Stock research UI Gate 5 acceptance review

Date: 7 October 2026 (UTC). Scope: the common shell for all stocks plus canonical
stock/sector/industry/sub-sector/subprofile-specific research presentation.

**Decision: HOLD / NOT FINAL.** Automated regression coverage passes, but the
actual authenticated hosted stock pages have not been visually inspected. Gate 5
cannot be closed or used to certify final acceptance for every stock yet.

| Sub-gate | Result | Evidence / remaining work |
| --- | --- | --- |
| G5.1 representative profile/state regression | PASS | 182 tests across 11 focused files, including 37 integrated ResearchPage cases. Fixtures isolate cached repositories and are not claims about live research readiness. |
| G5.2 authenticated hosted visual review | BLOCKED | The hosted-only Chromium verifier redirected from Development to Vercel authentication. App credentials cannot unlock deployment protection. A fresh user-supplied Development share URL is needed to continue autonomous browser inspection. |
| G5.3 recorded final decision and rollout proof | HOLD | This report records the decision and Gate 4 deployment proof. Final acceptance requires G5.2 findings, fixes if necessary, exact deployed revision and visual re-verification. |

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

`scripts/research-ui/verify-hosted-stock-pages.cjs` uses Playwright and an installed
Chromium executable against the fixed Development origin. It never starts a local
app. Playwright is a browser-runner prerequisite, not a new application dependency.
Pass one JSON line through stdin with `shareUrl`, app `email`/`password`, optional
`outputDir` under `/tmp`, and optional real `additionalStocks` IDs/symbols. Do not
put access URLs or credentials into git, command arguments or saved reports.

The verifier saves private screenshots and a sanitized report under `/tmp`; it
persists no cookies, auth state or network traces. Provider-function calls are
blocked during inspection. Its access-blocked path has been exercised; the full
authenticated path remains unverified until access is supplied. Even its eventual
automated success explicitly requires agent inspection of the screenshots.

Remaining hosted checks: HDFCBANK, TORNTPHARM and an actual unresolved/unregistered
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
warning remains. No product implementation changed in this Gate 5 increment;
the new work adds integrated regressions, the hosted verification runner and an
honest acceptance record. Full authenticated browser-runner behavior is pending.
