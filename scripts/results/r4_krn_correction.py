"""Narrow, source-pinned KRN March 2025 correction; no general latest-wins rule."""
from collections import defaultdict
from decimal import Decimal
from hashlib import sha256
import json
import re
import fitz

PREFIX="portfolioai-results/development/v1/quarterly/"
BUCKET="portfolioai-history-dev"
NOTICE="https://nsearchives.nseindia.com/corporate/KRNHEAT_10072025164541_replywithack.pdf"
REFERENCE=PREFIX+"issuer-corrections/KRN/2025-03-31/authority.json"
OLD={"dd1f9345-2feb-4c8c-9fa2-1a607690a153","d3f66ff8-b5cf-4ccd-a53d-87f04c7f3f2f"}
NEW={"12ceca56-54cb-4cc2-9f4a-382e0012e3c0","b04be154-8392-4faa-9d57-a83d14084749"}
OLD_URL="https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_1436874_13052025120025_WEB.xml"
NEW_URL="https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_1480150_10072025043431_WEB.xml"
HASHES={"dd1f9345-2feb-4c8c-9fa2-1a607690a153":"c45187e8f05576dd57c53afc0a7c60316cca09a8af37a055fc6ba79fe9148e28",
        "12ceca56-54cb-4cc2-9f4a-382e0012e3c0":"9e262b74bfd5b8107b1c21a30d1e7a45c052795e87d448a91d8848aac75ccaf2"}

def validate_notice(raw):
    if not raw.startswith(b"%PDF") or len(raw)>5_000_000:raise ValueError("KRN_ORIGINAL_NOTICE_REQUIRED")
    with fitz.open(stream=raw,filetype="pdf") as doc:
        if not 1<=len(doc)<=3:raise ValueError("KRN_NOTICE_PAGE_BOUND")
        text=re.sub(r"\s+"," "," ".join(p.get_text("text") for p in doc)).upper()
    required=("KRN HEAT EXCHANGER AND REFRIGERATION LIMITED","L29309RJ2017PLC058905",
        "SCRIPT SYMBOL: KRN","31ST MARCH, 2025","IDENTIFIED AND CORRECTED",
        "REVISED AND ACCURATE XBRL","ACKNOWLEDGEMENT","RECEIVED THE SUBMISSION",
        "10-JUL-2025","NATIONAL STOCK EXCHANGE OF INDIA")
    if not all(t in text for t in required):raise ValueError("KRN_CORRECTION_AND_EXCHANGE_ACK_NOT_PROVEN")
    return sha256(raw).hexdigest()

def retain_notice(batch,client):
    import requests
    session=requests.Session()
    session.headers.update({"User-Agent":"Mozilla/5.0","Accept-Language":"en-IN,en;q=0.8"})
    try:session.get("https://www.nseindia.com/companies-listing/corporate-filings-financial-results",timeout=30).raise_for_status()
    except requests.RequestException:pass
    response=session.get(NOTICE,timeout=40);response.raise_for_status();raw=response.content
    digest=validate_notice(raw)
    key=PREFIX+"evidence/original_version="+digest+"/issuer-correction.pdf"
    batch.immutable_put(client,key,raw)
    batch.immutable_put(client,REFERENCE,batch.canonical({"source_url":NOTICE,"r2_key":key,"sha256":digest}))

def qualify(facts,client):
    relevant=[r for r in facts if r["symbol"]=="KRN" and str(r["period_end"])=="2025-03-31"
        and r["consolidation_scope"]=="CONSOLIDATED" and str(r["source_record_id"]) in OLD|NEW]
    groups=defaultdict(dict)
    correct={"OPERATING_REVENUE_QUARTER":Decimal("131.5024"),"NET_PROFIT_QUARTER":Decimal("14.867"),"EPS_DILUTED":Decimal("2.39")}
    original={**correct,"EPS_DILUTED":Decimal("0")}
    for r in relevant:
        sid=str(r["source_record_id"])
        if r["isin"]!="INE0Q3J01015" or r["source_url"]!=(OLD_URL if sid in OLD else NEW_URL):return facts,False
        if sid in HASHES and r["raw_payload"].get("original_sha256_retained")!=HASHES[sid]:return facts,False
        groups[sid][r["metric_code"]]=Decimal(str(r["numeric_value"]))
    if not set(HASHES).issubset(groups):return facts,False
    if any(values!=(original if sid in OLD else correct) for sid,values in groups.items()):return facts,False
    try:
        ref=json.loads(client.get_object(Bucket=BUCKET,Key=REFERENCE)["Body"].read())
        if ref["source_url"]!=NOTICE or ref["r2_key"]!=PREFIX+"evidence/original_version="+ref["sha256"]+"/issuer-correction.pdf":return facts,False
        raw=client.get_object(Bucket=BUCKET,Key=ref["r2_key"])["Body"].read()
        if validate_notice(raw)!=ref["sha256"]:return facts,False
    except Exception:return facts,False
    # Keep immutable observations. Only the proven superseded versions are
    # excluded from this selection; all other quarters/scopes stay untouched.
    excluded={id(r) for r in relevant if str(r["source_record_id"]) in OLD}
    return [r for r in facts if id(r) not in excluded],True
