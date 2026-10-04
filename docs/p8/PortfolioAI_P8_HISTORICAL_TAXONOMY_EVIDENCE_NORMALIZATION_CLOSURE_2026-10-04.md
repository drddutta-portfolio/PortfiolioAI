# PortfolioAI P8 Historical Taxonomy Evidence-Normalization Closure

Date: 4 October 2026

## Exact disposition

**HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_BLOCKED**

The bounded implementation and canary execution completed successfully. Research feasibility remains blocked.

## 1. Implementation and test result

The Development build added a versioned semantic evidence-normalization contract, a deterministic pre-measurement canary freeze, semantic extraction/normalization code, focused tests and a canary workflow.

The first canary workflow stopped before measurement because a test exposed a camel-case accounting-scope parser defect. That implementation bug was corrected without changing the frozen canary or normalization contract. The rerun passed the full focused semantic test suite and then evaluated the unchanged 32-member canary.

## 2. Semantic evidence proof

Semantic extraction is successful.

All **32/32 canary members** yielded recoverable source-cited business/segment meaning from already stored official XML.

Important sub-results:

- positional-label semantic recovery: **11**
- historical-only identities with semantic recovery: **19**
- negative controls incorrectly promoted: **0**

Representative official source facts include:

- `DescriptionOfReportableSegment = Performance Polymers & Chemicals`
- `DescriptionOfReportableSegment = Solar Photovoltaic Modules`
- `DescriptionOfReportableSegment = EPC/Engineering Services`
- `DescriptionOfSingleSegment = Oil Seed Extraction and Refining`
- `DescriptionOfSingleSegment = Hospital Business`
- `DescriptionOfSingleSegment = Pharma`
- reportable segments `Chemicals` and `Textiles`

This proves that Workstream D's positional members were hiding useful semantic text already present in the source bodies.

## 3. Historical classification proof

**0/32 canary members** achieved complete canonical historical classification.

The source bodies contain business descriptions, but the stored repository authority does not contain a complete historical **Macro-Economic Sector → Sector → Industry → Basic Industry** mapping that can deterministically translate those recovered labels into the canonical economic hierarchy.

Gate-K is not a substitute for that missing authority. It is an analytical Sector+Industry research-routing contract. Using general knowledge to turn “Hospital Business” into a four-tier economic path, or using current company classifications, would violate the frozen contract and point-in-time rules.

Therefore the classification state remains blocked rather than guessed.

## 4. Methodology route and normalized input completeness

Because complete historical classification proof is zero:

- methodology-route-proven canary pairs: **0**
- complete normalized-input canary pairs: **0**
- full 25,761-pair expansion: **NOT EXECUTED**

The frozen expansion gate required a complete classification-proven case and an exactly-one route-proven case. Those conditions failed, so broad processing correctly stopped.

## 5. Denominator reconciliation

The full historical denominator remains:

- B2-eligible pairs: **121,956**
- historical identities: **4,524**
- decision dates: **32**
- provisional candidates: **25,761 pairs / 877 identities**

Primary dispositions remain:

- `NO_PRE_DECISION_EVIDENCE`: **60,531**
- `CLASSIFICATION_UNRESOLVED`: **33,706**
- `MARKET_DATA_BLOCKED`: **1,958**
- `CLASSIFICATION_TAXONOMY_UNPROVEN`: **25,761**

No successful canary rows were used to cherry-pick a new denominator.

## 6. Existing proposed standards

These remain proposed, not owner-frozen.

- >=24 decision dates: **PASS — 32**
- >=80% overall complete-input coverage: **FAIL — 0%**
- >=70% per retained date: **FAIL**
- >=60% per major methodology sector: **NOT COMPUTABLE / FAIL CLOSED**

## 7. Precise unresolved evidence gap

The remaining blocker is no longer “missing business meaning in the XML.”

The precise blocker is:

**COMPLETE_FOUR_TIER_TAXONOMY_MAPPING_AUTHORITY_ABSENT**

PortfolioAI now has source-cited historical semantic business descriptions, but not an already-authoritative, complete mapping from those descriptions into the four-level economic hierarchy required by the frozen classification contract.

Resolving that would require a separately authorized taxonomy-authority step. This closure does not authorize new source acquisition, a new taxonomy policy, a new experiment, B5/B6/B-FINAL rebuild or P8-C.

## 8. Safety boundary

Provider calls: 0. New source acquisition: 0. Supabase writes: 0. R2 writes: 0. Migrations: 0. New experiment execution: 0. B5/B6/B-FINAL rebuild: 0. P8-C: 0. Forward-return/performance/holdout reads: 0. Production/main changes: 0.
