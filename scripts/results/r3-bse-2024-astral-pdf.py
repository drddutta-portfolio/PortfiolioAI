#!/usr/bin/env python3
"""Strict R3 BSE Astral 2024 consolidated original financial source, Dev only."""
from __future__ import annotations
import json, hashlib, re, os, sys, argparse
from datetime import date
from decimal import Decimal
from pathlib import Path
import fitz
import boto3
import psycopg
from botocore.config import Config
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE

REF="lrgpjimipfkyoqbpsqzz";PID="6193a4aa-3235-4057-bddc-209fcf443fc2"
BUCKET="portfolioai-history-dev"
PREFIX="portfolioai-results/development/v1/quarterly/"
SOURCE="COMPANY_EXCHANGE_FILING"
KIND="RESULTS_QUARTERLY_BSE_ASTRAL_ORIGINAL_PDF_2024_V1"
CONTRACT="PORTFOLIOAI_RESULTS_BSE_ASTRAL_2024_PDF_COMPACT_V1"
SYMBOL="ASTRAL";CODE="532830";ISIN="INE006I01046"
TARGETS={
 "2024-09-30":{"start":"2024-07-01","from":"2024-10-01","to":"2024-11-30",
   "filename":"47d353d6-47d8-4cf9-a8b3-d5a034f1d511.pdf",
   "sha":"6548984534d912f3146120ecaa9135eefc5fd74705829c285931838f755f7d40",
   "published":"2024-11-07","heading":"SEPTEMBER 30, 2024"},
 "2024-12-31":{"start":"2024-10-01","from":"2025-01-01","to":"2025-02-28",
   "filename":"59b5a333-4018-4040-be97-536c9a7c028c.pdf",
   "sha":"d83fac906899303f6b96a365563b41344fb29c15776c42f9e502628f61f0ede2",
   "published":"2025-01-30","heading":"DECEMBER 31, 2024"}
}
ROW_PATTERNS={
 "OPERATING_REVENUE_QUARTER":r"^1 Revenue from Operations\s+(.+)$",
 "NET_PROFIT_QUARTER":r"^9 Net Profit for the period/year\s+\(7-8\)\s+(.+)$",
 "EPS_DILUTED":r"^- Diluted \(In Rs\.\)\s+(.+)$"
}

def encode(obj):return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()
def sha(obj):return hashlib.sha256(obj).hexdigest()

def first_number(money,metric):
    vals=re.findall(r"(?<!\w)(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?(?!\w)",money)
    if len(vals)<4:raise ValueError("ORIGINAL_MULTICOLUMN_UNPROVEN_"+metric)
    return Decimal(vals[0].replace(",",""))

def extract(raw,quarter):
    expected=TARGETS[quarter]
    doc=fitz.open(stream=raw,filetype="pdf")
    # Original whole document must be linked to the issuer, not a newspaper ad.
    first=" ".join(doc[0].get_text("text",sort=True).upper().split())
    issuer_proven=any("ASTRAL LIMITED" in " ".join(page.get_text("text",sort=True).upper().split())
      for page in list(doc)[:min(16,len(doc))])
    if ("532830" not in first or not issuer_proven
        or len(doc)<3 or len(doc)>40):
        raise ValueError(f"BSE_ISSUER_PROOF_FAILED_{quarter}:"
          f"cover_code={'532830' in first},auditor_issuer={issuer_proven},pages={len(doc)}")
    found=[]
    for n,page in enumerate(doc):
        lines=[" ".join(s.split()) for s in page.get_text("text",sort=True).splitlines() if s.strip()]
        headers=[v for v in lines[:9] if "STATEMENT OF CONSOLIDATED UNAUDITED FINANCIAL RESULTS FOR THE QUARTER" in v.upper()]
        if len(headers)!=1 or expected["heading"] not in headers[0].upper():continue
        if not any("MILLION" in v.upper() for v in lines[:10]):continue
        if not any("QUARTER ENDED" in v.upper() for v in lines[:10]):continue
        # The original displays the current quarter FIRST, followed by previous quarter.
        if not any(expected["heading"].split(",")[0].title() in v.title() for v in lines[:12]):
            raise ValueError("FIRST_ORIGINAL_QUARTER_HEADER_UNPROVEN")
        facts={}
        for metric,pattern in ROW_PATTERNS.items():
            matches=[(v,re.match(pattern,v,re.I)) for v in lines]
            matched=[(line,m) for line,m in matches if m]
            if len(matched)!=1:raise ValueError("SOURCE_METRIC_ROW_AMBIGUOUS_"+metric)
            line,m=matched[0]
            original=first_number(m.group(1),metric)
            value=original/Decimal("10") if metric!="EPS_DILUTED" else original
            facts[metric]={
                "value":str(value),"unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_CRORE",
                "original_value":str(original),
                "original_unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_MILLION",
                "extraction_line":line,"extraction_page":n+1,
                "first_column_index":0,
                "conversion":"DIVIDE_MILLION_BY_10" if metric!="EPS_DILUTED" else "ORIGINAL_RUPEES_PER_SHARE"
            }
            if metric=="EPS_DILUTED":
                facts[metric]["share_basis"]="ORIGINALLY_PUBLISHED_NO_RETROSPECTIVE_ADJUSTMENT"
        found.append({"financial_page":n+1,"quarter_header":headers[0],
          "unit_header":next(v for v in lines[:10] if "MILLION" in v.upper()),
          "facts":facts})
    if len(found)!=1:raise ValueError("NO_SINGLE_CONSOLIDATED_QUARTERLY_TABLE")
    return found[0]

def r2_client():
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch("[a-f0-9]{32}",account):
        url="https://"+account+".r2.cloudflarestorage.com"
    elif re.fullmatch(r"https://[a-f0-9]{32}\.r2\.cloudflarestorage\.com/?",account):
        url=account.rstrip("/")
    else:raise RuntimeError("INVALID_DEV_R2_ACCOUNT")
    return boto3.client("s3",endpoint_url=url,
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",config=Config(retries={"max_attempts":2,"mode":"standard"}))

def persist(db,s3,quarter,source,parsed,publication):
    expected=TARGETS[quarter]
    document={
        "contract":CONTRACT,"symbol":SYMBOL,"isin":ISIN,"bse_scrip_code":CODE,
        "period_start":expected["start"],"period_end":quarter,
        "consolidation_scope":"CONSOLIDATED",
        "issuer_filing_url":source["source_url"],
        "original_sha256_unretained":source["sha256"],
        "original_pdf_retained":False,"raw_bse_bytes_retained":False,
        "reporting_currency":"INR",
        "publication_time_bse":publication,"publication_precision":"DATE_TIME_FROM_BSE_ANNOUNCEMENT",
        "original_quarter_financial_page":parsed["financial_page"],
        "quarter_header":parsed["quarter_header"],"unit_header":parsed["unit_header"],
        "original_first_quarter_column":0,"figures_review_pending":True,
        "facts":parsed["facts"]
    }
    mbytes=encode(document);mhash=sha(mbytes)
    key=PREFIX+f"security_id={ISIN}/period_end={quarter}/source_version={mhash}/manifest.json"
    try:
        old=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
        if old!=mbytes:raise RuntimeError("IMMUTABLE_SOURCE_MANIFEST_CONFLICT")
    except Exception as exc:
        if isinstance(exc,RuntimeError):raise
        res=getattr(exc,"response",{})
        code=res.get("Error",{}).get("Code") if isinstance(res,dict) else None
        if code not in ("NoSuchKey","404","NotFound"):raise
        s3.put_object(Bucket=BUCKET,Key=key,Body=mbytes,ContentType="application/json")
    payload={**document,"r2_key":key,"r2_manifest_sha256":mhash}
    h=sha(encode(payload))
    with db.cursor() as c:
        c.execute("SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'",(SYMBOL,ISIN))
        row=c.fetchone()
        if not row:raise RuntimeError("CANONICAL_IDENTITY_MISSING")
        sid=row[0]
        c.execute("""INSERT INTO public.data_source_records
          (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
          VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
          ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
          DO NOTHING RETURNING id""",(
          SOURCE,KIND,SYMBOL+":"+source["sha256"],source["source_url"],h,encode(payload).decode(),
          '{"retention":"COMPACT_FACTS_ONLY","raw_bse_bytes_retained":false,"source_qualification":"PENDING_R4"}'
        ))
        got=c.fetchone()
        if got:rid=got[0]
        else:
            c.execute("""SELECT id FROM public.data_source_records WHERE source_code=%s
              AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",(
              SOURCE,KIND,SYMBOL+":"+source["sha256"],h))
            rid=c.fetchone()[0]
        new=0
        for code,f in parsed["facts"].items():
            c.execute("""INSERT INTO public.fundamental_observations
            (security_id,metric_code,source_record_id,source_code,numeric_value,currency,
             unit,period_start,period_end,period_type,consolidation_scope,
             retrieved_at,fresh_until,evidence_status)
            VALUES (%s,%s,%s,%s,%s,'INR',%s,%s,%s,'QUARTER','CONSOLIDATED',
            now(),now()+interval '120 days','AVAILABLE')
            ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
             consolidation_scope,source_record_id) DO NOTHING RETURNING id""",(
              sid,code,rid,SOURCE,Decimal(f["value"]),f["unit"],expected["start"],quarter))
            if c.fetchone():new+=1
    db.commit()
    return new

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--apply",action="store_true")
    cli.add_argument("--output",default="tmp/results-r3-bse-astral2024/summary.json")
    opts=cli.parse_args()
    dburl=os.getenv("SUPABASE_DB_URL","")
    if REF not in dburl or os.getenv("CLOUDFLARE_R2_BUCKET")!=BUCKET:
        raise SystemExit("NOT_DEVELOPMENT_STORAGE")
    if opts.apply and os.getenv("RESULTS_R3_BSE_ASTRAL_WRITE_ACK")!="ASTRAL_2024_ORIGINAL_TWO_PDF_PROOF":
        raise SystemExit("APPLY_NOT_APPROVED")
    results={"symbol":SYMBOL,"mode":"APPLY" if opts.apply else "DRY_RUN","new_observations":0,"quarters":[]}
    with psycopg.connect(dburl) as db,PortfolioBSE() as b:
        with db.cursor() as cur:
            cur.execute("""SELECT COUNT(*) FROM public.transactions t JOIN public.securities s
            ON s.id=t.security_id WHERE t.portfolio_id=%s AND s.symbol=%s AND s.isin=%s""",
            (PID,SYMBOL,ISIN))
            if cur.fetchone()[0]<1:raise RuntimeError("PORTFOLIO_HOLDING_IDENTITY_UNPROVEN")
        db.rollback()
        s3=r2_client() if opts.apply else None
        for quarter,expected in TARGETS.items():
            info={"quarter":quarter}
            with db.cursor() as cur:
                cur.execute("""SELECT COUNT(DISTINCT metric_code) FROM public.fundamental_observation_decisions
                  WHERE security_id=(SELECT id FROM public.securities WHERE symbol=%s AND isin=%s)
                    AND period_end=%s AND selected_observation_id IS NOT NULL
                    AND metric_code IN ('OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED')""",
                    (SYMBOL,ISIN,quarter))
                selected=cur.fetchone()[0]
            db.rollback()
            if selected==3:
                info["status"]="EXISTING_QUALIFIED_REUSED"
                results["quarters"].append(info);continue
            found=b.financial_announcements(CODE,date.fromisoformat(expected["from"]),
                  date.fromisoformat(expected["to"]),max_pages=3)
            matching=[a for a in found["results"] if
              a["attachment_name"]==expected["filename"]
              and (a["published_at"] or "").startswith(expected["published"])
              and "FINANCIAL RESULT" in a["title"].upper()]
            if len(matching)!=1:raise RuntimeError("ISSUER_BSE_PUBLICATION_NOT_VERIFIED_"+quarter)
            raw,meta=b.retrieve_original_pdf(expected["filename"])
            if meta["sha256"]!=expected["sha"]:raise RuntimeError("ORIGINAL_SHA256_CHANGED")
            parsed=extract(raw,quarter)
            info.update({"status":"ORIGINAL_PDF_FACTS_VALIDATED",
               "source_url":meta["source_url"],"sha256":meta["sha256"],
               "financial_page":parsed["financial_page"],
               "facts":{k:v["value"] for k,v in parsed["facts"].items()}})
            if opts.apply:
                info["new_observations"]=persist(db,s3,quarter,meta,parsed,matching[0]["published_at"])
                results["new_observations"]+=info["new_observations"]
            results["quarters"].append(info)
    out=Path(opts.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(results,sort_keys=True,indent=2),encoding="utf-8")
    print(json.dumps(results,sort_keys=True))
if __name__=="__main__":main()
