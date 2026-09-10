# Stage 7.2D.2B.4 — Owner-confirmed manual research refresh

## Objective
Provide a visible, owner-controlled path from refresh planning to live Trendlyne fundamentals execution without weakening the provider safety controls.

## Scope
- Exact existing Cohort A only (25 held equities).
- Fundamentals refresh only through `get_overview_news_corp_events`.
- Existing MATCHED Trendlyne identity is mandatory before any provider call.
- Provider instrument id returned by the response must match the stored identity before canonical writes.
- Fixed five-security waves keep each owner-confirmed action small.
- The PLAN action makes zero provider calls.
- Each EXECUTE_WAVE action requires a browser confirmation plus a server-side owner confirmation token.
- No automatic retry is performed in this stage; every physical provider attempt is accounted once.

## Safety and accounting
The executor checks portfolio ownership, open holdings, equity asset class, matched provider identity, provider ingestion switch, verified quota state, daily internal limit and per-run internal limit. It creates an ingestion run and run items, reserves provider budget, acquires an ingestion lease, records one usage event for every physical Trendlyne tool attempt, settles the reservation and releases the lease.

A successful provider call does not automatically imply accepted canonical data. The provider instrument id and symbol are validated before `fundamental_observations` are written. A semantic or storage rejection is recorded as a failed run item without double-counting the already-successful provider tool attempt.

## UI
Settings → Data Sources / Refresh → Provider Operations now contains `Owner-confirmed manual research refresh`.

The owner first chooses **Plan Cohort A refresh**. The page then shows stocks requiring refresh, planned calls, current and projected daily usage, provider quota status and execution gate state. Live waves are shown only from the server plan. Clicking a wave opens a browser confirmation before execution.

## Non-goals
- No scheduler is enabled.
- No Stage 7.2E broad-universe refresh is enabled.
- No scoring run is created.
- No Core/Satellite role is assigned.
- Angel One remains current-price authority.
