#!/usr/bin/env python3
import argparse, boto3, hashlib, json, os, tarfile, tempfile
from pathlib import Path
import requests, duckdb

PREFIX="portfolioai-history/development/p8/storage-backup-v1"
PAGE_LIMIT=1000
PAGES_PER_CHUNK=10

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

def fetch_page(export_url,token,dataset,cursor):
    params={"dataset":dataset,"limit":PAGE_LIMIT}
    if cursor: params["cursor"]=cursor
    r=requests.get(export_url,params=params,headers={"x-backup-token":token},timeout=120)
    r.raise_for_status()
    batch=json.loads(r.content.decode("utf-8"),parse_float=str,parse_int=str)
    if not isinstance(batch,list): raise RuntimeError("NON_ARRAY_EXPORT")
    return r.content,[normalize_row(x) for x in batch]

def build_chunk(dataset,chunk_no,rows,raw_pages,tmp):
    raw_tar=tmp/f"{dataset}-{chunk_no:06d}-raw-pages.tar.gz"
    with tarfile.open(raw_tar,"w:gz") as tf:
        for idx,data in enumerate(raw_pages):
            p=tmp/f"page-{idx:03d}.json"
            p.write_bytes(data)
            tf.add(p,arcname=p.name)
    nd=tmp/f"{dataset}-{chunk_no:06d}.ndjson"
    with nd.open("w",encoding="utf-8") as h:
        for row in rows: h.write(canonical_json(row)+"\n")
    pq=tmp/f"{dataset}-{chunk_no:06d}.parquet"
    con=duckdb.connect()
    try:
        src=str(nd).replace("'","''"); dst=str(pq).replace("'","''")
        con.execute(f"COPY (SELECT * FROM read_json_auto('{src}', format='newline_delimited', all_varchar=true)) TO '{dst}' (FORMAT PARQUET, COMPRESSION ZSTD, PARQUET_VERSION 'V2')")
        back_count=con.execute(f"SELECT count(*) FROM read_parquet('{dst}')").fetchone()[0]
        if back_count!=len(rows): raise RuntimeError(f"PARQUET_COUNT_MISMATCH {dataset} chunk {chunk_no}")
    finally:
        con.close()
    ordered=sorted(rows,key=lambda r:r.get("id") or "")
    fp=hashlib.sha256(("\n".join(canonical_json(r) for r in ordered)).encode()).hexdigest()
    return raw_tar,pq,fp

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--plan",required=True)
    ap.add_argument("--out",required=True)
    a=ap.parse_args()
    plan=json.loads(Path(a.plan).read_text())
    export_url=os.environ["P8_EXPORT_URL"]; export_token=os.environ["P8_EXPORT_TOKEN"]
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"]; access=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"]
    secret=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"]; bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
    s3=boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
                    aws_access_key_id=access,aws_secret_access_key=secret,region_name="auto")
    out=Path(a.out); out.mkdir(parents=True,exist_ok=True)

    global_manifest={"version":"P8_STORAGE_BACKUP_V1","datasets":{},"expected_counts":plan["expected_counts"],"complete":False}

    for dataset,expected in plan["expected_counts"].items():
        cursor=None; chunk_no=0; dataset_count=0; chunks=[]
        while True:
            rows=[]; raw_pages=[]; reached_end=False
            for _ in range(PAGES_PER_CHUNK):
                raw,batch=fetch_page(export_url,export_token,dataset,cursor)
                if not batch:
                    reached_end=True
                    break
                raw_pages.append(raw)
                rows.extend(batch)
                cursor=batch[-1]["id"]
                if len(batch)<PAGE_LIMIT:
                    reached_end=True
                    break
            if not rows:
                break

            chunk_no+=1
            with tempfile.TemporaryDirectory() as td:
                tmp=Path(td)
                raw_tar,pq,fp=build_chunk(dataset,chunk_no,rows,raw_pages,tmp)
                base=f"{PREFIX}/dataset={dataset}/chunk={chunk_no:06d}"
                raw_ev=upload_verified(s3,bucket,f"{base}/raw-pages.tar.gz",raw_tar.read_bytes(),"application/gzip")
                pq_ev=upload_verified(s3,bucket,f"{base}/data.parquet",pq.read_bytes(),"application/octet-stream")
                cm={
                    "dataset":dataset,
                    "chunk":chunk_no,
                    "row_count":len(rows),
                    "first_id":rows[0]["id"],
                    "last_id":rows[-1]["id"],
                    "normalized_fingerprint_sha256":fp,
                    "raw_backup":raw_ev,
                    "parquet":pq_ev,
                }
                mb=(json.dumps(cm,indent=2,sort_keys=True)+"\n").encode()
                cm["manifest"]=upload_verified(s3,bucket,f"{base}/manifest.json",mb,"application/json")
                chunks.append(cm)
                dataset_count+=len(rows)
                print(json.dumps({"dataset":dataset,"chunk":chunk_no,"rows":len(rows),"total":dataset_count,"status":"PASS"}),flush=True)

            if reached_end:
                break

        if dataset_count!=expected:
            raise RuntimeError(f"GLOBAL_COUNT_MISMATCH {dataset}: {dataset_count} != {expected}")
        global_manifest["datasets"][dataset]={"row_count":dataset_count,"chunk_count":chunk_no,"chunks":chunks}

    global_manifest["complete"]=True
    body=(json.dumps(global_manifest,indent=2,sort_keys=True)+"\n").encode()
    ev=upload_verified(s3,bucket,f"{PREFIX}/COMPLETE.json",body,"application/json")
    (out/"COMPLETE.json").write_bytes(body)
    print(json.dumps({"status":"PASS","complete_object":ev,"totals":{k:v["row_count"] for k,v in global_manifest["datasets"].items()}},indent=2))

if __name__=="__main__":
    main()
