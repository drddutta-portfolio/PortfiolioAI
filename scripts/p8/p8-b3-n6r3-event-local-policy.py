#!/usr/bin/env python3
import io, json, os, re
from collections import defaultdict
from pathlib import Path

import boto3
import pyarrow.parquet as pq
import psycopg
from botocore.config import Config
from psycopg.rows import dict_row

PROJECT_REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID="P8_EXP_NSE_MONTHLY_6M_V1"
ROOT="portfolioai-history/development/p8"
ADJ_V1=f"{ROOT}/b3/adjusted-series/v1"
LEDGER_V1=f"{ROOT}/b3/adjusted-decision-ledger/v1"
RECOVERY_FILE=Path("docs/p8/PortfolioAI_P8_B3_N6R2_DIVIDEND_RECOVERY_2026-10-03.json")
OUT=Path("docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_LOCAL_POLICY_AUDIT_2026-10-03.json")
MATRIX=Path("docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_BOUNDARY_MATRIX_2026-10-03.csv")
VERSION="P8_B3_N6R3_EVENT_LOCAL_POLICY_V1"

def required(name):
    v=os.environ.get(name,"").strip()
    if not v: raise RuntimeError(f"Missing {name}")
    return v

def normalize_account(raw):
    raw=raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else: host=raw
    suffix=".r2.cloudflarestorage.com"
    return host[:-len(suffix)] if host.endswith(suffix) else host

def s3_client():
    account=normalize_account(required("CLOUDFLARE_R2_ACCOUNT_ID"))
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(retries={"max_attempts":10,"mode":"adaptive"},connect_timeout=30,read_timeout=180,s3={"addressing_style":"path"})
    )

def read_table(s3,bucket,key,columns):
    raw=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    return pq.read_table(io.BytesIO(raw),columns=columns)

def adjusted_key(date):
    return f"{ADJ_V1}/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet"

def classify_boundary(action_types):
    a=set(action_types)
    if a == {"CASH_DIVIDEND"}:
        return "TOTAL_RETURN_BOUNDARY"
    if a & {"RIGHTS","DEMERGER","MERGER","BONUS","SPLIT","DELISTING"}:
        return "PRICE_AND_TOTAL_RETURN_BOUNDARY"
    return "PRICE_AND_TOTAL_RETURN_BOUNDARY"

def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db: raise RuntimeError("Refusing non-Development DB")
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev": raise RuntimeError("Refusing non-Development R2")
    s3=s3_client()

    recovery=json.loads(RECOVERY_FILE.read_text())
    recovered_norm_ids={
        e["normalization_id"]
        for e in recovery["events"]
        if e["recovery_state"]=="RECOVERED"
    }

    with psycopg.connect(db,row_factory=dict_row) as conn:
      with conn.cursor() as cur:
        cur.execute("""
          select distinct b.trade_date::text trade_date
          from public.p8_b3_benchmark_total_return_history b
          join public.p8_b3_source_archives a on a.id=b.source_archive_id
          where b.portfolio_id=%s and b.experiment_id=%s
            and a.raw_metadata->>'campaign_id'='P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1'
          order by trade_date
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        dates=[r["trade_date"] for r in cur.fetchall()]
        if len(dates)!=744: raise RuntimeError(f"Expected 744 dates, got {len(dates)}")

        # Unresolved normalization blockers, excluding N6R2 recoveries.
        cur.execute("""
          select n.id::text normalization_id,
                 n.historical_identity_id::text identity_id,
                 n.effective_date::text event_date,
                 n.action_type,
                 n.blocker_reason
          from public.p8_b3_corporate_action_normalizations n
          where n.portfolio_id=%s and n.experiment_id=%s
            and n.normalization_version='P8_B3_NORMALIZATION_V1'
            and n.normalization_state='BLOCKED'
            and n.historical_identity_id is not null
            and n.action_type in ('CASH_DIVIDEND','SPLIT','BONUS','RIGHTS','MERGER','DEMERGER','DELISTING')
          order by n.effective_date,n.id
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        norm_block=cur.fetchall()

        # Unresolved factor blockers, excluding N6R2 recoveries.
        cur.execute("""
          select n.id::text normalization_id,
                 f.historical_identity_id::text identity_id,
                 f.effective_date::text event_date,
                 n.action_type,
                 f.blocker_reason
          from public.p8_b3_adjustment_factors f
          join public.p8_b3_corporate_action_normalizations n
            on n.id=f.corporate_action_normalization_id
          where f.portfolio_id=%s and f.experiment_id=%s
            and f.adjustment_version='P8_B3_ADJUSTMENT_V2'
            and f.factor_state='BLOCKED'
          order by f.effective_date,f.id
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        factor_block=cur.fetchall()

        # Same-day ready dividend + capital action remains an explicit boundary.
        cur.execute("""
          select f.historical_identity_id::text identity_id,
                 f.effective_date::text event_date,
                 array_agg(distinct n.action_type order by n.action_type) action_types
          from public.p8_b3_adjustment_factors f
          join public.p8_b3_corporate_action_normalizations n
            on n.id=f.corporate_action_normalization_id
          where f.portfolio_id=%s and f.experiment_id=%s
            and f.adjustment_version='P8_B3_ADJUSTMENT_V2'
            and f.factor_state='READY'
          group by f.historical_identity_id,f.effective_date
          having bool_or(n.action_type='CASH_DIVIDEND')
             and bool_or(n.action_type in ('SPLIT','BONUS'))
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        simultaneous=cur.fetchall()

    events=defaultdict(lambda: defaultdict(lambda:{"actions":set(),"reasons":set(),"sources":set()}))

    for row in norm_block:
        if row["normalization_id"] in recovered_norm_ids: continue
        if not row["identity_id"] or not row["event_date"]: continue
        e=events[row["identity_id"]][row["event_date"]]
        e["actions"].add(row["action_type"]);e["reasons"].add(row["blocker_reason"]);e["sources"].add("NORMALIZATION")

    for row in factor_block:
        if row["normalization_id"] in recovered_norm_ids: continue
        if not row["identity_id"] or not row["event_date"]: continue
        e=events[row["identity_id"]][row["event_date"]]
        e["actions"].add(row["action_type"]);e["reasons"].add(row["blocker_reason"]);e["sources"].add("FACTOR")

    for row in simultaneous:
        e=events[row["identity_id"]][row["event_date"]]
        for a in row["action_types"]: e["actions"].add(a)
        e["reasons"].add("SIMULTANEOUS_CAPITAL_ACTION_AND_DIVIDEND_UNAPPROVED")
        e["sources"].add("SIMULTANEOUS_EVENT_POLICY")

    unresolved_identities=set(events)

    # Find each identity's actual raw dates using V1 adjusted partitions (one-for-one with raw).
    identity_dates=defaultdict(list)
    v1_blocked=0
    v1_ready=0
    v1_rows=0
    for date in dates:
        t=read_table(s3,bucket,adjusted_key(date),["historical_identity_id","series_state"])
        ids=t.column("historical_identity_id").to_pylist()
        states=t.column("series_state").to_pylist()
        for ident,state in zip(ids,states):
            ident=str(ident)
            v1_rows+=1
            if state=="BLOCKED": v1_blocked+=1
            else: v1_ready+=1
            if ident in unresolved_identities:
                identity_dates[ident].append(date)

    # Map each unresolved event to a segment boundary:
    # first actual raw row on/after event date. The boundary row's cross-event
    # return is blocked; the row itself may seed a new segment.
    boundary_by_identity=defaultdict(dict)
    boundary_rows=0
    for ident,date_map in events.items():
        actual=identity_dates.get(ident,[])
        for event_date,event in sorted(date_map.items()):
            boundary_date=next((d for d in actual if d>=event_date),None)
            kind=classify_boundary(event["actions"])
            boundary_by_identity[ident][event_date]={
                "event_date":event_date,
                "boundary_date":boundary_date,
                "boundary_kind":kind,
                "action_types":sorted(event["actions"]),
                "reasons":sorted(event["reasons"]),
                "sources":sorted(event["sources"]),
            }
            if boundary_date is not None: boundary_rows+=1

    # Under event-local policy, ordinary raw rows are not discarded.
    # A unique boundary row blocks only the cross-boundary return and starts a new segment.
    unique_boundary_pairs={
        (ident,b["boundary_date"])
        for ident,m in boundary_by_identity.items()
        for b in m.values()
        if b["boundary_date"] is not None
    }

    projected_daily_price_blocked=0
    projected_daily_return_boundary=len(unique_boundary_pairs)
    projected_daily_usable=v1_rows-projected_daily_price_blocked

    # Decision ledger impact: existing NO_TRADE remains unchanged.
    # Complex blocker remains only if the exact decision date is a segment boundary.
    listing=s3.list_objects_v2(Bucket=bucket,Prefix=f"{LEDGER_V1}/",MaxKeys=1000)
    decision_parts=[]
    for obj in listing.get("Contents") or []:
        m=re.search(r"decision_date=(\d{4}-\d{2}-\d{2})/part-00000\.parquet$",obj["Key"])
        if m: decision_parts.append((m.group(1),obj["Key"]))
    decision_parts=sorted(set(decision_parts))
    if len(decision_parts)!=32: raise RuntimeError(f"Expected 32 ledger partitions, got {len(decision_parts)}")

    v1_complex=0
    v1_no_trade=0
    v1_decision_ready=0
    projected_complex=0
    projected_no_trade=0
    projected_ready=0
    boundary_set=unique_boundary_pairs

    for date,key in decision_parts:
        t=read_table(s3,bucket,key,["historical_identity_id","state","blocker_reason"])
        for ident,state,reason in zip(
            t.column("historical_identity_id").to_pylist(),
            t.column("state").to_pylist(),
            t.column("blocker_reason").to_pylist()
        ):
            ident=str(ident)
            if state=="READY":
                v1_decision_ready+=1
                projected_ready+=1
            elif reason=="NO_TRADE_ON_DECISION_DATE":
                v1_no_trade+=1
                projected_no_trade+=1
            elif reason=="COMPLEX_CORPORATE_ACTION_BLOCKER":
                v1_complex+=1
                if (ident,date) in boundary_set:
                    projected_complex+=1
                else:
                    projected_ready+=1
            else:
                raise RuntimeError(f"Unexpected V1 decision state {state}/{reason}")

    matrix=[]
    for ident in sorted(boundary_by_identity):
        for event_date,b in sorted(boundary_by_identity[ident].items()):
            matrix.append({
                "historical_identity_id":ident,
                "event_date":event_date,
                "boundary_date":b["boundary_date"] or "",
                "boundary_kind":b["boundary_kind"],
                "action_types":";".join(b["action_types"]),
                "sources":";".join(b["sources"]),
                "reasons":" || ".join(b["reasons"]),
            })

    import csv
    MATRIX.parent.mkdir(parents=True,exist_ok=True)
    with MATRIX.open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=list(matrix[0].keys()))
        w.writeheader();w.writerows(matrix)

    summary={
      "version":VERSION,
      "status":"PASS",
      "environment":"PortfolioAI Dev",
      "policy":{
        "v1_overwrite":False,
        "materialize_v2":False,
        "unresolved_event_transition":"BLOCK_CROSS_BOUNDARY_RETURN_ONLY",
        "pre_event_segment":"USABLE_AS_INDEPENDENT_SEGMENT",
        "post_event_segment":"USABLE_AS_NEW_INDEPENDENT_SEGMENT",
        "segment_restart":"RETURN_NULL_AND_TRI_RESET_1000",
        "dividend_unresolved":"PRICE_PATH_USABLE_TOTAL_RETURN_BOUNDARY",
        "capital_action_unresolved":"PRICE_AND_TOTAL_RETURN_BOUNDARY",
        "no_price_carry_forward":True,
      },
      "n6r2_recovered_normalization_ids":len(recovered_norm_ids),
      "unresolved_event_identities":len(unresolved_identities),
      "unresolved_event_dates":sum(len(x) for x in events.values()),
      "unique_segment_boundary_rows":len(unique_boundary_pairs),
      "events_without_raw_row_on_or_after":sum(
          1 for m in boundary_by_identity.values() for b in m.values() if b["boundary_date"] is None
      ),
      "daily_rows":{
        "v1_total":v1_rows,
        "v1_ready":v1_ready,
        "v1_blocked":v1_blocked,
        "projected_v2_price_usable":projected_daily_usable,
        "projected_v2_price_blocked":projected_daily_price_blocked,
        "projected_v2_return_boundary_rows":projected_daily_return_boundary,
        "whole_identity_block_rows_recoverable":v1_blocked-projected_daily_price_blocked,
      },
      "decision_ledger":{
        "v1_ready":v1_decision_ready,
        "v1_complex_blocked":v1_complex,
        "v1_no_trade_blocked":v1_no_trade,
        "projected_ready":projected_ready,
        "projected_complex_blocked":projected_complex,
        "projected_no_trade_blocked":projected_no_trade,
        "complex_blockers_recoverable":v1_complex-projected_complex,
      },
      "n6_v1_unchanged":True,
      "n6r4_started":False,
      "n6r5_v2_materialization_started":False,
      "production_changes":0,
      "main_changes":0
    }
    OUT.write_text(json.dumps({"summary":summary,"boundaries":matrix},indent=2,sort_keys=True)+"\n")
    print(json.dumps(summary,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
