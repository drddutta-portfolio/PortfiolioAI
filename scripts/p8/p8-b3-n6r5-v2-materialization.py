#!/usr/bin/env python3
import bisect
import hashlib
import io
import json
import os
from collections import Counter, defaultdict
from decimal import Context, Decimal, ROUND_HALF_EVEN, localcontext
from pathlib import Path

import boto3
import pyarrow as pa
import pyarrow.parquet as pq
import psycopg
from botocore.config import Config
from psycopg.rows import dict_row

PROJECT_REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID="P8_EXP_NSE_MONTHLY_6M_V1"
RAW_CAMPAIGN_ID="P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
ROOT="portfolioai-history/development/p8"
RAW_PREFIX=f"{ROOT}/b3/raw-prices/v1"
V1_ADJ=f"{ROOT}/b3/adjusted-series/v1"
V1_LEDGER=f"{ROOT}/b3/adjusted-decision-ledger/v1"
V2_ADJ=f"{ROOT}/b3/adjusted-series/v2"
V2_LEDGER=f"{ROOT}/b3/adjusted-decision-ledger/v2"
V1_COMPLETE=f"{ROOT}/manifests/v1/N6_COMPLETE.json"
V2_COMPLETE=f"{ROOT}/manifests/v2/N6R5_COMPLETE.json"
CATALOG_KEY=f"{ROOT}/catalog/v1/catalog.json"

N6R2=Path("docs/p8/PortfolioAI_P8_B3_N6R2_DIVIDEND_RECOVERY_2026-10-03.json")
N6R3=Path("docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_LOCAL_POLICY_AUDIT_2026-10-03.json")
N6R4=Path("docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_AUDIT_2026-10-03.json")
N6R4_MATRIX=Path("docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_MATRIX_2026-10-03.csv")
OUT=Path("docs/p8/PortfolioAI_P8_B3_N6R5_V2_MATERIALIZATION_AUDIT_2026-10-03.json")

N6R5_VERSION="P8_B3_N6R5_V2_MATERIALIZATION_V1"
ADJUSTMENT_VERSION="P8_B3_ADJUSTMENT_V2"
ARITHMETIC_VERSION="P8_B3_ARITHMETIC_V1"
V2_SERIES_VERSION="P8_B3_ADJUSTED_SERIES_R2_V2"
V2_LEDGER_VERSION="P8_B3_DECISION_LEDGER_R2_V2"
POLICY="STRICT_1_BENCHMARK_DAY"

EXPECTED_V1_ADJ_FP="7f7f14c7af972baa22e0363732a285df1e4f3e0631d8134ce665ac32397c8a76"
EXPECTED_V1_LEDGER_FP="9ec30b0c8ea30e5d8068be570a8b251964efc5ef725d795165666b5223b275ae"
EXPECTED_V1_COMPLETE_FP="59992c038e74f83ccb278dce0af73ed6cbd97ba2064c67cd724e0df531a4ca12"
EXPECTED_ROWS=1854978
EXPECTED_LEDGER=121956
EXPECTED_CF=1177
EXPECTED_READY=82571
EXPECTED_BLOCKED=39385
EXPECTED_COMPLEX=9
EXPECTED_NO_TRADE=39376

CTX=Context(prec=50,rounding=ROUND_HALF_EVEN)
ONE=Decimal("1")
ZERO=Decimal("0")
TRI_BASE=Decimal("1000")

ADJ_SCHEMA=pa.schema([
 ("id",pa.string()),("raw_price_observation_id",pa.string()),("historical_identity_id",pa.string()),
 ("trade_date",pa.string()),("trading_symbol",pa.string()),("series",pa.string()),
 ("adjustment_version",pa.string()),("arithmetic_policy_version",pa.string()),
 ("series_state",pa.string()),("cumulative_price_factor",pa.string()),
 ("adjusted_open",pa.string()),("adjusted_high",pa.string()),("adjusted_low",pa.string()),
 ("adjusted_close",pa.string()),("daily_price_return",pa.string()),
 ("daily_total_return",pa.string()),("total_return_index",pa.string()),
 ("blocker_reason",pa.string()),("lineage_json",pa.string()),("series_hash",pa.string())
])
LEDGER_SCHEMA=pa.schema([
 ("id",pa.string()),("decision_date",pa.string()),("historical_identity_id",pa.string()),
 ("historical_isin",pa.string()),("state",pa.string()),("blocker_reason",pa.string()),
 ("adjusted_series_row_id",pa.string()),("adjusted_close",pa.string()),
 ("total_return_index",pa.string()),("lineage_json",pa.string()),("row_hash",pa.string())
])

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

def canonical(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False)
def sha_bytes(v): return hashlib.sha256(v).hexdigest()
def sha_json(v): return sha_bytes(canonical(v).encode())
def deterministic_uuid(seed):
    h=hashlib.sha256(seed.encode()).hexdigest()
    variant=("8","9","a","b")[int(h[16],16)%4]
    return f"{h[:8]}-{h[8:12]}-5{h[13:16]}-{variant}{h[17:20]}-{h[20:32]}"
def dec(v): return Decimal(str(v))
def sig30(v):
    with localcontext(CTX):
        d=Decimal(str(v))
        if d==0:return "0"
        q=Decimal(1).scaleb(d.adjusted()-29)
        return format(d.quantize(q,rounding=ROUND_HALF_EVEN).normalize(),"f")

def read_obj(s3,bucket,key): return s3.get_object(Bucket=bucket,Key=key)["Body"].read()
def read_json_obj(s3,bucket,key):
    raw=read_obj(s3,bucket,key); return json.loads(raw),raw
def table(data,columns=None): return pq.read_table(io.BytesIO(data),columns=columns)

def parquet_bytes(rows,schema):
    arrays=[pa.array([r.get(f.name) for r in rows],type=f.type) for f in schema]
    out=io.BytesIO()
    pq.write_table(pa.Table.from_arrays(arrays,schema=schema),out,compression="zstd",compression_level=9,use_dictionary=True,write_statistics=True,version="2.6",data_page_version="2.0")
    return out.getvalue()

def put_immutable(s3,bucket,key,data,content_type):
    digest=sha_bytes(data)
    try: existing=read_obj(s3,bucket,key)
    except Exception as exc:
        code=getattr(exc,"response",{}).get("Error",{}).get("Code")
        if code in ("NoSuchKey","404"): existing=None
        else: raise
    if existing is not None:
        if sha_bytes(existing)!=digest: raise RuntimeError(f"Immutable V2 object mismatch: {key}")
        return "UNCHANGED",digest,len(existing)
    s3.put_object(Bucket=bucket,Key=key,Body=data,ContentType=content_type,Metadata={"sha256":digest,"n6r5-version":N6R5_VERSION})
    check=read_obj(s3,bucket,key)
    if sha_bytes(check)!=digest: raise RuntimeError(f"R2 read-back mismatch: {key}")
    return "CREATED",digest,len(data)

def raw_key(d): return f"{RAW_PREFIX}/year={d[:4]}/month={d[5:7]}/trade_date={d}/part-00000.parquet"
def v2_key(d): return f"{V2_ADJ}/year={d[:4]}/month={d[5:7]}/trade_date={d}/part-00000.parquet"
def v2_manifest_key(d): return f"{V2_ADJ}/year={d[:4]}/month={d[5:7]}/trade_date={d}/manifest.json"
def v1_ledger_key(d): return f"{V1_LEDGER}/decision_date={d}/part-00000.parquet"
def v2_ledger_key(d): return f"{V2_LEDGER}/decision_date={d}/part-00000.parquet"
def v2_ledger_manifest_key(d): return f"{V2_LEDGER}/decision_date={d}/manifest.json"

def raw_rows(s3,bucket,d):
    t=table(read_obj(s3,bucket,raw_key(d)))
    need={"id","historical_identity_id","trading_symbol","series","open","high","low","close","row_hash"}
    if not need.issubset(set(t.column_names)): raise RuntimeError(f"Raw schema drift {d}")
    groups=defaultdict(list)
    for r in t.to_pylist():
        if r.get("historical_identity_id") is None: continue
        ident=str(r["historical_identity_id"])
        groups[ident].append({
          "id":str(r["id"]),"historical_identity_id":ident,
          "trading_symbol":str(r.get("trading_symbol") or "").strip().upper(),
          "series":str(r.get("series") or "").strip().upper(),
          "open":None if r.get("open") is None else str(r["open"]),
          "high":None if r.get("high") is None else str(r["high"]),
          "low":None if r.get("low") is None else str(r["low"]),
          "close":str(r["close"]),"row_hash":str(r["row_hash"])
        })
    return groups

def load_dates_and_factors(db):
    with psycopg.connect(db,row_factory=dict_row) as conn:
      with conn.cursor() as cur:
        cur.execute("""
          select distinct b.trade_date::text trade_date
          from public.p8_b3_benchmark_total_return_history b
          join public.p8_b3_source_archives a on a.id=b.source_archive_id
          where b.portfolio_id=%s and b.experiment_id=%s
            and a.raw_metadata->>'campaign_id'=%s
          order by trade_date
        """,(PORTFOLIO_ID,EXPERIMENT_ID,RAW_CAMPAIGN_ID))
        dates=[r["trade_date"] for r in cur.fetchall()]
        if len(dates)!=744: raise RuntimeError(f"Expected 744 dates, got {len(dates)}")

        cur.execute("""
          select n.id::text normalization_id,
                 f.historical_identity_id::text identity_id,
                 f.effective_date::text effective_date,
                 n.action_type,
                 f.factor_state,
                 f.price_back_adjustment_factor::text price_factor,
                 f.cash_distribution_per_share::text cash,
                 f.factor_hash
          from public.p8_b3_adjustment_factors f
          join public.p8_b3_corporate_action_normalizations n
            on n.id=f.corporate_action_normalization_id
          where f.portfolio_id=%s and f.experiment_id=%s
            and f.adjustment_version='P8_B3_ADJUSTMENT_V2'
          order by f.effective_date,f.id
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        factors=cur.fetchall()
    return dates,factors

def load_policy_inputs():
    n2=json.loads(N6R2.read_text())
    n3=json.loads(N6R3.read_text())
    n4=json.loads(N6R4.read_text())
    if n2["summary"]["status"]!="PASS" or n3["summary"]["status"]!="PASS" or n4["summary"]["status"]!="PASS":
        raise RuntimeError("N6R2/N6R3/N6R4 PASS evidence required")
    if n4["summary"]["recoverable_under_candidate_thresholds"]["lte_1_benchmark_trading_days"]!=EXPECTED_CF:
        raise RuntimeError("N6R4 strict threshold drift")

    recovered={}
    for e in n2["events"]:
        if e["recovery_state"]=="RECOVERED":
            recovered[e["normalization_id"]]={
              "identity":e["historical_identity_id"],
              "date":e["effective_date"],
              "cash":e["cash_distribution_per_share"]
            }

    price_boundaries=defaultdict(list)
    total_boundaries=defaultdict(list)
    for b in n3["boundaries"]:
        bd=b.get("boundary_date")
        if not bd: continue
        ident=b["historical_identity_id"]
        total_boundaries[ident].append(bd)
        if b["boundary_kind"]=="PRICE_AND_TOTAL_RETURN_BOUNDARY":
            price_boundaries[ident].append(bd)
    for m in (price_boundaries,total_boundaries):
        for ident in m: m[ident]=sorted(set(m[ident]))

    import csv
    cf={}
    with N6R4_MATRIX.open(newline="",encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["eligible_for_threshold_review"].lower()=="true" and int(r["benchmark_trading_day_staleness"])<=1:
                cf[(r["decision_date"],r["historical_identity_id"])]=r["prior_trade_date"]
    if len(cf)!=EXPECTED_CF: raise RuntimeError(f"Strict carry-forward rows {len(cf)} != {EXPECTED_CF}")
    return recovered,price_boundaries,total_boundaries,cf

def build_factor_schedules(factors,recovered,price_boundaries,total_boundaries):
    ready_price=defaultdict(list)
    cash_by_date=defaultdict(lambda:defaultdict(Decimal))
    factor_hashes=defaultdict(list)
    for r in factors:
        ident=r["identity_id"]; d=r["effective_date"]
        factor_hashes[ident].append(r["factor_hash"])
        if r["factor_state"]!="READY": continue
        if r["action_type"] in ("SPLIT","BONUS"):
            if r["price_factor"] is None: raise RuntimeError("READY price factor missing")
            # If this date is itself an unresolved capital boundary, do not bridge it.
            if d not in set(price_boundaries.get(ident,[])):
                ready_price[ident].append((d,dec(r["price_factor"])))
        elif r["action_type"]=="CASH_DIVIDEND":
            if d not in set(total_boundaries.get(ident,[])):
                if r["cash"] is None: raise RuntimeError("READY dividend cash missing")
                cash_by_date[d][ident]+=dec(r["cash"])

    for rec in recovered.values():
        ident=rec["identity"]; d=rec["date"]
        if d not in set(total_boundaries.get(ident,[])):
            cash_by_date[d][ident]+=dec(rec["cash"])

    # segment-local suffix products of resolved SPLIT/BONUS factors
    schedules=defaultdict(dict)
    for ident,events in ready_price.items():
        boundaries=price_boundaries.get(ident,[])
        byseg=defaultdict(list)
        for d,f in sorted(events):
            seg=bisect.bisect_right(boundaries,d)
            byseg[seg].append((d,f))
        for seg,evs in byseg.items():
            ds=[x[0] for x in evs]
            suffix=[ONE]*(len(evs)+1)
            prod=ONE
            for i in range(len(evs)-1,-1,-1):
                prod*=evs[i][1]; suffix[i]=prod
            schedules[ident][seg]=(ds,suffix)
    schedule_hash={i:sha_json(sorted(h)) for i,h in factor_hashes.items()}
    return schedules,cash_by_date,schedule_hash

def factor_for(ident,d,schedules,price_boundaries):
    boundaries=price_boundaries.get(ident,[])
    seg=bisect.bisect_right(boundaries,d)
    item=schedules.get(ident,{}).get(seg)
    if not item:return ONE
    ds,suffix=item
    idx=bisect.bisect_right(ds,d)
    return suffix[idx]

def load_v2_identity_rows(s3,bucket,d):
    t=table(read_obj(s3,bucket,v2_key(d)))
    out=defaultdict(list)
    for r in t.to_pylist(): out[str(r["historical_identity_id"])].append(r)
    return out

def unique_ready(cands):
    if not cands:return None
    sig={(r["series_state"],r["adjusted_close"],r["total_return_index"],r["blocker_reason"]) for r in cands}
    if len(sig)!=1: raise RuntimeError("V2 candidate economics ambiguity")
    r=sorted(cands,key=lambda x:x["raw_price_observation_id"])[0]
    if r["series_state"]!="READY": return None
    return r

def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db: raise RuntimeError("Refusing non-Development DB")
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev": raise RuntimeError("Refusing non-Development R2")
    s3=s3_client()

    v1,_=read_json_obj(s3,bucket,V1_COMPLETE)
    if v1["adjusted_series"]["aggregate_fingerprint_sha256"]!=EXPECTED_V1_ADJ_FP: raise RuntimeError("Frozen V1 adjusted fingerprint drift")
    if v1["decision_ledger"]["aggregate_fingerprint_sha256"]!=EXPECTED_V1_LEDGER_FP: raise RuntimeError("Frozen V1 ledger fingerprint drift")
    if v1["completion_fingerprint_sha256"]!=EXPECTED_V1_COMPLETE_FP: raise RuntimeError("Frozen V1 completion fingerprint drift")

    dates,factors=load_dates_and_factors(db)
    recovered,price_boundaries,total_boundaries,carry_forward=load_policy_inputs()
    schedules,cash_by_date,schedule_hash=build_factor_schedules(factors,recovered,price_boundaries,total_boundaries)

    prev_close={}
    tri_state={}
    manifests=[]
    total=ready=blocked=0
    boundary_rows=0
    created=unchanged=0

    for d in dates:
        groups=raw_rows(s3,bucket,d)
        rows=[]
        for ident in sorted(groups):
            group=sorted(groups[ident],key=lambda r:(r["trading_symbol"],r["series"],r["id"]))
            sig={(r["open"],r["high"],r["low"],r["close"]) for r in group}
            if len(sig)!=1: raise RuntimeError(f"Conflicting raw economics {ident} {d}")

            rep=group[0]
            price_boundary=d in set(price_boundaries.get(ident,[]))
            total_boundary=d in set(total_boundaries.get(ident,[]))
            factor=factor_for(ident,d,schedules,price_boundaries)
            with localcontext(CTX):
                o=None if rep["open"] is None else dec(rep["open"])*factor
                h=None if rep["high"] is None else dec(rep["high"])*factor
                l=None if rep["low"] is None else dec(rep["low"])*factor
                c=dec(rep["close"])*factor

                previous=None if price_boundary else prev_close.get(ident)
                daily_price=None
                daily_total=None
                cash=cash_by_date.get(d,{}).get(ident,ZERO)

                if previous is not None:
                    daily_price_d=c/previous-ONE
                    daily_price=sig30(daily_price_d)
                    if not total_boundary:
                        daily_total_d=(c+cash*factor)/previous-ONE
                        daily_total=sig30(daily_total_d)

                if total_boundary or ident not in tri_state:
                    tri=TRI_BASE
                elif daily_total is None:
                    # Initial row after a price boundary is also a total boundary by policy.
                    tri=TRI_BASE
                else:
                    tri=tri_state[ident]*(ONE+dec(daily_total))

                prev_close[ident]=c
                tri_state[ident]=tri

            if total_boundary: boundary_rows+=1
            derived={
              "cumulative_price_factor":sig30(factor),
              "adjusted_open":None if o is None else sig30(o),
              "adjusted_high":None if h is None else sig30(h),
              "adjusted_low":None if l is None else sig30(l),
              "adjusted_close":sig30(c),
              "daily_price_return":daily_price,
              "daily_total_return":daily_total,
              "total_return_index":sig30(tri)
            }
            for raw in group:
                lineage={
                  "n6r5Version":N6R5_VERSION,"policy":POLICY,
                  "rawPartitionKey":raw_key(d),"rawPriceObservationId":raw["id"],"rawRowHash":raw["row_hash"],
                  "factorScheduleHash":schedule_hash.get(ident),
                  "segmentPriceBoundary":price_boundary,"segmentTotalReturnBoundary":total_boundary,
                  "segmentRestart":bool(total_boundary),
                  "cashDistributionPerShare":sig30(cash) if cash!=0 else "0",
                  "equivalentIdentityDateRowCount":len(group)
                }
                logical={
                  "rawPriceObservationId":raw["id"],"historicalIdentityId":ident,"tradeDate":d,
                  "version":V2_SERIES_VERSION,"seriesState":"READY",**derived,"lineage":lineage
                }
                sh=sha_json(logical)
                rid=deterministic_uuid(f"P8_B3_SERIES_V2|{raw['id']}|{sh}")
                rows.append({
                  "id":rid,"raw_price_observation_id":raw["id"],"historical_identity_id":ident,
                  "trade_date":d,"trading_symbol":raw["trading_symbol"],"series":raw["series"],
                  "adjustment_version":ADJUSTMENT_VERSION,"arithmetic_policy_version":ARITHMETIC_VERSION,
                  "series_state":"READY","blocker_reason":None,"lineage_json":canonical(lineage),"series_hash":sh,**derived
                })
                ready+=1
        rows.sort(key=lambda r:(r["historical_identity_id"],r["trading_symbol"],r["series"],r["raw_price_observation_id"]))
        data=parquet_bytes(rows,ADJ_SCHEMA)
        st,psha,psz=put_immutable(s3,bucket,v2_key(d),data,"application/vnd.apache.parquet")
        created+=st=="CREATED"; unchanged+=st=="UNCHANGED"
        fp=sha_json([[r["id"],r["series_hash"],r["series_state"]] for r in rows])
        m={"version":V2_SERIES_VERSION,"trade_date":d,"row_count":len(rows),"ready_rows":len(rows),"blocked_rows":0,
           "parquet_sha256":psha,"parquet_bytes":psz,"normalized_fingerprint_sha256":fp,"policy":POLICY}
        md=(json.dumps(m,indent=2,sort_keys=True)+"\n").encode()
        st2,msha,_=put_immutable(s3,bucket,v2_manifest_key(d),md,"application/json")
        created+=st2=="CREATED"; unchanged+=st2=="UNCHANGED"
        m["manifest_sha256"]=msha; manifests.append(m); total+=len(rows)

    if total!=EXPECTED_ROWS or ready!=EXPECTED_ROWS or blocked!=0:
        raise RuntimeError(f"V2 series accounting {total}/{ready}/{blocked}")

    # Build V2 decision ledger by exact transformation of frozen V1 ledger.
    decision_dates=[]
    resp=s3.list_objects_v2(Bucket=bucket,Prefix=f"{V1_LEDGER}/",MaxKeys=1000)
    import re
    for o in resp.get("Contents") or []:
        m=re.search(r"decision_date=(\d{4}-\d{2}-\d{2})/part-00000\.parquet$",o["Key"])
        if m:decision_dates.append(m.group(1))
    decision_dates=sorted(set(decision_dates))
    if len(decision_dates)!=32: raise RuntimeError(f"Expected 32 decision dates, got {len(decision_dates)}")

    ledger_manifests=[]
    ledger_total=ledger_ready=ledger_blocked=cf_used=0
    blockers=Counter()

    for d in decision_dates:
        v1t=table(read_obj(s3,bucket,v1_ledger_key(d)))
        exact_cache=load_v2_identity_rows(s3,bucket,d)
        prior_cache={}
        out=[]
        for old in v1t.to_pylist():
            ident=str(old["historical_identity_id"])
            state=str(old["state"]); reason=old.get("blocker_reason")
            selected=None; cf_date=None; source="EXACT_DECISION_DATE"

            if state=="READY":
                selected=unique_ready(exact_cache.get(ident,[]))
                if selected is None: raise RuntimeError(f"V1 READY lacks V2 exact row {d} {ident}")
                new_state="READY"; new_reason=None
            elif reason=="COMPLEX_CORPORATE_ACTION_BLOCKER":
                if d in set(total_boundaries.get(ident,[])):
                    new_state="BLOCKED"; new_reason="COMPLEX_CORPORATE_ACTION_BLOCKER"
                else:
                    selected=unique_ready(exact_cache.get(ident,[]))
                    if selected is None: raise RuntimeError(f"Recoverable complex lacks exact V2 row {d} {ident}")
                    new_state="READY"; new_reason=None
            elif reason=="NO_TRADE_ON_DECISION_DATE":
                cf_date=carry_forward.get((d,ident))
                if cf_date:
                    source="STRICT_1_DAY_CARRY_FORWARD"
                    if cf_date not in prior_cache: prior_cache[cf_date]=load_v2_identity_rows(s3,bucket,cf_date)
                    selected=unique_ready(prior_cache[cf_date].get(ident,[]))
                    if selected is None: raise RuntimeError(f"Carry-forward V2 row missing {cf_date} {ident}")
                    new_state="READY"; new_reason=None; cf_used+=1
                else:
                    new_state="BLOCKED"; new_reason="NO_TRADE_ON_DECISION_DATE"
            else:
                raise RuntimeError(f"Unexpected frozen V1 ledger state {state}/{reason}")

            lineage={
              "ledgerVersion":V2_LEDGER_VERSION,"policy":POLICY,"decisionDate":d,
              "v1LedgerRowId":str(old["id"]),"v1LedgerRowHash":str(old["row_hash"]),
              "selectionSource":source,"carryForwardTradeDate":cf_date,
              "carryForwardBenchmarkTradingDays":1 if cf_date else None,
              "adjustedPartitionKey":v2_key(cf_date or d)
            }
            logical={
              "decisionDate":d,"historicalIdentityId":ident,"historicalIsin":old.get("historical_isin"),
              "state":new_state,"blockerReason":new_reason,
              "adjustedSeriesRowId":selected["id"] if selected else None,
              "adjustedClose":selected["adjusted_close"] if selected else None,
              "totalReturnIndex":selected["total_return_index"] if selected else None,
              "lineage":lineage
            }
            rh=sha_json(logical); rid=deterministic_uuid(f"P8_B3_DECISION_V2|{d}|{ident}|{rh}")
            out.append({
              "id":rid,"decision_date":d,"historical_identity_id":ident,
              "historical_isin":old.get("historical_isin"),"state":new_state,"blocker_reason":new_reason,
              "adjusted_series_row_id":selected["id"] if selected else None,
              "adjusted_close":selected["adjusted_close"] if selected else None,
              "total_return_index":selected["total_return_index"] if selected else None,
              "lineage_json":canonical(lineage),"row_hash":rh
            })
            if new_state=="READY": ledger_ready+=1
            else: ledger_blocked+=1; blockers[new_reason]+=1

        out.sort(key=lambda r:r["historical_identity_id"])
        data=parquet_bytes(out,LEDGER_SCHEMA)
        st,psha,psz=put_immutable(s3,bucket,v2_ledger_key(d),data,"application/vnd.apache.parquet")
        created+=st=="CREATED"; unchanged+=st=="UNCHANGED"
        fp=sha_json([[r["id"],r["row_hash"],r["state"]] for r in out])
        m={"version":V2_LEDGER_VERSION,"decision_date":d,"row_count":len(out),
           "ready_rows":sum(r["state"]=="READY" for r in out),"blocked_rows":sum(r["state"]=="BLOCKED" for r in out),
           "parquet_sha256":psha,"parquet_bytes":psz,"normalized_fingerprint_sha256":fp,"policy":POLICY}
        md=(json.dumps(m,indent=2,sort_keys=True)+"\n").encode()
        st2,msha,_=put_immutable(s3,bucket,v2_ledger_manifest_key(d),md,"application/json")
        created+=st2=="CREATED"; unchanged+=st2=="UNCHANGED"
        m["manifest_sha256"]=msha; ledger_manifests.append(m); ledger_total+=len(out)

    if ledger_total!=EXPECTED_LEDGER or ledger_ready!=EXPECTED_READY or ledger_blocked!=EXPECTED_BLOCKED:
        raise RuntimeError(f"V2 ledger accounting {ledger_total}/{ledger_ready}/{ledger_blocked}")
    if cf_used!=EXPECTED_CF: raise RuntimeError(f"Carry-forward count {cf_used}")
    if blockers["COMPLEX_CORPORATE_ACTION_BLOCKER"]!=EXPECTED_COMPLEX: raise RuntimeError(f"Complex blockers {blockers}")
    if blockers["NO_TRADE_ON_DECISION_DATE"]!=EXPECTED_NO_TRADE: raise RuntimeError(f"No-trade blockers {blockers}")

    adj_fp=sha_json([[m["trade_date"],m["row_count"],m["normalized_fingerprint_sha256"],m["parquet_sha256"]] for m in manifests])
    ledger_fp=sha_json([[m["decision_date"],m["row_count"],m["normalized_fingerprint_sha256"],m["parquet_sha256"]] for m in ledger_manifests])

    completion={
      "version":N6R5_VERSION,"status":"PASS","environment":"PortfolioAI Dev","policy":POLICY,
      "authorization_basis":"Owner authorized N6R-5 completion on 2026-10-03; strictest N6R-4 candidate applied fail-closed.",
      "frozen_v1":{"adjusted_fingerprint":EXPECTED_V1_ADJ_FP,"decision_ledger_fingerprint":EXPECTED_V1_LEDGER_FP,"completion_fingerprint":EXPECTED_V1_COMPLETE_FP,"overwritten":False},
      "v2_adjusted_series":{"row_count":total,"ready_rows":ready,"blocked_rows":0,"partition_count":len(manifests),
        "min_date":dates[0],"max_date":dates[-1],"return_boundary_rows":boundary_rows,"aggregate_fingerprint_sha256":adj_fp},
      "v2_decision_ledger":{"row_count":ledger_total,"ready_rows":ledger_ready,"blocked_rows":ledger_blocked,
        "carry_forward_recoveries":cf_used,"blocker_counts":dict(sorted(blockers.items())),
        "partition_count":len(ledger_manifests),"aggregate_fingerprint_sha256":ledger_fp},
      "policy_gates":{"carry_forward_threshold_benchmark_days":1,"exact_identity_only":True,"unique_economics_only":True,
        "corporate_action_boundary_crossing":False,"silent_imputation":False,"n6r6_started":False},
      "raw_r2_catalog_mutated":False,"production_changes":0,"main_changes":0
    }
    completion["completion_fingerprint_sha256"]=sha_json(completion)
    cdata=(json.dumps(completion,indent=2,sort_keys=True)+"\n").encode()
    st,csha,_=put_immutable(s3,bucket,V2_COMPLETE,cdata,"application/json")
    created+=st=="CREATED"; unchanged+=st=="UNCHANGED"

    # Catalog update last; preserve frozen raw and V1 entries.
    catalog,_=read_json_obj(s3,bucket,CATALOG_KEY)
    raw_before=sha_json(catalog["datasets"]["b3_raw_prices"])
    v1_adj_before=sha_json(catalog["datasets"]["b3_adjusted_series"])
    v1_led_before=sha_json(catalog["datasets"]["b3_adjusted_decision_ledger"])
    new=json.loads(json.dumps(catalog))
    new["datasets"]["b3_adjusted_series_v2"]={
      "version":V2_SERIES_VERSION,"row_count":total,"ready_rows":ready,"blocked_rows":0,
      "partition_count":len(manifests),"min_date":dates[0],"max_date":dates[-1],
      "aggregate_fingerprint_sha256":adj_fp,"completion_manifest_key":V2_COMPLETE,"completion_manifest_sha256":csha,
      "policy":POLICY
    }
    new["datasets"]["b3_adjusted_decision_ledger_v2"]={
      "version":V2_LEDGER_VERSION,"row_count":ledger_total,"ready_rows":ledger_ready,"blocked_rows":ledger_blocked,
      "partition_count":len(ledger_manifests),"aggregate_fingerprint_sha256":ledger_fp,
      "completion_manifest_key":V2_COMPLETE,"completion_manifest_sha256":csha,"policy":POLICY
    }
    new["n6r5_status"]="COMPLETE"
    new["n6r5_policy"]=POLICY
    if sha_json(new["datasets"]["b3_raw_prices"])!=raw_before: raise RuntimeError("Raw catalog entry drift")
    if sha_json(new["datasets"]["b3_adjusted_series"])!=v1_adj_before: raise RuntimeError("V1 adjusted catalog entry drift")
    if sha_json(new["datasets"]["b3_adjusted_decision_ledger"])!=v1_led_before: raise RuntimeError("V1 ledger catalog entry drift")
    ndata=(json.dumps(new,indent=2,sort_keys=True)+"\n").encode()
    nsha=sha_bytes(ndata)
    s3.put_object(Bucket=bucket,Key=CATALOG_KEY,Body=ndata,ContentType="application/json",Metadata={"sha256":nsha,"n6r5-status":"COMPLETE","n6r5-policy":POLICY})
    if sha_bytes(read_obj(s3,bucket,CATALOG_KEY))!=nsha: raise RuntimeError("Catalog read-back mismatch")

    # Re-verify frozen V1 after all writes.
    v1_after,_=read_json_obj(s3,bucket,V1_COMPLETE)
    if v1_after["adjusted_series"]["aggregate_fingerprint_sha256"]!=EXPECTED_V1_ADJ_FP or v1_after["decision_ledger"]["aggregate_fingerprint_sha256"]!=EXPECTED_V1_LEDGER_FP or v1_after["completion_fingerprint_sha256"]!=EXPECTED_V1_COMPLETE_FP:
        raise RuntimeError("Frozen V1 changed during N6R5")

    result=dict(completion)
    result.update({"created_objects":int(created),"unchanged_objects":int(unchanged),"completion_manifest_sha256":csha,"catalog_sha256":nsha})
    result["audit_fingerprint_sha256"]=sha_json(result)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({"summary":result},indent=2,sort_keys=True)+"\n")
    print(json.dumps(result,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
