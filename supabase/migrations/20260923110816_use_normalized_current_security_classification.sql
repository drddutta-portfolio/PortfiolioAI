create or replace view public.current_security_classification_v1
with (security_invoker = true)
as
select
  s.id as security_id,
  coalesce(max(coalesce(o.normalized_value, o.text_value)) filter (where d.attribute_code = 'COMPANY_NAME'), s.name) as company_name,
  max(coalesce(o.normalized_value, o.text_value)) filter (where d.attribute_code = 'SECTOR') as sector,
  max(coalesce(o.normalized_value, o.text_value)) filter (where d.attribute_code = 'INDUSTRY') as industry,
  min(o.fresh_until) as fresh_until,
  bool_or(o.evidence_status = 'CONFLICTING') as has_conflict
from public.securities s
left join public.security_attribute_decisions d on d.security_id = s.id
left join public.security_attribute_observations o on o.id = d.selected_observation_id
group by s.id, s.name;

comment on view public.current_security_classification_v1 is
  'Canonical current classification. Selected immutable source observations retain raw text_value; reviewed normalized_value is preferred for application classification.';
