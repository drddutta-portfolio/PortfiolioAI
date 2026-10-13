# Banking V1-4 — approved delegated admission executed

## Actual result

The owner approved the scoped source-admission proposal on 9 October 2026. The approved contract is implemented, tested and active in Development. **Twenty-six factual NPA reviews were appended and all twenty-six NPA requirements return FRESH through the actual canonical requirement evaluator over database readback.** This is requirement-level progress, not thirteen READY stocks.

Independent post-admission persisted readback remains **0 READY / 11 REVIEW_REQUIRED / 2 CONFLICTING**, with the same selected snapshot and selection IDs as before. No canonical materialization was run. READY frozen value remains zero of the banking cohort's 20,513,862 paise.

## Approved authority and honest attribution

Policy `V1_4_BANK_PRIMARY_FILING_DELEGATION_V1` is compiled with the exact Development project, portfolio owner, portfolio, thirteen security IDs, applicable requirement codes, official sources and executor. Approval was recorded conservatively at 2026-10-09T04:48:19Z; this is the record timestamp, not a claimed exact chat-message timestamp. Reviews must be created after that record.

The existing append-only ledger can represent delegation without a migration: **all 26 reviews have `reviewed_by = null`**, kind `DELEGATED_NUMERIC_REVIEW`, and integrity-hashed `review_authorization` metadata identifying CODEX, the approving owner and policy. No owner session was impersonated and no personal owner review was fabricated. Existing RLS, service-role-only writes and owner-only reads are unchanged.

The Research & Intelligence Architecture now records the explicitly approved, Development-only exception. Global metric definitions, financial formulas and provider identity are unchanged. The source remains COMPANY_EXCHANGE_FILING, never TRENDLYNE_MCP.

## Qualified facts

Each of the thirteen banks has one unambiguous retained original **Standalone June 2026** financial filing. Its literal NSE symbol, ISIN and Equity class match the verified portfolio security for that reporting period. The selected table column explicitly starts 1 April and ends 30 June 2026; it is the quarterly column, not YTD. No newer reporting quarter appears in the retained financial-filing manifest.

For each bank the exact `% of gross NPAs` and `% of net NPAs` row values are retained without conversion, calculation or rounding. Original file bytes are checked against the acquisition SHA-256. Excerpts transparently combine literal table identity/period/scope headers with the selected cell; they are labeled normalized table-context extraction, not a verbatim contiguous passage or an invented provider response. Full original documents remain in the earlier download archive, outside Git and database bodies.

Thirteen append-only official source-fact records and twenty-six integrity-hashed factual reviews were inserted in one transaction. Publication dates are the filing's literal NSE broadcast time converted from IST to UTC. Source retrieval/extraction times are actual execution times. Existing metric freshness, percentage units, currency-null rule and QUARTER period contract are retained; no future publication date or backdated review is used.

## Actual canonical verification

1. Prepared reviews passed the existing reviewed-evidence adapter against the **live GROSS_NPA_PERCENT / NET_NPA_PERCENT definitions**.
2. All 26 reviews and 13 source-fact records were read back from Development; the adapter revalidated the persisted hashes, source bindings, metadata and attribution: **26 FRESH**.
3. The actual exported `requirementItem` evaluator was replayed with those readbacks and **52 retained NPA observations**: **26/26 FRESH**, reason `APPROVED_OFFICIAL_FILING_FALLBACK`, validation `VALIDATED_REVIEW_LEDGER`.

This is a provider-free replay of the deployed implementation's canonical evaluator, **not a genuine owner-authenticated HTTP invocation, full 299-item replay or materialization**. Server startup alone is suppressed in the local replay runner; no authentication bypass is deployed. Source/cache inputs unrelated to NPA are not represented as fully replayed.

The reconciliation path preserves qualified primary evidence; it uses the approved fallback only when primary rows lack a qualified contract. Comparable same-period/unit/currency/scope contradictions remain CONFLICTING. Equivalent decimal representations do not create artificial conflicts. Sources are never mixed to assemble one accepted series, and unqualified retained rows are not deleted.

## Tests and active deployment

Executed checks after the new policy/reconciliation implementation: **375 Edge tests**, three type-checked canonical-handler Deno integration tests, architecture guard/lint, TypeScript, application lint, Edge lint, production build and whitespace checks PASS. Dedicated tests cover null/delegated attribution, wrong owner/security/policy/source, pre-approval dates, unit/period/scope errors, qualified-primary priority and conflict preservation. The previous full application run passed 2,305 tests; it is historical evidence, not a new full application run on this change.

Development function `p7-ic2-materialize-readiness` **version 46 ACTIVE**; bundle SHA-256 `8a5ba7e87577fff8ae1c938ed537cd861fc89643e0a0994e47f98ee265b28e57`. Version 45 was an intermediate adapter deployment before the final reconciliation correction; v46 is the final active boundary. Existing custom owner/scoped-grant authentication and CORS are preserved. Live smoke verifies OPTIONS 204, invalid combined targeting/pagination 400 and a valid exact-security request without an owner session 401, all with CORS. No Production deployment, schema migration, Auth/RLS change, grant consumption, provider call, R2 write, new history acquisition or V1-5 work occurred in this approval continuation.

## Remaining blockers to whole-bank acceptance

The approved policy unlocks factual admission; it does not supply missing metrics or invent contracts:

- Direct Institutional denominator, consecutive reporting quarters and revision/conflict proof remain unresolved. Official category tables are not silently summed into Institutional. SBIN's previous Trendlyne business-error capture remains unavailable.
- Exact source contracts remain incomplete for NIM TTM, CET1, CAR, annual ROA and banking valuation relative to ROE. In the fresh registry check, **NIM_TTM, CET1_RATIO, CAPITAL_ADEQUACY_RATIO, ROA_ANNUAL and PB_ADJUSTED_FOR_ROE have no metric definitions**. The source-admission exception does not turn missing definitions into reviewed formulas.
- Stage 8.1C explicitly leaves NIM/CET1/CAR/ROA unresolved, prohibits assuming Tier 1 equals CET1 and rejects unusable zero-valued Basel II fields. Stage 8.6D explicitly keeps generic P/B and valuation relative to ROE pending a reviewed derivation. These are genuine existing contract boundaries, not reasons to substitute unrelated metrics.
- The retained primary annual financial tables did not expose a direct annual ROE disclosure in the inspected documents. Quarterly ROA cannot substitute for annual ROE or be silently annualized.
- Advances/deposits/EPS growth, valuation evidence and ratings/governance reviews still need complete source-bound admission. A governance document's presence is not proof of a favourable governance finding.
- HDFCBANK, KARURVYSYA and KOTAKBANK still need independent historical corporate-action/return-basis proof. The ten-bank history-only FRESH result in the preceding execution record is bounded to its recorded evaluation time and cannot be treated as permanent freshness.

No complete bank candidate is currently qualified for materialization. Banking remains NOT PROVEN. The original 299-item owner replay and the 26-item current NPA replay remain distinct artifacts; an overall new FRESH count is not inferred by adding partial replays.

## Portable evidence

Adjacent artifacts contain the actual delegated ledger/source readback, all 52 retained NPA observations, existing live metric definitions, verified quarterly security identity authority, actual canonical requirement replay, v46 deployment and independent unchanged persisted selections. The portable preparation script accepts the retained original-file manifest and verified identities; it performs no acquisition or database writes. Review hashes, original byte hashes and policy/executor identity are reviewable from the repository.
