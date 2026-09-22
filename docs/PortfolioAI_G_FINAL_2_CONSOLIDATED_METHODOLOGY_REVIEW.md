# PortfolioAI — G-FINAL-2 Consolidated Methodology Review

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** OWNER APPROVED / NOT ACTIVE / POST-FREEZE VALIDATION PENDING  
**Target:** TORNTPHARM / PHARMA_V1 / DOMESTIC_FORMULATIONS

## Purpose

Complete G-FINAL-2 as one stage, without separate G-FINAL-2C/2D/2E checkpoints.

The stage now contains:

- versioned parent-dimension reconciliation;
- TORNTPHARM evidence sufficiency lock;
- numeric methodology for all seven remaining weighted dimensions;
- deterministic evaluators;
- deterministic reference cases;
- read-only G7 adapter compatibility;
- all execution/persistence boundaries kept OFF.

## Seven-dimension methodology candidate

### Capital Efficiency — ROCE

Components:
- Level: 60%
- Stability: 20%
- Trend: 20%

Level bands:
- >=30% => 100
- 25–<30% => 85
- 20–<25% => 70
- 15–<20% => 55
- 10–<15% => 35
- <10% => 15

Stability uses ROCE IQR:
- <3 pp => 100
- 3–<6 => 80
- 6–<10 => 60
- 10–<15 => 40
- >=15 => 20

Trend uses latest minus prior-period median:
- >=5 pp => 100
- 2–<5 => 80
- -2–<2 => 60
- -5–<-2 => 40
- <-5 => 20

### Cash Flow

Components:
- CFO/PAT conversion: 45%
- FCF/PAT conversion: 35%
- Consistency + trend: 20%

CFO/PAT:
- >=1.10 => 100
- 0.90–<1.10 => 85
- 0.75–<0.90 => 70
- 0.60–<0.75 => 55
- 0.40–<0.60 => 35
- <0.40 => 15

FCF/PAT:
- >=1.00 => 100
- 0.80–<1.00 => 85
- 0.60–<0.80 => 70
- 0.40–<0.60 => 55
- 0.20–<0.40 => 35
- <0.20 => 15

Consistency/trend combines:
- positive FCF years out of 3: 60%
- CFO/PAT trend: 40%

Current TORNTPHARM fixture remains fail-closed because only one annual CFO observation is locked.

### Balance Sheet / Credit

Components:
- Net Debt / EBITDA: 50%
- Interest Coverage: 30%
- Leverage Trend / Resilience: 20%

Net Debt / EBITDA:
- <0 => 100
- 0–<0.5 => 90
- 0.5–<1.0 => 80
- 1.0–<1.5 => 65
- 1.5–<2.5 => 45
- 2.5–<3.5 => 25
- >=3.5 => 10

Interest Coverage:
- >=15x => 100
- 10–<15x => 85
- 6–<10x => 70
- 3–<6x => 50
- 1.5–<3x => 30
- <1.5x => 10

Leverage trend scores improving leverage more highly and materially worsening leverage more conservatively.

### Business Durability

Whole-dimension aggregation is now defined from reviewed normalized component scores:

- Brand / Therapy Leadership: 35%
- Field Force Productivity: 25%
- R&D Productivity: 20%
- Pipeline / Corporate Execution: 20%

Raw qualitative evidence is not scored directly. Each component must first be reviewed and normalized under its evidence contract.

### Momentum

Benchmark:
- **NIFTY Pharma**

Components:
- 12M absolute momentum: 40%
- 6M absolute momentum: 25%
- 12M relative strength versus NIFTY Pharma: 35%

No BANK_NBFC weights, NIFTY Bank benchmark, or Trendlyne technical score is inherited.

### Ownership / Governance

Components:
- Ownership Stability: 45%
- Pledge / Control Risk: 35%
- Non-G4 Governance Context: 20%

Rules:
- promoter percentage alone is not a score;
- zero pledge is not automatically the best score;
- events already consumed by G4 cannot reduce this dimension again;
- no hidden governance double counting.

### Risk

Components:
- Regulatory Context: 40%
- 1Y Maximum Drawdown: 35%
- Relative Volatility versus NIFTY Pharma: 25%

The regulatory-context score must come from the canonical governance/regulatory runtime contract completed in G-FINAL-3.

G4/G7-P2 events cannot receive a second hidden penalty inside Risk.

## Benchmark choice

NIFTY Pharma is used only for sector-relative momentum and volatility context. It is the NSE sectoral pharmaceutical index and provides the appropriate Indian pharmaceutical-sector benchmark.

## TORNTPHARM evidence state

Even after methodology freeze, G-FINAL-2 does not manufacture missing evidence.

Current explicit blockers remain:

- Cash Flow — matched three-year CFO history incomplete;
- Business Durability — reviewed component inputs must be locked;
- Momentum — TORNTPHARM market fixture must be locked;
- Ownership / Governance — minimum four-quarter ownership history must be locked;
- Risk — company-wide regulatory scope and market-risk fixture must be locked.

These are evidence blockers, not reasons to invent neutral scores.

## Safety state

- score execution: OFF
- score persistence: OFF
- recommendation: OFF
- position sizing: OFF
- production mutation: NO
- provider refresh: NO
- scheduler change: NO
- deployment: NO
- PR merge: NO
- automatic trading: NO

## Owner freeze decision

The owner explicitly approved the consolidated seven-dimension methodology on 20 September 2026 after the pre-freeze validation passed.

The methodology is now:

- `OWNER_APPROVED_NOT_ACTIVE`;
- linked into the TORNTPHARM read-only methodology lineage;
- non-persisting;
- non-recommending;
- non-sizing;
- still fail-closed where evidence is incomplete.

## Final closure condition

Only the post-freeze validation remains. Once the focused tests, TypeScript, architecture checks, build, and `git diff --check` pass:

> **G-FINAL-2 = COMPLETE / PASS**

No further G-FINAL-2 lettered checkpoints are required.
