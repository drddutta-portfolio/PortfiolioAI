#!/usr/bin/env python3
"""Strict R3 BSE Ashoka Buildcon 2024 consolidated original source, Dev only."""
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
KIND="RESULTS_QUARTERLY_BSE_ASHOKA_ORIGINAL_PDF_2024_V1"
CONTRACT="PORTFOLIOAI_RESULTS_BSE_ASHOKA_2024_PDF_COMPACT_V1"
SYMBOL="ASHOKA";CODE="533271";ISIN="INE442H01029"
TARGETS={
 "2024-09-30":{"start":"2024-07-01","from":"2024-10-01","to":"2024-11-30",
   "filename":"21f1f436-84a4-47a5-a999-9fe821844d19.pdf",
   "sha":"e7635fd45c6cfe97020f09f3af616026b3321556646760b9d664a5d22c43f4f0",
   "published":"2024-11-12","heading":"SEPTEMBER 30, 2024","column":"30-SEP-24"},
 "2024-12-31":{"start":"2024-10-01","from":"2025-01-01","to":"2025-02-28",
   "filename":"200ba514-3197-42f6-a99f-86416b93f2ca.pdf",
   "sha":"428a23cd14a9c27574631c2d9a0384b69a353f0a10595d409a1df453dab8f615",
   "published":"2025-02-10","heading":"DECEMBER 31, 2024","column":"31-DEC-24"}
}
COMPANY="ASHOKA BUILDCON LIMITED"
CIN="L45200MH1993PLC071970"

def encode(obj):return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()
def sha(obj):return hashlib.sha256(obj).hexdigest()

def first_number(row,metric):
    # All original amounts are stored in lakhs except INR/share EPS.
    nums=re.findall(r"(?<![\w,])(?:\d{1,3}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?![\d,])",row)
    if len(nums)<5:raise ValueError("ORIGINAL_MULTICOLUMN_UNPROVEN_"+metric)
    return Decimal(nums[0].replace(",",""))

def extract(raw,quarter):
    expected=TARGETS[quarter]
    if sha(raw)!=expected["sha"]:raise ValueError("FROZEN_ASHOKA_ORIGINAL_CHANGED")
    doc=fitz.open(stream=raw,filetype="pdf")
    if not 3<=len(doc)<=35:raise ValueError("INVALID_ISSUER_DOCUMENT_LENGTH")
    all_pages=[p.get_text("text",sort=True) for p in doc]
    found=[]
    for n,txt in enumerate(all_pages):
        lines=[" ".join(x.split()) for x in txt.splitlines() if x.strip()]
        header=[v for v in lines[:12] if
            "UNAUDITED CONSOLIDATED FINANCIAL RESULTS FOR THE QUARTER" in v.upper()
            and expected["heading"] in v.upper()]
        if len(header)!=1:continue
        if not all(any(needle in x.upper() for x in lines[:12])
            for needle in (COMPANY,CIN,"LAKHS","QUARTER ENDED",expected["column"])):
            raise ValueError("ASHOKA_CONSOLIDATED_ISSUER_OR_PERIOD_NOT_PROVEN")
        evidence={}
        def metric(label,pattern):
            candidates=[x for x in lines if re.match(pattern,x,re.I)]
            if len(candidates)!=1:raise ValueError("AMBIGUOUS_OR_MISSING_ASHOKA_ROW_"+label)
            row=candidates[0]
            val=first_number(re.sub(pattern,"",row,flags=re.I),label)
            evidence[label]={"row":row,"original":val}
            return val
        rev=metric("OPERATING_REVENUE_QUARTER",
            r"^I Revenue From Operations\s+")
        profit=metric("NET_PROFIT_QUARTER",
            r"^XI Profit after tax \(IX-X\)\s+")
        eps_rows=[row for row in lines if re.match(r"^Basic & Diluted\s+",row,re.I)]
        if len(eps_rows)!=2:raise ValueError("ASHOKA_TWO_EPS_TABLE_ROWS_NOT_PROVEN")
        eps1=first_number(re.sub(r"^Basic & Diluted\s+","",eps_rows[0],flags=re.I),"EPS_FIRST")
        eps2=first_number(re.sub(r"^Basic & Diluted\s+","",eps_rows[1],flags=re.I),"EPS_SECOND")
        if eps1!=eps2 or eps1<=0:raise ValueError("ASHOKA_EPS_ROWS_DISAGREE")
        if rev<=0 or profit<=0:raise ValueError("UNEXPECTED_NEGATIVE_2024_QUARTER")
        facts={}
        for metric_code,item in evidence.items():
            facts[metric_code]={
                "value":str(item["original"]/Decimal(100)), "unit":"INR_CRORE",
                "original_value":str(item["original"]),"original_unit":"INR_LAKH",
                "extraction_line":item["row"],"extraction_page":n+1,
                "first_column_index":0,"conversion":"DIVIDE_LAKHS_BY_100"
            }
        facts["EPS_DILUTED"]={
            "value":str(eps1),"unit":"INR_PER_SHARE",
            "original_value":str(eps1),"original_unit":"INR_PER_SHARE",
            "extraction_line":eps_rows[0],"eps_crosscheck_line":eps_rows[1],
            "extraction_page":n+1,"first_column_index":0,
            "conversion":"ORIGINAL_RUPEES_PER_SHARE",
            "share_basis":"ORIGINALLY_PUBLISHED_NO_RETROSPECTIVE_ADJUSTMENT"
        }
        found.append({"financial_page":n+1,"quarter_header":header[0],
          "unit_header":next(v for v in lines[:12] if "LAKHS" in v.upper()),
          "column_header":next(v for v in lines[:12] if expected["column"] in v.upper()),
          "issuer_header":next(v for v in lines[:12] if COMPANY in v.upper()),
          "cin_header":next(v for v in lines[:12] if CIN in v.upper()),
          "facts":facts})
    if len(found)!=1:raise ValueError("NO_SINGLE_ASHOKA_CONSOLIDATED_QUARTERLY_TABLE")
    # Known issuer original first-quarter values; catches comma grouping regressions.
    oracle={
       "2024-09-30":{"OPERATING_REVENUE_QUARTER":"2488.931",
                     "NET_PROFIT_QUARTER":"462.469","EPS_DILUTED":"16.28"},
       "2024-12-31":{"OPERATING_REVENUE_QUARTER":"2387.888",
                     "NET_PROFIT_QUARTER":"661.4923","EPS_DILUTED":"23.32"}
    }
    for metric,expected_value in oracle[quarter].items():
        if Decimal(found[0]["facts"][metric]["value"])!=Decimal(expected_value):
            raise ValueError("ASHOKA_FIRST_QUARTER_ORACLE_MISMATCH_"+metric)
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
        "parser_revision":"INDIAN_GROUPING_V2",
        "supersedes_invalid_revision":"INDIAN_GROUPING_V1_FIRST_COMMA_GROUP_DROPPED",
        "period_start":expected["start"],"period_end":quarter,
        "consolidation_scope":"CONSOLIDATED",
        "issuer_filing_url":source["source_url"],
        "original_sha256_unretained":source["sha256"],
        "original_pdf_retained":False,"raw_bse_bytes_retained":False,
        "reporting_currency":"INR",
        "publication_time_bse":publication,"publication_precision":"DATE_TIME_FROM_BSE_ANNOUNCEMENT",
        "original_quarter_financial_page":parsed["financial_page"],
        "quarter_header":parsed["quarter_header"],"unit_header":parsed["unit_header"],
        "issuer_header":parsed["issuer_header"],"cin_header":parsed["cin_header"],
        "column_header":parsed["column_header"],
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
    if opts.apply and os.getenv("RESULTS_R3_BSE_ASHOKA_WRITE_ACK")!="ASHOKA_2024_ORIGINAL_TWO_PDF_PROOF":
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
                with db.cursor() as cur:
                    cur.execute("""SELECT d.metric_code,f.numeric_value::text,
                           r.raw_payload->>'parser_revision'
                         FROM public.fundamental_observation_decisions d
                         JOIN public.fundamental_observations f ON f.id=d.selected_observation_id
                         JOIN public.data_source_records r ON r.id=f.source_record_id
                         WHERE d.security_id=(SELECT id FROM public.securities WHERE symbol=%s AND isin=%s)
                         AND d.period_end=%s AND d.period_type='QUARTER'
                         AND d.selected_observation_id IS NOT NULL""",(SYMBOL,ISIN,quarter))
                    prior={m:(Decimal(v),rev) for m,v,rev in cur.fetchall()}
                expected_revenue=Decimal("2488.931") if quarter=="2024-09-30" else Decimal("2387.888")
                if (prior.get("OPERATING_REVENUE_QUARTER")==
                    (expected_revenue,"INDIAN_GROUPING_V2")
                    and all(k in prior for k in
                        ("NET_PROFIT_QUARTER","EPS_DILUTED"))):
                    info["status"]="EXISTING_CORRECTED_SOURCE_REUSED"
                    results["quarters"].append(info);db.rollback();continue
            db.rollback()
            found=b.financial_announcements(CODE,date.fromisoformat(expected["from"]),
                  date.fromisoformat(expected["to"]),max_pages=3)
            matching=[a for a in found["results"] if
              a["attachment_name"]==expected["filename"]
              and (a["published_at"] or "").startswith(expected["published"])
              and "FINANCIAL RESULT" in a["title"].upper()]
            if len(matching)!=1:raise RuntimeError("ISSUER_BSE_PUBLICATION_NOT_VERIFIED_"+quarter)
            identity=b._bse.equityMetaInfo(CODE)
            if (not isinstance(identity,dict) or identity.get("ISIN")!=ISIN
                or str(identity.get("SecurityCode"))!=CODE
                or identity.get("SecurityId")!=SYMBOL):
                raise RuntimeError("CURRENT_BSE_ISSUER_SCRIP_ISIN_MISMATCH")
            identity=b._bse.equityMetaInfo(CODE)
            if (not isinstance(identity,dict) or identity.get("ISIN")!=ISIN
                or str(identity.get("SecurityCode"))!=CODE
                or identity.get("SecurityId")!=SYMBOL):
                raise RuntimeError("CURRENT_BSE_ASHOKA_ISIN_MISMATCH")
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
