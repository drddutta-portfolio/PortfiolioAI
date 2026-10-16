#!/usr/bin/env python3
"""Read-only PDF evidence probe for exact BseIndiaApi 2024 issuer attachments.

Consumes the historical BSE source index produced by our pinned vendor.
Does not create fundamental observations, selections, or financial figures.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
import sys

import fitz

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE

EXPECTED = {"AXISBANK","BEL","HAL","AVANTIFEED","CAMS","COFORGE","SHRIRAMFIN","STARHEALTH"}
QUARTERS = {"2024-09-30","2024-12-31"}
TOPICS = ("revenue from operations","net interest income","premium earned",
          "profit after tax","profit for the period","profit / (loss)",
          "diluted","earnings per share","financial results")
REGEXP = re.compile(r"\bINE[A-Z0-9]{9}\b",re.I)

def analyze_bytes(symbol,isin,period,source,b,origin):
    if not b.startswith(b"%PDF") or len(b)>12_000_000:
        raise ValueError("NOT_BOUNDED_OFFICIAL_PDF")
    pdf=fitz.open(stream=b,filetype="pdf")
    pages=[]
    found_isins=set()
    for i,page in enumerate(pdf):
        if i>=12:break
        text=page.get_text("text").replace("\u00a0"," ")
        normalized=" ".join(text.lower().split())
        found_isins.update(x.upper() for x in REGEXP.findall(text))
        clues=[t for t in TOPICS if t in normalized]
        if clues:
            lines=text.splitlines()
            nearby=[]
            for line_no,line in enumerate(lines):
                if any(t in line.lower() for t in ("quarter ended","revenue from","interest income",
                       "premium earned","profit after","profit for","diluted","earnings per")):
                    nearby.extend(lines[max(0,line_no-1):min(len(lines),line_no+3)])
                    if len(nearby)>20:break
            pages.append({"page":i+1,"clues":clues,"lines":" ".join(nearby)[:1150]})
    return {"symbol":symbol,"isin":isin,"quarter":period,
            "published_at":source.get("published_at"),"headline":source.get("title"),
            "attachment_name":source.get("attachment"),
            "verified_canonical_isin_in_pdf":isin in found_isins,
            "detected_isins":sorted(found_isins)[:5],"sha256":sha256(b).hexdigest(),
            "official_url":origin.get("source_url"),
            "pdf_pages":len(pdf),"financial_pages":pages[:3],
            "issuer_period_scope_not_yet_qualified":True}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--source-index",required=True)
    p.add_argument("--out",required=True)
    p.add_argument("--max-docs",type=int,default=16)
    args=p.parse_args()
    if not 1<=args.max_docs<=24:raise SystemExit("PDF_BOUND_EXCEEDED")
    raw=json.loads(Path(args.source_index).read_text())
    if raw.get("qualification_status")!="DISCOVERY_ONLY" or raw.get("writes") != 0:
        raise SystemExit("NOT_READ_ONLY_BSE_SOURCE_INDEX")
    if not isinstance(raw.get("targets"),list):
        raise SystemExit("NOT_BSE_SOURCE_INDEX")
    found=[]
    failures=[]
    with PortfolioBSE() as bse:
        for t in raw["targets"]:
            symbol=t.get("symbol")
            if symbol not in EXPECTED or t.get("identity_status")!="CURRENT_BSE_ISIN_VERIFIED_HISTORICAL_SHARE_BASIS_PENDING":
                continue
            isin=t["canonical_isin"]
            for entry in t.get("sources",[]):
                period=entry["quarter"]
                if period not in QUARTERS:continue
                for src in entry.get("original_candidates",[]):
                    if len(found)+len(failures)>=args.max_docs:break
                    attachment=src.get("attachment")
                    if not attachment:continue
                    try:
                        b,origin=bse.retrieve_original_pdf(attachment)
                        out=analyze_bytes(symbol,isin,period,src,b,origin)
                        found.append(out)
                        print("R4_BSE_PDF_EVIDENCE="+json.dumps({
                            "symbol":symbol,"quarter":period,"pages":out["pdf_pages"],
                            "candidate_financial_pages":len(out["financial_pages"]),
                            "issuer_current_isin_present":out["verified_canonical_isin_in_pdf"],
                            "original_hash":out["sha256"]},sort_keys=True),flush=True)
                    except Exception as e:
                        failures.append({"symbol":symbol,"quarter":period,
                            "error_class":type(e).__name__,"code":str(e)[:100]})
                    break # one representative official financial attachment per quarter
    result={"source":"VENDORED_BSEINDIAAPI_3_3_3",
       "source_index_status":"DISCOVERY_ONLY","financial_selection_writes":0,
       "pdfs_retrieved":len(found),"pdf_errors":failures,"pdf_evidence":found}
    Path(args.out).parent.mkdir(parents=True,exist_ok=True)
    Path(args.out).write_text(json.dumps(result,indent=2),encoding="utf-8")
    print("R4_BSE_PDF_DIAGNOSTIC_SUMMARY="+json.dumps({
      "pdfs_retrieved":len(found),"failed":len(failures),
      "source_2024_isin_verified":sum(x["verified_canonical_isin_in_pdf"] for x in found),
      "contains_financial_pages":sum(bool(x["financial_pages"]) for x in found),
      "quarter_facts_selected":0},sort_keys=True))
if __name__=="__main__":main()
