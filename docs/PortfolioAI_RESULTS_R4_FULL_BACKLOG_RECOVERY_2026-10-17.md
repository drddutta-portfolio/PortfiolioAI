# R4 full-backlog recovery — 17 October 2026

Status: PARTIAL. The historical backlog is not complete.

The independent Development eight-quarter readback at 23:44 IST (18:14 UTC) verified 2,008 of 2,096 company-quarter slots across 262 equities. Historical R4 gaps fell from 81 to 70 during this recovery. The 18 deferred R3 slots remain separate. The aggregate unresolved classification is 79 missing and 9 conflicting slots. The latest qualification selected LG Electronics India’s March 2025 quarter, created three decisions, preserved all 6,074 existing decisions and found zero protected-selection conflicts.

## Completed full-cohort work

- Established a reusable private source inventory and per-slot gap ledger. Both successful and rejected originals remain reusable; a rejected parser output no longer hides the original PDF from later passes.
- Completed a pass over all 75 historical gaps remaining after the initial six recoveries. That pass ingested five complete, source-backed trios and independently selected three more company-quarters.
- Added exact, explicitly dated historical PDF columns, including vertically split dates, two-digit named-month years, explicit three-month headings, and original monetary units. Annual and cumulative columns are rejected. Unreadable unselected dates retain their physical position without receiving an invented date.
- Kept complete period profit separate from continuing/discontinued-operation components and attribution rows. Accounting checks include explicitly reported earlier-year tax adjustments when the total tax row is unavailable.
- Bound issuer identity to canonical BSE code/ISIN, exact legal name, immutable original bytes, and retained identity evidence. Single-word legal issuer names and source-pinned official name changes are supported without ticker-only admission.
- Extended discovery to original historical publication windows as well as later comparative filings. Original downloads retain the existing 12 MB default; the historical collector explicitly permits at most 32 MB. Originals stay in private Development R2.
- Repaired missing PDF-verifier runtime dependencies and updated the bounded-download regression assertion. The independent validation workflow passed architecture, type checking, application/edge lint, build, targeted source/retry tests and whitespace checks before the latest OCR extension.

## Active full-backlog continuation

A separately bounded eight-shard OCR sweep processes every remaining historical slot. It scans each complete original at 150 DPI for business-basis warnings, requires matching financial cells at a recorded approved pair of distinct resolutions (300/450, 200/400 or 350/500 DPI), and requires the profit/tax equality. A separate verifier reopens the original and repeats the full-document scan and both financial renders before creating selections. Original native quarter/annual group labels may supplement a ruling-line-obscured OCR heading; date and financial cells remain independently rendered. All target quarters are inspected from shared page renders, rather than rendering the same page separately for each quarter. A failing original is retained and the next original/quarter is attempted. Per-original timeouts, immutable caches and private rejection audits preserve progress between passes.

The ten-minute controller now includes signed-statement and dated-OCR recovery in its source rotation. Monitoring does not mean making fresh provider calls every ten minutes: source retries retain cooldowns, cached originals and duplicate-run checks. Original PDF/OCR text, financial traces and per-issuer diagnostics are not uploaded as public workflow artifacts.

Restated comparatives, pro-forma/carve-out statements, contradictory full trios and unresolved identity/date/unit/scope evidence stay unresolved. There is no annual-minus-YTD reconstruction, zero substitution, issuer-vote selection, automatic latest-value override, or share/EPS rebasing. An actual reported quarter must be proven before a gap closes.

## Original-scope proof and full-backlog retry — 17 October 2026

The recovery now tries Tesseract table and sparse-text segmentation modes (6 and 11), as well as the default mode, against recorded approved pairs of rendering resolutions. Dates and financial cells must still match independently, with the same profit/tax equality. Failed originals remain isolated; parser-versioned private caches and per-run audit identifiers show attempted work even when coverage does not improve.

A new, narrowly typed scope proof handles an original PDF table whose reporting scope is omitted. It requires an independent original NSE filing with the exact issuer/ISIN, scope, current-quarter trio, common board date, and the same explicit note naming the requested historical quarter. Historical figures come solely from the original dated BSE PDF cells. Both originals and their hashes remain private in Development R2; a separate source verifier replays the proof before selection. Synthetic exact-original tests cover altered financial cells, wrong issuer, unrelated notes, restatement and undeclared proof rejection.

Equal-valued additional filings now preserve accepted observation IDs. Contradictory financial values still quarantine the quarter, and the transaction-wide protected-selection guard remains in place. The ten-minute controller includes the same-statement review/qualification pass in its source rotation.

Validation: [full application and source checks](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39056948817) passed architecture, TypeScript, application/edge lint, build, financial replay/retry regressions and whitespace checks. The [same-statement full-backlog run](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39056662341) attempted all 71 historical slots and ingested one three-metric candidate; the independent verifier then replayed 3,976 immutable sources, selected the LG Electronics India March 2025 trio and confirmed the 2,008/2,096 coverage above. The [eight-shard OCR sweep](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39054527921) continues across the entire backlog. No UI files were changed by this recovery.

## Authority and scope

Canonical financial observations and decisions remain `fundamental_observations` and `fundamental_observation_decisions`, with source lineage in `data_source_records` and immutable originals/manifests in private Development R2. These historical facts establish current-display evidence only, not historical point-in-time authority or investment-score authority.

All work targets `PortfolioAI-Development`, Development Supabase and the Development R2 bucket. No UI changes, schema/migrations, Auth/RLS changes, holdings/transaction edits, `main` updates or Production changes are part of this recovery. Concurrent R5 work is preserved when updating shared verifier code.

Remaining work: finish the running full-backlog OCR/source sweeps, inspect every rejection, recover additional explicitly supported quarters, rerun the complete protected selection/readback, and record the verified final count. Do not label R4 complete merely because a workflow exits successfully.
