-- Stage 8.3B — reviewed non-financial scoring-profile validation cohort.
-- These assignments affect scoring methodology only. They do not populate canonical
-- sector/industry enrichment, change portfolio roles, activate scoring, or call a provider.

with assignments(symbol, scoring_profile_code, source_reference, notes) as (
  values
    ('INFY','IT_TECH','https://www.infosys.com/about/','Official Infosys overview identifies Infosys as a global consulting and IT services / digital services company.'),
    ('TORNTPHARM','PHARMA_HEALTHCARE','https://www.torrentpharma.com/ourstory/overview/','Official Torrent Pharmaceuticals overview identifies the company as a leading pharmaceutical company.'),
    ('M&M','AUTO_COMPONENTS','https://www.mahindra.com/our-business/automotive','Official Mahindra automotive page identifies Mahindra & Mahindra as a leading manufacturer of passenger and commercial vehicles.')
)
insert into public.security_scoring_profile_assignments(
  security_id, scoring_profile_code, assignment_status, assignment_basis,
  source_reference, reviewed_at, notes
)
select
  s.id,
  a.scoring_profile_code,
  'REVIEWED',
  'OFFICIAL_COMPANY_SOURCE_VALIDATION_COHORT',
  a.source_reference,
  clock_timestamp(),
  a.notes
from assignments a
join public.securities s on s.symbol=a.symbol
where exists (select 1 from public.current_holdings ch where ch.security_id=s.id)
on conflict (security_id) do update set
  scoring_profile_code=excluded.scoring_profile_code,
  assignment_status=excluded.assignment_status,
  assignment_basis=excluded.assignment_basis,
  source_reference=excluded.source_reference,
  reviewed_at=excluded.reviewed_at,
  notes=excluded.notes;
