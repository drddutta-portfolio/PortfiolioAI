#!/usr/bin/env python3
"""Capture original RBI Commercial Banks 2025 financial statement Directions.
Public RBI source only; no DB writes or numeric admission."""
from urllib.request import Request, urlopen
from pathlib import Path
import hashlib,json,subprocess,datetime,sys
url="https://rbidocs.rbi.org.in/rdocs/notification/PDFs/167MD.pdf"
dir=Path("kvb-rbi-2025-source-artifact");dir.mkdir(exist_ok=True)
out={"source_url":url,"retrieved_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"admission":False}
try:
 req=Request(url,headers={"User-Agent":"PortfolioAI-Banking-V14-Original-RBI-Source/1.0","Accept":"application/pdf"})
 with urlopen(req,timeout=35) as resp:
  if resp.status!=200: raise RuntimeError(f"RBI_HTTP_STATUS_{resp.status}")
  final=resp.geturl()
  if not final.startswith("https://rbidocs.rbi.org.in/"): raise RuntimeError(f"RBI_REDIRECT_HOST_MISMATCH:{final[:180]}")
  data=resp.read(12_000_001)
  if not (50000<len(data)<=12_000_000): raise RuntimeError(f"RBI_PDF_SIZE_INVALID:{len(data)}")
  if data[:5]!=b"%PDF-": raise RuntimeError(f"RBI_NON_PDF_RESPONSE_PREFIX:{data[:60]!r}")
  h=hashlib.sha256(data).hexdigest()
  (dir/"RBI_Commercial_Banks_Financial_Statements_2025_Original.pdf").write_bytes(data)
  out.update({"status":"ORIGINAL_PDF_CAPTURED_NOT_ADMITTED","final_url":final,"bytes":len(data),"sha256":h})
  cmd=subprocess.run(["pdftotext","-layout",str(dir/"RBI_Commercial_Banks_Financial_Statements_2025_Original.pdf"),str(dir/"text.txt")],capture_output=True,text=True)
  if cmd.returncode:
   out["text_status"]="PDFTOTEXT_UNAVAILABLE_OR_FAILED"
  else:
   text=(dir/"text.txt").read_text(errors="replace")
   markers=["Business ratios","Return on Assets","Working funds","Form X","November 28, 2025","Commercial Banks"]
   out["anchors"]={m:m.lower() in text.lower() for m in markers}
   import re
   snippets=[]
   for match in list(re.finditer(r"Return on Assets|Working funds|Form X",text,re.I))[:30]:
    snippets.append(text[max(0,match.start()-300):match.end()+500])
   (dir/"roa_context.txt").write_text("\n---\n".join(snippets))
   out["passage_count"]=len(snippets)
except Exception as exc:
 out.update({"status":"ACQUISITION_FAILED", "error_type":type(exc).__name__, "error":str(exc) or repr(exc), "transport":"RBI_ORIGINAL_PDF_HTTPS"})
(dir/"manifest.json").write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps(out))
if out.get("status")!="ORIGINAL_PDF_CAPTURED_NOT_ADMITTED":sys.exit(2)
