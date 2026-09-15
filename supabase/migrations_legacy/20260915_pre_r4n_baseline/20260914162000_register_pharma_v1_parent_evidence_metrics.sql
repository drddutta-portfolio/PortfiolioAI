-- R4L — generic PHARMA_V1 parent evidence definitions.
-- Repository migration only until separately approved for production.
-- No observations, provider calls, scores, recommendations or scheduler state
-- are created by this migration.

do $$
declare
  conflict_code text;
begin
  select d.code into conflict_code
  from public.fundamental_metric_definitions d
  join (values
    ('PAT_ATTRIBUTABLE_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT'),
    ('EPS_DILUTED_ANNUAL','NUMERIC','INR_PER_SHARE','INCOME_STATEMENT'),
    ('CAPEX_ANNUAL','NUMERIC','INR_CRORE','CASH_FLOW'),
    ('FREE_CASH_FLOW_ANNUAL','NUMERIC','INR_CRORE','CASH_FLOW'),
    ('ROCE_MANAGEMENT_ANNUAL','NUMERIC','PERCENT','RATIO'),
    ('NET_DEBT_EBITDA_ANNUAL','NUMERIC','RATIO','RATIO'),
    ('INTEREST_COVERAGE_ANNUAL','NUMERIC','RATIO','RATIO'),
    ('SHORT_TERM_DEBT_ANNUAL','NUMERIC','INR_CRORE','POINT_IN_TIME'),
    ('TOTAL_DEBT_ANNUAL','NUMERIC','INR_CRORE','POINT_IN_TIME'),
    ('CASH_EQUIVALENTS_ANNUAL','NUMERIC','INR_CRORE','POINT_IN_TIME'),
    ('EBITDA_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT'),
    ('RND_EXPENSE_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT'),
    ('RND_INTENSITY_PERCENT','NUMERIC','PERCENT','RATIO'),
    ('INDIA_REVENUE_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT'),
    ('USA_REVENUE_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT'),
    ('GERMANY_REVENUE_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT'),
    ('BRAZIL_REVENUE_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT'),
    ('OTHER_INTERNATIONAL_REVENUE_ANNUAL','NUMERIC','INR_CRORE','INCOME_STATEMENT')
  ) expected(code,value_kind,canonical_unit,statement_scope)
    on expected.code=d.code
  where d.value_kind<>expected.value_kind
     or d.canonical_unit<>expected.canonical_unit
     or d.statement_scope<>expected.statement_scope
  limit 1;

  if conflict_code is not null then
    raise exception 'R4L metric-code conflict: % already exists with incompatible semantics', conflict_code;
  end if;
end
$$;

insert into public.fundamental_metric_definitions(code,name,value_kind,canonical_unit,statement_scope,freshness_seconds,definition,is_active)
values
('PAT_ATTRIBUTABLE_ANNUAL','Profit after tax attributable to owners annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","scope_guard":"CONSOLIDATED_ATTRIBUTABLE_TO_OWNERS","source_priority":["ISSUER_ANNUAL_REPORT","COMPANY_EXCHANGE_FILING"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('EPS_DILUTED_ANNUAL','Diluted EPS annual','NUMERIC','INR_PER_SHARE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"BASIC_AND_DILUTED_OR_DILUTED_EPS","rejected_substitutes":["Cash EPS"],"source_priority":["ISSUER_ANNUAL_REPORT","COMPANY_EXCHANGE_FILING"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('CAPEX_ANNUAL','Capital expenditure annual','NUMERIC','INR_CRORE','CASH_FLOW',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"PPE_AND_INTANGIBLE_PURCHASES_INCLUDING_CWIP_DEVELOPMENT_AND_CAPITAL_ADVANCES","rejected_substitutes":["Net cash used in investing activities"],"source_priority":["ISSUER_ANNUAL_REPORT","COMPANY_EXCHANGE_FILING"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('FREE_CASH_FLOW_ANNUAL','Free cash flow annual','NUMERIC','INR_CRORE','CASH_FLOW',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","calculation_owner":"PORTFOLIOAI","formula":"CFO_ANNUAL - CAPEX_ANNUAL","source_priority":["PORTFOLIOAI_DERIVED"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('ROCE_MANAGEMENT_ANNUAL','Management-reported ROCE annual','NUMERIC','PERCENT','RATIO',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"CONSISTENT_ISSUER_REPORTED_ROCE_SERIES","do_not_mix_with":"provider_calculated_roce_without_methodology_match","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('NET_DEBT_EBITDA_ANNUAL','Net debt to EBITDA annual','NUMERIC','RATIO','RATIO',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"CONSISTENT_ISSUER_REPORTED_NET_DEBT_EBITDA_SERIES","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('INTEREST_COVERAGE_ANNUAL','Interest coverage annual','NUMERIC','RATIO','RATIO',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","source_priority":["ISSUER_ANNUAL_REPORT","TRENDLYNE_MCP"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('SHORT_TERM_DEBT_ANNUAL','Short-term debt annual','NUMERIC','INR_CRORE','POINT_IN_TIME',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"SHORT_TERM_DEBT_ONLY","must_not_substitute_for":"TOTAL_DEBT_ANNUAL","source_priority":["ISSUER_ANNUAL_REPORT","TRENDLYNE_MCP"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('TOTAL_DEBT_ANNUAL','Total debt annual','NUMERIC','INR_CRORE','POINT_IN_TIME',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"LONG_TERM_BORROWINGS_INCLUDING_CURRENT_MATURITIES_PLUS_SHORT_TERM_BORROWINGS","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('CASH_EQUIVALENTS_ANNUAL','Cash and cash equivalents annual','NUMERIC','INR_CRORE','POINT_IN_TIME',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('EBITDA_ANNUAL','Operating EBITDA annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"CONSISTENT_ISSUER_OPERATING_EBITDA_SERIES","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('RND_EXPENSE_ANNUAL','Research and development expenditure annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","semantic_guard":"ISSUER_REPORTED_RD_EXPENDITURE_SERIES","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('RND_INTENSITY_PERCENT','Research and development intensity','NUMERIC','PERCENT','RATIO',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","calculation_owner":"PORTFOLIOAI","formula":"RND_EXPENSE_ANNUAL / REVENUE_ANNUAL * 100","source_priority":["PORTFOLIOAI_DERIVED"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('INDIA_REVENUE_ANNUAL','India revenue annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","segment_guard":"EXTERNAL_CUSTOMER_REVENUE_BY_LOCATION_INDIA","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('USA_REVENUE_ANNUAL','USA revenue annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","segment_guard":"EXTERNAL_CUSTOMER_REVENUE_BY_LOCATION_USA","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('GERMANY_REVENUE_ANNUAL','Germany revenue annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","segment_guard":"EXTERNAL_CUSTOMER_REVENUE_BY_LOCATION_GERMANY_OR_GERMANY_AND_MALTA_AS_DISCLOSED","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('BRAZIL_REVENUE_ANNUAL','Brazil revenue annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","segment_guard":"EXTERNAL_CUSTOMER_REVENUE_BY_LOCATION_BRAZIL","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true),
('OTHER_INTERNATIONAL_REVENUE_ANNUAL','Other international revenue annual','NUMERIC','INR_CRORE','INCOME_STATEMENT',7776000,
 '{"selection":"REVIEWED","period_type":"YEAR","segment_guard":"EXTERNAL_CUSTOMER_REVENUE_OTHER_COUNTRIES_AS_DISCLOSED","source_priority":["ISSUER_ANNUAL_REPORT"],"mapping_version":"PHARMA_V1_PARENT_V1"}'::jsonb,true)
on conflict (code) do nothing;
