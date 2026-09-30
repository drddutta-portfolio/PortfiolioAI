# PortfolioAI P8-B2 duplicate-identity diagnosis and schema decision memo

Date: 30 September 2026  
Environment: Development only  
Status: **DIAGNOSTIC PASS / ADDITIVE EVIDENCE-LINK SCHEMA REQUIRED BEFORE MATERIALIZATION**

## Observed duplicate structure

The owner-run 32-file NSE duplicate-identity diagnostic produced:

```text
files_checked = 32
duplicate_isin_months = 32
duplicate_isin_groups = 114,908
multi_symbol_groups = 569
multi_series_groups = 114,908
multi_name_groups = 28,019
multi_instrument_id_groups = 114,908
```

Every duplicate ISIN group differs by series and instrument ID. A smaller subset also differs by symbol and/or security name. This proves that one ISIN can have multiple contemporaneous NSE security-master rows and that an arbitrary "pick EQ" or "pick first row" rule would discard authoritative evidence.

## Decision

Historical **universe membership identity remains ISIN-level** for the first bounded P8 experiment, because the same legal security can legitimately have multiple contemporaneous trading-series/instrument rows.

However, a universe member cannot safely point to exactly one line-level listing observation. The current P8-B2 schema has:

- one immutable line-level observation table, and
- one nullable `listing_observation_id` on each universe member.

That is insufficient for the observed many-to-one relationship.

## Required additive extension

Before any historical-universe materialization, add an append-only member-to-observation evidence-link relation, conceptually:

`p8_historical_universe_member_listing_evidence`

with:

- universe member identity;
- listing observation identity;
- evidence role / support reason;
- immutable append-only enforcement;
- owner-scoped RLS;
- service-only append path;
- unique member + observation constraint.

The existing single `listing_observation_id` column must not be repurposed as an arbitrary canonical row. It may remain nullable for backward compatibility, but P8-B2 reconstruction should require at least one linked proven observation and preserve all same-ISIN supporting rows that establish decision-date eligibility.

## Bias controls

- ISIN-level membership does not collapse or delete line-level NSE evidence.
- Symbol, series, name and instrument-ID variations remain immutable evidence.
- Same-month multi-symbol groups remain explicit and auditable.
- Unknown or conflicting identity cannot be silently merged.
- No current-state fallback is introduced.
- No historical data is written until the additive link schema is locally replayed and separately approved for hosted Development application.

## Current stop

No database migration has been created by this memo. The next schema change requires explicit owner approval under the P8 migration protocol.
