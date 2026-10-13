#!/usr/bin/env python3
"""Bank V1-4 KVB R2 PIT extraction: read-only raw candidate inventory, NEVER admission."""
import csv, hashlib, io, json, os, pathlib, re
from datetime import date
import boto3, pyarrow.parquet as pq
BASE="portfolioai-history/development/p8/b3/adjusted-decision-ledger/v2/"
ISIN="INE036D01028"; SYMBOL="KARURVYSYA"
OUT=pathlib.Path("kvb-pit-extract-artifact");OUT.mkdir(exist_ok=True)
bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
assert bucket=="portfolioai-history-dev"
account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"]
assert re.fullmatch(r"[a-f0-9]{32}",account)
s3=boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",region_name="auto")
objects=[]
for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket,Prefix=BASE):
    objects.extend(o["Key"] for o in page.get("Contents",[]) if o["Key"].endswith("/part-00000.parquet"))
def months(start,end):
    y,m=start
    while (y,m)<=end:
        yield f"{y:04d}-{m:02d}"
        m+=1
        if m==13:y,m=y+1,1
# The adjusted-decision ledger begins February 2024. The four preceding months
# are preserved in daily adjusted-series partitions; take only the verified
# last archived exchange-date file for each month (never invent month-end dates).
earlier={
 "2023-10":"portfolioai-history/development/p8/b3/adjusted-series/v1/year=2023/month=10/trade_date=2023-10-31/part-00000.parquet",
 "2023-11":"portfolioai-history/development/p8/b3/adjusted-series/v1/year=2023/month=11/trade_date=2023-11-30/part-00000.parquet",
 "2023-12":"portfolioai-history/development/p8/b3/adjusted-series/v1/year=2023/month=12/trade_date=2023-12-29/part-00000.parquet",
 "2024-01":"portfolioai-history/development/p8/b3/adjusted-series/v1/year=2024/month=01/trade_date=2024-01-31/part-00000.parquet",
}
available={re.search(r"decision_date=(\d{4}-\d{2}-\d{2})",key).group(1)[:7]:key for key in objects if re.search(r"decision_date=(\d{4}-\d{2}-\d{2})",key)}
rows=[]
for month in months((2023,10),(2026,9)):
    key=available.get(month) or earlier.get(month)
    row={"month":month,"archive_key":key or "", "archive_sha256":"","price_date":"","raw_price":"","identity_matches":0,"price_state":"NO_R2_MONTH_PARTITION" if not key else "NOT_YET_QUALIFIED","pit_eps_ttm_state":"ORIGINAL_AVAILABILITY_NOT_PROVEN","pit_bvps_state":"ORIGINAL_AVAILABILITY_NOT_PROVEN","corporate_action_basis":"NOT_QUALIFIED","pe_pit_admitted":False,"pb_pit_admitted":False}
    if key:
        b=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
        row["archive_sha256"]=hashlib.sha256(b).hexdigest()
        table=pq.read_table(io.BytesIO(b)); names=set(table.column_names)
        # Identity must be explicit; no approximate name matching or fallback prices.
        identity=next((x for x in ["isin","security_isin","historical_isin","canonical_link_symbol","symbol","trading_symbol"] if x in names),None)
        if identity is None: row["price_state"]="ARCHIVE_IDENTITY_SCHEMA_MISSING"
        else:
            d=table.to_pydict(); valid=[]
            for i,v in enumerate(d[identity]):
                if str(v).upper() in (ISIN,SYMBOL):
                    valid.append(i)
            row["identity_matches"]=len(valid)
            if not valid:row["price_state"]="KVB_IDENTITY_NOT_FOUND"
            else:
                cand=[x for x in ["adjusted_close","close","raw_close","price_close"] if x in names]
                daycol=next((x for x in ["trade_date","decision_date","period_start"] if x in names),None)
                if not cand or not daycol:row["price_state"]="PRICE_OR_DATE_SCHEMA_MISSING"
                else:
                    vals={(str(d[daycol][i])[:10],str(d[cand[0]][i])) for i in valid}
                    if len(vals)!=1:row["price_state"]="DUPLICATE_OR_AMBIGUOUS_PRICE"
                    else:
                        day,price=next(iter(vals))
                        if day[:7]!=month:row["price_state"]="MONTH_IDENTITY_MISMATCH"
                        else:
                            row.update(price_date=day,raw_price=price,price_state="PRICE_CANDIDATE_UNADMITTED")
    rows.append(row)
with (OUT/"kvb_r2_monthly_candidates.csv").open("w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary={"period":"2023-10..2026-09","expected_months":len(rows),"archive_partitions":sum(bool(r["archive_key"]) for r in rows),"daily_fallback_months":sum(r["month"] in earlier and bool(r["archive_key"]) for r in rows),"price_candidates":sum(r["price_state"]=="PRICE_CANDIDATE_UNADMITTED" for r in rows),"pe_pit_admitted":0,"pb_pit_admitted":0,"state_counts":{x:sum(r["price_state"]==x for r in rows) for x in sorted({r["price_state"] for r in rows})},"note":"Raw archive candidate extraction is not point-in-time valuation admission; never infer EPS/BVPS or corporate actions from adjusted close alone."}
(OUT/"summary.json").write_text(json.dumps(summary,indent=2)+"\n")
print(json.dumps(summary))
