# Stage 8.5 — Verified evidence coverage vs scoring readiness

## Purpose
Research must distinguish two different facts:

1. **Verified evidence coverage** — a reviewed metric contract has a fresh AVAILABLE canonical observation.
2. **Scoring readiness** — that reviewed observation also has an approved normalization rule that can produce a deterministic score.

Previously the localhost preview counted only normalized inputs as evidence coverage. That understated progress for newly promoted, semantically verified metrics such as OPM TTM and promoter pledge when normalization was intentionally still pending.

## Preview rule
- `PENDING_SOURCE` never counts as evidence and never scores.
- A fresh AVAILABLE observation for a `REVIEWED` fundamental rule counts toward **evidence coverage**.
- It contributes to a numerical dimension score only when the normalization rule returns an approved deterministic score.
- A dimension score remains withheld until normalized scoring coverage reaches the existing 60% gate.
- `DRAFT` rules do not count as reviewed evidence for scoring coverage.
- Missing evidence is never converted to zero.

This is a presentation/readiness correction only. It creates no score run and does not activate the DRAFT scoring model.
