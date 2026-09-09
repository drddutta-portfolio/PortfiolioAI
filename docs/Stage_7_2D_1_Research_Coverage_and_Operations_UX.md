# Stage 7.2D.1 — Research Coverage and Operations UX

**Implementation status:** Code complete on review branch; production deployment not implied by this document.

## Scope

Stage 7.2D.1 adds portfolio-wide research coverage and safe provider-operations visibility without widening the accepted Stage 7.2B Cohort A provider execution boundary.

### Research Coverage

`/app/research` is now a cache-only coverage workspace for current holdings. It reads existing RLS-protected portfolio and research evidence and shows:

- overall research state;
- Trendlyne provider-identity state;
- fundamental coverage;
- aggregate-ownership coverage;
- valuation coverage;
- research-document coverage;
- conflict and review-required counts;
- latest retained evidence timestamp;
- portfolio role, theme, sector, market-cap category and equity eligibility context.

Supported filters include search, overall state, role, theme, sector, market-cap category, equity eligibility and provider-identity state. Opening the page, filtering, sorting by the browser's table semantics, or navigating to company research does not invoke a provider refresh.

Coverage states are explicit: `FRESH`, `STALE`, `MISSING`, `CONFLICTING`, `REVIEW_REQUIRED`, and `NOT_APPLICABLE`. Non-equity assets are not reported as missing Trendlyne equity research. Matched provider identity uses the same 180-day freshness window already accepted by the Stage 7.2B cohort planner.

`PBV_ADJUSTED_PROVIDER` remains a provider-adjusted P/B metric. Its `CONFLICTING` evidence status remains visible in valuation and overall coverage; it is not relabelled or silently converted to generic P/B.

### Settings → Data Sources / Refresh

`/app/settings/data-sources` reads the existing authenticated `get_provider_operational_summary_v1` RPC and exposes only its safe operational projection:

- ingestion enabled/disabled state;
- scheduler enabled/disabled state;
- daily internal observed usage, limit and remaining units;
- rolling internal observed usage, limit and remaining units;
- active reservations and orchestrations;
- last successful and failed run timestamps;
- latest safe failure code;
- operational utilization state;
- policy version;
- actual provider quota status.

The UI explicitly distinguishes PortfolioAI's internal safety budgets from the provider's contractual quota. The contractual quota remains `UNKNOWN` unless independently verified.

## Deliberate boundary

The live `refresh-security-enrichment` function still requires the exact owner-approved 25-security Cohort A for `REFRESH_COHORT`. Stage 7.2D.1 does **not** remove or relax this guard.

Therefore this slice does not yet expose an arbitrary per-security or portfolio-wide manual provider refresh action. Doing so against the current endpoint would either fail safely or require widening the Stage 7.2B production boundary, which belongs behind a separate review gate.

The next Stage 7.2D slice should design the owner-confirmed refresh request and conservative cost-estimation contract without authorizing Cohort B or general scheduled refresh. It must preserve atomic reservation, provider/domain leases, strict identity reconciliation, immutable evidence retention, usage accounting, cleanup, and the kill switch.

## Database and provider impact

- No database migration is introduced by Stage 7.2D.1.
- No Supabase migration is applied.
- No provider control is mutated from the browser.
- No provider refresh endpoint is called by the new read paths.
- No transaction, holding, accounting, broker-account, role, theme, asset-class or Angel One price data is changed.
- No document body is persisted.

## Implementation files

- `src/features/research/researchCoverage.ts`
- `src/features/research/researchCoverage.test.ts`
- `src/features/research/researchCoverage.css`
- `src/features/research/useResearchCoverage.ts`
- `src/data/researchCoverageRepository.ts`
- `src/pages/ResearchCoveragePage.tsx`
- `src/pages/DataSourcesPage.tsx`
- `src/routes/AppRoutes.tsx`
- `src/components/AppShell.tsx`
- `src/main.tsx`

## Validation expectations before merge/deployment

The branch should pass the existing repository gates:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run lint:edge`
- `npm run test:edge`
- `npm run build`
- `git diff --check`

Stage 7.2D.1 adds deterministic unit coverage for adjusted-P/B conflict propagation, the 180-day provider-identity freshness boundary, review-required documents and ETF/non-equity applicability. No production provider call is required for validation.
