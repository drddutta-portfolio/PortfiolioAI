-- BANK V1-4 maintenance recurrence control plane.
-- Development-only use. Recurrence is activated separately after exact-head verification.

create or replace function public.v14_bank_calendar_refresh_v1()
returns bigint
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_session_date date := (clock_timestamp() at time zone 'Asia/Kolkata')::date;
  v_url text := 'https://www.nseindia.com/resources/exchange-communication-holidays?apiversion=v2';
  v_request_id bigint;
  v_payload jsonb;
begin
  v_request_id := net.http_get(
    url := v_url,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'User-Agent','Mozilla/5.0 PortfolioAI/1.0',
      'Accept','text/html'
    ),
    timeout_milliseconds := 30000
  );

  v_payload := jsonb_build_object(
    'version','V1_4_NSE_CALENDAR_REFRESH_V1',
    'session_date',v_session_date::text,
    'request_id',v_request_id,
    'source_url',v_url,
    'requested_at',clock_timestamp()
  );

  insert into public.data_source_records(
    source_code,record_kind,external_record_id,retrieved_at,payload_hash,raw_payload,terms_snapshot
  ) values (
    'NSE_OFFICIAL','V1_4_NSE_CALENDAR_REFRESH_REQUEST',
    v_session_date::text||':'||v_request_id::text,clock_timestamp(),
    encode(digest(convert_to(v_payload::text,'UTF8'),'sha256'),'hex'),
    v_payload,
    jsonb_build_object('environment','PortfolioAI Dev','purpose','BANK_MAINTENANCE_CALENDAR_REFRESH')
  );

  return v_request_id;
end
$$;

create or replace function public.v14_bank_maintenance_schedule_v1()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_ist timestamp := clock_timestamp() at time zone 'Asia/Kolkata';
  v_session_date date := (clock_timestamp() at time zone 'Asia/Kolkata')::date;
  v_refresh public.data_source_records%rowtype;
  v_response record;
  v_live_hash text;
  v_baseline_hash text;
  v_decision text := 'UNKNOWN';
  v_reason text := 'CALENDAR_PRECONDITION_NOT_EVALUATED';
  v_special_state text := 'NONE';
  v_is_weekend boolean;
  v_is_holiday boolean;
  v_decision_payload jsonb;
  v_decision_id uuid;
  v_grant_payload jsonb;
  v_grant_id uuid;
  v_request_id bigint;
  v_scheduler_enabled boolean := false;
  v_special_approved boolean := false;
  v_special_timing text;
  v_holidays date[] := array[
    date '2026-01-26',date '2026-03-03',date '2026-03-26',date '2026-03-31',
    date '2026-04-03',date '2026-04-14',date '2026-05-01',date '2026-05-28',
    date '2026-06-26',date '2026-09-14',date '2026-10-02',date '2026-10-20',
    date '2026-11-10',date '2026-11-24',date '2026-12-25'
  ];
begin
  if v_session_date < date '2026-01-01' or v_session_date > date '2026-12-31' then
    v_reason := 'OUTSIDE_APPROVED_2026_VERIFICATION_HORIZON';
  else
    select * into v_refresh
    from public.data_source_records d
    where d.source_code='NSE_OFFICIAL'
      and d.record_kind='V1_4_NSE_CALENDAR_REFRESH_REQUEST'
      and d.raw_payload->>'session_date'=v_session_date::text
      and d.retrieved_at >= v_now - interval '30 minutes'
    order by d.retrieved_at desc,d.id desc
    limit 1;

    if v_refresh.id is null then
      v_reason := 'CURRENT_NSE_CALENDAR_REFRESH_MISSING';
    else
      select r.id,r.status_code,r.timed_out,r.error_msg,r.content
      into v_response
      from net._http_response r
      where r.id=(v_refresh.raw_payload->>'request_id')::bigint;

      if v_response.id is null then
        v_reason := 'CURRENT_NSE_CALENDAR_REFRESH_PENDING';
      elsif v_response.timed_out or coalesce(v_response.status_code,0)<>200 then
        v_reason := 'CURRENT_NSE_CALENDAR_REFRESH_FAILED';
      elsif position('Market Timings &amp; Holidays - NSE India' in coalesce(v_response.content,''))=0
         or position('November 08, 2026' in coalesce(v_response.content,''))=0
         or position('Muhurat Trading' in coalesce(v_response.content,''))=0 then
        v_reason := 'CURRENT_NSE_CALENDAR_IDENTITY_OR_SPECIAL_NOTE_MISSING';
      else
        v_live_hash := encode(digest(convert_to(v_response.content,'UTF8'),'sha256'),'hex');

        select d.raw_payload->>'content_sha256' into v_baseline_hash
        from public.data_source_records d
        where d.source_code='NSE_OFFICIAL'
          and d.record_kind='V1_4_NSE_CALENDAR_APPROVED_BASELINE'
          and d.raw_payload->>'source_url'=v_refresh.raw_payload->>'source_url'
        order by d.retrieved_at desc,d.id desc
        limit 1;

        insert into public.data_source_records(
          source_code,record_kind,external_record_id,retrieved_at,payload_hash,raw_payload,terms_snapshot
        ) values (
          'NSE_OFFICIAL','V1_4_NSE_CALENDAR_REFRESH_CAPTURE',
          v_session_date::text||':'||v_response.id::text,v_now,
          v_live_hash,
          jsonb_build_object(
            'version','V1_4_NSE_CALENDAR_REFRESH_CAPTURE_V1',
            'session_date',v_session_date::text,
            'request_id',v_response.id,
            'source_url',v_refresh.raw_payload->>'source_url',
            'content_sha256',v_live_hash,
            'status_code',v_response.status_code,
            'special_note_anchor','November 08, 2026 / Muhurat Trading'
          ),
          jsonb_build_object('environment','PortfolioAI Dev','source_identity','NSE_LIVE_HOLIDAY_PAGE')
        );

        if v_baseline_hash is null then
          v_reason := 'APPROVED_LIVE_CALENDAR_BASELINE_MISSING';
        elsif v_live_hash<>v_baseline_hash then
          v_reason := 'NSE_LIVE_CALENDAR_CHANGE_DETECTED';
        else
          v_is_weekend := extract(isodow from v_session_date) in (6,7);
          v_is_holiday := v_session_date=any(v_holidays);

          if v_session_date=date '2026-11-08' then
            select true,d.raw_payload->>'trading_window'
            into v_special_approved,v_special_timing
            from public.data_source_records d
            where d.source_code='NSE_OFFICIAL'
              and d.record_kind='V1_4_NSE_SPECIAL_SESSION_APPROVED'
              and d.raw_payload->>'session_date'='2026-11-08'
              and d.raw_payload->>'decision'='OPEN'
              and nullif(d.raw_payload->>'trading_window','') is not null
            order by d.retrieved_at desc,d.id desc
            limit 1;

            if coalesce(v_special_approved,false) then
              v_decision := 'OPEN';
              v_reason := 'OFFICIAL_SPECIAL_SESSION_APPROVED';
              v_special_state := 'SPECIAL_OPEN';
            else
              v_decision := 'UNKNOWN';
              v_reason := 'SPECIAL_SESSION_TIMING_PENDING_OFFICIAL_CIRCULAR';
              v_special_state := 'SPECIAL_PENDING';
            end if;
          elsif v_is_holiday then
            v_decision := 'CLOSED';
            v_reason := 'OFFICIAL_CM_TRADING_HOLIDAY';
          elsif v_is_weekend then
            v_decision := 'CLOSED';
            v_reason := 'WEEKEND_NO_APPROVED_SPECIAL_SESSION';
          else
            v_decision := 'OPEN';
            v_reason := 'APPROVED_CM_CALENDAR_WEEKDAY_AND_LIVE_PAGE_UNCHANGED';
          end if;
        end if;
      end if;
    end if;
  end if;

  v_decision_payload := jsonb_build_object(
    'version','V1_4_NSE_SESSION_CALENDAR_DECISION_V1',
    'session_date',v_session_date::text,
    'decision',v_decision,
    'reason',v_reason,
    'verification_horizon_end','2026-12-31',
    'annual_calendar_source_url','https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf',
    'annual_calendar_reference','NSE/CMTR/71775; Circular 172/2025; 2025-12-12',
    'live_source_url','https://www.nseindia.com/resources/exchange-communication-holidays?apiversion=v2',
    'live_content_sha256',v_live_hash,
    'approved_live_baseline_sha256',v_baseline_hash,
    'special_session_state',v_special_state,
    'special_session_trading_window',v_special_timing,
    'evaluated_at',v_now
  );

  insert into public.data_source_records(
    source_code,record_kind,external_record_id,retrieved_at,payload_hash,raw_payload,terms_snapshot
  ) values (
    'NSE_OFFICIAL','V1_4_NSE_SESSION_CALENDAR_DECISION',
    v_session_date::text||':'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24MISSMS'),v_now,
    encode(digest(convert_to(v_decision_payload::text,'UTF8'),'sha256'),'hex'),
    v_decision_payload,
    jsonb_build_object('environment','PortfolioAI Dev','fail_closed',true)
  ) returning id into v_decision_id;

  if v_decision<>'OPEN' then
    return jsonb_build_object('state','SKIPPED','session_date',v_session_date,'decision',v_decision,'reason',v_reason,
      'calendar_decision_id',v_decision_id,'provider_calls',0);
  end if;

  select c.scheduler_enabled into v_scheduler_enabled
  from public.provider_ingestion_controls c
  where c.source_code='ANGEL_ONE';

  if not coalesce(v_scheduler_enabled,false) then
    return jsonb_build_object('state','SKIPPED','session_date',v_session_date,'decision','OPEN',
      'reason','ANGEL_ONE_SCHEDULER_DISABLED','calendar_decision_id',v_decision_id,'provider_calls',0);
  end if;

  if exists(
    select 1 from public.data_ingestion_runs r
    where r.operation='V1_4_BANK_MAINTENANCE_DAILY_V1'
      and r.metadata->>'session'=v_session_date::text
      and r.status in ('RUNNING','SUCCEEDED','PARTIAL')
  ) then
    return jsonb_build_object('state','SKIPPED','session_date',v_session_date,'decision','OPEN',
      'reason','SESSION_ALREADY_ATTEMPTED','calendar_decision_id',v_decision_id,'provider_calls',0);
  end if;

  v_grant_payload := jsonb_build_object(
    'action','V1_4_BANK_MAINTENANCE_DAILY_V1',
    'expires_at',to_char((v_now+interval '30 minutes') at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'environment','PortfolioAI Dev',
    'project_ref','lrgpjimipfkyoqbpsqzz',
    'security_id','BANKING_13_PLUS_NIFTY_BANK:'||v_session_date::text,
    'portfolio_id','6193a4aa-3235-4057-bddc-209fcf443fc2',
    'authorization','Owner-approved BANK V1-4 continuous maintenance: 19:00 IST verified NSE sessions, Development only, <=14 history attempts/day, zero automatic retries.'
  );

  insert into public.data_source_records(
    source_code,record_kind,external_record_id,retrieved_at,payload_hash,raw_payload,terms_snapshot
  ) values (
    'OWNER_REVIEWED_CLASSIFICATION','P4_EXECUTION_GRANT',
    'V1_4_BANK_MAINTENANCE_DAILY_V1:'||v_session_date::text,v_now,
    encode(digest(convert_to(v_grant_payload::text,'UTF8'),'sha256'),'hex'),
    v_grant_payload,
    jsonb_build_object('mode','POST_D_P4_ONE_TIME_EXECUTION_GRANT','secret_transport',false,
      'issuer','OWNER_AUTHORIZED_DEVELOPMENT_CONTROL_PLANE','calendar_decision_id',v_decision_id)
  ) returning id into v_grant_id;

  v_request_id := net.http_post(
    url := 'https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-bank-maintenance-run',
    body := jsonb_build_object(
      'action','V1_4_BANK_MAINTENANCE_DAILY_V1',
      'portfolioId','6193a4aa-3235-4057-bddc-209fcf443fc2',
      'sessionDate',v_session_date::text,
      'calendarDecisionId',v_decision_id::text,
      'grantId',v_grant_id::text
    ),
    params := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type','application/json'),
    timeout_milliseconds := 120000
  );

  return jsonb_build_object('state','DISPATCHED','session_date',v_session_date,'decision','OPEN','reason',v_reason,
    'calendar_decision_id',v_decision_id,'grant_id',v_grant_id,'request_id',v_request_id);
end
$$;

do $$
declare
  v_payload jsonb;
begin
  v_payload := jsonb_build_object(
    'version','V1_4_NSE_CM_CALENDAR_2026_BASE_V1',
    'source_url','https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf',
    'download_reference','NSE/CMTR/71775',
    'circular_reference','172/2025',
    'published_date','2025-12-12',
    'segment','CAPITAL_MARKET',
    'verification_horizon_end','2026-12-31',
    'weekday_trading_holidays',jsonb_build_array(
      '2026-01-26','2026-03-03','2026-03-26','2026-03-31','2026-04-03','2026-04-14',
      '2026-05-01','2026-05-28','2026-06-26','2026-09-14','2026-10-02','2026-10-20',
      '2026-11-10','2026-11-24','2026-12-25'
    ),
    'weekend_holidays',jsonb_build_array('2026-02-15','2026-03-21','2026-08-15','2026-11-08'),
    'special_sessions_pending',jsonb_build_array(
      jsonb_build_object('session_date','2026-11-08','event','Muhurat Trading','timings','PENDING_SEPARATE_OFFICIAL_CIRCULAR')
    ),
    'fail_closed_rule','UNKNOWN_OR_CONTRADICTORY_DATES_DO_NOT_DISPATCH'
  );

  if not exists(
    select 1 from public.data_source_records
    where source_code='NSE_OFFICIAL' and record_kind='V1_4_NSE_TRADING_CALENDAR_2026_BASE'
      and external_record_id='NSE/CMTR/71775'
  ) then
    insert into public.data_source_records(
      source_code,record_kind,external_record_id,retrieved_at,payload_hash,raw_payload,terms_snapshot
    ) values (
      'NSE_OFFICIAL','V1_4_NSE_TRADING_CALENDAR_2026_BASE','NSE/CMTR/71775',clock_timestamp(),
      encode(digest(convert_to(v_payload::text,'UTF8'),'sha256'),'hex'),v_payload,
      jsonb_build_object('environment','PortfolioAI Dev','approved_contract','BANK_V1_4_CONTINUOUS_MAINTENANCE')
    );
  end if;
end
$$;
