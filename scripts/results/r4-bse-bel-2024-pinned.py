#!/usr/bin/env python3
"""One-company source-pinned R4 rescue for official BSE BEL Sep-2024 PDF."""
from __future__ import annotations
import hashlib,importlib.util,json,os,re
from pathlib import Path
from decimal import Decimal
import psycopg
import fitz
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("r4_bse_batch",HERE/"r4-bse-historical-batch.py")
batch=importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)

SYMBOL="BEL"
ISIN="INE263A01024"
CODE="500049"
COMPANY="Bharat Electronics Limited"
DATE="2024-09-30"
FILE="2c66684c-6ab1-4b53-a142-887e4f092ef0.pdf"
EXPECTED_HASH="a0cf85d451ba3f0cffa9c74c7a21757cda273f9425c506d6750b2da8e330ac56"
URL="https://www.bseindia.com/xml-data/corpfiling/AttachHis/"+FILE
CIN="L32309KA1954GOI000787"
EXPECTED={"OPERATING_REVENUE_QUARTER":("4604.90","4,60,490"),
          "NET_PROFIT_QUARTER":("1092.78","1,09,278"),
          "EPS_DILUTED":("1.50","1 50")}

def qualify(raw):
    if not raw.startswith(b"%PDF") or hashlib.sha256(raw).hexdigest()!=EXPECTED_HASH:
        raise ValueError("BEL_ORIGINAL_SHA256_MISMATCH")
    doc=fitz.open(stream=raw,filetype="pdf")
    if len(doc)!=16:raise ValueError("BEL_ORIGINAL_PAGE_COUNT_CHANGED")
    cover=doc[0].get_text("text",sort=True)
    if not all(q.lower() in cover.lower() for q in
        ("Bharat Electronics Limited","500049",CIN,"25.10.2024",
         "Standalone and Consolidated Financial Results")):
        raise ValueError("BEL_COVER_COMPANY_PERIOD_OR_SCRIP_MISMATCH")
    statement=doc[2].get_text("text",sort=True)
    upper=statement.upper()
    if not all(x in upper for x in
       ("B. CONSOLIDATED RESULTS","QUARTER ENDED","30.09.2024",
        "IN LAKHS","REVENUE FROM OPERATIONS","PROFIT FOR THE PERIOD",
        "EARNINGS PER SHARE")):
        raise ValueError("BEL_CONSOLIDATED_QUARTER_OR_UNITS_NOT_PROVEN")
    if "4,60,490" not in statement or "1,09,278" not in statement:
        raise ValueError("BEL_SOURCE_FINANCIAL_ORACLE_MISMATCH")
    # PyMuPDF original layer has "1 50" where visual original shows "1.50";
    # retain source-locked visual certification, not generic digit inference.
    if not re.search(r"\b1\s+50\b",statement):
        raise ValueError("BEL_DILUTED_EPS_OCR_LAYER_CHANGED")
    facts={}
    for metric,(value,raw_value) in EXPECTED.items():
        unit="INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_CRORE"
        facts[metric]={
          "value":value,"unit":unit,
          "original_unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_LAKH",
          "original_value":raw_value,
          "evidence_line":"Source-pinned original 2024-09-30 consolidated statement page 3; visual EPS proof as filed",
          "page":3,"column_index":0,
          "manual_source_page_fingerprint":EXPECTED_HASH
        }
    return {"scope":"CONSOLIDATED","page":3,"unit":"INR_LAKH",
            "first_column_period":DATE,"facts":facts}

def main():
    db_url=os.getenv("SUPABASE_DB_URL","")
    if batch.REF not in db_url or os.getenv("CLOUDFLARE_R2_BUCKET")!=batch.BUCKET:
        raise RuntimeError("DEVELOPMENT_ONLY")
    if os.getenv("RESULTS_R4_BSE_BEL_PIN_ACK")!="BEL_SEP2024_VISUAL_ORIGINAL_PROOF":
        raise RuntimeError("SOURCE_PIN_APPROVAL_MISSING")
    with psycopg.connect(db_url,autocommit=False) as db:
        with db.cursor() as cur:
            cur.execute("""SELECT DISTINCT s.id,s.isin FROM public.transactions t
              JOIN public.securities s ON s.id=t.security_id
              WHERE t.portfolio_id=%s AND t.superseded_at IS NULL
              AND s.symbol=%s AND s.asset_class='EQUITY'""",
              (batch.PORTFOLIO,SYMBOL))
            rows=cur.fetchall()
            if len(rows)!=1 or rows[0][1]!=ISIN: raise RuntimeError("BEL_CANONICAL_ISIN_MISMATCH")
            sid=rows[0][0]
            cur.execute("""SELECT o.metric_code FROM public.fundamental_observation_decisions d
                JOIN public.fundamental_observations o ON o.id=d.selected_observation_id
                WHERE d.security_id=%s AND d.period_end=%s AND d.period_type='QUARTER'""",
                (sid,DATE))
            existing={r[0] for r in cur.fetchall()}
        db.rollback()
        if set(EXPECTED).issubset(existing):
            print(json.dumps({"symbol":SYMBOL,"quarter":DATE,"status":"ALREADY_SELECTED","new_facts":0}))
            return
        with PortfolioBSE() as bse:
            candidate=bse.get_scrip_candidate(SYMBOL)
            if candidate["bse_scrip_code"]!=CODE:raise RuntimeError("BEL_SCRIP_MISMATCH")
            meta=bse._bse.equityMetaInfo(CODE)
            if not isinstance(meta,dict) or meta.get("ISIN")!=ISIN or str(meta.get("SecurityCode"))!=CODE:
                raise RuntimeError("BEL_BSE_SECURITY_IDENTITY_UNPROVEN")
            raw,origin=bse.retrieve_original_pdf(FILE)
            if origin["source_url"]!=URL:raise RuntimeError("BEL_OFFICIAL_SOURCE_URL_UNPROVEN")
            parsed=qualify(raw)
            inserted=batch.persist(db,batch.r2_client(),
                (SYMBOL,ISIN,sid,COMPANY,CODE),DATE,origin,raw,parsed,
                "2024-10-25T13:35:26.827")
            print(json.dumps({"symbol":SYMBOL,"period_end":DATE,
                  "status":"ORIGINAL_WRITTEN_PENDING_INDEPENDENT_R4_SELECTION",
                  "facts_inserted":inserted,"source":URL,
                  "sha256":EXPECTED_HASH,"facts":{k:v["value"] for k,v in parsed["facts"].items()}},
                  sort_keys=True))
if __name__=="__main__":
    main()
