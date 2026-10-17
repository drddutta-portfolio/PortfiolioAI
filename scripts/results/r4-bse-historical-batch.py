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
from r4_recovery_queue import task_id

import boto3
import fitz
import psycopg
from botocore.config import Config

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE
from r4_pdf_geometry import extract_page
from r4_issuer_name import explicit_legal_name,exact_legal_identity

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

def verified_issuer(bse, scrip, isin):
    """Resolve the legal name from an exact BSE code/ISIN listing, not a ticker."""
    rows=bse._bse.listSecurities(scripcode=scrip,group="")
    if not isinstance(rows,list):
        raise ValueError("BSE_LISTING_SCHEMA_UNKNOWN")
    matches=[r for r in rows if isinstance(r,dict)
             and str(r.get("SCRIP_CD"))==scrip and r.get("ISIN_NUMBER")==isin]
    if len(matches)!=1:
        raise ValueError("BSE_LISTING_IDENTITY_NOT_UNIQUE")
    name=matches[0].get("Issuer_Name")
    if not isinstance(name,str) or (len(name_tokens(name))<2 and not explicit_legal_name(name)):
        raise ValueError("BSE_VERIFIED_LEGAL_NAME_MISSING")
    return name

def first_quarter_header(lines, period):
    """Require a real multi-date header; a date in the title is insufficient.

    This contract admits the first quarter column only. Nonfirst historical
    columns and annual/cumulative-only layouts remain explicit parser rejects.
    """
    pattern=re.compile(r"\b\d{2}[./-]\d{2}[./-](?:20\d{2}|\d{2})\b|"
                       r"\b\d{1,2}[- ](?:JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)[- ,]+20\d{2}\b|"
                       r"\b(?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER) \d{1,2},? 20\d{2}\b",re.I)
    for i,line in enumerate(lines):
        dates=list(pattern.finditer(line.upper()))
        if len(dates)<3:
            continue
        context=" ".join(lines[max(0,i-3):i+1]).upper()
        if not re.search(r"(?:QUARTERS?\s+ENDED|THREE\s+MONTHS?\s+ENDED)",context):
            continue
        # A cumulative heading to the left must never be called a quarter.
        before=line[:dates[0].start()].upper()
        if re.search(r"(?:YEAR|NINE|SIX|HALF).*ENDED",before):
            continue
        if dates[0].group() in date_forms(period):
            return line
    raise ValueError("FIRST_QUARTER_COLUMN_UNPROVEN")

def issuer_identity(name, cover):
    if exact_legal_identity(name,cover[:7000]):return True
    a=name_tokens(name)
    b=name_tokens(cover[:3500])
    if len(a)<2:
        return exact_legal_identity(name,cover[:7000])
    # Contiguous legal-name prefix, no loose unordered company-name guessing.
    return any(b[i:i+len(a)]==a for i in range(len(b)-len(a)+1))

def date_forms(period):
    d=date.fromisoformat(period)
    return (d.strftime("%d.%m.%Y"), d.strftime("%d-%m-%Y"),
            d.strftime("%d/%m/%Y"), d.strftime("%d %B %Y").upper(),
            d.strftime("%B %d, %Y").upper(), d.strftime("%d-%b-%Y").upper(),
            d.strftime("%d %b %Y").upper(), d.strftime("%d-%m-%y"),
            d.strftime("%d %B, %Y").upper(),
            d.strftime("%d-%B-%Y").upper(),
            d.strftime("%d %b, %Y").upper(),
            d.strftime("%B %d %Y").upper())

def numeric_cells(row):
    # Match Indian and international group separators without truncating 2,48,893.
    return [Decimal(m.group(0).replace(",", "").replace("(", "-").replace(")", ""))
            for m in NUM.finditer(row) if m.group(0).strip() not in ("-", "")]

def geometry_rows(page):
    """Use PyMuPDF physical text locations when table cells are separate blocks.
    No OCR, guesses across rows, or nearest-neighbour column interpolation.
    """
    words=[w for w in page.get_text("words",sort=True)
           if len(w)>4 and str(w[4]).strip()]
    words.sort(key=lambda w: ((w[1]+w[3])/2, w[0]))
    rows=[]
    for w in words:
        middle=(w[1]+w[3])/2
        # Geometrically exact table row, not a text-order concatenation.
        if not rows or abs(middle-rows[-1][0])>2.6:
            rows.append([middle,[w]])
        else:
            rows[-1][1].append(w)
    return [" ".join(str(w[4]) for w in sorted(group,key=lambda x:x[0]))
            for _middle,group in rows if len(group)>2]

def financial_row(lines, labels, metric):
    found=[]
    for i,line in enumerate(lines):
        stripped=re.sub(r"^\s*(?:\(?\d{1,2}\)?[.)-]?|[IVX]{1,5}[.)-]?|\([a-z]\))\s*", "",line).strip()
        if not any(re.match(p,stripped,re.I) for p in labels):
            continue
        # Same-text-row only: no unsafe transfer from adjacent statement rows.
        suffix=re.sub(r"^.*?(?:(?:operations)|(?:period)|(?:tax)|(?:diluted)|(?:expended)|(?:earned))\b",
                      "",stripped,flags=re.I)
        suffix=re.sub(r"\(\s*\d{1,2}\s*[-+−•]\s*\d{1,2}\s*\)","",suffix)
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
    if not raw.startswith(b"%PDF") or len(raw)>32_000_000:
        raise ValueError("PDF_BYTES_INVALID")
    pdf=fitz.open(stream=raw,filetype="pdf")
    if not 1<=len(pdf)<=100:
        raise ValueError("PDF_PAGE_COUNT_INVALID")
    outcomes=[]
    diagnostics=Counter()
    geometric=[]
    for page_no in range(min(len(pdf),40)):
        try:
            parsed=extract_page(pdf[page_no],page_no+1,period,symbol in BANKS,symbol in INSURERS)
            cover=" ".join(pdf[i].get_text("text",sort=True)[:5000]
                           for i in range(min(3,len(pdf))))
            if not issuer_identity(issuer,cover+" "+parsed["header_evidence"]):
                raise ValueError("ISSUER_LEGAL_NAME_NOT_CONFIRMED")
            geometric.append(parsed)
        except ValueError as error:
            diagnostics[str(error)]+=1
    if geometric:
        preferred="CONSOLIDATED" if any(p["scope"]=="CONSOLIDATED" for p in geometric) else "STANDALONE"
        choices=[p for p in geometric if p["scope"]==preferred]
        if len({tuple(sorted((k,f["value"]) for k,f in p["facts"].items())) for p in choices})!=1:
            raise ValueError("AMBIGUOUS_SAME_SCOPE_GEOMETRIC_STATEMENTS")
        return choices[0]
    for page_no in range(min(len(pdf),40)):
        text=pdf[page_no].get_text("text",sort=True)
        lines=[" ".join(x.split()) for x in text.splitlines() if x.strip()]
        geometry=geometry_rows(pdf[page_no])
        financial_lines=lines+geometry
        if len(lines)<6:
            diagnostics["TEXT_TOO_SHORT"]+=1
            continue
        title=" ".join(lines[:65]).upper()
        if not ("FINANCIAL RESULTS" in title and "QUARTER" in title):
            diagnostics["NOT_A_FINANCIAL_TABLE_PAGE"]+=1
            continue
        if not any(form in title for form in date_forms(period)):
            diagnostics["QUARTER_DATE_NOT_DETECTED"]+=1
            continue
        # Explicit scope and unit must be on this actual financial-statement page.
        if re.search(r"\bCONSOLIDATED\b",title) and re.search(r"\bSTANDALONE\b",title):
            # Combined statement announcements may carry two independent tables.
            # Never choose a consolidated heading on a standalone table.
            diagnostics["MIXED_SCOPE_HEADING"]+=1
            continue
        if re.search(r"\bCONSOLIDATED\b",title):
            scope="CONSOLIDATED"
        elif re.search(r"\bSTANDALONE\b",title):
            scope="STANDALONE"
        else:
            diagnostics["SCOPE_NOT_DETECTED"]+=1
            continue
        if re.search(r"\bLAKHS?\b",title):
            original_unit, divisor = "INR_LAKH", Decimal(100)
        elif re.search(r"\bMILLIONS?\b",title):
            original_unit, divisor = "INR_MILLION", Decimal(10)
        elif re.search(r"\bCRORES?\b",title):
            original_unit, divisor = "INR_CRORE", Decimal(1)
        else:
            diagnostics["UNIT_NOT_DETECTED"]+=1
            continue
        # Prove legal issuer from the document, not the BSE scrip lookup alone.
        cover=" ".join(pdf[i].get_text("text",sort=True)[:3500]
                       for i in range(min(page_no+1,3))).upper()
        if not issuer_identity(issuer,cover+" "+title):
            diagnostics["ISSUER_LEGAL_NAME_NOT_CONFIRMED"]+=1
            continue
        all_head=" ".join(lines[:90]).upper()
        if "QUARTER ENDED" not in all_head and "QUARTERS ENDED" not in all_head:
            diagnostics["QUARTER_COLUMN_HEADER_MISSING"]+=1
            continue
        try:
            first_header=first_quarter_header(geometry+lines,period)
        except ValueError as error:
            diagnostics[str(error)]+=1
            continue
        # Older columns must not be mistaken for the requested single quarter.
        if not any(x in first_header for x in date_forms(period)):
            diagnostics["PERIOD_NOT_IN_QUARTER_COLUMNS"]+=1
            continue
        # A recognizable date is necessary but not sufficient for table column order.
        # Require it among the first 120 chars after the QUARTER ENDED heading.
        if not any(x in first_header[:180] for x in date_forms(period)):
            diagnostics["FIRST_QUARTER_COLUMN_UNPROVEN"]+=1
            continue
        try:
            bank=symbol in BANKS
            insurer=symbol in INSURERS
            if insurer:
                revenue_row,revenue_values=financial_row(financial_lines,
                    [r"^(?:net\s+)?premium(?:s)?\s+earned\b"],"PREMIUM")
                revenue_code="NET_PREMIUM_EARNED_QUARTER"
            elif bank:
                earned_line,earned=financial_row(financial_lines,[r"^interest\s+earned\b"],"INTEREST_EARNED")
                spent_line,spent=financial_row(financial_lines,[r"^interest\s+expended\b"],"INTEREST_EXPENDED")
                revenue_row=earned_line+" || "+spent_line
                revenue_values=[earned[0]-spent[0]]
                revenue_code="NET_INTEREST_INCOME_QUARTER"
            else:
                revenue_row,revenue_values=financial_row(financial_lines,
                    [r"^(?:revenue|income)\s+from\s+operations\b"],"REVENUE")
                revenue_code="OPERATING_REVENUE_QUARTER"
            profit_row,profit=financial_row(financial_lines,
                [r"^(?:net\s+)?profit\s*(?:/|\()\s*loss.*\b(?:period|tax)\b",
                 r"^(?:net\s+)?profit\s+(?:after\s+tax|for\s+the\s+period)\b",
                 r"^profit\s+after\s+tax\b"],"PROFIT")
            eps_row,eps=financial_row(financial_lines,
                [r"^(?:\(?2\)?\s*)?diluted\s*(?:earnings\s+per\s+share|eps|\(rs)",
                 r"^earnings\s+per\s+share\s*\(?diluted\)?", r"^diluted\b"],"DILUTED_EPS")
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
        except ValueError as error:
            diagnostics[str(error)]+=1
            continue
    if not outcomes:
        reason=";".join(k+":"+str(v) for k,v in diagnostics.most_common(4))
        raise ValueError("NO_SINGLE_QUARTER_TRIO:"+reason)
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

def retained_original(bse,client,filename):
    """Reuse immutable original bytes even when a previous parser rejected them."""
    index_key=PREFIX+"bse-source-cache/"+filename+".json"
    fresh=os.getenv("RESULTS_R4_FORCE_FRESH")=="1"
    if fresh:
        run=os.getenv("GITHUB_RUN_ID","")
        attempt=os.getenv("GITHUB_RUN_ATTEMPT","")
        if not re.fullmatch(r"[0-9]+",run) or not re.fullmatch(r"[0-9]+",attempt):
            raise RuntimeError("FRESH_CAPTURE_RUN_ID_REQUIRED")
        index_key=PREFIX+"bse-fresh-source-captures/run="+run+"/attempt="+attempt+"/"+filename+".json"
    if client and not fresh:
        try:
            origin=json.loads(client.get_object(Bucket=BUCKET,Key=index_key)["Body"].read())
            raw=client.get_object(Bucket=BUCKET,Key=origin["original_r2_key"])["Body"].read()
            if sha(raw)!=origin["sha256"] or origin.get("attachment_name")!=filename:
                raise RuntimeError("CACHED_ORIGINAL_HASH_OR_IDENTITY_MISMATCH")
            return raw,origin,True
        except Exception as error:
            code=getattr(error,"response",{}).get("Error",{}).get("Code")
            if code not in ("404","NoSuchKey","NotFound"):raise
    raw,origin=bse.retrieve_original_pdf(filename,max_bytes=32_000_000)
    if client:
        key=PREFIX+"evidence/original_version="+sha(raw)+"/issuer-original.pdf"
        immutable_put(client,key,raw)
        origin={**origin,"original_r2_key":key}
        immutable_put(client,index_key,canonical(origin))
    return raw,origin,False

def persist(db,client,row,period,source,raw,parsed,publication):
    symbol,isin,sid,name,code=row
    original_sha=sha(raw)
    root=PREFIX+f"security_id={isin}/period_end={period}/"
    original_key=parsed.get("original_r2_key",root+f"original_version={original_sha}/issuer-original.pdf")
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
        "parser_revision":parsed.get("parser_revision","LEGACY_SAME_ROW_V2"),
        "supersedes_parser_source_id":parsed.get("supersedes_parser_source_id"),
        "parser_correction_reason":parsed.get("parser_correction_reason"),
        "ocr_independent_checks":parsed.get("ocr_independent_checks"),
        "ocr_proof_r2_key":parsed.get("ocr_proof_r2_key"),
    }
    if parsed.get("parser_revision") in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1"):
        manifest.update({key:parsed[key] for key in ("first_column_period","selected_column_period","selected_column_index","issuer_identity_evidence_r2_key","issuer_identity_evidence_sha256","source_reporting_basis")})
        manifest["historical_eps_reporting_basis"]="AS_REPORTED_IN_SELECTED_FILING_COMPARABILITY_UNPROVEN"
        if parsed.get("scope_evidence_basis") is not None:manifest["scope_evidence_basis"]=parsed["scope_evidence_basis"]
        if parsed.get("parser_revision")=="PDF_OCR_EXPLICIT_DATED_COLUMN_V1":
            manifest.update({key:parsed[key] for key in ("ocr_document_text_sha256","ocr_document_audit_r2_key")})
            manifest["ocr_render_dpi"]=parsed.get("ocr_render_dpi",[300,450])
            manifest["ocr_segmentation_mode"]=parsed.get("ocr_segmentation_mode",3)
            manifest["ocr_header_basis"]=parsed.get("ocr_header_basis","RENDERED_HEADERS_ONLY")
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

def fresh_trendlyne_bse_sources(db,client,sid,period):
    """Use fresh provider citations only as discovery; never import their figures."""
    with db.cursor() as cur:
        cur.execute("""SELECT raw_payload->>'r2_key',raw_payload->>'sha256'
          FROM data_source_records WHERE record_kind='RESULTS_R4_HISTORY_CAPTURE_V2'
            AND raw_payload->>'fresh_request'='true'
            AND raw_payload->'request'->>'tool'='get_document_search_results'
            AND raw_payload->'request'->>'securityId'=%s
            AND position(%s in (raw_payload->'request'->'args'->>'query'))>0
            AND retrieved_at>=now()-interval '24 hours'
          ORDER BY retrieved_at DESC LIMIT 16""",(str(sid),period))
        captures=cur.fetchall()
    db.rollback()
    found={}
    pattern=re.compile(r"https://www\.bseindia\.com/xml-data/corpfiling/(?:AttachHis|AttachLive)/"
        r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf)\b",re.I)
    for key,digest in captures:
        raw=client.get_object(Bucket=BUCKET,Key=key)["Body"].read()
        if sha(raw)!=digest:raise RuntimeError("TRENDLYNE_CAPTURE_HASH_MISMATCH")
        result=json.loads(raw).get("result")
        for filename in pattern.findall(json.dumps(result).replace(r"\/","/")):
            found.setdefault(filename.lower(),{"attachment_name":filename,"title":"financial results original cited in fresh provider discovery",
                "published_at":None,"discovery_capture_r2_key":key})
    return list(found.values())[:20]

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
    if not 1<=args.max_companies<=262 or not 1<=args.shard_count<=8 or not 0<=args.shard_index<args.shard_count or not 1<=args.max_pdfs_per_quarter<=50:
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
        else:universe=[c for c in universe if int(task_id(c[2],"BSE",None,{}),16)%args.shard_count==args.shard_index]
        universe=universe[:args.max_companies]
        client=r2_client() if args.apply else None
        counts=Counter()
        outcomes=[]
        pdf_cache={}
        with PortfolioBSE() as bse:
            for symbol,isin,sid,name,periods in universe:
                company={"symbol":symbol,"unresolved_periods":periods,"results":[]}
                try:
                    scrip=bse.get_scrip_candidate(symbol)["bse_scrip_code"]
                    meta=bse._bse.equityMetaInfo(scrip)
                    if not isinstance(meta,dict) or meta.get("ISIN")!=isin or str(meta.get("SecurityCode"))!=scrip:
                        raise ValueError("BSE_CANONICAL_IDENTITY_MISMATCH")
                    legal_name=verified_issuer(bse,scrip,isin)
                    for period in periods:
                        start,end=WINDOWS[period][1:]
                        entry={"period":period}
                        try:
                            discovery=bse.financial_announcements(scrip,
                                date.fromisoformat(start),date.fromisoformat(end),max_pages=5)
                            approved=[]
                            rejects=Counter()
                            entry["sources"]=[]
                            priority=lambda src: (
                                1 if re.search(r"newspaper|press release|presentation|advertisement|media release",str(src.get("title","")),re.I) else 0,
                                0 if re.search(r"(?:unaudited|audited)\s+(?:standalone|consolidated)|financial results|board meeting outcome",str(src.get("title","")),re.I) else 1
                            )
                            ordered=sorted(discovery["results"],key=priority)
                            if os.getenv("RESULTS_R4_USE_FRESH_TRENDLYNE_LINKS")=="1":
                                try:extra=fresh_trendlyne_bse_sources(db,client,sid,period)
                                except Exception:
                                    db.rollback();extra=[];counts["fresh_trendlyne_link_read_failed"]+=1
                                counts["fresh_trendlyne_original_links"]+=len(extra)
                                seen=set()
                                ordered=[src for src in extra+ordered if src.get("attachment_name")
                                    and not (src["attachment_name"] in seen or seen.add(src["attachment_name"]))]
                            for attempt,src in enumerate(ordered):
                                if attempt>=args.max_pdfs_per_quarter:break
                                if not src.get("attachment_name"):continue
                                try:
                                    filename=src["attachment_name"]
                                    if filename not in pdf_cache:
                                        raw,origin,reused=retained_original(bse,client,filename)
                                        pdf_cache[filename]=(raw,origin)
                                        counts["original_pdfs_reused" if reused else "original_pdfs_retrieved"]+=1
                                    raw,origin=pdf_cache[filename]
                                    entry["sources"].append({"attachment_name":filename,
                                        "sha256":sha(raw),"original_r2_key":origin.get("original_r2_key")})
                                    parsed=extract(raw,symbol,legal_name,period)
                                    if origin.get("original_r2_key"):
                                        parsed["original_r2_key"]=origin["original_r2_key"]
                                    approved.append((src,raw,origin,parsed))
                                except Exception as e:
                                    rejects[type(e).__name__+":"+str(e)[:250]]+=1
                                    entry.setdefault("source_errors",[]).append({"attachment_name":src.get("attachment_name"),
                                        "status":"REVIEW_REQUIRED" if isinstance(e,(ValueError,fitz.FileDataError)) else "RETRY_REQUIRED",
                                        "reason":type(e).__name__+":"+str(e)[:250]})
                            entry["candidates"]=len(discovery["results"])
                            entry["candidate_limit_reached"]=len(ordered)>args.max_pdfs_per_quarter
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
                                           (symbol,isin,sid,legal_name,scrip),period,origin,raw,parsed,
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
                checkpoint=Path(args.output)
                checkpoint.parent.mkdir(parents=True,exist_ok=True)
                checkpoint.write_text(json.dumps({"in_progress":True,
                    "counts":dict(counts),"companies":outcomes},default=str),encoding="utf-8")
                if client:
                    trace=checkpoint.read_bytes()
                    immutable_put(client,PREFIX+"private-recovery-traces/sha256="+sha(trace)+"/bse.json",trace)
                print("R4_BSE_BATCH_PROGRESS="+json.dumps({"companies_processed":len(outcomes),"counts":dict(counts)}),flush=True)
                time.sleep(.3)
    result={"mode":"APPLY" if args.apply else "DRY_RUN","shard_index":args.shard_index,
            "companies_checked":len(outcomes),"counts":dict(counts),"companies":outcomes,
            "originals_are_required_for_selection":True,"trendlyne_unqualified_is_not_auto_promoted":True}
    dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,indent=2,sort_keys=True),encoding="utf-8")
    print("R4_BSE_BATCH_FINAL="+json.dumps({k:result[k] for k in ("companies_checked","counts","mode","shard_index")},sort_keys=True))

if __name__=="__main__":
    main()
