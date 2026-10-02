#!/usr/bin/env python3
import concurrent.futures
import importlib.util
import json
import os
from pathlib import Path

import psycopg

DEFAULT_BATCH_SIZE = 5
ROOT = "portfolioai-history/development/p8"
CATALOG_KEY = f"{ROOT}/catalog/v1/catalog.json"
APPEND_VERSION = "P8_R2_CANONICAL_APPEND_V1"

def load_single():
    path=Path(__file__).with_name("p8-b3-r2-acquire-next-date.py")
    spec=importlib.util.spec_from_file_location("single",path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load single-date R2 acquisition module")
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def load_batch_dates_and_identities(single,db_url,catalog_max,batch_size):
    with psycopg.connect(db_url,autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select distinct trade_date::text
                from public.p8_b3_benchmark_total_return_history
                where portfolio_id=%s and experiment_id=%s and trade_date>%s::date
                order by trade_date
                limit %s
                """,
                (single.PORTFOLIO_ID,single.EXPERIMENT_ID,catalog_max,batch_size),
            )
            dates=[r[0] for r in cur.fetchall()]
            cur.execute(
                """
                select id::text,historical_isin
                from public.p8_historical_security_identities
                where portfolio_id=%s and experiment_id=%s
                """,
                (single.PORTFOLIO_ID,single.EXPERIMENT_ID),
            )
            identities=cur.fetchall()
    by_isin={}
    for iid,isin in identities:
        if isin in by_isin:
            raise RuntimeError(f"Duplicate historical ISIN: {isin}")
        by_isin[isin]=iid
    return dates,by_isin

def load_existing_archive(single,db_url,date):
    with psycopg.connect(db_url,autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id::text,source_file_name,source_url,content_sha256,compressed_sha256,
                       retrieved_at::text,archive_hash,raw_metadata
                from public.p8_b3_source_archives
                where portfolio_id=%s and experiment_id=%s
                  and source_period_start=%s::date
                  and source_kind=%s
                  and raw_metadata->>'campaign_id'=%s
                order by created_at
                """,
                (single.PORTFOLIO_ID,single.EXPERIMENT_ID,date,single.SOURCE_KIND,single.CAMPAIGN_ID),
            )
            rows=cur.fetchall()
    if not rows:
        return None
    if len(rows)!=1:
        raise RuntimeError(f"Expected exactly one campaign archive for {date}, found {len(rows)}")
    r=rows[0]
    return {
        "archive_id":r[0],"filename":r[1],"url":r[2],"content_sha256":r[3],
        "compressed_sha256":r[4],"retrieved_at":r[5],"archive_hash":r[6],
        "raw_metadata":r[7] or {},
    }

def source_for_date(single,s3,bucket,db_url,date):
    existing=load_existing_archive(single,db_url,date)
    if existing:
        member=existing["raw_metadata"].get("csv_member")
        if not member:
            raise RuntimeError(f"Existing archive missing csv_member for {date}")
        zip_key=f"{single.SOURCE_PREFIX}/trade_date={date}/{existing['filename']}"
        content_key=f"{single.SOURCE_PREFIX}/content/trade_date={date}/{os.path.basename(member)}"
        zip_bytes=s3.get_object(Bucket=bucket,Key=zip_key)["Body"].read()
        csv_bytes=s3.get_object(Bucket=bucket,Key=content_key)["Body"].read()
        if single.sha256_bytes(zip_bytes)!=existing["compressed_sha256"]:
            raise RuntimeError(f"Preserved ZIP hash mismatch for {date}")
        if single.sha256_bytes(csv_bytes)!=existing["content_sha256"]:
            raise RuntimeError(f"Preserved CSV hash mismatch for {date}")
        return {
            "archive_id":existing["archive_id"],"retrieved_at":existing["retrieved_at"],
            "archive_hash":existing["archive_hash"],"filename":existing["filename"],
            "url":existing["url"],"member":member,"zip_bytes":zip_bytes,"csv_bytes":csv_bytes,
            "zip_key":zip_key,"content_key":content_key,"source_metadata_inserted":False,
        }

    filename,url,zip_bytes=single.fetch_official(date)
    member,csv_bytes=single.extract_csv(zip_bytes,filename)
    aid,retrieved_at,ah,inserted=single.upsert_archive_metadata(
        db_url,date,filename,url,zip_bytes,member,csv_bytes
    )
    zip_key=f"{single.SOURCE_PREFIX}/trade_date={date}/{filename}"
    content_key=f"{single.SOURCE_PREFIX}/content/trade_date={date}/{os.path.basename(member)}"
    single.put_immutable(s3,bucket,zip_key,zip_bytes,"application/zip",{
        "source_date":date,"archive_id":aid,"campaign_id":single.CAMPAIGN_ID,
        "content_sha256":single.sha256_bytes(csv_bytes)
    })
    single.put_immutable(s3,bucket,content_key,csv_bytes,"text/csv",{
        "source_date":date,"archive_id":aid,"campaign_id":single.CAMPAIGN_ID,
        "content_sha256":single.sha256_bytes(csv_bytes)
    })
    return {
        "archive_id":aid,"retrieved_at":retrieved_at,"archive_hash":ah,
        "filename":filename,"url":url,"member":member,"zip_bytes":zip_bytes,
        "csv_bytes":csv_bytes,"zip_key":zip_key,"content_key":content_key,
        "source_metadata_inserted":inserted,
    }

def prepare_date(single,s3,bucket,db_url,date,identities):
    if date < "2024-07-08":
        raise RuntimeError("Batch runner only supports UDiFF dates")
    source=source_for_date(single,s3,bucket,db_url,date)
    parsed=single.parse_udiff(source["csv_bytes"],date)
    rows,unknown=single.materialize_rows(parsed,identities,source["archive_id"])
    if unknown:
        raise RuntimeError(f"Unknown historical ISINs on {date}: {sorted(set(unknown))[:20]}")
    if not rows:
        raise RuntimeError(f"No resolved rows for {date}")

    pq_bytes,full_rows=single.parquet_bytes(rows,source["retrieved_at"])
    pkey=f"{single.CANONICAL_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet"
    pev=single.put_immutable(s3,bucket,pkey,pq_bytes,"application/octet-stream",{
        "append_version":APPEND_VERSION,"trade_date":date
    })
    fp=single.sha256_bytes("".join(single.canonical_json(r)+"\n" for r in full_rows).encode())
    pm={
        "version":APPEND_VERSION,"status":"PASS","table":"p8_b3_raw_market_price_observations",
        "dataset":"b3_raw_prices","partition_date":date,"row_count":len(rows),
        "source_rows":len(parsed),"unknown_isin_rows":0,
        "source_content_sha256":single.sha256_bytes(source["csv_bytes"]),
        "source_key":source["content_key"],"csv_member":source["member"],
        "normalized_fingerprint_sha256":fp,"parquet":pev,
    }
    pm_bytes=(json.dumps(pm,indent=2,sort_keys=True)+"\n").encode()
    pm_key=f"{single.CANONICAL_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/manifest.json"
    pm_ev=single.put_immutable(s3,bucket,pm_key,pm_bytes,"application/json",{
        "append_version":APPEND_VERSION,"trade_date":date
    })
    return {
        "date":date,"source":source,"parsed_count":len(parsed),"rows":rows,
        "partition":pev,"partition_manifest":pm_ev,
    }

def update_runtime_batch(single,s3,bucket,key,dated_rows):
    # dated_rows is sorted list of (date,row)
    first=dated_rows[0][1]
    created=False
    try:
        payload,_=single.get_json(s3,bucket,key)
    except s3.exceptions.ClientError as exc:
        code=str(exc.response.get("Error",{}).get("Code",""))
        if code not in {"404","NoSuchKey","NotFound"}:
            raise
        payload={
            "version":"P8_RAW_PRICE_RUNTIME_V1","symbol":first["trading_symbol"],
            "series":first.get("series"),"year":int(dated_rows[0][0][:4]),
            "row_count":0,"min_trade_date":None,"max_trade_date":None,"rows":[]
        }
        created=True
    if payload.get("version")!="P8_RAW_PRICE_RUNTIME_V1":
        raise RuntimeError(f"Unexpected runtime version: {key}")
    if payload.get("symbol")!=first["trading_symbol"] or (payload.get("series") or "")!=(first.get("series") or ""):
        raise RuntimeError(f"Runtime identity conflict: {key}")

    current=list(payload.get("rows") or [])
    by_date={r.get("trade_date"):r for r in current}
    changed=False
    for date,row in dated_rows:
        expected=single.runtime_row(row)
        existing=by_date.get(date)
        if existing is not None:
            if existing!=expected:
                raise RuntimeError(f"Runtime existing row conflict {key} {date}")
            continue
        current.append(expected); by_date[date]=expected; changed=True
    current.sort(key=lambda r:(r.get("trade_date") or "",r.get("trading_symbol") or "",r.get("series") or ""))
    if changed:
        payload["rows"]=current; payload["row_count"]=len(current)
        payload["min_trade_date"]=current[0]["trade_date"]; payload["max_trade_date"]=current[-1]["trade_date"]
        data=(single.canonical_json(payload)+"\n").encode()
        single.put_replace(s3,bucket,key,data,"application/json",{
            "append_version":APPEND_VERSION,"last_trade_date":dated_rows[-1][0]
        })
    return {"key":key,"created":created,"changed":changed,"dates":[d for d,_ in dated_rows]}

def verify_runtime_batch(single,s3,bucket,key,dated_rows):
    payload,_=single.get_json(s3,bucket,key)
    by_date={r.get("trade_date"):r for r in payload.get("rows",[])}
    for date,row in dated_rows:
        if by_date.get(date)!=single.runtime_row(row):
            raise RuntimeError(f"Runtime read-back mismatch {key} {date}")
    return True

def main():
    single=load_single()
    db_url=single.required("SUPABASE_DB_URL")
    if single.PROJECT_REF not in db_url:
        raise RuntimeError("Refusing non-Development database")
    bucket=single.required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")
    batch_size=int(os.environ.get("P8_BATCH_SIZE",str(DEFAULT_BATCH_SIZE)))
    if batch_size<1 or batch_size>30:
        raise RuntimeError("P8_BATCH_SIZE must be 1..30")
    s3=single.s3_client()

    catalog,_=single.get_json(s3,bucket,CATALOG_KEY)
    ds=catalog["datasets"]["b3_raw_prices"]; rt=catalog["runtime"]["raw_prices"]
    start_max=ds["max_date"]
    if int(ds["row_count"])!=int(rt["row_count"]):
        raise RuntimeError("Catalog canonical/runtime row counts diverge before batch")

    dates,identities=load_batch_dates_and_identities(single,db_url,start_max,batch_size)
    if not dates:
        print(json.dumps({"status":"COMPLETE","dates":[],"catalog_max_date":start_max},indent=2))
        return

    prepared=[]
    for date in dates:
        prepared.append(prepare_date(single,s3,bucket,db_url,date,identities))

    grouped={}
    for item in prepared:
        date=item["date"]
        for row in item["rows"]:
            key=single.runtime_key(date,row)
            grouped.setdefault(key,[]).append((date,row))
    for key in grouped:
        grouped[key].sort(key=lambda x:x[0])

    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
        results=[f.result() for f in concurrent.futures.as_completed(
            [pool.submit(update_runtime_batch,single,s3,bucket,key,rows) for key,rows in grouped.items()]
        )]

    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
        verified=sum(1 for f in concurrent.futures.as_completed(
            [pool.submit(verify_runtime_batch,single,s3,bucket,key,rows) for key,rows in grouped.items()]
        ) if f.result())
    if verified!=len(grouped):
        raise RuntimeError("Runtime batch verification count mismatch")

    created_keys={r["key"]:r for r in results if r["created"]}
    created_by_date={d:0 for d in dates}
    for r in created_keys.values():
        first_date=min(r["dates"])
        created_by_date[first_date]+=1

    running_rows=int(ds["row_count"])
    running_parts=int(ds["partition_count"])
    running_rt_rows=int(rt["row_count"])
    running_objects=int(rt["object_count"])
    append_events=[]
    total_db_inserts=0

    for item in prepared:
        date=item["date"]; rows=item["rows"]; source=item["source"]
        row_count=len(rows)
        total_db_inserts += 1 if source["source_metadata_inserted"] else 0
        running_rows += row_count; running_parts += 1; running_rt_rows += row_count
        running_objects += created_by_date[date]
        touched=len({single.runtime_key(date,row) for row in rows})
        append_manifest={
            "version":APPEND_VERSION,"status":"PASS","environment":"DEVELOPMENT","date":date,
            "campaign_id":single.CAMPAIGN_ID,"plan_hash":single.PLAN_HASH,
            "source_archive_id":source["archive_id"],"archive_hash":source["archive_hash"],
            "source_zip":{"key":source["zip_key"],"sha256":single.sha256_bytes(source["zip_bytes"]),"bytes":len(source["zip_bytes"])},
            "source_content":{"key":source["content_key"],"sha256":single.sha256_bytes(source["csv_bytes"]),"bytes":len(source["csv_bytes"])},
            "source_rows":item["parsed_count"],"resolved_rows":row_count,"unknown_isin_rows":0,
            "canonical_partition":item["partition_manifest"],
            "runtime_objects_touched":touched,"runtime_objects_created":created_by_date[date],
            "runtime_objects_changed":touched,"runtime_rows_verified":row_count,
            "new_canonical_row_count":running_rows,"new_partition_count":running_parts,
            "new_runtime_row_count":running_rt_rows,"new_runtime_object_count":running_objects,
            "database_writes":1 if source["source_metadata_inserted"] else 0,
            "raw_price_database_writes":0,"production_changes":0,
            "batch_dates":dates,
        }
        key=f"{ROOT}/manifests/v1/APPEND_{date}.json"
        data=(json.dumps(append_manifest,indent=2,sort_keys=True)+"\n").encode()
        ev=single.put_immutable(s3,bucket,key,data,"application/json",{
            "append_version":APPEND_VERSION,"trade_date":date
        })
        append_events.append({"date":date,"manifest":ev,"rows":row_count})

    ds["row_count"]=running_rows; ds["partition_count"]=running_parts; ds["max_date"]=dates[-1]
    rt["row_count"]=running_rt_rows; rt["object_count"]=running_objects
    rt["last_append_date"]=dates[-1]
    rt["last_append_manifest"]=f"{ROOT}/manifests/v1/APPEND_{dates[-1]}.json"
    catalog["append_version"]=APPEND_VERSION
    catalog["last_append_manifest_sha256"]=append_events[-1]["manifest"]["sha256"]
    cat_bytes=(json.dumps(catalog,indent=2,sort_keys=True)+"\n").encode()
    cat_ev=single.put_replace(s3,bucket,CATALOG_KEY,cat_bytes,"application/json",{
        "append_version":APPEND_VERSION,"last_append_date":dates[-1]
    })

    final,_=single.get_json(s3,bucket,CATALOG_KEY)
    fds=final["datasets"]["b3_raw_prices"]; frt=final["runtime"]["raw_prices"]
    if fds["max_date"]!=dates[-1] or int(fds["row_count"])!=running_rows or int(frt["row_count"])!=running_rt_rows:
        raise RuntimeError("Final batch catalog verification failed")

    print(json.dumps({
        "status":"PASS","version":"P8_B3_R2_NATIVE_BATCH_V1",
        "dates":dates,"date_count":len(dates),
        "rows_added":sum(len(x["rows"]) for x in prepared),
        "runtime_objects_touched":len(grouped),"runtime_objects_created":len(created_keys),
        "runtime_objects_verified":verified,"source_metadata_inserts":total_db_inserts,
        "canonical_rows_after":running_rows,"partitions_after":running_parts,
        "runtime_objects_after":running_objects,"catalog":cat_ev,
        "append_manifests":append_events,
        "raw_price_database_writes":0,"production_changes":0,
    },indent=2,sort_keys=True))

if __name__=="__main__":
    main()
