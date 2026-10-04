## P8 Step 1 existing-evidence reconciliation — 5 October 2026

**Bounded audit = COMPLETE. Step 1 successful acceptance = BLOCKED.**
**Exact disposition: `STEP1_CANARY_VALIDATION_BLOCKED_INSUFFICIENT_EXISTING_HISTORY`.**

This reconciliation supersedes the earlier inference that zero PostgreSQL adjusted-series rows mean missing canonical market evidence. The frozen B3 R2 identity/storage contract requires that legacy SQL table to remain empty. Canonical adjusted series and decision ledgers reside in R2. Their 29 November 2024 partitions were independently listed; identity-specific 252-day history was **not measured** because the available connector returns binary Parquet as UTF-8 text. No price-history absence is claimed from the SQL count.

For the one routed Steel case (`19f21fe6-46c9-5f26-9ee5-6207558ba10b`, ISIN `INE230R01035`, decision 29 November 2024), the complete Workstream-D filing index contains 10 entries: 8 before the decision and 2 after it. The 8 pre-decision entries represent **6 distinct XML bodies**. All six bodies were read from R2 and their SHA-256 hashes independently verified.

Their complete context and explicit reporting-period inventories contain FY2024, the March/June/September 2024 quarters and the April–September 2024 half-year. They contain **one distinct consolidated annual reporting year**, FY2024. Consolidated and standalone filings for that year, and duplicate source bodies, do not supply additional annual observations. No earlier comparative reporting periods were found in these inspected XML bodies.

The locked `METALS_COMMODITIES_K4A_METHODOLOGY_V1` requires five annual fundamental years and twelve cycle/margin quarters. The inspected evidence cannot satisfy the five-year prerequisite. Creating normalization code cannot recover absent years; no signals or scores were fabricated and no requirement was relaxed.

Prior integration reports retain two classifications and one Steel route. Those route counts were not independently rerun here. The prior Python canary runner assigned routes by identity and hard-coded zero market rows; its repeat fingerprint does not independently measure routing or market coverage. This audit explicitly separates prior implementation results from newly measured source inventory.

Detailed evidence: [reconciliation audit](PortfolioAI_P8_STEP1_EXISTING_EVIDENCE_RECONCILIATION_2026-10-05.json).

**Step 2 remains NOT STARTED.** This is a bounded blocker for the routed case and inspected evidence, not proof that all 25,761 candidates or historical validation are infeasible. Existing approvals and frozen V1/V3/crosswalk contracts remain unchanged.

No provider calls, new acquisition, Supabase/R2 writes, migrations, deployments, population expansion, experiment execution, B5/B6/B-FINAL rebuild, P8-C or outcome inspection occurred.

### Verification and remaining boundary

All six source body hashes matched the filing index. Temporal filtering excluded both future index entries. Seven focused tests passed. Python syntax compilation passed, and the corrected canary runner executed successfully. Tests verify deduplication, distinct annual consolidated periods, accounting-scope separation, insufficient history and the rule that empty legacy SQL storage cannot establish absent R2 history. No application code changed, so application build/type/lint checks were not repeated.

The successful Step 1 PASS requested cannot be produced from the inspected evidence. The current existing-evidence path stops with a documented history blocker. Completing market decoding would resolve a separate unknown but cannot supply the missing financial years. Any broader diagnostic cohort or source-acquisition proposal must be separately scoped; no nested recovery task is started automatically.
