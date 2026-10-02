#!/usr/bin/env python3
import argparse, boto3, gzip, hashlib, io, json, os, tarfile, tempfile
from pathlib import Path
from urllib.parse import quote
import requests, duckdb

PREFIX="portfolioai-history/development/p8/storage-backup-v1"
DATASET_TABLES={
 "b3_raw_prices":"p8_b3_raw_market_price_observations",
 "b2_listings":"p8_historical_listing_observations_v3",
 "b2_evidence":"p8_historical_universe_member_listing_evidence_v3",
 "b2_members":"p8_historical_universe_members_v3",
}

def sha256_bytes(b): return hashlib.sha256(b).hexdigest()
def canonical_json(v): return json.dumps(v, sort_keys=True, separators=(",",":"), ensure_ascii=False)

def upload_verified(s3,bucket,key,data,content_type):
    local=sha256_bytes(data)
    s3.put_object(Bucket=bucket,Key=key,Body=data,ContentType=content_type,Metadata={"sha256":local})
    got=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    remote=sha256_bytes(got)
    if remote!=local: raise RuntimeError(f"R2_SHA256_MISMATCH {key}")
    return {"key":key,"bytes":len(data),"sha256":local}

def normalize_row(row):
    out={}
    for k,v in row.items():
        if v is None: out[k]=None
        elif isinstance(v,(dict,list)): out[k]=canonical_json(v)
        else: out[k]=str(v)
    return out

def fetch_partition(export_url,token,dataset,partition,tmp):
    offset=0; limit=1000; total=None; rows=[]; page_files=[]
    while True:
        r=requests.get(export_url,params={"dataset":dataset,"partition":partition,"offset":offset,"limit":limit},
                       headers={"x-backup-token":token},timeout=120)
        r.raise_for_status()
        cr=r.headers.get("x-content-range","")
        if "/" in cr and cr.split("/")[-1].isdigit(): total=int(cr.split("/")[-1])
        raw=r.content
        page=tmp/f"page-{offset:09d}.json"
        page.write_bytes(raw); page_files.append(page)
        batch=json.loads(raw.decode("utf-8"), parse_float=str, parse_int=str)
        if not isinstance(batch,list): raise RuntimeError("NON_ARRAY_EXPORT")
        rows.extend(normalize_row(x) for x in batch)
        if len(batch)<limit: break
        offset+=limit
    if total is not None and total!=len(rows):
        raise RuntimeError(f"COUNT_MISMATCH {dataset} {partition}: expected {total} got {len(rows)}")
    return rows,page_files,total

def build_partition(dataset,partition,rows,page_files,tmp):
    raw_tar=tmp/f"{dataset}-{partition}-raw-pages.tar.gz"
    with tarfile.open(raw_tar,"w:gz") as tf:
        for p in page_files: tf.add(p,arcname=p.name)
    nd=tmp/f"{dataset}-{partition}.ndjson"
    with nd.open("w",encoding="utf-8") as f:
        for row in rows: f.write(canonical_json(row)+"\n")
    pq=tmp/f"{dataset}-{partition}.parquet"
    con=duckdb.connect()
    try:
        src=str(nd).replace("'","''"); dst=str(pq).replace("'","''")
        con.execute(f"COPY (SELECT * FROM read_json_auto('{src}', format='newline_delimited', all_varchar=true)) TO '{dst}' (FORMAT PARQUET, COMPRESSION ZSTD, PARQUET_VERSION 'V2')")
        back=con.execute(f"SELECT * FROM read_parquet('{dst}') ORDER BY id").fetchall()
        cols=[x[0] for x in con.description]
    finally: con.close()
    ordered=sorted(rows,key=lambda r:r.get("id") or "")
    fp=hashlib.sha256(("\n".join(canonical_json(r) for r in ordered)).encode()).hexdigest()
    return raw_tar,pq,fp

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--plan",required=True); ap.add_argument("--out",required=True)
    a=ap.parse_args()
    plan=json.loads(Path(a.plan).read_text())
    export_url=os.environ["P8_EXPORT_URL"]; export_token=os.environ["P8_EXPORT_TOKEN"]
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"]; access=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"]
    secret=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"]; bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
    s3=boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
                    aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto")
    out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
    global_manifest={"version":"P8_STORAGE_BACKUP_V1","datasets":{},"expected_counts":plan["expected_counts"],"complete":False}
    for dataset,parts in plan["partitions"].items():
        dman={"row_count":0,"partitions":[]}
        for partition in parts:
            with tempfile.TemporaryDirectory() as td:
                tmp=Path(td)
                rows,pages,total=fetch_partition(export_url,export_token,dataset,partition,tmp)
                raw_tar,pq,fp=build_partition(dataset,partition,rows,pages,tmp)
                base=f"{PREFIX}/dataset={dataset}/partition_date={partition}"
                raw_ev=upload_verified(s3,bucket,f"{base}/raw-pages.tar.gz",raw_tar.read_bytes(),"application/gzip")
                pq_ev=upload_verified(s3,bucket,f"{base}/data.parquet",pq.read_bytes(),"application/octet-stream")
                pm={"dataset":dataset,"partition":partition,"row_count":len(rows),"db_reported_count":total,
                    "normalized_fingerprint_sha256":fp,"raw_backup":raw_ev,"parquet":pq_ev}
                mb=(json.dumps(pm,indent=2,sort_keys=True)+"\n").encode()
                mev=upload_verified(s3,bucket,f"{base}/manifest.json",mb,"application/json")
                pm["manifest"]=mev
                dman["row_count"]+=len(rows); dman["partitions"].append(pm)
                print(json.dumps({"dataset":dataset,"partition":partition,"rows":len(rows),"status":"PASS"}),flush=True)
        exp=plan["expected_counts"][dataset]
        if dman["row_count"]!=exp: raise RuntimeError(f"GLOBAL_COUNT_MISMATCH {dataset}: {dman['row_count']} != {exp}")
        global_manifest["datasets"][dataset]=dman
    global_manifest["complete"]=True
    body=(json.dumps(global_manifest,indent=2,sort_keys=True)+"\n").encode()
    ev=upload_verified(s3,bucket,f"{PREFIX}/COMPLETE.json",body,"application/json")
    (out/"COMPLETE.json").write_bytes(body)
    print(json.dumps({"status":"PASS","complete_object":ev,"totals":{k:v["row_count"] for k,v in global_manifest["datasets"].items()}},indent=2))
if __name__=="__main__": main()
