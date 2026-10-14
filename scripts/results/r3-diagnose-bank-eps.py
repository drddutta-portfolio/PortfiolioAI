#!/usr/bin/env python3
"""Read-only diagnostic: verify exact BANKING EPS row visibility in official HTML."""
from pathlib import Path
import importlib.util
import json
import requests
from bs4 import BeautifulSoup

path=Path(__file__).with_name("r3-live-public-filing-batch.py")
spec=importlib.util.spec_from_file_location("r3",path)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
url="https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_BANKING_178331_25072026200712_iXBRL_WEB.html"
s=requests.Session()
s.headers.update({"User-Agent":"Mozilla/5.0 (compatible; PortfolioAIResearch/1.0)","Accept-Language":"en-IN,en;q=0.8"})
try:
    s.get("https://www.nseindia.com/companies-listing/corporate-integrated-filing",timeout=15)
    response=s.get(url,timeout=20,headers={"Accept":"text/html"})
    result={"status":response.status_code,"size":len(response.content)}
    if response.status_code==200 and len(response.content)<=6_000_000:
        soup=BeautifulSoup(response.text,"html.parser")
        tables=list(m.html_rows(soup))
        exact,contains=[],[]
        for i,rows in enumerate(tables):
            direct=m.field_values(rows,"diluted earnings per share after extraordinary items")
            if direct: exact.append({"table":i,"values":direct[:3]})
            for cells in rows:
                if any("diluted earnings per share after extraordinary items" in m.normalize(cell) for cell in cells):
                    contains.append({"table":i,"cells":cells[:5]})
        extracted,reason=m.extract_bank(response.text,"AUBANK","INE949L01017")
        result.update({"tables":len(tables),"direct_matches":exact[:4],
                       "contains_matches":contains[:4],
                       "parsed":bool(extracted),"reason":reason,
                       "eps_extracted":extracted and extracted["facts"].get("EPS_DILUTED"),
                       "metric_codes":sorted(extracted["facts"]) if extracted else []})
    print("PUBLIC_NSE_EPS_DIAGNOSTIC",json.dumps(result,sort_keys=True))
except requests.RequestException as exc:
    print("PUBLIC_NSE_EPS_DIAGNOSTIC",json.dumps({"error":type(exc).__name__}))
