# BANK V1-4 — D1 and D2 exact owner decision package

**Date:** 2026-10-10
**Branch:** `codex/banking-source-remediation`
**PR:** #124
**Environment:** PortfolioAI Development only
**Status:** OWNER DECISION REQUIRED. Nothing in this document activates D1 or D2.

## D1 — BANK_NBFC_STAGE_8_BANK_V2 methodology change

### Exact decision

Approve a new versioned methodology `BANK_NBFC_STAGE_8_BANK_V2` that **removes the mandatory `PB_ADJUSTED_FOR_ROE` requirement** from the BANK valuation dimension.

V1 valuation weights are preserved historically as:

- M7 `PE_TTM_RELATIVE`: 60%
- M5 `PB_RELATIVE`: 25%
- M6 `PB_ADJUSTED_FOR_ROE`: 15%

V2 removes M6 and redistributes the 85 surviving percentage points proportionally:

- M7 = 60/85 = **12/17 = 70.5882352941%**
- M5 = 25/85 = **5/17 = 29.4117647059%**
- M6 = **0%**

No other score dimension, threshold, release criterion, frozen-bank identity, evidence rule or portfolio role changes through D1.

### Exact requirement mapping

| Methodology | M5 `PB_RELATIVE` | M6 `PB_ADJUSTED_FOR_ROE` | M7 `PE_TTM_RELATIVE` |
| --- | --- | --- | --- |
| `BANK_NBFC_STAGE_8_BANK_V1` | required, 25% valuation | **required, 15% valuation** | required, 60% valuation |
| proposed `BANK_NBFC_STAGE_8_BANK_V2` | **required, 5/17 valuation** | **removed from V2 required set** | **required, 12/17 valuation** |

M5 and M7 remain independently mandatory. D1 **does not** waive their historical point-in-time evidence requirements and cannot make a bank READY when M5 or M7 is unqualified.

### Before / after valuation-score examples

These are deterministic examples only, not current bank scores.

**Example A — weak M6 had depressed V1 valuation**
- M7 score = 80
- M5 score = 60
- M6 score = 40
- V1 valuation = `0.60×80 + 0.25×60 + 0.15×40 = 69.00`
- V2 valuation = `(12/17)×80 + (5/17)×60 = 74.117647`

**Example B — strong M6 had supported V1 valuation**
- M7 score = 40
- M5 score = 80
- M6 score = 100
- V1 valuation = `0.60×40 + 0.25×80 + 0.15×100 = 59.00`
- V2 valuation = `(12/17)×40 + (5/17)×80 = 51.764706`

**Example C — equal surviving factor scores**
- M7 = 70, M5 = 70, M6 = any value
- V2 valuation = exactly 70 because `12/17 + 5/17 = 1`.
- V1 may differ according to M6; this demonstrates that the change is a genuine versioned methodology change, not a bookkeeping normalization.

### Preserved V1 history

D1 must be implemented append-only/versioned:

1. Existing V1 snapshots, selections, scores and requirement items stay immutable and reproducible under `BANK_NBFC_STAGE_8_BANK_V1`.
2. No historical V1 snapshot is relabelled as V2.
3. V2 requires a new methodology/profile version and new evaluation lineage.
4. Any V1/V2 comparison must use one common source cutoff per bank and report threshold/rank changes.
5. Current M5/M7 evidence blockers remain blockers in V2.

### Owner decision requested

**D1 APPROVE** = authorize implementation/testing of the above V2 requirement/weight mapping.

**D1 REJECT** = retain V1 unchanged, leaving M6 mandatory and blocked.

No D1 activation occurs without explicit owner approval after this package.

---

## D2 — publication precision / proven-availability amendment

### Exact decision

Approve a narrow change to the single existing canonical factual reviewer so that publication precision is preserved explicitly while current factual review may use conservative **proven-availability** bounds.

The amendment supports three distinct cases:

### A. EXACT publication timestamp

- Preserve the existing exact-timestamp pathway.
- `published_at` contains the exact issuer/exchange timestamp.
- Earliest availability is that exact instant.
- Existing source hash, identity, period, scope, cutoff, review and freshness rules continue unchanged.

### B. DATE_ONLY publication proof

- Keep `published_at = NULL`; do **not** invent a clock time.
- Persist explicit precision metadata such as:
  - `publication_precision = DATE_ONLY`
  - `publication_date = YYYY-MM-DD`
  - exact provenance URL / immutable source hash
  - verification timestamp
- For **current factual review only**, derive a conservative earliest usable bound of **23:59:59.999 Asia/Kolkata on the proven publication date**.
- A same-day evaluation before that bound cannot use the fact.
- If a later exact timestamp for the same exact document/version is proven, append/supersede the precision evidence; do not rewrite history.

### C. UNKNOWN publication date, verified original bytes

- Keep `published_at = NULL`.
- Persist:
  - `publication_precision = UNKNOWN`
  - `first_verified_available_at`
  - immutable original source SHA-256
  - retrieval/source identity
- For **current factual review only**, the fact may be considered no earlier than `first_verified_available_at`.
- Retrieval is evidence that the exact bytes were available by that time; it is **not** an issuer publication claim.

### Explicit exclusions

D2 does **not** authorize any of the following:

1. No inference that a DATE_ONLY or UNKNOWN source was available before its conservative proven-availability bound.
2. No historical valuation observation may use a fact before its individually proven point-in-time availability.
3. No look-ahead filling of M5/M7 historical BVPS, EPS, P/E or P/B series.
4. No reset or extension of the approved 150/550 reporting-age clocks from retrieval or precision verification.
5. No renewal of source freshness simply because old bytes were re-downloaded.
6. No substitution of PDF CreationDate, HTTP Last-Modified, directory listing time or retrieval time for issuer publication.
7. No second READY engine or duplicate reviewer.
8. No automatic factual ACCEPT: all existing metric/source/scope/period/review controls still apply.

### Effect if approved

D2 can make currently retained exact original issuer documents **eligible for current factual review** where all other controls pass, even when exact issuer publication time is unavailable. It does not itself ACCEPT a numeric fact and does not make any bank READY.

### Owner decision requested

**D2 APPROVE** = authorize integration/testing of the above DATE_ONLY and UNKNOWN current-review precision rules in the single canonical reviewer.

**D2 REJECT** = retain the existing exact-`published_at` admission requirement.

No D2 activation occurs without explicit owner approval.
