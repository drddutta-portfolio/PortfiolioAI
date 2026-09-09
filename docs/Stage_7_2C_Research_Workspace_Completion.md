# Stage 7.2C — Research Workspace Completion

**Status:** Complete locally; Stage 7.2D and Stage 8 not started

## Routes and navigation

- `/app/research` is the searchable current-holdings Research directory.
- `/app/research/:security` is the company-level workspace and accepts the canonical
  security UUID or current ticker.
- Research is present in primary navigation. Existing routes are unchanged.

## Data projection

`researchRepository` is the single browser data-access boundary for research
evidence. It reads the existing RLS-protected current-enrichment projection,
fundamental observations and definitions, canonical decisions, research-document
metadata and document-source appearances. Portfolio position context continues to
use the existing transaction-derived portfolio model and cached Angel One price
path. React presentation components do not query raw tables directly.

No schema/view change was necessary. No migration was created or applied.

## Workspace behavior

The seven responsive, keyboard-operable sections are Overview, Financials,
Quality & Growth, Ownership, Valuation, Documents and Evidence.

- Overview keeps portfolio accounting, Angel One CMP, market-cap evidence,
  classification, role, themes and freshness visibly distinct.
- Financials renders only stored period-qualified evidence.
- Quality & Growth reports input coverage and explicitly says scoring is not enabled.
- Ownership retains reported periods and does not infer a trend from one period.
- Valuation preserves `PBV_ADJUSTED_PROVIDER` as **Provider Adjusted P/B** with its
  conflicting state; no valuation conclusion is produced.
- Documents displays metadata/source appearances only. Review-required evidence is
  retained and an open action is absent without an approved archival reference.
- Evidence exposes provider, source field, period, scope, unit, currency, retrieval,
  freshness, status, and selected-versus-competing state.

Unavailable is never represented as zero. Stale, provisional, conflicting,
ambiguous, review-required and unavailable states use both text and visual styling.
Loading, error, partial-coverage, filtered-empty and true-empty states are explicit.

## Responsive and accessibility behavior

The workspace reorganizes its header and card grids at tablet/mobile breakpoints.
Tabs scroll within their own container, evidence tables scroll locally rather than
overflowing the page, document rows stack on narrow screens, and controls retain
touch-sized targets. Representative 390, 768, 1024 and 1440 widths are covered by
component tests. The page uses semantic headings, a labelled tablist/tabpanel,
roving keyboard focus, visible focus rings, labelled filters and textual statuses.

## Cache-only guarantee

Normal Research loading and interactions have no reference to
`refresh-security-enrichment`, provider-client construction, provider budget RPCs,
usage events or ingestion runs. Tests cover initial render, tab changes, evidence
filtering and representative route rendering without provider activity. The
existing provider usage baseline therefore remains 47 accounted Cohort A attempts.

## Known data limitations and boundary

The current Cohort A evidence is intentionally shallow first-wave coverage rather
than complete statements or long histories. Most observations have no canonical
selection and remain provisional; adjusted P/B remains conflicting. Sector,
industry and market-cap category remain unavailable where trusted selections do not
exist. Only three provisional document appearances exist, with no retained lawful
open reference or document body. Target price and stop-loss do not yet have current
schema support.

Stage 7.2C does not implement refresh controls, schedules, broader provider rollout,
document archival, Quality-Growth scoring, valuation scoring, investment actions,
recommendations, AI synthesis or any Stage 8 capability. Those require separately
approved Stage 7.2D or later work.
