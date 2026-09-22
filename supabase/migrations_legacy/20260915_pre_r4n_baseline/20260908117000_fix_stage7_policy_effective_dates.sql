-- Stage 7 replay determinism: policy effective dates are owner-decision dates, not migration-run dates.

update public.classification_taxonomies
set effective_from=date '2026-09-08'
where code='PORTFOLIOAI_INDUSTRY_V1' and version=1;

update public.market_cap_classification_policies
set effective_from=date '2026-09-08'
where code='SEBI_AMFI_FULL_MARKET_CAP_RANK_V1' and version=1;
