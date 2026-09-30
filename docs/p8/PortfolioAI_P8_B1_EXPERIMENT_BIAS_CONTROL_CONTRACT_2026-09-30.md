# PortfolioAI P8-B1 frozen experiment and bias-control contract

Date: 30 September 2026  
Environment: Development only  
Contract version: `P8_EXPERIMENT_BIAS_CONTROL_V1`  
Authority: owner-approved P8-B0 decision memo  
Implementation: `src/features/backtesting/p8ExperimentContract.ts`

## Status

**IMPLEMENTED / READY FOR OWNER REVIEW**

This stage freezes the bounded first P8 experiment before any historical acquisition, replay or outcome inspection. It creates no database object and does not call a provider.

## Frozen experiment

- Universe: historically eligible NSE-listed equities under official dated listing/delisting authority; current holdings may never be projected backward.
- Observation window: 1 October 2023 through 30 September 2026.
- Decision cadence: monthly, last eligible NSE trading session, after market close, Asia/Kolkata.
- Target: 36 monthly decision dates; minimum 24 proven decision dates. Failure to prove 24 stops the experiment.
- Signal lag: an input is eligible only at the first decision instant **strictly after** both provable publication and availability. Equality at the decision instant is ineligible.
- Primary outcome: six-month total return.
- Secondary outcomes: one, three and twelve months when complete.
- Primary benchmark: NIFTY 500 Total Return Index from an approved dated authority. Price-only history cannot substitute silently.
- Sector benchmark: historical sector total-return series only when both point-in-time classification and benchmark mapping are proven.
- Currency: INR.
- Corporate actions: official NSE/company evidence; raw OHLCV is immutable and adjusted series must be derived/versioned deterministically.
- Missing evidence: fail closed per security/date/requirement; no cross-security imputation and no unknown-to-zero conversion.
- Historical classification/methodology/assignment: no backdating without dated evidence.
- Split: chronological 60% development / 20% validation / 20% untouched holdout using the frozen integer rounding rule.
- Multiple testing: all variants disclosed; any result-affecting contract change creates a new experiment version; the original holdout remains immutable.
- Costs: dated broker and statutory schedules, 10 bps base slippage per executed side, 20-session median traded-value liquidity lookback, maximum simulated order share 5%, gross and net turnover reported.
- Zero-cost output: sensitivity only, never the primary claim.
- Provider execution: prohibited in P8-B1. Future acquisition remains cache-first, bounded and owner-approved.
- Live policy: no automatic promotion, no live-policy mutation, no performance claim before P8-B-FINAL.

## Stable version identities

- `experiment_id = P8_EXP_NSE_MONTHLY_6M_V1`
- `methodology_version = P8_R6_R10_REPLAY_V1`
- `universe_version = P8_NSE_HISTORICAL_UNIVERSE_V1`
- `classification_version = P8_HISTORICAL_CLASSIFICATION_V1`
- `benchmark_version = P8_NIFTY500_TRI_V1`
- `cost_model_version = P8_COST_MODEL_V1`
- `decision_calendar_version = P8_MONTH_END_IST_V1`
- `exclusion_registry_version = P8_EXCLUSION_REGISTRY_V1`

## Deterministic controls

The TypeScript contract provides:

1. a stable canonical serializer;
2. a SHA-256 reproducibility fingerprint;
3. strict before/equal/after publication-and-availability boundary evaluation;
4. deterministic chronological split boundaries;
5. a versioned exclusion-reason registry;
6. explicit governance prohibitions against outcome-driven live-policy mutation.

The Stage-0 point-in-time eligibility contract remains preserved. P8-B1 strengthens the experiment-level signal-lag rule without rewriting the historical Stage-0 contract.

## Architecture impact

No canonical live PortfolioAI business fact is changed. This contract governs a future historical experiment only. It does not create a competing source for transactions, prices, classifications, scores, recommendations or canonical actions.

No database migration, RLS change, Edge Function, hosted write or UI behavior is part of P8-B1.

## P8-B1 exit

P8-B1 implementation is ready for owner review. Owner approval is required before P8-B2 can begin.

P8-B2 is the historical universe and listing-validity foundation. If schema persistence is required there, migration creation and hosted application remain separately approval-gated exactly as required by the P8 completion plan.
