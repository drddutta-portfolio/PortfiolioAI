#!/usr/bin/env python3
"""BSE-first, reuse-first R3 scan of incomplete equities in Development.

BseIndiaApi's financial snapshot is a secondary exchange summary. Persist
only exact INR-crore Revenue/PAT when BSE supplies an exact quarter and scrip
link. Mark scope UNKNOWN and do NOT select it as R4 original-filing proof;
BSE's unqualified "EPS" is never silently called diluted EPS.
"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal,InvalidOperation
import argparse,hashlib,importlib.util,json,os,re,sys,time
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import psycopg

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"vendor"/"bseindiaapi"/"src"))
REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
QUARTERS={"2025-09-30","2025-12-31","2026-03-31","2026-06-30"}
SOURCE="CONTROLLED_PUBLIC_WEB"
KIND="RESULTS_QUARTERLY_BSE_COMPACT_REVIEW_V1"
MONTHS={"MAR":"03","JUN":"06","SEP":"09","DEC":"12"}
CORE={"Revenue":"OPERATING_REVENUE_QUARTER","Net Profit":"NET_PROFIT_QUARTER"}

def period_end(s):
    m=re.fullmatch(r"(MAR|JUN|SEP|DEC)-(\d{2})",str(s).strip().upper())
    if not m:return None
    mon=MONTHS[m[1]];year=2000+int(m[2])
    val=f"{year:04}-{mon}-"+("30" if mon in ("06","09") else "31")
    return val if val in QUARTERS else None

def numeric(x):
    if not isinstance(x,str):return None
    s=x.strip().replace(",","")
    if not re.fullmatch(r"\(?-?\d+(?:\.\d+)?\)?",s):return None
    if s.startswith("("):s="-"+s[1:-1]
    try:return format(Decimal(s),"f")
    except InvalidOperation:return None

def links_for(data,scrip):
    if not isinstance(data,list):return {}
    out={}
    for item in data:
        if not isinstance(item,dict):continue
        for label,urlkey in (("LQ","LLQ"),("SQ","LSQ")):
            period=period_end(item.get(label))
            url=item.get(urlkey)
            if not period or not isinstance(url,str):continue
            u=urlparse(url);q=parse_qs(u.query)
            if (u.scheme=="https" and u.hostname=="www.bseindia.com"
                and u.path.lower()=="/corporates/results.aspx"
                and q.get("Code",[""])[0]==scrip):
                out[period]=url
    return out

def compact(snapshot,scrip):
    if not isinstance(snapshot,dict):return []
    result=snapshot.get("results_in_crores")
    if not isinstance(result,dict):return []
    fields,data=result.get("fields"),result.get("data")
    if not isinstance(fields,list) or not isinstance(data,list):return []
    links=links_for(snapshot.get("period_links"),scrip)
    vals={}
    for row in data:
        if not isinstance(row,list) or not row:continue
        metric=CORE.get(str(row[0]).strip())
        if not metric:continue
        for idx,label in enumerate(fields[1:],1):
            period=period_end(label)
            if period not in links or idx>=len(row):continue
            value=numeric(row[idx])
            if value is not None:vals.setdefault((period,metric),set()).add(value)
    return [dict(period_end=p,metric_code=m,value=next(iter(v)),source_url=links[p])
            for (p,m),v in sorted(vals.items()) if len(v)==1]

def gaps(db):
    p=ROOT/"scripts"/"results"/"r3-current-coverage-readback.py"
    spec=importlib.util.spec_from_file_location("r3_readback",p)
    if spec is None or spec.loader is None:raise RuntimeError("MISSING_READBACK")
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    return {x["symbol"]:set(x["missing_period_ends"])
            for x in mod.readback(db)["incomplete"]}

def store(db,sid,symbol,isin,scrip,fact):
    manifest={"contract":KIND,"symbol":symbol,"isin":isin,"scrip":scrip,
              "period_end":fact["period_end"],"metric":fact["metric_code"],
              "value":fact["value"],"unit":"INR_CRORE","scope":"UNKNOWN",
              "original_verified":False,"publication_verified":False,
              "summary_only":True,"source_url":fact["source_url"]}
    js=json.dumps(manifest,separators=(",",":"),sort_keys=True)
    digest=hashlib.sha256(js.encode()).hexdigest()
    external=f"{scrip}:{fact['period_end']}:{fact['metric_code']}"
    with db.cursor() as cur:
        cur.execute("""INSERT INTO public.data_source_records
            (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
            VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
            ON CONFLICT (source_code,record_kind,external_record_id,payload_hash) DO NOTHING
            RETURNING id""",(SOURCE,KIND,external,fact["source_url"],digest,js,
                json.dumps({"retention":"COMPACT_DERIVED_FACTS_ONLY","original_bytes_saved":False})))
        row=cur.fetchone()
        if row:source_id=row[0]
        else:
            cur.execute("""SELECT id FROM public.data_source_records WHERE
                source_code=%s AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
                (SOURCE,KIND,external,digest))
            source_id=cur.fetchone()[0]
        cur.execute("""INSERT INTO public.fundamental_observations
            (security_id,metric_code,source_record_id,source_code,numeric_value,
             unit,currency,period_type,period_end,consolidation_scope,evidence_status,retrieved_at,fresh_until)
            VALUES (%s,%s,%s,%s,%s,'INR_CRORE','INR','QUARTER',%s,'UNKNOWN','AVAILABLE',now(),now() + interval '1 day')
            ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id)
            DO NOTHING RETURNING id""",
            (sid,fact["metric_code"],source_id,SOURCE,fact["value"],fact["period_end"]))
        inserted=cur.fetchone() is not None
    db.commit()
    return inserted

def run():
    parser=argparse.ArgumentParser()
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--max-stocks",type=int,default=40)
    args=parser.parse_args()
    dburl=os.getenv("SUPABASE_DB_URL","")
    if REF not in dburl or not 1<=args.max_stocks<=262:
        raise RuntimeError("DEVELOPMENT_SCOPE_OR_BUDGET_UNVERIFIED")
    from bse import BSE
    missing=gaps(dburl)
    report={"source":"BSEINDIAAPI","mode":"REVIEW_ONLY" if args.apply else "DRY_RUN",
            "missing_equities":len(missing),"examined":0,"companies_with_facts":0,
            "new_review_facts":0,"outcomes":[]}
    with psycopg.connect(dburl,autocommit=False) as db:
        with db.cursor() as cur:
            cur.execute("""SELECT DISTINCT s.id::text,s.symbol,s.isin FROM public.transactions t
                JOIN public.securities s ON s.id=t.security_id
                WHERE t.portfolio_id=%s AND t.superseded_at IS NULL AND s.asset_class='EQUITY'
                  AND s.isin IS NOT NULL ORDER BY s.symbol""",(PORTFOLIO_ID,))
            targets=[row for row in cur.fetchall() if row[1] in missing][:args.max_stocks]
        db.rollback()
        (ROOT/"tmp").mkdir(exist_ok=True)
        with BSE(download_folder=ROOT/"tmp") as bse:
            for sid,symbol,isin in targets:
                outcome={"symbol":symbol,"status":"UNAVAILABLE","facts":0}
                try:
                    scrip=str(bse.getScripCode(symbol))
                    meta=bse.equityMetaInfo(scrip)
                    if (not isinstance(meta,dict) or meta.get("ISIN")!=isin
                        or str(meta.get("SecurityCode"))!=scrip):
                        outcome["status"]="BSE_SECURITY_IDENTITY_MISMATCH"
                    else:
                        facts=[x for x in compact(bse.resultsSnapshot(scrip),scrip)
                               if x["period_end"] in missing[symbol]]
                        outcome["facts"]=len(facts)
                        outcome["status"]="REVIEW_ONLY" if facts else "NO_QUALIFIED_QUARTER_LINK"
                        if facts:report["companies_with_facts"]+=1
                        for fact in facts:
                            if args.apply:
                                with db.cursor() as cur:
                                    cur.execute("""SELECT 1 FROM public.fundamental_observations
                                        WHERE security_id=%s AND period_end=%s AND period_type='QUARTER'
                                          AND metric_code=%s LIMIT 1""",
                                          (sid,fact["period_end"],fact["metric_code"]))
                                    exists=cur.fetchone() is not None
                                if not exists:
                                    report["new_review_facts"]+=int(store(db,sid,symbol,isin,scrip,fact))
                except (ValueError,TimeoutError,ConnectionError) as e:
                    db.rollback()
                    outcome["status"]="PROVIDER_UNAVAILABLE_"+type(e).__name__
                except Exception as e:
                    db.rollback()
                    outcome["status"]="SOURCE_UNQUALIFIED_"+type(e).__name__
                report["examined"]+=1
                report["outcomes"].append(outcome)
                time.sleep(0.25)
    print(json.dumps(report,indent=2,sort_keys=True))
    return 0

if __name__=="__main__":raise SystemExit(run())
