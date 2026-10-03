#!/usr/bin/env python3
import bisect, csv, hashlib, io, json, os, re, tempfile
from collections import defaultdict
from decimal import Decimal, Context, ROUND_HALF_EVEN, localcontext
from pathlib import Path

import boto3, duckdb, psycopg
from botocore.config import Config
from psycopg.rows import dict_row

PROJECT_REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID="P8_EXP_NSE_MONTHLY_6M_V1"
RAW_CAMPAIGN_ID="P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
ROOT="portfolioai-history/development/p8"
CTX=Context(prec=50,rounding=ROUND_HALF_EVEN)
VERSION="P8_B3_N6R2_DIVIDEND_RECOVERY_V1"
OUT_JSON=Path("docs/p8/PortfolioAI_P8_B3_N6R2_DIVIDEND_RECOVERY_2026-10-03.json")
OUT_CSV=Path("docs/p8/PortfolioAI_P8_B3_N6R2_DIVIDEND_RECOVERY_MATRIX_2026-10-03.csv")

def required(name):
    v=os.environ.get(name,"").strip()
    if not v: raise RuntimeError(f"Missing {name}")
    return v

def norm_account(raw):
    raw=raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else: host=raw
    suf=".r2.cloudflarestorage.com"
    return host[:-len(suf)] if host.endswith(suf) else host

def s3_client():
    account=norm_account(required("CLOUDFLARE_R2_ACCOUNT_ID"))
    return boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(retries={"max_attempts":10,"mode":"adaptive"},connect_timeout=30,read_timeout=180,s3={"addressing_style":"path"}))

def canonical(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False)
def sha(v): return hashlib.sha256(canonical(v).encode()).hexdigest()

def sig30(v):
    with localcontext(CTX):
        d=Decimal(str(v))
        if d==0:return "0"
        q=Decimal(1).scaleb(d.adjusted()-29)
        return format(d.quantize(q,rounding=ROUND_HALF_EVEN).normalize(),"f")

def raw_key(date):
    return f"{ROOT}/b3/raw-prices/v1/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet"

def load_identity_rows(s3,bucket,date):
    raw=s3.get_object(Bucket=bucket,Key=raw_key(date))["Body"].read()
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/"x.parquet";p.write_bytes(raw)
        con=duckdb.connect()
        try:
            rows=con.execute("""
              select id::varchar,historical_identity_id::varchar,trading_symbol,series,
                     close::varchar,row_hash
              from read_parquet(?)
              where historical_identity_id is not null
            """,[str(p)]).fetchall()
        finally: con.close()
    grouped=defaultdict(list)
    for rid,i,sym,series,close,row_hash in rows:
        grouped[str(i)].append({
          "raw_price_observation_id":str(rid),
          "trading_symbol":str(sym or "").strip().upper(),
          "series":str(series or "").strip().upper(),
          "close":str(close),
          "row_hash":str(row_hash)
        })
    out={}
    for i,cands in grouped.items():
        economics={(c["close"]) for c in cands}
        if len(economics)==1:
            cands=sorted(cands,key=lambda x:x["raw_price_observation_id"])
            out[i]={
              "state":"UNIQUE_ECONOMICS",
              "chosen":cands[0],
              "candidate_count":len(cands),
              "all_ids":[c["raw_price_observation_id"] for c in cands],
              "symbols":sorted(set(c["trading_symbol"] for c in cands)),
              "series":sorted(set(c["series"] for c in cands))
            }
        else:
            out[i]={
              "state":"CONFLICTING_ECONOMICS",
              "candidate_count":len(cands),
              "closes":sorted(economics),
              "symbols":sorted(set(c["trading_symbol"] for c in cands)),
              "series":sorted(set(c["series"] for c in cands))
            }
    return out

def parse_cash(purpose):
    p=re.sub(r"\s+"," ",purpose or "").strip()
    # Reject multi-component declarations: do not sum or infer without a frozen rule.
    if "/" in p and len(re.findall(r"(?:Rs\.?|Re)\s*[- ]*\d",p,re.I))>1:
        return None,"MULTI_COMPONENT_DIVIDEND_REQUIRES_SEPARATE_POLICY"
    patterns=[
      r"(?:Rs\.?|Re)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:/-)?\s*Per\s+Sh(?:are)?\b",
      r"([0-9]+(?:\.[0-9]+)?)\s*Rs\.?\s*Per\s+Sh(?:are)?\b",
    ]
    values=[]
    for pat in patterns:
        for m in re.finditer(pat,p,re.I):
            values.append(m.group(1))
    values=sorted(set(values))
    if len(values)==1:
        return values[0],None
    if len(values)==0:
        return None,"DIVIDEND_CASH_AMOUNT_NOT_UNIQUELY_PARSEABLE"
    return None,"MULTIPLE_DISTINCT_CASH_AMOUNTS"

def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db: raise RuntimeError("Refusing non-Development DB")
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev": raise RuntimeError("Refusing non-Development bucket")
    s3=s3_client()

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
          select
            n.id::text normalization_id,
            n.historical_identity_id::text identity_id,
            n.effective_date::text effective_date,
            n.normalization_state,
            n.blocker_reason normalization_blocker_reason,
            n.normalized_terms,
            o.raw_purpose,
            o.raw_symbol,
            o.raw_series,
            f.id::text factor_id,
            f.factor_state,
            f.blocker_reason factor_blocker_reason,
            f.calculation_inputs
          from public.p8_b3_corporate_action_normalizations n
          join public.p8_b3_corporate_action_observations o
            on o.id=n.corporate_action_observation_id
          left join public.p8_b3_adjustment_factors f
            on f.corporate_action_normalization_id=n.id
           and f.portfolio_id=n.portfolio_id
           and f.experiment_id=n.experiment_id
           and f.adjustment_version='P8_B3_ADJUSTMENT_V2'
          where n.portfolio_id=%s
            and n.experiment_id=%s
            and n.normalization_version='P8_B3_NORMALIZATION_V1'
            and n.action_type='CASH_DIVIDEND'
            and (
              n.normalization_state='BLOCKED'
              or f.factor_state='BLOCKED'
            )
          order by n.effective_date,n.id
        """,(PORTFOLIO_ID,EXPERIMENT_ID))
        blocked=cur.fetchall()

    # One row may have both blocked normalization and no factor; total blocker rows are 382 events
    # but the recovery unit is normalization/event.
    unique={}
    for r in blocked: unique[r["normalization_id"]]=r
    rows=list(unique.values())

    cache={}
    def date_rows(date):
        if date not in cache: cache[date]=load_identity_rows(s3,bucket,date)
        return cache[date]

    results=[]
    for r in rows:
        effective=r["effective_date"]
        identity=r["identity_id"]
        idx=bisect.bisect_left(dates,effective) if effective else -1
        if idx<0 or idx>=len(dates) or dates[idx]!=effective or idx==0:
            results.append({
              "normalization_id":r["normalization_id"],"historical_identity_id":identity,
              "effective_date":effective,"raw_purpose":r["raw_purpose"],
              "old_normalization_state":r["normalization_state"],
              "old_factor_state":r["factor_state"],
              "recovery_state":"BLOCKED",
              "recovery_reason":"EFFECTIVE_DATE_NOT_PROVEN_TRADING_DATE",
              "cash_distribution_per_share":None,"previous_trade_date":None,
              "previous_close":None,"ex_date_close":None,"total_return_link_factor":None
            }); continue

        if r["normalization_state"]=="READY":
            cash=str(r["normalized_terms"]["cashDistributionPerShare"])
            parse_reason=None
        else:
            cash,parse_reason=parse_cash(r["raw_purpose"])
            if cash is None:
                results.append({
                  "normalization_id":r["normalization_id"],"historical_identity_id":identity,
                  "effective_date":effective,"raw_purpose":r["raw_purpose"],
                  "old_normalization_state":r["normalization_state"],
                  "old_factor_state":r["factor_state"],
                  "recovery_state":"BLOCKED","recovery_reason":parse_reason,
                  "cash_distribution_per_share":None,"previous_trade_date":dates[idx-1],
                  "previous_close":None,"ex_date_close":None,"total_return_link_factor":None
                }); continue

        prev_date=dates[idx-1]
        prev=date_rows(prev_date).get(identity)
        ex=date_rows(effective).get(identity)
        if prev is None and ex is None: reason="IDENTITY_ABSENT_PREVIOUS_AND_EX_DATE"
        elif prev is None: reason="IDENTITY_ABSENT_PREVIOUS_DATE"
        elif ex is None: reason="IDENTITY_ABSENT_EX_DATE"
        elif prev["state"]!="UNIQUE_ECONOMICS": reason="PREVIOUS_DATE_CONFLICTING_ECONOMICS"
        elif ex["state"]!="UNIQUE_ECONOMICS": reason="EX_DATE_CONFLICTING_ECONOMICS"
        else: reason=None

        if reason:
            results.append({
              "normalization_id":r["normalization_id"],"historical_identity_id":identity,
              "effective_date":effective,"raw_purpose":r["raw_purpose"],
              "old_normalization_state":r["normalization_state"],
              "old_factor_state":r["factor_state"],
              "recovery_state":"BLOCKED","recovery_reason":reason,
              "cash_distribution_per_share":cash,"previous_trade_date":prev_date,
              "previous_close":None,"ex_date_close":None,"total_return_link_factor":None
            }); continue

        prev_close=Decimal(prev["chosen"]["close"])
        ex_close=Decimal(ex["chosen"]["close"])
        cash_d=Decimal(cash)
        if prev_close<=0 or ex_close<0 or cash_d<0:
            state="BLOCKED"; reason="INVALID_NUMERIC_INPUT"
            total=None
        else:
            state="RECOVERED"; reason=None
            with localcontext(CTX):
                total=sig30((ex_close+cash_d)/prev_close)

        results.append({
          "normalization_id":r["normalization_id"],"historical_identity_id":identity,
          "effective_date":effective,"raw_purpose":r["raw_purpose"],
          "old_normalization_state":r["normalization_state"],
          "old_factor_state":r["factor_state"],
          "recovery_state":state,"recovery_reason":reason,
          "cash_distribution_per_share":cash,"previous_trade_date":prev_date,
          "previous_close":str(prev_close),"ex_date_close":str(ex_close),
          "total_return_link_factor":total,
          "previous_raw_price_observation_id":prev["chosen"]["raw_price_observation_id"],
          "ex_raw_price_observation_id":ex["chosen"]["raw_price_observation_id"],
          "previous_raw_row_hash":prev["chosen"]["row_hash"],
          "ex_raw_row_hash":ex["chosen"]["row_hash"],
          "previous_symbols":";".join(prev["symbols"]),
          "ex_symbols":";".join(ex["symbols"]),
          "previous_series":";".join(prev["series"]),
          "ex_series":";".join(ex["series"]),
          "evidence_hash":sha({
            "identity":identity,"effective_date":effective,"cash":cash,
            "previous_date":prev_date,"previous_row":prev["chosen"],
            "ex_row":ex["chosen"],"total_return_link_factor":total
          })
        })

    counts=defaultdict(int)
    recovered_norm=0
    recovered_factor=0
    recovered_identities=set()
    for r in results:
        counts[r["recovery_state"] if r["recovery_state"]=="RECOVERED" else r["recovery_reason"]]+=1
        if r["recovery_state"]=="RECOVERED":
            recovered_identities.add(r["historical_identity_id"])
            if r["old_normalization_state"]=="BLOCKED": recovered_norm+=1
            if r["old_factor_state"]=="BLOCKED" or r["old_factor_state"] is None: recovered_factor+=1

    summary={
      "version":VERSION,"status":"PASS","environment":"PortfolioAI Dev",
      "dividend_recovery_units":len(results),
      "recovered_events":sum(r["recovery_state"]=="RECOVERED" for r in results),
      "still_blocked_events":sum(r["recovery_state"]!="RECOVERED" for r in results),
      "recovered_identities":len(recovered_identities),
      "recovered_normalization_events":recovered_norm,
      "recovered_factor_events":recovered_factor,
      "outcome_counts":dict(sorted(counts.items())),
      "method":"Exact historical_identity_id only; unique economics per date; no symbol inference; no price-drop inference; no non-trading-date remap.",
      "n6_v1_overwritten":False,"n6r3_started":False,"production_changes":0,"main_changes":0
    }
    payload={"summary":summary,"events":results}
    OUT_JSON.parent.mkdir(parents=True,exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload,indent=2,sort_keys=True)+"\n")
    headers=sorted({k for r in results for k in r.keys()})
    with OUT_CSV.open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=headers);w.writeheader();w.writerows(results)
    print(json.dumps(summary,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
