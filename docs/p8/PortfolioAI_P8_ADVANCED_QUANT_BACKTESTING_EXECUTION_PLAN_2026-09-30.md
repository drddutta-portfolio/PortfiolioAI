# PortfolioAI P8 — Advanced Quant / Backtesting execution plan

Date: 30 September 2026  
Environment: Development only  
Authority: Owner Checkpoint 6 approved; P8 entry authorized  
Production/main: unchanged

## Purpose

P8 evaluates whether PortfolioAI's deterministic methodology and portfolio rules have historically useful behaviour. It does not create a second live scoring authority, change R6–R10 policy, mutate owner settings, size positions, or create orders.

The Master Blueprint permits P8 only after sufficient point-in-time history exists. Every simulated decision must use only evidence demonstrably available at that instant. Current holdings, later-restated fundamentals, later provider revisions, and later classifications must never be projected backward.

## Canonical sequence and stop/go checkpoints

### P8-0 — Entry freeze and readiness surface

- close Owner Checkpoint 6;
- freeze the point-in-time eligibility contract;
- expose read-only readiness and blockers in Development UI;
- prohibit performance claims while the data gate is blocked.

**Go condition:** contract tests, architecture guard, build, and browser verification pass.  
**Stop:** P8-A data inventory.

### P8-A — Historical data sufficiency inventory

Read-only inventory by security/date/domain:

- historical daily OHLCV and benchmark coverage;
- corporate-action/adjustment authority;
- fundamental periods, publication times, retrieval times, and immutable source identity;
- document publication history;
- classification/methodology/assignment validity intervals;
- historical portfolio or eligible-universe membership;
- score/recommendation/action run history;
- delisted/inactive securities required to prevent survivorship bias.

**Go condition:** the owner approves the eligible universe, decision calendar, minimum history depth, benchmark policy, costs, and missing-data policy.  
**Stop:** P8-B experiment contract.

### P8-B — Experiment and bias-control contract

Freeze:

- hypothesis and methodology version;
- rebalance/decision dates;
- eligibility and exclusion rules;
- forward return horizons;
- benchmark and currency;
- transaction-cost, liquidity, slippage and turnover assumptions;
- corporate-action treatment;
- training/validation/holdout periods;
- multiple-testing and sensitivity reporting;
- deterministic run identity and reproducibility fingerprint.

No result may be promoted into live policy at this stage.

### P8-C — Deterministic replay engine

Implement a pure engine that:

- selects only point-in-time eligible evidence;
- reconstructs the historical universe;
- runs the frozen historical methodology;
- separates signal date from outcome window;
- records exclusions and blockers rather than imputing missing evidence;
- produces identical output for identical inputs.

### P8-D — Portfolio simulation and benchmarks

Add portfolio construction only after single-security replay passes. Apply approved constraints, transaction costs, turnover, liquidity and benchmark contracts. Equity and ETF policies remain separate.

### P8-E — Validation and adversarial review

Test look-ahead leakage, survivorship, stale/revised evidence, delistings, missing periods, corporate actions, benchmark gaps, extreme costs, threshold instability, and replay determinism. Report sensitivity and failure regions—not only a headline return.

### P8-F — Results UI and interpretation

Show methodology/version, coverage, exclusions, confidence, benchmark, drawdown, turnover, costs, sensitivity and limitations. AI may explain deterministic results but cannot calculate or alter them.

### P8-FINAL — Owner checkpoint

Owner decides whether evidence supports a separately versioned methodology proposal. P8 completion alone never changes current live policy or authorizes Production.

## Initial entry finding

The P7 close state has 239 canonical current equity snapshots but zero executed numeric R6 scores and zero R7 candidacies. It contains no valid historical series of canonical R6–R10 decision states and no approved historical eligible-universe reconstruction. Consequently, performance backtesting is currently **BLOCKED — DATA FOUNDATION**.

P8-0 may proceed because it creates the eligibility contract and visible readiness boundary. P8-C onward may not begin until P8-A and P8-B pass.
