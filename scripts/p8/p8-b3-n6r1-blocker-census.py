#!/usr/bin/env python3
import csv, io, json, os, re
from collections import defaultdict
from pathlib import Path
import boto3, pyarrow.parquet as pq, psycopg
from botocore.config import Config
from psycopg.rows import dict_row

PROJECT_REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID="P8_EXP_NSE_MONTHLY_6M_V1"
NORMALIZATION_VERSION="P8_B3_NORMALIZATION_V1"
ADJUSTMENT_VERSION="P8_B3_ADJUSTMENT_V2"
ROOT="portfolioai-history/development/p8"
ADJ_PREFIX=f"{ROOT}/b3/adjusted-series/v1"
LEDGER_PREFIX=f"{ROOT}/b3/adjusted-decision-ledger/v1"
OUT_JSON=Path("docs/p8/PortfolioAI_P8_B3_N6R1_BLOCKER_CENSUS_2026-10-03.json")
OUT_CSV=Path("docs/p8/PortfolioAI_P8_B3_N6R1_BLOCKER_IDENTITY_MATRIX_2026-10-03.csv")

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
    return boto3.client("s3",
      endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
      aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
      region_name="auto",
      config=Config(retries={"max_attempts":10,"mode":"adaptive"},connect_timeout=30,read_timeout=180,s3={"addressing_style":"path"})
    )

def read_table(s3,bucket,key,columns=None):
    raw=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    return pq.read_table(io.BytesIO(raw),columns=columns)

def remediation_category(action_types,reasons):
    a=set(action_types)
    r=" | ".join(reasons)
    if len(a)>1:
        return "MULTIPLE_CORPORATE_ACTION_CAUSES"
    if "CASH_DIVIDEND" in a:
        return "DIVIDEND_REFERENCE_REMEDIATION"
    if "RIGHTS" in a:
        return "RIGHTS_ECONOMICS_REMEDIATION"
    if "DEMERGER" in a:
        return "DEMERGER_LINEAGE_REMEDIATION"
    if "BONUS" in a:
        return "BONUS_TERMS_REMEDIATION"
    if "SPLIT" in a:
        return "SPLIT_TERMS_REMEDIATION"
    if "MERGER" in a:
        return "MERGER_LINEAGE_REMEDIATION"
    return "OTHER_CORPORATE_ACTION_REMEDIATION"

def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db: raise RuntimeError("Refusing non-Development database")
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev": raise RuntimeError("Refusing non-Development bucket")
    s3=s3_client()

    with psycopg.connect(db,row_factory=dict_row) as conn:
      with conn.cursor() as cur:
        cur.execute("""
        with norm_block as (
          select n.historical_identity_id::text identity_id,n.action_type,n.effective_date::text event_date,
                 n.blocker_reason,'NORMALIZATION'::text blocker_layer
          from public.p8_b3_corporate_action_normalizations n
          where n.portfolio_id=%s and n.experiment_id=%s
            and n.normalization_version=%s and n.normalization_state='BLOCKED'
            and n.historical_identity_id is not null
            and n.action_type in ('CASH_DIVIDEND','SPLIT','BONUS','RIGHTS','MERGER','DEMERGER','DELISTING')
        ),
        factor_block as (
          select f.historical_identity_id::text identity_id,n.action_type,f.effective_date::text event_date,
                 f.blocker_reason,'FACTOR'::text blocker_layer
          from public.p8_b3_adjustment_factors f
          join public.p8_b3_corporate_action_normalizations n on n.id=f.corporate_action_normalization_id
          where f.portfolio_id=%s and f.experiment_id=%s
            and f.adjustment_version=%s and f.factor_state='BLOCKED'
        )
        select * from norm_block
        union all
        select * from factor_block
        order by identity_id,event_date,blocker_layer,action_type
        """,(PORTFOLIO_ID,EXPERIMENT_ID,NORMALIZATION_VERSION,
             PORTFOLIO_ID,EXPERIMENT_ID,ADJUSTMENT_VERSION))
        events=cur.fetchall()

        cur.execute("""
          select id::text identity_id,historical_isin
          from public.p8_historical_security_identities
          where portfolio_id=%s and experiment_id=%s
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        isin={r["identity_id"]:str(r["historical_isin"] or "") for r in cur.fetchall()}

        cur.execute("""
          select distinct b.trade_date::text trade_date
          from public.p8_b3_benchmark_total_return_history b
          join public.p8_b3_source_archives a on a.id=b.source_archive_id
          where b.portfolio_id=%s and b.experiment_id=%s
            and a.raw_metadata->>'campaign_id'='P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1'
          order by trade_date
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        dates=[r["trade_date"] for r in cur.fetchall()]

    by_identity=defaultdict(lambda:{
      "events":[],
      "raw_adjusted_rows":0,"ready_daily_rows":0,"blocked_daily_rows":0,
      "first_raw_date":None,"last_raw_date":None,
      "first_blocked_date":None,"last_blocked_date":None,
      "decision_ready_pairs":0,"decision_complex_blocked_pairs":0,"decision_no_trade_pairs":0
    })
    for e in events:
        by_identity[e["identity_id"]]["events"].append({
          "layer":e["blocker_layer"],"action_type":e["action_type"],
          "event_date":e["event_date"],"reason":e["blocker_reason"]
        })

    blocker_identities=set(by_identity)
    if len(blocker_identities)!=439:
        raise RuntimeError(f"Expected 439 blocker identities from DB, got {len(blocker_identities)}")

    for date in dates:
        key=f"{ADJ_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet"
        table=read_table(s3,bucket,key,["historical_identity_id","series_state"])
        ids=table.column("historical_identity_id").to_pylist()
        states=table.column("series_state").to_pylist()
        for identity,state in zip(ids,states):
            identity=str(identity)
            if identity not in blocker_identities: continue
            d=by_identity[identity]
            d["raw_adjusted_rows"]+=1
            d["first_raw_date"]=date if d["first_raw_date"] is None else d["first_raw_date"]
            d["last_raw_date"]=date
            if state=="BLOCKED":
                d["blocked_daily_rows"]+=1
                d["first_blocked_date"]=date if d["first_blocked_date"] is None else d["first_blocked_date"]
                d["last_blocked_date"]=date
            elif state=="READY":
                d["ready_daily_rows"]+=1
            else:
                raise RuntimeError(f"Unexpected series_state {state}")

    # Decision ledger partitions.
    listing=s3.list_objects_v2(Bucket=bucket,Prefix=f"{LEDGER_PREFIX}/",MaxKeys=1000)
    decision_dates=[]
    for o in listing.get("Contents") or []:
        m=re.search(r"decision_date=(\d{4}-\d{2}-\d{2})/part-00000\.parquet$",o["Key"])
        if m: decision_dates.append((m.group(1),o["Key"]))
    decision_dates=sorted(set(decision_dates))
    if len(decision_dates)!=32:
        raise RuntimeError(f"Expected 32 decision ledger partitions, got {len(decision_dates)}")

    for date,key in decision_dates:
        table=read_table(s3,bucket,key,["historical_identity_id","state","blocker_reason"])
        ids=table.column("historical_identity_id").to_pylist()
        states=table.column("state").to_pylist()
        reasons=table.column("blocker_reason").to_pylist()
        for identity,state,reason in zip(ids,states,reasons):
            identity=str(identity)
            if identity not in blocker_identities: continue
            d=by_identity[identity]
            if state=="READY":
                d["decision_ready_pairs"]+=1
            elif reason=="COMPLEX_CORPORATE_ACTION_BLOCKER":
                d["decision_complex_blocked_pairs"]+=1
            elif reason=="NO_TRADE_ON_DECISION_DATE":
                d["decision_no_trade_pairs"]+=1
            elif state=="BLOCKED":
                # Keep exact census fail-closed if new blocker type emerges.
                raise RuntimeError(f"Unexpected decision blocker {reason} for {identity}")

    rows=[]
    for identity in sorted(blocker_identities):
        d=by_identity[identity]
        events=d["events"]
        action_types=sorted(set(e["action_type"] for e in events))
        reasons=sorted(set(str(e["reason"]) for e in events if e["reason"]))
        event_dates=sorted(e["event_date"] for e in events if e["event_date"])
        norm_count=sum(e["layer"]=="NORMALIZATION" for e in events)
        factor_count=sum(e["layer"]=="FACTOR" for e in events)
        current_whole_identity_block = (
            d["raw_adjusted_rows"]>0
            and d["blocked_daily_rows"]==d["raw_adjusted_rows"]
            and d["ready_daily_rows"]==0
        )
        rows.append({
          "historical_identity_id":identity,
          "historical_isin":isin.get(identity,""),
          "remediation_category":remediation_category(action_types,reasons),
          "action_types":";".join(action_types),
          "blocker_event_count":len(events),
          "normalization_blocker_events":norm_count,
          "factor_blocker_events":factor_count,
          "first_blocker_event_date":event_dates[0] if event_dates else "",
          "last_blocker_event_date":event_dates[-1] if event_dates else "",
          "blocker_reasons":" || ".join(reasons),
          "raw_adjusted_rows":d["raw_adjusted_rows"],
          "ready_daily_rows":d["ready_daily_rows"],
          "blocked_daily_rows":d["blocked_daily_rows"],
          "first_raw_date":d["first_raw_date"] or "",
          "last_raw_date":d["last_raw_date"] or "",
          "first_blocked_date":d["first_blocked_date"] or "",
          "last_blocked_date":d["last_blocked_date"] or "",
          "whole_identity_blocked_v1":current_whole_identity_block,
          "decision_ready_pairs":d["decision_ready_pairs"],
          "decision_complex_blocked_pairs":d["decision_complex_blocked_pairs"],
          "decision_no_trade_pairs":d["decision_no_trade_pairs"],
        })

    category_counts=defaultdict(int)
    action_identity_counts=defaultdict(set)
    whole=0
    daily_blocked=0
    daily_raw=0
    decision_complex=0
    decision_no_trade=0
    decision_ready=0
    for r in rows:
        category_counts[r["remediation_category"]]+=1
        for a in r["action_types"].split(";"):
            if a: action_identity_counts[a].add(r["historical_identity_id"])
        whole+=int(r["whole_identity_blocked_v1"])
        daily_blocked+=r["blocked_daily_rows"]
        daily_raw+=r["raw_adjusted_rows"]
        decision_complex+=r["decision_complex_blocked_pairs"]
        decision_no_trade+=r["decision_no_trade_pairs"]
        decision_ready+=r["decision_ready_pairs"]

    summary={
      "version":"P8_B3_N6R1_BLOCKER_CENSUS_V1",
      "status":"PASS",
      "environment":"PortfolioAI Dev",
      "blocked_identity_count":len(rows),
      "blocker_event_count":sum(r["blocker_event_count"] for r in rows),
      "normalization_blocker_events":sum(r["normalization_blocker_events"] for r in rows),
      "factor_blocker_events":sum(r["factor_blocker_events"] for r in rows),
      "whole_identity_blocked_v1_count":whole,
      "blocked_identity_raw_rows":daily_raw,
      "blocked_identity_daily_blocked_rows":daily_blocked,
      "blocked_identity_daily_ready_rows":sum(r["ready_daily_rows"] for r in rows),
      "decision_pairs_for_blocked_identities":{
        "ready":decision_ready,
        "complex_corporate_action_blocker":decision_complex,
        "no_trade_on_decision_date":decision_no_trade
      },
      "remediation_category_counts":dict(sorted(category_counts.items())),
      "action_type_identity_counts":{k:len(v) for k,v in sorted(action_identity_counts.items())},
      "earliest_blocker_event_date":min(r["first_blocker_event_date"] for r in rows if r["first_blocker_event_date"]),
      "latest_blocker_event_date":max(r["last_blocker_event_date"] for r in rows if r["last_blocker_event_date"]),
      "matrix_row_count":len(rows),
      "n6_v1_overwrite_permitted":False,
      "n6r2_started":False,
      "production_changes":0,
      "main_changes":0
    }

    OUT_JSON.parent.mkdir(parents=True,exist_ok=True)
    OUT_JSON.write_text(json.dumps({"summary":summary,"identities":rows},indent=2,sort_keys=True)+"\n")
    with OUT_CSV.open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

    print(json.dumps(summary,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
