-- P7-IC IC2/IC3 canonical evidence boundary. Development application is separately controlled.

create table public.research_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  as_of_date date not null,
  methodology_authority text not null,
  methodology_version text not null,
  profile_code text not null,
  subprofile_code text,
  requirement_registry_version text not null,
  snapshot_status text not null check (snapshot_status in ('READY','INSUFFICIENT','STALE','CONFLICTING','REVIEW_REQUIRED')),
  snapshot_hash text not null check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (security_id, as_of_date, methodology_authority, methodology_version, requirement_registry_version, snapshot_hash)
);

create table public.research_evidence_snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.research_evidence_snapshots(id) on delete restrict,
  requirement_code text not null,
  metric_code text,
  required boolean not null default true,
  minimum_history integer not null default 1 check (minimum_history > 0),
  freshness_policy text,
  benchmark_authority text[],
  applicability text not null check (applicability in ('APPLICABLE','NOT_APPLICABLE')),
  evidence_state text not null check (evidence_state in ('FRESH','STALE','MISSING','INSUFFICIENT','CONFLICTING','REVIEW_REQUIRED','NOT_APPLICABLE')),
  candidate_evidence_ids uuid[] not null default '{}',
  selected_evidence_id uuid,
  evidence_as_of_date date,
  retrieved_at timestamptz,
  fresh_through date,
  source_provider text,
  raw_source_record_id uuid references public.data_source_records(id) on delete restrict,
  normalized_value jsonb,
  validation_state text not null,
  canonical_selection_state text not null,
  reason_code text not null,
  recommended_remediation_action text not null,
  created_at timestamptz not null default now(),
  unique (snapshot_id, requirement_code)
);

create index research_evidence_snapshots_portfolio_security_created_idx
  on public.research_evidence_snapshots (portfolio_id, security_id, created_at desc);
create index research_evidence_snapshots_security_id_idx
  on public.research_evidence_snapshots (security_id);
create index research_evidence_snapshots_created_by_idx
  on public.research_evidence_snapshots (created_by) where created_by is not null;
create index research_evidence_snapshot_items_snapshot_state_idx
  on public.research_evidence_snapshot_items (snapshot_id, evidence_state);
create index research_evidence_snapshot_items_raw_source_record_id_idx
  on public.research_evidence_snapshot_items (raw_source_record_id) where raw_source_record_id is not null;

create function public.reject_research_evidence_snapshot_mutation_v1()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '55000', message = 'Research evidence snapshots are append-only.';
end;
$$;

create trigger research_evidence_snapshots_append_only
before update or delete on public.research_evidence_snapshots
for each row execute function public.reject_research_evidence_snapshot_mutation_v1();
create trigger research_evidence_snapshot_items_append_only
before update or delete on public.research_evidence_snapshot_items
for each row execute function public.reject_research_evidence_snapshot_mutation_v1();

alter table public.research_evidence_snapshots enable row level security;
alter table public.research_evidence_snapshot_items enable row level security;

create policy research_evidence_snapshots_owner_read
on public.research_evidence_snapshots for select to authenticated
using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));

create policy research_evidence_snapshot_items_owner_read
on public.research_evidence_snapshot_items for select to authenticated
using (exists (
  select 1 from public.research_evidence_snapshots s
  join public.portfolios p on p.id = s.portfolio_id
  where s.id = snapshot_id and p.user_id = (select auth.uid())
));

create view public.current_research_evidence_snapshot_v1
with (security_invoker = true) as
select s.*
from public.research_evidence_snapshots s
where not exists (
  select 1 from public.research_evidence_snapshots newer
  where newer.portfolio_id = s.portfolio_id
    and newer.security_id = s.security_id
    and (newer.as_of_date, newer.created_at, newer.id) > (s.as_of_date, s.created_at, s.id)
);

revoke all on public.research_evidence_snapshots from anon, authenticated;
revoke all on public.research_evidence_snapshot_items from anon, authenticated;
grant select on public.research_evidence_snapshots to authenticated;
grant select on public.research_evidence_snapshot_items to authenticated;
grant select on public.current_research_evidence_snapshot_v1 to authenticated;
grant all on public.research_evidence_snapshots to service_role;
grant all on public.research_evidence_snapshot_items to service_role;

comment on table public.research_evidence_snapshots is 'Append-only P7-IC canonical methodology evidence boundary; not an R6 score.';
comment on table public.research_evidence_snapshot_items is 'Append-only per-requirement evidence selection or explicit blocker.';
