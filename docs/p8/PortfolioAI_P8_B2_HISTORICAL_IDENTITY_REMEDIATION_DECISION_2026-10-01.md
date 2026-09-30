# PortfolioAI P8-B2 historical identity remediation decision

Date: 1 October 2026  
Environment: PortfolioAI Development only  
Status: **DESIGN DECISION COMPLETE / LOCAL CLASSIFICATION VALIDATION PENDING / NO MIGRATION CREATED**

## 1. Evidence-driven finding

The owner-generated P8-B2 reconciliation proved that the current live `securities` table cannot be used as the historical universe identity registry.

Observed source facts:

- 32 official NSE CM MII security-master files;
- 597,092 rows carrying the previously selected NSE equity type flag;
- 5,211 unique source identities in the `ISIN` field;
- only 256 current canonical ISINs in PortfolioAI Dev;
- 7 current NSE equity rows with a unique same-symbol historical ISIN candidate;
- 4,948 otherwise-unmatched source identities;
- 51 current-symbol collision groups;
- 25 same-ISIN multi-symbol groups at the latest observed date;
- no parse errors, missing source ISIN fields or hash mismatch.

The current `securities` table has a live/current uniqueness contract on `(exchange, symbol)`. Historical source evidence demonstrably reuses symbols across different ISINs and can expose more than one symbol for the same ISIN. Therefore bulk-adding historical identities to `securities` would mix historical experiment identity with current product identity and would violate the intent of the live canonical model.

## 2. Frozen common-equity identity rule

For the bounded P8 experiment, historical identity is filtered using the ISIN structure, not symbol text:

- country: `IN`;
- issuer type: `E` or `9`;
- security type code: `01`.

This follows the NSDL ISIN structure where the third character identifies issuer type and security code `01` identifies equity shares. It prevents fund units, rights entitlements and other non-common-equity securities from entering the frozen equity universe merely because the NSE master places them in the same broad source type flag.

Derived from the uploaded reconciliation:

```text
historical unique source identities                 5,211
frozen company-equity identities                    4,524
exact current common-equity links                     255
current null-ISIN common-equity candidates              7
P8-local historical identity rows required           4,262
non-frozen identities excluded                         687
eligible-cohort symbol-collision groups                 40
frozen equities present at 2026-09-29                4,385
frozen equities historical-only before latest date     139
```

The 687 excluded identities decompose as:

- 333 issuer-type `F` identities;
- 288 company issuer identities whose security type is not `01`:
  - 269 code `20`;
  - 10 code `23`;
  - 6 code `25`;
  - one each code `09`, `11`, `13`;
- 2 unsupported issuer-type `8` identities;
- 64 nonstandard/dummy/place-holder identities.

One of the 256 exact current-ISIN matches is `MIDCAPETF` / `INF769K01IC9`, so it is deliberately excluded from this common-equity experiment even though it is a valid current PortfolioAI security.

## 3. Decision: P8-local historical identity registry

Do **not**:

- update the seven current `securities.isin` values as part of P8-B2;
- bulk-insert the 4,262 unmatched common-equity identities into `securities`;
- resolve historical identity by symbol;
- discard old/alternate company-equity ISINs solely because a current symbol exists.

Create a new additive P8-local historical identity layer in the next separately authorized migration.

Proposed core registry:

`p8_historical_security_identities`

Required semantics:

- immutable identity row per `portfolio_id + experiment_id + historical_isin`;
- `historical_isin` is the primary historical security identity;
- parsed issuer type and security type code are stored;
- optional `canonical_security_id` points to current `securities.id` only where a deterministic link is proven;
- link basis is explicit, e.g. `EXACT_ISIN`, `EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN`, or `NONE`;
- the 4,262 unmatched company-equity identities remain valid P8 historical identities with `canonical_security_id = null`;
- symbol, name, series and instrument ID remain dated line-level evidence rather than canonical identity.

The seven current null-ISIN candidates may be linked from the P8 registry to their existing `securities.id` on the proven one-to-one NSE symbol match **without mutating the live security row**.

## 4. Versioned historical observations/membership

Because the current B2 observation/member tables require a non-null live `security_id`, they cannot represent the proven historical population without contaminating `securities`.

The next additive migration should therefore introduce versioned P8-local objects rather than weakening live-table constraints or manufacturing current securities:

- `p8_historical_security_identities`;
- file-level immutable source-archive/provenance records;
- identity-keyed listing observations;
- identity-keyed universe members;
- member-to-listing-observation evidence links;
- owner-scoped `security_invoker` read views;
- service-role-only append/select functions.

The existing empty B2 v1/v2 objects remain preserved for audit compatibility and must not be silently repurposed.

## 5. Publication/availability proof

The GZIP MTIME field is absent in all 32 acquired files, so it must not be used as publication time.

However, official NSE evidence establishes a stronger operational availability fact:

- NSE/MSD/60315 states the CM MII security file is disseminated daily on the NSE website effective 5 February 2024;
- subsequent NSE capital-market circulars state that members must load the appropriate security master every day **before trading hours**;
- NSE equity pre-open begins at 09:00 Asia/Kolkata and normal trading begins at 09:15.

The next schema should therefore **not invent `source_published_at`**. It should store a source-availability upper bound separately, e.g.:

`available_no_later_than_at = decision_date 09:00:00 Asia/Kolkata`

with an explicit proof basis and circular reference. This is a conservative bound derived from the exchange's operating requirement, not an estimate of the actual publication timestamp. Since the frozen decision instant is after market close, the bound is strictly before the decision instant.

## 6. Required local classification validation

Runner:

`scripts/p8/p8-b2-classify-historical-identities.mjs`

Expected aggregate result from the uploaded reconciliation:

```text
historical_unique_identities = 5211
frozen_company_equity_identities = 4524
excluded_non_frozen_identities = 687
exact_current_equity_links = 255
matched_non_equity_current_rows = 1
current_null_isin_company_equity_candidates = 7
p8_local_historical_identity_rows_required = 4262
frozen_equity_symbol_collision_groups = 40
frozen_equity_present_on_latest_decision_date = 4385
frozen_equity_historical_only_before_latest_date = 139
```

This runner is read-only and performs zero provider calls or database writes.

## 7. Stop boundary

No new migration is created by this decision memo.

The next consequential step is an **additive P8-B2 historical-identity/source-archive migration package**, with local replay and contract tests. Under the Codex handoff, creation/testing of that migration and its later hosted application remain separately approval-gated. P8-B3 and P8-C remain not authorized.
