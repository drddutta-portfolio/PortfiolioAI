#!/usr/bin/env python3
"""Exact original December 2024 BEL issuer BSE source, audited PDF page 3."""
from __future__ import annotations
from pathlib import Path
import importlib.util,hashlib,json,os,re
import fitz
import psycopg

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("r4_bel_sep",HERE/"r4-bse-bel-2024-pinned.py")
sep=importlib.util.module_from_spec(spec)
spec.loader.exec_module(sep)
batch=sep.batch

PERIOD="2024-12-31"
FILE="119a097d-eaa1-4c26-82c4-6fe22c064c96.pdf"
HASH="38065e01963687c9df8dee365ad7e16d51604674dab5100b96ed7b83e667213b"
URL="https://www.bseindia.com/xml-data/corpfiling/AttachHis/"+FILE
EXPECTED={"OPERATING_REVENUE_QUARTER":("5770.69","5,77,069"),
          "NET_PROFIT_QUARTER":("1311.60","1,31,160"),
          "EPS_DILUTED":("1.79","1.79")}

def prove(raw):
    if not raw.startswith(b"%PDF") or hashlib.sha256(raw).hexdigest()!=HASH:
        raise ValueError("BEL_DEC_PDF_HASH_CHANGED")
    pdf=fitz.open(stream=raw,filetype="pdf")
    if len(pdf)!=11:raise ValueError("BEL_DEC_PDF_PAGE_COUNT_CHANGED")
    cover=pdf[0].get_text("text",sort=True)
    if sep.CIN not in cover or sep.CODE not in cover or "Bharat" not in cover or "Electronics" not in cover:
        raise ValueError("BEL_DEC_COVER_IDENTITY_UNPROVEN")
    financial=pdf[2].get_text("text",sort=True)
    # This PDF has badly shuffled text order, but published original PDF image
    # has independently reviewed consolidated financial row 1, row 11, row 16.
    if not all(q.lower() in financial.lower() for q in
       ("consolidated","lakhs","31.12.2024","5,77,069","1,31,160","1.79")):
        raise ValueError("BEL_DEC_ORIGINAL_FINANCIAL_PAGE_CHANGED")
    facts={}
    for code,(value,original) in EXPECTED.items():
        eps=code=="EPS_DILUTED"
        facts[code]={
            "value":value,"original_value":original,
            "unit":"INR_PER_SHARE" if eps else "INR_CRORE",
            "original_unit":"INR_PER_SHARE" if eps else "INR_LAKH",
            "evidence_line":"Frozen official BSE original page 3; consolidated quarter 31.12.2024; row 1/11/16 as visually read",
            "page":3,"column_index":0,"manual_source_page_fingerprint":HASH,
        }
    return {"scope":"CONSOLIDATED","page":3,"unit":"INR_LAKH",
            "first_column_period":PERIOD,"facts":facts}

def main():
    url=os.getenv("SUPABASE_DB_URL","")
    if batch.REF not in url or os.getenv("CLOUDFLARE_R2_BUCKET")!=batch.BUCKET:
        raise RuntimeError("DEV_ONLY")
    if os.getenv("RESULTS_R4_BSE_BEL_DEC_ACK")!="BEL_DEC2024_VISUAL_ORIGINAL_PROOF":
        raise RuntimeError("BEL_DEC_SOURCE_APPROVAL_MISSING")
    with psycopg.connect(url,autocommit=False) as db:
        with db.cursor() as c:
            c.execute("""SELECT DISTINCT s.id,s.isin FROM public.transactions t JOIN public.securities s ON t.security_id=s.id
                WHERE t.portfolio_id=%s AND t.superseded_at IS NULL
                  AND s.asset_class='EQUITY' AND s.symbol='BEL'""",(batch.PORTFOLIO,))
            rows=c.fetchall()
            if len(rows)!=1 or rows[0][1]!=sep.ISIN:raise RuntimeError("BEL_CANONICAL_IDENTITY_CHANGED")
            sid=rows[0][0]
            c.execute("""SELECT metric_code FROM public.fundamental_observation_decisions
                WHERE security_id=%s AND period_type='QUARTER' AND period_end=%s""",(sid,PERIOD))
            selected={r[0] for r in c.fetchall()}
        db.rollback()
        if set(EXPECTED).issubset(selected):
            print(json.dumps({"status":"BEL_DEC_ALREADY_SELECTED","added":0}))
            return
        with sep.PortfolioBSE() as bse:
            scrip=bse.get_scrip_candidate(sep.SYMBOL)
            meta=bse._bse.equityMetaInfo(sep.CODE)
            if scrip["bse_scrip_code"]!=sep.CODE or not isinstance(meta,dict) or meta.get("ISIN")!=sep.ISIN or str(meta.get("SecurityCode"))!=sep.CODE:
                raise RuntimeError("BEL_BSE_IDENTITY_UNVERIFIED")
            raw,original=bse.retrieve_original_pdf(FILE)
            if original["source_url"]!=URL:raise RuntimeError("BEL_DEC_ORIGINAL_SOURCE_NOT_MATCHED")
            parsed=prove(raw)
            inserted=batch.persist(db,batch.r2_client(),
                (sep.SYMBOL,sep.ISIN,sid,sep.COMPANY,sep.CODE),
                PERIOD,original,raw,parsed,"2025-01-30T14:02:57.907")
            print(json.dumps({"status":"BEL_DEC_SOURCE_PERSISTED_PENDING_R4",
                "observations_inserted":inserted,"sha256":HASH,
                "period":PERIOD,"facts":{k:v["value"] for k,v in parsed["facts"].items()}},
                sort_keys=True))
if __name__=="__main__":
    main()
