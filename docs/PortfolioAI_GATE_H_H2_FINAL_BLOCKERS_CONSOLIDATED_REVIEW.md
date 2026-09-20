# PortfolioAI — Gate H H2 Final Blockers Consolidated Review

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** READ-ONLY CONSOLIDATED REVIEW / H2 NOT YET CLOSED

## Current H2 state

Eight dimensions are validated and score-ready:

- Quality = 92
- Growth = 78.25
- Capital Efficiency = 79
- Cash Flow = 93.6
- Balance Sheet / Credit = 65
- Ownership / Governance = 70
- Momentum = 95
- Risk = 80

Two dimensions remain incomplete:

- Business Durability
- Valuation

No final company score may be calculated before both are completed.

---

## 1. Business Durability — final blocker

Current reviewed components:

- Brand / Therapy Leadership = REVIEW_REQUIRED / null
- Field Force Productivity = STRONG / 75
- R&D Productivity = STRONG / 75
- Pipeline / Corporate Execution = STRONG / 75

Ready components = 3 / 4.

### Exact licensed evidence requirement

The Gate F acquisition contract requires:

- external licensed Indian pharmaceutical market evidence;
- company/brand/therapy rank and/or market-share evidence;
- current/recent period;
- independently sourced rather than only issuer self-description.

Torrent's FY2025-26 reporting identifies the underlying market dataset family used for its India ranking and therapy assertions as:

`AIOCD Pharmatrac / AIOCD-AWACS`

Issuer-reported FY26 examples include:

- combined Torrent + JB Pharma ranked 5th in IPM;
- top-five positions across multiple therapy areas;
- Cardiac #1;
- CNS #3;
- GI #3;
- Pain Management #5;
- Derma #5;
- 75% chronic/sub-chronic revenue share.

These issuer statements are useful orientation evidence but do **not** satisfy the licensed cross-check by themselves.

### Exact H2 completion shape

Acceptable licensed evidence should provide, for Torrent Pharmaceuticals or the reviewed post-acquisition business scope:

1. company-level India market rank and/or share;
2. at least the major therapy-level rank/share relevant to Torrent's leadership claim;
3. period/date;
4. source/vendor identity;
5. enough context to distinguish Torrent standalone vs Torrent + JB Pharma combined scope.

Without this, Brand / Therapy Leadership remains `REVIEW_REQUIRED`.

No freeform numeric inference is permitted.

---

## 2. Valuation — self-history lane

The approved local acquisition package already authorizes exactly one targeted Trendlyne refresh for:

`PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`

via:

`refresh-valuation-evidence`

Existing stored value:

- latest located before refresh = -14.87%
- stale at the 20 September 2026 H2 snapshot

Therefore a fresh current observation is still required.

This action remains local-only for H2 validation unless separately approved for production.

---

## 3. Valuation — peer cohort lane

The current owner-supplied provisional Domestic Formulations candidate set is:

- SUNPHARMA
- ERIS
- EMCURE
- MANKIND

TORNTPHARM is the target and excluded from its own peer cohort.

### Read-only official evidence review

#### MANKIND

Official company evidence shows a strongly domestic business model:

- FY24 domestic revenue = ₹9,522 crore;
- domestic share ≈ 92% of total revenue;
- broad acute + chronic India formulations portfolio;
- very large India field-force/distribution footprint.

Assessment:

`DOMESTIC_FORMULATIONS = STRONGLY SUPPORTED`

Candidate confidence:

`HIGH`

#### ERIS

Official company description identifies Eris as:

- a leading domestic branded-formulations company;
- specialist-doctor focused;
- concentrated in chronic therapies, especially cardio-metabolic care.

Assessment:

`DOMESTIC_FORMULATIONS = STRONGLY SUPPORTED`

Candidate confidence:

`HIGH`

#### EMCURE

Official FY25 evidence shows:

- India business revenue = ₹36,597 million;
- India business growth = 16.4%;
- substantial branded domestic portfolio and therapy expansion;
- simultaneously material international businesses in Europe and North America.

Assessment:

`DOMESTIC_FORMULATIONS = SUPPORTED, WITH MATERIAL GLOBAL GENERICS OVERLAY`

Candidate confidence:

`MEDIUM`

#### SUNPHARMA

Official FY25 evidence shows:

- India formulations revenue = ₹169 billion;
- India share ≈ 33% of overall revenue;
- India market leadership and broad chronic/acute therapy strength;
- simultaneously very large Global Specialty / international businesses.

Assessment:

`DOMESTIC_FORMULATIONS PRIMARY = NOT YET CLEANLY ESTABLISHED FOR PEER PURPOSES`

Sun Pharma should not be used merely to increase cohort size.

### Minimum viable reviewed peer set

The strongest current read-only review set is therefore:

- MANKIND
- ERIS
- EMCURE

This gives the exact minimum of three candidates required by the approved G6.11 peer-comparability contract, but they are **not yet canonical REVIEWED assignments**.

No production or local canonical assignment persistence has been performed.

### Peer valuation evidence still required

For each finally reviewed peer:

- fresh `PE_TTM`;
- fresh `EV_EBITDA`;
- comparable period/consolidation semantics;
- no negative/economically meaningless denominator;
- acquisition/one-off review where material.

Both metric families must meet the minimum three-peer count.

---

## 4. What can be completed next without broadening H2

### Already authorized

Local targeted TORNTPHARM self-history refresh:

- `refresh-valuation-evidence`;
- one Trendlyne call;
- exact metric only.

### Requires explicit owner review

Peer business-model promotion:

- MANKIND -> DOMESTIC_FORMULATIONS / HIGH
- ERIS -> DOMESTIC_FORMULATIONS / HIGH
- EMCURE -> DOMESTIC_FORMULATIONS / MEDIUM + material international/global-generics overlay

This should be approved as one consolidated peer-review decision, not three micro-gates.

### Requires separate source access

Brand / Therapy Leadership:

- exact source family: AIOCD Pharmatrac / AIOCD-AWACS;
- no generic licensed-source authorization;
- evidence must be supplied through a licensed account/provider or owner-provided licensed extract.

---

## Safety boundary

- H3 final company score: CLOSED
- production DB mutation: NO
- peer assignment persistence: NO
- licensed AIOCD call: NO
- peer valuation provider calls: NO
- recommendation: NO
- sizing: NO
- scheduler change: NO
- PR merge: NO
