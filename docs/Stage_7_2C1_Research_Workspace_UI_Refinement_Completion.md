# Stage 7.2C.1 — Research Workspace UI Refinement Completion

**Status:** Complete locally; Stage 7.2D and Stage 8 not started

## Previous hierarchy problem

The Stage 7.2C workspace was technically correct but gave company identity less
visual prominence than the ticker, placed only four large position cards in the
header, and repeated several of those portfolio values in Overview. Evidence was
available in detail tabs but not organized into an investor-oriented summary.

## Revised company and position header

The left header now leads with the full company name, followed by ticker, exchange,
instrument type, sector, industry, market-cap category, raw provider market cap,
portfolio role and theme chips. Missing classifications remain explicitly
unavailable.

The compact right-side position dashboard uses the same `PortfolioPosition` object
as Holdings. It presents cached Angel One CMP and freshness, total quantity,
average cost and accounting basis, portfolio weight, invested amount, current
value, combined absolute/percentage P/L with textual Gain/Loss context, transaction-
derived broker/demat chips, target price and stop loss. Target and stop loss remain
unavailable because the current approved schema does not provide those fields.

No parallel financial formula or Research-specific holding calculation was added.

## Overview research cockpit

Overview now answers what the available research says at a glance. A compact
business/portfolio context strip is followed by future-ready panels for:

- quality inputs;
- growth inputs;
- valuation evidence;
- aggregate ownership evidence.

Each panel displays only whitelisted stored observations, their period and evidence
state. Missing inputs remain unavailable. `PBV_ADJUSTED_PROVIDER` remains Provider
Adjusted P/B and conflicting. Ownership retains its reported period and no trend is
inferred. A Research Health row reports the actual cached observation count and
counts of conflicting, review-required and provisional items, with a keyboard-
operable View Evidence action. No numeric research score is invented.

The former dominant warning is replaced by a muted note that investment scoring
and recommendations are not yet enabled.

## Responsive and accessible behavior

At desktop width the header is identity-left and position-dashboard-right, using a
dense four-column card grid. At tablet widths the header stacks while retaining
three-to-four compact columns. At mobile width it uses two columns, wrapping broker
and theme chips; research panels and context stack. Existing scrollable tabs and
locally scrollable evidence tables prevent page-wide horizontal overflow.

Semantic headings, labelled regions, keyboard tabs, visible focus styling, textual
status labels, signed P/L values, Gain/Loss text and touch-sized controls are
preserved. Representative 390, 768, 1024 and 1440 layouts remain test-covered.

## Cache-only guarantee and tests

The refinement adds no data query or mutation. It continues to use the existing
cache-only Research repository and portfolio projection. Render, Overview, tab and
Evidence navigation perform no Trendlyne call, provider refresh, budget reservation,
usage event or ingestion run. The provider usage baseline remains 47.

Tests verify company-first identity, Angel One price authority, exact Holdings-
contract values, broker display, unavailable target/stop, research cockpit content,
period retention, adjusted-P/B conflict semantics, null preservation, cache-only
interactions, accessibility structure and four representative widths.

## Known limitations and Stage 7.2D boundary

First-wave evidence remains shallow. Several quality inputs and all unsupported
histories remain unavailable. No target-price or stop-loss field exists. Evidence
health describes stored state and counts only; it is not a score or investment
conclusion.

No Stage 7.2D ingestion, refresh scheduling, scoring, recommendation, AI analysis,
target/stop logic, accounting change or broader provider work is included.
