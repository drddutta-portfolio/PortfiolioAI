# PortfolioAI — Single Source of Truth Architecture

**Status:** Canonical cross-cutting application architecture  
**Owner:** PortfolioAI project owner  
**Scope:** Canonical business facts, shared data access, deterministic ownership, cross-page consistency, and enforcement  
**Repository:** `drddutta-portfolio/PortfiolioAI`

---

## 1. Purpose

PortfolioAI is one application, not a collection of independent screens.

The governing rule is:

> **A data item that means the same thing must have one canonical authority. Different pages are views of the same PortfolioAI system, not independent mini-applications.**

This document converts that principle into an enforceable architecture contract.

It complements:

- `PortfolioAI_Master_Blueprint.md` for product intent;
- `PortfolioAI_Research_and_Intelligence_Architecture.md` for source/calculation ownership and intelligence-layer semantics;
- `PortfolioAI_Database_Architecture.md` for persisted data ownership and security;
- `PortfolioAI_Development_Rules.md` for engineering discipline.

If a business fact already has an authority in a higher-order canonical document, this document does not redefine that authority. It defines how the application must consume it consistently.

---

## 2. Core invariant

For every meaningful PortfolioAI business fact there must be one unambiguous answer to each of these questions:

1. **What is the fact?**
2. **What is its authoritative source or calculation owner?**
3. **Where is the canonical application access path?**
4. **Which layer may derive it?**
5. **How are missing/stale/conflicting states represented?**
6. **Which pages may consume it?**
7. **May a page calculate or substitute it locally?**

The default answer to question 7 is **no**.

UI components may format, sort, filter, group and present canonical data. They must not create a second business definition for the same fact.

---

## 3. The PortfolioAI fact pipeline

The preferred architecture is:

```text
External / raw evidence
        ↓
Canonical stored evidence or trusted ledger
        ↓
Shared repository / data service
        ↓
Deterministic domain engine where derivation is required
        ↓
Canonical application view model / domain output
        ↓
Dashboard / Holdings / Research / Health / Recommendation / Sizing / other views
```

The prohibited pattern is:

```text
Dashboard ──────→ its own query/calculation
Holdings ───────→ another query/calculation
Research ───────→ another interpretation
Sizing ─────────→ another local derivation
```

A new screen is a new **consumer**, not a new authority.

---

## 4. Business-fact ownership rules

### 4.1 Raw facts

Raw facts keep their approved authority and provenance.

Examples:

- transactions → PortfolioAI trusted transaction ledger;
- current market price → approved Angel One cache;
- sector/industry/market-cap classification → `current_security_enrichment_v1` in the current application architecture;
- structured research evidence → approved research evidence tables/contracts;
- official company news → normalized official NSE evidence.

A UI page must not substitute another raw source merely because it is easier to query.

### 4.2 Derived facts

A derived fact must have exactly one deterministic calculation owner.

Examples:

- open quantity → PortfolioAI portfolio/accounting calculation;
- average cost → approved accounting engine;
- current value → canonical quantity/accounting context + canonical current price;
- portfolio weight → PortfolioAI portfolio engine;
- Quality/Growth/etc. → versioned deterministic research/scoring engines;
- recommendation → approved deterministic recommendation engine;
- position-sizing guidance → D35B Position Sizing Engine.

The formula must not be reimplemented inside Dashboard, Research, Holdings or another component.

### 4.3 User-owned decisions/settings

Owner-entered settings remain their own authority and must not be silently overwritten by engines.

Examples:

- portfolio role;
- themes;
- owner target/minimum/maximum weights;
- watchlist/frozen state;
- investment-horizon notes.

An engine may produce advisory output beside these settings but may not redefine them.

---

## 5. Current canonical application authority matrix

This table records the application-level consumption rule. It does not replace the deeper source/provenance matrix in `PortfolioAI_Research_and_Intelligence_Architecture.md`.

| Business fact | Canonical authority / owner | Canonical application path | Page-local alternative allowed? |
| --- | --- | --- | --- |
| Transactions | `transactions` trusted ledger | portfolio repository/accounting pipeline | No |
| Open quantity | PortfolioAI deterministic portfolio/accounting layer | `usePortfolioView()` / shared portfolio model | No |
| Average cost | approved PortfolioAI accounting engine | shared portfolio model | No |
| Invested amount | approved PortfolioAI accounting engine | shared portfolio model | No |
| Current price | Angel One cached market-price authority | market-data repository → shared portfolio model | No |
| Current value | PortfolioAI deterministic portfolio engine | shared portfolio model | No |
| Unrealised P/L | PortfolioAI deterministic accounting/portfolio engine | shared portfolio model | No |
| Portfolio weight | PortfolioAI deterministic portfolio engine | shared portfolio model | No |
| Sector | `current_security_enrichment_v1.sector` | shared enrichment repository/service | No |
| Industry | `current_security_enrichment_v1.industry` | shared enrichment repository/service | No |
| Market-cap category | `current_security_enrichment_v1.market_cap_category` | shared enrichment repository/service | No |
| Portfolio role | `portfolio_security_settings` | shared portfolio model | No |
| Themes | `themes` + `theme_securities` | shared portfolio model | No |
| Fundamental evidence | reviewed `fundamental_observations` + decisions/contracts | research repository | No |
| Ownership evidence | reviewed research/ownership evidence | research repository | No |
| Research documents | `research_documents` + source metadata | research repository | No |
| Daily historical OHLCV | Angel One canonical stored market history | market repository | No |
| Official news | normalized official NSE news pipeline | News repository/service | No |
| Deterministic score | `stock_score_runs` / approved deterministic scoring engine | scoring repository/service | No |
| Recommendation | `stock_recommendation_runs` / deterministic recommendation engine | recommendation repository/service | No |
| Position-sizing assessment | D35B / `position_sizing_assessments` when production persistence exists | sizing repository/service | No |
| Core Health / Exit Risk | future approved deterministic engines | future canonical domain services | No |

The machine-readable companion registry is `src/contracts/canonicalDataAuthorities.ts`.

---

## 6. Classification rule — application-wide

The Dashboard's Allocation & Performance classification path established the current canonical source:

```text
current_security_enrichment_v1
        ↓
loadSecurityEnrichment()
        ↓
shared application enrichment / portfolio projection
        ↓
Dashboard, Holdings, Portfolio Structure, Research, Coverage, future consumers
```

Therefore:

- `Banking` must mean the same security grouping wherever the application shows sector;
- `Financial Services` must not be silently merged into Banking on another page;
- `Pharma` and `Healthcare` remain the current displayed application sectors unless the canonical classification itself changes;
- market-cap category must come from the same enrichment source everywhere;
- raw `securities.sector_id` / `industry_id` cannot be used as a competing application authority while the enrichment view is the approved current classification path.

Research methodology is separate:

```text
canonical application sector
        ↓
research profile / subprofile
        ↓
sector-specific evidence rules
```

A research profile may interpret or group canonical sectors for methodology. It must not rewrite the user-visible canonical classification.

---

## 7. Shared access rule

Presentation code should normally consume shared repositories, hooks, selectors or view models.

Examples:

- portfolio/accounting facts → `usePortfolioView()`;
- classification enrichment → `loadSecurityEnrichment()` / `usePortfolioEnrichment()` and shared portfolio classification projection;
- research evidence → `useSecurityResearch()` / research repository;
- coverage facts → approved R2 projection path;
- scores/recommendations/sizing → their owning domain repositories/services.

### Presentation-layer prohibition

`src/pages/**` and `src/components/**` must not directly create Supabase queries for canonical business facts.

Presentation code may:

- render;
- format;
- sort;
- filter;
- group canonical records for display;
- calculate purely visual geometry or UI-only percentages that are not business facts.

Presentation code may not:

- query a competing table for a canonical fact;
- duplicate a financial formula;
- create a second sector/market-cap taxonomy;
- convert missing values to zero;
- silently choose between conflicting evidence;
- manufacture a score/recommendation/readiness state.

---

## 8. Missing, stale and conflicting data

One source of truth does **not** mean forcing one value when evidence is uncertain.

Canonical states such as the following are valid facts:

- `NULL` / unavailable;
- stale;
- conflicting;
- review required;
- insufficient evidence;
- profile pending;
- not applicable;
- blocked prerequisite.

If two upstream sources disagree, the resolution belongs in the canonical evidence/reconciliation layer. Individual screens must not independently resolve the conflict.

All screens should therefore show the same canonical uncertainty state for the same fact at the same application revision.

---

## 9. Source facts versus interpretation

PortfolioAI separates:

1. raw evidence;
2. normalized/deterministic calculations;
3. composite scores/states;
4. explanation/synthesis.

A page must never substitute a Layer 4 explanation for a Layer 1–3 fact.

AI may explain the canonical data but may not become an alternative source of truth.

---

## 10. Machine-readable authority registry

`src/contracts/canonicalDataAuthorities.ts` is the machine-readable implementation companion to this document.

Each registered fact declares at minimum:

- stable fact key;
- human label;
- authority type;
- canonical source/owner;
- shared application access path;
- architectural layer;
- missing-data behavior;
- whether page-local derivation is allowed.

The registry exists so tests and future tooling can detect architectural drift.

It is not a duplicate database. It is an executable architecture contract.

---

## 11. Automated enforcement

PortfolioAI must use multiple controls rather than relying on developer memory.

### 11.1 Architecture boundary check

`scripts/check-data-boundaries.mjs` scans presentation code and fails if a page/component directly imports the Supabase client, performs direct Supabase query operations, or references protected canonical storage objects directly.

This prevents new pages from becoming independent data applications.

### 11.2 Authority-registry tests

Tests must verify:

- fact keys are unique;
- required core facts are registered;
- each fact has an authority and shared access path;
- classification facts share the same classification authority;
- page-local business derivation is not accidentally enabled.

### 11.3 Cross-page regression tests

For shared facts with multiple UI consumers, regression tests should be added as surfaces mature. The test target is not pixel equality; it is **fact equality**.

Examples:

- HDFCBANK sector/industry/market-cap category must resolve identically for Dashboard, Holdings, Research and Structure;
- the same security must have one current price and one portfolio weight for the same canonical snapshot;
- a persisted score/recommendation/sizing assessment must retain identical lineage wherever shown.

### 11.4 Permanent CI guard

The repository CI architecture check must run on pull requests and protected branch pushes. A future change that bypasses the approved shared data boundary should fail CI before merge.

---

## 12. Review rule for every future feature

Every material PR must answer:

> **Where does each new displayed business fact come from?**

Reviewers should reject the change if:

- no canonical authority is identified;
- the fact duplicates an existing authority;
- a page locally recalculates an existing domain fact;
- a second source is introduced without an approved reconciliation contract;
- missing/conflicting evidence is silently coerced;
- the machine-readable authority registry becomes inaccurate.

If a genuinely new business fact is introduced, the authority must be added to the relevant canonical architecture and registry before or with the implementation.

---

## 13. Exceptions and architecture changes

An exception is permitted only when the existing authority is demonstrably insufficient and the project owner approves a material architecture change.

The change must then update, as applicable:

1. the relevant canonical source/calculation architecture;
2. this document;
3. `canonicalDataAuthorities.ts`;
4. shared repository/service contracts;
5. migration/security rules if persistence changes;
6. regression/architecture tests;
7. Development Status.

A local workaround in one page is never an approved exception.

---

## 14. R2E completion boundary

R2E is complete at the repository architecture level when:

- this canonical contract exists;
- the machine-readable registry exists and is tested;
- presentation-layer data-boundary checks exist;
- the permanent architecture CI guard exists;
- the Dashboard classification authority is aligned with shared portfolio consumers;
- canonical documentation and agent rules point to this architecture.

R2E does **not** by itself mean:

- all legacy data paths have been consolidated;
- all research profiles are implemented;
- R2D production projection is deployed;
- all future domain engines exist;
- production database changes were made.

Any remaining legacy drift discovered by the guard should be recorded and removed explicitly rather than hidden.

---

## 15. Final principle

> **One business fact, one authority, one deterministic owner, many consistent views.**

That rule is part of PortfolioAI's architecture, not a UI convention.