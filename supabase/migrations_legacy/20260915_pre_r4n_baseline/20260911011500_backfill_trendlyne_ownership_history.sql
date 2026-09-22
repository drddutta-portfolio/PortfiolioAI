-- Stage 8.6A: promote retained quarterly ownership history from already-captured
-- Complete Research Refresh evidence. This migration makes no provider calls.
-- It is intentionally limited to exact Trendlyne COMPLETE_RESEARCH_OWNERSHIP source records.

with source_rows as (
  select
    dsr.id as source_record_id,
    dsr.retrieved_at,
    dsr.raw_payload ->> 'security_id' as security_id_text,
    dsr.raw_payload ->> 'result' as result_text
  from public.data_source_records dsr
  where dsr.source_code = 'TRENDLYNE_MCP'
    and dsr.record_kind = 'COMPLETE_RESEARCH_OWNERSHIP'
    and dsr.raw_payload ? 'security_id'
    and dsr.raw_payload ? 'result'
), sections as (
  select * from (values
    ('Promoter', 'SHAREHOLDING_PROMOTER_PERCENT'),
    ('FII', 'SHAREHOLDING_FII_FPI_PERCENT'),
    ('DII', 'SHAREHOLDING_DII_PERCENT'),
    ('MF', 'SHAREHOLDING_MUTUAL_FUND_PERCENT'),
    ('Public', 'SHAREHOLDING_PUBLIC_PERCENT')
  ) as x(section_name, metric_code)
), extracted as (
  select
    sr.source_record_id,
    sr.retrieved_at,
    sr.security_id_text::uuid as security_id,
    sec.metric_code,
    m.captures[1] as month_label,
    m.captures[2]::int as year_value,
    m.captures[3]::numeric as numeric_value
  from source_rows sr
  cross join sections sec
  cross join lateral regexp_matches(
    substring(
      sr.result_text
      from '(?s)  ' || sec.section_name || ':\\n(.*?)(?=\\n  [A-Z][A-Za-z ]*:|\\ninsights:)'
    ),
    '\\["(Mar|Jun|Sep|Dec) ([0-9]{4})",(-?[0-9]+(?:\\.[0-9]+)?)',
    'g'
  ) as m(captures)
), normalized as (
  select
    e.*,
    make_date(
      e.year_value,
      case e.month_label when 'Mar' then 3 when 'Jun' then 6 when 'Sep' then 9 else 12 end,
      case e.month_label when 'Mar' then 31 when 'Jun' then 30 when 'Sep' then 30 else 31 end
    ) as period_end
  from extracted e
)
insert into public.fundamental_observations (
  security_id, metric_code, source_record_id, source_code, numeric_value,
  currency, unit, period_start, period_end, period_type, accounting_standard,
  consolidation_scope, observed_at, retrieved_at, fresh_until, evidence_status,
  published_at
)
select
  n.security_id,
  n.metric_code,
  n.source_record_id,
  'TRENDLYNE_MCP',
  n.numeric_value,
  null,
  'PERCENT',
  null,
  n.period_end,
  'QUARTER',
  null,
  'UNKNOWN',
  null,
  n.retrieved_at,
  n.retrieved_at + interval '45 days',
  'AVAILABLE',
  null
from normalized n
where exists (select 1 from public.securities s where s.id = n.security_id)
on conflict (security_id, metric_code, source_code, period_end, period_type, consolidation_scope, source_record_id)
do nothing;

update public.scoring_model_metric_rules
set
  rule_state = 'REVIEWED',
  normalization_rule = jsonb_build_object(
    'type', 'ownership_trend_4q',
    'unit', 'PERCENTAGE_POINTS',
    'requires_quarters', 5,
    'formula', 'latest(FII_FPI + DII) - same_quarter_prior_year(FII_FPI + DII)',
    'bands', jsonb_build_array(
      jsonb_build_object('gte', 3, 'score', 100),
      jsonb_build_object('gte', 1, 'score', 80),
      jsonb_build_object('gte', -1, 'score', 60),
      jsonb_build_object('gte', -3, 'score', 40),
      jsonb_build_object('lt', -3, 'score', 20)
    )
  ),
  updated_at = now()
where scoring_profile = 'BANK_NBFC'
  and dimension_code = 'OWNERSHIP_GOVERNANCE'
  and input_code = 'INSTITUTIONAL_OWNERSHIP_TREND';
