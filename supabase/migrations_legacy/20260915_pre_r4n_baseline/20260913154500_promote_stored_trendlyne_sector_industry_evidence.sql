begin;

insert into public.classification_taxonomies(code,version,name,level_names,is_active,effective_from,definition)
values (
  'PORTFOLIOAI_INDUSTRY',1,'PortfolioAI Industry Taxonomy v1',array['SECTOR','INDUSTRY'],true,current_date,
  jsonb_build_object(
    'source_seed','TRENDLYNE_MCP_STORED_IDENTITY_EVIDENCE',
    'policy','Only explicit stored provider labels are mapped; no ticker/name/theme inference.',
    'created_for','D21 dashboard enrichment normalization'
  )
)
on conflict (code,version) do update set is_active=excluded.is_active;

with latest as (
  select distinct on (sio.security_id)
    sio.security_id,
    dsr.id as source_record_id,
    dsr.retrieved_at,
    nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') as source_sector,
    nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') as source_industry
  from public.data_source_records dsr
  join public.security_identity_observations sio on sio.source_record_id=dsr.id
  where dsr.source_code='TRENDLYNE_MCP'
    and dsr.record_kind='SECURITY_IDENTITY'
    and sio.security_id is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') is not null
  order by sio.security_id, dsr.retrieved_at desc, dsr.id desc
), sector_values as (
  select distinct source_sector from latest
)
insert into public.sectors(code,name,is_active)
select
  upper(trim(both '_' from regexp_replace(regexp_replace(source_sector,'&',' AND ','g'),'[^A-Za-z0-9]+','_','g'))),
  source_sector,
  true
from sector_values
on conflict do nothing;

with latest as (
  select distinct on (sio.security_id)
    sio.security_id,
    dsr.id as source_record_id,
    dsr.retrieved_at,
    nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') as source_sector,
    nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') as source_industry
  from public.data_source_records dsr
  join public.security_identity_observations sio on sio.source_record_id=dsr.id
  where dsr.source_code='TRENDLYNE_MCP'
    and dsr.record_kind='SECURITY_IDENTITY'
    and sio.security_id is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') is not null
  order by sio.security_id, dsr.retrieved_at desc, dsr.id desc
), industry_values as (
  select distinct source_sector,source_industry from latest
)
insert into public.industries(sector_id,code,name,is_active)
select
  s.id,
  upper(trim(both '_' from regexp_replace(regexp_replace(iv.source_sector || '_' || iv.source_industry,'&',' AND ','g'),'[^A-Za-z0-9]+','_','g'))),
  iv.source_industry,
  true
from industry_values iv
join public.sectors s on lower(s.name)=lower(iv.source_sector)
on conflict do nothing;

with latest as (
  select distinct on (sio.security_id)
    sio.security_id,
    dsr.id as source_record_id,
    dsr.retrieved_at,
    nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') as source_sector,
    nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') as source_industry
  from public.data_source_records dsr
  join public.security_identity_observations sio on sio.source_record_id=dsr.id
  where dsr.source_code='TRENDLYNE_MCP'
    and dsr.record_kind='SECURITY_IDENTITY'
    and sio.security_id is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') is not null
  order by sio.security_id, dsr.retrieved_at desc, dsr.id desc
), pairs as (
  select distinct source_sector,source_industry from latest
)
insert into public.classification_source_mappings(
  source_code,taxonomy_code,taxonomy_version,source_sector,source_industry,sector_id,industry_id,mapping_status,evidence,reviewed_at
)
select
  'TRENDLYNE_MCP','PORTFOLIOAI_INDUSTRY',1,p.source_sector,p.source_industry,s.id,i.id,'VERIFIED',
  jsonb_build_object('basis','EXACT_STORED_PROVIDER_LABEL','provider','TRENDLYNE_MCP','no_inference',true),now()
from pairs p
join public.sectors s on lower(s.name)=lower(p.source_sector)
join public.industries i on i.sector_id=s.id and lower(i.name)=lower(p.source_industry)
on conflict (source_code,taxonomy_code,taxonomy_version,source_sector,source_industry)
do update set sector_id=excluded.sector_id,industry_id=excluded.industry_id,mapping_status='VERIFIED',evidence=excluded.evidence,reviewed_at=excluded.reviewed_at;

with latest as (
  select distinct on (sio.security_id)
    sio.security_id,
    dsr.id as source_record_id,
    dsr.retrieved_at,
    nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') as source_sector,
    nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') as source_industry
  from public.data_source_records dsr
  join public.security_identity_observations sio on sio.source_record_id=dsr.id
  where dsr.source_code='TRENDLYNE_MCP'
    and dsr.record_kind='SECURITY_IDENTITY'
    and sio.security_id is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') is not null
  order by sio.security_id, dsr.retrieved_at desc, dsr.id desc
)
insert into public.security_attribute_observations(
  security_id,source_record_id,source_code,attribute_code,text_value,normalized_value,observed_at,retrieved_at,fresh_until,evidence_status
)
select security_id,source_record_id,'TRENDLYNE_MCP','SECTOR',source_sector,source_sector,retrieved_at,retrieved_at,retrieved_at + interval '365 days','AVAILABLE'
from latest
on conflict (source_record_id,security_id,attribute_code) do nothing;

with latest as (
  select distinct on (sio.security_id)
    sio.security_id,
    dsr.id as source_record_id,
    dsr.retrieved_at,
    nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') as source_sector,
    nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') as source_industry
  from public.data_source_records dsr
  join public.security_identity_observations sio on sio.source_record_id=dsr.id
  where dsr.source_code='TRENDLYNE_MCP'
    and dsr.record_kind='SECURITY_IDENTITY'
    and sio.security_id is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,sector}'),'') is not null
    and nullif(trim(dsr.raw_payload #>> '{identity,industry}'),'') is not null
  order by sio.security_id, dsr.retrieved_at desc, dsr.id desc
)
insert into public.security_attribute_observations(
  security_id,source_record_id,source_code,attribute_code,text_value,normalized_value,observed_at,retrieved_at,fresh_until,evidence_status
)
select security_id,source_record_id,'TRENDLYNE_MCP','INDUSTRY',source_industry,source_industry,retrieved_at,retrieved_at,retrieved_at + interval '365 days','AVAILABLE'
from latest
on conflict (source_record_id,security_id,attribute_code) do nothing;

insert into public.security_attribute_decisions(security_id,attribute_code,selected_observation_id,decision_basis,decided_at,notes)
select sao.security_id,sao.attribute_code,sao.id,'EVIDENCE_PRIORITY',now(),
       'D21 promotion of previously stored Trendlyne identity classification evidence; exact provider labels only.'
from public.security_attribute_observations sao
join (
  select security_id,attribute_code,max(retrieved_at) as max_retrieved
  from public.security_attribute_observations
  where source_code='TRENDLYNE_MCP' and attribute_code in ('SECTOR','INDUSTRY') and evidence_status='AVAILABLE'
  group by security_id,attribute_code
) latest on latest.security_id=sao.security_id and latest.attribute_code=sao.attribute_code and latest.max_retrieved=sao.retrieved_at
where sao.source_code='TRENDLYNE_MCP' and sao.attribute_code in ('SECTOR','INDUSTRY') and sao.evidence_status='AVAILABLE'
on conflict (security_id,attribute_code)
do update set selected_observation_id=excluded.selected_observation_id,decision_basis=excluded.decision_basis,decided_at=excluded.decided_at,notes=excluded.notes;

commit;
