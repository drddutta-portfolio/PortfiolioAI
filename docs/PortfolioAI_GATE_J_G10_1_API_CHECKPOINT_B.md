# PortfolioAI — Gate J / G10.1 Checkpoint B: API/Bulk Methodology, Score & Recommendation

**Date:** 21 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Stage:** G10.1 — Checkpoint B
**Status:** COMPLETE / PASS

## Locked classification input

```text
Reference = ALIVUS
Primary = API_BULK_DRUGS
Material Overlay = none
Emerging Watch = CDMO_CRAMS
Effective date = 2026-03-31
```

Checkpoint A is closed and cannot be revised because of the score/recommendation produced here.

## Methodology shape

One PHARMA_V1 engine remains in force. G10.1 supplies API/Bulk interpretation inside the common ten dimensions; it does not create a separate stock engine.

The Checkpoint B candidate uses:

- eight-quarter EBITDA margin level/stability/trend for Quality;
- four-quarter revenue growth level/consistency/trend for Growth;
- five-year ROICE level/Type-7 IQR/trend for Capital Efficiency;
- three matched annual PAT/FCF/capex periods for Cash Flow;
- net-cash persistence and credit resilience;
- API-specific durability evidence;
- API cycle-aware valuation;
- NIFTY Pharma-relative momentum;
- reviewed ownership/governance;
- API regulatory/customer/pricing-cycle risk.

## Deterministic candidate result

```text
QUALITY                 94.00
GROWTH                  69.25
CAPITAL_EFFICIENCY      84.00
CASH_FLOW               70.75
BALANCE_SHEET_CREDIT    95.00
BUSINESS_DURABILITY     83.00
VALUATION               35.00
MOMENTUM               100.00
OWNERSHIP_GOVERNANCE    75.00
RISK                     69.00

Overall                 76.7225
```

The unchanged Gate I recommendation policy resolves:

```text
Suggested role = SATELLITE_CANDIDATE
Valuation caution = VALUATION_BELOW_NEUTRAL_ANCHOR
CDMO Emerging Watch = CONTEXT_ONLY_NUMERICALLY_EXCLUDED
```

## Safety

- read-only score;
- no score row persisted;
- no recommendation row persisted;
- no weight guidance;
- no action bias;
- no position sizing;
- no AI interpretation;
- no second CDMO score;
- no production mutation.

## Local proof

After pulling the branch:

```bash
bash scripts/r4n/run-alivus-g10-1-local-reviewed-assignment.sh
npm run dev
```

Open ALIVUS → Research → Overview.

The Gate J block immediately before Research Health must show the Checkpoint A lock plus Checkpoint B score/recommendation.

After owner visual approval run:

```bash
bash scripts/g10-1-validate-api-checkpoint-b.sh
```

## Exit condition

G10.1 closes only after:

- owner visual PASS;
- consolidated Checkpoint B validation PASS;
- cumulative HANDOFF final closure entry.

G10.2 must not start before that closure.


## Final validation and closure

The owner reported the consolidated local validator:

`bash scripts/g10-1-validate-api-checkpoint-b.sh`

**ALL PASS**.

The final validated result is:

```text
ALIVUS score = 76.7225
Gate I role = SATELLITE_CANDIDATE
Valuation caution = YES
CDMO Emerging numeric participation = NO
Score persistence = OFF
Recommendation persistence = OFF
Weight guidance = OFF
Action bias = OFF
Position sizing = OFF
AI interpretation = OFF
```

The localhost visual review also passed before this validation.

### G10.1 closure

```text
G10.1 Checkpoint A = COMPLETE / PASS
G10.1 Checkpoint B = COMPLETE / PASS
G10.1 = COMPLETE / PASS
API_BULK_DRUGS reference architecture = COMPLETE
Reference company = ALIVUS
```

G10.2 / Global Generics is the next stage. AUROPHARMA remains the locked reference and its current fail-closed state is preserved until G10.2 genuinely completes the missing methodology.
