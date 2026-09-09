# Stage 7.2D.2A — Refresh Planning and Owner Confirmation

**Status:** Approved implementation plan; zero-provider-execution slice

## 1. Documents reviewed before planning

This plan was created only after reviewing the repository documentation hierarchy and the relevant current authorities:

1. `PortfolioAI_Master_Blueprint.md`
2. `PortfolioAI_Research_and_Intelligence_Architecture.md`
3. `PortfolioAI_Database_Architecture.md`
4. `PortfolioAI_Development_Rules.md`
5. `PortfolioAI_Product_UI_and_Decision_Workflow.md`
6. `PortfolioAI_Development_Status.md`
7. `PortfolioAI_Requirements_Register.md`
8. `Owner_Reviewed_Stage_7_2_Production_Fundamental_Intelligence_and_Research_Workspace_Plan.md`
9. `Stage_7_2D_1_Research_Coverage_and_Operations_UX.md`

The repository documentation map makes these authorities explicit. Stage-specific implementation must not silently redefine the canonical architecture.

## 2. Purpose

Stage 7.2D.2A adds an owner-facing research refresh **planning** workflow:

- select one or more eligible open equity holdings from Research Coverage;
- ask PortfolioAI to derive stale/missing research domains from cached evidence;
- calculate the same conservative physical-call plan used by the server-side cohort planner;
- show base calls, retry reserve, worst-case attempts, batch fit, daily budget impact and domain skips;
- require explicit owner acknowledgement before any later execution can be considered;
- keep live provider execution disabled in this slice.

This stage does not authorize Cohort B, Cohort C, general portfolio rollout, scheduled refresh, Stage 8 scoring or investment recommendations.

## 3. Architectural constraints

The following are non-negotiable:

- Normal Research page load, filtering, sorting, selection and navigation remain cache-only.
- Planning may occur only after an explicit owner action such as `Estimate refresh`.
- Planning must perform zero Trendlyne/MCP calls, zero provider-budget reservation, zero provider-usage accounting and zero ingestion-run creation.
- The estimator must reuse the server-side `planCohort` / `planSecurity` logic rather than reproduce a second independent call-count formula in the browser.
- The existing exact 25-security Cohort A execution guard remains unchanged.
- A planning request may validate a smaller arbitrary selection of owner-held open equities, but it must never become executable through the new action in this slice.
- ETFs and all other non-equities are ineligible for equity research refresh planning.
- Provider contractual quota remains `UNKNOWN`; only PortfolioAI internal safety budgets and observed usage may be shown.
- Adjusted provider P/B remains a distinct conflicting provider metric and never becomes generic P/B.
- Angel One remains current-price authority.

## 4. Backend contract

Add a new Edge action dedicated to planning, tentatively `PLAN_RESEARCH_REFRESH`.

The action must:

1. authenticate the user;
2. validate portfolio ownership;
3. accept a bounded explicit list of security IDs;
4. verify every security is an open holding in that portfolio;
5. verify every security is canonical `EQUITY`;
6. accept at most three explicit document-discovery security IDs, all within the selected set;
7. load cached Trendlyne identity, fundamental/ownership freshness and document-discovery evidence;
8. load current provider safety-control and observed daily-usage state;
9. build `CohortSecurityState` values;
10. call the existing `planCohort` function;
11. return only a sanitized plan DTO;
12. return `executionAllowed: false` and a safe gate reason for Stage 7.2D.2A;
13. return before MCP client construction, budget reservation, lease acquisition, run creation or any provider call.

The existing `REFRESH_COHORT` execution action and exact Cohort A validation must not be weakened.

## 5. Planning DTO

The browser needs only safe planning information:

- selected security count;
- per-security symbol and planned domain state (`REQUIRED`, `SKIPPED_FRESH`, `NOT_APPROVED`);
- planned physical operations;
- base calls per security;
- total base calls;
- retry reserve;
- worst-case attempts;
- logical batches and reserved attempts;
- observed daily usage;
- projected daily usage;
- daily internal limit and remaining units;
- per-run internal limit;
- whether the plan fits internal safety limits;
- provider quota status (`UNKNOWN` unless independently verified);
- `providerCalls: 0` for the planning request itself;
- `executionAllowed: false`;
- a stable safe reason code explaining that execution remains gated.

No provider payload, credentials, request headers or raw provider responses may be returned.

## 6. UI workflow

### Research Coverage

Add row selection only for eligible equities.

Owner flow:

1. Select one or more eligible equities.
2. Click **Estimate refresh**.
3. PortfolioAI calls only the planning action.
4. Open a review panel/modal showing:
   - selected holdings;
   - fresh domains that will be skipped;
   - stale/missing domains that would require work;
   - base calls;
   - retry reserve;
   - worst-case attempts;
   - batch plan;
   - internal daily usage before/after;
   - provider quota status;
   - explicit statement that estimating consumed zero provider calls.
5. Owner checks an acknowledgement such as **I reviewed this estimate**.
6. The final execution control remains disabled and clearly labelled **Execution not enabled in Stage 7.2D.2A**.

Selection, acknowledgement and closing the panel must not mutate provider controls or research evidence.

## 7. Document discovery

Documents are separately expensive and remain narrow.

- Default planning excludes document discovery.
- The owner may optionally include document discovery for no more than three selected equities.
- The plan must show the extra `DOCUMENT_SEARCH` operation explicitly.
- Document identities remain provisional/review-required unless separately verified.

## 8. Safety and failure behavior

Planning must fail safely for:

- unauthenticated session;
- portfolio mismatch;
- security not held/open;
- non-equity asset;
- empty or oversized selection;
- document scope above three;
- unavailable provider control state;
- planner per-run/daily-limit rejection;
- malformed cached evidence.

Errors exposed to the browser must be safe operational messages/codes.

A failed planning request consumes no provider attempt and creates no provider reservation.

## 9. Tests

### Pure planner tests

Existing cohort planner tests remain authoritative for physical call calculation.

Add/extend coverage for:

- all domains fresh → zero calls;
- missing identity + fundamentals + ownership → shared overview plus identity search and ownership operation;
- documents add only the explicit document operation;
- document scope above three rejected;
- non-equity rejected;
- daily/per-run overflow rejected;
- retry reserve remains bounded.

### Edge contract tests

Prove that `PLAN_RESEARCH_REFRESH`:

- is authenticated;
- validates owner/open/equity scope;
- invokes the same planner;
- returns safe estimate fields;
- does not instantiate/use the MCP client;
- does not reserve budget;
- does not acquire an execution lease;
- does not create an ingestion run;
- returns zero provider calls;
- leaves `REFRESH_COHORT` exact-Cohort-A execution guard unchanged.

### UI tests

Prove that:

- ETF/non-equity rows cannot be selected for refresh planning;
- filtering or selection alone triggers no planning request;
- `Estimate refresh` is the explicit trigger;
- estimated calls and skips render clearly;
- provider contractual quota is not mislabelled;
- owner acknowledgement does not execute a refresh;
- execution remains disabled.

## 10. Schema and deployment impact

No database migration is planned for Stage 7.2D.2A because Stage 7.2A already provides the control and operational summary objects required for estimation.

Expected code surfaces:

- `supabase/functions/_shared/enrichment.ts`
- `supabase/functions/refresh-security-enrichment/index.ts`
- relevant Edge tests
- `src/data/researchCoverageRepository.ts`
- research refresh planning types/hook/components
- `src/pages/ResearchCoveragePage.tsx`
- coverage CSS/tests
- `PortfolioAI_Development_Status.md`
- `PortfolioAI_Requirements_Register.md`

The Edge Function must not be deployed to production merely by merging application code. Deployment remains a separately verified operational step.

## 11. Acceptance gate

Stage 7.2D.2A is merge-ready only when:

- application Vitest passes;
- Edge Vitest passes;
- TypeScript passes;
- application ESLint passes;
- Edge ESLint passes;
- production build passes;
- `git diff --check` passes;
- no database migration exists;
- no provider-call execution path is widened;
- manual planning demonstrably consumes zero provider attempts;
- Cohort A execution semantics remain unchanged;
- documentation/status/requirements are synchronized.

Only after owner review of this completed planning workflow may Stage 7.2D.2B propose enabling a narrowly scoped confirmed manual execution path.