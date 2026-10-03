#!/usr/bin/env python3
import concurrent.futures, hashlib, json, os, tempfile
from pathlib import Path
import boto3, duckdb, psycopg
from botocore.config import Config

PROJECT_REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID="P8_EXP_NSE_MONTHLY_6M_V1"
CAMPAIGN_ID="P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
ROOT="portfolioai-history/development/p8"
CATALOG_KEY=f"{ROOT}/catalog/v1/catalog.json"

def required(name):
    v=os.environ.get(name,"").strip()
    if not v: raise RuntimeError(f"Missing {name}")
    return v

def normalize_account(raw):
    raw=raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else:
        host=raw
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

def get_json(s3,bucket,key):
    raw=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    return json.loads(raw),raw

def scalar(cur,sql,args=()):
    cur.execute(sql,args); return cur.fetchone()[0]

def rows(cur,sql,args=()):
    cur.execute(sql,args); return cur.fetchall()

def parquet_identity_set(data):
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/"x.parquet"; p.write_bytes(data)
        con=duckdb.connect()
        try:
            cols=[r[0] for r in con.execute("describe select * from read_parquet(?)",[str(p)]).fetchall()]
            if "historical_identity_id" not in cols:
                raise RuntimeError(f"historical_identity_id missing from parquet; cols={cols}")
            vals=con.execute("select distinct historical_identity_id from read_parquet(?) where historical_identity_id is not null",[str(p)]).fetchall()
            return {str(r[0]) for r in vals},cols
        finally:
            con.close()

def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db: raise RuntimeError("Refusing non-Development database")
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev": raise RuntimeError("Refusing non-Development bucket")
    s3=s3_client()

    with psycopg.connect(db,autocommit=True) as conn:
        with conn.cursor() as cur:
            benchmark_dates=[r[0] for r in rows(cur, """
              select distinct b.trade_date::text
              from public.p8_b3_benchmark_total_return_history b
              join public.p8_b3_source_archives a on a.id=b.source_archive_id
              where b.portfolio_id=%s and b.experiment_id=%s
                and a.raw_metadata->>'campaign_id'=%s
              order by 1
            """,(PORTFOLIO_ID,EXPERIMENT_ID,CAMPAIGN_ID))]
            decision_dates=[r[0] for r in rows(cur, """
              with d as (
                select distinct b.trade_date
                from public.p8_b3_benchmark_total_return_history b
                join public.p8_b3_source_archives a on a.id=b.source_archive_id
                where b.portfolio_id=%s and b.experiment_id=%s
                  and a.raw_metadata->>'campaign_id'=%s
              )
              select max(trade_date)::text from d
              group by date_trunc('month',trade_date)
              order by max(trade_date)
            """,(PORTFOLIO_ID,EXPERIMENT_ID,CAMPAIGN_ID))]
            source_counts=rows(cur, """
              select source_kind,count(*)::bigint,count(distinct source_period_start)::bigint,
                     min(source_period_start)::text,max(source_period_end)::text
              from public.p8_b3_source_archives
              where raw_metadata->>'campaign_id'=%s
              group by source_kind order by source_kind
            """,(CAMPAIGN_ID,))
            action_states=rows(cur, """
              select o.identity_resolution_state,count(*)::bigint
              from public.p8_b3_corporate_action_observations o
              join public.p8_b3_source_archives a on a.id=o.source_archive_id
              where o.portfolio_id=%s and o.experiment_id=%s
                and a.raw_metadata->>'campaign_id'=%s
              group by o.identity_resolution_state order by o.identity_resolution_state
            """,(PORTFOLIO_ID,EXPERIMENT_ID,CAMPAIGN_ID))
            action_total=scalar(cur, """
              select count(*) from public.p8_b3_corporate_action_observations o
              join public.p8_b3_source_archives a on a.id=o.source_archive_id
              where o.portfolio_id=%s and o.experiment_id=%s
                and a.raw_metadata->>'campaign_id'=%s
            """,(PORTFOLIO_ID,EXPERIMENT_ID,CAMPAIGN_ID))
            derived={
              "normalizations":scalar(cur,"select count(*) from public.p8_b3_corporate_action_normalizations where portfolio_id=%s and experiment_id=%s",(PORTFOLIO_ID,EXPERIMENT_ID)),
              "adjustment_factors":scalar(cur,"select count(*) from public.p8_b3_adjustment_factors where portfolio_id=%s and experiment_id=%s",(PORTFOLIO_ID,EXPERIMENT_ID)),
              "adjusted_series":scalar(cur,"select count(*) from public.p8_b3_adjusted_market_price_series where portfolio_id=%s and experiment_id=%s",(PORTFOLIO_ID,EXPERIMENT_ID)),
            }
            rls_rows=rows(cur, """
              select c.relname,c.relrowsecurity,count(p.policyname)::bigint
              from pg_class c join pg_namespace n on n.oid=c.relnamespace
              left join pg_policies p on p.schemaname=n.nspname and p.tablename=c.relname
              where n.nspname='public' and c.relname in
                ('p8_b3_source_archives','p8_b3_corporate_action_observations','p8_b3_corporate_action_normalizations',
                 'p8_b3_adjustment_factors','p8_b3_adjusted_market_price_series','p8_b3_benchmark_total_return_history')
              group by c.relname,c.relrowsecurity order by c.relname
            """)
            exposed=scalar(cur, """
              select count(*) from information_schema.role_table_grants
              where table_schema='public' and table_name in
                ('p8_b3_source_archives','p8_b3_corporate_action_observations','p8_b3_corporate_action_normalizations',
                 'p8_b3_adjustment_factors','p8_b3_adjusted_market_price_series','p8_b3_benchmark_total_return_history')
                and grantee in ('anon','authenticated')
            """)

    expected=set(benchmark_dates)
    if len(benchmark_dates)!=744: raise RuntimeError(f"Expected 744 benchmark dates, got {len(benchmark_dates)}")
    if len(decision_dates)!=36: raise RuntimeError(f"Expected 36 decision dates, got {len(decision_dates)}")

    catalog,_=get_json(s3,bucket,CATALOG_KEY)
    ds=catalog["datasets"]["b3_raw_prices"]
    if int(ds["partition_count"])!=744 or ds["min_date"]!="2023-10-03" or ds["max_date"]!="2026-09-30":
        raise RuntimeError(f"Catalog raw-price boundary mismatch: {ds}")

    def inspect_date(date):
        y,m=date[:4],date[5:7]
        base=f"{ROOT}/b3/raw-prices/v1/year={y}/month={m}/trade_date={date}"
        pm,raw=get_json(s3,bucket,base+"/manifest.json")
        head=s3.head_object(Bucket=bucket,Key=base+"/part-00000.parquet")
        return date,{
          "row_count":int(pm["row_count"]),
          "fingerprint":pm["normalized_fingerprint_sha256"],
          "manifest_sha256":hashlib.sha256(raw).hexdigest(),
          "parquet_bytes":int(head["ContentLength"]),
        }
    manifests={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
        futs=[pool.submit(inspect_date,d) for d in benchmark_dates]
        for f in concurrent.futures.as_completed(futs):
            d,v=f.result(); manifests[d]=v

    if set(manifests)!=expected: raise RuntimeError("R2 partition date set differs from benchmark calendar")
    manifest_rows=sum(v["row_count"] for v in manifests.values())
    if manifest_rows!=int(ds["row_count"]):
        raise RuntimeError(f"R2 manifest row sum {manifest_rows} != catalog {ds['row_count']}")

    aggregate_material="".join(
      f"{d}|{manifests[d]['row_count']}|{manifests[d]['fingerprint']}|{manifests[d]['manifest_sha256']}\n"
      for d in sorted(manifests)
    ).encode()
    aggregate_fp=hashlib.sha256(aggregate_material).hexdigest()

    coverage=[]
    total_members=total_priced=total_missing=0
    for d in decision_dates:
        y,m=d[:4],d[5:7]
        b2key=f"{ROOT}/b2/universe-members/v1/decision_date={d}/part-00000.parquet"
        pkey=f"{ROOT}/b3/raw-prices/v1/year={y}/month={m}/trade_date={d}/part-00000.parquet"
        b2=s3.get_object(Bucket=bucket,Key=b2key)["Body"].read()
        p=s3.get_object(Bucket=bucket,Key=pkey)["Body"].read()
        members,b2cols=parquet_identity_set(b2)
        prices,pcols=parquet_identity_set(p)
        missing=sorted(members-prices)
        priced=len(members & prices)
        coverage.append({
          "decision_date":d,"eligible_members":len(members),"priced_members":priced,
          "missing_members":len(missing),"coverage_ratio":1.0 if not members else priced/len(members),
          "missing_identity_sample":missing[:10]
        })
        total_members+=len(members); total_priced+=priced; total_missing+=len(missing)

    source_map={r[0]:{"archives":int(r[1]),"distinct_dates":int(r[2]),"min":r[3],"max":r[4]} for r in source_counts}
    action_map={r[0]:int(r[1]) for r in action_states}
    rls=[{"object":r[0],"rls_enabled":bool(r[1]),"policy_count":int(r[2])} for r in rls_rows]

    required_sources = (
      source_map.get("NSE_INDICES_NIFTY500_TRI",{}).get("archives")==36 and
      source_map.get("NSE_CORPORATE_ACTIONS",{}).get("archives")==36 and
      source_map.get("NSE_CM_BHAVCOPY_LEGACY",{}).get("archives",0)+
      source_map.get("NSE_CM_BHAVCOPY_UDIFF",{}).get("archives",0)==744
    )
    pass_conditions={
      "source_archive_contract":required_sources,
      "benchmark_calendar_744":len(benchmark_dates)==744,
      "raw_price_partitions_744":len(manifests)==744,
      "catalog_manifest_row_parity":manifest_rows==int(ds["row_count"]),
      "decision_dates_36":len(decision_dates)==36,
      "decision_date_raw_price_coverage_measured":len(coverage)==36,
      "derived_rows_zero":all(int(v)==0 for v in derived.values()),
      "b3_rls_enabled_with_policy":all(x["rls_enabled"] and x["policy_count"]>=1 for x in rls),
      "b3_no_anon_authenticated_table_grants":int(exposed)==0,
      "campaign_action_archives_36":source_map.get("NSE_CORPORATE_ACTIONS",{}).get("archives")==36,
      "campaign_action_rows_6703":int(action_total)==6703,
    }
    status="PASS" if all(pass_conditions.values()) else "FAIL"

    result={
      "version":"P8_B3_SOURCE_COMPLETION_VERIFICATION_V1",
      "stage":"P8-B3",
      "scope":"SOURCE_ACQUISITION_AND_RAW_HISTORY_ONLY",
      "status":status,
      "environment":"DEVELOPMENT",
      "campaign_id":CAMPAIGN_ID,
      "benchmark":{"dates":len(benchmark_dates),"first":benchmark_dates[0],"last":benchmark_dates[-1],"decision_dates":decision_dates},
      "sources":source_map,
      "raw_prices":{"catalog_rows":int(ds["row_count"]),"manifest_rows":manifest_rows,"partitions":len(manifests),"aggregate_fingerprint_sha256":aggregate_fp},
      "decision_date_coverage":{"decision_dates":coverage,"eligible_member_pairs":total_members,"priced_member_pairs":total_priced,"missing_member_pairs":total_missing,"overall_ratio":1.0 if total_members==0 else total_priced/total_members},
      "corporate_actions":{"rows":int(action_total),"resolution_states":action_map},
      "derived_rows":{k:int(v) for k,v in derived.items()},
      "security":{"rls":rls,"anon_authenticated_direct_grants":int(exposed)},
      "pass_conditions":pass_conditions,
      "normalization_authorized":False,
      "p8_b4_started":False,
      "production_changes":0,
      "main_changes":0
    }
    print(json.dumps(result,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
