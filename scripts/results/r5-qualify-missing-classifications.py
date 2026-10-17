#!/usr/bin/env python3
"""R5: qualify missing canonical sector/industry from NSE official quote evidence.

Use *only* existing public.security_attribute_* provenance/decision authorities.
Never rewrite a non-null canonical value, ever. Strict ISIN/quote guards, issuer
source record, transactional admission, all Development-only. No schema changes.
Usage:
  python scripts/results/r5-qualify-missing-classifications.py inventory
  python scripts/results/r5-qualify-missing-classifications.py reconcile --input tmp/results-r5-identity/nse.json --apply
Without --apply reconciliation is read-only.
"""
import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

import psycopg
from psycopg.types.json import Jsonb

DEV = "lrgpjimipfkyoqbpsqzz"
PORTFOLIO = "6193a4aa-3235-4057-bddc-209fcf443fc2"
BASE = Path("tmp/results-r5-identity")
CONTRACT = "R5_OFFICIAL_NSE_CANONICAL_MISSING_CLASSIFICATION_V1"
SOURCE = "NSE_OFFICIAL"
KIND = "RESULTS_R5_NSE_CLASSIFICATION_V1"
QUOTEPREFIX = "https://www.nseindia.com/get-quotes/equity?symbol="
ISO_RE = re.compile(r"^[A-Z0-9]{12}$")
SYM_RE = re.compile(r"^[A-Z0-9&._-]+$")
SAFE_LABEL = re.compile(r"^[^\x00-\x1f<>]{3,120}$")

QUERY = """
 SELECT DISTINCT s.id::text,s.symbol,s.isin,e.sector,e.industry
 FROM public.transactions t
 JOIN public.securities s ON s.id=t.security_id
 LEFT JOIN public.current_security_enrichment_v1 e ON e.security_id=s.id
 WHERE t.portfolio_id=%s AND t.superseded_at IS NULL AND s.asset_class='EQUITY'
 ORDER BY s.symbol,s.id::text
"""


def connect():
    url = os.environ["SUPABASE_DB_URL"]
    if DEV not in url:
        raise RuntimeError("DEVELOPMENT_DATABASE_ONLY")
    return psycopg.connect(url)


def universe(db):
    with db.cursor() as cur:
        cur.execute(QUERY, (PORTFOLIO,))
        found = [
            dict(id=oid,symbol=symbol,isin=isin,sector=sector,industry=industry)
            for oid,symbol,isin,sector,industry in cur.fetchall()
        ]
    if len(found)!=262 or len({x["id"] for x in found})!=262:
        raise RuntimeError("R5_EXPECTS_262_DISTINCT_PORTFOLIO_EQUITIES")
    return found


def verify(row, known):
    symbol = row.get("symbol")
    if not isinstance(symbol,str) or symbol not in known:
        return "NOT_A_MISSING_COHORT_SYMBOL"
    target = known[symbol]
    if not SYM_RE.fullmatch(symbol) or not isinstance(target["isin"],str):
        return "INVALID_TARGET_EXCHANGE_IDENTITY"
    if not isinstance(row.get("isin"),str) or not ISO_RE.fullmatch(row["isin"]):
        return "OFFICIAL_ISIN_MISSING"
    if row["isin"]!=target["isin"]:
        return "OFFICIAL_ISIN_DISAGREEMENT"
    if row.get("isEtf") is True or not isinstance(row.get("companyName"),str) or len(row["companyName"].strip())<3:
        return "NOT_VERIFIED_ORDINARY_COMPANY_EQUITY"
    for key in ("sector","industry"):
        value = row.get(key)
        if value is not None and (not isinstance(value,str) or not SAFE_LABEL.fullmatch(value.strip())):
            return "INVALID_EXCHANGE_LABEL"
    if not row.get("sector") or not row.get("industry"):
        return "EXCHANGE_FOUR_TIER_DETAIL_MISSING"
    if row.get("sourceUrl")!=QUOTEPREFIX+symbol:
        return "SOURCE_URL_NOT_OFFICIAL_QUOTE"
    try:
        retrieval=datetime.fromisoformat(row["retrievedAt"].replace("Z","+00:00"))
        if retrieval.tzinfo is None or abs(datetime.now(timezone.utc)-retrieval)>timedelta(days=2):
            return "SOURCE_RETRIEVAL_TIME_INVALID"
    except (KeyError,ValueError,AttributeError):
        return "SOURCE_RETRIEVAL_TIME_INVALID"
    return None


def apply_record(db, target, row):
    """Transaction per security; no overwrite even under a racing admission."""
    symbol=target["symbol"]
    # Lock concrete security identity so parallel runners cannot interleave.
    with db.cursor() as cur:
        cur.execute("SELECT id,isin,asset_class FROM public.securities WHERE id=%s::uuid FOR UPDATE",
                    (target["id"],))
        security=cur.fetchone()
        if not security or security[1]!=row["isin"] or security[2]!="EQUITY":
            raise RuntimeError("SECURITY_IDENTITY_CHANGED")
        cur.execute("""SELECT d.attribute_code,o.normalized_value,o.text_value
            FROM public.security_attribute_decisions d
            JOIN public.security_attribute_observations o ON o.id=d.selected_observation_id
            WHERE d.security_id=%s::uuid""",(target["id"],))
        current={c:normalized or original for c,normalized,original in cur.fetchall()}
        desired={code:row[label].strip() for code,label in [("SECTOR","sector"),("INDUSTRY","industry")]
                 if not current.get(code)}
        if not desired:
            return []
        # Current selection is canonical, not an R5-owned local fallback.
        payload={
            "contract":CONTRACT, "symbol":symbol, "isin":row["isin"],
            "companyName":row["companyName"].strip(),
            "macroEconomicSector":row.get("macroEconomicSector"),
            "sector":row["sector"].strip(), "industry":row["industry"].strip(),
            "basicIndustry":row.get("basicIndustry"), "sourceUrl":row["sourceUrl"],
            "retrievedAt":row["retrievedAt"], "sourceEndpoint":"NSE_QUOTE_EQUITY_INDUSTRY_INFO",
            "admitOnlyMissing":True,
        }
        encoded=json.dumps(payload,sort_keys=True,separators=(",",":"),ensure_ascii=False)
        digest=hashlib.sha256(encoded.encode("utf8")).hexdigest()
        cur.execute("""
          INSERT INTO public.data_source_records
           (source_code,record_kind,external_record_id,payload_hash,raw_payload,source_url,retrieved_at)
          VALUES (%s,%s,%s,%s,%s,%s,%s::timestamptz)
          ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
          DO UPDATE SET external_record_id=EXCLUDED.external_record_id
          RETURNING id
        """, (SOURCE,KIND,"NSE_CLASSIFICATION:"+row["isin"],digest,Jsonb(payload),
              row["sourceUrl"],row["retrievedAt"]))
        source_id=cur.fetchone()[0]
        changed=[]
        for code,value in desired.items():
            cur.execute("""
               INSERT INTO public.security_attribute_observations
               (security_id,source_record_id,source_code,attribute_code,text_value,
                normalized_value,observed_at,retrieved_at,fresh_until,evidence_status)
               VALUES (%s::uuid,%s::uuid,%s,%s,%s,%s,%s::timestamptz,%s::timestamptz,
                       (%s::timestamptz + INTERVAL '365 days'),'AVAILABLE')
               ON CONFLICT (source_record_id,security_id,attribute_code)
               DO UPDATE SET text_value=EXCLUDED.text_value
               RETURNING id
            """, (target["id"],str(source_id),SOURCE,code,value,value,
                  row["retrievedAt"],row["retrievedAt"],row["retrievedAt"]))
            oid=cur.fetchone()[0]
            cur.execute("""
              INSERT INTO public.security_attribute_decisions
                (security_id,attribute_code,selected_observation_id,decision_basis,notes)
              VALUES (%s::uuid,%s,%s::uuid,'EVIDENCE_PRIORITY',
               'R5 source recovery: verified NSE symbol+ISIN, source original retained; admitted missing canonical field only.')
              ON CONFLICT (security_id,attribute_code) DO NOTHING
              RETURNING attribute_code
            """,(target["id"],code,str(oid)))
            if cur.fetchone():
                changed.append(code)
        return changed


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("mode",choices=["inventory","reconcile"])
    ap.add_argument("--input",default=str(BASE/"nse.json"))
    ap.add_argument("--apply",action="store_true")
    args=ap.parse_args()
    BASE.mkdir(parents=True,exist_ok=True)
    with connect() as db:
        if not args.apply: db.execute("SET default_transaction_read_only TO on")
        items=universe(db)
        missing={x["symbol"]:x for x in items if not x["sector"] or not x["industry"]}
        if args.mode=="inventory":
            (BASE/"symbols.txt").write_text("\n".join(sorted(missing))+"\n")
            # Full identity stays inside transient private runner.
            (BASE/"identity.json").write_text(json.dumps(items,indent=2))
            print("R5_CLASSIFICATION_INVENTORY",json.dumps(
                {"equities":len(items),"missingCompanies":len(missing),"sourceCalls":0}))
            return
        snap=json.loads(Path(args.input).read_text())
        if snap.get("contract")!="PORTFOLIOAI_K1_NSE_PRIMARY_CLASSIFICATION_SNAPSHOT_V2" or snap.get("source")!="NSE_OFFICIAL_QUOTE_EQUITY_INDUSTRY_INFO":
            raise RuntimeError("UNREVIEWED_EXCHANGE_SNAPSHOT_CONTRACT")
        grouped={}
        for row in snap.get("rows",[]):
            symbol=row.get("symbol")
            if symbol in grouped: grouped[symbol]=None
            else: grouped[symbol]=row
        outcomes=[]
        for symbol,target in sorted(missing.items()):
            row=grouped.get(symbol)
            if row is None:
                outcomes.append(dict(symbol=symbol,state="NSE_QUOTE_MISSING_OR_DUPLICATE"))
                continue
            failure=verify(row,missing)
            if failure:
                outcomes.append(dict(symbol=symbol,state=failure))
                continue
            if args.apply:
                with db.transaction():
                    updates=apply_record(db,target,row)
                outcomes.append(dict(symbol=symbol,state="ADMITTED" if updates else "ALREADY_PRESENT",attributes=updates))
            else:
                outcomes.append(dict(symbol=symbol,state="VERIFIED_DRY_RUN",
                                     attributes=[x for x in ("SECTOR","INDUSTRY") if not target[x.lower()]]))
        counters={k:sum(o["state"]==k for o in outcomes) for k in sorted({o["state"] for o in outcomes})}
        report=dict(contract=CONTRACT,environment="Development",requested=len(missing),
                    applied=args.apply,outcomes=outcomes,statusCounts=counters,
                    canonicalExistingNeverOverwritten=True)
        (BASE/"derived-classification-recovery.json").write_text(json.dumps(report,indent=2))
        print("R5_CLASSIFICATION_RECOVERY",json.dumps(
            {"requested":len(missing),"statusCounts":counters,"writesOnlyMissing":True}))
        if args.apply:
            fresh=universe(db)
            newly_complete=sum(x["sector"] is not None and x["industry"] is not None for x in fresh)
            print("R5_AFTER_CANONICAL_CLASSIFICATION",json.dumps(
                {"cohort":len(fresh),"completeCanonicalClasses":newly_complete,
                 "remainingMissing":len(fresh)-newly_complete}))


if __name__=="__main__":
    main()
