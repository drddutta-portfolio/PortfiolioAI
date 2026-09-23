insert into public.sectors (id, name, code, is_active)
values
  ('10000000-0000-4000-8000-000000000021', 'Banking', 'BANKING', true),
  ('10000000-0000-4000-8000-000000000022', 'Pharma', 'PHARMA', true)
on conflict (id) do update
set name = excluded.name,
    code = excluded.code,
    is_active = excluded.is_active;

insert into public.industries (id, sector_id, name, code, is_active)
values
  ('10000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000021', 'Private Sector Bank', 'BANKING_PRIVATE_SECTOR_BANK', true),
  ('10000000-0000-4000-8000-000000000032', '10000000-0000-4000-8000-000000000022', 'Pharmaceuticals', 'PHARMA_PHARMACEUTICALS', true)
on conflict (id) do update
set sector_id = excluded.sector_id,
    name = excluded.name,
    code = excluded.code,
    is_active = excluded.is_active;

do $$
begin
  if not exists (
    select 1 from public.industries i join public.sectors s on s.id = i.sector_id
    where s.id = '10000000-0000-4000-8000-000000000021'
      and s.name = 'Banking' and s.code = 'BANKING'
      and i.id = '10000000-0000-4000-8000-000000000031'
      and i.name = 'Private Sector Bank' and i.code = 'BANKING_PRIVATE_SECTOR_BANK'
  ) or not exists (
    select 1 from public.industries i join public.sectors s on s.id = i.sector_id
    where s.id = '10000000-0000-4000-8000-000000000022'
      and s.name = 'Pharma' and s.code = 'PHARMA'
      and i.id = '10000000-0000-4000-8000-000000000032'
      and i.name = 'Pharmaceuticals' and i.code = 'PHARMA_PHARMACEUTICALS'
  ) then
    raise exception 'PROGRAM_A_CANONICAL_TAXONOMY_PREREQUISITES_NOT_MATERIALIZED';
  end if;
end;
$$;
