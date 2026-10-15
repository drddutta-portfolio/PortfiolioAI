# PortfolioAI Results — Owner-approved 262-equity / eight-quarter plan amendment

**Decision:** Approved 15 October 2026. **Environment:** `PortfolioAI-Development` only. **Status:** Binding plan amendment; **not** a claim that historical data acquisition or the recalculations have already been completed.

## Superseding decision
The owner approved the recommendation that the **Results UI continues showing exactly FOUR quarters**, but that data collection and qualification must provide **FOUR matching prior-year comparison quarters**. The ultimate coverage target expands from the earlier source-qualified 231-equity R5 release cohort to **all 262 distinct portfolio equities (open and closed)**, subject to actual issuer existence, filings and source qualification.

This owner decision **supersedes** the 231-only and "historical YoY is not required" limitations in `PortfolioAI_RESULTS_R5_231_STOCK_SCOPE_FREEZE_2026-10-15.md`. The prior freeze remains in the repository as a historical record; its 231/223 metrics remain labelled an **earlier baseline**, not new release acceptance.

## Displayed quarters: FOUR; historical comparison: FOUR more
The four *displayed* and *graded* results are frozen until explicitly approved roll-forward:
- **Q1 FY27:** 2026-04-01 to 2026-06-30 (prior-year comparison: 2025-04-01 to 2025-06-30).
- **Q4 FY26:** 2026-01-01 to 2026-03-31 (prior-year comparison: 2025-01-01 to 2025-03-31).
- **Q3 FY26:** 2025-10-01 to 2025-12-31 (prior-year comparison: 2024-10-01 to 2024-12-31).
- **Q2 FY26:** 2025-07-01 to 2025-09-30 (prior-year comparison: 2024-07-01 to 2024-09-30).

**Eight distinct financial reporting periods per eligible issuer**; **262 × 8 = 2,096 company-quarter target slots**. This is a theoretical *eligibility-adjusted target*, **not evidence that 2,096 valid historical filings actually exist**. Historic newly listed/demerged businesses may legitimately have no comparable filing; do not invent predecessors.

The 2025 March/June comparison quarters and 2024 September/December comparison quarters **must be stored and qualified for YoY**, but **must NOT be added as columns to the current four-quarter grid**. QoQ continues using the immediately preceding quarter, and YoY uses the exact same quarter one year earlier. Each displayed quarter remains unchanged, including the existing labels, ordering, filters, charts, four detail cards, mobile presentation and evidence disclosures. The existing UI already has QoQ and YoY fields; wire them with accepted data only, not placeholders.

## Updated stage execution and acceptance rules

### R1/R2 — Preserve
The already accepted Results UI shell and detailed panels are unchanged. No redesign, new quarter columns or changes to portfolio holdings, research scoring or accepted presentation.

### R3 — Collect/locate all eight quarters for all 262 identities
- Reconcile all 262 open/closed transaction-linked equity identities; verify company renames, historic ISIN, delistings/demergers and share splits without inventing periods.
- Build an `equity × eight period × metric × source × reporting basis` inventory and exceptions ledger.
- **Reuse first:** existing selected Supabase observations, source records, cached Trendlyne captures and R2 issuer originals; never re-fetch existing sufficient evidence.
- Fetch only genuine gaps via approved providers (Trendlyne entitlement/quota), official issuer/NSE/BSE filings and available prior filings, subject to source access and byte-retention rights. Validate dates and source identity before storing. **Original NSE file bytes must not be newly retained in R2 if rights are unverified.**
- Store immutable large permitted originals/manifests in `portfolioai-history-dev` and compact financial facts, references and selected lineage in Supabase.
- **Acceptance:** independent readback of all 262 identities and per-quarter outcomes: QUALIFIED, PENDING, CONFLICT, NOT_PUBLISHED, NOT_APPLICABLE or MISSING. R3 is not PASS on acquisition counts alone. Do not claim all 2,096 slots are available where issuers did not exist/report.

### R4 — Qualify all four display quarters and four historical baselines
- Extend canonical issuer/original-filing checks to the four prior-year quarters, with identity, quarter start/end, metric contract, INR units, currency, Standalone/Consolidated scope, original source and correction sequence.
- For operating companies Revenue/PAT/diluted EPS; for banks NII/PAT/diluted EPS (and optional suitable bank metrics). Specialised financial intermediaries must use a separately qualified model; do not relabel Revenue and NII.
- Guard stock splits and historical ISIN/share basis especially for diluted EPS; no unadjusted split-affected EPS YoY. Zero/negative baseline => YoY percentage unavailable, not fabricated.
- Select via existing canonical `fundamental_observation_decisions` authority, only when legally retained source/lineage is demonstrable. Preserve unselected originals and exact exception reasons.
- **Acceptance:** independently reconciled 262 × 8 candidate slots with qualified metric trios or a justified non-applicability/unavailable classification. No silent conflicts or cross-scope/source substitutions.

### R5-B/R5-C/R5-E — Recompute, do not redesign
- The accepted R5-B comparator must compute signed QoQ and verified YoY for each of the **four displayed quarters** using the eight-quarter source window; no leakage of quarter retrieval dates into publication truth.
- R5-C industry thresholds and company-only trends remain distinct, versioned and separately sourced; never assign unsupported Strong/Mixed/Weak.
- R5-E must narrate only qualified QoQ/YoY and explicitly say when a comparison is unavailable; never assert an earnings cause or investment-score change.
- Historical comparison quarters are **data-only**, not additional graded/visible matrix quarters. Re-run affected components' acceptance tests after selection changes and record changed/unchanged outputs.

### R5-F/R5-G — Storage/recompute and final UI acceptance
- Deterministic versioned recomputation only on changed qualified input; idempotent repeat execution must yield identical source/selection/output fingerprints, no new original fetches and no duplicate writes. Keep large permitted objects in R2, Supabase compact and inside quotas.
- Reconcile actual authenticated rendered UI at **262 membership / four visible quarters** against the database, including current+closed positions, exact per-cell YoY, grade counts, missing-data disclosure, hover and chart details.
- Compare the **unchanged** dashboard with the owner's approved 100% zoom reference screenshot. R5-G is not PASS solely on HTTP 200, successful build or synthetic tests; retain actual acceptance evidence.

### Daily scan
Preserve the approved daily scan/manual `Scan Now` workflow, detect new original filings or corrections without re-downloading unchanged data, and recompute only changed outcomes; mark RUNNING/PARTIAL/FAILED accurately. The collector must not roll displayed quarter windows forward without a separate approved cutover.

## Current baseline and gap reporting
As of latest Development readback before this amendment: **262 equities total**, **241 have some observed data within the four displayed quarters**, **231 have some source-selected current-window facts**, **223/231 complete all four core quarterly trios**, with **8 stock exceptions and 9 missing display-quarter trios**. These counts do NOT measure full eight-quarter/YoY readiness. Earlier March/June 2025 selection is nearly absent; June 2025 had **zero selected comparison facts**, explaining blank June 2026 YoY. Record new historical quarter coverage through independent readback before claiming the issue fixed.

## Non-negotiable safeguards
- **No UI layout/JSX/CSS changes** unless later separately approved; no extra quarter columns.
- No Production/`main` changes; no V1-4 research or investment-score modifications.
- No retroactive changes to previously accepted audit outcomes; existing R5-A–E engineering PASS relates to earlier frozen scope, and expanded 262/eight-quarter acceptance requires fresh measurements.
- No fictitious financial history, guessed publication dates, scope/metric substitutions or unsupported provider entitlement/retention.
- Daily scan does not prove data exists merely because a stock was "checked".

**Execution state of this document: APPROVED PLAN UPDATED; development/acquisition to satisfy the expanded plan is pending.**


## Owner approval: daily incremental automation is part of R3/R4 completion (15 October 2026)
The owner explicitly accepts completion of **daily incremental quarterly-result automation in parallel with revised R3 and R4**, rather than leaving automation as an indefinite separate future task. This approval updates the execution sequence and acceptance requirements; **it is not evidence that a scheduler or production scanner has already been activated**.

### Approved execution
1. **Single scheduler:** target **07:00 Asia/Kolkata daily** (01:30 UTC), using one appropriately authorized scheduler and a durable execution record; avoid duplicate cron invocations. Preserve the existing manual **Run Scan Now** entry point and enforce the same service-only policy.
2. **Incremental, all 262:** each run reconciles all unique open/closed portfolio equities and their historic identities; discovers new or corrected quarterly filings, using existing Supabase selections, source hashes and R2 evidence before making a provider call. Track the eight-quarter comparison contract, and do not silently promote September 2026 into the approved four visible columns.
3. **Evidence-safe persistence:** newly eligible/changed original filings go through R3 period/identity/metric acquisition and R4 original-source conflict checks. Save permitted large evidence to Cloudflare R2 with object hash/readback, and compact, canonically selected facts to Supabase; do not duplicate source rows or discard older filing versions. Do not archive NSE original bytes without verified rights.
4. **Selective recomputation:** recalculate affected QoQ, source-qualified YoY, R5 grades and insights only when selected facts change. Never turn missing/zero/negative prior-year baselines into invented growth; never modify V1-4 investment scores.
5. **Operational telemetry:** persist started/completed time, request and actual discovered/qualified/selected counts, source IDs/hashes, changed/unchanged/conflicting, provider calls, partial failures, retries, storage references, selected outputs and error details; show last successful run separately from partial/failed runs.
6. **Fail-closed replay:** a lease and idempotency keys prevent concurrent scanner duplication; controlled retries and outage recovery must not misreport success or mutate protected selections.

### Mandatory real-run acceptance before declaring automation PASS
- **New genuine filing:** verify actual discovery, company/date/metric/source validation, R2 and Supabase independent readback, canonical selection and updated Results detail/analysis when applicable. Preserve no-change results for other issuers.
- **Corrected filing:** prove correction detection and source version/revision lineage, safe conflict/quarantine policy, approved winner selection where justified, and changed-only recomputation. Keep the superseded filing available for audit; never treat merely later retrieval as proof of original publication.
- **No-change run:** prove successful scan with **zero redundant provider fetches for already-qualified unchanged material**, zero duplicate facts/selection rows, no changed dashboard metrics and stable checksums.
- **Failure/recovery:** verify partial or failed vendor/source/storage execution is visibly recorded and idempotent retry can recover without duplication or misclassifying completion.
- **Scheduled trigger:** observe at least one real 07:00 IST scheduled invocation and independently reconcile actual run IDs and results; a configured cron expression alone is not acceptance. Manual Scan Now also needs a real run proof.
- **Authentication/security:** only approved service-side jobs can write; quotas, source-retention permissions, Supabase storage budget and security checks pass. The Results UI design must remain exactly as approved.

**Stage boundary:** R3 and R4 remain not fully PASS until required source completeness/exception checks are independently read back; operational scanner PASS is also required before describing the Results page as automatically maintained. R5-F/G are revalidated against the expanded 262-security/eight-quarter data contract. Never describe this planning approval as successful automation execution.
