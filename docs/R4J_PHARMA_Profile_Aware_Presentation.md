# R4J — PHARMA_V1 Profile-Aware Presentation Correction

Status: **REPOSITORY IMPLEMENTATION / NO PRODUCTION DATA CHANGE**

## Purpose

R4J corrects two presentation/readiness problems found after PHARMA_V1 was activated for TORNTPHARM:

1. the generic Research overview still displayed BANK_NBFC-only metrics such as advances growth, deposits growth, Gross NPA and Net NPA for a Pharma security;
2. the operating-margin readiness card counted raw revenue + operating-profit rows rather than matched periods that can actually produce an operating margin.

## Profile-aware Research overview

The compact `Research at a glance` cards now use a shared profile-aware presentation policy.

For `PHARMA_V1`:

- Quality: OPM TTM, ROCE, CFO, ROE;
- Growth: Revenue TTM, PAT TTM, EPS Growth YoY, Diluted EPS;
- Valuation: Market Cap evidence, P/E TTM, P/E historical-context signal;
- Ownership: shared promoter/institutional/pledge evidence.

The Pharma compact view explicitly excludes:

- Gross Advances Growth YoY;
- Deposits Growth YoY;
- Gross NPA Ratio;
- Net NPA Ratio;
- provider Adjusted P/B from the primary Pharma valuation snapshot.

The BANK_NBFC/general snapshot is intentionally unchanged in R4J.

This is presentation policy only. It does not reclassify a security and does not remove evidence from the canonical evidence ledger.

## Matched-period readiness

`PHARMA_OPERATING_MARGIN_HISTORY` now counts matched, verified revenue/profit periods from `buildPharmaCanonicalHistoryView()`.

Therefore eight quarterly revenue rows plus six quarterly operating-profit rows do **not** imply fourteen usable margin observations. If only five period ends overlap, the readiness count is five against the PHARMA_V1 minimum of eight.

The UI label is correspondingly explicit: `Matched evaluable periods`.

Annual operating-revenue readiness likewise reports distinct canonical reviewed periods rather than unrelated snapshots.

## Safety

R4J is repository-only:

- no Supabase migration;
- no provider call;
- no fundamental evidence mutation;
- no score/recommendation/position-sizing write;
- no scheduler change.

R4J should merge first into the long-lived `pharma-research-integration` branch. `main` remains untouched until the complete Pharma research program is satisfactory.
