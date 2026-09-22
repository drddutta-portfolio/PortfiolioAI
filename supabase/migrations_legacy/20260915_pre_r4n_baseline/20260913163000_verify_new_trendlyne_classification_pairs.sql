with new_sectors(code,name) as (
  values
    ('CEMENT_AND_CONSTRUCTION','Cement and Construction'),
    ('OIL_AND_GAS','Oil & Gas'),
    ('METALS_AND_MINING','Metals & Mining'),
    ('REALTY','Realty'),
    ('HEALTHCARE','Healthcare')
)
insert into public.sectors(code,name,is_active)
select code,name,true from new_sectors
on conflict do nothing;

with new_industries(sector_name,code,name) as (
  values
    ('Cement and Construction','CEMENT_AND_CONSTRUCTION_CEMENT_AND_CEMENT_PRODUCTS','Cement & Cement Products'),
    ('Chemicals & Petrochemicals','CHEMICALS_AND_PETROCHEMICALS_COMMODITY_CHEMICALS','Commodity Chemicals'),
    ('Oil & Gas','OIL_AND_GAS_REFINERIES_PETRO_PRODUCTS','Refineries/Petro-Products'),
    ('Software & Services','SOFTWARE_AND_SERVICES_INTERNET_SOFTWARE_AND_SERVICES','Internet Software & Services'),
    ('Banking and Finance','BANKING_AND_FINANCE_ASSET_MANAGEMENT_COS','Asset Management Cos.'),
    ('Metals & Mining','METALS_AND_MINING_IRON_AND_STEEL_INTERM_PRODUCTS','Iron & Steel/Interm.Products'),
    ('Utilities','UTILITIES_POWER_ELECTRIC_UTILITIES','Power - Electric Utilities'),
    ('Realty','REALTY_REALTY','Realty'),
    ('Utilities','UTILITIES_GREEN_AND_RENEWABLE_ENERGY','Green & Renewable Energy'),
    ('Healthcare','HEALTHCARE_HEALTHCARE_FACILITIES','Healthcare Facilities'),
    ('Metals & Mining','METALS_AND_MINING_ALUMINIUM_AND_ALUMINIUM_PRODUCTS','Aluminium and Aluminium Products')
)
insert into public.industries(sector_id,code,name,is_active)
select s.id,n.code,n.name,true
from new_industries n
join public.sectors s on lower(s.name)=lower(n.sector_name)
on conflict do nothing;

with pairs(source_sector,source_industry) as (
  values
    ('Cement and Construction','Cement & Cement Products'),
    ('Chemicals & Petrochemicals','Commodity Chemicals'),
    ('Oil & Gas','Refineries/Petro-Products'),
    ('Software & Services','Internet Software & Services'),
    ('Banking and Finance','Asset Management Cos.'),
    ('Metals & Mining','Iron & Steel/Interm.Products'),
    ('Utilities','Power - Electric Utilities'),
    ('Realty','Realty'),
    ('Utilities','Green & Renewable Energy'),
    ('Healthcare','Healthcare Facilities'),
    ('Metals & Mining','Aluminium and Aluminium Products')
)
insert into public.classification_source_mappings(
  source_code,taxonomy_code,taxonomy_version,source_sector,source_industry,
  sector_id,industry_id,mapping_status,evidence,reviewed_at
)
select
  'TRENDLYNE_MCP','PORTFOLIOAI_INDUSTRY',1,p.source_sector,p.source_industry,
  s.id,i.id,'VERIFIED',
  jsonb_build_object(
    'review_basis','EXACT_STORED_PROVIDER_PAIR',
    'review_stage','D21','provider','TRENDLYNE_MCP',
    'rule','No ticker, company-name, theme, or market-cap inference.'
  ),now()
from pairs p
join public.sectors s on lower(s.name)=lower(p.source_sector)
join public.industries i on i.sector_id=s.id and lower(i.name)=lower(p.source_industry)
on conflict (source_code,taxonomy_code,taxonomy_version,source_sector,source_industry)
do update set
  sector_id=excluded.sector_id,industry_id=excluded.industry_id,
  mapping_status='VERIFIED',evidence=excluded.evidence,reviewed_at=excluded.reviewed_at;

-- Provider observations are immutable. Select the latest exact verified pair by
-- pointing current decisions at the append-only observations; do not rewrite them.
with verified_pairs as (
  select source_sector,source_industry
  from public.classification_source_mappings
  where source_code='TRENDLYNE_MCP'
    and taxonomy_code='PORTFOLIOAI_INDUSTRY' and taxonomy_version=1
    and mapping_status='VERIFIED'
), paired_records as (
  select so.security_id,so.source_record_id,so.id as sector_obs_id,io.id as industry_obs_id,
         greatest(so.retrieved_at,io.retrieved_at) as evidence_time
  from public.security_attribute_observations so
  join public.security_attribute_observations io
    on io.security_id=so.security_id and io.source_record_id=so.source_record_id
   and io.source_code=so.source_code and io.attribute_code='INDUSTRY'
  join verified_pairs p on p.source_sector=so.text_value and p.source_industry=io.text_value
  where so.source_code='TRENDLYNE_MCP' and so.attribute_code='SECTOR'
    and so.evidence_status='AVAILABLE' and io.evidence_status='AVAILABLE'
), latest as (
  select distinct on (security_id) * from paired_records
  order by security_id,evidence_time desc,source_record_id desc
), decision_rows as (
  select security_id,'SECTOR'::text attribute_code,sector_obs_id selected_observation_id from latest
  union all
  select security_id,'INDUSTRY'::text,industry_obs_id from latest
)
insert into public.security_attribute_decisions(
  security_id,attribute_code,selected_observation_id,decision_basis,decided_at,notes
)
select d.security_id,d.attribute_code,d.selected_observation_id,'EVIDENCE_PRIORITY',now(),
       'Selected from an exact verified Trendlyne sector/industry source-pair mapping during D21.'
from decision_rows d
where not exists (
  select 1 from public.security_attribute_decisions existing
  where existing.security_id=d.security_id and existing.attribute_code=d.attribute_code
)
on conflict do nothing;
