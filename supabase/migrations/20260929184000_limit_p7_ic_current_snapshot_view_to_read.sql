-- Views inherit broad default privileges; authenticated access is read-only.
revoke all on public.current_research_evidence_snapshot_v1 from authenticated;
grant select on public.current_research_evidence_snapshot_v1 to authenticated;
