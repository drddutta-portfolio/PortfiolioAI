# R4N PHARMA_V1 — Gate G6.38 Global Generics Valuation Methodology Boundary Gate V1

**Status:** PROPOSAL ONLY / OWNER APPROVAL REQUIRED  
**Primary subprofile:** `GLOBAL_GENERICS`  
**Metric:** `PHARMA_VALUATION_CONTEXT`  
**Canonical dimension:** `VALUATION`

## Purpose

G6.38 separates the reusable parent Pharma Valuation methodology shape from Domestic Formulations-specific numeric decisions.

The parent valuation contract is already dimension-aligned.

## Reusable parent structure

Required valuation lenses:

- self-history-relative valuation;
- peer-relative valuation;
- cash-flow corroboration.

Supported evidence families:

- PE;
- EV/EBITDA;
- FCF yield.

Required evidence/governance constraints:

- current authoritative market price;
- current reviewed earnings and cash inputs;
- peer cohort must respect business model;
- negative or non-meaningful denominators require explicit treatment;
- acquisition and one-off earnings normalization required;
- provider valuation labels may not override authoritative market price.

## Domestic Formulations decisions that do not transfer

The following Domestic decisions are **not** inherited by Global Generics:

- 40% self-history / 40% peer-relative / 20% FCF corroboration;
- 50% PE / 50% EV/EBITDA inside the peer-relative component;
- Domestic self-history bands;
- Domestic peer-relative bands;
- Domestic FCF corroboration treatment.

## Global Generics-specific decisions still required

Not approved:

- component weights;
- self-history bands;
- peer-relative metric mix;
- peer-relative bands;
- FCF corroboration method;
- final aggregation.

Therefore:

`numericValuationCurveReady = false`

## Missing evidence behavior

- missing-component renormalization: **NOT ALLOWED**
- hidden reweighting: **NOT ALLOWED**
- neutral substitution for missing evidence: **NOT ALLOWED**

## Safety boundary

- Domestic 40/40/20 inherited: **NO**
- Domestic peer 50/50 inherited: **NO**
- Domestic bands inherited: **NO**
- Global Generics Valuation numeric curve: **NO**
- score execution: **NO**
- persistence: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

## Next step

After validation, inspect whether repository evidence supports a Global Generics-specific peer cohort, self-history calibration, FCF corroboration method, component weights and final aggregation. If not, defer numeric valuation rather than importing Domestic Formulations methodology.
