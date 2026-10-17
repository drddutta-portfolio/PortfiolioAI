#!/usr/bin/env python3
"""Issuer-original 2024 Tata Power quarterly diagnostic (no fact admission).

Extracts a source-coherent, issuer-hosted consolidated quarterly statement
from the exact original signed stock-exchange release. Fail closed on OCR,
units, dates, financial rows or conflicting source documents. No provider
financial values are ingested as estimates.
"""
from __future__ import annotations
import hashlib,json,sys
from pathlib import Path
from urllib.parse import urlparse
import fitz,requests
from r4_pdf_geometry import extract_page

SOURCES={
 "2024-09-30":("https://www.tatapower.com/company-financials/quarterly-reports/fy2024---2025/"
 "consolidated-and-standalone-financial-results-for-the-quarter-and-half-year-ended-30th-september-2024.pdf",range(5,21)),
 "2024-12-31":("https://www.tatapower.com/company-financials/quarterly-reports/fy2024---2025/"
 "consolidated-and-standalone-financial-results-for-the-quarter-and-nine-months-ended-31st-december-2024.pdf",range(5,18)),
}

def download(url):
    u=urlparse(url)
    assert (u.scheme,u.hostname)==("https","www.tatapower.com") and u.query==u.fragment==""
    response=requests.get(url,timeout=55,headers={"User-Agent":"Mozilla/5.0 (compatible; PortfolioAIResults/1.0)"})
    response.raise_for_status()
    parsed=urlparse(response.url)
    if (parsed.scheme,parsed.hostname)!=("https","www.tatapower.com"):
        raise RuntimeError("OFFICIAL_ISSUER_DOMAIN_REDIRECT")
    raw=response.content
    if not raw.startswith(b"%PDF") or not 50000<len(raw)<16000000:
        raise RuntimeError("NO_QUALIFIED_PDF_BYTES")
    return raw

def inspect_one(period,url,pages):
    raw=download(url)
    pdf=fitz.open(stream=raw,filetype="pdf")
    if not 10<=len(pdf)<=38:
        raise RuntimeError("UNEXPECTED_ORIGINAL_PAGE_COUNT")
    cover=pdf[0].get_text("text")
    # Explicit BSE identifier and NSE ticker on the dated exchange notice.
    if "500400" not in cover or "TATAPOWER" not in cover or "The Tata Power Company Limited" not in cover:
        raise RuntimeError("TATAPOWER_BSE_NSE_LEGAL_IDENTITY_UNPROVEN")
    if period=="2024-09-30" and "October 30, 2024" not in cover:
        raise RuntimeError("SIGNED_NOTICE_DATE_UNQUALIFIED")
    candidates=[];rejections={}
    for i in pages:
        if i>=len(pdf):continue
        page=pdf[i]
        text=page.get_text("text")
        if "REVENUE" not in text.upper() or ("TATA POWER" not in text.upper() and "THE TATA POWER" not in text.upper()):
            continue
        try:
            result=extract_page(page,i+1,period,allow_comparative=True)
            if result["scope"]=="CONSOLIDATED":
                candidates.append(result)
        except ValueError as exc:
            reason=str(exc).split(":",1)[0]
            rejections[reason]=rejections.get(reason,0)+1
    if len(candidates)!=1:
        return {"period":period,"status":"SOURCE_UNQUALIFIED","original_sha256":hashlib.sha256(raw).hexdigest(),
                "qualified_consolidated_tables":len(candidates),"rejects":rejections}
    result=candidates[0]
    if len(result["facts"])!=3 or any(x["column_period"]!=period for x in result["facts"].values()):
        raise RuntimeError("IMPROPER_PERIOD_FACT_TRIO")
    return {"period":period,"status":"QUALIFIED_FOR_INDEPENDENT_SOURCE_ADMISSION",
            "original_sha256":hashlib.sha256(raw).hexdigest(),
            "source_url":url,"page":result["page"],"scope":result["scope"],
            "metric_codes":sorted(result["facts"]),"parser_revision":result["parser_revision"],
            "qualification":result}

def main():
    report=[]
    for period,(url,pages) in SOURCES.items():
        try:
            report.append(inspect_one(period,url,pages))
        except Exception as exc:
            report.append({"period":period,"status":"SOURCE_UNQUALIFIED",
                           "error":type(exc).__name__+":"+str(exc)[:160]})
    Path("tmp/results-r5").mkdir(parents=True,exist_ok=True)
    # Raw values must not go into public GitHub Action artifact or stdout.
    private=Path("tmp/results-r5/tatapower-private-qualification.json")
    private.write_text(json.dumps(report,indent=2))
    safe=[{k:v for k,v in row.items() if k not in ("qualification","source_url")}
          for row in report]
    Path("tmp/results-r5/tatapower-issuer-diagnostic.json").write_text(json.dumps(safe,indent=2))
    print("R5_TATAPOWER_ORIGINAL_QUARTERS",json.dumps(safe))
    if any(x["status"]!="QUALIFIED_FOR_INDEPENDENT_SOURCE_ADMISSION" for x in report):
        raise SystemExit("ISSUER_ORIGINAL_QUARTER_NOT_YET_PROVEN")

if __name__=="__main__":main()
