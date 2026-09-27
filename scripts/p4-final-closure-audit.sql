-- Deterministic read-only Post-D P4 closure audit for PortfolioAI Dev.

begin transaction read only;

with latest as (
  select distinct on (external_record_id)
         external_record_id,
         raw_payload,
         retrieved_at
  from public.data_source_records
  where record_kind = 'P4_TERMINAL_READINESS_V2'
  order by external_record_id, retrieved_at desc
),
domain_rows as (
  select l.external_record_id,
         l.raw_payload->>'asset_class' as asset_class,
         l.raw_payload->>'overall_state' as overall_state,
         d.key as domain,
         d.value->>'state' as state,
         d.value->>'reason' as reason
  from latest l
  cross join lateral jsonb_each(l.raw_payload->'domains') d
),
domain_counts as (
  select domain, state, reason, count(*) as count
  from domain_rows
  group by domain, state, reason
),
summary as (
  select jsonb_build_object(
    'terminal_records', (select count(*) from latest),
    'equities', (select count(*) from latest where raw_payload->>'asset_class' = 'EQUITY'),
    'etfs', (select count(*) from latest where raw_payload->>'asset_class' = 'ETF'),
    'unknown_states', (select count(*) from domain_rows where state is null or state = 'UNKNOWN'),
    'invalid_states', (select count(*) from domain_rows where state not in ('READY','BLOCKED','NOT_APPLICABLE','OWNER_DEFERRED')),
    'records_without_ten_domains', (
      select count(*)
      from latest
      where (select count(*) from jsonb_object_keys(raw_payload->'domains')) <> 10
    ),
    'overall', (
      select jsonb_object_agg(overall_state, n)
      from (
        select raw_payload->>'overall_state' as overall_state, count(*) as n
        from latest
        group by raw_payload->>'overall_state'
      ) x
    ),
    'domains', (select jsonb_agg(jsonb_build_object('domain',domain,'state',state,'reason',reason,'count',count) order by domain,state,reason) from domain_counts)
  ) as result
)
select result from summary;

commit;
