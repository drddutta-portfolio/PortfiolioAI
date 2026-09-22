-- Stage 7 audit hardening: provider evidence is append-only even for trusted operational roles.

create or replace function public.portfolioai_reject_stage7_evidence_mutation()
returns trigger language plpgsql set search_path='' as $$
begin
  raise exception using errcode='55000',message='Stage 7 provider evidence is immutable.';
end $$;
revoke execute on function public.portfolioai_reject_stage7_evidence_mutation() from public,anon,authenticated;

create trigger data_source_records_immutable before update or delete on public.data_source_records for each row execute function public.portfolioai_reject_stage7_evidence_mutation();
create trigger security_identity_observations_immutable before update or delete on public.security_identity_observations for each row execute function public.portfolioai_reject_stage7_evidence_mutation();
create trigger security_attribute_observations_immutable before update or delete on public.security_attribute_observations for each row execute function public.portfolioai_reject_stage7_evidence_mutation();
create trigger fundamental_observations_immutable before update or delete on public.fundamental_observations for each row execute function public.portfolioai_reject_stage7_evidence_mutation();
create trigger market_cap_classification_observations_immutable before update or delete on public.market_cap_classification_observations for each row execute function public.portfolioai_reject_stage7_evidence_mutation();

create table public.enrichment_decision_events (
  id uuid primary key default gen_random_uuid(),
  decision_kind text not null check(decision_kind in ('SECURITY_ATTRIBUTE','FUNDAMENTAL')),
  security_id uuid not null references public.securities(id) on delete restrict,
  operation text not null check(operation in ('INSERT','UPDATE','DELETE')),
  old_decision jsonb,
  new_decision jsonb,
  changed_by uuid references auth.users(id) on delete restrict,
  changed_at timestamptz not null default now(),
  constraint enrichment_decision_event_shape check((operation='INSERT' and old_decision is null and new_decision is not null) or (operation='UPDATE' and old_decision is not null and new_decision is not null) or (operation='DELETE' and old_decision is not null and new_decision is null))
);

create or replace function public.portfolioai_audit_enrichment_decision()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.enrichment_decision_events(decision_kind,security_id,operation,old_decision,new_decision,changed_by)
  values(case when tg_table_name='security_attribute_decisions' then 'SECURITY_ATTRIBUTE' else 'FUNDAMENTAL' end,
    coalesce(new.security_id,old.security_id),tg_op,case when tg_op='INSERT' then null else to_jsonb(old) end,case when tg_op='DELETE' then null else to_jsonb(new) end,auth.uid());
  return coalesce(new,old);
end $$;
revoke execute on function public.portfolioai_audit_enrichment_decision() from public,anon,authenticated;

create trigger security_attribute_decisions_audit after insert or update or delete on public.security_attribute_decisions for each row execute function public.portfolioai_audit_enrichment_decision();
create trigger fundamental_observation_decisions_audit after insert or update or delete on public.fundamental_observation_decisions for each row execute function public.portfolioai_audit_enrichment_decision();
create trigger enrichment_decision_events_immutable before update or delete on public.enrichment_decision_events for each row execute function public.portfolioai_reject_stage7_evidence_mutation();

alter table public.enrichment_decision_events enable row level security;
revoke all on table public.enrichment_decision_events from anon,authenticated;
grant select on table public.enrichment_decision_events to authenticated;
create policy "Users read held enrichment decision history" on public.enrichment_decision_events for select to authenticated using(exists(select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id where t.security_id=enrichment_decision_events.security_id and p.user_id=(select auth.uid())));

comment on table public.enrichment_decision_events is 'Append-only old/new audit history for every canonical enrichment selection change.';
