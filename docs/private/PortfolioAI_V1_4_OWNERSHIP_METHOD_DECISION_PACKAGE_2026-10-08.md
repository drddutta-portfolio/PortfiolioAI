# PortfolioAI V1-4 Ownership Methodology Decision Package — 2026-10-08

**Stage:** Operational V1-4 evidence/current-history readiness  
**Development Supabase:** `lrgpjimipfkyoqbpsqzz`  
**Canonical fixed-115 run:** `c0b7f1c4-3e36-4d5c-b79a-19e44fe74e83`  
**Decision state:** OWNER/METHODOLOGY DECISION REQUIRED — no decision is implied by this package.

## Current inventory

The current canonical run contains:

| Requirement family | Current items | Current stocks |
|---|---:|---:|
| `OWNERSHIP_TREND_4Q` | 53 | 53 |
| `OWNERSHIP_GOVERNANCE` | 51 | 51 |
| `INSTITUTIONAL_OWNERSHIP_TREND_4Q` | 10 | 10 |

This differs from the historical V2 package (53 / 49 / 10). The present inventory is authoritative for this package.

No subsequently approved repository decision selecting an ownership series/basis was found.

## Retained source structure

The retained Trendlyne ownership captures expose separate quarter series for:

- Promoter
- Institutional
- FII
- MF
- DII
- Public

Representative source-bound samples in the current run include `ABCAPITAL`, `AKUMS`, `ALIVUS`, `ACMESOLAR` and `ANGELONE`. Each sample contains six quarters through Jun-2026 for multiple distinct series. The parser intentionally preserves those series independently.

**No aggregate arithmetic is authorized.** In particular, `Institutional`, `FII`, `MF` and `DII` must not be added together unless the provider contract explicitly proves non-overlap. The current evidence does not establish that.

## Requirement-family decision required

### 1. OWNERSHIP_TREND_4Q

The repository defines this as a required four-quarter ownership evidence input but does not identify a single canonical ownership series.

Owner/methodology choice required:

- **Option A — Promoter / TOTAL_EQUITY:** use the provider's Promoter percentage series for four consecutive quarters.
- **Option B — Institutional / TOTAL_EQUITY:** use the provider's Institutional aggregate as its own provider-defined series.
- **Option C — another named single provider series:** FII, MF, DII or Public, explicitly named and justified.
- **Option D — keep DEFER:** do not score this requirement until the methodology authority is amended.

No option is selected by this document.

### 2. INSTITUTIONAL_OWNERSHIP_TREND_4Q

The semantic name strongly narrows the candidate series to the provider's **Institutional** series, but formal approval is still required because the current method does not define the provider series/basis.

Decision proposal for owner review:

- canonical series: `Institutional`
- basis: `TOTAL_EQUITY_PERCENT`
- required periods: four consecutive quarters
- consistency rule: one series and one basis across all four quarters
- no summation of FII/MF/DII with Institutional
- latest required quarter must satisfy the existing freshness contract.

This is a proposal, not approval.

### 3. OWNERSHIP_GOVERNANCE

The signal name combines ownership and governance semantics, while the retained ownership source provides only ownership percentages. The repository does not establish whether this requirement should mean Promoter trend, Institutional trend, a separately reviewed governance signal, or a composite.

Owner/methodology choice required:

- **Option A:** define a single ownership series and keep governance as a separate required documentary/event input.
- **Option B:** define an explicit two-component composite, with separate source contracts and aggregation rule.
- **Option C:** keep DEFER until the canonical scoring authority supplies an exact definition.

No series is silently selected.

## Acceptance contract after a decision

Any approved series must still pass all existing controls: exact source identity, consistent series/basis, four consecutive quarters, percentage unit, freshness/cutoff, conflict detection, immutable source lineage and owner-authenticated review integrity where the review ledger is used.

**No review-ledger rows were inserted. No reviewer identity or owner approval was fabricated.**
