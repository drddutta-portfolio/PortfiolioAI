# R4N Gate G — PHARMA_V1 Operating Margin Curve Proposal V1

**Status:** Proposal only / activation not approved / score execution disabled  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

Define the second reviewable PHARMA_V1 numeric normalization-curve family without activating scoring.

This proposal applies to:

- metric: `PHARMA_OPERATING_MARGIN_HISTORY`
- primary subprofile: **DOMESTIC_FORMULATIONS** only

Other primary Pharma subprofiles fail closed until their own operating-margin level bands are versioned.

## Required history

- minimum comparable quarters: **8**
- preferred comparable quarters: **12**
- latest period required;
- matched operating-revenue and operating-profit periods required;
- semantically inconsistent periods excluded;
- incomplete compatible history produces **no score**.

## Proposed composite

### 1. Margin level — 50%

Statistic:

`median(latest 8 compatible operating-margin quarters)`

Domestic Formulations V1 bands:

- >=25% → 100
- >=20% and <25% → 85
- >=16% and <20% → 70
- >=12% and <16% → 55
- >=8% and <12% → 35
- <8% → 15

### 2. Margin stability — 30%

Statistic:

`interquartile range of latest 8 operating-margin quarters`

Lower dispersion is better:

- <2 percentage points → 100
- >=2 and <4 → 80
- >=4 and <6 → 60
- >=6 and <9 → 40
- >=9 → 20

### 3. Margin trend — 20%

Statistic:

`median(latest 4 quarters) - median(prior 4 quarters)`

Bands:

- >=+3 percentage points → 100
- >=+1 and <+3 → 80
- >=-1 and <+1 → 60
- >=-3 and <-1 → 40
- <-3 → 20

## Why this shape

The PHARMA parent contract marks Operating Margin as `RANGE`, not a universal higher-is-better input.

Therefore:

- level bands are primary-subprofile specific;
- stability matters materially;
- sustained direction matters;
- one strong or weak quarter cannot dominate the score.

This first V1 set is deliberately limited to Domestic Formulations. It must not be reused automatically for Global Generics, API/Bulk Drugs, CDMO/CRAMS, Biopharma/Biosimilars or other Pharma primary models.

## Material overlay behavior

For TORNTPHARM, Global Generics remains a material overlay within the single PHARMA_V1 score.

This proposal does not create a second Global Generics margin score. If later evidence shows that the material overlay requires a different margin treatment, that adjustment must be versioned inside the affected Quality-dimension contract.

## Activation boundary

- methodology proposal defined: **YES**
- Domestic Formulations level bands defined: **YES**
- other Pharma subprofile bands defined: **NO**
- activation approved: **NO**
- scoring adapter implementation: **NO**
- scoring-rule migration: **NO**
- score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- production mutation: **NO**

## Next workflow step

1. owner `git pull`;
2. inspect the second Gate G curve cards on localhost;
3. visually approve or request changes;
4. run focused validation.

Only after validation should Gate G proceed to another curve family.
