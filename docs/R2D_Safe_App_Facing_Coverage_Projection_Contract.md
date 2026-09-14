# R2D — Safe App-Facing Coverage Projection Contract

Status: **DESIGN CONTRACT COMPLETE / PRODUCTION IMPLEMENTATION NOT APPLIED**

R2D defines how the PortfolioAI application may consume the R2 Portfolio Coverage Registry without weakening existing RLS or exposing service-side provider-control data directly to the browser.

## 1. Goal

Expose a read-only, owner-scoped snapshot of cached coverage facts for the current portfolio so the application can run the deterministic R2A/R2B projection and summary logic.

R2D must not:

- call Trendlyne, Angel One, NSE, OpenAI, or any external provider;
- reserve or consume provider budget;
- mutate research evidence;
- create score/recommendation/sizing rows;
- change holdings, roles, themes, targets, or transactions;
- broaden browser grants on provider-control tables;
- expose service-role credentials;
- infer or fabricate missing research evidence.

## 2. Security boundary

Some R2 inputs such as `security_refresh_states` are intentionally service-side/cache-control truth and are not browser-readable today.

R2D must therefore use an authenticated server-side boundary:

1. require a valid user JWT;
2. resolve the authenticated user with Supabase Auth;
3. verify that `portfolio_id` belongs to that user;
4. read cached evidence with the service role inside the server-side function only;
5. return only the minimum normalized coverage facts needed by R2;
6. perform no writes.

The browser must never receive the service-role key and must not receive direct access to control-plane tables merely for R2 rendering.

## 3. Proposed API

Suggested Edge Function name:

`portfolio-coverage-registry`

Request:

```json
{
  "portfolioId": "<uuid>"
}
```

Response envelope:

```json
{
  "registryVersion": "PORTFOLIO_COVERAGE_V1",
  "generatedAt": "<timestamp>",
  "providerCalls": 0,
  "budgetConsumed": 0,
  "records": []
}
```

The endpoint is read-only and may return cached facts for all current open holdings in the authenticated user's portfolio.

## 4. Minimum per-security facts

Each response record should contain only facts needed by `projectPortfolioCoverageV1` or its repository adapter:

### Portfolio/security identity

- `portfolioId`
- `securityId`
- `symbol`
- `assetClass`
- whether the holding is currently open

### Classification evidence

From `current_security_enrichment_v1`:

- sector
- industry
- market-cap category
- enrichment state
- enrichment `fresh_until`

These values are the shared application classification authority used by Dashboard → Allocation & performance. R2D must return them unchanged.

Do not use null `securities.sector_id/industry_id` as the current authority while the reviewed enrichment layer is the active classification source.

### Identity coverage

Return only a normalized identity state:

- `FRESH`
- `MISSING`
- `CONFLICTING`
- `REVIEW_REQUIRED`

The endpoint may derive this from cached security identity evidence / refresh state, but should not expose raw provider payloads.

### Fundamentals coverage

Return normalized cached coverage metadata, not the full fundamental dataset:

- evidence present / absent
- current cache freshness state where safely derivable
- whether unresolved conflict/review state is known
- latest `fresh_until`
- `next_eligible_refresh_at` only when sourced from the approved refresh-state cache

Presence of historical fundamental rows is not sufficient to claim profile readiness.

### Ownership coverage

Return normalized ownership coverage/freshness metadata only.

### Documents coverage

Return:

- document count or presence
- latest relevant document timestamp
- normalized current document coverage state

Do not return document bodies in this endpoint.

### Market-history coverage

Return compact aggregate metadata only:

- provider code
- candle count
- first candle date
- latest candle date
- normalized freshness/readiness state

Do **not** return all OHLCV rows through R2D.

### Research/scoring profile metadata

Return reviewed scoring-profile assignment metadata separately from research-profile readiness:

- assigned scoring profile code
- assignment status
- assignment basis

The endpoint must not convert a scoring assignment into `RESEARCH_PROFILE = READY`.

### Score lineage

Return latest persisted `stock_score_runs` metadata when present:

- score run id
- scoring profile
- run state
- evidence coverage
- evidence confidence
- as-of date

If no persisted score run exists, return null/missing. Do not reconstruct a persisted run from UI calculations.

### Recommendation lineage

Return latest persisted recommendation metadata when present:

- recommendation run id
- source score run id
- run state
- transition status
- score-ready coverage
- evidence confidence

A `PREVIEW` row with `source_score_run_id = null` must not be represented as canonical score-linked READY lineage.

### Position-sizing persistence

Return whether the R1 `position_sizing_assessments` persistence contract exists/has an assessment only after the production migration is explicitly approved and applied.

Until then, R2 should report sizing persistence as unavailable.

## 5. Application classification is shared, not remapped

R2D must preserve the exact sector, industry and market-cap classification already supplied by `current_security_enrichment_v1`.

There is no second user-visible R2 sector taxonomy.

`mapSectorToPortfolioAiV1` may propose an internal research-profile family, but it must not rewrite, merge or rename the application sector. For example:

- `Banking` remains `Banking`;
- `Financial Services` remains `Financial Services`;
- `Pharma` remains `Pharma`;
- `Healthcare` remains `Healthcare`.

The same security must show the same classification on Dashboard, Holdings, Portfolio Structure, Research Coverage, Research and future decision surfaces.

A future classification correction must be applied once in the shared classification/enrichment layer and then propagate everywhere. Page-specific classification copies or independent market-cap bucketing are not permitted.

Research-profile grouping remains separate from application sector classification.

## 6. Research-profile readiness remains fail-closed

R2D may expose reviewed scoring-profile assignments and cached sector evidence, but the R2 application layer must keep research-profile readiness separate.

Current rule:

- HDFCBANK is the genuine bank reference case for architecture/pilot reporting.
- Non-bank scoring assignments do not automatically become approved sector-research profiles.
- Unsupported profiles remain `PROFILE_PENDING` until R4 validates their mandatory metrics, sources, history, freshness, and scoring semantics.

## 7. Aggregate query requirement

The server-side implementation should aggregate coverage in SQL or another bounded server-side form rather than transferring large evidence sets to the client.

In particular, market history should be reduced server-side to per-security counts / first / latest dates. A future portfolio-wide five-year history store could contain hundreds of thousands of rows, so returning raw candles merely to calculate R2 coverage is not acceptable.

## 8. Implementation choices

Preferred implementation order:

1. **Reviewed owner-scoped SQL/RPC or security-invoker projection** that produces compact per-security coverage facts, if it can be secured cleanly.
2. Authenticated Edge Function using service role internally, if control-plane tables cannot safely participate in an authenticated security-invoker SQL projection.

Whichever path is selected must preserve portfolio ownership checks and minimum-data exposure.

Do not solve access problems by granting authenticated/anon broad access to `security_refresh_states`, provider budgets, usage events, ingestion controls, leases, or other control-plane tables.

## 9. Verification gate

Before production deployment/application, R2D must prove:

1. valid owner can read own portfolio registry;
2. another user's portfolio id is rejected;
3. unauthenticated call is rejected;
4. no external provider call occurs;
5. no provider-budget row changes;
6. no evidence/recommendation/sizing row changes;
7. only open holdings are returned;
8. ETF/non-equity rows remain eligible for `NOT_APPLICABLE` treatment;
9. HDFCBANK preview history is not misrepresented as persisted score lineage;
10. response contains compact market-history aggregates, not raw candles;
11. sector/industry/market-cap values match `current_security_enrichment_v1` exactly;
12. Dashboard, Holdings, Portfolio Structure, Research Coverage and Research display the same classification for the same security;
13. R2 deterministic tests remain green;
14. repository typecheck/lint/build remain green.

## 10. Production approval gate

Creating/deploying the R2D server-side projection is a production change.

Therefore this contract may be merged as repository documentation/code architecture, but **no SQL object, grant, policy, Edge Function deployment, or production configuration change may be applied without explicit owner approval for that action**.

## 11. Completion vocabulary

When this document and the R2A–R2C repository work are merged, it is valid to say:

- `R2 COVERAGE CONTRACT COMPLETE`
- `R2C READ-ONLY COVERAGE BASELINE COMPLETE`

It is not yet valid to say:

- `R2 PRODUCTION INTEGRATION COMPLETE`
- `R2 AUTOMATION COMPLETE`
- `PORTFOLIO-WIDE RESEARCH COMPLETE`
- `PORTFOLIO-WIDE SCORING COMPLETE`
