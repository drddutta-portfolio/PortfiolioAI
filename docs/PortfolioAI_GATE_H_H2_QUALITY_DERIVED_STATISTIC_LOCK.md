# PortfolioAI — Gate H H2 TORNTPHARM Quality Derived-Statistic Lock

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Target:** TORNTPHARM / Quality  
**Status:** IMPLEMENTED / VALIDATION PENDING  
**Mode:** read-only; no score persistence

## Source evidence

Eight semantically reviewed quarterly Operating EBITDA / revenue periods are already locked from official Torrent Pharma releases:

- Q1 FY25: revenue ₹2,859 cr; Operating EBITDA ₹904 cr
- Q2 FY25: revenue ₹2,889 cr; Operating EBITDA ₹939 cr
- Q3 FY25: revenue ₹2,809 cr; Operating EBITDA ₹914 cr
- Q4 FY25: revenue ₹2,959 cr; Operating EBITDA ₹964 cr
- Q1 FY26: revenue ₹3,178 cr; Operating EBITDA ₹1,047 cr
- Q2 FY26: revenue ₹3,302 cr; Operating EBITDA ₹1,083 cr
- Q3 FY26: revenue ₹3,303 cr; Operating EBITDA ₹1,088 cr
- Q4 FY26: revenue ₹3,424 cr; Operating EBITDA ₹1,120 cr

Q1 FY26 uses the issuer-disclosed acquisition one-off adjustment.  
Q4 FY26 uses issuer-disclosed base-business figures excluding JB/PPA acquisition effects.

## Deterministic convention

The H2 owner-approved Type-7 linear percentile convention is reused for the Quality IQR.

No new percentile convention is introduced.

```text
PERCENTILE_CONVENTION = LINEAR_INTERPOLATION_TYPE_7
```

## Derived operating-margin statistics

Operating margin is calculated as:

```text
Operating EBITDA / Revenue × 100
```

Locked statistics:

- median latest 8 operating margin = **32.64442710817307%**
- Type-7 Q1 = **32.52935139868994%**
- Type-7 Q3 = **32.83366597882035%**
- Type-7 IQR = **0.30431458013040924 pp**
- median prior 4 = **32.520432950459266%**
- median latest 4 = **32.869027899494114%**
- latest-4 minus prior-4 median = **+0.34859494903484745 pp**

## Owner-approved Quality curve result

The existing owner-approved Domestic Formulations Operating Margin methodology applies:

- Level weight = 50%
- Stability weight = 30%
- Trend weight = 20%

Component scores:

- Level = **100**
- Stability = **100**
- Trend = **60**

Read-only Quality candidate:

```text
100 × 0.50
+ 100 × 0.30
+ 60 × 0.20
= 92
```

> **Quality = 92**

## Safety state

- score execution: OFF
- score persistence: OFF
- production mutation: NO
- evidence write: NO
- provider refresh: NO
- paid API call: NO
- recommendation: OFF
- sizing: OFF
- deployment: NO
- PR merge: NO

## Validation checkpoint

Focused validation is still required before this Quality lock is classified as PASS.

H2 remains in progress and must continue directly to the remaining evidence/input families after validation.
