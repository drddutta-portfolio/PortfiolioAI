#!/usr/bin/env python3
"""Development-only BSE historical issuer-original recovery for Results R4.

Search official announcements, extract only fully identified single-quarter
financial trios, retain original PDF plus compact lineage in R2, then hand
evidence to the independent R4 selector. No guessed EPS or Trendlyne substitute.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from pathlib import Path
import json
import os
import re
import sys
import time

import boto3
import fitz
import psycopg
from botocore.config import Config

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE

REF = "lrgpjimipfkyoqbpsqzz"
BUCKET = "portfolioai-history-dev"
PORTFOLIO = "6193a4aa-3235-4057-bddc-209fcf443fc2"
PREFIX = "portfolioai-results/development/v1/quarterly/"
SOURCE = "COMPANY_EXCHANGE_FILING"
KIND = "RESULTS_R4_BSE_ORIGINAL_PDF_GENERAL_V1"
CONTRACT = "PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1"
WINDOWS = {
    "2024-09-30": ("2024-07-01", "2024-10-01", "2024-11-30"),
    "2024-12-31": ("2024-10-01", "2025-01-01", "2025-02-28"),
    "2025-03-31": ("2025-01-01", "2025-04-01", "2025-05-31"),
    "2025-06-30": ("2025-04-01", "2025-07-01", "2025-08-31"),
}
BANKS = set("AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK RBLBANK SBIN UNIONBANK".split())
INSURERS = {"STARHEALTH"}
NUM = re.compile(r"(?<![a-zA-Z0-9,])\(?-?(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d+)?\)?(?![a-zA-Z0-9,])")
STOP = {"LTD", "LIMITED", "THE", "AND", "OF", "INDIA", "INDIAN", "COMPANY", "CORPORATION", "PRIVATE", "PVT"}

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()

def sha(raw):
    return sha256(raw).hexdigest()

def name_tokens(s):
    return [t for t in re.findall(r"[A-Z]+", s.upper()) if t not in STOP and len(t) >= 3]

def issuer_identity(name, cover):
    a=name_tokens(name)
    b=name_tokens(cover[:3500])
    if len(a)<2:
        return False
    # Contiguous legal-name prefix, no loose unordered company-name guessing.
    return any(b[i:i+len(a)]==a for i in range(len(b)-len(a)+1))

def date_forms(period):
    d=date.fromisoformat(period)
    return (d.strftime("%d.%m.%Y"), d.strftime("%d-%m-%Y"),
            d.strftime("%d/%m/%Y"), d.strftime("%d %B %Y").upper(),
            d.strftime("%B %d, %Y").upper(), d.strftime("%d-%b-%Y").upper(),
            d.strftime("%d %b %Y").upper(), d.strftime("%d-%m-%y"))

def numeric_cells(row):
    # Match Indian and international group separators without truncating 2,48,893.
    return [Decimal(m.group(0).replace(",", "").replace("(", "-").replace(")", ""))
            for m in NUM.finditer(row) if m.group(0).strip() not in ("-", "")]

def financial_row(lines, labels, metric):
    found=[]
    for i,line in enumerate(lines):
        stripped=re.sub(r"^\s*(?:\(?\d{1,2}\)?[.)-]?|[IVX]{1,5}[.)-]?)\s*", "",line).strip()
        if not any(re.match(p,stripped,re.I) for p in labels):
            continue
        # Same-text-row only: no unsafe transfer from adjacent statement rows.
        suffix=re.sub(r"^.*?(?:(?:operations)|(?:period)|(?:tax)|(?:diluted)|(?:expended)|(?:earned))\b",
                      "",stripped,flags=re.I)
        values=numeric_cells(suffix)
        if len(values)>=3 and len(values)<=9:
            found.append((line,values))
    if not found:
        raise ValueError("NO_SAME_ROW_MULTICOLUMN_"+metric)
    distinct={tuple(v) for _,v in found}
    if len(distinct)!=1:
        raise ValueError("CONFLICTING_ROWS_"+metric)
    return found[0]

def extract(raw, symbol, issuer, period, expected_cin=None):
    if not raw.startswith(b"%PDF") or len(raw)>12_000_000:
        raise ValueError("PDF_BYTES_INVALID")
    pdf=fitz.open(stream=raw,filetype="pdf")
    if not 1<=len(pdf)<=100:
        raise ValueError("PDF_PAGE_COUNT_INVALID")
    outcomes=[]
    for page_no in range(min(len(pdf),40)):
        text=pdf[page_no].get_text("text",sort=True)
        lines=[" ".join(x.split()) for x in text.splitlines() if x.strip()]
        if len(lines)<8:
            continue
        title=" ".join(lines[:65]).upper()
        if not ("FINANCIAL RESULTS" in title and "QUARTER" in title):
            continue
        if not any(form in title for form in date_forms(period)):
            continue
        # Explicit scope and unit must be on this actual financial-statement page.
        if re.search(r"\bCONSOLIDATED\b",title):
            scope="CONSOLIDATED"
        elif re.search(r"\bSTANDALONE\b",title):
            scope="STANDALONE"
        else:
            continue
        if re.search(r"\bLAKHS?\b",title):
            original_unit, divisor = "INR_LAKH", Decimal(100)
        elif re.search(r"\bMILLIONS?\b",title):
            original_unit, divisor = "INR_MILLION", Decimal(10)
        elif re.search(r"\bCRORES?\b",title):
            original_unit, divisor = "INR_CRORE", Decimal(1)
        else:
            continue
        # Prove legal issuer from the document, not the BSE scrip lookup alone.
        cover=" ".join(pdf[i].get_text("text",sort=True)[:3500]
                       for i in range(min(page_no+1,3))).upper()
        if not issuer_identity(issuer,cover+" "+title):
            continue
        all_head=" ".join(lines[:90]).upper()
        if "QUARTER ENDED" not in all_head and "QUARTERS ENDED" not in all_head:
            continue
        first_header=all_head.split("QUARTER ENDED",1)[-1][:240]
        # Older columns must not be mistaken for the requested single quarter.
        if not any(x in first_header for x in date_forms(period)):
            continue
        # A recognizable date is necessary but not sufficient for table column order.
        # Require it among the first 120 chars after the QUARTER ENDED heading.
        if not any(x in first_header[:120] for x in date_forms(period)):
            continue
        bank=symbol in BANKS
        insurer=symbol in INSURERS
        if insurer:
            revenue_row,revenue_values=financial_row(lines,
                [r"^(?:net\s+)?premium(?:s)?\s+earned\b"],"PREMIUM")
            revenue_code="NET_PREMIUM_EARNED_QUARTER"
        elif bank:
            earned_line,earned=financial_row(lines,[r"^interest\s+earned\b"],"INTEREST_EARNED")
            spent_line,spent=financial_row(lines,[r"^interest\s+expended\b"],"INTEREST_EXPENDED")
            revenue_row=earned_line+" || "+spent_line
            revenue_values=[earned[0]-spent[0]]
            revenue_code="NET_INTEREST_INCOME_QUARTER"
        else:
            revenue_row,revenue_values=financial_row(lines,
                [r"^(?:revenue|income)\s+from\s+operations\b"],"REVENUE")
            revenue_code="OPERATING_REVENUE_QUARTER"
        profit_row,profit=financial_row(lines,
            [r"^(?:net\s+)?profit\s*(?:/|\()\s*loss.*\b(?:period|tax)\b",
             r"^(?:net\s+)?profit\s+(?:after\s+tax|for\s+the\s+period)\b",
             r"^profit\s+after\s+tax\b"],"PROFIT")
        eps_row,eps=financial_row(lines,
            [r"^(?:\(?2\)?\s*)?diluted\s*(?:earnings\s+per\s+share|eps|\(rs)",
             r"^earnings\s+per\s+share\s*\(?diluted\)?"],"DILUTED_EPS")
        vals={
            revenue_code: (revenue_values[0]/divisor,"INR_CRORE",original_unit,revenue_row),
            "NET_PROFIT_QUARTER":(profit[0]/divisor,"INR_CRORE",original_unit,profit_row),
            "EPS_DILUTED":(eps[0],"INR_PER_SHARE","INR_PER_SHARE",eps_row)
        }
        if any(not x[0].is_finite() for x in vals.values()):
            raise ValueError("NON_FINITE_FINANCIAL_FACT")
        facts={code:{"value":str(val),"unit":unit,"original_unit":orig,
                     "evidence_line":line[:800],"page":page_no+1,"column_index":0}
               for code,(val,unit,orig,line) in vals.items()}
        if bank:
            facts[revenue_code]["component_values"]=[str(earned[0]),str(spent[0])]
        outcomes.append({"scope":scope,"page":page_no+1,"unit":original_unit,
                         "first_column_period":period,"facts":facts,
                         "issuer_name":issuer,"identity_match":"CONTIGUOUS_LEGAL_NAME"})
    if not outcomes:
        raise ValueError("NO_SINGLE_QUARTER_ISSUER_SCOPE_TRIO")
    scopes={o["scope"] for o in outcomes}
    preferred="CONSOLIDATED" if "CONSOLIDATED" in scopes else "STANDALONE"
    options=[o for o in outcomes if o["scope"]==preferred]
    if len({canonical(o["facts"]) for o in options})!=1:
        raise ValueError("AMBIGUOUS_SAME_SCOPE_STATEMENTS")
    return options[0]

def r2_client():
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch(r"[0-9a-f]{32}",account):
        endpoint="https://"+account+".r2.cloudflarestorage.com"
    elif re.fullmatch(r"https://[0-9a-f]{32}\.r2\.cloudflarestorage\.com/?",account):
        endpoint=account.rstrip("/")
    else:
        raise RuntimeError("INVALID_DEV_R2_ACCOUNT")
    return boto3.client("s3",endpoint_url=endpoint,
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",config=Config(retries={"max_attempts":2,"mode":"standard"}))

def immutable_put(client,key,raw):
    try:
        old=client.get_object(Bucket=BUCKET,Key=key)["Body"].read()
        if old!=raw: raise RuntimeError("IMMUTABLE_R2_CONTENT_CONFLICT")
    except Exception as e:
        code=getattr(e,"response",{}).get("Error",{}).get("Code")
        if code not in ("404","NoSuchKey","NotFound"):
            raise
        client.put_object(Bucket=BUCKET,Key=key,Body=raw,IfNoneMatch="*")
    check=client.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    if sha(check)!=sha(raw):
        raise RuntimeError("R2_POST_WRITE_HASH_MISMATCH")

def persist(db,client,row,period,source,raw,parsed,publication):
    symbol,isin,sid,name,code=row
    original_sha=sha(raw)
    root=PREFIX+f"security_id={isin}/period_end={period}/"
    original_key=root+f"original_version={original_sha}/issuer-original.pdf"
    immutable_put(client,original_key,raw)
    manifest={
        "contract":CONTRACT,"symbol":symbol,"isin":isin,"issuer_name":name,
        "bse_scrip_code":code,"period_start":WINDOWS[period][0],"period_end":period,
        "consolidation_scope":parsed["scope"],"reporting_currency":"INR",
        "issuer_filing_url":source["source_url"],"original_sha256_retained":original_sha,
        "original_r2_key":original_key,"original_pdf_retained":True,
        "publication_time_bse":publication,"publication_precision":"BSE_CATALOG_AS_RETRIEVED",
        "source_identity_proof":"CANONICAL_BSE_SCRIP_ISIN_AND_CONTIGUOUS_ISSUER_NAME",
        "financial_page":parsed["page"],"first_column_period":period,
        "original_unit":parsed["unit"],"facts":parsed["facts"],
        "historical_eps_reporting_basis":"AS_FILED_NOT_RETROSPECTIVELY_ADJUSTED",
        "historical_share_adjustment_authorized":False,
        "figures_review_pending":True,
    }
    manifestbytes=canonical(manifest)
    manifesthash=sha(manifestbytes)
    key=root+f"source_version={manifesthash}/manifest.json"
    immutable_put(client,key,manifestbytes)
    payload={**manifest,"r2_key":key,"r2_manifest_sha256":manifesthash}
    recordhash=sha(canonical(payload))
    with db.cursor() as cur:
        cur.execute("""INSERT INTO public.data_source_records
        (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
        VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
        ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
        DO NOTHING RETURNING id""",
        (SOURCE,KIND,symbol+":"+original_sha,source["source_url"],recordhash,
         canonical(payload).decode(),
         '{"retention":"ORIGINAL_PDF_IMMUTABLE_R2","qualifier":"R4_INDEPENDENT_SOURCE_SELECTION"}'))
        saved=cur.fetchone()
        if saved: source_id=saved[0]
        else:
            cur.execute("""SELECT id FROM public.data_source_records
                WHERE source_code=%s AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
                (SOURCE,KIND,symbol+":"+original_sha,recordhash))
            found=cur.fetchone()
            if not found: raise RuntimeError("SOURCE_READBACK_FAILED")
            source_id=found[0]
        new=0
        for metric,f in parsed["facts"].items():
            cur.execute("""INSERT INTO public.fundamental_observations
              (security_id,metric_code,source_record_id,source_code,numeric_value,
               currency,unit,period_start,period_end,period_type,consolidation_scope,
               retrieved_at,fresh_until,evidence_status)
              VALUES (%s,%s,%s,%s,%s,'INR',%s,%s,%s,'QUARTER',%s,
                      now(),now()+interval '120 days','AVAILABLE')
              ON CONFLICT (security_id,metric_code,source_code,period_end,
                           period_type,consolidation_scope,source_record_id)
              DO NOTHING RETURNING id""",
              (sid,metric,source_id,SOURCE,Decimal(f["value"]),f["unit"],
               WINDOWS[period][0],period,parsed["scope"]))
            if cur.fetchone():new+=1
    db.commit()
    return new

def candidates(db):
    with db.cursor() as cur:
        cur.execute("""SELECT DISTINCT s.symbol,s.isin,s.id,s.name
          FROM public.transactions t JOIN public.securities s ON s.id=t.security_id
          WHERE t.portfolio_id=%s AND t.superseded_at IS NULL
          AND s.asset_class='EQUITY' AND s.isin IS NOT NULL ORDER BY s.symbol""",
          (PORTFOLIO,))
        securities=cur.fetchall()
        cur.execute("""SELECT DISTINCT d.security_id,d.period_end,
                  d.consolidation_scope,fo.source_record_id,d.metric_code
           FROM public.fundamental_observation_decisions d
           JOIN public.fundamental_observations fo ON fo.id=d.selected_observation_id
           WHERE d.period_end=ANY(%s::date[]) AND d.period_type='QUARTER'
             AND fo.source_code='COMPANY_EXCHANGE_FILING'""", (list(WINDOWS),))
        groups={}
        for sid,period,scope,source,metric in cur.fetchall():
            groups.setdefault((sid,str(period),scope,source),set()).add(metric)
    out=[]
    for symbol,isin,sid,name in securities:
        needed=({"NET_INTEREST_INCOME_QUARTER" if symbol in BANKS else
                 "NET_PREMIUM_EARNED_QUARTER" if symbol in INSURERS else
                 "OPERATING_REVENUE_QUARTER"} | {"NET_PROFIT_QUARTER","EPS_DILUTED"})
        missing=[p for p in WINDOWS if not any(
            required.issuperset(needed) for (sec,end,_scope,_src),required in groups.items()
            if sec==sid and end==p)]
        if missing:out.append((symbol,isin,sid,name,missing))
    return out

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--max-companies",type=int,default=24)
    parser.add_argument("--shard-index",type=int,default=0)
    parser.add_argument("--shard-count",type=int,default=4)
    parser.add_argument("--max-pdfs-per-quarter",type=int,default=3)
    parser.add_argument("--symbols",default="")
    parser.add_argument("--output",default="tmp/results-r4/bse-batch.json")
    args=parser.parse_args()
    if not 1<=args.max_companies<=262 or not 1<=args.shard_count<=8 or not 0<=args.shard_index<args.shard_count or not 1<=args.max_pdfs_per_quarter<=5:
        raise SystemExit("UNBOUNDED_BATCH_REFUSED")
    url=os.getenv("SUPABASE_DB_URL","")
    if REF not in url or os.getenv("CLOUDFLARE_R2_BUCKET")!=BUCKET:
        raise SystemExit("DEVELOPMENT_ONLY")
    if args.apply and os.getenv("RESULTS_R4_BSE_BATCH_ACK")!="2024_2025_BSE_ORIGINAL_EVIDENCE":
        raise SystemExit("WRITES_NOT_AUTHORIZED")
    with psycopg.connect(url,autocommit=False) as db:
        universe=candidates(db);db.rollback()
        explicit={x.strip().upper() for x in args.symbols.split(",") if x.strip()}
        if explicit:universe=[c for c in universe if c[0] in explicit]
        else:universe=[c for i,c in enumerate(universe) if i%args.shard_count==args.shard_index]
        universe=universe[:args.max_companies]
        client=r2_client() if args.apply else None
        counts=Counter()
        outcomes=[]
        with PortfolioBSE() as bse:
            for symbol,isin,sid,name,periods in universe:
                company={"symbol":symbol,"unresolved_periods":periods,"results":[]}
                try:
                    scrip=bse.get_scrip_candidate(symbol)["bse_scrip_code"]
                    meta=bse._bse.equityMetaInfo(scrip)
                    if not isinstance(meta,dict) or meta.get("ISIN")!=isin or str(meta.get("SecurityCode"))!=scrip:
                        raise ValueError("BSE_CANONICAL_IDENTITY_MISMATCH")
                    for period in periods:
                        start,end=WINDOWS[period][1:]
                        entry={"period":period}
                        try:
                            discovery=bse.financial_announcements(scrip,
                                date.fromisoformat(start),date.fromisoformat(end),max_pages=5)
                            approved=[]
                            rejects=Counter()
                            for attempt,src in enumerate(discovery["results"]):
                                if attempt>=args.max_pdfs_per_quarter:break
                                if not src.get("attachment_name"):continue
                                try:
                                    raw,origin=bse.retrieve_original_pdf(src["attachment_name"])
                                    parsed=extract(raw,symbol,name,period)
                                    approved.append((src,raw,origin,parsed))
                                except (ValueError,fitz.FileDataError,RuntimeError) as e:
                                    rejects[str(e)[:85]]+=1
                            entry["candidates"]=len(discovery["results"])
                            entry["rejection_counts"]=dict(rejects)
                            if not approved:
                                entry["status"]="NO_UNAMBIGUOUS_ORIGINAL_TRIO"
                            else:
                                compatible={}
                                for src,raw,origin,parsed in approved:
                                    key=(parsed["scope"],tuple(sorted(
                                        (metric,f["value"]) for metric,f in parsed["facts"].items())))
                                    compatible.setdefault(parsed["scope"],set()).add(key[1])
                                if any(len(v)>1 for v in compatible.values()):
                                    entry["status"]="COMPETING_OFFICIAL_VERSIONS_REVIEW"
                                else:
                                    src,raw,origin,parsed=(next(
                                        (x for x in approved if x[3]["scope"]=="CONSOLIDATED"),approved[0]))
                                    entry.update(status="SOURCE_TRIO_QUALIFIED",scope=parsed["scope"],
                                        sha256=sha(raw),source_url=origin["source_url"],
                                        metric_values={k:v["value"] for k,v in parsed["facts"].items()})
                                    if args.apply:
                                        entry["facts_inserted"]=persist(db,client,
                                           (symbol,isin,sid,name,scrip),period,origin,raw,parsed,
                                           src.get("published_at"))
                                        counts["facts_inserted"]+=entry["facts_inserted"]
                            counts[entry["status"]]+=1
                        except Exception as e:
                            db.rollback()
                            entry.update(status="SOURCE_RETRIEVAL_OR_PARSE_ERROR",error=str(e)[:150])
                            counts["SOURCE_RETRIEVAL_OR_PARSE_ERROR"]+=1
                        company["results"].append(entry)
                except Exception as e:
                    db.rollback()
                    company["error"]=str(e)[:140]
                    counts["ISSUER_LOOKUP_FAILED"]+=1
                outcomes.append(company)
                print("R4_BSE_BATCH_PROGRESS="+json.dumps({"symbol":symbol,"counts":dict(counts)}),flush=True)
                time.sleep(.3)
    result={"mode":"APPLY" if args.apply else "DRY_RUN","shard_index":args.shard_index,
            "companies_checked":len(outcomes),"counts":dict(counts),"companies":outcomes,
            "originals_are_required_for_selection":True,"trendlyne_unqualified_is_not_auto_promoted":True}
    dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,indent=2,sort_keys=True),encoding="utf-8")
    print("R4_BSE_BATCH_FINAL="+json.dumps({k:result[k] for k in ("companies_checked","counts","mode","shard_index")},sort_keys=True))

if __name__=="__main__":
    main()
