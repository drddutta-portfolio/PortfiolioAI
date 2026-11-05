# R4 explicit statement layouts and durable partial recovery — 5 November 2026

R4 remains partial: the last canonical readback is 2,031 / 2,096 qualified eight-quarter slots, with 47 historical R4 gaps and 18 separately deferred R3 gaps. The local GNG Electronics result described below is not counted as recovered until live independent selection and readback succeed.

## Versioned original-statement extraction

The explicit `NATIVE_STATEMENT_LAYOUT` path runs only after the existing native parser has not qualified a quarter. It recognizes standard English month-first abbreviations, including `Sept 30 2024`, using the printed day and year. Unknown month characters, unreadable years and invalid calendar dates are never corrected; their positions remain unknown. Explicit quarter-group headings continue to exclude annual and cumulative columns. Existing native and OCR receipt modes retain their previous date grammar.

Publisher font boxes can split one physical financial line into an amount-only row and a label row. The new path joins them only when the preceding line has no substantive label, the printed glyph boxes overlap, vertical separation is greater than 2.5 and at most 4.5 points, numeric columns do not collide, and at least two quarter columns establish the row. Coordinates and every financial character remain unchanged. Any core fact using this alignment requires an independent PBT-minus-tax reconciliation. The receipt records the original row positions and geometry proof.

An explicit continuing/discontinued layout may select only a separately printed total PAT. Both printed components must sum to that total, and PBT minus tax must equal the printed continuing PAT. Missing totals or components are not calculated. The versioned optional OCR layout uses the same checks; no COFORGE recovery is claimed. Readable original labels survive when a supplemental label-region render cannot read that row. The existing source, identity, scope, units, complete-trio, business-basis and comparability guards remain intact.

The GNG Electronics September 2024 standalone trio in its retained official NSE Q2 FY26 original passes the full-document issuer/business-basis audit and a fresh independent original/receipt replay. All three local observations qualify, with the existing restated-comparison guard retained. The verified original is prioritized before unproven inventory candidates. No figures were reconstructed or manually inserted.

## Native checkpoint before OCR fallback

Previously, a whole-original worker returned only after its remaining OCR attempts. An OCR timeout could therefore discard complete native results found earlier in that same original. Native proposals are now retained and committed before OCR fallback begins. The native cache is bound to the exact original and requested quarter set. The shared audit remains private in R2; Supabase receives compact facts and provenance. Later OCR work keeps the remaining part of the same 480-second original budget. A timeout does not roll back already committed complete proposals, and the source queue continues. Canonical selection still requires its separate independent replay.

Validation: all 365 Results tests pass. A real three-quarter GNG original run retained its one qualified native slot before a deliberately simulated later OCR failure; its other two slots remained unfilled. A separate fresh original replay admitted all three local core observations. These were local checks, not canonical writes. Full-cohort recovery and a targeted GNG pass are triggered on Development. No UI, database schema, RLS, holdings, main or Production changes.
