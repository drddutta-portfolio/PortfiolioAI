# PortfolioAI — P7-IC IC1 Methodology + R7 Completion

**Date:** 29 September 2026  
**Parent Development HEAD:** `e7c021b865fcd1d49a7c59924ef9c44f0383f301`  
**Status:** **IC1 COMPLETE CANDIDATE / STOPPED AT IC-B**  
**Runtime activation:** NO  
**Provider calls:** 0  
**Database writes:** 0  
**Migration creation/application:** 0  
**Production changes / deployment / merge:** 0

## 1. Owner authority

IC-A was explicitly approved with authority for:
1. strengthened IC1 held-portfolio methodology completion plus complete R7-policy completion; and
2. persistence/access architecture **design only**.

IC-A did not authorize provider execution, migration creation/application, database evidence writes, Production change, deployment, merge or P8.

## 2. Gate-K historical boundary

Gate K remains **COMPLETE / PASS / CLOSED**. IC1 does not rewrite the historical K1-K5/K-FINAL artifacts or their original test expectations. Existing complete Gate-K methods are reused. Deferred held-business-model gaps are completed in the new IC1 registry layer pending IC-B approval.

## 3. Portfolio result

From the frozen IC0 239-equity universe:
- **238/239 = RESOLVED** to a complete methodology authority plus a complete R7 policy authority/candidate.
- **1/239 = REVIEW_REQUIRED**: `BLUEJET`.
- **0/239 = METHODOLOGY_NOT_AVAILABLE because engineering was deferred**.

`BLUEJET` is not an engineering deferral. It is a genuine current business-model/subprofile assignment review: it entered the held set after the prior owner Pharma mapping and Development contains no reviewed Primary Pharma subprofile for it.

The prior owner Pharma mapping is treated as an IC1 review disposition, not falsely described as already persisted. Development read-only inspection confirms the real held portfolio has only one reviewed assignment, `TORNTPHARM → DOMESTIC_FORMULATIONS`; the other reviewed rows in that table are Stage-5 controlled fixtures.

## 4. Complete methodology registry

Authoritative IC1 candidate artifact:

`docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json`

It contains:
- existing complete Gate H-K methodologies without reopening them;
- 21 completed IC1 business-model methodology candidates;
- explicit dimensions and weights;
- evidence/signal requirements;
- deterministic normalization/curve contracts;
- benchmark and valuation authority;
- durability and risk evidence;
- hard blockers and fail-closed behavior;
- R6 formula semantics;
- reference stocks;
- isolation and future-stock portability rules;
- complete profile-specific R7 policy candidates;
- explicit Pharma Primary-subprofile requirements and the five approved Pharma subprofile contracts.

All new methodology weight vectors sum to 100 over applicable dimensions. NBFC lending explicitly marks industrial cash flow N/A and does not force lender economics into an industrial cash-flow model.

## 5. R7 completion

The registry contains one R7 authority for every resolved held-equity profile:
- Pharma reuses the already approved Gate-I policy and explicitly applies it across all five Pharma Primary subprofiles.
- Every non-Pharma profile receives an IC1 candidate policy with its own Core/Satellite/Watch thresholds, role floors, cautions, hard-blocker semantics and validation cases.
- No universal numeric threshold fallback exists.
- Missing/stale/conflicting evidence never becomes AVOID; it remains fail-closed.
- Failed Core floors continue down the approved ladder rather than automatically becoming AVOID.
- No R7 policy emits an IC6 owner-facing action.

These non-Pharma policy candidates require **IC-B owner approval before execution**.

## 6. Machine-readable IC2 prerequisite

The registry plus the 239-equity coverage artifact makes methodology-to-evidence requirements machine readable before provider-backed IC2:

`docs/p7-ic/PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json`

The next approved stage can deterministically join:
security → methodology/profile/subprofile → required signals → cached evidence → fresh/stale/missing/conflicting deficits.

No provider request is needed merely to determine the requirement set.

## 7. Pharma reconciliation

IC1 does not use the old provisional candidate registry as a canonical persisted assignment source. The later owner-supplied mapping is preserved as a review disposition, while only real reviewed Development assignments may claim canonical persisted status.

The one current exception is `BLUEJET`, which remains review-required instead of being guessed into API, CDMO, Global Generics, Domestic Formulations or Biopharma.

`ZYDUSWELL` is routed outside Pharma methodology from its canonical `Packaged Foods` industry to the branded consumer/FMCG methodology.

## 8. Persistence/access design

The companion design-only artifact is:

`docs/PortfolioAI_P7_IC1_PERSISTENCE_ACCESS_DESIGN.md`

No migration file was created. Any exact additive migration must return for separate owner approval.

## 9. Validation

Run:

```bash
node scripts/p7-ic1-validate.mjs
```

The validator requires:
- exactly 239 equity rows;
- only BLUEJET may remain factual REVIEW_REQUIRED;
- zero deferred-engineering methodology gaps;
- complete R7 coverage for every resolved profile;
- 100-point weight totals for every new methodology;
- no runtime symbol-specific methodology;
- no runtime activation;
- zero authorization for providers, DB writes, migrations, deployment, merge or P8;
- no IC1 owner-facing action projection.

## 10. IC-B barrier

IC1 stops here.

IC-B must review and approve or amend:
1. the 21 new methodology candidates;
2. the new non-Pharma R7 policy candidates;
3. the current portfolio routing dispositions, including the BLUEJET review exception;
4. the persistence/access design boundary.

No IC2, provider execution, migration creation/application, R6 portfolio execution, R7 portfolio execution, IC6 action projection, deployment, merge or Production change is authorized by this IC1 package.
