# PortfolioAI Stage 6 — Portfolio Classification and Position Settings

## Scope and invariants

Stage 6 adds human-controlled portfolio organisation. Transactions remain
authoritative; the owner-approved completion amendment retains FIFO when chronology
is provable and adds deterministic average cost where chronology is incomplete. Imported
evidence remains immutable, and canonical asset class remains independent of
portfolio role. No investment engine, recommendation, fundamental enrichment or
provider mapping is inferred.

## Portfolio settings and themes

`portfolio_security_settings` remains the only role/settings record. Its canonical
roles are CORE, SATELLITE, THEMATIC, ETF and OTHER; no row means UNCLASSIFIED. Blank
optional values remain null. All weights cross the browser boundary as decimal
strings and use the database's `numeric(9,6)`, 0–100 and ordering constraints.

Migration `20260907220000_create_stage6_portfolio_classification.sql` adds
portfolio-owned `themes` and `theme_securities`. A composite theme/portfolio foreign
key plus a database trigger restrict new membership to transaction-derived open
holdings in the same portfolio. Theme membership does not require a settings row,
so an unclassified holding can belong to themes without acquiring a primary role.
Ordinary RLS is sufficient for these mutable user settings; no security-definer
function or ledger privilege was added.

## User experience

Portfolio Structure provides role summaries, stock/ETF/other-asset filtering,
position settings and searchable theme management. Themes can be created, edited,
prioritized, retired/reactivated and populated through a searchable holdings
multi-select showing identity, primary role, asset class and trusted classification.
Holdings shows canonical asset class, role, themes, trusted sector/industry or
explicit missing states, and a direct management link. ETF assets are not treated
as equity merely because of a role value.

Primary role, thematic membership and consolidated holdings are independent:
changing role cannot delete themes, changing themes cannot update role, and neither
operation writes transactions. Starter themes are not seeded; any future template
must create editable portfolio-owned records without automatic stock assignment.

Dashboard market value is coverage-aware: full coverage retains total wording;
partial coverage shows the priced subtotal, priced/total count and unpriced symbols.
Allocations and weights use exact decimal calculations over the priced subset and
are explicitly qualified whenever coverage is incomplete.

Covered P&L is shown only as a labelled subtotal with coverage. It is not promoted
to complete portfolio P&L when cost or price evidence is missing.

## Imported snapshot evidence

The existing immutable HOLDINGS rows are sufficient, so no new persistence table is
created. The read-only projector accepts numeric source/cached-formula values,
rejects error cells and placeholders such as `#REF!`, and retains import batch,
source-row, sheet and row provenance. Imported average cost, invested value, price,
market value and P&L are labelled snapshot/reconciliation evidence. They never feed
FIFO, replace cached market prices or create missing transactions.

## Verification and deployment

Local application checks and Stage 6 database/RLS tests pass. Migration
`20260907220000_create_stage6_portfolio_classification.sql` is deployed to the
linked project and its migration history, schema/RLS, production snapshot and
non-mutating acceptance checks pass. Rollback, if needed,
must use a forward compensating migration after exporting any newly created theme
or membership data; applied migration history must not be edited.

## Stage 6 completion additions

Forward migrations `20260908100000_create_audited_void_and_classification_corrections.sql`
and `20260908101000_correct_bbox_canonical_asset_class.sql` add audited void/restore,
owner classification requests, service-controlled canonical application and the
reviewed BBOX correction. `20260908102000_protect_stage6_audit_events.sql` adds
defence-in-depth triggers preventing update or deletion of applied audit events.
All three were applied sequentially to the linked project on 8 September 2026.

Transactions now open correction in an immediately visible modal, support strongly
confirmed Remove/Restore actions, and lead expanded details with investment and
position context while retaining audit/provenance in a secondary disclosure.
Holdings pairs prominent independently calculated FIFO/average-cost fields with
imported snapshot evidence. Dashboard broker analytics and best/worst rankings use
the best supported deterministic basis per history and trusted cached prices, with
Unknown attribution and FIFO/average/unresolved coverage visible.

Closed positions retain historical acquisition quantity and average cost after
liquidation. Their disposed quantity is labelled explicitly; current quantity,
remaining cost and current value are zero rather than confused with historical
amounts. Realised cost, proceeds, P/L, percentage, basis, charge completeness and
chronology remain visible. A fully dated close followed by a later BUY retains the
old realised result while the new open position derives its cost only from open FIFO
lots.

During the controlled interval before the completion migrations reach the linked
database, a missing `transaction_accounting_events` table or VOID/RESTORE RPC is a
narrow optional-feature mismatch. Transactions still loads listing, correction,
search, filtering and provenance, shows a migration notice, and omits only the
dependent actions/history. Other database failures are not swallowed. The feature
activates automatically once the schema exists. Classification-request submission
uses the same human-readable handling for its pending table; no other pending object
is queried during normal page load. This compatibility path remains intentionally
available for deployments in transit even though the linked project is now current.

## Remote completion acceptance — 8 September 2026

Linked migration history aligns through `20260908102000`. Read-only schema and data
inspection confirms owner-scoped request RLS, service-only classification
application, SELECT-only authenticated access to transactions and audit histories,
authenticated ownership-validating VOID/RESTORE RPCs, and immutable UPDATE/DELETE
triggers on both applied audit-history tables. BBOX is now canonically `EQUITY` /
`COMMON_STOCK`; its applied request and old/new ETF-to-equity audit record retain the
approved NSE evidence.

Live authenticated-browser acceptance passed for Dashboard, Holdings, Portfolio
Structure and Transactions. Transactions loads 478 active rows without PGRST205,
with correction, Remove controls, search/filter/sort and investment-first provenance
details. Holdings reports 249 open and 22 closed histories; the five owner-targeted
open histories expose deterministic average-cost values instead of inappropriate
Unavailable states, and every closed history retains historical average cost,
disposed quantity, zero current quantity/remaining cost, realised results and basis
quality. Dashboard remains explicitly partial at 248/249 priced holdings with
V2RETAIL unpriced; broker analytics and Best/Worst ranking render without fabricated
evidence. Portfolio Structure shows BBOX as an equity stock while audited ETF assets
remain ETFs, and existing roles, themes and settings are unchanged.
