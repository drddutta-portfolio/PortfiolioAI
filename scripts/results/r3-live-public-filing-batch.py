#!/usr/bin/env python3
"""R3 Development-only original quarterly financial filing acquisition.

Public NSE listing discovery is best-effort, never bypasses access controls;
preserve only issuer-authored compact extracted facts in R2/Dev Supabase.
No stock is counted covered merely because it was visited.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from datetime import date, datetime, timezone, timedelta
import hashlib
import json
import os
import re
import sys
import time
from urllib.parse import urlencode, urlparse

import boto3
from bs4 import BeautifulSoup
import psycopg
import requests

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
BUCKET = "portfolioai-history-dev"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
R2_PREFIX = "portfolioai-results/development/v1/quarterly/"
SOURCE_CODE = "COMPANY_EXCHANGE_FILING"
KIND = "RESULTS_QUARTERLY_NSE_DISCOVERY_V1"
FIELDS = {
    "revenue from operations": "OPERATING_REVENUE_QUARTER",
    "total profit (loss) for period": "NET_PROFIT_QUARTER",
    "diluted earnings (loss) per share from continuing and discontinued operations": "EPS_DILUTED",
}
NUM = re.compile(r"^\(?-?[\d,]+(?:\.\d+)?\)?$")
DATE = re.compile(r"^\d\d[-/.]\d\d[-/.]20\d\d$")
CORS = {"User-Agent":"PortfolioAI/1.0 quarterly research; publicly linked issuer statements"}
ALLOWED_FILE = re.compile(r"^/corporate/ixbrl/INTEGRATED_FILING_INDAS_[A-Za-z0-9_]+\.html$",re.I)

def sha(raw: bytes) -> str: return hashlib.sha256(raw).hexdigest()

def required(name: str) -> str:
    value=os.getenv(name, "")
    if not value: raise RuntimeError("REQUIRED_CONFIGURATION_MISSING:"+name)
    return value

def normalize(text: str) -> str:
    return re.sub(r"\s+"," ",text).strip().lower()

def number(text: str) -> Decimal | None:
    text=text.strip().replace(",","")
    if not NUM.fullmatch(text): return None
    if text.startswith("("): text="-"+text[1:-1]
    try: return Decimal(text)
    except InvalidOperation: return None

def html_rows(soup: BeautifulSoup):
    for table in soup.select("table"):
        rows=[]
        for tr in table.select("tr"):
            cells=[re.sub(r"\s+"," ",c.get_text(" ",strip=True)).strip() for c in tr.find_all(["th","td"],recursive=False)]
            if cells: rows.append(cells)
        if rows: yield rows

def field_values(rows, field: str) -> list[str]:
    result=[]
    for cells in rows:
        for i,c in enumerate(cells[:-1]):
            if normalize(c)==field:
                result += [v for v in cells[i+1:] if v.strip()]
    return result

def date_of(text: str) -> str | None:
    t=text.strip()
    if not DATE.fullmatch(t): return None
    try: return datetime.strptime(t.replace("/","-").replace(".","-"),"%d-%m-%Y").date().isoformat()
    except ValueError: return None

def unique_field(tables, label: str) -> str | None:
    vals=[]
    for rows in tables: vals+=field_values(rows,label)
    good=list({v.strip() for v in vals if v.strip()})
    return good[0] if len(good)==1 else None

def extract(html: str, symbol: str, isin: str):
    soup=BeautifulSoup(html,"html.parser")
    tables=list(html_rows(soup))
    doc_symbol=unique_field(tables,"nse symbol")
    doc_isin=unique_field(tables,"isin")
    if doc_symbol!=symbol or doc_isin!=isin: return None,"IDENTITY_MISMATCH_OR_UNKNOWN"
    unit=unique_field(tables,"level of rounding used in financial results")
    if not unit or normalize(unit)!="lakhs": return None,"UNSUPPORTED_OR_UNKNOWN_UNIT"
    start=unique_field(tables,"date of start of reporting period")
    end=unique_field(tables,"date of end of reporting period")
    qstart,qend=date_of(start or ""),date_of(end or "")
    if not qstart or not qend or qend<"2025-03-31" or qend>date.today().isoformat():
        return None,"PERIOD_NOT_PROVEN"
    if (date.fromisoformat(qend)-date.fromisoformat(qstart)).days not in range(75,100):
        return None,"PERIOD_NOT_THREE_MONTHS"
    scope=unique_field(tables,"nature of report standalone or consolidated")
    scope=scope.upper() if scope else None
    if scope not in ("CONSOLIDATED","STANDALONE"):return None,"SCOPE_UNKNOWN"
    report=unique_field(tables,"reporting type")
    if report and normalize(report)!="quarterly":return None,"NOT_QUARTERLY"
    # Match one genuine Ind-AS financial statement, never the segment reporting
    # table; ambiguous and duplicated labels are not silently selected.
    statements=[]
    for table in tables:
        names={normalize(c) for row in table for c in row}
        if "revenue from operations" in names and "total profit (loss) for period" in names:
            statements.append(table)
    if len(statements)!=1: return None,"STATEMENT_TABLE_NOT_UNIQUE"
    stmt=statements[0]
    facts={}
    for label,metric in FIELDS.items():
        values=field_values(stmt,label)
        if len(values)!=1: continue
        n=number(values[0])
        if n is None: continue
        if metric=="EPS_DILUTED":
            if abs(n)>Decimal("100000"):continue
            facts[metric]={"value":str(n),"unit":"INR_PER_SHARE","original_value":str(n),"original_unit":"INR_PER_SHARE"}
        else:
            n/=Decimal(100) # source is INR lakh; canonical is INR crore
            if abs(n)>Decimal("100000000"):continue
            facts[metric]={"value":str(n),"unit":"INR_CRORE","original_value":values[0],"original_unit":"INR_LAKH"}
    if not facts:return None,"NO_QUALIFIED_FINANCIAL_VALUES"
    return {"symbol":symbol,"isin":isin,"period_start":qstart,"period_end":qend,"scope":scope,"facts":facts},None

def listing_urls(payload, symbol):
    """Trust only explicitly linked NSE integrated INDAS iXBRL source URLs."""
    records=payload if isinstance(payload,list) else (
        payload.get("data",payload.get("records",[])) if isinstance(payload,dict) else []
    )
    if isinstance(records,dict):records=records.get("data",[])
    if not isinstance(records,list):return []
    urls=[]
    for item in records:
        if not isinstance(item,dict):continue
        if item.get("symbol",item.get("Symbol")) not in (symbol,None):continue
        for attr in ("originalUrl","xbrlFile","xbrl","xbrlUrl","xmlFile","link","url"):
            url=item.get(attr)
            if not isinstance(url,str) or not url.startswith("https://"):continue
            parsed=urlparse(url)
            if parsed.hostname=="nsearchives.nseindia.com" and ALLOWED_FILE.fullmatch(parsed.path):
                urls.append(url)
    return list(dict.fromkeys(urls))

def fetch_json(session, symbol):
    params={"index":"equities","symbol":symbol,"from_date":"01-01-2025",
            "to_date":date.today().strftime("%d-%m-%Y")}
    url="https://www.nseindia.com/api/integrated-filing-results?"+urlencode(params)
    r=session.get(url,timeout=22,headers={"Accept":"application/json","Referer":"https://www.nseindia.com/companies-listing/corporate-integrated-filing"})
    if r.status_code in (401,403,429):raise RuntimeError("LISTING_ACCESS_DENIED_"+str(r.status_code))
    r.raise_for_status()
    if "json" not in r.headers.get("content-type","").lower():raise RuntimeError("LISTING_NOT_JSON")
    return r.json()

def r2_client():
    acc=required("CLOUDFLARE_R2_ACCOUNT_ID")
    return boto3.client("s3",endpoint_url=f"https://{acc}.r2.cloudflarestorage.com",
        aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
        region_name="auto")

def put_immutable(s3, content:bytes, key:str):
    try:
        old=s3.get_object(Bucket=BUCKET,Key=key)
        oldbody=old["Body"].read()
        if sha(oldbody)!=sha(content):raise RuntimeError("IMMUTABLE_R2_CONFLICT")
        return False
    except s3.exceptions.NoSuchKey: pass
    except Exception as exc:
        if "NoSuchKey" not in str(exc) and "404" not in str(exc):raise
    s3.put_object(Bucket=BUCKET,Key=key,Body=content,ContentType="application/json",IfNoneMatch="*")
    read=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    if sha(read)!=sha(content):raise RuntimeError("R2_HASH_READBACK_FAILED")
    return True

def persist(conn,s3,parsed,url,original_sha):
    manifest={
        "contract":"PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1",
        "symbol":parsed["symbol"],"isin":parsed["isin"],
        "period_start":parsed["period_start"],"period_end":parsed["period_end"],
        "consolidation_scope":parsed["scope"],
        "issuer_filing_url":url,"original_sha256_unretained":original_sha,
        "raw_nse_bytes_retained":False,"publication_timestamp":None,
        "figures_review_pending":True,"facts":parsed["facts"]
    }
    payload=json.dumps(manifest,sort_keys=True,separators=(",",":")).encode()
    ph=sha(payload)
    key=(R2_PREFIX+f"security_id={parsed['isin']}/period_end={parsed['period_end']}/"
         +f"source_version={ph}/manifest.json")
    put_immutable(s3,payload,key) # R2 first; no dangling DB ref
    record={**manifest,"r2_key":key,"r2_manifest_sha256":ph}
    raw=json.dumps(record,sort_keys=True,separators=(",",":"))
    h=sha(raw.encode())
    with conn.cursor() as cur:
        cur.execute("""SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'""",
                    (parsed["symbol"],parsed["isin"]))
        security=cur.fetchone()
        if not security:raise RuntimeError("CANONICAL_SECURITY_NOT_FOUND")
        cur.execute("""
          INSERT INTO public.data_source_records
             (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
          VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
          ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
            DO UPDATE SET external_record_id=EXCLUDED.external_record_id
          RETURNING id
        """,(SOURCE_CODE,KIND,parsed["symbol"]+":"+original_sha,url,h,raw,
              '{"retention":"COMPACT_FACTS_ONLY","original_nse_bytes_retained":false,"results_review":"PENDING"}'))
        rec=cur.fetchone()[0]
        saved=0
        for metric,fact in parsed["facts"].items():
            cur.execute("""
               INSERT INTO public.fundamental_observations
                (security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
                 period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
               VALUES (%s,%s,%s,%s,%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
               ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id)
               DO NOTHING
               RETURNING id
            """,(security[0],metric,rec,SOURCE_CODE,Decimal(fact["value"]),fact["unit"],
                 parsed["period_start"],parsed["period_end"],parsed["scope"]))
            if cur.fetchone():saved+=1
    conn.commit()
    return saved

def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db:raise RuntimeError("NON_DEVELOPMENT_DATABASE_FORBIDDEN")
    if required("CLOUDFLARE_R2_BUCKET")!=BUCKET:raise RuntimeError("NON_DEVELOPMENT_R2_FORBIDDEN")
    maxstocks=int(os.getenv("RESULTS_MAX_STOCKS","12"))
    if maxstocks<1 or maxstocks>262:raise RuntimeError("INVALID_STOCK_BUDGET")
    s3=r2_client()
    with psycopg.connect(db,autocommit=False) as conn:
        with conn.cursor() as cur:
            cur.execute("""SELECT DISTINCT s.symbol,s.isin
                FROM public.transactions t JOIN public.securities s ON t.security_id=s.id
                WHERE t.portfolio_id=%s AND s.asset_class='EQUITY' AND s.isin IS NOT NULL
                ORDER BY s.symbol LIMIT %s""",(PORTFOLIO_ID,maxstocks))
            stocks=cur.fetchall()
        conn.rollback() # read-only selection must not hold open transaction
        session=requests.Session()
        session.headers.update({"User-Agent":"Mozilla/5.0 (compatible; PortfolioAIResearch/1.0)","Accept-Language":"en-IN,en;q=0.8"})
        try:
            seed=session.get("https://www.nseindia.com/companies-listing/corporate-integrated-filing",timeout=20)
            if seed.status_code in (401,403,429):raise RuntimeError("PUBLIC_SOURCE_ACCESS_DENIED_"+str(seed.status_code))
        except requests.RequestException as exc:
            raise RuntimeError("SOURCE_BOOTSTRAP_FAILED") from exc
        log={"universe_target":len(stocks),"access_ok":True,"visited":0,"with_documents":0,"documents_parsed":0,
             "observations_inserted":0,"blocked":[],"stock_outcomes":[]}
        for symbol,isin in stocks:
            entry={"symbol":symbol,"qualified":0,"observations":0,"reason":None}
            try:
                listing=fetch_json(session,symbol)
                urls=listing_urls(listing,symbol)
                if not urls:
                    entry["reason"]="NO_QUALIFIED_LISTING_URL"
                else:
                    log["with_documents"]+=1
                    for url in urls[:8]:
                        time.sleep(1.2)
                        res=session.get(url,timeout=22,headers={"Accept":"text/html"})
                        if res.status_code in (401,403,429):raise RuntimeError("FILING_ACCESS_DENIED_"+str(res.status_code))
                        res.raise_for_status()
                        if len(res.content)>2_000_000:raise RuntimeError("FILING_TOO_LARGE")
                        data,reason=extract(res.text,symbol,isin)
                        if not data:
                            entry["reason"]=reason
                            continue
                        entry["qualified"]+=1
                        log["documents_parsed"]+=1
                        entry["observations"]+=persist(conn,s3,data,url,sha(res.content))
                    if not entry["qualified"] and not entry["reason"]:
                        entry["reason"]="NO_PARSEABLE_DOCUMENTS"
            except Exception as exc:
                conn.rollback()
                entry["reason"]=str(exc)[:100]
                if "ACCESS_DENIED" in entry["reason"]:
                    log["blocked"].append(entry["reason"])
                    log["stock_outcomes"].append(entry)
                    break  # do not evade anti-bot or 429 blocks
            log["visited"]+=1
            log["observations_inserted"]+=entry["observations"]
            log["stock_outcomes"].append(entry)
            time.sleep(1.2)
    print(json.dumps(log,indent=2,sort_keys=True))
    if log["blocked"]:return 2
    return 0

if __name__=="__main__":
    try: sys.exit(main())
    except Exception as e:
        print(json.dumps({"status":"BLOCKED","error":str(e)[:150]}),file=sys.stderr)
        sys.exit(3)
