# R4L — PHARMA_V1 parent completion and TORNTPHARM completion gate

Status: repository implementation in progress; no production mutation in this stage.

## Why R4L exists

R4J corrected the visible Pharma readiness panel and removed bank-only overview metrics. A deeper review then found that `loadSecurityScoringSnapshot()` still selected `GENERAL` scoring rules for every non-`BANK_NBFC` profile. That meant a screen could display `PHARMA_V1` while the scorecard underneath was still reading GENERAL rules.

R4L fixes that authority break before any Pharma subtype work continues.

## Parent PHARMA_V1 requirements

The parent methodology owns the shared Pharma foundation:

- operating-margin history
- revenue-growth history
- ROCE history
- PAT/EPS history
- cash conversion
- financial strength / leverage
- business durability (R&D plus pipeline/launch/approval evidence)
- valuation context
- ownership/governance
- regulatory and market risk
- common market momentum

Subtype-specific logic must extend this parent; it must never compensate for an incomplete parent.

## Scoring/readiness behavior

- Canonical application sector `Pharma` routes to `PHARMA_V1`.
- Canonical `Healthcare` does not automatically route to Pharma.
- Legacy reviewed `PHARMA_HEALTHCARE` assignment is translated to `PHARMA_V1` only when the canonical application sector is exactly `Pharma`.
- `PHARMA_V1` loads its own metric rules and dimensions, not `GENERAL` rules.
- Partial reviewed Pharma history contributes proportionally to verified-evidence coverage.
- Numeric Pharma score curves remain separately controlled; partial evidence never becomes score-ready by itself.
- Recommendation, portfolio role and position sizing remain blocked until their upstream gates are satisfied.

## TORNTPHARM current retained evidence

Current canonical production evidence includes:

- 1 annual operating-revenue period
- 8 quarterly operating-revenue periods
- 6 quarterly operating-profit periods
- 5 matched derived operating-margin periods
- 5 period-resolvable annual CFO periods
- current/TTM snapshots for revenue, PAT, OPM, P/E, ROCE/ROE and ownership
- one current quarter of period-resolvable ownership observations

This is useful but not complete PHARMA_V1 evidence.

## Remaining TORNTPHARM parent gaps before completion

1. Semantically consistent annual operating-revenue history: minimum 3 years.
2. Operating-margin history: minimum 8 matched quarters; current retained evidence has 5.
3. ROCE: minimum 3 period-resolvable annual observations.
4. PAT/EPS: minimum 3 matched annual periods.
5. Cash conversion: minimum 3 matched CFO + PAT + reviewed FCF/capex periods.
6. Financial strength/leverage: minimum 3 matched annual debt + cash/net-debt + EBITDA/operating-earnings periods, with interest-cover context.
7. Business durability: reviewed R&D history plus launch/pipeline/approval evidence.
8. Ownership/governance: minimum 4 quarter history plus governance-event overlay.
9. Valuation: reviewed current and historical/peer context beyond a single P/E snapshot.
10. Regulatory/manufacturing-site evidence from issuer/regulator sources where exposure is material.
11. Common market-history evidence for momentum, drawdown, volatility and relative strength.

## Production gate

No production write, provider call, score run, recommendation, position-sizing assessment or scheduler action is authorized by this repository stage. Any normalization of retained source data or acquisition of missing evidence requires a separately approved bounded production action with an enumerated manifest and verification plan.

## Subtype gate

PR #98 and all five Pharma business-model subprofiles remain paused until:

- PHARMA_V1 parent rule selection is correct,
- the parent Research scorecard is internally consistent,
- TORNTPHARM reaches the agreed parent evidence-completion standard,
- the parent methodology is accepted as the stable base.
