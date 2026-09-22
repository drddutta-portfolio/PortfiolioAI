-- Audit evidence is append-only even for trusted operational roles.
create function public.portfolioai_reject_audit_mutation()
returns trigger language plpgsql set search_path='' as $$
begin
  raise exception using errcode='55000', message='Applied audit evidence is immutable.';
end;
$$;

revoke execute on function public.portfolioai_reject_audit_mutation() from public, anon, authenticated;

create trigger transaction_accounting_events_immutable
before update or delete on public.transaction_accounting_events
for each row execute function public.portfolioai_reject_audit_mutation();

create trigger security_classification_changes_immutable
before update or delete on public.security_classification_changes
for each row execute function public.portfolioai_reject_audit_mutation();
