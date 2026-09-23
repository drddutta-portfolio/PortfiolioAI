insert into public.classification_source_mappings (
  source_code,
  taxonomy_code,
  taxonomy_version,
  source_sector,
  source_industry,
  sector_id,
  industry_id,
  mapping_status,
  evidence,
  reviewed_at,
  reviewed_by
)
select
  'TRENDLYNE_MCP',
  'PORTFOLIOAI_INDUSTRY',
  1,
  'Pharmaceuticals & Biotechnology',
  'Pharmaceuticals',
  s.id,
  i.id,
  'VERIFIED',
  jsonb_build_object(
    'provider', 'TRENDLYNE_MCP',
    'review_basis', 'EXACT_PROVIDER_PAIR_TO_EXISTING_CANONICAL_TAXONOMY',
    'review_stage', 'PROGRAM_A_A2_V5',
    'canonical_peer', 'TORNTPHARM',
    'rule', 'No ticker, company-name, theme, or market-cap inference.'
  ),
  now(),
  null
from public.sectors s
join public.industries i on i.sector_id = s.id
where s.name = 'Pharma'
  and i.name = 'Pharmaceuticals'
on conflict (source_code, taxonomy_code, taxonomy_version, source_sector, source_industry)
do nothing;

do $$
begin
  if not exists (
    select 1
    from public.classification_source_mappings m
    join public.sectors s on s.id = m.sector_id
    join public.industries i on i.id = m.industry_id
    where m.source_code = 'TRENDLYNE_MCP'
      and m.taxonomy_code = 'PORTFOLIOAI_INDUSTRY'
      and m.taxonomy_version = 1
      and m.source_sector = 'Pharmaceuticals & Biotechnology'
      and m.source_industry = 'Pharmaceuticals'
      and m.mapping_status = 'VERIFIED'
      and s.name = 'Pharma'
      and i.name = 'Pharmaceuticals'
  ) then
    raise exception 'REVIEWED_TRENDLYNE_PHARMA_MAPPING_NOT_MATERIALIZED';
  end if;
end;
$$;
