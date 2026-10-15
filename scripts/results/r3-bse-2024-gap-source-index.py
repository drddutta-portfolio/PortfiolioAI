#!/usr/bin/env python3
"""Read-only reuse-first all-portfolio missing-2024 BSE issuer filing index.

Does NOT qualify figures, insert observations or write to Supabase/R2.
Requires exact canonical ISIN match to BSE equityMetaInfo before any issuer
source is attributed to a PortfolioAI security; historical share basis still
needs separate dated corporate-action verification.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from datetime import date
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE

REF = "lrgpjimipfkyoqbpsqzz"
PID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
WINDOWS = {
    "2024-09-30":(date(2024,10,1),date(2024,11,30)),
    "2024-12-31":(date(2025,1,1),date(2025,2,28))
}
SELECT = """
WITH portfolio AS (
  SELECT DISTINCT s.id, s.symbol, s.isin FROM public.transactions t
  JOIN public.securities s ON s.id=t.security_id
  WHERE t.portfolio_id=%s AND s.asset_class='EQUITY'
), metrics AS (
  SELECT d.security_id,d.period_end,
  count(distinct d.metric_code) FILTER (
    WHERE d.selected_observation_id IS NOT NULL
      AND d.metric_code IN (
        'OPERATING_REVENUE_QUARTER','NET_INTEREST_INCOME_QUARTER',
        'NET_PROFIT_QUARTER','EPS_DILUTED')) n
  FROM public.fundamental_observation_decisions d
  WHERE d.period_type='QUARTER'
    AND d.period_end IN ('2024-09-30','2024-12-31')
  GROUP BY 1,2
)
SELECT s.symbol,s.isin,
  COALESCE(sep.n,0) as sept_count,
  COALESCE(dec.n,0) as dec_count
FROM portfolio s LEFT JOIN metrics sep ON sep.security_id=s.id
  AND sep.period_end='2024-09-30'
LEFT JOIN metrics dec ON dec.security_id=s.id
  AND dec.period_end='2024-12-31'
WHERE COALESCE(sep.n,0)<3 OR COALESCE(dec.n,0)<3
ORDER BY s.symbol
"""

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--limit",type=int,default=120)
    cli.add_argument("--max-pages",type=int,default=3)
    cli.add_argument("--output",default="tmp/results-r3-bse-2024/source-index.json")
    args=cli.parse_args()
    if not 1<=args.limit<=262 or not 1<=args.max_pages<=5:
        raise SystemExit("BOUNDED_RUN_REQUIRED")
    url=os.getenv("SUPABASE_DB_URL","")
    if REF not in url:raise SystemExit("DEVELOPMENT_DB_ONLY")
    with psycopg.connect(url,options="-c default_transaction_read_only=on") as db:
        with db.cursor() as c:
            c.execute(SELECT,(PID,))
            missing=c.fetchall()
    missing=missing[:args.limit]
    report={"contract":"PORTFOLIOAI_R3_2024_BSE_ISSUER_ORIGINAL_DISCOVERY_V1",
            "writes":0,"qualification_status":"DISCOVERY_ONLY",
            "total_target_equities":len(missing),"periods":list(WINDOWS),
            "targets":[]}
    outcomes=Counter()
    with PortfolioBSE() as bse:
        for index,(symbol,isin,sep,dec) in enumerate(missing,1):
            entry={"symbol":symbol,"canonical_isin":isin,
                   "missing_quarters":[p for p,n in [("2024-09-30",sep),("2024-12-31",dec)] if n<3],
                   "status":"PENDING","sources":[]}
            try:
                candidate=bse.get_scrip_candidate(symbol)
                code=candidate["bse_scrip_code"]
                meta=bse._bse.equityMetaInfo(code)  # read-only current BSE company identity
                if (not isinstance(meta,dict) or meta.get("ISIN")!=isin
                    or str(meta.get("SecurityCode"))!=code):
                    entry["status"]="BSE_CANONICAL_ISIN_OR_CODE_MISMATCH"
                    entry["bse_code_candidate"]=code
                    outcomes[entry["status"]]+=1
                    report["targets"].append(entry)
                    continue
                entry["bse_scrip_code"]=code
                entry["identity_status"]="CURRENT_BSE_ISIN_VERIFIED_HISTORICAL_SHARE_BASIS_PENDING"
                entry["bse_security_id"]=meta.get("SecurityId")
                for period in entry["missing_quarters"]:
                    start,end=WINDOWS[period]
                    try:
                        result=bse.financial_announcements(code,start,end,max_pages=args.max_pages)
                        docs=[{
                            "title":x["title"],"published_at":x["published_at"],
                            "news_id":x.get("news_id"),
                            "attachment":x["attachment_name"],
                            "issuer_pdf_candidates":x["official_pdf_candidates"]
                          } for x in result["results"] if x["attachment_name"]]
                        entry["sources"].append({
                            "quarter":period,"original_candidates":docs,
                            "number_of_candidates":len(docs),
                            "pages_incomplete":result["may_have_more_pages"],
                            "records_seen":result["records_seen"]})
                    except Exception as e:
                        entry["sources"].append({
                            "quarter":period,"error_type":type(e).__name__,
                            "error":str(e)[:130]})
                entry["status"]="BSE_INDEX_ATTEMPTED"
            except Exception as e:
                entry["status"]="BSE_LOOKUP_UNAVAILABLE"
                entry["error_type"]=type(e).__name__
                entry["error"]=str(e)[:130]
            outcomes[entry["status"]]+=1
            report["targets"].append(entry)
            if index%12==0 or index==len(missing):
                print("R3_BSE_GAP_PROGRESS="+json.dumps({
                    "checked":index,"total":len(missing),"outcomes":outcomes},default=dict),
                    flush=True)
    report["outcomes"]=dict(outcomes)
    report["filing_candidates"]=sum(
      len(v.get("original_candidates",[]))
      for s in report["targets"] for v in s.get("sources",[]))
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,sort_keys=True,indent=2),encoding="utf-8")
    print("R3_BSE_GAP_FINAL="+json.dumps({
        "equities_checked":len(missing),"filing_candidates":report["filing_candidates"],
        "status_counts":report["outcomes"],"database_writes":0
    },sort_keys=True))
if __name__=="__main__":main()
