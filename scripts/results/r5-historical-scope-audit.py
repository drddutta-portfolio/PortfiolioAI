#!/usr/bin/env python3
"""R5 historical gap alternate-scope admission *diagnostic*, Development only.

Reads the live R5 selected-issuer failure ledger and counts already stored
unselected original-filing trios that could repair scope continuity after
R4's independent R2/hash/canonical-admission verification.
NO writes, no provider requests, no selected-fact promotion.
"""
import json
import os
from collections import Counter, defaultdict
from pathlib import Path

import psycopg

REF="lrgpjimipfkyoqbpsqzz"
LEDGER=Path("tmp/results-r5-g/historical-grade-census.json")
OUT=Path("tmp/results-r5-g/alternate-scope-reconciliation.json")
BANKS=set("AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK RBLBANK SBIN UNIONBANK".split())


def required(symbol):
    top="NET_INTEREST_INCOME_QUARTER" if symbol in BANKS else (
        "NET_PREMIUM_EARNED_QUARTER" if symbol=="STARHEALTH" else "OPERATING_REVENUE_QUARTER")
    return frozenset((top,"NET_PROFIT_QUARTER","EPS_DILUTED"))


def originals_by_scope(raw_rows):
    """Same original-source identifier and same-scope quarterly core trio."""
    grouped=defaultdict(set)
    for symbol,quarter,scope,record_id,metric in raw_rows:
        if scope not in ("STANDALONE","CONSOLIDATED") or not record_id: continue
        grouped[(symbol,str(quarter),scope,str(record_id))].add(metric)
    out=defaultdict(set)
    for (symbol,quarter,scope,_),codes in grouped.items():
        if required(symbol).issubset(codes):out[(symbol,quarter)].add(scope)
    return out


def summarize(ledger,originals):
    rows=[r for r in ledger["historicalExceptions"]["rows"] if r["action"]!="MODEL_NOT_SUPPORTED"]
    items=[];kinds=Counter();matches=Counter()
    for r in rows:
        checks=r["historicalChecks"]
        cur,prior=checks[0],checks[1]
        cur_scopes=originals.get((r["symbol"],str(cur["quarter"])),set())
        prior_scopes=originals.get((r["symbol"],str(prior["quarter"])),set())
        common=sorted(cur_scopes & prior_scopes)
        missing_source=not prior["topSelected"] or not prior["profitSelected"]
        scope_issue=("Accounting scope, reporting units or currency differ" in cur["topQoQStatus"] or
                     "Accounting scope, reporting units or currency differ" in cur["profitQoQStatus"])
        kind="IMMEDIATE_BASELINE_MISSING" if missing_source else "ADJACENT_SCOPE_MISMATCH" if scope_issue else "SECOND_COMPARISON_OR_OTHER"
        kinds[kind]+=1
        if common: matches[kind]+=1
        items.append(dict(symbol=r["symbol"],period_end=r["quarter"],baseline_end=prior["quarter"],
          reason=r["reason"],diagnostic=kind,
          original_complete_trio_in_both_quarters=bool(common),
          matching_original_scopes=common,requires_verified_source_admission=True))
    if len(items)!=ledger["historicalExceptions"]["supportedModelUnratedCount"]:
        raise RuntimeError("R5_SCOPE_AUDIT_COHORT_DRIFT")
    return dict(contract="R5_HISTORICAL_READ_ONLY_SCOPE_DIAGNOSTIC_V1",
       status="CANDIDATES_ONLY_NOT_CANONICAL_SOURCE_SELECTION",
       count=len(items),reasonCounts=dict(kinds),scopeCandidatesByReason=dict(matches),
       rows=items,sourceChecks="AVAILABLE issuer observations only; R2/hash/conflict review still required",
       environment="Development",noProviderCalls=True,noWrites=True)


def main():
    db_url=os.environ["SUPABASE_DB_URL"]
    if REF not in db_url:raise RuntimeError("REQUIRE_DEVELOPMENT_DB_ONLY")
    ledger=json.loads(LEDGER.read_text())
    symbols=sorted({r["symbol"] for r in ledger["historicalExceptions"]["rows"]
                    if r["action"]!="MODEL_NOT_SUPPORTED"})
    dates=sorted({s["quarter"] for r in ledger["historicalExceptions"]["rows"]
                  if r["action"]!="MODEL_NOT_SUPPORTED"
                  for s in r["historicalChecks"][:2]})
    with psycopg.connect(db_url,options="-c default_transaction_read_only=on") as conn:
        with conn.cursor() as cur:
            cur.execute("""
              SELECT s.symbol,o.period_end,o.consolidation_scope,
                     o.source_record_id,o.metric_code
              FROM public.securities s
              JOIN public.fundamental_observations o ON o.security_id=s.id
              WHERE s.symbol=ANY(%s::text[]) AND o.period_end=ANY(%s::date[])
                AND o.period_type='QUARTER'
                AND o.source_code='COMPANY_EXCHANGE_FILING'
                AND o.evidence_status='AVAILABLE' AND o.numeric_value IS NOT NULL
                AND o.currency='INR' AND o.source_record_id IS NOT NULL
                AND o.consolidation_scope IN ('CONSOLIDATED','STANDALONE')
                AND o.unit=CASE WHEN o.metric_code='EPS_DILUTED'
                           THEN 'INR_PER_SHARE' ELSE 'INR_CRORE' END
                AND o.period_start IS NOT NULL
                AND o.period_end-o.period_start BETWEEN 75 AND 100
            """,(symbols,dates))
            originals=originals_by_scope(cur.fetchall())
    report=summarize(ledger,originals)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,indent=2,sort_keys=True))
    print("R5_HISTORICAL_SCOPE_DIAGNOSTIC",json.dumps({
        "count":report["count"],"reasonCounts":report["reasonCounts"],
        "scopeCandidatesByReason":report["scopeCandidatesByReason"],
        "providerCalls":0,"databaseWrites":0},sort_keys=True))


if __name__=="__main__":main()
