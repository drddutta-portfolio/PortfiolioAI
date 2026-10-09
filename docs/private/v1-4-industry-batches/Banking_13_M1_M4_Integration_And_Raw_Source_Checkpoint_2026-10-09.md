# Banking V1-4 M1–M4 controlled admission execution checkpoint — 2026-10-09

**Boundary:** Development-only, draft PR #124. Owner approvals M1–M4 direct; M5–M7 deferred; O1 planning/tests only. **Not** a factual ACCEPT, grant, deployed endpoint, or READY claim.

## Exact repository implementation

- Commit `599f94dec641496d6dcc47712b2674e9437204ba`: integrated source-bound M1–M4 semantic rejection into the **existing** `v14-reviewed-evidence.ts` canonical reviewed-fact adapter after original source identity/hash, exact source fragment, numerical value and period binding. Explicit source fragment must anchor direct TTM NIM/earning-assets basis, Basel III CET1 or total CAR, and full-year ROA. Unsupported annual NIM, Tier 1, Basel II, quarterly annualized ROA fail closed. No parallel READY authority.
- Commit `8676504b5ef3a4068654b1d7bbb7c8deaf773138`: added integration guard regression assertions.
- Earlier `v14-bank-approved-direct-preflight.ts` remains a non-authoritative candidate preflight; it does not by itself prove source truth or issue ACCEPT/READY.
- No metric definition registered: Development `fundamental_metric_definitions` still has zero of the four codes as of this checkpoint. No migration/schema mutation is authorized.
- **Corrected authorization finding:** the existing scoped delegated policy `v14-bank-approved-delegation.json` explicitly includes M1–M4 codes (as well as NPA and other requirements). It is therefore unnecessary to invent a new delegated policy merely to admit a properly bound M1–M4 fact. However, the pre-existing policy's issuer/NSE fallback and integrity controls must be met for each factual review, and methodology approval alone never creates an `ACCEPTED` review. No M1–M4 admission was executed because exact qualifying original-source evidence has not yet been demonstrated. For Trendlyne, the separate provider-specific source semantics and owner-review requirements also remain in force.

## Read-only retained-source inspection

`data_source_records` source grouping:

| Record kind | Count | Text hits (NOT qualification) |
| --- | ---: | --- |
| V1_4_BANK_EXACT_PARAMETER_CAPTURE | 4 | ROA mentions 4 |
| V1_4_BANK_FINANCIAL_CONTRACT_CAPTURE | 4 | NIM, CET1, CAR mentions 4 each |
| V1_4_BANK_PRIMARY_FILING_CAPTURE | 13 | CAR/ROA mentions 13 each |
| V1_4_OFFICIAL_ANNUAL_REPORT_CAPTURE | 4 | **0 in frozen bank scope**: source security identities are ABCAPITAL, ACMESOLAR, AKUMS, ALIVUS; exclude completely from BANK qualification. |

Counts are retained raw *records*, not bank/metric-qualified fact counts, period verification, or source-backed approvals. The official annual report group above is **outside the 13-bank target** and must not be used as banking evidence. Native annual NIM/Tier1 and unverified annual ROA values remain excluded. Original facts need explicit bank/ISIN, source fragment, original bytes/hash, denominator, regulatory/year/TTM period and standalone/regulatory scope. Do not substitute provider retrieval timestamp.

**Result:** qualified new M1–M4 bank-metric facts independently proven and accepted this execution: **0**; new normalized M1–M4 observations: **0**; new factual reviews: **0**; new materializations: **0**. Existing 26 accepted delegated NPA reviews must not be repeated. CI validation is tracked by final code commit and not inferred from a committed test file.

## Remaining hard boundaries

1. Source-grade M1–M4 original issuer regulatory/audited documents and exact quoted native fragments per bank; proper source/period and secure storage linkages.
2. Appropriately authorized controlled registry and factual-review write path, preserving `AGENTS.md` migration instructions; reuse the existing M1–M4 listed delegated policy without weakening its source and execution contract.
3. Genuine owner-authenticated current 299-requirement handler execution and individual materialization only after all requirements pass.
4. **M5 PB_RELATIVE, M6 PB_ADJUSTED_FOR_ROE, M7 PE_TTM_RELATIVE are mandatory applicable in all 13 selected bank snapshots** (13 each). Their deferral therefore independently blocks Gate A for the full frozen banking population. Do not remove required flags or reuse implied upside.
5. Gate B is still planning/testing only. No recurring paid provider calls, schedule, unattended grant or automatic materialization authorized.

Selected baseline remains 0 READY, 11 REVIEW_REQUIRED, 2 CONFLICTING, ₹0/₹2,05,138.62 READY pending an independent current readback. Production/main/V1-5 unchanged.
