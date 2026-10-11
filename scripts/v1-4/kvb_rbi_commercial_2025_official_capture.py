#!/usr/bin/env python3
"""Capture original RBI Commercial Banks 2025 financial statement Directions.
Public RBI source only; no DB writes or numeric admission."""
from urllib.request import Request, urlopen
from pathlib import Path
import hashlib,json,subprocess,datetime,sys
url="https://www.rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=13143"
dir=Path("kvb-rbi-2025-source-artifact");dir.mkdir(exist_ok=True)
out={"source_url":url,"retrieved_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"admission":False}
try:
 req=Request(url,headers={"User-Agent":"PortfolioAI-Banking-V14-Original-RBI-Source/1.0","Accept":"application/pdf"})
 with urlopen(req,timeout=35) as resp:
  if resp.status!=200: raise RuntimeError(f"RBI_HTTP_STATUS_{resp.status}")
  final=resp.geturl()
  if not final.startswith("https://www.rbi.org.in/"): raise RuntimeError(f"RBI_REDIRECT_HOST_MISMATCH:{final[:180]}")
  data=resp.read(12_000_001)
  if not (1024<len(data)<=12_000_000): raise RuntimeError(f"RBI_HTML_SIZE_INVALID:{len(data)};PREFIX:{data[:60]!r}")
  if b"Return on Assets" not in data or b"Working funds" not in data or b"Form X" not in data: raise RuntimeError("RBI_ROA_OFFICIAL_HTML_IDENTITY_MISSING")
  h=hashlib.sha256(data).hexdigest()
  (dir/"RBI_Commercial_Banks_Financial_Statements_2025_Official.html").write_bytes(data)
  out.update({"status":"ORIGINAL_RBI_HTML_CAPTURED_NOT_ADMITTED","final_url":final,"bytes":len(data),"sha256":h})
  out["source_kind"]="RBI_OFFICIAL_MASTER_DIRECTIONS_HTML"
  text=data.decode("utf-8",errors="replace")
  out["anchors"]={m:m.lower() in text.lower() for m in ["Return on Assets","Working funds","Form X","November 28, 2025","Commercial Banks"]}
  (dir/"roa_context.txt").write_text(text[max(0,text.lower().find("return on assets")-800):text.lower().find("return on assets")+1800])

except Exception as exc:
 out.update({"status":"ACQUISITION_FAILED", "error_type":type(exc).__name__, "error":str(exc) or repr(exc), "transport":"RBI_OFFICIAL_MASTER_DIRECTIONS_HTML"})
(dir/"manifest.json").write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps(out))
if out.get("status")!="ORIGINAL_RBI_HTML_CAPTURED_NOT_ADMITTED":sys.exit(2)
