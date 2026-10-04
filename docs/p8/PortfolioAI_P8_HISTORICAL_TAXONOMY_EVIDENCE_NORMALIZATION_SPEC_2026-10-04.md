# PortfolioAI P8 Historical Taxonomy Evidence-Normalization Specification

Date: 4 October 2026  
Contract: `P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_V1`  
Status: **Frozen for this bounded Development build; not adopted as live taxonomy authority**

This build reads only already-stored official NSE source bodies. It does not fetch external schemas, linkbases, company documents, providers or web sources.

The normalizer must preserve original source text and provenance. It may recover semantic business/segment descriptions from textual XBRL facts, exact context linkage, embedded label resources and deterministic positional ordinal linkage inside the same source body. A positional member QName such as `FourReportableSegmentRevenue01Member` is never itself business identity.

Business text is normalized only for matching. New semantic synonyms are forbidden during measurement: only exact canonical labels and aliases already present in Gate-K/router authority may map automatically. Company names, present-day classifications, current holdings and model knowledge are prohibited classification inputs.

A historical economic classification counts as proven only with the required four levels: Macro-Economic Sector → Sector → Industry → Basic Industry. Gate-K Sector+Industry routing can validate a methodology path after classification proof, but it is not a substitute for the complete economic hierarchy.

Dominant-business classification requires a semantically identified segment contributing >50% of eligible segment revenue. `DIVERSIFIED` requires multiple semantically identified businesses and no >50% segment; it is an explicit analytical disposition and does not silently select a methodology route.

Consolidated evidence is preferred. Revisions apply only after their own dissemination timestamps. Conflicting eligible disclosures fail closed. Future evidence and current-state backdating are forbidden.

The frozen 32-member canary expands to the 25,761 provisional candidates only if all structural conditions are satisfied: at least one positional case has source-cited semantic recovery; at least one canary member has complete classification proof; at least one completely classified member resolves to exactly one existing methodology route; repeat fingerprints match; and negative controls are not promoted without evidence. There is no post-result success-rate tuning.
