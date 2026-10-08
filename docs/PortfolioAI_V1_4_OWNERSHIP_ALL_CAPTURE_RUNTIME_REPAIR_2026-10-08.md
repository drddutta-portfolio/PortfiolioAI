# V1-4 ownership: all-retained-capture canonical path repair — 2026-10-08

**Branch:** PortfolioAI-Development. **Code commit:** `8a4b5dfeacc804df35da2cb2e3630ea96faee44e`. **Status:** repository implementation committed, untested in full workspace, NOT DEPLOYED. V1-4 remains NOT PROVEN.

## Proven integration defect

`projectCachedRecords` in `supabase/functions/p7-ic2-materialize-readiness/index.ts` already reprojects raw Trendlyne `COMPLETE_RESEARCH_OWNERSHIP` captures whose cached `p7_ic2_ownership_history` is missing. However, the V1-4 ownership requirement branch used `records.find(...)` and evaluated only the **first** matching capture. It could label a series missing even when another eligible retained source had it. This is a source-selection defect, independent of the source-denominator problem.

A read-only Development query confirmed the previously described 39 item-linked missing-series cases all have the requested `Promoter` or `Institutional` heading in the original raw response, and all 39 lack the cached projection. At least one (JUBLPHARMA) also has a separate retained normalized capture of six matching quarters. Therefore these cases must not be authorized for a blanket paid re-acquisition without executing the true reprojected path.

## Repository repair

The existing canonical `requirementItem` ownership branch now iterates **all retained ownership records loaded under the existing source cutoff**. It attaches record IDs, retrieved dates, versioned validation findings and source count in the result. It returns `REVIEW_REQUIRED` and `NO_SELECTION`, never silently picking the first or most recent record as an approved historical revision. Qualifying chart data is still `OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN` until exact denominator, dated periods, conflict selection and governance review satisfy the canonical contract.

The previously added regression fixture was corrected in commit `7c69f0ffae308909eceee3b9a89c514a66dc5f1e` to use actual newline separators in the raw chart, not textual backslash-n sequences.

## Verification and side-effects

Checked the current Development source by authenticated GitHub connector; direct container `git ls-remote` still fails DNS resolution. The complete repository, dependency tree and executable handler environment were not available, so full TypeScript, Vitest, architecture, Edge, Deno and build tests **were not run**; no full code PASS is claimed. The existing read-only selected-snapshot report is not an executed post-repair Deno handler run. No provider calls, R2 writes, DB writes, migrations, deployment or production change occurred.

## Remaining exact gates

1. Run full code checks and authenticated `P7_IC3_VALIDATE_CANONICAL_INPUTS` dry-run at the **tested and deployed** Development code version, all 115 fixed members, with owner session and no grant consumption.
2. Prove total-equity denominator and dated source-quarter identity for selected provider fields; verify historical revision precedence and review-ledger authority.
3. Accept no candidate automatically from a raw chart or percentage range.
4. Complete all other V1-4 numeric, documentary, benchmark and history-proof gates. Frozen 111 release minimum remains >=100 identical READY members and >=119,327,127 paise.

This record does not authorize Development deployment or live data writes.