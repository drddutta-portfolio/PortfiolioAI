# Stage 8.5 — Evidence coverage vs score readiness

## Purpose
Research must distinguish trusted evidence from score-ready evidence. A metric can be verified, fresh and useful to the investor before PortfolioAI has approved a deterministic normalization formula for that metric.

## Rules
- **Verified evidence coverage** counts fresh `AVAILABLE` observations only when the metric contract itself is `REVIEWED`.
- **Score-ready coverage** counts only the subset of reviewed evidence that also has an approved deterministic normalization rule producing a numeric score.
- Dimension score gates use **score-ready coverage**, not mere evidence availability.
- Missing or unverified evidence remains insufficient; it never becomes a zero score.
- `PENDING_SOURCE` rules contribute to neither coverage measure.
- DRAFT rules may be displayed as evidence elsewhere but do not contribute to scoring coverage.
- Official score runs continue to use the persisted scoring contract; the read-only Research preview does not create a score run.

## Why this matters
The non-financial pilot now has verified ROCE, OPM and promoter-pledge evidence for INFY, M&M and TORNTPHARM. ROCE already has a reviewed absolute normalization rule; OPM remains sector-relative and promoter pledge still needs an approved scoring band. The UI must therefore show that evidence exists without pretending every verified metric is already scoreable.

## Stage boundary
This stage does not activate `PAI_STOCK_SCORE` V1, create `stock_score_runs`, mutate Core/Satellite roles, or trigger any provider call.
