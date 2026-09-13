# PortfolioAI Documentation Map

**Purpose:** This file is the navigation map for the `docs/` folder. It explains which document is authoritative for which question and prevents stage plans, completion reports, and architecture documents from being confused with one another.

**Repository rule:** Only the GitHub repository connected to the PortfolioAI Project folder is canonical for this project.

---

## 1. If you want to know...

| Question | Read this document |
| --- | --- |
| What is PortfolioAI ultimately supposed to become? | `PortfolioAI_Master_Blueprint.md` |
| Where does each stock-research or market metric come from, and who calculates it? | `PortfolioAI_Research_and_Intelligence_Architecture.md` |
| How is data stored, related, secured, versioned, and traced? | `PortfolioAI_Database_Architecture.md` |
| What should the application screens and workflows look like? | `PortfolioAI_Product_UI_and_Decision_Workflow.md` |
| What engineering, security, testing, and calculation rules must Codex follow? | `PortfolioAI_Development_Rules.md` |
| What is actually complete, live, incomplete, or next? | `PortfolioAI_Development_Status.md` |
| Which requirements have been requested and whether they are satisfied? | `PortfolioAI_Requirements_Register.md` |
| What is the approved integration/execution sequence from the current implementation state? | `PortfolioAI_Integration_and_Execution_Plan.md` |
| What happened in an old implementation stage? | Read the relevant `Stage_*` or `*_Completion.md` record |

---

## 2. Canonical document hierarchy

When documents appear to conflict, use this order of authority unless the owner explicitly approves a newer replacement:

1. `PortfolioAI_Master_Blueprint.md`
2. `PortfolioAI_Research_and_Intelligence_Architecture.md` for source ownership, derived metrics, scoring lineage, and intelligence boundaries
3. `PortfolioAI_Database_Architecture.md`
4. `PortfolioAI_Development_Rules.md`
5. `PortfolioAI_Product_UI_and_Decision_Workflow.md`
6. `PortfolioAI_Development_Status.md`
7. `PortfolioAI_Requirements_Register.md`
8. Stage-specific plans, execution plans, and completion records

`PortfolioAI_Integration_and_Execution_Plan.md` is the current repository-governed execution roadmap. It coordinates sequencing from the present implementation state, but remains subordinate to the canonical architecture above and does not silently redefine it.

A stage-specific plan may define how a particular stage is implemented, but it must not silently redefine the global architecture.

---

## 3. Document classes

### A. Canonical / living architecture

These are the documents developers should consult routinely:

- `PortfolioAI_Master_Blueprint.md`
- `PortfolioAI_Research_and_Intelligence_Architecture.md`
- `PortfolioAI_Database_Architecture.md`
- `PortfolioAI_Product_UI_and_Decision_Workflow.md`
- `PortfolioAI_Development_Rules.md`
- `PortfolioAI_Development_Status.md`
- `PortfolioAI_Requirements_Register.md`

### B. Stage-specific and execution plans

These explain how bounded work should be implemented. They are authoritative only within their approved boundary and remain subordinate to canonical architecture.

Examples:

- `PortfolioAI_Integration_and_Execution_Plan.md`
- `Owner_Reviewed_Stage_7_2_Production_Fundamental_Intelligence_and_Research_Workspace_Plan.md`
- other future `Stage_*_Plan.md` documents

### C. Stage implementation / completion records

These are historical records of what was done, tested, deployed, and committed. They are valuable audit history, but they are not the global product specification.

Examples:

- `Stage_4_Market_Data.md`
- `Stage_5_1_Transaction_Management_Completion.md`
- `Stage_6_ETF_Classification_Audit.md`
- `Stage_7_2A_Provider_Control_Plane_Completion.md`
- `Stage_7_2B_Controlled_Cohort_A_Completion.md`
- `Stage_7_2C_Research_Workspace_Completion.md`

### D. Historical / superseded planning material

If a document becomes superseded, do not delete it unless specifically approved. Mark it clearly as historical and point to the replacement authority.

---

## 4. Current research, intelligence, and execution map

The intended architectural separation remains:

- **Stage 7.1C — Trusted Trendlyne pilot** — complete
- **Stage 7.2A — Provider quota/control/freshness/kill-switch foundation** — complete
- **Stage 7.2B — Controlled Cohort A rollout** — complete
- **Stage 7.2C / 7.2C.1 — Research Workspace and investor-first refinement** — complete
- **Stage 7.2D–F — broader research coverage/operations/scheduling** — not portfolio-wide complete; remaining work is absorbed into the R3/R4/R11 sequence in the Integration & Execution Plan
- **Stage 7.3 — Angel One historical market data and market intelligence** — reference/pilot work exists, but portfolio-wide rollout is incomplete
- **Stage 8 — Deterministic investment intelligence** — reference implementation/pilot has started; portfolio-wide rollout is incomplete
- **Dashboard D34 — Core Health / Exit-Risk readiness surface** — UI complete and merged; it does not imply the formal engines are complete
- **Dashboard D35 — Position Sizing Health** — UI implementation complete in PR #78; merge/deployment state must remain distinct from implementation completion
- **R0 — Documentation reconciliation** — current checkpoint
- **R1 / D35B — deterministic Position Sizing Engine contract + reference implementation** — approved next implementation after R0 sign-off
- **R2 — Portfolio Coverage Registry / Orchestrator** — follows the D35B reference contract
- **Later — portfolio-wide research/history/scoring/recommendation/sizing, Core Health, Exit Risk, Movement, Action Center, scheduling, optional AI Investment Committee** — gated by the Integration & Execution Plan

### Completion terminology

Use these labels instead of the ambiguous word “complete”:

1. **UI COMPLETE** — the consumer interface works.
2. **ENGINE CONTRACT COMPLETE** — deterministic algorithm/storage/tests work on reference cases.
3. **PILOT COMPLETE** — a controlled real cohort has passed.
4. **PORTFOLIO-WIDE COVERAGE COMPLETE** — every eligible holding was processed or explicitly marked unresolved/not applicable.
5. **AUTOMATION COMPLETE** — scheduler/event orchestration is safely operational.
6. **PRODUCT CAPABILITY COMPLETE** — use only when the relevant lower-level gates genuinely justify it.

### Mental model

- **Stage 7.2 = What do we know about the company?**
- **Stage 7.3 = What is the stock doing in the market?**
- **Stage 8 = What does all of that mean for this investment and its place in the portfolio?**

This separation should remain explicit in code, database contracts, and UI labels.

---

## 5. Source-responsibility rule

Never add a new metric or score without first answering:

1. What is the raw authoritative source?
2. Is the value raw, normalized, derived, scored, or interpreted?
3. Which PortfolioAI engine calculates it, if any?
4. What version of the formula/engine produced it?
5. What input period and source records were used?
6. What should the UI call it?
7. Can AI explain it, and can AI alter it?

The authoritative source-and-calculation rules live in:

`PortfolioAI_Research_and_Intelligence_Architecture.md`

---

## 6. Rules for adding future documentation

To avoid documentation sprawl:

- Do not create a new top-level architecture document if the subject already belongs in an existing canonical document.
- Create a stage plan only for a bounded implementation stage.
- Create a completion report only after that stage materially changes production state.
- Prefer links to canonical definitions instead of copying them into many stage documents.
- A completion report should say what happened; it should not become the new architecture authority.
- `PortfolioAI_Development_Status.md` should remain concise and describe current reality.
- Update this `README.md` whenever a new canonical document is introduced or an old one is formally superseded.

---

## 7. Provider responsibilities at a glance

| Domain | Primary authority |
| --- | --- |
| Transactions and position accounting | PortfolioAI trusted transaction ledger |
| Current market price | Angel One SmartAPI |
| Daily historical OHLCV | Angel One SmartAPI |
| Weekly/monthly market series | PortfolioAI derived from daily OHLCV |
| Technical indicators and market trend states | PortfolioAI deterministic market engine |
| Fundamentals | Trendlyne structured evidence, normalized by PortfolioAI |
| Ownership/shareholding | Trendlyne structured evidence |
| Valuation evidence | Trendlyne and approved PortfolioAI calculations using authoritative market inputs |
| Documents/research appearances | Trendlyne or other approved document sources, with provenance |
| Official NSE News | NSE/official-source evidence normalized and stored by PortfolioAI |
| Portfolio P/L and weights | PortfolioAI accounting using authoritative price inputs |
| Momentum/Quality/Growth/Core/Exit scores | PortfolioAI deterministic versioned engines |
| Explanations | PortfolioAI deterministic explanations first; optional AI synthesis later |
| Final investment decision | Human portfolio owner |

See `PortfolioAI_Research_and_Intelligence_Architecture.md` for the full rules.

---

## 8. Important non-negotiable principle

> **The bigger risk is not lack of data; it is having lots of data without knowing which number is authoritative.**

PortfolioAI must therefore keep raw provider data, deterministic calculations, composite scores, and AI explanations clearly separated and traceable.
