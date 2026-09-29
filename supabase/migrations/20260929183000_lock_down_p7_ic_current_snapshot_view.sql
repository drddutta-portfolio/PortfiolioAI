-- The security-invoker view must be unavailable before authentication.
revoke all on public.current_research_evidence_snapshot_v1 from public, anon;
grant select on public.current_research_evidence_snapshot_v1 to authenticated;
