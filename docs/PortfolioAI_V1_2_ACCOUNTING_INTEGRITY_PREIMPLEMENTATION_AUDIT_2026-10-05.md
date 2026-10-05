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
