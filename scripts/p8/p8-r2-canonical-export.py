#!/usr/bin/env python3
import boto3, collections, hashlib, json, os, re, subprocess, tempfile
from pathlib import Path
from urllib.parse import quote
import duckdb
from botocore.config import Config
from boto3.s3.transfer import TransferConfig

ROOT="portfolioai-history/development/p8"
BACKUP_KEY=f"{ROOT}/rescue-backup-v1/portfolioai-p8-large-relations-2026-10-02.dump"
EXPORT_VERSION="P8_R2_CANONICAL_EXPORT_V1"
RUNTIME_VERSION="P8_RAW_PRICE_RUNTIME_V1"
EXPECTED={
    "p8_b3_raw_market_price_observations":532575,
    "p8_historical_listing_observations_v3":562790,
    "p8_historical_universe_member_listing_evidence_v3":562790,
    "p8_historical_universe_members_v3":144768,
}
TABLE_INFO={
    "p8_b3_raw_market_price_observations":("b3_raw_prices","trade_date"),
    "p8_historical_listing_observations_v3":("b2_listings","source_date"),
    "p8_historical_universe_member_listing_evidence_v3":("b2_evidence","decision_at"),
    "p8_historical_universe_members_v3":("b2_members","decision_at"),
}
RUNTIME_PRICE_FIELDS=[
    "trade_date","exchange","trading_symbol","series","source_format",
    "previous_close","open","high","low","close","last_price",
    "volume","traded_value","trade_count",
]

def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()

def sha256_file(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for block in iter(lambda:f.read(4*1024*1024),b""):
            h.update(block)
    return h.hexdigest()

def canonical_json(value):
    return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(",",":"))

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
    account=normalize_account(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"])
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(
            retries={"max_attempts":10,"mode":"adaptive"},
            connect_timeout=30,
            read_timeout=180,
            s3={"addressing_style":"path"},
        ),
    )

def pg_copy_unescape(value):
    if value == r"\N":
        return None
    out=[]
    i=0
    simple={"b":"\b","f":"\f","n":"\n","r":"\r","t":"\t","v":"\v","\\":"\\"}
    while i < len(value):
        ch=value[i]
        if ch != "\\":
            out.append(ch); i+=1; continue
        i+=1
        if i >= len(value):
            out.append("\\"); break
        esc=value[i]
        if esc in simple:
            out.append(simple[esc]); i+=1; continue
        if esc == "x":
            j=i+1; digits=""
            while j < len(value) and len(digits)<2 and value[j] in "0123456789abcdefABCDEF":
                digits+=value[j]; j+=1
            if digits:
                out.append(chr(int(digits,16))); i=j; continue
        if esc in "01234567":
            j=i; digits=""
            while j < len(value) and len(digits)<3 and value[j] in "01234567":
                digits+=value[j]; j+=1
            out.append(chr(int(digits,8))); i=j; continue
        out.append(esc); i+=1
    return "".join(out)

class FilePool:
    def __init__(self, limit=96):
        self.limit=limit
        self.handles=collections.OrderedDict()
    def write(self,path,line):
        path=Path(path)
        path.parent.mkdir(parents=True,exist_ok=True)
        key=str(path)
        handle=self.handles.pop(key,None)
        if handle is None:
            handle=open(path,"a",encoding="utf-8",newline="")
        self.handles[key]=handle
        handle.write(line)
        if len(self.handles)>self.limit:
            _,old=self.handles.popitem(last=False)
            old.close()
    def close(self):
        for h in self.handles.values(): h.close()
        self.handles.clear()

def partition_date(table,row):
    field=TABLE_INFO[table][1]
    value=row[field]
    if table in ("p8_historical_universe_member_listing_evidence_v3","p8_historical_universe_members_v3"):
        return value[:10]
    return value

def canonical_key(table,date):
    y,m=date[:4],date[5:7]
    if table=="p8_b3_raw_market_price_observations":
        return f"{ROOT}/b3/raw-prices/v1/year={y}/month={m}/trade_date={date}"
    if table=="p8_historical_listing_observations_v3":
        return f"{ROOT}/b2/listing-observations/v1/source_date={date}"
    if table=="p8_historical_universe_member_listing_evidence_v3":
        return f"{ROOT}/b2/listing-evidence/v1/decision_date={date}"
    if table=="p8_historical_universe_members_v3":
        return f"{ROOT}/b2/universe-members/v1/decision_date={date}"
    raise KeyError(table)

def parse_dump(dump_path,work):
    canonical_root=work/"canonical_ndjson"
    runtime_root=work/"runtime_ndjson"
    pool=FilePool()
    counts={k:0 for k in EXPECTED}
    dates={k:set() for k in EXPECTED}
    runtime_keys=set()
    minmax={k:[None,None] for k in EXPECTED}
    mount=f"{dump_path.parent}:/backup"
    cmd=["docker","run","--rm","-v",mount,"postgres:17-alpine",
         "pg_restore","--data-only","--file=-",f"/backup/{dump_path.name}"]
    proc=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1024*1024)
    current=None; columns=None
    copy_re=re.compile(r"^COPY public\.([A-Za-z0-9_]+) \((.*)\) FROM stdin;$")
    assert proc.stdout is not None
    for raw in proc.stdout:
        line=raw.rstrip("\n")
        m=copy_re.match(line)
        if m:
            table=m.group(1)
            current=table if table in EXPECTED else None
            columns=[x.strip() for x in m.group(2).split(",")] if current else None
            continue
        if current and line == r"\.":
            current=None; columns=None; continue
        if not current:
            continue
        values=line.split("\t")
        if len(values)!=len(columns):
            raise RuntimeError(f"COPY_FIELD_COUNT_MISMATCH {current} {len(values)} != {len(columns)}")
        row={k:pg_copy_unescape(v) for k,v in zip(columns,values)}
        date=partition_date(current,row)
        dataset=TABLE_INFO[current][0]
        pool.write(canonical_root/dataset/f"{date}.ndjson",canonical_json(row)+"\n")
        counts[current]+=1; dates[current].add(date)
        if minmax[current][0] is None or date<minmax[current][0]: minmax[current][0]=date
        if minmax[current][1] is None or date>minmax[current][1]: minmax[current][1]=date

        if current=="p8_b3_raw_market_price_observations":
            symbol=row["trading_symbol"] or ""
            series=row["series"] or ""
            year=date[:4]
            encoded_symbol=quote(symbol,safe="")
            encoded_series=quote(series,safe="")
            rel=f"year={year}/series={encoded_series}/symbol={encoded_symbol}.ndjson"
            sanitized={k:row.get(k) for k in RUNTIME_PRICE_FIELDS}
            pool.write(runtime_root/rel,canonical_json(sanitized)+"\n")
            runtime_keys.add(rel)
    pool.close()
    stderr=proc.stderr.read() if proc.stderr else ""
    rc=proc.wait()
    if rc!=0:
        raise RuntimeError(f"PG_RESTORE_STREAM_FAILED {rc}: {stderr[-4000:]}")
    if counts!=EXPECTED:
        raise RuntimeError(f"GLOBAL_COUNT_MISMATCH expected={EXPECTED} actual={counts}")
    return canonical_root,runtime_root,counts,dates,minmax,sorted(runtime_keys)

def parquet_partition(ndjson_path,out_path):
    rows=[json.loads(line) for line in ndjson_path.read_text(encoding="utf-8").splitlines() if line]
    rows.sort(key=lambda r:r.get("id") or "")
    fp=hashlib.sha256()
    sorted_ndjson=ndjson_path.with_suffix(".sorted.ndjson")
    with sorted_ndjson.open("w",encoding="utf-8") as f:
        for row in rows:
            line=canonical_json(row)
            fp.update((line+"\n").encode())
            f.write(line+"\n")
    out_path.parent.mkdir(parents=True,exist_ok=True)
    con=duckdb.connect()
    try:
        src=str(sorted_ndjson).replace("'","''")
        dst=str(out_path).replace("'","''")
        con.execute(f"COPY (SELECT * FROM read_json_auto('{src}', format='newline_delimited', all_varchar=true)) TO '{dst}' (FORMAT PARQUET, COMPRESSION ZSTD, PARQUET_VERSION 'V2')")
        check=con.execute(f"SELECT count(*) FROM read_parquet('{dst}')").fetchone()[0]
    finally:
        con.close()
    sorted_ndjson.unlink()
    if check!=len(rows):
        raise RuntimeError(f"PARQUET_COUNT_MISMATCH {out_path}")
    return len(rows),fp.hexdigest()

def runtime_json(ndjson_path,out_path):
    rows=[json.loads(line) for line in ndjson_path.read_text(encoding="utf-8").splitlines() if line]
    rows.sort(key=lambda r:(r.get("trade_date") or "",r.get("trading_symbol") or "",r.get("series") or ""))
    first=rows[0] if rows else {}
    payload={
        "version":RUNTIME_VERSION,
        "symbol":first.get("trading_symbol"),
        "series":first.get("series"),
        "year":int((first.get("trade_date") or "0000")[:4]),
        "row_count":len(rows),
        "min_trade_date":rows[0]["trade_date"] if rows else None,
        "max_trade_date":rows[-1]["trade_date"] if rows else None,
        "rows":rows,
    }
    data=(canonical_json(payload)+"\n").encode()
    out_path.parent.mkdir(parents=True,exist_ok=True)
    out_path.write_bytes(data)
    return payload

def upload_verified(s3,bucket,path,key,content_type,transfer):
    local=sha256_file(path)
    s3.upload_file(str(path),bucket,key,ExtraArgs={"ContentType":content_type,"Metadata":{"sha256":local}},Config=transfer)
    got=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    remote=sha256_bytes(got)
    if remote!=local:
        raise RuntimeError(f"R2_SHA256_MISMATCH {key}")
    head=s3.head_object(Bucket=bucket,Key=key)
    if int(head["ContentLength"])!=path.stat().st_size:
        raise RuntimeError(f"R2_SIZE_MISMATCH {key}")
    return {"key":key,"bytes":path.stat().st_size,"sha256":local}

def main():
    out=Path(os.environ.get("P8_R2_EXPORT_OUT","tmp/p8-r2-canonical-export"))
    out.mkdir(parents=True,exist_ok=True)
    s3=s3_client(); bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
    transfer=TransferConfig(multipart_threshold=64*1024*1024,multipart_chunksize=64*1024*1024,max_concurrency=4,use_threads=True)

    dump=out/"source.dump"
    s3.download_file(bucket,BACKUP_KEY,str(dump),Config=transfer)
    backup_sidecar=s3.get_object(Bucket=bucket,Key=BACKUP_KEY+".sha256")["Body"].read().decode().strip().split()[0]
    if sha256_file(dump)!=backup_sidecar:
        raise RuntimeError("BACKUP_DUMP_SHA256_MISMATCH")

    canonical_root,runtime_root,counts,dates,minmax,runtime_keys=parse_dump(dump,out)
    canonical_out=out/"canonical_parquet"
    runtime_out=out/"runtime_json"
    private_manifest={"version":EXPORT_VERSION,"datasets":{},"objects":[]}
    public_datasets={}

    for table,(dataset,_) in TABLE_INFO.items():
        dataset_count=0; partition_entries=[]
        for nd in sorted((canonical_root/dataset).glob("*.ndjson")):
            date=nd.stem
            pq=canonical_out/dataset/date/"part-00000.parquet"
            row_count,fp=parquet_partition(nd,pq)
            base=canonical_key(table,date)
            parquet_ev=upload_verified(s3,bucket,pq,f"{base}/part-00000.parquet","application/octet-stream",transfer)
            pm={
                "version":EXPORT_VERSION,"table":table,"dataset":dataset,"partition_date":date,
                "row_count":row_count,"normalized_fingerprint_sha256":fp,"parquet":parquet_ev,
            }
            mp=out/"partition-manifest.json"
            mp.write_text(json.dumps(pm,indent=2,sort_keys=True)+"\n")
            manifest_ev=upload_verified(s3,bucket,mp,f"{base}/manifest.json","application/json",transfer)
            pm["manifest"]=manifest_ev
            partition_entries.append(pm); dataset_count+=row_count
        if dataset_count!=EXPECTED[table]:
            raise RuntimeError(f"DATASET_COUNT_MISMATCH {table}")
        private_manifest["datasets"][dataset]={
            "source_table":table,"row_count":dataset_count,
            "partition_count":len(partition_entries),
            "min_date":minmax[table][0],"max_date":minmax[table][1],
            "partitions":partition_entries,
        }
        public_datasets[dataset]={
            "row_count":dataset_count,
            "partition_count":len(partition_entries),
            "min_date":minmax[table][0],"max_date":minmax[table][1],
            "canonical_format":"PARQUET_V2_ZSTD",
        }

    runtime_count=0; runtime_files=0
    for rel in runtime_keys:
        nd=runtime_root/rel
        js=runtime_out/rel.replace(".ndjson",".json")
        payload=runtime_json(nd,js)
        key=f"{ROOT}/runtime/raw-prices/v1/{rel.replace('.ndjson','.json')}"
        upload_verified(s3,bucket,js,key,"application/json",transfer)
        runtime_count+=payload["row_count"]; runtime_files+=1
    if runtime_count!=EXPECTED["p8_b3_raw_market_price_observations"]:
        raise RuntimeError(f"RUNTIME_COUNT_MISMATCH {runtime_count}")

    private_manifest["runtime"]={
        "version":RUNTIME_VERSION,"row_count":runtime_count,"object_count":runtime_files,
        "key_template":f"{ROOT}/runtime/raw-prices/v1/year={{YYYY}}/series={{SERIES_URI}}/symbol={{SYMBOL_URI}}.json",
    }
    private_path=out/"TABLE_EXPORT_COMPLETE.json"
    private_path.write_text(json.dumps(private_manifest,indent=2,sort_keys=True)+"\n")
    private_ev=upload_verified(s3,bucket,private_path,f"{ROOT}/manifests/v1/TABLE_EXPORT_COMPLETE.json","application/json",transfer)

    catalog={
        "version":"PORTFOLIOAI_HISTORY_CATALOG_V1",
        "environment":"DEVELOPMENT",
        "status":"READY",
        "canonical_export_version":EXPORT_VERSION,
        "runtime_price_version":RUNTIME_VERSION,
        "datasets":public_datasets,
        "runtime":{
            "raw_prices":{
                "status":"READY",
                "row_count":runtime_count,
                "object_count":runtime_files,
                "endpoint":"/v1/raw-prices",
                "fields":RUNTIME_PRICE_FIELDS,
            }
        },
        "private_manifest_sha256":private_ev["sha256"],
    }
    catalog_path=out/"catalog.json"
    catalog_path.write_text(json.dumps(catalog,indent=2,sort_keys=True)+"\n")
    catalog_ev=upload_verified(s3,bucket,catalog_path,f"{ROOT}/catalog/v1/catalog.json","application/json",transfer)

    print(json.dumps({
        "status":"PASS","counts":counts,"runtime_rows":runtime_count,
        "runtime_objects":runtime_files,"catalog":catalog_ev,"private_manifest":private_ev
    },indent=2,sort_keys=True))

if __name__=="__main__":
    main()
