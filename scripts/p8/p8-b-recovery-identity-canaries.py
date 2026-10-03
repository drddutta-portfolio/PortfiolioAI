#!/usr/bin/env python3
import boto3, json, os, sys, tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import duckdb
import psycopg
from botocore.config import Config

VERSION="P8_B_RECOVERY_IDENTITY_CANARIES_V1"
PREFIX="portfolioai-history/development/p8/b2/listing-observations/v1/"
OUT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_IDENTITY_CANARIES_AUDIT_2026-10-03.json")
EXPERIMENT="P8_EXP_NSE_MONTHLY_6M_V1"

def normalize_account(raw):
    raw=raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else:
        host=raw
    suffix=".r2.cloudflarestorage.com"
    return host[:-len(suffix)] if host.endswith(suffix) else host

def client():
    account=normalize_account(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"])
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}),
    )

def list_parts(s3,bucket):
    out=[]; token=None
    while True:
        kw={"Bucket":bucket,"Prefix":PREFIX,"MaxKeys":1000}
        if token: kw["ContinuationToken"]=token
        page=s3.list_objects_v2(**kw)
        out += [o["Key"] for o in page.get("Contents",[]) if o["Key"].endswith("/part-00000.parquet")]
        if not page.get("IsTruncated"): break
        token=page.get("NextContinuationToken")
    out.sort()
    if len(out)!=32: raise RuntimeError(f"expected 32 listing partitions, got {len(out)}")
    return out

def identities():
    db=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in db: raise RuntimeError("refusing non-Development DB")
    with psycopg.connect(db) as conn, conn.cursor() as cur:
        cur.execute("""
          select id::text,historical_isin,canonical_security_id::text
          from public.p8_historical_security_identities
          where experiment_id=%s
        """,(EXPERIMENT,))
        rows=cur.fetchall()
    if len(rows)!=4524: raise RuntimeError(f"identity count drift {len(rows)}")
    return {r[0]:{"historical_isin":r[1],"canonical_security_id":r[2]} for r in rows}

def main():
    bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
    if bucket!="portfolioai-history-dev": raise RuntimeError("refusing non-Development bucket")
    ids=identities(); s3=client(); keys=list_parts(s3,bucket)
    tmp=Path(tempfile.mkdtemp(prefix="p8-b-canaries-"))
    files=[]
    for i,key in enumerate(keys):
        p=tmp/f"{i:02d}.parquet"; s3.download_file(bucket,key,str(p)); files.append(str(p))
    q=",".join("'"+p.replace("'","''")+"'" for p in files)
    con=duckdb.connect()
    try:
        rows=con.execute(f"""
          select historical_identity_id::varchar, source_date::varchar, trading_symbol::varchar,
                 instrument_name::varchar, coalesce(series::varchar,'') as series
          from read_parquet([{q}])
          order by historical_identity_id, source_date, trading_symbol, instrument_name
        """).fetchall()
    finally:
        con.close()

    by=defaultdict(list)
    for hid,d,s,n,series in rows:
        if hid not in ids: raise RuntimeError("R2 listing row references unknown historical identity")
        by[hid].append({"source_date":d,"symbol":s,"name":n,"series":series})

    symbol_change=[]
    name_change=[]
    historical_only=[]
    for hid,obs in by.items():
        symbols=sorted(set(x["symbol"] for x in obs))
        names=sorted(set(x["name"] for x in obs))
        record={
          "historical_identity_id":hid,
          "historical_isin":ids[hid]["historical_isin"],
          "canonical_security_id":ids[hid]["canonical_security_id"],
          "first_source_date":min(x["source_date"] for x in obs),
          "last_source_date":max(x["source_date"] for x in obs),
          "observation_rows":len(obs),
          "symbols":symbols,
          "names":names,
        }
        if len(symbols)>1: symbol_change.append(record)
        if len(names)>1: name_change.append(record)
        if ids[hid]["canonical_security_id"] is None: historical_only.append(record)

    # deterministic canaries; pick strongest observed cases, not hand-selected survivors
    symbol_change.sort(key=lambda x:(-len(x["symbols"]),x["historical_isin"]))
    name_change.sort(key=lambda x:(-len(x["names"]),x["historical_isin"]))
    historical_only.sort(key=lambda x:(x["last_source_date"],x["historical_isin"]))

    symbol_canary=symbol_change[0] if symbol_change else None
    historical_only_canary=historical_only[0] if historical_only else None
    if not symbol_canary: raise RuntimeError("no symbol-change canary found in B2 listing evidence")
    if not historical_only_canary: raise RuntimeError("no historical-only canary found in B2 identity registry")

    audit={
      "version":VERSION,
      "generated_at":datetime.now(timezone.utc).isoformat(),
      "status":"PASS",
      "scope":{
        "historical_identities":len(ids),
        "listing_observation_rows":len(rows),
        "listing_partitions":len(keys),
        "provider_calls":0,
        "supabase_writes":0,
        "r2_writes":0,
        "filing_body_downloads":0,
        "performance_outcome_reads":0,
      },
      "population":{
        "identities_with_listing_evidence":len(by),
        "historical_only_with_listing_evidence":len(historical_only),
        "symbol_change_identities":len(symbol_change),
        "name_change_identities":len(name_change),
      },
      "canaries":{
        "historical_only_or_delisted_candidate":historical_only_canary,
        "symbol_change":symbol_canary,
        "name_change":name_change[0] if name_change else None,
      },
      "proof":[
        "Canary historical identities are selected from R2 B2 listing evidence, not current security state.",
        "The historical-only canary has canonical_security_id=null and therefore proves the adapter population includes identities with no current-security link.",
        "The symbol-change canary has more than one historically observed symbol under one historical_identity_id/ISIN.",
        "No present-day manual company assignment is used in canary selection or alias evidence."
      ],
      "exclusion_ceiling_state":"PENDING_OWNER_FREEZE",
    }
    OUT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")
    print(json.dumps(audit,indent=2,sort_keys=True))
    return 0

if __name__=="__main__":
    try: sys.exit(main())
    except Exception as exc:
        failure={"version":VERSION,"status":"BLOCKED_FAIL_CLOSED","error":type(exc).__name__+":"+str(exc),
                 "exclusion_ceiling_state":"PENDING_OWNER_FREEZE"}
        OUT.write_text(json.dumps(failure,indent=2,sort_keys=True)+"\n")
        print(json.dumps(failure,indent=2),file=sys.stderr)
        sys.exit(2)
