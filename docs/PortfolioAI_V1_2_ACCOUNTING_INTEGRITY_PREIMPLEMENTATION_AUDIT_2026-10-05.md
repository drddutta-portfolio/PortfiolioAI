# PortfolioAI V1-2 Accounting Integrity — Execution and Verification

**Date:** 5 October 2026
**Branch:** PortfolioAI-Development
**Starting authoritative remote HEAD:** `0bb86cbf99e139a6b13f8460ddded641e55daf8d`
**Disposition:** **COMPLETE / PASS for V1-2 accounting verification**, with the hosted-interaction limitation below.
**Code repair:** NONE REQUIRED BY THE EXECUTED EVIDENCE.
**V1-3:** NOT STARTED / NOT AUTHORIZED; private frozen manifest remains a hard prerequisite.

## Authorization and architecture

The owner approved the sequencing amendment: portfolio-wide V1-2 may proceed before private 111-cohort reconciliation; the manifest must be fully recovered/reconciled/owner-reviewed before V1-3 starts. Approved release thresholds and all evidence/accounting invariants are unchanged. AGENTS.md and canonical authority documents were reviewed from the remote branch.

Canonical flow is transactions → loadPortfolioLedgerSnapshot → calculateAccounting → calculatePortfolio → usePortfolioView → Dashboard / Holdings / Portfolio Structure. Snapshot evidence remains reconciliation provenance, not a cost/price authority. No new financial authority, schema, security/RLS policy or financial method was introduced.

## Exact source and Development target

Used remote HEAD above, never the stale work checkout. The temporary execution copy was verified against **734 GitHub blobs** covering every existing src file, package/lockfile, available TypeScript/build/lint configuration and architecture guard; **zero mismatches**. Temporary verification-only files were added separately, not represented as remote source. Unrelated operational scripts were not executed.

Supabase project PortfolioAI Dev / `lrgpjimipfkyoqbpsqzz` was freshly verified ACTIVE_HEALTHY, distinct from Production. SQL was read-only and owner-portfolio-scoped. Numeric transaction/price inputs were extracted as strings; imported normalized quantity/price provenance was preserved consistently with the repository mapper. Identities were replaced with ephemeral references before temporary execution files were written. No private holdings, broker labels, account IDs, email or row-level values are published here.

## Executed checks

| Check | Result |
| --- | --- |
| Existing accounting, portfolio, repository, instrument mapping and position-settings suites | 6 files / **42 tests PASS** |
| Existing market-data cache/freshness and Dashboard allocation suites | 2 files / **3 tests PASS** |
| Temporary read-only Development reconciliation | 1 file / **4 tests PASS** |
| Temporary actual-page cross-surface rendering | 1 file / **3 tests PASS** |
| TypeScript + Vite build | PASS |
| Architecture data-boundary guard | PASS |
| Targeted accounting/portfolio/repository/hook ESLint | PASS |

Total: **52 executed passing tests across 10 files**. No application code was changed. Full repository lint was not rerun; its historical 84 errors / 4 warnings remain explicitly unresolved. Build reports a non-fatal large-chunk warning.

Existing regression commands:
```text
npm test -- src/features/accounting/fifoAccounting.test.ts src/features/portfolio/calculatePortfolio.test.ts src/data/portfolioRepository.test.ts src/data/transactionRepository.test.ts src/features/portfolio/instrumentMapping.test.ts src/features/portfolio/positionSettings.test.ts
npm test -- src/data/marketDataRepository.test.ts src/components/DashboardAllocationPerformance.test.tsx
npm run build
npm run check:architecture
```

Targeted lint covered fifoAccounting and calculatePortfolio implementations/tests, portfolioRepository and transactionRepository implementations/tests, and usePortfolioView.

## Hand-verifiable accounting acceptance

Executed existing expectations include:
- FIFO buys 10 at 10 and 10 at 20, sell 15 at 30: remaining quantity 5, cost 100, realised cost 200, proceeds 450, realised P&L 250.
- Full close: buy 2 at 10, sell 2 at 14: zero remaining quantity/cost, historical acquisition average 10, realised P&L 8.
- Close/reopen: prior buy 5 at 100 and sell 5 at 120; new buy 3 at 200: current cost 600, current average 200, prior realised P&L 100.
- Missing-date pooled buys 20 at 300 and 20 at 349.42, sell 5 at 409.51: average-cost basis 324.71, remaining quantity 35/cost 11,364.85, realised P&L 424.
- Exact fractional buy 0.3 at 0.2 with charges 0.03; sell 0.1 at 0.5 with charges 0.01: remaining cost 0.06, realised P&L 0.01.
- Supersession/correction and reverse/restore exclude ineffective originals and recalculate from effective rows.
- Chronological/aggregate oversells and missing essential evidence remain unresolved.
- Ambiguous chronology remains explicitly average-cost, never invented FIFO.
- Incomplete charges yield explicit gross-only results without mixing partial charges.
- Known and unknown broker attribution remain distinct; imported snapshot formulas do not feed accounting.

Historical fixture labels referring to Production are synthetic tests; no Production database was accessed.

## Full Development population reconciliation

Read-only snapshot contains **496 transaction rows**, of which **490 ACTIVE**, across **273 histories = 248 open + 25 closed**. It includes 5 superseded originals, 5 active corrections and 477 imported rows, all 477 linked to source evidence. The remaining non-active row does not enter the effective ledger.

Current measured history coverage:
- 71 multi-broker histories;
- 58 histories containing missing broker attribution;
- 211 histories containing missing dates;
- all 273 histories containing incomplete charge/tax evidence.

Executed the existing canonical engine on all effective rows, without imported holdings-snapshot inputs:
- all **248 returned current_holdings quantities** exactly match canonical open quantities, and quantity-completeness flags pass;
- 273 history outputs retain 248 open and 25 closed; zero unresolved accounting histories;
- all 248 open positions are priced;
- 239 equity holdings and 9 ETFs remain distinct;
- each open position value equals quantity × cached price;
- each open position unrealised P&L equals value − supported remaining cost;
- every open position weight agrees with value / priced portfolio value × 100 within 0.000000000000001 percentage points;
- weight sum is 100 within 0.000000000001 percentage points.

Screenshot-reconciled totals, rounded for display to two decimal places:
| Measure | Canonical engine |
| --- | ---: |
| Current portfolio value | INR 2,217,451.55 |
| Supported remaining cost | INR 1,915,293.31 |
| Unrealised P&L | INR 302,158.24 |
| Supported realised P&L | INR 6,948.89 |

The temporary tests also rendered the actual Dashboard, Holdings and Portfolio Structure components against the same canonical model, with data hooks supplied deterministically and mutation/provider paths mocked. Dashboard totals, Holdings position value/cost/weight and closed-history count, and Structure position value/weight all matched their canonical formatted values. Classification/role enrichment was omitted from this accounting-focused harness; it does not independently verify live metadata.

Temporary read-only verification sources are v12LiveReadOnly.test.ts and v12CrossSurfaceReadOnly.test.tsx in the execution workspace. They consume a private temporary snapshot and are not committed. They verify Development data; they are not substitutes for persistent general regression coverage already present in the repository.

## Hosted baseline and limitations

Fresh Vercel inspection confirms stable Development alias:
https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app

READY Preview:
- deployment `dpl_EuMLf3BrvV5oBJMfuuh8X8hjaz97`;
- unique URL https://portfiolio-l5ezksigo-dibyendu-dutta.vercel.app;
- branch PortfolioAI-Development;
- Git SHA `9b24b97eec37cdb6ce6ffa6440f2ee333ce2b41f`;
- project `portfiolio-ai` / `prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU`;
- Preview (`target: null`).

GitHub comparison to starting HEAD shows only Development Status and the prior V1-2 audit document changed. Application/configuration source is identical. This continuation also changes documentation only; no application redeployment is needed.

Owner-supplied authenticated Development screenshots already show Dashboard, Holdings and Structure rendering consistent counts/value/weights, with explicit accounting and price limitations. Together with executed engine/page checks, they support this bounded V1-2 accounting PASS. They are owner visual evidence, not agent-operated hosted interaction.

Browser runtime activation still fails because its platform token is not provisioned. Authenticated hosted filter/drill-down/correction interaction was **not executed**. Database write workflows were not exercised, and this PASS does not claim end-to-end write/RLS acceptance. Full authenticated interaction/security acceptance remains mandatory in V1-9; no release PASS is asserted.

Cached price freshness remains explicit. No prices were refreshed. Valid price availability does not imply freshness. Gross-only accounting and missing chronology/broker attribution remain disclosed limitations rather than fabricated corrections.

## Closure and next boundary

V1-2 accounting verification is COMPLETE / PASS on the bounded evidence above; no production-source repair was justified. Private 111-manifest availability is not required for this accounting gate under the owner's amendment, but remains NOT ESTABLISHED and a hard blocker before V1-3. V1-3 additionally needs separate owner execution authorization. No later gate was started.

No main/Production, database mutation/migration/Auth/RLS, provider call/campaign/refresh, scheduler action, R2/storage write, P8 execution or backup/restore action occurred.

---

## Historical pre-amendment prerequisite stop

The original audit below is retained unchanged for provenance. Its stop-before-V1-2 boundary is superseded by the owner-approved amendment above; its historical observations are not falsely described as newly executed tests.

# PortfolioAI V1-2 Accounting Integrity — Pre-implementation Audit

**Date:** 5 October 2026  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Branch:** `PortfolioAI-Development`  
**Starting authoritative Development HEAD:** `9b24b97eec37cdb6ce6ffa6440f2ee333ce2b41f`  
**Scope:** V1-2 only  
**Disposition:** **NOT PROVEN — STOPPED AT FROZEN PRE-IMPLEMENTATION PREREQUISITE**

## Authority and scope

The remote Development branch started exactly at Scope Freeze B owner-approval commit `9b24b97eec37cdb6ce6ffa6440f2ee333ce2b41f`, whose parent is the preserved approved proposal `e23b049d8639cacb23fd70a2f7b74551f0955b13`. No later remote Development change conflicted with the approved scope.

`AGENTS.md` and the governing architecture/V1 documents were reviewed before implementation. V1-2 is limited to accounting integrity and cross-surface consistency. No V1-3 or later work was started.

## Frozen private cohort-manifest prerequisite

Scope Freeze B requires a reconciled private owner-reviewed manifest for the initial 111-equity cohort before application coding. It must preserve canonical identities, frozen per-member values, valuation date/source, snapshot lineage and an integrity reference, while keeping private identities/per-stock values out of public GitHub documentation.

Retrievable authoritative/private context proves only the aggregate contract:
- 111 equities = 109 REVIEW_REQUIRED + 2 STALE;
- frozen combined value = INR 1,325,856.96 = 132,585,696 paise;
- final V1 minimums remain 100 successful members and 119,327,127 paise from those same successful members.

A private owner-reviewed 111-row identity/value manifest with the required lineage/integrity reference was not retrievable. Owner approval of Scope Freeze B is explicitly not treated as proof that the manifest itself was reviewed.

Therefore the prerequisite is **NOT RECONCILED / NOT ESTABLISHED**. Application coding stopped before any source change. No cohort member was inferred, regenerated from a moving readiness query, substituted or invented.

## Development target re-verification

Read-only Supabase verification positively identified:
- `PortfolioAI Dev`;
- project ref `lrgpjimipfkyoqbpsqzz`;
- `ACTIVE_HEALTHY`;
- distinct from `Project-PortfolioAI`.

All database inspection in this audit was read-only.

The connected Vercel integration exposed no teams/projects in this execution session, so authenticated hosted-browser inspection was unavailable. GitHub commit status for `9b24b97eec37cdb6ce6ffa6440f2ee333ce2b41f` independently reports Vercel success ("Deployment has completed") and a successful Vercel Preview Comments check. This is deployment-status evidence only, not authenticated accounting acceptance.

## Canonical V1-2 authority and shared flow

Existing source follows one shared path:

`transactions`
→ `loadPortfolioLedgerSnapshot()`
→ `calculateAccounting()`
→ `calculatePortfolio()`
→ `usePortfolioView()`
→ Dashboard / Holdings / Portfolio Structure.

The canonical authority registry assigns transactions to the trusted transaction ledger and accounting/value/weight facts to the deterministic portfolio/accounting layer. Page-local competing calculations are prohibited.

Imported XLSX holdings snapshots remain provenance/reconciliation evidence. Holdings labels them as imported snapshot evidence and does not feed them into canonical accounting.

## Read-only Development accounting census

Current live Development evidence:
- 273 security histories;
- 248 open histories;
- 25 closed histories;
- 32 open histories with at least one sale;
- 71 histories spanning more than one attributed broker account;
- 58 histories with at least one ACTIVE transaction lacking broker attribution;
- 211 histories with missing transaction dates;
- 273 histories with at least one incomplete charges/taxes row;
- 3 date-provable closed-then-later-buy reopened histories;
- 5 active corrections linked to superseded transactions;
- 5 superseded rows;
- all 477 imported rows retain import-source-row and import-batch provenance.

Current holdings/valuation:
- 248 open holdings;
- 239 EQUITY;
- 9 ETF;
- 248/248 priced;
- 46 current holdings flagged with missing broker attribution;
- total priced value INR 2,217,451.55;
- priced equity value INR 2,087,118.51;
- priced ETF value INR 130,333.04;
- selected latest-price timestamps span 22 September 2026 through 5 October 2026.

Price freshness policy is not redefined in V1-2.

## Accounting semantics verified from current source

`calculateAccounting()` uses `decimal.js` exact decimal arithmetic.

Verified source semantics:
- FIFO only when chronology is provable;
- deterministic order-independent weighted-average cost when chronology is incomplete/ambiguous;
- no silent FIFO reconstruction from missing chronology;
- complete charge/tax evidence is included in acquisition cost/proceeds;
- if any charge/tax is unavailable, all charges/taxes are excluded and output is explicitly `GROSS_ONLY_CHARGES_INCOMPLETE`;
- oversells/unsupported ledgers fail to `UNRESOLVED`;
- superseded/reversed rows do not participate in ACTIVE accounting;
- closed histories retain realised accounting;
- reopened histories retain prior realised results while new lots form the open position;
- imported snapshot formulas never participate in canonical accounting.

No V1-2 code defect requiring repair was proven during this preparation.

## Existing regression coverage inspected

The current suite already contains hand-verifiable cases for:
- single buy;
- multi-lot partial sale;
- fully closed history;
- weighted-average closed history;
- buy → partial sell → buy;
- close → reopen;
- interleaved partial sells;
- missing-date weighted-average fallback;
- imported-snapshot independence;
- dated FIFO;
- correction-driven FIFO/average-cost changes;
- supersession/correction;
- reverse/restore;
- gross-only incomplete charges;
- aggregate/chronological oversells;
- ambiguous same-timestamp ordering;
- exact fractional decimal arithmetic.

Dashboard, Holdings and Portfolio Structure consume the same `usePortfolioView()` projection.

Because the frozen private-manifest prerequisite failed before coding, no application source was changed and no new application test run is claimed as V1-2 completion proof. Historical full-repository lint debt is not relabelled PASS.

## Workflow/push safety

Development P8 workflows are path-scoped to their P8 scripts/workflow files. The documentation-only paths used here do not match those trigger paths. The documentation commit uses `[skip ci] [skip actions]`; no check is disabled globally.

## V1-2 disposition

**V1-2 = NOT PROVEN.**

Exact blocker:

> The private owner-reviewed 111-member manifest has not been retrieved/reconciled with canonical identities, frozen per-member paise values totaling 132,585,696 paise, valuation date/source, snapshot lineage and integrity reference.

Until that private record is available and owner review is established, the approved contract forbids application coding.

No V1-3 or later gate was started.

## Side-effect confirmation

- Production/main changes: NO
- Development database mutation: NO
- migrations/schema/Auth mutation: NO
- provider call/campaign/refresh: NO
- scheduler action: NO
- R2/storage write: NO
- P8 execution: NO
- backup/restore execution: NO
- isolated restore rehearsal: NO

Next action remains V1-2 implementation/closure after the frozen private-manifest prerequisite is satisfied. V1-3 requires separate owner authorization after V1-2 passes.
