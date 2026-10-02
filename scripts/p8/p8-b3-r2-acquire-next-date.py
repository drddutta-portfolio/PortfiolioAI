#!/usr/bin/env python3
import concurrent.futures
import csv
import hashlib
import io
import json
import os
import re
import tempfile
import time
import urllib.parse
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import boto3
import duckdb
import psycopg
import requests
from botocore.config import Config

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
CAMPAIGN_ID = "P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
PLAN_HASH = "9367d9a55b5c7a6db176ef3e2b80da96cb97b3ac114f0ef884f124352a54919a"
ROOT = "portfolioai-history/development/p8"
SOURCE_PREFIX = f"{ROOT}/b3/source-authority/v1"
CANONICAL_PREFIX = f"{ROOT}/b3/raw-prices/v1"
RUNTIME_PREFIX = f"{ROOT}/runtime/raw-prices/v1"
CATALOG_KEY = f"{ROOT}/catalog/v1/catalog.json"
APPEND_VERSION = "P8_R2_CANONICAL_APPEND_V1"
SOURCE_CONTRACT = "P8_B3_NSE_BHAVCOPY_UDIFF_V1"
SOURCE_KIND = "NSE_CM_BHAVCOPY_UDIFF"
SOURCE_FORMAT = "UDIFF_BHAVCOPY"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
)

def required(name):
    v = os.environ.get(name, "").strip()
    if not v:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return v

def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()

def deterministic_uuid(seed):
    h = sha256_bytes(seed.encode())
    variant = format((int(h[16], 16) & 0x3) | 0x8, "x")
    return h[:8]+"-"+h[8:12]+"-5"+h[13:16]+"-"+variant+h[17:20]+"-"+h[20:32]

def normalize_account(raw):
    raw = raw.strip().rstrip("/")
    host = urllib.parse.urlparse(raw).hostname if "://" in raw else raw
    suffix = ".r2.cloudflarestorage.com"
    return host[:-len(suffix)] if host and host.endswith(suffix) else host

def s3_client():
    account = normalize_account(required("CLOUDFLARE_R2_ACCOUNT_ID"))
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(
            retries={"max_attempts":10,"mode":"adaptive"},
            connect_timeout=30,
            read_timeout=180,
            s3={"addressing_style":"path"},
        ),
    )

def fetch_official(date):
    ymd = date.replace("-", "")
    filename = f"BhavCopy_NSE_CM_0_0_0_{ymd}_F_0000.csv.zip"
    url = f"https://nsearchives.nseindia.com/content/cm/{filename}"
    session = requests.Session()
    last = None
    for attempt in range(1, 6):
        try:
            r = session.get(
                url,
                headers={
                    "User-Agent":USER_AGENT,
                    "Accept":"application/zip,application/octet-stream,*/*",
                    "Referer":"https://www.nseindia.com/all-reports",
                },
                timeout=60,
                allow_redirects=True,
            )
            r.raise_for_status()
            host = (urllib.parse.urlparse(r.url).hostname or "").lower()
            if host != "nsearchives.nseindia.com":
                raise RuntimeError(f"Official source redirected to unexpected host: {host}")
            data = r.content
            if len(data) < 2 or data[:2] != b"PK":
                raise RuntimeError("Official source is not ZIP")
            return filename, url, data
        except Exception as exc:
            last = exc
            if attempt < 5:
                time.sleep(min(15, 2**(attempt-1)))
    raise RuntimeError(f"Official source fetch failed for {date}: {last}")

def extract_csv(zip_bytes, filename):
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        members = [x for x in zf.namelist() if x.lower().endswith(".csv")]
        if not members:
            raise RuntimeError(f"{filename} contains no CSV")
        member = next((x for x in members if "bhav" in os.path.basename(x).lower()), members[0])
        return member, zf.read(member)

def clean(value):
    return str(value or "").strip()

def norm_header(value):
    return re.sub(r"[ ._\-/()]+", "", clean(value).lstrip("\ufeff")).upper()

def field(m, aliases, label, required_field=True):
    for a in aliases:
        if a in m:
            return m[a]
    if required_field:
        raise RuntimeError(f"Missing {label} field")
    return None

def normalize_date(v):
    raw = clean(v)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        return raw
    for fmt in ("%d-%b-%Y", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    raise RuntimeError(f"Unsupported date format: {raw}")

def decimal_text(v, label, nullable=True):
    text = clean(v).replace(",", "")
    if not text:
        if nullable:
            return None
        raise RuntimeError(f"{label} is required")
    if not re.fullmatch(r"-?\d+(?:\.\d+)?", text):
        raise RuntimeError(f"{label} is not canonical decimal: {text}")
    if float(text) < 0:
        raise RuntimeError(f"{label} must be non-negative")
    return text

def parse_udiff(csv_bytes, date):
    reader = csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig")))
    fields = reader.fieldnames or []
    m = {norm_header(x):x for x in fields}
    f = {
        "isin":field(m,["ISIN"],"ISIN"),
        "symbol":field(m,["TCKRSYMB","TCKRSYMBL","TCKRSYMBOL"],"ticker"),
        "series":field(m,["SCTYSRS"],"series"),
        "previous_close":field(m,["PRVSCLSGPRIC"],"previous close"),
        "open":field(m,["OPNPRIC"],"open"),
        "high":field(m,["HGHPRIC"],"high"),
        "low":field(m,["LWPRIC"],"low"),
        "close":field(m,["CLSPRIC"],"close"),
        "last_price":field(m,["LSTTRDDPRIC","LASTPRIC"],"last price",False),
        "volume":field(m,["TTLTRADGVOL"],"volume",False),
        "traded_value":field(m,["TTLTRADVAL","TTLTRADGVAL"],"value",False),
        "trade_count":field(m,["TTLNMBRTRADES","TTLTRADES"],"trades",False),
        "date":field(m,["TRADDT","TRADDATE"],"trade date"),
    }
    company_isin = re.compile(r"^IN[E9][A-Z0-9]{4}01[A-Z0-9]{3}$")
    rows=[]
    for source in reader:
        isin=clean(source.get(f["isin"]))
        if not company_isin.fullmatch(isin):
            continue
        embedded=normalize_date(source.get(f["date"]))
        if embedded != date:
            raise RuntimeError(f"Embedded date mismatch {embedded} != {date}")
        logical={
            "historical_isin":isin,
            "trade_date":date,
            "exchange":"NSE",
            "trading_symbol":clean(source.get(f["symbol"])),
            "series":clean(source.get(f["series"])) or None,
            "source_format":SOURCE_FORMAT,
            "previous_close":decimal_text(source.get(f["previous_close"]),"previous_close"),
            "open":decimal_text(source.get(f["open"]),"open"),
            "high":decimal_text(source.get(f["high"]),"high"),
            "low":decimal_text(source.get(f["low"]),"low"),
            "close":decimal_text(source.get(f["close"]),"close",False),
            "last_price":decimal_text(source.get(f["last_price"]),"last_price") if f["last_price"] else None,
            "volume":decimal_text(source.get(f["volume"]),"volume") if f["volume"] else None,
            "traded_value":decimal_text(source.get(f["traded_value"]),"traded_value") if f["traded_value"] else None,
            "trade_count":decimal_text(source.get(f["trade_count"]),"trade_count") if f["trade_count"] else None,
        }
        if not logical["trading_symbol"]:
            raise RuntimeError(f"Missing symbol for {isin}")
        if logical["high"] is not None and logical["low"] is not None and float(logical["high"]) < float(logical["low"]):
            raise RuntimeError(f"High/low invariant failed for {isin}")
        rows.append({**logical,"row_hash":sha256_bytes(canonical_json(logical).encode())})
    if not rows:
        raise RuntimeError(f"No company-equity rows parsed for {date}")
    return rows

def archive_hash(date, url, content_sha, compressed_sha):
    payload={
        "campaign_id":CAMPAIGN_ID,
        "plan_hash":PLAN_HASH,
        "source_kind":SOURCE_KIND,
        "source_period_start":date,
        "source_period_end":date,
        "source_url":url,
        "content_sha256":content_sha,
        "compressed_sha256":compressed_sha,
        "source_contract_version":SOURCE_CONTRACT,
    }
    return sha256_bytes(canonical_json(payload).encode())

def load_next_date_and_identities(db_url, expected_date=None):
    with psycopg.connect(db_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                with benchmark_dates as (
                  select distinct trade_date
                  from public.p8_b3_benchmark_total_return_history
                  where portfolio_id=%s and experiment_id=%s
                ),
                acquired as (
                  select max(source_period_start) as max_date
                  from public.p8_b3_source_archives
                  where portfolio_id=%s and experiment_id=%s
                    and source_kind like 'NSE_CM_BHAVCOPY%%'
                    and raw_metadata->>'campaign_id'=%s
                )
                select min(b.trade_date)::text
                from benchmark_dates b, acquired a
                where b.trade_date > a.max_date
                """,
                (PORTFOLIO_ID,EXPERIMENT_ID,PORTFOLIO_ID,EXPERIMENT_ID,CAMPAIGN_ID),
            )
            date=cur.fetchone()[0]
            if not date:
                raise RuntimeError("No remaining benchmark trading date")
            if expected_date and date != expected_date:
                raise RuntimeError(f"Next proven date mismatch: expected {expected_date}, got {date}")
            cur.execute(
                """
                select id::text,historical_isin
                from public.p8_historical_security_identities
                where portfolio_id=%s and experiment_id=%s
                """,
                (PORTFOLIO_ID,EXPERIMENT_ID),
            )
            identities=cur.fetchall()
    by_isin={}
    for identity_id,isin in identities:
        if isin in by_isin:
            raise RuntimeError(f"Duplicate historical ISIN: {isin}")
        by_isin[isin]=identity_id
    return date,by_isin

def upsert_archive_metadata(db_url, date, filename, url, zip_bytes, member, csv_bytes):
    content_sha=sha256_bytes(csv_bytes)
    compressed_sha=sha256_bytes(zip_bytes)
    ah=archive_hash(date,url,content_sha,compressed_sha)
    aid=deterministic_uuid(f"{CAMPAIGN_ID}|archive|{SOURCE_KIND}|{ah}")
    with psycopg.connect(db_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id::text,retrieved_at::text,archive_hash,content_sha256,compressed_sha256
                from public.p8_b3_source_archives
                where id=%s
                """,(aid,)
            )
            existing=cur.fetchone()
            if existing:
                if existing[2:] != (ah,content_sha,compressed_sha):
                    raise RuntimeError("Existing source archive metadata conflicts")
                retrieved_at=existing[1]
                return aid,retrieved_at,ah,False
            retrieved_at=datetime.now(timezone.utc).isoformat()
            raw_metadata={
                "campaign_id":CAMPAIGN_ID,
                "plan_hash":PLAN_HASH,
                "official_source_page":"https://www.nseindia.com/all-reports",
                "csv_member":member,
                "archive_bytes":len(zip_bytes),
                "csv_bytes":len(csv_bytes),
                "retrieval_mode":"NETWORK_R2_NATIVE",
                "acquisition_runner":"p8-b3-r2-acquire-next-date.py",
            }
            cur.execute(
                """
                insert into public.p8_b3_source_archives(
                  id,portfolio_id,experiment_id,source_kind,source_period_start,source_period_end,
                  source_url,source_file_name,content_sha256,compressed_sha256,source_published_at,
                  retrieved_at,source_contract_version,archive_hash,raw_metadata,created_by
                ) values(
                  %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,null,%s,%s,%s,%s::jsonb,null
                )
                on conflict (id) do nothing
                """,
                (aid,PORTFOLIO_ID,EXPERIMENT_ID,SOURCE_KIND,date,date,url,filename,
                 content_sha,compressed_sha,retrieved_at,SOURCE_CONTRACT,ah,json.dumps(raw_metadata))
            )
            cur.execute(
                """
                select id::text,retrieved_at::text,archive_hash,content_sha256,compressed_sha256
                from public.p8_b3_source_archives where id=%s
                """,(aid,)
            )
            verified=cur.fetchone()
            if not verified or verified[2:] != (ah,content_sha,compressed_sha):
                raise RuntimeError("Source archive metadata verification failed")
            return aid,verified[1],ah,True

def put_immutable(s3,bucket,key,data,content_type,metadata):
    digest=sha256_bytes(data)
    try:
        got=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
        if got != data:
            raise RuntimeError(f"Immutable R2 object conflict: {key}")
        return {"key":key,"bytes":len(data),"sha256":digest,"write":"UNCHANGED"}
    except s3.exceptions.ClientError as exc:
        code=str(exc.response.get("Error",{}).get("Code",""))
        if code not in {"404","NoSuchKey","NotFound"}:
            raise
    s3.put_object(Bucket=bucket,Key=key,Body=data,ContentType=content_type,
                  Metadata={"sha256":digest,**metadata})
    got=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    if got != data:
        raise RuntimeError(f"R2 immutable read-back failed: {key}")
    return {"key":key,"bytes":len(data),"sha256":digest,"write":"UPDATED"}

def put_replace(s3,bucket,key,data,content_type,metadata):
    digest=sha256_bytes(data)
    s3.put_object(Bucket=bucket,Key=key,Body=data,ContentType=content_type,
                  Metadata={"sha256":digest,**metadata})
    got=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    if got != data:
        raise RuntimeError(f"R2 replace read-back failed: {key}")
    return {"key":key,"bytes":len(data),"sha256":digest,"write":"UPDATED"}

def get_json(s3,bucket,key):
    raw=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    return json.loads(raw),raw

def materialize_rows(parsed,identities,archive_id):
    rows=[]
    unknown=[]
    for row in parsed:
        iid=identities.get(row["historical_isin"])
        if not iid:
            unknown.append(row["historical_isin"])
            continue
        rh=row["row_hash"]
        rows.append({
            "id":deterministic_uuid(f"{CAMPAIGN_ID}|price|{archive_id}|{iid}|{rh}"),
            "portfolio_id":PORTFOLIO_ID,
            "experiment_id":EXPERIMENT_ID,
            "historical_identity_id":iid,
            "source_archive_id":archive_id,
            "trade_date":row["trade_date"],
            "exchange":row["exchange"],
            "trading_symbol":row["trading_symbol"],
            "series":row["series"],
            "source_format":row["source_format"],
            "previous_close":row["previous_close"],
            "open":row["open"],
            "high":row["high"],
            "low":row["low"],
            "close":row["close"],
            "last_price":row["last_price"],
            "volume":row["volume"],
            "traded_value":row["traded_value"],
            "trade_count":row["trade_count"],
            "row_hash":rh,
            "raw_metadata":canonical_json({
                "campaign_id":CAMPAIGN_ID,
                "historical_isin":row["historical_isin"],
                "plan_hash":PLAN_HASH,
            }),
        })
    return rows,unknown

def parquet_bytes(rows,created_at):
    fields=[
        "id","portfolio_id","experiment_id","historical_identity_id","source_archive_id",
        "trade_date","exchange","trading_symbol","series","source_format","previous_close",
        "open","high","low","close","last_price","volume","traded_value","trade_count",
        "row_hash","raw_metadata","created_at"
    ]
    complete=[]
    for row in rows:
        item={k:row.get(k) for k in fields}
        item["created_at"]=created_at
        complete.append(item)
    complete.sort(key=lambda x:x["id"])
    with tempfile.TemporaryDirectory() as td:
        nd=Path(td)/"rows.ndjson"; pq=Path(td)/"part.parquet"
        with nd.open("w",encoding="utf-8") as fh:
            for row in complete:
                fh.write(canonical_json(row)+"\n")
        schema="{" + ",".join("'" + k + "':'VARCHAR'" for k in fields) + "}"
        con=duckdb.connect()
        try:
            src=str(nd).replace("'","''"); dst=str(pq).replace("'","''")
            con.execute(
                f"COPY (SELECT * FROM read_json_auto('{src}',format='newline_delimited',columns={schema}) ORDER BY id) "
                f"TO '{dst}' (FORMAT PARQUET,COMPRESSION ZSTD,PARQUET_VERSION 'V2')"
            )
            n=con.execute("select count(*) from read_parquet(?)",[str(pq)]).fetchone()[0]
        finally:
            con.close()
        if n != len(complete):
            raise RuntimeError("Parquet row count mismatch")
        return pq.read_bytes(),complete

def runtime_key(date,row):
    series=row.get("series") or ""
    return f"{RUNTIME_PREFIX}/year={date[:4]}/series={quote(series,safe='')}/symbol={quote(row['trading_symbol'],safe='')}.json"

def runtime_row(row):
    return {k:row.get(k) for k in [
        "trade_date","exchange","trading_symbol","series","source_format","previous_close",
        "open","high","low","close","last_price","volume","traded_value","trade_count"
    ]}

def update_runtime_one(s3,bucket,date,row):
    key=runtime_key(date,row)
    created=False
    try:
        payload,_=get_json(s3,bucket,key)
    except s3.exceptions.ClientError as exc:
        code=str(exc.response.get("Error",{}).get("Code",""))
        if code not in {"404","NoSuchKey","NotFound"}:
            raise
        payload={"version":"P8_RAW_PRICE_RUNTIME_V1","symbol":row["trading_symbol"],
                 "series":row.get("series"),"year":int(date[:4]),"row_count":0,
                 "min_trade_date":None,"max_trade_date":None,"rows":[]}
        created=True
    if payload.get("version")!="P8_RAW_PRICE_RUNTIME_V1":
        raise RuntimeError(f"Unexpected runtime version: {key}")
    if payload.get("symbol")!=row["trading_symbol"] or (payload.get("series") or "")!=(row.get("series") or ""):
        raise RuntimeError(f"Runtime identity conflict: {key}")
    expected=runtime_row(row)
    rows=list(payload.get("rows") or [])
    same=[x for x in rows if x.get("trade_date")==date]
    if same:
        if len(same)!=1 or same[0]!=expected:
            raise RuntimeError(f"Existing runtime date conflict: {key}")
        return {"key":key,"created":False,"changed":False}
    rows.append(expected)
    rows.sort(key=lambda x:(x.get("trade_date") or "",x.get("trading_symbol") or "",x.get("series") or ""))
    payload["rows"]=rows; payload["row_count"]=len(rows)
    payload["min_trade_date"]=rows[0]["trade_date"]; payload["max_trade_date"]=rows[-1]["trade_date"]
    data=(canonical_json(payload)+"\n").encode()
    put_replace(s3,bucket,key,data,"application/json",{"append_version":APPEND_VERSION,"last_trade_date":date})
    return {"key":key,"created":created,"changed":True}

def count_runtime_objects(s3,bucket):
    paginator=s3.get_paginator("list_objects_v2")
    n=0
    for page in paginator.paginate(Bucket=bucket,Prefix=RUNTIME_PREFIX+"/"):
        n += len(page.get("Contents") or [])
    return n

def main():
    db_url=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db_url:
        raise RuntimeError("Refusing non-Development database")
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")
    expected_date=os.environ.get("P8_EXPECTED_DATE","").strip() or None
    s3=s3_client()

    date,identities=load_next_date_and_identities(db_url,expected_date)
    if date < "2024-07-08":
        raise RuntimeError("R2-native next-date runner only supports UDiFF dates")

    catalog,_=get_json(s3,bucket,CATALOG_KEY)
    ds=catalog["datasets"]["b3_raw_prices"]; rt=catalog["runtime"]["raw_prices"]
    if ds.get("max_date") >= date:
        raise RuntimeError(f"Catalog max_date {ds.get('max_date')} is not before {date}")

    filename,url,zip_bytes=fetch_official(date)
    member,csv_bytes=extract_csv(zip_bytes,filename)
    parsed=parse_udiff(csv_bytes,date)

    archive_id,retrieved_at,ah,db_inserted=upsert_archive_metadata(
        db_url,date,filename,url,zip_bytes,member,csv_bytes
    )

    zip_key=f"{SOURCE_PREFIX}/trade_date={date}/{filename}"
    content_key=f"{SOURCE_PREFIX}/content/trade_date={date}/{os.path.basename(member)}"
    zip_ev=put_immutable(s3,bucket,zip_key,zip_bytes,"application/zip",{
        "source_date":date,"archive_id":archive_id,"campaign_id":CAMPAIGN_ID,
        "content_sha256":sha256_bytes(csv_bytes)
    })
    content_ev=put_immutable(s3,bucket,content_key,csv_bytes,"text/csv",{
        "source_date":date,"archive_id":archive_id,"campaign_id":CAMPAIGN_ID,
        "content_sha256":sha256_bytes(csv_bytes)
    })

    rows,unknown=materialize_rows(parsed,identities,archive_id)
    if unknown:
        raise RuntimeError(f"Unknown historical ISIN rows on {date}: {sorted(set(unknown))[:20]}")
    if not rows:
        raise RuntimeError("No identity-resolved rows")

    pq_bytes,full_rows=parquet_bytes(rows,retrieved_at)
    partition_key=f"{CANONICAL_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet"
    pq_ev=put_immutable(s3,bucket,partition_key,pq_bytes,"application/octet-stream",{
        "append_version":APPEND_VERSION,"trade_date":date
    })
    fingerprint=sha256_bytes("".join(canonical_json(r)+"\n" for r in full_rows).encode())
    pm={
        "version":APPEND_VERSION,"status":"PASS","table":"p8_b3_raw_market_price_observations",
        "dataset":"b3_raw_prices","partition_date":date,"row_count":len(rows),
        "source_rows":len(parsed),"unknown_isin_rows":0,
        "source_content_sha256":sha256_bytes(csv_bytes),"source_key":content_key,
        "csv_member":member,"normalized_fingerprint_sha256":fingerprint,"parquet":pq_ev
    }
    pm_bytes=(json.dumps(pm,indent=2,sort_keys=True)+"\n").encode()
    pm_key=f"{CANONICAL_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/manifest.json"
    pm_ev=put_immutable(s3,bucket,pm_key,pm_bytes,"application/json",{
        "append_version":APPEND_VERSION,"trade_date":date
    })

    seen={}
    for row in rows:
        key=runtime_key(date,row)
        if key in seen:
            raise RuntimeError(f"Multiple rows for one runtime object/date: {key}")
        seen[key]=row

    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        results=[f.result() for f in concurrent.futures.as_completed(
            [pool.submit(update_runtime_one,s3,bucket,date,row) for row in seen.values()]
        )]
    created=sum(1 for x in results if x["created"])
    changed=sum(1 for x in results if x["changed"])
    if len(results)!=len(rows):
        raise RuntimeError("Runtime result count mismatch")

    # Parallel read-back verification.
    def verify(row):
        payload,_=get_json(s3,bucket,runtime_key(date,row))
        matches=[x for x in payload.get("rows",[]) if x.get("trade_date")==date]
        if len(matches)!=1 or matches[0]!=runtime_row(row):
            raise RuntimeError(f"Runtime read-back mismatch: {runtime_key(date,row)}")
        return True
    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
        verified=sum(1 for f in concurrent.futures.as_completed(
            [pool.submit(verify,row) for row in rows]
        ) if f.result())
    if verified!=len(rows):
        raise RuntimeError("Runtime verification count mismatch")

    runtime_count=count_runtime_objects(s3,bucket)
    before_rows=int(ds["row_count"]); before_parts=int(ds["partition_count"])
    before_rt_rows=int(rt["row_count"])
    if before_rows != before_rt_rows:
        raise RuntimeError("Catalog canonical/runtime row counts diverge before append")

    append_manifest={
        "version":APPEND_VERSION,"status":"PASS","environment":"DEVELOPMENT","date":date,
        "campaign_id":CAMPAIGN_ID,"plan_hash":PLAN_HASH,"source_archive_id":archive_id,
        "archive_hash":ah,"source_zip":zip_ev,"source_content":content_ev,
        "source_rows":len(parsed),"resolved_rows":len(rows),"unknown_isin_rows":0,
        "canonical_partition":pm_ev,"runtime_objects_touched":len(results),
        "runtime_objects_created":created,"runtime_objects_changed":changed,
        "runtime_rows_verified":verified,
        "new_canonical_row_count":before_rows+len(rows),
        "new_partition_count":before_parts+1,
        "new_runtime_row_count":before_rt_rows+len(rows),
        "new_runtime_object_count":runtime_count,
        "database_writes":1 if db_inserted else 0,
        "raw_price_database_writes":0,"production_changes":0
    }
    append_key=f"{ROOT}/manifests/v1/APPEND_{date}.json"
    append_bytes=(json.dumps(append_manifest,indent=2,sort_keys=True)+"\n").encode()
    append_ev=put_immutable(s3,bucket,append_key,append_bytes,"application/json",{
        "append_version":APPEND_VERSION,"trade_date":date
    })

    ds["row_count"]=before_rows+len(rows); ds["partition_count"]=before_parts+1; ds["max_date"]=date
    rt["row_count"]=before_rt_rows+len(rows); rt["object_count"]=runtime_count
    rt["last_append_date"]=date; rt["last_append_manifest"]=append_key
    catalog["append_version"]=APPEND_VERSION
    catalog["last_append_manifest_sha256"]=append_ev["sha256"]
    cat_bytes=(json.dumps(catalog,indent=2,sort_keys=True)+"\n").encode()
    cat_ev=put_replace(s3,bucket,CATALOG_KEY,cat_bytes,"application/json",{
        "append_version":APPEND_VERSION,"last_append_date":date
    })

    final,_=get_json(s3,bucket,CATALOG_KEY)
    fds=final["datasets"]["b3_raw_prices"]; frt=final["runtime"]["raw_prices"]
    if fds["max_date"]!=date or fds["row_count"]!=before_rows+len(rows) or frt["row_count"]!=before_rt_rows+len(rows):
        raise RuntimeError("Final catalog verification failed")

    print(json.dumps({
        "status":"PASS","version":"P8_B3_R2_NATIVE_SINGLE_DATE_V1","date":date,
        "source_rows":len(parsed),"resolved_rows":len(rows),"unknown_isin_rows":0,
        "source_archive_id":archive_id,"source_metadata_inserted":db_inserted,
        "partition":pq_ev,"runtime_rows_verified":verified,
        "runtime_objects_created":created,"runtime_objects_after":runtime_count,
        "canonical_rows_after":fds["row_count"],"partitions_after":fds["partition_count"],
        "append_manifest":append_ev,"catalog":cat_ev,
        "raw_price_database_writes":0,"production_changes":0
    },indent=2,sort_keys=True))

if __name__=="__main__":
    main()
