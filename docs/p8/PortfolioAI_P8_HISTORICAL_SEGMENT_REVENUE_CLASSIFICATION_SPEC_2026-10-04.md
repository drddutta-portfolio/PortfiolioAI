# PortfolioAI P8 Historical Segment-Revenue Classification Specification

Date: 4 October 2026  
Contract: `P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1`  
Status: **Frozen candidate / pending owner adoption**

## Methodology-version boundary

The official NSE Indices methodology page currently states that audited consolidated annual financials are the prime classification source and that a multi-business company is classified by a segment contributing **more than 50%** of total revenue. The page is marked updated 21 September 2023. The frozen vocabulary is November 2022. The November-2022 structure contains definition text using >50% / >=20% diversified concepts, but the exact full November-2022 methodology text is not preserved. Therefore the >50% rule is evidence-backed but remains a PortfolioAI candidate until owner approval.

## Source selection

For every historical decision, select only evidence officially disseminated strictly before the decision. OD3 measurement uses the latest eligible **audited consolidated annual** filing. Standalone, quarterly and unaudited filings do not substitute for the prime source in V1.

An annual period must span 330–380 days. Revisions for the same period become usable only after their own dissemination timestamp.

## Comparable segment revenue

The denominator is net company Revenue from Operations for the same audited consolidated annual period.

The numerator must be comparable segment **external** revenue for that same period. A reported gross Segment Revenue may serve as numerator only when aggregate Inter-Segment Revenue is valid zero. If aggregate inter-segment revenue is non-zero and the filing does not provide a segment-specific external-revenue or intersegment allocation, dominance is blocked.

The contract requires:

`Total Segment Revenue - Inter-Segment Revenue ≈ Revenue from Operations`

within deterministic XBRL rounding tolerance derived from the facts' decimals attributes.

The sum of whichever segments are present is never substituted for company revenue. Units/currency/period/scope must match. Scale is applied only from explicit source metadata.

## Dominance

A segment qualifies only when:

`comparable segment external revenue / valid company revenue > 0.50`

Exactly 50% fails. Missing, zero or negative company denominators fail closed. Negative segment revenue cannot establish dominance. Distinct segments are never combined to manufacture dominance, and no business-category aggregation is authorized in V1 because no preserved official rule was found that permits that operation.

## Classification

A dominant segment must itself map to the frozen four-tier taxonomy under exact evidence or an owner-approved OD2 catalog. Broad or ambiguous descriptions remain blocked.

A candidate classification does not become authoritative until OD1–OD3 are explicitly adopted. OD4 remains blocked, so no specialised route is produced for unresolved diversified companies.

## Route and input completeness

After complete company classification, use the existing methodology router. Exactly one route is required. Only then evaluate the route's actual canonical mandatory metrics, period/scope/freshness/history/provenance requirements.

A complete valid input snapshot is distinct from a positive investment recommendation.
