#!/usr/bin/env python3
"""Read-only BSEIndiaApi-first discovery hints for PortfolioAI Results.

Official BSE summary data is a discovery hint ONLY, not independently
qualified revenue/PAT/EPS and never source-selected. A matching issuer ISIN,
BSE scrip code, and actual reporting-quarter header are required. The existing
NSE/issuer original collector and R4 verifier retain sole financial authority.
"""
from __future__ import annotations
from datetime import date,timedelta
import json,os,re,sys,time
from pathlib import Path
import psycopg

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"vendor"/"bseindiaapi"/"src"))
DEV_REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
BUCKET="portfolioai-history-dev"
OUT=ROOT/"tmp"/"results-scan-v2"/"bse_hints.json"
MONTHS={3:"Mar",6:"Jun",9:"Sep",12:"Dec"}

def last_completed_quarter(today:date)->date:
    current_start=date(today.year,((today.month-1)//3)*3+1,1)
    return current_start-timedelta(days=1)

def period_label(quarter:date)->str:
    assert quarter.month in MONTHS
    return f"{MONTHS[quarter.month]}-{quarter.year%100:02d}"

def quarter_header_present(snapshot:object,label:str)->bool:
    if not isinstance(snapshot,dict):return False
    result=snapshot.get("results_in_crores")
    return (isinstance(result,dict) and isinstance(result.get("fields"),list)
            and any(isinstance(value,str) and value.strip().lower()==label.lower()
                    for value in result["fields"]))

def issuer_identity(meta:object,scrip:str,isin:str)->bool:
    return (isinstance(meta,dict) and str(meta.get("ISIN") or "").strip().upper()==isin.upper()
            and str(meta.get("SecurityCode") or "").strip()==scrip)

def main()->int:
    url=os.getenv("SUPABASE_DB_URL","")
    if DEV_REF not in url or not url.startswith("postgres"):
        raise RuntimeError("BSE_DISCOVERY_DEVELOPMENT_DB_REQUIRED")
    if os.getenv("CLOUDFLARE_R2_BUCKET")!=BUCKET or os.getenv("RESULTS_LIVE_SCAN_MODE")!="1":
        raise RuntimeError("BSE_DISCOVERY_APPROVED_LIVE_SCAN_ONLY")
    with psycopg.connect(url,options="-c default_transaction_read_only=on") as db:
        with db.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT s.symbol,s.isin
                FROM public.transactions t JOIN public.securities s ON s.id=t.security_id
                WHERE t.portfolio_id=%s::uuid AND t.superseded_at IS NULL
                  AND s.asset_class='EQUITY' AND s.isin IS NOT NULL
                ORDER BY s.symbol
            """,(PORTFOLIO,))
            stocks=cur.fetchall()
    if not 1<=len(stocks)<=262:raise RuntimeError("BSE_DISCOVERY_UNIVERSE_UNVERIFIED")
    q=last_completed_quarter(date.today())
    label=period_label(q)
    report={"source":"BSEINDIAAPI","mode":"READ_ONLY_DISCOVERY_HINTS",
            "quarter_end":q.isoformat(),"checked":0,"identity_matched":0,
            "quarter_candidates":0,"unavailable":0,"symbols":[],"errors":{}}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    from bse import BSE
    try:
        with BSE(download_folder=OUT.parent) as bse:
            for symbol,isin in stocks:
                report["checked"]+=1
                try:
                    scrip=str(bse.getScripCode(symbol)).strip()
                    if not re.fullmatch(r"\d{6}",scrip):
                        raise ValueError("BSE_SCRIP_UNVERIFIED")
                    meta=bse.equityMetaInfo(scrip)
                    if not issuer_identity(meta,scrip,isin):
                        raise ValueError("BSE_ISIN_IDENTITY_MISMATCH")
                    report["identity_matched"]+=1
                    if quarter_header_present(bse.resultsSnapshot(scrip),label):
                        report["symbols"].append(symbol)
                        report["quarter_candidates"]+=1
                except Exception as exc:
                    reason=type(exc).__name__
                    report["errors"][reason]=report["errors"].get(reason,0)+1
                    report["unavailable"]+=1
                time.sleep(0.25)
    except Exception as exc:
        report["connection_failure"]=type(exc).__name__
    # No BSE figures/identity shortcuts. The only permitted downstream use is
    # prioritizing issuer discovery; the NSE original has to pass R4 separately.
    OUT.write_text(json.dumps(report,sort_keys=True,separators=(",",":")))
    print(json.dumps({k:v for k,v in report.items() if k not in ("symbols",)},sort_keys=True))
    return 0

if __name__=="__main__":
    try:sys.exit(main())
    except Exception as exc:
        print("BSE_DISCOVERY_FAILED",type(exc).__name__,str(exc)[:100],file=sys.stderr)
        sys.exit(2)
