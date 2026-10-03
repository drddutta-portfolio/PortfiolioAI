#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
import requests

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/152 Safari/537.36"
TIMEOUT = 30

def shape(payload):
    if isinstance(payload, list):
        first = payload[0] if payload else {}
        out={"kind":"list","count":len(payload),"first_keys":sorted(first.keys()) if isinstance(first,dict) else []}
        if payload and isinstance(first,dict):
            dates=[str(r.get("an_dt") or r.get("News_submission_dt") or r.get("DissemDT") or "") for r in payload if isinstance(r,dict)]
            dates=[d for d in dates if d]
            isins=[str(r.get("sm_isin") or "") for r in payload if isinstance(r,dict)]
            desc=[str(r.get("desc") or r.get("NEWSSUB") or "").upper() for r in payload if isinstance(r,dict)]
            out["sample_dates"]=dates[:3]
            out["date_min"]=min(dates) if dates else None
            out["date_max"]=max(dates) if dates else None
            out["rows_with_isin"]=sum(bool(x.strip()) for x in isins)
            out["financial_like_rows"]=sum(("FINANCIAL" in x or "RESULT" in x or "ANNUAL REPORT" in x or "INTEGRATED FILING" in x) for x in desc)
        return out
    if isinstance(payload, dict):
        out = {"kind": "dict", "keys": sorted(payload.keys())}
        for key in ("data","Table","table","results"):
            if isinstance(payload.get(key), list):
                rows=payload[key]
                out.update({"row_key": key, "count": len(rows), "first_keys": sorted(rows[0].keys()) if rows and isinstance(rows[0],dict) else []})
                break
        return out
    return {"kind": type(payload).__name__}

def fetch_json(session, url, params=None, headers=None):
    response=session.get(url,params=params,headers=headers,timeout=TIMEOUT)
    ct=response.headers.get("content-type","")
    result={"url":response.url,"status":response.status_code,"content_type":ct}
    try:
        payload=response.json()
        result["json"]=True
        result["shape"]=shape(payload)
    except Exception:
        result["json"]=False
        result["body_prefix"]=response.text[:200]
    return result

audit={
    "version":"P8_B_RECOVERY_EXCHANGE_METADATA_CANARY_V1",
    "generated_at":datetime.now(timezone.utc).isoformat(),
    "scope":{
        "metadata_only":True,
        "attachment_downloads":0,
        "xbrl_downloads":0,
        "pdf_downloads":0,
        "csv_body_downloads":0,
        "provider_calls":0,
        "supabase_writes":0,
        "r2_writes":0,
    },
    "nse":{},
    "bse":{},
}

nse=requests.Session()
nse.headers.update({"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Accept-Language":"en-US,en;q=0.9"})
landing="https://www.nseindia.com/companies-listing/corporate-filings-application?id=eqFinResults"
home=nse.get(landing,timeout=TIMEOUT)
audit["nse"]["landing_status"]=home.status_code
candidates=[
    ("financial_results","https://www.nseindia.com/api/corporate-financial-results",{
        "index":"equities","from_date":"01-01-2025","to_date":"31-01-2025"
    }),
    ("announcements","https://www.nseindia.com/api/corporate-announcements",{
        "index":"equities","from_date":"01-01-2025","to_date":"02-01-2025"
    }),
]
for name,url,params in candidates:
    try:
        audit["nse"][name]=fetch_json(nse,url,params=params,headers={"Referer":landing})
    except Exception as exc:
        audit["nse"][name]={"error":type(exc).__name__+":"+str(exc)[:300]}

try:
    web=requests.get("https://www.bseindia.com/corporates/ann.html",headers={"User-Agent":UA},timeout=TIMEOUT)
    audit["bse"]["desktop_page_status"]=web.status_code
except Exception as exc:
    audit["bse"]["desktop_page_error"]=type(exc).__name__+":"+str(exc)[:200]
try:
    mobile=requests.get("https://m.bseindia.com/corporates.aspx",headers={"User-Agent":UA},timeout=TIMEOUT)
    audit["bse"]["mobile_page_status"]=mobile.status_code
except Exception as exc:
    audit["bse"]["mobile_page_error"]=type(exc).__name__+":"+str(exc)[:200]

bse=requests.Session()
bse.headers.update({
    "User-Agent":UA,
    "Accept":"application/json, text/plain, */*",
    "Origin":"https://www.bseindia.com",
    "Referer":"https://www.bseindia.com/",
})
try:
    audit["bse"]["announcements"]=fetch_json(
        bse,
        "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w",
        params={
            "pageno":1,
            "strCat":"-1",
            "strPrevDate":"20250102",
            "strScrip":"",
            "strSearch":"P",
            "strToDate":"20250102",
            "strType":"C",
        },
    )
except Exception as exc:
    audit["bse"]["announcements"]={"error":type(exc).__name__+":"+str(exc)[:300]}

nse_ok=any(v.get("json") and v.get("status")==200 for k,v in audit["nse"].items() if isinstance(v,dict))
bse_row=audit["bse"].get("announcements",{})
bse_ok=isinstance(bse_row,dict) and bse_row.get("json") and bse_row.get("status")==200
audit["status"]="PASS" if nse_ok and bse_ok else "BLOCKED_METADATA_TRANSPORT"
audit["nse_metadata_transport_ready"]=bool(nse_ok)
audit["bse_metadata_transport_ready"]=bool(bse_ok)

print(json.dumps(audit,indent=2,sort_keys=True))
sys.exit(0 if audit["status"]=="PASS" else 2)
