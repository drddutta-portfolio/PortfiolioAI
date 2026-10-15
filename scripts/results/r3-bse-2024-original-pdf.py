#!/usr/bin/env python3
"""R3 Development-only strict issuer-original BSE PDF admission pilot.

Whitelisted 2024 HDFCBANK issuer originals; validates PDF bytes, published
filing, issuer CIN, 2024 reporting quarter, CONSOLIDATED table scope,
one-quarter first-column monetary units and EPS, then writes compact evidence.
Never store third-party PDF bytes in R2. R4 independently selects the facts.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse

import boto3
import fitz
import psycopg
from botocore.config import Config

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE  # noqa: E402

REF = "lrgpjimipfkyoqbpsqzz"
BUCKET = "portfolioai-history-dev"
PORTFOLIO = "6193a4aa-3235-4057-bddc-209fcf443fc2"
ROOT = "portfolioai-results/development/v1/quarterly/"
SOURCE = "COMPANY_EXCHANGE_FILING"
KIND = "RESULTS_QUARTERLY_BSE_ORIGINAL_PDF_2024_V1"
CONTRACT = "PORTFOLIOAI_RESULTS_BSE_2024_ORIGINAL_PDF_COMPACT_V1"
CIN = "L65920MH1994PLC080618"
SYMBOL = "HDFCBANK"
BSE_SCRIP = "500180"
# Freeze previously independently retrieved originals. Fail closed on changes.
TARGETS = {
 "2024-09-30": {
   "period_start":"2024-07-01",
   "start":"2024-10-01","end":"2024-11-30",
   "attachment":"c9b4cb4c-088b-4a88-a6b7-91087ba90d95.pdf",
   "sha256":"ac876a6846f0866f5951ade7ebd323c4a6752e6dc9c4089d985185633b6023fc",
   "publication_day":"2024-10-23",
 },
 "2024-12-31": {
   "period_start":"2024-10-01",
   "start":"2025-01-01","end":"2025-02-28",
   "attachment":"8e326f69-8061-4281-bc39-d8ac639479bd.pdf",
   "sha256":"cc5517b18572a7094b553d73d25245b91f56109d687985bbf6c959364789bc3e",
   "publication_day":"2025-01-28",
 }
}
NUM = re.compile(r"(?<![0-9A-Za-z])(-?(?:\d{1,3}(?:,\d{2,3})+|\d+)\.\d{2})(?![0-9])")

def canonical(data):
    return json.dumps(data,sort_keys=True,separators=(",",":")).encode()

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def amount(line):
    nums=NUM.findall(line)
    if len(nums)<3:raise ValueError("NOT_ENOUGH_QUARTER_COLUMNS")
    return Decimal(nums[0].replace(",",""))

def take(lines,pattern):
    matches=[x for x in lines if re.search(pattern,x,re.I)]
    if len(matches)!=1:raise ValueError("AMBIGUOUS_FINANCIAL_LABEL_"+pattern)
    return matches[0]

def extract_pdf(raw,period):
    """Admit only one clearly headed consolidated issuer table, no PDF OCR."""
    if period not in TARGETS:raise ValueError("OUTSIDE_2024_SCOPE")
    doc=fitz.open(stream=raw,filetype="pdf")
    found=[]
    human=date.fromisoformat(period).strftime("%B %-d, %Y").upper()
    dot=date.fromisoformat(period).strftime("%d.%m.%Y")
    for n,page in enumerate(doc):
        text=page.get_text("text",sort=True)
        lines=[" ".join(x.split()) for x in text.splitlines() if x.strip()]
        heading=[x for x in lines[:18] if "CONSOLIDATED FINANCIAL RESULTS FOR THE QUARTER" in x.upper()]
        if not heading:continue
        if not any("HDFC BANK LIMITED" in x.upper() for x in lines[:8]):continue
        if not any(CIN in x.upper() for x in lines[:8]):continue
        if human not in heading[0].upper():continue
        if not any(dot in x and "QUARTER" not in x.upper() for x in lines[:18]):continue
        if not any("CRORE" in x.upper() for x in lines[:13]):continue
        if not any("QUARTER ENDED" in x.upper() for x in lines[:13]):continue
        def get(pat):
            line=take(lines,pat)
            return {"line":line,"page":n+1,"first_quarter_value":str(amount(line))}
        earned=get(r"^\s*1\s+Interest earned\b")
        expended=get(r"^\s*4\s+Interest expended\b")
        profit=get(r"^\s*16\s+Net profit for the period\b")
        eps=get(r"^\s*[\(\{][bB][\)\}]\s+Diluted EPS before")
        ni=Decimal(earned["first_quarter_value"])-Decimal(expended["first_quarter_value"])
        facts={
          "NET_INTEREST_INCOME_QUARTER":{
            "value":str(ni),"unit":"INR_CRORE","original_unit":"INR_CRORE",
            "formula":"INTEREST_EARNED_MINUS_INTEREST_EXPENDED",
            "component_lines":[earned,expended],"page":n+1,"column_index":0
          },
          "NET_PROFIT_QUARTER":{
            "value":profit["first_quarter_value"],"unit":"INR_CRORE",
            "original_unit":"INR_CRORE","evidence_line":profit["line"],
            "page":n+1,"column_index":0
          },
          "EPS_DILUTED":{
            "value":eps["first_quarter_value"],"unit":"INR_PER_SHARE",
            "original_unit":"INR_PER_SHARE","evidence_line":eps["line"],
            "page":n+1,"column_index":0,
            "share_basis":"AS_ORIGINALLY_PUBLISHED_NO_RETROSPECTIVE_ADJUSTMENT"
          }
        }
        if min(ni,Decimal(profit["first_quarter_value"]),Decimal(eps["first_quarter_value"]))<=0:
            raise ValueError("UNEXPECTED_NONPOSITIVE_BANK_METRIC")
        found.append({"scope":"CONSOLIDATED","period":period,
                      "quarter_header":heading[0],"column_header":next(x for x in lines[:18] if dot in x),
                      "currency_header":next(x for x in lines[:13] if "CRORE" in x.upper()),
                      "company_id":CIN,"issuer":"HDFC BANK LIMITED","financial_page":n+1,
                      "facts":facts})
    if len(found)!=1:raise ValueError("MISSING_OR_AMBIGUOUS_COMPANY_CONSOLIDATED_TABLE")
    return found[0]

def r2():
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch("[a-f0-9]{32}",account):
        endpoint="https://"+account+".r2.cloudflarestorage.com"
    elif re.fullmatch(r"https://[a-f0-9]{32}\.r2\.cloudflarestorage\.com/?",account):
        endpoint=account.rstrip("/")
    else:raise RuntimeError("INVALID_DEV_R2_ACCOUNT")
    return boto3.client("s3",endpoint_url=endpoint,
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      region_name="auto",config=Config(retries={"max_attempts":2,"mode":"standard"}))

def persist(db,s3,isin,raw,source,parsed,publication):
    period=parsed["period"]
    original_sha=digest(raw)
    manifest={
      "contract":CONTRACT,"symbol":SYMBOL,"isin":isin,"issuer_cin":CIN,
      "bse_scrip_code":BSE_SCRIP,
      "period_start":TARGETS[period]["period_start"],"period_end":period,
      "consolidation_scope":"CONSOLIDATED",
      "reporting_currency":"INR","issuer_filing_url":source["source_url"],
      "original_sha256_unretained":original_sha,"original_pdf_retained":False,
      "raw_bse_bytes_retained":False,"publication_time_bse":publication,
      "publication_precision":"DATE_TIME_FROM_BSE_ANNOUNCEMENT",
      "issuer_original_reporting_scope_proven":True,
      "financial_page":parsed["financial_page"],
      "quarter_header":parsed["quarter_header"],"column_header":parsed["column_header"],
      "currency_header":parsed["currency_header"],
      "pdf_original_context":{"issuer":parsed["issuer"],"cin":CIN,
        "first_quarter_column":0,"facts_currency":"INR_CRORE"},
      "figures_review_pending":True,
      "facts":parsed["facts"]
    }
    mbytes=canonical(manifest);mhash=digest(mbytes)
    key=(ROOT+f"security_id={isin}/period_end={period}/"
           +f"source_version={mhash}/manifest.json")
    try:
      older=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
      if older!=mbytes:raise RuntimeError("R2_IMMUTABILITY_CONFLICT")
    except Exception as exc:
      if isinstance(exc,RuntimeError):raise
      response=getattr(exc,"response",{})
      err=response.get("Error",{}).get("Code") if isinstance(response,dict) else None
      if err not in ("NoSuchKey","404","NotFound"):raise
      s3.put_object(Bucket=BUCKET,Key=key,Body=mbytes,ContentType="application/json")
    payload={**manifest,"r2_key":key,"r2_manifest_sha256":mhash}
    source_hash=digest(canonical(payload))
    with db.cursor() as c:
      c.execute("""SELECT id FROM public.securities
      WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'""",(SYMBOL,isin))
      row=c.fetchone()
      if not row:raise RuntimeError("CANONICAL_ISIN_UNVERIFIED")
      sid=row[0]
      c.execute("""INSERT INTO public.data_source_records
        (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
        VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
        ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
        DO NOTHING RETURNING id""",(
         SOURCE,KIND,SYMBOL+":"+original_sha,source["source_url"],source_hash,
         canonical(payload).decode(),
         json.dumps({"retention":"COMPACT_FACTS_ONLY","original_bse_bytes_retained":False,
          "source_qualification":"PENDING_R4_REVIEW"})))
      ins=c.fetchone()
      if ins:source_id=ins[0]
      else:
        c.execute("""SELECT id FROM public.data_source_records
          WHERE source_code=%s AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
          (SOURCE,KIND,SYMBOL+":"+original_sha,source_hash))
        source_id=c.fetchone()[0]
      count=0
      for code,f in parsed["facts"].items():
        c.execute("""INSERT INTO public.fundamental_observations
        (security_id,metric_code,source_record_id,source_code,numeric_value,currency,
         unit,period_start,period_end,period_type,consolidation_scope,
         retrieved_at,fresh_until,evidence_status)
        VALUES (%s,%s,%s,%s,%s,'INR',%s,%s,%s,'QUARTER','CONSOLIDATED',
          now(),now()+interval '120 days','AVAILABLE')
        ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
        consolidation_scope,source_record_id) DO NOTHING RETURNING id""",(
         sid,code,source_id,SOURCE,Decimal(f["value"]),f["unit"],
         TARGETS[period]["period_start"],period))
        if c.fetchone():count+=1
    db.commit()
    return count

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--apply",action="store_true")
    cli.add_argument("--output",default="tmp/results-r3-bse-2024/hdfcbank.json")
    options=cli.parse_args()
    url=os.getenv("SUPABASE_DB_URL","")
    if REF not in url or os.getenv("CLOUDFLARE_R2_BUCKET")!=BUCKET:
        raise SystemExit("DEVELOPMENT_ONLY_STORAGE")
    if options.apply and os.getenv("RESULTS_R3_BSE_2024_WRITE_ACK")!="BSE_HDFCBANK_2024_TWO_SOURCE_PROOF":
        raise SystemExit("WRITES_NOT_APPROVED")
    s3=r2() if options.apply else None
    out={"mode":"APPLY" if options.apply else "DRY_RUN","company":SYMBOL,
         "outcomes":[],"observations_inserted":0}
    with psycopg.connect(url) as db, PortfolioBSE() as bse:
      with db.cursor() as c:
        c.execute("""SELECT DISTINCT s.isin FROM public.transactions t JOIN public.securities s
          ON s.id=t.security_id WHERE t.portfolio_id=%s AND s.symbol=%s
          AND s.asset_class='EQUITY' AND s.isin IS NOT NULL""",(PORTFOLIO,SYMBOL))
        holdings=c.fetchall()
        if len(holdings)!=1:raise RuntimeError("CANONICAL_IDENTITY_AMBIGUOUS")
        isin=holdings[0][0]
      db.rollback()
      for period,expect in TARGETS.items():
        rec={"quarter":period}
        with db.cursor() as c:
          c.execute("""SELECT COUNT(DISTINCT metric_code) FROM
            public.fundamental_observation_decisions
            WHERE security_id=(SELECT id FROM public.securities WHERE symbol=%s AND isin=%s)
              AND period_end=%s AND selected_observation_id IS NOT NULL
              AND metric_code=ANY(%s)""",(
              SYMBOL,isin,period,["NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"]))
          existing=c.fetchone()[0]
        db.rollback()
        if existing==3:
          rec["status"]="EXISTING_QUALIFIED_REUSED"
          out["outcomes"].append(rec)
          continue
        found=bse.financial_announcements(BSE_SCRIP,
           date.fromisoformat(expect["start"]),date.fromisoformat(expect["end"]),
           max_pages=4)
        candidates=[r for r in found["results"] if r["attachment_name"]==expect["attachment"]
           and (r["published_at"] or "").startswith(expect["publication_day"])
           and "HDFC BANK LIMITED" in r["title"].upper()
           and "FINANCIAL RESULTS" in r["title"].upper()]
        if len(candidates)!=1:raise RuntimeError("ORIGINAL_BSE_ANNOUNCEMENT_NOT_UNIQUE_"+period)
        original,source=bse.retrieve_original_pdf(expect["attachment"])
        if source["sha256"]!=expect["sha256"]:raise RuntimeError("BSE_ORIGINAL_SHA256_MISMATCH")
        parsed=extract_pdf(original,period)
        rec.update({"status":"ORIGINAL_QUALIFIED_FOR_R4",
          "sha256":source["sha256"],"source":source["source_url"],
          "scope":parsed["scope"],"metrics":{k:v["value"] for k,v in parsed["facts"].items()}})
        if options.apply:
          rec["observations_inserted"]=persist(db,s3,isin,original,source,parsed,
                                               candidates[0]["published_at"])
          out["observations_inserted"]+=rec["observations_inserted"]
        out["outcomes"].append(rec)
    path=Path(options.output);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(out,indent=2,sort_keys=True),encoding="utf-8")
    print(json.dumps(out,sort_keys=True))
if __name__=="__main__":main()
