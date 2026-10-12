# PORTFOLIOAI — OWNER DIRECTIVE
## Smart Research Execution Amendment and Accelerated Banking V1-4 Completion

**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Development branch:** Continue from the actual authorized Development working branch and PR #124  
**Development Supabase:** `lrgpjimipfkyoqbpsqzz`  
**Objective:** Accelerate research development, automate financial calculations and evidence qualification, reduce unnecessary engineering complexity, and complete Banking V1-4 without compromising investment research accuracy.

### 1. Owner's strategic decision

I am approving a change in PortfolioAI's development approach.

The current architecture is robust, but research implementation has become unnecessarily slow and complicated. Too much engineering effort is being spent on individual evidence approvals, repeated source investigations, procedural barriers and infrastructure work rather than delivering usable, accurate financial research.

**PortfolioAI must become a calculation-first, evidence-driven, automated research platform.**

The governing principle is:

**Automate everything that can be verified reliably. Escalate only matters requiring genuine human judgment. Preserve financial integrity without imposing unnecessary procedural restrictions.**

This directive authorizes an incremental execution improvement, not a complete architectural rewrite or an automatic relaxation of existing investment eligibility standards.

### 2. Protect all previous development

Before implementing changes, identify and preserve the actual current baseline.

Do not discard or reset:

- Existing 248 portfolio holdings and transactions.
- Sector and industry classifications and industry-specific methodologies.
- BANK V2 research methodology, scoring and factor weights.
- Existing canonical evidence and accepted reviews.
- Approved historical point-in-time evidence.
- Development Supabase data and schemas.
- Cloudflare R2 archives.
- Trendlyne and Angel One integrations.
- Completed development stages and verified acceptance results.
- Existing regression tests and production baseline.

Specifically preserve KVB's accepted 1.93% annual ROA and the five market-history requirements independently confirmed as FRESH.

Its verified selected snapshot was:

`2af15b91-4924-4baf-ab1b-c91d62b095dc`

At that snapshot KVB had only three remaining mandatory blockers:

`NIM_TTM`, `PE_TTM_RELATIVE`, `PB_RELATIVE`.

Read the live canonical state again before execution; do not assume this snapshot remains the latest.

**No destructive migration, baseline reset, Production change, main-branch merge or V1-5 expansion is authorized.**

### 3. Introduce a reusable smart research pipeline

Implement improvements incrementally within the existing architecture.

The desired workflow is:

**Identify missing evidence → Acquire source once → Extract all relevant facts → Normalize → Calculate approved metrics → Validate automatically → Persist canonically → Update research results.**

The same financial document should support multiple research metrics where appropriate.

Do not repeatedly download, parse or review the same original filing separately for every requirement.

The pipeline must support:

1. Source discovery and acquisition.
2. Original document preservation and deduplication.
3. Extraction of multiple financial observations from each source.
4. Accounting-period and reporting-scope normalization.
5. Corporate-action and share-basis normalization.
6. Deterministic calculation of approved metrics.
7. Publication-aware historical valuation.
8. Automated evidence qualification.
9. Authorized batch admission and canonical readback.
10. Clear reporting of remaining genuine blockers.

Reuse existing services wherever possible. Do not create a second competing canonical evidence engine.

### 4. Calculation-first, not source-exact-wording-first

When a research metric is required, first check whether it is directly available from a qualified source.

If it is unavailable, determine whether it can be calculated accurately from verified underlying financial inputs using an already approved methodology.

Examples:

**NIM TTM:** Evaluate verified net interest income, earning assets, averaging conventions and the applicable trailing period. Do not average quarterly NIM percentages or use annual NIM as an automatic TTM substitute.

**Historical P/E:** Calculate using eligible historical prices and EPS information actually available at the respective historical evaluation dates.

**Historical P/B:** Calculate using eligible historical prices, book values and properly reconciled share counts and corporate actions.

For any calculation method not already approved, produce one precise, narrowly scoped methodology amendment with formulas, assumptions, test cases and reconciliation evidence. Seek the necessary owner approval once, then make that approved calculation reusable across the relevant banks.

**Do not repeatedly block routine calculations merely because an issuer has not published a ratio under an identical label.**

Equally, do not activate an unapproved formula or fabricate inputs.

### 5. Automate routine evidence verification

Human owner approval should be reserved for:

- Materially conflicting original evidence.
- Unresolved financial or accounting interpretation.
- Changes to investment methodology.
- Genuinely discretionary judgments.
- Security-sensitive actions requiring explicit authentication under the current contract.

For routine evidence with reliable provenance, valid numerical extraction, correct accounting periods and approved methodology, create an automated qualification path under the existing security model.

Preserve all required authentication, source provenance, RLS, grants and immutable audit records.

If changing a currently mandatory owner-review or admission contract is necessary, prepare one minimal explicit amendment for approval rather than bypassing the control.

Do not ask for repeated approvals of already accepted evidence.

### 6. Separate research availability from recommendation eligibility

Introduce or prepare an additive research-status model with three distinct meanings:

**Research Available:** Reliable facts and partial analysis can be displayed.

**Quantitative Assessment Available:** Approved calculations and validated factor coverage support meaningful quantitative comparison.

**Recommendation Eligible / READY:** All mandatory decision requirements pass the approved investment criteria.

Missing information should be visible with precise reasons.

A stock should not disappear from research pages simply because one mandatory recommendation factor is unavailable.

However, partial research must not be presented as an approved investment recommendation.

Do not change the existing strict Banking V1-4 READY acceptance gate without separate explicit approval.

If this UI/status enhancement risks delaying current Banking V1-4 completion, defer its broader implementation while continuing the core research execution improvements.

### 7. Optimize authorized data acquisition

My authorization for discretionary research acquisition remains:

- **Trendlyne:** Up to 1,000 calls per day, subject to actual provider entitlement.
- **Angel One:** No additional owner-imposed daily numerical limit, while respecting provider-enforced restrictions and safe operational controls.
- **Internet sources:** Official NSE, BSE, RBI, bank investor-relations disclosures, annual reports, financial filings, rating agencies and legally permitted scraping.

Use existing data first, then acquire only genuinely missing or outdated inputs.

Batch research by evidence type rather than independently repeating identical source acquisition for every bank.

Record provider usage accurately.

The separately approved **14-history-call daily scheduled maintenance limit remains unchanged**. Do not conflate discretionary historical research with scheduled maintenance execution.

### 8. Apply the smarter approach immediately to Banking V1-4

Do not start another broad planning or infrastructure programme.

Prioritize the following executable work.

**Priority A — Complete the three remaining KVB requirements**

Resolve NIM TTM and historical PIT P/E and P/B through reusable, source-backed financial calculations and evidence qualification.

Use previously captured historical prices and corporate actions wherever valid.

Aim for KVB's first independently verified persisted READY selection.

**Priority B — Resolve the other 12 banks in parallel**

Reuse the existing financial filings and accepted evidence.

Automate qualification and calculation across the complete frozen 13-bank population.

Do not create 12 separate implementations of the same financial metric.

**Priority C — Complete Gate B operational acceptance**

Finish and test the atomic daily maintenance-session lease, calendar guard, provider accounting, duplicate prevention and failure handling.

Independently verify a genuine eligible scheduled OPEN-session execution.

**Priority D — Close Banking V1-4**

Gate A requires 13/13 READY with frozen READY value reconciled to ₹2,05,138.62.

Gate B requires actual proven operational maintenance acceptance.

Do not report either gate PASS based solely on tests, UI displays or prospective results.

### 9. Change engineering priorities

Effective immediately:

**Prefer the smallest reusable implementation that produces correct, persisted research results.**

Avoid unnecessary:

- New gates and sub-gates.
- Duplicated evidence ledgers.
- Repeated general audits.
- Re-acquisition of already qualified sources.
- One-off stock-specific calculation engines.
- Unrelated infrastructure refactoring.
- Large speculative architecture programmes.
- Long status-only investigations.

Security controls, deterministic correctness, publication-aware historical validity, provider restrictions and regression tests must remain intact.

Do not remove safeguards simply to make blocker counts appear lower.

When an architecture improvement is proposed, demonstrate which real blocker it resolves or which repeated operation it eliminates.

### 10. Measure actual speed and effectiveness

Establish a lightweight baseline and measure progress using:

- Mandatory blockers resolved.
- Newly FRESH requirements.
- Banks becoming READY.
- Valid financial observations admitted.
- Time taken to process a bank or evidence batch.
- Duplicate source acquisitions avoided.
- API calls per accepted observation.
- Number of manual owner approvals required.
- Regression failures and financial calculation discrepancies.

Compare the improved workflow with the current approach.

The goal is materially faster research delivery with **no degradation in numerical accuracy, provenance, historical validity or investment methodology compliance**.

Do not claim a speed improvement until actual before/after measurements support it.

### 11. Execute rather than only propose

You have authority to implement additive, backward-compatible Development improvements under the existing repository and deployment controls.

Do not stop after producing an architecture proposal.

Proceed with the immediately authorized code changes, tests, source reuse, financial data acquisition and canonical validation.

Where a genuine methodology or security-policy decision is required, isolate that specific decision, present one concrete recommendation and continue all independent work.

Do not require fresh general authorization for ordinary Development research acquisition.

After every substantive batch, provide:

- Actual completed changes.
- New FRESH requirements and persisted snapshot IDs.
- Before/after mandatory blocker count.
- API calls used.
- Reused versus newly acquired evidence.
- Verification and regression results.
- Remaining genuine blockers.
- Next executable actions.

### 12. Final owner instruction

**The objective is to make PortfolioAI faster, smarter, scalable and operationally useful—not less rigorous.**

Preserve the considerable investment already made in its research models, classifications, historical archives, data integrations, canonical evidence and completed engineering work.

Do not rewrite PortfolioAI.

Do not restart previously completed stages.

Do not sacrifice correct investment research.

Do not allow improvements to become another long-running programme that delays Banking V1-4.

**Implement the smarter execution model incrementally, use it to finish Banking V1-4, and demonstrate its effectiveness through independently verified results.**

Proceed from the actual current Development state.