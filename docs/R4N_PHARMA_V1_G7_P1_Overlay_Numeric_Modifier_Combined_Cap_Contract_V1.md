# PortfolioAI — G7-P1 Material Overlay Numeric Modifier & Combined-Cap Contract V1

**Status:** PROPOSAL ONLY / OWNER VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Parent authority:** validated Gate G2 overlay modifier architecture  
**G6 status:** CLOSED — this is a G7 prerequisite, not a reopened G6 checkpoint

## Purpose

G7-P1 resolves the two numeric decisions Gate G2 intentionally left unapproved:

1. the deterministic Material Overlay modifier formula;
2. the one combined per-dimension cap.

G7.1 must not invent these decisions inside adapter code.

## Existing G2 invariants preserved

G7-P1 does not change:

- Primary remains the scoring driver;
- Material Overlay never receives an independent stock score;
- only dimensions touched by the overlay evidence contract are eligible;
- reviewed economic materiality is mandatory;
- evidence completeness is mandatory;
- evidence confidence is mandatory;
- normalized overlay signal is mandatory;
- unresolved contradictions fail closed;
- Emerging Watch is numerically excluded;
- independent overlay-cap stacking is prohibited;
- missing evidence never becomes neutral.

For the current Global Generics overlay, Gate G2 derives eligible dimensions from the subprofile evidence contract.

## Candidate numeric formula

The proposal is:

```text
modifier_points
  = CAP_POINTS
  × (economic_materiality_percent / 100)
  × evidence_completeness
  × confidence_factor
  × normalized_overlay_signal
```

The output is then bounded by the one combined per-dimension cap.

### Why direct economic-share scaling

The validated G1 classification contract already establishes 15% sustained economic share as the minimum Material Overlay threshold.

Once an exposure has valid Material Overlay status, this proposal uses its reviewed economic share directly as a 0–1 scaling factor.

This avoids inventing a second, unsupported materiality breakpoint such as 25%, 40% or 50%.

Examples with all other factors equal:

- 20% economic share has twice the materiality influence of 10%;
- 40% has twice the influence of 20%.

The 15% G1 threshold remains an eligibility boundary, not a special numeric discontinuity inside the formula.

## Candidate evidence-completeness scaling

`evidenceCompleteness` already uses a 0–1 range.

The proposal therefore uses it directly rather than mapping it through another invented band.

Examples:

- 1.00 completeness → 100% of otherwise permitted influence;
- 0.80 completeness → 80%;
- 0.50 completeness → 50%.

However, G7-P1 separately requires the overlay readiness state to be `READY` before any numeric modifier is emitted.

A `PARTIAL` overlay does not receive a second arbitrary readiness multiplier. It remains non-numeric.

This is deliberately fail-closed.

## Candidate confidence factors

The explicit proposal is:

| Confidence | Factor |
|---|---:|
| LOW | 0.50 |
| MEDIUM | 0.75 |
| HIGH | 1.00 |

These are methodology candidates, not empirical facts.

They require owner validation and later second-company review.

The factors preserve monotonicity while ensuring lower-confidence evidence cannot have the same numeric influence as HIGH-confidence evidence.

## Normalized signal

The existing G2 input boundary remains:

`-1 <= normalizedOverlaySignal <= +1`

- negative → downward modifier;
- zero → zero modifier;
- positive → upward modifier.

No modifier can be calculated when the normalized signal is missing.

## Candidate combined per-dimension cap

The proposal uses:

`±10 points on the 0–100 dimension scale`

This is intentionally conservative.

The canonical adaptive plan previously identified ±10–15 as the range that must **not** be independently stacked per overlay. G2 correctly left the exact cap unapproved.

G7-P1 chooses the lower end, 10 points, as the first explicit proposal because:

- Primary must remain the scoring driver;
- Material Overlay is a modifier, not a second score;
- the formula already scales by economic share, completeness and confidence;
- G8 second-company validation can reveal whether the cap is too restrictive or too permissive.

This value is **not claimed to be empirically calibrated**.

It must not become active production methodology merely because it exists in code.

## Combined cap behavior

If future multiple Material Overlays affect one dimension:

```text
combined_modifier = clamp(sum(modifiers), -10, +10)
```

Each overlay does not receive its own independent ±10-point allowance.

## Final dimension bound

After the combined overlay modifier:

```text
final_dimension_score = clamp(primary_dimension_score + combined_modifier, 0, 100)
```

## Readiness behavior

Numeric overlay modifier allowed:

- `READY` → eligible, subject to all G2 inputs and contradiction checks.

Numeric overlay modifier unavailable:

- `PARTIAL`
- `INSUFFICIENT_EVIDENCE`
- `BLOCKED_REVIEW`
- `EMERGING_WATCH`

This avoids hidden readiness scaling.

## Worked candidate example

Assume:

- reviewed economic share = 25%;
- evidence completeness = 0.80;
- evidence confidence = HIGH;
- normalized overlay signal = +0.50;
- overlay readiness = READY.

Then:

```text
10 × 0.25 × 0.80 × 1.00 × 0.50 = +1.00 point
```

This is a modifier of the eligible Primary dimension, not a separate Global Generics score.

## Proposal-only implementation boundary

Contract:

`PHARMA_V1_G7_OVERLAY_NUMERIC_MODIFIER_V1_PROPOSAL`

The code intentionally records:

- `empiricallyCalibrated = false`
- `ownerValidationRequired = true`
- `g71ConsumptionApproved = false`
- `scoreExecutionEnabled = false`
- `persistedScoreRunEnabled = false`

G7.1 must not treat this proposal as approved until G7-P1 validation is explicitly recorded.

## Revisit triggers

The candidate formula/cap must be revisited if G8 or later controlled validation shows:

- the cap frequently binds;
- economically material overlays have negligible influence;
- the modifier overwhelms Primary economics;
- confidence factors produce unstable behavior;
- direct economic-share scaling is not representative;
- different eligible dimensions require demonstrably different caps;
- second-company testing exposes systematic distortion.

Revisit means a separately versioned methodology change.

It does not authorize silent recalibration.

## Non-activation boundary

- production score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- database/schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR merge: **NO**

## Validation required

Before G7-P1 closes:

1. owner visually inspects the two G7-P1 Gate G cards;
2. focused Vitest for `pharmaG7OverlayNumericModifierProposal.test.ts`;
3. focused Vitest for the parent `pharmaOverlayModifierContract.test.ts`;
4. focused ESLint for the new contract/test and workspace panel;
5. `npm run typecheck`;
6. `npm run build`.

Only after that validation should G7-P2 begin.
