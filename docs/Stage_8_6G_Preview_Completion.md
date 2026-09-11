# Stage 8.6G — Preview Completion

## Purpose
Complete the HDFCBANK reference-stock read-only scoring preview without creating an official persisted score run.

## Changes
- The Overall Stock Score card now shows a deterministic preview only when:
  - total score-ready coverage is at least 70%, and
  - every positive-weight dimension has crossed its own scoring gate and has a numeric score.
- The preview is the configured dimension-weighted average across positive-weight dimensions.
- The card is explicitly labelled `Read-only preview` and includes the heat-state label.
- Zero-weight dimensions, including Cash Flow for the BANK_NBFC profile, display as `N/A / Not Applicable` rather than `Insufficient`.

## Safety
- No `stock_score_runs` row is created.
- The scoring model remains DRAFT.
- No portfolio holding, allocation, Core/Satellite role, target price, or transaction is changed.
- No provider call is made.

## HDFCBANK expectation
With current preview dimensions and 72% score-ready coverage, HDFCBANK should display an overall read-only preview of approximately 80/100 (Strong), while preserving weak Momentum independently in the heatmap.
