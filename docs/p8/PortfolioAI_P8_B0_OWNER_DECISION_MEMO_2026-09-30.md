# PortfolioAI P8-B0 owner decision memo

Date: 30 September 2026  
Environment: PortfolioAI Development only  
Source plan: `docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md`  
P8 gate: **BLOCKED — DATA FOUNDATION**

## 1. Re-entry result

P8-B0 re-entry is reproducible and no material drift invalidates P8-A. The Development repository is at the handoff commit `4567bc7d7d82259d852b3a51e3c356701d9072d1`, PortfolioAI Dev is healthy, and the core P8-A blockers reproduce read-only.

No provider call, migration, database write, deployment, Production change or `main` change was made by P8-B0.

## 2. Recommended frozen first experiment

The following is the recommended owner contract to authorize P8-B1. It deliberately favors auditability and bias control over maximum coverage.

| Decision | Recommended frozen choice |
| --- | --- |
| Universe | Historically eligible NSE-listed equities under official NSE listing/delisting authority; never current holdings projected backward |
| Experiment window | Target 36 monthly decisions ending 30 Sep 2026; minimum 24 proven monthly decisions. If fewer than 24 are provable, stop rather than weaken the gate |
| Decision calendar | Last eligible NSE trading session of each month, evaluated after market close in Asia/Kolkata |
| Primary horizon | 6-month forward total return |
| Secondary horizons | 1, 3 and 12 months where outcome windows are complete |
| Signal lag | An input first becomes eligible at the first decision instant strictly after its provable publication/availability time |
| Primary benchmark | NIFTY 500 Total Return Index from an approved dated authority; price-only history cannot silently substitute |
| Secondary benchmark | Historical sector total-return benchmark only when point-in-time classification and benchmark mapping are both proven |
| Currency | INR |
| Corporate actions | Official NSE/company corporate-action evidence; raw OHLCV remains immutable and adjusted series is derived/versioned deterministically |
| Fundamentals | Trendlyne structured history where licensed/available, cross-checked or publication-dated by official exchange/company evidence; unknown publication time is ineligible |
| Documents | Official NSE/BSE/company filings with provable publication time and immutable source identity; Google Drive remains archive, not calculation authority |
| Missing data | Fail closed per security/date/requirement; no cross-security imputation, no unknown-to-zero conversion |
| Classification | Historical sector/industry/basic-industry/subprofile requires dated evidence; current classification cannot be backdated |
| Methodology | Freeze a P8 methodology version derived from approved R6–R10 contracts; no threshold change after outcomes are inspected |
| Split | Chronological 60% development / 20% validation / 20% untouched holdout |
| Multiple testing | All tested variants remain disclosed; no winning variant may replace the frozen primary experiment without a new version |
| Brokerage | Primary experiment models zero broker commission for delivery only if that broker rule is valid for the simulated date; otherwise dated broker schedule is required |
| Statutory charges | Use dated, auditable statutory/exchange charge schedules by trade date; never apply one timeless current tax rate backward |
| Base slippage | 10 basis points per executed side, frozen before replay |
| Liquidity gate | Simulated order notional may not exceed 5% of trailing 20-session median traded value; otherwise that execution is blocked or clipped by the frozen portfolio-construction rule, never silently filled |
| Turnover | Report gross and net turnover every rebalance; costs apply to actual simulated traded notional |
| Zero-cost sensitivity | Allowed only as a separately labelled sensitivity, never the primary result |
| Provider execution | No provider calls in P8-B1. Later acquisition requires a dry-run manifest, separate owner approval and bounded campaign |
| Proposed Trendlyne campaign ceiling | 320 planned internal attempts/day with 80 reserved for bounded retries/diagnostics; each provider-backed stage still requires explicit owner approval before execution |
| Migration policy | Additive local migration design/testing may be separately authorized stage-by-stage; every hosted PortfolioAI Dev migration requires a separate explicit approval |
| P8-C | Not authorized until P8-B-FINAL passes and the owner separately approves transition |

## 3. Stable identifiers to create in P8-B1

If approved, P8-B1 will define versioned immutable identifiers for:

- `experiment_id`
- `methodology_version`
- `universe_version`
- `classification_version`
- `benchmark_version`
- `cost_model_version`
- decision calendar version
- exclusion-reason registry version
- deterministic contract fingerprint

The contract will also freeze the point-in-time predicate, forward-window boundary rule, permitted metrics, prohibited claims, holdout rules and the prohibition on automatic promotion into live policy.

## 4. What approval authorizes

Approval of this memo authorizes **P8-B1 only**: repository/local implementation of the pure TypeScript experiment and bias-control contract, tests and documentation.

It does **not** authorize:

- provider acquisition;
- creation or application of a database migration;
- hosted Development database writes;
- P8-B2 data acquisition;
- P8-C replay;
- portfolio simulation;
- performance claims;
- Production or `main` changes.

If later P8-B stages require schema or provider work, they return for the separate approvals required by the handoff plan.

## 5. Approval text

> Approve the P8-B0 owner decision memo and authorize P8-B1 repository/local implementation of the frozen experiment and bias-control contract exactly as documented. No provider calls, migrations, hosted database writes, P8-C replay, Production or main changes are authorized. Stop at the P8-B1 owner-review boundary.
